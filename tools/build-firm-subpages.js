#!/usr/bin/env node
/**
 * build-firm-subpages.js — generate /firms/<slug>/<page>.html firm subpages
 * (payout rules, account chooser, promo code) in the /blog/ article layout.
 *
 * After generating, run: node tools/pc-build.mjs (injects the shared chrome; idempotent)
 *
 * HOW IT WORKS
 *   Each page is one entry in CONFIGS: bespoke prose + tables. Every rule number
 *   that firms.js holds is READ from data/firms.js at build time (and the build
 *   fails loudly if a field changes shape), so tables stay in sync with the
 *   single source of truth. A few values firms.js does not hold (per-size
 *   buffers, Apex payouts 2-5, Tradeify minimums...) come from the Oct 23, 2026
 *   help-center check and live in VF below, each with its source label; where
 *   firms.js also holds the value the build asserts the two agree.
 *
 *   The template emits only the empty <!-- pc:head -->, <!-- pc:chrome --> and
 *   <!-- pc:footer --> marker pairs; tools/pc-build.mjs fills them in. A freshly
 *   generated page is chromeless until pc-build has run.
 *
 * WAVES + LINKS
 *   Pages ship in waves (wave 1 = P0, wave 2 = P1). Every cross-link to another
 *   page (vs pages, blog posts, tools, best lists, sibling subpages) is emitted
 *   only if that page EXISTS ON DISK at build time (vs/ is scanned for the
 *   firm's head-to-heads), so re-run this script after new pages land.
 *     node tools/build-firm-subpages.js            # build every wave
 *     node tools/build-firm-subpages.js --wave=1   # build wave 1 only; later-wave
 *                                                  # subpages are treated as not
 *                                                  # yet published (never linked)
 *   Then: node tools/pc-build.mjs
 *
 * WRITES: firms/<slug>/<page>.html for each built config. Sitemap <url>
 *   entries are printed to stdout (paste into sitemap.xml by hand).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://propchamps.net';
const PUBLISHED = '2026-10-23';   // schema datePublished
const MODIFIED = '2026-10-23';    // schema dateModified + sitemap <lastmod> + "Last verified"
const D = new Date(MODIFIED + 'T12:00:00Z');
const VERIFIED = D.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); // "Oct 23, 2026"
const MONTH_SHORT = D.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });                         // "Oct"
const MONTH_LONG = D.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });                           // "October"
const YEAR = D.getUTCFullYear();
const WAVE_ARG = process.argv.find((a) => /^--wave=\d+$/.test(a));
const WAVE = WAVE_ARG ? Number(WAVE_ARG.slice(7)) : Infinity;

/* ---------------- basics ---------------- */
function die(msg) { console.error('build-firm-subpages: ' + msg); process.exit(1); }
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const stripTags = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
function same(a, b, what) { if (JSON.stringify(a) !== JSON.stringify(b)) die(what + ' — firms.js and VF disagree: ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b)); }

/* ---------------- firms.js ---------------- */
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', 'firms.js'), 'utf8'), sandbox);
const FIRMS = sandbox.window.FIRMS;
if (!FIRMS) die('could not load window.FIRMS');
function firm(slug) { const f = FIRMS[slug]; if (!f) die('no firm ' + slug); return f; }
function pd(slug, planName, label) {
  const p = (firm(slug).plansDetailed || []).find((x) => x.name === planName);
  if (!p) die(slug + ': no plansDetailed "' + planName + '"');
  const r = p.rules.find((x) => x[0] === label);
  if (!r) die(slug + ' / ' + planName + ': no rule "' + label + '"');
  return r[1];
}
function ps(slug, planName, label) {
  const p = (firm(slug).plansSummary || []).find((x) => x.name === planName);
  if (!p) die(slug + ': no plansSummary "' + planName + '"');
  const v = p.rules[label];
  if (v == null) die(slug + ' / ' + planName + ': no summary field "' + label + '"');
  return v;
}
const num = (t) => Number(String(t).replace(/[$,]/g, ''));
function fmt(n) {
  const r = Math.round(n * 100) / 100;
  return '$' + (Number.isInteger(r) ? r.toLocaleString('en-US') : r.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}
const TOK = /\$\d[\d,]*(?:\.\d+)?K?|\bNone\b/g;
/** All $ amounts (and "None") in a firms.js string, in order; asserts the count so a reshaped field fails the build. */
function vals(str, n, where) {
  const m = (String(str).match(TOK) || []).map((t) => (/K$/.test(t) ? fmt(num(t.slice(0, -1)) * 1000) : t));
  if (n != null && m.length !== n) die('expected ' + n + ' values in ' + (where || '') + ' "' + str + '" — got ' + m.length);
  return m;
}
const sizesOf = (s) => String(s).split(/\s*[\/·]\s*/).map((x) => x.trim()).filter(Boolean);
const sizeNum = (z) => Number(String(z).replace(/K$/i, '')) * 1000;
const pct = (s, where) => { const m = String(s).match(/(\d+)\s*%/); if (!m) die('no % in ' + where + ': ' + s); return Number(m[1]); };
const range = (a) => a[0] + '–' + a[a.length - 1];
const off = (price, p) => fmt(num(price) * (1 - p / 100));

/* ---------------- VF: Oct 23, 2026 help-center check (verified-facts.md) ----------------
   [READ] = official help-center page read Oct 23 · [SITE] = firm marketing/plan data ·
   [INDEX] = official page blocked us; value from a search-index excerpt of it (shown with a
   "per <firm>'s help center, confirm in your dashboard" caveat) · [IMPLIED] = our arithmetic. */
const VF = {
  lucid: {
    minRequest: '$500',                                        // [READ] all paths
    approvedWithin: '2 business days',                         // [READ]
    intradayWindow: '6:00 PM to 3:45 PM ET',                   // [READ] DLL-on intraday payouts
    proBuffer: ['$26,100', '$52,100', '$103,100', '$154,600'], // [READ] = size + initial MLL + $100
    dailyMaxSimProfit: ['$6,000', '$8,000', '$10,000', '$12,000'], // [READ]
    liveTarget: ['$2,000', '$4,000', '$6,000', '$9,000'],      // [READ] live bonus target
    liveBonus: ['$1,000', '$2,000', '$3,000', '$4,500'],       // [READ]
  },
  alpha: {
    methods: 'ACH, wire/SWIFT, Wise and Rise',                 // [READ]
    mins: { zero: '$200', standard: '$500', advanced: '$1,000', direct: '$500' }, // [READ]
  },
  apex: { // [INDEX] every value — apextraderfunding.com and its help center blocked our fetch
    minDaily: { intraday: ['$100', '$200', '$250', '$300'], eod: ['$100', '$250', '$300', '$350'] },
    ladder: {
      intraday: [[1000, 1500, 2000, 2500], [1000, 2000, 2500, 3000], [1000, 2500, 3000, 3000], [1000, 2500, 3000, 4000], [1000, 3000, 4000, 4000], [1000, 3000, 4000, 5000]],
      eod: [[1000, 1500, 2000, 2500], [1000, 1500, 2500, 3000], [1000, 2000, 2500, 3000], [1000, 2500, 3000, 3000], [1000, 2500, 4000, 4000], [1000, 3000, 4000, 5000]],
    },
    maxPAs: 20,
    publicCode: 'SAVENOW',
  },
  tradeify: {
    growth: { // [INDEX] help.tradeify.co/11083796 (accounts bought on/after Sep 12, 2025)
      dayMin: ['$100', '$150', '$200', '$250'], balance: ['$26,500', '$53,000', '$104,500', '$156,500'],
      minReq: ['$250', '$500', '$1,000', '$1,500'],
      caps: [['$1,000', '$1,500', '$2,000', '$2,500'], ['$1,000', '$2,000', '$2,500', '$3,000'], ['$1,000', '$2,500', '$3,000', '$4,000'], ['$1,000', '$3,000', '$4,000', '$5,000']],
    },
    selectDaily: { buffer: ['$1,100', '$2,100', '$2,600', '$3,600'], minReq: '$250' },  // [INDEX]
    selectFlex: { dayMin: ['$100', '$150', '$200', '$250'], minReq: '$250' },          // [INDEX]
    selectAddOn: ['$135', '$205', '$329', '$459'],                                      // [SITE] 50%-consistency add-on price
  },
  topone: {
    eaProfitNeeded: ['$2,000', '$2,500', '$3,500', '$5,000'], // [READ] buffer + $500
  },
};

/* ---------------- data pulled from firms.js (fails fast if a field changes shape) ---------------- */
function lucidData() {
  const s = 'lucid-trading';
  const sizes = sizesOf(pd(s, 'Lucid Pro', 'Account Sizes'));
  const g = (plan, label, n) => vals(pd(s, plan, label), n, 'Lucid ' + plan + ' ' + label);
  const pro = { price: g('Lucid Pro', 'Price (w/ CHAMP)', 4), target: g('Lucid Pro', 'Profit Target', 4), mll: g('Lucid Pro', 'Max Loss Limit (EOD)', 4), dll: g('Lucid Pro', 'Daily Loss Limit', 4), goal: g('Lucid Pro', 'Payout Profit Target (Funded)', 4), reset: g('Lucid Pro', 'Reset Fee', 4) };
  const pc = vals(ps(s, 'LUCID PRO', 'Max Payout'), 8, 'Lucid Pro caps'); pro.cap1 = pc.slice(0, 4); pro.cap2 = pc.slice(4);
  pro.buffer = sizes.map((z, i) => fmt(sizeNum(z) + num(pro.mll[i]) + 100));
  pro.bufferProfit = pro.mll.map((m) => fmt(num(m) + 100));
  same(pro.buffer, VF.lucid.proBuffer, 'Lucid Pro buffer');
  if (!/\$500 min/.test(ps(s, 'LUCID PRO', 'Notes'))) die('Lucid Pro $500 min not in firms.js');
  const flex = { price: g('Lucid Flex', 'Price (w/ CHAMP)', 4), target: g('Lucid Flex', 'Profit Target', 4), mll: g('Lucid Flex', 'Max Loss Limit (EOD)', 4), days: g('Lucid Flex', 'Funded: Min Days of Profit', 4), reset: g('Lucid Flex', 'Reset Fee', 4) };
  flex.cap = vals(ps(s, 'LUCID FLEX', 'Max Payout'), 5, 'Lucid Flex caps').slice(0, 4);
  const daily = { target: g('Lucid Daily', 'Profit Target', 4), mll: g('Lucid Daily', 'Max Loss Limit', 4), dll: g('Lucid Daily', 'Funded: DLL', 4) };
  daily.maxSim = vals(ps(s, 'LUCID DAILY', 'Max Payout'), 5, 'Lucid Daily max sim').slice(1);
  same(daily.maxSim, VF.lucid.dailyMaxSimProfit, 'Lucid Daily max daily sim profit');
  daily.buffer = sizes.map((z, i) => fmt(sizeNum(z) + num(daily.mll[i]) + 100));
  daily.bufferProfit = daily.mll.map((m) => fmt(num(m) + 100));
  const direct = { price: g('Lucid Direct', 'Price (w/ CHAMP)', 4), mll: g('Lucid Direct', 'Max Loss Limit (EOD)', 4), dll: g('Lucid Direct', 'DLL Below Initial Trail', 4) };
  const goals = g('Lucid Direct', 'Payout Profit Goal', 8); direct.goal1 = goals.slice(0, 4); direct.goal2 = goals.slice(4);
  const dc = vals(ps(s, 'LUCID DIRECT', 'Max Payout'), 8, 'Lucid Direct caps'); direct.cap1 = dc.slice(0, 4); direct.cap2 = dc.slice(4);
  return { slug: s, sizes, pro, flex, daily, direct, maxSize: pd(s, 'Lucid Pro', 'Max Size') };
}
function alphaData() {
  const s = 'alpha-futures';
  const g = (plan, label, n) => vals(pd(s, plan, label), n, 'Alpha ' + plan + ' ' + label);
  const zero = { sizes: sizesOf(pd(s, 'Alpha Zero', 'Account Sizes')), price: g('Alpha Zero', 'Monthly Price (list)', 3), target: g('Alpha Zero', 'Profit Target', 3), mll: g('Alpha Zero', 'Max Drawdown (MLL)', 3), dll: g('Alpha Zero', 'Daily Loss Guard (DLL)', 3), evalReset: g('Alpha Zero', 'Evaluation Reset Fee', 3), qualReset: g('Alpha Zero', 'Qualified Reset Fee', 3) };
  const zc = g('Alpha Zero', 'Payout Cap', 4); zero.cap = zc.slice(0, 3); zero.min = zc[3];
  const std = { sizes: sizesOf(pd(s, 'Alpha Standard', 'Account Sizes')), price: g('Alpha Standard', 'Monthly Price (list)', 3), target: g('Alpha Standard', 'Profit Target', 3), mll: g('Alpha Standard', 'Max Drawdown (MLL)', 3), dll: g('Alpha Standard', 'Daily Loss Guard (DLL)', 4).slice(1), evalReset: g('Alpha Standard', 'Evaluation Reset Fee', 3), qualReset: g('Alpha Standard', 'Qualified Reset Fee', 3) };
  const sc = g('Alpha Standard', 'Payout Cap', 4); std.cap = sc.slice(0, 3); std.min = sc[3];
  const adv = { sizes: sizesOf(pd(s, 'Alpha Advanced', 'Account Sizes')), price: g('Alpha Advanced', 'Monthly Price (list)', 3), target: g('Alpha Advanced', 'Profit Target', 3), mll: g('Alpha Advanced', 'Max Drawdown (MLL)', 3), evalReset: g('Alpha Advanced', 'Reset Fee', 3) };
  const ac = g('Alpha Advanced', 'Withdrawal Limit', 2); adv.cap = ac[0]; adv.min = ac[1];
  const dir = { sizes: sizesOf(pd(s, 'Alpha Direct (one-time, straight to funded)', 'Account Sizes')) };
  const gd = (label, n) => g('Alpha Direct (one-time, straight to funded)', label, n);
  dir.price = gd('One-Time Price (list)', 4); dir.goal1 = gd('Profit Target (1st)', 4); dir.goal2 = gd('Profit Target (subsequent)', 4); dir.mll = gd('Max Drawdown (EOD MLL)', 4); dir.dll = gd('Daily Loss Limit', 4);
  const dc = gd('Payout Cap', 5); dir.cap = dc.slice(0, 4); dir.min = dc[4];
  same([zero.min, std.min, adv.min, dir.min], [VF.alpha.mins.zero, VF.alpha.mins.standard, VF.alpha.mins.advanced, VF.alpha.mins.direct], 'Alpha payout minimums');
  const f = firm(s);
  const champ = pct(f.promo.discount, 'Alpha promo');
  const deal = f.boxMore.deal;
  const m40 = deal.match(/MYALPHA40 = (\d+)% off Zero/); const m50 = deal.match(/MYALPHA50 = (\d+)% off Standard, Direct & Advanced/);
  if (!m40 || !m50) die('Alpha public promo text (MYALPHA40 / MYALPHA50) not found in firms.js boxMore.deal');
  return { slug: s, zero, std, adv, dir, champ, pub40: Number(m40[1]), pub50: Number(m50[1]), total: f.payoutTotal };
}
function apexData() {
  const s = 'apex-trader';
  const g = (plan, label, n) => vals(pd(s, plan, label), n, 'Apex ' + plan + ' ' + label);
  const sizes = sizesOf(pd(s, 'Intraday Trail', 'Account Sizes'));
  const d = { slug: s, sizes, target: g('Intraday Trail', 'Profit Target', 4), dd: g('Intraday Trail', 'Max Drawdown', 4), eodDll: g('EOD Trail', 'Daily Loss Limit', 4) };
  d.price = { intradayStd: g('Intraday Trail', 'Eval Price (list)', 4), intradayNoAct: g('Intraday Trail', 'No-Activation Price (list)', 4), eodStd: g('EOD Trail', 'Eval Price (list)', 4), eodNoAct: g('EOD Trail', 'No-Activation Price (list)', 4) };
  same(d.dd, g('EOD Trail', 'Max Drawdown', 4), 'Apex Intraday vs EOD drawdown');
  const capLine = firm(s).payouts.find((p) => /Max payout is capped/.test(p)) || die('Apex cap line missing from payouts[]');
  const cv = vals(capLine, 9, 'Apex cap line'); d.cap1 = cv.slice(0, 4); d.cap6 = cv.slice(4, 8); d.min = cv[8];
  ['intraday', 'eod'].forEach((k) => { same(VF.apex.ladder[k][0].map(fmt), d.cap1, 'Apex ' + k + ' payout-1 caps'); same(VF.apex.ladder[k][5].map(fmt), d.cap6, 'Apex ' + k + ' payout-6 caps'); });
  if (!/max 6 payouts per PA/.test(capLine)) die('Apex "max 6 payouts per PA" missing');
  d.safety = d.dd.map((x) => fmt(num(x) + 100));
  d.champ = pct(firm(s).promo.discount, 'Apex promo');
  d.split = ps(s, 'INTRADAY TRAIL', 'Payout Split');
  d.freq = ps(s, 'INTRADAY TRAIL', 'Payout Frequency');
  d.total = firm(s).payoutTotal;
  if (!/Up to 20 funded \(PA\) accounts/.test(firm(s).note)) die('Apex 20-PA limit missing from note');
  return d;
}
function tradeifyData() {
  const s = 'tradeify';
  const g = (plan, label, n) => vals(pd(s, plan, label), n, 'Tradeify ' + plan + ' ' + label);
  const sizes = sizesOf(pd(s, 'GROWTH', 'Account Sizes'));
  const growth = { price: g('GROWTH', 'One-Time Payment (list)', 4), target: g('GROWTH', 'Profit Target (Eval)', 4), mll: g('GROWTH', 'Max Drawdown', 4), dll: g('GROWTH', 'Daily Loss Limit', 4), reset: g('GROWTH', 'Reset Fee', 4) };
  const gc = vals(ps(s, 'GROWTH', 'Max Payout'), 8, 'Tradeify Growth caps');
  same(gc.slice(0, 4), VF.tradeify.growth.caps[0], 'Tradeify Growth payout-1 caps'); same(gc.slice(4), VF.tradeify.growth.caps[3], 'Tradeify Growth payout-4+ caps');
  const sel = { price: g('SELECT — Evaluation', 'One-Time Payment (list)', 4), target: g('SELECT — Evaluation', 'Profit Target', 4), mll: g('SELECT — Evaluation', 'Max Drawdown', 4), reset: g('SELECT — Evaluation', 'Reset Fee', 4), minDays: ps(s, 'SELECT — DAILY PATH', 'Min. Trading Days') };
  const daily = { cap: g('SELECT — Daily Path', 'Max Payout', 4), dll: g('SELECT — Daily Path', 'Daily Loss Limit', 4), mll: g('SELECT — Daily Path', 'Max Drawdown', 4) };
  const flexp = { cap: g('SELECT — Flex Path', 'Max Payout', 4), mll: g('SELECT — Flex Path', 'Max Drawdown', 4) };
  const lt = { price: g('LIGHTNING', 'One-Time Payment (list)', 4), dll: g('LIGHTNING', 'Daily Loss Limit', 4), mll: g('LIGHTNING', 'Max Drawdown', 4), min: g('LIGHTNING', 'Minimum Payout', 1)[0] };
  const lg = g('LIGHTNING', 'Payout Profit Goal', 8); lt.goal1 = lg.slice(0, 4); lt.goal2 = lg.slice(4);
  const lc = vals(ps(s, 'LIGHTNING', 'Max Payout'), 9, 'Tradeify Lightning caps'); lt.cap1 = lc.slice(0, 4); lt.cap2 = lc.slice(4, 8);
  if (lc[8] !== lt.min) die('Tradeify Lightning minimum disagrees');
  const f = firm(s);
  if (!/Crypto payouts available/.test(ps(s, 'GROWTH', 'Notes'))) die('Tradeify crypto note missing');
  return { slug: s, sizes, growth, sel, daily, flexp, lt, total: f.payoutTotal, growthMinDays: ps(s, 'GROWTH', 'Min. Trading Days') };
}
function topOneData() {
  const s = 'top-one-futures';
  const g = (plan, label, n) => vals(pd(s, plan, label), n, 'Top One ' + plan + ' ' + label);
  const EA = 'Elite Access (1-day pass)', ED = 'Elite Daily (daily payouts)', IN = 'Instant Sim Funded (no eval)', IG = 'Ignite (instant funding)';
  const sizes = sizesOf(pd(s, EA, 'Account Sizes'));
  const ea = { fee: g(EA, 'Evaluation Fee', 5)[0], activation: g(EA, 'Activation Fee', 4), target: g(EA, 'Profit Target', 4), days: g(EA, 'Payout Frequency', 4), buffer: g(EA, 'Payout Buffer', 5).slice(0, 4) };
  const dd = g(EA, 'Max Drawdown (EOD)', 8); ea.ddEval = dd.slice(0, 4); ea.ddFunded = dd.slice(4);
  ea.dll = g(EA, 'Daily Loss Limit', 5).slice(1);
  const ec = g(EA, 'Max Payout / Request', 5); ea.cap = ec.slice(0, 4); ea.min = ec[4];
  ea.profitNeeded = ea.buffer.map((b) => fmt(num(b) + 500));
  same(ea.profitNeeded, VF.topone.eaProfitNeeded, 'Top One Elite Access profit needed');
  ea.intradayActivation = vals(ps(s, 'ELITE ACCESS', 'Notes'), 8, 'Top One EA notes').slice(4);
  const ed = { price: g(ED, 'Monthly Price (list)', 4), target: g(ED, 'Profit Target', 4), dll: g(ED, 'Daily Loss Limit', 4) };
  const edd = g(ED, 'Max Drawdown (EOD)', 8); ed.ddEval = edd.slice(0, 4); ed.ddFunded = edd.slice(4);
  const edc = g(ED, 'Max Payout / Request', 9); ed.cap = edc.slice(0, 4); ed.min = edc[4]; ed.buffer = edc.slice(5);
  const ins = { price: g(IN, 'Price (list, one-time)', 4), dd: g(IN, 'Max Drawdown (EOD trailing)', 4), dll: g(IN, 'Daily Loss Limit', 4) };
  const ic = g(IN, 'Max Payout / Request', 8); ins.cap = ic.slice(0, 4); ins.capLegacy = ic.slice(4);
  ins.goal1 = sizes.map((z) => fmt(sizeNum(z) * 0.06));
  const ig = { price: g(IG, 'List Price', 4), dd: g(IG, 'Max Drawdown (Trailing EOD)', 4), dll: g(IG, 'Daily Loss Limit', 4) };
  const igr = g(IG, 'Payout Rules', 5); ig.min = igr[0]; ig.cap = igr.slice(1);
  ig.goal1 = sizes.map((z) => fmt(sizeNum(z) * 0.05));
  if (!/6% \(1st\) → 5% → 4%/.test(firm(s).payouts.join(' '))) die('Top One Instant 6/5/4% target missing');
  if (!/5% profit target per payout/.test(pd(s, IG, 'Payout Rules'))) die('Top One Ignite 5% target missing');
  return { slug: s, sizes, ea, ed, ins, ig, champ: pct(firm(s).promo.discount, 'Top One promo'), total: firm(s).payoutTotal };
}
const LU = lucidData(), AL = alphaData(), AP = apexData(), TR = tradeifyData(), TO = topOneData();

/* ---------------- link helpers (existence = on disk at build time) ---------------- */
const BUILD = new Set();
function fileFor(url) {
  const p = url.split('#')[0].replace(/^\//, '');
  if (p === '') return 'index.html';
  if (p.endsWith('/')) return p + 'index.html';
  return p + '.html';
}
/* Release wave of the OTHER new pages in the Oct 2026 SEO plan (P0 = 1, P1/P2 = 2). Only consulted
   with --wave=N: a page from a later wave is treated as unpublished even if its file is already on
   disk, so a wave-1 build never links to it. Pages not listed here count as published if on disk. */
const PLAN_WAVES = {
  '/vs/lucid-trading-vs-tradeify': 1, '/best/best-prop-firms-no-consistency-rule': 1, '/tools/prop-firm-consistency-calculator': 1,
  '/best/best-instant-funding-futures-prop-firms': 2, '/vs/lucid-trading-vs-my-funded-futures': 2, '/vs/lucid-trading-vs-take-profit-trader': 2,
  '/vs/alpha-futures-vs-lucid-trading': 2, '/vs/fundednext-vs-lucid-trading': 2, '/vs/alpha-futures-vs-tradeify': 2,
  '/blog/prop-firm-payout-caps': 2, '/blog/how-many-prop-firm-accounts-can-you-have': 2, '/blog/how-do-prop-firms-make-money': 2,
};
function exists(url) {
  const u = url.split('#')[0];
  if (BUILD.has(u)) return true;
  const own = CONFIGS.find((c) => c.url === u);
  if (own && own.wave > WAVE) return false;                 // a later-wave subpage is not published yet
  if (PLAN_WAVES[u] && PLAN_WAVES[u] > WAVE) return false;  // a later-wave page from another group
  return fs.existsSync(path.join(ROOT, fileFor(u)));
}
/** A whole sentence that is emitted only when its link target exists (so absent pages leave no dangling text). */
const more = (url, html) => (exists(url) ? ' ' + html : '');
/** Anchor if the target page exists on disk, else the plain text. */
function L(url, text) { return exists(url) ? '<a href="' + attr(url) + '">' + text + '</a>' : text; }
const VS_TOKEN = { 'apex-trader': 'apex-trader-funding', 'take-profit': 'take-profit-trader' };
const VS_NAME = { 'apex-trader-funding': 'Apex Trader Funding', 'lucid-trading': 'Lucid Trading', 'alpha-futures': 'Alpha Futures', 'tradeify': 'Tradeify', 'my-funded-futures': 'My Funded Futures', 'take-profit-trader': 'Take Profit Trader', 'fundednext': 'FundedNext', 'top-one-futures': 'Top One Futures' };
function vsPages(slug) {
  const tok = VS_TOKEN[slug] || slug;
  const dir = path.join(ROOT, 'vs');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /\.html$/.test(f) && f !== 'index.html' && !f.startsWith('_'))
    .map((f) => f.replace(/\.html$/, '')).filter((v) => v.split('-vs-').includes(tok)).sort()
    .filter((v) => exists('/vs/' + v))
    .map((v) => ['/vs/' + v, v.split('-vs-').map((t) => VS_NAME[t] || t.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())).join(' vs ')]);
}

/* ---------------- HTML components ---------------- */
const MARK = '<sup class="fs-mark" title="Help-center excerpt — confirm in your dashboard">†</sup>';
/** Table with sizes as columns. rows: [label, cells[] | string (spans all sizes)]. */
function sizeTable(idPrefix, sizes, corner, rows, note) {
  let h = '<div class="table-wrap"><table class="data fs-sz"><thead><tr><th scope="col">' + corner + '</th>' +
    sizes.map((z) => '<th scope="col" id="' + idPrefix + '-' + z.toLowerCase() + '">' + z + '</th>').join('') + '</tr></thead><tbody>';
  rows.forEach(([label, cells]) => {
    h += '<tr><th scope="row" class="fs-rh">' + label + '</th>' + (Array.isArray(cells)
      ? cells.map((c) => '<td class="' + (stripTags(c).length > 12 ? 'fs-wrap' : 'fs-num') + '">' + c + '</td>').join('')
      : '<td colspan="' + sizes.length + '">' + cells + '</td>') + '</tr>';
  });
  return h + '</tbody></table></div>' + (note ? '<p class="table-note">' + note + '</p>' : '');
}
/** Plain table. head: [..], rows: [[..]]; first cell of each row is a row header. */
function table(head, rows, note, cls) {
  if (head.length <= 3) cls = (cls ? cls + ' ' : '') + 'fs-fluid';
  return '<div class="table-wrap"><table class="data' + (cls ? ' ' + cls : '') + '"><thead><tr>' + head.map((x) => '<th scope="col">' + x + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map((r) => '<tr>' + r.map((c, i) => (i === 0 ? '<th scope="row" class="fs-rh">' + c + '</th>' : '<td>' + c + '</td>')).join('') + '</tr>').join('') +
    '</tbody></table></div>' + (note ? '<p class="table-note">' + note + '</p>' : '');
}
const P = (s) => '<p>' + s + '</p>';
const UL = (items) => '<ul>' + items.map((x) => '<li>' + x + '</li>').join('') + '</ul>';
const H3 = (s, id) => '<h3' + (id ? ' id="' + id + '"' : '') + '>' + s + '</h3>';
const steps = (items) => '<ol class="fs-steps">' + items.map((x) => '<li>' + x + '</li>').join('') + '</ol>';
const callout = (kind, label, html) => '<div class="callout ' + kind + '"><span class="callout-label">' + label + '</span>' + html + '</div>';
function cards(items) {
  return '<div class="fs-cards">' + items.map((c) => '<div class="fs-card">' + (c.tag ? '<span class="fs-tag">' + c.tag + '</span>' : '') + '<h3>' + c.title + '</h3>' + (c.body ? '<p>' + c.body + '</p>' : '') +
    (c.good ? '<p class="fs-good"><b>Best for:</b> ' + c.good + '</p>' : '') + (c.watch ? '<p class="fs-watch"><b>Watch out:</b> ' + c.watch + '</p>' : '') + '</div>').join('') + '</div>';
}
function cta(slug, line) {
  const f = firm(slug);
  return '<div class="fs-cta" data-reveal>' +
    '<img src="' + attr(f.logo) + '" alt="' + attr(f.name + ' logo') + '" width="44" height="44" loading="lazy">' +
    '<div class="fs-cta-copy"><b>' + esc(f.name) + '</b><span>' + line + '</span></div>' +
    '<button type="button" class="fs-code" data-copy="CHAMP" aria-label="Copy discount code CHAMP">Code <b>CHAMP</b></button>' +
    '<a class="btn-primary" href="' + attr(f.affiliateUrl) + '" target="_blank" rel="sponsored noopener">Visit ' + esc(f.name) + ' →</a>' +
    '<p class="fs-disc">Affiliate link: PropChamps may earn a commission at no extra cost to you. It never changes the rules or numbers on this page. ' + L('/methodology', 'How we verify') + '.</p></div>';
}

/* ================================================================
   PAGE CONFIGS
   ================================================================ */
const lu = LU, al = AL, ap = AP, tr = TR, to = TO;
/** Sizes where Alpha Standard lists for less than Zero (so Zero is only the lowest ENTRY price, via its 25K). */
const zeroDearer = al.zero.sizes.filter((z, i) => { const j = al.std.sizes.indexOf(z); return j >= 0 && num(al.std.price[j]) < num(al.zero.price[i]); });
const ALL4 = (v) => [v, v, v, v];

const CONFIGS = [
/* ---------------------------------------------------------------- Lucid payout rules (P0) */
{
  url: '/firms/lucid-trading/payout-rules', firm: 'lucid-trading', wave: 1, crumb: 'Payout rules',
  title: 'Lucid Trading Payout Rules 2026: Caps, Minimums & Timing',
  metaDesc: 'Lucid Pro, Flex, Daily & Direct payout rules: $500 minimum, 90/10 split, caps by size, buffers, consistency and how to request. Verified Oct 23, 2026.',
  h1: 'Lucid Trading Payout Rules (2026): Pro, Flex, Daily &amp; Direct',
  eyebrow: 'Lucid Trading · Payout rules',
  dek: 'Every Lucid funded account pays 90/10 with a $500 minimum and no fixed payout window. What changes by path is the condition you must meet first, and how much one request can take. Here are the exact numbers for every account size.',
  answer: () => [
    'Every path pays a <strong>90/10 split</strong> with a <strong>' + VF.lucid.minRequest + ' minimum</strong> and <strong>no fixed payout window</strong>: you can request any day once that path’s conditions are met. Approved funds are sent within ' + VF.lucid.approvedWithin + '.',
    '<strong>LucidPro:</strong> per-cycle profit goal of ' + range(lu.pro.goal) + ', balance above the buffer (initial max loss + $100) and a 40% consistency rule. Caps ' + range(lu.pro.cap1) + ' on payout 1, ' + range(lu.pro.cap2) + ' after.',
    '<strong>LucidFlex:</strong> 5 profit days of ' + range(lu.flex.days) + ' per cycle, then withdraw up to 50% of profit, capped at ' + range(lu.flex.cap) + '. No buffer and no funded consistency rule.',
    '<strong>LucidDaily:</strong> request every day from profit above the buffer, with <strong>no per-payout cap</strong>. Reaching the max daily sim profit (' + range(lu.daily.maxSim) + ') moves you live.',
    '<strong>LucidDirect:</strong> no evaluation. Hit a profit goal (' + range(lu.direct.goal1) + ' for payout 1) with a 20% consistency rule; caps ' + range(lu.direct.cap1) + ' for payouts 1–3, up to ' + lu.direct.cap2[3] + ' for payouts 4–5.',
  ],
  sections: () => [
    { id: 'at-a-glance', label: 'At a glance', html:
      '<h2 id="at-a-glance">Lucid payout rules at a glance</h2>' +
      P('Lucid runs four funded paths. They share the split, the minimum and the payout methods; the rest differs. This table is the quick version. Each path has a full size-by-size table below.') +
      table(['Path', 'When you can request', 'Cap per payout', 'Funded consistency', 'Buffer'], [
        ['<a href="#lucidpro">LucidPro</a>', 'Any day once the cycle profit goal, buffer and 40% rule are met', range(lu.pro.cap1) + ' (1st) → ' + range(lu.pro.cap2) + ' (2nd+)', '40%', 'Initial max loss + $100'],
        ['<a href="#lucidflex">LucidFlex</a>', 'After 5 profit days in the cycle', '50% of profit, up to ' + range(lu.flex.cap), 'None', 'None'],
        ['<a href="#luciddaily">LucidDaily</a>', 'Daily', 'No per-payout cap above the buffer', 'None', 'Initial max loss + $100'],
        ['<a href="#luciddirect">LucidDirect</a>', 'Any day once the profit goal and 20% rule are met', range(lu.direct.cap1) + ' (1–3) → up to ' + lu.direct.cap2[3] + ' (4–5)', '20%', 'Profit goal per payout'],
      ], 'All paths: 90/10 split · ' + VF.lucid.minRequest + ' minimum request · no fixed payout window. Source: Lucid help center (support.lucidtrading.com), read ' + VERIFIED + '.', 'fs-glance') +
      P('For the full rule set (targets, drawdown, platforms), see our ' + L('/firms/lucid-trading', 'Lucid Trading review') + '. Not sure which path to buy? Read ' + L('/firms/lucid-trading/which-account-is-best', 'which Lucid account is best') + '.') },

    { id: 'lucidpro', label: 'LucidPro', html:
      '<h2 id="lucidpro">LucidPro payout rules</h2>' +
      P('LucidPro is the one-day-pass evaluation: there is no consistency rule while you are being evaluated. Once funded, each payout has three conditions: the cycle’s profit goal, a balance above the buffer, and a 40% consistency check at the moment you request.') +
      sizeTable('pro', lu.sizes, 'LucidPro', [
        ['Evaluation profit target', lu.pro.target],
        ['Max loss limit (end-of-day)', lu.pro.mll],
        ['Profit goal per payout cycle', lu.pro.goal],
        ['Balance needed to request (buffer)', lu.pro.buffer],
        ['Cap: payout 1', lu.pro.cap1],
        ['Cap: payouts 2 and later', lu.pro.cap2],
        ['Minimum request', VF.lucid.minRequest + ' at every size'],
        ['Daily loss limit (optional, set at purchase)', lu.pro.dll],
        ['Consistency', 'None in the evaluation · 40% when funded, checked at payout time'],
      ], 'Buffer = starting balance + initial max loss limit + $100 (Lucid: profit must exceed “the initial max loss limit plus $100”). 25K DLL: Lucid’s evaluation and DLL articles list none; one funded-overview article lists $600, so check your dashboard.') +
      UL([
        '<strong>No minimum number of days is stated.</strong> In practice the 40% rule means at least three profitable days, because one day can’t be more than 40% of the total (our reading).',
        '<strong>The consistency rule resets after each payout.</strong> Lucid divides your largest day by your account profit at the time you request.',
        '<strong>Live:</strong> after payout 5 you join Lucid’s live review pool.',
        '<strong>Legacy accounts:</strong> LucidPro accounts bought or reset before Nov 28, 2025 (3:00 PM EST) keep a 35% consistency rule and are paid 100% of the first $10K.',
      ]) },

    { id: 'lucidflex', label: 'LucidFlex', html:
      '<h2 id="lucidflex">LucidFlex payout rules</h2>' +
      P('LucidFlex drops the buffer and the funded consistency rule. In exchange, every payout waits for five profit days, and you can take at most half of your profit per request.') +
      sizeTable('flex', lu.sizes, 'LucidFlex', [
        ['Evaluation profit target', lu.flex.target],
        ['Max loss limit (end-of-day)', lu.flex.mll],
        ['Profit days needed per payout (5 days, each at least)', lu.flex.days],
        ['Max per request (50% of profit, capped at)', lu.flex.cap],
        ['Minimum request', VF.lucid.minRequest + ' at every size'],
        ['Buffer', 'None. At your first payout the max loss limit locks at the starting balance + $100'],
        ['Consistency', '40% in the evaluation (50% with a paid add-on that lets you pass in as few as 2 days) · none when funded'],
        ['Payouts before live', 'Up to 5, then you are moved live'],
      ], 'You also need any positive net profit in the cycle. The cap does not rise with later payouts. The DLL is optional at purchase; funded Flex accounts have a scaling plan. Source: Lucid help center, read ' + VERIFIED + '.') +
      callout('tip', 'Worked example · first payout on a 50K LucidFlex',
        '<p>Six trading days in the cycle: +$400, −$200, +$250, +$600, +$150, +$300. Five of them are profit days of at least ' + lu.flex.days[1] + ' (the −$200 day doesn’t count), so the 5-day condition is met. Net profit is <strong>$1,500</strong>.</p>' +
        '<p>50% of $1,500 is <strong>$750</strong>. That is under the 50K cap of ' + lu.flex.cap[1] + ' and over the ' + VF.lucid.minRequest + ' minimum, so $750 is the most you can request. At 90/10, $675 of it is yours. Your max loss limit then locks at $50,100. (Our arithmetic from Lucid’s rules.)</p>') },

    { id: 'luciddaily', label: 'LucidDaily', html:
      '<h2 id="luciddaily">LucidDaily payout rules</h2>' +
      P('LucidDaily is the daily-payout path. Once funded you can request every day, and there is no per-payout cap: you can take the full sim profit above the buffer. The trade-offs are an intraday trailing drawdown when funded and a strict news rule.') +
      sizeTable('daily', lu.sizes, 'LucidDaily', [
        ['Evaluation profit target', lu.daily.target],
        ['Max loss limit', lu.daily.mll],
        ['Balance needed to request (buffer)', lu.daily.buffer],
        ['Per-payout cap', 'None: the full sim profit above the buffer'],
        ['Max daily sim profit (then moved live)', lu.daily.maxSim],
        ['Minimum request', VF.lucid.minRequest + ' at every size'],
        ['Daily loss limit (if switched on)', lu.daily.dll],
        ['Drawdown', 'Evaluation: you choose end-of-day or intraday · Funded: always intraday'],
        ['Consistency', '40% in the evaluation (50% add-on) · none when funded'],
      ], 'Each request also needs any positive net profit since your last payout. Lucid’s Oct 20, 2026 article gives the 40% / 50% evaluation options; some older articles still say 50%.') +
      callout('warn', 'News rule', '<p>On a funded LucidDaily account, trading red-folder USD news is a <strong>hard breach</strong>, not just a payout delay. You must be flat from 1 minute before to 1 minute after the release. Pro, Flex and Direct allow trading around news. More in our ' + L('/blog/prop-firm-news-trading-rules', 'news trading rules') + ' guide.</p>') },

    { id: 'luciddirect', label: 'LucidDirect', html:
      '<h2 id="luciddirect">LucidDirect payout rules</h2>' +
      P('LucidDirect skips the evaluation: you start funded. Instead of an evaluation target, each payout has its own profit goal, and the 20% consistency rule is the strictest at Lucid.') +
      sizeTable('direct', lu.sizes, 'LucidDirect', [
        ['Max loss limit (end-of-day)', lu.direct.mll],
        ['Daily loss limit', lu.direct.dll],
        ['Profit goal: payout 1', lu.direct.goal1],
        ['Profit goal: payouts 2 and later', lu.direct.goal2],
        ['Cap: payouts 1–3', lu.direct.cap1],
        ['Cap: payouts 4–5', lu.direct.cap2],
        ['Minimum request', VF.lucid.minRequest + ' at every size'],
        ['Consistency', '20%'],
      ], 'Payout 5 puts you in Lucid’s live review pool. LucidDirect counts toward the 5-funded-accounts-per-household limit shared by every Lucid type. Source: Lucid help center, read ' + VERIFIED + '.') +
      UL([
        '<strong>No minimum days are stated,</strong> but a 20% rule means at least five profitable days in practice (our reading).',
        '<strong>On 25K the first goal is bigger than the cap.</strong> You need ' + lu.direct.goal1[0] + ' of profit for payout 1, and you can withdraw at most ' + lu.direct.cap1[0] + ' of it (our reading of the two tables).',
        '<strong>50K and up always have a DLL,</strong> which also lets you request intraday payouts (see below).',
      ]) },

    { id: 'consistency', label: 'Consistency', html:
      '<h2 id="consistency">How consistency affects your first Lucid payout</h2>' +
      P('Consistency only matters on two funded paths: LucidPro (40%) and LucidDirect (20%). Flex and Daily have no funded consistency rule. Lucid checks it when you request: your largest day divided by your account profit.') +
      callout('tip', 'Worked example · 50K LucidPro',
        '<p>Your best day is $900. At $2,000 of total profit, 900 ÷ 2,000 = 45%. That is over 40%, so the payout waits. At $2,300 of profit, 900 ÷ 2,300 = 39%, which is under the line. By then the other two conditions are met too: your balance is above ' + lu.pro.buffer[1] + ' and you have cleared the ' + lu.pro.goal[1] + ' cycle goal.</p>' +
        '<p>On LucidDirect’s 20% rule the same $900 day needs about $4,500 of total profit before you are eligible. (Our arithmetic.)</p>') +
      P('Going over the limit doesn’t take profit away. It only delays the request until more good days dilute the big one. The full explanation, firm by firm, is in ' + L('/blog/prop-firm-consistency-rules', 'prop firm consistency rules explained') + (exists('/tools/prop-firm-consistency-calculator') ? ', and you can check your own numbers with the ' + L('/tools/prop-firm-consistency-calculator', 'consistency calculator') : '') + '.' +
        more('/best/best-prop-firms-no-consistency-rule', 'Plans with no consistency rule at any stage are listed in ' + L('/best/best-prop-firms-no-consistency-rule', 'futures prop firms with no consistency rule') + '.')) },

    { id: 'drawdown-dll', label: 'Drawdown & DLL', html:
      '<h2 id="drawdown-dll">Drawdown after a payout, the DLL and intraday payouts</h2>' +
      UL([
        '<strong>Drawdown type:</strong> end-of-day on Pro, Flex and Direct. LucidDaily lets you choose end-of-day or intraday in the evaluation, but a funded Daily account is always intraday.',
        '<strong>Flex lock:</strong> at your first LucidFlex payout, the max loss limit locks at the starting balance + $100.',
        '<strong>LucidScale DLL:</strong> on funded accounts, once your balance is above the initial trail, the daily loss limit becomes 60% of your highest end-of-day profit.',
        '<strong>Intraday payouts if the DLL is on:</strong> funded Pro, Flex and Daily accounts with the DLL switched on, and every 50K+ Direct account, can request a payout during the session from that session’s profit (' + VF.lucid.intradayWindow + '). With the DLL off, requests follow the normal end-of-day schedule.',
        '<strong>Flat by 4:45 PM EST:</strong> all positions must be closed by then on every path.',
      ]) +
      P('Lucid’s payout articles we read only describe the Flex lock; for the other paths, check where your floor sits in the dashboard before you request. Background: ' + L('/blog/prop-firm-drawdown-explained', 'trailing drawdown explained') + ' and ' + L('/blog/what-is-a-daily-loss-limit', 'what a daily loss limit is') + '.') },

    { id: 'how-to-request', label: 'How to request', html:
      '<h2 id="how-to-request">How to request a Lucid payout</h2>' +
      steps([
        '<strong>Check your path’s condition.</strong> Pro: cycle profit goal, balance above the buffer, best day under 40%. Flex: 5 profit days and positive net profit in the cycle. Daily: balance above the buffer and positive net profit since the last payout. Direct: the payout’s profit goal and the 20% rule.',
        '<strong>Size the request.</strong> At least ' + VF.lucid.minRequest + ', and no more than the cap for your size and payout number. On Flex, no more than 50% of the cycle’s profit; on Daily, up to all profit above the buffer.',
        '<strong>Pick the timing.</strong> With the DLL on you can request intraday from that session’s profit; otherwise the request follows the end-of-day schedule.',
        '<strong>Submit it from your Lucid dashboard.</strong> Approved funds are sent within ' + VF.lucid.approvedWithin + ' via Plaid (US), WorkMarket by ADP (bank or PayPal), or crypto for international traders.',
      ]) },

    { id: 'denied', label: 'Why payouts get held', html:
      '<h2 id="denied">Why Lucid payouts get held or denied</h2>' +
      P('Almost every held payout comes back to one of the conditions above. Check these before you click request:') +
      UL([
        '<strong>Best day too big:</strong> over 40% of profit on Pro (35% on legacy Pro accounts) or 20% on Direct. Keep trading normal days until it drops under the line.',
        '<strong>Balance not above the buffer</strong> on Pro or Daily. On 50K that means profit above ' + lu.pro.bufferProfit[1] + '.',
        '<strong>Fewer than five qualifying profit days</strong> on Flex. Days under ' + lu.flex.days[0] + ' (25K) to ' + lu.flex.days[3] + ' (150K) don’t count, and the cycle must be net positive.',
        '<strong>Wrong amount:</strong> under ' + VF.lucid.minRequest + ', over the cap, or over 50% of profit on Flex.',
        '<strong>Profit goal not reached:</strong> the Pro cycle goal or the Direct per-payout goal.',
        '<strong>A rule breach before the request:</strong> red-folder news on a funded LucidDaily account is a hard breach, and every path must be flat by 4:45 PM EST.',
        '<strong>Account limits:</strong> 5 funded accounts per household across every Lucid type. If one household member is live, the others may not trade sim accounts.' + more('/blog/how-many-prop-firm-accounts-can-you-have', 'Every firm’s limits: ' + L('/blog/how-many-prop-firm-accounts-can-you-have', 'how many prop firm accounts you can have') + '.'),
      ]) +
      P('For how this works across the industry, see ' + L('/blog/how-prop-firm-payouts-work', 'how prop firm payouts work') + ' and ' + L('/blog/do-prop-firms-actually-pay', 'do prop firms actually pay') + '.') },

    { id: 'live', label: 'Going live', html:
      '<h2 id="live">When Lucid moves you to a live account</h2>' +
      UL([
        '<strong>Pro and Direct:</strong> payout 5 puts you in the live review pool.',
        '<strong>Flex:</strong> after 5 payouts you are moved live.',
        '<strong>Daily:</strong> reaching the max daily sim profit (' + range(lu.daily.maxSim) + ') moves you live automatically.',
      ]) +
      P('Per Lucid’s Oct 14, 2026 live-structure article, live accounts start at a $0 balance with daily payouts, an end-of-day drawdown, no DLL and no consistency rule. Instead of going live you can take a cashout of 50% of your live starting balance (at 90/10), with 24 hours to choose. There is also a repeatable live bonus: reach the live profit target (' + range(VF.lucid.liveTarget) + ') and 20 trading days to earn ' + range(VF.lucid.liveBonus) + '.') +
      cta('lucid-trading', 'Code CHAMP applies the current discount at checkout. Confirm the price before you pay.') },
  ],
  faq: () => [
    { q: 'What are Lucid Trading’s payout rules?', a: 'Every Lucid funded path pays 90/10 with a ' + VF.lucid.minRequest + ' minimum and no fixed payout window. LucidPro needs a per-cycle profit goal, a balance above the buffer and 40% consistency. LucidFlex needs 5 profit days and pays up to 50% of profit. LucidDaily pays daily above the buffer with no per-payout cap. LucidDirect needs a per-payout profit goal and 20% consistency.' },
    { q: 'What is the Lucid Trading minimum payout?', a: VF.lucid.minRequest + ' on every path: Pro, Flex, Daily and Direct. Lucid’s help center states ' + VF.lucid.minRequest + '; we found nothing there stating a lower minimum.' },
    { q: 'Does Lucid Trading have a payout cap?', a: 'Yes on three paths. LucidPro caps payout 1 at ' + range(lu.pro.cap1) + ' and later payouts at ' + range(lu.pro.cap2) + '. LucidFlex pays up to 50% of profit, capped at ' + range(lu.flex.cap) + '. LucidDirect caps payouts 1–3 at ' + range(lu.direct.cap1) + ' and payouts 4–5 at ' + range(lu.direct.cap2) + '. LucidDaily has no per-payout cap above the buffer, but reaching the max daily sim profit (' + range(lu.daily.maxSim) + ') moves you live.' },
    { q: 'How long do Lucid Trading payouts take?', a: 'There is no fixed payout window: you can request any day once you meet your path’s conditions. Lucid says approved funds are sent within ' + VF.lucid.approvedWithin + '.' },
    { q: 'What are the LucidFlex payout rules?', a: 'You need 5 profit days in the cycle (' + lu.flex.days.join(' / ') + ' or more for 25K / 50K / 100K / 150K) and positive net profit. You can then withdraw up to 50% of profit, capped at ' + lu.flex.cap.join(' / ') + ', with a ' + VF.lucid.minRequest + ' minimum. There is no buffer and no funded consistency rule, and after 5 payouts you are moved live.' },
    { q: 'What are the LucidPro payout rules?', a: 'Each payout needs the cycle profit goal (' + lu.pro.goal.join(' / ') + '), a balance above the buffer (' + lu.pro.buffer.join(' / ') + ') and a best day under 40% of profit. Payout 1 is capped at ' + lu.pro.cap1.join(' / ') + ' and later payouts at ' + lu.pro.cap2.join(' / ') + '. The minimum is ' + VF.lucid.minRequest + '.' },
    { q: 'Does Lucid Trading have daily payouts?', a: 'Yes. LucidDaily lets you request a payout every day from profit above the buffer, with no per-payout cap. Separately, funded Pro, Flex and Daily accounts with the DLL switched on, and 50K+ Direct accounts, can request intraday from that session’s profit.' },
    { q: 'What happens to the drawdown after a Lucid payout?', a: 'On LucidFlex the max loss limit locks at the starting balance + $100 at your first payout. On funded accounts, once you are above the initial trail, the LucidScale daily loss limit becomes 60% of your highest end-of-day profit. A funded LucidDaily account always uses an intraday drawdown.' },
    { q: 'How do you get paid by Lucid Trading?', a: 'Lucid pays through Plaid (US), WorkMarket by ADP (bank or PayPal), and crypto for international traders.' },
    { q: 'What is the Lucid Trading payout split?', a: '90/10 on every path: you keep 90%. LucidPro accounts bought or reset before Nov 28, 2025 are paid 100% of the first $10K and keep a 35% consistency rule.' },
    { q: 'When does Lucid Trading move you to a live account?', a: 'Pro and Direct join the live review pool after payout 5, Flex moves live after 5 payouts, and Daily moves live when you reach the max daily sim profit. Live accounts start at $0 with daily payouts, end-of-day drawdown, no DLL and no consistency rule.' },
  ],
  related: () => [['/firms/lucid-trading', 'Lucid Trading review'], ['/firms/lucid-trading/which-account-is-best', 'Which Lucid account is best?'], ['/blog/how-prop-firm-payouts-work', 'How prop firm payouts work'], ['/blog/prop-firm-consistency-rules', 'Consistency rules by firm'], ['/tools/prop-firm-consistency-calculator', 'Consistency calculator'], ['/blog/prop-firm-payout-caps', 'Payout caps at every firm'], ['/best/best-prop-firms-fast-payouts', 'Fastest-paying futures firms'], ['/blog/prop-firm-drawdown-explained', 'Trailing drawdown explained']],
},

/* ---------------------------------------------------------------- Lucid account chooser (P0) */
{
  url: '/firms/lucid-trading/which-account-is-best', firm: 'lucid-trading', wave: 1, crumb: 'Which account is best?',
  title: 'Lucid Flex vs Pro vs Daily vs Direct: Which Lucid Account?',
  metaDesc: 'Which Lucid Trading account is best? Pro, Flex, Daily and Direct compared: price with CHAMP, target, drawdown, DLL, consistency and payouts. Oct 2026.',
  h1: 'Which Lucid Trading Account Is Best? Flex vs Pro vs Daily vs Direct',
  eyebrow: 'Lucid Trading · Account chooser',
  dek: 'Lucid sells four accounts that look alike on the evaluation and behave very differently once you are funded. This page puts them side by side at every size and matches each one to the kind of trader it suits.',
  scripts: 'sizes',
  answer: () => {
    const cheaper = lu.sizes.filter((z, i) => num(lu.flex.price[i]) < num(lu.pro.price[i]));
    return [
      '<strong>LucidFlex</strong> if you want the lowest fixed entry price at most sizes (' + lu.flex.price[1] + ' for 50K with CHAMP; LucidDaily is priced at checkout) and no consistency rule once funded. The cost: 5 profit days per payout and payouts of at most 50% of profit, capped at ' + range(lu.flex.cap) + '.',
      '<strong>LucidPro</strong> if you want to pass in one day (no evaluation consistency rule) and bigger caps after payout 1 (' + range(lu.pro.cap2) + '). Once funded you face a 40% rule and a buffer.',
      '<strong>LucidDaily</strong> if you want to request a payout every day with no per-payout cap. The cost: an intraday drawdown when funded, and red-folder news is a hard breach.',
      '<strong>LucidDirect</strong> if you want to skip the evaluation. It costs more up front than a Pro or Flex evaluation (' + range(lu.direct.price) + ' with CHAMP) and pairs a 20% consistency rule with a profit goal before every payout.',
      'Flex is cheaper than Pro with CHAMP at ' + cheaper.join(', ') + (cheaper.length < 4 ? '; at ' + lu.sizes.filter((z) => !cheaper.includes(z)).join(', ') + ' Pro is slightly cheaper' : '') + '.',
    ];
  },
  sections: () => {
    const i50 = lu.sizes.indexOf('50K');
    const cell = (arr) => '<td class="' + (arr.some((v) => String(v).length > 12) ? 'fs-wrap' : 'fs-num') + '" data-s="' + attr(JSON.stringify(arr)) + '">' + esc(arr[i50]) + '</td>';
    const txt = (s) => '<td>' + s + '</td>';
    const row = (label, cells) => '<tr><th scope="row" class="fs-rh">' + label + '</th>' + cells.join('') + '</tr>';
    const flexNeed = lu.sizes.map(() => '$1,000 net');
    const dailyNeed = lu.daily.bufferProfit.map((b) => fmt(num(b) + 500));
    const cmp = '<div class="fs-sizes" role="group" aria-label="Account size">' + lu.sizes.map((z, i) => '<button type="button" data-size="' + i + '" aria-pressed="' + (i === i50 ? 'true' : 'false') + '">' + z + '</button>').join('') + '</div>' +
      '<div class="table-wrap"><table class="data fs-sz fs-cmp"><caption class="fs-cap">Showing <b data-size-label>50K</b> accounts</caption><thead><tr><th scope="col"></th><th scope="col">LucidPro</th><th scope="col">LucidFlex</th><th scope="col">LucidDaily</th><th scope="col">LucidDirect</th></tr></thead><tbody>' +
      row('Price with CHAMP', [cell(lu.pro.price), cell(lu.flex.price), txt('Configurable at checkout'), cell(lu.direct.price)]) +
      row('Structure', [txt('Evaluation, then funded'), txt('Evaluation, then funded'), txt('Configurable evaluation, then funded'), txt('Straight to funded')]) +
      row('Evaluation profit target', [cell(lu.pro.target), cell(lu.flex.target), cell(lu.daily.target), txt('None')]) +
      row('Max loss limit', [cell(lu.pro.mll), cell(lu.flex.mll), cell(lu.daily.mll), cell(lu.direct.mll)]) +
      row('Drawdown type', [txt('End-of-day'), txt('End-of-day'), txt('EOD or intraday in eval · intraday funded'), txt('End-of-day')]) +
      row('Daily loss limit', [cell(lu.pro.dll.map((d) => 'Optional · ' + d)), txt('Optional (on/off at purchase)'), cell(lu.daily.dll.map((d) => 'Optional · ' + d)), cell(lu.direct.dll)]) +
      row('Evaluation consistency', [txt('None (1-day pass)'), txt('40% (50% add-on)'), txt('40% (50% add-on)'), txt('No evaluation')]) +
      row('Funded consistency', [txt('40%'), txt('None'), txt('None'), txt('20%')]) +
      row('Before payout 1 you need', [cell(lu.pro.goal.map((g, i) => g + ' cycle goal + balance above ' + lu.pro.buffer[i])), cell(lu.flex.days.map((d) => '5 profit days of ' + d + '+')), cell(lu.daily.buffer.map((b) => 'Balance above ' + b)), cell(lu.direct.goal1.map((g) => g + ' profit goal'))]) +
      row('Least profit for a first request (our arithmetic)', [cell(lu.pro.bufferProfit.map((b) => 'More than ' + b)), cell(flexNeed), cell(dailyNeed), cell(lu.direct.goal1)]) +
      row('Cap per payout', [cell(lu.pro.cap1.map((c, i) => c + ' → ' + lu.pro.cap2[i])), cell(lu.flex.cap.map((c) => '50% of profit, up to ' + c)), txt('No per-payout cap'), cell(lu.direct.cap1.map((c, i) => c + ' → ' + lu.direct.cap2[i]))]) +
      row('When you can request', [txt('Any day once eligible'), txt('After every 5 profit days'), txt('Daily'), txt('Any day once eligible')]) +
      row('Route to live', [txt('Live review after payout 5'), txt('Moved live after 5 payouts'), txt('Moved live at the max daily sim profit'), txt('Live review after payout 5')]) +
      row('News when funded', [txt('Allowed'), txt('Allowed'), txt('Red-folder news is a hard breach'), txt('Allowed')]) +
      row('Activation fee', [txt('Free'), txt('Free'), txt('Free'), txt('Included in the one-time price')]) +
      row('Reset fee', [cell(lu.pro.reset), cell(lu.flex.reset), txt('Configurable'), txt('n/a (no evaluation)')]) +
      '</tbody></table></div><p class="table-note">CHAMP prices are what Lucid’s checkout showed at our last check (promotional pricing was live). Confirm the price at checkout. “Least profit” rows: Pro’s profit must clear the buffer before you can request (the articles we read don’t say whether the request may take the balance back under it); Flex needs 50% of profit to cover the ' + VF.lucid.minRequest + ' minimum; Daily needs ' + VF.lucid.minRequest + ' above the buffer; Direct needs the payout-1 goal.</p>';
    return [
      { id: 'quick-pick', label: 'Quick pick', html:
        '<h2 id="quick-pick">The four Lucid accounts in one minute</h2>' +
        cards([
          { tag: 'Low entry price', title: 'LucidFlex', body: lu.flex.price[1] + ' for 50K with CHAMP. Same target and max loss as Pro, no funded consistency rule, no buffer.', good: 'traders who have big days, and anyone on a tight budget.', watch: '5 profit days per payout, and each payout is at most 50% of profit (' + range(lu.flex.cap) + ' cap).' },
          { tag: 'Fastest pass', title: 'LucidPro', body: 'No consistency rule in the evaluation, so you can pass in one day. Caps step up after payout 1.', good: 'traders who want to pass quickly and withdraw larger amounts per payout.', watch: '40% funded consistency, plus a buffer of the initial max loss + $100 before any payout.' },
          { tag: 'Daily payouts', title: 'LucidDaily', body: 'Request every day once funded, with no per-payout cap above the buffer. The evaluation is configurable.', good: 'traders who want to cash out often and don’t trade the news.', watch: 'Intraday drawdown when funded; red-folder news is a hard breach.' },
          { tag: 'No evaluation', title: 'LucidDirect', body: 'Straight to funded for a one-time ' + range(lu.direct.price) + ' with CHAMP.', good: 'traders who would rather pay more than pass an evaluation.', watch: '20% consistency and a profit goal before every payout (' + range(lu.direct.goal1) + ' for the first).' },
        ]) },
      { id: 'compare', label: 'Side by side', html:
        '<h2 id="compare">Lucid Pro vs Flex vs Daily vs Direct, side by side</h2>' +
        P('Pick a size to update the table. Rows that don’t change with size show the same value at every size.') + cmp },
      { id: 'prices', label: 'Prices', html:
        '<h2 id="prices">Lucid prices with CHAMP, by size</h2>' +
        sizeTable('price', lu.sizes, 'Price with CHAMP', [
          ['LucidPro', lu.pro.price], ['LucidFlex', lu.flex.price], ['LucidDaily', 'Configurable: you pick the drawdown and DLL options at checkout'], ['LucidDirect (one-time)', lu.direct.price],
          ['Reset: LucidPro', lu.pro.reset], ['Reset: LucidFlex', lu.flex.reset],
        ], 'Activation is free on Pro, Flex and Daily; on Direct it is included in the one-time price. If you pass on the first try, the CHAMP price is your full cost to reach a funded account; each failed attempt adds a reset fee. Prices: Lucid checkout at our last check, ' + 'promotional pricing live. Confirm at checkout.') +
        P('Of the accounts with a fixed price, the cheapest way into a funded Lucid account is a LucidFlex evaluation at the size you need (LucidDaily is priced at checkout); at ' + lu.sizes.filter((z, i) => num(lu.flex.price[i]) >= num(lu.pro.price[i])).join(', ') + ' LucidPro is the cheaper evaluation. LucidDirect costs ' + lu.direct.price[1] + ' at 50K, but there is nothing to pass and no reset to buy.') },
      { id: 'by-trader', label: 'By trader type', html:
        '<h2 id="by-trader">Which Lucid account fits how you trade?</h2>' +
        table(['If you…', 'Look at', 'Why'], [
          ['are on a tight budget', 'LucidFlex', 'Cheaper than Pro with CHAMP at most sizes, and no funded consistency rule.'],
          ['want to pass in one day', 'LucidPro', 'No evaluation consistency rule. Flex and Daily use a 40% evaluation rule (our reading: at least three days); Flex’s paid 50% add-on lets you pass in as few as 2 days.'],
          ['want to withdraw every day', 'LucidDaily', 'Daily requests and no per-payout cap above the buffer.'],
          ['trade the news', 'Pro, Flex or Direct', 'A funded LucidDaily account treats red-folder news as a hard breach.'],
          ['make most of your money on a few big days', 'LucidFlex or LucidDaily', 'Neither has a funded consistency rule. Direct’s 20% rule is the strictest.'],
          ['don’t want to take an evaluation', 'LucidDirect', 'Straight to funded, for a higher one-time price.'],
          ['want large single withdrawals', 'LucidDaily or LucidPro', 'Daily has no per-payout cap above the buffer; Pro allows up to ' + lu.pro.cap2[3] + ' from payout 2 on 150K.'],
          ['want an end-of-day drawdown when funded', 'Pro, Flex or Direct', 'A funded LucidDaily account is always intraday.'],
        ]) },
      { id: 'flex-vs-pro', label: 'Flex vs Pro', html:
        '<h2 id="flex-vs-pro">Lucid Flex vs Pro: the difference that matters</h2>' +
        P('On the evaluation they are close: the same ' + lu.pro.target[1] + ' target and ' + lu.pro.mll[1] + ' end-of-day max loss on 50K. The differences are the evaluation consistency rule (none on Pro, 40% on Flex) and everything after you pass.') +
        P('At 50K, <strong>LucidPro</strong> costs ' + lu.pro.price[1] + ' with CHAMP. Every payout needs the ' + lu.pro.goal[1] + ' cycle goal, a balance above ' + lu.pro.buffer[1] + ' and a best day under 40% of profit. In return you can take up to ' + lu.pro.cap1[1] + ' on payout 1 and ' + lu.pro.cap2[1] + ' after.') +
        P('<strong>LucidFlex</strong> costs ' + lu.flex.price[1] + '. There is no buffer and no funded consistency rule, but each payout waits for 5 profit days of ' + lu.flex.days[1] + '+ and is limited to 50% of profit, up to ' + lu.flex.cap[1] + '. To take the full ' + lu.flex.cap[1] + ' you need ' + fmt(num(lu.flex.cap[1]) * 2) + ' of profit in the cycle (our arithmetic).') +
        P('In short: Pro suits traders whose days are even and who want bigger withdrawals; Flex suits traders with uneven days who are happy to withdraw half at a time. The full payout mechanics are in our ' + L('/firms/lucid-trading/payout-rules', 'Lucid Trading payout rules') + '.') },
      { id: 'daily-vs-pro', label: 'Daily vs Pro', html:
        '<h2 id="daily-vs-pro">LucidDaily vs LucidPro</h2>' +
        P('Both use the same buffer (' + lu.daily.buffer[1] + ' on 50K). After that they split. <strong>LucidDaily</strong> lets you request every day with no per-payout cap and no funded consistency rule. Its funded drawdown is intraday, and a red-folder news trade ends the account. <strong>LucidPro</strong> keeps an end-of-day drawdown and allows news, but caps each payout and applies a 40% rule. LucidDaily’s evaluation has a 40% rule (50% add-on); Pro’s has none.') },
      { id: 'flex-vs-direct', label: 'Flex vs Direct', html:
        '<h2 id="flex-vs-direct">LucidFlex vs LucidDirect</h2>' +
        P('<strong>LucidDirect</strong> trades money for time: ' + lu.direct.price[1] + ' at 50K versus ' + lu.flex.price[1] + ' for a Flex evaluation, and no evaluation to pass. Once funded it is the stricter account: a ' + lu.direct.goal1[1] + ' profit goal before payout 1, a 20% consistency rule, and a DLL on 50K and up. <strong>LucidFlex</strong> makes you pass first, then has no funded consistency rule and only needs 5 profit days per payout. Both cap payouts at ' + lu.flex.cap[1] + ' on 50K at the start; Direct rises to ' + lu.direct.cap2[1] + ' for payouts 4–5.') },
      { id: 'all-accounts', label: 'Rules for every account', html:
        '<h2 id="all-accounts">Rules that apply to every Lucid account</h2>' +
        UL([
          '<strong>Split and minimum:</strong> 90/10 split, ' + VF.lucid.minRequest + ' minimum request, no fixed payout window.',
          '<strong>Account limits:</strong> up to 10 evaluations and 5 funded accounts per household, all Lucid types combined (10 in total).' + more('/blog/how-many-prop-firm-accounts-can-you-have', 'Compare: ' + L('/blog/how-many-prop-firm-accounts-can-you-have', 'how many prop firm accounts you can have') + '.'),
          '<strong>Copy trading:</strong> trade copiers and automated systems are permitted; hedging is not.',
          '<strong>Size:</strong> ' + esc(lu.maxSize) + ' by account size, on every path.',
          '<strong>Session:</strong> all positions flat by 4:45 PM EST.',
          '<strong>Lucid Black</strong> is discontinued (legacy accounts only).',
        ]) +
        cta('lucid-trading', 'Code CHAMP applies the current discount at checkout. Confirm the price before you pay.') },
    ];
  },
  faq: () => [
    { q: 'Which Lucid Trading account is best?', a: 'It depends on how you trade. LucidFlex has the lowest fixed price at most sizes and no funded consistency rule. LucidPro has a 1-day pass and bigger caps after payout 1. LucidDaily pays daily with no per-payout cap but uses an intraday funded drawdown and bans red-folder news. LucidDirect skips the evaluation for a higher one-time price and a 20% consistency rule.' },
    { q: 'What is the difference between Lucid Flex and Pro?', a: 'Pro has no evaluation consistency rule (you can pass in a day) but a 40% funded rule, a buffer and caps of ' + range(lu.pro.cap1) + ' on payout 1. Flex has a 40% evaluation rule, no funded rule and no buffer, but each payout needs 5 profit days and is limited to 50% of profit, capped at ' + range(lu.flex.cap) + '.' },
    { q: 'Should I buy a 50K Lucid Flex or a 50K Pro?', a: 'At 50K, Flex costs ' + lu.flex.price[1] + ' with CHAMP and Pro costs ' + lu.pro.price[1] + '. Flex pays up to 50% of profit per payout (max ' + lu.flex.cap[1] + ') after 5 profit days of ' + lu.flex.days[1] + '+. Pro pays up to ' + lu.pro.cap1[1] + ' then ' + lu.pro.cap2[1] + ' but needs a balance above ' + lu.pro.buffer[1] + ' and a best day under 40% of profit.' },
    { q: 'LucidDaily vs LucidPro: which is better?', a: 'LucidDaily if you want to request every day with no per-payout cap and you don’t trade news: its funded drawdown is intraday and red-folder news is a hard breach. LucidPro if you want an end-of-day drawdown, news trading and a 1-day pass, and can live with a 40% rule and per-payout caps.' },
    { q: 'LucidFlex vs LucidDirect: which should I choose?', a: 'LucidDirect skips the evaluation but costs more (' + lu.direct.price[1] + ' at 50K vs ' + lu.flex.price[1] + ') and is stricter once funded: a profit goal before every payout and a 20% consistency rule. LucidFlex needs an evaluation, then has no funded consistency rule.' },
    { q: 'What is the best Lucid Trading account for beginners?', a: 'No account is best for everyone. For a first account, cost and simple rules usually matter most: LucidFlex is cheaper than Pro with CHAMP at most sizes and has no funded consistency rule. If passing in a single day matters more to you, LucidPro has no evaluation consistency rule.' },
    { q: 'Does Lucid Trading have an activation fee?', a: 'No activation fee on Pro, Flex or Daily. LucidDirect is a single one-time payment that includes activation.' },
    { q: 'How many Lucid Trading accounts can you have?', a: 'Up to 10 evaluations and 5 funded accounts per household, with every Lucid type counted together (10 in total).' + more('/blog/how-many-prop-firm-accounts-can-you-have', 'Other firms: ' + L('/blog/how-many-prop-firm-accounts-can-you-have', 'how many prop firm accounts you can have') + '.') },
    { q: 'Can you trade news on Lucid Trading?', a: 'Yes on Pro, Flex and Direct. On a funded LucidDaily account, trading red-folder USD news is a hard breach; you must be flat from 1 minute before to 1 minute after.' + more('/blog/prop-firm-news-trading-rules', 'See ' + L('/blog/prop-firm-news-trading-rules', 'news trading rules') + ' for every firm.') },
    { q: 'Is Lucid Black still available?', a: 'No. Lucid Black is discontinued; only legacy accounts remain. The current paths are Pro, Flex, Daily and Direct.' },
  ],
  related: () => [['/firms/lucid-trading', 'Lucid Trading review'], ['/firms/lucid-trading/payout-rules', 'Lucid Trading payout rules'], ['/blog/prop-firm-consistency-rules', 'Consistency rules by firm'], ['/best/best-prop-firms-no-daily-loss-limit', 'Firms with no daily loss limit'], ['/best/best-instant-funding-futures-prop-firms', 'Best instant-funding firms'], ['/blog/prop-firm-drawdown-explained', 'Trailing drawdown explained'], ['/deals', 'Every CHAMP deal']],
},

/* ---------------------------------------------------------------- Alpha payout rules (P0) */
{
  url: '/firms/alpha-futures/payout-rules', firm: 'alpha-futures', wave: 1, crumb: 'Payout rules',
  title: 'Alpha Futures Payout Rules 2026: Zero, Standard & Advanced',
  metaDesc: 'Alpha Futures payout rules by plan: 90% split, up to 4 withdrawals a month, 5 winning days of $200+, caps, minimums and consistency, Zero to Direct.',
  h1: 'Alpha Futures Payout Rules (2026): Zero, Standard, Advanced &amp; Direct',
  eyebrow: 'Alpha Futures · Payout rules',
  dek: 'All four Alpha plans pay 90% from the first withdrawal, up to four times a month. The minimum, the cap and what you must do before each request depend on the plan. Here is each one, by account size.',
  answer: () => [
    'Every plan pays <strong>90% from the first payout</strong> (no tiers), allows <strong>up to 4 withdrawals a month</strong>, and has no assigned payout dates.',
    '<strong>Zero, Standard and Advanced:</strong> withdraw up to 50% of your profit per request, after <strong>5 winning days of $200 or more</strong> since your last request.',
    '<strong>Direct:</strong> no winning-day rule. Hit the withdrawal profit target (' + range(al.dir.goal1) + ' first, then ' + range(al.dir.goal2) + ') and stay under 20% consistency.',
    '<strong>Minimums:</strong> ' + al.zero.min + ' Zero · ' + al.std.min + ' Standard · ' + al.adv.min + ' Advanced · ' + al.dir.min + ' Direct. <strong>Caps per request:</strong> ' + range(al.zero.cap) + ' Zero · ' + range(al.std.cap) + ' Standard · ' + al.adv.cap + ' Advanced · ' + range(al.dir.cap) + ' Direct.',
    '<strong>Qualified consistency:</strong> 40% on Zero and Standard, none on Advanced, 20% on Direct. Going over pauses payouts; it does not breach the account.',
  ],
  sections: () => [
    { id: 'at-a-glance', label: 'At a glance', html:
      '<h2 id="at-a-glance">Alpha Futures payout rules at a glance</h2>' +
      table(['Plan', 'Min request', 'Cap per request', 'Before each request', 'Qualified consistency', 'Qualified DLL'], [
        ['<a href="#zero-plan">Zero</a> (' + al.zero.sizes.join(' / ') + ')', al.zero.min, '50% of profit, up to ' + range(al.zero.cap), '5 winning days of $200+', '40%', range(al.zero.dll)],
        ['<a href="#standard-plan">Standard</a> (' + al.std.sizes.join(' / ') + ')', al.std.min, '50% of profit, up to ' + range(al.std.cap), '5 winning days of $200+', '40%', range(al.std.dll)],
        ['<a href="#advanced-plan">Advanced</a> (' + al.adv.sizes.join(' / ') + ')', al.adv.min, '50% of profit, up to ' + al.adv.cap, '5 winning days of $200+', 'None', 'None'],
        ['<a href="#direct-plan">Direct</a> (' + al.dir.sizes.join(' / ') + ')', al.dir.min, range(al.dir.cap), 'Withdrawal profit target', '20%', range(al.dir.dll)],
      ], 'All plans: 90% split from payout 1 · up to 4 withdrawals a month · paid by ' + VF.alpha.methods + '. Source: help.alpha-futures.com, read ' + VERIFIED + '.', 'fs-glance') +
      P('Alpha calls a funded account a <strong>qualified account</strong>. Alpha says it has paid ' + al.total.replace('+', '') + '+ in performance fees (firm-published). For the plans themselves, prices and platforms, see our ' + L('/firms/alpha-futures', 'Alpha Futures review') + '.') },

    { id: 'zero-plan', label: 'Zero', html:
      '<h2 id="zero-plan">Alpha Futures Zero plan payout rules</h2>' +
      P('Zero has Alpha’s lowest entry price (' + al.zero.price[0] + ' a month list, for ' + al.zero.sizes[0] + (zeroDearer.length ? '; at ' + zeroDearer.join(' and ') + ' Standard lists for less' : '') + ') and is the only plan with a one-day evaluation pass: there are no minimum evaluation days and no evaluation consistency rule. Once qualified, a 40% rule and a daily loss guard apply.') +
      sizeTable('zero', al.zero.sizes, 'Zero', [
        ['Monthly price (list)', al.zero.price],
        ['Evaluation profit target', al.zero.target],
        ['Max loss limit (end-of-day)', al.zero.mll],
        ['Daily loss guard (eval and qualified)', al.zero.dll],
        ['Minimum request', al.zero.min + ' at every size'],
        ['Max per request (50% of profit, capped at)', al.zero.cap],
        ['Before each request', '5 winning days of $200+ since your last request (not necessarily consecutive)'],
        ['Consistency', 'None in the evaluation · 40% qualified'],
        ['Evaluation reset', al.zero.evalReset],
        ['Qualified reset', al.zero.qualReset],
      ], 'Monthly subscription stops when you pass; activation is $0. A qualified reset can be used twice per account, only before your first payout request.') },

    { id: 'standard-plan', label: 'Standard', html:
      '<h2 id="standard-plan">Alpha Futures Standard plan payout rules</h2>' +
      P('Standard is the middle plan: bigger caps than Zero, a two-day minimum in the evaluation, and the only Alpha plan with a consistency rule at both stages (50% in the evaluation, 40% once qualified).') +
      sizeTable('standard', al.std.sizes, 'Standard', [
        ['Monthly price (list)', al.std.price],
        ['Evaluation profit target', al.std.target],
        ['Max loss limit (end-of-day)', al.std.mll],
        ['Daily loss limit, qualified (none in the evaluation)', al.std.dll],
        ['Minimum request', al.std.min + ' at every size'],
        ['Max per request (50% of profit, capped at)', al.std.cap],
        ['Before each request', '5 winning days of $200+ since your last request'],
        ['Consistency', '50% in the evaluation (2 minimum days) · 40% qualified'],
        ['Evaluation reset', al.std.evalReset],
        ['Qualified reset', al.std.qualReset],
      ], 'Max qualified accounts: 5 (3 if you bought Standard before Jul 27, 2026).') },

    { id: 'advanced-plan', label: 'Advanced', html:
      '<h2 id="advanced-plan">Alpha Futures Advanced plan payout rules</h2>' +
      P('Advanced is the premium plan: no daily loss limit at any stage, no consistency rule once qualified, no news restrictions, and up to ' + al.adv.cap + ' per request at every size.') +
      sizeTable('advanced', al.adv.sizes, 'Advanced', [
        ['Monthly price (list)', al.adv.price],
        ['Evaluation profit target', al.adv.target],
        ['Max loss limit (end-of-day)', al.adv.mll],
        ['Daily loss limit', 'None, in the evaluation or qualified'],
        ['Minimum request', al.adv.min + ' at every size'],
        ['Max per request', '50% of profit, up to ' + al.adv.cap + ' at every size'],
        ['Before each request', '5 winning days of $200+ since your last request'],
        ['Consistency', '40% in the evaluation (3 minimum days) · none qualified'],
        ['Evaluation reset', al.adv.evalReset],
        ['Qualified reset', 'Not offered'],
      ], 'No scaling plan: full contract limits from day 1. Activation is $0 on Advanced accounts bought after Jul 8, 2026. Holding any active Advanced qualified account caps your total at 3 qualified accounts.') },

    { id: 'direct-plan', label: 'Direct', html:
      '<h2 id="direct-plan">Alpha Futures Direct plan payout rules</h2>' +
      P('Direct is a one-time, straight-to-funded account. There is no evaluation and no winning-day rule; instead, each withdrawal needs a profit target since the last one, plus a 20% consistency rule.') +
      sizeTable('direct', al.dir.sizes, 'Direct', [
        ['One-time price (list)', al.dir.price],
        ['Max loss limit (end-of-day)', al.dir.mll],
        ['Daily loss limit', al.dir.dll],
        ['Profit target: first withdrawal', al.dir.goal1],
        ['Profit target: each later withdrawal', al.dir.goal2],
        ['Minimum request', al.dir.min + ' at every size'],
        ['Cap per request', al.dir.cap],
        ['Consistency', '20%'],
      ], '50K cap: Alpha’s payout-policy page, Direct overview and homepage say ' + al.dir.cap[1] + '; one older help article says $1,500. No scaling plan. Max 5 Direct accounts.') },

    { id: 'winning-days', label: 'Worked example', html:
      '<h2 id="winning-days">How the 5-winning-day counter and the 50% limit work</h2>' +
      P('On Zero, Standard and Advanced, two things decide each request: the winning-day counter and the 50%-of-profit limit. A “winning day” only counts if it makes $200 or more.') +
      callout('tip', 'Worked example · first withdrawal on a 50K Zero',
        table(['Day', 'P&amp;L', 'Counts?'], [['1', '+$350', 'Yes (1)'], ['2', '−$120', 'No'], ['3', '+$210', 'Yes (2)'], ['4', '+$180', 'No, under $200'], ['5', '+$500', 'Yes (3)'], ['6', '+$260', 'Yes (4)'], ['7', '+$220', 'Yes (5)']], null, 'fs-mini') +
        '<p>Five winning days of $200+ by day 7, and net profit is <strong>$1,600</strong>. The largest day ($500) is 31% of that, under the 40% qualified rule.</p>' +
        '<p>50% of $1,600 is <strong>$800</strong>: under the 50K cap of ' + al.zero.cap[1] + ' and over the ' + al.zero.min + ' minimum. Alpha takes $800 off the account and you receive 90%, $720. The max loss limit does <strong>not</strong> reset when you withdraw, so the $800 comes out of your cushion above the floor. Then the counter starts again from zero. (Our arithmetic from Alpha’s rules.)</p>') },

    { id: 'consistency', label: 'Consistency', html:
      '<h2 id="consistency">Alpha’s consistency rule on qualified accounts</h2>' +
      P('On a qualified account, your largest day must be below 40% (20% on Direct) of your net profit since the last request. The count resets every time you request. If you go over, Alpha pauses payouts until more profit brings the ratio back down. It does not breach the account.') +
      table(['Plan', 'Evaluation', 'Qualified'], [['Zero', 'None (1-day pass)', '40%'], ['Standard', '50%', '40%'], ['Advanced', '40%', 'None'], ['Direct', 'No evaluation', '20%']]) +
      P('How these rules compare with other firms: ' + L('/blog/prop-firm-consistency-rules', 'prop firm consistency rules explained') + (exists('/tools/prop-firm-consistency-calculator') ? ' · ' + L('/tools/prop-firm-consistency-calculator', 'consistency calculator') : '') + '.') },

    { id: 'which-plan', label: 'Which plan', html:
      '<h2 id="which-plan">Zero vs Standard vs Advanced vs Direct: which Alpha plan is best?</h2>' +
      cards([
        { tag: 'Lowest entry · 1-day pass', title: 'Zero', good: 'the lowest entry price (' + al.zero.price[0] + ' a month list, for ' + al.zero.sizes[0] + ') and passing in a single day.', watch: 'a daily loss guard at both stages, the smallest caps (' + range(al.zero.cap) + ') and sizes only up to ' + al.zero.sizes[al.zero.sizes.length - 1] + '.' },
        { tag: 'Bigger caps', title: 'Standard', good: 'caps of ' + range(al.std.cap) + ' per request with no evaluation DLL.', watch: 'consistency at both stages (50% then 40%) and a qualified DLL.' },
        { tag: 'Fewest rules', title: 'Advanced', good: 'no DLL ever, no qualified consistency, no news restrictions and ' + al.adv.cap + ' per request.', watch: 'the highest monthly price (' + range(al.adv.price) + ' list), a ' + al.adv.min + ' minimum, 40% evaluation consistency and a 3-account limit.' },
        { tag: 'No evaluation', title: 'Direct', good: 'skipping the evaluation for a one-time ' + range(al.dir.price) + ' list.', watch: 'a profit target before every withdrawal and a 20% consistency rule.' },
      ]) +
      P('The <strong>Zero vs Advanced</strong> question comes down to rules versus price: Advanced removes the DLL and the qualified consistency rule, and lets you trade news, for ' + fmt(num(al.adv.price[0]) - num(al.zero.price[1])) + ' more a month at 50K (' + al.adv.price[0] + ' vs ' + al.zero.price[1] + ' list).') },

    { id: 'other-rules', label: 'News & resets', html:
      '<h2 id="other-rules">News, resets and other rules that affect payouts</h2>' +
      UL([
        '<strong>News:</strong> no restrictions on any evaluation or on Advanced qualified accounts. On Zero, Standard and Direct qualified accounts you may hold positions through news, but no orders may execute within 2 minutes either side of a red-folder event. A first violation is a warning; later ones breach the account. See ' + L('/blog/prop-firm-news-trading-rules', 'news trading rules') + '.',
        '<strong>Qualified resets</strong> (Zero ' + range(al.zero.qualReset) + ', Standard ' + range(al.std.qualReset) + ') can be used twice per account, only before your first payout request. Advanced has no qualified reset.',
        '<strong>Monthly billing</strong> stops when you pass. Qualified accounts have no monthly fee, and activation is $0 on every plan.',
        '<strong>Max qualified accounts:</strong> Zero 5 · Standard 5 (3 if bought before Jul 27, 2026) · Direct 5 · Advanced 3. One individual per household.' + more('/blog/how-many-prop-firm-accounts-can-you-have', 'Other firms: ' + L('/blog/how-many-prop-firm-accounts-can-you-have', 'how many prop firm accounts you can have') + '.'),
        '<strong>Copy trading</strong> across accounts in your own name is allowed. Automated, group and reverse trading are not.',
      ]) },

    { id: 'how-to-request', label: 'How to request', html:
      '<h2 id="how-to-request">How to request an Alpha Futures payout</h2>' +
      steps([
        '<strong>Check the trigger.</strong> Zero, Standard, Advanced: 5 winning days of $200+ since your last request. Direct: the withdrawal profit target since your last request.',
        '<strong>Check consistency.</strong> Largest day below 40% (Direct 20%) of net profit since the last request. Advanced qualified accounts have no rule.',
        '<strong>Size the request.</strong> At least the plan minimum and no more than the cap; on Zero, Standard and Advanced, no more than 50% of profit.',
        '<strong>Submit it.</strong> You can request up to 4 times a month, on any day. You receive 90% of the amount, paid by ' + VF.alpha.methods + '.',
      ]) },

    { id: 'denied', label: 'Why payouts get held', html:
      '<h2 id="denied">Why Alpha Futures payouts get held or denied</h2>' +
      UL([
        '<strong>Winning days under $200</strong> don’t count toward the five. A +$180 day is a winning day, but not a qualifying one.',
        '<strong>Largest day too big:</strong> 40% or more (20% on Direct) of net profit since your last request pauses payouts.',
        '<strong>Amount outside the limits:</strong> under the minimum, over the cap, or over 50% of profit.',
        '<strong>Fifth request in a month:</strong> the limit is 4 withdrawals a month.',
        '<strong>News orders</strong> within 2 minutes of a red-folder event on a qualified Zero, Standard or Direct account: a warning the first time, a breach after that.',
        '<strong>Account rules:</strong> more than the account limit, a second person in the household, or group or reverse trading.',
      ]) +
      P('More on how prop firm payouts work across firms: ' + L('/blog/how-prop-firm-payouts-work', 'how prop firm payouts work') + '.') },

    { id: 'live', label: 'Going live', html:
      '<h2 id="live">Alpha’s live stage: Live Program and Alpha Prime</h2>' +
      P('Alpha can move you live after 5 payouts on one qualified account, a large lifetime total, or outstanding performance. You then choose between the <strong>Live Program</strong> (80% split, daily uncapped withdrawals) and <strong>Alpha Prime</strong> (60% split plus a salary built from 50% of sim profit, capped at $75K and paid over 12 months).') +
      cta('alpha-futures', 'Code CHAMP takes ' + al.champ + '% off at checkout (the rate on file for our code; confirm the total). ' + (exists('/firms/alpha-futures/promo-code') ? L('/firms/alpha-futures/promo-code', 'Prices with every code') + '.' : '')) },
  ],
  faq: () => [
    { q: 'What are Alpha Futures’ payout rules?', a: 'All plans pay 90% from the first payout, up to 4 withdrawals a month. Zero, Standard and Advanced let you withdraw up to 50% of profit after 5 winning days of $200+ since your last request. Direct uses a withdrawal profit target plus a 20% consistency rule instead. Minimums run from ' + al.zero.min + ' (Zero) to ' + al.adv.min + ' (Advanced).' },
    { q: 'What are the Alpha Futures Zero plan payout rules?', a: 'After 5 winning days of $200+ you can withdraw up to 50% of profit, capped at ' + al.zero.cap.join(' / ') + ' for ' + al.zero.sizes.join(' / ') + ', with a ' + al.zero.min + ' minimum. Qualified Zero accounts have a 40% consistency rule and a daily loss guard of ' + al.zero.dll.join(' / ') + '.' },
    { q: 'What are the Alpha Futures Standard plan payout rules?', a: 'The same 5-winning-day and 50%-of-profit rules, with caps of ' + al.std.cap.join(' / ') + ' for ' + al.std.sizes.join(' / ') + ' and a ' + al.std.min + ' minimum. Standard has 40% consistency once qualified (50% in the evaluation) and a qualified DLL of ' + al.std.dll.join(' / ') + '.' },
    { q: 'What are the Alpha Futures Advanced plan payout rules?', a: 'After 5 winning days of $200+ you can withdraw up to 50% of profit, up to ' + al.adv.cap + ' per request at every size, with a ' + al.adv.min + ' minimum. Qualified Advanced accounts have no consistency rule, no daily loss limit and no news restrictions.' },
    { q: 'What is the Alpha Futures max payout?', a: 'Per request: Zero ' + al.zero.cap.join(' / ') + ', Standard ' + al.std.cap.join(' / ') + ', Advanced ' + al.adv.cap + ' at every size, Direct ' + al.dir.cap.join(' / ') + '. Zero, Standard and Advanced are also limited to 50% of profit per request.' },
    { q: 'What is the Alpha Futures minimum payout?', a: al.zero.min + ' on Zero, ' + al.std.min + ' on Standard, ' + al.adv.min + ' on Advanced and ' + al.dir.min + ' on Direct.' },
    { q: 'How often can you withdraw from Alpha Futures?', a: 'Up to 4 times a month, with no assigned payout dates. Each request on Zero, Standard or Advanced needs 5 new winning days of $200+; on Direct it needs a new withdrawal profit target.' },
    { q: 'Does the drawdown reset after an Alpha Futures payout?', a: 'No. Alpha’s max loss limit does not reset when you withdraw, so the amount you take out comes straight off your cushion above the floor.' },
    { q: 'Does Alpha Futures have a consistency rule?', a: 'Yes, on most plans. Qualified accounts: 40% on Zero and Standard, 20% on Direct, none on Advanced. Evaluations: 50% on Standard, 40% on Advanced, none on Zero. Going over pauses payouts but does not breach the account.' },
    { q: 'Which Alpha Futures plan is best?', a: 'Zero for the lowest entry price (' + al.zero.price[0] + ' for ' + al.zero.sizes[0] + ') and a 1-day pass, Standard for bigger caps, Advanced for the fewest rules (no DLL, no qualified consistency, no news restrictions, ' + al.adv.cap + ' per request), and Direct to skip the evaluation entirely.' },
    { q: 'What happened to Alpha Futures Premium?', a: 'Premium was a short-lived plan that briefly replaced Standard and was then dropped. Standard is back on Alpha’s site; the current plans are Zero, Standard, Advanced and Direct.' },
    { q: 'How many Alpha Futures accounts can you have?', a: 'Qualified accounts: Zero 5, Standard 5 (3 if bought before Jul 27, 2026), Direct 5 and Advanced 3. Holding any active Advanced qualified account caps you at 3. One individual per household.' },
  ],
  related: () => [['/firms/alpha-futures', 'Alpha Futures review'], ['/firms/alpha-futures/promo-code', 'Alpha Futures promo code'], ['/blog/how-prop-firm-payouts-work', 'How prop firm payouts work'], ['/blog/prop-firm-consistency-rules', 'Consistency rules by firm'], ['/tools/prop-firm-consistency-calculator', 'Consistency calculator'], ['/blog/prop-firm-payout-caps', 'Payout caps at every firm'], ['/blog/prop-firm-news-trading-rules', 'News trading rules by firm'], ['/best/best-prop-firms-no-daily-loss-limit', 'Firms with no daily loss limit']],
},

/* ---------------------------------------------------------------- Apex payout rules (P0) */
{
  url: '/firms/apex-trader/payout-rules', firm: 'apex-trader', wave: 1, crumb: 'Payout rules', blocked: 'website and help center', // blocked our Oct 23 check: say "checked", not "verified"
  title: 'Apex Trader Funding Payout Rules 2026: Caps & 50% Rule',
  metaDesc: 'Apex payout rules for Intraday and EOD PAs: 100% split, 5 qualifying days, 50% consistency, $500 minimum, max 6 payouts and the cap ladder by size.',
  h1: 'Apex Trader Funding Payout Rules (2026): Caps, the 50% Rule &amp; the Ladder',
  eyebrow: 'Apex Trader Funding · Payout rules',
  dek: 'Apex funded accounts (PAs) keep 100% of approved payouts, but each payout has to clear five qualifying days, a 50% consistency rule and a safety net, and each one is capped. Here is how the rules work at every size.',
  answer: () => [
    '<strong>Split:</strong> funded PAs keep <strong>' + (/100%/.test(ap.split) ? '100%' : esc(ap.split)) + '</strong> of approved payouts (no profit split).',
    '<strong>Before each payout:</strong> 5 qualifying trading days (not necessarily consecutive) at a minimum daily profit of ' + range(VF.apex.minDaily.intraday) + ' (Intraday) or ' + range(VF.apex.minDaily.eod) + ' (EOD).',
    '<strong>50% consistency:</strong> no single day may be 50% or more of the profit since your last payout. Going over isn’t a breach; the payout just waits.',
    '<strong>Safety net:</strong> only profit above the drawdown + $100 can be withdrawn, and the minimum request is ' + ap.min + '.',
    '<strong>Caps:</strong> from ' + range(ap.cap1) + ' on payout 1 to ' + range(ap.cap6) + ' on payout 6 (25K–150K). A PA closes after its 6th payout.',
  ],
  intro: () => callout('warn', 'Source note', '<p>Apex’s website and help center blocked our automated check on ' + VERIFIED + ' (we don’t bypass that). The split, cadence, payout 1 and payout 6 caps come from our September and October audits. Qualifying-day amounts, the safety net and payouts 2–5 come from search-engine excerpts of Apex’s own help-center pages (Oct 2026) and are marked ' + MARK + '. Confirm them in your Apex dashboard.</p>'),
  sections: () => [
    { id: 'at-a-glance', label: 'At a glance', html:
      '<h2 id="at-a-glance">Apex payout rules at a glance</h2>' +
      table(['Rule', 'Intraday Trail PA', 'EOD Trail PA'], [
        ['Payout split', '100%, no split', '100%, no split'],
        ['How often', esc(ap.freq), esc(ap.freq)],
        ['Qualifying days per payout' + MARK, '5 days of ' + range(VF.apex.minDaily.intraday) + '+', '5 days of ' + range(VF.apex.minDaily.eod) + '+'],
        ['Consistency', '50% (funded only)', '50% (funded only)'],
        ['Safety net' + MARK, 'Drawdown + $100', 'Drawdown + $100'],
        ['Minimum request', ap.min, ap.min],
        ['Cap per payout', range(ap.cap1) + ' (1st) → ' + range(ap.cap6) + ' (6th)', range(ap.cap1) + ' (1st) → ' + range(ap.cap6) + ' (6th)'],
        ['Payouts per PA', '6, then the PA closes', '6, then the PA closes'],
        ['Daily loss limit', 'None in the eval · scaling DLL once funded', range(ap.eodDll)],
      ], 'Sources: PropChamps audits Sept 18 and Oct 5, 2026; † Apex help-center excerpts, Oct 2026.', 'fs-glance') +
      P('Apex reports ' + ap.total + ' paid to traders (firm-published, at our Oct 5 audit). For prices, the evaluation rules and our take on the firm, see our ' + L('/firms/apex-trader', 'Apex Trader Funding review') + '.') },

    { id: 'qualifying-days', label: 'Qualifying days', html:
      '<h2 id="qualifying-days">Five qualifying days: the minimum daily profit by size</h2>' +
      P('Each payout needs five trading days that each clear a minimum profit. They don’t have to be consecutive; a day below the minimum simply doesn’t count toward the five.') +
      sizeTable('qualify', ap.sizes, 'PA type', [
        ['Intraday Trail' + MARK, VF.apex.minDaily.intraday],
        ['EOD Trail' + MARK, VF.apex.minDaily.eod],
      ], '† Per Apex’s “EOD Payouts” and “Intraday Trailing Drawdown Payouts” help articles (search-index excerpts, Oct 2026).') },

    { id: 'safety-net', label: 'Safety net', html:
      '<h2 id="safety-net">The safety net: how much profit you need first</h2>' +
      P('Apex only lets you withdraw profit above the safety net, which is your drawdown plus $100. So the profit you need before a request is the safety net plus the amount you want to take out.') +
      sizeTable('net', ap.sizes, 'Account', [
        ['Max drawdown', ap.dd],
        ['Safety net (drawdown + $100)' + MARK, ap.safety],
        ['Profit needed to withdraw the ' + ap.min + ' minimum', ap.safety.map((s) => fmt(num(s) + num(ap.min)))],
        ['Payout-1 cap', ap.cap1],
        ['Profit needed to withdraw the full payout-1 cap', ap.safety.map((s, i) => fmt(num(s) + num(ap.cap1[i])))],
      ], 'The two “profit needed” rows are our arithmetic from the safety-net rule. Drawdown and payout-1 caps: PropChamps audits.') +
      P('How the drawdown itself trails, and when it stops: ' + L('/blog/apex-drawdown-explained', 'Apex drawdown explained') + '.') },

    { id: 'cap-ladder', label: 'Cap ladder', html:
      '<h2 id="cap-ladder">Apex payout caps by payout number</h2>' +
      P('Each payout is capped, and the cap rises over a PA’s six payouts. Payouts 1 and 6 match our audit data. For payouts 2–5, Apex’s help-center excerpts give a slightly different ladder for Intraday and EOD accounts, so treat those rows as a guide and check your dashboard.') +
      H3('Intraday Trail PA', 'ladder-intraday') +
      sizeTable('intraday', ap.sizes, 'Payout', VF.apex.ladder.intraday.map((r, i) => ['Payout ' + (i + 1) + (i > 0 && i < 5 ? MARK : ''), r.map(fmt)])) +
      H3('EOD Trail PA', 'ladder-eod') +
      sizeTable('eod', ap.sizes, 'Payout', VF.apex.ladder.eod.map((r, i) => ['Payout ' + (i + 1) + (i > 0 && i < 5 ? MARK : ''), r.map(fmt)]),
        'Payouts 1 and 6: PropChamps audits (Sept 18 and Oct 5, 2026). † Payouts 2–5: Apex help-center excerpts (Oct 2026), lower confidence. After payout 6 the PA closes.') +
      (exists('/blog/prop-firm-payout-caps') ? P('How Apex’s ladder compares with other firms: ' + L('/blog/prop-firm-payout-caps', 'prop firm payout caps at every futures firm') + '.') : '') },

    { id: 'consistency', label: '50% rule', html:
      '<h2 id="consistency">The Apex 50% consistency rule, with a worked example</h2>' +
      P('On a PA, no single trading day may be 50% or more of the profit made since your last payout. It applies only to funded accounts (there is no consistency rule in the evaluation), and going over is not a breach: you simply can’t request until the ratio drops.') +
      callout('tip', 'Worked example · first payout on a 50K Intraday PA',
        '<p>Five days of +$800, +$450, +$1,000, +$600 and +$750. Each clears the ' + VF.apex.minDaily.intraday[1] + ' minimum, so all five qualify. Profit is <strong>$3,600</strong> and the biggest day ($1,000) is 28% of it, under 50%.</p>' +
        '<p>The safety net on 50K is ' + ap.safety[1] + ', so ' + fmt(3600 - num(ap.safety[1])) + ' is withdrawable. That equals the payout-1 cap of ' + ap.cap1[1] + ', so you request ' + ap.cap1[1] + ' and keep all of it.</p>' +
        '<p>Same $3,600, different shape: +$1,800, +$300, +$500, +$400, +$600. The $1,800 day is exactly 50%, so the payout waits until total profit is above $3,600 with no new bigger day. (Our arithmetic from Apex’s rules.)</p>') +
      P('How Apex’s 50% compares with other firms: ' + L('/blog/prop-firm-consistency-rules', 'prop firm consistency rules explained') + (exists('/tools/prop-firm-consistency-calculator') ? ' · ' + L('/tools/prop-firm-consistency-calculator', 'consistency calculator') : '') + '.') },

    { id: 'intraday-vs-eod', label: 'Intraday vs EOD', html:
      '<h2 id="intraday-vs-eod">Intraday vs EOD PA: what changes for payouts</h2>' +
      UL([
        '<strong>Same:</strong> 100% split, ' + esc(ap.freq.toLowerCase()) + ', 5 qualifying days, 50% consistency, ' + ap.min + ' minimum, 6 payouts per PA, and the same payout-1 and payout-6 caps.',
        '<strong>Different minimum daily profit' + MARK + ':</strong> from 50K up, EOD days must clear more (' + VF.apex.minDaily.eod.slice(1).join(' / ') + ' vs ' + VF.apex.minDaily.intraday.slice(1).join(' / ') + ' on Intraday).',
        '<strong>Different middle of the ladder' + MARK + ':</strong> per the help-center excerpts, payouts 2–5 step up at different points (tables above).',
        '<strong>Different daily loss limit:</strong> EOD has a ' + range(ap.eodDll) + ' DLL. Intraday has none in the evaluation and a scaling DLL once funded.',
      ]) },

    { id: 'legacy', label: 'Legacy PAs', html:
      '<h2 id="legacy">Apex legacy account payout rules</h2>' +
      callout('', 'Legacy PAs', '<p>Apex brings back its legacy accounts (six sizes up to $300K) during sale periods. Per Apex’s help-center excerpt' + MARK + ', a legacy PA caps only its first 5 payouts, from $1,500 on 25K up to $3,500 on 300K, and from payout 6 there is no cap. We couldn’t read the full legacy table, so check the cap for your size in your dashboard.</p>') },

    { id: 'how-to-request', label: 'How to request', html:
      '<h2 id="how-to-request">How to request an Apex payout</h2>' +
      steps([
        '<strong>Count five qualifying days</strong> since your last payout, each at or above the minimum for your size and PA type.',
        '<strong>Check the 50% rule:</strong> your best day must be under 50% of the profit since your last payout.',
        '<strong>Check the safety net:</strong> only profit above the drawdown + $100 is withdrawable.',
        '<strong>Pick the amount:</strong> at least ' + ap.min + ', and no more than the cap for this payout number.',
        '<strong>Submit it from your Apex dashboard.</strong> Remember the PA closes after its 6th payout.',
      ]) },

    { id: 'denied', label: 'Why payouts get held', html:
      '<h2 id="denied">Why Apex payouts get held or denied</h2>' +
      UL([
        '<strong>Fewer than five qualifying days:</strong> days under the minimum daily profit don’t count.',
        '<strong>One day is 50% or more</strong> of the profit since your last payout.',
        '<strong>Not enough above the safety net</strong> to cover the ' + ap.min + ' minimum.',
        '<strong>Asking for more than the cap</strong> for that payout number.',
        '<strong>Prohibited trading:</strong> news-only or straddle strategies and hedging are not allowed (trading through news with your normal strategy is), and positions must be flat by market close.',
        '<strong>Too many accounts:</strong> the limit is ' + VF.apex.maxPAs + ' active PAs across a household, companies and connections, every PA type combined. Evaluations are unlimited.' + more('/blog/how-many-prop-firm-accounts-can-you-have', 'Other firms: ' + L('/blog/how-many-prop-firm-accounts-can-you-have', 'how many prop firm accounts you can have') + '.'),
      ]) +
      P('More context: ' + L('/blog/how-prop-firm-payouts-work', 'how prop firm payouts work') + ' and ' + L('/blog/do-prop-firms-actually-pay', 'do prop firms actually pay') + '.') +
      cta('apex-trader', 'Code CHAMP takes ' + ap.champ + '% off the evaluation (our data; confirm at checkout). ' + (exists('/firms/apex-trader/promo-code') ? L('/firms/apex-trader/promo-code', 'Apex prices with CHAMP') + '.' : '')) },
  ],
  faq: () => [
    { q: 'What are Apex Trader Funding’s payout rules?', a: 'Funded PAs keep 100% of approved payouts, ' + ap.freq.toLowerCase() + '. Each payout needs 5 qualifying days, a best day under 50% of the profit since the last payout, and profit above the safety net (drawdown + $100). The minimum is ' + ap.min + ', each payout is capped, and a PA closes after 6 payouts. Confirm the details in your Apex dashboard.' },
    { q: 'What is the Apex 50% consistency rule?', a: 'On a funded PA, no single day may be 50% or more of the profit made since your last payout. It isn’t a breach; your payout waits until more profit brings the best day under 50%. There is no consistency rule in the Apex evaluation.' },
    { q: 'What are the Apex payout rules for a 50K account?', a: 'On a 50K PA: 5 qualifying days of ' + VF.apex.minDaily.intraday[1] + '+ (Intraday) or ' + VF.apex.minDaily.eod[1] + '+ (EOD), a safety net of ' + ap.safety[1] + ', a ' + ap.min + ' minimum, and caps from ' + ap.cap1[1] + ' on payout 1 to ' + ap.cap6[1] + ' on payout 6. The qualifying-day amounts and the safety net are from Apex’s help center (Oct 2026); confirm them in your dashboard.' },
    { q: 'What is the Apex payout cap?', a: 'Payout 1 is capped at ' + ap.cap1.join(' / ') + ' for 25K / 50K / 100K / 150K, rising to ' + ap.cap6.join(' / ') + ' by payout 6. The steps in between differ slightly between Intraday and EOD PAs.' },
    { q: 'How many payouts can you take from an Apex PA?', a: 'Six. After the 6th payout the PA closes. You can hold up to ' + VF.apex.maxPAs + ' active PAs across a household.' },
    { q: 'What is the Apex minimum payout?', a: ap.min + '. Per Apex’s help center (Oct 2026), only profit above the safety net (drawdown + $100) can be withdrawn.' },
    { q: 'What are the Apex legacy account payout rules?', a: 'Per Apex’s help center, legacy PAs cap only the first 5 payouts, from $1,500 on 25K up to $3,500 on 300K, with no cap from payout 6. Check the cap for your size in your dashboard.' },
    { q: 'How do you request a payout from Apex?', a: 'Once you have 5 qualifying days, a best day under 50% and profit above the safety net, request an amount between ' + ap.min + ' and your current cap from your Apex dashboard.' },
    { q: 'Does Apex take a profit split?', a: 'No. Funded PAs keep 100% of approved payouts, according to our September and October 2026 audits. Payouts are capped per request instead.' },
    { q: 'How long do Apex payouts take?', a: 'We have not verified a processing time with Apex. The figure on our payout tracker (about ' + firm('apex-trader').payoutMedianTime + ') is a PropChamps estimate, not an Apex commitment.' },
  ],
  related: () => [['/firms/apex-trader', 'Apex Trader Funding review'], ['/firms/apex-trader/promo-code', 'Apex coupon code'], ['/blog/apex-drawdown-explained', 'Apex drawdown explained'], ['/blog/how-prop-firm-payouts-work', 'How prop firm payouts work'], ['/blog/prop-firm-consistency-rules', 'Consistency rules by firm'], ['/tools/prop-firm-consistency-calculator', 'Consistency calculator'], ['/blog/prop-firm-payout-caps', 'Payout caps at every firm'], ['/tools/prop-firm-drawdown-calculator', 'Drawdown calculator']],
},

/* ---------------------------------------------------------------- Tradeify payout rules (P1) */
{
  url: '/firms/tradeify/payout-rules', firm: 'tradeify', wave: 2, crumb: 'Payout rules', blocked: 'help center',
  title: 'Tradeify Payout Rules 2026: Growth vs Select vs Lightning',
  metaDesc: 'Tradeify payout rules for Growth, Select Daily, Select Flex and Lightning: caps by size, minimums, buffers, consistency and which account fits you.',
  h1: 'Tradeify Payout Rules (2026): Growth, Select Daily, Select Flex &amp; Lightning',
  eyebrow: 'Tradeify · Payout rules',
  dek: 'Tradeify has four funded paths, and each one pays out on a different trigger: profitable days, a daily buffer, winning days, or a profit goal. Here are the caps, minimums and rules for each path at every size, plus which one fits how you trade.',
  answer: () => [
    'Every Tradeify funded account pays <strong>90/10</strong>. All plans are one-time payments with no activation fee.',
    '<strong>Growth:</strong> payouts after 5 profitable days, 35% funded consistency, caps rising from ' + range(VF.tradeify.growth.caps[0]) + ' on payout 1 to ' + range(VF.tradeify.growth.caps[3]) + ' from payout 4' + MARK + '.',
    '<strong>Select Daily:</strong> request daily from profit above a buffer (' + range(VF.tradeify.selectDaily.buffer) + '), capped at ' + range(tr.daily.cap) + ' per payout' + MARK + ', with no funded consistency rule.',
    '<strong>Select Flex:</strong> every 5 winning days, up to 50% of profit capped at ' + range(tr.flexp.cap) + MARK + ', with no daily loss limit and no funded consistency rule.',
    '<strong>Lightning</strong> (instant funding): a payout profit goal plus 20% / 25% / 30% consistency, a ' + tr.lt.min + ' minimum' + MARK + ', and caps of ' + range(tr.lt.cap1) + MARK + ' (payouts 1–3).',
  ],
  intro: () => callout('warn', 'Source note', '<p>Tradeify’s help center blocked our automated check on ' + VERIFIED + ' (we don’t bypass that). Payout frequency, DLL, drawdown, consistency and prices come from tradeify.co, which we read that day. Caps, minimums, buffers and profit goals come from search-engine excerpts of Tradeify’s own help-center articles (Oct 2026) and are marked ' + MARK + '. Confirm them in your dashboard.</p>'),
  sections: () => [
    { id: 'at-a-glance', label: 'At a glance', html:
      '<h2 id="at-a-glance">Tradeify payout rules at a glance</h2>' +
      table(['Path', 'When you can request', 'Cap per payout' + MARK, 'Min' + MARK, 'Funded consistency', 'Daily loss limit'], [
        ['<a href="#growth">Growth</a>', 'After 5 profitable days', range(VF.tradeify.growth.caps[0]) + ' → ' + range(VF.tradeify.growth.caps[3]), range(VF.tradeify.growth.minReq), '35%', range(tr.growth.dll)],
        ['<a href="#select-daily">Select Daily</a>', 'Daily, above a buffer', range(tr.daily.cap), VF.tradeify.selectDaily.minReq, 'None', 'None in the evaluation · ' + range(tr.daily.dll) + ' funded'],
        ['<a href="#select-flex">Select Flex</a>', 'After 5 winning days', '50% of profit, up to ' + range(tr.flexp.cap), VF.tradeify.selectFlex.minReq, 'None', 'None'],
        ['<a href="#lightning">Lightning</a>', 'Profit goal + consistency (marketed as 5-day payouts)', range(tr.lt.cap1) + ' → ' + range(tr.lt.cap2), tr.lt.min, '20% / 25% / 30%', 'None on 25K · ' + tr.lt.dll.slice(1).join(' / ')],
      ], 'All paths: 90/10 split. Ranges run 25K → 150K. † Tradeify help-center excerpts, Oct 2026; everything else from tradeify.co, read ' + VERIFIED + '.', 'fs-glance') +
      P('Tradeify says it has paid ' + tr.total + ' to traders (firm-published). For prices, platforms and our verdict on the firm, see our ' + L('/firms/tradeify', 'Tradeify review') + '.') },

    { id: 'growth', label: 'Growth', html:
      '<h2 id="growth">Tradeify Growth payout rules</h2>' +
      P('Growth is the evaluation with no consistency rule while you are being evaluated (minimum ' + esc(tr.growthMinDays) + ' day) and a 35% rule once funded. Payouts need five profitable days and a minimum balance, and the cap grows over your first four payouts.') +
      sizeTable('growth', tr.sizes, 'Growth', [
        ['One-time price (list)', tr.growth.price],
        ['Evaluation profit target', tr.growth.target],
        ['Max drawdown (end-of-day)', tr.growth.mll],
        ['Daily loss limit', tr.growth.dll],
        ['Profitable days needed (5, each over)' + MARK, VF.tradeify.growth.dayMin],
        ['Balance needed to request' + MARK, VF.tradeify.growth.balance],
        ['Minimum request' + MARK, VF.tradeify.growth.minReq],
        ['Cap: payout 1' + MARK, VF.tradeify.growth.caps[0]],
        ['Cap: payout 2' + MARK, VF.tradeify.growth.caps[1]],
        ['Cap: payout 3' + MARK, VF.tradeify.growth.caps[2]],
        ['Cap: payout 4 and later' + MARK, VF.tradeify.growth.caps[3]],
        ['Consistency', 'None in the evaluation · 35% funded'],
        ['Reset fee', tr.growth.reset],
      ], 'The profitable-day count resets after each payout. Balances and caps apply to accounts bought on or after Sep 12, 2025. Crypto payouts are available on Growth.') +
      P('On 25K the cap stays at ' + VF.tradeify.growth.caps[0][0] + ' for every payout; the ladder only matters from 50K up (our reading of the table).') },

    { id: 'select-eval', label: 'Select evaluation', html:
      '<h2 id="select-eval">Tradeify Select: the evaluation both paths share</h2>' +
      P('Select is one evaluation with two funded paths. You pass the same evaluation, then choose <strong>Daily</strong> (daily payouts, with a funded DLL) or <strong>Flex</strong> (5-winning-day payouts, no DLL).') +
      sizeTable('select', tr.sizes, 'Select evaluation', [
        ['One-time price (list)', tr.sel.price],
        ['50%-consistency add-on price (instead)', VF.tradeify.selectAddOn],
        ['Profit target', tr.sel.target],
        ['Max drawdown (end-of-day)', tr.sel.mll],
        ['Daily loss limit', 'None'],
        ['Consistency', '40% (or 50% with the add-on) · minimum ' + esc(tr.sel.minDays) + ' days'],
        ['Reset fee', tr.sel.reset],
      ], 'Neither funded Select path has a consistency rule. Prices: tradeify.co, ' + VERIFIED + '.') },

    { id: 'select-daily', label: 'Select Daily', html:
      '<h2 id="select-daily">Tradeify Select Daily payout rules</h2>' +
      P('Select Daily is Tradeify’s daily-payout account. You keep a buffer in the account and can request from the profit above it every day.') +
      sizeTable('daily', tr.sizes, 'Select Daily', [
        ['Funded max drawdown (end-of-day)', tr.daily.mll],
        ['Funded daily loss limit', tr.daily.dll],
        ['Buffer (profit to keep in the account)' + MARK, VF.tradeify.selectDaily.buffer],
        ['Cap per payout', tr.daily.cap],
        ['Also limited to' + MARK, '2× the profit made since your last payout'],
        ['Minimum request' + MARK, VF.tradeify.selectDaily.minReq + ' at every size'],
        ['Consistency', 'None when funded'],
      ], 'After the first payout, each cycle needs positive net profit.') },

    { id: 'select-flex', label: 'Select Flex', html:
      '<h2 id="select-flex">Tradeify Select Flex payout rules</h2>' +
      P('Select Flex has no daily loss limit and no balance floor. Each payout waits for five winning days, and you can take up to half of your profit.') +
      sizeTable('flex', tr.sizes, 'Select Flex', [
        ['Funded max drawdown (end-of-day)', tr.flexp.mll],
        ['Daily loss limit', 'None'],
        ['Winning days needed (5, each at least)' + MARK, VF.tradeify.selectFlex.dayMin],
        ['Max per request (50% of profit, capped at)', tr.flexp.cap],
        ['Minimum request' + MARK, VF.tradeify.selectFlex.minReq + ' at every size'],
        ['Consistency', 'None when funded'],
      ], 'Caps apply to Flex accounts bought on or after Sep 1, 2026. To take the full 50K cap of ' + tr.flexp.cap[1] + ' you need ' + fmt(num(tr.flexp.cap[1]) * 2) + ' of profit (our arithmetic).') },

    { id: 'lightning', label: 'Lightning', html:
      '<h2 id="lightning">Tradeify Lightning funded payout rules</h2>' +
      P('Lightning is Tradeify’s instant-funding account: no evaluation. Tradeify markets it as “5 day payouts”, but its help center says there is no fixed minimum number of days. What you need is the payout profit goal plus the consistency rule.') +
      sizeTable('lightning', tr.sizes, 'Lightning', [
        ['One-time price (list)', tr.lt.price],
        ['Max drawdown (end-of-day)', tr.lt.mll],
        ['Daily loss limit', tr.lt.dll],
        ['Profit goal: payout 1' + MARK, tr.lt.goal1],
        ['Profit goal: payouts 2 and later' + MARK, tr.lt.goal2],
        ['Cap: payouts 1–3' + MARK, tr.lt.cap1],
        ['Cap: payout 4 and later' + MARK, tr.lt.cap2],
        ['Minimum request' + MARK, tr.lt.min + ' at every size'],
        ['Consistency', '20% (payout 1) · 25% (payout 2) · 30% (payout 3+)'],
      ], 'Accounts bought before Sep 12, 2025 stay at 20% consistency. Max 5 Lightning accounts.') +
      P('Two things to notice (our reading): on 25K the ' + tr.lt.min + ' minimum equals the ' + tr.lt.cap1[0] + ' cap, so every 25K payout is exactly ' + tr.lt.min + '. And payout 1 needs ' + tr.lt.goal1[1] + ' of profit on 50K to withdraw at most ' + tr.lt.cap1[1] + '.') },

    { id: 'which-account', label: 'Which account', html:
      '<h2 id="which-account">Growth vs Select vs Lightning: which Tradeify account?</h2>' +
      cards([
        { tag: 'No eval consistency', title: 'Growth', good: 'passing on your own schedule, then a cap that grows to ' + VF.tradeify.growth.caps[3][1] + ' on 50K.', watch: 'a daily loss limit (' + range(tr.growth.dll) + ') and 35% funded consistency.' },
        { tag: 'Daily payouts', title: 'Select Daily', good: 'withdrawing every day, with no funded consistency rule.', watch: 'a buffer to keep in the account, a funded DLL, and smaller caps (' + range(tr.daily.cap) + ').' },
        { tag: 'No DLL', title: 'Select Flex', good: 'no daily loss limit and no funded consistency rule.', watch: '5 winning days per payout and at most 50% of profit per request.' },
        { tag: 'No evaluation', title: 'Lightning', good: 'skipping the evaluation (one-time ' + range(tr.lt.price) + ' list).', watch: 'a ' + tr.lt.min + ' minimum, big first-payout profit goals and 20–30% consistency.' },
      ]) +
      H3('Tradeify Select vs Growth') +
      P('<strong>Growth</strong> has no consistency rule in the evaluation but a DLL; <strong>Select</strong> has no DLL in the evaluation but a 40% consistency rule and a ' + esc(tr.sel.minDays) + '-day minimum. Once funded it flips: Growth applies 35% consistency, while neither Select path has a consistency rule. On price, Select lists at ' + tr.sel.price.join(' / ') + ' against Growth’s ' + tr.growth.price.join(' / ') + ' (25K–150K).') +
      H3('Tradeify Select Daily vs Flex') +
      P('<strong>Daily</strong> if you want cash every day and can live with a funded DLL (' + range(tr.daily.dll) + ') and caps of ' + range(tr.daily.cap) + '. <strong>Flex</strong> if you want no DLL and bigger caps (' + range(tr.flexp.cap) + '), and are fine waiting for 5 winning days and taking half your profit at a time.') },

    { id: 'all-accounts', label: 'Rules for every account', html:
      '<h2 id="all-accounts">Rules that apply to every Tradeify funded account</h2>' +
      UL([
        '<strong>Hold time:</strong> at least 50% of your profit must come from trades held longer than 10 seconds (Funded Trader Agreement). The help center adds that more than 50% of your trades must also be held over 10 seconds' + MARK + '.',
        '<strong>Activity:</strong> you must trade at least once per calendar week.',
        '<strong>Accounts:</strong> up to 5 sim-funded accounts in any mix of Growth, Select and Lightning, per individual and per household. Holding an Elite Live account means no other accounts, for you or anyone in your household.' + more('/blog/how-many-prop-firm-accounts-can-you-have', 'Other firms: ' + L('/blog/how-many-prop-firm-accounts-can-you-have', 'how many prop firm accounts you can have') + '.'),
        '<strong>Copy trading:</strong> allowed between your own accounts where Tradeify’s help center permits it' + MARK + ', with no opposing positions; copying between people is prohibited (Funded Trader Agreement 6.7(b)).',
      ]) },

    { id: 'how-to-request', label: 'How to request', html:
      '<h2 id="how-to-request">How to request a Tradeify payout</h2>' +
      steps([
        '<strong>Meet your path’s trigger.</strong> Growth: 5 profitable days and the balance threshold. Select Daily: profit above the buffer. Select Flex: 5 winning days. Lightning: the payout profit goal and consistency.',
        '<strong>Size the request</strong> between the minimum and the cap; on Select Flex no more than 50% of profit, and on Select Daily no more than 2× the profit since your last payout.',
        '<strong>Check the account rules</strong>: the 10-second rule and at least one trade per calendar week.',
        '<strong>Submit it from your Tradeify dashboard</strong> and confirm the amounts shown there, since our caps and minimums are help-center excerpts.',
      ]) },

    { id: 'denied', label: 'Why payouts get held', html:
      '<h2 id="denied">Why Tradeify payouts get held or denied</h2>' +
      UL([
        '<strong>Consistency over the limit:</strong> 35% on funded Growth, or 20–30% on Lightning depending on the payout number.',
        '<strong>Too few qualifying days:</strong> Growth and Flex days below the size threshold don’t count.',
        '<strong>Balance or buffer not cleared</strong> on Growth or Select Daily.',
        '<strong>Amount outside the limits:</strong> below the minimum (' + tr.lt.min + ' on Lightning) or above the cap.',
        '<strong>Short-hold trading:</strong> too much profit from trades held 10 seconds or less.',
        '<strong>Account rules:</strong> more than 5 funded accounts in a household, opposing positions across your accounts, or copying another trader.',
      ]) +
      P('Background: ' + L('/blog/how-prop-firm-payouts-work', 'how prop firm payouts work') + ' · ' + L('/blog/prop-firm-consistency-rules', 'prop firm consistency rules') + '.') +
      cta('tradeify', 'Code CHAMP applies the current discount at checkout. Confirm the price before you pay.') },
  ],
  faq: () => [
    { q: 'What are Tradeify’s payout rules?', a: 'Every funded path pays 90/10. Growth pays after 5 profitable days with 35% funded consistency; Select Daily pays daily from profit above a buffer; Select Flex pays after 5 winning days, up to 50% of profit; Lightning pays once you hit a profit goal with 20–30% consistency. Each path has its own caps and minimums.' },
    { q: 'What are the Tradeify Select payout rules?', a: 'Select Daily: daily requests from profit above a ' + VF.tradeify.selectDaily.buffer.join(' / ') + ' buffer, capped at ' + tr.daily.cap.join(' / ') + ', ' + VF.tradeify.selectDaily.minReq + ' minimum. Select Flex: after 5 winning days, up to 50% of profit capped at ' + tr.flexp.cap.join(' / ') + ', ' + VF.tradeify.selectFlex.minReq + ' minimum. Neither has a funded consistency rule. Values run 25K / 50K / 100K / 150K; buffers and minimums are per Tradeify’s help center (Oct 2026), so confirm them in your dashboard.' },
    { q: 'What are the Tradeify Growth payout rules?', a: 'You need 5 profitable days (over ' + VF.tradeify.growth.dayMin.join(' / ') + ') and a minimum balance, with a 35% funded consistency rule. Payout 1 is capped at ' + VF.tradeify.growth.caps[0].join(' / ') + ' and payout 4 onward at ' + VF.tradeify.growth.caps[3].join(' / ') + ' for 25K / 50K / 100K / 150K, per Tradeify’s help center (Oct 2026). Confirm them in your dashboard.' },
    { q: 'Tradeify Select vs Growth: which is better?', a: 'Growth has no evaluation consistency rule but a DLL, and 35% consistency once funded. Select has a 40% evaluation rule and no evaluation DLL, and no consistency rule once funded, where you choose Daily or Flex payouts.' },
    { q: 'Tradeify Select Daily vs Flex: what is the difference?', a: 'Select Daily lets you request every day from profit above a buffer, with a funded DLL and caps of ' + range(tr.daily.cap) + '. Select Flex has no DLL and caps of ' + range(tr.flexp.cap) + ', but needs 5 winning days per payout and pays at most 50% of profit.' },
    { q: 'What are the Tradeify Lightning funded payout rules?', a: 'Lightning has no evaluation. Each payout needs a profit goal (' + tr.lt.goal1.join(' / ') + ' for payout 1) and 20% / 25% / 30% consistency, with a ' + tr.lt.min + ' minimum and caps of ' + tr.lt.cap1.join(' / ') + ' for payouts 1–3, per Tradeify’s help center (Oct 2026), which also says there is no fixed minimum number of days. Confirm them in your dashboard.' },
    { q: 'Which Tradeify account has daily payouts?', a: 'Select Daily. You pass the Select evaluation, choose the Daily path, and can then request every day from profit above the buffer.' },
    { q: 'What is the Tradeify max payout on a 50K account?', a: 'Per request on 50K: Growth ' + VF.tradeify.growth.caps[0][1] + ' rising to ' + VF.tradeify.growth.caps[3][1] + ', Select Daily ' + tr.daily.cap[1] + ', Select Flex ' + tr.flexp.cap[1] + ' (50% of profit), and Lightning ' + tr.lt.cap1[1] + ' rising to ' + tr.lt.cap2[1] + '. The Growth and Lightning caps are per Tradeify’s help center (Oct 2026); confirm them in your dashboard.' },
    { q: 'What is the Tradeify minimum payout?', a: 'Growth ' + VF.tradeify.growth.minReq.join(' / ') + ' by size, Select Daily and Select Flex ' + VF.tradeify.selectDaily.minReq + ', and Lightning ' + tr.lt.min + ', per Tradeify’s help center. Confirm in your dashboard.' },
    { q: 'Does Tradeify pay out in crypto?', a: 'Crypto payouts are available on Growth accounts.' },
    { q: 'How many Tradeify funded accounts can you have?', a: 'Up to 5 sim-funded accounts in any mix of Growth, Select and Lightning, per individual and per household.' },
  ],
  related: () => [['/firms/tradeify', 'Tradeify review'], ['/blog/how-prop-firm-payouts-work', 'How prop firm payouts work'], ['/blog/prop-firm-consistency-rules', 'Consistency rules by firm'], ['/tools/prop-firm-consistency-calculator', 'Consistency calculator'], ['/blog/prop-firm-payout-caps', 'Payout caps at every firm'], ['/best/best-prop-firms-fast-payouts', 'Fastest-paying futures firms'], ['/best/best-instant-funding-futures-prop-firms', 'Best instant-funding firms'], ['/best/best-prop-firms-no-daily-loss-limit', 'Firms with no daily loss limit']],
},

/* ---------------------------------------------------------------- Top One payout rules (P1) */
{
  url: '/firms/top-one-futures/payout-rules', firm: 'top-one-futures', wave: 2, crumb: 'Payout rules',
  title: 'Top One Futures Payout Rules 2026: Elite, Instant & Ignite',
  metaDesc: 'Top One Futures payout rules for Elite Access, Elite Daily, Instant Sim Funded and Ignite: 90/10 split, caps by size, buffers, consistency, minimums.',
  h1: 'Top One Futures Payout Rules (2026): Elite Access, Elite Daily, Instant Sim &amp; Ignite',
  eyebrow: 'Top One Futures · Payout rules',
  dek: 'Top One’s four paths all pay a flat 90%, and every sim-funded withdrawal is capped until you go live. What differs is the trigger: profitable days, a daily buffer, or a profit target. Here are the numbers for each path at every size.',
  answer: () => [
    'All four main paths pay <strong>90/10</strong> (the limited LaunchPad X-Daily Spark release pays 80/20), and every sim-funded withdrawal is capped until you go live.',
    '<strong>Elite Access:</strong> request after 5 profitable days (' + range(to.ea.days) + '+) with profit above the buffer + $500 (' + range(to.ea.profitNeeded) + '). ' + to.ea.min + ' minimum, ' + range(to.ea.cap) + ' cap.',
    '<strong>Elite Daily:</strong> request every 24 hours from day 1, keeping a ' + range(to.ed.buffer) + ' buffer. ' + to.ed.min + ' minimum, ' + range(to.ed.cap) + ' cap, no funded consistency rule.',
    '<strong>Instant Sim Funded:</strong> no evaluation. Profit target of 6% for payout 1, then 5%, then 4%, with 20% consistency and a ' + range(to.ins.cap) + ' cap.',
    '<strong>Ignite:</strong> no evaluation. 5% profit target per payout, 15% consistency, ' + to.ig.min + ' minimum, ' + range(to.ig.cap) + ' cap.',
  ],
  sections: () => [
    { id: 'at-a-glance', label: 'At a glance', html:
      '<h2 id="at-a-glance">Top One Futures payout rules at a glance</h2>' +
      table(['Plan', 'Type', 'When you can request', 'Min', 'Cap per request', 'Funded consistency'], [
        ['<a href="#elite-access">Elite Access</a>', 'One-time ' + to.ea.fee + ' eval + activation', 'After 5 profitable days, above buffer + $500', to.ea.min, range(to.ea.cap), '40%'],
        ['<a href="#elite-daily">Elite Daily</a>', 'Monthly evaluation', 'Every 24 hours from day 1, above the buffer', to.ed.min, range(to.ed.cap), 'None'],
        ['<a href="#instant-sim-funded">Instant Sim Funded</a>', 'One-time, no eval', 'At the 6% → 5% → 4% profit target', 'Not stated', range(to.ins.cap), '20%'],
        ['<a href="#ignite">Ignite</a>', 'One-time, no eval', 'At the 5% profit target (no minimum days)', to.ig.min, range(to.ig.cap), '15%'],
      ], 'All four paths above: 90/10 split. Ranges run 25K → 150K. Source: help.toponefutures.com and toponefutures.com, read ' + VERIFIED + '.', 'fs-glance') +
      P('From the 2nd payout on the Elite plans, at least 50% of each payout must be new profit made since the previous payout (Top One’s “daily progression rule”). Top One says it has paid ' + to.total + ' to traders (firm-published). For prices, platforms and our take, see our ' + L('/firms/top-one-futures', 'Top One Futures review') + '.') },

    { id: 'elite-access', label: 'Elite Access', html:
      '<h2 id="elite-access">Top One Elite Access payout rules</h2>' +
      P('Elite Access is a ' + to.ea.fee + ' one-time evaluation at every size, with no DLL and no consistency rule while you are evaluated; you can pass in a day. After passing you pay an activation fee, and the funded account adds a soft DLL and a 40% consistency rule.') +
      sizeTable('access', to.sizes, 'Elite Access', [
        ['Evaluation fee', to.ea.fee + ' one-time at every size'],
        ['Activation fee (after passing)', to.ea.activation],
        ['Evaluation profit target', to.ea.target],
        ['Max drawdown, evaluation (EOD)', to.ea.ddEval],
        ['Max drawdown, funded (EOD)', to.ea.ddFunded],
        ['Funded daily loss limit (soft)', to.ea.dll],
        ['Profitable days needed (5, each at least)', to.ea.days],
        ['Buffer', to.ea.buffer],
        ['Profit needed to request (buffer + $500)', to.ea.profitNeeded],
        ['Minimum request', to.ea.min + ' at every size'],
        ['Cap per request', to.ea.cap],
        ['Consistency', 'None in the evaluation · 40% funded'],
      ], 'There is no fixed “every 5 days” calendar: the homepage’s “5 Day Payouts” means 5 profitable days. Live: reviewed after 3 payouts, and only one account moves live.') +
      P('<strong>Elite Access Intraday</strong> is the same plan with an intraday trailing funded drawdown and a lower activation fee (' + to.ea.intradayActivation.join(' / ') + '). <strong>News:</strong> on funded Elite accounts, no trades 2 minutes before or after high-impact news.') },

    { id: 'elite-daily', label: 'Elite Daily', html:
      '<h2 id="elite-daily">Top One Elite Daily payout rules</h2>' +
      P('Elite Daily is a monthly-subscription evaluation with a 40% consistency rule. Once funded there is no consistency rule and you can request every 24 hours from day 1, as long as the buffer stays in the account.') +
      sizeTable('daily', to.sizes, 'Elite Daily', [
        ['Monthly price (list)', to.ed.price],
        ['Evaluation profit target', to.ed.target],
        ['Max drawdown, evaluation (EOD)', to.ed.ddEval],
        ['Max drawdown, funded (EOD)', to.ed.ddFunded],
        ['Daily loss limit (eval and funded)', to.ed.dll],
        ['Buffer to keep in the account', to.ed.buffer],
        ['Minimum request', to.ed.min + ' at every size'],
        ['Cap per request', to.ed.cap],
        ['Consistency', '40% in the evaluation · none funded'],
      ], 'No activation fee; the subscription ends when you pass. The funded drawdown locks at the starting balance + $100. Live usually follows 5 payouts. Max 5 accounts per household, evaluation and funded combined.') },

    { id: 'instant-sim-funded', label: 'Instant Sim Funded', html:
      '<h2 id="instant-sim-funded">Top One Instant Sim Funded payout rules</h2>' +
      P('Instant Sim Funded skips the evaluation for a one-time fee. Each payout needs a profit target that shrinks over time (6% of the starting balance for payout 1, then 5%, then 4% of the balance left after each payout) and a 20% consistency rule.') +
      sizeTable('instant', to.sizes, 'Instant Sim', [
        ['One-time price (list)', to.ins.price],
        ['Max drawdown (EOD trailing)', to.ins.dd],
        ['Daily loss limit', to.ins.dll],
        ['Profit target: payout 1 (6%)', to.ins.goal1],
        ['Later profit targets', '5%, then 4%, of the balance left after each payout'],
        ['Cap per request (bought on/after Jul 27, 2026)', to.ins.cap],
        ['Cap per request (earlier accounts)', to.ins.capLegacy],
        ['Consistency', '20% (the trading day ends at 5 PM EST)'],
      ], 'Payout-1 targets in dollars are our arithmetic (6% of the starting balance). No contract scaling and no news rule. Max 5 accounts at 25K/50K, 3 at 100K/150K, all the same size.') },

    { id: 'ignite', label: 'Ignite', html:
      '<h2 id="ignite">Top One Ignite instant funding payout rules</h2>' +
      P('Ignite is the cheaper instant-funding path. It has the strictest consistency rule we track (15%), small caps, and intraday-only trading rules.') +
      sizeTable('ignite', to.sizes, 'Ignite', [
        ['One-time price (list)', to.ig.price],
        ['Max drawdown (EOD trailing)', to.ig.dd],
        ['Daily loss limit (soft)', to.ig.dll],
        ['Profit target: payout 1 (5% of the balance)', to.ig.goal1],
        ['Minimum request', to.ig.min + ' at every size'],
        ['Cap per request', to.ig.cap],
        ['Consistency', '15% · no minimum days'],
      ], 'The 5% target is recalculated on the balance after each payout; dollar figures for payout 1 are our arithmetic. Live: reviewed after 3 payouts. No news rule.') +
      UL([
        '<strong>Trading rules:</strong> no overnight holds, no EAs or bots, close by 4 PM ET, and a 10-second minimum trade time.',
        '<strong>Accounts:</strong> up to 10, all the same size; copy trading only between Ignite accounts of the same size.',
        '<strong>Our reading:</strong> on 25K the first target (' + to.ig.goal1[0] + ') is well above the ' + to.ig.cap[0] + ' cap, so most of that profit stays in the account after payout 1.',
      ]) },

    { id: 'which-plan', label: 'Which plan', html:
      '<h2 id="which-plan">Which Top One plan fits? Elite vs Instant vs Ignite</h2>' +
      cards([
        { tag: 'Cheapest evaluation', title: 'Elite Access', good: 'a ' + to.ea.fee + ' entry and a 1-day pass with no evaluation DLL or consistency rule.', watch: 'the ' + range(to.ea.activation) + ' activation fee after passing, a funded DLL and 40% funded consistency.' },
        { tag: 'Daily payouts', title: 'Elite Daily', good: 'requests every 24 hours and no funded consistency rule.', watch: 'a monthly subscription until you pass and a 40% evaluation rule.' },
        { tag: 'No evaluation', title: 'Instant Sim Funded', good: 'skipping the evaluation with bigger caps (' + range(to.ins.cap) + ') and no news rule.', watch: 'the highest one-time price (' + range(to.ins.price) + ' list) and 20% consistency.' },
        { tag: 'No evaluation, lower price', title: 'Ignite', good: 'the cheaper way to skip the evaluation (' + range(to.ig.price) + ' list).', watch: '15% consistency, ' + range(to.ig.cap) + ' caps, and no overnight holds or bots.' },
      ]) +
      H3('Instant Sim Funded vs Ignite') +
      table(['', 'Instant Sim Funded', 'Ignite'], [
        ['Price (25K → 150K, list)', range(to.ins.price), range(to.ig.price)],
        ['Profit target', '6% → 5% → 4%', '5% each payout'],
        ['Consistency', '20%', '15%'],
        ['Cap per request', range(to.ins.cap), range(to.ig.cap)],
        ['Minimum request', 'Not stated', to.ig.min],
        ['Max drawdown', range(to.ins.dd), range(to.ig.dd)],
        ['Daily loss limit', range(to.ins.dll), range(to.ig.dll) + ' (soft)'],
        ['Trading limits', 'No contract scaling', 'No overnight, no bots, close by 4 PM ET'],
        ['Max accounts', '5 (25K/50K) · 3 (100K/150K)', '10'],
      ]) },

    { id: 'fees', label: 'Activation fees', html:
      '<h2 id="fees">Top One activation fees and one-time prices</h2>' +
      sizeTable('fees', to.sizes, 'Plan', [
        ['Elite Access: evaluation', to.ea.fee + ' at every size'],
        ['Elite Access: activation after passing', to.ea.activation],
        ['Elite Access Intraday: activation', to.ea.intradayActivation],
        ['Elite Daily: monthly (no activation fee)', to.ed.price],
        ['Instant Sim Funded: one-time', to.ins.price],
        ['Ignite: one-time', to.ig.price],
      ], 'List prices. Since Oct 16, 2026 an optional No-DLL add-on raises the Elite Access activation fee, and the Elite Daily and Ignite prices, by about 30%. Code CHAMP applies the current discount at checkout (' + to.champ + '% in our data, not verified at checkout); Top One also rotates public promos.') +
      callout('', 'LaunchPad', '<p>X-Ultra is no longer available for new purchases. The current limited LaunchPad release is X-Daily Spark: 50K only, $39 evaluation, $189 activation, daily payouts ($500 minimum, $1,000 cap, $3,000 buffer), an 80/20 split, no consistency rule, and 3 accounts in total.</p>') },

    { id: 'how-to-request', label: 'How to request', html:
      '<h2 id="how-to-request">How to request a Top One payout</h2>' +
      steps([
        '<strong>Meet the trigger:</strong> Elite Access, 5 profitable days and profit above the buffer + $500; Elite Daily, profit above the buffer; Instant Sim, the current profit target; Ignite, the 5% target.',
        '<strong>Check consistency:</strong> 40% (Elite Access), 20% (Instant Sim) or 15% (Ignite). Elite Daily funded has none.',
        '<strong>From the 2nd Elite payout,</strong> make sure at least half of the amount is new profit since your last payout.',
        '<strong>Request between the minimum and the cap</strong> for your size from your Top One dashboard.',
      ]) },

    { id: 'denied', label: 'Why payouts get held', html:
      '<h2 id="denied">Why Top One payouts get held or denied</h2>' +
      UL([
        '<strong>Consistency over the limit</strong> for your plan (15% on Ignite is the tightest).',
        '<strong>Profitable days below the size minimum</strong> on Elite Access (' + range(to.ea.days) + ').',
        '<strong>Not enough above the buffer</strong> on Elite Access or Elite Daily.',
        '<strong>Less than 50% new profit</strong> on the 2nd or later Elite payout.',
        '<strong>A news trade</strong> within 2 minutes of high-impact news on a funded Elite account.',
        '<strong>Ignite trading rules:</strong> an overnight hold, a bot, or a trade under 10 seconds.',
        '<strong>Account rules:</strong> limits are per household and per category, accounts in a category must be the same size, copy trading is allowed only between the same plan type and size, and if anyone in the household is live no sim accounts are allowed.' + more('/blog/how-many-prop-firm-accounts-can-you-have', 'Other firms: ' + L('/blog/how-many-prop-firm-accounts-can-you-have', 'how many prop firm accounts you can have') + '.'),
      ]) +
      P('More: ' + L('/blog/how-prop-firm-payouts-work', 'how prop firm payouts work') + ' · ' + L('/blog/prop-firm-consistency-rules', 'prop firm consistency rules') + '.') +
      cta('top-one-futures', 'Code CHAMP applies the current discount at checkout. Confirm the total before you pay.') },
  ],
  faq: () => [
    { q: 'What are Top One Futures’ payout rules?', a: 'All four main paths pay 90/10 (LaunchPad X-Daily Spark: 80/20) and cap each sim-funded withdrawal. Elite Access pays after 5 profitable days above a buffer; Elite Daily pays every 24 hours above a buffer; Instant Sim Funded pays at a 6% → 5% → 4% profit target with 20% consistency; Ignite pays at a 5% target with 15% consistency.' },
    { q: 'What are the Top One Elite Access payout rules?', a: 'You need 5 profitable days of ' + to.ea.days.join(' / ') + '+ and profit of ' + to.ea.profitNeeded.join(' / ') + ' (the buffer + $500) for 25K / 50K / 100K / 150K, plus 40% funded consistency. The minimum is ' + to.ea.min + ' and the cap is ' + to.ea.cap.join(' / ') + ' per request.' },
    { q: 'What are the Top One Elite Daily payout rules?', a: 'Once funded you can request every 24 hours from day 1, keeping a buffer of ' + to.ed.buffer.join(' / ') + ' in the account. The minimum is ' + to.ed.min + ', the cap is ' + to.ed.cap.join(' / ') + ' per request, and there is no funded consistency rule.' },
    { q: 'What are the Top One Ignite instant funding payout rules?', a: 'Each payout needs a 5% profit target (recalculated after every payout) and 15% consistency, with no minimum days. The minimum request is ' + to.ig.min + ' and the cap is ' + to.ig.cap.join(' / ') + '. No overnight holds or bots, and close by 4 PM ET.' },
    { q: 'Instant Sim Funded vs Ignite: what is the difference?', a: 'Both skip the evaluation and pay 90/10. Instant Sim Funded costs more (' + range(to.ins.price) + ' list), has 20% consistency and caps of ' + range(to.ins.cap) + '. Ignite is cheaper (' + range(to.ig.price) + ' list) but has 15% consistency, caps of ' + range(to.ig.cap) + ', and intraday-only trading rules.' },
    { q: 'Does Top One Futures have a payout cap?', a: 'Yes. Every sim-funded withdrawal is capped until you go live: Elite Access ' + range(to.ea.cap) + ', Elite Daily ' + range(to.ed.cap) + ', Instant Sim Funded ' + range(to.ins.cap) + ' and Ignite ' + range(to.ig.cap) + ' per request.' },
    { q: 'What is the Top One Futures activation fee?', a: 'Elite Access has one: ' + to.ea.activation.join(' / ') + ' after you pass the ' + to.ea.fee + ' evaluation (' + to.ea.intradayActivation.join(' / ') + ' on Elite Access Intraday). Elite Daily has no activation fee, and Instant Sim Funded and Ignite are one-time purchases. The limited LaunchPad X-Daily Spark release also charges a $189 activation fee.' },
    { q: 'What is the Top One daily progression rule?', a: 'On the Elite plans, from the 2nd payout on, at least 50% of each payout must be new profit made since your previous payout.' },
    { q: 'How do you get a live account at Top One Futures?', a: 'Elite Access accounts are reviewed for live after 3 payouts, and only one account moves live. Elite Daily usually moves live after 5 payouts, and Ignite is reviewed after 3 payouts.' },
  ],
  related: () => [['/firms/top-one-futures', 'Top One Futures review'], ['/blog/how-prop-firm-payouts-work', 'How prop firm payouts work'], ['/blog/prop-firm-consistency-rules', 'Consistency rules by firm'], ['/tools/prop-firm-consistency-calculator', 'Consistency calculator'], ['/best/best-instant-funding-futures-prop-firms', 'Best instant-funding firms'], ['/blog/instant-funding-vs-evaluation-prop-firms', 'Instant funding vs evaluation'], ['/blog/prop-firm-payout-caps', 'Payout caps at every firm'], ['/compare', 'Compare every firm']],
},

/* ---------------------------------------------------------------- Alpha promo code (P1) */
{
  url: '/firms/alpha-futures/promo-code', firm: 'alpha-futures', wave: 2, crumb: 'Promo code',
  title: 'Alpha Futures Promo Code (' + MONTH_SHORT + ' ' + YEAR + '): CHAMP vs MYALPHA50',
  metaDesc: 'Alpha Futures promo codes: CHAMP (' + AL.champ + '% off, confirmed at checkout) vs Alpha’s MYALPHA40 and MYALPHA50. Prices for Zero, Standard, Advanced and Direct.',
  h1: 'Alpha Futures Promo Codes (' + MONTH_LONG + ' ' + YEAR + '): CHAMP, MYALPHA40 &amp; MYALPHA50',
  eyebrow: 'Alpha Futures · Promo code',
  dek: 'Code CHAMP takes ' + AL.champ + '% off at Alpha Futures (confirmed by our team at checkout on Oct 27, 2026). Below are the list and discounted prices for every plan and size, how Alpha’s own public codes compare (MYALPHA50 is bigger on Standard, Direct and Advanced), and what to do if a code won’t apply.',
  answer: () => [
    '<strong>Code: CHAMP</strong>, ' + al.champ + '% off at checkout on every Alpha plan: Zero, Standard, Advanced and the one-time Direct. ' + al.champ + '% was confirmed by our team at checkout on Oct 27, 2026; the checkout total is the final word.',
    '<strong>Alpha’s own banner</strong> (our ' + VERIFIED + ' check) shows <strong>MYALPHA40</strong> (' + al.pub40 + '% off Zero) and <strong>MYALPHA50</strong> (' + al.pub50 + '% off Standard, Direct and Advanced), which Alpha lists as running Oct 19–31, 2026. On those three plans the public code is the bigger stated discount, so try both and keep the lower total.',
    '<strong>Activation is $0</strong> on every plan and the monthly subscription stops when you pass, so the evaluation price is the main cost a code reduces.',
    'The cheapest way in is a Zero 25K: ' + al.zero.price[0] + ' list, ' + off(al.zero.price[0], al.champ) + ' with ' + al.champ + '% off.',
  ],
  sections: () => {
    const rows = [];
    const add = (plan, sizes, prices, billing, pubPct, pubCode) => sizes.forEach((z, i) => rows.push([plan + ' ' + z, billing, prices[i], off(prices[i], al.champ), off(prices[i], pubPct) + ' <span class="fs-muted">(' + pubCode + ')</span>']));
    add('Zero', al.zero.sizes, al.zero.price, 'Monthly', al.pub40, 'MYALPHA40');
    add('Standard', al.std.sizes, al.std.price, 'Monthly', al.pub50, 'MYALPHA50');
    add('Advanced', al.adv.sizes, al.adv.price, 'Monthly', al.pub50, 'MYALPHA50');
    add('Direct', al.dir.sizes, al.dir.price, 'One-time', al.pub50, 'MYALPHA50');
    return [
      { id: 'the-code', label: 'The code', html:
        '<h2 id="the-code">The Alpha Futures promo code: CHAMP</h2>' +
        P('CHAMP is PropChamps’ affiliate code with Alpha Futures. Enter it at checkout and it takes ' + al.champ + '% off the plan price (confirmed by our team at checkout on Oct 27, 2026). Our link to Alpha’s sign-up page carries the code in its address (<span class="term">/signup/CHAMP/</span>); check that the discount shows before you pay.') +
        cta('alpha-futures', 'CHAMP: ' + al.champ + '% off, confirmed at checkout. Compare it with Alpha’s public code on your plan.') },
      { id: 'prices', label: 'Prices', html:
        '<h2 id="prices">Alpha Futures prices with CHAMP and with Alpha’s public codes</h2>' +
        P('List prices from Alpha, with the stated discounts applied. Zero, Standard and Advanced bill monthly until you pass; Direct is a single payment.') +
        table(['Plan', 'Billing', 'List', 'With CHAMP (' + al.champ + '%)', 'With public code'], rows,
          'Discounted prices are our arithmetic: list price minus the stated percentage. We have not verified whether a discount repeats on later monthly renewals. List prices: alpha-futures.com and help.alpha-futures.com, read ' + VERIFIED + '.', 'fs-promo') },
      { id: 'champ-vs-public', label: 'CHAMP vs MYALPHA', html:
        '<h2 id="champ-vs-public">CHAMP vs MYALPHA40 and MYALPHA50: which should you use?</h2>' +
        UL([
          '<strong>Zero:</strong> CHAMP and MYALPHA40 are both ' + al.champ + '% off, so the price is the same either way.',
          '<strong>Standard, Advanced and Direct:</strong> MYALPHA50 is ' + al.pub50 + '% off, which is more than CHAMP’s ' + al.champ + '%. On a 50K Advanced that is ' + off(al.adv.price[0], al.pub50) + ' vs ' + off(al.adv.price[0], al.champ) + ' for the first month.',
        ]) +
        P('We would rather you pay the lower price. Public codes rotate, so enter each at checkout and keep whichever gives the lower total. Using CHAMP when the prices are equal supports PropChamps at no cost to you.') },
      { id: 'what-it-covers', label: 'What it covers', html:
        '<h2 id="what-it-covers">What the code covers (and what we haven’t verified)</h2>' +
        table(['Item', 'Discount?', 'Notes'], [
          ['Zero, Standard, Advanced evaluation', 'Yes, ' + al.champ + '% off', 'Monthly billing stops when you pass.'],
          ['Direct (one-time)', 'Yes, ' + al.champ + '% off', 'Straight to funded; no evaluation.'],
          ['Activation fee', 'Nothing to discount', '$0 on every plan (Advanced since Jul 8, 2026).'],
          ['Evaluation resets', 'Not verified', 'Zero ' + range(al.zero.evalReset) + ' · Standard ' + range(al.std.evalReset) + ' · Advanced ' + range(al.adv.evalReset) + '.'],
          ['Qualified resets', 'Not verified', 'Zero ' + range(al.zero.qualReset) + ' · Standard ' + range(al.std.qualReset) + '; usable twice, before your first payout request.'],
          ['Later monthly renewals', 'Not verified', 'Check your billing page after the first month.'],
        ]) +
        P('Payout rules don’t change with the code you use. The rules for each plan are in ' + L('/firms/alpha-futures/payout-rules', 'Alpha Futures payout rules') + '.') },
      { id: 'how-to-apply', label: 'How to apply', html:
        '<h2 id="how-to-apply">How to apply the Alpha Futures code</h2>' +
        steps([
          '<strong>Open Alpha Futures</strong> through our link (it goes to Alpha’s sign-up page with CHAMP in the address) or go to alpha-futures.com directly.',
          '<strong>Choose your plan and size:</strong> Zero (' + al.zero.sizes.join(' / ') + '), Standard (' + al.std.sizes.join(' / ') + '), Advanced (' + al.adv.sizes.join(' / ') + ') or Direct (' + al.dir.sizes.join(' / ') + ').',
          '<strong>Enter CHAMP</strong> in the promo field at checkout, exactly as written, with no spaces.',
          '<strong>Check the total</strong> before you pay. If it doesn’t reflect ' + al.champ + '% off, see the fixes below.',
        ]) },
      { id: 'not-working', label: 'Not working?', html:
        '<h2 id="not-working">Alpha Futures code not working? Try these</h2>' +
        UL([
          '<strong>Typo or space:</strong> type CHAMP yourself rather than pasting, so no stray spaces come with it.',
          '<strong>Another code already applied:</strong> if a banner code is in the field, remove it and enter CHAMP. Keep whichever gives the lower total.',
          '<strong>It’s a reset or renewal:</strong> we haven’t verified that codes apply to resets or later months.',
          '<strong>Coupon-site codes:</strong> auto-generated coupon pages often list codes that aren’t Alpha’s current promos. At our ' + VERIFIED + ' check, the only public codes on Alpha’s own banner were MYALPHA40 and MYALPHA50.',
          '<strong>Still stuck:</strong> contact Alpha’s support before paying, and check our ' + L('/deals', 'deals page') + ' for the current status.',
        ]) },
    ];
  },
  faq: () => [
    { q: 'What is the Alpha Futures promo code?', a: 'CHAMP, our affiliate code, takes ' + al.champ + '% off Zero, Standard, Advanced and Direct (confirmed by our team at checkout on Oct 27, 2026) (confirm the total). Alpha also runs public codes; at our ' + VERIFIED + ' check they were MYALPHA40 (' + al.pub40 + '% off Zero) and MYALPHA50 (' + al.pub50 + '% off Standard, Direct and Advanced), which beats CHAMP on those three plans.' },
    { q: 'Is there an Alpha Futures 50% off code?', a: 'At our ' + VERIFIED + ' check, Alpha’s own banner showed MYALPHA50 for ' + al.pub50 + '% off Standard, Direct and Advanced, listed as running Oct 19–31, 2026. On those plans it beats CHAMP’s ' + al.champ + '%, so enter both at checkout and keep the lower total.' },
    { q: 'How much is Alpha Futures with the code?', a: 'At CHAMP’s ' + al.champ + '% (our arithmetic on list prices; the checkout total is the final word): Zero ' + al.zero.price.map((p) => off(p, al.champ)).join(' / ') + ' a month (' + al.zero.sizes.join(' / ') + '), Standard ' + al.std.price.map((p) => off(p, al.champ)).join(' / ') + ', Advanced ' + al.adv.price.map((p) => off(p, al.champ)).join(' / ') + ', and Direct ' + al.dir.price.map((p) => off(p, al.champ)).join(' / ') + ' one-time. On Standard, Advanced and Direct, MYALPHA50 (' + al.pub50 + '% off at our ' + VERIFIED + ' check) is cheaper, for example ' + off(al.adv.price[0], al.pub50) + ' vs ' + off(al.adv.price[0], al.champ) + ' for the first month of a ' + al.adv.sizes[0] + ' Advanced.' },
    { q: 'Does the Alpha Futures discount code work on the first order only?', a: 'We haven’t verified whether CHAMP is limited to first orders. Enter it on any new purchase and check that the total reflects the discount before you pay.' },
    { q: 'Does the code work on Alpha Futures resets?', a: 'We haven’t verified that any code applies to resets. Evaluation resets are ' + range(al.zero.evalReset) + ' on Zero, ' + range(al.std.evalReset) + ' on Standard and ' + range(al.adv.evalReset) + ' on Advanced.' },
    { q: 'Does Alpha Futures have an activation fee?', a: 'No. Activation is $0 on every plan, including Advanced accounts bought after Jul 8, 2026. The monthly subscription stops when you pass.' },
    { q: 'Is there an Alpha Futures Black Friday code?', a: 'We haven’t seen a Black Friday offer from Alpha as of ' + VERIFIED + '. We will update this page and the deals page if Alpha announces one.' },
    { q: 'Why is my Alpha Futures promo code not working?', a: 'The usual causes are a typo or extra space, another code already in the field, or a code from a coupon site that isn’t one of Alpha’s current promos. Codes may not apply to resets or renewals. Remove other codes, type CHAMP, and check the total.' },
    { q: 'Are the Alpha Futures codes on Reddit and coupon sites real?', a: 'Many auto-generated coupon pages list codes that don’t match Alpha’s current promos. At our ' + VERIFIED + ' check, the public codes on Alpha’s own banner were MYALPHA40 and MYALPHA50; CHAMP is our affiliate code.' },
  ],
  related: () => [['/firms/alpha-futures', 'Alpha Futures review'], ['/firms/alpha-futures/payout-rules', 'Alpha Futures payout rules'], ['/deals', 'Every CHAMP deal'], ['/best/cheapest-prop-firm-challenges', 'Cheapest prop firm challenges'], ['/blog/how-much-do-prop-firm-challenges-cost', 'How much a challenge costs'], ['/compare', 'Compare every firm']],
},

/* ---------------------------------------------------------------- Apex promo code (P1) */
{
  url: '/firms/apex-trader/promo-code', firm: 'apex-trader', wave: 2, crumb: 'Coupon code', blocked: 'website and help center',
  title: 'Apex Trader Funding Coupon Code (' + MONTH_SHORT + ' ' + YEAR + '): ' + AP.champ + '% Off',
  metaDesc: 'Apex coupon code CHAMP takes ' + AP.champ + '% off the evaluation (confirmed at checkout Oct 27, 2026). Intraday and EOD prices by size, and what it won’t cover.',
  h1: 'Apex Trader Funding Coupon Code (' + MONTH_LONG + ' ' + YEAR + '): CHAMP for ' + AP.champ + '% Off',
  eyebrow: 'Apex Trader Funding · Coupon code',
  dek: 'Code CHAMP takes ' + AP.champ + '% off an Apex evaluation in our data. Here is what that does to every Intraday and EOD price, when the No-Activation-Fee build is worth it, and what the code does not cover.',
  answer: () => [
    '<strong>Code: CHAMP</strong>, ' + ap.champ + '% off the evaluation on Intraday Trail or EOD Trail, at every size. That rate was confirmed by our team at checkout on Oct 27, 2026; Apex runs timed sales, so the checkout total is the final word.',
    '<strong>Example:</strong> a 50K Intraday Standard evaluation goes from ' + ap.price.intradayStd[1] + ' list to ' + off(ap.price.intradayStd[1], ap.champ) + '. Every size and build is in the table below.',
    '<strong>Not covered:</strong> per a search-index excerpt of Apex’s coupon page (Oct 2026), codes don’t apply to resets or PA activation fees. Confirm at checkout.',
    '<strong>Standard vs No-Activation:</strong> the No-Activation build usually costs more up front but skips the PA activation fee. It is cheaper overall only when that fee is bigger than the extra up-front cost, so compare both totals at checkout.',
    'Apex evaluations are a <strong>one-time fee</strong>, with no rebill, active for 30 days.',
  ],
  intro: () => callout('warn', 'Source note', '<p>Apex’s website blocked our automated check on ' + VERIFIED + '. List prices come from our Oct 5, 2026 audit; the ' + ap.champ + '% CHAMP rate was confirmed by our team at checkout on Oct 27, 2026. We don’t publish PA activation-fee amounts because we couldn’t verify current ones. Coupon exclusions (resets, PA activation fees), the ' + VF.apex.publicCode + ' code and the No-Activation size list come from search-engine excerpts of Apex’s coupon and help-center pages (Oct 2026). Evaluation rules and the one-time, 30-day terms are from our Oct 5 audit. Read the price at checkout before you buy.</p>'),
  sections: () => {
    const sz = ap.sizes;
    const pr = ap.price;
    return [
      { id: 'the-code', label: 'The code', html:
        '<h2 id="the-code">The Apex Trader Funding coupon code: CHAMP</h2>' +
        P('CHAMP is PropChamps’ affiliate code with Apex. In our data it takes ' + ap.champ + '% off the evaluation price on both account types (Intraday Trail and EOD Trail) and both builds (Standard and No-Activation-Fee); that rate was confirmed by our team at checkout on Oct 27, 2026. At our Oct 2026 check, a search-index excerpt of Apex’s coupon page showed a public code, ' + VF.apex.publicCode + ' (“up to 90% off all evaluations”, new sign-ups only); sale codes rotate. If both are available to you, try each and keep the lower total.') +
        cta('apex-trader', 'CHAMP: ' + ap.champ + '% off the evaluation in our data. Confirm the checkout total.') },
      { id: 'prices', label: 'Prices', html:
        '<h2 id="prices">Apex prices with CHAMP, by size</h2>' +
        H3('Intraday Trail', 'prices-intraday') +
        sizeTable('intraday-price', sz, 'Intraday Trail', [
          ['Standard: list', pr.intradayStd], ['Standard: with CHAMP', pr.intradayStd.map((p) => off(p, ap.champ))],
          ['No-Activation: list', pr.intradayNoAct], ['No-Activation: with CHAMP', pr.intradayNoAct.map((p) => off(p, ap.champ))],
        ]) +
        H3('EOD Trail', 'prices-eod') +
        sizeTable('eod-price', sz, 'EOD Trail', [
          ['Standard: list', pr.eodStd], ['Standard: with CHAMP', pr.eodStd.map((p) => off(p, ap.champ))],
          ['No-Activation: list', pr.eodNoAct], ['No-Activation: with CHAMP', pr.eodNoAct.map((p) => off(p, ap.champ))],
        ], '“With CHAMP” is our arithmetic: list minus ' + ap.champ + '%. List prices: PropChamps audit, Oct 5, 2026. The Intraday No-Activation list prices look out of line (25K ' + pr.intradayNoAct[0] + ' is above 50K ' + pr.intradayNoAct[1] + ', and 100K is below the Standard build); confirm them at checkout.') +
        P('Both types share the same targets (' + ap.target.join(' / ') + ') and drawdown (' + ap.dd.join(' / ') + '). EOD Trail adds a daily loss limit of ' + ap.eodDll.join(' / ') + '. If you are unsure which type to buy, read ' + L('/blog/apex-drawdown-explained', 'Apex drawdown explained') + '.') },
      { id: 'which-is-cheaper', label: 'Standard vs No-Activation', html:
        '<h2 id="which-is-cheaper">Standard vs No-Activation-Fee: which is cheaper?</h2>' +
        P('A Standard evaluation is usually cheaper up front, but after you pass you pay a PA activation fee, and coupon codes don’t discount it. The No-Activation build usually costs more up front and has a $0 PA fee. We don’t publish a break-even table: we couldn’t verify current PA activation fees, and our Intraday No-Activation list prices look out of line. At checkout, compare the No-Activation price with the Standard price plus the PA activation fee shown for your size.') +
        P('Per a search-index excerpt of Apex’s help center (Oct 2026), No-Activation evaluations are offered on Intraday 25K–150K and EOD 25K/50K, while our price data also lists EOD 100K/150K No-Activation prices. Check what checkout offers at your size.') },
      { id: 'what-it-covers', label: 'What it covers', html:
        '<h2 id="what-it-covers">What the Apex coupon covers</h2>' +
        table(['Item', 'Discounted?', 'Notes'], [
          ['Evaluation (Intraday or EOD, Standard or No-Activation)', 'Yes', ap.champ + '% with CHAMP in our data.'],
          ['PA activation fee (Standard build)', 'No', 'Per a search-index excerpt of Apex’s coupon page (Oct 2026). Amount shown at checkout.'],
          ['Resets', 'No', 'Per a search-index excerpt of Apex’s coupon page (Oct 2026). Our data lists the evaluation as one-time with no rebill.'],
          ['Legacy accounts (sale periods)', 'Not verified', 'Apex’s public sale text mentions legacy evaluations; check at checkout.'],
        ]) +
        P('The code doesn’t change payout rules. Those are in ' + L('/firms/apex-trader/payout-rules', 'Apex Trader Funding payout rules') + '.') },
      { id: 'how-to-apply', label: 'How to apply', html:
        '<h2 id="how-to-apply">How to apply the Apex coupon code</h2>' +
        steps([
          '<strong>Open Apex</strong> through our link or go to apextraderfunding.com directly.',
          '<strong>Pick the type, build and size:</strong> Intraday or EOD Trail, Standard or No-Activation, 25K to 150K.',
          '<strong>Enter CHAMP</strong> in the coupon field at checkout, exactly as written.',
          '<strong>Check the total</strong> and, for a Standard build, note the PA activation fee you will pay after passing.',
        ]) },
      { id: 'not-working', label: 'Not working?', html:
        '<h2 id="not-working">Apex coupon not working? Try these</h2>' +
        UL([
          '<strong>It’s a reset or a PA activation fee:</strong> per a search-index excerpt of Apex’s coupon page (Oct 2026), codes don’t apply to either.',
          '<strong>Another code in the field:</strong> remove it and try CHAMP, then compare totals.',
          '<strong>Typo:</strong> type CHAMP yourself, with no spaces.',
          '<strong>Coupon-site codes:</strong> many auto-generated pages list codes that aren’t Apex’s current promos.',
          '<strong>The discount looks different:</strong> Apex’s sale levels change, so the percentage you see can differ from month to month. The total at checkout is what you pay. Check our ' + L('/deals', 'deals page') + ' for the latest.',
        ]) },
    ];
  },
  faq: () => [
    { q: 'What is the Apex Trader Funding coupon code?', a: 'CHAMP. In our data it takes ' + ap.champ + '% off any Apex evaluation, Intraday or EOD Trail, Standard or No-Activation. Confirm the total at checkout.' },
    { q: 'Is the Apex 90% off code real?', a: 'Yes. CHAMP’s ' + ap.champ + '% off the evaluation was confirmed by our team at checkout on Oct 27, 2026. A search-index excerpt of Apex’s coupon page (Oct 2026) also showed a public code, ' + VF.apex.publicCode + ', at “up to 90% off all evaluations”. Discounts change with Apex’s sales, so the checkout total is the final word.' },
    { q: 'How much is an Apex 50K account with the code?', a: 'At CHAMP’s ' + ap.champ + '% (confirmed at checkout Oct 27, 2026) and our Oct 5, 2026 list prices (confirm prices at checkout): Intraday Standard ' + off(ap.price.intradayStd[1], ap.champ) + ', EOD Standard ' + off(ap.price.eodStd[1], ap.champ) + ' and EOD No-Activation ' + off(ap.price.eodNoAct[1], ap.champ) + '. Our Intraday No-Activation list price looks out of line, so check that build at checkout. Standard builds add a PA activation fee after you pass.' },
    { q: 'Does Apex have an activation fee?', a: 'Standard builds charge a PA activation fee after you pass; the amount is shown at checkout. No-Activation-Fee builds usually cost more up front and have a $0 PA fee. Per a search-index excerpt of Apex’s coupon page (Oct 2026), coupon codes don’t discount the activation fee.' },
    { q: 'Which is cheaper: Apex Standard or No Activation Fee?', a: 'It depends on the PA activation fee, which we couldn’t verify. Standard is usually cheaper up front but charges a PA activation fee after you pass (per a search-index excerpt of Apex’s coupon page, codes don’t discount it); No-Activation usually costs more up front with a $0 PA fee. At checkout, compare the No-Activation price with the Standard price plus its activation fee.' },
    { q: 'Does the Apex coupon work on the activation fee or resets?', a: 'Per a search-index excerpt of Apex’s coupon-code help page (Oct 2026; Apex blocked our direct check), codes don’t apply to resets or PA activation fees. Confirm at checkout.' },
    { q: 'Does the Apex coupon work on the first order only?', a: 'A search-index excerpt of Apex’s coupon page (Oct 2026) listed its public code ' + VF.apex.publicCode + ' as new sign-ups only. We haven’t verified repeat-order rules for CHAMP; enter it and check the total.' },
    { q: 'Why is my Apex coupon not working?', a: 'Common causes: the item is a reset or a PA activation fee (excluded, per a search-index excerpt of Apex’s coupon page), another code is in the field, a typo, or a coupon-site code that isn’t current. Remove other codes, type CHAMP and compare the totals.' },
    { q: 'Is Apex Trader Funding a monthly subscription?', a: 'No. In our data Apex evaluations are a one-time fee, with no rebill, active for 30 days.' },
  ],
  related: () => [['/firms/apex-trader', 'Apex Trader Funding review'], ['/firms/apex-trader/payout-rules', 'Apex payout rules'], ['/blog/apex-drawdown-explained', 'Apex drawdown explained'], ['/deals', 'Every CHAMP deal'], ['/best/cheapest-prop-firm-challenges', 'Cheapest prop firm challenges'], ['/blog/how-much-do-prop-firm-challenges-cost', 'How much a challenge costs']],
},
];

/* ================================================================
   TEMPLATE
   ================================================================ */
const PAGE_CSS = `
.article-byline a{color:var(--lime-text);border-bottom:1px solid var(--border-lime)}
.fs-firmline{display:flex;align-items:center;gap:12px;margin:0 0 20px;font-size:14px;color:var(--text-soft)}
.fs-firmline img{width:38px;height:38px;border-radius:10px;background:var(--bg-elev);border:1px solid var(--border-strong);padding:5px;object-fit:contain}
.fs-firmline b{color:var(--text-strong);font-weight:700}
.fs-firmline a{color:var(--lime-text);border-bottom:1px solid var(--border-lime)}
.takeaways .kt-label{color:var(--pc-gold,#f5c14e)}
.takeaways{border-color:var(--pc-gold-line,rgba(245,193,78,.32));background:linear-gradient(180deg,rgba(245,193,78,.06),rgba(124,92,255,.02))}
.article-body h3[id],.article-body th[id]{scroll-margin-top:calc(var(--pc-header-h,68px) + 96px)}
table.data .fs-rh{font-weight:700;color:var(--text-strong);min-width:150px;text-align:left}
table.data td.fs-num{font-family:var(--font-mono);font-size:13.5px;white-space:nowrap;color:var(--text)}
table.data td.fs-wrap{font-size:14px;line-height:1.5;color:var(--text)}
table.data tbody tr:last-child th{border-bottom:0}
table.data.fs-cmp{min-width:700px;table-layout:fixed}
table.data.fs-cmp th:first-child{width:150px}
table.data.fs-sz th:first-child{position:sticky;left:0;z-index:2;background:var(--bg-base)}
table.data.fs-sz thead th:first-child{background:var(--bg-band);z-index:3}
table.data.fs-mini,table.data.fs-fluid{min-width:0}
table.data.fs-glance{font-size:14px}
table.data.fs-glance thead th{white-space:normal;line-height:1.35}
table.data.fs-glance th,table.data.fs-glance td{padding:12px 12px}
table.data.fs-glance .fs-rh{min-width:104px}
table.data.fs-mini th,table.data.fs-mini td{padding:8px 12px}
.callout table.data{min-width:0;font-size:14px}
.callout .table-wrap{margin:4px 0 12px;background:var(--bg-base)}
.callout p+p{margin-top:10px}
.fs-mark{color:var(--pc-gold,#f5c14e);font-weight:700;font-size:.8em;margin-left:2px;cursor:help}
.fs-muted{color:var(--text-faint);font-size:12.5px}
.fs-cap{caption-side:top;text-align:left;padding:12px 16px;font-family:var(--font-mono);font-size:11.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--text-faint);border-bottom:1px solid var(--border)}
.fs-cap b{color:var(--lime-text)}
.fs-cmp td{font-size:14px}
.fs-sizes{display:flex;gap:8px;flex-wrap:wrap}
.fs-sizes button{padding:8px 16px;border:1px solid var(--border-strong);border-radius:100px;background:var(--bg-elev);color:var(--text-soft);font-weight:700;font-size:13.5px;font-family:var(--font-mono);transition:all .15s}
.fs-sizes button:hover{color:var(--text-strong);border-color:var(--border-lime)}
.fs-sizes button[aria-pressed="true"]{color:var(--lime-text);border-color:var(--lime);background:rgba(124,92,255,.10);box-shadow:0 0 0 1px var(--lime)}
.fs-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.fs-card{padding:20px 20px 18px;border:1px solid var(--border);border-radius:14px;background:linear-gradient(180deg,var(--bg-card),var(--bg-elev))}
.fs-card .fs-tag{display:inline-block;font-family:var(--font-mono);font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--pc-gold,#f5c14e);margin-bottom:8px}
.article-body .fs-card h3{margin:0 0 8px;font-size:19px}
.article-body .fs-card p{font-size:14.5px;line-height:1.6;color:var(--text-soft);margin:0 0 8px}
.article-body .fs-card p:last-child{margin-bottom:0}
.article-body .fs-card p b{color:var(--text-strong)}
.fs-card .fs-good b{color:var(--positive)}
.fs-card .fs-watch b{color:var(--warning)}
.article-body ol.fs-steps{list-style:none;padding-left:0;counter-reset:fs}
.article-body ol.fs-steps li{counter-increment:fs;position:relative;padding:2px 0 0 46px;margin-bottom:16px}
.article-body ol.fs-steps li::before{content:counter(fs);position:absolute;left:0;top:0;width:30px;height:30px;border-radius:50%;background:var(--lime-soft);border:1px solid var(--border-lime-strong);color:var(--lime-text);font-family:var(--font-mono);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}
.fs-cta{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;gap:14px 16px;align-items:center;padding:20px 22px;border:1px solid var(--border-lime);border-radius:16px;background:linear-gradient(135deg,rgba(124,92,255,.10),rgba(124,92,255,.02) 60%,rgba(245,193,78,.04))}
.fs-cta img{width:44px;height:44px;border-radius:11px;background:var(--bg-elev);border:1px solid var(--border-strong);padding:6px;object-fit:contain}
.fs-cta-copy b{display:block;font-size:16px;color:var(--text-strong);letter-spacing:-.01em}
.fs-cta-copy span{display:block;font-size:13.5px;line-height:1.5;color:var(--text-soft)}
.fs-cta-copy span a{color:var(--lime-text);border-bottom:1px solid var(--border-lime)}
.fs-code{display:inline-flex;align-items:center;gap:8px;padding:13px 16px;border:1px dashed var(--pc-gold-line,rgba(245,193,78,.32));border-radius:10px;background:var(--pc-gold-soft,rgba(245,193,78,.11));color:var(--pc-gold,#f5c14e);font-family:var(--font-mono);font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.fs-code b{color:var(--pc-gold-2,#ffd77a);font-size:14px}
.fs-code:hover{border-style:solid}
.article-body .fs-cta .btn-primary{border-bottom:0;color:var(--on-accent,#fff);white-space:nowrap}
.article-body .fs-cta .btn-primary:hover{color:var(--on-accent,#fff)}
.article-body p.fs-disc{grid-column:1/-1;font-size:12.5px;line-height:1.55;color:var(--text-faint);margin:0}
.fs-vs{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:900px;margin:0 auto}
.fs-vs a{display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border:1px solid var(--border-strong);border-radius:100px;background:var(--bg-card);font-size:14px;font-weight:600;color:var(--text);transition:all .15s}
.fs-vs a:hover{border-color:var(--border-lime);color:var(--text-strong)}
.fs-vs a span{color:var(--text-faint)}
@media(max-width:640px){
  .fs-cards{grid-template-columns:1fr}
  .fs-cta{grid-template-columns:auto minmax(0,1fr)}
  .fs-cta .fs-code,.fs-cta .btn-primary{grid-column:1/-1;justify-content:center;width:100%}
  table.data th,table.data td{padding:11px 12px}
  table.data .fs-rh{min-width:128px}
}`;

const SIZE_JS = `
  var sb=[].slice.call(document.querySelectorAll('.fs-sizes button'));
  sb.forEach(function(b){b.addEventListener('click',function(){var i=+b.getAttribute('data-size');
    sb.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});
    [].forEach.call(document.querySelectorAll('[data-s]'),function(td){try{td.textContent=JSON.parse(td.getAttribute('data-s'))[i];}catch(e){}});
    [].forEach.call(document.querySelectorAll('[data-size-label]'),function(el){el.textContent=b.textContent;});});});`;

function render(c) {
  const f = firm(c.firm);
  const url = SITE + c.url;
  const firmUrl = '/firms/' + c.firm;
  if (c.title.length > 60) die(c.url + ': title is ' + c.title.length + ' chars (max 60)');
  if (c.metaDesc.length > 155) die(c.url + ': meta description is ' + c.metaDesc.length + ' chars (max 155)');
  const sections = c.sections();
  const faq = c.faq();
  const answer = c.answer();
  const intro = c.intro ? c.intro() : '';
  const ids = new Set();
  sections.forEach((s) => { if (ids.has(s.id)) die(c.url + ': duplicate section id ' + s.id); ids.add(s.id); });

  // related: generated from what exists on disk
  const seen = new Set([c.url]);
  const related = c.related().filter(([u]) => { const k = u.split('#')[0]; if (seen.has(k) || !exists(u)) return false; seen.add(k); return true; });
  const vs = vsPages(c.firm);
  const bodyHtml = sections.map((s) => s.html).join('\n      ');
  const words = stripTags(answer.join(' ') + ' ' + bodyHtml + ' ' + faq.map((x) => x.q + ' ' + x.a).join(' ')).split(/\s+/).length;
  const readMin = Math.max(4, Math.round(words / 230));

  const crumbs = [['Home', SITE + '/'], ['Firms', SITE + '/firms/'], [f.name, SITE + firmUrl], [c.crumb, url]];
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', '@id': url + '#article', headline: stripTags(c.title), description: c.metaDesc, image: SITE + '/og-image.jpg', datePublished: PUBLISHED, dateModified: MODIFIED, inLanguage: 'en',
      author: { '@type': 'Organization', name: 'PropChamps', url: SITE }, publisher: { '@type': 'Organization', name: 'PropChamps', url: SITE, logo: { '@type': 'ImageObject', url: SITE + '/logos/pc-logo.png' } },
      about: { '@type': 'Organization', name: f.name }, mainEntityOfPage: { '@type': 'WebPage', '@id': url } },
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: x[1] })) },
    { '@type': 'FAQPage', '@id': url + '#faq', mainEntity: faq.map((x) => ({ '@type': 'Question', name: stripTags(x.q), acceptedAnswer: { '@type': 'Answer', text: stripTags(x.a) } })) },
  ] };
  const json = JSON.stringify(schema).replace(/</g, '\\u003c');
  JSON.parse(json);

  const nav = sections.map((s) => '<a class="section-nav-link" href="#' + s.id + '">' + esc(s.label) + '</a>').join('') + '<a class="section-nav-link" href="#faq">FAQ</a>';
  const faqHtml = faq.map((x) => '<details class="faq-item"><summary class="faq-q">' + x.q + '<span class="faq-toggle-icon">+</span></summary><div class="faq-a"><p>' + x.a + '</p></div></details>').join('\n      ');
  const vsHtml = vs.length ? `
<section class="block">
  <div class="container">
    <div class="section-eyebrow">Head-to-head</div>
    <h2 class="section-h2">Compare ${esc(f.name)} with other firms</h2>
    <div class="fs-vs">
      ${vs.map(([u, t]) => '<a href="' + u + '">' + esc(t) + ' <span>→</span></a>').join('\n      ')}
    </div>
  </div>
</section>
` : '';
  const relatedHtml = related.map(([u, t]) => '<a class="more-card" href="' + attr(u) + '"><span>' + esc(t) + '</span><span class="arr">→</span></a>').join('\n      ');
  const ogTitle = c.title;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0b0b12">
