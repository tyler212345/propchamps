#!/usr/bin/env node
/**
 * build-vs-page.js — /vs/<a>-vs-<b> head-to-head pages + the /vs/ hub.
 *
 *     node tools/build-vs-page.js            # release wave RELEASE_WAVE (below)
 *     node tools/build-vs-page.js --wave 2   # also write the wave-2 CONFIG pages
 *     node tools/pc-build.mjs                # then inject the shared chrome (idempotent)
 *
 * Each run does four things:
 *   1. WRITES every CONFIG page whose `wave` <= the release wave (bespoke prose lives
 *      in CONFIGS below; the data-driven parts come from data/firms.js).
 *   2. REFRESHES every vs/*.html ON DISK — generated and hand-authored alike — by
 *      re-filling the generated blocks between <!--g:NAME--> … <!--/g:NAME--> markers:
 *        g:firms    hero firm cards           (same renderer as /vs/vs.js)
 *        g:matrix   comparison matrix + note  (same ROWS as /vs/vs.js, so crawlers see
 *                                              the numbers; vs.js re-renders it live)
 *        g:rules    plan-by-plan rules table  (TABLES[vsSlug].plans, from plansSummary)
 *        g:payouts  plan-by-plan payout table (same plans)
 *        g:prices   price-by-size table       (TABLES[vsSlug].prices, from plansDetailed)
 *        g:related  every other vs page ON DISK that shares either firm
 *        g:deeper   both firm reviews + their subpages ON DISK + rules explainers
 *      It also fills the pick-card logos/CTAs, resolves conditional links
 *      (<a data-pc-link="/path">…</a> becomes a real link only when /path exists on disk,
 *      otherwise a <span>), points BreadcrumbList item 2 at the /vs/ hub, and rewrites
 *      the FAQPage JSON-LD from the visible FAQ so the two can never drift apart.
 *   3. REBUILDS vs/index.html (the hub): the matrix of all pairs among the live firms,
 *      linking the pairs that exist on disk.
 *   4. WRITES vs/_sitemap.txt (sitemap <url> entries) and vs/_redirects.txt (one
 *      reverse-order 301 per pair) — snippets to paste into sitemap.xml / _redirects
 *      (vs/_* is in .assetsignore, so neither is served).
 *
 * Links are always computed from the files on disk, so a page released in a later wave
 * is linked only once its file exists. To ship a wave: keep the next wave's files out of
 * the tree, run this script, then pc-build.
 *
 * The site chrome (ticker, header, footer, /assets/pc.*) is NOT written here: a new page
 * gets the empty <!-- pc:head -->, <!-- pc:chrome --> and <!-- pc:footer --> marker pairs
 * and tools/pc-build.mjs fills them. When a page is regenerated, the chrome pc-build put
 * into the existing file is carried over, so rebuilt pages stay complete without it.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const YEAR = 2026;
const RELEASE_WAVE = 2;          // wave 2 shipped
const PUBLISHED = '2026-09-18';  // schema datePublished (default)
const MODIFIED = '2026-10-23';   // schema dateModified + sitemap <lastmod> (default)
const SITE = 'https://propchamps.net';

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const stripTags = (s) => String(s).replace(/<[^>]+>/g, '');
const decode = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const plain = (s) => decode(stripTags(s)).replace(/\s+/g, ' ').trim();
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

/* ---------- data: firms.js + the shared renderers in vs/vs.js ---------- */
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(read('data/firms.js'), sandbox, { filename: 'data/firms.js' });
vm.runInContext(read('vs/vs.js'), sandbox, { filename: 'vs/vs.js' });
const FIRMS = sandbox.window.FIRMS;
const PCVS = sandbox.window.PCVS;
const ORDER = (sandbox.window.FIRM_ORDER || Object.keys(FIRMS)).filter((k) => FIRMS[k] && FIRMS[k].live !== false);

/* firm data slug → slug used in /vs/ URLs, and → /firms/<slug> review URL */
const VS_SLUG = { 'apex-trader': 'apex-trader-funding', 'take-profit': 'take-profit-trader' };
const REVIEW_SLUG = { 'take-profit': 'take-profit-trader' };
const SHORT = { 'apex-trader': 'Apex' };
const vsSlugOf = (k) => VS_SLUG[k] || k;
const reviewPath = (k) => '/firms/' + (REVIEW_SLUG[k] || k);
const shortName = (k) => SHORT[k] || FIRMS[k].name;
const pairSlug = (a, b) => vsSlugOf(a) + '-vs-' + vsSlugOf(b);

/* clean URL → file on disk */
function urlToFile(url) {
  const u = url.replace(/[#?].*$/, '');
  if (u === '/') return 'index.html';
  if (u.endsWith('/')) return u.slice(1) + 'index.html';
  return u.slice(1) + '.html';
}
const urlExists = (url) => exists(urlToFile(url));

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] + ' ' + d + ', ' + y;
}
/* " | PropChamps" only when it fits (plan rule: base title <= 47 chars) */
const titleTag = (t) => (t.length <= 47 ? t + ' | PropChamps' : t);

/* ============================================================
   DATA-DRIVEN TABLES (both CONFIG pages and hand-authored pages)
   plans:  plansSummary plan names per side → g:rules + g:payouts
   prices: keys into PRICE_SRC ("side:Plan key")         → g:prices
   ============================================================ */
const PRICE_SRC = {
  'lucid-trading': {
    'Pro': { plan: 'Lucid Pro', field: 'Price (w/ CHAMP)', billing: 'Confirm at checkout', basis: 'champ' },
    'Flex': { plan: 'Lucid Flex', field: 'Price (w/ CHAMP)', billing: 'Confirm at checkout', basis: 'champ' },
    'Direct': { plan: 'Lucid Direct', field: 'Price (w/ CHAMP)', billing: 'One-time', basis: 'champ' },
  },
  'tradeify': {
    'Growth': { plan: 'GROWTH', field: 'One-Time Payment (list)', billing: 'One-time', basis: 'list' },
    'Select': { plan: 'SELECT — Evaluation', field: 'One-Time Payment (list)', billing: 'One-time', basis: 'list' },
    'Lightning': { plan: 'LIGHTNING', field: 'One-Time Payment (list)', billing: 'One-time', basis: 'list' },
  },
  'alpha-futures': {
    'Zero': { plan: 'Alpha Zero', field: 'Monthly Price (list)', billing: 'Monthly', basis: 'list' },
    'Standard': { plan: 'Alpha Standard', field: 'Monthly Price (list)', billing: 'Monthly', basis: 'list' },
    'Advanced': { plan: 'Alpha Advanced', field: 'Monthly Price (list)', billing: 'Monthly', basis: 'list' },
    'Direct': { plan: 'Alpha Direct (one-time, straight to funded)', field: 'One-Time Price (list)', billing: 'One-time', basis: 'list', label: 'Direct' },
  },
  'my-funded-futures': {
    'Rapid': { plan: 'Funded Futures Rapid', field: 'Price (list, one-time)', billing: 'One-time', basis: 'list' },
    'Rapid EOD': { plan: 'Rapid EOD', field: 'Price (list, one-time)', billing: 'One-time', basis: 'list' },
    'Pro': { plan: 'Funded Futures Pro', field: 'Price (list, one-time)', billing: 'One-time', basis: 'list' },
    'Builder': { plan: 'Builder Plan (path to Live)', field: 'Price (list, one-time)', billing: 'One-time', basis: 'list', label: 'Builder' },
  },
  'fundednext': {
    'Flex': { plan: 'FLEX', field: 'One-Time Fee', billing: 'One-time', basis: 'offer', sub: 'first 2 purchases' },
    'Legacy': { plan: 'LEGACY', field: 'One-Time Fee', billing: 'One-time', basis: 'offer' },
    'Rapid': { plan: 'RAPID — Pro Plan', field: 'One-Time Fee', billing: 'One-time', basis: 'offer', label: 'Rapid (Pro or Daily)' },
  },
  'take-profit': {
    'Test': { plan: 'EVALUATION', summary: true, field: 'Activation Fee', after: 'monthly', billing: 'Monthly', basis: 'list', label: 'TEST (evaluation)', sub: '+ $130 activation, often waived' },
  },
  'apex-trader': {
    'Intraday': { plan: 'Intraday Trail', field: 'Eval Price (list)', billing: 'One-time', basis: 'list', label: 'Intraday Trail · Standard', sub: '+ funded activation fee' },
    'Intraday NA': { plan: 'Intraday Trail', field: 'No-Activation Price (list)', billing: 'One-time', basis: 'list', label: 'Intraday Trail · No activation fee' },
    'EOD': { plan: 'EOD Trail', field: 'Eval Price (list)', billing: 'One-time', basis: 'list', label: 'EOD Trail · Standard', sub: '+ funded activation fee' },
    'EOD NA': { plan: 'EOD Trail', field: 'No-Activation Price (list)', billing: 'One-time', basis: 'list', label: 'EOD Trail · No activation fee' },
  },
};

const LUCID4 = ['LUCID PRO', 'LUCID FLEX', 'LUCID DAILY', 'LUCID DIRECT'];
const TRADEIFY4 = ['GROWTH', 'SELECT — DAILY PATH', 'SELECT — FLEX PATH', 'LIGHTNING'];
const ALPHA4 = ['ALPHA ZERO', 'ALPHA STANDARD', 'ALPHA ADVANCED', 'ALPHA DIRECT'];
const MFF4 = ['FUNDED FUTURES RAPID', 'RAPID EOD', 'FUNDED FUTURES PRO', 'BUILDER PLAN'];
const FN4 = ['FLEX', 'LEGACY', 'RAPID — PRO', 'RAPID — DAILY'];
const APEX2 = ['INTRADAY TRAIL', 'EOD TRAIL'];
const TPT1 = ['EVALUATION'];

const TABLES = {
  'lucid-trading-vs-tradeify': { plans: { a: LUCID4, b: TRADEIFY4 }, prices: ['a:Pro', 'a:Flex', 'a:Direct', 'b:Growth', 'b:Select', 'b:Lightning'] },
  'lucid-trading-vs-my-funded-futures': { plans: { a: LUCID4, b: MFF4 }, prices: ['a:Pro', 'a:Flex', 'a:Direct', 'b:Rapid', 'b:Rapid EOD', 'b:Pro', 'b:Builder'] },
  /* champUnconfirmed: firms whose CHAMP rate we couldn't confirm (TPT: 40% vs $40), so no % or "with CHAMP" row is shown */
  'lucid-trading-vs-take-profit-trader': { plans: { a: LUCID4, b: TPT1 }, prices: ['a:Pro', 'a:Flex', 'a:Direct', 'b:Test'], champUnconfirmed: ['take-profit'] },
  'alpha-futures-vs-lucid-trading': { plans: { a: ALPHA4, b: LUCID4 }, prices: ['a:Zero', 'a:Standard', 'a:Advanced', 'a:Direct', 'b:Pro', 'b:Flex', 'b:Direct'] },
  'fundednext-vs-lucid-trading': { plans: { a: FN4, b: LUCID4 }, prices: ['a:Flex', 'a:Legacy', 'a:Rapid', 'b:Pro', 'b:Flex', 'b:Direct'] },
  'alpha-futures-vs-tradeify': { plans: { a: ALPHA4, b: TRADEIFY4 }, prices: ['a:Zero', 'a:Standard', 'a:Advanced', 'a:Direct', 'b:Growth', 'b:Select', 'b:Lightning'] },
  'apex-trader-funding-vs-lucid-trading': { plans: { a: APEX2, b: LUCID4 }, prices: ['a:Intraday', 'a:Intraday NA', 'a:EOD', 'a:EOD NA', 'b:Pro', 'b:Flex', 'b:Direct'] },
  'apex-trader-funding-vs-alpha-futures': { plans: { a: APEX2, b: ALPHA4 }, prices: ['a:Intraday', 'a:Intraday NA', 'a:EOD', 'a:EOD NA', 'b:Zero', 'b:Standard', 'b:Advanced', 'b:Direct'] },
  'fundednext-vs-my-funded-futures': { plans: { a: FN4, b: MFF4 }, prices: ['a:Flex', 'a:Legacy', 'a:Rapid', 'b:Rapid', 'b:Rapid EOD', 'b:Pro', 'b:Builder'] },
  'tradeify-vs-take-profit-trader': { plans: { a: TRADEIFY4, b: TPT1 }, prices: ['a:Growth', 'a:Select', 'a:Lightning', 'b:Test'] },
  'apex-trader-funding-vs-my-funded-futures': { plans: { a: APEX2, b: MFF4 }, prices: ['a:Intraday', 'a:Intraday NA', 'a:EOD', 'a:EOD NA', 'b:Rapid', 'b:Rapid EOD', 'b:Pro', 'b:Builder'] },
  'apex-trader-funding-vs-take-profit-trader': { plans: { a: APEX2, b: TPT1 }, prices: ['a:Intraday', 'a:Intraday NA', 'a:EOD', 'a:EOD NA', 'b:Test'] },
  'apex-trader-funding-vs-tradeify': { plans: { a: APEX2, b: TRADEIFY4 }, prices: ['a:Intraday', 'a:Intraday NA', 'a:EOD', 'a:EOD NA', 'b:Growth', 'b:Select', 'b:Lightning'] },
  'tradeify-vs-my-funded-futures': { plans: { a: TRADEIFY4, b: MFF4 }, prices: ['a:Growth', 'a:Select', 'a:Lightning', 'b:Rapid', 'b:Rapid EOD', 'b:Pro', 'b:Builder'] },
  'take-profit-trader-vs-my-funded-futures': { plans: { a: TPT1, b: MFF4 }, prices: ['a:Test', 'b:Rapid', 'b:Rapid EOD', 'b:Pro', 'b:Builder'] },
};

/* Firms whose payout details came from search-engine excerpts of their help centers
   (their sites blocked the Oct 23, 2026 check) — flagged under the payout table. */
const SOURCE_NOTE = {
  'tradeify': "Tradeify's help center blocked our October check, so its per-payout caps, minimums and buffers come from search-engine excerpts of that help center; its prices, splits, frequency and drawdowns were read on tradeify.co. Confirm in your dashboard.",
  'apex-trader': "Apex's site blocked our October check, so its payout rules come from our September audit and search-engine excerpts of its help center. The caps for payouts 2-5 are the least certain figure. Confirm in your dashboard.",
};
/* Price-table caveats (shown under g:prices whenever the firm is on the page). */
const PRICE_NOTE = {
  'apex-trader': "Apex's site blocked our October re-check, so these are its list prices from our earlier audits. Two Intraday Trail No-Activation prices don't follow the pattern: 25K ($690) is above 50K ($490), and 100K ($590) is below the 100K Standard build ($790). We couldn't confirm them, so check the price at checkout.",
};

/* Known-stale plansSummary values, corrected to the Oct 23, 2026 help-center reading
   (verified-facts.md). Applied only while firms.js still holds the stale string, so a
   firms.js fix makes the entry a no-op; delete an entry once firms.js matches. */
const SUMMARY_FIX = {
  // (empty: firms.js now matches every Oct 23 reading)
};
function fixedRule(k, p, key) {
  const fx = SUMMARY_FIX[k + '|' + p.name + '|' + key];
  const v = p.rules[key];
  return fx && v === fx[0] ? fx[1] : v;
}

