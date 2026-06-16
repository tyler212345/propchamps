#!/usr/bin/env node
/**
 * build-firm-pages.js — Pre-render firm review pages from data/firms.js.
 *
 * WHY THIS EXISTS
 *   Firm pages are otherwise 100% client-side rendered: the HTML ships with
 *   empty containers that an inline <script> fills from window.FIRMS. If
 *   Googlebot can't run that JS — or is slow to — it sees an empty shell
 *   (worse: the old fallback wiped <main> to "Firm not found") and files the
 *   page as a SOFT 404. That's exactly what happened: /data/ was disallowed in
 *   robots.txt, so Google could never fetch firms.js, and every firm page got
 *   flagged.
 *
 *   This script bakes each firm's content into the static HTML so the page is
 *   full of real text on first byte, no JS required. The existing inline JS
 *   still runs on top to re-populate + wire up interactivity (copy code, menu).
 *
 * USAGE
 *   node tools/build-firm-pages.js        # run after any firms.js change
 *
 * It is IDEMPOTENT — content is wrapped in <!--g:id--> markers, so re-running
 * just refreshes between the markers. Safe to run repeatedly.
 *
 * data/firms.js stays the single source of truth.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const FIRMS_JS = path.join(ROOT, 'data', 'firms.js');
const FIRMS_DIR = path.join(ROOT, 'firms');

// --- load firms.js in a sandbox that only provides `window` ---
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(FIRMS_JS, 'utf8'), sandbox);
const FIRMS = sandbox.window.FIRMS;
if (!FIRMS) { console.error('Could not load window.FIRMS from data/firms.js'); process.exit(1); }

// slug -> html filename (note: the "take-profit" slug lives in take-profit-trader.html)
const FILE_FOR = {
  'tradeify': 'tradeify.html',
  'lucid-trading': 'lucid-trading.html',
  'alpha-futures': 'alpha-futures.html',
  'apex-trader': 'apex-trader.html',
  'take-profit': 'take-profit-trader.html',
  'top-one-futures': 'top-one-futures.html',
  'my-funded-futures': 'my-funded-futures.html'
};
// slug -> clean URL path (no .html), used for related-firm links
const PATH_FOR = {};
Object.keys(FILE_FOR).forEach(function (s) { PATH_FOR[s] = '/firms/' + FILE_FOR[s].replace(/\.html$/, ''); });

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- render the dynamic blocks for one firm, mirroring the inline page JS ---
function render(slug, f) {
  var out = {};
  out.bcCurrent   = esc(f.name);
  out.firmTagline = esc(f.tagline || f.summary || f.type || '');
  out.firmCode    = esc((f.promo && f.promo.code) || 'CHAMP');
  out.firmOffer   = esc(f.offerLine || 'See firm');
  out.firmSummary = esc(f.summary || '');
  out.ctaTitle    = esc('Ready to fund a ' + f.name + ' account?');
  out.logo        = f.logo || '';
  out.logoAlt     = esc(f.name + ' logo');
  out.affiliate   = f.affiliateUrl || '#';

  // summary grid (from stats; fall back to boxPreviews like the page JS does)
  var stats = (f.stats || []).slice();
  if (stats.length === 0 && f.boxPreviews) {
    Object.keys(f.boxPreviews).forEach(function (k) {
      stats.push([k.charAt(0).toUpperCase() + k.slice(1), f.boxPreviews[k]]);
    });
  }
  out.summaryGrid = stats.slice(0, 6).map(function (s) {
    return '<div class="summary-card"><div class="summary-card-label">' + s[0] +
      '</div><div class="summary-card-value">' + s[1] + '</div></div>';
  }).join('');

  // plans (compact plansSummary rules object -> rows)
  var plans = f.plansSummary || f.plansDetailed || [];
  out.plansGrid = plans.slice(0, 4).map(function (p) {
    var feat = p.featured ? ' featured' : '';
    var rules = '';
    if (Array.isArray(p.rules)) {
      rules = p.rules.slice(0, 20).map(function (r) {
        return '<div class="plan-rule"><span class="plan-rule-label">' + r[0] +
          '</span><span class="plan-rule-value">' + r[1] + '</span></div>';
      }).join('');
    } else if (p.rules && typeof p.rules === 'object') {
      rules = Object.keys(p.rules).slice(0, 20).map(function (k) {
        return '<div class="plan-rule"><span class="plan-rule-label">' + k +
          '</span><span class="plan-rule-value">' + p.rules[k] + '</span></div>';
      }).join('');
    }
    return '<div class="plan-card' + feat + '"><h3 class="plan-name">' + p.name +
      '</h3><div class="plan-rules">' + rules + '</div></div>';
  }).join('');

  // best for / watch out
  out.bestForList = (f.bestFor || f.highlights || []).slice(0, 5)
    .map(function (b) { return '<li>' + b + '</li>'; }).join('');
  var cautions = [];
  if (f.warning) cautions.push(f.warning);
  if (f.note) cautions.push(f.note);
  if (cautions.length === 0) cautions = [
    'Read full rules at the firm before funding — terms can change weekly.',
    'Trading futures involves substantial risk of loss.'
  ];
  out.watchList = cautions.map(function (c) { return '<li>' + c + '</li>'; }).join('');

  // related firms (live, not self) with clean-URL links
  var related = Object.values(FIRMS).filter(function (o) { return o && o.live !== false && o.slug !== slug; });
  out.relatedGrid = related.slice(0, 6).map(function (o) {
    var page = PATH_FOR[o.slug] || '#';
    return '<a class="related-card" href="' + page + '"><div class="related-logo"><img src="' + o.logo +
      '" alt=""></div><div><div class="related-name">' + o.name +
      '</div><div class="related-meta">' + (o.type || '') + '</div></div></a>';
  }).join('');

  return out;
}

// --- idempotent injection helpers ---
var TAG = {
  bcCurrent: 'a', firmTagline: 'p', firmCode: 'div', firmOffer: 'div',
  firmSummary: 'p', ctaTitle: 'h3',
  summaryGrid: 'div', plansGrid: 'div', bestForList: 'ul', watchList: 'ul', relatedGrid: 'div'
};
// NOTE: all dynamic content is spliced in via FUNCTION replacers (or $-escaped),
// because firm data is full of "$1,500"/"$2,000" — and in a String.replace
// replacement STRING, $1/$2 mean capture-group backreferences. Function
// replacers insert their return value literally, sidestepping that entirely.
function dollar(s) { return String(s).replace(/\$/g, '$$$$'); } // safe inside a replacement string
function injectInner(html, id, content) {
  var open = '<!--g:' + id + '-->', close = '<!--/g:' + id + '-->';
  var marker = new RegExp('(<!--g:' + id + '-->)[\\s\\S]*?(<!--/g:' + id + '-->)');
  if (marker.test(html)) return html.replace(marker, function (m, g1, g2) { return g1 + content + g2; });
  var tag = TAG[id];
  var first = new RegExp('(<' + tag + '\\b[^>]*\\bid="' + id + '"[^>]*>)[\\s\\S]*?(</' + tag + '>)');
  return html.replace(first, function (m, g1, g2) { return g1 + open + content + close + g2; });
}
function setImg(html, logo, alt) {
  return html.replace(/<img\b[^>]*\bid="firmLogo"[^>]*>/, function (tag) {
    return tag.replace(/\ssrc="[^"]*"/, ' src="' + dollar(logo) + '"').replace(/\salt="[^"]*"/, ' alt="' + dollar(alt) + '"');
  });
}
function setHref(html, id, url) {
  return html.replace(new RegExp('<a\\b[^>]*\\bid="' + id + '"[^>]*>'), function (tag) {
    return tag.replace(/\shref="[^"]*"/, ' href="' + dollar(url) + '"');
  });
}
function patchGuard(html) {
  // Old fallback nuked <main> to "Firm not found" when firms.js was missing.
  // Keep the pre-rendered static content instead.
  return html.replace(
    /if\(!f\)\{document\.querySelector\('main'\)\.innerHTML='[^;]*';return;\}/,
    "if(!f){return;}/* firms.js missing — keep the pre-rendered static content */"
  );
}
function patchPageMap(html) {
  // Related-firm links should be clean URLs (match the static pre-render + canonicals).
  return html.replace(
    /var pageMap=\{[^}]*\};/,
    "var pageMap={'lucid-trading':'lucid-trading','tradeify':'tradeify','alpha-futures':'alpha-futures','apex-trader':'apex-trader','my-funded-futures':'my-funded-futures','top-one-futures':'top-one-futures','take-profit':'take-profit-trader'};"
  );
}

// --- build all pages ---
var built = 0, skipped = 0;
Object.keys(FILE_FOR).forEach(function (slug) {
  var f = FIRMS[slug];
  if (!f) { console.log('  SKIP (no data): ' + slug); skipped++; return; }
  var file = path.join(FIRMS_DIR, FILE_FOR[slug]);
  var before = fs.readFileSync(file, 'utf8');
  var r = render(slug, f);
  var html = before;

  html = injectInner(html, 'bcCurrent', r.bcCurrent);
  html = injectInner(html, 'firmTagline', r.firmTagline);
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
  html = setHref(html, 'firmAffiliate', r.affiliate);
  html = setHref(html, 'ctaAffiliate', r.affiliate);
  html = patchGuard(html);
  html = patchPageMap(html);

  var plans = (f.plansSummary || f.plansDetailed || []).slice(0, 4).length;
  if (html !== before) {
    fs.writeFileSync(file, html);
    console.log('  ✓ ' + FILE_FOR[slug] + '  (' + plans + ' plans, ' + Math.round(html.length / 1024) + 'kb)');
    built++;
  } else {
    console.log('  · unchanged ' + FILE_FOR[slug]);
  }
});
console.log('\nDone. ' + built + ' built, ' + skipped + ' skipped.');
