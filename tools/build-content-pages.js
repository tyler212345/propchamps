#!/usr/bin/env node
/**
 * build-content-pages.js — Pre-render the data-driven utility pages
 * (/deals, /payouts, /audit-log, /compare) plus the generated link blocks on
 * /, /guide and /methodology, from data/firms.js + data/changelog.js.
 *
 * WHY: like the firm pages, these were thin client-side-rendered shells —
 * the content only appeared after JS ran. This bakes each page's content into
 * the static HTML so there's real, crawlable content on first byte. Where a
 * page's own JS still re-renders a block (deals grid, compare firm cards,
 * audit-log entries), the markup here must stay byte-identical to the JS.
 *
 * Companion to tools/build-firm-pages.js — run BOTH after any data change:
 *   node tools/build-firm-pages.js && node tools/build-content-pages.js
 *   After generating, run: node tools/pc-build.mjs (injects the shared chrome; idempotent)
 *
 * LINKS THAT DEPEND ON OTHER PAGES are generated from the files on disk at
 * build time (vs/*.html, best/*.html, tools/*.html, firms/<slug>/*.html, the
 * /vs/ /best/ /tools/ hubs). New pages ship in waves, so a link to a page only
 * appears once its file exists: re-run this script after each wave lands.
 * Internal links are clean URLs (/firms/lucid-trading, never .html).
 *
 * Idempotent — content lives between <!--g:id-->…<!--/g:id--> markers, plus
 * <script type="application/ld+json" id="…"> blocks and the <title>/meta tags
 * of /compare and /deals; nothing else is touched (the <!-- pc:chrome/pc:footer/
 * pc:head --> regions are owned by tools/pc-build.mjs). No colours or legacy
 * chrome in the markup — styling comes from the page CSS / pc.css.
 * data/firms.js + data/changelog.js stay the single source of truth.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const FIRMS_SRC = fs.readFileSync(path.join(ROOT, 'data', 'firms.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(FIRMS_SRC, sandbox);
try { vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', 'changelog.js'), 'utf8'), sandbox); } catch (e) {}
const FIRMS = sandbox.window.FIRMS;
const CHANGELOG = sandbox.window.CHANGELOG || [];
if (!FIRMS) { console.error('Could not load window.FIRMS from data/firms.js'); process.exit(1); }

// slug -> firm page slug (clean URL /firms/<page>). The "take-profit" data slug
// lives at /firms/take-profit-trader. Every firm must be here.
var FIRM_PAGE = { 'lucid-trading': 'lucid-trading', 'tradeify': 'tradeify', 'alpha-futures': 'alpha-futures', 'apex-trader': 'apex-trader', 'my-funded-futures': 'my-funded-futures', 'top-one-futures': 'top-one-futures', 'take-profit': 'take-profit-trader', 'fundednext': 'fundednext' };
Object.keys(FIRMS).forEach(function (s) { if (!FIRM_PAGE[s]) console.warn('  ! no firm page mapped for slug "' + s + '" — add it to FIRM_PAGE (links will go to /firms/)'); });
function firmUrl(slug) { return FIRM_PAGE[slug] ? '/firms/' + FIRM_PAGE[slug] : '/firms/'; }

// Short display names for link labels and chips.
var SHORT = { 'apex-trader': 'Apex', 'tradeify': 'Tradeify', 'lucid-trading': 'Lucid Trading', 'alpha-futures': 'Alpha Futures', 'take-profit': 'Take Profit Trader', 'top-one-futures': 'Top One Futures', 'my-funded-futures': 'My Funded Futures', 'fundednext': 'FundedNext' };
function shortName(f) { return SHORT[f.slug] || f.name; }
// vs-page slugs use the firms' search names, which differ from two data slugs
var VS_TO_DATA = { 'apex-trader-funding': 'apex-trader', 'take-profit-trader': 'take-profit' };

// Object.values insertion order, live firms only — matches every page's JS
const LIVE = Object.values(FIRMS).filter(function (f) { return f && f.live !== false; });
const PLAN_COUNT = LIVE.reduce(function (s, f) { return s + (f.plansSummary || []).length; }, 0);

// ---------- dates ----------
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function iso(d) { return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); }
function fmtDate(s) { var d = new Date(s + 'T12:00:00Z'); return MON[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear(); }
// Newest dated data pass named in the firms.js header ("OCT 23, 2026 VERIFICATION",
// "LAST DATA UPDATE — Oct 5, 2026", …). Drives every "Updated / last checked" date.
const DATA_DATE = (function () {
  // the assignment, not the first mention — the usage notes up top name window.FIRMS too
  var head = FIRMS_SRC.slice(0, FIRMS_SRC.search(/^window\.FIRMS\s*=/m));
  var best = null;
  head.split('\n').filter(function (l) { return /VERIFICATION|DATA UPDATE/i.test(l); }).forEach(function (l) {
    var m = l.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),\s+(20\d\d)/i);
    if (!m) return;
    var d = new Date(Date.UTC(+m[3], MON.map(function (x) { return x.toLowerCase(); }).indexOf(m[1].slice(0, 3).toLowerCase()), +m[2]));
    if (!best || d > best) best = d;
  });
  return best ? iso(best) : iso(new Date());
})();
// Month shown in the /deals title: the month of the newest data pass, so a later
// rebuild can't claim a fresher check than the data has.
const DATA_MONTH = MON[+DATA_DATE.slice(5, 7) - 1] + ' ' + DATA_DATE.slice(0, 4);

// When each firm's code + prices were last read on its own site (verified-facts.md
// of the Oct 23, 2026 check). Firms not listed were read on DATA_DATE.
var FIRM_CHECKED = {
  'apex-trader': { date: '2026-10-05', note: 'Apex blocked our Oct 23 check, so its newest rule values come from search-index excerpts of its help center.' },
  'tradeify': { note: 'Tradeify\'s help center blocked our Oct 23 fetch; plan data came from tradeify.co.' },
  'lucid-trading': { date: '2026-10-05', note: 'Lucid\'s marketing site blocked our Oct 23 fetch, so the prices and code details are from our Oct 5 check; the rules were re-read in its help center on Oct 23.' }
};
function firmChecked(slug) { var c = FIRM_CHECKED[slug] || {}; return { date: c.date || DATA_DATE, note: c.note || '' }; }

// How each payoutTotal may be labelled. Only totals re-read on the firm's own site
// are "firm-published". FundedNext's figure covers all of its programs (not
// futures-only); TPT's total hasn't been re-read since it was added; Lucid's is
// under review (it doesn't match what Lucid advertises) and is never displayed.
var TOTAL_STATUS = {
  'tradeify': { kind: 'published', checked: '2026-10-23' },
  'alpha-futures': { kind: 'published', checked: '2026-10-23' },
  'top-one-futures': { kind: 'published', checked: '2026-10-23' },
  'apex-trader': { kind: 'published', checked: '2026-10-05' },
  'my-funded-futures': { kind: 'published', checked: '2026-10-05' },
  'fundednext': { kind: 'published', checked: '2026-10-05', allPrograms: true },
  'take-profit': { kind: 'unconfirmed' },
  'lucid-trading': { kind: 'review' }
};
function totalStatus(slug) { return TOTAL_STATUS[slug] || { kind: 'unconfirmed' }; }

// ---------- shared, idempotent injection ----------
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escAttr(s) { return esc(s).replace(/"/g, '&quot;'); }
function decode(s) { return String(s).replace(/&nbsp;/g, ' ').replace(/&rarr;/g, '→').replace(/&mdash;/g, '—').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); }
function stripTags(s) { return decode(String(s).replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim(); }
var TAG = {
  dealsGrid: 'div',
  entries: 'div', statTotal: 'strong', statFirms: 'strong', statSuperseded: 'strong', statLast: 'strong', resultsCount: 'strong',
  firmsGrouped: 'div', visibleFirms: 'strong', visiblePlans: 'strong'
};
function injectInner(html, id, content) {
  // function replacers insert literally — firm data is full of "$1,500", which
  // would otherwise be read as $1/$2 backreferences in a replacement string.
  var open = '<!--g:' + id + '-->', close = '<!--/g:' + id + '-->';
  var marker = new RegExp('(<!--g:' + id + '-->)[\\s\\S]*?(<!--/g:' + id + '-->)');
  if (marker.test(html)) return html.replace(marker, function (m, g1, g2) { return g1 + content + g2; });
  var tag = TAG[id];
  if (!tag) { console.warn('  ! marker <!--g:' + id + '--> not found'); return html; }
  var first = new RegExp('(<' + tag + '\\b[^>]*\\bid="' + id + '"[^>]*>)[\\s\\S]*?(</' + tag + '>)');
  return html.replace(first, function (m, g1, g2) { return g1 + open + content + close + g2; });
}
// Replace a whole JSON-LD block identified by its id attribute.
function setLd(html, id, obj) {
  var re = new RegExp('(<script type="application/ld\\+json" id="' + id + '">)[\\s\\S]*?(</script>)');
  if (!re.test(html)) { console.warn('  ! JSON-LD block #' + id + ' not found'); return html; }
  var json = JSON.stringify(obj).replace(/</g, '\\u003c');
  return html.replace(re, function (m, a, b) { return a + json + b; });
}
// Keep <title>, og:title and twitter:title (and optionally the descriptions) in step.
function setHead(html, o) {
  if (o.title) {
    html = html.replace(/<title>[^<]*<\/title>/, function () { return '<title>' + esc(o.title) + '</title>'; });
    html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, function (m, a, b) { return a + escAttr(o.title) + b; });
    html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, function (m, a, b) { return a + escAttr(o.title) + b; });
  }
  if (o.desc) {
    html = html.replace(/(<meta name="description" content=")[^"]*(")/, function (m, a, b) { return a + escAttr(o.desc) + b; });
    html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, function (m, a, b) { return a + escAttr(o.desc) + b; });
    html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/, function (m, a, b) { return a + escAttr(o.desc) + b; });
  }
  return html;
}
function writeChanged(file, before, html, label) {
  if (html !== before) { fs.writeFileSync(file, html); console.log('  ✓ ' + label); return 1; }
  console.log('  · unchanged ' + label); return 0;
}
function read(p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); }

// ---------- disk-aware link helpers ----------
// '/firms/lucid-trading/payout-rules' -> 'firms/lucid-trading/payout-rules.html' (or …/index.html) if on disk
function fileFor(url) {
  var p = url.replace(/[#?].*$/, '').replace(/^\//, '').replace(/\/$/, '');
  if (!p) return 'index.html';
  var c = [p + '.html', p + '/index.html'];
  for (var i = 0; i < c.length; i++) { var f = path.join(ROOT, c[i]); if (fs.existsSync(f) && fs.statSync(f).isFile()) return c[i]; }
  return null;
}
function exists(url) { return !!fileFor(url); }
function titleOf(url) {
  var f = fileFor(url); if (!f) return '';
  var m = read(f).match(/<title>([^<]*)<\/title>/);
  return m ? decode(m[1]).trim() : '';
}
// "Best Prop Firms for Fast Payouts (2026) | PropChamps" -> "Best Prop Firms for Fast Payouts"; drops parentheticals and a trailing year
function shortTitle(t) {
  return String(t || '').split(' | ')[0].replace(/\s*\([^)]*\)/g, '').split(/\s[—–]\s|:\s/)[0].replace(/\s+(?:19|20)\d\d$/, '').replace(/\s+/g, ' ').trim();
}
function prettySlug(s) { return s.replace(/-/g, ' ').replace(/^\w/, function (c) { return c.toUpperCase(); }); }
function listPages(dir, re) {
  var d = path.join(ROOT, dir);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(function (f) { return re.test(f) && f !== 'index.html' && f[0] !== '_'; }).sort()
    .map(function (f) { var url = '/' + dir + '/' + f.replace(/\.html$/, ''); return { url: url, title: shortTitle(titleOf(url)) || prettySlug(f.replace(/\.html$/, '')) }; });
}
// Every head-to-head on disk: /vs/<a>-vs-<b>
function vsPages() {
  var dir = path.join(ROOT, 'vs');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(function (f) { return /^[a-z0-9-]+-vs-[a-z0-9-]+\.html$/.test(f); }).map(function (f) {
    var slug = f.replace(/\.html$/, ''), parts = slug.split('-vs-');
    var a = FIRMS[VS_TO_DATA[parts[0]] || parts[0]], b = FIRMS[VS_TO_DATA[parts[1]] || parts[1]];
    if (!a || !b) return null;
    return { url: '/vs/' + slug, a: a, b: b, label: shortName(a) + ' vs ' + shortName(b) };
  }).filter(Boolean).sort(function (x, y) { return x.label.localeCompare(y.label); });
}
// Firm subpages on disk: firms/<page>/<sub>.html
function firmSubpages() {
  var out = [];
  LIVE.forEach(function (f) {
    var page = FIRM_PAGE[f.slug]; if (!page) return;
    var d = path.join(ROOT, 'firms', page);
    if (!fs.existsSync(d) || !fs.statSync(d).isDirectory()) return;
    fs.readdirSync(d).filter(function (x) { return /\.html$/.test(x) && x !== 'index.html'; }).sort().forEach(function (x) {
      var url = '/firms/' + page + '/' + x.replace(/\.html$/, '');
      out.push({ url: url, firm: f, title: shortTitle(titleOf(url)) || (f.name + ' ' + prettySlug(x.replace(/\.html$/, '')).toLowerCase()) });
    });
  });
  return out;
}
function firmFileHasId(slug, id) { var f = fileFor(firmUrl(slug)); return !!f && read(f).indexOf('id="' + id + '"') !== -1; }
// Owner page for "<firm> payout rules": the subpage, else the review's #payout-rules section, else the review.
function payoutRulesLink(f) {
  var base = firmUrl(f.slug);
  if (exists(base + '/payout-rules')) return { url: base + '/payout-rules', label: shortName(f) + ' payout rules' };
  if (firmFileHasId(f.slug, 'payout-rules')) return { url: base + '#payout-rules', label: shortName(f) + ' payout rules' };
  return { url: base, label: shortName(f) + ' review' };
}
// Owner page for "<firm> promo code" (cannibalisation map): the promo subpage when it
// exists, else the review's #promo-code section.
function promoLink(f) {
  var base = firmUrl(f.slug);
  if (exists(base + '/promo-code')) return { url: base + '/promo-code', label: 'Full ' + shortName(f) + ' promo code guide' };
  if (firmFileHasId(f.slug, 'promo-code')) return { url: base + '#promo-code', label: shortName(f) + ' promo code details' };
  return null;
}
function smLogo(f) {
  var sm = String(f.logo || '').replace(/^\/logos\//, '/logos/sm/');
  return fs.existsSync(path.join(ROOT, sm.replace(/^\//, ''))) ? sm : f.logo;
}
// Filter a list of [url, label] to the ones whose page exists.
function onDisk(list) { return list.filter(function (x) { return exists(x[0]); }); }

// ---------- data helpers ----------
var ACRONYM = { EOD: 1, DLL: 1, 'PRO+': 1, MFF: 1 };
function prettyPlan(name) {
  return String(name).split(/(\s+)/).map(function (w) {
    if (/^\s+$/.test(w) || ACRONYM[w]) return w;
    return (/^[A-Z][A-Z+]{2,}$/.test(w)) ? w.charAt(0) + w.slice(1).toLowerCase() : w;
  }).join('');
}
function planLabel(f, p, ctx) {
  // TPT's single plan row covers Test → PRO → PRO+; its payout fields describe the PRO account
  if (f.slug === 'take-profit' && /^EVALUATION$/i.test(p.name)) return ctx === 'payout' ? 'PRO' : 'Test → PRO → PRO+';
  return prettyPlan(String(p.name).replace(/^(LUCID|ALPHA|FUNDED FUTURES)\s+/i, ''));
}
function rule(p, k) { return (p.rules && p.rules[k]) || ''; }
// Trader share(s) in a split string: "90% Trader 10% Tradeify" -> [90]; "PRO 80/20 · PRO+ 90/10" -> [80, 90]
function splitPcts(s) { var out = []; String(s || '').replace(/(\d{2,3})\s*(?:%|\/\s*\d)/g, function (m, n) { n = +n; if (n >= 50 && n <= 100) out.push(n); return m; }); return out; }
function firmSplitRange(f) {
  var all = []; (f.plansSummary || []).forEach(function (p) { all = all.concat(splitPcts(rule(p, 'Payout Split'))); });
  if (!all.length) return '—';
  var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
  return lo === hi ? lo + '%' : lo + '–' + hi + '%';
}
function discountPct(f) { var m = String((f.promo && f.promo.discount) || '').match(/(\d+)\s*%/); return m ? +m[1] : 0; }
function discountLabel(f) {
  var d = String((f.promo && f.promo.discount) || '');
  if (/\d+\s*%/.test(d)) return d.replace(/\boff\b/i, 'off');
  return 'Shown at checkout';
}
function isDaily(freq) { return /^daily\b/i.test(String(freq || '').trim()); }
function dailyPlans() {
  var out = [];
  LIVE.forEach(function (f) { (f.plansSummary || []).forEach(function (p) { if (isDaily(rule(p, 'Payout Frequency'))) out.push({ f: f, p: p }); }); });
  return out;
}
function joinList(arr) { if (arr.length < 2) return arr.join(''); return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]; }
function parseAmount(s) { if (!s) return 0; var clean = ('' + s).replace(/[$,+~]/g, '').toUpperCase(); var n = parseFloat(clean); if (isNaN(n)) return 0; if (/K\b/.test(clean)) n *= 1e3; else if (/M\b/.test(clean)) n *= 1e6; else if (/B\b/.test(clean)) n *= 1e9; return n; }
function parseTimeMinutes(s) { if (!s) return 9999; var l = ('' + s).toLowerCase(); if (/instant/.test(l)) return 0; var m = l.match(/(\d+\.?\d*)\s*(hour|hr|h|day|d|min|m|week|w)/); if (!m) return 9999; var n = parseFloat(m[1]), unit = m[2]; if (unit.startsWith('min') || unit === 'm') return n; if (unit.startsWith('h')) return n * 60; if (unit.startsWith('d')) return n * 60 * 24; if (unit.startsWith('w')) return n * 60 * 24 * 7; return 9999; }

// FAQ: visible <details> markup + the matching FAQPage entities (answer text = visible text).
function faqHtml(items) {
  return items.map(function (it) {
    return '<details class="faq-item"><summary class="faq-q">' + esc(it.q) + ' <span class="faq-toggle-icon">+</span></summary><div class="faq-a">' + it.a + '</div></details>';
  }).join('');
}
function faqLd(id, items) {
  return { '@type': 'FAQPage', '@id': id, 'mainEntity': items.map(function (it) { return { '@type': 'Question', 'name': it.q, 'acceptedAnswer': { '@type': 'Answer', 'text': stripTags(it.a) } }; }) };
}
var SITE = 'https://propchamps.net';
function crumbs(name, url) { return { '@type': 'BreadcrumbList', 'itemListElement': [{ '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/' }, { '@type': 'ListItem', 'position': 2, 'name': name, 'item': SITE + url }] }; }

// ============================ /deals ============================
function parseOffer(f) {
  var line = (f.offerLine || '').trim();
  var m = line.match(/(\d+%|FREE)\s*OFF/i);
  if (m) { return { big: m[1].toUpperCase() + ' OFF', rest: line.replace(m[0], '').replace(/^\s*[\(]|[\)]\s*$/g, '').trim() }; }
  if (/code\s+champ/i.test(line)) { return { big: 'CHAMP', rest: line.replace(/Use\s*Code\s*CHAMP/i, '').trim() }; }
  return { big: line || 'CHAMP', rest: '' };
}
// The search each firm's section answers (the phrasing autocomplete shows most).
var DEAL_QUERY = { 'apex-trader': 'Apex Trader Funding coupon code', 'tradeify': 'Tradeify promo code', 'lucid-trading': 'Lucid Trading discount code', 'alpha-futures': 'Alpha Futures discount code', 'take-profit': 'Take Profit Trader promo code', 'top-one-futures': 'Top One Futures promo code', 'my-funded-futures': 'My Funded Futures discount code', 'fundednext': 'FundedNext Futures promo code' };
// Firm-specific copy. Every claim is from data/firms.js or the Oct 23, 2026 verified-facts sheet.
var DEAL_COPY = {
  'apex-trader': {
    body: 'CHAMP is on file at <strong>90% off the evaluation</strong>, which is a one-time fee with no rebill, active for 30 days. Every Apex evaluation comes in two builds: <strong>Standard</strong> (lowest evaluation price, with an activation fee to pay after you pass) or <strong>No-Activation-Fee</strong> (higher evaluation price, $0 activation). Per Apex\'s help center (Oct 2026, read through a search-index excerpt because Apex blocked our check), coupon codes don\'t apply to resets or to PA activation fees.',
    fix: 'The discount comes off the evaluation, not the PA activation fee. If you want $0 activation, pick the No-Activation-Fee build before you enter CHAMP.'
  },
  'top-one-futures': {
    body: 'CHAMP is on file at <strong>60% off</strong>. Elite Access is a <strong>$39 one-time evaluation at every size</strong>, followed by a $139 / $189 / $259 / $359 activation fee after you pass. Elite Daily bills monthly until you pass; Instant Sim Funded and Ignite are one-time purchases with no evaluation. Top One also rotates its own public promos (a buy-one-get-one on Elite Access at our Oct 23, 2026 check), so check which fee your code comes off at checkout.',
    fix: 'Top One prices Elite Access in two steps ($39, then activation), so check which line the discount lands on before you pay.'
  },
  'my-funded-futures': {
    body: 'CHAMP is on file at <strong>up to 50% off</strong>; the exact percentage depends on the plan. Every MFF plan is a one-time purchase with <strong>no activation fee</strong>, and Rapid, Rapid EOD and Pro have no daily loss limit (Builder has a soft pause). MFF also rotates its own per-plan public promos.',
    fix: 'The percentage varies by plan, so a smaller discount on one plan doesn\'t mean the code failed. Check the line total for the plan you picked.'
  },
  'alpha-futures': {
    body: 'CHAMP is on file at <strong>40% off</strong> Zero, Standard, Advanced and Direct. Zero, Standard and Advanced bill monthly until you pass; Direct is a one-time payment. Activation is <strong>$0 on every plan</strong>. At our Oct 23, 2026 check, Alpha\'s own site banner advertised 50% off Standard, Direct and Advanced, which is more than CHAMP\'s 40% on those plans, so compare both totals at checkout.',
    fix: 'If Alpha\'s banner discount is already applied, the checkout may not accept a second code. Remove it, enter CHAMP, and keep whichever total is lower.'
  },
  'take-profit': {
    body: 'CHAMP is on file at <strong>40% off</strong> the Test, which bills monthly until you pass. Moving to PRO carries a $130 one-time activation fee, which Take Profit Trader\'s own public promo waived at our Oct 23, 2026 check. We\'re re-checking whether CHAMP is a percentage or a flat amount, so confirm the total at checkout.',
    fix: 'Check that the discount shows on the monthly Test line. The $130 PRO activation is charged later, when you pass.'
  },
  'tradeify': {
    body: 'Tradeify sells Growth, Select and Lightning as <strong>one-time payments</strong> (since 03/31/26) with <strong>no activation fee</strong> on any plan. We don\'t have a confirmed CHAMP percentage on file, so the discount shows at checkout. Tradeify also runs its own rotating public promo (30% off every plan at our Oct 23, 2026 check), so compare the totals.',
    fix: 'Make sure you\'re on the plan you want (Growth, Select or Lightning) before entering CHAMP, and compare the total with Tradeify\'s current public promo.'
  },
  'lucid-trading': {
    body: 'Lucid runs four paths: Pro, Flex, Daily (priced by the options you pick) and Direct (straight to funded). Evaluation activation is <strong>free</strong>. The prices below are what CHAMP produced at our Oct 5, 2026 check; Lucid\'s marketing site blocked our Oct 23 check, so confirm the total. Lucid\'s homepage also promotes its own public code, so compare both at checkout.',
    fix: 'LucidDaily\'s price changes with the drawdown, DLL and consistency options you choose, so re-check the total after changing them.'
  },
  'fundednext': {
    body: 'FundedNext Futures charges a <strong>one-time challenge fee</strong> with no activation fee. The prices below are the offer prices in its help center at our Oct 23, 2026 check (Flex\'s offer covers your first two purchases). We don\'t have a confirmed CHAMP percentage on file, so the discount shows at checkout.',
    fix: 'FundedNext\'s offer price may already be applied. Enter CHAMP and compare the total with and without it.'
  }
};
function priceLabel(l) {
  if (/w\/\s*CHAMP/i.test(l)) return 'With CHAMP (Oct 5 check)';
  if (/no-activation/i.test(l)) return 'No-Activation-Fee build (list)';
  if (/monthly/i.test(l)) return 'Monthly (list)';
  if (/^eval(uation)?\s+(price|fee)/i.test(l)) return 'Evaluation (list)';
  if (/one-time fee/i.test(l)) return 'One-time (offer price)';
  if (/one-time|payment/i.test(l)) return 'One-time (list)';
  if (/list price/i.test(l)) return 'One-time (list)';
  return l;
}
function priceRows(f) {
  var rows = [];
  (f.plansDetailed || []).forEach(function (p) {
    var sizes = ((p.rules || []).find(function (r) { return /^account sizes$/i.test(r[0]); }) || [])[1] || '';
    (p.rules || []).filter(function (r) { return /price|payment|one-time fee|evaluation fee/i.test(r[0]) && !/reset|activation fee/i.test(r[0]); }).forEach(function (r, i) {
      rows.push({ plan: i === 0 ? prettyPlan(p.name) : '', sizes: i === 0 ? sizes : '', label: priceLabel(r[0]), value: String(r[1]).replace(/\s*·\s*site shows .*$/i, '') });
    });
  });
  if (!rows.length) { // Take Profit Trader keeps its monthly list prices in plansSummary's Activation Fee field
    (f.plansSummary || []).forEach(function (p) {
      var m = rule(p, 'Activation Fee').match(/monthly\s+([^()]+?)\s*(?:\(|$)/i);
      if (m) rows.push({ plan: f.slug === 'take-profit' ? 'Test (evaluation)' : planLabel(f, p), sizes: rule(p, 'Account Sizes'), label: 'Monthly (list)', value: m[1].trim() });
    });
  }
  return rows;
}
function dealSection(f) {
  var copy = DEAL_COPY[f.slug] || { body: esc(f.summary || ''), fix: '' };
  var chk = firmChecked(f.slug);
  var promo = promoLink(f);
  var rows = priceRows(f);
  var table = rows.length ? '<div class="fd-table-wrap"><table class="fd-table"><thead><tr><th scope="col">Plan</th><th scope="col">Sizes</th><th scope="col">Price</th></tr></thead><tbody>' +
    rows.map(function (r) {
      return '<tr' + (r.plan ? '' : ' class="fd-cont"') + '><th scope="row">' + esc(r.plan) + '</th><td data-label="Sizes">' + esc(r.sizes) + '</td><td data-label="' + escAttr(r.label) + '"><span class="fd-price-label">' + esc(r.label) + '</span>' + esc(r.value) + '</td></tr>';
    }).join('') + '</tbody></table></div>' : '';
  var off = discountPct(f);
  return '<section class="fd" id="code-' + f.slug + '" aria-labelledby="code-' + f.slug + '-h">' +
    '<div class="fd-head"><div class="fd-logo"><img src="' + smLogo(f) + '" alt="" width="44" height="44" loading="lazy"></div>' +
    '<div class="fd-titles"><h2 id="code-' + f.slug + '-h">' + esc(DEAL_QUERY[f.slug] || f.name + ' promo code') + '</h2><div class="fd-sub">' + esc(f.type || '') + '</div></div>' +
    '<div class="fd-off' + (off ? ' gold' : '') + '">' + (off ? '<b>' + (/up to/i.test(f.promo.discount) ? '<small>Up to</small>' : '') + off + '%</b><span>off with CHAMP</span>' : '<b>CHAMP</b><span>at checkout</span>') + '</div></div>' +
    '<dl class="fd-facts">' +
      '<div><dt>Code</dt><dd><button type="button" class="fd-code js-copy-champ" aria-label="Copy code CHAMP">CHAMP</button></dd></div>' +
      '<div><dt>Discount on file</dt><dd>' + esc(discountLabel(f)) + '</dd></div>' +
      '<div><dt>Last checked</dt><dd><time datetime="' + chk.date + '">' + fmtDate(chk.date) + '</time></dd></div>' +
    '</dl>' +
    '<p class="fd-body">' + copy.body + '</p>' + table +
    (chk.note ? '<p class="fd-note">' + esc(chk.note) + '</p>' : '') +
    '<div class="fd-fix"><strong>Code not working?</strong> Type CHAMP in capitals with no spaces, remove any other code already in the box, and open ' + esc(shortName(f)) + ' through our link so the referral is attached. ' + copy.fix + ' Still stuck? Email <a href="mailto:hello@propchamps.net">hello@propchamps.net</a> and we\'ll re-check it.</div>' +
    '<div class="fd-links"><a class="fd-go" href="' + escAttr(f.affiliateUrl || firmUrl(f.slug)) + '" target="_blank" rel="sponsored noopener">Open ' + esc(shortName(f)) + ' with CHAMP <span aria-hidden="true">→</span></a>' +
      (promo ? '<a class="fd-link" href="' + promo.url + '">' + esc(promo.label) + ' →</a>' : '') +
      '<a class="fd-link" href="' + firmUrl(f.slug) + '">' + esc(f.name) + ' review →</a></div>' +
    '</section>';
}
function buildDeals() {
  var file = path.join(ROOT, 'deals.html'); var before = read('deals.html'); var html = before;
  var cards = LIVE.map(function (f) {
    var offer = parseOffer(f);
    var tags = (f.tags || f.filters || []).slice(0, 3).map(function (t) { return '<span class="deal-card-tag">' + t.replace(/-/g, ' ') + '</span>'; }).join('');
    var code = f.promo && f.promo.code || 'CHAMP';
    return '<article class="deal-card" data-slug="' + f.slug + '">' +
      '<div class="deal-card-head"><div class="deal-card-logo"><img src="' + f.logo + '" alt="' + f.name + '"></div>' +
      '<div><div class="deal-card-firm">' + f.name + '</div><div class="deal-card-tagline">' + (f.tagline || f.type || '') + '</div></div></div>' +
      // "% OFF"/"FREE OFF" offers render gold, exactly like the page JS (/OFF$/i)
      '<div class="deal-card-offer"><span class="accent' + (/OFF$/i.test(offer.big) ? ' gold' : '') + '">' + offer.big + '</span></div>' +
      (offer.rest || f.offerSub ? '<div class="deal-card-offersub">' + (offer.rest || f.offerSub || '') + '</div>' : '') +
      (tags ? '<div class="deal-card-tags">' + tags + '</div>' : '') +
      '<div class="deal-card-foot"><span class="deal-code-chip js-copy-champ">' + code + ' · COPY</span>' +
      '<span class="deal-view-hint">View accounts &amp; rules</span></div>' +
      '</article>';
  }).join('');
  html = injectInner(html, 'dealsGrid', cards);

  // Per-firm sections, biggest discount on file first
  var order = LIVE.slice().sort(function (a, b) { return discountPct(b) - discountPct(a) || shortName(a).localeCompare(shortName(b)); });
  var jump = '<nav class="fd-jump" aria-label="Jump to a firm">' + order.map(function (f) {
    var off = discountPct(f);
    return '<a href="#code-' + f.slug + '"><img src="' + smLogo(f) + '" alt="" width="22" height="22" loading="lazy">' + esc(shortName(f)) + '<span>' + (off ? (/up to/i.test(f.promo.discount) ? 'up to ' : '') + off + '%' : 'CHAMP') + '</span></a>';
  }).join('') + '</nav>';
  html = injectInner(html, 'dealsByFirm', jump + order.map(dealSection).join(''));
  html = injectInner(html, 'dealsCount', String(LIVE.length));
  html = injectInner(html, 'dealsChecked', fmtDate(DATA_DATE).replace(/, \d{4}$/, ''));

  // Featured Apex card points, from the Apex plan data
  var apex = FIRMS['apex-trader'];
  if (apex) {
    var pd = function (name) { return (apex.plansDetailed || []).find(function (p) { return new RegExp(name, 'i').test(p.name); }); };
    var get = function (p, re) { var r = p && (p.rules || []).find(function (x) { return re.test(x[0]); }); return r ? String(r[1]) : ''; };
    var at = function (s, i) { return String(s).split(/\s*\/\s*/)[i] || ''; };
    var intra = pd('intraday'), eod = pd('eod');
    var sizes = get(intra, /^account sizes$/i).split(/\s*\/\s*/); var i50 = sizes.indexOf('50K');
    var pts = [];
    if (i50 > -1) pts.push('50K list price: ' + at(get(intra, /^eval price/i), i50) + ' Intraday Trail or ' + at(get(eod, /^eval price/i), i50) + ' EOD Trail (Standard builds); ' + at(get(intra, /no-activation/i), i50) + ' / ' + at(get(eod, /no-activation/i), i50) + ' for the No-Activation-Fee builds. CHAMP\'s ' + discountPct(apex) + '% on file comes off at checkout.');
    if (apex.rules && apex.rules[1]) pts.push(apex.rules[1].replace(/,\s*/g, ', ') + '.');
    if (i50 > -1) pts.push('Daily loss limit on 50K: ' + at(get(eod, /^daily loss limit$/i), i50) + ' on EOD Trail; ' + get(intra, /^daily loss limit$/i).toLowerCase() + ' on Intraday Trail during the evaluation.');
    pts.push('Funded: ' + (get(eod, /^payout split$/i).split(/\s*[—(]/)[0] || '100%') + ' payouts ' + get(eod, /^payout frequency$/i).toLowerCase() + '.');
    html = injectInner(html, 'dealsFeatured', pts.map(function (t) { return '<li class="featured-point">' + esc(t) + '</li>'; }).join(''));
  }

  var maxOff = Math.max.apply(null, LIVE.map(discountPct));
  html = injectInner(html, 'dealsMax', maxOff + '%');
  var title = 'Futures Prop Firm Promo Codes (' + DATA_MONTH + '): Up to ' + maxOff + '% Off';
  html = setHead(html, { title: title });
  html = setLd(html, 'ldDeals', { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': SITE + '/deals#webpage', 'name': title, 'url': SITE + '/deals', 'description': (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] ? decode(html.match(/<meta name="description" content="([^"]*)"/)[1]) : '', 'dateModified': DATA_DATE, 'isPartOf': { '@type': 'WebSite', 'name': 'PropChamps', 'url': SITE + '/' } },
    { '@type': 'ItemList', 'name': 'Futures prop firm promo codes', 'itemListElement': order.map(function (f, i) { return { '@type': 'ListItem', 'position': i + 1, 'name': DEAL_QUERY[f.slug] || f.name, 'url': SITE + '/deals#code-' + f.slug }; }) },
    crumbs('Deals', '/deals')
  ] });
  return writeChanged(file, before, html, 'deals.html (' + LIVE.length + ' deal cards + firm sections)');
}

