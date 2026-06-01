/*
  PropChamps audit log — every rule, payout, and program change we've
  flagged at the firms we cover. Newest entry first. Used by:
    - /audit-log.html (full history with filters)
    - /index.html (last 4 entries surfaced as "Live changelog")
    - per-firm pages (filtered to that firm)

  Entry fields:
    date     ISO YYYY-MM-DD
    firm     firm slug (matches data/firms.js + logos/<slug>.png)
    firmName display name
    logo     logo path
    category one of: rule | promo | feature | payout | platform | account-size
    headline one-line summary (sentence case, no period)
    was      previous state (short string; empty for "feature" / "new" entries)
    is       current state
    note     optional follow-up detail (one sentence)
    source   optional URL we sourced the change from
    firmPage internal review page for the "read review" link
*/
window.CHANGELOG = [
  {
    date: '2026-05-28', firm: 'alpha', firmName: 'Alpha Futures', logo: '/logos/alpha.png',
    category: 'promo',
    headline: 'Zero plan activation fee dropped to $0',
    was: '$99 activation on one-day pass',
    is: '$0 — activation waived on the Zero plan',
    note: 'Flat 90% profit split unchanged. Confirmed at checkout against the 50K and 100K sizes.',
    source: '',
    firmPage: 'alpha-futures.html'
  },
  {
    date: '2026-05-22', firm: 'tradeify', firmName: 'Tradeify', logo: '/logos/tradify.png',
    category: 'platform',
    headline: 'Added Tradesea + Rithmic feeds across Select and Lightning',
    was: 'Tradovate + WealthCharts only',
    is: 'Tradovate · WealthCharts · Tradesea · Rithmic',
    note: 'No additional cost on Select or Lightning paths. Growth plan still Tradovate + WealthCharts.',
    source: '',
    firmPage: 'tradeify.html'
  },
  {
    date: '2026-05-18', firm: 'takeprofit', firmName: 'Take Profit Trader', logo: '/logos/takeprofit.png',
    category: 'rule',
    headline: 'Daily loss limit removed on every account size',
    was: 'DLL: $1,500 at 50K · $2,500 at 100K · $3,500 at 150K',
    is: 'No daily loss limit',
    note: 'Trailing drawdown method unchanged. Min trading days still 5 before payout request.',
    source: '',
    firmPage: 'take-profit-trader.html'
  },
  {
    date: '2026-05-12', firm: 'apex-trader', firmName: 'Apex Trader Funding', logo: '/logos/apex.png',
    category: 'promo',
    headline: 'CHAMP code stacks to 90% off + $0 activation',
    was: '80% off · activation fee still applied at funded',
    is: '90% off + activation fee waived',
    note: 'Verified at checkout on Instant Funding and EOD Trail across 50K, 100K, 150K. Biggest combined deal we have tracked.',
    source: '',
    firmPage: 'apex-trader.html'
  },
  {
    date: '2026-05-04', firm: 'myfunded', firmName: 'MyFundedFutures', logo: '/logos/myfunded.png',
    category: 'feature',
    headline: 'Rapid Live $10K session launched',
    was: '',
    is: 'New lower-barrier path to live capital — $10K session, 90% split',
    note: 'Replaces the older Rapid Pro flow on smaller accounts. Existing Rapid Pro traders grandfathered through Aug.',
    source: '',
    firmPage: 'my-funded-futures.html'
  },
  {
    date: '2026-04-26', firm: 'lucid-trading', firmName: 'Lucid Trading', logo: '/logos/lucid.png',
    category: 'rule',
    headline: 'Consistency rule loosened — 40% → 35% on funded',
    was: '40% consistency required on funded accounts',
    is: '35% consistency on funded · no rule during evaluation',
    note: 'Evaluation-phase rule was already removed in March. This change applies post-funding.',
    source: '',
    firmPage: 'lucid-trading.html'
  },
  {
    date: '2026-04-20', firm: 'topone', firmName: 'TopOne Futures', logo: '/logos/topone.png',
    category: 'payout',
    headline: 'Payout cadence tightened to 7 days',
    was: 'Bi-weekly payouts (every 14 days)',
    is: 'Weekly payouts (every 7 days)',
    note: 'Applies on funded accounts that have cleared the first payout. Min request size still $500.',
    source: '',
    firmPage: 'topone-futures.html'
  },
  {
    date: '2026-04-14', firm: 'tradeify', firmName: 'Tradeify', logo: '/logos/tradify.png',
    category: 'rule',
    headline: 'Consistency rule removed during evaluation',
    was: '40% consistency required during evaluation',
    is: 'No consistency rule during evaluation (35% still applies on funded)',
    note: 'Funded-phase rule unchanged. Trader-reported clarity of which rule applies when has improved.',
    source: '',
    firmPage: 'tradeify.html'
  },
  {
    date: '2026-04-08', firm: 'apex-trader', firmName: 'Apex Trader Funding', logo: '/logos/apex.png',
    category: 'rule',
    headline: 'EOD trailing drawdown method clarified',
    was: 'Drawdown locked at start of day · ambiguous reset logic',
    is: 'Trailing on closed P&L at EOD · locks once balance reaches starting + max DD',
    note: 'No mechanical change to the rule — the published docs now match how it actually behaves.',
    source: '',
    firmPage: 'apex-trader.html'
  },
  {
    date: '2026-04-02', firm: 'alpha', firmName: 'Alpha Futures', logo: '/logos/alpha.png',
    category: 'account-size',
    headline: '$200K account added to the Pro plan',
    was: 'Max account: 150K',
    is: 'Max account: 200K (Pro plan only)',
    note: 'Drawdown scales: $7,000 max DD, $4,500 profit target. Same trailing method.',
    source: '',
    firmPage: 'alpha-futures.html'
  },
  {
    date: '2026-03-27', firm: 'takeprofit', firmName: 'Take Profit Trader', logo: '/logos/takeprofit.png',
    category: 'payout',
    headline: 'First payout window shortened to 5 trading days',
    was: '10 trading days before first payout request',
    is: '5 trading days before first payout request',
    note: 'Min trading days for subsequent payouts unchanged. Applies retroactively to active funded accounts.',
    source: '',
    firmPage: 'take-profit-trader.html'
  },
  {
    date: '2026-03-22', firm: 'myfunded', firmName: 'MyFundedFutures', logo: '/logos/myfunded.png',
    category: 'rule',
    headline: 'News restriction window widened',
    was: '2 minutes before / 2 minutes after high-impact news',
    is: '5 minutes before / 5 minutes after',
    note: 'Applies to NFP, FOMC, CPI on funded accounts. Evaluation phase unchanged.',
    source: '',
    firmPage: 'my-funded-futures.html'
  },
  {
    date: '2026-03-18', firm: 'lucid-trading', firmName: 'Lucid Trading', logo: '/logos/lucid.png',
    category: 'feature',
    headline: 'New "Lucid Direct" 1-day pass added',
    was: '',
    is: 'Instant funding path — single day pass, no eval required',
    note: 'Higher upfront cost than evaluation route ($299 vs $99) but skips the 5-day eval. 75% split on Direct.',
    source: '',
    firmPage: 'lucid-trading.html'
  },
  {
    date: '2026-03-11', firm: 'apex-trader', firmName: 'Apex Trader Funding', logo: '/logos/apex.png',
    category: 'payout',
    headline: 'Payout split bumped to 100% on first $25K',
    was: '90% / 10% from dollar one',
    is: '100% on first $25K · then 90% / 10%',
    note: 'Applies on all funded accounts. Min request size now $1,000 (was $500).',
    source: '',
    firmPage: 'apex-trader.html'
  },
  {
    date: '2026-03-05', firm: 'topone', firmName: 'TopOne Futures', logo: '/logos/topone.png',
    category: 'platform',
    headline: 'NinjaTrader added as a supported feed',
    was: 'Rithmic + Tradovate only',
    is: 'Rithmic · Tradovate · NinjaTrader',
    note: 'NinjaTrader licensing included on accounts 100K and above. No change to commission structure.',
    source: '',
    firmPage: 'topone-futures.html'
  },
  {
    date: '2026-02-28', firm: 'tradeify', firmName: 'Tradeify', logo: '/logos/tradify.png',
    category: 'promo',
    headline: 'CHAMP code activated — 35% off all plans',
    was: 'No public discount',
    is: '35% off Growth · Select · Lightning · Builder',
    note: 'First time Tradeify has offered a public discount on the Builder plan. Verified at checkout on all four.',
    source: '',
    firmPage: 'tradeify.html'
  },
  {
    date: '2026-02-19', firm: 'alpha', firmName: 'Alpha Futures', logo: '/logos/alpha.png',
    category: 'rule',
    headline: 'Removed consistency rule on the Zero plan',
    was: '30% consistency required across all plans',
    is: 'Zero plan: no consistency rule · Pro: 30% (unchanged)',
    note: 'Funded-phase consistency on Zero now matches the eval-phase rule (which was already absent).',
    source: '',
    firmPage: 'alpha-futures.html'
  },
  {
    date: '2026-02-10', firm: 'lucid-trading', firmName: 'Lucid Trading', logo: '/logos/lucid.png',
    category: 'rule',
    headline: 'Min trading days removed on the Pro path',
    was: '5 minimum trading days before first payout',
    is: 'No minimum trading days · payout requestable from first profit day',
    note: 'Pro path only. Flex and Direct paths still require 5 days. First sub-1-day-to-funded path we have tracked.',
    source: '',
    firmPage: 'lucid-trading.html'
  }
];
