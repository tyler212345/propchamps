#!/usr/bin/env node
/**
 * build-vs-page.js — generate /vs/<a>-vs-<b>.html head-to-head pages.
 * The comparison MATRIX is rendered client-side by /vs/vs.js from
 * window.PROPCHAMPS_VS = [slugA, slugB] against /data/firms.js — so this only
 * templatizes the bespoke SEO + prose (title, meta, schema, verdict, pick,
 * FAQ). Same chrome/footer as the hand-authored vs pages. Add a config to
 * CONFIGS and run:  node tools/build-vs-page.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const REVIEW_DATE = 'September 18, 2026';
const ISO = '2026-09-18';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const stripTags = (s) => String(s).replace(/<[^>]+>/g, '');

const CONFIGS = [
  {
    vsSlug: 'apex-trader-funding-vs-lucid-trading',
    a: { slug: 'apex-trader', name: 'Apex Trader Funding', review: '/firms/apex-trader' },
    b: { slug: 'lucid-trading', name: 'Lucid Trading', review: '/firms/lucid-trading' },
    title: 'Apex Trader Funding vs Lucid Trading (2026)',
    metaDesc: 'Apex Trader Funding vs Lucid Trading compared: discount, payout split, drawdown, payout caps and plans. See which CHAMP-code futures prop firm fits how you trade.',
    ogDesc: 'Discount, payout split, drawdown and payout caps compared head-to-head.',
    heroSub: "Two of the biggest discount-driven futures firms. Apex leans on the deepest discount and now keeps 100% of your payout; Lucid trades a split for four flexible paths and a configurable evaluation. Here's how they compare.",
    verdictP1: '<strong>Apex Trader Funding</strong> is the discount-and-volume heavyweight: CHAMP takes 90% off the evaluation, funded accounts now keep a flat <strong>100% of the payout (no split)</strong>, and it has by far the deeper track record ($300M+ paid). You pick one of two trailing types — Intraday Trail (tighter, no eval daily loss limit) or EOD Trail (end-of-day drawdown with a DLL) — and pass in a single day.',
    verdictP2: '<strong>Lucid Trading</strong> keeps a 90/10 split but gives you more room to shape the account: four paths (Pro, Flex, Daily, Direct), an optional daily-loss-limit toggle, and a configurable Daily eval where you pick EOD or intraday drawdown. Its funded accounts use the LucidScale model (the drawdown locks to 60% of your peak end-of-day balance). Both firms cap payouts per request in the sim-funded stage until you reach the live stage.',
    callout: 'Want the <strong>biggest discount</strong>, a <strong>100% payout with no split</strong>, and the longest payout history? Apex. Want <strong>path flexibility</strong>, an optional DLL, and a configurable eval? Lucid.',
    comparisonIntro: 'The numbers that actually decide it — pulled live from our firm database and re-verified in the Sept 18 audit. Highlighted rows are where the two firms differ.',
    pickIntro: "Both run huge CHAMP discounts — the real split is Apex's simplicity and 100% payout versus Lucid's flexibility.",
    pickA: { tag: 'Pick for the discount + 100% payout', bullets: ['You want the biggest CHAMP discount (90% off)', 'You want to keep 100% of your payout — no profit split', 'You value the deepest payout track record ($300M+)', 'You like a simple 1-day pass, two trailing types'] },
    pickB: { tag: 'Pick for flexibility', bullets: ['You want to choose from four paths (Pro / Flex / Daily / Direct)', 'You want an optional daily loss limit you can toggle', 'You want a configurable eval (pick EOD or intraday drawdown)', 'You prefer a straight-to-funded option (Direct)'] },
    faq: [
      { q: 'Which is cheaper — Apex or Lucid?', a: 'Both run large CHAMP discounts, but <strong>Apex advertises the single biggest one — 90% off the evaluation</strong>. Lucid discounts at checkout too (the exact rate varies), so confirm both current prices on the <a href="/deals">deals page</a>.' },
      { q: 'Which lets you keep more of your profit?', a: '<strong>Apex now pays a flat 100% with no split</strong> in the sim-funded stage. Lucid keeps a 90/10 split (you keep 90%). Note Apex caps each payout on a rising ladder, so read the payout rows above.' },
      { q: 'How do their drawdowns differ?', a: 'Apex offers a tighter <strong>Intraday Trail</strong> (no daily loss limit in the eval) or an <strong>EOD Trail</strong> with a DLL. Lucid uses EOD drawdown with an optional DLL, then the LucidScale model once funded (drawdown locks to 60% of your peak EOD balance).' },
      { q: 'Do both cap your payouts?', a: 'Yes — in the sim-funded stage. Apex caps each payout on a six-payout ladder (then the account closes); Lucid caps per request until you reach the live stage (LucidDaily is the exception). The exact caps are in the comparison above.' },
    ],
    related: [['/vs/apex-trader-funding-vs-tradeify', 'Apex vs Tradeify'], ['/vs/apex-trader-funding-vs-alpha-futures', 'Apex vs Alpha Futures'], ['/compare', 'Compare every firm']],
  },
  {
    vsSlug: 'apex-trader-funding-vs-alpha-futures',
    a: { slug: 'apex-trader', name: 'Apex Trader Funding', review: '/firms/apex-trader' },
    b: { slug: 'alpha-futures', name: 'Alpha Futures', review: '/firms/alpha-futures' },
    title: 'Apex Trader Funding vs Alpha Futures (2026)',
    metaDesc: 'Apex Trader Funding vs Alpha Futures compared: discount, payout split, drawdown, news-trading rules and plans. See which futures prop firm fits how you trade.',
    ogDesc: 'Discount, payout split, drawdown and news rules compared head-to-head.',
    heroSub: "One is the discount king; the other sells freedom. Apex runs the biggest coupon and now keeps 100% of your payout; Alpha's Advanced plan drops the daily loss limit and news restrictions entirely. Here's how they stack up.",
    verdictP1: '<strong>Apex Trader Funding</strong> wins on price and payout keep: CHAMP takes 90% off, funded accounts keep a flat <strong>100% (no split)</strong>, and the payout history is enormous. You get a 1-day pass and a choice of Intraday or EOD trailing drawdown — but funded payouts are capped on a six-payout ladder.',
    verdictP2: "<strong>Alpha Futures</strong> is the premium pick. Its <strong>Advanced</strong> plan pays 90% from day one, carries <strong>no daily loss limit and no news restrictions</strong>, and allows $15,000-per-request withdrawals; its Zero plan offers a genuine one-day pass. Alpha keeps a flat 90% split across the board and uses an end-of-day trailing Maximum Loss Limit. CHAMP's discount at Alpha is smaller than Apex's.",
    callout: 'Want the <strong>cheapest entry and a 100% payout</strong>? Apex. Want to <strong>trade news with no daily loss limit</strong> and take big withdrawals? Alpha Advanced.',
    comparisonIntro: 'The numbers that decide it — pulled live from our firm database and re-verified in the Sept 18 audit. Highlighted rows are where the two firms differ.',
    pickIntro: "It comes down to price and payout keep (Apex) versus rule freedom on the funded account (Alpha's Advanced plan).",
    pickA: { tag: 'Pick for price + 100% payout', bullets: ['You want the biggest CHAMP discount (90% off)', 'You want to keep 100% of your payout — no split', 'You value the deepest payout track record', 'A fast 1-day pass and two trailing types suit you'] },
    pickB: { tag: 'Pick for rule freedom', bullets: ['You want to trade news (Advanced has no news restrictions)', 'You want no daily loss limit on the funded account (Advanced)', 'You want large per-request withdrawals (up to $15,000 on Advanced)', 'You want a flat 90% split with no payout-count cap'] },
    faq: [
      { q: 'Which has the bigger discount?', a: '<strong>Apex — CHAMP takes 90% off</strong> the evaluation, the biggest standing discount on the site. Alpha also honors CHAMP but at a smaller rate; confirm both on the <a href="/deals">deals page</a>.' },
      { q: 'Which pays more of your profit?', a: '<strong>Apex now pays a flat 100% (no split)</strong> but caps each payout on a six-payout ladder. Alpha pays a flat 90% with no payout-count cap. Which nets more depends on how much and how often you withdraw.' },
      { q: 'Which is better for news trading?', a: "<strong>Alpha Futures</strong> — its Advanced plan has <strong>no news restrictions</strong>. Apex allows trading through news with a normal strategy but prohibits dedicated news/straddle strategies and hedging." },
      { q: 'How do the drawdowns compare?', a: "Apex offers a tighter <strong>Intraday Trail</strong> (no eval DLL) or <strong>EOD Trail</strong> (with a DLL). Alpha uses an end-of-day trailing Maximum Loss Limit; its Advanced plan carries no daily loss limit at all." },
    ],
    related: [['/vs/apex-trader-funding-vs-lucid-trading', 'Apex vs Lucid Trading'], ['/vs/apex-trader-funding-vs-tradeify', 'Apex vs Tradeify'], ['/compare', 'Compare every firm']],
  },
  {
    vsSlug: 'fundednext-vs-my-funded-futures',
    a: { slug: 'fundednext', name: 'FundedNext', review: '/firms/fundednext' },
    b: { slug: 'my-funded-futures', name: 'My Funded Futures', review: '/firms/my-funded-futures' },
    title: 'FundedNext vs My Funded Futures (2026)',
    metaDesc: 'FundedNext vs My Funded Futures compared: reward share, payout speed, drawdown, plans and pricing. See which multi-plan futures prop firm fits how you trade.',
    ogDesc: 'Reward share, payout speed, drawdown and plans compared head-to-head.',
    heroSub: "Two fast-growing, multi-plan futures firms — both now one-time payments. FundedNext leads with the highest reward share on the site; My Funded Futures counters with daily payouts and a ladder to a real live account. Here's how they compare.",
    verdictP1: "<strong>FundedNext</strong> (its futures product) has the standout number: its <strong>Flex plan pays a 95% reward share</strong> — the highest we track — on a 5-benchmark-day cycle. It runs Flex, Legacy, and two Rapid paths (Pro and Daily), all on end-of-day trailing drawdown, all one-time payments, with a 40% consistency rule by phase.",
    verdictP2: "<strong>My Funded Futures</strong> is built around speed and a path to the real thing. Its Rapid plan pays <strong>daily</strong> and switches to intraday trailing once funded (the drawdown locks after a $100 buffer); Builder gives you a five-payout ladder to a live funded account at Blue Row Capital. MFF is also now one-time across the board, with no daily loss limit and no activation fee.",
    callout: 'Want the <strong>highest reward share</strong> (95% on Flex)? FundedNext. Want <strong>daily payouts</strong> and a ladder to a real live account? My Funded Futures.',
    comparisonIntro: 'The numbers that decide it — pulled live from our firm database and re-verified in the Sept 18 audit. Highlighted rows are where the two firms differ.',
    pickIntro: "Both are one-time, multi-plan firms with no daily loss limit — the split is reward share (FundedNext) versus payout speed and the live-account ladder (MFF).",
    pickA: { tag: 'Pick for the highest share', bullets: ['You want the top reward share on the site — 95% on Flex', 'You like a clear 5-benchmark-day payout cycle', 'You want multiple paths (Flex / Legacy / Rapid Pro / Rapid Daily)', 'You prefer a one-time payment with EOD trailing drawdown'] },
    pickB: { tag: 'Pick for speed + a real account', bullets: ['You want daily payouts (Rapid)', 'You want intraday trailing once funded (locks after a $100 buffer)', 'You want a ladder to a real live funded account (Builder)', 'You want one-time pricing with no DLL and no activation fee'] },
    faq: [
      { q: 'Which pays a bigger share of your profit?', a: "<strong>FundedNext</strong> — its Flex plan pays a <strong>95% reward share</strong>, the highest we track. My Funded Futures pays 90/10 on Rapid and 80/20 on Pro. Match the plan to your goal in the comparison above." },
      { q: 'Which pays out faster?', a: "<strong>My Funded Futures</strong> Rapid pays <strong>daily</strong>. FundedNext's Rapid Daily also pays daily, but its flagship Flex pays on a 5-benchmark-day cycle. Both process quickly." },
      { q: 'Are both one-time payments now?', a: 'Yes. Both FundedNext and My Funded Futures moved to <strong>one-time purchases</strong> (no monthly renewals). Confirm the current promo price for each at checkout.' },
      { q: 'How do their drawdowns differ?', a: "FundedNext uses <strong>end-of-day trailing</strong> drawdown on every plan. My Funded Futures Rapid uses EOD drawdown in the eval, then <strong>switches to intraday trailing once funded</strong> — which locks permanently after a $100 buffer." },
    ],
    related: [['/vs/tradeify-vs-my-funded-futures', 'Tradeify vs My Funded Futures'], ['/vs/take-profit-trader-vs-my-funded-futures', 'Take Profit vs My Funded Futures'], ['/compare', 'Compare every firm']],
  },
];

function faqSchema(faq) {
  return faq.map((f) => ({ '@type': 'Question', name: stripTags(f.q).replace(/\s*\?$/, '?').trim(), acceptedAnswer: { '@type': 'Answer', text: stripTags(f.a) } }));
}

function page(c) {
  const url = 'https://propchamps.net/vs/' + c.vsSlug;
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', '@id': url + '#article', headline: c.title, description: c.metaDesc, image: 'https://propchamps.net/og-image.jpg', datePublished: ISO, dateModified: ISO, inLanguage: 'en', author: { '@type': 'Organization', name: 'PropChamps', url: 'https://propchamps.net' }, publisher: { '@type': 'Organization', name: 'PropChamps', url: 'https://propchamps.net', logo: { '@type': 'ImageObject', url: 'https://propchamps.net/logos/propchamps.png' } }, about: [{ '@type': 'Organization', name: c.a.name }, { '@type': 'Organization', name: c.b.name }], mainEntityOfPage: { '@type': 'WebPage', '@id': url } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://propchamps.net/' }, { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://propchamps.net/compare' }, { '@type': 'ListItem', position: 3, name: c.a.name + ' vs ' + c.b.name }] },
    { '@type': 'FAQPage', '@id': url + '#faq', mainEntity: faqSchema(c.faq) },
  ] };
  const bullets = (arr) => arr.map((x) => '<li>' + esc(x) + '</li>').join('');
  const faqHtml = c.faq.map((f) => `      <details class="faq-item"><summary class="faq-q">${esc(f.q)} <span class="faq-toggle-icon">+</span></summary>\n        <div class="faq-a">${f.a}</div>\n      </details>`).join('\n');
  const relatedHtml = c.related.map((r) => `      <a class="more-card" href="${r[0]}"><span>${esc(r[1])}</span><span class="arr">→</span></a>`).join('\n');
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
<meta name="theme-color" content="#0a0d12">
<title>${esc(c.title)} | PropChamps</title>
<meta name="description" content="${attr(c.metaDesc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="PropChamps">
<meta property="og:title" content="${attr(c.title)}">
<meta property="og:description" content="${attr(c.ogDesc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://propchamps.net/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="PropChamps — Independent prop firm research">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://propchamps.net/og-image.jpg">
<meta name="twitter:title" content="${attr(c.title)}">
<meta name="twitter:description" content="${attr(c.ogDesc)}">
<script type="application/ld+json">
${JSON.stringify(schema)}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/vs/vs.css">
</head>
<body>

<div class="editorial-strip"><div class="container"><div class="lhs"><span class="dot"></span><span>Independent prop firm research · Reviewed weekly</span></div><div class="rhs">Last reviewed ${REVIEW_DATE}</div></div></div>

<header class="site">
  <div class="container">
    <a class="logo-mark" href="/" aria-label="PropChamps home"><img src="/logos/propchamps.png" alt="PropChamps"></a>
    <nav class="primary">
      <a href="/">Firms</a><a href="/compare" class="active">Compare</a><a href="/deals">Deals</a><a href="/payouts">Payouts</a><a href="/blog/">Blog</a>
    </nav>
    <a class="header-cta" href="/compare">Compare firms
      <svg width="14" height="14" viewbox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12 L11 8 L5 4"/></svg>
    </a>
    <button class="menu-toggle" id="menuToggle" aria-label="Open menu"><span class="bar"></span></button>
  </div></header>
<div class="mobile-menu" id="mobileMenu">
  <a href="/">Firms</a><a href="/compare">Compare</a><a href="/deals">Deals</a><a href="/payouts">Payouts</a><a href="/blog/">Blog</a>
  <a class="mobile-cta" href="/compare">Compare firms →</a>
  </div>

<section class="hero">
  <div class="bg-stack"></div>
  <div class="container">
    <div class="hero-eyebrow">Head-to-head · 2026</div>
    <h1>${esc(c.a.name)} <span class="vs">vs</span> ${esc(c.b.name)}</h1>
    <p class="hero-sub">${esc(c.heroSub)}</p>
    <div class="vs-firms" id="vsFirms"></div>
  </div>
</section>

<nav class="section-nav" id="sectionNav">
  <div class="container">
    <span class="section-nav-label">Jump to</span>
    <a class="section-nav-link" href="#verdict">The verdict</a>
    <a class="section-nav-link" href="#comparison">Full comparison</a>
    <a class="section-nav-link" href="#pick">Which to pick</a>
    <a class="section-nav-link" href="#faq">FAQ</a>
  </div>
</nav>

<section class="block verdict" id="verdict">
  <div class="container">
    <div class="verdict-wrap">
      <div class="section-eyebrow">The bottom line</div>
      <h2 class="section-h2">The short version.</h2>
      <p>${c.verdictP1}</p>
      <p>${c.verdictP2}</p>
      <div class="verdict-callout">
        <div class="verdict-callout-label">In one line</div>
        <p>${c.callout}</p>
      </div>
    </div>
  </div>
</section>

<section class="block" id="comparison">
  <div class="container">
    <div class="section-eyebrow">Side by side</div>
    <h2 class="section-h2">${esc(c.a.name)} vs ${esc(c.b.name)}, compared.</h2>
    <p class="section-intro">${esc(c.comparisonIntro)}</p>
    <div class="matrix-wrap">
      <div id="vsMatrix"></div>
      <div class="matrix-note" id="vsMatrixNote"></div>
    </div>
  </div>
</section>

<section class="block" id="pick">
  <div class="container">
    <div class="section-eyebrow">Make the call</div>
    <h2 class="section-h2">Which one should you pick?</h2>
    <p class="section-intro">${esc(c.pickIntro)}</p>
    <div class="pick-grid">
      <div class="pick-card">
        <div class="pick-card-head"><img data-vs-logo="a" src="" alt=""><div><h3 data-vs-name="a">${esc(c.a.name)}</h3><div class="pick-tag">${esc(c.pickA.tag)}</div></div></div>
        <ul class="pick-list">${bullets(c.pickA.bullets)}</ul>
        <a class="vs-cta" data-vs-cta="a" href="#">Get ${esc(c.a.name)} deal</a>
      </div>
      <div class="pick-card">
        <div class="pick-card-head"><img data-vs-logo="b" src="" alt=""><div><h3 data-vs-name="b">${esc(c.b.name)}</h3><div class="pick-tag">${esc(c.pickB.tag)}</div></div></div>
        <ul class="pick-list">${bullets(c.pickB.bullets)}</ul>
        <a class="vs-cta" data-vs-cta="b" href="#">Get ${esc(c.b.name)} deal</a>
      </div>
    </div>
  </div>
</section>

<section class="block" id="faq">
  <div class="container">
    <div class="section-eyebrow">Frequently asked</div>
    <h2 class="section-h2">${esc(c.a.name)} vs ${esc(c.b.name)} — quick answers.</h2>
    <div class="faq-list">
${faqHtml}
    </div>
  </div>
</section>

<section class="block" id="more">
  <div class="container">
    <div class="section-eyebrow">Keep comparing</div>
    <h2 class="section-h2">More head-to-heads.</h2>
    <div class="more-grid">
${relatedHtml}
    </div>
  </div>
</section>

<section class="cta-band">
  <div class="container">
    <div class="cta-card">
      <h2>Read the full reviews.</h2>
      <p>Dig into each firm's rules, plans, and current pricing before you commit — or line them up against the rest of the field.</p>
      <div class="cta-row">
        <a class="btn-primary" href="${c.a.review}">${esc(c.a.name)} review</a>
        <a class="btn-ghost" href="${c.b.review}">${esc(c.b.name)} review</a>
      </div>
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
      <div><h4>Research</h4><ul><li><a href="/">All firms</a></li><li><a href="/compare">Compare</a></li><li><a href="/deals">Active deals</a></li><li><a href="/payouts">Payouts</a></li><li><a href="/audit-log">Audit log</a></li><li><a href="/favorites">Favorites</a></li></ul></div>
      <div><h4>Editorial</h4><ul><li><a href="/guide">Beginner's guide</a></li><li><a href="/methodology">How we audit</a></li><li><a href="/methodology#about">About</a></li><li><a href="mailto:hello@propchamps.net">Contact</a></li></ul></div>
      <div><h4>Legal</h4><ul><li><a href="/privacy">Privacy</a></li><li><a href="/methodology#disclosure">Affiliate disclosure</a></li></ul></div>
    </div>
    <div class="legal">
      <div>© 2026 PropChamps. Independent prop firm research. Not financial advice.</div>
      <div>Trading involves substantial risk.</div>
    </div>
  </div>
</footer>

<script>window.PROPCHAMPS_VS = ["${c.a.slug}","${c.b.slug}"];</script>
<script src="/data/firms.js"></script>
<script src="/vs/vs.js"></script>
</body>
</html>
`;
}

let sitemap = '';
for (const c of CONFIGS) {
  const out = path.join(ROOT, 'vs', c.vsSlug + '.html');
  fs.writeFileSync(out, page(c));
  console.log('✓ vs/' + c.vsSlug + '.html');
  sitemap += `  <url>\n    <loc>https://propchamps.net/vs/${c.vsSlug}</loc>\n    <lastmod>${ISO}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
}
fs.writeFileSync(path.join(ROOT, 'vs', '_sitemap.txt'), sitemap);
console.log('\nWrote ' + CONFIGS.length + ' vs pages. Sitemap snippet in vs/_sitemap.txt');
