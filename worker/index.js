/**
 * PropChamps Rewards — Cloudflare Worker (zero-dependency ES module).
 *
 * Runs alongside the static site. With assets-first routing, this Worker only
 * sees non-asset requests (/api/*, /auth/*) — the marketing site is served
 * directly and is unaffected even if this code throws.
 *
 * Bindings (wrangler.jsonc): DB (D1), RECEIPTS (R2), SESSIONS (KV), ASSETS.
 * Vars: DISCORD_CLIENT_ID, DISCORD_REDIRECT_URI, ADMIN_DISCORD_IDS.
 * Secrets: DISCORD_CLIENT_SECRET, ANTHROPIC_API_KEY (Phase 2).
 */

const POINTS_PER_SUBMISSION = 250;
const MAX_PAYOUT_POINTS = 500000; // sanity cap on a single payout award ($500k)
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_PENDING_PER_USER = 8;
// Receipt triage model. Switch to 'claude-haiku-4-5' for ~5x cheaper high volume.
const AI_MODEL = 'claude-opus-5';

const TIERS = [
  { name: "Champ's Circle", min: 25000 },
  { name: 'Gold', min: 10000 },
  { name: 'Silver', min: 1000 },
  { name: 'Bronze', min: 0 },
];
function tierFor(pts) {
  for (const t of TIERS) if (pts >= t.min) return t.name;
  return 'Bronze';
}
function tierMultiplier(tier) {
  return tier === "Champ's Circle" ? 5 : tier === 'Gold' ? 3 : tier === 'Silver' ? 2 : 1;
}

// ---------- seasons (quarterly leaderboard reset) ----------
// The LEADERBOARD runs in quarterly "seasons" anchored to Sept 1, 2026, tracked
// in users.season_points. At each quarter boundary (1st of Mar/Jun/Sep/Dec)
// season_points reset to 0 and the outgoing season's top 10 carry a 1,000-pt
// head start. lifetime_points (tiers) and spendable_points (the bank) are NEVER
// reset — only the competitive standing rolls over.
const SEASON_EPOCH_KEY = 202609; // Sept 2026 — season 1; first reset is Dec 1, 2026
const SEASON_CARRY_TOP = 10;
const SEASON_CARRY_POINTS = 1000;
const SEASON_NAMES = { 3: 'Spring', 6: 'Summer', 9: 'Fall', 12: 'Winter' };

function seasonBoundaryFor(date) {
  let y = date.getUTCFullYear();
  const mo = date.getUTCMonth() + 1;
  let m;
  if (mo >= 12) m = 12;
  else if (mo >= 9) m = 9;
  else if (mo >= 6) m = 6;
  else if (mo >= 3) m = 3;
  else { m = 12; y -= 1; }
  return { y, m };
}
function seasonKeyOf(b) { return b.y * 100 + b.m; }
function seasonKeyToBoundary(key) { return { y: Math.floor(key / 100), m: key % 100 }; }
function seasonNext(b) { let y = b.y, m = b.m + 3; if (m > 12) { m -= 12; y += 1; } return { y, m }; }
function seasonIso(b) { return new Date(Date.UTC(b.y, b.m - 1, 1, 0, 0, 0)).toISOString(); }
function seasonLabel(b) { return (SEASON_NAMES[b.m] || 'Season') + ' ' + b.y; }
function activeSeasonBoundary(storedKey) {
  return seasonKeyToBoundary(Math.max(storedKey || SEASON_EPOCH_KEY, SEASON_EPOCH_KEY));
}
async function readSeasonKey(env) {
  const row = await env.DB.prepare("SELECT v FROM app_state WHERE k='season_key'").first();
  const k = row && row.v != null ? parseInt(row.v, 10) : NaN;
  return Number.isFinite(k) ? k : SEASON_EPOCH_KEY;
}
// Public season descriptor for the countdown clock (safe for logged-out too).
async function seasonState(env) {
  const cur = activeSeasonBoundary(await readSeasonKey(env));
  const next = seasonNext(cur);
  return {
    key: seasonKeyOf(cur),
    label: seasonLabel(cur),
    start: seasonIso(cur),
    nextReset: seasonIso(next),
    carryTop: SEASON_CARRY_TOP,
    carryPoints: SEASON_CARRY_POINTS,
  };
}
// If the calendar has advanced past the stored season, roll over exactly once.
// A compare-and-swap on app_state.season_key elects a single winner, which then
// performs the reset inline (so this request already sees the fresh standings).
async function maybeRollover(env) {
  const curKey = seasonKeyOf(seasonBoundaryFor(new Date()));
  if (curKey <= SEASON_EPOCH_KEY) return; // still in / before season 1
  const storedKey = await readSeasonKey(env);
  if (curKey <= storedKey) return; // already rolled
  await env.DB.prepare("INSERT OR IGNORE INTO app_state (k,v) VALUES ('season_key', ?)").bind(String(storedKey)).run();
  const claim = await env.DB
    .prepare("UPDATE app_state SET v=? WHERE k='season_key' AND CAST(v AS INTEGER) < ?")
    .bind(String(curKey), curKey)
    .run();
  if (!claim.meta || claim.meta.changes !== 1) return; // lost the race — someone else is rolling
  try {
    const nowIso = new Date().toISOString();
    const top = await env.DB
      .prepare('SELECT id FROM users WHERE banned=0 AND season_points>0 ORDER BY season_points DESC LIMIT ?')
      .bind(SEASON_CARRY_TOP)
      .all();
    const winners = (top.results || []).map((r) => r.id);
    await env.DB.prepare('UPDATE users SET season_points=0 WHERE season_points<>0').run();
    const stmts = [];
    for (const id of winners) {
      stmts.push(env.DB.prepare('UPDATE users SET season_points=? WHERE id=?').bind(SEASON_CARRY_POINTS, id));
      stmts.push(
        env.DB
          .prepare('INSERT INTO points_ledger (id,user_id,delta,reason,submission_id,created_at) VALUES (?,?,?,?,?,?)')
          .bind(crypto.randomUUID(), id, SEASON_CARRY_POINTS, 'season_carryover', null, nowIso)
      );
    }
    stmts.push(
      env.DB
        .prepare('INSERT INTO admin_actions (id,admin,action,target,note,created_at) VALUES (?,?,?,?,?,?)')
        .bind(crypto.randomUUID(), 'system', 'season_rollover', String(curKey), 'carried top ' + winners.length, nowIso)
    );
    if (stmts.length) await env.DB.batch(stmts);
  } catch (e) {
    console.error('season rollover failed', String((e && e.message) || e));
  }
}

