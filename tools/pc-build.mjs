#!/usr/bin/env node
/* ============================================================
   PROPCHAMPS — site chrome builder
   ------------------------------------------------------------
   One source of truth for the deals ticker, header/nav, mobile
   menu and footer on every page. Run from the repo root:

       node tools/pc-build.mjs            # apply to all pages
       node tools/pc-build.mjs --check    # report only, write nothing

   What it does to each page (idempotent — safe to re-run):
     1. Injects the chrome between <!-- pc:chrome --> markers and the
        footer between <!-- pc:footer --> markers (first run: replaces
        the legacy editorial-strip / header.site / mobile-menu / footer).
     2. Links /assets/pc.css + /assets/pc.js (cache-busted by content hash).
     3. Re-skins legacy lime colours to the violet palette.
   Ticker deals are read from data/firms.js, so re-run after a promo change.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CHECK = process.argv.includes('--check');

/* ---------- pages ---------- */
const EXCLUDE = [/^preview\//, /^rewards\//, /^checklist\//, /^win\.html$/, /^blog\/_cards\.html$/, /^node_modules\//, /^\.git\//, /^\.wrangler\//];
function walk(dir, out = []) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = dir ? dir + '/' + e.name : e.name;
    if (e.name.startsWith('.')) continue;
    if (e.isDirectory()) walk(rel, out);
    else if (e.name.endsWith('.html') && !EXCLUDE.some((r) => r.test(rel))) out.push(rel);
  }
  return out;
}
const CSS_FILES = ['blog/blog.css', 'vs/vs.css', 'best/best.css', 'tools/tools.css'];

/* ---------- data ---------- */
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'data/firms.js'), 'utf8'), sandbox);
const FIRMS = sandbox.window.FIRMS;

const hash = crypto.createHash('sha1')
  .update(fs.readFileSync(path.join(ROOT, 'assets/pc.css')))
  .update(fs.readFileSync(path.join(ROOT, 'assets/pc.js')))
  .digest('hex').slice(0, 8);

/* Favicons are cached per-URL by browsers for weeks, so every icon link carries
   a content hash — replacing the icon files changes the URL and forces a refetch. */
const ICONS = ['favicon-16x16', 'favicon-32x32', 'favicon-48x48', 'apple-touch-icon', 'icon-192', 'icon-512'];
const iconHash = (() => {
  const h = crypto.createHash('sha1');
  for (const n of ICONS) h.update(fs.readFileSync(path.join(ROOT, n + '.png')));
  h.update(fs.readFileSync(path.join(ROOT, 'favicon.ico')));
  return h.digest('hex').slice(0, 8);
})();
const ICON_RE = new RegExp(`(["(]/(?:${ICONS.join('|')})\\.png)(?:\\?v=[0-9a-f]+)?(?=[")])`, 'g');

/* ---------- templates ---------- */
const ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
const COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
const YT = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>';
const DC = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.3 18.3 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18.1a19.9 19.9 0 0 0 6 3l1.3-2.1a12.9 12.9 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.8 19.8 0 0 0 6-3c.5-5.2-.8-9.7-3.6-13.7zM8 15.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.5 8 10.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4z"/></svg>';

const YT_URL = 'https://www.youtube.com/@thetradingchamp';
const DISCORD_URL = 'https://discord.gg/oasisalerts';

/* Ticker: biggest discounts first. Short names keep it scannable. */
const TICKER = [
  ['apex-trader', 'Apex'], ['top-one-futures', 'Top One'], ['my-funded-futures', 'My Funded Futures'],
  ['take-profit', 'Take Profit'], ['alpha-futures', 'Alpha Futures'], ['fundednext', 'FundedNext'],
  ['tradeify', 'Tradeify'], ['lucid-trading', 'Lucid'],
];
function dealLabel(f) {
  const d = String((f.promo && f.promo.discount) || '');
  return /\d+\s*%/.test(d) ? d.toUpperCase() : 'USE CHAMP';
}
const tickerItems = TICKER.filter(([s]) => FIRMS[s] && FIRMS[s].live !== false)
  .map(([s, short]) => `<span class="pc-tk"><b>${short}</b> <em>${dealLabel(FIRMS[s])}</em></span><span class="pc-tk-sep">✦</span>`)
  .join('');
