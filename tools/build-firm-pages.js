#!/usr/bin/env node
/**
 * build-firm-pages.js — Pre-render the 8 firm review pages and the /firms/ hub
 * from data/firms.js.
 *
 * WHY THIS EXISTS
 *   Firm pages used to be 100% client-side rendered: the HTML shipped with
 *   empty containers that an inline <script> filled from window.FIRMS. If
 *   Googlebot can't run that JS (or is slow to), it sees an empty shell and
 *   files the page as a SOFT 404. This script bakes every firm's content into
 *   the static HTML so the page is full of real text on first byte. The inline
 *   JS still runs on top (copy code, plan cards), but it no longer rewrites the
 *   <title>, the H1 or the tagline.
 *
 * WHAT IT GENERATES (all between <!--g:id--> … <!--/g:id--> markers)
 *   Firm pages (firms/<slug>.html):
 *     seoHead      <title>, meta description, canonical, og:*, twitter:*, JSON-LD
 *                  (FinancialService + ONE editorial Review, BreadcrumbList, FAQPage).
 *                  No aggregateRating: review counts are not shown on the page.
 *     fxStyle      CSS for the generated blocks (CSS variables only, no colours).
 *     firmH1       the H1 (one per page) · byline (rating, last reviewed, method link)
 *     lastReviewed hero "Last reviewed" value (f.lastAudited, else REVIEWED below)
 *     jumpNav      "On this page" links
 *     chooser      plan chooser table (generated from plansSummary/plansDetailed)
 *     deep         payout rules (at a glance, or the full #payout-rules section on
 *                  firms without a payout-rules subpage), firm-specific rule sections,
 *                  #promo-code
 *     faqRelated   visible FAQ (== FAQPage JSON-LD), "Compare <Firm>" (every
 *                  vs/*.html ON DISK that contains the firm) and "Guides for <Firm>
 *                  traders" (blog/best/tools pages ON DISK + firms/<slug>/* subpages)
 *     …plus the original blocks: bcCurrent, firmTagline, firmCode, firmOffer,
 *     firmSummary, ctaTitle, summaryGrid, plansGrid, bestForList, watchList,
 *     relatedGrid, rulesH2.
 *   /firms/ hub (firms/index.html): idxHead, idxStyle, idxHero, idxBestFor,
 *     firmsRows (static ranking table), idxTopPick, idxValues, idxChanges. The editorial
 *     ranking order is read from RANK_ORDER in the page's own inline JS.
 *
 * LINK RULE
 *   Every internal link to a page that may not exist yet (subpages, new /best/
 *   lists, calculators, hubs) goes through exists(): the file must be on disk,
 *   not a redirect source in _redirects and not noindex. Pages ship in waves, so
 *   RE-RUN THIS SCRIPT AFTER EVERY WAVE of new pages, then run pc-build.
 *
 * USAGE
 *   node tools/build-firm-pages.js        # after any firms.js change or new page
 *   then: node tools/pc-build.mjs         # injects the shared chrome (idempotent)
 *
 * It is IDEMPOTENT: first run inserts the markers, later runs only refresh the
 * content between them. It never touches the <!-- pc:chrome/pc:footer/pc:head -->
 * regions (owned by tools/pc-build.mjs). The build fails (exit 1) if a title is
 * over 60 chars, a meta over 155, a JSON-LD block does not parse or a page does
 * not have exactly one <h1>.
 *
 * data/firms.js stays the single source of truth for plan data. Editorial prose
 * below cites the Oct 23, 2026 help-center check (see the firms.js header).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const FIRMS_JS = path.join(ROOT, 'data', 'firms.js');
const FIRMS_DIR = path.join(ROOT, 'firms');
const SITE = 'https://propchamps.net';
const YEAR = '2026';                          // one constant: titles roll forward from here

// --- load firms.js in a sandbox that only provides `window` ---
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(FIRMS_JS, 'utf8'), sandbox);
const FIRMS = sandbox.window.FIRMS;
const FIRM_ORDER = sandbox.window.FIRM_ORDER || Object.keys(FIRMS || {});
if (!FIRMS) { console.error('Could not load window.FIRMS from data/firms.js'); process.exit(1); }

// slug -> html filename (note: the "take-profit" slug lives in take-profit-trader.html)
const FILE_FOR = {
  'tradeify': 'tradeify.html',
  'lucid-trading': 'lucid-trading.html',
  'alpha-futures': 'alpha-futures.html',
  'apex-trader': 'apex-trader.html',
  'take-profit': 'take-profit-trader.html',
  'top-one-futures': 'top-one-futures.html',
  'my-funded-futures': 'my-funded-futures.html',
  'fundednext': 'fundednext.html'
};
// slug -> page base name / clean URL path (no .html)
const BASE_FOR = {};
const PATH_FOR = {};
Object.keys(FILE_FOR).forEach(function (s) {
  BASE_FOR[s] = FILE_FOR[s].replace(/\.html$/, '');
  PATH_FOR[s] = '/firms/' + BASE_FOR[s];
});
Object.keys(FIRMS).forEach(function (s) { if (!FILE_FOR[s]) console.warn('  ! no firm page mapped for slug "' + s + '" — add it to FILE_FOR'); });
// slug used in /vs/ filenames
const VS_SLUG = { 'apex-trader': 'apex-trader-funding', 'take-profit': 'take-profit-trader' };
function vsSlug(s) { return VS_SLUG[s] || s; }
// short names for metas and tight UI
const SHORT = {
  'lucid-trading': 'Lucid', 'fundednext': 'FundedNext', 'apex-trader': 'Apex', 'tradeify': 'Tradeify',
  'alpha-futures': 'Alpha', 'my-funded-futures': 'MFF', 'top-one-futures': 'Top One', 'take-profit': 'Take Profit Trader'
};
// tokens that mark a blog/best/tools slug as being about one firm
const FIRM_KEYS = {
  'apex-trader': ['apex'], 'lucid-trading': ['lucid'], 'tradeify': ['tradeify'], 'alpha-futures': ['alpha'],
  'take-profit': ['take-profit', 'tpt'], 'top-one-futures': ['top-one'], 'my-funded-futures': ['my-funded-futures', 'mff', 'mffu'],
  'fundednext': ['fundednext']
};

// Review dates. f.lastAudited (firms.js) wins when present. Oct 23, 2026 = the
// help-center verification; Apex blocked that fetch, so its last full audit is Oct 5.
const REVIEWED = { 'default': '2026-10-23', 'apex-trader': '2026-10-05' };
// First publication (git history of firms/<page>.html)
const PUBLISHED = { 'default': '2026-05-28', 'fundednext': '2026-08-17' };
function reviewedISO(slug, f) { return f.lastAudited || REVIEWED[slug] || REVIEWED['default']; }
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function longDate(iso) { var p = iso.split('-'); return MONTHS[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0]; }
function shortDate(iso) { var p = iso.split('-'); return MONTHS[+p[1] - 1].slice(0, 3) + ' ' + (+p[2]) + ', ' + p[0]; }

// ---------------------------------------------------------------------------
// Disk-aware links: a page is linked only when it exists, is not a redirect
// source and is not noindex.
// ---------------------------------------------------------------------------
const REDIRECT_SOURCES = new Set();
(function () {
  var f = path.join(ROOT, '_redirects');
  if (!fs.existsSync(f)) return;
  fs.readFileSync(f, 'utf8').split('\n').forEach(function (line) {
    line = line.trim();
    if (!line || line[0] === '#') return;
    var src = line.split(/\s+/)[0];
    REDIRECT_SOURCES.add(src.replace(/\/$/, '') || '/');
  });
})();
function fileForUrl(u) {
  var clean = u.split('#')[0].split('?')[0];
  if (clean === '/') return 'index.html';
  var rel = clean.replace(/^\//, '');
  var cands = /\/$/.test(rel) ? [rel + 'index.html'] : [rel + '.html', rel + '/index.html'];
  for (var i = 0; i < cands.length; i++) if (fs.existsSync(path.join(ROOT, cands[i]))) return cands[i];
  return null;
}
// Pages the SEO plan merges into another URL (301 pending in _redirects). Never link
// them, so the review pages don't depend on the redirect landing first.
//   /blog/fastest-payout-prop-firms -> /best/best-prop-firms-fast-payouts
const MERGED = new Set(['/blog/fastest-payout-prop-firms']);
const _existsCache = {};
function exists(u) {
  if (u in _existsCache) return _existsCache[u];
  var rel = fileForUrl(u), ok = false;
  if (MERGED.has(u.split('#')[0].replace(/\/$/, ''))) rel = null;
  if (rel) {
    var key = u.split('#')[0].replace(/\/$/, '') || '/';
    if (!REDIRECT_SOURCES.has(key) && !REDIRECT_SOURCES.has(key + '.html')) {
      var head = fs.readFileSync(path.join(ROOT, rel), 'utf8').slice(0, 6000);
      ok = !/<meta name="robots" content="[^"]*noindex/i.test(head);
    }
  }
  _existsCache[u] = ok;
  return ok;
}
function L(u, text) { return exists(u) ? '<a href="' + u + '">' + text + '</a>' : text; }   // link or plain text
function IF(u, html) { return exists(u) ? html : ''; }                                          // whole fragment only if the page exists
function decode(s) {
  return String(s).replace(/&nbsp;/g, ' ').replace(/&rsquo;|&#8217;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&middot;/g, '·').replace(/&rarr;/g, '→')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
function plain(html) { return decode(String(html).replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim(); }
function readH1(rel) {
  try {
    var m = fs.readFileSync(path.join(ROOT, rel), 'utf8').match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    return m ? plain(m[1]).replace(/\.$/, '') : '';
  } catch (e) { return ''; }
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escAttr(s) { return esc(s).replace(/"/g, '&quot;'); }
function amp(s) { return String(s == null ? '' : s).replace(/&(?![a-z#0-9]+;)/gi, '&amp;'); } // firms.js strings -> HTML text
function money(s) { return String(s || '').match(/\$[\d,]+(?:\.\d+)?K?/g) || []; }
function titleCase(s) {
  return String(s).toLowerCase().replace(/(^|[\s(\/—-])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); })
    .replace(/\bEod\b/g, 'EOD').replace(/\bPro\+/g, 'PRO+');
}
function table(head, rows, opts) {
  opts = opts || {};
  var stack = opts.stack === true || (opts.stack !== false && !opts.cls && head.length <= 4);   // text tables stack into cards on phones
  var h = '<div class="table-wrap' + (stack ? ' fx-stack-wrap' : '') + '"><table class="data' + (opts.cls ? ' ' + opts.cls : '') + (stack ? ' fx-stack' : '') + '">';
  if (opts.caption) h += '<caption class="fx-vh">' + opts.caption + '</caption>';
  h += '<thead><tr>' + head.map(function (c, i) {
    var id = opts.colIds && opts.colIds[i] ? ' id="' + opts.colIds[i] + '"' : '';
    return '<th scope="col"' + id + '>' + c + '</th>';
  }).join('') + '</tr></thead><tbody>';
  h += rows.map(function (r) {
    return '<tr>' + r.map(function (c, i) {
      return i === 0 && opts.rowHeads !== false ? '<th scope="row">' + c + '</th>' : '<td' + (stack ? ' data-label="' + escAttr(plain(head[i])) + '"' : '') + '>' + c + '</td>';
    }).join('') + '</tr>';
  }).join('');
  return h + '</tbody></table></div>';
}
function note(html) { return '<p class="fx-note">' + html + '</p>'; }
function prose(parts) { return '<div class="fx-prose">' + parts.join('') + '</div>'; }
function p(html) { return '<p>' + html + '</p>'; }
function ul(items) { return '<ul>' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; }
function h3(html) { return '<h3 class="fx-h3">' + html + '</h3>'; }
function jsonLd(obj) { return '<script type="application/ld+json">\n' + JSON.stringify(obj).replace(/</g, '\\u003c') + '\n</script>'; }

// --- firms.js accessors (warn loudly instead of printing stale text) ---
var WARN = [];
function S(f, i, key) {
  var pl = (f.plansSummary || [])[i];
  var v = pl && pl.rules && pl.rules[key];
  if (v == null) { WARN.push(f.slug + ': plansSummary[' + i + '] has no "' + key + '"'); return '—'; }
  return v;
}
function DP(f, planRe, labelRe) {
  var pl = (f.plansDetailed || []).filter(function (x) { return planRe.test(x.name); })[0];
  var row = pl && (pl.rules || []).filter(function (r) { return labelRe.test(r[0]); })[0];
  if (!row) { WARN.push(f.slug + ': plansDetailed ' + planRe + ' has no ' + labelRe); return '—'; }
  return row[1];
}
// plan attributes derived from plansSummary (used for guide relevance + /firms/ best-for table)
//   noDll / noCons    : no DLL / no consistency rule at SOME stage of some plan
//   noDllAll / noConsAll : none at ANY stage of some plan
// Plans that exist but are not in plansSummary yet (firms.js note only):
const EXTRA_ATTRS = { 'fundednext': { instant: true } };   // FundedNext Direct ($50K)
function attrs(f) {
  var a = { noDll: false, noDllAll: false, daily: false, instant: false, noCons: false, noConsAll: false };
  (f.plansSummary || []).forEach(function (pl) {
    var r = pl.rules || {};
    var dll = String(r['Daily Loss Limit'] || '').trim(), cons = String(r['Consistency Rule'] || '').trim();
    if (/^(none|removed)/i.test(dll)) a.noDll = true;
    if (/^none$|^none \(eval & qualified\)$|^removed across all sizes$/i.test(dll)) a.noDllAll = true;
    if (/daily/i.test(r['Payout Frequency'] || '')) a.daily = true;
    if (/straight|instant/i.test((r['Profit Target'] || '') + ' ' + (r['Min. Trading Days'] || ''))) a.instant = true;
    if (/none|only/i.test(cons) || /^\d+% funded$/i.test(cons)) a.noCons = true;
    if (/^none$/i.test(cons)) a.noConsAll = true;
  });
  Object.assign(a, EXTRA_ATTRS[f.slug] || {});
  return a;
}

// ---------------------------------------------------------------------------
// Generated link blocks (scan the disk at build time)
// ---------------------------------------------------------------------------
function listHtml(dir) {
  var abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter(function (n) { return /\.html$/.test(n) && n !== 'index.html' && n[0] !== '_'; }).sort();
}
function vsPagesFor(slug) {
  var me = vsSlug(slug), out = [];
  listHtml('vs').forEach(function (file) {
    var name = file.replace(/\.html$/, ''), url = '/vs/' + name;
    FIRM_ORDER.forEach(function (o) {
      if (o === slug || !FIRMS[o] || FIRMS[o].live === false) return;
      var other = vsSlug(o);
      if (name === me + '-vs-' + other || name === other + '-vs-' + me) {
        if (exists(url)) out.push({ url: url, other: o, first: name.indexOf(me + '-vs-') === 0 ? slug : o });
      }
    });
  });
  return out;
}
function subpagesFor(slug) {
  var base = BASE_FOR[slug], dir = path.join(FIRMS_DIR, base), out = [];
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return out;
  var name = FIRMS[slug].name;
  var LABEL = {
    'payout-rules': [name + ' payout rules', 'Payout rules'],
    'promo-code': [name + ' promo code', 'Promo code'],
    'which-account-is-best': ['Which ' + name + ' account is best?', 'Account guide']
  };
  fs.readdirSync(dir).sort().forEach(function (n) {
    var sub = n.replace(/\.html$/, '');
    if (n[0] === '_' || sub === 'index') return;
    var url = '/firms/' + base + '/' + sub;
    if (!exists(url)) return;
    var rel = fileForUrl(url);
    var lab = LABEL[sub] || [readH1(rel) || titleCase(sub.replace(/-/g, ' ')), 'Guide'];
    out.push({ url: url, sub: sub, title: lab[0], kind: lab[1], h1: readH1(rel) });
  });
  var ORDER = ['payout-rules', 'which-account-is-best', 'promo-code'];
  return out.sort(function (a, b) { return (ORDER.indexOf(a.sub) + 1 || 9) - (ORDER.indexOf(b.sub) + 1 || 9); });
}
function sub(slug, name) { return '/firms/' + BASE_FOR[slug] + '/' + name; }
function tokens(name) { return '-' + name + '-'; }
function firmOfSlug(name) {
  var hit = null;
  Object.keys(FIRM_KEYS).forEach(function (s) {
    FIRM_KEYS[s].forEach(function (k) { if (tokens(name).indexOf('-' + k + '-') >= 0) hit = s; });
  });
  return hit;
}
// topic of a guide slug: first match wins (calculator before drawdown etc.)
const TOPICS = [
  ['calculator', /calculator/, 72],
  ['consistency', /consistency/, 90],
  ['drawdown', /drawdown/, 85],
  ['dll', /daily-loss-limit/, 80],
  ['news', /news/, 78],
  ['payout', /payout/, 75],
  ['instant', /instant-funding/, 70],
  ['accounts', /how-many|max-accounts/, 68],
  ['cost', /cost|cheapest/, 60],
  ['pass', /how-to-pass|evaluation/, 55],
  ['beginner', /beginner/, 50],
  ['platforms', /platform/, 45],
  ['legit', /worth-it|actually-pay|legit/, 42],
  ['rules', /rule/, 40]
];
function topicOf(name) { for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i][1].test(name)) return TOPICS[i]; return ['other', /x/, 30]; }
function guidesFor(slug, f) {
  var a = attrs(f), list = [];
  [['blog', 'Guide'], ['best', 'Ranked list'], ['tools', 'Free tool']].forEach(function (d) {
    listHtml(d[0]).forEach(function (file) {
      var name = file.replace(/\.html$/, ''), url = '/' + d[0] + '/' + name;
      if (!exists(url)) return;
      var owner = firmOfSlug(name);
      if (owner && owner !== slug) return;                       // about another firm
      // /best/ lists only where the firm actually has a qualifying plan
      if (d[0] === 'best') {
        if (/no-daily-loss|no-dll/.test(name) && !a.noDll) return;
        if (/fast-payout|daily-payout/.test(name) && !a.daily) return;
        if (/instant/.test(name) && !a.instant) return;
        if (/no-consistency/.test(name) && !a.noCons) return;
      }
      var t = topicOf(name);
      list.push({ url: url, kind: d[1], title: readH1(fileForUrl(url)) || titleCase(name.replace(/-/g, ' ')),
        topic: t[0], score: owner ? 100 : t[2], own: !!owner });
    });
  });
  // a firm-specific guide replaces the generic one on the same topic (Apex drawdown)
  var ownTopics = list.filter(function (g) { return g.own; }).map(function (g) { return g.topic; });
  list = list.filter(function (g) { return g.own || ownTopics.indexOf(g.topic) < 0; });
  list.forEach(function (g) { if (g.kind === 'Free tool') g.score += 10; });
  list.sort(function (x, y) { return y.score - x.score || x.url.localeCompare(y.url); });
  // at most 2 links per topic so one subject can't crowd out the rest
  var perTopic = {}, out = [];
  list.forEach(function (g) {
    var k = g.own ? 'own:' + g.url : g.topic;
    perTopic[k] = (perTopic[k] || 0) + 1;
    if (perTopic[k] <= 2 && out.length < 10) out.push(g);
  });
  return out;
}
function linkCard(url, kind, title, extraCls, img) {
  return '<a class="fx-link' + (extraCls ? ' ' + extraCls : '') + '" href="' + url + '">' +
    (img ? '<img src="' + img + '" alt="" loading="lazy">' : '') +
    '<span><span class="fx-link-kind">' + kind + '</span><span class="fx-link-title">' + amp(title) + '</span></span></a>';
}
function relatedBlock(slug, f) {
  var vs = vsPagesFor(slug), subs = subpagesFor(slug), guides = guidesFor(slug, f), out = '';
  var cmp = vs.map(function (v) {
    var a = v.first === slug ? f : FIRMS[v.other], b = v.first === slug ? FIRMS[v.other] : f;
    return linkCard(v.url, 'Head-to-head', a.name + ' vs ' + b.name, 'fx-vs', FIRMS[v.other].logo);
  });
  if (exists('/vs/')) cmp.push(linkCard('/vs/', 'Every comparison', 'All prop firm head-to-heads'));
  cmp.push(linkCard('/compare', 'All 8 firms', 'Compare every plan side by side'));
  out += '<h3 class="fx-h3" id="compare-' + slug + '">Compare ' + amp(f.name) + '</h3><div class="fx-links">' + cmp.join('') + '</div>';
  var g = subs.map(function (s) { return linkCard(s.url, s.kind, s.title); })
    .concat(guides.map(function (x) { return linkCard(x.url, x.kind, x.title); }));
  if (g.length) out += '<h3 class="fx-h3">Guides for ' + amp(f.name) + (/trader$/i.test(f.name) ? ' accounts' : ' traders') + '</h3><div class="fx-links">' + g.join('') + '</div>';
  return out;
}

// ---------------------------------------------------------------------------
// Shared page links used inside the editorial copy (all exists()-checked)
// ---------------------------------------------------------------------------
const U = {
  news: '/blog/prop-firm-news-trading-rules', cons: '/blog/prop-firm-consistency-rules',
  consCalc: '/tools/prop-firm-consistency-calculator', dd: '/blog/prop-firm-drawdown-explained',
  ddCalc: '/tools/prop-firm-drawdown-calculator', dll: '/blog/what-is-a-daily-loss-limit',
  accounts: '/blog/how-many-prop-firm-accounts-can-you-have', payoutsWork: '/blog/how-prop-firm-payouts-work',
  caps: '/blog/prop-firm-payout-caps', cost: '/blog/how-much-do-prop-firm-challenges-cost',
  apexDd: '/blog/apex-drawdown-explained', instantBest: '/best/best-instant-funding-futures-prop-firms',
  noConsBest: '/best/best-prop-firms-no-consistency-rule', noDllBest: '/best/best-prop-firms-no-daily-loss-limit',
  fastBest: '/best/best-prop-firms-fast-payouts', payouts: '/payouts', audit: '/audit-log',
  method: '/methodology', deals: '/deals', compare: '/compare', worth: '/blog/are-futures-prop-firms-worth-it'
};
function consLinks() {
  return [L(U.cons, 'how consistency rules work'), IF(U.consCalc, ' · <a href="' + U.consCalc + '">consistency calculator</a>')].join('');
}
// FAQ pointers to the pages that own these queries (cannibalisation map): the firm FAQ
// gives the one-line answer, the guide owns the topic.
function accountsLink() { return IF(U.accounts, ' See <a href="' + U.accounts + '">account limits at every firm</a>.'); }
function newsLink() { return exists(U.news) ? ' See our <a href="' + U.news + '">news trading rules</a>.' : ''; }
function codeTips(f) {
  return '<strong>Code not working?</strong> Type CHAMP in capitals with no spaces, start from our link so the referral is attached, ' +
    'and compare the total with any public code on the firm’s own site: use whichever gives the lower checkout price. See ' +
    L(U.deals, 'every active CHAMP deal') + '.';
}

// ---------------------------------------------------------------------------
// EDITORIAL CONTENT per firm. Numbers come from data/firms.js (tables) or the
// Oct 23, 2026 help-center check recorded in the firms.js header (prose).
// Estimates (payout counts/averages/medians) are never stated here.
// ---------------------------------------------------------------------------
const CONTENT = {};

/* ============================== LUCID ============================== */
CONTENT['lucid-trading'] = function (f) {
  var slug = 'lucid-trading';
  return {
    title: 'Lucid Trading Review ' + YEAR + ': Pro, Flex, Daily & Direct Rules',
    meta: 'Is Lucid Trading legit? Pro, Flex, Daily & Direct reviewed: 90/10 split, EOD drawdown on 3 of 4 paths, free eval activation, 20-40% consistency. CHAMP.',
    h1: ['Lucid Trading', 'Review (' + YEAR + ')', ': Pro, Flex, Daily &amp; Direct'],
    source: 'Lucid’s help center',
    chooser: {
      // 'which lucid account is best' belongs to the subpage once it exists
      h2: exists(sub(slug, 'which-account-is-best')) ? 'Lucid Trading plans at a glance' : 'Which Lucid account? Pro vs Flex vs Daily vs Direct',
      intro: 'All four paths pay a 90/10 split with a $500 minimum payout. They differ in the evaluation, the consistency rule and how often you can get paid.' +
        IF(sub(slug, 'which-account-is-best'), ' Full guide: <a href="' + sub(slug, 'which-account-is-best') + '">which Lucid account is best</a>.'),
      plans: [
        { i: 0, id: 'lucid-pro', label: 'Lucid Pro', price: DP(f, /^Lucid Pro/, /^Price/) },
        { i: 1, id: 'lucid-flex', label: 'Lucid Flex', price: DP(f, /^Lucid Flex/, /^Price/) },
        { i: 2, id: 'lucid-daily', label: 'Lucid Daily', price: 'Configurable at checkout' },
        { i: 3, id: 'lucid-direct', label: 'Lucid Direct', price: DP(f, /^Lucid Direct/, /^Price/) + ' one-time' }
      ],
      priceLabel: 'Price with CHAMP*',
      priceNote: '* Prices with CHAMP we saw at checkout on Oct 5, 2026. Lucid’s site blocked our Oct 23 re-check, so confirm the price at checkout.',
      picks: [
        ['lucid-pro', 'Pick Pro if', 'you want a 1-day pass (no consistency rule in the evaluation) and payout caps that rise after your first payout.'],
        ['lucid-flex', 'Pick Flex if', 'you want no consistency rule once funded and a payout after 5 profit days, with no buffer to build first.'],
        ['lucid-daily', 'Pick Daily if', 'you want to request payouts every day with no per-payout cap, and you never trade red-folder news.'],
        ['lucid-direct', 'Pick Direct if', 'you would rather pay once to skip the evaluation and can live with a 20% consistency rule.']
      ]
    },
    sections: [
      {
        id: 'payouts', nav: 'Payout rules', eyebrow: 'Payouts', h2: 'Payout rules at a glance',
        answer: 'Every Lucid path pays 90/10 with a $500 minimum, and none has a fixed payout window: you request as soon as the path’s conditions are met, and Lucid sends approved funds within 2 business days.',
        body: table(['Path', 'When you can request', 'Cap per payout'], [
          ['Pro', 'Profit goal for the cycle ($250 / $500 / $750 / $1,000) met, balance above the buffer (initial max loss + $100) and the 40% consistency rule passed', '$1,000 / $2,000 / $2,500 / $3,000 on the 1st, then $1,500 / $2,500 / $3,000 / $3,500'],
          ['Flex', '5 profit days of $100 / $150 / $200 / $250 in the cycle; no buffer', '50% of profit, up to $1,000 / $2,000 / $2,500 / $3,000'],
          ['Daily', 'Any day, from profit above the buffer ($26,100 / $52,100 / $103,100 / $154,600)', 'No per-payout cap. Reaching the max daily sim profit ($6K / $8K / $10K / $12K) moves you live'],
          ['Direct', 'Profit goal since the last payout ($1,500 / $3,000 / $6,000 / $9,000 first, then $1,250 / $2,500 / $3,500 / $4,500) plus 20% consistency', '$1,000 / $2,000 / $2,500 / $3,000 (payouts 1-3), then $1,000 / $2,500 / $3,000 / $3,500']
        ], { caption: 'Lucid payout rules by path, 25K / 50K / 100K / 150K' }) +
          note('Sizes 25K / 50K / 100K / 150K. With the DLL switched on, funded accounts can request a payout during the session from that session’s profit. After payout 5 on Pro, Flex or Direct you move to Lucid’s live review. ' +
            IF(sub(slug, 'payout-rules'), 'Full detail: <a href="' + sub(slug, 'payout-rules') + '">Lucid Trading payout rules</a>.'))
      },
      {
        id: 'consistency', nav: 'Consistency', eyebrow: 'Consistency', h2: 'Lucid consistency rule',
        answer: 'It depends on the path. Pro has no consistency rule in the evaluation and 40% once funded. Flex and Daily use 40% in the evaluation (50% with a paid add-on) and none once funded. Direct uses 20%.',
        body: prose([
          p('Lucid checks the rule at payout time: your largest day divided by the account’s profit. On Pro it resets after each payout. In our arithmetic, a $800 best day on Pro means you need at least $2,000 of cycle profit before you can request ($800 ÷ 40%), and on Direct a $500 best day needs $2,500 ($500 ÷ 20%).'),
          p('Pro accounts bought or reset before 11/28/2025 keep the older terms: 35% consistency and 100% of the first $10K. Because the rule is checked when you request a payout, going over it delays that payout until more profitable days bring the ratio down (our reading of Lucid’s rule).'),
          p('More: ' + consLinks() + '.')
        ])
      },
      {
        id: 'drawdown', nav: 'Drawdown & DLL', eyebrow: 'Drawdown', h2: 'Drawdown and the LucidScale DLL',
        answer: 'Pro, Flex and Direct use an end-of-day (EOD) drawdown. Daily lets you choose EOD or intraday in the evaluation, but a funded Daily account is always intraday. The daily loss limit is optional on Pro, Flex and Daily and fixed on Direct.',
        body: table(['Path', 'Max drawdown', 'Drawdown type', 'Daily loss limit'], [0, 1, 2, 3].map(function (i) {
          return [titleCase(f.plansSummary[i].name), amp(S(f, i, 'Max Drawdown')), amp(S(f, i, 'Drawdown Type')), amp(S(f, i, 'Daily Loss Limit'))];
        }), { caption: 'Lucid drawdown and DLL by path' }) +
          prose([p('Above your initial trail balance, funded accounts switch to the LucidScale DLL: 60% of your highest end-of-day profit. Lucid’s own articles disagree on the Pro 25K DLL (none in two articles, $600 in one); our table follows the evaluation and DLL articles. Lucid’s help center lists the Flex DLL only as optional, so the Flex amounts are from our Oct 5, 2026 audit; confirm them at checkout. ' +
            L(U.dll, 'What a daily loss limit is') + ' · ' + L(U.dd, 'EOD vs intraday drawdown') + IF(U.ddCalc, ' · <a href="' + U.ddCalc + '">drawdown calculator</a>') + '.')])
      },
      {
        id: 'news', nav: 'News', eyebrow: 'News & hours', h2: 'Lucid news trading and session hours',
        answer: 'Pro, Flex and Direct let you trade through news (you carry the slippage risk). LucidDaily does not: trading red-folder USD news on a funded Daily account is a hard breach, so be flat from 1 minute before to 1 minute after.',
        body: prose([p('All positions must be flat by 4:45 PM EST. Compare other firms in our ' + L(U.news, 'news trading rules by firm') + '.')])
      },
      {
        id: 'accounts', nav: 'Accounts', eyebrow: 'Limits', h2: 'How many Lucid accounts can you have?',
        answer: 'Up to 10 active evaluations and 5 funded accounts per household, with every Lucid funded type counted together (for example 3 Direct + 2 Pro), and up to 5 live accounts.',
        body: prose([p('Automated trading systems and trade copiers are permitted across your own accounts; hedging is not. If one household member is live, the others may not trade sim accounts. ' + IF(U.accounts, '<a href="' + U.accounts + '">Account limits at every firm</a>.'))])
      },
      {
        id: 'promo-code', nav: 'Promo code', eyebrow: 'Prices & code', h2: 'Lucid Trading promo code and prices',
        answer: 'Use code CHAMP at checkout. Lucid has run promotional pricing, so the prices below are what we saw with CHAMP at our last checkout check, not a guaranteed rate.',
        body: table(['Path', '25K', '50K', '100K', '150K', 'Reset fee'], [
          ['Pro'].concat(DP(f, /^Lucid Pro/, /^Price/).split(' / '), [amp(S(f, 0, 'Reset Fee'))]),
          ['Flex'].concat(DP(f, /^Lucid Flex/, /^Price/).split(' / '), [amp(S(f, 1, 'Reset Fee'))]),
          ['Daily', 'Configurable', 'Configurable', 'Configurable', 'Configurable', amp(S(f, 2, 'Reset Fee'))],
          ['Direct (one-time)'].concat(DP(f, /^Lucid Direct/, /^Price/).split(' / '), ['None (straight to funded)'])
        ], { caption: 'Lucid prices with CHAMP' }) +
          note('Prices with CHAMP at our Oct 5, 2026 checkout check; Lucid’s site blocked our Oct 23 re-check. Activation is free on Pro, Flex and Daily; Direct is one payment. Daily is priced by the options you pick (drawdown type, DLL, consistency add-on).') +
          prose([p(codeTips(f) + ' Lucid’s homepage has also advertised its own public code (VAULT), per a search-engine copy of the page.')])
      }
    ],
    faq: [
      { q: 'Is Lucid Trading legit?', a: 'Lucid Trading publishes its full rulebook in a public help center, which is what we audit against: four account paths, a 90/10 split and a $500 minimum payout on every path, with approved payouts sent within 2 business days. We have not verified a Lucid payout total, so we don’t quote one. Track what we do verify on our ' + L(U.payouts, 'payout tracker') + ' and ' + L(U.audit, 'audit log') + '.' },
      { q: 'Which Lucid account is best?', a: 'It depends on how you trade. Pro suits a fast pass with rising payout caps, Flex suits traders who want no consistency rule once funded, Daily suits daily payout requests if you avoid news, and Direct skips the evaluation for a higher one-time price. ' + (exists(sub(slug, 'which-account-is-best')) ? '<a href="' + sub(slug, 'which-account-is-best') + '">Which Lucid account is best</a> compares them in depth.' : 'The plan table above compares them side by side.') },
      { q: 'Does Lucid Trading have a daily loss limit?', a: 'Only if you choose one on Pro, Flex and Daily: the DLL is optional and set at purchase (Daily: $600 / $1,200 / $1,800 / $2,700; Pro: none on 25K, then $1,200 / $1,800 / $2,700). Direct has a fixed DLL of $1,200 / $2,100 / $3,000 on 50K-150K and none on 25K. Above the initial trail, funded accounts use the LucidScale DLL: 60% of your highest end-of-day profit.' },
      { q: 'Does Lucid allow news trading?', a: 'Yes on Pro, Flex and Direct. LucidDaily is the exception: trading red-folder USD news on a funded Daily account is a hard breach, so be flat from 1 minute before to 1 minute after. See our ' + L(U.news, 'news trading rules') + '.' },
      { q: 'Is Lucid Black still available?', a: 'No. Lucid Black is discontinued; only existing legacy accounts still run on it. New accounts are Pro, Flex, Daily or Direct.' },
      { q: 'How many Lucid accounts can I have?', a: 'Up to 10 active evaluations and 5 funded accounts per household, with all Lucid funded types counted together. Trade copiers are allowed across your own accounts.' + accountsLink() },
      // 'lucid payout time' belongs to /firms/lucid-trading/payout-rules, so the review answers the activation-fee query instead
      { q: 'Does Lucid Trading have an activation fee?', a: 'No. Activation is free on Pro, Flex and Daily. Direct is a single one-time payment that puts you straight into a funded account, so there is nothing to activate.' }
    ]
  };
};