// Server-authoritative reward catalog (id -> cost + raffle flag + display label).
// The browser NEVER sets a reward's price: apiRedeem looks the cost up here by id,
// so nobody can redeem an expensive reward cheaply by tampering with the request.
// Keep in sync with MARKET/MORE in rewards/index.html.
// Account rewards carry `account:true` (requires the 3–10 business-day
// acknowledgment) and `stock` (total ever available; remaining = stock − claimed,
// tracked in the reward_stock table). Stock totals Champ gave: Lucid 25K/50K=30,
// MyFunded 25K=20, Apex 50K=10. The rest default to 20 (Lucid 100K=10) until Champ
// sets real numbers — change the `stock` value here to adjust a limit.
const REWARDS = {
  'lucid-25K-ev': { cost: 8500, label: 'Lucid Trading — 25K Evaluation', account: true, stock: 30 },
  'lucid-50K-ev': { cost: 14000, label: 'Lucid Trading — 50K Evaluation', account: true, stock: 30 },
  'fundednext-25K-ev': { cost: 9000, label: 'FundedNext — 25K Evaluation', account: true, stock: 20 },
  'fundednext-50K-ev': { cost: 15000, label: 'FundedNext — 50K Evaluation', account: true, stock: 20 },
  'myfunded-25K-ev': { cost: 9000, label: 'My Funded Futures — 25K Evaluation', account: true, stock: 20 },
  'myfunded-50K-ev': { cost: 14000, label: 'My Funded Futures — 50K Evaluation', account: true, stock: 20 },
  'tradify-50K-ev': { cost: 14000, label: 'Tradeify — 50K Evaluation', account: true, stock: 20 },
  'apex-50K-ev': { cost: 10000, label: 'Apex Trader Funding — 50K Evaluation', account: true, stock: 10 },
  'lucid-100K-ev': { cost: 30000, label: 'Lucid Trading — 100K Evaluation', account: true, stock: 10 },
  'raffle-500': { cost: 250, raffle: true, label: 'Monthly $500 raffle entry' },
  'cashback-150': { cost: 10000, label: '$150 cash back' },
};
// Account reward ids in display order (used by the public stock endpoint).
const ACCOUNT_REWARD_IDS = Object.keys(REWARDS).filter((k) => REWARDS[k].account);

