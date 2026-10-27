/* ============================================================
   PROPCHAMPS — HEAD-TO-HEAD (VS) PAGE LOGIC
   Reads window.PROPCHAMPS_VS = ["slugA","slugB"] and renders the
   firm header cards + comparison matrix from window.FIRMS
   (data/firms.js). Static prose on the page carries the unique
   editorial; this only fills the data-driven parts.

   The renderers live on window.PCVS as pure functions (no DOM), so
   tools/build-vs-page.js loads this same file in Node and pre-renders
   the identical cards + matrix into the static HTML (inside the
   <!--g:firms--> and <!--g:matrix--> markers). In the browser the
   script then re-renders them from the live firms.js, so a data
   change shows up even before the pages are rebuilt.
   ============================================================ */
(function(root){
  var PCVS = {};
  var CHECKED = 'October 2026'; // last full rules check behind the matrix (see /audit-log)

  /* Payout totals: only firm-published figures are shown. Lucid's stored figure is
     under review (it doesn't match what Lucid advertises), so it is never displayed;
     FundedNext's published total covers all of its programs, not futures alone. */
  var TOTAL_OVERRIDE = { 'lucid-trading': '<span class="faint">Not verified yet</span>' };
  var TOTAL_NOTE = { 'fundednext': ' <span class="faint">(all FundedNext programs)</span>' };

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function attr(s){ return esc(s).replace(/"/g,'&quot;'); }
  function featured(f){ var ps = f.plansSummary || []; return ps.filter(function(p){return p.featured;})[0] || ps[0] || {rules:{}}; }
  function rule(fp, key){ return (fp.rules && fp.rules[key]) || ''; }
  function blank(v){ return !v || /^see site/i.test(v) || /^—$/.test(v); }
  /* "LUCID PRO" → "Pro", "SELECT — DAILY PATH" → "Select — Daily Path", "EOD TRAIL" → "EOD Trail" */
  function planLabel(name){
    var s = String(name || '').replace(/^(lucid|alpha|funded futures)\s+/i, '');
    if (s === s.toUpperCase()) s = s.toLowerCase().replace(/(^|[\s(—\/-])([a-z])/g, function(m, p, c){ return p + c.toUpperCase(); })
      .replace(/\b(Eod|Dll)\b/g, function(w){ return w.toUpperCase(); });
    return s;
  }
  var ARROW = ' <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';

  /* Rows of the comparison matrix (featured plan of each firm). */
  var ROWS = [
    ['Account sizes', function(f,fp){ return rule(fp,'Account Sizes'); }],
    ['Profit target', function(f,fp){ return rule(fp,'Profit Target'); }],
    ['Max drawdown', function(f,fp){ return rule(fp,'Max Drawdown'); }],
    ['Drawdown type', function(f,fp){ return rule(fp,'Drawdown Type'); }],
    ['Daily loss limit', function(f,fp){ return rule(fp,'Daily Loss Limit'); }],
    ['Min. trading days', function(f,fp){ return rule(fp,'Min. Trading Days'); }],
    ['Consistency rule', function(f,fp){ return rule(fp,'Consistency Rule'); }],
    ['Payout split', function(f,fp){ return rule(fp,'Payout Split'); }],
    ['Payout frequency', function(f,fp){ return rule(fp,'Payout Frequency'); }],
    ['Max payout', function(f,fp){ return rule(fp,'Max Payout'); }],
    ['Median payout time (PropChamps est.)', function(f){ return f.payoutMedianTime || ''; }],
    ['Total paid out (firm-published)', function(f){ return TOTAL_OVERRIDE[f.slug] || (f.payoutTotal ? esc(f.payoutTotal) + (TOTAL_NOTE[f.slug] || '') : ''); }, true],
    ['Activation fee', function(f,fp){ return rule(fp,'Activation Fee'); }],
    ['Platforms', function(f,fp){ return rule(fp,'Platforms') || (f.platformsList||[]).join(' · '); }],
    ['Promo code', function(f){ return f.promo ? (f.promo.code + (f.promo.discount && f.promo.discount!=='See pricing' ? ' — '+f.promo.discount : ' — applied at checkout')) : ''; }]
  ];

  PCVS.featured = featured;
  PCVS.planLabel = planLabel;

  PCVS.matrixHTML = function(a, b){
    var fa = featured(a), fb = featured(b);
    var html = '<div class="matrix-head">'+
      '<div class="mh-label">Compared on</div>'+
      '<div class="mh-firm"><img src="'+attr(a.logo)+'" alt="" width="30" height="30"><span class="mh-name">'+esc(a.name)+' <small>'+esc(planLabel(fa.name))+'</small></span></div>'+
      '<div class="mh-firm"><img src="'+attr(b.logo)+'" alt="" width="30" height="30"><span class="mh-name">'+esc(b.name)+' <small>'+esc(planLabel(fb.name))+'</small></span></div>'+
    '</div>';
    ROWS.forEach(function(r){
      var va = r[1](a, fa), vb = r[1](b, fb);
      if (blank(va) && blank(vb)) return;               // skip rows with no data on either side
      if (!r[2]){ va = esc(va); vb = esc(vb); }         // rows flagged true return ready-made markup
      va = blank(va) ? '<span class="faint">See review</span>' : va;
      vb = blank(vb) ? '<span class="faint">See review</span>' : vb;
      var diff = (va !== vb) ? ' diff' : '';
      html += '<div class="matrix-row'+diff+'">'+
        '<div class="matrix-cell label">'+esc(r[0])+'</div>'+
        '<div class="matrix-cell firm-val" data-firm="'+attr(a.name)+'">'+va+'</div>'+
        '<div class="matrix-cell firm-val" data-firm="'+attr(b.name)+'">'+vb+'</div>'+
      '</div>';
    });
    return html;
  };

  PCVS.noteText = function(a, b){
    var fa = featured(a), fb = featured(b);
    return 'Featured plans compared: ' + a.name + ' ' + planLabel(fa.name) + ' vs ' + b.name + ' ' + planLabel(fb.name) +
      '. Figures from our ' + CHECKED + ' rules check; median payout times are PropChamps estimates, not firm data. Always confirm at checkout.';
  };

  PCVS.firmCardHTML = function(f){
    var chips = (f.bestFor || f.highlights || []).slice(0,3).map(function(c){ return '<span class="vs-chip">'+esc(c)+'</span>'; }).join('');
    return '<div class="vs-firm">'+
      '<div class="vs-firm-head"><div class="vs-firm-logo"><img src="'+attr(f.logo)+'" alt="'+attr(f.name)+' logo" width="54" height="54"></div>'+
        '<div><div class="vs-firm-name">'+esc(f.name)+'</div><div class="vs-firm-type">'+esc(f.type||'')+'</div></div></div>'+
      '<div class="vs-firm-chips">'+chips+'</div>'+
      '<a class="vs-cta" href="'+attr(f.affiliateUrl||'#')+'" target="_blank" rel="sponsored noopener">Get '+esc(f.name)+' deal</a>'+
    '</div>';
  };

  PCVS.firmsHTML = function(a, b){ return PCVS.firmCardHTML(a) + '<div class="vs-badge">vs</div>' + PCVS.firmCardHTML(b); };

  /* Pick-card CTA (same markup the builder writes statically). */
  PCVS.ctaHTML = function(side, f){
    return '<a class="vs-cta" data-vs-cta="'+side+'" href="'+attr(f.affiliateUrl||'#')+'" target="_blank" rel="sponsored noopener">Get '+esc(f.name)+' deal'+ARROW+'</a>';
  };

  root.PCVS = PCVS;
  if (typeof document === 'undefined') return;   // build-time use (Node) stops here

  /* ======================= browser ======================= */
  var F = root.FIRMS || {};
  var pair = root.PROPCHAMPS_VS || [];
  var a = F[pair[0]], b = F[pair[1]];

  /* (header, mobile menu and ticker are handled site-wide by /assets/pc.js) */

  if (!a || !b){ return; }

  /* ---- fill generic data-vs-* hooks (logos, names, affiliate CTAs in prose/cards) ---- */
  function fill(side, f){
    document.querySelectorAll('[data-vs-name="'+side+'"]').forEach(function(el){ el.textContent = f.name; });
    document.querySelectorAll('[data-vs-logo="'+side+'"]').forEach(function(el){ el.src = f.logo; el.alt = f.name + ' logo'; });
    document.querySelectorAll('[data-vs-cta="'+side+'"]').forEach(function(el){
      if (f.affiliateUrl){ el.href = f.affiliateUrl; el.target = '_blank'; el.rel = 'sponsored noopener'; }
      if (!el.dataset.keepText){ el.innerHTML = 'Get ' + esc(f.name) + ' deal' + ARROW; }
    });
  }
  fill('a', a); fill('b', b);

  /* ---- hero firm header cards + comparison matrix (re-render from live data) ---- */
  var vsFirms = document.getElementById('vsFirms');
  if (vsFirms){ vsFirms.innerHTML = PCVS.firmsHTML(a, b); }
  var matrix = document.getElementById('vsMatrix');
  if (matrix){ matrix.innerHTML = PCVS.matrixHTML(a, b); }
  var note = document.getElementById('vsMatrixNote');
  if (note){ note.textContent = PCVS.noteText(a, b); }

  /* ---- section-nav scroll-spy + smooth scroll ---- */
  var navLinks = [].slice.call(document.querySelectorAll('.section-nav-link'));
  var sections = navLinks.map(function(l){ return document.getElementById(l.getAttribute('href').slice(1)); }).filter(Boolean);
  function offsetTop(el){ return el.getBoundingClientRect().top + window.pageYOffset; }
  function updateActive(){
    var y = window.pageYOffset + 180, current = sections[0] ? sections[0].id : null;
    sections.forEach(function(s){ if (offsetTop(s) <= y) current = s.id; });
    navLinks.forEach(function(l){
      var on = l.getAttribute('href') === '#'+current;
      if (on !== l.classList.contains('active')){
        l.classList.toggle('active', on);
        if (on && l.parentNode && l.parentNode.scrollWidth > l.parentNode.clientWidth){
          var p = l.parentNode; p.scrollLeft = Math.max(0, l.offsetLeft - (p.clientWidth - l.offsetWidth) / 2);
        }
      }
    });
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
})(typeof window !== 'undefined' ? window : this);