/* ============================== ALPHA ============================== */
CONTENT['alpha-futures'] = function (f) {
  var slug = 'alpha-futures';
  return {
    title: 'Alpha Futures Review ' + YEAR + ': Zero vs Advanced Rules + 40% Off',
    meta: 'Alpha Futures Zero, Standard, Advanced & Direct: 90% split, 1-day Zero pass, no DLL on Advanced, up to 4 payouts a month, $0 activation. CHAMP 40% off.',
    h1: ['Alpha Futures', 'Review (' + YEAR + ')', ': Zero, Standard, Advanced &amp; Direct'],
    source: 'Alpha’s help center',
    chooser: {
      // 'alpha zero vs advanced' belongs to the payout-rules subpage once it exists
      h2: exists(sub(slug, 'payout-rules')) ? 'Alpha Futures plans at a glance' : 'Alpha Futures plans compared: Zero vs Standard vs Advanced vs Direct',
      intro: 'Every plan pays 90% from the first payout. Zero, Standard and Advanced are monthly evaluations; Direct is one payment straight to a funded account.',
      plans: [
        { i: 0, id: 'zero-plan', label: 'Alpha Zero', price: DP(f, /^Alpha Zero/, /Monthly Price/) + ' a month' },
        { i: 1, id: 'standard-plan', label: 'Alpha Standard', price: DP(f, /^Alpha Standard/, /Monthly Price/) + ' a month' },
        { i: 2, id: 'advanced-plan', label: 'Alpha Advanced', price: DP(f, /^Alpha Advanced/, /Monthly Price/) + ' a month' },
        { i: 3, id: 'direct-plan', label: 'Alpha Direct', price: DP(f, /^Alpha Direct/, /One-Time Price/) + ' one-time' }
      ],
      priceLabel: 'List price',
      priceNote: 'List prices; CHAMP takes 40% off at checkout. Monthly billing stops when you pass.',
      picks: [
        ['zero-plan', 'Pick Zero if', 'you want the cheapest way in and a possible 1-day pass, and can accept a daily loss limit and the smallest payout caps.'],
        ['standard-plan', 'Pick Standard if', 'you want bigger payout caps ($3,000-$5,000) at a mid price; the evaluation has a 50% consistency rule and 2 minimum days.'],
        ['advanced-plan', 'Pick Advanced if', 'you want no daily loss limit at any stage, no news restrictions and $15,000 per request; it has the highest monthly price.'],
        ['direct-plan', 'Pick Direct if', 'you want to skip the evaluation with one payment and can work to a 20% consistency rule and a profit target before each withdrawal.']
      ]
    },
    sections: [
      {
        id: 'payouts', nav: 'Payout rules', eyebrow: 'Payouts', h2: 'Payout rules at a glance',
        answer: 'Alpha pays 90% on every plan, up to 4 withdrawals a month with no set payout dates. On Zero, Standard and Advanced you can withdraw up to 50% of your profit after 5 winning days of $200 or more since your last request. Direct uses a profit target plus a 20% consistency rule instead.',
        body: table(['Plan', 'When you can request', 'Minimum', 'Cap per request'], [
          ['Zero', '5 winning days of $200+ since the last request; up to 50% of profit', '$200', '$1,000 / $1,500 / $2,500 (25K-100K)'],
          ['Standard', 'Same 5-winning-day, 50%-of-profit rule', '$500', '$3,000 / $4,000 / $5,000 (50K-150K)'],
          ['Advanced', 'Same 5-winning-day, 50%-of-profit rule', '$1,000', '$15,000 at every size'],
          ['Direct', 'Profit target since the last withdrawal ($1,500 / $3,000 / $6,000 / $9,000 first, then $1,000 / $2,000 / $4,000 / $6,000) and 20% consistency; no winning-day rule', '$500', '$1,000 / $2,000 / $2,500 / $3,000 (25K-150K)']
        ], { caption: 'Alpha Futures payout rules by plan' }) +
          note('The trader receives 90% of each request, and the max loss limit does not reset when you withdraw. On Zero and Standard qualified accounts your largest day must stay below 40% of net profit since the last request (20% on Direct; Advanced has no qualified consistency rule); going over pauses payouts but does not breach the account. Methods: ACH, wire/SWIFT, Wise, Rise. ' +
            IF(sub(slug, 'payout-rules'), 'Full detail: <a href="' + sub(slug, 'payout-rules') + '">Alpha Futures payout rules</a>.'))
      },
      {
        id: 'fees', nav: 'Fees', eyebrow: 'Fees', h2: 'Alpha Futures activation and reset fees',
        answer: 'Alpha charges no activation fee on any plan (Advanced has been $0 since Jul 8, 2026). The monthly subscription stops when you pass, and qualified accounts carry no monthly fee.',
        body: table(['Plan', 'Evaluation reset', 'Qualified reset'], [
          ['Zero (25K-100K)', '$79 / $119 / $249', '$399 / $499 / $799'],
          ['Standard (50K-150K)', '$109 / $199 / $289', '$599 / $799 / $999'],
          ['Advanced (50K-150K)', '$189 / $319 / $449', 'None'],
          ['Direct (25K-150K)', 'N/A (one-time, no evaluation)', 'N/A']
        ], { caption: 'Alpha Futures reset fees' }) +
          note('A qualified reset can be used twice per account, and only before your first payout request.')
      },
      {
        id: 'news', nav: 'News', eyebrow: 'News', h2: 'Can you trade news on Alpha Futures?',
        answer: 'Yes in every evaluation and on Advanced qualified accounts, with no restrictions. On Zero, Standard and Direct qualified accounts you can hold positions through news, but no order may execute within 2 minutes either side of a red-folder event.',
        body: prose([p('A first violation is a warning; later ones breach the account. Compare firms: ' + L(U.news, 'news trading rules by firm') + '.')])
      },
      {
        id: 'accounts', nav: 'Accounts', eyebrow: 'Limits', h2: 'How many Alpha Futures accounts can you have?',
        answer: 'Qualified-account limits are per plan: Zero 5, Standard 5 (3 if bought before Jul 27, 2026), Direct 5 and Advanced 3. Holding any active Advanced qualified account caps your total at 3.',
        body: prose([p('Alpha allows one username per person and one individual per household. Copying your own trades across accounts in your own name is allowed; automated, group and reverse trading are prohibited. ' + IF(U.accounts, '<a href="' + U.accounts + '">Account limits at every firm</a>.'))])
      },
      {
        // '<firm> promo code' belongs to /firms/alpha-futures/promo-code once it exists
        id: 'promo-code', nav: exists(sub(slug, 'promo-code')) ? 'Prices' : 'Promo code', eyebrow: 'Prices & code',
        h2: exists(sub(slug, 'promo-code')) ? 'Alpha Futures prices' : 'Alpha Futures promo code and prices',
        answer: 'Code CHAMP takes 40% off Alpha Futures at checkout. List prices before the discount:',
        body: table(['Plan', '25K', '50K', '100K', '150K'], [
          ['Zero (monthly)'].concat(DP(f, /^Alpha Zero/, /Monthly Price/).split(' / '), ['—']),
          ['Standard (monthly)', '—'].concat(DP(f, /^Alpha Standard/, /Monthly Price/).split(' / ')),
          ['Advanced (monthly)', '—'].concat(DP(f, /^Alpha Advanced/, /Monthly Price/).split(' / ')),
          ['Direct (one-time)'].concat(DP(f, /^Alpha Direct/, /One-Time Price/).split(' / '))
        ], { caption: 'Alpha Futures list prices' }) +
          note('At our Oct 23, 2026 check, Alpha’s own banner also showed public codes: MYALPHA40 (40% off Zero) and MYALPHA50 (50% off Standard, Direct and Advanced).') +
          prose([p(codeTips(f) + IF(sub(slug, 'promo-code'), ' Full breakdown: <a href="' + sub(slug, 'promo-code') + '">Alpha Futures promo code</a>.'))])
      }
    ],
    faq: [
      { q: 'Does Alpha Futures have an activation fee?', a: 'No. Activation is $0 on every Alpha plan; Advanced accounts bought after Jul 8, 2026 no longer pay the old activation fee. You pay the monthly evaluation fee (or Direct’s one-time price), and billing stops when you pass.' },
      { q: 'Is Alpha Futures a monthly subscription?', a: 'Zero, Standard and Advanced are billed monthly while you are in the evaluation; billing stops when you pass, and qualified accounts have no monthly fee. Direct is one payment (' + DP(f, /^Alpha Direct/, /One-Time Price/) + ' list for 25K-150K).' },
      { q: 'Does Alpha Futures use Tradovate?', a: 'Tradovate is not on Alpha’s platform list. Alpha supports ' + f.platformsList.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.' },
      { q: 'Can you trade news on Alpha Futures?', a: 'Yes in every evaluation and on Advanced qualified accounts. On Zero, Standard and Direct qualified accounts you may hold through news, but no order may execute within 2 minutes either side of a red-folder event.' + newsLink() },
      { q: 'How many Alpha Futures accounts can I have?', a: 'Zero 5, Standard 5 (3 if bought before Jul 27, 2026), Direct 5 and Advanced 3 qualified accounts. Any active Advanced qualified account caps you at 3, and Alpha allows one individual per household.' + accountsLink() },
      // 'alpha payout cap / how much can I withdraw' belongs to /firms/alpha-futures/payout-rules (summary table above links it)
      { q: 'Is Alpha Futures shutting down?', a: 'We found no sign of it: all four plans (Zero, Standard, Advanced and Direct) were live on Alpha’s site and help center at our Oct 23, 2026 check, and Alpha publishes a ' + f.payoutTotal + ' performance-fee total.' },
      { q: 'Is Alpha Futures the same as Alpha Capital?', a: 'No. Alpha Futures is a UK-based futures prop firm; Alpha Capital is a different company.' }
    ]
  };
};

/* ============================== APEX ============================== */
CONTENT['apex-trader'] = function (f) {
  var slug = 'apex-trader';
  var idx = 'Per Apex’s help center as indexed in October 2026 (Apex’s site blocked our direct check); confirm in your dashboard.';
  return {
    title: 'Apex Trader Funding Review ' + YEAR + ': Intraday vs EOD, 90% Off',
    meta: 'Apex 2026 rules: Intraday vs EOD Trail, 1-day pass, 100% payouts every 5 trading days, 50% consistency, one-time fee. Code CHAMP takes 90% off the eval.',
    h1: ['Apex Trader Funding', 'Review (' + YEAR + ')', ': Intraday vs EOD Trail'],
    source: 'Apex’s site and help center',
    sourceNote: 'Apex’s site blocked our Oct 23 re-check',
    chooser: {
      h2: 'Intraday Trail vs EOD Trail',
      intro: 'Both Apex evaluations share the same targets, drawdown and 1-day pass. The difference is how the drawdown trails and whether there is a daily loss limit. ' + L(U.apexDd, 'Apex drawdown explained') + '.',
      plans: [
        { i: 0, id: 'intraday-trail', label: 'Intraday Trail', price: 'Standard ' + DP(f, /^Intraday/, /^Eval Price/) + '<br>No-Activation ' + DP(f, /^Intraday/, /^No-Activation/) },
        { i: 1, id: 'eod-trail', label: 'EOD Trail', price: 'Standard ' + DP(f, /^EOD/, /^Eval Price/) + '<br>No-Activation ' + DP(f, /^EOD/, /^No-Activation/) }
      ],
      priceLabel: 'List eval price',
      priceNote: 'List prices at our Oct 5, 2026 audit (one-time, no rebill); CHAMP takes 90% off the evaluation at checkout. The 25K Intraday No-Activation price looks out of line with 50K; confirm it at checkout.',
      picks: [
        ['intraday-trail', 'Pick Intraday Trail if', 'you want no daily loss limit in the evaluation and can manage a drawdown that trails your intraday peak. Funded Intraday accounts add a scaling DLL.'],
        ['eod-trail', 'Pick EOD Trail if', 'you want the drawdown to update only at the end of the day, in exchange for a daily loss limit of $500 / $1,000 / $1,500 / $2,000.']
      ]
    },
    sections: [
      {
        id: 'payouts', nav: 'Payout rules', eyebrow: 'Payouts', h2: 'Payout rules at a glance',
        answer: 'Apex funded accounts (PAs) keep 100% of approved payouts. You can request after 5 qualifying trading days, with a $500 minimum, a 50% consistency rule and a cap per payout that rises over a maximum of 6 payouts per PA.',
        body: table(['Rule', 'Apex PA (25K / 50K / 100K / 150K)'], [
          ['Split', '100%, no split'],
          ['When', '5 qualifying trading days per payout, not necessarily consecutive (minimum daily profit: Intraday $100 / $200 / $250 / $300; EOD $100 / $250 / $300 / $350)'],
          ['Consistency', 'No single day may be 50% or more of the profit since the last payout; going over is not a breach'],
          ['Minimum', '$500, from profit above the safety net (drawdown + $100)'],
          ['Cap', '1st payout $1,000 / $1,500 / $2,000 / $2,500, rising to $1,000 / $3,000 / $4,000 / $5,000 by the 6th'],
          ['Payout count', 'Maximum 6 payouts per PA, then the PA closes']
        ], { caption: 'Apex Trader Funding payout rules' }) +
          note(idx + ' Apex lists different caps for payouts 2-5 on its Intraday and EOD pages, so we only show the first and sixth. ' +
            IF(sub(slug, 'payout-rules'), 'Full detail: <a href="' + sub(slug, 'payout-rules') + '">Apex payout rules</a>.'))
      },
      {
        // '<firm> coupon code' belongs to /firms/apex-trader/promo-code once it exists
        id: 'promo-code', nav: 'Prices', eyebrow: 'Prices & code',
        h2: exists(sub(slug, 'promo-code')) ? 'Apex evaluation prices' : 'Apex prices and code CHAMP',
        answer: 'Apex evaluations are a one-time fee with no rebill, active for 30 days and with no resets. Code CHAMP takes 90% off the evaluation. Each type comes as a Standard build (lower price, activation fee when you pass) or a No-Activation-Fee build (higher price, $0 to activate).',
        body: table(['Build', '25K', '50K', '100K', '150K'], [
          ['Intraday Trail · Standard'].concat(DP(f, /^Intraday/, /^Eval Price/).split(' / ')),
          ['Intraday Trail · No-Activation'].concat(DP(f, /^Intraday/, /^No-Activation/).split(' / ')),
          ['EOD Trail · Standard'].concat(DP(f, /^EOD/, /^Eval Price/).split(' / ')),
          ['EOD Trail · No-Activation'].concat(DP(f, /^EOD/, /^No-Activation/).split(' / '))
        ], { caption: 'Apex list evaluation prices' }) +
          note('List prices at our Oct 5, 2026 audit, before CHAMP. Per Apex’s help center, coupon codes don’t apply to resets or PA activation fees. We could not confirm the current activation fee amounts, so we don’t compare total cost here; check both builds at checkout.') +
          prose([p(codeTips(f) + IF(sub(slug, 'promo-code'), ' Full breakdown: <a href="' + sub(slug, 'promo-code') + '">Apex coupon code</a>.'))])
      },
      {
        id: 'news', nav: 'News & accounts', eyebrow: 'News & limits', h2: 'Apex news rules and account limits',
        answer: 'You can trade through news with your normal strategy, but news-only or straddle strategies and hedging are prohibited, and positions must be flat by market close. Apex allows up to 20 active PAs per household, with every PA type counted together.',
        body: prose([
          p('Evaluations are unlimited. Apex’s own pages conflict on copy trading across your own PAs, so check with Apex before copying. Apex also brings back legacy accounts (6 sizes up to $300K) during sale periods.'),
          p(L(U.news, 'News trading rules by firm') + IF(U.accounts, ' · <a href="' + U.accounts + '">account limits at every firm</a>') + '.')
        ])
      }
    ],
    faq: [
      { q: 'Is Apex Trader Funding a monthly subscription?', a: 'No. Apex evaluations are a one-time fee with no rebill. Each evaluation is active for 30 days, and there are no resets.' },
      { q: 'Does Apex have an activation fee?', a: 'On the Standard build, yes: you pay a PA activation fee after you pass. The No-Activation-Fee build costs more up front and skips it. Per Apex’s help center, coupon codes don’t apply to activation fees. We could not confirm the current fee amounts, so check them at checkout.' },
      { q: 'What is the difference between Apex Intraday Trail and EOD Trail?', a: 'Both have the same targets ($1,500-$9,000), drawdown ($1,000-$4,000) and 1-day pass. Intraday Trail has no daily loss limit in the evaluation but trails your intraday peak; EOD Trail only updates the drawdown at the end of the day and has a $500-$2,000 daily loss limit.' + (exists(U.apexDd) ? ' More in <a href="' + U.apexDd + '">Apex drawdown explained</a>.' : '') },
      { q: 'Does Apex have a consistency rule?', a: 'Only on funded PAs, not in the evaluations: no single trading day may be 50% or more of the profit since your last payout. Going over is not a breach; it delays your payout until more profitable days bring that day under 50% (per Apex’s help center, October 2026).' + (exists(U.cons) ? ' See <a href="' + U.cons + '">how consistency rules work</a>.' : '') },
      { q: 'Can you trade news on Apex?', a: 'Yes, with your normal strategy. News-only or straddle strategies and hedging are prohibited, and you must be flat by market close.' + newsLink() },
      { q: 'How many Apex accounts can you have?', a: 'Up to 20 active PAs per household, with every PA type counted together. Evaluations are unlimited.' + accountsLink() },
      { q: 'What are Apex legacy accounts?', a: 'Older-style accounts that Apex brings back during sale periods, in 6 sizes up to $300K. Per Apex’s help center, only the first 5 payouts on a legacy PA are capped.' },
      { q: 'Does Apex support TradingView?', a: 'Yes, through Tradovate. Apex runs on ' + f.platformsList.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.' }
    ]
  };
};

/* ============================== TRADEIFY ============================== */
CONTENT['tradeify'] = function (f) {
  var slug = 'tradeify';
  var idx = 'Caps, minimums and buffers are from Tradeify’s help center as indexed in October 2026 (it blocked our direct check); payout frequency, DLL, drawdown and consistency are from Tradeify’s site. Confirm in your dashboard.';
  return {
    title: 'Tradeify Review ' + YEAR + ': Growth vs Select vs Lightning Rules',
    meta: 'Tradeify Growth, Select & Lightning: one-time fees, no activation fee, 90/10 split, daily payouts on Select Daily, no DLL on Select Flex. Code CHAMP.',
    h1: ['Tradeify', 'Review (' + YEAR + ')', ': Growth, Select &amp; Lightning'],
    source: 'Tradeify’s site and trader agreement',
    chooser: {
      // 'tradeify select vs growth' belongs to the payout-rules subpage once it exists
      h2: exists(sub(slug, 'payout-rules')) ? 'Tradeify plans at a glance' : 'Tradeify plans compared: Growth vs Select vs Lightning',
      intro: 'Every Tradeify plan is a one-time payment with no activation fee and a 90/10 split. Select gives you a second choice after the evaluation: the Daily path or the Flex path.',
      plans: [
        { i: 0, id: 'growth', label: 'Growth', price: DP(f, /^GROWTH/, /One-Time Payment/) },
        { i: 1, id: 'select-daily', label: 'Select · Daily path', price: DP(f, /^SELECT — Evaluation/, /One-Time Payment/) },
        { i: 2, id: 'select-flex', label: 'Select · Flex path', price: DP(f, /^SELECT — Evaluation/, /One-Time Payment/) },
        { i: 3, id: 'lightning', label: 'Lightning', price: DP(f, /^LIGHTNING/, /One-Time Payment/) }
      ],
      priceLabel: 'One-time list price',
      priceNote: 'List prices; code CHAMP applies the current discount at checkout. Both Select paths start from the same Select evaluation.',
      picks: [
        ['growth', 'Pick Growth if', 'you want a 1-day minimum and no consistency rule in the evaluation, and can trade under a daily loss limit and a 35% funded consistency rule.'],
        ['select-daily', 'Pick Select Daily if', 'you want daily payouts and no funded consistency rule; caps are smaller ($600-$2,500) and the funded account has a DLL.'],
        ['select-flex', 'Pick Select Flex if', 'you want no daily loss limit at any stage and larger caps, paid after every 5 winning days.'],
        ['lightning', 'Pick Lightning if', 'you want to skip the evaluation and can work to a 20% / 25% / 30% consistency rule and a $1,000 minimum request.']
      ]
    },
    sections: [
      {
        id: 'payouts', nav: 'Payout rules', eyebrow: 'Payouts', h2: 'Payout rules at a glance',
        answer: 'Select Daily pays daily from profit above a buffer. Growth and Select Flex pay after every 5 profitable or winning days. Lightning is marketed as 5-day payouts, with no fixed minimum days once you hit the profit goal and the consistency rule. Every funded account pays 90/10.',
        body: table(['Plan', 'When you can request', 'Minimum', 'Cap per payout'], [
          ['Growth', '5 profitable days of $100 / $150 / $200 / $250 and a balance of $26,500 / $53,000 / $104,500 / $156,500; 35% consistency', '$250 / $500 / $1,000 / $1,500', '$1,000 / $1,500 / $2,000 / $2,500 on the 1st, rising to $1,000 / $3,000 / $4,000 / $5,000 from the 4th'],
          ['Select Daily', 'Any day, from profit above a buffer of $1,100 / $2,100 / $2,600 / $3,600', '$250', '$600 / $1,250 / $1,750 / $2,500, and at most 2x the profit since the last payout'],
          ['Select Flex', 'Every 5 winning days of $100 / $150 / $200 / $250; no balance floor', '$250', '50% of profit, up to $1,250 / $2,500 / $3,500 / $4,500'],
          ['Lightning', 'Profit goal ($1,500 / $3,000 / $6,000 / $9,000 first, then $1,000 / $2,000 / $3,500 / $4,500) and 20% / 25% / 30% consistency for payouts 1 / 2 / 3+', '$1,000', '$1,000 / $2,000 / $2,500 / $3,000 (payouts 1-3), then $1,000 / $2,500 / $3,000 / $3,500']
        ], { caption: 'Tradeify payout rules by plan' }) +
          note('Sizes 25K / 50K / 100K / 150K. ' + idx + ' At least 50% of account profit must come from trades held longer than 10 seconds, and you must trade at least once per calendar week (Tradeify’s Funded Trader Agreement). ' +
            IF(sub(slug, 'payout-rules'), 'Full detail: <a href="' + sub(slug, 'payout-rules') + '">Tradeify payout rules</a>.'))
      },
      {
        id: 'accounts', nav: 'Accounts', eyebrow: 'Limits', h2: 'How many Tradeify accounts can you have?',
        answer: 'Five sim-funded accounts per person and per household, in any mix of Growth, Select and Lightning.',
        body: prose([p('Holding an Elite Live account means no other accounts, for you or anyone in your household. Copying your own trades across your own accounts is allowed where the help center permits it, with no opposing positions; copying between people is prohibited. ' + IF(U.accounts, '<a href="' + U.accounts + '">Account limits at every firm</a>.'))])
      },
      {
        id: 'promo-code', nav: 'Promo code', eyebrow: 'Prices & code', h2: 'Tradeify promo code and prices',
        answer: 'Use code CHAMP at checkout. Every Tradeify plan is a one-time payment with no activation fee; these are the list prices and reset fees before any discount.',
        body: table(['Plan', '25K', '50K', '100K', '150K'], [
          ['Growth'].concat(DP(f, /^GROWTH/, /One-Time Payment/).split(' / ')),
          ['Growth reset'].concat(DP(f, /^GROWTH/, /Reset Fee/).split(' / ')),
          ['Select'].concat(DP(f, /^SELECT — Evaluation/, /One-Time Payment/).split(' / ')),
          ['Select with 50%-consistency add-on', '$135', '$205', '$329', '$459'],
          ['Select reset'].concat(DP(f, /^SELECT — Evaluation/, /Reset Fee/).split(' / ')),
          ['Lightning (no evaluation)'].concat(DP(f, /^LIGHTNING/, /One-Time Payment/).split(' / '))
        ], { caption: 'Tradeify list prices and reset fees' }) +
          note('List prices from Tradeify’s site, Oct 2026. The Select add-on raises the evaluation consistency limit from 40% to 50%. Tradeify also rotates time-limited public codes.') +
          prose([p(codeTips(f))])
      }
    ],
    faq: [
      { q: 'Is Tradeify a one-time fee?', a: 'Yes. Since 03/31/26 every Tradeify plan (Growth, Select and Lightning) is a one-time payment; monthly subscriptions were removed.' },
      { q: 'Does Tradeify have an activation fee?', a: 'No. There is no activation fee on any Tradeify plan.' },
      { q: 'Does Tradeify have a daily loss limit?', a: 'Growth does (' + DP(f, /^GROWTH/, /Daily Loss Limit/) + '). Select has none in the evaluation; the Select Daily funded path adds one ($500 / $1,000 / $1,250 / $1,750), while Select Flex has none at any stage. Lightning has none on 25K and $1,250 / $2,500 / $3,000 on 50K-150K.' },
      // 'tradeify payout frequency / payout rules' belongs to /firms/tradeify/payout-rules (summary table above links it)
      { q: 'Does Tradeify pay out in crypto?', a: 'Yes, crypto payouts are available on Growth accounts.' },
      { q: 'What platforms does Tradeify support?', a: f.platformsList.join(', ').replace(/, ([^,]*)$/, ' and $1') + '. The Tradesea and Rithmic data feeds were added on 03/31/26.' },
      { q: 'How many Tradeify accounts can I have?', a: 'Five sim-funded accounts per person and per household, in any mix of Growth, Select and Lightning.' + accountsLink() },
      { q: 'Is Tradeify the same as TradeDay?', a: 'No. They are different futures prop firms with similar names. This review covers Tradeify (tradeify.co).' }
    ]
  };
};

/* ============================== TAKE PROFIT TRADER ============================== */
CONTENT['take-profit'] = function (f) {
  var sizes = S(f, 0, 'Account Sizes').split(' · ');
  var targets = money(S(f, 0, 'Profit Target')), dds = money(S(f, 0, 'Max Drawdown'));
  var monthly = money(S(f, 0, 'Activation Fee')).slice(1), resets = money(S(f, 0, 'Reset Fee')), buffers = money(S(f, 0, 'Max Payout'));
  var contracts = (f.plansDetailed || []).map(function (pl) {
    var r = (pl.rules || []).filter(function (x) { return /Max Size/.test(x[0]); })[0];
    return r ? r[1].split(' / ')[0] : '—';
  });
  [targets, dds, monthly, resets, buffers, contracts].forEach(function (arr, k) { if (arr.length !== sizes.length) WARN.push('take-profit: size table column ' + k + ' has ' + arr.length + ' values for ' + sizes.length + ' sizes'); });
  var rows = sizes.map(function (s, i) { return [s, targets[i] || '—', dds[i] || '—', contracts[i] || '—', (monthly[i] || '—') + '/mo', resets[i] || '—', buffers[i] || '—']; });
  return {
    title: 'Take Profit Trader Review ' + YEAR + ': PRO Rules, No DLL, 40% Off',
    meta: 'Take Profit Trader TEST → PRO → PRO+: no daily loss limit, daily payouts from day one (80/20 PRO, 90/10 PRO+), EOD vs intraday drawdown. CHAMP 40% off.',
    h1: ['Take Profit Trader', 'Review (' + YEAR + ')', ': TEST, PRO &amp; PRO+'],
    source: 'Take Profit Trader’s knowledge base',
    chooser: {
      id: 'plans', nav: 'Rules by size', eyebrow: 'Account sizes', h2: 'Take Profit Trader account rules by size (25K-150K)',
      intro: 'One evaluation (the TEST) in five sizes. There is no daily loss limit at any size or stage; the 50% consistency rule applies to the TEST only, and you need at least 3 trading days to pass (tests bought from Aug 17, 2026; older tests 5).',
      custom: table(['Size', 'Profit target', 'Max drawdown', 'Max contracts', 'TEST price', 'Reset fee', 'PRO balance to withdraw'], rows, { caption: 'Take Profit Trader rules by account size' }) +
        note('Drawdown is end-of-day trailing in the TEST. PRO withdrawals start once your balance clears a buffer equal to the max drawdown (last column). Monthly prices and reset fees are from our Oct 5, 2026 audit; TPT confirmed 50K at $170 and 150K at $360 in its Oct 2026 knowledge base.')
    },
    sections: [
      {
        id: 'stages', nav: 'TEST → PRO → PRO+', eyebrow: 'The ladder', h2: 'TEST → PRO → PRO+: how the stages differ',
        answer: 'You pass the TEST (an evaluation billed monthly), move to PRO (a simulated funded account paying 80/20 with withdrawals from day one), and can be promoted to PRO+ (a live account paying 90/10).',
        body: table(['Stage', 'What it is', 'Drawdown', 'Split', 'Consistency', 'News'], [
          ['TEST', 'Evaluation, billed monthly until you pass', 'End-of-day trailing', '—', '50%: best day below 50% of net profit', 'No restriction'],
          ['PRO', 'Simulated funded account', 'Intraday trailing; stops at the starting balance', '80/20', 'None', 'Flat 1 minute before to 1 minute after FOMC, NFP and CPI'],
          ['PRO+', 'Live-market account (holistic review, no fixed threshold)', 'End-of-day; no buffer', '90/10', 'None', 'Same as PRO']
        ], { caption: 'Take Profit Trader stages', stack: true })
      },
      {
        id: 'pro-rules', nav: 'PRO rules', eyebrow: 'PRO account', h2: 'Take Profit Trader PRO account rules',
        answer: 'A PRO account pays 80/20 and lets you withdraw from day one once your balance clears a buffer equal to the max drawdown. There are no minimum profit days, no consistency rule and no maximum withdrawal.',
        body: prose([
          ul([
            'Balance needed before withdrawing: ' + buffers.join(' / ') + ' (' + sizes.join(' / ') + ').',
            'Drawdown: intraday trailing, stopping at the starting balance.',
            'No bots or algos; you must trade at least once per calendar week.',
            'News: flat from 1 minute before to 1 minute after FOMC, NFP and CPI.',
            'If the account closes, you can withdraw 50% of the buffer.',
            'Wallet withdrawals of $250 or less carry a $50 fee.'
          ]),
          h3('PRO+ rules'),
          p('PRO+ is a live account paying 90/10 with an end-of-day drawdown and no buffer. It starts at a $0 balance with the original drawdown, and $5,000 of your PRO profit stays frozen while PRO+ is active.')
        ])
      },
      {
        id: 'drawdown', nav: 'EOD or intraday?', eyebrow: 'Drawdown', h2: 'Is Take Profit Trader EOD or intraday drawdown?',
        answer: 'Both, depending on the stage: the TEST uses an end-of-day trailing drawdown, PRO switches to intraday trailing (it stops at the starting balance), and PRO+ goes back to end-of-day with no buffer.',
        body: prose([p('That switch from end-of-day to intraday is the biggest rule change between stages, so size down in your first PRO days. ' + L(U.dd, 'EOD vs intraday drawdown explained') + IF(U.ddCalc, ' · <a href="' + U.ddCalc + '">drawdown calculator</a>') + '.')])
      },
      {
        id: 'payout-rules', nav: 'Payout rules', eyebrow: 'Payouts', h2: 'Take Profit Trader payout rules',
        answer: 'On PRO you can withdraw from day one once your balance clears the buffer, with no cap, no minimum days and no consistency rule. Wallet transfers on Tradovate take seconds; bank withdrawals get a manual review of up to 12 business hours.',
        body: table(['Rule', 'PRO (sim funded)', 'PRO+ (live)'], [
          ['Split', '80/20', '90/10'],
          ['First withdrawal', 'Day one, once the balance clears the buffer', 'Day-one payouts'],
          ['Buffer', 'Equal to the max drawdown (' + buffers.join(' / ') + ' balance)', 'None'],
          ['Minimum days / consistency', 'None / none', 'None / none'],
          ['Maximum per withdrawal', 'No maximum', 'Not stated'],
          ['Speed', 'Account-to-wallet transfers on Tradovate are automated (5-10 seconds); bank withdrawals: manual review of up to 12 business hours, then Plaid (US), PayPal or Wise', 'Same methods'],
          ['Fees', '$50 on wallet withdrawals of $250 or less', '—']
        ], { caption: 'Take Profit Trader payout rules' }) +
          note('From TPT’s knowledge base, Oct 2026. ' + L(U.payoutsWork, 'How prop firm payouts work') + IF(U.caps, ' · <a href="' + U.caps + '">payout caps at every firm</a>') + '.')
      },
      {
        id: 'accounts', nav: 'Accounts', eyebrow: 'Limits', h2: 'How many Take Profit Trader accounts can you have?',
        answer: 'Up to 5 active funded accounts per person, PRO and PRO+ combined. Tests are unlimited, with at most 10 passed-test activations per 30 days.',
        body: prose([p('Trade copiers are allowed on your own accounts with approved copiers only: Tradesyncer, TradeCopia, Affordable Indicators, Replikanto Compliance Edition, or a platform’s built-in copier. ' + IF(U.accounts, '<a href="' + U.accounts + '">Account limits at every firm</a>.'))])
      },
      {
        id: 'promo-code', nav: 'Promo code', eyebrow: 'Prices & code', h2: 'Take Profit Trader promo code and prices',
        answer: 'Use code CHAMP at checkout: per our firm data it takes 40% off the TEST. The TEST is billed monthly (' + monthly.join(' / ') + ' for ' + sizes.join(' / ') + '), and moving to PRO costs a one-time $130 activation fee, which promos often waive.',
        body: prose([
          p('At our Oct 23, 2026 check, TPT’s own public code was NOFEE40: 40% off the TEST for life plus the $130 activation fee waived. Compare the two at checkout.'),
          p(codeTips(f))
        ])
      }
    ],
    faq: [
      { q: 'Is Take Profit Trader a monthly subscription?', a: 'Yes. The TEST is billed monthly (' + monthly.join(' / ') + ' for ' + sizes.join(' / ') + ' at our audit) and billing stops when you pass. Moving to PRO costs a one-time $130 activation fee, which promos often waive.' },
      { q: 'Does Take Profit Trader have a consistency rule?', a: 'Only in the TEST: your best day must be below 50% of net profit. PRO and PRO+ have no consistency rule.' },
      { q: 'Does Take Profit Trader have a daily loss limit?', a: 'No. There is no daily loss limit at any size or stage; the max drawdown is the only loss limit.' },
      { q: 'How fast are Take Profit Trader payouts?', a: 'On PRO you can withdraw from day one once your balance clears the buffer. Account-to-wallet transfers on Tradovate are automated and take seconds; bank withdrawals go through a manual review of up to 12 business hours, then Plaid, PayPal or Wise.' },
      { q: 'How many Take Profit Trader accounts can I have?', a: 'Up to 5 active funded accounts per person (PRO and PRO+ combined). Tests are unlimited, with at most 10 passed-test activations per 30 days.' + accountsLink() },
      { q: 'Can you trade news at Take Profit Trader?', a: 'In the TEST, yes. On PRO and PRO+ you must be flat from 1 minute before to 1 minute after FOMC, NFP and CPI.' + newsLink() },
      { q: 'How many days does it take to pass Take Profit Trader?', a: 'At least 3 trading days for tests bought from Aug 17, 2026 (5 for older tests), and your best day must stay below 50% of net profit.' },
      { q: 'What platforms does Take Profit Trader support?', a: 'Fourteen: ' + S(f, 0, 'Platforms').split(' · ').join(', ').replace(/, ([^,]*)$/, ' and $1') + '.' }
    ]
  };
};

/* ============================== TOP ONE ============================== */
CONTENT['top-one-futures'] = function (f) {
  var slug = 'top-one-futures';
  var eaEval = money(DP(f, /^Elite Access/, /Evaluation Fee/))[0] || '—';
  return {
    title: 'Top One Futures Review ' + YEAR + ': Elite Access, Ignite & Instant',
    meta: 'Top One Futures Elite Access, Elite Daily, Instant Sim & Ignite: flat 90% split, 1-day pass, $39 Elite Access eval, 15-40% consistency. CHAMP 60% off.',
    h1: ['Top One Futures', 'Review (' + YEAR + ')', ': Elite Access, Elite Daily, Instant &amp; Ignite'],
    source: 'Top One’s help center',
    chooser: {
      h2: 'Top One Futures plans compared',
      intro: 'All four paths pay a flat 90% split. Elite Access and Elite Daily are evaluations; Instant Sim Funded and Ignite start you funded with no evaluation.',
      plans: [
        { i: 0, id: 'elite-access', label: 'Elite Access', price: eaEval + ' eval, then ' + S(f, 0, 'Activation Fee').replace(/ · /g, ' / ') + ' activation' },
        { i: 1, id: 'elite-daily', label: 'Elite Daily', price: DP(f, /^Elite Daily/, /Monthly Price/) + ' a month' },
        { i: 2, id: 'instant-sim-funded', label: 'Instant Sim Funded', price: DP(f, /^Instant Sim/, /^Price/) + ' one-time' },
        { i: 3, id: 'ignite', label: 'Ignite', price: DP(f, /^Ignite/, /List Price/) + ' one-time' }
      ],
      priceLabel: 'List price',
      priceNote: 'List prices before CHAMP, from Top One’s site and help center (Oct 2026). Elite Access is a ' + eaEval + ' one-time evaluation at every size; the activation fee is paid after you pass.',
      picks: [
        ['elite-access', 'Pick Elite Access if', 'you want the cheapest entry and a 1-day pass with no DLL or consistency rule in the evaluation; funded accounts add a DLL and 40% consistency.'],
        ['elite-daily', 'Pick Elite Daily if', 'you want daily payouts from day one and no consistency rule once funded, and accept monthly billing during the evaluation.'],
        ['instant-sim-funded', 'Pick Instant Sim Funded if', 'you want to skip the evaluation with higher payout caps than Ignite, and can work to a 6% first profit target and 20% consistency.'],
        ['ignite', 'Pick Ignite if', 'you want the cheapest instant-funding path and up to 10 same-size accounts; 15% consistency, no overnight holds, flat by 4 PM ET.']
      ]
    },
    sections: [
      {
        id: 'payouts', nav: 'Payout rules', eyebrow: 'Payouts', h2: 'Payout rules at a glance',
        answer: 'Every Top One path pays 90/10, and every sim-funded withdrawal is capped until you go live. Elite Daily pays daily from day one; Elite Access pays after 5 profitable days; Instant Sim Funded and Ignite pay when a profit target and the consistency rule are met.',
        body: table(['Plan', 'When you can request', 'Minimum', 'Cap per request'], [
          ['Elite Access', '5 profitable days of $200 / $250 / $300 / $350 and a balance above the buffer ($1,500 / $2,000 / $3,000 / $4,500) plus $500', '$500', '$1,000 / $1,500 / $2,000 / $2,500'],
          ['Elite Daily', 'Daily (every 24 hours) from day one; $1,500 / $2,500 / $3,500 / $4,500 must stay in the account', '$500', '$750 / $1,000 / $1,500 / $2,250'],
          ['Instant Sim Funded', 'Profit target of 6% of the starting balance for the 1st payout, then 5%, then 4%, plus 20% consistency', 'Not stated', '$1,000 / $2,000 / $2,500 / $3,000 (accounts bought on or after Jul 27, 2026)'],
          ['Ignite', '5% profit target per payout plus 15% consistency; no minimum days', '$250', '$500 / $1,000 / $1,500 / $2,000']
        ], { caption: 'Top One Futures payout rules by plan' }) +
          note('Sizes 25K / 50K / 100K / 150K. On the Elite plans, from the 2nd payout at least 50% of each payout must be new profit since the last one. Live review: Elite Access and Ignite after 3 payouts, Elite Daily usually after 5. ' +
            IF(sub(slug, 'payout-rules'), 'Full detail: <a href="' + sub(slug, 'payout-rules') + '">Top One Futures payout rules</a>.'))
      },
      {
        id: 'fees', nav: 'Fees', eyebrow: 'Fees', h2: 'Activation fees and the $39 Elite Access evaluation',
        answer: 'Elite Access costs ' + eaEval + ' one-time at every size; after you pass you pay an activation fee of ' + S(f, 0, 'Activation Fee').replace(/ · /g, ' / ') + '. Elite Daily has no activation fee, and Instant Sim Funded and Ignite are single one-time payments.',
        body: prose([ul([
          'Elite Access Intraday (a newer variant): same rules, but an intraday-trailing funded drawdown, with activation of $69 / $94 / $129 / $179.',
          'Elite Access resets: $35 for the evaluation; $299-$1,349 for funded accounts.',
          'Elite Daily: the monthly subscription ends when you pass. Funded resets are $299 / $499 / $849 / $1,250; evaluation resets are $66 / $82 / $154 / $215 per the help center (Top One’s homepage has shown higher figures).',
          'No-DLL add-on (from Oct 16, 2026): on Elite Access the evaluation price is unchanged and the activation fee is about 30% higher; on Elite Daily and Ignite the price is about 30% higher.'
        ])])
      },
      {
        id: 'news', nav: 'News & accounts', eyebrow: 'News & limits', h2: 'Top One news rules and account limits',
        answer: 'Funded Elite Access and Elite Daily accounts may not trade 2 minutes before or after high-impact news; Instant Sim Funded and Ignite have no news rule. Account limits are per household and per category, and every account in a category must be the same size.',
        body: table(['Category', 'Account limit'], [
          ['Elite Access (incl. Elite Access Intraday)', '10'],
          ['Elite Daily', '5, evaluation and funded combined'],
          ['Instant Sim Funded', '5 on 25K / 50K, or 3 on 100K / 150K'],
          ['Ignite', '10'],
          ['LaunchPad', '3']
        ], { caption: 'Top One account limits' }) +
          note('Up to 10 evaluation purchases per rolling 30 days; promotions can raise the limits. Copy trading is allowed only between accounts of the same plan type and size, never with another person. If anyone in the household is live, no sim accounts are allowed. ' + L(U.news, 'News rules by firm') + '.')
      },
      {
        id: 'promo-code', nav: 'Promo code', eyebrow: 'Prices & code', h2: 'Top One Futures promo code',
        answer: 'Use code CHAMP at checkout: per our firm data it takes 60% off. Top One also rotates public promos, so compare at checkout.',
        body: prose([
          p('At our Oct 23, 2026 check, Top One’s site showed a buy-one-get-one offer on Elite Access and code 30M (50% off Elite Daily and Ignite, 45% off Instant Sim Funded).'),
          p(codeTips(f))
        ])
      }
    ],
    faq: [
      { q: 'Does Top One Futures have an activation fee?', a: 'Only on Elite Access: ' + S(f, 0, 'Activation Fee').replace(/ · /g, ' / ') + ' after you pass the ' + eaEval + ' evaluation (Elite Access Intraday: $69 / $94 / $129 / $179). Elite Daily has no activation fee, and Instant Sim Funded and Ignite are one-time purchases.' },
      { q: 'Does Top One Futures use Tradovate?', a: 'Yes. Top One runs on Tradovate, NinjaTrader, BlackArrow and WealthCharts, with TradingView through Tradovate.' },
      { q: 'Does Top One Futures have a consistency rule?', a: 'Yes, at different stages: Elite Access 40% once funded (none in the evaluation), Elite Daily 40% in the evaluation (none once funded), Instant Sim Funded 20% and Ignite 15%.' },
      { q: 'Does Top One Futures have a daily loss limit?', a: 'Elite Access has none in the evaluation but a soft DLL once funded ($500 / $1,000 / $1,250 / $1,750). Elite Daily ($500-$1,850), Instant Sim Funded ($625-$3,000) and Ignite ($500-$3,000) all have one. An optional No-DLL add-on launched on Oct 16, 2026.' },
      { q: 'How many Top One Futures accounts can I have?', a: 'Limits are per household and per category: Elite Access 10, Elite Daily 5 (evaluation and funded combined), Instant Sim Funded 5 on 25K/50K or 3 on 100K/150K, and Ignite 10. Every account in a category must be the same size.' + accountsLink() },
      { q: 'Can you trade news on Top One Futures?', a: 'Not around high-impact news on funded Elite Access and Elite Daily accounts (no trades 2 minutes before or after). Instant Sim Funded and Ignite have no news rule.' + newsLink() },
      { q: 'What is Top One X-Ultra?', a: 'A LaunchPad plan that is no longer available for new purchases; existing accounts keep their rules. The current limited LaunchPad release is X-Daily Spark: 50K only, a $39 evaluation, $189 activation, daily payouts and an 80/20 split.' },
      { q: 'Is Top One Futures the same as Top One Trader?', a: 'No, they are different companies. This review covers Top One Futures (toponefutures.com).' }
    ]
  };
};

/* ============================== MY FUNDED FUTURES ============================== */
CONTENT['my-funded-futures'] = function (f) {
  return {
    title: 'My Funded Futures (MFFU) Review ' + YEAR + ': Rapid, Pro & Builder',
    meta: 'MyFundedFutures Rapid, Rapid EOD, Pro & Builder: no activation fee, one-time pricing, no DLL on Rapid & Pro, daily Rapid payouts ($500 min, 90/10). CHAMP.',
    h1: ['My Funded Futures (MFFU)', 'Review ' + YEAR, ': Rapid, Pro &amp; Builder'],
    // firms.js tagline says "No DLL" for every plan, but Builder has a soft daily pause ($600-$2,500)
    tagline: 'Rapid · Rapid EOD · Pro · Builder — no activation fee, no DLL on Rapid & Pro',
    source: 'MFF’s help center',
    chooser: {
      h2: 'Rapid vs Rapid EOD vs Pro vs Builder',
      intro: 'Every MFF plan is a one-time purchase (no monthly renewals since Aug 2026) with no activation fee. Rapid, Rapid EOD and Pro have no daily loss limit.',
      plans: [
        { i: 0, id: 'rapid', label: 'Rapid', price: DP(f, /^Funded Futures Rapid/, /Price/) },
        { i: 1, id: 'rapid-eod', label: 'Rapid EOD', price: DP(f, /^Rapid EOD/, /Price/) + ' (25K / 50K)' },
        { i: 2, id: 'pro', label: 'Pro', price: DP(f, /^Funded Futures Pro/, /Price/) + ' (50K-150K)' },
        { i: 3, id: 'builder', label: 'Builder', price: DP(f, /^Builder/, /Price/) }
      ],
      priceLabel: 'One-time list price',
      priceNote: 'List prices; code CHAMP takes up to 50% off at checkout, and MFF also rotates per-plan public promos.',
      picks: [
        ['rapid', 'Pick Rapid if', 'you want daily payouts at 90/10 with no daily loss limit, and can trade a funded drawdown that trails intraday.'],
        ['rapid-eod', 'Pick Rapid EOD if', 'you want daily payouts but an end-of-day drawdown in the funded stage too; 25K/50K only, 4-day minimum.'],
        ['pro', 'Pick Pro if', 'you want no DLL and no funded consistency rule, and are fine with payouts every 14 days at 80/20 and a $1,000 minimum.'],
        ['builder', 'Pick Builder if', 'you want a 1-day pass and a defined route to a real Live account after 5 sim payouts; it has a soft DLL and caps per cycle.']
      ]
    },
    sections: [
      {
        id: 'payout-rules', nav: 'Payout rules', eyebrow: 'Payouts', h2: 'My Funded Futures payout rules',
        answer: 'Rapid and Rapid EOD pay daily at 90/10 with a $500 minimum once you clear the buffer. Pro pays every 14 calendar days at 80/20 with a $1,000 minimum. Builder pays at 80/20 from 48 hours after your first trade, with a cap per cycle and a route to Live after 5 payouts.',
        body: table(['Plan', 'How often', 'Before the first payout', 'Minimum', 'Cap', 'Split'], [
          ['Rapid', 'Daily; first payout 24 hours after the first funded trade', '$1,100 / $2,100 / $3,100 / $4,600 of realized profit (buffer)', '$500', 'No per-payout cap stated. A $10,000 net-profit session moves you to Live automatically (profit above $10K that day is forfeited)', '90/10'],
          ['Rapid EOD', 'Daily', '$1,100 / $2,100 buffer; after that $250 / $500 of net profit since the last payout', '$500', 'No cap per payout', '90/10'],
          ['Pro', 'Every 14 calendar days from the first trade', '$2,100 / $3,100 / $4,600 buffer (up to 60% of profit can be withdrawn before clearing it)', '$1,000', '$100,000 in sim payouts per user; profit above that is forfeited', '80/20'],
          ['Builder', 'First request 48 hours after the first trade; each cycle needs 2 trading days and 50% consistency', '$1,100 / $2,100 / $3,100 / $4,600 buffer', '$250 / $500 / $1,000 / $1,500', '$1,000 / $2,000 / $3,000 / $4,500 per cycle', '80/20']
        ], { caption: 'My Funded Futures payout rules by plan', stack: true }) +
          note('Sizes 25K / 50K / 100K / 150K (Rapid EOD 25K / 50K; Pro 50K-150K). From MFF’s help center, Oct 2026. Most payouts are approved instantly; manual reviews take 6-12 business hours. A per-payout cap that MFF does not state on Rapid is not the same as a confirmed unlimited payout.') +
          prose([
            h3('How MFF moves you to a live account'),
            ul([
              '<strong>Rapid:</strong> a $10,000 net-profit session moves you to Live automatically.',
              '<strong>Pro:</strong> 3 consecutive payouts or $20K of profit triggers a Live review.',
              '<strong>Builder:</strong> 5 approved sim payouts unlock a real Live account at Blue Row Capital: daily payouts, 80/20, end-of-day drawdown, a live DLL ($1,000 on 50K) and no consistency rule.'
            ])
          ])
      },
      {
        id: 'drawdown', nav: 'Drawdown', eyebrow: 'Drawdown', h2: 'MFF drawdown: Rapid switches to intraday once funded',
        answer: 'Rapid uses an end-of-day drawdown in the evaluation, then an intraday trailing drawdown once funded: the funded account starts at $0 and the trail locks at +$100. Rapid EOD keeps an end-of-day drawdown when funded. Pro and Builder trail end-of-day.',
        body: table(['Plan', 'Max drawdown', 'Drawdown type', 'Daily loss limit', 'Consistency'], [0, 1, 2, 3].map(function (i) {
          return [titleCase(f.plansSummary[i].name.replace(/^FUNDED FUTURES /, '')), amp(S(f, i, 'Max Drawdown')), amp(S(f, i, 'Drawdown Type')), amp(S(f, i, 'Daily Loss Limit')), amp(S(f, i, 'Consistency Rule'))];
        }), { caption: 'MFF drawdown, DLL and consistency by plan', stack: true }) +
          note(L(U.dd, 'EOD vs intraday drawdown explained') + IF(U.ddCalc, ' · <a href="' + U.ddCalc + '">drawdown calculator</a>') + ' · ' + consLinks() + '.')
      },
      {
        id: 'news', nav: 'News', eyebrow: 'News', h2: 'MFF Tier-1 news rule',
        answer: 'Tier-1 news (FOMC, NFP and CPI, plus EIA and agricultural reports for those markets) is prohibited on funded Rapid, Rapid EOD and Pro accounts from 2 minutes before to 2 minutes after. It is allowed in every evaluation and on Builder.',
        body: prose([p('Compare firms: ' + L(U.news, 'news trading rules by firm') + '.')])
      },
      {
        id: 'accounts', nav: 'Accounts', eyebrow: 'Limits', h2: 'How many MFF accounts can you have?',
        answer: 'Up to 10 active evaluations and 5 sim-funded accounts if all of them are 25K or 50K, or 3 if any is 100K or 150K. Builder allows 1 sim-funded account per user (2 on 25K), and Rapid EOD 3.',
        body: prose([p('Copy trading is allowed across all of your own accounts (Tradesyncer, Tradovate group trading or an external copier). ' + IF(U.accounts, '<a href="' + U.accounts + '">Account limits at every firm</a>.'))])
      },
      {
        id: 'promo-code', nav: 'Promo code', eyebrow: 'Prices & code', h2: 'My Funded Futures promo code and prices',
        answer: 'Use code CHAMP at checkout for up to 50% off. Every MFF plan is a one-time purchase with no activation fee; these are list prices before any discount.',
        body: table(['Plan', '25K', '50K', '100K', '150K', 'Reset fee'], [
          ['Rapid'].concat(DP(f, /^Funded Futures Rapid/, /Price/).split(' / '), [DP(f, /^Funded Futures Rapid/, /Reset Fee/)]),
          ['Rapid EOD'].concat(DP(f, /^Rapid EOD/, /Price/).split(' / '), ['—', '—', 'See checkout']),
          ['Pro', '—'].concat(DP(f, /^Funded Futures Pro/, /Price/).split(' / '), [DP(f, /^Funded Futures Pro/, /Reset Fee/) + ' (50K-150K)']),
          ['Builder'].concat(DP(f, /^Builder/, /Price/).split(' / '), ['See checkout'])
        ], { caption: 'My Funded Futures list prices' }) +
          note('List prices and reset fees from our Oct 5, 2026 audit. MFF also rotates public per-plan promos (for example RAPID, EOD, UNCAPPED and builder).') +
          prose([p(codeTips(f))])
      }
    ],
    faq: [
      { q: 'Is My Funded Futures a monthly fee?', a: 'No. Since August 2026 every MFF plan is a one-time purchase with no monthly renewal.' },
      { q: 'Does My Funded Futures have a daily loss limit?', a: 'Rapid, Rapid EOD and Pro have none. Builder has a soft daily pause of $600 / $1,000 / $1,750 / $2,500, and Builder’s real Live account has a DLL.' },
      { q: 'Does My Funded Futures charge an activation fee?', a: 'No. Activation is $0 on every plan.' },
      { q: 'Does MFF have a consistency rule?', a: 'Only in the evaluation on Rapid (50%), Rapid EOD (30%) and Pro (50%), with none once funded. Builder is the reverse: no evaluation consistency, and 50% at the payout stage.' },
      { q: 'Does MFF move you to a live account?', a: 'Yes, three ways: a $10,000 net-profit session on Rapid moves you Live automatically; Pro gets a Live review after 3 consecutive payouts or $20K of profit; Builder gives a real Live account at Blue Row Capital after 5 approved sim payouts.' },
      { q: 'How many MFF accounts can I have?', a: 'Up to 10 active evaluations and 5 sim-funded accounts if all are 25K/50K (3 if any is 100K/150K). Builder allows 1 sim-funded account per user (2 on 25K), and Rapid EOD 3. Copy trading across your own accounts is allowed.' + accountsLink() },
      { q: 'How fast are My Funded Futures payouts?', a: 'Most payouts are approved instantly; manual reviews take 6-12 business hours. Rapid can pay daily, with the first payout 24 hours after your first funded trade.' },
      { q: 'What happened to MFF Flex?', a: 'MFF retired the Flex plan. The current lineup is Rapid, Rapid EOD, Pro and Builder.' }
    ]
  };
};

/* ============================== FUNDEDNEXT ============================== */
CONTENT['fundednext'] = function (f) {
  return {
    title: 'FundedNext Futures Review ' + YEAR + ': Flex vs Legacy vs Rapid',
    meta: 'FundedNext Futures (not CFD) Flex, Legacy & Rapid: up to 95% split, EOD drawdown, no DLL on Flex/Legacy/Rapid Pro, 1-day Rapid pass, news trading allowed.',
    h1: ['FundedNext Futures', 'Review (' + YEAR + ')', ''],
    tagline: 'Flex · Legacy · Rapid (futures accounts only)',
    source: 'FundedNext’s futures help center',
    chooser: {
      h2: 'Flex vs Legacy vs Rapid: which FundedNext Futures account?',
      intro: 'Every FundedNext Futures account is a one-time challenge fee with no activation fee, an end-of-day max loss limit and news trading allowed. Rapid comes in two funded versions: Pro and Daily.',
      plans: [
        { i: 0, id: 'flex', label: 'Flex', price: DP(f, /^FLEX/, /One-Time Fee/).replace(/ \(.*$/, '') + ' (first 2 purchases)' },
        { i: 1, id: 'legacy', label: 'Legacy', price: DP(f, /^LEGACY/, /One-Time Fee/) },
        { i: 2, id: 'rapid-pro', label: 'Rapid Pro', price: DP(f, /^RAPID — Pro/, /One-Time Fee/).replace(/ \(.*$/, '') },
        { i: 3, id: 'rapid-daily', label: 'Rapid Daily', price: DP(f, /^RAPID — Daily/, /One-Time Fee/).replace(/ \(.*$/, '') }
      ],
      priceLabel: 'Offer price',
      priceNote: 'FundedNext’s help-center offer prices, Oct 2026 (promotional; confirm at checkout). Flex is $84.99 / $159.99 / $289.99 from the 3rd purchase. Rapid with the optional DLL add-on: $59.99 / $129.99 / $229.99.',
      picks: [
        ['flex', 'Pick Flex if', 'you want the highest split (95%) and no daily loss limit; payouts need 5 benchmark days, and the account ends after 5 rewards.'],
        ['legacy', 'Pick Legacy if', 'you want a low entry with no DLL and an account that keeps going: after 30 benchmark days the 50% limit and the cap are removed. The split is 80%.'],
        ['rapid-pro', 'Pick Rapid Pro if', 'you want a 1-day pass with no evaluation consistency and no DLL; rewards every 3 days with 40% funded consistency.'],
        ['rapid-daily', 'Pick Rapid Daily if', 'you want daily rewards and no consistency rule at any stage, and can trade under a daily loss limit.']
      ]
    },
    sections: [
      {
        id: 'payout-rules', nav: 'Payout rules', eyebrow: 'Payouts', h2: 'FundedNext Futures payout rules',
        answer: 'Flex pays 95% after 5 benchmark days, Legacy 80% after 5 benchmark days, Rapid Pro 90% every 3 days and Rapid Daily 90% daily. Every funded account has a $250 minimum withdrawal, and rewards are requested at the end of the day.',
        body: table(['Account', 'When you can request', 'Cap per withdrawal', 'Split', 'Ends after'], [
          ['Flex (50K-150K)', '5 benchmark days ($200 / $200 / $250) and $500 of cycle profit; no buffer', '50% of profit, up to $1,500 / $2,500 / $4,000', '95%', '5 rewards'],
          ['Legacy (25K-100K)', '5 benchmark days ($100 / $200 / $200) and $500 of cycle profit', '50% of profit, up to $3,000 / $6,000 / $6,000; both limits removed after 30 benchmark days', '80%', 'Does not end after 5 rewards'],
          ['Rapid Pro (25K-100K)', 'Every 3 days, with $500 of cycle profit and 40% consistency (at least 3 days)', '$800 / $1,200 / $2,500', '90%', '5 rewards'],
          ['Rapid Daily (25K-100K)', 'Daily, once the end-of-day balance reaches the buffer ($26,100 / $52,100 / $102,600) plus $500 of cycle profit; no minimum days', '$800 / $1,200 / $2,500', '90%', '5 rewards']
        ], { caption: 'FundedNext Futures payout rules by account', stack: true }) +
          note('From FundedNext’s futures help center, Oct 2026. Placing a trade on a day removes that day’s transfer option. FundedNext advertises that about 99.99% of payouts are processed within 24 hours.') +
          prose([
            h3('New: FundedNext Futures Direct ($50K)'),
            p('A straight-to-funded account with no challenge and no profit goal: clear a $2,100 buffer and a 20% “perpetual” consistency rule (your all-time best day must be no more than 20% of the current cycle’s profit), then withdraw $800-$1,200 at a 90% share. It has a $1,000 DLL, a $2,000 max loss, 3 minis, no resets, and ends after 5 withdrawals. Offer price $169.99 (base $283.99) at our Oct 23, 2026 check. ' + IF(U.instantBest, '<a href="' + U.instantBest + '">Instant funding firms compared</a>.'))
          ])
      },
      {
        id: 'consistency', nav: 'Consistency', eyebrow: 'Consistency', h2: 'FundedNext Futures consistency rule',
        answer: 'Flex and Legacy have a 40% consistency rule in the challenge and none once funded. Rapid Pro is the reverse: none in the challenge and 40% once funded. Rapid Daily has no consistency rule at any stage, and Direct uses a 20% perpetual rule.',
        body: table(['Account', 'Max loss (EOD)', 'Daily loss limit', 'Consistency'], [0, 1, 2, 3].map(function (i) {
          return [titleCase(f.plansSummary[i].name), amp(S(f, i, 'Max Drawdown')), amp(S(f, i, 'Daily Loss Limit')), amp(S(f, i, 'Consistency Rule'))];
        }), { caption: 'FundedNext Futures drawdown, DLL and consistency' }) +
          note('Rapid Pro offers an optional DLL add-on ($500 / $1,000 / $1,250) at a lower price. More: ' + consLinks() + ' · ' + L(U.dll, 'daily loss limits explained') + '.')
      },
      {
        id: 'accounts', nav: 'Accounts', eyebrow: 'Limits', h2: 'How many FundedNext Futures accounts can you have?',
        answer: 'Up to 5 active funded accounts per user and per household (same address or IP), with at most 10 issued per calendar month. Challenges can total up to $750K of combined allocation.',
        body: prose([p('Copying your own trades between your own FundedNext accounts, and to your own accounts at other firms (same name, verified), is allowed; signal services and group trading are not. ' + IF(U.accounts, '<a href="' + U.accounts + '">Account limits at every firm</a>.'))])
      },
      {
        id: 'promo-code', nav: 'Promo code', eyebrow: 'Prices & code', h2: 'FundedNext Futures promo code and prices',
        answer: 'Use code CHAMP at checkout. FundedNext Futures charges a one-time challenge fee with no activation fee; these are its help-center offer prices, which are promotional.',
        body: table(['Account', '25K', '50K', '100K', '150K'], [
          ['Flex (first 2 purchases)', '—'].concat(DP(f, /^FLEX/, /One-Time Fee/).replace(/ \(.*$/, '').split(' / ')),
          ['Flex (3rd purchase on)', '—', '$84.99', '$159.99', '$289.99'],
          ['Legacy'].concat(DP(f, /^LEGACY/, /One-Time Fee/).split(' / '), ['—']),
          ['Rapid (Pro or Daily)'].concat(DP(f, /^RAPID — Pro/, /One-Time Fee/).replace(/ \(.*$/, '').split(' / '), ['—']),
          ['Rapid with DLL add-on', '$59.99', '$129.99', '$229.99', '—'],
          ['Direct', '—', '$169.99', '—', '—']
        ], { caption: 'FundedNext Futures offer prices' }) +
          note('Offer prices from FundedNext’s futures help center, updated Oct 13, 2026. We did not re-check reset fees; see checkout.') +
          prose([p(codeTips(f))])
      }
    ],
    faq: [
      { q: 'Does FundedNext Futures use Tradovate?', a: 'Yes. FundedNext Futures runs on NinjaTrader, Tradovate and TradingView.' },
      { q: 'Does FundedNext Futures allow news trading?', a: 'Yes. News trading is allowed on every FundedNext Futures account type.' + newsLink() },
      { q: 'Does FundedNext Futures have a daily loss limit?', a: 'Not on Flex, Legacy or Rapid Pro (Rapid Pro offers an optional DLL add-on at a lower price). Rapid Daily has one: $500 / $1,000 / $1,250. The new Direct account has a $1,000 DLL.' },
      { q: 'Does FundedNext Futures have an activation fee?', a: 'No. Each challenge is a one-time fee with no activation fee.' },
      { q: 'Is FundedNext Futures the same as FundedNext’s CFD program?', a: 'Same company, different product with its own rules. This review covers only the futures accounts. FundedNext’s published ' + f.payoutTotal + ' payout total covers all of its programs, not futures alone.' },
      { q: 'How many FundedNext Futures accounts can I have?', a: 'Up to 5 active funded accounts per user and per household (same address or IP), with at most 10 issued per calendar month. Challenges can total up to $750K of combined allocation.' + accountsLink() },
      { q: 'Does FundedNext Futures have instant funding?', a: 'Yes, a new $50K Direct account: no challenge, a $2,100 buffer, a 20% perpetual consistency rule, $800-$1,200 per withdrawal and a 90% share. The offer price was $169.99 at our Oct 23, 2026 check.' },
      { q: 'Which FundedNext Futures account has no consistency rule?', a: 'Rapid Daily: it has no consistency rule in the challenge or once funded. Flex and Legacy drop theirs once funded, and Rapid Pro only applies one once funded.' }
    ]
  };
};

// ---------------------------------------------------------------------------
// Renderers for the generated firm-page regions
// ---------------------------------------------------------------------------
const FX_STYLE = [
  '<style>',
  '/* generated by tools/build-firm-pages.js — CSS variables only */',
  '.hero h1#firmTitle{font-size:clamp(30px,4.4vw,50px);line-height:1.06;letter-spacing:-.035em}',
  '.fx-byline{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:16px;font-family:var(--font-mono);font-size:11.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--text-faint)}',
  '.fx-byline b{color:var(--text);font-weight:600}',
  '.fx-byline a{color:var(--lime-text);border-bottom:1px solid var(--border-lime)}',
  '.fx-vh{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}',
  '.fx-jump{padding-bottom:40px;position:relative;z-index:1}',
  '.fx-jump-inner{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
  '.fx-jump-label{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--text-faint);margin-right:4px}',
  '.fx-jump a{font-size:13px;font-weight:600;color:var(--text-soft);background:var(--bg-card);border:1px solid var(--border);padding:7px 12px;border-radius:999px;transition:color .15s,border-color .15s}',
  '.fx-jump a:hover{color:var(--text-strong);border-color:var(--border-lime)}',
  '.fx-sec,.fx-sec [id]{scroll-margin-top:calc(var(--pc-header-h,64px) + 16px)}',
  '.fx-answer{font-size:17px;color:var(--text);line-height:1.6;max-width:820px;margin:0 0 24px;padding:16px 20px;border-left:3px solid var(--lime);background:var(--lime-soft);border-radius:0 12px 12px 0}',
  '.fx-prose{max-width:820px}',
  '.fx-prose p{font-size:16px;color:var(--text-soft);line-height:1.65;margin:0 0 14px}',
  '.fx-prose ul{margin:0 0 16px;padding-left:20px;color:var(--text-soft);font-size:15.5px}',
  '.fx-prose li{margin:6px 0;line-height:1.6}',
  '.fx-prose strong,.fx-answer strong{color:var(--text-strong)}',
  '.fx-prose a,.fx-note a,.fx-answer a,table.data a,.faq-a a{color:var(--lime-text);border-bottom:1px solid var(--border-lime)}',
  '.fx-h3{font-family:var(--font-display);font-weight:700;font-size:19px;color:var(--text-strong);letter-spacing:-.02em;margin:30px 0 12px}',
  '.table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--border);border-radius:14px;background:var(--bg-card);margin:0 0 12px}',
  'table.data{width:100%;border-collapse:collapse;font-size:14px;min-width:620px}',
  'table.data th,table.data td{text-align:left;padding:12px 14px;border-bottom:1px solid var(--border);vertical-align:top;line-height:1.5}',
  'table.data thead th{background:var(--bg-band);font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text-faint)}',
  'table.data thead th[id]{color:var(--lime-text)}',
  'table.data tbody th{font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text-soft);min-width:120px}',
  'table.data td{color:var(--text);font-variant-numeric:tabular-nums}',
  'table.data tbody tr:last-child td,table.data tbody tr:last-child th{border-bottom:0}',
  'table.data.fx-chooser tbody th{position:sticky;left:0;background:var(--bg-card);z-index:1}',
  'table.data.fx-chooser thead th:first-child{position:sticky;left:0;z-index:2}',
  '.fx-note{font-size:12.5px;line-height:1.65;color:var(--text-faint);font-family:var(--font-mono);margin:10px 0 0;max-width:900px}',
  '.fx-picks{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin-top:22px}',
  '.fx-pick{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:18px 18px 16px}',
  '.fx-pick h3{font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--text-strong);letter-spacing:-.015em;margin-bottom:6px}',
  '.fx-pick h3 a{color:inherit}',
  '.fx-pick p{font-size:14px;color:var(--text-soft);line-height:1.55}',
  '.faq-list{display:flex;flex-direction:column;gap:10px;max-width:860px}',
  '.faq-item{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;overflow:hidden;transition:border-color .18s}',
  '.faq-item:hover,.faq-item[open]{border-color:var(--border-lime)}',
  '.faq-q{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 22px;cursor:pointer;font-family:var(--font-display);font-size:16.5px;font-weight:700;color:var(--text-strong);letter-spacing:-.015em;line-height:1.35;list-style:none}',
  '.faq-q::-webkit-details-marker{display:none}',
  '.faq-toggle-icon{flex-shrink:0;width:24px;height:24px;border-radius:50%;background:var(--bg-elev);border:1px solid var(--border-strong);display:flex;align-items:center;justify-content:center;color:var(--text-soft);font-weight:700;font-size:14px;line-height:1;transition:transform .2s}',
  '.faq-item[open] .faq-toggle-icon{transform:rotate(45deg);color:var(--lime-text);border-color:var(--border-lime)}',
  '.faq-a{padding:0 22px 20px;font-size:15px;color:var(--text-soft);line-height:1.65}',
  '.fx-links{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}',
  '.fx-link{display:flex;align-items:center;gap:12px;background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:15px 18px;transition:border-color .18s,transform .18s}',
  '.fx-link:hover{border-color:var(--border-lime);transform:translateY(-2px)}',
  '.fx-link>span{display:flex;flex-direction:column;gap:3px;min-width:0}',
  '.fx-link img{width:38px;height:38px;flex-shrink:0;border-radius:9px;background:var(--bg-elev);border:1px solid var(--border);object-fit:contain;padding:5px}',
  '.fx-link-kind{font-family:var(--font-mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--lime-text)}',
  '.fx-link-title{font-family:var(--font-display);font-size:15px;font-weight:700;color:var(--text-strong);line-height:1.35;letter-spacing:-.01em}',
  '@media(max-width:640px){.fx-stack-wrap{overflow:visible}table.data.fx-stack{min-width:0}table.data.fx-stack thead{display:none}table.data.fx-stack tr{display:block;padding:14px 16px;border-bottom:1px solid var(--border)}table.data.fx-stack tbody tr:last-child{border-bottom:0}table.data.fx-stack th,table.data.fx-stack td{display:block;border:0;padding:3px 0}table.data.fx-stack tbody th{color:var(--text-strong);font-size:12px;margin-bottom:4px}table.data.fx-stack td::before{content:attr(data-label);display:block;font-family:var(--font-mono);font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--text-faint);margin-top:6px}}',
  '@media(max-width:600px){.fx-answer{font-size:16px;padding:14px 16px}.fx-jump{padding-bottom:28px}.fx-jump a{font-size:12.5px;padding:6px 10px}.faq-q{padding:16px 18px;font-size:15.5px}.faq-a{padding:0 18px 18px}}',
  '</style>'
].join('\n');

function jumpNav(items) {
  return '\n  <nav class="container fx-jump" aria-label="On this page"><div class="fx-jump-inner"><span class="fx-jump-label">On this page</span>' +
    items.map(function (x) { return '<a href="#' + x[0] + '">' + x[1] + '</a>'; }).join('') + '</div></nav>\n';
}
function sectionHtml(s) {
  return '\n  <section class="block fx-sec" id="' + s.id + '">\n    <div class="container">\n' +
    (s.eyebrow ? '      <div class="section-eyebrow">' + s.eyebrow + '</div>\n' : '') +
    '      <h2 class="section-h2">' + s.h2 + '</h2>\n' +
    (s.answer ? '      <p class="fx-answer">' + s.answer + '</p>\n' : '') +
    (s.intro ? '      <p class="section-intro">' + s.intro + '</p>\n' : '') +
    '      ' + (s.body || '') + '\n    </div>\n  </section>\n';
}
const CHOOSER_ROWS = [
  ['Sizes', 'Account Sizes'], ['Profit target', 'Profit Target'], ['Max drawdown', 'Max Drawdown'], ['Drawdown type', 'Drawdown Type'],
  ['Daily loss limit', 'Daily Loss Limit'], ['Minimum days', 'Min. Trading Days'], ['Consistency', 'Consistency Rule'],
  ['Split', 'Payout Split'], ['Payout timing', 'Payout Frequency']
];
function chooserHtml(f, c) {
  var body;
  if (c.custom) body = c.custom;
  else {
    var head = ['Rule'].concat(c.plans.map(function (x) { return x.label; }));
    var ids = [null].concat(c.plans.map(function (x) { return x.id; }));
    var rows = CHOOSER_ROWS.map(function (r) {
      return [r[0]].concat(c.plans.map(function (x) { return amp(S(f, x.i, r[1])); }));
    });
    rows.push([c.priceLabel || 'Price'].concat(c.plans.map(function (x) { return amp(x.price); })));
    body = table(head, rows, { cls: 'fx-chooser', colIds: ids, caption: plain(c.h2) }) + (c.priceNote ? note(c.priceNote) : '');
  }
  if (c.picks) {
    body += '<div class="fx-picks">' + c.picks.map(function (pk) {
      return '<div class="fx-pick"><h3><a href="#' + pk[0] + '">' + pk[1] + '</a></h3><p>' + pk[2] + '</p></div>';
    }).join('') + '</div>';
  }
  return sectionHtml({ id: c.id || 'plans', eyebrow: c.eyebrow || 'Choose a plan', h2: c.h2, intro: c.intro, body: body });
}
function faqSection(f, faq) {
  var items = faq.map(function (x, i) {
    return '<details class="faq-item"' + (i === 0 ? ' open' : '') + '><summary class="faq-q">' + x.q +
      '<span class="faq-toggle-icon" aria-hidden="true">+</span></summary><div class="faq-a">' + x.a + '</div></details>';
  }).join('');
  return sectionHtml({ id: 'faq', eyebrow: 'FAQ', h2: amp(f.name) + ' FAQ', body: '<div class="faq-list">' + items + '</div>' });
}
// firm homepage when the affiliate link lives on another host (Alpha signs up on app.alpha-futures.com)
const FIRM_SITE = { 'alpha-futures': 'https://alpha-futures.com/' };
function seoHead(slug, f, c, faq) {
  var url = SITE + PATH_FOR[slug], iso = reviewedISO(slug, f);
  var title = c.title, meta = c.meta;
  var graph = [
    {
      '@type': ['FinancialService', 'Service'], '@id': url + '#firm', name: f.name, url: url,
      image: SITE + f.logo,
      description: f.name + ' — ' + (f.type || '') + '. Independent review covering rules, payouts, drawdown, account limits and current promo codes.',
      areaServed: f.country || 'US', serviceType: 'Futures prop trading firm',
      provider: { '@type': 'Organization', name: f.name, url: FIRM_SITE[slug] || (f.affiliateUrl || '').replace(/^(https?:\/\/[^\/]+).*$/, '$1/') },
      review: {
        '@type': 'Review', '@id': url + '#review', url: url,
        author: { '@type': 'Organization', name: 'PropChamps', url: SITE },
        publisher: { '@type': 'Organization', name: 'PropChamps', url: SITE },
        datePublished: PUBLISHED[slug] || PUBLISHED['default'], dateModified: iso,
        reviewRating: { '@type': 'Rating', ratingValue: f.rating, bestRating: 5, worstRating: 1 },
        reviewBody: 'PropChamps editorial review of ' + f.name + ' (' + (f.type || '') + '): rules, payouts, drawdown, account limits and pricing, checked against ' + plain(c.source || 'the firm’s help center') + '.'
      }
    },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Firms', item: SITE + '/firms/' },
      { '@type': 'ListItem', position: 3, name: f.name, item: url }
    ] },
    { '@type': 'FAQPage', '@id': url + '#faq', mainEntity: faq.map(function (x) {
      return { '@type': 'Question', name: plain(x.q), acceptedAnswer: { '@type': 'Answer', text: plain(x.a) } };
    }) }
  ];
  return '\n<title>' + esc(title) + '</title>\n' +
    '<meta name="description" content="' + escAttr(meta) + '">\n' +
    '<link rel="canonical" href="' + url + '">\n' +
    '<meta property="og:site_name" content="PropChamps">\n' +
    '<meta property="og:title" content="' + escAttr(title) + '">\n' +
    '<meta property="og:description" content="' + escAttr(meta) + '">\n' +
    '<meta property="og:type" content="article">\n' +
    '<meta property="og:url" content="' + url + '">\n' +
    '<meta property="og:image" content="' + SITE + '/og-image.jpg">\n' +
    '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n' +
    '<meta property="og:image:alt" content="PropChamps — Independent prop firm research">\n' +
    '<meta property="article:modified_time" content="' + iso + '">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="twitter:title" content="' + escAttr(title) + '">\n' +
    '<meta name="twitter:description" content="' + escAttr(meta) + '">\n' +
    '<meta name="twitter:image" content="' + SITE + '/og-image.jpg">\n' +
    jsonLd({ '@context': 'https://schema.org', '@graph': graph }) + '\n';
}
function h1Html(slug, f, c) {
  var iso = reviewedISO(slug, f);
  return '<h1 id="firmTitle">' + c.h1[0] + ' <span class="accent">' + c.h1[1] + '</span>' + c.h1[2] + '</h1>';
}
function bylineHtml(slug, f, c) {
  var iso = reviewedISO(slug, f);
  return '<div class="fx-byline"><span>PropChamps rating <b>' + Number(f.rating).toFixed(1) + ' / 5</b></span>' +
    '<span>Reviewed <b><time datetime="' + iso + '">' + shortDate(iso) + '</time></b> against ' + c.source + (c.sourceNote ? ' (' + c.sourceNote + ')' : '') + '</span>' +
    (exists(U.method) ? '<a href="' + U.method + '">How we review firms</a>' : '') + '</div>';
}

// ---------------------------------------------------------------------------
// The original block renderers (static mirror of the inline page JS)
// ---------------------------------------------------------------------------
function render(slug, f) {
  var out = {};
  out.bcCurrent = esc(f.name);
  out.firmCode = esc((f.promo && f.promo.code) || 'CHAMP');
  out.firmOffer = esc(f.offerLine || 'See firm');
  out.firmSummary = esc(f.summary || '');
  out.ctaTitle = esc('Ready to get funded with ' + f.name + '?');
  out.logo = f.logo || '';
  out.logoAlt = esc(f.name + ' logo');
  out.affiliate = f.affiliateUrl || '#';
  var stats = (f.stats || []).slice();
  if (stats.length === 0 && f.boxPreviews) {
    Object.keys(f.boxPreviews).forEach(function (k) { stats.push([k.charAt(0).toUpperCase() + k.slice(1), f.boxPreviews[k]]); });
  }
  out.summaryGrid = stats.slice(0, 6).map(function (s) {
    return '<div class="summary-card"><div class="summary-card-label">' + s[0] + '</div><div class="summary-card-value">' + s[1] + '</div></div>';
  }).join('');
  var plans = f.plansSummary || f.plansDetailed || [];
  out.plansGrid = plans.slice(0, 4).map(function (pl) {
    var feat = pl.featured ? ' featured' : '';
    var rules = '';
    if (Array.isArray(pl.rules)) {
      rules = pl.rules.slice(0, 20).map(function (r) { return '<div class="plan-rule"><span class="plan-rule-label">' + r[0] + '</span><span class="plan-rule-value">' + r[1] + '</span></div>'; }).join('');
    } else if (pl.rules && typeof pl.rules === 'object') {
      rules = Object.keys(pl.rules).slice(0, 20).map(function (k) { return '<div class="plan-rule"><span class="plan-rule-label">' + k + '</span><span class="plan-rule-value">' + pl.rules[k] + '</span></div>'; }).join('');
    }
    return '<div class="plan-card' + feat + '"><h3 class="plan-name">' + pl.name + '</h3><div class="plan-rules">' + rules + '</div></div>';
  }).join('');
  out.bestForList = (f.bestFor || f.highlights || []).slice(0, 5).map(function (b) { return '<li>' + b + '</li>'; }).join('');
  var cautions = [];
  if (f.warning) cautions.push(f.warning);
  if (f.note) cautions.push(f.note);
  if (cautions.length === 0) cautions = ['Read full rules at the firm before funding — terms can change weekly.', 'Trading futures involves substantial risk of loss.'];
  out.watchList = cautions.map(function (c) { return '<li>' + c + '</li>'; }).join('');
  var related = Object.values(FIRMS).filter(function (o) { return o && o.live !== false && o.slug !== slug; });
  out.relatedGrid = related.map(function (o) {
    var page = PATH_FOR[o.slug] || '#';
    return '<a class="related-card" href="' + page + '"><div class="related-logo"><img src="' + o.logo +
      '" alt=""></div><div><div class="related-name">' + o.name + '</div><div class="related-meta">' + (o.type || '') + '</div></div></a>';
  }).join('');
  return out;
}

// ---------------------------------------------------------------------------
// Idempotent injection helpers
// ---------------------------------------------------------------------------
var TAG = {
  bcCurrent: 'span', firmTagline: 'p', firmCode: 'div', firmOffer: 'div',
  firmSummary: 'p', ctaTitle: 'h3',
  summaryGrid: 'div', plansGrid: 'div', bestForList: 'ul', watchList: 'ul', relatedGrid: 'div'
};
// All dynamic content is spliced in via FUNCTION replacers: firm data is full of
// "$1,500" and in a replacement STRING $1/$2 are capture-group backreferences.
function dollar(s) { return String(s).replace(/\$/g, '$$$$'); }
function hasRegion(html, id) { return html.indexOf('<!--g:' + id + '-->') >= 0 && html.indexOf('<!--/g:' + id + '-->') >= 0; }
function setRegion(html, id, content) {
  var marker = new RegExp('(<!--g:' + id + '-->)[\\s\\S]*?(<!--/g:' + id + '-->)');
  return html.replace(marker, function (m, g1, g2) { return g1 + content + g2; });
}
function injectInner(html, id, content) {
  if (hasRegion(html, id)) return setRegion(html, id, content);
  var tag = TAG[id];
  var first = new RegExp('(<' + tag + '\\b[^>]*\\bid="' + id + '"[^>]*>)[\\s\\S]*?(</' + tag + '>)');
  return html.replace(first, function (m, g1, g2) { return g1 + '<!--g:' + id + '-->' + content + '<!--/g:' + id + '-->' + g2; });
}
// Insert an empty region before/after an anchor (first run only), then fill it.
function ensureRegion(html, id, anchorRe, where, content, label) {
  if (!hasRegion(html, id)) {
    var m = anchorRe.exec(html);
    if (!m) { throw new Error('anchor for region "' + id + '" not found in ' + label); }
    var at = where === 'after' ? m.index + m[0].length : m.index;
    html = html.slice(0, at) + '<!--g:' + id + '--><!--/g:' + id + '-->' + html.slice(at);
  }
  return setRegion(html, id, content);
}
// Replace a span [startRe .. endRe) with a region (first run only), then fill it.
function ensureSpanRegion(html, id, startRe, endRe, content, label) {
  if (!hasRegion(html, id)) {
    var a = startRe.exec(html);
    if (!a) throw new Error('start anchor for "' + id + '" not found in ' + label);
    endRe.lastIndex = 0;
    var rest = html.slice(a.index);
    var b = endRe.exec(rest);
    if (!b) throw new Error('end anchor for "' + id + '" not found in ' + label);
    html = html.slice(0, a.index) + '<!--g:' + id + '--><!--/g:' + id + '-->' + rest.slice(b.index);
  }
  return setRegion(html, id, content);
}
function setImg(html, logo, alt) {
  return html.replace(/<img\b[^>]*\bid="firmLogo"[^>]*>/, function (tag) {
    return tag.replace(/\ssrc="[^"]*"/, ' src="' + dollar(logo) + '"').replace(/\salt="[^"]*"/, ' alt="' + dollar(alt) + '"');
  });
}
function setAffiliate(html, id, url) {
  return html.replace(new RegExp('<a\\b[^>]*\\bid="' + id + '"[^>]*>'), function (tag) {
    tag = tag.replace(/\shref="[^"]*"/, ' href="' + dollar(escAttr(url)) + '"');
    if (/\srel="[^"]*"/.test(tag)) tag = tag.replace(/\srel="[^"]*"/, ' rel="sponsored noopener"');
    else tag = tag.replace(/>$/, ' rel="sponsored noopener">');
    return tag;
  });
}
function patchInlineJs(html) {
  // Old fallback nuked <main> to "Firm not found" when firms.js was missing.
  html = html.replace(/if\(!f\)\{document\.querySelector\('main'\)\.innerHTML='[^;]*';return;\}/,
    "if(!f){return;}/* firms.js missing — keep the pre-rendered static content */");
  // The static <title>, H1 and tagline are generated here; stop the JS rewriting them.
  html = html.replace(/\n\s*document\.title=f\.name\+[^;]*;/, '');
  html = html.replace(/\n\s*document\.getElementById\('firmTitle'\)\.innerHTML=[^;]*;/, '');
  html = html.replace(/\n\s*document\.getElementById\('firmTagline'\)\.textContent=[^;]*;/, '');
  // Related-firm links: clean URLs, generated from FILE_FOR so every firm is mapped.
  var map = 'var pageMap={' + Object.keys(FILE_FOR).map(function (s) { return "'" + s + "':'" + BASE_FOR[s] + "'"; }).join(',') + '};';
  html = html.replace(/var pageMap=\{[^}]*\};/, function () { return map; });
  // Show every other live firm so hydration matches the static pre-render.
  html = html.replace(/allFirms\.slice\(0,\s*\d+\)\.map\(/, 'allFirms.map(');
  return html;
}
function patchTemplateCopy(html, f) {
  // Claims the template made that the data can't support.
  html = html.replace('Rule snapshots across the firm\'s active plans. Featured plan is what most traders pick first.',
    'The full rule sheet for every plan, from our firm data. The highlighted card is our featured plan.');
  html = html.replace('Use code <strong style="color:var(--pc-gold)">CHAMP</strong> at checkout for the latest verified discount on this firm.',
    'Use code <strong style="color:var(--pc-gold)">CHAMP</strong> at checkout, and confirm the final price on the firm’s checkout page before you pay.');
  html = html.replace('Seven other firms tracked, audited weekly, and discounted with the same CHAMP code.',
    'The other futures firms we track. Code CHAMP works at each one.');
  html = html.replace('<h2 class="section-h2">Available programs</h2>', '<h2 class="section-h2"><!--g:rulesH2--><!--/g:rulesH2--></h2>');
  html = setRegion(html, 'rulesH2', amp(f.name) + ' rules by plan');
  return html;
}

// ---------------------------------------------------------------------------
// Build the 8 firm pages
// ---------------------------------------------------------------------------
var built = 0, skipped = 0, REPORT = [];
Object.keys(FILE_FOR).forEach(function (slug) {
  var f = FIRMS[slug];
  if (!f) { console.log('  SKIP (no data): ' + slug); skipped++; return; }
  if (!CONTENT[slug]) { console.log('  SKIP (no editorial content): ' + slug); skipped++; return; }
  var file = path.join(FIRMS_DIR, FILE_FOR[slug]);
  var label = FILE_FOR[slug];
  var before = fs.readFileSync(file, 'utf8');
  var c = CONTENT[slug](f);
  var r = render(slug, f);
  var html = before;

  // head
  if (!hasRegion(html, 'seoHead')) {
    // first run: move the old <title> … JSON-LD block into the region, keep the robots meta outside it
    var a = html.indexOf('<title>'), b = html.indexOf('</script>', html.indexOf('application/ld+json')) + '</script>'.length;
    if (a < 0 || b < 9) throw new Error('head block not found in ' + label);
    var robots = (html.slice(a, b).match(/<meta name="robots"[^>]*>/) || ['<meta name="robots" content="index, follow">'])[0];
    html = html.slice(0, a) + '<!--g:seoHead--><!--/g:seoHead-->\n' + robots + html.slice(b);
  }
  html = setRegion(html, 'seoHead', seoHead(slug, f, c, c.faq));
  html = ensureRegion(html, 'fxStyle', /<!-- pc:head -->/, 'before', FX_STYLE + '\n', label);

  // hero
  if (!hasRegion(html, 'firmH1')) {
    html = html.replace(/<h1 id="firmTitle">[\s\S]*?<\/h1>/, '<!--g:firmH1--><!--/g:firmH1-->');
  }
  html = setRegion(html, 'firmH1', h1Html(slug, f, c));
  html = injectInner(html, 'firmTagline', esc(c.tagline || f.tagline || f.type || ''));
  html = ensureRegion(html, 'byline', /(<p class="hero-tagline"[^>]*>[\s\S]*?<\/p>)/, 'after', bylineHtml(slug, f, c), label);
  if (!hasRegion(html, 'lastReviewed')) {
    html = html.replace(/(<div class="hero-stat-label">Last reviewed<\/div>\s*<div class="hero-stat-value"[^>]*>)[^<]*(<\/div>)/,
      function (m, g1, g2) { return g1 + '<!--g:lastReviewed--><!--/g:lastReviewed-->' + g2; });
  }
  var iso = reviewedISO(slug, f);
  html = setRegion(html, 'lastReviewed', '<time datetime="' + iso + '">' + longDate(iso) + '</time>');

  // jump nav + chooser + deep sections + faq/related
  var nav = [[c.chooser.id || 'plans', c.chooser.nav || 'Plans']].concat(c.sections.map(function (s) { return [s.id, s.nav]; }), [['faq', 'FAQ'], ['compare', 'Compare']]);
  html = ensureRegion(html, 'jumpNav', /\n\s*<section class="block">\s*<div class="container">\s*<div class="section-eyebrow">At a glance<\/div>/, 'before', jumpNav(nav), label);
  html = ensureRegion(html, 'chooser', /\n\s*<section class="block">\s*<div class="container">\s*<div class="section-eyebrow">Plans<\/div>/, 'before', chooserHtml(f, c.chooser), label);
  html = ensureRegion(html, 'deep', /\n\s*<section class="block">\s*<div class="container">\s*<div class="section-eyebrow">Trader profile<\/div>/, 'before', c.sections.map(sectionHtml).join(''), label);
  var rel = sectionHtml({ id: 'compare', eyebrow: 'Compare & learn', h2: 'Compare ' + amp(f.name) + ' and keep reading', body: relatedBlock(slug, f) });
  html = ensureRegion(html, 'faqRelated', /\n\s*<section class="block">\s*<div class="container">\s*<div class="cta-final">/, 'before', faqSection(f, c.faq) + rel, label);

  // original blocks
  html = injectInner(html, 'bcCurrent', r.bcCurrent);
  html = injectInner(html, 'firmCode', r.firmCode);
  html = injectInner(html, 'firmOffer', r.firmOffer);
  html = injectInner(html, 'firmSummary', r.firmSummary);
  html = injectInner(html, 'ctaTitle', r.ctaTitle);
  html = injectInner(html, 'summaryGrid', r.summaryGrid);
  html = injectInner(html, 'plansGrid', r.plansGrid);
  html = injectInner(html, 'bestForList', r.bestForList);
  html = injectInner(html, 'watchList', r.watchList);
  html = injectInner(html, 'relatedGrid', r.relatedGrid);
  html = setImg(html, r.logo, r.logoAlt);
  html = setAffiliate(html, 'firmAffiliate', r.affiliate);
  html = setAffiliate(html, 'ctaAffiliate', r.affiliate);
  html = patchTemplateCopy(html, f);
  html = patchInlineJs(html);
  // any leftover internal /firms/<page>.html link -> clean URL
  html = html.replace(/href="\/firms\/([a-z0-9-]+)\.html"/g, 'href="/firms/$1"');

  REPORT.push({ file: 'firms/' + label, title: c.title, meta: c.meta, vs: vsPagesFor(slug).map(function (v) { return v.url; }), subs: subpagesFor(slug).map(function (s) { return s.url; }), guides: guidesFor(slug, f).map(function (g) { return g.url; }) });
  if (html !== before) { fs.writeFileSync(file, html); console.log('  ✓ ' + label + '  (' + Math.round(html.length / 1024) + 'kb)'); built++; }
  else console.log('  · unchanged ' + label);
});

// ---------------------------------------------------------------------------
// /firms/ hub
// ---------------------------------------------------------------------------
(function buildIndex() {
  var file = path.join(FIRMS_DIR, 'index.html'), label = 'index.html';
  var before = fs.readFileSync(file, 'utf8'), html = before;
  var mo = html.match(/var RANK_ORDER = \[([^\]]*)\]/);
  var RANK = mo ? mo[1].split(',').map(function (s) { return s.trim().replace(/^'|'$/g, ''); }).filter(function (s) { return FIRMS[s]; }) : FIRM_ORDER.slice();
  var labels = {};
  var ml = html.match(/var RANK_LABELS = \{([\s\S]*?)\};/);
  if (ml) ml[1].replace(/'([a-z-]+)'\s*:\s*(?:"([^"]*)"|'([^']*)')/g, function (m, k, v1, v2) { labels[k] = v1 || v2; return m; });
  var live = RANK.filter(function (s) { return FIRMS[s].live !== false; });
  var n = live.length;
  var plansCount = live.reduce(function (t, s) { return t + (FIRMS[s].plansSummary || []).length; }, 0);
  var lastIso = live.map(function (s) { return reviewedISO(s, FIRMS[s]); }).sort().pop();
  var title = 'Best Futures Prop Firms (' + YEAR + '): All ' + n + ' Ranked & Compared';
  var names = live.map(function (s) { return SHORT[s] || FIRMS[s].name; });
  var meta = 'Every futures prop firm we audit, ranked: ' + names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1] + ', with best-for picks and CHAMP codes.';
  var url = SITE + '/firms/';

  // head
  var graph = [
    { '@type': 'ItemList', '@id': url + '#firmlist', name: 'Best futures prop firms ranked — ' + YEAR,
      description: 'PropChamps editorial ranking of the ' + n + ' futures prop trading firms we audit.', numberOfItems: n,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: live.map(function (s, i) { return { '@type': 'ListItem', position: i + 1, url: SITE + PATH_FOR[s], name: FIRMS[s].name }; }) },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Firms', item: url }] }
  ];
  var head = '\n<title>' + esc(title) + '</title>\n<meta name="description" content="' + escAttr(meta) + '">\n' +
    '<link rel="canonical" href="' + url + '">\n<meta property="og:site_name" content="PropChamps">\n' +
    '<meta property="og:title" content="' + escAttr(title) + '">\n<meta property="og:description" content="' + escAttr(meta) + '">\n' +
    '<meta property="og:type" content="website">\n<meta property="og:url" content="' + url + '">\n' +
    '<meta property="og:image" content="' + SITE + '/og-image.jpg">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n' +
    '<meta property="og:image:alt" content="PropChamps — Independent prop firm research">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="' + escAttr(title) + '">\n' +
    '<meta name="twitter:description" content="' + escAttr(meta) + '">\n<meta name="twitter:image" content="' + SITE + '/og-image.jpg">\n' +
    jsonLd({ '@context': 'https://schema.org', '@graph': graph }) + '\n';
  if (!hasRegion(html, 'idxHead')) {
    var a = html.indexOf('<title>'), b = html.indexOf('</script>', html.indexOf('application/ld+json')) + '</script>'.length;
    var robots = (html.slice(a, b).match(/<meta name="robots"[^>]*>/) || ['<meta name="robots" content="index, follow">'])[0];
    html = html.slice(0, a) + '<!--g:idxHead--><!--/g:idxHead-->\n' + robots + html.slice(b);
  }
  html = setRegion(html, 'idxHead', head);
  html = ensureRegion(html, 'idxStyle', /<!-- pc:head -->/, 'before', [
    '<style>',
    '/* generated by tools/build-firm-pages.js */',
    '.hero h1{font-size:clamp(36px,4.3vw,58px);line-height:1.0}',
    '@media(max-width:800px){.hero h1{font-size:clamp(31px,8.2vw,42px)}}',
    '.idx-method{font-size:14.5px;color:var(--text-soft);line-height:1.6;max-width:640px;margin:-6px 0 26px}',
    '.idx-method a{color:var(--lime-text);border-bottom:1px solid var(--border-lime)}',
    '.bf-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--border);border-radius:18px;background:var(--bg-card)}',
    'table.bf-table{width:100%;border-collapse:collapse;font-size:14.5px;min-width:620px}',
    'table.bf-table th,table.bf-table td{text-align:left;padding:14px 18px;border-bottom:1px solid var(--border);vertical-align:top;line-height:1.5}',
    'table.bf-table thead th{background:var(--bg-band);font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--text-faint)}',
    'table.bf-table tbody tr:last-child td,table.bf-table tbody tr:last-child th{border-bottom:0}',
    'table.bf-table tbody th{font-family:var(--font-display);font-size:15.5px;font-weight:700;color:var(--text-strong);white-space:nowrap}',
    'table.bf-table td{color:var(--text-soft)}',
    'table.bf-table td a{color:var(--lime-text);font-weight:600;border-bottom:1px solid var(--border-lime);white-space:nowrap}',
    '.bf-firms{margin-top:6px;font-size:13px;color:var(--text-faint)}',
    '.bf-firms a,table.bf-table td .bf-firms a{color:var(--text);font-weight:500;border-bottom:1px solid var(--border);white-space:normal}',
    '.idx-note{font-family:var(--font-mono);font-size:12px;line-height:1.6;color:var(--text-faint);margin-top:12px}',
    '@media(max-width:640px){table.bf-table{min-width:0}table.bf-table thead{display:none}table.bf-table tr{display:block;padding:16px 18px;border-bottom:1px solid var(--border)}table.bf-table tbody tr:last-child{border-bottom:0}table.bf-table th,table.bf-table td{display:block;border:0;padding:2px 0}table.bf-table td a{display:inline-block;margin-top:6px}}',
    '</style>'].join('\n') + '\n', label);

  // hero
  var heroHtml = '<!-- Hero -->\n<section class="hero">\n  <div class="bg-stack"></div>\n  <div class="container hero-grid">\n   <div class="hero-main">\n\n' +
    '    <div class="pc-eyebrow">Firm rankings · ' + YEAR + '</div>\n' +
    '    <h1>Best Futures Prop Firms (' + YEAR + '): <span class="accent-word">All ' + n + ' Ranked &amp; Compared</span></h1>\n\n' +
    '    <p class="hero-sub">' + n + ' futures prop firms, ranked on rule transparency, payout record and the real price after code CHAMP. Click any firm for the full review: rules, plans, payout rules and what changed.</p>\n' +
    '    <p class="idx-method">How we rank: we check each firm’s plans against its own help center and rulebook, label which numbers are firm-published and which are our estimates, and never take payment for placement. ' + L(U.method, 'Read our methodology') + '.</p>\n\n' +
    '    <div class="hero-cta-row">\n      <a class="btn-primary" href="/compare">\n        Compare all ' + n + ' firms\n        <svg width="16" height="16" viewbox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">\n          <path d="M3 8h10M9 4l4 4-4 4"/>\n        </svg>\n      </a>\n      <a class="btn-text" href="#best-for">Best firm for…</a>\n    </div>\n   </div>\n\n' +
    '    <div class="hero-trust">\n' +
    '      <div class="hero-trust-item"><strong><span class="check">✓</span>' + n + '</strong><span>Firms tracked</span></div>\n' +
    '      <div class="hero-trust-item"><strong>' + plansCount + '</strong><span>Plans compared</span></div>\n' +
    '      <div class="hero-trust-item"><strong>' + shortDate(lastIso).replace(/, \d{4}$/, '') + '</strong><span>Last verified</span></div>\n' +
    '      <div class="hero-trust-item"><strong>$0</strong><span>Paid placements</span></div>\n' +
    '    </div>\n\n  </div>\n</section>\n\n';
  html = ensureSpanRegion(html, 'idxHero', /<!-- Hero -->/, /<!-- Featured firms grid -->/, heroHtml, label);

  // best-for jump table (every /best/ page on disk)
  // [slug pattern, label, what it means, plan attribute, lead-in for the matching firms]
  var BEST_LABELS = [
    [/beginner/, 'Beginners', 'Simple rules and a forgiving first account.', null, ''],
    [/fast-payout|daily-payout/, 'Fast payouts', 'Plans that let you request a payout every day.', 'daily', 'Daily-payout plans at'],
    [/no-daily-loss|no-dll/, 'No daily loss limit', 'Only the max drawdown can end your day.', 'noDllAll', 'No DLL at any stage on a plan at'],
    [/no-consistency/, 'No consistency rule', 'No cap on how much of your profit one day can be.', 'noConsAll', 'No rule at any stage on a plan at'],
    [/instant/, 'Instant funding', 'Skip the evaluation and start on a funded account.', 'instant', 'Straight-to-funded plans at'],
    [/cheapest|cost/, 'Lowest price', 'The cheapest way in once code CHAMP is applied.', null, '']
  ];
  var bestRows = listHtml('best').filter(function (n2) { return exists('/best/' + n2.replace(/\.html$/, '')); }).map(function (file2) {
    var nm = file2.replace(/\.html$/, ''), u2 = '/best/' + nm;
    var hit = BEST_LABELS.filter(function (x) { return x[0].test(nm); })[0];
    var lab = hit ? hit[1] : (readH1(fileForUrl(u2)) || titleCase(nm.replace(/-/g, ' ')));
    var what = hit ? hit[2] : '';
    var firms = hit && hit[3] ? live.filter(function (s) { return attrs(FIRMS[s])[hit[3]]; }).map(function (s) { return '<a href="' + PATH_FOR[s] + '">' + (SHORT[s] || FIRMS[s].name) + '</a>'; }).join(', ') : '';
    return { order: hit ? BEST_LABELS.indexOf(hit) : 99, row: [lab, what + (firms ? '<div class="bf-firms">' + hit[4] + ': ' + firms + '</div>' : ''), '<a href="' + u2 + '">See the list →</a>'] };
  }).sort(function (x, y) { return x.order - y.order; });
  var bestHtml = '\n<section class="block" id="best-for">\n  <div class="container">\n    <div class="section-head">\n      <div class="lhs">\n' +
    '        <div class="section-eyebrow">Best for …</div>\n        <h2>The best futures prop firm for you.</h2>\n' +
    '        <p>Jump straight to the ranked list for what matters most to you. Matching firms are worked out from each firm’s current plan rules.</p>\n      </div>\n    </div>\n' +
    '    <div class="bf-wrap"><table class="bf-table"><thead><tr><th scope="col">Best for</th><th scope="col">What it means</th><th scope="col">Ranked list</th></tr></thead><tbody>' +
    bestRows.map(function (x) { return '<tr><th scope="row">' + x.row[0] + '</th><td>' + x.row[1] + '</td><td>' + x.row[2] + '</td></tr>'; }).join('') +
    '</tbody></table></div>\n  </div>\n</section>\n\n';
  html = ensureRegion(html, 'idxBestFor', /<!-- Featured firms grid -->/, 'before', bestHtml, label);

  // static ranking rows (same markup as the inline JS, honest labels)
  var FLAGS = { US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦', AE: '🇦🇪' };
  function stars(rt) { var full = Math.floor(rt), half = (rt % 1) >= 0.5, s = ''; for (var i = 0; i < 5; i++) s += i < full ? '★' : (i === full && half ? '½' : '☆'); return s; }
  function deal(f) { var line = f.offerLine || ''; var m = line.match(/(\d+%\s*OFF)/i); if (m) return m[1].toUpperCase(); var d = line.match(/(\$\d+\s*OFF)/i); return d ? d[1].toUpperCase() : 'Active at checkout'; }
  // largest account size across plansSummary (firms.js maxAllocation mixes per-account and multi-account totals)
  function largestSize(f) {
    var mx = 0;
    (f.plansSummary || []).forEach(function (pl) {
      (String((pl.rules || {})['Account Sizes'] || '').match(/\d+(?=K)/g) || []).forEach(function (k) { mx = Math.max(mx, +k); });
    });
    return mx ? '$' + mx + 'K' : (f.maxAllocation || '—');
  }
  function payoutsCell(s, f) {
    if (s === 'lucid-trading') return '<div class="t-value">Under review</div><div class="t-value-sub">Not yet verified</div>';
    return '<div class="t-value">' + (f.payoutTotal || '—') + '</div><div class="t-value-sub">Firm-published' + (s === 'fundednext' ? ', all programs' : '') + '</div>';
  }
  var rows = live.map(function (s, i) {
    var f = FIRMS[s], page = PATH_FOR[s], flag = FLAGS[f.country] || '', pl = (f.platformsList || []).slice();
    var pills = pl.slice(0, 3).map(function (x) { return '<span class="t-platform">' + x + '</span>'; }).join('') + (pl.length > 3 ? '<span class="t-platform more">+' + (pl.length - 3) + '</span>' : '');
    return '<tr data-href="' + page + '">' +
      '<td class="col-rank"><div class="t-rank"><span class="t-rank-num">' + (i + 1) + '</span><span class="t-rank-label">' + (labels[s] || '') + '</span></div></td>' +
      '<td class="col-firm"><div class="t-firm"><div class="t-firm-logo"><img src="' + f.logo + '" alt="' + escAttr(f.name) + '"></div><div class="t-firm-info"><div class="t-firm-name"><a href="' + page + '">' + f.name + '</a>' + (flag ? '<span class="t-firm-flag" title="' + f.country + '">' + flag + '</span>' : '') + '</div></div></div></td>' +
      '<td class="col-rating"><div class="t-rating"><div class="t-rating-stars"><span class="num">' + Number(f.rating || 0).toFixed(1) + '</span><span class="stars">' + stars(f.rating || 0) + '</span></div><div class="t-rating-reviews">PropChamps rating</div></div></td>' +
      '<td class="col-platforms"><div class="t-platforms">' + pills + '</div></td>' +
      '<td class="col-alloc"><div class="t-value">' + largestSize(f) + '</div><div class="t-value-sub">Largest account</div></td>' +
      '<td class="col-payouts">' + payoutsCell(s, f) + '</td>' +
      '<td class="col-deal"><div class="t-deal"><div class="t-deal-headline">' + deal(f) + '</div><button type="button" class="t-deal-chip js-copy-champ" data-copy="CHAMP" aria-label="Copy discount code CHAMP">CHAMP<span class="copy-hint">· COPY</span></button></div></td>' +
      '<td class="col-action"><a class="t-action" href="' + page + '" aria-label="Read the ' + escAttr(f.name) + ' review">→</a></td></tr>';
  }).join('');
  if (!hasRegion(html, 'firmsRows')) html = html.replace('<tbody id="firmsTableBody"></tbody>', '<tbody id="firmsTableBody"><!--g:firmsRows--><!--/g:firmsRows--></tbody>');
  html = setRegion(html, 'firmsRows', rows);
  html = html.replace('<th class="col-payouts">Payouts tracked</th>', '<th class="col-payouts">Total payouts</th>');
  html = html.replace('<h2>This week&rsquo;s ranking.</h2>', '<h2>All ' + n + ' firms, ranked.</h2>');
  html = html.replace('<p>Ranked by current rule transparency, payout consistency, and active discount value. Updated weekly.</p>',
    '<p>Our editorial ranking: rule transparency, payout record and the value of the active discount. Payout totals are the firms’ own published figures.</p>');

  // top pick (generated from firms.js: Apex = biggest CHAMP discount)
  var top = live.slice().sort(function (x, y) { return (parseInt(FIRMS[y].offerLine, 10) || 0) - (parseInt(FIRMS[x].offerLine, 10) || 0); })[0];
  var tf = FIRMS[top];
  var topPoints = top === 'apex-trader' ? [
    '50K list evaluation: ' + money(DP(tf, /^Intraday/, /^Eval Price/))[1] + ' Intraday Standard, ' + money(DP(tf, /^EOD/, /^Eval Price/))[1] + ' EOD Standard (before CHAMP, Oct 5, 2026 audit)',
    'One-time fee, no rebill, evaluation active 30 days, no resets',
    'Drawdown $1,000-$4,000 · EOD Trail DLL $500-$2,000 · 1-day pass',
    '100% payouts every 5 trading days, up to 6 per PA · up to 20 PAs'
  ] : (tf.highlights || []);
  var topHtml = '<!-- Top Pick featured card -->\n<section class="block">\n  <div class="container">\n    <div class="section-head">\n      <div class="lhs">\n' +
    '        <div class="section-eyebrow">Biggest CHAMP discount</div>\n        <h2>The biggest active discount.</h2>\n' +
    '        <p>Code CHAMP’s largest discount is at ' + tf.name + ': ' + (tf.offerLine || '').toLowerCase() + ' the evaluation, per our firm data. ' +
    (top === 'apex-trader' ? 'Coupon codes don’t cover the PA activation fee; the No-Activation-Fee build avoids it for a higher evaluation price.' : '') + '</p>\n      </div>\n' +
    '      <div class="rhs">Data as of ' + shortDate(reviewedISO(top, tf)) + '</div>\n    </div>\n\n' +
    '    <article class="top-pick-card">\n      <div class="top-pick-left">\n        <div class="top-pick-badge">Biggest discount · ' + (tf.offerLine || '') + '</div>\n' +
    '        <div class="top-pick-head">\n          <div class="top-pick-logo"><img src="' + tf.logo + '" alt="' + escAttr(tf.name) + '"></div>\n' +
    '          <div>\n            <div class="top-pick-name">' + tf.name + '</div>\n            <div class="top-pick-sub">' + (tf.type || '') + '</div>\n          </div>\n        </div>\n' +
    '        <p class="top-pick-blurb">' + esc(tf.offerSub || '') + '</p>\n' +
    '        <ul class="top-pick-points">\n' + topPoints.map(function (x) { return '          <li class="top-pick-point">' + x + '</li>\n'; }).join('') + '        </ul>\n      </div>\n' +
    '      <div class="top-pick-right">\n        <div class="top-pick-deal">\n          <div class="deal-label">With code CHAMP</div>\n          <div class="deal-big">' + (tf.offerLine || '') + '</div>\n' +
    '          <div class="deal-code js-copy-champ" title="Click to copy">Code: CHAMP <span class="copy-hint">click to copy</span></div>\n' +
    '          <div class="deal-detail">' + (tf.type || '') + ' · confirm the final price at checkout.</div>\n        </div>\n' +
    '        <div class="top-pick-actions">\n          <a class="btn-primary" href="/deals">\n            See every deal\n            <svg width="16" height="16" viewbox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">\n              <path d="M3 8h10M9 4l4 4-4 4"/>\n            </svg>\n          </a>\n' +
    '          <a class="btn-text" href="' + PATH_FOR[top] + '">Read full review</a>\n        </div>\n      </div>\n    </article>\n  </div>\n</section>\n\n';
  html = ensureSpanRegion(html, 'idxTopPick', /<!-- Top Pick featured card -->/, /<!-- Value props -->/, topHtml, label);

  // value props: process claims the site can stand behind (mirrors /methodology). The old
  // template promised weekly audits, a 72h/38h publish time and "100% codes verified every
  // Monday", none of which our data supports (CHAMP rates are the rate on file, confirmed
  // at checkout).
  var champFirms = live.filter(function (s) { return ((FIRMS[s].promo || {}).code || '').toUpperCase() === 'CHAMP'; }).length;
  function valueCard(num, eyebrow, h, body, stat, statLabel) {
    return '      <div class="value-card">\n        <div class="value-head">\n          <div class="value-numeral">' + num + '</div>\n          <div class="value-eyebrow">' + eyebrow + '</div>\n        </div>\n' +
      '        <h3>' + h + '</h3>\n        <p>' + body + '</p>\n        <div class="value-stat">\n          <strong>' + stat + '</strong>\n          <span>' + statLabel + '</span>\n        </div>\n      </div>\n';
  }
  var valuesHtml = '<!-- Value props -->\n<section class="block tinted">\n  <div class="container">\n    <div class="section-head">\n      <div class="lhs">\n' +
    '        <div class="section-eyebrow">Why traders trust us</div>\n        <h2>Independent. Dated. Sourced.</h2>\n' +
    '        <p>Prop firms change rules quietly. We check each firm against its own help center in dated passes, log every correction, and say so when a firm blocks our check.</p>\n      </div>\n    </div>\n\n    <div class="values-grid">\n\n' +
    valueCard('01', 'Dated audits', 'Every rule change is dated.',
      'Each pass reads the firm’s own help center and site. When something shifts (payout cadence, drawdown method, news restrictions) we correct our data and log the change, with its date, in the ' + L(U.audit, 'audit log') + '.',
      shortDate(lastIso).replace(/, \d{4}$/, ''), 'Latest help-center check') + '\n' +
    valueCard('02', 'Editorial independence', 'No paid placements.',
      'Our rank is an editorial score built on rule transparency, payout reliability, discount value and program flexibility. Affiliate links pay our bills; firms cannot pay to move up.',
      '$0', 'Ranking fees accepted from firms') + '\n' +
    valueCard('03', 'Discount codes', 'One code at every firm we cover.',
      'CHAMP is our affiliate code. The discount we list is the rate on file with each firm, and the final price shows at checkout. When a firm’s own public code is bigger, we say so.',
      champFirms + ' / ' + n, 'Firms that take code CHAMP') +
    '\n    </div>\n  </div>\n</section>\n\n\n\n';
  html = ensureSpanRegion(html, 'idxValues', /<!-- Value props -->/, /<!-- Newsletter band -->/, valuesHtml, label);
  // newsletter: drop the unverified subscriber count
  html = html.replace('No spam. ~800 subscribers. We don\'t share your email.', 'No spam. We don\'t share your email.');

  // what changed at the latest verification (from the firms.js Oct 23 header)
  var CHANGES = [
    ['tradeify', 'rule', 'Lightning pays every 5 days, not on demand', 'Lightning is instant funding, but payouts follow a 5-day cadence: a payout profit goal plus 20% / 25% / 30% consistency, with a $1,000 minimum.'],
    ['top-one-futures', 'promo', 'Elite Access: $39 evaluation, activation after you pass', 'The evaluation is $39 at every size; $139 / $189 / $259 / $359 is the activation fee after passing. Funded accounts carry a soft DLL.'],
    ['alpha-futures', 'rule', 'Account limits and resets corrected', 'Qualified-account limits are now per plan (Zero 5, Standard 5, Direct 5, Advanced 3). The $79-$289 resets are evaluation resets; qualified resets cost $399-$999.'],
    ['lucid-trading', 'rule', 'Flex and Daily evaluations now 40% consistency', 'The evaluation consistency rule on Flex and Daily is 40% as standard; 50% is a paid add-on. Pro and Direct have no fixed payout window.'],
    ['my-funded-futures', 'rule', 'Pro contract limits are 3 / 6 / 9 minis', 'Pro max contracts are 3 / 6 / 9 minis (50K-150K), payouts run every 14 days, and the Builder 150K cap is $4,500 per cycle.'],
    ['take-profit', 'feature', 'One 14-platform list', 'Take Profit Trader supports 14 platforms across CQG and Rithmic, including MotiveWave. The public code at our check was NOFEE40.']
  ];
  var TAGN = { rule: 'Rule change', promo: 'Pricing', feature: 'Platforms' };
  var changesHtml = '<!-- Recently updated changelog -->\n<section class="block">\n  <div class="container">\n    <div class="section-head">\n      <div class="lhs">\n' +
    '        <div class="section-eyebrow">Latest verification</div>\n        <h2>What changed at our ' + shortDate(REVIEWED['default']) + ' check.</h2>\n' +
    '        <p>We re-read the firms’ help centers (Apex’s site and Tradeify’s help center blocked our check, so those values come from search-index copies) and corrected these rules in our data. Every change is dated in the audit log.</p>\n      </div>\n' +
    '      <div class="rhs">' + L(U.audit, 'Full audit log') + '</div>\n    </div>\n\n    <div class="updates-grid">\n' +
    CHANGES.filter(function (x) { return FIRMS[x[0]]; }).map(function (x) {
      var f = FIRMS[x[0]];
      return '      <article class="update-card">\n        <div class="update-card-head">\n          <span class="update-date">' + shortDate(REVIEWED['default']) + '</span>\n          <span class="update-tag ' + x[1] + '">' + TAGN[x[1]] + '</span>\n        </div>\n' +
        '        <div class="update-firm">\n          <div class="update-firm-logo"><img src="' + f.logo + '" alt=""></div>\n          <span class="update-firm-name">' + f.name + '</span>\n        </div>\n' +
        '        <div class="update-title">' + x[2] + '</div>\n        <p class="update-detail">' + x[3] + '</p>\n        <a class="update-link" href="' + PATH_FOR[x[0]] + '">Read the review</a>\n      </article>\n';
    }).join('') + '    </div>\n  </div>\n</section>\n\n';
  html = ensureSpanRegion(html, 'idxChanges', /<!-- Recently updated changelog -->/, /<!-- pc:footer/, changesHtml, label);

  // inline JS: keep the static rows; mirror the honest labels if it ever re-renders
  html = html.replace(/(?:if \(!body\.querySelector\('tr\[data-href\]'\)\) )*body\.innerHTML = html;/, "if (!body.querySelector('tr[data-href]')) body.innerHTML = html;");
  html = html.replace("(f.reviewCount?f.reviewCount+' reviews':'New listing')", "'PropChamps rating'");
  html = html.replace("if (/90%\\s*OFF/i.test(line)) return '90% off + $0 activation';\n", '');
  html = html.replace(/'<tr data-href="\/firms\/'\+page\+'">'/, "'<tr data-href=\"/firms/'+page+'\">'");
  html = html.replace(/href="\/firms\/([a-z0-9-]+)\.html"/g, 'href="/firms/$1"');

  REPORT.push({ file: 'firms/index.html', title: title, meta: meta, best: bestRows.map(function (x) { return x.row[2].match(/href="([^"]+)"/)[1]; }) });
  if (html !== before) { fs.writeFileSync(file, html); console.log('  ✓ index.html  (' + Math.round(html.length / 1024) + 'kb)'); built++; }
  else console.log('  · unchanged index.html');
})();

// ---------------------------------------------------------------------------
// Validation: fail the build on SEO-contract violations
// ---------------------------------------------------------------------------
var problems = [];
REPORT.forEach(function (r) {
  var html = fs.readFileSync(path.join(ROOT, r.file), 'utf8');
  var t = plain((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
  var d = decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  if (t.length > 60) problems.push(r.file + ': title ' + t.length + ' chars');
  if (d.length > 155) problems.push(r.file + ': meta ' + d.length + ' chars');
  var h1s = html.match(/<h1\b/g) || [];
  if (h1s.length !== 1) problems.push(r.file + ': ' + h1s.length + ' <h1>');
  var blocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
  blocks.forEach(function (bk) { try { JSON.parse(bk.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '')); } catch (e) { problems.push(r.file + ': JSON-LD does not parse (' + e.message + ')'); } });
  if (/aggregateRating/.test(html)) problems.push(r.file + ': aggregateRating still present');
  if (/href="\/firms\/[a-z0-9-]+\.html"/.test(html)) problems.push(r.file + ': .html firm link');
  r.titleLen = t.length; r.metaLen = d.length;
});
WARN.forEach(function (w) { console.warn('  ! ' + w); });
REPORT.forEach(function (r) { console.log('  ' + r.file + '  title ' + r.titleLen + ' · meta ' + r.metaLen + (r.vs ? ' · vs ' + r.vs.length + ' · subpages ' + r.subs.length + ' · guides ' + r.guides.length : ' · best-for ' + (r.best || []).length)); });
if (problems.length) { console.error('\nFAILED:\n  ' + problems.join('\n  ')); process.exit(1); }
console.log('\nDone. ' + built + ' built, ' + skipped + ' skipped.');