/* ---------- small data helpers ---------- */
function summaryPlan(k, name) {
  const p = (FIRMS[k].plansSummary || []).find((x) => x.name === name);
  if (!p) throw new Error(`plansSummary "${name}" not found for ${k}`);
  return p;
}
function detailedPlan(k, name) {
  const p = (FIRMS[k].plansDetailed || []).find((x) => x.name.trim() === name);
  if (!p) throw new Error(`plansDetailed "${name}" not found for ${k}`);
  return p;
}
const detailedField = (p, label) => { const r = p.rules.find((x) => x[0] === label); return r ? r[1] : ''; };
const splitList = (s) => String(s || '').replace(/\([^)]*\)/g, '').split(/\s*[\/·]\s*/).map((x) => x.trim()).filter(Boolean);
function dollars(s, after) {
  let t = String(s || '');
  if (after) { const i = t.toLowerCase().indexOf(after); t = i >= 0 ? t.slice(i + after.length) : ''; }
  t = t.replace(/\([^)]*\)/g, '');
  return (t.match(/\$[\d,]+(?:\.\d{2})?/g) || []);
}
const money = (n) => '$' + (Number.isInteger(n) ? n.toLocaleString('en-US') : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const num = (s) => Number(String(s).replace(/[$,]/g, ''));
function champPct(k) {
  const d = String((FIRMS[k].promo && FIRMS[k].promo.discount) || '');
  const m = d.match(/(\d+)\s*%/);
  return /up to/i.test(d) || !m ? null : Number(m[1]);
}
const SIZE_ORDER = ['25K', '50K', '75K', '100K', '150K', '300K'];

/* ---------- table renderers ---------- */
function planCell(k, name, sizes) {
  return `<td class="firm-c"><span class="pl-firm">${esc(FIRMS[k].name)}</span><b>${esc(PCVS.planLabel(name))}</b>${sizes ? `<span class="sub">${esc(sizes)}</span>` : ''}</td>`;
}
const val = (k, p, key) => esc(fixedRule(k, p, key) || '—');

function rulesTable(spec, ak, bk) {
  const rows = [...spec.a.map((n) => [ak, n]), ...spec.b.map((n) => [bk, n])];
  let body = '';
  rows.forEach(([k, n], i) => {
    const p = summaryPlan(k, n);
    const brk = i > 0 && rows[i - 1][0] !== k ? ' class="firm-break"' : '';
    body += `<tr${brk}>${planCell(k, n, p.rules['Account Sizes'])}<td>${val(k, p, 'Profit Target')}</td><td>${val(k, p, 'Max Drawdown')}<span class="sub">${val(k, p, 'Drawdown Type')}</span></td><td>${val(k, p, 'Daily Loss Limit')}</td><td>${val(k, p, 'Consistency Rule')}</td><td>${val(k, p, 'Min. Trading Days')}</td></tr>`;
  });
  return `<div class="table-wrap"><table class="data"><thead><tr><th scope="col">Plan · sizes</th><th scope="col">Profit target</th><th scope="col">Max drawdown</th><th scope="col">Daily loss limit</th><th scope="col">Consistency</th><th scope="col">Min. days</th></tr></thead><tbody>${body}</tbody></table></div>` +
    `<p class="table-note">Values by account size, smallest to largest, from each firm's plan rules in our ${fmtDate(MODIFIED).replace(/ \d+,/, '')} data. "Funded" (or "qualified") means the sim-funded stage after you pass.</p>`;
}

function payoutsTable(spec, ak, bk) {
  const rows = [...spec.a.map((n) => [ak, n]), ...spec.b.map((n) => [bk, n])];
  let body = '';
  rows.forEach(([k, n], i) => {
    const p = summaryPlan(k, n);
    const brk = i > 0 && rows[i - 1][0] !== k ? ' class="firm-break"' : '';
    body += `<tr${brk}>${planCell(k, n, p.rules['Account Sizes'])}<td>${val(k, p, 'Payout Split')}</td><td>${val(k, p, 'Payout Frequency')}</td><td>${val(k, p, 'Max Payout')}</td></tr>`;
  });
  const notes = [ak, bk].filter((k) => SOURCE_NOTE[k]).map((k) => `<p class="table-note">${esc(SOURCE_NOTE[k])}</p>`).join('');
  return `<div class="table-wrap"><table class="data"><thead><tr><th scope="col">Plan · sizes</th><th scope="col">Split (trader / firm)</th><th scope="col">When you can request</th><th scope="col">Max per payout</th></tr></thead><tbody>${body}</tbody></table></div>` +
    `<p class="table-note">"Max per payout" is the most one request can withdraw in the sim-funded stage, by account size. Caps, buffers and minimums change often; confirm in your dashboard before you plan around them.</p>` + notes;
}

function priceRows(keys, ak, bk) {
  return keys.map((key) => {
    const [side, pk] = key.split(':');
    const k = side === 'a' ? ak : bk;
    const src = (PRICE_SRC[k] || {})[pk];
    if (!src) throw new Error(`PRICE_SRC ${k} "${pk}" missing`);
    let sizes, prices;
    if (src.summary) {
      const p = summaryPlan(k, src.plan);
      sizes = splitList(p.rules['Account Sizes']);
      prices = dollars(p.rules[src.field], src.after);
    } else {
      const p = detailedPlan(k, src.plan);
      sizes = splitList(detailedField(p, 'Account Sizes'));
      prices = dollars(detailedField(p, src.field), src.after);
    }
    prices = prices.slice(0, sizes.length);
    if (prices.length !== sizes.length) throw new Error(`price/size mismatch for ${k} ${pk}: ${sizes} vs ${prices}`);
    const bySize = {}; sizes.forEach((s, i) => { bySize[s] = prices[i]; });
    return { k, src, label: src.label || pk, bySize };
  });
}

function pricesTable(keys, ak, bk, opts) {
  const rows = priceRows(keys, ak, bk);
  const sizes = SIZE_ORDER.filter((s) => rows.some((r) => r.bySize[s]));
  const unconfirmed = new Set((opts && opts.champUnconfirmed) || []);
  const BASIS = { list: 'List price', champ: 'With CHAMP (Oct 5 check)', offer: 'Offer price' };
  let body = '';
  rows.forEach((r, i) => {
    const brk = i > 0 && rows[i - 1].k !== r.k ? ' class="firm-break"' : '';
    const bill = esc(r.src.billing) + `<span class="sub">${esc(BASIS[r.src.basis])}${r.src.sub ? ' · ' + esc(r.src.sub) : ''}</span>`;
    body += `<tr${brk}><td class="firm-c"><span class="pl-firm">${esc(FIRMS[r.k].name)}</span><b>${esc(r.label)}</b></td><td>${bill}</td>` +
      sizes.map((s) => `<td class="num">${r.bySize[s] ? esc(r.bySize[s]) : '<span class="faint">—</span>'}</td>`).join('') + '</tr>';
    const pct = r.src.basis === 'champ' || unconfirmed.has(r.k) ? null : champPct(r.k);
    if (pct) {
      body += `<tr class="champ"><td class="firm-c">With CHAMP (−${pct}%)</td><td>Our math</td>` +
        sizes.map((s) => `<td class="num">${r.bySize[s] ? esc(money(Math.round(num(r.bySize[s]) * (100 - pct)) / 100)) : '<span class="faint">—</span>'}</td>`).join('') + '</tr>';
    }
  });
  const discounts = [ak, bk].map((k) => {
    const d = String((FIRMS[k].promo && FIRMS[k].promo.discount) || '');
    if (k === 'lucid-trading') return `${FIRMS[k].name}: the prices shown already include CHAMP, as seen at checkout on Oct 5, 2026 (Lucid's site blocked our Oct 23 re-check), and we haven't confirmed whether its evaluations renew monthly`;
    if (unconfirmed.has(k)) return `${FIRMS[k].name}: CHAMP is applied at checkout, but we couldn't confirm its rate`;
    if (/\d+\s*%/.test(d) && !/up to/i.test(d)) return `${FIRMS[k].name}: CHAMP is ${d.toLowerCase()} in our deal data`;
    if (/up to/i.test(d)) return `${FIRMS[k].name}: CHAMP is ${d.toLowerCase()} depending on the plan in our deal data (applied at checkout), so no "with CHAMP" row is shown`;
    return `${FIRMS[k].name}: CHAMP is applied at checkout; the firm doesn't publish a fixed rate`;
  });
  const champRows = /<tr class="champ">/.test(body);
  const priceNotes = [ak, bk].filter((k) => PRICE_NOTE[k]).map((k) => `<p class="table-note">${esc(PRICE_NOTE[k])}</p>`).join('');
  return `<div class="table-wrap"><table class="data"><thead><tr><th scope="col">Plan</th><th scope="col">Billing</th>${sizes.map((s) => `<th scope="col">${s}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>` +
    `<p class="table-note">${esc(discounts.join('. '))}. ${champRows ? '"With CHAMP" rows are our arithmetic on that rate; the' : 'The'} checkout price is what counts.</p>` + priceNotes;
}

/* ---------- link blocks (computed from the files on disk) ---------- */
function diskPages() {
  const dir = path.join(ROOT, 'vs');
  return fs.readdirSync(dir).filter((f) => f.endsWith('.html') && f !== 'index.html').sort().map((f) => {
    const html = fs.readFileSync(path.join(dir, f), 'utf8');
    const m = html.match(/window\.PROPCHAMPS_VS\s*=\s*\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/);
    if (!m) return null;
    const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
    const meta = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
    const mod = (html.match(/"dateModified":"(\d{4}-\d{2}-\d{2})"/) || [])[1] || MODIFIED;
    return { file: 'vs/' + f, vsSlug: f.replace(/\.html$/, ''), pair: [m[1], m[2]], h1: plain(h1), meta: decode(meta), dateModified: mod };
  }).filter(Boolean);
}

function card(href, label) {
  return `<a class="more-card" href="${attr(href)}"><span>${esc(label)}</span><span class="arr">→</span></a>`;
}

function relatedHTML(vsSlug, ak, bk, disk) {
  const idx = (k) => ORDER.indexOf(k);
  const other = (p, k) => (p.pair[0] === k ? p.pair[1] : p.pair[0]);
  const seen = new Set([vsSlug]);
  const out = [];
  for (const k of [ak, bk]) {
    disk.filter((p) => !seen.has(p.vsSlug) && p.pair.includes(k))
      .sort((x, y) => idx(other(x, k)) - idx(other(y, k)))
      .forEach((p) => { seen.add(p.vsSlug); out.push(card('/vs/' + p.vsSlug, shortName(p.pair[0]) + ' vs ' + shortName(p.pair[1]))); });
  }
  if (exists('vs/index.html')) out.push(card('/vs/', 'All prop firm comparisons'));
  out.push(card('/compare', `Compare all ${ORDER.length} firms side by side`));
  return '\n' + out.map((x) => '      ' + x).join('\n') + '\n    ';
}

const SUBPAGES = [
  ['payout-rules', (n) => `${n} payout rules`],
  ['which-account-is-best', (n) => `Which ${n} account is best?`],
  ['promo-code', (n) => `${n} promo code`],
];
function subpages(k) {
  const dir = path.join(ROOT, 'firms', REVIEW_SLUG[k] || k);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html') && f !== 'index.html');
  const rank = (f) => { const i = SUBPAGES.findIndex((s) => s[0] + '.html' === f); return i < 0 ? 99 : i; };
  return files.sort((x, y) => rank(x) - rank(y) || x.localeCompare(y)).map((f) => {
    const slug = f.replace(/\.html$/, '');
    const known = SUBPAGES.find((s) => s[0] === slug);
    let label = known ? known[1](FIRMS[k].name) : '';
    if (!label) label = plain((fs.readFileSync(path.join(dir, f), 'utf8').match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || slug.replace(/-/g, ' '));
    return [reviewPath(k) + '/' + slug, label];
  });
}

const GUIDES = [
  ['/blog/apex-drawdown-explained', 'Apex trailing drawdown explained', (ks) => ks.includes('apex-trader')],
  ['/blog/prop-firm-drawdown-explained', 'Trailing drawdown: EOD vs intraday'],
  ['/blog/prop-firm-consistency-rules', 'Consistency rules at every firm'],
  ['/tools/prop-firm-consistency-calculator', 'Consistency rule calculator'],
  ['/blog/prop-firm-payout-caps', 'Payout caps at every futures firm'],
  ['/blog/how-prop-firm-payouts-work', 'How prop firm payouts work'],
  ['/blog/prop-firm-news-trading-rules', 'News trading rules by firm'],
  ['/blog/how-many-prop-firm-accounts-can-you-have', 'How many accounts you can run'],
  ['/blog/what-is-a-daily-loss-limit', 'Daily loss limits explained'],
];
function deeperHTML(ak, bk) {
  const out = [];
  for (const k of [ak, bk]) {
    out.push(card(reviewPath(k), FIRMS[k].name + ' review'));
    subpages(k).forEach(([href, label]) => out.push(card(href, label)));
  }
  GUIDES.filter((g) => (!g[2] || g[2]([ak, bk])) && urlExists(g[0])).slice(0, 7).forEach((g) => out.push(card(g[0], g[1])));
  return '\n' + out.map((x) => '      ' + x).join('\n') + '\n    ';
}

/* ---------- fill pass ---------- */
function setBlock(html, name, content, file) {
  const re = new RegExp(`<!--g:${name}-->[\\s\\S]*?<!--/g:${name}-->`, 'g');
  if (!re.test(html)) return html;
  if (content == null) { console.warn(`  ! ${file}: <!--g:${name}--> has no spec — left empty`); content = ''; }
  return html.replace(re, () => `<!--g:${name}-->${content}<!--/g:${name}-->`);
}

function ensureMarkers(html) {
  html = html.replace(/<div class="vs-firms" id="vsFirms"><\/div>/, '<div class="vs-firms" id="vsFirms"><!--g:firms--><!--/g:firms--></div>');
  html = html.replace(/<div id="vsMatrix"><\/div>\s*<div class="matrix-note" id="vsMatrixNote"><\/div>/, '<!--g:matrix--><!--/g:matrix-->');
  return html;
}

function syncSchema(html) {
  const faqs = [];
  const re = /<details class="faq-item"><summary class="faq-q">([\s\S]*?)<span class="faq-toggle-icon">\+<\/span><\/summary>\s*<div class="faq-a">([\s\S]*?)<\/div>\s*<\/details>/g;
  let m;
  while ((m = re.exec(html))) faqs.push({ '@type': 'Question', name: plain(m[1]), acceptedAnswer: { '@type': 'Answer', text: plain(m[2]) } });
  return html.replace(/(<script type="application\/ld\+json">\s*)([\s\S]*?)(\s*<\/script>)/, (all, open, json, close) => {
    const data = JSON.parse(json);
    for (const g of data['@graph'] || []) {
      if (g['@type'] === 'FAQPage' && faqs.length) g.mainEntity = faqs;
      if (g['@type'] === 'BreadcrumbList' && exists('vs/index.html') && g.itemListElement[1]) {
        g.itemListElement[1] = { '@type': 'ListItem', position: 2, name: 'Comparisons', item: SITE + '/vs/' };
      }
    }
    return open + JSON.stringify(data) + close;
  });
}

function condLinks(html) {
  return html.replace(/<(a|span)( href="[^"]*")? data-pc-link="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g, (all, tag, href, url, rest, text) =>
    urlExists(url) ? `<a href="${url}" data-pc-link="${url}"${rest}>${text}</a>` : `<span data-pc-link="${url}"${rest}>${text}</span>`);
}

function fillPage(html, file, disk) {
  const m = html.match(/window\.PROPCHAMPS_VS\s*=\s*\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/);
  if (!m) return html;
  const [ak, bk] = [m[1], m[2]];
  const A = FIRMS[ak], B = FIRMS[bk];
  if (!A || !B) throw new Error(`${file}: unknown firm in PROPCHAMPS_VS`);
  const vsSlug = path.basename(file, '.html');
  const spec = TABLES[vsSlug] || {};
  html = ensureMarkers(html);
  html = setBlock(html, 'firms', PCVS.firmsHTML(A, B), file);
  html = setBlock(html, 'matrix', `<div id="vsMatrix">${PCVS.matrixHTML(A, B)}</div><div class="matrix-note" id="vsMatrixNote">${esc(PCVS.noteText(A, B))}</div>`, file);
  html = setBlock(html, 'rules', spec.plans ? rulesTable(spec.plans, ak, bk) : null, file);
  html = setBlock(html, 'payouts', spec.plans ? payoutsTable(spec.plans, ak, bk) : null, file);
  html = setBlock(html, 'prices', spec.prices ? pricesTable(spec.prices, ak, bk, spec) : null, file);
  html = setBlock(html, 'related', relatedHTML(vsSlug, ak, bk, disk), file);
  html = setBlock(html, 'deeper', deeperHTML(ak, bk), file);
  html = html.replace(/<img data-vs-logo="(a|b)"[^>]*>/g, (all, s) => { const F = s === 'a' ? A : B; return `<img data-vs-logo="${s}" src="${attr(F.logo)}" alt="${attr(F.name)} logo" width="38" height="38">`; });
  html = html.replace(/<a class="vs-cta" data-vs-cta="(a|b)"[^>]*>[\s\S]*?<\/a>/g, (all, s) => PCVS.ctaHTML(s, s === 'a' ? A : B));
  html = condLinks(html);
  html = syncSchema(html);
  return html;
}

/* Keep what pc-build injected into an existing file (head assets, chrome, footer, icon versions). */
function carryChrome(html, old) {
  if (!old) return html;
  for (const [open, close] of [['<!-- pc:head', '<!-- /pc:head -->'], ['<!-- pc:chrome', '<!-- /pc:chrome -->'], ['<!-- pc:footer', '<!-- /pc:footer -->']]) {
    const a = old.indexOf(open), b = old.indexOf(close);
    const x = html.indexOf(open), y = html.indexOf(close);
    if (a < 0 || b < 0 || x < 0 || y < 0) continue;
    html = html.slice(0, x) + old.slice(a, b + close.length) + html.slice(y + close.length);
  }
  const v = old.match(/favicon-32x32\.png\?v=([0-9a-f]+)/);
  if (v) html = html.replace(/(\/(?:favicon-16x16|favicon-32x32|favicon-48x48|apple-touch-icon|icon-192|icon-512)\.png)(?=")/g, `$1?v=${v[1]}`);
  return html;
}

/* ============================================================
   PAGE TEMPLATE
   ============================================================ */
const HEAD_ICONS = `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0b0b12">`;
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">`;

function metaTags({ title, desc, ogTitle, ogDesc, url, type }) {
  return `<title>${esc(titleTag(title))}</title>
<meta name="description" content="${attr(desc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="PropChamps">
<meta property="og:title" content="${attr(ogTitle || title)}">
<meta property="og:description" content="${attr(ogDesc || desc)}">
<meta property="og:type" content="${type || 'article'}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="PropChamps — Independent prop firm research">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/og-image.jpg">
<meta name="twitter:title" content="${attr(ogTitle || title)}">
<meta name="twitter:description" content="${attr(ogDesc || desc)}">`;
}

function page(c) {
  const A = FIRMS[c.a], B = FIRMS[c.b];
  const nameA = c.nameA || A.name, nameB = c.nameB || B.name;
  const url = `${SITE}/vs/${c.vsSlug}`;
  const published = c.datePublished || PUBLISHED;
  const modified = c.dateModified || MODIFIED;
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', '@id': url + '#article', headline: c.title, description: c.metaDesc, image: SITE + '/og-image.jpg', datePublished: published, dateModified: modified, inLanguage: 'en', author: { '@type': 'Organization', name: 'PropChamps', url: SITE }, publisher: { '@type': 'Organization', name: 'PropChamps', url: SITE, logo: { '@type': 'ImageObject', url: SITE + '/logos/pc-logo.png' } }, about: [{ '@type': 'Organization', name: A.name }, { '@type': 'Organization', name: B.name }], mainEntityOfPage: { '@type': 'WebPage', '@id': url } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Comparisons', item: SITE + '/vs/' }, { '@type': 'ListItem', position: 3, name: nameA + ' vs ' + nameB }] },
    { '@type': 'FAQPage', '@id': url + '#faq', mainEntity: [] },
  ] };
  const bullets = (arr) => arr.map((x) => `<li>${x}</li>`).join('');
  const nav = [['verdict', 'The verdict'], ['comparison', 'Side by side'], ['plans', 'Plan by plan'], ['price', 'Price'], ['payouts', 'Payouts'],
    ...(c.extra || []).map((x) => [x.id, x.nav]), ['pick', 'Which to pick'], ['faq', 'FAQ']];
  const block = (id, eyebrow, h2, inner, cls) => `<section class="block${cls ? ' ' + cls : ''}" id="${id}">
  <div class="container">
    <div class="section-eyebrow">${eyebrow}</div>
    <h2 class="section-h2">${h2}</h2>
${inner}
  </div>
</section>`;
  const prose = (html) => (html ? `    <div class="block-prose">${html}</div>\n` : '');
  const after = (html) => (html ? `    <div class="block-prose after-table">${html}</div>\n` : '');
  const keyDiffs = c.keyDiffs ? `\n      <ul class="keydiffs">${c.keyDiffs.map(([k, v]) => `<li><b>${k}</b><span>${v}</span></li>`).join('')}</ul>` : '';
  const matchups = c.plans.matchups ? `    <div class="matchups">\n${c.plans.matchups.map((x) => `      <div class="matchup"><h3>${x.t}</h3><p class="matchup-tag">${x.tag}</p><p>${x.d}</p></div>`).join('\n')}\n    </div>\n` : '';
  const faqHtml = c.faq.map((f) => `      <details class="faq-item"><summary class="faq-q">${esc(f.q)} <span class="faq-toggle-icon">+</span></summary>\n        <div class="faq-a">${f.a}</div>\n      </details>`).join('\n');
  const extra = (c.extra || []).map((x) => block(x.id, x.eyebrow, x.h2, prose(x.html))).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${HEAD_ICONS}
${metaTags({ title: c.title, desc: c.metaDesc, ogDesc: c.ogDesc, url })}
<script type="application/ld+json">
${JSON.stringify(schema)}
</script>
${FONTS}
<link rel="stylesheet" href="/vs/vs.css">
<!-- pc:head --><!-- /pc:head -->
</head>
<body>
<!-- pc:chrome --><!-- /pc:chrome -->

<section class="hero">
  <div class="bg-stack"></div>
  <div class="container">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a data-pc-link="/vs/">Comparisons</a><span aria-hidden="true">/</span><span>${esc(shortName(c.a))} vs ${esc(shortName(c.b))}</span></nav>
    <div class="hero-eyebrow">Head-to-head · ${YEAR}</div>
    <h1>${esc(nameA)} <span class="vs">vs</span> ${esc(nameB)}</h1>
    <p class="hero-sub">${esc(c.heroSub)}</p>
    <p class="hero-meta">Updated ${fmtDate(modified)} · <a href="/methodology">How we audit</a> · <a href="/audit-log">Rule changes</a></p>
    <div class="vs-firms" id="vsFirms"><!--g:firms--><!--/g:firms--></div>
  </div>
</section>

<nav class="section-nav" id="sectionNav" aria-label="On this page">
  <div class="container">
    <span class="section-nav-label">Jump to</span>
${nav.map(([id, label]) => `    <a class="section-nav-link" href="#${id}">${esc(label)}</a>`).join('\n')}
  </div>
</nav>

<section class="block verdict" id="verdict">
  <div class="container">
    <div class="verdict-wrap">
      <div class="section-eyebrow">The bottom line</div>
      <h2 class="section-h2">The short version.</h2>
${c.verdict.map((p) => `      <p>${p}</p>`).join('\n')}
      <div class="verdict-callout">
        <div class="verdict-callout-label">In one line</div>
        <p>${c.callout}</p>
      </div>${keyDiffs}
    </div>
  </div>
</section>

${block('comparison', 'Side by side', `${esc(nameA)} vs ${esc(nameB)}, compared.`, `    <p class="section-intro">${c.matrixIntro || "Each firm's headline plan, row by row. Highlighted rows are where the two differ; the plan-by-plan tables below cover every account type."}</p>
    <div class="matrix-wrap"><!--g:matrix--><!--/g:matrix--></div>`)}

${block('plans', 'Plan by plan', c.plans.h2, prose(c.plans.intro) + matchups + `    <!--g:rules--><!--/g:rules-->\n` + after(c.plans.after))}

${block('price', 'Cost', c.prices.h2, prose(c.prices.intro) + `    <!--g:prices--><!--/g:prices-->\n` + after(c.prices.after))}

${block('payouts', 'Getting paid', c.payouts.h2, prose(c.payouts.intro) + `    <!--g:payouts--><!--/g:payouts-->\n` + after(c.payouts.after))}
${extra ? '\n' + extra + '\n' : ''}
<section class="block" id="pick">
  <div class="container">
    <div class="section-eyebrow">Make the call</div>
    <h2 class="section-h2">Which one should you pick?</h2>
    <p class="section-intro">${c.pickIntro}</p>
    <div class="pick-grid">
      <div class="pick-card">
        <div class="pick-card-head"><img data-vs-logo="a" src="" alt=""><div><h3 data-vs-name="a">${esc(A.name)}</h3><div class="pick-tag">${esc(c.pickA.tag)}</div></div></div>
        <ul class="pick-list">${bullets(c.pickA.bullets)}</ul>
        <a class="vs-cta" data-vs-cta="a" href="#">Get ${esc(A.name)} deal</a>
      </div>
      <div class="pick-card">
        <div class="pick-card-head"><img data-vs-logo="b" src="" alt=""><div><h3 data-vs-name="b">${esc(B.name)}</h3><div class="pick-tag">${esc(c.pickB.tag)}</div></div></div>
        <ul class="pick-list">${bullets(c.pickB.bullets)}</ul>
        <a class="vs-cta" data-vs-cta="b" href="#">Get ${esc(B.name)} deal</a>
      </div>
    </div>
  </div>
</section>

<section class="block" id="faq">
  <div class="container">
    <div class="section-eyebrow">Frequently asked</div>
    <h2 class="section-h2">${esc(nameA)} vs ${esc(nameB)}: quick answers.</h2>
    <div class="faq-list">
${faqHtml}
    </div>
  </div>
</section>

<section class="block" id="more">
  <div class="container">
    <div class="section-eyebrow">Keep comparing</div>
    <h2 class="section-h2">More head-to-heads.</h2>
    <div class="more-grid"><!--g:related--><!--/g:related--></div>
  </div>
</section>

<section class="block" id="deeper">
  <div class="container">
    <div class="section-eyebrow">Go deeper</div>
    <h2 class="section-h2">Reviews, rules and guides.</h2>
    <div class="deeper-grid"><!--g:deeper--><!--/g:deeper--></div>
  </div>
</section>

<section class="cta-band">
  <div class="container">
    <div class="cta-card">
      <h2>Read the full reviews.</h2>
      <p>Check each firm's full rulebook and current pricing before you buy, or line them up against the rest of the field.</p>
      <div class="cta-row">
        <a class="btn-primary" href="${reviewPath(c.a)}">${esc(A.name)} review</a>
        <a class="btn-ghost" href="${reviewPath(c.b)}">${esc(B.name)} review</a>
      </div>
    </div>
  </div>
</section>

<!-- pc:footer --><!-- /pc:footer -->

<script>window.PROPCHAMPS_VS = ["${c.a}","${c.b}"];</script>
<script src="/data/firms.js"></script>
<script src="/vs/vs.js"></script>
</body>
</html>
`;
}

/* ============================================================
   HUB — vs/index.html
   ============================================================ */
function hubPage(disk) {
  const url = SITE + '/vs/';
  const byPair = new Map();
  for (const p of disk) { byPair.set(p.pair[0] + '|' + p.pair[1], p); byPair.set(p.pair[1] + '|' + p.pair[0], p); }
  const total = (ORDER.length * (ORDER.length - 1)) / 2;
  const built = disk.filter((p) => ORDER.includes(p.pair[0]) && ORDER.includes(p.pair[1])).length;
  const title = 'Prop Firm Comparisons: Every Head-to-Head';
  const desc = 'Every futures prop firm head-to-head we publish, pair by pair: Apex, Tradeify, Lucid, Alpha, MFF, Take Profit Trader, FundedNext and Top One.';
  const head = ORDER.map((k) => `<th scope="col">${esc(shortName(k))}</th>`).join('');
  const rows = ORDER.map((r) => `<tr><th scope="row">${esc(shortName(r))}</th>` + ORDER.map((c) => {
    if (r === c) return '<td class="self" aria-label="same firm"></td>';
    const p = byPair.get(r + '|' + c);
    return p ? `<td><a href="/vs/${p.vsSlug}" aria-label="${attr(shortName(p.pair[0]) + ' vs ' + shortName(p.pair[1]))}">Compare</a></td>` : '<td class="none" aria-label="not covered yet">·</td>';
  }).join('') + '</tr>').join('\n');
  const groups = ORDER.map((k) => {
    const mine = disk.filter((p) => p.pair.includes(k)).sort((x, y) => ORDER.indexOf(x.pair[0] === k ? x.pair[1] : x.pair[0]) - ORDER.indexOf(y.pair[0] === k ? y.pair[1] : y.pair[0]));
    const blurb = (m) => m.replace(/\s+(?:Rules and our pick|Our pick|Side by side|Compared)\.$/, '');
    const cards = mine.map((p) => `        <a class="hub-card" href="/vs/${p.vsSlug}"><b>${esc(p.h1)}</b><span>${esc(blurb(p.meta))}</span></a>`);
    if (!mine.length) cards.push(`        <a class="hub-card muted" href="${reviewPath(k)}"><b>No head-to-head yet</b><span>Read the full ${esc(FIRMS[k].name)} review, or line it up against every firm on the comparison chart.</span></a>`);
    return `    <div class="hub-group" id="${vsSlugOf(k)}">
      <h3><img src="${attr(FIRMS[k].logo)}" alt="" width="32" height="32">${esc(FIRMS[k].name)} <small>${mine.length} comparison${mine.length === 1 ? '' : 's'}</small></h3>
      <div class="hub-cards">
${cards.join('\n')}
      </div>
    </div>`;
  }).join('\n');
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: 'en', isPartOf: { '@type': 'WebSite', name: 'PropChamps', url: SITE }, dateModified: disk.reduce((m, p) => (p.dateModified > m ? p.dateModified : m), MODIFIED),
      mainEntity: { '@type': 'ItemList', numberOfItems: disk.length, itemListElement: disk.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.h1, url: `${SITE}/vs/${p.vsSlug}` })) } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Comparisons' }] },
  ] };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${HEAD_ICONS}
${metaTags({ title, desc, url, type: 'website' })}
<script type="application/ld+json">
${JSON.stringify(schema)}
</script>
${FONTS}
<link rel="stylesheet" href="/vs/vs.css">
<!-- pc:head --><!-- /pc:head -->
</head>
<body>
<!-- pc:chrome --><!-- /pc:chrome -->

<section class="hero">
  <div class="bg-stack"></div>
  <div class="container">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span>Comparisons</span></nav>
    <div class="hero-eyebrow">Head-to-heads · ${YEAR}</div>
    <h1>Prop firm comparisons</h1>
    <p class="hero-sub">Every head-to-head we publish between the ${ORDER.length} futures prop firms we audit. Each one compares the plans, prices, payout rules and caps side by side, with the numbers taken from our firm database.</p>
    <div class="hub-stats"><span class="hub-stat"><b>${built}</b> of ${total} pairs covered</span><span class="hub-stat"><b>${ORDER.length}</b> firms audited</span><span class="hub-stat">Updated <b>${fmtDate(MODIFIED)}</b></span></div>
  </div>
</section>

<section class="block" id="matrix">
  <div class="container">
    <div class="section-eyebrow">Find a matchup</div>
    <h2 class="section-h2">Every pair, at a glance.</h2>
    <p class="section-intro">Pick a firm on the left and a rival along the top. Pairs we haven't written up yet are marked with a dot; you can still line any firms up on the <a href="/compare" style="color:var(--lime-text);border-bottom:1px solid var(--border-lime)">comparison chart</a>.</p>
    <div class="table-wrap"><table class="pairs"><thead><tr><th scope="col"><span class="faint">Firm</span></th>${head}</tr></thead><tbody>
${rows}
</tbody></table></div>
  </div>
</section>

<section class="block" id="by-firm">
  <div class="container">
    <div class="section-eyebrow">By firm</div>
    <h2 class="section-h2">Comparisons by firm.</h2>
${groups}
  </div>
</section>

<section class="cta-band">
  <div class="container">
    <div class="cta-card">
      <h2>Comparing more than two?</h2>
      <p>The comparison chart lines up every plan at every firm we cover, or start with the ranked list of firms.</p>
      <div class="cta-row">
        <a class="btn-primary" href="/compare">Open the comparison chart</a>
        <a class="btn-ghost" href="/firms/">See every firm</a>
      </div>
    </div>
  </div>
</section>

<!-- pc:footer --><!-- /pc:footer -->
</body>
</html>
`;
}

