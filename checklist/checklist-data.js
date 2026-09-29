/* The Trading Champ — pre-trade checklist. Single source of truth for the
   on-page + PDF renderings. The emailed copy lives in worker/index.js
   (CHECKLIST_PHASES) — keep them in sync when this changes. */
window.CHAMP_CHECKLIST = [
  {
    n: '01',
    title: 'Read the market',
    sub: 'Before you look for an entry',
    items: [
      ['Checked today’s news & scheduled speakers?', 'Know when CPI, FOMC or a Fed speaker drops — before it blindsides you.'],
      ['Waited for the 15-minute opening range?', 'The first 15 minutes are noise. Let the range form first.'],
      ['Marked the opening-range high & low?', 'Your session’s key levels. Price reacts to them all day.'],
      ['Nasdaq & S&P pointing the same way?', 'NQ and ES agree = stronger bias. They fight = stand down.'],
      ['Does WAVE data back your bias?', 'Order-flow should confirm your read, not fight it. <span class="hl">(flowtopia.co)</span>'],
    ],
  },
  {
    n: '02',
    title: 'Build the trade',
    sub: 'Only if the read checks out',
    items: [
      ['Is your real entry model present?', 'Your setup is actually here — or are you forcing it? No model, no trade.'],
      ['Where does your stop belong?', 'At the level that proves you wrong — not a random dollar amount.'],
      ['Sized off that stop?', 'Contract size comes from the stop distance, not your confidence.'],
      ['Fits your daily loss budget?', 'If it stops out, are you still inside today’s max? If not, skip it.'],
      ['Enough room to your target?', 'Does the distance to target pay the risk-to-reward you require?'],
    ],
  },
  {
    n: '03',
    title: 'Check your head',
    sub: 'The part everyone skips',
    items: [
      ['Comfortable taking this loss?', 'If you’d need to win it back, your size or your head is off.'],
      ['Rules — or emotion?', 'Meeting your rules, or bored / frustrated / chasing? Be honest.'],
    ],
  },
  {
    n: '04',
    title: 'After the trade',
    sub: 'Where the edge is built',
    items: [
      ['Did you follow your rules?', 'Win or lose — did you run your plan? That’s the only score.'],
      ['Logged the setup?', 'Record it plus one fix. The journal builds the edge.'],
      ['Another setup — or done?', 'Fresh valid setup with risk left, or walk away for the day?'],
    ],
  },
];

var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

/* Renders the phased checklist into `el`. Shared by index.html + print.html;
   each page styles the .cl-* classes itself. Static (no check-off tool). */
window.renderChecklistInto = function (el) {
  if (!el || !window.CHAMP_CHECKLIST) return;
  var out = '';
  window.CHAMP_CHECKLIST.forEach(function (ph) {
    out +=
      '<section class="cl-phase">' +
      '<div class="cl-phase-head">' +
      '<span class="cl-phase-n">' + ph.n + '</span>' +
      '<div><div class="cl-phase-title">' + ph.title + '</div>' +
      '<div class="cl-phase-sub">' + ph.sub + '</div></div>' +
      '</div>';
    ph.items.forEach(function (it) {
      out +=
        '<div class="cl-item">' +
        '<span class="cl-tick">' + CHECK_SVG + '</span>' +
        '<span class="cl-text"><span class="cl-q">' + it[0] + '</span>' +
        '<span class="cl-why">' + it[1] + '</span></span>' +
        '</div>';
    });
    out += '</section>';
  });
  el.innerHTML = out;
};
