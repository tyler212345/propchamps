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
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_PENDING_PER_USER = 8;
// Receipt triage model. Switch to 'claude-haiku-4-5' for ~5x cheaper high volume.
const AI_MODEL = 'claude-opus-5';

const TIERS = [
  { name: "Champ's Circle", min: 10000 },
  { name: 'Gold', min: 3000 },
  { name: 'Silver', min: 1000 },
  { name: 'Bronze', min: 0 },
];
function tierFor(pts) {
  for (const t of TIERS) if (pts >= t.min) return t.name;
  return 'Bronze';
}

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
    scope: 'identify',
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
  if (existing) {
    userId = existing.id;
    await env.DB.prepare('UPDATE users SET username=?, avatar=? WHERE id=?')
      .bind(d.username, d.avatar || '', userId)
      .run();
  } else {
    userId = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO users (id,discord_id,username,avatar,lifetime_points,spendable_points,created_at) VALUES (?,?,?,?,0,0,?)'
    )
      .bind(userId, d.id, d.username, d.avatar || '', now)
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
  if (!u) return json({ loggedIn: false });
  const rankRow = await env.DB.prepare('SELECT COUNT(*) AS c FROM users WHERE lifetime_points > ?')
    .bind(u.lifetime_points)
    .first();
  const acctRow = await env.DB.prepare("SELECT COUNT(*) AS c FROM submissions WHERE user_id=? AND status='approved'")
    .bind(u.id)
    .first();
  const subs = await env.DB.prepare(
    'SELECT id, firm_slug, claimed_amount, status, points_awarded, created_at FROM submissions WHERE user_id=? ORDER BY created_at DESC LIMIT 12'
  )
    .bind(u.id)
    .all();
  return json({
    loggedIn: true,
    user: {
      username: u.username,
      avatar: u.avatar,
      discordId: u.discord_id,
      lifetimePoints: u.lifetime_points,
      spendablePoints: u.spendable_points,
      tier: tierFor(u.lifetime_points),
      rank: (rankRow?.c || 0) + 1,
      accounts: acctRow?.c || 0,
      isAdmin: isAdmin(u, env),
      isHost: isHost(u, env),
    },
    submissions: subs.results || [],
  });
}

async function apiLeaderboard(req, env) {
  const u = await currentUser(req, env);
  const rows = await env.DB.prepare(
    'SELECT username, avatar, discord_id, lifetime_points FROM users WHERE banned=0 ORDER BY lifetime_points DESC LIMIT 25'
  ).all();
  const list = (rows.results || []).map((r, i) => ({
    rank: i + 1,
    username: r.username,
    points: r.lifetime_points,
    tier: tierFor(r.lifetime_points),
    me: !!(u && r.discord_id === u.discord_id),
  }));
  return json({ leaderboard: list });
}

async function apiSubmit(req, env) {
  const u = await currentUser(req, env);
  if (!u) return json({ error: 'not_logged_in' }, 401);
  if (u.banned) return json({ error: 'banned' }, 403);

  const form = await req.formData();
  const firm = String(form.get('firm') || '').slice(0, 80);
  const amount = String(form.get('amount') || '').slice(0, 80);
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
    'INSERT INTO submissions (id,user_id,firm_slug,claimed_amount,image_key,image_hash,status,created_at) VALUES (?,?,?,?,?,?,?,?)'
  )
    .bind(subId, u.id, firm, amount, key, hash, 'pending', now)
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
  try {
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

async function apiRedeem(req, env) {
  const u = await currentUser(req, env);
  if (!u) return json({ error: 'not_logged_in' }, 401);
  const body = await req.json().catch(() => ({}));
  const cost = parseInt(body.cost, 10) || 0;
  const name = String(body.name || 'reward').slice(0, 80);
  if (cost <= 0) return json({ error: 'bad_request' }, 400);
  if (u.spendable_points < cost) return json({ error: 'insufficient_points' }, 400);

  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO redemptions (id,user_id,reward_name,cost_points,status,created_at) VALUES (?,?,?,?,?,?)')
      .bind(crypto.randomUUID(), u.id, name, cost, 'requested', now),
    env.DB.prepare('INSERT INTO points_ledger (id,user_id,delta,reason,created_at) VALUES (?,?,?,?,?)')
      .bind(crypto.randomUUID(), u.id, -cost, 'redeem:' + name, now),
    env.DB.prepare('UPDATE users SET spendable_points = spendable_points - ? WHERE id=?').bind(cost, u.id),
  ]);
  return json({ ok: true });
}

// ---------- admin ----------
async function adminQueue(req, env) {
  const u = await currentUser(req, env);
  if (!isAdmin(u, env)) return json({ error: 'forbidden' }, 403);
  const rows = await env.DB.prepare(
    "SELECT s.id, s.firm_slug, s.claimed_amount, s.status, s.ai_score, s.ai_notes, s.created_at, u.username, u.discord_id " +
      "FROM submissions s JOIN users u ON u.id=s.user_id WHERE s.status='pending' ORDER BY s.created_at ASC LIMIT 100"
  ).all();
  return json({ queue: rows.results || [] });
}