// ============================ /payouts ============================
function buildPayouts() {
  var file = path.join(ROOT, 'payouts.html'); var before = read('payouts.html'); var html = before;
  function fmtCount(n) { if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (n >= 1e3) return Math.round(n / 1e3) + 'K'; return '' + Math.round(n); }
  var FLAGS = { US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦', AE: '🇦🇪' };
  var firms = LIVE.slice();
  firms.forEach(function (f) { var st = totalStatus(f.slug); f._tot = st.kind === 'review' ? -1 : parseAmount(f.payoutTotal); f._t = parseTimeMinutes(f.payoutMedianTime); });
  firms.sort(function (a, b) { return b._tot - a._tot; });
  var published = firms.filter(function (f) { return totalStatus(f.slug).kind === 'published'; });
  var top = published[0];

  // --- stats strip ---
  var daily = dailyPlans();
  var dailyFirms = {}; daily.forEach(function (d) { dailyFirms[d.f.slug] = 1; });
  var splitMax = 0, splitMaxFirm = null;
  LIVE.forEach(function (f) { (f.plansSummary || []).forEach(function (p) { splitPcts(rule(p, 'Payout Split')).forEach(function (n) { if (n > splitMax) { splitMax = n; splitMaxFirm = f; } }); }); });
  var fastest = firms.reduce(function (min, f) { return f._t < min._t ? f : min; }, firms[0]);
  var stats = [
    ['Biggest firm-published total', esc(top.payoutTotal), esc(top.name) + ' · its own figure', true],
    ['Plans with daily payouts', daily.length + '<small> of ' + PLAN_COUNT + '</small>', 'Across ' + Object.keys(dailyFirms).length + ' of ' + LIVE.length + ' firms we track', false],
    ['Highest payout split', splitMax + '%', esc(splitMaxFirm ? splitMaxFirm.name : '') + (splitMax === 100 ? ' (no split)' : ''), false],
    ['Fastest median payout', esc(fastest.payoutMedianTime || '—'), esc(fastest.name) + ' · <span class="est-tag">PropChamps estimate</span>', false]
  ];
  html = injectInner(html, 'payoutsStats', stats.map(function (s) {
    return '<div class="stat-card"><div class="stat-card-label">' + s[0] + '</div><div class="stat-card-value' + (s[3] ? ' lime' : '') + '">' + s[1] + '</div><div class="stat-card-sub">' + s[2] + '</div></div>';
  }).join(''));
  html = injectInner(html, 'payoutsUpdated', '<time datetime="' + DATA_DATE + '">' + fmtDate(DATA_DATE) + '</time>');

  // --- rules + published totals table ---
  function totalCell(f) {
    var st = totalStatus(f.slug);
    if (st.kind === 'review') return '<div class="p-value p-muted">Under review</div><div class="p-badge p-badge-warn">Not shown</div>';
    if (st.kind === 'unconfirmed') return '<div class="p-value">' + esc(f.payoutTotal || '—') + '</div><div class="p-badge p-badge-warn">Reported · not re-checked</div>';
    return '<div class="p-value lime">' + esc(f.payoutTotal || '—') + (st.allPrograms ? '<sup class="p-fn">*</sup>' : '') + '</div><div class="p-badge">Firm-published · ' + fmtDate(st.checked).replace(/, \d{4}$/, '') + '</div>';
  }
  var rows = firms.map(function (f) {
    var flag = FLAGS[f.country] || '';
    var link = payoutRulesLink(f);
    var cad = (f.plansSummary || []).map(function (p) { return '<li><b>' + esc(planLabel(f, p, 'payout')) + '</b><span>' + esc(rule(p, 'Payout Frequency') || '—') + '</span></li>'; }).join('');
    return '<tr data-href="' + firmUrl(f.slug) + '">' +
      '<td class="col-firm"><div class="p-firm"><div class="p-firm-logo"><img src="' + f.logo + '" alt="' + escAttr(f.name) + '"></div>' +
      '<div><a class="p-firm-name" href="' + firmUrl(f.slug) + '">' + esc(f.name) + (flag ? '<span class="p-firm-flag">' + flag + '</span>' : '') + '</a>' +
      '<div class="p-firm-type">' + esc(f.type || '') + '</div></div></div></td>' +
      '<td class="col-total">' + totalCell(f) + '</td>' +
      '<td class="col-cadence"><ul class="p-cadence">' + cad + '</ul></td>' +
      '<td class="col-split"><div class="p-value">' + firmSplitRange(f) + '</div><div class="p-value-sub">To the trader</div></td>' +
      '<td class="col-rules"><a class="p-rules-link" href="' + link.url + '">' + esc(link.label) + ' <span aria-hidden="true">→</span></a></td></tr>';
  }).join('');
  html = injectInner(html, 'payoutsTableBody', rows);

  // --- estimates table ---
  var minTime = Math.min.apply(null, firms.map(function (f) { return f._t; }));
  var maxTime = Math.max.apply(null, firms.filter(function (f) { return f._t < 9999; }).map(function (f) { return f._t; }));
  function timeBarPct(t) { if (t >= 9999) return 0; if (maxTime === minTime) return 50; return Math.max(8, Math.round(100 * (1 - (t - minTime) / (maxTime - minTime)))); }
  function timeBarClass(t) { var oneDay = 60 * 24; if (t <= 6 * 60) return 'time-fill-fast'; if (t <= oneDay) return 'time-fill-medium'; if (t <= 3 * oneDay) return 'time-fill-slow'; return 'time-fill-slowest'; }
  var est = firms.map(function (f) {
    var v = function (x) { return x && x !== '—' ? esc(x) : '<span class="p-muted">Not estimated</span>'; };
    return '<tr data-href="' + firmUrl(f.slug) + '">' +
      '<td class="col-firm"><div class="p-firm"><div class="p-firm-logo"><img src="' + f.logo + '" alt="' + escAttr(f.name) + '"></div><div><a class="p-firm-name" href="' + firmUrl(f.slug) + '">' + esc(f.name) + '</a></div></div></td>' +
      '<td class="col-count"><div class="p-value">' + v(f.payoutCount) + '</div><div class="p-value-sub">est.</div></td>' +
      '<td class="col-avg"><div class="p-value">' + v(f.payoutAvg) + '</div><div class="p-value-sub">est.</div></td>' +
      '<td class="col-largest"><div class="p-value">' + v(f.payoutLargest) + '</div><div class="p-value-sub">est.</div></td>' +
      '<td class="col-time"><div class="time-bar"><div class="time-bar-label"><span>' + v(f.payoutMedianTime) + '</span><em>est.</em></div>' +
      '<div class="time-bar-rail"><div class="time-bar-fill ' + timeBarClass(f._t) + '" style="width:' + timeBarPct(f._t) + '%"></div></div>' +
      '<div class="time-bar-scale"><span>Fast</span><span>Slow</span></div></div></td></tr>';
  }).join('');
  html = injectInner(html, 'payoutsEstBody', est);

  // --- "Which prop firm pays the most?" ---
  var rest = published.slice(1).map(function (f) { return esc(f.name) + ' (' + esc(f.payoutTotal) + (totalStatus(f.slug).allPrograms ? ', across all of ' + esc(shortName(f)) + '\'s programs, not just futures' : '') + ')'; });
  var unconf = firms.filter(function (f) { return totalStatus(f.slug).kind === 'unconfirmed'; });
  var review = firms.filter(function (f) { return totalStatus(f.slug).kind === 'review'; });
  // Group plans by the split of their first funded stage (TPT: PRO 80/20; its live PRO+ pays 90/10)
  var splitGroups = {}; LIVE.forEach(function (f) { (f.plansSummary || []).forEach(function (p) { var n = splitPcts(rule(p, 'Payout Split'))[0]; if (n) (splitGroups[n] = splitGroups[n] || []).push(shortName(f) + ' ' + planLabel(f, p, 'payout')); }); });
  var pcts = Object.keys(splitGroups).map(Number).sort(function (a, b) { return b - a; });
  var common = pcts.slice().sort(function (a, b) { return splitGroups[b].length - splitGroups[a].length; })[0];
  var splitText = pcts.filter(function (n) { return n !== common; }).map(function (n) { return n + '% on ' + joinList(splitGroups[n].map(esc)); });
  var mostAnswer = 'By the totals the firms publish themselves, <strong>' + esc(top.name) + '</strong> has paid out the most: ' + esc(top.payoutTotal) + '. ' +
    (rest.length ? 'Next come ' + joinList(rest) + '. ' : '') +
    (unconf.length ? joinList(unconf.map(function (f) { return esc(f.name); })) + ' report' + (unconf.length === 1 ? 's ' : ' ') + joinList(unconf.map(function (f) { return esc(f.payoutTotal); })) + ', which we haven\'t re-checked yet. ' : '') +
    (review.length ? joinList(review.map(function (f) { return esc(f.name); })) + '\'s total is under review. ' : '');
  var splitAnswer = 'Per payout, the split decides how much of each withdrawal you keep. ' + splitGroups[common].length + ' of the ' + PLAN_COUNT + ' plans we track pay the trader ' + common + '%; the exceptions are ' + joinList(splitText) + '.';
  html = injectInner(html, 'payoutsMost', '<p>' + mostAnswer + '</p><p>' + splitAnswer + '</p>');

  // --- FAQ + JSON-LD ---
  var dailyNames = daily.map(function (d) { return esc(shortName(d.f) + ' ' + planLabel(d.f, d.p, 'payout')); });
  var faqs = [
    { q: 'Which prop firm pays out the most?', a: mostAnswer.trim() + ' A big total mostly reflects a firm\'s size and age, so read it next to the payout rules, not instead of them.' },
    { q: 'Can you trust prop firm payout claims?', a: 'Treat them as the firm\'s own claim. The totals marked firm-published are each firm\'s own figure, recorded with the date we read it on its site; we can\'t audit them. Payout counts, averages, largest payouts and median times are PropChamps estimates, because firms don\'t publish those numbers. <a href="/methodology#estimates">How we label every number</a> is on our methodology page, and <a href="/blog/are-futures-prop-firms-worth-it">are futures prop firms legit</a> covers the bigger question.' },
    { q: 'How often can you request a payout from a futures prop firm?', a: 'It depends on the plan more than the firm. ' + daily.length + ' of the ' + PLAN_COUNT + ' plans we track allow daily requests: ' + joinList(dailyNames) + '. Others run on a cycle, from every 3 days (FundedNext Rapid Pro) and every 5 trading days (Apex) to up to 4 times a month (Alpha) and every 14 calendar days (MFF Pro). The cadence column above lists every plan.' }
  ];
  html = injectInner(html, 'payoutsFaq', faqHtml(faqs));
  var desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  html = setLd(html, 'ldPayouts', { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': SITE + '/payouts#webpage', 'name': decode((html.match(/<title>([^<]*)<\/title>/) || [])[1] || ''), 'url': SITE + '/payouts', 'description': decode(desc), 'dateModified': DATA_DATE, 'isPartOf': { '@type': 'WebSite', 'name': 'PropChamps', 'url': SITE + '/' } },
    { '@type': 'Dataset', 'name': 'Futures prop firm payout tracker', 'description': 'Firm-published payout totals, payout cadence by plan and payout split for ' + LIVE.length + ' futures prop firms, plus PropChamps estimates (clearly labelled) of payout counts, averages, largest payouts and median time to payout.', 'url': SITE + '/payouts', 'dateModified': DATA_DATE, 'creator': { '@type': 'Organization', 'name': 'PropChamps', 'url': SITE }, 'isAccessibleForFree': true, 'measurementTechnique': 'Totals are each firm\'s own published figure, dated when re-read on its site (one total is marked not re-checked, one is withheld while under review); cadence and split come from each firm\'s help center; counts, averages, largest payouts and median times are PropChamps estimates.' },
    crumbs('Payouts', '/payouts'),
    faqLd(SITE + '/payouts#faq', faqs)
  ] });

  var links = onDisk([
    ['/blog/how-prop-firm-payouts-work', 'How prop firm payouts work', 'Splits, minimum days, caps and the request process, firm by firm.'],
    ['/best/best-prop-firms-fast-payouts', 'Fastest-payout futures prop firms', 'Daily-payout plans ranked by first payout, caps and minimums.'],
    ['/blog/do-prop-firms-actually-pay', 'Do prop firms actually pay?', 'Why payouts get denied, and how to avoid it.'],
    ['/blog/prop-firm-payout-caps', 'Payout caps at every firm', 'The most you can withdraw per request, plan by plan.']
  ]).concat(firms.map(function (f) { var l = payoutRulesLink(f); return /payout-rules/.test(l.url) ? [l.url, l.label, 'Caps, minimums and timing for every ' + shortName(f) + ' plan.'] : null; }).filter(Boolean));
  html = injectInner(html, 'payoutsLinks', links.map(function (l) { return '<a class="pl-card" href="' + l[0] + '"><b>' + esc(l[1]) + '</b><span>' + esc(l[2]) + '</span><i aria-hidden="true">→</i></a>'; }).join(''));
  return writeChanged(file, before, html, 'payouts.html (' + firms.length + ' rows)');
}