/* ============================================================
   CONFIGS — generated pages (bespoke prose; numbers from data/firms.js)
   Prose may use <a data-pc-link="/path">…</a> for links to pages that may not exist yet.
   ============================================================ */
const CONFIGS = [
  /* ---------------- WAVE 1 (P0) ---------------- */
  {
    vsSlug: 'lucid-trading-vs-tradeify', a: 'lucid-trading', b: 'tradeify', wave: 1, datePublished: '2026-10-23',
    title: 'Lucid Trading vs Tradeify (2026): Which Futures Firm Wins?',
    metaDesc: 'Lucid Pro, Flex, Daily & Direct vs Tradeify Growth, Select & Lightning: daily loss limits, consistency, payout caps, daily payouts and prices compared.',
    ogDesc: 'Plan by plan: Lucid Pro, Flex, Daily and Direct vs Tradeify Growth, Select and Lightning.',
    heroSub: 'Both pay 90/10, both use end-of-day drawdown on most plans, and each has a daily-payout plan and a no-evaluation plan. The differences are in the daily loss limit, the consistency rules, the payout caps and how you pay.',
    verdict: [
      `<strong>Lucid Trading</strong> is the more configurable of the two. The daily loss limit is optional on Pro, Flex and Daily, the Pro evaluation has no consistency rule (so it can be passed in a day), and LucidDaily lets you request a payout every day with no per-payout cap above the buffer. Lucid's evaluations have free activation. The trade-offs: funded Pro accounts check 40% consistency, LucidDaily's funded drawdown is intraday and red-folder news is a hard breach there, and you can hold at most 5 funded accounts per household across every Lucid type.`,
      `<strong>Tradeify</strong> is the simpler buy. Every plan is a one-time payment with no activation fee, and the Select evaluation has no daily loss limit. Once you pass Select you choose Daily payouts (capped at $600 to $2,500 per payout) or Flex (no DLL, capped at $1,250 to $4,500, paid on a 5-day cycle). Growth has no evaluation consistency rule but does have a DLL and a 35% funded rule. Tradeify publishes a $350M+ payout total; we haven't been able to verify Lucid's figure yet.`,
    ],
    callout: 'Want an <strong>optional daily loss limit</strong> and <strong>daily payouts with no per-payout cap</strong>? Lucid. Want <strong>one-time pricing with no activation fee</strong> and a <strong>no-DLL evaluation</strong>? Tradeify Select.',
    keyDiffs: [
      ['Daily loss limit', 'Lucid: optional on Pro, Flex and Daily; Direct has one from 50K. Tradeify: Growth has one at every size; Select has none in the evaluation or on the Flex path.'],
      ['Consistency', 'Lucid Pro: none in the evaluation, 40% funded. Tradeify Growth: none in the evaluation, 35% funded. Lucid Flex and Tradeify Select: 40% in the evaluation, none funded.'],
      ['Daily payouts', 'LucidDaily: no per-payout cap above the buffer. Tradeify Select Daily: $600 to $2,500 per payout.'],
      ['No evaluation', 'Lucid Direct and Tradeify Lightning: the same first-payout profit goals and the same caps for payouts 1-3.'],
      ['Price at 50K', 'Lucid Pro $115.40 with CHAMP at our last check. Tradeify Growth $145 list, one-time, before CHAMP.'],
      ['Platforms', 'Lucid: Tradovate, NinjaTrader, TradingView, TradeSea, MotiveWave, Quantower and six more CQG/Rithmic platforms. Tradeify: Tradovate, WealthCharts and Tradesea / Rithmic.'],
    ],
    plans: {
      h2: 'Plan by plan: which Lucid account matches which Tradeify account?',
      intro: '<p>Each firm sells four ways in, and they pair up neatly. The cards match them; the tables below give every plan\'s rules and payouts by size.</p>',
      matchups: [
        { t: 'Lucid Pro <span class="v">vs</span> Tradeify Growth', tag: '1-day-pass evaluations', d: 'Neither checks consistency in the evaluation. Pro\'s DLL is optional (none at 25K); Growth has one at every size ($600 to $3,750). Once funded, Pro checks 40% consistency and Growth 35%. Pro\'s 25K target is lower ($1,250 vs $1,500); Growth gives more drawdown at 100K and 150K ($3,500 and $5,000 vs $3,000 and $4,500).' },
        { t: 'Lucid Flex <span class="v">vs</span> Tradeify Select Flex', tag: 'No consistency rule once funded', d: 'Both evaluations check 40% consistency (each firm sells a 50% add-on) and neither checks it once funded. Lucid Flex pays after 5 profit days, 50% of profit up to $1,000 to $3,000, for up to 5 payouts before moving you live. Select Flex has no DLL in the evaluation or when funded and caps each payout at $1,250 to $4,500.' },
        { t: 'LucidDaily <span class="v">vs</span> Tradeify Select Daily', tag: 'Daily payouts', d: 'LucidDaily lets you request daily once your profit clears the buffer, with no per-payout cap; reaching the max daily sim profit ($6K to $12K) moves you live. Its funded drawdown is intraday. Select Daily caps each payout at $600 to $2,500, adds a funded DLL ($500 to $1,750) and keeps end-of-day drawdown.' },
        { t: 'Lucid Direct <span class="v">vs</span> Tradeify Lightning', tag: 'No evaluation', d: 'Almost the same design: a $1,500 / $3,000 / $6,000 / $9,000 profit goal before the first payout, 20% consistency to start (Lightning rises to 25%, then 30%), and the same caps for payouts 1-3. Lightning\'s minimum request is $1,000 against Lucid\'s $500, and it gives a little more drawdown at 100K and 150K.' },
      ],
    },
    prices: {
      h2: 'Lucid Trading vs Tradeify price',
      intro: '<p><strong>Tradeify is one-time on every plan, with no activation fee.</strong> Its prices below are list prices; code CHAMP is applied at checkout. Lucid\'s prices are the CHAMP prices we saw at our last check, so they already include the discount. Lucid\'s evaluations (Pro, Flex and Daily) have free activation, and LucidDaily is priced at checkout because you configure it.</p>',
      after: '<p>At 50K, Lucid Flex ($90.20) and Lucid Pro ($115.40) came in under Tradeify Growth\'s $145 list price, but Tradeify\'s CHAMP discount comes off at checkout and isn\'t published, so compare the final prices; the <a href="/deals">deals page</a> lists both. If you fail, resets cost $60 to $229 on Tradeify Growth and $75 to $239 on Select, against $70 to $245 on Lucid Pro and $50 to $250 on Flex.</p>',
    },
    payouts: {
      h2: 'Lucid vs Tradeify payout rules and caps',
      intro: '<p><strong>Which pays out faster?</strong> On paper, the two daily plans: LucidDaily and Tradeify Select Daily both let you request every day. Lucid\'s other plans have no fixed payout window (you request once the profit goal, profit days or consistency rule is met), while Tradeify\'s Growth, Select Flex and Lightning run on a 5-day cycle. Lucid says approved funds are sent within 2 business days. Both firms pay the trader 90%.</p>',
      after: '<p>Caps rise as you go at both firms: Lucid Pro\'s goes up after the first payout, and Tradeify Growth\'s rises through the fourth (to $5,000 on 150K). LucidDaily has no per-payout cap above the buffer, but reaching the max daily sim profit moves the account live.</p>',
    },
    extra: [{ id: 'limits', nav: 'Accounts & platforms', eyebrow: 'Fine print', h2: 'Account limits, copy trading and platforms', html: '<p><strong>How many accounts?</strong> Lucid allows up to 10 evaluations and 5 funded accounts per household, counting every Lucid type together (for example 3 Direct and 2 Pro), and permits trade copiers. Tradeify allows 5 sim-funded accounts per person and per household in any mix of Growth, Select and Lightning; copying trades across your own accounts is allowed as long as positions don\'t oppose each other, and copying between people isn\'t.</p><p><strong>Platforms.</strong> Lucid runs on Tradovate, NinjaTrader, TradingView, TradeSea, MotiveWave and Quantower, plus six more CQG and Rithmic platforms. Tradeify runs on Tradovate, WealthCharts and Tradesea / Rithmic.</p><p><strong>Trading rules worth knowing.</strong> Lucid requires positions flat by 4:45 PM EST, and LucidDaily treats red-folder news as a hard breach on funded accounts. On Tradeify funded accounts, at least half of your profit must come from trades held longer than 10 seconds, and you must trade at least once per calendar week.</p>' }],
    pickIntro: 'Both pay 90/10 and both have daily-payout and no-evaluation plans. The choice comes down to the daily loss limit, the caps and how you want to pay.',
    pickA: { tag: 'Pick for flexibility + daily payouts', bullets: ['You want the daily loss limit to be optional (Pro, Flex, Daily)', 'You want daily payouts with no per-payout cap above the buffer (LucidDaily)', 'You trade on NinjaTrader, TradingView or another platform Tradeify doesn\'t list', 'You want a lower 25K target ($1,250 on Pro)'] },
    pickB: { tag: 'Pick for one-time pricing + a no-DLL eval', bullets: ['You want one-time pricing and no activation fee on every plan', 'You want an evaluation with no daily loss limit (Select)', 'You want a funded path with no DLL (Select Flex)', 'You want a published payout record ($350M+)'] },
    faq: [
      { q: 'Is Lucid Trading or Tradeify better?', a: 'It depends on the plan. For a 1-day-pass evaluation, <strong>Lucid Pro</strong> makes the DLL optional and has a lower 25K target, while <strong>Tradeify Growth</strong> has the lighter funded consistency rule (35% vs 40%). For daily payouts, LucidDaily has no per-payout cap above the buffer; Tradeify Select Daily caps each payout at $600 to $2,500 but keeps end-of-day drawdown. For no-evaluation accounts, Lucid Direct and Tradeify Lightning are close to identical.' },
      { q: 'Which is cheaper, Lucid or Tradeify?', a: 'At 50K, Lucid Pro was <strong>$115.40 with CHAMP</strong> at our last check and Lucid Flex $90.20; Tradeify Growth lists at <strong>$145 one-time</strong> before CHAMP. Neither charges an activation fee on its evaluations. Tradeify doesn\'t publish a fixed CHAMP rate, so compare the final prices at checkout or on the <a href="/deals">deals page</a>.' },
      { q: 'Which pays out faster, Lucid or Tradeify?', a: 'Both have a daily-payout plan: <strong>LucidDaily</strong> and <strong>Tradeify Select Daily</strong>. On their other plans, Lucid has no fixed payout window (you request once you\'re eligible) and Tradeify runs a 5-day cycle. Lucid says approved funds go out within 2 business days.' },
      { q: 'Does Lucid or Tradeify have a daily loss limit?', a: 'Lucid\'s DLL is <strong>optional</strong> on Pro, Flex and Daily; Direct has one from 50K up. At Tradeify, Growth has a DLL at every size, the Select evaluation and the Select Flex path have none, and Select Daily (funded) and Lightning (50K and up) have one. More in <a href="/blog/what-is-a-daily-loss-limit">daily loss limits explained</a>.' },
      { q: 'Lucid Flex vs Tradeify Growth: which is better?', a: 'They suit different traders. <strong>Lucid Flex</strong> checks 40% consistency in the evaluation and none once funded, and pays 50% of profit (up to $1,000 to $3,000) after 5 profit days. <strong>Tradeify Growth</strong> has no consistency rule in the evaluation but 35% once funded, a DLL at every size, and caps that rise to $1,000 to $5,000 by the fourth payout.' },
      { q: 'Tradeify vs Lucid vs Apex: which should I pick?', a: 'Apex Trader Funding pays 100% of each approved payout every 5 trading days and runs the biggest CHAMP discount (90% off), but it closes a funded account after 6 payouts and checks 50% consistency. Compare it directly in <a href="/vs/apex-trader-funding-vs-lucid-trading">Apex vs Lucid Trading</a> and <a href="/vs/apex-trader-funding-vs-tradeify">Apex vs Tradeify</a>.' },
    ],
  },

  /* ---------------- existing generated pages (wave 1 upgrades) ---------------- */
  {
    vsSlug: 'apex-trader-funding-vs-lucid-trading', a: 'apex-trader', b: 'lucid-trading', wave: 1,
    title: 'Apex vs Lucid Trading (2026): Price, Drawdown, Payouts',
    metaDesc: 'Apex: 90% off with CHAMP, 100% payouts every 5 trading days. Lucid: EOD drawdown on 3 of 4 paths, 90/10, daily payouts on LucidDaily. Rules and our pick.',
    ogDesc: 'Price, drawdown, payout caps and plans compared head-to-head.',
    heroSub: 'Apex keeps none of your approved payouts and runs the biggest CHAMP discount; Lucid pays 90/10 across four plan types, with an optional daily loss limit and a daily-payout plan. Here\'s how they compare, plan by plan.',
    verdict: [
      `<strong>Apex Trader Funding</strong> is the cheapest way in on paper: CHAMP takes 90% off the evaluation, which is a one-time fee with no rebill. Funded accounts (PAs) keep 100% of each approved payout, paid every 5 trading days, with a 50% consistency rule and a per-payout cap that rises over a maximum of 6 payouts. You choose Intraday Trail (no DLL in the evaluation) or EOD Trail (end-of-day drawdown with a $500 to $2,000 DLL); both can pass in a day.`,
      `<strong>Lucid Trading</strong> pays 90/10 but gives you more ways to get paid: Pro and Direct on request once you're eligible (no fixed window), Flex after 5 profit days, and LucidDaily every day with no per-payout cap above the buffer. Pro, Flex and Direct use end-of-day drawdown, the DLL is optional on Pro, Flex and Daily, and the evaluations have free activation. Where Apex closes a PA after 6 payouts, payout 5 puts Lucid Pro and Direct accounts in the live review pool.`,
    ],
    callout: 'Want the <strong>biggest discount and a 100% payout</strong>, and fine with 50% consistency and a 6-payout limit? Apex. Want <strong>end-of-day drawdown, an optional DLL and daily payouts</strong>? Lucid.',
    keyDiffs: [
      ['Split', 'Apex: 100% of each approved payout. Lucid: 90/10 on every plan.'],
      ['Payout timing', 'Apex: every 5 trading days. Lucid: on request (Pro, Direct), after 5 profit days (Flex) or daily (LucidDaily).'],
      ['Funded consistency', 'Apex: 50%. Lucid: Pro 40%, Direct 20%, Flex and Daily none.'],
      ['Drawdown', 'Apex: Intraday Trail or EOD Trail, $1,000 to $4,000. Lucid: end-of-day on Pro, Flex and Direct ($1,000 to $4,500 on Pro).'],
      ['Payouts per account', 'Apex: up to 6 per PA, then it closes. Lucid: payout 5 puts Pro and Direct accounts in the live review pool.'],
      ['Price at 50K', 'Apex Intraday Trail: $249 list, 90% off with CHAMP. Lucid Pro: $115.40 with CHAMP at our last check.'],
    ],
    plans: {
      h2: 'Plan by plan: Apex Intraday and EOD Trail vs Lucid',
      intro: '<p>Apex sells one evaluation in two drawdown styles, each as a Standard build (plus a funded activation fee after you pass) or a No-Activation-Fee build (no activation fee). Lucid sells four plan types. These are the matchups that matter.</p>',
      matchups: [
        { t: 'Apex <span class="v">vs</span> Lucid Pro', tag: '1-day-pass evaluations', d: 'The same 50K target ($3,000) and drawdown ($2,000), and neither checks consistency in the evaluation. Apex\'s 25K target is higher ($1,500 vs $1,250) and its 150K drawdown lower ($4,000 vs $4,500). Funded, Apex checks 50% consistency and pays 100%; Lucid Pro checks 40% and pays 90/10. First-payout caps: Apex $1,000 / $1,500 / $2,000 / $2,500, Lucid Pro $1,000 / $2,000 / $2,500 / $3,000.' },
        { t: 'Intraday or EOD Trail <span class="v">vs</span> Lucid\'s optional DLL', tag: 'The daily loss limit', d: 'Apex makes you choose up front: Intraday Trail has no DLL in the evaluation (a scaling DLL applies once funded) but trails your intraday high; EOD Trail only moves at the close but adds a $500 to $2,000 DLL. Lucid Pro trails end-of-day and lets you switch the DLL on or off at purchase; above the initial trail, the funded DLL scales to 60% of your highest end-of-day profit (LucidScale).' },
        { t: 'Apex <span class="v">vs</span> LucidDaily', tag: 'Daily payouts', d: 'Apex pays every 5 trading days, with 5 qualifying days per payout. LucidDaily lets you request every day once your profit clears the buffer, with no per-payout cap; its funded drawdown is intraday, and red-folder news is a hard breach there.' },
        { t: 'Apex <span class="v">vs</span> Lucid Direct', tag: 'No evaluation', d: 'Apex has no straight-to-funded plan. Lucid Direct starts funded for a one-time price ($230.30 to $585.20 with CHAMP at our last check), with 20% consistency and capped payouts.' },
      ],
    },
    prices: {
      h2: 'Apex vs Lucid Trading price',
      intro: '<p><strong>Apex is a one-time fee, and CHAMP takes 90% off the evaluation.</strong> The Standard build adds a funded (PA) activation fee after you pass, which coupons don\'t cover and which we couldn\'t verify this month; the No-Activation build has no activation fee and usually costs more up front. Lucid\'s prices below are the CHAMP prices we saw at our last check, with free activation on the evaluations.</p>',
      after: '<p>At 50K, 90% off would make Apex\'s Intraday Trail $24.90 (Standard, plus the activation fee) or $49 (No-Activation), against $115.40 for Lucid Pro. Apex evaluations have no resets (an evaluation stays active for 30 days); Lucid Pro resets cost $70 to $245.</p>',
    },
    payouts: {
      h2: 'Apex vs Lucid payout rules and caps',
      intro: '<p><strong>Which pays out faster?</strong> LucidDaily, if you mean frequency: you can request every day. Apex pays every 5 trading days, and each payout needs 5 qualifying days. Lucid Pro and Direct have no fixed window; you request once you\'re eligible, and Lucid sends approved funds within 2 business days. Apex pays you 100% of an approved payout; Lucid pays 90%.</p>',
      after: '<p>Apex\'s cap rises over the life of a PA, from $1,000 to $2,500 on the first payout to $1,000 to $5,000 by the sixth, and the PA closes after 6 payouts. Lucid Pro\'s cap rises after the first payout (to $1,500 to $3,500), and Lucid Direct\'s after the third.</p>',
    },
    pickIntro: 'It comes down to Apex\'s discount and 100% payout versus Lucid\'s end-of-day drawdown, optional DLL and payout frequency.',
    pickA: { tag: 'Pick for the discount + 100% payout', bullets: ['You want the biggest CHAMP discount (90% off the evaluation)', 'You want 100% of each approved payout', 'You want to choose Intraday or EOD trailing drawdown', 'You run many accounts (up to 20 PAs)'] },
    pickB: { tag: 'Pick for flexibility + daily payouts', bullets: ['You want daily payouts (LucidDaily)', 'You want the daily loss limit to be optional', 'You want end-of-day drawdown without a required DLL (Pro, Flex)', 'You want a straight-to-funded option (Direct)'] },
    faq: [
      { q: 'Which is cheaper, Apex or Lucid?', a: 'Apex, on list price with CHAMP: 90% off a 50K Intraday Trail evaluation ($249 list) is <strong>$24.90</strong> by our math, or $49 on the No-Activation build. Lucid Pro 50K was <strong>$115.40</strong> with CHAMP at our last check. Apex\'s Standard build adds a funded activation fee after you pass, which the coupon doesn\'t cover; Lucid\'s evaluations have free activation. Confirm both on the <a href="/deals">deals page</a>.' },
      { q: 'Which lets you keep more of your profit?', a: 'Apex pays <strong>100%</strong> of each approved payout; Lucid pays <strong>90%</strong>. But Apex caps each payout on a rising ladder, closes a PA after 6 payouts and checks 50% consistency, while Lucid\'s caps and rules vary by plan and LucidDaily has no per-payout cap above the buffer.' },
      { q: 'Which pays out faster, Apex or Lucid?', a: '<strong>LucidDaily</strong> lets you request every day. Apex pays every 5 trading days. Lucid Pro and Direct have no fixed window, and Lucid sends approved funds within 2 business days.' },
      { q: 'How do their drawdowns differ?', a: 'Apex makes you pick <strong>Intraday Trail</strong> (no DLL in the evaluation) or <strong>EOD Trail</strong> (with a $500 to $2,000 DLL), $1,000 to $4,000 by size. Lucid trails end-of-day on Pro, Flex and Direct; LucidDaily lets you choose in the evaluation and trails intraday once funded. More: <a href="/blog/apex-drawdown-explained">Apex trailing drawdown explained</a>.' },
      { q: 'Can you trade news on Apex or Lucid?', a: 'Apex allows trading through news with your normal strategy, but not news-only or straddle strategies or hedging, and positions must be flat by the close. Lucid allows news on Pro, Flex and Direct; LucidDaily makes red-folder news a hard breach once funded. See <a href="/blog/prop-firm-news-trading-rules">news trading rules by firm</a>.' },
      { q: 'Apex vs Lucid vs Tradeify: which should I pick?', a: 'Tradeify sits between them: one-time pricing with no activation fee, 90/10 like Lucid, a Select evaluation with no DLL, and daily payouts on Select Daily (capped at $600 to $2,500). Compare them in <a data-pc-link="/vs/lucid-trading-vs-tradeify">Lucid Trading vs Tradeify</a> and <a href="/vs/apex-trader-funding-vs-tradeify">Apex vs Tradeify</a>.' },
      { q: 'Which Lucid account is closest to Apex?', a: '<strong>Lucid Pro</strong>: a 1-day-pass evaluation with no evaluation consistency rule, 40% once funded. If you would rather skip the evaluation, Lucid Direct; for daily payouts, LucidDaily. The <a href="/firms/lucid-trading">Lucid Trading review</a> covers all four.' },
    ],
  },
  {
    vsSlug: 'apex-trader-funding-vs-alpha-futures', a: 'apex-trader', b: 'alpha-futures', wave: 1,
    title: 'Apex vs Alpha Futures (2026): One-Time vs Monthly Compared',
    metaDesc: 'Apex: one-time eval, 90% off, 100% payouts every 5 trading days. Alpha: monthly Zero/Standard/Advanced, 90% split, 40% off, no DLL on Advanced. Our pick.',
    ogDesc: 'One-time vs monthly, 100% vs 90%, every 5 trading days vs up to 4 a month.',
    heroSub: 'Apex sells a one-time evaluation at 90% off and pays you 100% of each approved payout; Alpha bills monthly, pays 90%, and lets Advanced accounts withdraw up to $15,000 at a time with no daily loss limit. Here\'s how they stack up.',
    verdict: [
      `<strong>Apex Trader Funding</strong> wins on entry price: CHAMP takes 90% off the evaluation, a one-time fee with no rebill. Funded PAs keep 100% of each approved payout, every 5 trading days, with a 50% consistency rule and a cap that rises from $1,000 to $2,500 on the first payout to $1,000 to $5,000 by the sixth, after which the PA closes. You choose Intraday Trail (no DLL in the evaluation) or EOD Trail ($500 to $2,000 DLL), and both can pass in a day.`,
      `<strong>Alpha Futures</strong> bills Zero, Standard and Advanced monthly until you pass ($0 activation), and Direct once. It pays 90% from the first withdrawal, up to 4 times a month, each after 5 winning days of $200+ and up to 50% of profit, capped at $1,000 to $2,500 (Zero), $3,000 to $5,000 (Standard) or $15,000 per request (Advanced). Advanced has no daily loss limit at any stage and no news restrictions; Zero passes in a day.`,
    ],
    callout: 'Want the <strong>cheapest one-time entry</strong> and 100% payouts? Apex. Want <strong>large withdrawals with no DLL or news limits</strong>? Alpha Advanced.',
    keyDiffs: [
      ['Billing', 'Apex: one-time, no rebill (an evaluation stays active for 30 days). Alpha: monthly until you pass; Direct is one-time.'],
      ['Split', 'Apex: 100% of each approved payout. Alpha: 90% from the first withdrawal.'],
      ['Payout timing', 'Apex: every 5 trading days, up to 6 payouts per PA. Alpha: up to 4 withdrawals a month.'],
      ['Biggest withdrawal', 'Apex: up to $5,000 (150K, sixth payout). Alpha Advanced: $15,000 per request.'],
      ['Daily loss limit', 'Apex Intraday Trail: none in the evaluation (scaling once funded); EOD Trail $500 to $2,000. Alpha Advanced: none; Zero $500 to $2,000.'],
      ['Discount', 'CHAMP: 90% off at Apex, 40% off at Alpha, in our deal data.'],
    ],
    plans: {
      h2: 'Plan by plan: Apex vs Alpha Zero, Standard, Advanced and Direct',
      intro: '<p>Apex sells one evaluation in two drawdown styles; Alpha sells four plans. Here\'s how they line up.</p>',
      matchups: [
        { t: 'Apex <span class="v">vs</span> Alpha Zero', tag: 'One-day passes', d: 'Neither checks consistency in the evaluation, and from 25K to 100K both use the same targets ($1,500 / $3,000 / $6,000) and drawdowns ($1,000 / $2,000 / $3,000). Funded, Apex checks 50% and Zero 40%. Zero has a DLL at both stages ($500 to $2,000); Apex Intraday Trail has none in the evaluation. First-withdrawal caps: Apex $1,000 / $1,500 / $2,000, Zero $1,000 / $1,500 / $2,500.' },
        { t: 'Apex <span class="v">vs</span> Alpha Advanced', tag: 'No daily loss limit', d: 'Advanced has no DLL at either stage and no news restrictions, checks 40% in the evaluation and none once qualified, and allows $15,000 per request. It needs at least 3 evaluation days, higher targets ($4,000 / $8,000 / $12,000) and costs $209 to $489 a month. Apex\'s closest is Intraday Trail: no DLL in the evaluation, but a scaling DLL once funded.' },
        { t: 'Apex EOD Trail <span class="v">vs</span> Alpha Standard', tag: 'End-of-day drawdown', d: 'Both trail end-of-day. EOD Trail has a DLL in the evaluation ($500 to $2,000) and no evaluation consistency rule; Standard has no DLL until qualified ($1,000 to $3,000) but checks 50% in the evaluation and needs 2 days. Standard caps each withdrawal at $3,000 / $4,000 / $5,000 (50K to 150K) from the first; Apex\'s caps start lower and rise over 6 payouts.' },
        { t: 'Apex <span class="v">vs</span> Alpha Direct', tag: 'No evaluation', d: 'Apex has no straight-to-funded plan. Alpha Direct is one-time, $349 to $859 list (40% off with CHAMP), with 20% consistency and caps of $1,000 to $3,000.' },
      ],
    },
    prices: {
      h2: 'Apex vs Alpha Futures price: one-time vs monthly',
      intro: '<p><strong>Apex charges once; Alpha charges monthly until you pass.</strong> CHAMP takes 90% off Apex\'s evaluation and 40% off Alpha\'s in our deal data; both are worked out under the list prices. Apex\'s Standard build adds a funded activation fee after you pass, which coupons don\'t cover and which we couldn\'t verify this month; Alpha\'s activation is $0 on every plan. Alpha also runs its own public codes, so compare the final price at checkout.</p>',
      after: '<p>At 50K, Apex Intraday Trail works out to $24.90 (Standard, plus activation) or $49 (No-Activation) after 90% off; Alpha Zero is $83.40 for the first month after 40% off, and another $83.40 for each month you\'re still in the evaluation. Alpha\'s evaluation resets cost $79 to $249 on Zero; Apex evaluations have no resets.</p>',
    },
    payouts: {
      h2: 'Payouts: 100% every 5 trading days vs 90% up to 4x a month',
      intro: '<p><strong>Which pays more?</strong> Per payout, Apex: 100% of each approved amount, against Alpha\'s 90%. Per month, it depends on caps and timing. Apex pays every 5 trading days, with a cap that starts at $1,000 to $2,500 and rises over a maximum of 6 payouts per PA. Alpha allows up to 4 withdrawals a month, each after 5 winning days of $200+ and up to 50% of profit, with a cap set by plan: $1,000 to $2,500 (Zero), $3,000 to $5,000 (Standard) or $15,000 (Advanced).</p>',
      after: '<p>Minimums: Apex $500; Alpha $200 on Zero, $500 on Standard and Direct, and $1,000 on Advanced. Alpha\'s max loss limit doesn\'t reset when you withdraw.</p>',
    },
    pickIntro: 'It comes down to price and a 100% payout (Apex) versus large withdrawals with fewer rules (Alpha Advanced).',
    pickA: { tag: 'Pick for price + 100% payout', bullets: ['You want the biggest CHAMP discount (90% off)', 'You want to pay once, with no monthly rebill', 'You want 100% of each approved payout', 'You want to choose Intraday or EOD trailing drawdown'] },
    pickB: { tag: 'Pick for rule freedom + big withdrawals', bullets: ['You want to trade news (Advanced has no news restrictions)', 'You want no daily loss limit at any stage (Advanced)', 'You want up to $15,000 per withdrawal (Advanced)', 'You want a no-evaluation option (Direct)'] },
    faq: [
      { q: 'Which has the bigger discount, Apex or Alpha?', a: '<strong>Apex: 90% off</strong> the evaluation with CHAMP, against 40% off at Alpha in our deal data. On a 50K evaluation that works out to $24.90 at Apex (Intraday Trail, Standard) against $83.40 a month at Alpha Zero. Alpha also runs its own public codes; check both on the <a href="/deals">deals page</a>.' },
      { q: 'Is Apex or Alpha one-time or monthly?', a: 'Apex is <strong>one-time</strong>: no rebill, and the evaluation stays active for 30 days. Alpha Zero, Standard and Advanced are <strong>monthly</strong> until you pass (no monthly fee once qualified); Alpha Direct is one-time.' },
      { q: 'Which pays more of your profit?', a: 'Apex pays <strong>100%</strong> of each approved payout but caps it on a ladder and closes the PA after 6 payouts. Alpha pays <strong>90%</strong>, up to 4 times a month, with per-plan caps up to $15,000 on Advanced. Which nets more depends on how much and how often you withdraw.' },
      { q: 'Which is better for news trading?', a: '<strong>Alpha Advanced</strong>, which has no news restrictions. Apex allows trading through news with your normal strategy, but not news-only or straddle strategies or hedging. Alpha Zero, Standard and Direct qualified accounts can hold through news but can\'t have orders execute within 2 minutes of a red-folder event.' },
      { q: 'How do the drawdowns compare?', a: 'Apex offers <strong>Intraday Trail</strong> (no DLL in the evaluation) or <strong>EOD Trail</strong> (with a DLL), $1,000 to $4,000 by size. Alpha uses an end-of-day trailing max loss limit on every plan; Advanced has no DLL at all. More: <a href="/blog/apex-drawdown-explained">Apex trailing drawdown explained</a>.' },
      { q: 'How many accounts can you run at Apex and Alpha?', a: 'Apex: up to 20 funded PAs across a household, with unlimited evaluations. Alpha: 5 qualified accounts on Zero, Standard or Direct, or 3 if you hold any Advanced account, with one individual per household.' },
    ],
  },
  {
    vsSlug: 'fundednext-vs-my-funded-futures', a: 'fundednext', b: 'my-funded-futures', wave: 1, nameA: 'FundedNext Futures',
    title: 'FundedNext vs My Funded Futures (MFFU): 2026 Compared',
    metaDesc: 'FundedNext Flex pays 95% with no DLL; MFF Rapid pays daily at 90/10 with no activation fee. Plans, prices, payout caps and drawdown compared side by side.',
    ogDesc: 'Reward share, payout speed, payout caps and drawdown compared head-to-head.',
    heroSub: 'Both are one-time, multi-plan futures firms with no activation fee. FundedNext\'s Flex pays a 95% split; My Funded Futures counters with daily payouts on Rapid and a ladder to a real live account. Here\'s how they compare.',
    verdict: [
      `<strong>FundedNext Futures</strong> has the standout split: Flex pays <strong>95%</strong>, the highest we track after Apex's 100%, with no daily loss limit and no buffer, but caps each withdrawal at 50% of profit ($1,500 / $2,500 / $4,000) and ends after 5 rewards. Every FundedNext futures account trails end-of-day, news trading is allowed on all of them, and Rapid Daily has no consistency rule at either stage. The $380M+ it publishes covers all FundedNext programs, not just futures.`,
      `<strong>My Funded Futures</strong> is built around speed and a path to the real thing. Rapid pays daily at 90/10 once you clear the buffer, with no stated per-payout cap, but switches to intraday trailing drawdown once funded (it stops trailing at +$100). Builder's five approved sim payouts unlock a real live account at Blue Row Capital. There's no daily loss limit on Rapid, Rapid EOD or Pro (Builder has a soft pause), and MFF bans Tier-1 news on funded Rapid, Rapid EOD and Pro accounts.`,
    ],
    callout: 'Want the <strong>highest split</strong> (95% on Flex) and news trading? FundedNext. Want <strong>daily payouts with no stated cap</strong> and a ladder to a real live account? My Funded Futures.',
    keyDiffs: [
      ['Split', 'FundedNext: Flex 95%, Rapid 90%, Legacy 80%. MFF: 90/10 on Rapid and Rapid EOD, 80/20 on Pro and Builder.'],
      ['Daily payouts', 'FundedNext Rapid Daily: $800 to $2,500 per payout. MFF Rapid and Rapid EOD: no stated cap.'],
      ['Funded drawdown', 'FundedNext: end-of-day on every plan. MFF Rapid: intraday until it locks at +$100; the other MFF plans end-of-day.'],
      ['News', 'FundedNext: allowed on every account. MFF: no Tier-1 news on funded Rapid, Rapid EOD and Pro accounts.'],
      ['Account life', 'FundedNext Flex and Rapid end after 5 rewards (Legacy doesn\'t). MFF Builder leads to a live account after 5 payouts.'],
      ['Sizes', 'FundedNext: up to 150K (Flex) or 100K (Legacy, Rapid). MFF: up to 150K on Rapid, Pro and Builder.'],
    ],
    plans: {
      h2: 'Plan by plan: FundedNext Flex, Legacy and Rapid vs MFF',
      intro: '<p>FundedNext Futures sells Flex, Legacy and two Rapid versions; MFF sells Rapid, Rapid EOD, Pro and Builder. These are the closest matches.</p>',
      matchups: [
        { t: 'FundedNext Rapid Daily <span class="v">vs</span> MFF Rapid', tag: 'Daily payouts', d: 'Rapid Daily passes in a day with no consistency rule at either stage and trails end-of-day, but has a DLL ($500 / $1,000 / $1,250) and caps payouts at $800 / $1,200 / $2,500; it ends after 5 rewards. MFF Rapid needs 2 days and 50% consistency to pass, then has no funded consistency, no DLL and no stated cap, with daily payouts once the buffer is cleared, but its funded drawdown trails intraday.' },
        { t: 'FundedNext Flex <span class="v">vs</span> MFF Rapid EOD', tag: 'End-of-day, no DLL', d: 'Both trail end-of-day when funded and neither has a DLL. Flex pays 95% (50% of profit up to $1,500 to $4,000, after 5 benchmark days) and covers 50K to 150K. Rapid EOD pays 90/10 daily with no cap per payout, but only at 25K and 50K, after a 4-day, 30%-consistency evaluation.' },
        { t: 'FundedNext Rapid Pro <span class="v">vs</span> MFF Builder', tag: 'One-day passes', d: 'Neither checks consistency in the evaluation. Rapid Pro checks 40% once funded, pays 90% every 3 days, caps at $800 to $2,500 and has no DLL. Builder checks 50% at the payout stage, pays 80/20 with a first request 48 hours after your first trade, caps each cycle at $1,000 to $4,500 and has a soft-pause DLL; 5 approved payouts unlock a live account.' },
        { t: 'FundedNext Legacy <span class="v">vs</span> MFF Pro', tag: 'The long-runners', d: 'Legacy (80%, 25K to 100K) removes its 50% limit and cap after 30 benchmark days and doesn\'t end after 5 rewards. MFF Pro (80/20, 50K to 150K) pays every 14 calendar days with a $1,000 minimum, allows up to $100K in sim payouts per user, and reviews you for Live after 3 consecutive payouts or $20K profit.' },
      ],
    },
    prices: {
      h2: 'FundedNext vs My Funded Futures price',
      intro: '<p><strong>Both charge one time, with no activation fee.</strong> FundedNext\'s prices below are its current offer prices (Flex\'s apply to your first 2 purchases, then $84.99 / $159.99 / $289.99); CHAMP is applied at checkout. MFF\'s are list prices before CHAMP, which takes up to 50% off depending on the plan.</p>',
      after: '<p>At 50K, FundedNext Flex is $74.99 at its offer price; MFF Builder lists at $153 and Rapid at $209 before CHAMP. FundedNext Rapid drops to $129.99 at 50K if you add the optional DLL. MFF Rapid resets cost $87 to $347.</p>',
    },
    payouts: {
      h2: 'FundedNext vs MFF payout rules and caps',
      intro: '<p><strong>Which pays out faster?</strong> Both have daily plans: FundedNext Rapid Daily, and MFF Rapid and Rapid EOD. MFF\'s first Rapid payout can come 24 hours after your first funded trade, and MFF says most payouts are approved instantly (manual reviews take 6 to 12 business hours). FundedNext says about 99.99% of payouts are processed within 24 hours. MFF Pro is the slow plan, paying every 14 calendar days.</p>',
      after: '<p>FundedNext\'s minimum withdrawal is $250 on every funded account; MFF\'s is $500 on Rapid and Rapid EOD, $1,000 on Pro and $250 to $1,500 on Builder. On MFF Rapid, a $10,000 net-profit session moves you to Live automatically, and profit above $10K that day is forfeited.</p>',
    },
    extra: [{ id: 'news', nav: 'News & limits', eyebrow: 'Fine print', h2: 'News trading and account limits', html: '<p><strong>News.</strong> FundedNext allows news trading on every futures account. MFF bans Tier-1 news (FOMC, NFP, CPI and similar) on funded Rapid, Rapid EOD and Pro accounts from 2 minutes before to 2 minutes after; it\'s allowed in every evaluation and on Builder.</p><p><strong>Accounts.</strong> FundedNext: up to 5 active funded accounts per user and per household, with at most 10 issued per calendar month. MFF: up to 10 evaluations; 5 sim-funded accounts if all are 25K or 50K, 3 if any is 100K or 150K; Builder is limited to 1 sim-funded account per user (2 at 25K). Both allow copying trades across your own accounts.</p>' }],
    pickIntro: 'Both are one-time, multi-plan firms. The split is reward share and news freedom (FundedNext) versus payout speed and the live-account ladder (MFF).',
    pickA: { tag: 'Pick for the highest split', bullets: ['You want a 95% split (Flex)', 'You want end-of-day drawdown on every plan', 'You trade news', 'You want a daily plan with no consistency rule at all (Rapid Daily)'] },
    pickB: { tag: 'Pick for speed + a real account', bullets: ['You want daily payouts with no stated per-payout cap (Rapid)', 'You want sizes up to 150K on most plans', 'You want a ladder to a real live account (Builder)', 'You want no daily loss limit on Rapid, Rapid EOD or Pro'] },
    faq: [
      { q: 'Which pays a bigger share of your profit?', a: '<strong>FundedNext</strong>: Flex pays <strong>95%</strong>, Rapid 90% and Legacy 80%. My Funded Futures pays 90/10 on Rapid and Rapid EOD and 80/20 on Pro and Builder.' },
      { q: 'Which pays out faster?', a: 'Both have daily plans (FundedNext Rapid Daily; MFF Rapid and Rapid EOD). MFF says most payouts are approved instantly, and Rapid\'s first can come 24 hours after your first funded trade; FundedNext says about 99.99% are processed within 24 hours. FundedNext Flex pays on a 5-benchmark-day cycle.' },
      { q: 'Are both one-time payments?', a: 'Yes. FundedNext Futures charges a one-time fee, and MFF has been one-time on every plan since August 2026. Neither charges an activation fee.' },
      { q: 'How do their drawdowns differ?', a: 'FundedNext trails <strong>end-of-day</strong> on every plan. MFF Rapid trails end-of-day in the evaluation, then <strong>intraday once funded</strong> until the max-loss level reaches +$100, where it stops. MFF Rapid EOD, Pro and Builder stay end-of-day.' },
      { q: 'Can you trade news on FundedNext or MFF?', a: 'FundedNext: yes, on every futures account. MFF: not Tier-1 news on funded Rapid, Rapid EOD or Pro accounts (2 minutes either side); yes in evaluations and on Builder. See <a href="/blog/prop-firm-news-trading-rules">news trading rules by firm</a>.' },
      { q: 'Which has the higher payout cap?', a: 'MFF. Rapid has no stated per-payout cap, Rapid EOD says "no cap", and Pro allows up to $100K in sim payouts per user. FundedNext caps Flex at 50% of profit up to $4,000, Legacy at $6,000 (until 30 benchmark days) and Rapid at $2,500.' },
    ],
  },

  /* ---------------- WAVE 2 (P1 / P2) ---------------- */
  {
    vsSlug: 'lucid-trading-vs-my-funded-futures', a: 'lucid-trading', b: 'my-funded-futures', wave: 2, datePublished: '2026-10-23',
    title: 'Lucid Trading vs My Funded Futures (MFFU): 2026 Compared',
    metaDesc: 'Lucid Pro, Flex, Daily & Direct vs MFF Rapid, Pro & Builder: EOD vs intraday drawdown, daily payouts, payout caps, splits and the path to a live account.',
    ogDesc: 'Drawdown once funded, daily payouts, payout caps and the path to a live account, side by side.',
    heroSub: 'Both have daily payouts and neither charges an activation fee on its evaluations. The real differences are what the drawdown does once you\'re funded, the split, and how each firm moves you to a live account.',
    verdict: [
      `<strong>Lucid Trading</strong> keeps end-of-day drawdown on Pro, Flex and Direct after you're funded and pays 90/10 on every path. The daily loss limit is optional on Pro, Flex and Daily. Pro's evaluation has no consistency rule, so it can be passed in a day, but funded Pro accounts check 40% consistency and cap each payout at $1,000 to $3,500. LucidDaily pays daily with no per-payout cap above the buffer, though its funded drawdown is intraday. Lucid also sells Direct, a straight-to-funded account; MFF has no equivalent.`,
      `<strong>My Funded Futures</strong> (MFFU) is built around fast payouts and a route to real money. Rapid pays daily at 90/10 with no stated per-payout cap, but its drawdown switches to intraday trailing once funded (it stops trailing when the max-loss level reaches +$100). Rapid EOD keeps end-of-day drawdown at 25K and 50K. Pro and Builder pay 80/20, and Builder's five approved sim payouts unlock a real live account at Blue Row Capital. Rapid, Rapid EOD and Pro have no daily loss limit; Builder has a soft pause. Every plan is one-time with no activation fee.`,
    ],
    callout: 'Want <strong>end-of-day drawdown that stays end-of-day</strong> once funded and 90/10 everywhere? Lucid. Want <strong>daily payouts with no stated cap</strong> and a ladder to a real live account? My Funded Futures.',
    keyDiffs: [
      ['Funded drawdown', 'Lucid Pro, Flex and Direct: end-of-day throughout; LucidDaily intraday. MFF Rapid: intraday until it locks at +$100; Rapid EOD, Pro and Builder end-of-day.'],
      ['Split', 'Lucid: 90/10 on every plan. MFF: 90/10 on Rapid and Rapid EOD, 80/20 on Pro and Builder.'],
      ['Daily payouts', 'LucidDaily: no per-payout cap above the buffer. MFF Rapid and Rapid EOD: no stated cap, $500 minimum.'],
      ['Daily loss limit', 'Lucid: optional on Pro, Flex and Daily. MFF: none on Rapid, Rapid EOD and Pro; a soft pause on Builder ($600 to $2,500).'],
      ['No evaluation', 'Lucid Direct starts funded. MFF has no straight-to-funded plan.'],
      ['Accounts', 'Lucid: 5 funded per household, all types combined. MFF: 5 sim-funded if all are 25K/50K, 3 if any is 100K/150K.'],
    ],
    plans: {
      h2: 'Plan by plan: Lucid Pro, Flex, Daily and Direct vs MFF',
      intro: '<p>Both firms sell four plans. Three pair up; Lucid Direct has no MFF counterpart.</p>',
      matchups: [
        { t: 'Lucid Pro <span class="v">vs</span> MFF Rapid', tag: 'The core evaluations', d: 'The same drawdown at every size ($1,000 to $4,500) and the same targets from 50K up. Pro has no consistency rule in the evaluation (1-day pass); Rapid needs 2 days and checks 50%. Once funded it flips: Pro checks 40% and caps each payout at $1,000 to $3,500, while Rapid has no funded consistency rule, pays daily once you clear the buffer ($1,100 to $4,600) and doesn\'t state a per-payout cap. Rapid\'s drawdown turns intraday when funded; Pro\'s stays end-of-day.' },
        { t: 'LucidDaily <span class="v">vs</span> MFF Rapid EOD', tag: 'Daily payouts', d: 'Both pay daily. Rapid EOD (25K and 50K only) keeps end-of-day drawdown when funded, has no cap per payout and, after the first payout, needs $250 or $500 of net profit between payouts; its evaluation takes at least 4 days with 30% consistency. LucidDaily covers 25K to 150K with no per-payout cap above the buffer, but its funded drawdown is intraday and it moves you live when you hit the max daily sim profit.' },
        { t: 'Lucid Flex <span class="v">vs</span> MFF Builder', tag: 'The cheapest ways in', d: 'Builder passes in a day with no evaluation consistency, then checks 50% at the payout stage, allows a first request 48 hours after your first trade and caps each cycle at $1,000 to $4,500, at 80/20. Lucid Flex checks 40% in the evaluation and none funded, and pays 50% of profit (up to $1,000 to $3,000) after 5 profit days, at 90/10. Builder has a soft-pause DLL ($600 to $2,500); Flex\'s DLL is optional.' },
        { t: 'Lucid Direct <span class="v">vs</span> MFF Pro', tag: 'Different jobs', d: 'Lucid Direct skips the evaluation; MFF doesn\'t sell a straight-to-funded plan. MFF Pro is its slow, high-ceiling option: payouts every 14 calendar days, a $1,000 minimum, 80/20, no funded consistency rule and up to $100K in sim payouts per user; 3 consecutive payouts or $20K profit triggers a Live review.' },
      ],
    },
    prices: {
      h2: 'Lucid Trading vs My Funded Futures price',
      intro: '<p><strong>Neither charges an activation fee on its evaluations.</strong> MFF\'s plans are all one-time purchases; its prices below are list, before CHAMP (up to 50% off depending on the plan, in our deal data; applied at checkout). Lucid\'s are the CHAMP prices we saw at our Oct 5 checkout check.</p>',
      after: '<p>At 50K, Lucid Flex was $90.20 with CHAMP at our Oct 5 checkout check and Lucid Pro $115.40; MFF Builder lists at $153 and Rapid at $209 before CHAMP. Because MFF\'s CHAMP rate varies by plan, the checkout price decides which is cheaper. Resets (our Oct 5 audit): MFF Rapid $87 to $347; Lucid Pro $70 to $245 and Flex $50 to $250.</p>',
    },
    payouts: {
      h2: 'Lucid vs MFF payout rules and caps',
      intro: '<p><strong>Which pays out faster?</strong> Both have daily plans: LucidDaily, and MFF Rapid and Rapid EOD. MFF\'s first Rapid payout can come 24 hours after your first funded trade once the buffer is cleared, and MFF says most payouts are approved instantly, with manual reviews taking 6 to 12 business hours. Lucid sends approved funds within 2 business days. MFF Pro is the slow one, paying every 14 calendar days.</p>',
      after: '<p>"No stated cap" on MFF Rapid means MFF\'s help center doesn\'t list a per-payout cap, which isn\'t quite a guarantee of none; Rapid EOD\'s page does say "no cap". A $10,000 net-profit session on Rapid moves you to Live automatically, and profit above $10K that day is forfeited.</p>',
    },
    extra: [
      { id: 'live', nav: 'Path to live', eyebrow: 'After the sim', h2: 'Path to a live account', html: '<p><strong>Lucid.</strong> Pro and Direct accounts join the live review pool at payout 5; Flex moves you live after up to 5 payouts; LucidDaily moves you live automatically when you reach the max daily sim profit ($6,000 to $12,000 by size). Lucid Live accounts pay daily with end-of-day drawdown, no DLL and no consistency rule, and you can choose a cashout of 50% of the live starting balance instead (you have 24 hours to decide).</p><p><strong>My Funded Futures.</strong> Rapid moves you to Live after a $10,000 net-profit session (or a risk-team review); Pro triggers a Live review after 3 consecutive payouts or $20,000 profit; Builder unlocks a real Live account at Blue Row Capital after 5 approved sim payouts, with daily payouts, 80/20, end-of-day drawdown, a live DLL and no consistency rule.</p>' },
      { id: 'news', nav: 'News & limits', eyebrow: 'Fine print', h2: 'News trading and account limits', html: '<p><strong>News.</strong> Lucid Pro, Flex and Direct allow trading around news; LucidDaily makes red-folder news a hard breach on funded accounts (be flat from 1 minute before to 1 minute after). MFF bans Tier-1 news (FOMC, NFP, CPI and similar) on funded Rapid, Rapid EOD and Pro accounts from 2 minutes before to 2 minutes after; it\'s allowed in every evaluation and on Builder. See <a href="/blog/prop-firm-news-trading-rules">news trading rules by firm</a>.</p><p><strong>Accounts.</strong> Lucid: up to 10 evaluations and 5 funded accounts per household across all Lucid types, with no more than 10 accounts in total. MFF: up to 10 evaluations; 5 sim-funded accounts if they\'re all 25K or 50K, 3 if any is 100K or 150K; Builder is limited to 1 sim-funded account per user (2 at 25K). Both allow copying trades across your own accounts.</p>' },
    ],
    pickIntro: 'Both have daily payouts and no activation fee. Decide on the drawdown you want once funded, the split, and how you want to get to a live account.',
    pickA: { tag: 'Pick for EOD drawdown + 90/10', bullets: ['You want end-of-day drawdown that stays end-of-day once funded (Pro, Flex, Direct)', 'You want 90/10 on every plan', 'You want a straight-to-funded option (Lucid Direct)', 'You want the daily loss limit to be optional'] },
    pickB: { tag: 'Pick for daily payouts + a real live account', bullets: ['You want daily payouts with no stated per-payout cap (Rapid)', 'You want one-time pricing on every plan', 'You want a ladder to a real live account (Builder, then Blue Row Capital)', 'You want no daily loss limit on Rapid, Rapid EOD or Pro'] },
    faq: [
      { q: 'Is Lucid Trading or MFFU better?', a: 'For drawdown and split, <strong>Lucid</strong>: Pro, Flex and Direct stay end-of-day once funded, and every plan pays 90/10. For payout speed and a path to real money, <strong>My Funded Futures</strong>: Rapid pays daily with no stated per-payout cap, and Builder leads to a live account at Blue Row Capital. MFF Rapid\'s catch is intraday trailing drawdown once funded.' },
      { q: 'Which is cheaper, Lucid or My Funded Futures?', a: 'At 50K, Lucid Flex was <strong>$90.20 with CHAMP</strong> at our Oct 5 checkout check and Lucid Pro $115.40. MFF lists Builder at <strong>$153</strong> and Rapid at $209 before CHAMP (up to 50% off depending on the plan, in our deal data; applied at checkout). Neither charges an activation fee on its evaluations, so the checkout price decides it.' },
      { q: 'Do Lucid and MFF both have daily payouts?', a: 'Yes. <strong>LucidDaily</strong> pays daily with no per-payout cap above the buffer. <strong>MFF Rapid</strong> and <strong>Rapid EOD</strong> pay daily with a $500 minimum and no stated cap; Rapid\'s first payout can come 24 hours after your first funded trade.' },
      { q: 'Does My Funded Futures switch to intraday drawdown?', a: 'On Rapid, yes. Rapid uses end-of-day drawdown in the evaluation, then trails intraday once funded until the max-loss level reaches +$100, where it stops. Rapid EOD, Pro and Builder stay end-of-day. At Lucid, Pro, Flex and Direct are end-of-day throughout, and LucidDaily is intraday once funded. See <a href="/blog/prop-firm-drawdown-explained">EOD vs intraday drawdown</a>.' },
      { q: 'Lucid vs MFFU: which has the bigger payout cap?', a: 'Neither firm caps every plan. MFF Rapid has no stated per-payout cap (Rapid EOD\'s page says "no cap"), and LucidDaily has no per-payout cap above the buffer; a $10K day on Rapid, or the max daily sim profit on LucidDaily, moves you live. MFF Pro is capped at $100K in total sim payouts per user. On the capped plans, Lucid limits Pro to $1,000 to $3,500 per payout, Flex to 50% of profit up to $3,000 and Direct to $3,500, and MFF Builder caps each cycle at $1,000 to $4,500.' },
      { q: 'How many accounts can you run at Lucid and MFF?', a: 'Lucid: up to 5 funded accounts per household (all types combined) and up to 10 evaluations, with no more than 10 accounts in total. MFF: 5 sim-funded accounts if all are 25K or 50K, or 3 if any is 100K or 150K, plus up to 10 evaluations. Both allow copying trades across your own accounts.' },
    ],
  },
  {
    vsSlug: 'lucid-trading-vs-take-profit-trader', a: 'lucid-trading', b: 'take-profit', wave: 2, datePublished: '2026-10-23',
    title: 'Lucid Trading vs Take Profit Trader (2026): Which Is Better?',
    metaDesc: 'Lucid: 90/10, EOD drawdown, optional DLL, free eval activation. Take Profit Trader: no DLL, monthly, day-one PRO payouts with no cap at 80/20. Compared.',
    ogDesc: 'No DLL and no payout cap (TPT) vs a 90/10 split, plan choice and free activation (Lucid).',
    heroSub: 'Take Profit Trader has no daily loss limit at any stage and no maximum withdrawal on PRO; Lucid has four plan types, a 90/10 split and free activation on its evaluations. Here\'s how the evaluations, payouts and costs compare.',
    verdict: [
      `<strong>Lucid Trading</strong> gives you more choice: four paths (Pro, Flex, Daily and Direct), end-of-day drawdown on Pro, Flex and Direct, an optional daily loss limit, a 90/10 split from the first payout and free activation on its evaluations. Its payouts are capped on Pro, Flex and Direct ($1,000 to $3,500 per payout depending on plan, size and payout number); LucidDaily has no per-payout cap above the buffer.`,
      `<strong>Take Profit Trader</strong> has one path: TEST, then PRO, then PRO+, with no daily loss limit at any stage. PRO lets you withdraw from day one once your balance clears a buffer equal to the max drawdown, with no funded consistency rule and no maximum withdrawal, at 80/20; PRO+ is a live account at 90/10. The catches: the TEST is billed monthly ($150 to $360 by size at our Oct 5 audit) until you pass, there's a $130 activation fee (often waived by promo), PRO's drawdown trails intraday, and PRO and PRO+ must be flat around FOMC, NFP and CPI.`,
    ],
    callout: 'Want <strong>no daily loss limit and no payout cap</strong>, and fine with monthly billing? Take Profit Trader. Want <strong>90/10 from your first payout</strong>, plan choice and free activation? Lucid.',
    keyDiffs: [
      ['Daily loss limit', 'TPT: none, at any size or stage. Lucid: optional on Pro, Flex and Daily; Direct has one from 50K.'],
      ['Payout cap', 'TPT PRO: none. Lucid: $1,000 to $3,500 per payout on Pro and Direct, 50% of profit up to $3,000 on Flex, none above the buffer on Daily.'],
      ['Split', 'Lucid: 90/10 everywhere. TPT: 80/20 on PRO, 90/10 on PRO+ (live).'],
      ['Billing', 'TPT: monthly until you pass, plus $130 activation (often waived). Lucid: CHAMP prices from $50.30 at our Oct 5 checkout check, free activation.'],
      ['Funded drawdown', 'TPT PRO: intraday trailing (stops at the starting balance); PRO+ end-of-day. Lucid Pro, Flex and Direct: end-of-day; Daily intraday.'],
      ['Minimum days', 'TPT TEST: at least 3 trading days (tests bought from Aug 17, 2026). Lucid Pro: 1-day pass.'],
    ],
    plans: {
      h2: 'Plan by plan: Lucid\'s four paths vs the TPT ladder',
      intro: '<p>Take Profit Trader sells one evaluation in five sizes (25K, 50K, 75K, 100K and 150K); Lucid sells four plan types in four sizes. These are the closest matches.</p>',
      matchups: [
        { t: 'Lucid Pro <span class="v">vs</span> TPT TEST and PRO', tag: 'Evaluation to first payout', d: 'Pro has no consistency rule in the evaluation and can pass in a day; the TPT TEST checks 50% consistency and needs at least 3 trading days. Drawdowns match at 50K, 100K and 150K; TPT gives more at 25K ($1,500 vs $1,000). Once funded, Pro checks 40% consistency and caps each payout; TPT PRO checks none and has no maximum.' },
        { t: 'LucidDaily <span class="v">vs</span> TPT PRO', tag: 'Daily payouts', d: 'Both let you request daily and both trail intraday once funded. LucidDaily has no per-payout cap above its buffer but moves you live at the max daily sim profit ($6K to $12K); TPT PRO has no maximum withdrawal at all, pays 80/20, and charges $50 on wallet withdrawals of $250 or less.' },
        { t: 'Lucid Flex <span class="v">vs</span> TPT', tag: 'No consistency rule once funded', d: 'Lucid Flex checks 40% consistency in the evaluation and none funded, like TPT (50% on the TEST, none on PRO). Flex pays 50% of profit, up to $1,000 to $3,000, after 5 profit days, at 90/10; TPT PRO pays any amount above the buffer at 80/20.' },
        { t: 'Lucid Direct', tag: 'No evaluation', d: 'Lucid Direct starts funded, at a one-time price ($230.30 to $585.20 with CHAMP at our Oct 5 checkout check), with 20% consistency and capped payouts. Take Profit Trader has no straight-to-funded plan.' },
      ],
    },
    prices: {
      h2: 'Lucid Trading vs Take Profit Trader price',
      intro: '<p><strong>Take Profit Trader bills the TEST monthly until you pass</strong> ($150, $170, $245, $330 or $360 by size at our Oct 5 audit; TPT confirmed $170 at 50K and $360 at 150K in October), plus a one-time $130 activation fee. CHAMP is applied at checkout, but we couldn\'t confirm its rate. At our Oct 23, 2026 check, TPT\'s own public code NOFEE40 took 40% off the TEST for life and waived the $130 activation fee, which made a 50K TEST $102 a month. Lucid\'s prices below are the CHAMP prices we saw at checkout on Oct 5, 2026.</p>',
      after: '<p>Because TPT is monthly, the cost depends on how long you take. With NOFEE40 (Oct 23, 2026), one month of a 50K TEST is $102 with no activation fee, under Lucid Pro\'s $115.40 (CHAMP, Oct 5 checkout check); a second month ($204) makes Lucid cheaper. Lucid\'s evaluations have free activation. TPT resets ran $79 to $199 at our Oct 5 audit; Lucid Pro resets $70 to $245.</p>',
    },
    payouts: {
      h2: 'Lucid vs Take Profit Trader payout rules',
      intro: '<p><strong>Which pays out faster?</strong> Take Profit Trader PRO lets you withdraw from day one once the buffer is cleared, with no profit-day minimum and no cap. Transfers from the account to your TPT wallet on Tradovate PRO accounts are automated (5 to 10 seconds); a bank withdrawal then goes through a manual review of up to 12 business hours before Plaid, PayPal or Wise. LucidDaily also pays daily; Lucid\'s other plans pay on request once you\'re eligible, and approved funds are sent within 2 business days.</p>',
      after: '<p>The buffer on TPT PRO equals the max drawdown, so your balance must reach $26,500 / $52,000 / $77,500 / $103,000 / $154,500 before anything is withdrawable. If a PRO account closes, you can withdraw 50% of the buffer.</p>',
    },
    extra: [
      { id: 'live', nav: 'Path to live', eyebrow: 'After the sim', h2: 'Path to a live account', html: '<p><strong>Take Profit Trader.</strong> PRO+ is a live-market account paying 90/10 with end-of-day drawdown and no buffer. It starts at a $0 balance with the original drawdown, and $5,000 of your PRO profit stays frozen while PRO+ is active. Promotion from PRO is a holistic review rather than a fixed threshold.</p><p><strong>Lucid.</strong> Pro and Direct accounts join the live review pool at payout 5, Flex moves you live after up to 5 payouts, and LucidDaily moves you live when you hit the max daily sim profit. Lucid Live accounts pay daily with end-of-day drawdown, no DLL and no consistency rule.</p>' },
      { id: 'news', nav: 'News & limits', eyebrow: 'Fine print', h2: 'News, trading hours and account limits', html: '<p><strong>News.</strong> The TPT TEST is unrestricted; PRO and PRO+ must be flat from 1 minute before to 1 minute after FOMC, NFP and CPI. Lucid Pro, Flex and Direct allow trading around news; LucidDaily makes red-folder news a hard breach on funded accounts. Lucid also requires positions flat by 4:45 PM EST.</p><p><strong>Accounts.</strong> TPT allows up to 5 active funded accounts per person (PRO and PRO+ combined), unlimited tests and up to 10 passed-test activations per 30 days; approved trade copiers can be used across your own accounts. Lucid allows up to 10 evaluations and 5 funded accounts per household across all its plan types (no more than 10 in total), and permits trade copiers.</p>' },
    ],
    pickIntro: 'Take Profit Trader trades a lower funded split and monthly billing for no DLL and no cap. Lucid trades caps for a 90/10 split, plan choice and free activation.',
    pickA: { tag: 'Pick for 90/10 + plan choice', bullets: ['You want 90/10 from your first payout', 'You want a 1-day-pass evaluation (Pro) or no evaluation at all (Direct)', 'You want free activation on the evaluation', 'You want end-of-day drawdown once funded (Pro, Flex, Direct)'] },
    pickB: { tag: 'Pick for no DLL + no cap', bullets: ['You never want a daily loss limit, at any stage', 'You want day-one withdrawals with no maximum (PRO)', 'You want a 75K size', 'You want a live account at 90/10 (PRO+)'] },
    faq: [
      { q: 'Is Take Profit Trader or Lucid better?', a: 'If the daily loss limit and payout caps are what bother you, <strong>Take Profit Trader</strong>: it has no DLL anywhere and no maximum withdrawal on PRO, though PRO pays 80/20 and the TEST bills monthly. If you would rather keep 90% from the first payout, pick from four plan types and pay no activation fee, <strong>Lucid</strong>.' },
      { q: 'Which is cheaper, Take Profit Trader or Lucid?', a: 'It depends on how fast you pass. Lucid Pro 50K was <strong>$115.40 with CHAMP</strong> at our Oct 5 checkout check, with free activation. TPT\'s 50K TEST lists at <strong>$170 a month</strong>; at our Oct 23, 2026 check, TPT\'s public code NOFEE40 took 40% off ($102 a month) and waived the $130 activation fee. Pass in the first month and TPT is cheaper; from the second month ($204) Lucid is. CHAMP also works at TPT\'s checkout, but we couldn\'t confirm its rate.' },
      { q: 'Does Take Profit Trader have a daily loss limit?', a: 'No. TPT has none at any size or stage (TEST, PRO and PRO+). Lucid\'s DLL is optional on Pro, Flex and Daily, and Direct has one from 50K.' },
      { q: 'Is there a payout cap at Take Profit Trader?', a: 'Not on PRO: once your balance clears the buffer (equal to the max drawdown) you can withdraw any amount, from day one. Lucid caps Pro and Direct at $1,000 to $3,500 per payout and Flex at 50% of profit up to $3,000; LucidDaily has no per-payout cap above the buffer.' },
      { q: 'Take Profit Trader vs Lucid Flex: which is better?', a: '<strong>Lucid Flex</strong> checks 40% consistency in the evaluation (50% with an add-on) and none funded, then pays 50% of profit (up to $1,000 to $3,000) after 5 profit days, at 90/10. <strong>TPT</strong> checks 50% on the TEST and none on PRO, then pays any amount above the buffer at 80/20. Flex suits traders who want the higher split; TPT suits traders who want no cap.' },
      { q: 'Can you trade news on Take Profit Trader or Lucid?', a: 'On TPT, during the TEST yes; on PRO and PRO+ you must be flat from 1 minute before to 1 minute after FOMC, NFP and CPI. On Lucid Pro, Flex and Direct yes; on LucidDaily, red-folder news is a hard breach once funded. See <a href="/blog/prop-firm-news-trading-rules">news trading rules by firm</a>.' },
    ],
  },
  {
    vsSlug: 'alpha-futures-vs-lucid-trading', a: 'alpha-futures', b: 'lucid-trading', wave: 2, datePublished: '2026-10-23',
    title: 'Alpha Futures vs Lucid Trading (2026): Which Is Better?',
    metaDesc: 'Alpha Zero, Standard, Advanced & Direct vs Lucid Pro, Flex, Daily & Direct: one-day passes, monthly vs CHAMP pricing, payout caps and account limits.',
    ogDesc: 'One-day passes, monthly vs CHAMP pricing, payout caps and account limits compared.',
    heroSub: 'Both have a one-day evaluation, a straight-to-funded plan and a 90% split. Alpha bills its evaluations monthly and allows up to four withdrawals a month; Lucid pays on request or daily, with free activation.',
    verdict: [
      `<strong>Alpha Futures</strong> has the widest spread of payout caps. Zero passes in a day (no evaluation consistency rule) and caps each withdrawal at $1,000 to $2,500; Standard caps at $3,000 to $5,000; Advanced allows up to $15,000 per request, with no daily loss limit at any stage and no news restrictions. Zero, Standard and Advanced withdraw up to 50% of profit, up to 4 times a month, after 5 winning days of $200 or more. Evaluations are monthly subscriptions that stop when you pass, with $0 activation; CHAMP is 40% off in our deal data.`,
      `<strong>Lucid Trading</strong> pays 90/10 on every path and doesn't count winning days on Pro or Direct: you request once the profit goal and consistency rule are met (Pro also needs your balance above a buffer). LucidDaily pays daily with no per-payout cap above the buffer. Lucid's evaluations have free activation and an optional DLL, and its CHAMP prices at our Oct 5 checkout check started at $50.30 (Flex 25K). Its caps top out at $3,500 per payout on Pro and Direct.`,
    ],
    callout: 'Want <strong>large single withdrawals</strong> ($15,000 on Advanced) and no DLL or news limits? Alpha Advanced. Want <strong>daily payouts</strong> or no winning-day rule, with free activation? Lucid.',
    keyDiffs: [
      ['Billing', 'Alpha Zero, Standard and Advanced: monthly until you pass ($0 activation); Direct one-time. Lucid: CHAMP prices from $50.30 at our Oct 5 checkout check; free activation on the evaluations.'],
      ['One-day pass', 'Alpha Zero (25K to 100K) and Lucid Pro (25K to 150K); neither has an evaluation consistency rule.'],
      ['Payout timing', 'Alpha: up to 4 withdrawals a month after 5 winning days of $200+ (Direct uses a profit target). Lucid: on request once eligible; LucidDaily daily.'],
      ['Biggest withdrawal', 'Alpha Advanced: $15,000 per request. Lucid: $3,500 (Pro and Direct, 150K); LucidDaily no per-payout cap above the buffer.'],
      ['Daily loss limit', 'Alpha Advanced: none at any stage; Zero $500 to $2,000 at both stages. Lucid: optional on Pro, Flex and Daily.'],
      ['Accounts', 'Alpha: 5 qualified on Zero, Standard or Direct, 3 if you hold any Advanced; one person per household. Lucid: 5 funded per household.'],
    ],
    plans: {
      h2: 'Plan by plan: Alpha Zero, Standard, Advanced and Direct vs Lucid',
      intro: '<p>Both firms sell four plans. Three pair up closely; Alpha Standard and LucidDaily have no direct counterpart.</p>',
      matchups: [
        { t: 'Alpha Zero <span class="v">vs</span> Lucid Pro', tag: 'One-day passes', d: 'Neither checks consistency in the evaluation. Zero has a DLL at both stages ($500 to $2,000) and covers 25K to 100K; Pro\'s DLL is optional and it goes to 150K. Funded, both check 40% consistency. Zero caps each withdrawal at $1,000 to $2,500 ($200 minimum) after 5 winning days of $200+; Pro caps at $1,000 to $3,000 for the first payout and $1,500 to $3,500 after, with a $500 minimum and a per-cycle profit goal instead of winning days.' },
        { t: 'Alpha Advanced <span class="v">vs</span> Lucid Flex', tag: 'No consistency rule once funded', d: 'Both check 40% in the evaluation and none funded. Advanced has no DLL at all, no news restrictions and a $15,000 cap per request ($1,000 minimum), but needs at least 3 evaluation days and costs $209 to $489 a month. Lucid Flex makes the DLL optional and pays 50% of profit, up to $1,000 to $3,000, after 5 profit days.' },
        { t: 'Alpha Direct <span class="v">vs</span> Lucid Direct', tag: 'No evaluation', d: 'Both start funded with 20% consistency, the same first profit target ($1,500 / $3,000 / $6,000 / $9,000) and the same early caps ($1,000 / $2,000 / $2,500 / $3,000). With CHAMP\'s 40% (on file), Alpha Direct works out cheaper at every size (our math) than Lucid Direct\'s CHAMP price at our Oct 5 checkout check, and Alpha\'s public MYALPHA50 code (50% off Direct at our Oct 23 check) would take it lower still. Lucid\'s caps rise for payouts 4 and 5; Alpha\'s later profit targets are lower at 25K and 50K but higher at 100K and 150K.' },
        { t: 'Alpha Standard and LucidDaily', tag: 'No direct match', d: 'Alpha Standard (50K to 150K) checks 50% in the evaluation and 40% qualified, adds a DLL only once qualified ($1,000 to $3,000) and caps withdrawals at $3,000 to $5,000. LucidDaily is Lucid\'s daily-payout plan; Alpha has nothing that pays daily, since every Alpha plan allows up to 4 withdrawals a month.' },
      ],
    },
    prices: {
      h2: 'Alpha Futures vs Lucid Trading price',
      intro: '<p><strong>Alpha\'s evaluations are monthly; Lucid\'s prices are CHAMP prices.</strong> Alpha Zero, Standard and Advanced bill monthly until you pass (qualified accounts have no monthly fee, and activation is $0); Direct is one-time. The Alpha prices below are list, with CHAMP\'s 40% worked out underneath. Lucid\'s are the CHAMP prices we saw at our Oct 5 checkout check. Alpha\'s own public codes can beat CHAMP: at our Oct 23, 2026 check, MYALPHA50 took 50% off Standard, Direct and Advanced (more than CHAMP\'s 40% on file), and MYALPHA40 took 40% off Zero. Use whichever gives the lower checkout price.</p>',
      after: '<p>At 50K, one month of Alpha Zero is $83.40 after CHAMP, against $115.40 for Lucid Pro; a second month makes Zero the more expensive one ($166.80). If you fail, Alpha Zero\'s evaluation resets cost $79 to $249, against $70 to $245 for Lucid Pro.</p>',
    },
    payouts: {
      h2: 'Alpha vs Lucid payout rules and caps',
      intro: '<p><strong>Which pays out faster?</strong> Lucid, if you mean how often you can ask. LucidDaily pays daily, and Pro, Flex and Direct have no fixed payout window. Alpha allows up to 4 withdrawals a month with no assigned payout dates; on Zero, Standard and Advanced each one needs 5 winning days of $200+ since the last. Both pay the trader 90%: Alpha deducts the full request from the account and pays you 90% of it.</p>',
      after: '<p>Alpha\'s max loss limit doesn\'t reset when you withdraw. Alpha pays by ACH, wire, Wise or Rise; Lucid by Plaid (US), WorkMarket by ADP (bank or PayPal) or crypto for international traders.</p>',
    },
    extra: [{ id: 'limits', nav: 'News & limits', eyebrow: 'Fine print', h2: 'News rules, account limits and copy trading', html: '<p><strong>News.</strong> Alpha has no news restrictions in any evaluation or on Advanced qualified accounts. On Zero, Standard and Direct qualified accounts you may hold positions through news, but no orders may execute within 2 minutes either side of a red-folder event; a first violation is a warning, later ones breach. Lucid Pro, Flex and Direct allow trading around news; LucidDaily makes red-folder news a hard breach on funded accounts.</p><p><strong>Accounts.</strong> Alpha allows 5 qualified accounts on Zero, Standard (3 if bought before Jul 27, 2026) or Direct, but any active Advanced account caps you at 3, and only one individual per household. Lucid allows up to 10 evaluations and 5 funded accounts per household across every Lucid type (no more than 10 in total). Both allow copying trades across your own accounts; Alpha prohibits automated, group and reverse trading, while Lucid permits automated systems and trade copiers.</p>' }],
    pickIntro: 'Both have a one-day pass and a no-evaluation plan. Alpha is about fewer, larger withdrawals; Lucid is about payout frequency and free activation.',
    pickA: { tag: 'Pick for big withdrawals', bullets: ['You want up to $15,000 per withdrawal (Advanced)', 'You want no DLL and no news restrictions (Advanced)', 'You expect to pass in the first month (billing stops when you pass)', 'You want a no-evaluation plan that works out cheaper than Lucid Direct with a code (Direct)'] },
    pickB: { tag: 'Pick for payout frequency', bullets: ['You want daily payouts (LucidDaily)', 'You want to request without counting winning days (Pro, Direct)', 'You want a 150K one-day-pass evaluation (Pro)', 'You want free activation and an optional DLL'] },
    faq: [
      { q: 'Is Alpha Futures or Lucid Trading better?', a: 'For big, infrequent withdrawals, <strong>Alpha Advanced</strong> ($15,000 per request, no DLL, no news restrictions). For frequent payouts, <strong>Lucid</strong>: LucidDaily pays daily and Pro and Direct have no fixed window. On the one-day passes, Alpha Zero and Lucid Pro are close; Pro goes up to 150K and makes the DLL optional.' },
      { q: 'Which is cheaper, Alpha Futures or Lucid?', a: 'It depends on how fast you pass. A 50K Alpha Zero is $139 a month list, or <strong>$83.40</strong> after 40% off (CHAMP\'s rate on file; Alpha\'s public MYALPHA40 also took 40% off Zero at our Oct 23 check); Lucid Pro 50K was <strong>$115.40</strong> with CHAMP at our Oct 5 checkout check. Pass Alpha in the first month and it\'s cheaper; a second month ($166.80) isn\'t. On the no-evaluation plans, Alpha Direct 50K is $519 list: $311.40 with CHAMP\'s 40% on file, or $259.50 with Alpha\'s public MYALPHA50 code (50% off at our Oct 23 check), against $360.50 for Lucid Direct with CHAMP at our Oct 5 checkout check.' },
      { q: 'Do Alpha Futures and Lucid both have a one-day pass?', a: 'Yes. <strong>Alpha Zero</strong> has no minimum evaluation days and no evaluation consistency rule (25K to 100K). <strong>Lucid Pro</strong> also has no evaluation consistency rule (25K to 150K). Both then check 40% consistency once funded.' },
      { q: 'Which allows bigger withdrawals, Alpha or Lucid?', a: 'Alpha Advanced, at up to <strong>$15,000 per request</strong> ($1,000 minimum). Lucid caps Pro and Direct at $3,500 per payout on 150K; LucidDaily has no per-payout cap above the buffer, but hitting the max daily sim profit ($6K to $12K) moves the account live.' },
      { q: 'How many accounts can you have at Alpha and Lucid?', a: 'Alpha: 5 qualified accounts on Zero, Standard or Direct, or 3 if you hold any Advanced account, with one individual per household. Lucid: up to 5 funded accounts per household (all types combined) and up to 10 evaluations, with no more than 10 accounts in total.' },
      { q: 'Is Alpha Futures monthly?', a: 'Zero, Standard and Advanced are monthly subscriptions that stop once you pass; qualified accounts carry no monthly fee and activation is $0. Alpha Direct is a one-time payment.' },
    ],
  },
  {
    vsSlug: 'fundednext-vs-lucid-trading', a: 'fundednext', b: 'lucid-trading', wave: 2, datePublished: '2026-10-23', nameA: 'FundedNext Futures',
    title: 'FundedNext Futures vs Lucid Trading (2026): Flex vs Flex',
    metaDesc: 'FundedNext Flex (95% split, no DLL) vs Lucid Flex (90/10, optional DLL), plus Rapid Daily vs LucidDaily: rules, payout caps and prices compared.',
    ogDesc: 'FundedNext Flex vs Lucid Flex and Rapid Daily vs LucidDaily, side by side.',
    heroSub: 'Both firms sell a plan called Flex and a daily-payout plan. FundedNext\'s Flex pays 95% with no daily loss limit; Lucid\'s pays 90/10 with an optional one. Here\'s how the matching plans compare.',
    verdict: [
      `<strong>FundedNext Futures</strong> pays the higher split on Flex (95%) with no daily loss limit and no buffer, but caps each withdrawal at 50% of profit ($1,500 / $2,500 / $4,000 on 50K to 150K) and closes the account after 5 rewards. Every FundedNext futures account uses end-of-day drawdown, news trading is allowed on all of them, and fees are one-time. Rapid Daily has no consistency rule at either stage. Its $380M+ payout total covers all FundedNext programs, not just futures.`,
      `<strong>Lucid Trading</strong>'s Flex pays 90/10, makes the DLL optional and pays 50% of profit (up to $1,000 to $3,000) after 5 profit days, for up to 5 payouts before moving you live. LucidDaily pays daily with no per-payout cap above the buffer, where FundedNext Rapid Daily caps each payout at $800 to $2,500. Lucid also covers 25K and 150K on every plan, and its Pro plan passes in a day.`,
    ],
    callout: 'Want the <strong>highest split</strong> (95%) and no DLL? FundedNext Flex. Want <strong>daily payouts with no per-payout cap</strong>, or a 25K or 150K account on any plan? Lucid.',
    keyDiffs: [
      ['Split', 'FundedNext: Flex 95%, Rapid 90%, Legacy 80%. Lucid: 90/10 everywhere.'],
      ['Flex caps', 'FundedNext: 50% of profit up to $1,500 / $2,500 / $4,000 (50K to 150K). Lucid: 50% up to $1,000 / $2,000 / $2,500 / $3,000 (25K to 150K).'],
      ['Daily payouts', 'FundedNext Rapid Daily: $800 to $2,500 per payout, no consistency rule at all. LucidDaily: no per-payout cap above the buffer.'],
      ['Daily loss limit', 'FundedNext: none on Flex, Legacy and Rapid Pro; Rapid Daily $500 to $1,250. Lucid: optional on Pro, Flex and Daily.'],
      ['Account life', 'FundedNext Flex and Rapid end after 5 rewards (Legacy doesn\'t). Lucid: payout 5 leads toward a live account.'],
      ['News', 'FundedNext: allowed on every account. LucidDaily: red-folder news is a hard breach once funded.'],
    ],
    plans: {
      h2: 'Plan by plan: FundedNext Flex, Legacy and Rapid vs Lucid',
      intro: '<p>FundedNext Futures sells Flex (50K to 150K), Legacy (25K to 100K) and Rapid in Pro and Daily versions (25K to 100K). Lucid sells Pro, Flex, Daily and Direct at 25K to 150K.</p>',
      matchups: [
        { t: 'FundedNext Flex <span class="v">vs</span> Lucid Flex', tag: 'Flex vs Flex', d: 'Both check 40% consistency in the evaluation and none funded, and both pay out 50% of profit per withdrawal after 5 qualifying days. FundedNext pays 95%, has no DLL and asks for lower targets ($2,500 / $5,000 / $8,000 vs $3,000 / $6,000 / $9,000) with tighter drawdown ($1,500 / $2,500 / $4,000 vs $2,000 / $3,000 / $4,500). Its cap is lower at 50K ($1,500 vs $2,000) and higher at 150K ($4,000 vs $3,000). FundedNext Flex ends after 5 rewards; Lucid Flex moves you live after up to 5 payouts.' },
        { t: 'FundedNext Rapid Daily <span class="v">vs</span> LucidDaily', tag: 'Daily payouts', d: 'Rapid Daily passes in a day with no consistency rule at either stage and keeps end-of-day drawdown, but has a DLL ($500 / $1,000 / $1,250) and caps each payout at $800 / $1,200 / $2,500 ($250 minimum); it ends after 5 rewards. LucidDaily\'s funded drawdown is intraday and its DLL is optional, with no per-payout cap above the buffer ($500 minimum).' },
        { t: 'FundedNext Rapid Pro <span class="v">vs</span> Lucid Pro', tag: '1-day passes, 40% funded', d: 'Neither checks consistency in the evaluation; both check 40% once funded. Rapid Pro has no DLL (an optional DLL add-on lowers the price), pays every 3 days with $500 of cycle profit, caps each payout at $800 to $2,500 and ends after 5 rewards. Lucid Pro\'s DLL is optional, it caps payouts at $1,000 to $3,500, and payout 5 puts you in the live review pool.' },
        { t: 'FundedNext Legacy and Direct <span class="v">vs</span> Lucid Direct', tag: 'The rest of the line-up', d: 'Legacy is FundedNext\'s low-target plan (80% split, 25K to 100K); after 30 benchmark days its 50% limit and cap are removed, and it doesn\'t end after 5 rewards. FundedNext also sells a $50K Direct account with no challenge (20% consistency, $800 to $1,200 per withdrawal, $169.99 offer price), its closest match to Lucid Direct.' },
      ],
    },
    prices: {
      h2: 'FundedNext Futures vs Lucid Trading price',
      intro: '<p><strong>FundedNext Futures charges a one-time fee with no activation fee.</strong> Its prices below are current offer prices (Flex\'s apply to your first 2 purchases, then $84.99 / $159.99 / $289.99); CHAMP is applied at checkout. Lucid\'s are the CHAMP prices we saw at our Oct 5 checkout check, with free activation on its evaluations.</p>',
      after: '<p>At 50K, FundedNext Flex is $74.99 at its offer price, against $90.20 for Lucid Flex with CHAMP at our Oct 5 checkout check. FundedNext Rapid is $169.99 at 50K, or $129.99 if you add the optional DLL.</p>',
    },
    payouts: {
      h2: 'FundedNext vs Lucid payout rules and caps',
      intro: '<p><strong>Which pays out faster?</strong> Both have a daily plan: FundedNext Rapid Daily and LucidDaily. FundedNext says about 99.99% of payouts are processed within 24 hours, and Rapid Pro pays every 3 days; Lucid sends approved funds within 2 business days. FundedNext rewards are requested at the end of the day, and placing a trade that day removes the transfer option.</p>',
      after: '<p>Minimums differ: FundedNext\'s minimum withdrawal is $250 on Flex, Legacy and Rapid ($800 on the new 50K Direct); Lucid\'s is $500.</p>',
    },
    extra: [{ id: 'limits', nav: 'News & limits', eyebrow: 'Fine print', h2: 'News trading, account limits and copy trading', html: '<p><strong>News.</strong> FundedNext allows news trading on every futures account. Lucid allows it on Pro, Flex and Direct; on LucidDaily, red-folder news is a hard breach once funded.</p><p><strong>Accounts.</strong> FundedNext: up to 5 active funded accounts per user and per household, no more than 10 issued per calendar month, and challenges up to $750K of combined allocation. Lucid: up to 10 evaluations and 5 funded accounts per household across every Lucid type, with no more than 10 in total. Both allow copying trades across your own accounts; FundedNext also allows copying to your own accounts at other firms, but not signal services or group trading.</p><p><strong>About FundedNext\'s total.</strong> The $380M+ it publishes covers all FundedNext programs, including its non-futures accounts, so it isn\'t a futures-only figure.</p>' }],
    pickIntro: 'Both sell a Flex plan and a daily plan. FundedNext wins on split and no DLL; Lucid wins on daily-payout caps and size range.',
    pickA: { tag: 'Pick for the 95% split', bullets: ['You want a 95% split (Flex)', 'You want no daily loss limit (Flex, Legacy, Rapid Pro)', 'You want a daily-payout plan with no consistency rule at all (Rapid Daily)', 'You trade news'] },
    pickB: { tag: 'Pick for daily payouts + size range', bullets: ['You want daily payouts with no per-payout cap above the buffer (LucidDaily)', 'You want 25K to 150K on every plan', 'You want a higher Flex cap at 50K ($2,000)', 'You want your fifth payout to lead toward a live account'] },
    faq: [
      { q: 'Is FundedNext or Lucid better?', a: 'For the split and no daily loss limit, <strong>FundedNext Flex</strong> (95%, no DLL). For daily payouts, <strong>LucidDaily</strong> has no per-payout cap above the buffer, where FundedNext Rapid Daily caps at $800 to $2,500 but has no consistency rule at either stage. FundedNext\'s Flex and Rapid accounts end after 5 rewards.' },
      { q: 'FundedNext Flex vs Lucid Flex: which is better?', a: 'FundedNext Flex pays <strong>95%</strong> with no DLL and lower targets, but tighter drawdown and a $1,500 cap at 50K. Lucid Flex pays <strong>90/10</strong> with an optional DLL and a $2,000 cap at 50K, and comes in 25K. Both check 40% consistency in the evaluation and none once funded, and both pay 50% of profit per withdrawal.' },
      { q: 'Which is cheaper, FundedNext or Lucid?', a: 'At 50K, <strong>FundedNext Flex is $74.99</strong> at its current offer price (first 2 purchases) and Lucid Flex was <strong>$90.20</strong> with CHAMP at our Oct 5 checkout check. Neither has an activation fee. Check both at checkout, since FundedNext\'s offer prices change.' },
      { q: 'Does FundedNext Futures have a daily loss limit?', a: 'Not on Flex, Legacy or Rapid Pro (Rapid Pro offers an optional DLL add-on that lowers the price). Rapid Daily has one: $500 / $1,000 / $1,250. Lucid\'s DLL is optional on Pro, Flex and Daily.' },
      { q: 'Is FundedNext\'s $380M+ payout total for futures only?', a: 'No. FundedNext\'s published total covers all of its programs, not just FundedNext Futures, so it isn\'t a like-for-like figure for a futures comparison. We haven\'t verified a published total for Lucid yet.' },
      { q: 'Can you trade news on FundedNext or Lucid?', a: 'FundedNext: yes, on every futures account. Lucid: yes on Pro, Flex and Direct; not on LucidDaily once funded, where red-folder news is a hard breach.' },
    ],
  },
  {
    vsSlug: 'alpha-futures-vs-tradeify', a: 'alpha-futures', b: 'tradeify', wave: 2, datePublished: '2026-10-23',
    title: 'Alpha Futures vs Tradeify (2026): Monthly vs One-Time',
    metaDesc: 'Alpha Futures bills evals monthly (CHAMP 40% off); Tradeify is one-time with no activation fee. Zero, Advanced & Direct vs Growth, Select & Lightning.',
    ogDesc: 'Monthly vs one-time pricing, $15K withdrawals vs daily payouts, plan by plan.',
    heroSub: 'Alpha\'s evaluations are monthly subscriptions; Tradeify\'s plans are one-time payments. Past the billing, the big differences are Alpha Advanced\'s $15,000 withdrawals and Tradeify Select\'s daily payouts.',
    verdict: [
      `<strong>Alpha Futures</strong> is built around fewer, larger withdrawals: up to 4 a month, each after 5 winning days of $200 or more, capped at $1,000 to $2,500 on Zero, $3,000 to $5,000 on Standard and $15,000 per request on Advanced. Advanced has no daily loss limit at any stage and no news restrictions, and Zero can pass in a day. Evaluations are monthly until you pass, with $0 activation; Direct is a one-time, straight-to-funded plan. Alpha publishes $70M+ in performance fees paid.`,
      `<strong>Tradeify</strong> charges once and never an activation fee. Its Select evaluation has no daily loss limit; after passing you choose Daily payouts (capped at $600 to $2,500) or Flex (no DLL, capped at $1,250 to $4,500 on a 5-day cycle). Growth has no evaluation consistency rule but a DLL and a 35% funded rule, and Lightning skips the evaluation. Tradeify publishes a $350M+ payout total.`,
    ],
    callout: 'Want <strong>$15,000 withdrawals with no DLL or news limits</strong>? Alpha Advanced. Want <strong>daily payouts</strong> and one-time pricing with no activation fee? Tradeify Select.',
    keyDiffs: [
      ['Billing', 'Alpha Zero, Standard and Advanced: monthly until you pass; Direct one-time. Tradeify: one-time on every plan since 03/31/26.'],
      ['Payout timing', 'Alpha: up to 4 withdrawals a month. Tradeify: Select Daily daily; Growth, Select Flex and Lightning every 5 days.'],
      ['Biggest withdrawal', 'Alpha Advanced: $15,000 per request. Tradeify: up to $5,000 (Growth 150K, from the fourth payout, per Tradeify\'s help center via search index).'],
      ['No DLL', 'Alpha: Advanced (evaluation and qualified) and Standard (evaluation only). Tradeify: Select evaluation and Select Flex; Lightning at 25K.'],
      ['One-day pass', 'Alpha Zero and Tradeify Growth (1-day minimum); no evaluation consistency rule on either.'],
      ['Accounts', 'Alpha: 5 qualified (3 if you hold any Advanced), one person per household. Tradeify: 5 sim-funded per person and household.'],
    ],
    plans: {
      h2: 'Plan by plan: Alpha Zero, Standard, Advanced and Direct vs Tradeify',
      intro: '<p>Both firms sell four ways in, and each has a close counterpart on the other side.</p>',
      matchups: [
        { t: 'Alpha Zero <span class="v">vs</span> Tradeify Growth', tag: 'One-day evaluations', d: 'Neither checks consistency in the evaluation, and both have a DLL (Zero $500 to $2,000; Growth $600 to $3,750). Funded, Zero checks 40% and Growth 35%. Zero covers 25K to 100K and caps withdrawals at $1,000 to $2,500; Growth covers 25K to 150K, with caps that rise from $1,000 to $2,500 on the first payout to $1,000 to $5,000 by the fourth.' },
        { t: 'Alpha Advanced <span class="v">vs</span> Tradeify Select Flex', tag: 'No daily loss limit', d: 'Both check 40% in the evaluation and none funded, and both need at least 3 evaluation days. Advanced has no DLL at either stage and no news restrictions, and allows $15,000 per request up to 4 times a month. Select\'s evaluation has no DLL and neither does the Flex path, which caps each payout at $1,250 to $4,500 every 5 days. Advanced costs $209 to $489 a month; Select is $109 to $369 once.' },
        { t: 'Alpha Standard <span class="v">vs</span> Tradeify Select Daily', tag: 'Frequency vs size', d: 'Standard checks 50% in the evaluation and 40% qualified, and caps withdrawals at $3,000 to $5,000, up to 4 times a month. Select Daily checks 40% in the evaluation and none funded, and pays daily, capped at $600 to $2,500. Both add a DLL only once funded (Standard $1,000 to $3,000; Select Daily $500 to $1,750).' },
        { t: 'Alpha Direct <span class="v">vs</span> Tradeify Lightning', tag: 'No evaluation', d: 'The same first profit goal ($1,500 / $3,000 / $6,000 / $9,000), 20% consistency to start (Lightning rises to 25%, then 30%), and the same early caps ($1,000 / $2,000 / $2,500 / $3,000). Alpha Direct\'s minimum is $500 against Lightning\'s $1,000, and it can pay up to 4 times a month; Lightning pays every 5 days. Lightning lists lower at every size ($345 to $796 vs $349 to $859), before discounts (at our Oct 23 check, Alpha\'s public MYALPHA50 took 50% off Direct).' },
      ],
    },
    prices: {
      h2: 'Alpha Futures vs Tradeify price: monthly vs one-time',
      intro: '<p><strong>Alpha bills monthly; Tradeify bills once.</strong> Alpha Zero, Standard and Advanced charge each month until you pass (the subscription stops then, and activation is $0); Direct is one-time. Tradeify has been one-time on every plan since 03/31/26, with no activation fee. Both sets of prices below are list. CHAMP\'s 40% (on file) is worked out under Alpha\'s, and Tradeify applies CHAMP at checkout. At our Oct 23, 2026 check, Alpha\'s own public code MYALPHA50 took 50% off Standard, Direct and Advanced (more than CHAMP\'s 40%) and MYALPHA40 took 40% off Zero, so use whichever gives the lower checkout price.</p>',
      after: '<p>At 50K, one month of Alpha Zero is $83.40 after CHAMP, below Tradeify Growth\'s $145 list price. By the second month ($166.80), Alpha costs more than Growth\'s list price. If you fail, Tradeify Growth\'s resets cost $60 to $229 and Alpha Zero\'s evaluation resets $79 to $249.</p>',
    },
    payouts: {
      h2: 'Alpha vs Tradeify payout rules and caps',
      intro: '<p><strong>Which pays out faster?</strong> Tradeify Select Daily lets you request every day; Tradeify\'s other plans run on a 5-day cycle. Alpha allows up to 4 withdrawals a month with no assigned dates, each after 5 winning days of $200+ on Zero, Standard and Advanced (Direct uses a profit target instead). Both pay the trader 90%.</p>',
      after: '<p>On Zero, Standard and Advanced, each Alpha withdrawal is up to 50% of profit, and the max loss limit doesn\'t reset when you withdraw. Tradeify Select Flex also pays out 50% of profit per request, per its help center.</p>',
    },
    extra: [{ id: 'limits', nav: 'News & limits', eyebrow: 'Fine print', h2: 'News rules, account limits and copy trading', html: '<p><strong>News.</strong> Alpha has no news restrictions in any evaluation or on Advanced qualified accounts; on Zero, Standard and Direct qualified accounts, no orders may execute within 2 minutes either side of a red-folder event (you may hold through it). Tradeify\'s news policy isn\'t part of our latest audit, so check its help center before trading releases.</p><p><strong>Accounts.</strong> Alpha: 5 qualified accounts on Zero, Standard (3 if bought before Jul 27, 2026) or Direct, but any active Advanced caps you at 3, and only one individual per household. Tradeify: 5 sim-funded accounts per person and per household, in any mix of Growth, Select and Lightning. Both allow copying trades across your own accounts; Tradeify bars opposing positions and copying between people, and Alpha bars automated, group and reverse trading.</p><p><strong>Tradeify trading rules.</strong> On funded accounts, at least half of your profit must come from trades held longer than 10 seconds, and you must trade at least once per calendar week.</p>' }],
    pickIntro: 'Alpha suits traders who withdraw less often but in larger amounts. Tradeify suits traders who want daily payouts and one up-front price.',
    pickA: { tag: 'Pick for large withdrawals', bullets: ['You want up to $15,000 per withdrawal (Advanced)', 'You want no DLL and no news restrictions (Advanced)', 'You expect to pass in the first month', 'You want a no-evaluation plan with a $500 minimum payout (Direct)'] },
    pickB: { tag: 'Pick for daily payouts + one-time pricing', bullets: ['You want daily payouts (Select Daily)', 'You want to pay once, with no activation fee', 'You want a 150K one-day-pass evaluation (Growth)', 'You want a funded path with no DLL (Select Flex)'] },
    faq: [
      { q: 'Is Alpha Futures or Tradeify better?', a: 'For large, infrequent withdrawals, <strong>Alpha Advanced</strong>: up to $15,000 per request with no DLL or news restrictions. For frequent payouts and one up-front price, <strong>Tradeify</strong>: Select Daily pays daily and every plan is one-time. Their one-day-pass and no-evaluation plans (Zero vs Growth, Direct vs Lightning) are close.' },
      { q: 'Is Alpha Futures monthly or one-time?', a: 'Alpha Zero, Standard and Advanced are <strong>monthly subscriptions</strong> that stop once you pass; qualified accounts have no monthly fee and activation is $0. Alpha Direct is one-time. Tradeify is <strong>one-time on every plan</strong> (since 03/31/26).' },
      { q: 'Which is cheaper, Alpha Futures or Tradeify?', a: 'For a fast pass, Alpha: a 50K Zero is $139 a month list, or <strong>$83.40</strong> after 40% off (CHAMP\'s rate on file; Alpha\'s public MYALPHA40 also took 40% off Zero at our Oct 23 check), against Tradeify Growth\'s <strong>$145</strong> one-time list price. If you need a second month, Alpha ($166.80) costs more than Growth\'s list price. Tradeify applies CHAMP at checkout, so check its final price too.' },
      { q: 'Which has no daily loss limit, Alpha or Tradeify?', a: 'Alpha Advanced has none at either stage, and Alpha Standard has none in the evaluation. Tradeify\'s Select evaluation and Select Flex path have none, and Lightning has none at 25K. Alpha Zero, Tradeify Growth, Select Daily (funded) and Lightning from 50K all have one.' },
      { q: 'Which allows bigger payouts, Alpha or Tradeify?', a: 'Alpha Advanced, at up to <strong>$15,000 per request</strong>. Tradeify\'s largest cap is $5,000 (Growth 150K, from the fourth payout, per search-index copies of Tradeify\'s help center in Oct 2026; confirm in your dashboard); Select Flex tops out at $4,500 and Select Daily at $2,500.' },
      { q: 'How many accounts can you have at Alpha and Tradeify?', a: 'Alpha: 5 qualified accounts on Zero, Standard or Direct, or 3 if you hold any Advanced, with one individual per household. Tradeify: 5 sim-funded accounts per person and per household, in any mix of plans.' },
    ],
  },
];