<title>${esc(c.title)}</title>
<meta name="description" content="${attr(c.metaDesc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="PropChamps">
<meta property="og:title" content="${attr(ogTitle)}">
<meta property="og:description" content="${attr(c.metaDesc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="PropChamps — Independent prop firm research">
<meta property="article:modified_time" content="${MODIFIED}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/og-image.jpg">
<meta name="twitter:title" content="${attr(ogTitle)}">
<meta name="twitter:description" content="${attr(c.metaDesc)}">
<script type="application/ld+json">
${json}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/blog/blog.css">
<style>${PAGE_CSS}
</style>
<!-- pc:head --><!-- /pc:head -->
</head>
<body>

<!-- pc:chrome --><!-- /pc:chrome -->

<section class="article-hero">
  <div class="bg-stack"></div>
  <div class="container">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/firms/">Firms</a><span>/</span><a href="${firmUrl}">${esc(f.name)}</a><span>/</span>${esc(c.crumb)}</nav>
    <div class="article-eyebrow">${esc(c.eyebrow)}</div>
    <h1>${c.h1}</h1>
    <p class="article-dek">${esc(c.dek)}</p>
    <div class="fs-firmline"><img src="${attr(f.logo)}" alt="${attr(f.name + ' logo')}" width="38" height="38"><span><b>${esc(f.name)}</b> · ${esc(f.type)} · <a href="${firmUrl}">Full review</a></span></div>
    <div class="article-byline"><span><span class="live-dot"></span> <strong>PropChamps Research</strong></span><span class="sep"></span><span>${c.blocked ? 'Last checked' : 'Last verified'} ${VERIFIED} · <a href="/methodology">How we verify</a></span><span class="sep"></span><span>~${readMin} min read</span></div>
  </div>