async function adminReview(req, env) {
  const u = await currentUser(req, env);
  if (!isAdmin(u, env)) return json({ error: 'forbidden' }, 403);
  const body = await req.json().catch(() => ({}));
  const subId = String(body.submissionId || '');
  const action = body.action;
  const sub = await env.DB.prepare('SELECT * FROM submissions WHERE id=?').bind(subId).first();
  if (!sub || sub.status !== 'pending') return json({ error: 'not_pending' }, 400);
  const now = new Date().toISOString();

  if (action === 'approve') {
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE submissions SET status='approved', points_awarded=?, reviewed_by=?, reviewed_at=? WHERE id=?"
      ).bind(POINTS_PER_SUBMISSION, u.discord_id, now, subId),
      env.DB.prepare(
        'INSERT INTO points_ledger (id,user_id,delta,reason,submission_id,created_at) VALUES (?,?,?,?,?,?)'
      ).bind(crypto.randomUUID(), sub.user_id, POINTS_PER_SUBMISSION, 'submission_approved', subId, now),
      env.DB.prepare('UPDATE users SET lifetime_points=lifetime_points+?, spendable_points=spendable_points+? WHERE id=?')
        .bind(POINTS_PER_SUBMISSION, POINTS_PER_SUBMISSION, sub.user_id),
      env.DB.prepare('INSERT INTO admin_actions (id,admin,action,target,created_at) VALUES (?,?,?,?,?)')
        .bind(crypto.randomUUID(), u.discord_id, 'approve', subId, now),
    ]);
  } else if (action === 'reject') {
    await env.DB.batch([
      env.DB.prepare("UPDATE submissions SET status='rejected', reviewed_by=?, reviewed_at=? WHERE id=?")
        .bind(u.discord_id, now, subId),
      env.DB.prepare('INSERT INTO admin_actions (id,admin,action,target,created_at) VALUES (?,?,?,?,?)')
        .bind(crypto.randomUUID(), u.discord_id, 'reject', subId, now),
    ]);
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
async function giveawayEnter(req, env) {
  const st = await getGiveawayState(env);
  if (!st.open) return json({ error: 'closed' }, 403);
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase().slice(0, 120);
  const name = String(body.name || '').trim().slice(0, 60);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'invalid_email' }, 400);
  const now = new Date().toISOString();
  const dupe = await env.DB.prepare('SELECT id FROM giveaway_entries WHERE email=?').bind(email).first();
  if (dupe) {
    await env.DB.prepare("INSERT OR IGNORE INTO email_list (email,name,source,first_seen) VALUES (?,?,?,?)")
      .bind(email, name, 'giveaway', now).run();
    return json({ ok: true, already: true });
  }
  await env.DB.batch([
    env.DB.prepare('INSERT OR IGNORE INTO giveaway_entries (id,email,name,created_at) VALUES (?,?,?,?)')
      .bind(crypto.randomUUID(), email, name, now),
    env.DB.prepare('INSERT OR IGNORE INTO email_list (email,name,source,first_seen) VALUES (?,?,?,?)')
      .bind(email, name, 'giveaway', now),
  ]);
  return json({ ok: true });
}

// ---------- host portal ----------
async function hostGiveaway(req, env) {
  const u = await currentUser(req, env);
  if (!isHost(u, env)) return json({ error: 'forbidden' }, 403);
  const st = await getGiveawayState(env);
  const rows = await env.DB.prepare('SELECT name, email, created_at FROM giveaway_entries ORDER BY created_at ASC LIMIT 1000').all();
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

// ---------- router ----------
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    const m = request.method;
    try {
      if (p === '/auth/discord') return await authStart(request, env);
      if (p === '/auth/discord/callback') return await authCallback(request, env);
      if (p === '/auth/logout') return await logout(request, env);

      if (p === '/api/me') return await apiMe(request, env);
      if (p === '/api/leaderboard') return await apiLeaderboard(request, env);
      if (p === '/api/submit' && m === 'POST') return await apiSubmit(request, env);
      if (p === '/api/redeem' && m === 'POST') return await apiRedeem(request, env);

      if (p === '/api/admin/queue') return await adminQueue(request, env);
      if (p === '/api/admin/review' && m === 'POST') return await adminReview(request, env);
      if (p.startsWith('/api/admin/image/')) return await adminImage(request, env, p.slice('/api/admin/image/'.length));

      if (p === '/api/giveaway/status') return await giveawayStatus(request, env);
      if (p === '/api/giveaway/enter' && m === 'POST') return await giveawayEnter(request, env);
      if (p === '/api/host/giveaway') return await hostGiveaway(request, env);
      if (p === '/api/host/giveaway/action' && m === 'POST') return await hostGiveawayAction(request, env);
      if (p === '/api/host/fulfillment') return await hostFulfillment(request, env);
      if (p === '/api/host/fulfillment/mark' && m === 'POST') return await hostFulfillMark(request, env);

      // Not an API/auth route → serve the static site (assets binding).
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response('Not found', { status: 404 });
    } catch (err) {
      return json({ error: 'server_error', message: String((err && err.message) || err) }, 500);
    }
  },
};
