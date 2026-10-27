#!/usr/bin/env node
/**
 * build-blog-post.js — Assemble PropChamps blog articles from markdown drafts.
 *
 * After generating, run: node tools/pc-build.mjs (injects the shared chrome; idempotent)
 *
 * Turns a batch of {slug, title, markdown} drafts (e.g. from the blog-batch
 * workflow) into full /blog/<slug>.html pages that match the existing posts:
 * same head/schema, section-nav, FAQ accordion, author box, CTA. The site
 * chrome (ticker, header/nav, mobile menu, footer) and the shared design-system
 * assets are NOT written here — the template only emits the empty
 * <!-- pc:chrome -->, <!-- pc:footer --> and <!-- pc:head --> marker pairs,
 * which tools/pc-build.mjs fills in. So the page is unstyled/chromeless until
 * pc-build has run.
 *
 * USAGE: node tools/build-blog-post.js <drafts.json> [--date=YYYY-MM-DD] [--no-relink]
 *        node tools/build-blog-post.js --relink          (refresh links on every post; no drafts needed)
 *        node tools/pc-build.mjs
 *
 *   drafts.json = either an array of drafts OR a workflow output object with a
 *   `.result` array of the same. A draft is:
 *     { slug, title, markdown,                 required
 *       seoTitle?,        <title> + og:title + twitter:title. ≤60 chars, hand-written. " | PropChamps"
 *                         is appended only when it is 47 chars or fewer. Missing → "<title> | PropChamps".
 *       metaDescription?, meta description + og/twitter description + Article description. ≤155 chars,
 *                         hand-written. Missing → the first intro paragraph, cut at 158 chars.
 *       dek?,             hero sub-headline + blog-index card text. Missing → first intro paragraph (240 chars).
 *       datePublished? }  keep the original publish date when re-generating (dateModified = --date).
 *   "{YEAR}" in title / seoTitle / metaDescription / dek / markdown becomes the --date year.
 *   Per-slug presentation (eyebrow, tag, topics for related links) comes from CONFIG below.
 *   --date sets dateModified, the "Last reviewed" byline and the sitemap <lastmod> (default: today).
 *
 * MARKDOWN: # H1 (title only) · ## H2 (section-nav entry) · ### H3 · lists · | tables | (first column
 *   is the row label) · > blockquote = "Note" callout. Callout variants: "> [!answer] …" (Short-answer
 *   box), "> [!warn] …", "> [!tip|Custom label] …", and "> [!tip|Label|/tools/x] …" (the whole callout is
 *   hidden until /tools/x exists). "## Key takeaways" (must be an H2) + a list → the takeaways box.
 *   "## Frequently asked questions" + "### Question" blocks → FAQ accordion + FAQPage JSON-LD.
 *   Links: [text](/clean/url) — never .html. [text](/firms/x/payout-rules "fallback:/firms/x#payout-rules")
 *   links the fallback until the primary page exists.
 *
 * RELATED GUIDES + LINK HYGIENE (runs after every build, or alone with --relink):
 *   • The "Related guides" block of every post (between <!-- g:related --> markers) is regenerated
 *     from the posts that exist on disk: 4-5 posts ranked by shared CONFIG topics, plus up to 2
 *     matching /best/, /tools/ or data pages (HUBS) — only ones whose file exists.
 *   • Every internal link in post/index content is checked against the files on disk: missing
 *     targets become <pc-pending data-href> (plain text; cards are hidden by blog.css) and turn back
 *     into links once the page exists; "fallback:" links point at the fallback meanwhile; blocks with
 *     data-needs="/path" get `hidden` until /path exists; retired URLs (REDIRECTS) are rewritten to
 *     their target; ".html" internal links are cleaned. Safe to re-run; pages released in waves stay
 *     link-clean as long as relink runs after files are added or removed.
 *   • blog/index.html: its Blog JSON-LD blogPost list is rebuilt from the live post cards.
 *
 * WRITES: blog/<slug>.html for each draft, plus blog/_cards.html (post-card
 *   snippets for blog/index.html) and blog/_sitemap.txt (<url> entries for
 *   sitemap.xml) — both hold ONLY this batch and are pasted in by hand.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const SITE = 'https://propchamps.net';
const ARGV = process.argv.slice(2);
const DATE_ARG = ARGV.find(a => /^--date=/.test(a));
const DATE = DATE_ARG ? DATE_ARG.slice(7) : new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD (local)
if (!/^\d{4}-\d{2}-\d{2}$/.test(DATE)) { console.error('bad --date (want YYYY-MM-DD): ' + DATE); process.exit(1); }
const YEAR = DATE.slice(0, 4); // single year constant: titles roll over with --date, no hand edits
const DATE_LONG = new Date(DATE + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); // "September 18, 2026"
const TITLE_SUFFIX = ' | PropChamps';
const SUFFIX_MAX_BASE = 47; // 47 + 13 = 60 chars, the most a SERP title shows

// Retired post URLs: the file may stay on disk, but the URL 301s, so nothing should link to it.
const REDIRECTS = {
  '/blog/fastest-payout-prop-firms': '/best/best-prop-firms-fast-payouts',
};

// Per-article presentation (body/meta are derived from the markdown).
//   short  — anchor text when another post links here from its Related block
//   topics — first = primary; drives the generated Related block (shared topics rank higher)
const CONFIG = {
  'how-prop-firm-payouts-work': { eyebrow: 'Prop firm rules · Explained', tag: 'Explainer', short: 'How prop firm payouts work', topics: ['payouts', 'caps', 'consistency', 'trust'] },
  'prop-firm-payout-caps': { eyebrow: 'Prop firm data · Payouts', tag: 'Data', short: 'Payout caps at every futures firm', topics: ['caps', 'payouts', 'consistency'] },
  'do-prop-firms-actually-pay': { eyebrow: 'Prop firm data · Trust', tag: 'Data', short: 'Do prop firms actually pay out?', topics: ['trust', 'payouts', 'model'] },
  'how-do-prop-firms-make-money': { eyebrow: 'Prop firm guide · Business model', tag: 'Guide', short: 'How prop firms make money', topics: ['model', 'trust', 'cost', 'caps'] },
  'are-futures-prop-firms-worth-it': { eyebrow: 'Prop firm guide · Honest take', tag: 'Guide', short: 'Are futures prop firms worth it?', topics: ['trust', 'model', 'beginner', 'cost'] },
  'how-much-do-prop-firm-challenges-cost': { eyebrow: 'Prop firm data · Pricing', tag: 'Data', short: 'What a prop firm challenge costs', topics: ['cost', 'instant', 'model'] },
  'instant-funding-vs-evaluation-prop-firms': { eyebrow: 'Prop firm rules · Explained', tag: 'Explainer', short: 'Instant funding vs evaluation', topics: ['instant', 'cost', 'consistency', 'beginner'] },
  'how-to-pass-a-prop-firm-evaluation': { eyebrow: 'Prop firm guide · How-to', tag: 'Guide', short: 'How to pass a prop firm evaluation', topics: ['beginner', 'drawdown', 'consistency', 'rules'] },
  'prop-firm-drawdown-explained': { eyebrow: 'Prop firm rules · Explained', tag: 'Explainer', short: 'Trailing drawdown explained', topics: ['drawdown', 'dll', 'rules', 'beginner'] },
  'apex-drawdown-explained': { eyebrow: 'Prop firm rules · Explained', tag: 'Explainer', short: 'Apex trailing drawdown explained', topics: ['apex', 'drawdown', 'dll'] },
  'what-is-a-daily-loss-limit': { eyebrow: 'Prop firm rules · Explained', tag: 'Explainer', short: 'What is a daily loss limit?', topics: ['dll', 'drawdown', 'rules'] },
  'prop-firm-consistency-rules': { eyebrow: 'Prop firm rules · Explained', tag: 'Explainer', short: 'Consistency rules by firm', topics: ['consistency', 'payouts', 'rules'] },
  'prop-firm-news-trading-rules': { eyebrow: 'Prop firm rules · Explained', tag: 'Explainer', short: 'News trading rules by firm', topics: ['news', 'rules'] },
  'what-happens-when-you-break-a-prop-firm-rule': { eyebrow: 'Prop firm rules · Explained', tag: 'Explainer', short: 'What happens when you break a rule', topics: ['rules', 'dll', 'drawdown', 'news', 'accounts'] },
  'how-many-prop-firm-accounts-can-you-have': { eyebrow: 'Prop firm rules · Account limits', tag: 'Explainer', short: 'How many prop firm accounts you can have', topics: ['accounts', 'rules', 'platforms'] },
  'prop-firm-taxes-explained': { eyebrow: 'Prop firm guide · Taxes', tag: 'Guide', short: 'Prop firm taxes explained', topics: ['taxes', 'payouts', 'trust'] },
  'best-platforms-tradovate-vs-ninjatrader-vs-tradingview': { eyebrow: 'Prop firm guide · Platforms', tag: 'Guide', short: 'Tradovate vs NinjaTrader vs TradingView', topics: ['platforms', 'accounts', 'beginner'] },
  'fastest-payout-prop-firms': { eyebrow: 'Prop firm data · Payouts', tag: 'Data', short: 'Fastest-paying firms', topics: ['payouts'] }, // retired → REDIRECTS
};
const DEFAULT_CFG = { eyebrow: 'Prop firm guide', tag: 'Guide', topics: ['rules'] };

// Lists, tools and data pages a post's Related block can point at, by topic: [url, kind, label].
// A hub is used only when its file exists on disk, so wave-released pages appear once they ship.
const HUBS = {
  payouts: [['/best/best-prop-firms-fast-payouts', 'List', 'Fastest-payout futures prop firms'], ['/payouts', 'Data', 'Payout tracker']],
  caps: [['/best/best-prop-firms-fast-payouts', 'List', 'Fastest-payout futures prop firms'], ['/payouts', 'Data', 'Payout tracker']],
  consistency: [['/tools/prop-firm-consistency-calculator', 'Tool', 'Consistency rule calculator'], ['/best/best-prop-firms-no-consistency-rule', 'List', 'Firms with no consistency rule']],
  drawdown: [['/tools/prop-firm-drawdown-calculator', 'Tool', 'Drawdown calculator']],
  apex: [['/firms/apex-trader/payout-rules', 'Rules', 'Apex payout rules'], ['/tools/prop-firm-drawdown-calculator', 'Tool', 'Drawdown calculator']],
  dll: [['/best/best-prop-firms-no-daily-loss-limit', 'List', 'Firms with no daily loss limit']],
  cost: [['/best/cheapest-prop-firm-challenges', 'List', 'Cheapest prop firm challenges'], ['/deals', 'Deals', 'Every active CHAMP discount']],
  instant: [['/best/best-instant-funding-futures-prop-firms', 'List', 'Best instant-funding futures firms']],
  beginner: [['/best/best-prop-firm-for-beginners', 'List', 'Best prop firms for beginners']],
  trust: [['/payouts', 'Data', 'Payout tracker'], ['/audit-log', 'Data', 'Rule-change audit log']],
  model: [['/payouts', 'Data', 'Payout tracker'], ['/audit-log', 'Data', 'Rule-change audit log']],
  taxes: [['/payouts', 'Data', 'Payout tracker']],
  news: [['/compare', 'Compare', 'Compare every firm’s rules']],
  rules: [['/compare', 'Compare', 'Compare every firm’s rules']],
  accounts: [['/compare', 'Compare', 'Compare every firm’s rules']],
  platforms: [['/compare', 'Compare', 'Compare every firm’s rules']],
};
const RELATED_TOTAL = 6, RELATED_MIN_POSTS = 4, RELATED_MAX_HUBS = 2;

function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function attr(s){ return esc(s).replace(/"/g,'&quot;'); }
function slugify(s){ return s.toLowerCase().replace(/<[^>]+>/g,'').replace(/&[a-z]+;/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,50).replace(/-+$/,''); }
function year(s){ return s == null ? s : String(s).replace(/\{YEAR\}/g, YEAR); }
// Plain text: drop markdown bold/italic/code/link syntax so it never leaks into a dek, <meta> or JSON-LD.
function plain(md){ return String(md||'').replace(/\*\*/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/`([^`]+)`/g,'$1').replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g,'$1$2').replace(/\s+/g,' ').trim(); }
function linkTag(text, target){
  // [text](/url) or [text](/url "fallback:/other")
  const m = target.trim().match(/^(\S+)(?:\s+"([^"]*)")?$/);
  const url = m ? m[1] : target.trim();
  const fb = m && m[2] && /^fallback:/.test(m[2]) ? m[2].slice(9).trim() : null;
  return '<a href="'+attr(url)+'"'+(fb ? ' data-href-fallback="'+attr(fb)+'"' : '')+'>'+text+'</a>';
}
function inline(md){
  // escape, then re-apply the markdown we allow (links, bold, italic, code)
  let s = esc(md);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(m,t,u){ return linkTag(t, u.replace(/&quot;/g,'"')); });
  s = s.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/`([^`]+)`/g, '<span class="term">$1</span>');
  return s;
}

