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
 * Nothing is stored in the visitor's browser (no cookies, no
 * localStorage): the email goes straight to the webhook.
 * ============================================================ */
window.SUBSCRIBE_WEBHOOK = "https://services.leadconnectorhq.com/hooks/mEfuVxLc0WO6HVWeZ6gK/webhook-trigger/0eeb480c-10b4-48d4-a0dc-2596bcf2a26b";

window.PROPCHAMPS_subscribe = function (email, source) {
  var url = window.SUBSCRIBE_WEBHOOK;
  if (!url) { return Promise.resolve({ queued: false, sent: false }); }

  // LeadConnector / GoHighLevel inbound webhook — it sends permissive CORS
  // headers, so we POST clean JSON cross-origin and can read the response.
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      source: source || 'site',
      page: location.pathname,
      ts: Date.now()
    })
  }).then(function (r) { return { queued: true, sent: true, ok: !!(r && r.ok) }; });
};