const tickerGroup = `<span class="pc-tk pc-tk-code">Use code <b>CHAMP</b></span><span class="pc-tk-sep">✦</span>${tickerItems}`;

const NAV = [
  ['firms', '/firms/', 'Firms', 'Every firm we cover, ranked'],
  ['compare', '/compare', 'Compare', 'Rules, payouts &amp; prices side by side'],
  ['deals', '/deals', 'Deals', 'Every active CHAMP discount'],
  ['start', '/start/', 'Start', 'Build your funding plan in 30 seconds'],
];

function chrome(active) {
  const cur = (k) => (k === active ? ' class="is-active" aria-current="page"' : '');
  const desk = NAV.map(([k, href, label]) =>
    `<a href="${href}"${cur(k)}>${label}${k === 'start' ? '<span class="pc-nav-dot" aria-hidden="true"></span>' : ''}</a>`).join('');
  const mob = [NAV[3], NAV[0], NAV[1], NAV[2]].map(([k, href, label, sub]) =>
    `<a href="${href}"${cur(k)}><span><b>${label}</b><small>${sub}</small></span>${CHEV}</a>`).join('');
  return `<!-- pc:chrome (generated by tools/pc-build.mjs — do not edit by hand) -->
<div class="pc-ticker" role="region" aria-label="Active discount codes">
  <a class="pc-ticker-label" href="/deals"><i aria-hidden="true"></i><span>Live deals</span></a>
  <div class="pc-ticker-viewport">
    <a class="pc-ticker-track" href="/deals" aria-label="See every active deal"><span class="pc-ticker-group">${tickerGroup}</span><span class="pc-ticker-group" aria-hidden="true">${tickerGroup}</span></a>
  </div>
</div>
<header class="pc-header" id="pcHeader">
  <div class="pc-wrap">
    <a class="pc-logo" href="/" aria-label="PropChamps home"><img class="pc-logo-mark" src="/logos/pc-mark.png" alt="" width="26" height="34"><img class="pc-logo-word" src="/logos/pc-wordmark.png" alt="PropChamps" width="144" height="15"></a>
    <nav class="pc-nav" aria-label="Primary">${desk}</nav>
    <div class="pc-actions">
      <button type="button" class="pc-code" data-copy="CHAMP" aria-label="Copy discount code CHAMP"><span>Code</span><b>CHAMP</b>${COPY}</button>
      <a class="pc-cta" href="/start/">Get funded ${ARROW}</a>
      <button type="button" class="pc-burger" id="pcBurger" aria-label="Open menu" aria-expanded="false" aria-controls="pcMenu"><span></span></button>
    </div>
  </div>
</header>
<div class="pc-menu" id="pcMenu" aria-hidden="true" inert>
  <nav class="pc-menu-main" aria-label="Mobile">${mob}</nav>
  <div class="pc-menu-label">Learn</div>
  <div class="pc-menu-sub"><a href="/blog/">Blog</a><a href="/best/">Best-of guides</a><a href="/vs/">Head-to-heads</a><a href="/tools/">Free tools</a><a href="/payouts">Payouts</a><a href="/guide">Beginner's guide</a><a href="/methodology">How we audit</a></div>
  <div class="pc-menu-cta"><a class="pc-cta" href="/start/">Build my funding plan ${ARROW}</a><button type="button" class="pc-code" data-copy="CHAMP" aria-label="Copy discount code CHAMP"><span>Code</span><b>CHAMP</b>${COPY}</button></div>
</div>
<!-- /pc:chrome -->`;
}