function tokenize(md){
  const lines = md.replace(/\r/g,'').split('\n');
  const b=[]; let i=0;
  while(i<lines.length){
    const line=lines[i];
    if(/^#{1,6}\s/.test(line)){ b.push({t:'h',lvl:line.match(/^#+/)[0].length,x:line.replace(/^#+\s/,'').trim()}); i++; continue; }
    if(/^\s*[-*]\s+/.test(line)){ const it=[]; while(i<lines.length&&/^\s*[-*]\s+/.test(lines[i])){it.push(lines[i].replace(/^\s*[-*]\s+/,'').trim());i++;} b.push({t:'ul',it}); continue; }
    if(/^\s*\d+\.\s+/.test(line)){ const it=[]; while(i<lines.length&&/^\s*\d+\.\s+/.test(lines[i])){it.push(lines[i].replace(/^\s*\d+\.\s+/,'').trim());i++;} b.push({t:'ol',it}); continue; }
    if(/^\s*\|/.test(line)){ const rows=[]; while(i<lines.length&&/^\s*\|/.test(lines[i])){rows.push(lines[i]);i++;} b.push({t:'table',rows}); continue; }
    if(/^\s*>\s?/.test(line)){ const q=[]; while(i<lines.length&&/^\s*>\s?/.test(lines[i])){q.push(lines[i].replace(/^\s*>\s?/,''));i++;} b.push({t:'quote',x:q.join(' ').trim()}); continue; }
    if(line.trim()===''){ i++; continue; }
    const p=[]; while(i<lines.length&&lines[i].trim()!==''&&!/^(#{1,6}\s|\s*[-*]\s+|\s*\d+\.\s+|\s*\||\s*>)/.test(lines[i])){p.push(lines[i].trim());i++;}
    b.push({t:'p',x:p.join(' ')});
  }
  return b;
}
function renderTable(rows){
  const cells = r => r.replace(/^\s*\|/,'').replace(/\|\s*$/,'').split('|').map(c=>c.trim());
  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  // 6+ columns: a "wide" table that may break out of the reading column on desktop
  let h='<div class="table-wrap'+(head.length>=6?' wide':'')+'"><table class="data"><thead><tr>'+head.map(c=>'<th>'+inline(c)+'</th>').join('')+'</tr></thead><tbody>';
  h+=body.map(r=>'<tr>'+r.map((c,i)=>'<td'+(i===0?' class="firm-c"':'')+'>'+inline(c)+'</td>').join('')+'</tr>').join('');
  return h+'</tbody></table></div>';
}
function uniqueId(base, state){ let id=base||'section', n=2; while(state.ids.has(id)) id=base+'-'+(n++); state.ids.add(id); return id; }
function renderQuote(x){
  const m = x.match(/^\[!(answer|warn|tip|note)(?:\|([^|\]]*))?(?:\|([^\]]*))?\]\s*([\s\S]*)$/i);
  if(!m) return '<div class="callout tip"><span class="callout-label">Note</span>'+inline(x)+'</div>';
  const kind=m[1].toLowerCase(), label=(m[2]||'').trim(), needs=(m[3]||'').trim(), body=m[4];
  const needsAttr = needs ? ' data-needs="'+attr(needs)+'"' : '';
  if(kind==='answer') return '<div class="answer-box"'+needsAttr+'><span class="callout-label">'+esc(label||'Short answer')+'</span><p>'+inline(body)+'</p></div>';
  const cls = kind==='warn' ? 'callout warn' : 'callout tip';
  const def = kind==='warn' ? 'Watch out' : kind==='tip' ? 'Tip' : 'Note';
  return '<div class="'+cls+'"'+needsAttr+'><span class="callout-label">'+esc(label||def)+'</span>'+inline(body)+'</div>';
}
function renderBlock(bl, state){
  if(bl.t==='h'){
    if(bl.lvl<=2){ const id=uniqueId(slugify(bl.x),state); state.nav.push({id,label:plain(bl.x)}); return '<h2 id="'+id+'">'+inline(bl.x)+'</h2>'; }
    return '<h3 id="'+uniqueId(slugify(bl.x),state)+'">'+inline(bl.x)+'</h3>';
  }
  if(bl.t==='p'){ const lead=!state.leadDone; state.leadDone=true; return '<p'+(lead?' class="lead"':'')+'>'+inline(bl.x)+'</p>'; }
  if(bl.t==='ul'){ return '<ul>'+bl.it.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ul>'; }
  if(bl.t==='ol'){ return '<ol>'+bl.it.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ol>'; }
  if(bl.t==='table'){ return renderTable(bl.rows); }
  if(bl.t==='quote'){ return renderQuote(bl.x); }
  return '';
}
// Markdown fragment → HTML (no lead paragraph, h2/h3 get ids). Used by tooling that edits existing posts.
function renderFragment(md, takenIds){
  const state={nav:[],leadDone:true,ids:new Set(takenIds||[])};
  return tokenize(year(md)).map(b=>renderBlock(b,state)).join('');
}
function blockText(b){
  if(b.t==='p'||b.t==='quote') return plain(b.x.replace(/^\[![^\]]*\]\s*/,''));
  if(b.t==='ul'||b.t==='ol') return b.it.map(plain).join('; ')+'.';
  return '';
}

// Strip any LLM preamble/chatter (e.g. "Here is the corrected article.") and
// anything before the H1, so agent framing never leaks into a published page.
function cleanMd(md){
  md = String(md||'').replace(/\r/g,'');
  const p = md.search(/^# /m); if(p>0) md = md.slice(p);
  md = md.replace(/^[ \t]*(here('?s| is)|below is|sure[,.:]?|certainly)\b[^\n]*\b(article|version|corrected|revised|updated|draft|markdown|below|requested)\b[^\n]*$/gim, '');
  return md.replace(/\n{3,}/g,'\n\n').trim();
}
function pageTitle(article){
  if(article.seoTitle){ const t=year(article.seoTitle).trim(); return t.length<=SUFFIX_MAX_BASE ? t+TITLE_SUFFIX : t; }
  return year(article.title)+TITLE_SUFFIX; // fallback = original behaviour
}

// ---------- files on disk (wave-safe linking) ----------
function stripUrl(u){ return String(u).split('#')[0].split('?')[0]; }
function cleanInternal(u){
  if(!/^\/(?!\/)/.test(u)) return u;
  const hashI=u.search(/[?#]/), base=hashI<0?u:u.slice(0,hashI), rest=hashI<0?'':u.slice(hashI);
  let b=base.replace(/\/index\.html$/,'/').replace(/\.html$/,'');
  if(REDIRECTS[b]) b=REDIRECTS[b];
  return b+rest;
}
function fileExists(u){
  const p = stripUrl(u);
  if(!/^\/(?!\/)/.test(p)) return true; // external, mailto, anchors: not ours to check
  const rel = decodeURI(p).replace(/^\/+/,'');
  const candidates = rel==='' ? ['index.html'] : rel.endsWith('/') ? [rel+'index.html'] : /\.[a-z0-9]{2,5}$/i.test(rel) ? [rel] : [rel+'.html', rel+'/index.html'];
  return candidates.some(c=>{ try { return fs.statSync(path.join(ROOT,c)).isFile(); } catch(e){ return false; } });
}
function postSlugsOnDisk(){
  return fs.readdirSync(BLOG_DIR).filter(f=>/\.html$/.test(f) && !/^_/.test(f) && f!=='index.html')
    .map(f=>f.replace(/\.html$/,'')).filter(s=>!REDIRECTS['/blog/'+s]);
}
function postLabel(slug){
  const c=CONFIG[slug]; if(c&&c.short) return c.short;
  try { const h=fs.readFileSync(path.join(BLOG_DIR,slug+'.html'),'utf8').match(/<h1[^>]*>([\s\S]*?)<\/h1>/); if(h) return h[1].replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').trim(); } catch(e){}
  return slug.replace(/-/g,' ');
}
function relatedHtml(slug){
  const me = CONFIG[slug]||DEFAULT_CFG, order=Object.keys(CONFIG);
  const w = (topics,t)=>{ const i=topics.indexOf(t); return i<0?0:i===0?3:i===1?2:1; };
  const hubs=[]; const seen=new Set();
  for(const t of me.topics){ for(const h of (HUBS[t]||[])){ if(hubs.length>=RELATED_MAX_HUBS) break; if(seen.has(h[0])||!fileExists(h[0])) continue; seen.add(h[0]); hubs.push(h); } }
  const posts = postSlugsOnDisk().filter(s=>s!==slug).map(s=>{
    const c=CONFIG[s]||DEFAULT_CFG; let score=0;
    for(const t of me.topics) score+=w(me.topics,t)*w(c.topics,t);
    return {s,score,i:order.indexOf(s)<0?999:order.indexOf(s)};
  }).sort((a,b)=>b.score-a.score||a.i-b.i);
  const nPosts = Math.max(RELATED_MIN_POSTS, RELATED_TOTAL-hubs.length);
  const card=(url,kind,label)=>'<a class="more-card" href="'+attr(url)+'"><span class="mc-t"><small>'+esc(kind)+'</small>'+esc(label)+'</span><span class="arr">→</span></a>';
  return posts.slice(0,nPosts).map(p=>card('/blog/'+p.s,(CONFIG[p.s]||DEFAULT_CFG).tag,postLabel(p.s))).concat(hubs.map(h=>card(h[0],h[1],h[2]))).join('');
}
const REL_OPEN='<!-- g:related (generated by tools/build-blog-post.js from the files on disk; do not edit by hand) -->', REL_CLOSE='<!-- /g:related -->';

function attrsOf(s){ const o=[]; s.replace(/\s([a-zA-Z:-]+)(?:="([^"]*)")?/g,(m,k,v)=>{ o.push([k,v==null?null:v]); return m; }); return o; }
function attrsStr(list){ return list.map(([k,v])=>' '+k+(v==null?'':'="'+v+'"')).join(''); }
// Turn internal links into pending text while their target is missing (and back once it exists).
// Attribute order is preserved, and a link that is already right is left byte-for-byte alone.
function relinkContent(html){
  html = html.replace(/<(a|pc-pending)\b([^>]*)>([\s\S]*?)<\/\1>/g, function(m, tag, rawAttrs, inner){
    const list = attrsOf(rawAttrs);
    const get=k=>{ const x=list.find(a=>a[0]===k); return x?x[1]:null; };
    const href = tag==='a' ? get('href') : get('data-href');
    if(!href || !/^\/(?!\/)/.test(href)) return m;
    const primary = cleanInternal(get('data-href-primary') || href);
    const fallback = get('data-href-fallback') ? cleanInternal(get('data-href-fallback')) : null;
    let want, wantTag, extra;
    if(fileExists(primary)){ wantTag='a'; want=['href',primary]; extra=fallback?[['data-href-fallback',fallback]]:[]; }
    else if(fallback && fileExists(fallback)){ wantTag='a'; want=['href',fallback]; extra=[['data-href-primary',primary],['data-href-fallback',fallback]]; }
    else { wantTag='pc-pending'; want=['data-href',primary]; extra=fallback?[['data-href-fallback',fallback]]:[]; }
    const kept=[]; let placed=false;
    for(const a of list){
      if(a[0]==='href'||a[0]==='data-href'){ if(!placed){ kept.push(want); placed=true; } continue; }
      if(a[0]==='data-href-primary'||a[0]==='data-href-fallback') continue;
      kept.push(a);
    }
    if(!placed) kept.unshift(want);
    const out='<'+wantTag+attrsStr(kept.concat(extra))+'>'+inner+'</'+wantTag+'>';
    return out;
  });
  // blocks that only make sense once a page exists (e.g. a calculator CTA)
  html = html.replace(/<([a-z][a-z0-9]*)\b([^>]*\sdata-needs="([^"]+)"[^>]*)>/g, function(m, tag, rawAttrs, need){
    const list = attrsOf(rawAttrs).filter(a=>a[0]!=='hidden');
    if(!fileExists(need)) list.push(['hidden',null]);
    return '<'+tag+attrsStr(list)+'>';
  });
  return html;
}
function contentBounds(html){
  const a=html.indexOf('<!-- /pc:chrome -->'), b=html.search(/<!-- pc:footer/);
  return { start: a<0?0:a, end: b<0?html.length:b };
}
function relinkPost(slug){
  const file=path.join(BLOG_DIR,slug+'.html');
  const before=fs.readFileSync(file,'utf8');
  const {start,end}=contentBounds(before);
  let mid=before.slice(start,end);
  const i=mid.indexOf('<!-- g:related'), j=mid.indexOf(REL_CLOSE);
  if(i>=0&&j>i) mid=mid.slice(0,i)+REL_OPEN+'\n      '+relatedHtml(slug)+'\n      '+mid.slice(j);
  else {
    // first run on an older post: take over the "Related guides" grid
    const k=mid.indexOf('<h2 class="section-h2">Related guides</h2>');
    const g=k<0?-1:mid.indexOf('<div class="more-grid">',k);
    if(g>=0){ const gs=g+'<div class="more-grid">'.length, ge=mid.indexOf('</div>',gs);
      mid=mid.slice(0,gs)+'\n      '+REL_OPEN+'\n      '+relatedHtml(slug)+'\n      '+REL_CLOSE+'\n    '+mid.slice(ge); }
  }
  mid=relinkContent(mid);
  const after=before.slice(0,start)+mid+before.slice(end);
  if(after!==before) fs.writeFileSync(file,after);
  return after!==before;
}
function relinkIndex(){
  const file=path.join(BLOG_DIR,'index.html'); if(!fs.existsSync(file)) return false;
  const before=fs.readFileSync(file,'utf8');
  const {start,end}=contentBounds(before);
  let html=before.slice(0,start)+relinkContent(before.slice(start,end))+before.slice(end);
  // Blog JSON-LD: one BlogPosting per live card, from each post's own Article JSON-LD
  const live=[]; html.slice(start).replace(/<a\b([^>]*)>/g,(m,at)=>{ const l=attrsOf(at); const c=(l.find(x=>x[0]==='class')||[])[1]||'', h=(l.find(x=>x[0]==='href')||[])[1]||''; const k=h.match(/^\/blog\/([a-z0-9-]+)$/); if(/\bpost-card\b/.test(c)&&k) live.push(k[1]); return m; });
  html=html.replace(/(<script type="application\/ld\+json">\s*)([\s\S]*?)(\s*<\/script>)/, function(m,o,json,c){
    let d; try { d=JSON.parse(json); } catch(e){ return m; }
    const blog=(d['@graph']||[]).find(x=>x['@type']==='Blog'); if(!blog) return m;
    blog.blogPost=live.map(s=>{
      let art={}; try { const p=fs.readFileSync(path.join(BLOG_DIR,s+'.html'),'utf8'); const js=p.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/); const g=JSON.parse(js[1]); art=(g['@graph']||[g]).find(x=>x['@type']==='Article')||{}; } catch(e){}
      return {'@type':'BlogPosting','headline':art.headline||postLabel(s),'url':SITE+'/blog/'+s,'datePublished':art.datePublished,'dateModified':art.dateModified,'author':{'@type':'Organization','name':'PropChamps'}};
    });
    return o+JSON.stringify(d)+c;
  });
  if(html!==before) fs.writeFileSync(file,html);
  return html!==before;
}
function relinkAll(){
  const changed=[];
  for(const s of postSlugsOnDisk()) if(relinkPost(s)) changed.push('blog/'+s+'.html');
  if(relinkIndex()) changed.push('blog/index.html');
  return changed;
}

function build(article){
  const cfg = CONFIG[article.slug] || DEFAULT_CFG;
  const clean = cleanMd(year(article.markdown));
  const blocks = tokenize(clean);
  const title = year(article.title);
  const displayTitle = title.replace(/\s*\(20\d\d\)\s*$/,'');
  const words = clean.split(/\s+/).length;
  const readMin = Math.max(4, Math.round(words/230));

  // locate the Key-takeaways and FAQ H2s
  const ktIdx = blocks.findIndex(b=>b.t==='h'&&b.lvl<=2&&/key takeaways/i.test(b.x));
  const faqIdx = blocks.findIndex(b=>b.t==='h'&&b.lvl<=2&&/(frequently asked|^faq)/i.test(b.x));
  const introEnd = ktIdx>=0?ktIdx:(faqIdx>=0?faqIdx:blocks.length);
  const intro = blocks.slice(1, introEnd).filter(b=>b.t==='p'||b.t==='ul'||b.t==='ol'||b.t==='table'||b.t==='quote');
  const takeaways = (ktIdx>=0 && blocks[ktIdx+1] && blocks[ktIdx+1].t==='ul') ? blocks[ktIdx+1].it : [];
  const bodyStart = ktIdx>=0 ? ktIdx+2 : introEnd;
  const bodyEnd = faqIdx>=0 ? faqIdx : blocks.length;
  const bodyBlocks = blocks.slice(bodyStart, bodyEnd);

  // FAQ
  const faq=[]; if(faqIdx>=0){ let j=faqIdx+1; while(j<blocks.length){ if(blocks[j].t==='h'&&blocks[j].lvl>=3){ const q=blocks[j].x; const ans=[]; j++; while(j<blocks.length&&!(blocks[j].t==='h'&&blocks[j].lvl<=3)){ ans.push(blocks[j]); j++; } faq.push({q, a:ans}); } else { j++; } } }

  // dek + meta: hand-written fields win; otherwise derive them from the first intro paragraph
  const firstP = plain((intro.find(b=>b.t==='p')||{x:displayTitle}).x);
  const dek = article.dek ? plain(year(article.dek)) : (firstP.length>240 ? firstP.slice(0,firstP.slice(0,240).lastIndexOf(' '))+'…' : firstP);
  const metaDesc = article.metaDescription ? plain(year(article.metaDescription)) : (firstP.length>158 ? firstP.slice(0,firstP.slice(0,158).lastIndexOf(' '))+'…' : firstP);
  const titleTag = pageTitle(article);
  const shareTitle = article.seoTitle ? year(article.seoTitle).trim() : displayTitle;
  if(article.seoTitle && titleTag.length>60) console.warn('  ! '+article.slug+': title is '+titleTag.length+' chars (max 60)');
  if(article.metaDescription && metaDesc.length>155) console.warn('  ! '+article.slug+': meta description is '+metaDesc.length+' chars (max 155)');

  // render body
  const state={nav:[],leadDone:false,ids:new Set(['faq','sectionNav'])};
  let bodyHtml='';
  intro.forEach(b=>{ bodyHtml+=renderBlock(b,state); });
  bodyBlocks.forEach(b=>{ bodyHtml+=renderBlock(b,state); });

  const takeawaysHtml = takeaways.length ? '<div class="takeaways" data-reveal><span class="kt-label">The short version</span><ul>'+takeaways.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ul></div>' : '';

  const faqHtml = faq.map(f=>'<details class="faq-item"><summary class="faq-q">'+inline(f.q)+'<span class="faq-toggle-icon">+</span></summary><div class="faq-a">'+f.a.map(b=>renderBlock(b,{nav:[],leadDone:true,ids:state.ids})).join('')+'</div></details>').join('\n      ');
  const faqSchema = faq.map(f=>({ '@type':'Question', name:plain(f.q), acceptedAnswer:{ '@type':'Answer', text:f.a.map(blockText).filter(Boolean).join(' ') } }));

  const nav = state.nav.concat(faq.length?[{id:'faq',label:'FAQ'}]:[]);
  const navHtml = nav.map(n=>'<a class="section-nav-link" href="#'+n.id+'">'+esc(n.label)+'</a>').join('');
  const url=SITE+'/blog/'+article.slug;
  const published = article.datePublished || DATE;

  const schema = {'@context':'https://schema.org','@graph':[
    {'@type':'Article','@id':url+'#article','headline':displayTitle,'description':metaDesc,'image':SITE+'/og-image.jpg','datePublished':published,'dateModified':DATE,'inLanguage':'en','articleSection':cfg.tag,'author':{'@type':'Organization','name':'PropChamps','url':SITE},'publisher':{'@type':'Organization','name':'PropChamps','url':SITE,'logo':{'@type':'ImageObject','url':SITE+'/logos/pc-logo.png'}},'mainEntityOfPage':{'@type':'WebPage','@id':url}},
    {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':SITE+'/'},{'@type':'ListItem','position':2,'name':'Blog','item':SITE+'/blog/'},{'@type':'ListItem','position':3,'name':displayTitle}]}
  ]};
  if(faqSchema.length) schema['@graph'].push({'@type':'FAQPage','@id':url+'#faq','mainEntity':faqSchema});

  const faqSection = faq.length ? `
<section class="block" id="faq">
  <div class="container">
    <div class="section-eyebrow">Common questions</div>
    <h2 class="section-h2">Frequently asked questions</h2>
    <div class="faq-list">
      ${faqHtml}
    </div>
  </div>
</section>
` : '';

  const html = `<!DOCTYPE html>
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
<title>${esc(titleTag)}</title>
<meta name="description" content="${attr(metaDesc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="PropChamps">
<meta property="og:title" content="${attr(shareTitle)}">
<meta property="og:description" content="${attr(metaDesc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="PropChamps — Independent prop firm research">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/og-image.jpg">
<meta name="twitter:title" content="${attr(shareTitle)}">
<meta name="twitter:description" content="${attr(metaDesc)}">
<script type="application/ld+json">
${JSON.stringify(schema)}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/blog/blog.css">
<!-- pc:head --><!-- /pc:head -->
</head>
<body>

<!-- pc:chrome --><!-- /pc:chrome -->

<section class="article-hero">
  <div class="bg-stack"></div>
  <div class="container">
    <div class="breadcrumbs"><a href="/">Home</a><span>/</span><a href="/blog/">Blog</a><span>/</span>${esc(displayTitle)}</div>
    <div class="article-eyebrow">${esc(cfg.eyebrow)}</div>
    <h1>${esc(displayTitle)}</h1>
    <p class="article-dek">${esc(dek)}</p>
    <div class="article-byline"><span><span class="live-dot"></span> <strong>PropChamps Research</strong></span><span class="sep"></span><span>Last reviewed ${DATE_LONG}</span><span class="sep"></span><span>~${readMin} min read</span></div>
  </div>
</section>

<nav class="section-nav" id="sectionNav">
  <div class="container">
    <span class="section-nav-label">Jump to</span>
    ${navHtml}
  </div>
</nav>

<section class="block" style="border-top:0">
  <div class="container">
    <div class="article-body">
      ${takeawaysHtml}
      ${bodyHtml}
    </div>
  </div>
</section>
${faqSection}
<div class="author-box" data-reveal>
  <img class="ab-logo" src="/logos/pc-mark.png" alt="PropChamps">
  <div>
    <h4>PropChamps Research</h4>
    <p>We independently track rules, drawdown methods, payouts, and promo codes across every major futures prop firm, and re-verify them weekly against each firm's own documentation. See <a href="/methodology">how we audit</a>.</p>
  </div>
</div>

<section class="cta-band">
  <div class="container">
    <div class="cta-card" data-reveal>
      <h2>Compare every futures prop firm</h2>
      <p>Rules, drawdown method, payout split, and price — side by side, in one table, checked against each firm’s own help center.</p>
      <div class="cta-row">
        <a class="btn-primary" href="/compare">Compare firms
          <svg width="14" height="14" viewbox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
        </a>
        <a class="btn-ghost" href="/deals">See active deals</a>
      </div>
    </div>
  </div>
</section>

<section class="block">
  <div class="container">
    <div class="section-eyebrow">Keep reading</div>
    <h2 class="section-h2">Related guides</h2>
    <div class="more-grid">
      ${REL_OPEN}
      ${REL_CLOSE}
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
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.08,rootMargin:'0px 0px -40px 0px'});els.forEach(function(el){io.observe(el);});setTimeout(function(){els.forEach(function(el){el.classList.add('in');});},2500);}else{els.forEach(function(el){el.classList.add('in');});}
})();
</script>
</body>
</html>
`;
  return { html, slug:article.slug, displayTitle, dek, readMin, tag:cfg.tag, faqCount:faq.length, navCount:nav.length, titleTag, metaDesc };
}

module.exports = { build, renderFragment, relinkAll, relinkContent, relatedHtml, fileExists, plain, CONFIG, HUBS, REDIRECTS, DATE, YEAR, DATE_LONG };

// ---- run ----
if (require.main === module) {
  if (ARGV.includes('--relink')) {
    const changed = relinkAll();
    console.log(changed.length ? 'Relinked:\n  '+changed.join('\n  ') : 'Relink: every post already up to date');
    process.exit(0);
  }
  const inPath = ARGV.find(a => !/^--/.test(a));
  if(!inPath){ console.error('usage: node tools/build-blog-post.js <drafts.json> [--date=YYYY-MM-DD] [--no-relink]\n       node tools/build-blog-post.js --relink'); process.exit(1); }
  const raw = JSON.parse(fs.readFileSync(inPath,'utf8'));
  const articles = Array.isArray(raw) ? raw : raw.result;
  const cards=[], sitemap=[];
  articles.forEach(a=>{
    const r = build(a);
    fs.writeFileSync(path.join(BLOG_DIR,r.slug+'.html'), r.html);
    console.log('  ✓ blog/'+r.slug+'.html  ('+r.readMin+' min · '+r.faqCount+' FAQ · '+r.navCount+' nav · title '+r.titleTag.length+' · meta '+r.metaDesc.length+')');
    cards.push('      <a class="post-card" href="/blog/'+r.slug+'" data-reveal>\n        <span class="pc-tag">'+r.tag+'</span>\n        <h2>'+esc(r.displayTitle)+'</h2>\n        <p>'+esc(r.dek)+'</p>\n        <div class="pc-foot"><span>'+r.tag+'</span><span>~'+r.readMin+' min read</span><span class="pc-read">Read</span></div>\n      </a>');
    sitemap.push('  <url>\n    <loc>'+SITE+'/blog/'+r.slug+'</loc>\n    <lastmod>'+DATE+'</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>');
  });
  fs.writeFileSync(path.join(BLOG_DIR,'_cards.html'), cards.join('\n'));
  fs.writeFileSync(path.join(BLOG_DIR,'_sitemap.txt'), sitemap.join('\n'));
  console.log('\nWrote '+articles.length+' posts (dated '+DATE+'). Card + sitemap snippets in blog/_cards.html and blog/_sitemap.txt');
  if (!ARGV.includes('--no-relink')) { const changed = relinkAll(); if (changed.length) console.log('Relinked (related guides / pending links): '+changed.length+' files'); }
  console.log('Next: node tools/pc-build.mjs  (injects the shared chrome/footer/assets into the new pages)');
}
