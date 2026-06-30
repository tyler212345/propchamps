/* ============================================================
 * PropChamps — newsletter capture config
 * ============================================================
 * Every signup form on the site (the /join page + the audit-log
 * footer form) POSTs each signup to the webhook below.
 *
 * >>> PASTE YOUR WEBHOOK URL BETWEEN THE QUOTES <<<
 * Works with any "catch hook" style endpoint — Zapier, Make,
 * n8n, beehiiv, a Cloudflare Worker, etc. The form sends:
 *   email, source, page, ts   (application/x-www-form-urlencoded)
 *
 * Until a URL is set, signups are still saved to the browser's
 * localStorage queue ("pc_newsletter_queue") so none are lost.
 * ============================================================ */
window.SUBSCRIBE_WEBHOOK = "";

window.PROPCHAMPS_subscribe = function (email, source) {
  // Always keep a local backup so nothing is lost before/if the webhook hiccups.
  try {
    var q = JSON.parse(localStorage.getItem('pc_newsletter_queue') || '[]');
    q.push({ email: email, source: source || 'site', page: location.pathname, at: new Date().toISOString() });
    localStorage.setItem('pc_newsletter_queue', JSON.stringify(q));
  } catch (e) {}

  var url = window.SUBSCRIBE_WEBHOOK;
  if (!url) { return Promise.resolve({ queued: true, sent: false }); }

  // no-cors + form-encoded = a "simple request": no CORS preflight, works
  // against any webhook. Response is opaque, so we treat completion as success.
  return fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({
      email: email,
      source: source || 'site',
      page: location.pathname,
      ts: String(Date.now())
    }).toString()
  }).then(function () { return { queued: true, sent: true }; });
};
