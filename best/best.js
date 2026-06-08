/* ============================================================
   PROPCHAMPS — "BEST FOR X" LISTICLE LOGIC
   Each .rank-card carries data-firm="slug". This fills the live
   parts (logo, rating, affiliate CTA, review link) from
   window.FIRMS (data/firms.js). Rank, award, and the editorial
   "why" are static in the HTML so the page is crawler-robust.
   ============================================================ */
(function(){
  var F = window.FIRMS || {};
  // slug -> firm review page filename (slugs don't all match filenames)
  var PAGE = {'lucid-trading':'lucid-trading.html','tradeify':'tradeify.html','alpha-futures':'alpha-futures.html','apex-trader':'apex-trader.html','my-funded-futures':'my-funded-futures.html','top-one-futures':'top-one-futures.html','take-profit':'take-profit-trader.html'};

  /* mobile menu */
  var toggle = document.getElementById('menuToggle'), header = document.querySelector('header.site');
  if (toggle){
    toggle.addEventListener('click', function(){ var o = header.classList.toggle('is-open'); document.body.classList.toggle('is-menu-open', o); });
    document.querySelectorAll('.mobile-menu a').forEach(function(el){ el.addEventListener('click', function(){ header.classList.remove('is-open'); document.body.classList.remove('is-menu-open'); }); });
  }

  /* fill each rank card's live data from firms.js */
  document.querySelectorAll('.rank-card[data-firm]').forEach(function(card){
    var f = F[card.dataset.firm];
    if (!f) return;
    var logo = card.querySelector('.rank-logo');
    if (logo){ logo.src = f.logo; logo.alt = f.name + ' logo'; }
    var rating = card.querySelector('.rank-rating');
    if (rating){ rating.innerHTML = '<strong>' + (f.rating || '—') + '</strong><span>/ 5 · ' + (f.reviewCount || 0) + ' reviews</span>'; }
    var cta = card.querySelector('.rank-cta');
    if (cta){
      if (f.affiliateUrl){ cta.href = f.affiliateUrl; cta.target = '_blank'; cta.rel = 'noopener'; }
      cta.innerHTML = 'Get ' + f.name + ' deal <svg width="13" height="13" viewbox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12 L11 8 L5 4"/></svg>';
    }
    var review = card.querySelector('.rank-review');
    if (review && PAGE[card.dataset.firm]){ review.href = '/firms/' + PAGE[card.dataset.firm]; }
  });

  /* section-nav scroll-spy + smooth scroll */
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

  /* reveal polish */
  var els = [].slice.call(document.querySelectorAll('section.block, .rank-card, .faq-item, .more-card, .cta-card'));
  els.forEach(function(el){ el.setAttribute('data-reveal',''); });
  var killer = setTimeout(function(){ els.forEach(function(el){ el.classList.add('in'); }); }, 2500);
  function markVisible(){ var vh = window.innerHeight; els.forEach(function(el){ if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh*0.95) el.classList.add('in'); }); }
  requestAnimationFrame(function(){ markVisible(); clearTimeout(killer); });
  if (typeof IntersectionObserver === 'function'){
    var io = new IntersectionObserver(function(entries){ entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {threshold:0.06, rootMargin:'0px 0px -30px 0px'});
    els.forEach(function(el){ if (!el.classList.contains('in')) io.observe(el); });
  } else { els.forEach(function(el){ el.classList.add('in'); }); }
})();
