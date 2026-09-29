/* Champ's pre-trade checklist — single source of truth for the on-page and PDF
   renderings. The emailed copy lives in worker/index.js (CHECKLIST_PHASES); keep
   the two in sync when the checklist changes. */
window.CHAMP_CHECKLIST = [
  {
    n: '01',
    title: 'Read the market',
    sub: 'Before you even look for an entry',
    items: [
      ['Checked today’s major news & scheduled speakers?', 'Pull up the economic calendar. Know exactly when high-impact news — CPI, FOMC, jobs, any scheduled Fed speaker — hits, so it never catches you mid-trade.'],
      ['Waited for the first 15-minute opening range to form?', 'The first 15 minutes after the open are noise. Let that range fully print before you make a single decision.'],
      ['Marked the opening-range high & low?', 'Draw both lines. They’re the session’s key levels — price reacts to them all day, and they frame every setup that follows.'],
      ['Are the Nasdaq and S&P supporting the same direction?', 'NQ and ES should agree. When the two indexes confirm each other your bias is stronger; when they fight, sit on your hands.'],
      ['Does WAVE data support your bias?', 'Order-flow tells you what price alone can’t. Champ reads WAVE data on flowtopia.co — it should confirm your direction, not argue with it.'],
    ],
  },
  {
    n: '02',
    title: 'Build the trade',
    sub: 'Only if the read checks out',
    items: [
      ['Is your real entry model actually present?', 'Be honest — is your setup genuinely here, or are you forcing a trade because you want one? No model, no trade.'],
      ['Where does your technical stop belong?', 'Place it where the trade is proven wrong — the level that invalidates the idea — not at a random dollar amount you’re “comfortable” losing.'],
      ['Have you calculated contract size using that stop?', 'Size the position from the stop distance. The stop sets the size; your confidence doesn’t.'],
      ['Does this trade fit your remaining daily loss budget?', 'If it hits the stop, are you still inside your max loss for the day? If it blows the budget, it’s not a trade — it’s a gamble.'],
      ['Is there enough room to your target for the R:R you require?', 'Measure the distance to target. Does it actually pay the risk-to-reward you demand? Thin R:R → skip it.'],
    ],
  },
  {
    n: '03',
    title: 'Check your head',
    sub: 'The part everyone skips',
    items: [
      ['Comfortable taking this loss without needing to win it back?', 'If losing this trade would make you need to win it back, your size is too big or your head isn’t right. Fix one before you click.'],
      ['Rules — or emotion?', 'Are you taking this because it meets your rules, or because you’re bored, frustrated, or chasing the last move? If it’s the second one, walk away.'],
    ],
  },
  {
    n: '04',
    title: 'After the trade',
    sub: 'Where the edge is actually built',
    items: [
      ['Did you follow your rules, regardless of the outcome?', 'The only question that matters: did you execute your plan? That’s the scorecard. Outcome is noise.'],
      ['Have you recorded the setup and what you could improve?', 'Log the trade and one thing you’d do better. Your journal is where your edge actually gets built.'],
      ['Another valid setup with risk left — or are you done for the day?', 'Is there a fresh, valid setup with risk still on the table, or are you finished? Knowing when to stop is a skill.'],
    ],
  },
];

/* Renders the phased checklist into `el`. Shared by access.html and print.html;
   each page styles the .cl-* classes itself. */
window.renderChecklistInto = function (el) {
  if (!el || !window.CHAMP_CHECKLIST) return;
  var out = '';
  window.CHAMP_CHECKLIST.forEach(function (ph) {
    out +=
      '<section class="cl-phase">' +
      '<div class="cl-phase-head">' +
      '<span class="cl-phase-n">' + ph.n + '</span>' +
      '<div><h3 class="cl-phase-title">' + ph.title + '</h3>' +
      '<p class="cl-phase-sub">' + ph.sub + '</p></div>' +
      '</div>';
    ph.items.forEach(function (it) {
      out +=
        '<label class="cl-item">' +
        '<span class="cl-box" aria-hidden="true"></span>' +
        '<span class="cl-text"><span class="cl-q">' + it[0] + '</span>' +
        '<span class="cl-why">' + it[1] + '</span></span>' +
        '</label>';
    });
    out += '</section>';
  });
  el.innerHTML = out;
};
