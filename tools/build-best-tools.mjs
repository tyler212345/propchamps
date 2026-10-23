#!/usr/bin/env node
/* ============================================================
   PROPCHAMPS — /best/ + /tools/ link builder
   ------------------------------------------------------------
   Every "related" link block on the /best/ and /tools/ pages is
   GENERATED FROM THE FILES ON DISK, so a page is linked only once
   its file exists (pages ship in waves). Idempotent; run it after
   adding or holding back a page, then run tools/pc-build.mjs.

       node build-best-tools.mjs                       # write
       node build-best-tools.mjs --check               # report only
       node build-best-tools.mjs --exclude best/x.html # treat a file as not shipped yet
       PC_HOLD=best/x.html,tools/y.html node build-best-tools.mjs
       node build-best-tools.mjs --root /path/to/repo  # if run from outside tools/

   It only writes best/*.html and tools/*.html. What it does:
     1. <!-- g:NAME --> … <!-- /g:NAME -->  blocks are regenerated:
          best-more    (best pages)  other buying guides + free tools
          tools-more   (tool pages)  other tools + curated related pages that exist
          best-hub / best-hub-ld     cards + ItemList JSON-LD on best/index.html
          tools-hub / tools-hub-ld   cards + ItemList JSON-LD on tools/index.html
          hub-tools / hub-best       cross-links between the two hubs
          vs-links     every /vs/ head-to-head on disk (+ the /vs/ hub if present)
          payout-links per-firm payout-rules link: subpage → #payout-rules → review
     2. <a|span data-g-href="/clean/url">text</a|span> becomes a link when the
        target file exists and plain text when it doesn't.
     3. Any element with data-g-requires="/clean/url" is hidden until that file exists.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const argVal = (k) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : null; };
const HERE = path.dirname(new URL(import.meta.url).pathname);
let ROOT = argVal('--root') || process.env.PC_ROOT;
if (!ROOT) ROOT = fs.existsSync(path.join(HERE, '..', 'data', 'firms.js')) ? path.resolve(HERE, '..') : '/Users/thetradingchampll/Desktop/propchamps';
const HOLD = new Set([
  ...args.flatMap((a, i) => (args[i - 1] === '--exclude' ? [a] : [])),
  ...String(process.env.PC_HOLD || '').split(',').map((s) => s.trim()).filter(Boolean),
]);

const exists = (rel) => !HOLD.has(rel) && fs.existsSync(path.join(ROOT, rel));
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const esc = (s) => String(s).replace(/&(?!(?:[a-z]+|#\d+);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = (s) => String(s).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const ARR = '<span class="arr">→</span>';

/* clean URL ↔ file */
function fileFor(url) {
  const u = url.split('#')[0].split('?')[0];
  if (u === '/') return 'index.html';
  if (u.endsWith('/')) return u.slice(1) + 'index.html';
  return u.slice(1) + '.html';
}
const urlFor = (rel) => (rel.endsWith('/index.html') ? '/' + rel.slice(0, -'index.html'.length) : '/' + rel.replace(/\.html$/, ''));
function urlExists(url) {
  const f = fileFor(url);
  if (!exists(f)) return false;
  const hash = url.split('#')[1];
  return hash ? new RegExp(`id="${hash}"`).test(read(f)) : true;
}

/* page metadata */
const shortTitle = (t) => { let x = t.split(/\s[—–-]\s|:\s|\s\(|\s\|/)[0]; const q = x.indexOf('?'); return q > -1 ? x.slice(0, q + 1) : x; };
const metaCache = new Map();
function meta(rel) {
  if (metaCache.has(rel)) return metaCache.get(rel);
  const h = read(rel);
  const pick = (re) => { const m = h.match(re); return m ? unesc(m[1]).trim() : ''; };
  const title = pick(/<title>([^<]*)<\/title>/i).replace(/\s*\|\s*PropChamps\s*$/i, '');
  const h1 = pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/[.]$/, '').trim();
  const m = {
    rel, url: urlFor(rel), title,
    h1: h1 ? h1.charAt(0).toUpperCase() + h1.slice(1) : title,
    label: pick(/<meta name="pc:label" content="([^"]*)"/i) || shortTitle(title),
    desc: pick(/<meta name="description" content="([^"]*)"/i),
    eyebrow: pick(/<meta name="pc:eyebrow" content="([^"]*)"/i),
  };
  metaCache.set(rel, m);
  return m;
}

