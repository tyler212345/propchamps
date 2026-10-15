/* ============================================================
   PROPCHAMPS — shared chrome behaviour (assets/pc.js)
   Mobile menu, header scroll state, copy-code buttons + toast,
   scroll reveal for [data-pc-reveal]. Loaded with `defer` on
   every page. Safe to load on pages without the chrome.
   ============================================================ */
(function () {
  var doc = document, body = doc.body;
  var header = doc.getElementById('pcHeader');
  var burger = doc.getElementById('pcBurger');
  var menu = doc.getElementById('pcMenu');

  /* ---- Mobile menu ---- */
  function placeMenu() {
    if (!menu || !header) return;
    var r = header.getBoundingClientRect();
    menu.style.setProperty('--pc-menu-top', Math.max(0, r.bottom) + 'px');
  }
  function setMenu(open) {
    if (!menu || !burger) return;
    if (open) placeMenu();
    body.classList.toggle('pc-menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    if (open) { menu.removeAttribute('inert'); } else { menu.setAttribute('inert', ''); }
  }
  if (burger && menu) {
    setMenu(false);
    burger.addEventListener('click', function () { setMenu(!body.classList.contains('pc-menu-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && body.classList.contains('pc-menu-open')) { setMenu(false); burger.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 1060 && body.classList.contains('pc-menu-open')) setMenu(false); else placeMenu(); });
  }

  /* ---- Header scrolled state ---- */
  if (header) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { header.classList.toggle('is-scrolled', window.scrollY > 40); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  /* ---- Copy code + toast ---- */
  var toastEl, toastT;
  function toast(html) {
    if (!toastEl) { toastEl = doc.createElement('div'); toastEl.className = 'pc-toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); body.appendChild(toastEl); }
    toastEl.innerHTML = html;
    requestAnimationFrame(function () { toastEl.classList.add('show'); });
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 1900);
  }
  function copy(code) {
    code = code || 'CHAMP';
    var done = function () { toast('<i>✓</i> Code <b>' + code + '</b> copied — paste it at checkout'); };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(code).then(done, fallback); }
    else fallback();
    function fallback() {
      var ta = doc.createElement('textarea'); ta.value = code; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
      body.appendChild(ta); ta.select(); try { doc.execCommand('copy'); } catch (e) {} body.removeChild(ta); done();
    }
  }
  doc.addEventListener('click', function (e) {
    var el = e.target.closest('[data-copy]');
    if (!el) return;
    e.preventDefault(); e.stopPropagation();
    copy(el.getAttribute('data-copy'));
  });

  /* ---- Scroll reveal ---- */
  var rev = doc.querySelectorAll('[data-pc-reveal]');
  if (rev.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
      rev.forEach(function (el) { io.observe(el); });
    } else { rev.forEach(function (el) { el.classList.add('in'); }); }
  }

  window.PC = { copy: copy, toast: toast };
})();
