/* ============================================================
   PROPCHAMPS — "BEST FOR X" LISTICLE LOGIC
   Each .rank-card carries data-firm="slug". This fills the live
   parts (logo, affiliate CTA, review link) from
   window.FIRMS (data/firms.js). Rank, award, the editorial "why"
   and every table are static in the HTML so the page is
   crawler-robust; JS only refreshes and filters them.
   ============================================================ */
(function(){
  var F = window.FIRMS || {};
  // data slug -> clean firm review URL (slugs don't all match the page names)
  var PAGE = {'lucid-trading':'/firms/lucid-trading','tradeify':'/firms/tradeify','alpha-futures':'/firms/alpha-futures','apex-trader':'/firms/apex-trader','my-funded-futures':'/firms/my-funded-futures','top-one-futures':'/firms/top-one-futures','take-profit':'/firms/take-profit-trader','fundednext':'/firms/fundednext'};
  // firms.js fields that are PropChamps estimates, never firm-published
  var ESTIMATE = {payoutMedianTime:1, payoutCount:1, payoutAvg:1, payoutLargest:1};

  /* (header, mobile menu and ticker are handled site-wide by /assets/pc.js) */

  /* fill each rank card's live data from firms.js */
  document.querySelectorAll('.rank-card[data-firm]').forEach(function(card){
    var slug = card.getAttribute('data-firm');
    var f = F[slug];
    if (!f) return;
    var logo = card.querySelector('.rank-logo');
    if (logo){ logo.src = f.logo; logo.alt = f.name + ' logo'; }
    var cta = card.querySelector('.rank-cta');
    if (cta){
      // affiliate links: always rel="sponsored noopener"
      if (f.affiliateUrl){ cta.href = f.affiliateUrl; cta.target = '_blank'; cta.rel = 'sponsored noopener'; }
      cta.innerHTML = 'Get ' + f.name + ' deal <svg width="13" height="13" viewbox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
    }
    var review = card.querySelector('.rank-review');
    if (review && PAGE[slug]){ review.href = PAGE[slug]; }
  });

  /* live-bound cells: <td data-firm="slug" data-field="payoutMedianTime">static fallback</td>.
     Estimates always carry an "est." label so they never read as firm-published. */
  document.querySelectorAll('[data-firm][data-field]').forEach(function(el){
    var f = F[el.getAttribute('data-firm')], k = el.getAttribute('data-field');
    if (!f || f[k] == null || f[k] === '' || f[k] === '—') return;
    el.textContent = String(f[k]) + (ESTIMATE[k] ? ' (est.)' : '');
  });

  /* filter chips: <div class="chips" data-filter-for="tableId"> <button class="chip" data-tag="x"> …
     rows carry data-tags="x y z"; active chips combine with AND. */
  document.querySelectorAll('.chips[data-filter-for]').forEach(function(group){
    var table = document.getElementById(group.getAttribute('data-filter-for'));
    if (!table) return;
    var rows = [].slice.call(table.querySelectorAll('tbody tr'));
    var chips = [].slice.call(group.querySelectorAll('.chip[data-tag]'));
    var count = group.querySelector('.chip-count');
    function apply(){
      var on = chips.filter(function(c){ return c.getAttribute('aria-pressed') === 'true' && c.getAttribute('data-tag') !== 'all'; })
                    .map(function(c){ return c.getAttribute('data-tag'); });
      var shown = 0;
      rows.forEach(function(r){
        var tags = ' ' + (r.getAttribute('data-tags') || '') + ' ';
        var ok = on.every(function(t){ return tags.indexOf(' ' + t + ' ') > -1; });
        r.classList.toggle('is-hidden', !ok);
        if (ok) shown++;
      });
      chips.forEach(function(c){ if (c.getAttribute('data-tag') === 'all') c.setAttribute('aria-pressed', on.length ? 'false' : 'true'); });
      if (count) count.textContent = shown + ' of ' + rows.length + ' plans';
    }
    chips.forEach(function(c){
      c.addEventListener('click', function(){
        if (c.getAttribute('data-tag') === 'all'){ chips.forEach(function(x){ x.setAttribute('aria-pressed', 'false'); }); }
        else { c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); }
        apply();
      });
    });
    apply();
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
      var hdrH = document.getElementById('pcHeader') ? document.getElementById('pcHeader').offsetHeight : 0;
      window.scrollTo({ top: offsetTop(el) - hdrH - navH - 16, behavior: 'smooth' });
    });
  });
  window.addEventListener('scroll', updateActive, {passive:true});
  updateActive();

  /* reveal polish */
  var els = [].slice.call(document.querySelectorAll('section.block, .rank-card, .faq-item, .more-card, .cta-card, .tier, .hub-card'));
  els.forEach(function(el){ el.setAttribute('data-reveal',''); });
  var killer = setTimeout(function(){ els.forEach(function(el){ el.classList.add('in'); }); }, 2500);
  function markVisible(){ var vh = window.innerHeight; els.forEach(function(el){ if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh*0.95) el.classList.add('in'); }); }
  requestAnimationFrame(function(){ markVisible(); clearTimeout(killer); });
  if (typeof IntersectionObserver === 'function'){
    var io = new IntersectionObserver(function(entries){ entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {threshold:0.06, rootMargin:'0px 0px -30px 0px'});
    els.forEach(function(el){ if (!el.classList.contains('in')) io.observe(el); });
  } else { els.forEach(function(el){ el.classList.add('in'); }); }
})();