// ============================ /audit-log ============================
// entryHtml/entryId/dateParts/relTime/catLabel must stay byte-identical to the page JS.
function slugify(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function entryId(e) { return 'chg-' + e.date + '-' + e.firm + '-' + slugify(e.headline).slice(0, 32).replace(/-+$/, ''); }
function relTime(isoS) { var d = new Date(isoS); var diff = (Date.now() - d.getTime()) / 86400000; if (diff < 1) return 'Today'; if (diff < 2) return 'Yesterday'; if (diff < 7) return Math.floor(diff) + 'd ago'; if (diff < 30) return Math.floor(diff / 7) + 'w ago'; if (diff < 365) return Math.floor(diff / 30) + 'mo ago'; return Math.floor(diff / 365) + 'y ago'; }
function dateParts(isoS) { var d = new Date(isoS + 'T12:00:00'); return { day: String(d.getDate()).padStart(2, '0'), month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(), year: d.getFullYear() }; }
function fmtShort(isoS) { return new Date(isoS + 'T12:00:00').toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function catLabel(c) { return { rule: 'Rule change', payout: 'Payout', promo: 'Promo', feature: 'New feature', platform: 'Platform', 'account-size': 'Account size' }[c] || c; }
function entryHtml(e) {
  var dp = dateParts(e.date);
  var wasCell = e.was ? '<div class="al-diff-cell was"><div class="al-diff-label">Was</div><div class="al-diff-text">' + e.was + '</div></div>' : '';
  var isCell = '<div class="al-diff-cell is"><div class="al-diff-label">' + (e.superseded ? 'Logged as' : 'Now') + '</div><div class="al-diff-text">' + e.is + '</div></div>';
  var diffBlock = e.was ? '<div class="al-diff">' + wasCell + isCell + '</div>' : '<div class="al-diff" style="grid-template-columns:1fr">' + isCell + '</div>';
  var note = e.note ? '<p class="al-note">' + e.note + '</p>' : '';
  var sup = e.superseded ? '<div class="al-superseded"><span class="al-sup-label">Superseded ' + fmtShort(e.superseded.date) + ' →</span> ' + e.superseded.note + '</div>' : '';
  var tags = '<span class="al-tag" data-cat="' + e.category + '">' + catLabel(e.category) + '</span>' + (e.correction ? '<span class="al-tag al-tag-fix">Our correction</span>' : '') + (e.superseded ? '<span class="al-tag al-tag-old">Superseded</span>' : '');
  var actions = '<div class="al-actions">' + (e.firmPage ? '<a href="/firms/' + e.firmPage + '">Read review →</a>' : '') + (e.source ? '<a href="' + (e.source.startsWith('http') ? e.source : 'https://' + e.source) + '" target="_blank" rel="noopener">Source ↗</a>' : '') + '</div>';
  return '<article class="al-entry' + (e.superseded ? ' is-superseded' : '') + '" id="' + entryId(e) + '" data-cat="' + e.category + '">' +
    '<div class="al-entry-aside"><div class="al-date"><span class="al-date-day">' + dp.day + '</span><span class="al-date-month">' + dp.month + ' ' + dp.year + '</span><span class="al-date-rel">' + relTime(e.date) + '</span></div>' +
    '<div class="al-firm"><div class="al-firm-logo"><img src="' + e.logo + '" alt=""></div><span class="al-firm-name">' + e.firmName + '</span></div></div>' +
    '<div class="al-entry-body"><div class="al-tags">' + tags + '</div>' +
    '<h3 class="al-headline">' + e.headline + '</h3>' + diffBlock + note + sup + actions + '</div></article>';
}
function buildAuditLog() {
  var file = path.join(ROOT, 'audit-log.html'); var before = read('audit-log.html'); var html = before;
  if (!CHANGELOG.length) return writeChanged(file, before, html, 'audit-log.html (no changelog)');
  var data = CHANGELOG.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
  var firmsUnique = {}; data.forEach(function (e) { firmsUnique[e.firm] = e.firmName; });
  var firmsList = Object.keys(firmsUnique);
  html = injectInner(html, 'entries', data.map(entryHtml).join(''));
  html = injectInner(html, 'statTotal', String(data.length));
  html = injectInner(html, 'statFirms', String(firmsList.length));
  html = injectInner(html, 'statLast', esc(relTime(data[0].date)));
  html = injectInner(html, 'statSuperseded', String(data.filter(function (e) { return e.superseded; }).length));
  html = injectInner(html, 'resultsCount', String(data.length));
  // "Latest changes": every entry logged on the newest date
  var newest = data[0].date;
  var latest = data.filter(function (e) { return e.date === newest; });
  html = injectInner(html, 'latestChanges',
    '<h2 class="al-latest-h">Latest changes <span>· <time datetime="' + newest + '">' + fmtDate(newest) + '</time></span></h2>' +
    '<p class="al-latest-sub">' + latest.length + ' change' + (latest.length === 1 ? '' : 's') + ' logged on our most recent pass' + (latest.some(function (e) { return e.correction; }) ? ', including corrections to our own data' : '') + '. Older entries that this pass contradicted are marked superseded below.</p>' +
    '<ul class="al-latest-list">' + latest.map(function (e) {
      return '<li><a href="#' + entryId(e) + '"><img src="' + e.logo + '" alt="" width="28" height="28" loading="lazy"><span class="al-latest-firm">' + e.firmName + '</span><span class="al-latest-text">' + e.headline + '</span><i aria-hidden="true">→</i></a></li>';
    }).join('') + '</ul>');
  return writeChanged(file, before, html, 'audit-log.html (' + data.length + ' entries, ' + latest.length + ' latest)');
}

// ============================ /compare ============================
// Static chart columns. Sizes sit under the plan name and the drawdown type under the
// max drawdown, so all 27 plans fit one readable table.
var CHART_COLS = [['Profit Target', 'Profit target'], ['Max Drawdown', 'Max drawdown', 'Drawdown Type'], ['Daily Loss Limit', 'Daily loss limit'], ['Consistency Rule', 'Consistency'], ['Payout Split', 'Split'], ['Payout Frequency', 'Payouts'], ['Activation Fee', 'Activation / price']];
// "90% Trader 10% Tradeify" -> "90%"; "100% — no split (…)" -> "100% (no split)"; multi-stage splits stay as written
function cleanSplit(raw) {
  var p = splitPcts(raw);
  if (p.length !== 1) return raw;
  if (/no split/i.test(raw)) return p[0] + '% (no split)';
  if (/from day 1/i.test(raw)) return p[0] + '% from day 1';
  return p[0] + '%';
}
function chartCell(p, c, f) {
  var v = rule(p, c[0]) || '—';
  if (c[0] === 'Payout Split') v = cleanSplit(v);
  var sub = c[2] ? rule(p, c[2]) : '';
  // Lucid's stored prices are what CHAMP produced at checkout, not list prices
  if (c[0] === 'Activation Fee' && f && f.slug === 'lucid-trading' && /\$\d/.test(v)) sub = 'With CHAMP (Oct 5 check)';
  return '<td data-label="' + c[1] + '">' + esc(v) + (sub ? '<span class="cc-sub-val">' + esc(sub) + '</span>' : '') + '</td>';
}
function buildCompare() {
  var file = path.join(ROOT, 'compare.html'); var before = read('compare.html'); var html = before;
  var totalPlans = 0;
  var groups = LIVE.map(function (f) {
    var plans = (f.plansSummary || []);
    totalPlans += plans.length;
    var n = plans.length;
    var firmPage = FIRM_PAGE[f.slug] || '';
    var promoLine = '';
    if (f.offerLine) {
      promoLine = '<div class="fg-promo-row"><div><div class="fg-promo-label">Active deal</div><div class="fg-promo-value">' + f.offerLine + '</div></div>' +
        '<span class="fg-promo-code js-copy-champ">CHAMP · COPY</span></div>';
    }
    var planChips = plans.map(function (p, i) {
      var key = f.slug + '__' + i;
      var sizes = (p.rules && p.rules['Account Sizes']) || '';
      var feat = p.featured ? ' featured' : '';
      return '<button type="button" class="plan-chip' + feat + '" data-key="' + key + '">' +
        '<span class="plan-chip-name">' + p.name + '</span>' +
        (sizes ? '<span class="plan-chip-meta">' + sizes + '</span>' : '') + '</button>';
    }).join('');
    return '<article class="firm-group" data-firm="' + f.slug + '">' +
      '<div class="fg-head"><div class="fg-firm"><div class="fg-logo"><img src="' + f.logo + '" alt=""></div>' +
      '<div><div class="fg-name">' + f.name + '</div><div class="fg-sub">' + (f.type || f.tagline || '') + '</div></div></div>' +
      '<div class="fg-count"><strong>' + n + '</strong> ' + (n === 1 ? 'plan' : 'plans') + '</div></div>' +
      promoLine +
      '<div class="fg-plans-label">Choose plan(s) to compare</div>' +
      '<div class="fg-plans">' + planChips + '</div>' +
      '<div class="fg-actions"><button type="button" class="fg-bulk" data-firm="' + f.slug + '"><span>' + (n === 1 ? 'Compare this plan' : 'Compare all ' + n + ' plans') + '</span></button>' +
      '<a class="fg-review" href="/firms/' + firmPage + '">Read review</a></div></article>';
  }).join('');
  html = injectInner(html, 'firmsGrouped', groups);
  html = injectInner(html, 'visibleFirms', String(LIVE.length));
  html = injectInner(html, 'visiblePlans', String(totalPlans));

  // Static, crawlable chart: every plan's core rules, grouped by firm
  var chart = '<div class="cc-wrap" role="region" aria-label="Futures prop firm comparison chart" tabindex="0"><table class="cc-table">' +
    '<thead><tr><th scope="col" class="cc-plan-col">Plan</th>' + CHART_COLS.map(function (c) { return '<th scope="col">' + c[1] + '</th>'; }).join('') + '</tr></thead>' +
    LIVE.map(function (f) {
      var plans = f.plansSummary || [];
      return '<tbody class="cc-group"><tr class="cc-firm"><th colspan="' + (CHART_COLS.length + 1) + '" scope="colgroup">' +
        '<a href="' + firmUrl(f.slug) + '"><img src="' + smLogo(f) + '" alt="" width="26" height="26" loading="lazy">' + esc(f.name) + '</a>' +
        '<span class="cc-firm-meta">' + plans.length + ' plan' + (plans.length === 1 ? '' : 's') + ' · ' + esc(discountPct(f) ? discountLabel(f) + ' with CHAMP' : 'code CHAMP at checkout') + '</span></th></tr>' +
        plans.map(function (p) {
          return '<tr><th scope="row" class="cc-plan">' + esc(planLabel(f, p)) + '<span class="cc-sizes">' + esc(rule(p, 'Account Sizes')) + '</span></th>' + CHART_COLS.map(function (c) { return chartCell(p, c, f); }).join('') + '</tr>';
        }).join('') + '</tbody>';
    }).join('') + '</table></div>';
  html = injectInner(html, 'compareChart', chart);
  html = injectInner(html, 'compareChartMeta', totalPlans + ' plans from ' + LIVE.length + ' firms · data as of <time datetime="' + DATA_DATE + '">' + fmtDate(DATA_DATE) + '</time>');
  html = injectInner(html, 'compareH1', 'Futures prop firm comparison: <span class="accent-word">' + LIVE.length + ' firms, ' + totalPlans + ' plans.</span>');

  // Head-to-heads on disk + the hub when it exists
  var vs = vsPages();
  html = injectInner(html, 'compareVs', '<div class="vs-promo-grid">' + vs.map(function (v) {
    return '<a class="vs-promo-card" href="' + v.url + '"><span class="vs-logos"><img src="' + smLogo(v.a) + '" alt="" width="26" height="26" loading="lazy"><img src="' + smLogo(v.b) + '" alt="" width="26" height="26" loading="lazy"></span><span class="vs-label">' + esc(v.label) + '</span><span class="arr">&rarr;</span></a>';
  }).join('') + '</div>' + (exists('/vs/') ? '<a class="vs-hub-link" href="/vs/">Every head-to-head comparison <span aria-hidden="true">→</span></a>' : ''));

  var ex = function (u) { return exists(u); };
  var faqs = [
    { q: 'Which futures prop firm is best overall?', a: 'No single firm is best for every trader, because the rules that matter most pull in different directions: drawdown type, daily loss limit, consistency rule and payout cadence. Our <a href="/firms/">ranked list of all ' + LIVE.length + ' futures prop firms</a> orders them by our published criteria, and the chart above shows every plan\'s rules side by side.' },
    { q: 'Which futures prop firm is cheapest?', a: 'It depends on the account size and the discount. Two examples from our data: Top One Futures\' Elite Access evaluation is $39 one-time at every size (you then pay a $139 to $359 activation fee after passing), and Apex\'s 25K Intraday Trail evaluation lists at $167 before CHAMP\'s 90%-off discount on file. ' + (ex('/best/cheapest-prop-firm-challenges') ? 'Our <a href="/best/cheapest-prop-firm-challenges">cheapest prop firm challenges</a> list works out the cost per size.' : 'The deals page lists every discount.') },
    { q: 'Where does this comparison data come from?', a: 'From each firm\'s own help center and website, read in dated passes; the latest was ' + fmtDate(DATA_DATE) + '. Prices are list prices (Lucid\'s are with-CHAMP prices from our Oct 5 check), and code CHAMP applies its discount at checkout. Where a firm blocked our check, we say so and use search-index excerpts of its help center. <a href="/methodology">How we audit</a> explains the labels, and the <a href="/audit-log">audit log</a> shows what changed.' }
  ];
  html = injectInner(html, 'compareFaq', faqHtml(faqs));

  var title = 'Futures Prop Firm Comparison: ' + LIVE.length + ' Firms, ' + totalPlans + ' Plans Compared';
  html = setHead(html, { title: title });
  var desc = decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  html = setLd(html, 'ldCompare', { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': SITE + '/compare#webpage', 'name': title, 'url': SITE + '/compare', 'description': desc, 'dateModified': DATA_DATE, 'isPartOf': { '@type': 'WebSite', 'name': 'PropChamps', 'url': SITE + '/' } },
    crumbs('Compare', '/compare'),
    faqLd(SITE + '/compare#faq', faqs)
  ] });
  return writeChanged(file, before, html, 'compare.html (' + LIVE.length + ' firms, ' + totalPlans + ' plans, ' + vs.length + ' head-to-heads)');
}

// ============================ /guide ============================
// "Deep dive →" links to the page that owns each topic (only pages on disk).
var DEEP_DIVES = {
  'dd-basics': [['/blog/are-futures-prop-firms-worth-it', 'Are futures prop firms legit and worth it?'], ['/blog/how-do-prop-firms-make-money', 'How do prop firms make money?']],
  'dd-how': [['/blog/how-to-pass-a-prop-firm-evaluation', 'How to pass a futures prop firm evaluation']],
  'dd-paths': [['/best/best-instant-funding-futures-prop-firms', 'Best instant funding futures prop firms'], ['/blog/instant-funding-vs-evaluation-prop-firms', 'Instant funding vs evaluation, explained']],
  'dd-rule-drawdown': [['/blog/prop-firm-drawdown-explained', 'Trailing drawdown explained'], ['/tools/prop-firm-drawdown-calculator', 'Drawdown calculator']],
  'dd-rule-dll': [['/blog/what-is-a-daily-loss-limit', 'What is a daily loss limit?'], ['/best/best-prop-firms-no-daily-loss-limit', 'Firms with no daily loss limit']],
  'dd-rule-target': [['/blog/how-to-pass-a-prop-firm-evaluation', 'How to hit the profit target']],
  'dd-rule-consistency': [['/blog/prop-firm-consistency-rules', 'Consistency rules at every firm'], ['/tools/prop-firm-consistency-calculator', 'Consistency calculator'], ['/best/best-prop-firms-no-consistency-rule', 'Firms with no consistency rule']],
  'dd-rule-days': [['/best/best-prop-firms-fast-payouts', 'Fastest-payout futures prop firms']],
  'dd-rule-news': [['/blog/prop-firm-news-trading-rules', 'News trading rules by firm']],
  'dd-payouts': [['/blog/how-prop-firm-payouts-work', 'How prop firm payouts work'], ['/blog/prop-firm-payout-caps', 'Payout caps at every firm']],
  'dd-costs': [['/blog/how-much-do-prop-firm-challenges-cost', 'How much a prop firm challenge costs'], ['/best/cheapest-prop-firm-challenges', 'Cheapest prop firm challenges']],
  'dd-choosing': [['/best/best-prop-firm-for-beginners', 'Best futures prop firm for beginners']],
  'dd-mistakes': [['/blog/what-happens-when-you-break-a-prop-firm-rule', 'What happens when you break a prop firm rule']]
};
function deepDive(list) {
  var l = onDisk(list);
  if (!l.length) return '';
  return '<span class="dd-label">Deep dive</span>' + l.map(function (x) { return '<a href="' + x[0] + '">' + esc(x[1]) + ' <span aria-hidden="true">→</span></a>'; }).join('');
}
function buildGuide() {
  var file = path.join(ROOT, 'guide.html'); var before = read('guide.html'); var html = before;
  Object.keys(DEEP_DIVES).forEach(function (id) { html = injectInner(html, id, deepDive(DEEP_DIVES[id])); });
  return writeChanged(file, before, html, 'guide.html (deep-dive links)');
}

// ============================ /methodology ============================
function buildMethodology() {
  var file = path.join(ROOT, 'methodology.html'); var before = read('methodology.html'); var html = before;
  html = injectInner(html, 'methodFirms', String(LIVE.length));
  html = injectInner(html, 'methodPlans', String(PLAN_COUNT));
  html = injectInner(html, 'methodFirms2', String(LIVE.length));
  html = injectInner(html, 'methodPlans2', String(PLAN_COUNT));
  html = injectInner(html, 'methodChecked', fmtDate(DATA_DATE).replace(/, \d{4}$/, ''));
  var firms = LIVE.slice().sort(function (a, b) { return parseAmount(b.payoutTotal) - parseAmount(a.payoutTotal); });
  html = injectInner(html, 'methodTotals', firms.map(function (f) {
    var st = totalStatus(f.slug), val, lab;
    if (st.kind === 'review') { val = '<span class="mt-muted">Not shown</span>'; lab = '<span class="mt-badge warn">Under review</span> The figure on file doesn\'t match what the firm advertises, and its site blocked our latest check.'; }
    else if (st.kind === 'unconfirmed') { val = esc(f.payoutTotal); lab = '<span class="mt-badge warn">Reported</span> Not re-read on the firm\'s site since we added it.'; }
    else { val = esc(f.payoutTotal); lab = '<span class="mt-badge">Firm-published</span> Read on the firm\'s site, ' + fmtDate(st.checked) + '.' + (st.allPrograms ? ' Covers all of the firm\'s programs, not futures only.' : ''); }
    return '<tr><th scope="row"><img src="' + smLogo(f) + '" alt="" width="22" height="22" loading="lazy">' + esc(f.name) + '</th><td class="mt-val">' + val + '</td><td>' + lab + '</td></tr>';
  }).join(''));
  return writeChanged(file, before, html, 'methodology.html (totals table)');
}

// ============================ / (homepage) ============================
function buildHome() {
  var file = path.join(ROOT, 'index.html'); var before = read('index.html'); var html = before;
  html = injectInner(html, 'hpPlans', String(PLAN_COUNT));
  var vs = vsPages();
  html = injectInner(html, 'hpVs', vs.map(function (v) { return '<a href="' + v.url + '">' + esc(v.label) + '</a>'; }).join('') + (exists('/vs/') ? '<a class="hp-vs-all" href="/vs/">All comparisons →</a>' : ''));

  // "Go deeper" columns — every link is a page on disk
  var rulesCol = onDisk([
    ['/blog/how-prop-firm-payouts-work', 'How prop firm payouts work'],
    ['/blog/what-is-a-daily-loss-limit', 'What is a daily loss limit?'],
    ['/blog/prop-firm-consistency-rules', 'Consistency rules, firm by firm'],
    ['/blog/prop-firm-news-trading-rules', 'News trading rules by firm'],
    ['/blog/how-much-do-prop-firm-challenges-cost', 'What a challenge really costs']
  ]);
  var bestCol = listPages('best', /\.html$/).map(function (p) { return [p.url, p.title]; });
  if (exists('/best/')) bestCol.push(['/best/', 'All best-of lists']);
  var toolsCol = listPages('tools', /\.html$/).map(function (p) { return [p.url, p.title]; });
  if (exists('/tools/')) toolsCol.push(['/tools/', 'All tools']);
  var subs = firmSubpages().map(function (s) { return [s.url, s.title]; });
  var cols = [
    ['Rules explained', rulesCol, '/blog/', 'All guides'],
    ['Best-of lists', bestCol, '', ''],
    ['Firm deep dives', subs, '', ''],
    ['Free tools', toolsCol, '', '']
  ].filter(function (c) { return c[1].length; });
  html = injectInner(html, 'hpExplore', cols.map(function (c) {
    return '<div class="hp-ex-col"><h3>' + c[0] + '</h3><ul>' + c[1].map(function (l) { return '<li><a href="' + l[0] + '">' + esc(l[1]) + '</a></li>'; }).join('') +
      (c[2] ? '<li><a class="hp-ex-all" href="' + c[2] + '">' + c[3] + ' →</a></li>' : '') + '</ul></div>';
  }).join(''));
  return writeChanged(file, before, html, 'index.html (' + vs.length + ' head-to-heads, ' + cols.length + ' link columns)');
}

var n = 0;
n += buildDeals();
n += buildPayouts();
n += buildAuditLog();
n += buildCompare();
n += buildGuide();
n += buildMethodology();
n += buildHome();
console.log('\nDone. ' + n + ' page(s) built · data as of ' + DATA_DATE + ' · ' + LIVE.length + ' firms / ' + PLAN_COUNT + ' plans.');