function footer(page) {
  const cta = page.startsWith('start/') ? '' : `
    <div class="pc-foot-cta">
      <div><p class="pc-foot-h">Not sure which firm fits? <em>Get your plan in 30 seconds.</em></p><p>Three questions. The right account, the right discount, and the toolkit to pass it.</p></div>
      <a class="pc-cta" href="/start/">Build my plan ${ARROW}</a>
    </div>`;
  return `<!-- pc:footer (generated by tools/pc-build.mjs — do not edit by hand) -->
<footer class="pc-footer">
  <div class="pc-wrap">${cta}
    <div class="pc-foot-grid">
      <div class="pc-foot-brand">
        <a class="pc-logo" href="/" aria-label="PropChamps home"><img class="pc-logo-mark" src="/logos/pc-mark.png" alt="" width="26" height="34" loading="lazy"><img class="pc-logo-word" src="/logos/pc-wordmark.png" alt="PropChamps" width="144" height="15" loading="lazy"></a>
        <p>Futures prop firms, compared straight. We track rules, payouts and prices across every firm we cover — and code CHAMP is set up at every one.</p>
        <div class="pc-social"><a href="${YT_URL}" target="_blank" rel="noopener">${YT} YouTube</a><a href="${DISCORD_URL}" target="_blank" rel="noopener">${DC} Discord</a></div>
      </div>
      <div class="pc-foot-col"><h3>Explore</h3><ul><li><a href="/firms/">Firms</a></li><li><a href="/compare">Compare</a></li><li><a href="/vs/">Head-to-heads</a></li><li><a href="/deals">Deals</a></li><li><a href="/payouts">Payouts</a></li><li><a href="/start/">Build your plan</a></li></ul></div>
      <div class="pc-foot-col"><h3>Best of</h3><ul><li><a href="/best/">All buying guides</a></li><li><a href="/best/best-prop-firms-fast-payouts">Fastest payouts</a></li><li><a href="/best/best-prop-firms-no-daily-loss-limit">No daily loss limit</a></li><li><a href="/best/best-prop-firms-no-consistency-rule">No consistency rule</a></li><li><a href="/best/cheapest-prop-firm-challenges">Cheapest challenges</a></li><li><a href="/best/best-prop-firm-for-beginners">Best for beginners</a></li></ul></div>
      <div class="pc-foot-col"><h3>Learn</h3><ul><li><a href="/blog/">Blog</a></li><li><a href="/guide">Beginner's guide</a></li><li><a href="/tools/">Free tools</a></li><li><a href="/tools/prop-firm-drawdown-calculator">Drawdown calculator</a></li><li><a href="/tools/prop-firm-consistency-calculator">Consistency calculator</a></li></ul></div>
      <div class="pc-foot-col"><h3>PropChamps</h3><ul><li><a href="/methodology">How we audit</a></li><li><a href="/audit-log">Audit log</a></li><li><a href="/join">Join the list</a></li><li><a href="mailto:hello@propchamps.net">Contact</a></li></ul></div>
    </div>
    <div class="pc-foot-legal"><div>© 2026 PropChamps. Independent prop firm research — not financial advice. Futures trading involves substantial risk of loss.</div><div><a href="/privacy">Privacy</a> · <a href="/methodology#disclosure">Affiliate disclosure</a></div></div>
  </div>
</footer>
<!-- /pc:footer -->`;
}

/* ---------- helpers ---------- */
function activeFor(page) {
  if (page.startsWith('firms/')) return 'firms';
  if (page === 'compare.html' || page.startsWith('vs/')) return 'compare';
  if (page === 'deals.html') return 'deals';
  if (page.startsWith('start/')) return 'start';
  return '';
}
/* Find the end of a balanced <tag ...> starting at idx. Returns index after the closing tag. */
function balancedEnd(html, idx, tag) {
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'gi');
  re.lastIndex = idx; let depth = 0, m;
  while ((m = re.exec(html))) {
    if (m[0][1] === '/') { depth--; if (depth === 0) return m.index + m[0].length; }
    else depth++;
  }
  return -1;
}
function cutBlock(html, openRe, tag) {
  const m = openRe.exec(html);
  if (!m) return null;
  const end = balancedEnd(html, m.index, tag);
  if (end < 0) return null;
  return { start: m.index, end };
}
function replaceBetween(html, open, close, content) {
  const a = html.indexOf(open), b = html.indexOf(close);
  if (a < 0 || b < 0) return null;
  return html.slice(0, a) + content + html.slice(b + close.length);
}