</section>

<nav class="section-nav" id="sectionNav" aria-label="On this page">
  <div class="container">
    <span class="section-nav-label">Jump to</span>
    ${nav}
  </div>
</nav>

<section class="block" style="border-top:0">
  <div class="container">
    <div class="article-body">
      <div class="takeaways" data-reveal><span class="kt-label">The short answer</span><ul>${answer.map((x) => '<li>' + x + '</li>').join('')}</ul></div>
      ${intro}
      ${bodyHtml}
    </div>
  </div>
</section>

<section class="block" id="faq">
  <div class="container">
    <div class="section-eyebrow">Common questions</div>
    <h2 class="section-h2">${esc(f.name)}: frequently asked questions</h2>
    <div class="faq-list">
      ${faqHtml}
    </div>
  </div>
</section>

<div class="author-box" data-reveal>
  <img class="ab-logo" src="/logos/pc-mark.png" alt="PropChamps">
  <div>
    <h4>PropChamps Research</h4>
    <p>We track rules, payouts and prices at every futures prop firm we cover and check them against each firm’s own help center. ${c.blocked ? 'This page was last checked on ' + VERIFIED + '. ' + esc(f.name) + '’s ' + c.blocked + ' blocked our automated check that day, so the source note above says which numbers come from help-center excerpts.' : 'This page was last verified on ' + VERIFIED + '.'} Numbers labelled as estimates or help-center excerpts are marked where they appear. See <a href="/methodology">how we verify</a>.</p>
  </div>