// ---------- small helpers ----------
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}
function redirect(location, headers = {}) {
  return new Response(null, { status: 302, headers: { Location: location, ...headers } });
}
function parseCookies(req) {
  const out = {};
  const h = req.headers.get('Cookie') || '';
  h.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function sessionCookie(token, maxAge) {
  return `pc_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}
async function sha256hex(buf) {
  const h = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(bin);
}

// Claude vision receipt triage. Best-effort: returns a verdict object, or null
// on any failure (missing key, too large, API error, unparseable) so a
// submission is never blocked by the AI.
async function verifyReceipt(env, bytes, mediaType, firmClaimed, amountClaimed) {
  if (!env.ANTHROPIC_API_KEY) return { error: 'no_key' };
  if (bytes.byteLength > 5 * 1024 * 1024) return { error: 'image_too_large' }; // over the vision API per-image limit
  const prompt =
    'You are verifying a proof-of-purchase for a futures prop-firm rewards program. The user claims they funded an account at "' +
    firmClaimed + '"' + (amountClaimed ? ' for "' + amountClaimed + '"' : '') + ' using discount code CHAMP.\n\n' +
    'Examine the image and respond with ONLY a JSON object (no prose, no markdown fences) in exactly this shape:\n' +
    '{"isReceipt":boolean,"firmDetected":string|null,"amountDetected":string|null,"champCodeVisible":boolean,"confidence":number,"recommendation":"approve"|"review"|"reject","redFlags":[string],"summary":string}\n\n' +
    'Rules: confidence is 0.0-1.0 that this is a genuine purchase made with code CHAMP. ' +
    'If code CHAMP is not clearly visible in the image, set champCodeVisible=false and recommendation no higher than "review". ' +
    'If the image is clearly not an order receipt or confirmation, set isReceipt=false and recommendation="reject". ' +
    'Flag red flags such as edited or mismatched numbers, a screenshot of a screenshot, or a firm that differs from the claim. Keep summary to one short sentence.';
  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: toBase64(bytes) } },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(22000),
    });
  } catch (e) {
    return { error: 'fetch_failed', detail: String((e && e.message) || e).slice(0, 180) };
  }
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    return { error: 'api_' + res.status, detail: t.slice(0, 220) };
  }
  const data = await res.json();
  const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { error: 'no_json', detail: text.slice(0, 200) };
  try {
    return JSON.parse(m[0]);
  } catch (e) {
    return { error: 'parse_fail', detail: text.slice(0, 200) };
  }
}
function isAdmin(user, env) {
  if (!user) return false;
  return (env.ADMIN_DISCORD_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(user.discord_id);
}
function isHost(user, env) {
  if (!user) return false;
  return (env.HOST_DISCORD_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(user.discord_id);
}
async function getGiveawayState(env) {
  const row = await env.DB.prepare("SELECT v FROM app_state WHERE k='giveaway'").first();
  if (!row || !row.v) return { open: false, title: 'Win a Funded Account' };
  try {
    const s = JSON.parse(row.v);
    return { open: !!s.open, title: s.title || 'Win a Funded Account' };
  } catch (e) {
    return { open: false, title: 'Win a Funded Account' };
  }
}
async function setGiveawayState(env, st) {
  await env.DB.prepare("INSERT INTO app_state (k,v) VALUES ('giveaway',?) ON CONFLICT(k) DO UPDATE SET v=excluded.v")
    .bind(JSON.stringify(st))
    .run();
}
async function ensureRaffleCycle(env) {
  const c = await env.DB.prepare("SELECT * FROM raffle_cycles WHERE status='active' ORDER BY created_at DESC LIMIT 1").first();
  if (c) return c;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT INTO raffle_cycles (id,name,draw_date,status,created_at) VALUES (?,?,?,'active',?)")
    .bind(id, 'Monthly $500 Raffle', null, now)
    .run();
  return { id, name: 'Monthly $500 Raffle', draw_date: null, status: 'active', created_at: now };
}
async function currentUser(req, env) {
  const token = parseCookies(req)['pc_session'];
  if (!token) return null;
  const userId = await env.SESSIONS.get('session:' + token);
  if (!userId) return null;
  return env.DB.prepare('SELECT * FROM users WHERE id=?').bind(userId).first();
}

// ---------- auth ----------
async function authStart(req, env) {
  const state = crypto.randomUUID();
  await env.SESSIONS.put('oauth_state:' + state, '1', { expirationTtl: 600 });
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email',
    prompt: 'consent',
    state,
  });
  return redirect('https://discord.com/oauth2/authorize?' + params.toString());
}

async function authCallback(req, env) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return redirect('/rewards?e=auth');
  const okState = await env.SESSIONS.get('oauth_state:' + state);
  if (!okState) return redirect('/rewards?e=state');
  await env.SESSIONS.delete('oauth_state:' + state);

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.DISCORD_REDIRECT_URI,
    }),
  });
  if (!tokenRes.ok) return redirect('/rewards?e=token');
  const tok = await tokenRes.json();

  const meRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: 'Bearer ' + tok.access_token },
  });
  if (!meRes.ok) return redirect('/rewards?e=me');
  const d = await meRes.json();

  const now = new Date().toISOString();
  const existing = await env.DB.prepare('SELECT id FROM users WHERE discord_id=?').bind(d.id).first();
  let userId;
  const email = d.email && d.verified ? String(d.email).toLowerCase() : null;
  if (existing) {
    userId = existing.id;
    await env.DB.prepare('UPDATE users SET username=?, avatar=?, email=COALESCE(?, email) WHERE id=?')
      .bind(d.username, d.avatar || '', email, userId)
      .run();
  } else {
    userId = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO users (id,discord_id,username,avatar,email,lifetime_points,spendable_points,created_at) VALUES (?,?,?,?,?,0,0,?)'
    )
      .bind(userId, d.id, d.username, d.avatar || '', email, now)
      .run();
  }

  const sess = crypto.randomUUID();
  await env.SESSIONS.put('session:' + sess, userId, { expirationTtl: SESSION_TTL });
  return redirect('/rewards', { 'Set-Cookie': sessionCookie(sess, SESSION_TTL) });
}

async function logout(req, env) {
  const token = parseCookies(req)['pc_session'];
  if (token) await env.SESSIONS.delete('session:' + token);
  return redirect('/rewards', { 'Set-Cookie': sessionCookie('', 0) });
}

// ---------- user-facing API ----------
async function apiMe(req, env) {
  const u = await currentUser(req, env);
  if (!u) {
    // Still expose the season clock so the logged-out page can show the countdown.
    return json({ loggedIn: false, season: await seasonState(env) });
  }
  await maybeRollover(env);
  const fresh = (await env.DB.prepare('SELECT lifetime_points, spendable_points, season_points FROM users WHERE id=?').bind(u.id).first()) || u;
  const seasonPts = fresh.season_points || 0;
  const rankRow = await env.DB.prepare('SELECT COUNT(*) AS c FROM users WHERE banned=0 AND season_points > ?')
    .bind(seasonPts)
    .first();
  const acctRow = await env.DB.prepare("SELECT COUNT(*) AS c FROM submissions WHERE user_id=? AND status='approved'")
    .bind(u.id)
    .first();
  const subs = await env.DB.prepare(
    'SELECT id, firm_slug, claimed_amount, status, points_awarded, kind, created_at FROM submissions WHERE user_id=? ORDER BY created_at DESC LIMIT 12'
  )
    .bind(u.id)
    .all();
  return json({
    loggedIn: true,
    user: {
      username: u.username,
      avatar: u.avatar,
      discordId: u.discord_id,
      lifetimePoints: fresh.lifetime_points,
      spendablePoints: fresh.spendable_points,
      seasonPoints: seasonPts,
      tier: tierFor(fresh.lifetime_points),
      rank: (rankRow?.c || 0) + 1,
      accounts: acctRow?.c || 0,
      isAdmin: isAdmin(u, env),
      isHost: isHost(u, env),
    },
    season: await seasonState(env),
    submissions: subs.results || [],
  });
}

async function apiLeaderboard(req, env) {
  const u = await currentUser(req, env);
  await maybeRollover(env);
  const rows = await env.DB.prepare(
    'SELECT username, avatar, discord_id, lifetime_points, season_points FROM users WHERE banned=0 ORDER BY season_points DESC, lifetime_points DESC LIMIT 25'
  ).all();
  const list = (rows.results || []).map((r, i) => ({
    rank: i + 1,
    username: r.username,
    points: r.season_points || 0,
    tier: tierFor(r.lifetime_points),
    me: !!(u && r.discord_id === u.discord_id),
  }));
  return json({ leaderboard: list, season: await seasonState(env) });
}

async function apiSubmit(req, env) {
  const u = await currentUser(req, env);
  if (!u) return json({ error: 'not_logged_in' }, 401);
  if (u.banned) return json({ error: 'banned' }, 403);

  const form = await req.formData();
  const firm = String(form.get('firm') || '').slice(0, 80);
  const amount = String(form.get('amount') || '').slice(0, 80);
  const kind = form.get('kind') === 'payout' ? 'payout' : 'purchase';
  const file = form.get('image');
  if (!firm || !file || typeof file === 'string') return json({ error: 'missing_fields' }, 400);

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_IMAGE_BYTES) return json({ error: 'file_too_large' }, 400);

  const hash = await sha256hex(bytes);
  const dupe = await env.DB.prepare('SELECT id FROM submissions WHERE image_hash=?').bind(hash).first();
  if (dupe) return json({ error: 'duplicate', message: 'This receipt has already been submitted.' }, 409);

  const pend = await env.DB.prepare("SELECT COUNT(*) AS c FROM submissions WHERE user_id=? AND status='pending'")
    .bind(u.id)
    .first();
  if ((pend?.c || 0) >= MAX_PENDING_PER_USER) return json({ error: 'too_many_pending' }, 429);

  const subId = crypto.randomUUID();
  const type = file.type || 'image/jpeg';
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  const key = `receipts/${u.id}/${subId}.${ext}`;
  await env.RECEIPTS.put(key, bytes, { httpMetadata: { contentType: type } });

  const now = new Date().toISOString();
  await env.DB.prepare(
    'INSERT INTO submissions (id,user_id,firm_slug,claimed_amount,image_key,image_hash,kind,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)'
  )
    .bind(subId, u.id, firm, amount, key, hash, kind, 'pending', now)
    .run();

  // AI triage — best-effort. Scores/annotates the submission for the admin
  // queue; never blocks a successful submission. Human still approves.
  let ai = null;
  const mediaType = type.includes('png')
    ? 'image/png'
    : type.includes('webp')
    ? 'image/webp'
    : type.includes('gif')
    ? 'image/gif'
    : 'image/jpeg';
  if (kind === 'purchase') try {
    const v = await verifyReceipt(env, bytes, mediaType, firm, amount);
    if (v && !v.error) {
      await env.DB.prepare('UPDATE submissions SET ai_score=?, ai_notes=? WHERE id=?')
        .bind(typeof v.confidence === 'number' ? v.confidence : null, JSON.stringify(v).slice(0, 1500), subId)
        .run();
      ai = {
        recommendation: v.recommendation || 'review',
        confidence: v.confidence != null ? v.confidence : null,
        champCodeVisible: !!v.champCodeVisible,
      };
    } else if (v && v.error) {
      await env.DB.prepare('UPDATE submissions SET ai_notes=? WHERE id=?')
        .bind(JSON.stringify(v).slice(0, 1500), subId)
        .run();
    }
  } catch (e) {
    try {
      await env.DB.prepare('UPDATE submissions SET ai_notes=? WHERE id=?')
        .bind(JSON.stringify({ error: 'exception', detail: String((e && e.message) || e).slice(0, 180) }), subId)
        .run();
    } catch (e2) {
      /* leave pending for manual review */
    }
  }

  return json({ ok: true, submissionId: subId, ai });
}

async function apiRedeem(req, env, ctx) {
  const u = await currentUser(req, env);
  if (!u) return json({ error: 'not_logged_in' }, 401);
  if (u.banned) return json({ error: 'banned' }, 403);
  const body = await req.json().catch(() => ({}));
  // Cost + name come from the SERVER catalog by id — never from the request.
  const rid = String(body.id || '');
  const reward = Object.prototype.hasOwnProperty.call(REWARDS, rid) ? REWARDS[rid] : null;
  if (!reward || typeof reward.cost !== 'number') return json({ error: 'unknown_reward' }, 400);
  const cost = reward.cost;
  const name = reward.label;
  const isRaffle = !!reward.raffle;
  // Free-account claims require the 3–10 business-day acknowledgment (the checkbox).
  if (reward.account && body.ack !== true) return json({ error: 'ack_required' }, 400);

  // Atomic check-and-deduct: the row updates ONLY if the balance is truly >= cost.
  // This blocks both overspending and the race where two requests each pass a
  // separate balance check and then both deduct (which could go negative).
  const ded = await env.DB
    .prepare('UPDATE users SET spendable_points = spendable_points - ? WHERE id=? AND spendable_points >= ?')
    .bind(cost, u.id, cost)
    .run();
  if (!ded.meta || ded.meta.changes !== 1) return json({ error: 'insufficient_points' }, 400);

  // Inventory: atomically claim one unit for account rewards. If sold out, refund
  // the points we just deducted and stop (the UPDATE only lands while claimed < stock).
  let stockClaimed = false;
  if (reward.account && typeof reward.stock === 'number') {
    let claimedOk = false;
    if (reward.stock > 0) {
      await env.DB.prepare('INSERT OR IGNORE INTO reward_stock (reward_id, claimed) VALUES (?, 0)').bind(rid).run();
      const claim = await env.DB
        .prepare('UPDATE reward_stock SET claimed = claimed + 1 WHERE reward_id = ? AND claimed < ?')
        .bind(rid, reward.stock)
        .run();
      claimedOk = !!(claim.meta && claim.meta.changes === 1);
    }
    if (!claimedOk) {
      await env.DB.prepare('UPDATE users SET spendable_points = spendable_points + ? WHERE id=?').bind(cost, u.id).run().catch(() => {});
      return json({ error: 'sold_out' }, 409);
    }
    stockClaimed = true;
  }

  const now = new Date().toISOString();
  try {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO redemptions (id,user_id,reward_name,cost_points,status,created_at) VALUES (?,?,?,?,?,?)')
        .bind(crypto.randomUUID(), u.id, name, cost, isRaffle ? 'fulfilled' : 'requested', now),
      env.DB.prepare('INSERT INTO points_ledger (id,user_id,delta,reason,created_at) VALUES (?,?,?,?,?)')
        .bind(crypto.randomUUID(), u.id, -cost, 'redeem:' + String(body.id), now),
    ]);
    if (isRaffle) {
      const cycle = await ensureRaffleCycle(env);
      const mult = tierMultiplier(tierFor(u.lifetime_points));
      await env.DB.prepare(
        'INSERT INTO raffle_entries (id,cycle_id,user_id,username,entries,created_at) VALUES (?,?,?,?,?,?) ' +
          'ON CONFLICT(cycle_id,user_id) DO UPDATE SET entries = entries + ?'
      )
        .bind(crypto.randomUUID(), cycle.id, u.id, u.username, mult, now, mult)
        .run();
      return json({ ok: true, raffle: true, entriesAdded: mult });
    }
    // Account / cash-back claim → confirmation email (best-effort) + it lands
    // in the host fulfillment queue for the team to deliver within 24-48h.
    if (u.email && ctx && ctx.waitUntil)
      ctx.waitUntil(sendClaimReceived(env, u.email, u.username, name, new URL(req.url).origin));
    return json({ ok: true });
  } catch (e) {
    // Never take points (or a stock unit) without recording the redemption.
    if (stockClaimed)
      await env.DB.prepare('UPDATE reward_stock SET claimed = claimed - 1 WHERE reward_id = ? AND claimed > 0').bind(rid).run().catch(() => {});
    await env.DB.prepare('UPDATE users SET spendable_points = spendable_points + ? WHERE id=?').bind(cost, u.id).run().catch(() => {});
    return json({ error: 'redeem_failed' }, 500);
  }
}

// Public inventory for the marketplace: {rid: {total, remaining}} for every account.
async function apiRewardStock(req, env) {
  const rows = await env.DB.prepare('SELECT reward_id, claimed FROM reward_stock').all();
  const claimedMap = {};
  for (const r of rows.results || []) claimedMap[r.reward_id] = r.claimed;
  const out = {};
  for (const rid of ACCOUNT_REWARD_IDS) {
    const total = REWARDS[rid].stock;
    const claimed = claimedMap[rid] || 0;
    out[rid] = { total, remaining: Math.max(0, total - claimed) };
  }
  return json({ stock: out });
}

// ---------- admin ----------
async function adminQueue(req, env) {
  const u = await currentUser(req, env);
  if (!isAdmin(u, env)) return json({ error: 'forbidden' }, 403);
  const rows = await env.DB.prepare(
    "SELECT s.id, s.firm_slug, s.claimed_amount, s.kind, s.status, s.ai_score, s.ai_notes, s.created_at, u.username, u.discord_id " +
      "FROM submissions s JOIN users u ON u.id=s.user_id WHERE s.status='pending' ORDER BY s.created_at ASC LIMIT 100"
  ).all();
  return json({ queue: rows.results || [] });
}

async function adminReview(req, env, ctx) {
  const u = await currentUser(req, env);
  if (!isAdmin(u, env)) return json({ error: 'forbidden' }, 403);
  const body = await req.json().catch(() => ({}));
  const subId = String(body.submissionId || '');
  const action = body.action;
  const sub = await env.DB.prepare('SELECT * FROM submissions WHERE id=?').bind(subId).first();
  if (!sub || sub.status !== 'pending') return json({ error: 'not_pending' }, 400);
  const now = new Date().toISOString();

  if (action === 'approve') {
    // Purchases award a fixed +250. Payouts award 1 point per $1 of the payout,
    // entered by the admin at review time (server-validated: positive integer,
    // capped). The award is server-authoritative — the browser only proposes it.
    const isPayout = sub.kind === 'payout';
    let award = POINTS_PER_SUBMISSION;
    if (isPayout) {
      const p = Math.floor(Number(body.points));
      if (!Number.isFinite(p) || p <= 0) return json({ error: 'bad_points' }, 400);
      award = Math.min(p, MAX_PAYOUT_POINTS);
    }
    // Atomic claim: only the first approval flips pending->approved, so a
    // double-click (two concurrent requests) can't award points twice.
    const claim = await env.DB
      .prepare("UPDATE submissions SET status='approved', points_awarded=?, reviewed_by=?, reviewed_at=? WHERE id=? AND status='pending'")
      .bind(award, u.discord_id, now, subId)
      .run();
    if (!claim.meta || claim.meta.changes !== 1) return json({ error: 'not_pending' }, 400);
    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO points_ledger (id,user_id,delta,reason,submission_id,created_at) VALUES (?,?,?,?,?,?)'
      ).bind(crypto.randomUUID(), sub.user_id, award, isPayout ? 'payout_approved' : 'submission_approved', subId, now),
      env.DB.prepare('UPDATE users SET lifetime_points=lifetime_points+?, season_points=season_points+?, spendable_points=spendable_points+? WHERE id=?')
        .bind(award, award, award, sub.user_id),
      env.DB.prepare('INSERT INTO admin_actions (id,admin,action,target,created_at) VALUES (?,?,?,?,?)')
        .bind(crypto.randomUUID(), u.discord_id, isPayout ? 'approve_payout' : 'approve', subId, now),
    ]);
    const su = await env.DB.prepare('SELECT email, username, lifetime_points FROM users WHERE id=?').bind(sub.user_id).first();
    if (su && su.email && ctx && ctx.waitUntil)
      ctx.waitUntil(sendApproved(env, su.email, su.username, sub.firm_slug, award, su.lifetime_points, new URL(req.url).origin, isPayout));
  } else if (action === 'reject') {
    await env.DB.batch([
      env.DB.prepare("UPDATE submissions SET status='rejected', reviewed_by=?, reviewed_at=? WHERE id=?")
        .bind(u.discord_id, now, subId),
      env.DB.prepare('INSERT INTO admin_actions (id,admin,action,target,created_at) VALUES (?,?,?,?,?)')
        .bind(crypto.randomUUID(), u.discord_id, 'reject', subId, now),
    ]);
    const su = await env.DB.prepare('SELECT email, username FROM users WHERE id=?').bind(sub.user_id).first();
    if (su && su.email && ctx && ctx.waitUntil)
      ctx.waitUntil(sendRejected(env, su.email, su.username, sub.firm_slug, new URL(req.url).origin, env.DISCORD_INVITE_URL));
  } else {
    return json({ error: 'bad_action' }, 400);
  }
  return json({ ok: true });
}

async function adminImage(req, env, subId) {
  const u = await currentUser(req, env);
  if (!isAdmin(u, env)) return new Response('forbidden', { status: 403 });
  const sub = await env.DB.prepare('SELECT image_key FROM submissions WHERE id=?').bind(subId).first();
  if (!sub) return new Response('not found', { status: 404 });
  const obj = await env.RECEIPTS.get(sub.image_key);
  if (!obj) return new Response('not found', { status: 404 });
  return new Response(obj.body, {
    headers: {
      'content-type': obj.httpMetadata?.contentType || 'image/jpeg',
      'cache-control': 'private, no-store',
    },
  });
}

// ---------- live giveaway (public) ----------
async function giveawayStatus(req, env) {
  const st = await getGiveawayState(env);
  const c = await env.DB.prepare('SELECT COUNT(*) AS c FROM giveaway_entries').first();
  return json({ open: st.open, title: st.title, count: c?.c || 0 });
}
async function giveawayEnter(req, env, ctx) {
  const st = await getGiveawayState(env);
  if (!st.open) return json({ error: 'closed' }, 403);
  // Require Discord login so it's one entry per person + we know who wins.
  const u = await currentUser(req, env);
  if (!u) return json({ error: 'not_logged_in' }, 401);
  if (u.banned) return json({ error: 'banned' }, 403);
  const now = new Date().toISOString();
  const email = u.email ? String(u.email).toLowerCase().slice(0, 120) : null;
  // One entry per Discord user (UNIQUE user_id) — INSERT OR IGNORE means a
  // second attempt just reports already-entered instead of adding an entry.
  const ins = await env.DB
    .prepare('INSERT OR IGNORE INTO giveaway_entries (id,user_id,username,email,created_at) VALUES (?,?,?,?,?)')
    .bind(crypto.randomUUID(), u.id, u.username, email, now)
    .run();
  const already = !ins.meta || ins.meta.changes !== 1;
  if (email) {
    await env.DB.prepare('INSERT OR IGNORE INTO email_list (email,name,source,first_seen) VALUES (?,?,?,?)')
      .bind(email, u.username, 'giveaway', now).run();
    if (!already && ctx && ctx.waitUntil) ctx.waitUntil(sendWelcome(env, email, u.username, new URL(req.url).origin));
  }
  return json({ ok: true, already });
}

// ---------- host portal ----------
async function hostGiveaway(req, env) {
  const u = await currentUser(req, env);
  if (!isHost(u, env)) return json({ error: 'forbidden' }, 403);
  const st = await getGiveawayState(env);
  const rows = await env.DB.prepare('SELECT username, email, created_at FROM giveaway_entries ORDER BY created_at ASC LIMIT 1000').all();
  const total = await env.DB.prepare('SELECT COUNT(*) AS c FROM email_list').first();
  const list = rows.results || [];
  return json({ open: st.open, title: st.title, entries: list, count: list.length, totalEmails: total?.c || 0 });
}
async function hostGiveawayAction(req, env) {
  const u = await currentUser(req, env);
  if (!isHost(u, env)) return json({ error: 'forbidden' }, 403);
  const body = await req.json().catch(() => ({}));
  const st = await getGiveawayState(env);
  if (body.action === 'open') {
    st.open = true;
    if (body.title) st.title = String(body.title).slice(0, 80);
    await setGiveawayState(env, st);
  } else if (body.action === 'close') {
    st.open = false;
    await setGiveawayState(env, st);
  } else if (body.action === 'reset') {
    st.open = false;
    await setGiveawayState(env, st);
    await env.DB.prepare('DELETE FROM giveaway_entries').run();
  } else {
    return json({ error: 'bad_action' }, 400);
  }
  return json({ ok: true });
}
async function hostFulfillment(req, env) {
  const u = await currentUser(req, env);
  if (!isHost(u, env)) return json({ error: 'forbidden' }, 403);
  const rows = await env.DB.prepare(
    "SELECT r.id, r.reward_name, r.cost_points, r.status, r.created_at, u.username, u.discord_id " +
      "FROM redemptions r JOIN users u ON u.id=r.user_id WHERE r.status='requested' ORDER BY r.created_at ASC LIMIT 100"
  ).all();
  return json({ pending: rows.results || [] });
}
async function hostFulfillMark(req, env) {
  const u = await currentUser(req, env);
  if (!isHost(u, env)) return json({ error: 'forbidden' }, 403);
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '');
  const status = body.status === 'denied' ? 'denied' : 'fulfilled';
  const now = new Date().toISOString();
  await env.DB.prepare("UPDATE redemptions SET status=?, fulfilled_at=? WHERE id=? AND status='requested'")
    .bind(status, now, id).run();
  return json({ ok: true });
}
async function hostRaffle(req, env) {
  const u = await currentUser(req, env);
  if (!isHost(u, env)) return json({ error: 'forbidden' }, 403);
  const cycle = await ensureRaffleCycle(env);
  const rows = await env.DB.prepare('SELECT username, entries FROM raffle_entries WHERE cycle_id=? ORDER BY entries DESC, created_at ASC LIMIT 500')
    .bind(cycle.id).all();
  const list = rows.results || [];
  const total = list.reduce((a, x) => a + (x.entries || 1), 0);
  return json({
    cycle: { id: cycle.id, name: cycle.name, draw_date: cycle.draw_date },
    entrants: list,
    entrantCount: list.length,
    totalEntries: total,
  });
}
async function hostRaffleAction(req, env) {
  const u = await currentUser(req, env);
  if (!isHost(u, env)) return json({ error: 'forbidden' }, 403);
  const body = await req.json().catch(() => ({}));
  const cycle = await ensureRaffleCycle(env);
  if (body.action === 'setdate') {
    await env.DB.prepare('UPDATE raffle_cycles SET draw_date=? WHERE id=?')
      .bind(String(body.draw_date || '').slice(0, 40), cycle.id).run();
  } else if (body.action === 'draw') {
    await env.DB.prepare('UPDATE raffle_cycles SET winner_user_id=? WHERE id=?')
      .bind(String(body.winner || '').slice(0, 80), cycle.id).run();
  } else if (body.action === 'newcycle') {
    await env.DB.prepare("UPDATE raffle_cycles SET status='drawn' WHERE id=?").bind(cycle.id).run();
    await ensureRaffleCycle(env);
  } else {
    return json({ error: 'bad_action' }, 400);
  }
  return json({ ok: true });
}

// ---------- email (Resend) ----------
const UNSUB_SALT = 'pc_unsub_2026';
async function unsubToken(email, env) {
  // Prefer a runtime secret (set UNSUB_SALT in Cloudflare) so the salt isn't
  // guessable from the source; falls back to the default if unset.
  const salt = (env && env.UNSUB_SALT) || UNSUB_SALT;
  return (await sha256hex(new TextEncoder().encode(email + salt))).slice(0, 20);
}
function emailShell(heading, bodyHtml, unsubUrl) {
  return (
    '<!doctype html><html><body style="margin:0;padding:0;background:#f4f5f7;">' +
    '<div style="max-width:520px;margin:0 auto;padding:32px 18px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">' +
    '<div style="background:#0a0d12;border-radius:16px 16px 0 0;padding:24px;text-align:center;">' +
    '<img src="https://propchamps.net/logos/propchamps.png" alt="PropChamps" style="height:28px;">' +
    '</div>' +
    '<div style="background:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 16px 16px;padding:30px 28px;">' +
    '<h1 style="font-size:22px;font-weight:800;margin:0 0 16px;color:#0a0d12;letter-spacing:-.02em;">' + heading + '</h1>' +
    '<div style="font-size:15px;line-height:1.6;color:#374151;">' + bodyHtml + '</div>' +
    '</div>' +
    '<p style="text-align:center;font-size:12px;color:#9ca3af;margin:20px 0 0;line-height:1.5;">' +
    'PropChamps · Independent prop firm research<br>' +
    'You got this because you entered a giveaway or signed up at propchamps.net.<br>' +
    '<a href="' + unsubUrl + '" style="color:#9ca3af;">Unsubscribe</a>' +
    '</p></div></body></html>'
  );
}
function messageToHtml(text) {
  var e = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  e = e.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#5b8a00;">$1</a>');
  return e.split(/\n\n+/).map(function (p) { return '<p>' + p.replace(/\n/g, '<br>') + '</p>'; }).join('');
}
async function sendEmail(env, to, subject, html) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return { ok: false, error: 'not_configured' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, html }),
  });
  if (!res.ok) return { ok: false, error: 'api_' + res.status };
  return { ok: true };
}
async function sendWelcome(env, email, name, origin) {
  try {
    const unsub = origin + '/unsub?e=' + encodeURIComponent(email) + '&t=' + (await unsubToken(email, env));
    const hi = name ? 'Hey ' + name + ',' : 'Hey,';
    const btn = 'display:inline-block;background:#c8ff00;color:#0a0d12;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px;margin:10px 0;';
    const body =
      '<p>' + hi + '</p>' +
      "<p>You're entered in the giveaway — the winner gets picked <strong>live on stream</strong>, so keep it on. 🍀</p>" +
      "<p>While you're here: PropChamps tracks every futures prop firm's rules, payouts, and promo codes so you never overpay or get caught by a rule you didn't know about. Code <strong>CHAMP</strong> gets you the best price at every firm we cover.</p>" +
      '<p><a href="' + origin + '/deals" style="' + btn + '">See the current best deals →</a></p>' +
      '<p style="font-size:13px;color:#6b7280;">Good luck 🍀<br>— The PropChamps team</p>';
    await sendEmail(env, email, "You're in! 🎯 Plus the best prop firm deals right now", emailShell("You're entered!", body, unsub));
  } catch (e) {
    /* best-effort */
  }
}
async function sendApproved(env, email, username, firm, points, total, origin, isPayout) {
  if (!email) return;
  try {
    const unsub = origin + '/unsub?e=' + encodeURIComponent(email) + '&t=' + (await unsubToken(email, env));
    const btn = 'display:inline-block;background:#c8ff00;color:#0a0d12;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px;margin:10px 0;';
    const line = isPayout
      ? 'Your <strong>' + firm + '</strong> payout was verified and <strong>+' + points + ' points</strong> just hit your account.'
      : 'Your <strong>' + firm + '</strong> submission was approved and <strong>+' + points + ' points</strong> just hit your account.';
    const climb = isPayout
      ? 'Keep logging your payouts and CHAMP purchases to climb the leaderboard and unlock rewards.'
      : 'Keep submitting your CHAMP purchases to climb the leaderboard and unlock rewards.';
    const body =
      '<p>Nice work' + (username ? ', ' + username : '') + '! 🎉</p>' +
      '<p>' + line + '</p>' +
      "<p>You're now at <strong>" + Number(total || 0).toLocaleString() + ' points</strong>. ' + climb + '</p>' +
      '<p><a href="' + origin + '/rewards" style="' + btn + '">View your dashboard →</a></p>';
    await sendEmail(env, email, 'You earned ' + points + ' points! 🎉', emailShell('+' + points + ' points added', body, unsub));
  } catch (e) {
    /* best-effort */
  }
}
async function sendRejected(env, email, username, firm, origin, discordUrl) {
  if (!email) return;
  try {
    const unsub = origin + '/unsub?e=' + encodeURIComponent(email) + '&t=' + (await unsubToken(email, env));
    const link = discordUrl
      ? '<a href="' + discordUrl + '" style="color:#5b8a00;font-weight:600;">open a ticket in our Discord</a>'
      : 'open a ticket in our Discord';
    const body =
      '<p>Hey' + (username ? ' ' + username : '') + ',</p>' +
      '<p>Your <strong>' + firm + "</strong> submission wasn't approved this time. Usually that means we couldn't clearly see code <strong>CHAMP</strong> on the receipt, or the details didn't line up.</p>" +
      '<p>If you think that was a mistake, ' + link + " and we'll get it corrected fast.</p>" +
      '<p style="font-size:13px;color:#6b7280;">— The PropChamps team</p>';
    await sendEmail(env, email, 'About your recent submission', emailShell('Submission update', body, unsub));
  } catch (e) {
    /* best-effort */
  }
}
async function sendClaimReceived(env, email, username, rewardName, origin) {
  if (!email) return;
  try {
    const unsub = origin + '/unsub?e=' + encodeURIComponent(email) + '&t=' + (await unsubToken(email, env));
    const btn = 'display:inline-block;background:#c8ff00;color:#0a0d12;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px;margin:10px 0;';
    const body =
      '<p>Hey' + (username ? ' ' + username : '') + '! 🎉</p>' +
      '<p>We got your claim for <strong>' + rewardName + '</strong> — nice one.</p>' +
      "<p>Give us <strong>24–48 hours</strong> and we'll get everything sorted and sent straight to you — account login details, payout info, whatever your reward needs. Keep an eye on this inbox (and your Discord).</p>" +
      '<p><a href="' + origin + '/rewards" style="' + btn + '">Back to your dashboard →</a></p>' +
      '<p style="font-size:13px;color:#6b7280;">Thanks for rocking with code CHAMP.<br>— The PropChamps team</p>';
    await sendEmail(env, email, 'We got your reward claim 🎁 — ' + rewardName, emailShell('Claim received!', body, unsub));
  } catch (e) {
    /* best-effort */
  }
}
async function unsubscribe(req, env) {
  const url = new URL(req.url);
  const email = String(url.searchParams.get('e') || '').toLowerCase();
  const token = String(url.searchParams.get('t') || '');
  const valid = email && token === (await unsubToken(email, env));
  if (valid) await env.DB.prepare('UPDATE email_list SET unsubscribed=1 WHERE email=?').bind(email).run();
  const msg = valid
    ? "You've been unsubscribed. You won't get any more emails from PropChamps."
    : 'That unsubscribe link is invalid or expired.';
  return new Response(
    '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body style="font-family:system-ui,sans-serif;background:#0a0d12;color:#e8edf2;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:20px"><div><img src="/logos/propchamps.png" style="height:34px;margin-bottom:20px"><p style="font-size:16px;max-width:400px;line-height:1.5">' + msg + '</p></div>',
    { headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}
async function hostBroadcast(req, env, ctx) {
  const u = await currentUser(req, env);
  if (!isHost(u, env)) return json({ error: 'forbidden' }, 403);
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return json({ error: 'not_configured' }, 400);
  const body = await req.json().catch(() => ({}));
  const subject = String(body.subject || '').slice(0, 150);
  const message = String(body.message || '').slice(0, 8000);
  if (!subject || !message) return json({ error: 'missing_fields' }, 400);
  const origin = new URL(req.url).origin;
  const rows = await env.DB.prepare('SELECT email FROM email_list WHERE unsubscribed=0 LIMIT 5000').all();
  const emails = (rows.results || []).map((r) => r.email);
  const send = async () => {
    for (let i = 0; i < emails.length; i += 100) {
      const chunk = emails.slice(i, i + 100);
      const payload = await Promise.all(
        chunk.map(async (e) => ({
          from: env.EMAIL_FROM,
          to: [e],
          subject,
          html: emailShell(subject, messageToHtml(message), origin + '/unsub?e=' + encodeURIComponent(e) + '&t=' + (await unsubToken(e, env))),
        }))
      );
      await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  };
  if (ctx && ctx.waitUntil) ctx.waitUntil(send());
  else await send();
  return json({ ok: true, queued: emails.length });
}
async function hostEmailsCsv(req, env) {
  const u = await currentUser(req, env);
  if (!isHost(u, env)) return new Response('forbidden', { status: 403 });
  const rows = await env.DB.prepare('SELECT email, name, source, first_seen, unsubscribed FROM email_list ORDER BY first_seen DESC LIMIT 100000').all();
  let csv = 'email,name,source,first_seen,unsubscribed\n';
  (rows.results || []).forEach((r) => {
    csv += [r.email, r.name || '', r.source || '', r.first_seen || '', r.unsubscribed ? '1' : '0']
      .map((x) => '"' + String(x).replace(/"/g, '""') + '"')
      .join(',') + '\n';
  });
  return new Response(csv, {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="propchamps-emails.csv"' },
  });
}

// ---------- router ----------
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;
    const m = request.method;
    try {
      if (p === '/auth/discord') return await authStart(request, env);
      if (p === '/auth/discord/callback') return await authCallback(request, env);
      if (p === '/auth/logout') return await logout(request, env);

      if (p === '/api/me') return await apiMe(request, env);
      if (p === '/api/leaderboard') return await apiLeaderboard(request, env);
      if (p === '/api/rewards/stock') return await apiRewardStock(request, env);
      if (p === '/api/submit' && m === 'POST') return await apiSubmit(request, env);
      if (p === '/api/redeem' && m === 'POST') return await apiRedeem(request, env, ctx);

      if (p === '/api/admin/queue') return await adminQueue(request, env);
      if (p === '/api/admin/review' && m === 'POST') return await adminReview(request, env, ctx);
      if (p.startsWith('/api/admin/image/')) return await adminImage(request, env, p.slice('/api/admin/image/'.length));

      if (p === '/api/giveaway/status') return await giveawayStatus(request, env);
      if (p === '/api/giveaway/enter' && m === 'POST') return await giveawayEnter(request, env, ctx);
      if (p === '/unsub') return await unsubscribe(request, env);
      if (p === '/api/host/giveaway') return await hostGiveaway(request, env);
      if (p === '/api/host/giveaway/action' && m === 'POST') return await hostGiveawayAction(request, env);
      if (p === '/api/host/fulfillment') return await hostFulfillment(request, env);
      if (p === '/api/host/fulfillment/mark' && m === 'POST') return await hostFulfillMark(request, env);
      if (p === '/api/host/raffle') return await hostRaffle(request, env);
      if (p === '/api/host/raffle/action' && m === 'POST') return await hostRaffleAction(request, env);
      if (p === '/api/host/broadcast' && m === 'POST') return await hostBroadcast(request, env, ctx);
      if (p === '/api/host/emails.csv') return await hostEmailsCsv(request, env);

      // Not an API/auth route → serve the static site (assets binding).
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response('Not found', { status: 404 });
    } catch (err) {
      // Log the detail (Workers observability), but never leak internals to the client.
      console.error('worker error', p, err && err.stack ? err.stack : err);
      return json({ error: 'server_error' }, 500);
    }
  },
};