/* Colour re-skin: lime → violet. Shared by pages and CSS files. */
function reskin(src) {
  let s = src
    .replace(/rgba\(\s*200\s*,\s*255\s*,\s*0\s*,/g, 'rgba(124,92,255,')
    .replace(/#c8ff00\b/gi, '#7c5cff')
    .replace(/#d4ff33\b/gi, '#8f73ff')
    .replace(/#b4e600\b/gi, '#a996ff')
    .replace(/#a3d600\b/gi, '#5b3df0')
    .replace(/rgba\(\s*10\s*,\s*13\s*,\s*18\s*,/g, 'rgba(11,11,18,')
    .replace(/#0a0d12\b/gi, '#0b0b12');
  // Text on a violet fill reads white (lime used dark text).
  s = s.replace(/\{([^{}]*)\}/g, (blk, body) => {
    if (!/background(?:-color)?\s*:\s*(?:var\(--lime(?:-2)?\)|#7c5cff|#8f73ff|linear-gradient\([^;{}]*var\(--lime\))/i.test(body)) return blk;
    if (/background-clip\s*:\s*text/i.test(body)) return blk;
    return '{' + body.replace(/(^|[;\s])color\s*:\s*(?:var\(--bg-base\)|#0b0b12|#000(?:000)?|#0a0a0a)/gi, '$1color:var(--on-accent)') + '}';
  });
  // Sticky offsets that assumed the old 80px header.
  s = s.replace(/top\s*:\s*80px/g, 'top:var(--pc-header-h)');
  // Old chevron button icon → the shared arrow used by the chrome + homepage.
  s = s.replace(/d="M5 12 L11 8 L5 4"/g, 'd="M3 8h10M9 4l4 4-4 4"');
  return s;
}

/* ---------- run ---------- */
const report = [];
for (const page of walk('')) {
  const file = path.join(ROOT, page);
  const before = fs.readFileSync(file, 'utf8');
  let html = before;
  const notes = [];
  const active = activeFor(page);

  // 1) chrome
  if (html.includes('<!-- pc:chrome')) {
    html = replaceBetween(html, html.slice(html.indexOf('<!-- pc:chrome'), html.indexOf('-->', html.indexOf('<!-- pc:chrome')) + 3), '<!-- /pc:chrome -->', chrome(active));
  } else {
    let insertAt = -1;
    for (const [re, tag, label] of [
      [/<div class="editorial-strip"[^>]*>/i, 'div', 'strip'],
      [/<header class="site"[^>]*>/i, 'header', 'header'],
      [/<div class="mobile-menu"[^>]*>/i, 'div', 'menu'],
    ]) {
      const blk = cutBlock(html, re, tag);
      if (!blk) { notes.push('no legacy ' + label); continue; }
      // swallow preceding HTML comment like <!-- Header -->
      let st = blk.start; const pre = html.slice(0, st).match(/<!--[^>]*-->\s*$/);
      if (pre && !/pc:/.test(pre[0])) st -= pre[0].length;
      html = html.slice(0, st) + html.slice(blk.end);
      if (insertAt < 0 || st < insertAt) insertAt = st;
    }
    if (insertAt < 0) {
      const b = html.search(/<body[^>]*>/i);
      insertAt = b + html.slice(b).indexOf('>') + 1;
      notes.push('chrome inserted after <body>');
    }
    html = html.slice(0, insertAt) + '\n' + chrome(active) + '\n' + html.slice(insertAt);
  }

  // 2) footer
  if (html.includes('<!-- pc:footer')) {
    html = replaceBetween(html, html.slice(html.indexOf('<!-- pc:footer'), html.indexOf('-->', html.indexOf('<!-- pc:footer')) + 3), '<!-- /pc:footer -->', footer(page));
  } else {
    const blk = cutBlock(html, /<footer class="site"[^>]*>/i, 'footer');
    if (blk) {
      let st = blk.start; const pre = html.slice(0, st).match(/<!--[^>]*-->\s*$/);
      if (pre) st -= pre[0].length;
      html = html.slice(0, st) + footer(page) + html.slice(blk.end);
    } else {
      notes.push('footer appended before first <script> after content');
      const i = html.lastIndexOf('</body>');
      html = html.slice(0, i) + footer(page) + '\n' + html.slice(i);
    }
  }

  // 3) head: assets + theme colour; drop the legacy nav one-liner
  const head = `<!-- pc:head --><link rel="stylesheet" href="/assets/pc.css?v=${hash}"><script src="/assets/pc.js?v=${hash}" defer></script><!-- /pc:head -->`;
  if (html.includes('<!-- pc:head -->')) html = replaceBetween(html, '<!-- pc:head -->', '<!-- /pc:head -->', head);
  else html = html.replace(/<\/head>/i, head + '\n</head>');
  html = html.replace(/<style>header\.site nav\.primary a,header\.site \.header-cta\{white-space:nowrap\}[^<]*<\/style>\s*/g, '');
  html = html.replace(/<meta name="theme-color" content="[^"]*">/i, '<meta name="theme-color" content="#0b0b12">');
  html = html.replace(ICON_RE, `$1?v=${iconHash}`);
  html = html.replace(/\/logos\/propchamps\.png/g, '/logos/pc-logo.png').replace(/\/logos\/propchamps-icon\.png/g, '/logos/pc-icon.png');
  // Small square logo slots (blog author box) need the mark, not the wide wordmark.
  html = html.replace(/(class="ab-logo"[^>]*src=")\/logos\/pc-logo\.png/g, '$1/logos/pc-mark.png');
  // The chrome uses JetBrains Mono 700 — make sure every page loads it (no faux bold).
  html = html.replace(/JetBrains\+Mono:wght@([\d;]+)/g, (m, w) => {
    const ws = new Set(w.split(';').concat(['500', '600', '700']));
    return 'JetBrains+Mono:wght@' + [...ws].map(Number).sort((a, b) => a - b).join(';');
  });

  // 4) colours (outside the generated chrome, which is already on-palette)
  html = reskin(html);

  if (html !== before) {
    if (!CHECK) fs.writeFileSync(file, html);
    report.push(`${CHECK ? 'would update' : 'updated'}  ${page}${active ? '  [' + active + ']' : ''}${notes.length ? '  — ' + notes.join('; ') : ''}`);
  } else report.push(`unchanged ${page}`);
}
for (const f of CSS_FILES) {
  const file = path.join(ROOT, f);
  if (!fs.existsSync(file)) continue;
  const before = fs.readFileSync(file, 'utf8');
  const after = reskin(before);
  if (after !== before) { if (!CHECK) fs.writeFileSync(file, after); report.push(`${CHECK ? 'would reskin' : 'reskinned'} ${f}`); }
}
{ // web app manifest icons get the same cache-busting version
  const mf = path.join(ROOT, 'site.webmanifest');
  const before = fs.readFileSync(mf, 'utf8');
  const m = JSON.parse(before);
  for (const ic of m.icons || []) ic.src = ic.src.replace(/\?v=[0-9a-f]+$/, '') + '?v=' + iconHash;
  const after = JSON.stringify(m, null, 2) + '\n';
  if (after !== before) { if (!CHECK) fs.writeFileSync(mf, after); report.push(`${CHECK ? 'would update' : 'updated'}  site.webmanifest (icon version)`); }
}
console.log(report.join('\n'));
console.log(`\nassets hash ${hash} · ${report.filter((r) => /updat|reskin/.test(r)).length} files touched`);
