#!/usr/bin/env node
/**
 * build-content-pages.js — Pre-render the data-driven utility pages
 * (/deals, /payouts, /audit-log, /compare) from data/firms.js +
 * data/changelog.js into static HTML.
 *
 * WHY: like the firm pages, these were thin client-side-rendered shells —
 * the content only appeared after JS ran. Google's audit flagged them as
 * the prime "Crawled – currently not indexed" risk. This bakes each page's
 * content into the static HTML (matching what the inline JS renders), so
 * there's real content on first byte. The page's own JS still hydrates on top.
 *
 * Companion to tools/build-firm-pages.js — run BOTH after any data change:
 *   node tools/build-firm-pages.js && node tools/build-content-pages.js
 *
 * Idempotent — content lives between <!--g:id-->…<!--/g:id--> markers.
 * data/firms.js + data/changelog.js stay the single source of truth.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', 'firms.js'), 'utf8'), sandbox);
try { vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', 'changelog.js'), 'utf8'), sandbox); } catch (e) {}
const FIRMS = sandbox.window.FIRMS;
const CHANGELOG = sandbox.window.CHANGELOG || [];
if (!FIRMS) { console.error('Could not load window.FIRMS from data/firms.js'); process.exit(1); }

// Object.values insertion order, live firms only — matches every page's JS
const LIVE = Object.values(FIRMS).filter(function (f) { return f && f.live !== false; });

// ---------- shared, idempotent injection (same approach as build-firm-pages.js) ----------
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
var TAG = {
  dealsGrid: 'div',
  payoutsTableBody: 'tbody', totalTracked: 'div', totalCount: 'div', fastestTime: 'div', fastestName: 'div', avgPayout: 'div',
  entries: 'div', statTotal: 'strong', statFirms: 'strong', statYTD: 'strong', statLast: 'strong', resultsCount: 'strong',
  firmsGrouped: 'div', visibleFirms: 'strong', visiblePlans: 'strong'
};
function injectInner(html, id, content) {
  // function replacers insert literally — firm data is full of "$1,500", which
  // would otherwise be read as $1/$2 backreferences in a replacement string.
  var open = '<!--g:' + id + '-->', close = '<!--/g:' + id + '-->';
  var marker = new RegExp('(<!--g:' + id + '-->)[\\s\\S]*?(<!--/g:' + id + '-->)');
  if (marker.test(html)) return html.replace(marker, function (m, g1, g2) { return g1 + content + g2; });
  var tag = TAG[id];
  var first = new RegExp('(<' + tag + '\\b[^>]*\\bid="' + id + '"[^>]*>)[\\s\\S]*?(</' + tag + '>)');
  return html.replace(first, function (m, g1, g2) { return g1 + open + content + close + g2; });
}
function writeChanged(file, before, html, label) {
  if (html !== before) { fs.writeFileSync(file, html); console.log('  ✓ ' + label); return 1; }
  console.log('  · unchanged ' + label); return 0;
}
function read(p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); }

// ============================ /deals ============================
function parseOffer(f) {
  var line = (f.offerLine || '').trim();
  var m = line.match(/(\d+%|FREE)\s*OFF/i);
  if (m) { return { big: m[1].toUpperCase() + ' OFF', rest: line.replace(m[0], '').replace(/^\s*[\(]|[\)]\s*$/g, '').trim() }; }
  if (/code\s+champ/i.test(line)) { return { big: 'CHAMP', rest: line.replace(/Use\s*Code\s*CHAMP/i, '').trim() }; }
  return { big: line || 'CHAMP', rest: '' };
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
      '<div class="deal-card-offer"><span class="accent">' + offer.big + '</span></div>' +
      (offer.rest || f.offerSub ? '<div class="deal-card-offersub">' + (offer.rest || f.offerSub || '') + '</div>' : '') +
      (tags ? '<div class="deal-card-tags">' + tags + '</div>' : '') +
      '<div class="deal-card-foot"><span class="deal-code-chip js-copy-champ">' + code + ' · COPY</span>' +
      '<span class="deal-view-hint">View accounts &amp; rules</span></div>' +
      '</article>';
  }).join('');
  html = injectInner(html, 'dealsGrid', cards);
  return writeChanged(file, before, html, 'deals.html (' + LIVE.length + ' deal cards)');
}

// ============================ /payouts ============================
function buildPayouts() {
  var file = path.join(ROOT, 'payouts.html'); var before = read('payouts.html'); var html = before;
  function parseAmount(s) { if (!s) return 0; var clean = ('' + s).replace(/[$,+]/g, '').toUpperCase(); var n = parseFloat(clean); if (isNaN(n)) return 0; if (/K\b/.test(clean)) n *= 1e3; else if (/M\b/.test(clean)) n *= 1e6; else if (/B\b/.test(clean)) n *= 1e9; return n; }
  function parseTimeMinutes(s) { if (!s) return 9999; var l = ('' + s).toLowerCase(); var m = l.match(/(\d+\.?\d*)\s*(hour|hr|h|day|d|min|m|week|w)/); if (!m) return 9999; var n = parseFloat(m[1]), unit = m[2]; if (unit.startsWith('min') || unit === 'm') return n; if (unit.startsWith('h')) return n * 60; if (unit.startsWith('d')) return n * 60 * 24; if (unit.startsWith('w')) return n * 60 * 24 * 7; return 9999; }
  function fmtMoney(n) { if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B'; if (n >= 1e6) return '$' + Math.round(n / 1e6) + 'M'; if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K'; return '$' + Math.round(n); }
  function fmtCount(n) { if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (n >= 1e3) return Math.round(n / 1e3) + 'K'; return '' + Math.round(n); }
  function stars(r) { var f = Math.floor(r), h = (r % 1) >= 0.5, s = ''; for (var i = 0; i < 5; i++) { s += i < f ? '★' : (i === f && h ? '½' : '☆'); } return s; }
  var firms = LIVE.map(function (f) { return f; });
  firms.forEach(function (f) { f._tot = parseAmount(f.payoutTotal); f._cnt = parseAmount(f.payoutCount); f._avg = parseAmount(f.payoutAvg); f._t = parseTimeMinutes(f.payoutMedianTime); });
  firms.sort(function (a, b) { return b._tot - a._tot; });
  var sumTotal = firms.reduce(function (s, f) { return s + f._tot; }, 0);
  var sumCount = firms.reduce(function (s, f) { return s + f._cnt; }, 0);
  var fastest = firms.reduce(function (min, f) { return f._t < min._t ? f : min; }, firms[0]);
  var avgPayout = firms.length ? firms.reduce(function (s, f) { return s + f._avg; }, 0) / firms.length : 0;
  var minTime = Math.min.apply(null, firms.map(function (f) { return f._t; }));
  var maxTime = Math.max.apply(null, firms.map(function (f) { return f._t; }));
  function timeBarPct(t) { if (maxTime === minTime) return 50; return Math.max(8, Math.round(100 * (1 - (t - minTime) / (maxTime - minTime)))); }
  function timeBarClass(t) { var oneDay = 60 * 24; if (t <= 6 * 60) return 'time-fill-fast'; if (t <= oneDay) return 'time-fill-medium'; if (t <= 3 * oneDay) return 'time-fill-slow'; return 'time-fill-slowest'; }
  var FLAGS = { US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦' };
  var PAGES = { 'lucid-trading': 'lucid-trading.html', 'tradeify': 'tradeify.html', 'alpha-futures': 'alpha-futures.html', 'apex-trader': 'apex-trader.html', 'my-funded-futures': 'my-funded-futures.html', 'top-one-futures': 'top-one-futures.html', 'take-profit': 'take-profit-trader.html' };
  var rows = firms.map(function (f) {
    var page = PAGES[f.slug] || '#'; var flag = FLAGS[f.country] || ''; var rating = f.rating || 0;
    var pct = timeBarPct(f._t); var barCls = timeBarClass(f._t);
    return '<tr data-href="/firms/' + page + '">' +
      '<td class="col-firm"><div class="p-firm"><div class="p-firm-logo"><img src="' + f.logo + '" alt="' + f.name + '"></div>' +
      '<div><div class="p-firm-name">' + f.name + (flag ? '<span class="p-firm-flag">' + flag + '</span>' : '') + '</div>' +
      '<div class="p-firm-rating"><span class="stars">' + stars(rating) + '</span>' + rating.toFixed(1) + ' · ' + (f.reviewCount || 0) + ' reviews</div></div></div></td>' +
      '<td class="col-total"><div class="p-value lime">' + (f.payoutTotal || '—') + '</div><div class="p-value-sub">Verified</div></td>' +
      '<td class="col-count"><div class="p-value">' + (f.payoutCount || '—') + '</div><div class="p-value-sub">Payouts</div></td>' +
      '<td class="col-largest"><div class="p-value">' + (f.payoutLargest || '—') + '</div><div class="p-value-sub">Single</div></td>' +
      '<td class="col-avg"><div class="p-value">' + (f.payoutAvg || '—') + '</div><div class="p-value-sub">Per payout</div></td>' +
      '<td class="col-time"><div class="time-bar"><div class="time-bar-label"><span>' + (f.payoutMedianTime || '—') + '</span></div>' +
      '<div class="time-bar-rail"><div class="time-bar-fill ' + barCls + '" style="width:' + pct + '%"></div></div>' +
      '<div class="time-bar-scale"><span>Fast</span><span>Slow</span></div></div></td>' +
      '<td class="col-action"><span class="p-action" aria-label="Open firm review">→</span></td></tr>';
  }).join('');
  html = injectInner(html, 'payoutsTableBody', rows);
  html = injectInner(html, 'totalTracked', fmtMoney(sumTotal));
  html = injectInner(html, 'totalCount', fmtCount(sumCount));
  html = injectInner(html, 'fastestTime', esc(fastest.payoutMedianTime || '—'));
  html = injectInner(html, 'fastestName', esc(fastest.name));
  html = injectInner(html, 'avgPayout', fmtMoney(avgPayout));
  return writeChanged(file, before, html, 'payouts.html (' + firms.length + ' rows, total ' + fmtMoney(sumTotal) + ')');
}

// ============================ /audit-log ============================
function buildAuditLog() {
  var file = path.join(ROOT, 'audit-log.html'); var before = read('audit-log.html'); var html = before;
  if (!CHANGELOG.length) return writeChanged(file, before, html, 'audit-log.html (no changelog)');
  var data = CHANGELOG.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
  var firmsUnique = {}; data.forEach(function (e) { firmsUnique[e.firm] = e.firmName; });
  var firmsList = Object.keys(firmsUnique);
  var thisYear = new Date().getFullYear();
  var ytd = data.filter(function (e) { return new Date(e.date).getFullYear() === thisYear; }).length;
  function relTime(iso) { var d = new Date(iso); var diff = (Date.now() - d.getTime()) / 86400000; if (diff < 1) return 'Today'; if (diff < 2) return 'Yesterday'; if (diff < 7) return Math.floor(diff) + 'd ago'; if (diff < 30) return Math.floor(diff / 7) + 'w ago'; if (diff < 365) return Math.floor(diff / 30) + 'mo ago'; return Math.floor(diff / 365) + 'y ago'; }
  function dateParts(iso) { var d = new Date(iso + 'T12:00:00'); return { day: String(d.getDate()).padStart(2, '0'), month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(), year: d.getFullYear() }; }
  function catLabel(c) { return { rule: 'Rule change', payout: 'Payout', promo: 'Promo', feature: 'New feature', platform: 'Platform', 'account-size': 'Account size' }[c] || c; }
  var entries = data.map(function (e) {
    var dp = dateParts(e.date);
    var wasCell = e.was ? '<div class="al-diff-cell was"><div class="al-diff-label">Was</div><div class="al-diff-text">' + e.was + '</div></div>' : '';
    var isCell = '<div class="al-diff-cell is"><div class="al-diff-label">Now</div><div class="al-diff-text">' + e.is + '</div></div>';
    var diffBlock = e.was ? '<div class="al-diff">' + wasCell + isCell + '</div>' : '<div class="al-diff" style="grid-template-columns:1fr">' + isCell + '</div>';
    var note = e.note ? '<p class="al-note">' + e.note + '</p>' : '';
    var actions = '<div class="al-actions">' + (e.firmPage ? '<a href="/firms/' + e.firmPage + '">Read review →</a>' : '') + (e.source ? '<a href="' + (e.source.startsWith('http') ? e.source : 'https://' + e.source) + '" target="_blank" rel="noopener">Source ↗</a>' : '') + '</div>';
    return '<article class="al-entry" data-cat="' + e.category + '">' +
      '<div class="al-entry-aside"><div class="al-date"><span class="al-date-day">' + dp.day + '</span><span class="al-date-month">' + dp.month + ' ' + dp.year + '</span><span class="al-date-rel">' + relTime(e.date) + '</span></div>' +
      '<div class="al-firm"><div class="al-firm-logo"><img src="' + e.logo + '" alt=""></div><span class="al-firm-name">' + e.firmName + '</span></div></div>' +
      '<div class="al-entry-body"><span class="al-tag" data-cat="' + e.category + '">' + catLabel(e.category) + '</span>' +
      '<h3 class="al-headline">' + e.headline + '</h3>' + diffBlock + note + actions + '</div></article>';
  }).join('');
  html = injectInner(html, 'entries', entries);
  html = injectInner(html, 'statTotal', String(data.length));
  html = injectInner(html, 'statFirms', String(firmsList.length));
  html = injectInner(html, 'statYTD', String(ytd));
  html = injectInner(html, 'statLast', esc(relTime(data[0].date)));
  html = injectInner(html, 'resultsCount', String(data.length));
  return writeChanged(file, before, html, 'audit-log.html (' + data.length + ' entries)');
}

// ============================ /compare ============================
function buildCompare() {
  var file = path.join(ROOT, 'compare.html'); var before = read('compare.html'); var html = before;
  var firmPageMap = { 'lucid-trading': 'lucid-trading.html', 'tradeify': 'tradeify.html', 'alpha-futures': 'alpha-futures.html', 'apex-trader': 'apex-trader.html', 'my-funded-futures': 'my-funded-futures.html', 'top-one-futures': 'top-one-futures.html', 'take-profit': 'take-profit-trader.html' };
  var totalPlans = 0;
  var groups = LIVE.map(function (f) {
    var plans = (f.plansSummary || []);
    totalPlans += plans.length;
    var n = plans.length;
    var firmPage = firmPageMap[f.slug] || '#';
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
      '<div class="fg-count"><strong>' + n + '</strong> plans</div></div>' +
      promoLine +
      '<div class="fg-plans-label">Choose plan(s) to compare</div>' +
      '<div class="fg-plans">' + planChips + '</div>' +
      '<div class="fg-actions"><button type="button" class="fg-bulk" data-firm="' + f.slug + '"><span>Compare all ' + n + ' plans</span></button>' +
      '<a class="fg-review" href="/firms/' + firmPage + '">Read review</a></div></article>';
  }).join('');
  html = injectInner(html, 'firmsGrouped', groups);
  html = injectInner(html, 'visibleFirms', String(LIVE.length));
  html = injectInner(html, 'visiblePlans', String(totalPlans));
  return writeChanged(file, before, html, 'compare.html (' + LIVE.length + ' firms, ' + totalPlans + ' plans)');
}

var n = 0;
n += buildDeals();
n += buildPayouts();
n += buildAuditLog();
n += buildCompare();
console.log('\nDone. ' + n + ' page(s) built.');