/* ============================================================
   RUN
   ============================================================ */
function main() {
  const argWave = process.argv.indexOf('--wave');
  const wave = argWave > 0 ? Number(process.argv[argWave + 1]) : RELEASE_WAVE;
  // 1) generated pages
  for (const c of CONFIGS) {
    if ((c.wave || 1) > wave) { console.log(`· skip   vs/${c.vsSlug}.html (wave ${c.wave})`); continue; }
    const out = path.join(ROOT, 'vs', c.vsSlug + '.html');
    const old = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;
    fs.writeFileSync(out, carryChrome(page(c), old));
    console.log(`✓ write  vs/${c.vsSlug}.html`);
  }
  // 2) hub first (so the per-page breadcrumbs/related blocks can link it), then refresh every page on disk
  let disk = diskPages();
  const hubFile = path.join(ROOT, 'vs', 'index.html');
  const hubOld = fs.existsSync(hubFile) ? fs.readFileSync(hubFile, 'utf8') : null;
  fs.writeFileSync(hubFile, carryChrome(hubPage(disk), hubOld));
  for (const p of disk) {
    const file = path.join(ROOT, p.file);
    const before = fs.readFileSync(file, 'utf8');
    const after = fillPage(before, p.file, disk);
    if (after !== before) { fs.writeFileSync(file, after); console.log(`✓ fill   ${p.file}`); } else console.log(`= same   ${p.file}`);
  }
  disk = diskPages();
  fs.writeFileSync(hubFile, carryChrome(hubPage(disk), hubOld));
  console.log(`✓ hub    vs/index.html (${disk.length} pages)`);
  // 3) snippets for sitemap.xml and _redirects
  let sitemap = `  <url>\n    <loc>${SITE}/vs/</loc>\n    <lastmod>${MODIFIED}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
  let redirects = '# Reverse-order head-to-head URLs → the one canonical page per pair (paste into /_redirects)\n';
  for (const p of disk) {
    sitemap += `  <url>\n    <loc>${SITE}/vs/${p.vsSlug}</loc>\n    <lastmod>${p.dateModified}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    redirects += `/vs/${pairSlug(p.pair[1], p.pair[0])}  /vs/${p.vsSlug}  301\n`;
  }
  fs.writeFileSync(path.join(ROOT, 'vs', '_sitemap.txt'), sitemap);
  fs.writeFileSync(path.join(ROOT, 'vs', '_redirects.txt'), redirects);
  console.log(`\nSnippets: vs/_sitemap.txt (${disk.length + 1} urls), vs/_redirects.txt (${disk.length} reverse-order 301s)`);
  console.log('Next: node tools/pc-build.mjs  (injects the shared chrome into new pages)');
}

module.exports = { page, fillPage, carryChrome, diskPages, FIRMS, TABLES, PRICE_SRC, titleTag };
if (require.main === module) main();