/* directory scans */
function listDir(dir, order = []) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  const files = fs.readdirSync(abs).filter((f) => f.endsWith('.html') && f !== 'index.html' && !f.startsWith('_')).map((f) => dir + '/' + f).filter(exists);
  const rank = (r) => { const i = order.indexOf(path.basename(r, '.html')); return i < 0 ? 999 : i; };
  return files.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
const BEST_ORDER = ['best-prop-firms-fast-payouts', 'best-prop-firms-no-consistency-rule', 'best-prop-firms-no-daily-loss-limit', 'best-instant-funding-futures-prop-firms', 'cheapest-prop-firm-challenges', 'best-prop-firm-for-beginners'];
const TOOLS_ORDER = ['prop-firm-consistency-calculator', 'prop-firm-drawdown-calculator'];
const BEST = listDir('best', BEST_ORDER);
const TOOLS = listDir('tools', TOOLS_ORDER);
const VS = listDir('vs');

/* curated related pages for each tool, filtered by what exists */
const RELATED = {
  'tools/prop-firm-consistency-calculator.html': ['/best/best-prop-firms-no-consistency-rule', '/blog/prop-firm-consistency-rules', '/best/best-instant-funding-futures-prop-firms', '/best/best-prop-firms-fast-payouts', '/blog/how-prop-firm-payouts-work', '/blog/how-to-pass-a-prop-firm-evaluation'],
  'tools/prop-firm-drawdown-calculator.html': ['/blog/prop-firm-drawdown-explained', '/blog/apex-drawdown-explained', '/best/best-prop-firms-no-daily-loss-limit', '/blog/what-is-a-daily-loss-limit', '/blog/how-to-pass-a-prop-firm-evaluation'],
};

/* firms for payout-rules links (data slug → page slug, display name) */
const FIRMS = [
  ['my-funded-futures', 'My Funded Futures'], ['lucid-trading', 'Lucid Trading'], ['tradeify', 'Tradeify'], ['top-one-futures', 'Top One Futures'],
  ['fundednext', 'FundedNext'], ['take-profit-trader', 'Take Profit Trader'], ['apex-trader', 'Apex Trader Funding'], ['alpha-futures', 'Alpha Futures'],
];

/* ---------- block renderers ---------- */
const card = (url, label) => `<a class="more-card" href="${url}"><span>${esc(label)}</span>${ARR}</a>`;
const grid = (cards, cls = 'more-grid') => (cards.length ? `<div class="${cls}">${cards.join('')}</div>` : '');
const sub = (t) => `<p class="more-sub">${esc(t)}</p>`;

function bestMore(self) {
  const g = BEST.filter((r) => r !== self).map((r) => card(meta(r).url, meta(r).label));
  if (exists('best/index.html')) g.push(card('/best/', 'All buying guides'));
  const t = TOOLS.map((r) => card(meta(r).url, meta(r).label));
  return [g.length ? sub('Buying guides') + grid(g) : '', t.length ? sub('Free tools') + grid(t) : ''].join('');
}
function toolsMore(self) {
  const t = TOOLS.filter((r) => r !== self).map((r) => card(meta(r).url, meta(r).label));
  if (exists('tools/index.html')) t.push(card('/tools/', 'All free tools'));
  const rel = (RELATED[self] || []).filter(urlExists).map((u) => card(u, meta(fileFor(u)).label));
  return [rel.length ? sub('Related reading') + grid(rel) : '', t.length ? sub('More free tools') + grid(t) : ''].join('');
}
function hubCards(list, eyebrow, go) {
  return `<div class="hub-grid">` + list.map((r) => {
    const m = meta(r);
    return `<a class="hub-card" href="${m.url}"><span class="hc-eyebrow">${esc(m.eyebrow || eyebrow)}</span><h3>${esc(m.h1)}</h3><p>${esc(m.desc)}</p><span class="hc-go">${esc(go)} →</span></a>`;
  }).join('') + `</div>`;
}
function hubLd(list, name, url) {
  const ld = { '@context': 'https://schema.org', '@type': 'ItemList', name, url, numberOfItems: list.length,
    itemListElement: list.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: meta(r).h1, url: 'https://propchamps.net' + meta(r).url })) };
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}
function vsLinks() {
  const c = VS.map((r) => card(meta(r).url, meta(r).label));
  if (exists('vs/index.html')) c.push(card('/vs/', 'All comparisons'));
  return grid(c, 'more-grid vs-grid');
}
function payoutLinks() {
  return `<div class="more-grid">` + FIRMS.map(([slug, name]) => {
    if (exists(`firms/${slug}/payout-rules.html`)) return card(`/firms/${slug}/payout-rules`, `${name} payout rules`);
    if (urlExists(`/firms/${slug}#payout-rules`)) return card(`/firms/${slug}#payout-rules`, `${name} payout rules`);
    return card(`/firms/${slug}`, `${name} review`);
  }).join('') + `</div>`;
}

