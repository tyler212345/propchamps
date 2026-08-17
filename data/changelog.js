/*
  PropChamps audit log — every rule, payout, and program change we've
  flagged at the firms we cover. Newest entry first.

  Consumed by /audit-log.html (full history with dynamic filters). The
  homepage "Live changelog" cards in /index.html are hand-maintained to
  mirror the newest entries here — update them when you add an entry.

  Entry fields:
    date     ISO YYYY-MM-DD
    firm     firm slug — must match the slug key in data/firms.js
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
    date: '2026-08-17', firm: 'take-profit', firmName: 'Take Profit Trader', logo: '/logos/takeprofit.png',
    category: 'rules',
    headline: 'Take Profit Trader — full TEST → PRO → PRO+ ladder documented',
    was: 'Single "Evaluation" entry · PRO+ split typo · placeholder platforms',
    is: 'TEST (eval) → PRO (sim 80/20) → PRO+ (live 90/10) ladder',
    note: 'Confirmed the daily loss limit remains removed at every stage (a homepage read that suggested a $1,100 DLL was a misread). Documented the three-stage ladder: TEST evaluation uses EOD trailing drawdown and 50% consistency; PRO is simulated-funded 80/20 with day-one payouts and switches to intraday trailing drawdown; PRO+ is a real live-market account at 90/10 with EOD drawdown. Fixed the PRO+ split (was mis-typed 90/20), added the real platform list, and clarified the $130 one-time activation vs monthly subscription. Standard eval is 5 minimum trading days. Sourced from the TPT site and current rule references.',
    source: '',
    firmPage: 'take-profit-trader.html'
  },
  {
    date: '2026-08-17', firm: 'top-one-futures', firmName: 'Top One Futures', logo: '/logos/topone.png',
    category: 'rules',
    headline: 'Top One refresh — S2F dropped, four paths rebuilt from the site',
    was: 'Elite · Instant Sim · S2F · Ignite (mismatched plan data)',
    is: 'Elite Access · Elite Daily · Instant Sim · Ignite (all 90% split)',
    note: 'S2F Sim PRO is gone. Rebuilt all four paths cleanly: Elite Access (one-time 1-day pass, no DLL, 5-day payouts), Elite Daily (monthly eval, daily payouts, DLL $500-$1,850), Instant Sim Funded (monthly, skip eval, 20% consistency, trailing drawdown), Ignite (one-time instant funding, 15% consistency, now includes 150K). All pay a flat 90% split. List pricing added. Sourced from the Top One site.',
    source: '',
    firmPage: 'top-one-futures.html'
  },
  {
    date: '2026-08-17', firm: 'my-funded-futures', firmName: 'My Funded Futures', logo: '/logos/myfunded.png',
    category: 'rules',
    headline: 'MFF lineup refresh — Flex retired, Rapid EOD added, Builder reworked',
    was: 'Rapid · Pro · Flex · Builder (50K-150K)',
    is: 'Rapid · Rapid EOD · Pro · Builder (25K/50K)',
    note: 'Flex is discontinued. New limited-time Rapid EOD keeps daily payouts but uses end-of-day drawdown in the funded stage (4-day pass, 30% eval consistency). Builder is now 25K/50K only with 48-hour sim payouts and a five-payout ladder to a real Live account at Blue Row Capital. Rapid confirmed: EOD in eval then intraday trailing once funded. Sourced from the MFF plan pages (rapid, rapid-eod, pro, builder).',
    source: '',
    firmPage: 'my-funded-futures.html'
  },
  {
    date: '2026-08-17', firm: 'alpha-futures', firmName: 'Alpha Futures', logo: '/logos/alpha.png',
    category: 'rules',
    headline: 'Alpha overhauled — Standard returns, new Direct plan, CHAMP now 40% off',
    was: 'Zero + Advanced live · Standard legacy-only · CHAMP 10% off',
    is: 'Zero · Standard · Advanced · Direct all live · CHAMP 40% off',
    note: 'Standard is back on the site (50K-150K, monthly $129/$239/$349). New one-time Direct plan added (straight-to-funded, 25K-150K, $349/$519/$689/$859, 20% consistency). Zero and Advanced list prices increased and Advanced dropped its $149 activation fee. Code CHAMP now takes 40% off (matches the public ALPHA40 promo). Sourced from the Alpha Futures site.',
    source: '',
    firmPage: 'alpha-futures.html'
  },
  {
    date: '2026-08-17', firm: 'tradeify', firmName: 'Tradeify', logo: '/logos/tradeify.png',
    category: 'rules',
    headline: 'Tradeify audit — Growth max accounts and Select target corrected',
    was: 'Growth listed 10 funded accounts · Select 50K target $2,500',
    is: 'Growth 5 funded accounts · Select 50K target $3,000',
    note: 'Also updated: Select evaluation reset fees now $75/$109/$169/$239, and Lightning 150K daily loss limit $3,000 (was $3,750) and max drawdown $5,250 (was $6,000). Growth, Select Daily/Flex funded paths, and all pricing verified unchanged. Sourced from Tradeify checkout configurator.',
    source: '',
    firmPage: 'tradeify.html'
  },
  {
    date: '2026-08-17', firm: 'apex-trader', firmName: 'Apex Trader Funding', logo: '/logos/apex.png',
    category: 'rules',
    headline: 'Apex refreshed — Intraday vs EOD split out, EOD DLL corrected',
    was: 'Combined Intraday/EOD entries · EOD DLL listed $500/$1,000/$2,000/$3,000',
    is: 'Intraday Trail (no DLL) and EOD Trail (DLL $500/$1,000/$1,500/$2,000) as separate plans',
    note: 'Full pricing added with the 90% CHAMP coupon (Standard and No-Activation-Fee variants, all sizes). Targets $1,500/$3,000/$6,000/$9,000, drawdown $1,000/$2,000/$3,000/$4,000, 1-day pass, 100% of first $25K then 90/10. Verified from Apex funding-path configurator.',
    source: '',
    firmPage: 'apex-trader.html'
  },
  {
    date: '2026-08-17', firm: 'lucid-trading', firmName: 'Lucid Trading', logo: '/logos/lucid.png',
    category: 'rules',
    headline: 'Lucid lineup refreshed — Daily added, LucidScale DLL, Black retired',
    was: 'Pro · Black · Flex · Direct',
    is: 'Pro · Flex · Daily · Direct (Black discontinued)',
    note: 'New LucidDaily (configurable eval — pick EOD/Intraday drawdown + DLL on/off, daily payouts). Funded accounts now use the LucidScale DLL model (60% of peak EOD above initial trail). Pro pays out in 3 days. Prices refreshed with CHAMP coupon. Verified from Lucid account pages.',
    source: '',
    firmPage: 'lucid-trading.html'
  },
  {
    date: '2026-08-17', firm: 'fundednext', firmName: 'FundedNext', logo: '/logos/fundednext.png',
    category: 'listing',
    headline: 'FundedNext Futures added to PropChamps',
    was: 'Not listed',
    is: 'Full listing — Flex, Legacy and Rapid (Pro / Daily)',
    note: 'Flex pays a 95% reward share with no daily loss limit; Rapid passes in one day. All use EOD drawdown and allow news trading. Platforms: NinjaTrader, Tradovate, TradingView. Code CHAMP.',
    source: '',
    firmPage: 'fundednext.html'
  },
  {
    date: '2026-05-28', firm: 'alpha-futures', firmName: 'Alpha Futures', logo: '/logos/alpha.png',
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
    date: '2026-05-18', firm: 'take-profit', firmName: 'Take Profit Trader', logo: '/logos/takeprofit.png',
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
    date: '2026-05-04', firm: 'my-funded-futures', firmName: 'MyFundedFutures', logo: '/logos/myfunded.png',
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
    date: '2026-04-20', firm: 'top-one-futures', firmName: 'TopOne Futures', logo: '/logos/topone.png',
    category: 'payout',
    headline: 'Payout cadence tightened to 7 days',
    was: 'Bi-weekly payouts (every 14 days)',
    is: 'Weekly payouts (every 7 days)',
    note: 'Applies on funded accounts that have cleared the first payout. Min request size still $500.',
    source: '',
    firmPage: 'top-one-futures.html'
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
    date: '2026-04-02', firm: 'alpha-futures', firmName: 'Alpha Futures', logo: '/logos/alpha.png',
    category: 'account-size',
    headline: '$200K account added to the Pro plan',
    was: 'Max account: 150K',
    is: 'Max account: 200K (Pro plan only)',
    note: 'Drawdown scales: $7,000 max DD, $4,500 profit target. Same trailing method.',
    source: '',
    firmPage: 'alpha-futures.html'
  },
  {
    date: '2026-03-27', firm: 'take-profit', firmName: 'Take Profit Trader', logo: '/logos/takeprofit.png',
    category: 'payout',
    headline: 'First payout window shortened to 5 trading days',
    was: '10 trading days before first payout request',
    is: '5 trading days before first payout request',
    note: 'Min trading days for subsequent payouts unchanged. Applies retroactively to active funded accounts.',
    source: '',
    firmPage: 'take-profit-trader.html'
  },
  {
    date: '2026-03-22', firm: 'my-funded-futures', firmName: 'MyFundedFutures', logo: '/logos/myfunded.png',
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
    date: '2026-03-05', firm: 'top-one-futures', firmName: 'TopOne Futures', logo: '/logos/topone.png',
    category: 'platform',
    headline: 'NinjaTrader added as a supported feed',
    was: 'Rithmic + Tradovate only',
    is: 'Rithmic · Tradovate · NinjaTrader',
    note: 'NinjaTrader licensing included on accounts 100K and above. No change to commission structure.',
    source: '',
    firmPage: 'top-one-futures.html'
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
    date: '2026-02-19', firm: 'alpha-futures', firmName: 'Alpha Futures', logo: '/logos/alpha.png',
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
