/* ============================================================
   PROPCHAMPS — HEAD-TO-HEAD (VS) PAGE LOGIC
   Reads window.PROPCHAMPS_VS = ["slugA","slugB"] and renders the
   firm header cards + live comparison matrix from window.FIRMS
   (data/firms.js). Static prose on the page carries the unique
   editorial; this only fills the data-driven parts.
   ============================================================ */
(function(){
  var F = window.FIRMS || {};
  var pair = window.PROPCHAMPS_VS || [];
  var a = F[pair[0]], b = F[pair[1]];

  /* ---- mobile menu ---- */
  var toggle = document.getElementById('menuToggle'), header = document.querySelector('header.site');
  if (toggle){
    toggle.addEventListener('click', function(){ var o = header.classList.toggle('is-open'); document.body.classList.toggle('is-menu-open', o); });
    document.querySelectorAll('.mobile-menu a').forEach(function(el){ el.addEventListener('click', function(){ header.classList.remove('is-open'); document.body.classList.remove('is-menu-open'); }); });
  }

  if (!a || !b){ return; }

  function featured(f){ var ps = f.plansSummary || []; return ps.filter(function(p){return p.featured;})[0] || ps[0] || {rules:{}}; }
  var fa = featured(a), fb = featured(b);
  function rule(f, fp, key){ return (fp.rules && fp.rules[key]) || ''; }
  function blank(v){ return !v || /^see site/i.test(v) || /^—$/.test(v); }

  /* ---- fill generic data-vs-* hooks (logos, names, affiliate CTAs in prose/cards) ---- */
  function fill(side, f){
    document.querySelectorAll('[data-vs-name="'+side+'"]').forEach(function(el){ el.textContent = f.name; });
    document.querySelectorAll('[data-vs-logo="'+side+'"]').forEach(function(el){ el.src = f.logo; el.alt = f.name + ' logo'; });
    document.querySelectorAll('[data-vs-cta="'+side+'"]').forEach(function(el){
      if (f.affiliateUrl){ el.href = f.affiliateUrl; el.target = '_blank'; el.rel = 'noopener'; }
      if (!el.dataset.keepText){ el.innerHTML = 'Get ' + f.name + ' deal <svg width="13" height="13" viewbox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12 L11 8 L5 4"/></svg>'; }
    });
  }
  fill('a', a); fill('b', b);

  /* ---- hero firm header cards ---- */
  function chips(f){ return (f.bestFor || f.highlights || []).slice(0,3).map(function(c){ return '<span class="vs-chip">'+c+'</span>'; }).join(''); }
  function firmCard(f){
    return '<div class="vs-firm">'+
      '<div class="vs-firm-head"><div class="vs-firm-logo"><img src="'+f.logo+'" alt="'+f.name+' logo"></div>'+
        '<div><div class="vs-firm-name">'+f.name+'</div><div class="vs-firm-type">'+(f.type||'')+'</div></div></div>'+
      '<div class="vs-firm-rating"><strong>'+(f.rating||'—')+'</strong><span>/ 5 · '+(f.reviewCount||0)+' reviews</span></div>'+
      '<div class="vs-firm-chips">'+chips(f)+'</div>'+
      '<a class="vs-cta" href="'+(f.affiliateUrl||'#')+'" target="_blank" rel="noopener">Get '+f.name+' deal</a>'+
    '</div>';
  }
  var vsFirms = document.getElementById('vsFirms');
  if (vsFirms){ vsFirms.innerHTML = firmCard(a) + '<div class="vs-badge">vs</div>' + firmCard(b); }

  /* ---- comparison matrix ---- */
  var ROWS = [
    ['Our rating', function(f){ return f.rating ? f.rating + ' / 5' : ''; }],
    ['Account sizes', function(f,fp){ return rule(f,fp,'Account Sizes') || f.maxAllocation || ''; }],
    ['Max account', function(f){ return f.maxAllocation || ''; }],
    ['Profit target', function(f,fp){ return rule(f,fp,'Profit Target'); }],
    ['Daily loss limit', function(f,fp){ return rule(f,fp,'Daily Loss Limit'); }],
    ['Max drawdown', function(f,fp){ return rule(f,fp,'Max Drawdown'); }],
    ['Min. trading days', function(f,fp){ return rule(f,fp,'Min. Trading Days'); }],
    ['Consistency rule', function(f,fp){ return rule(f,fp,'Consistency Rule'); }],
    ['Payout split', function(f,fp){ return rule(f,fp,'Payout Split'); }],
    ['Payout frequency', function(f,fp){ return rule(f,fp,'Payout Frequency'); }],
    ['Median payout time', function(f){ return f.payoutMedianTime || ''; }],
    ['Total paid out', function(f){ return f.payoutTotal || ''; }],
    ['Activation fee', function(f,fp){ return rule(f,fp,'Activation Fee'); }],
    ['Platforms', function(f,fp){ return rule(f,fp,'Platforms') || (f.platformsList||[]).join(' · '); }],
    ['Promo code', function(f){ return f.promo ? (f.promo.code + (f.promo.discount && f.promo.discount!=='See pricing' ? ' — '+f.promo.discount : '')) : ''; }]
  ];

  var matrix = document.getElementById('vsMatrix');
  if (matrix){
    var html = '<div class="matrix-head">'+
      '<div class="mh-label">Compared on</div>'+
      '<div class="mh-firm"><img src="'+a.logo+'" alt=""><span class="mh-name">'+a.name+'</span></div>'+
      '<div class="mh-firm"><img src="'+b.logo+'" alt=""><span class="mh-name">'+b.name+'</span></div>'+
    '</div>';
    ROWS.forEach(function(r){
      var va = r[1](a, fa), vb = r[1](b, fb);
      if (blank(va) && blank(vb)) return;               // skip rows with no data on either side
      va = blank(va) ? '<span style="color:var(--text-faint)">See review</span>' : va;
      vb = blank(vb) ? '<span style="color:var(--text-faint)">See review</span>' : vb;
      var diff = (va !== vb) ? ' diff' : '';
      html += '<div class="matrix-row'+diff+'">'+
        '<div class="matrix-cell label">'+r[0]+'</div>'+
        '<div class="matrix-cell firm-val" data-firm="'+a.name+'">'+va+'</div>'+
        '<div class="matrix-cell firm-val" data-firm="'+b.name+'">'+vb+'</div>'+
      '</div>';
    });
    matrix.innerHTML = html;
    var note = document.getElementById('vsMatrixNote');
    if (note){ note.textContent = 'Featured plans compared: ' + a.name + ' ' + (fa.name||'') + ' vs ' + b.name + ' ' + (fb.name||'') + '. Rules change often — figures verified in our weekly audit; always confirm at checkout.'; }
  }

  /* ---- section-nav scroll-spy + smooth scroll ---- */
  var navLinks = [].slice.call(document.querySelectorAll('.section-nav-link'));
  var sections = navLinks.map(function(l){ return document.getElementById(l.getAttribute('href').slice(1)); }).filter(Boolean);
  function offsetTop(el){ return el.getBoundingClientRect().top + window.pageYOffset; }
  function updateActive(){
    var y = window.pageYOffset + 180, current = sections[0] ? sections[0].id : null;
    sections.forEach(function(s){ if (offsetTop(s) <= y) current = s.id; });
    navLinks.forEach(function(l){ l.classList.toggle('active', l.getAttribute('href') === '#'+current); });
  }
  navLinks.forEach(function(l){
    l.addEventListener('click', function(e){
      var el = document.getElementById(l.getAttribute('href').slice(1)); if (!el) return;
      e.preventDefault();
      var navH = document.getElementById('sectionNav') ? document.getElementById('sectionNav').offsetHeight : 0;
      window.scrollTo({ top: offsetTop(el) - 80 - navH - 8, behavior: 'smooth' });
    });
  });
  window.addEventListener('scroll', updateActive, {passive:true});
  updateActive();

  /* ---- reveal polish ---- */
  var revealSel = 'section.block, .vs-firm, .matrix-wrap, .pick-card, .faq-item, .more-card, .cta-card';
  var els = [].slice.call(document.querySelectorAll(revealSel));
  els.forEach(function(el){ el.setAttribute('data-reveal',''); });
  var killer = setTimeout(function(){ els.forEach(function(el){ el.classList.add('in'); }); }, 2500);
  function markVisible(){ var vh = window.innerHeight; els.forEach(function(el){ if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh*0.95) el.classList.add('in'); }); }
  requestAnimationFrame(function(){ markVisible(); clearTimeout(killer); });
  if (typeof IntersectionObserver === 'function'){
    var io = new IntersectionObserver(function(entries){ entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {threshold:0.06, rootMargin:'0px 0px -30px 0px'});
    els.forEach(function(el){ if (!el.classList.contains('in')) io.observe(el); });
  } else { els.forEach(function(el){ el.classList.add('in'); }); }
})();