const BLOCKS = {
  'best-more': (rel) => bestMore(rel),
  'tools-more': (rel) => toolsMore(rel),
  'best-hub': () => hubCards(BEST, 'Buying guide', 'Read the guide'),
  'best-hub-ld': () => hubLd(BEST, 'PropChamps futures prop firm buying guides', 'https://propchamps.net/best/'),
  'tools-hub': () => hubCards(TOOLS, 'Free tool', 'Open the tool'),
  'tools-hub-ld': () => hubLd(TOOLS, 'PropChamps free prop firm tools', 'https://propchamps.net/tools/'),
  'hub-tools': () => grid(TOOLS.map((r) => card(meta(r).url, meta(r).label))),
  'hub-best': () => grid(BEST.map((r) => card(meta(r).url, meta(r).label))),
  'vs-links': () => vsLinks(),
  'payout-links': () => payoutLinks(),
};

/* ---------- apply ---------- */
function build(rel, html) {
  html = html.replace(/<!-- g:([a-z-]+) -->[\s\S]*?<!-- \/g:\1 -->/g, (m, name) => {
    if (!BLOCKS[name]) return m;
    return `<!-- g:${name} -->${BLOCKS[name](rel)}<!-- /g:${name} -->`;
  });
  // conditional inline links
  html = html.replace(/<(a|span)\b([^>]*?)\sdata-g-href="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g, (m, tag, pre, url, post, inner) => {
    const attrs = (pre + post).replace(/\s(href|target|rel)="[^"]*"/g, '');
    return urlExists(url) ? `<a href="${url}" data-g-href="${url}"${attrs}>${inner}</a>` : `<span data-g-href="${url}"${attrs}>${inner}</span>`;
  });
  // elements that require a page
  html = html.replace(/<([a-z][a-z0-9]*)((?:\s[^>]*?)?)\sdata-g-requires="([^"]+)"([^>]*)>/g, (m, tag, pre, url, post) => {
    const attrs = ((pre || '') + (post || '')).replace(/\shidden(?:="")?(?=\s|$)/g, '').replace(/\s+$/, '');
    return `<${tag}${attrs} data-g-requires="${url}"${urlExists(url) ? '' : ' hidden'}>`;
  });
  return html;
}

const report = [];
for (const rel of [...listDir('best'), ...listDir('tools'), 'best/index.html', 'tools/index.html'].filter((r, i, a) => a.indexOf(r) === i)) {
  if (!fs.existsSync(path.join(ROOT, rel))) continue;
  const before = read(rel);
  const after = build(rel, before);
  if (after !== before) { if (!CHECK) fs.writeFileSync(path.join(ROOT, rel), after); report.push(`${CHECK ? 'would update' : 'updated'}  ${rel}`); }
  else report.push(`unchanged ${rel}`);
}
console.log(`root ${ROOT}${HOLD.size ? '  · held back: ' + [...HOLD].join(', ') : ''}`);
console.log(`best: ${BEST.length} · tools: ${TOOLS.length} · vs: ${VS.length}`);
console.log(report.join('\n'));
