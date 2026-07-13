#!/usr/bin/env node
/**
 * build-blog-post.js — Assemble PropChamps blog articles from markdown drafts.
 *
 * Turns a batch of {slug, title, markdown} drafts (e.g. from the blog-batch
 * workflow) into full /blog/<slug>.html pages that match the drawdown flagship
 * EXACTLY: same head/schema, editorial strip, header, footer, section-nav,
 * FAQ accordion, author box, CTA. This is the reusable engine for volume.
 *
 * USAGE: node tools/build-blog-post.js <drafts.json>
 *   drafts.json = either an array of {slug,title,markdown} OR a workflow
 *   output object with a `.result` array of the same. Per-slug presentation
 *   (eyebrow, related links) comes from CONFIG below; everything else is
 *   derived from the markdown. Prints post-card + sitemap snippets at the end.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DATE = '2026-07-13';

// Per-article presentation (body/meta are derived from the markdown).
const CONFIG = {
  'how-to-pass-a-prop-firm-evaluation': { eyebrow: 'Prop firm guide · How-to', tag: 'Guide',
    related: [['/compare','Compare every firm'],['/best/best-prop-firm-for-beginners','Best firms for beginners'],['/blog/prop-firm-drawdown-explained','Drawdown explained']] },
  'are-futures-prop-firms-worth-it': { eyebrow: 'Prop firm guide · Honest take', tag: 'Guide',
    related: [['/payouts','Payout data'],['/audit-log','Audit log'],['/methodology','How we audit']] },
  'instant-funding-vs-evaluation-prop-firms': { eyebrow: 'Prop firm rules · Explained', tag: 'Explainer',
    related: [['/compare','Compare every firm'],['/deals','Active deals'],['/blog/prop-firm-drawdown-explained','Drawdown explained']] },
  'what-happens-when-you-break-a-prop-firm-rule': { eyebrow: 'Prop firm rules · Explained', tag: 'Explainer',
    related: [['/blog/prop-firm-drawdown-explained','Drawdown explained'],['/guide','Beginner’s guide'],['/compare','Compare every firm']] },
};

function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function attr(s){ return esc(s).replace(/"/g,'&quot;'); }
function slugify(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,50); }
function inline(md){
  // escape, then re-apply the markdown we allow (links, bold, italic, code)
  let s = esc(md);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(m,t,u){ return '<a href="'+attr(u)+'">'+t+'</a>'; });
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
  let h='<div class="table-wrap"><table class="data"><thead><tr>'+head.map(c=>'<th>'+inline(c)+'</th>').join('')+'</tr></thead><tbody>';
  h+=body.map(r=>'<tr>'+r.map((c,i)=>'<td'+(i===0?' class="firm-c"':'')+'>'+inline(c)+'</td>').join('')+'</tr>').join('');
  return h+'</tbody></table></div>';
}
function renderBlock(bl, state){
  if(bl.t==='h'){ if(bl.lvl<=2){ const id=slugify(bl.x); state.nav.push({id,label:bl.x}); return '<h2 id="'+id+'">'+inline(bl.x)+'</h2>'; } return '<h3>'+inline(bl.x)+'</h3>'; }
  if(bl.t==='p'){ const lead=!state.leadDone; state.leadDone=true; return '<p'+(lead?' class="lead"':'')+'>'+inline(bl.x)+'</p>'; }
  if(bl.t==='ul'){ return '<ul>'+bl.it.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ul>'; }
  if(bl.t==='ol'){ return '<ol>'+bl.it.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ol>'; }
  if(bl.t==='table'){ return renderTable(bl.rows); }
  if(bl.t==='quote'){ return '<div class="callout tip"><span class="callout-label">Note</span>'+inline(bl.x)+'</div>'; }
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
function build(article){
  const cfg = CONFIG[article.slug] || { eyebrow:'Prop firm guide', tag:'Guide', related:[['/compare','Compare firms'],['/guide','Beginner’s guide'],['/blog/prop-firm-drawdown-explained','Drawdown explained']] };
  const clean = cleanMd(article.markdown);
  const blocks = tokenize(clean);
  const title = article.title;
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

  // derive dek + meta from the first intro paragraph
  const firstP = (intro.find(b=>b.t==='p')||{x:displayTitle}).x.replace(/\*\*/g,'');
  const dek = firstP.length>240 ? firstP.slice(0,firstP.slice(0,240).lastIndexOf(' '))+'…' : firstP;
  const metaDesc = (firstP.length>158 ? firstP.slice(0,firstP.slice(0,158).lastIndexOf(' '))+'…' : firstP);

  // render body
  const state={nav:[],leadDone:false};
  let bodyHtml='';
  intro.forEach(b=>{ bodyHtml+=renderBlock(b,state); });
  bodyBlocks.forEach(b=>{ bodyHtml+=renderBlock(b,state); });

  const takeawaysHtml = takeaways.length ? '<div class="takeaways" data-reveal><span class="kt-label">The short version</span><ul>'+takeaways.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ul></div>' : '';

  const faqHtml = faq.map(f=>'<details class="faq-item"><summary class="faq-q">'+inline(f.q)+'<span class="faq-toggle-icon">+</span></summary><div class="faq-a">'+f.a.map(b=>renderBlock(b,{nav:[],leadDone:true})).join('')+'</div></details>').join('\n      ');
  const faqSchema = faq.map(f=>({ '@type':'Question', name:f.q.replace(/[*`]/g,''), acceptedAnswer:{ '@type':'Answer', text:f.a.filter(b=>b.t==='p').map(b=>b.x.replace(/\*\*/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1')).join(' ') } }));

  const nav = state.nav.concat(faq.length?[{id:'faq',label:'FAQ'}]:[]);
  const navHtml = nav.map(n=>'<a class="section-nav-link" href="#'+n.id+'">'+esc(n.label)+'</a>').join('');
  const url='https://propchamps.net/blog/'+article.slug;

  const schema = {'@context':'https://schema.org','@graph':[
    {'@type':'Article','@id':url+'#article','headline':title,'description':metaDesc,'image':'https://propchamps.net/og-image.jpg','datePublished':DATE,'dateModified':DATE,'inLanguage':'en','articleSection':cfg.tag,'author':{'@type':'Organization','name':'PropChamps','url':'https://propchamps.net'},'publisher':{'@type':'Organization','name':'PropChamps','url':'https://propchamps.net','logo':{'@type':'ImageObject','url':'https://propchamps.net/logos/propchamps.png'}},'mainEntityOfPage':{'@type':'WebPage','@id':url}},
    {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':'https://propchamps.net/'},{'@type':'ListItem','position':2,'name':'Blog','item':'https://propchamps.net/blog/'},{'@type':'ListItem','position':3,'name':displayTitle}]}
  ]};
  if(faqSchema.length) schema['@graph'].push({'@type':'FAQPage','@id':url+'#faq','mainEntity':faqSchema});

  const related = cfg.related.map(r=>'<a class="more-card" href="'+r[0]+'"><span>'+esc(r[1])+'</span><span class="arr">→</span></a>').join('');

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
<meta name="theme-color" content="#0a0d12">
<title>${esc(title)} | PropChamps</title>
<meta name="description" content="${attr(metaDesc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="PropChamps">
<meta property="og:title" content="${attr(displayTitle)}">
<meta property="og:description" content="${attr(metaDesc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://propchamps.net/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="PropChamps — Independent prop firm research">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://propchamps.net/og-image.jpg">
<meta name="twitter:title" content="${attr(displayTitle)}">
<meta name="twitter:description" content="${attr(metaDesc)}">
<script type="application/ld+json">
${JSON.stringify(schema)}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/blog/blog.css">
</head>
<body>

<div class="editorial-strip"><div class="container"><div class="lhs"><span class="dot"></span><span>Independent prop firm research · Reviewed weekly</span></div><div class="rhs">Last reviewed July 13, 2026</div></div></div>

<header class="site">
  <div class="container">
    <a class="logo-mark" href="/" aria-label="PropChamps home"><img src="/logos/propchamps.png" alt="PropChamps"></a>
    <nav class="primary">
      <a href="/">Firms</a><a href="/compare">Compare</a><a href="/deals">Deals</a><a href="/payouts">Payouts</a><a href="/audit-log">Audit log</a><a href="/guide">Guide</a><a href="/blog/" class="active">Blog</a>
    </nav>
    <a class="header-cta" href="/compare">Compare firms
      <svg width="14" height="14" viewbox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12 L11 8 L5 4"/></svg>
    </a>
    <button class="menu-toggle" id="menuToggle" aria-label="Open menu"><span class="bar"></span></button>
  </div></header>
<div class="mobile-menu" id="mobileMenu">
  <a href="/">Firms</a><a href="/compare">Compare</a><a href="/deals">Deals</a><a href="/payouts">Payouts</a><a href="/audit-log">Audit log</a><a href="/guide">Guide</a><a href="/blog/">Blog</a><a href="/methodology">Methodology</a>
  <a class="mobile-cta" href="/compare">Compare firms →</a>
</div>

<section class="article-hero">
  <div class="bg-stack"></div>
  <div class="container">
    <div class="breadcrumbs"><a href="/">Home</a><span>/</span><a href="/blog/">Blog</a><span>/</span>${esc(displayTitle)}</div>
    <div class="article-eyebrow">${esc(cfg.eyebrow)}</div>
    <h1>${esc(displayTitle)}</h1>
    <p class="article-dek">${esc(dek)}</p>
    <div class="article-byline"><span><span class="live-dot"></span> <strong>PropChamps Research</strong></span><span class="sep"></span><span>Last reviewed July 13, 2026</span><span class="sep"></span><span>~${readMin} min read</span></div>
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

<section class="block" id="faq">
  <div class="container">
    <div class="section-eyebrow">Common questions</div>
    <h2 class="section-h2">Frequently asked questions</h2>
    <div class="faq-list">
      ${faqHtml}
    </div>
  </div>
</section>

<div class="author-box" data-reveal>
  <img class="ab-logo" src="/logos/propchamps.png" alt="PropChamps">
  <div>
    <h4>PropChamps Research</h4>
    <p>We independently track rules, drawdown methods, payouts, and promo codes across every major futures prop firm, and re-verify them weekly against each firm's own documentation. See <a href="/methodology">how we audit</a>.</p>
  </div>
</div>

<section class="cta-band">
  <div class="container">
    <div class="cta-card" data-reveal>
      <h2>Compare every futures prop firm</h2>
      <p>Rules, drawdown method, payout split, and price — side by side, in one table, re-verified weekly.</p>
      <div class="cta-row">
        <a class="btn-primary" href="/compare">Compare firms
          <svg width="14" height="14" viewbox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12 L11 8 L5 4"/></svg>
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
      ${related}
    </div>
  </div>
</section>

<footer class="site">
  <div class="container">
    <div class="top">
      <div class="brand">
        <a class="logo-mark" href="/"><img src="/logos/propchamps.png" alt="PropChamps"></a>
        <p>Independent research on futures prop trading firms. We track rules, payouts, drawdown methods, and active promo codes — and publish what changes.</p>
      </div>
      <div><h4>Research</h4><ul><li><a href="/">All firms</a></li><li><a href="/compare">Compare</a></li><li><a href="/deals">Active deals</a></li><li><a href="/payouts">Payouts</a></li><li><a href="/audit-log">Audit log</a></li></ul></div>
      <div><h4>Editorial</h4><ul><li><a href="/blog/">Blog</a></li><li><a href="/guide">Beginner's guide</a></li><li><a href="/join">Join the list</a></li><li><a href="/methodology">How we audit</a></li></ul></div>
      <div><h4>Legal</h4><ul><li><a href="/privacy">Privacy</a></li><li><a href="/methodology#disclosure">Affiliate disclosure</a></li></ul></div>
    </div>
    <div class="legal">
      <div>© 2026 PropChamps. Independent prop firm research. Not financial advice.</div>
      <div>Trading involves substantial risk.</div>
    </div>
  </div>
</footer>

<script>
(function(){
  var toggle=document.getElementById('menuToggle'),header=document.querySelector('header.site');
  if(toggle){toggle.addEventListener('click',function(){var o=header.classList.toggle('is-open');document.body.classList.toggle('is-menu-open',o);});
    document.querySelectorAll('.mobile-menu a').forEach(function(a){a.addEventListener('click',function(){header.classList.remove('is-open');document.body.classList.remove('is-menu-open');});});}
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
  return { html, slug:article.slug, displayTitle, dek, readMin, tag:cfg.tag, faqCount:faq.length, navCount:nav.length };
}

// ---- run ----
const inPath = process.argv[2];
if(!inPath){ console.error('usage: node tools/build-blog-post.js <drafts.json>'); process.exit(1); }
let raw = JSON.parse(fs.readFileSync(inPath,'utf8'));
const articles = Array.isArray(raw) ? raw : raw.result;
const cards=[], sitemap=[];
articles.forEach(a=>{
  const r = build(a);
  fs.writeFileSync(path.join(ROOT,'blog',r.slug+'.html'), r.html);
  console.log('  ✓ blog/'+r.slug+'.html  ('+r.readMin+' min · '+r.faqCount+' FAQ · '+r.navCount+' nav)');
  cards.push('      <a class="post-card" href="/blog/'+r.slug+'" data-reveal>\n        <span class="pc-tag">'+r.tag+'</span>\n        <h2>'+esc(r.displayTitle)+'</h2>\n        <p>'+esc(r.dek)+'</p>\n        <div class="pc-foot"><span>'+r.tag+'</span><span>~'+r.readMin+' min read</span><span class="pc-read">Read</span></div>\n      </a>');
  sitemap.push('  <url>\n    <loc>https://propchamps.net/blog/'+r.slug+'</loc>\n    <lastmod>'+DATE+'</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>');
});
fs.writeFileSync(path.join(ROOT,'blog','_cards.html'), cards.join('\n'));
fs.writeFileSync(path.join(ROOT,'blog','_sitemap.txt'), sitemap.join('\n'));
console.log('\nWrote '+articles.length+' posts. Card + sitemap snippets in blog/_cards.html and blog/_sitemap.txt');