</div>
${vsHtml}
<section class="block">
  <div class="container">
    <div class="section-eyebrow">Keep reading</div>
    <h2 class="section-h2">Related guides</h2>
    <div class="more-grid">
      ${relatedHtml}
    </div>
  </div>
</section>

<!-- pc:footer --><!-- /pc:footer -->

<script>
(function(){
  var links=[].slice.call(document.querySelectorAll('.section-nav-link'));
  var sections=links.map(function(l){return document.getElementById(l.getAttribute('href').slice(1));}).filter(Boolean);
  function onScroll(){var y=window.scrollY+170,cur=sections[0]?sections[0].id:null;sections.forEach(function(s){if(s.offsetTop<=y)cur=s.id;});links.forEach(function(l){l.classList.toggle('active',l.getAttribute('href')==='#'+cur);});}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  var els=document.querySelectorAll('[data-reveal]');
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.08,rootMargin:'0px 0px -40px 0px'});els.forEach(function(el){io.observe(el);});setTimeout(function(){els.forEach(function(el){el.classList.add('in');});},2500);}else{els.forEach(function(el){el.classList.add('in');});}${c.scripts === 'sizes' ? SIZE_JS : ''}
})();
</script>
</body>
</html>
`;
}

/* ---------------- run ---------------- */
const todo = CONFIGS.filter((c) => c.wave <= WAVE);
todo.forEach((c) => BUILD.add(c.url));
const sitemap = [];
todo.forEach((c) => {
  const html = render(c);
  const file = path.join(ROOT, fileFor(c.url));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log('  ✓ ' + fileFor(c.url) + '  (wave ' + c.wave + ' · title ' + c.title.length + ' · meta ' + c.metaDesc.length + ')');
  sitemap.push('  <url>\n    <loc>' + SITE + c.url + '</loc>\n    <lastmod>' + MODIFIED + '</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>');
});
const held = CONFIGS.filter((c) => c.wave > WAVE && fs.existsSync(path.join(ROOT, fileFor(c.url))));
if (held.length) console.log('\n  ! later-wave pages exist on disk but were not built or linked: ' + held.map((c) => fileFor(c.url)).join(', ') + '\n    (hold them out of a wave-' + WAVE + ' deploy)');
console.log('\nsitemap.xml entries:\n' + sitemap.join('\n'));
console.log('\nNext: node tools/pc-build.mjs  (injects the shared chrome/footer/assets into the new pages)');
