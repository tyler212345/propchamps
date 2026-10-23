/*
  PropChamps audit log — every rule, payout, and program change we've
  flagged at the firms we cover. Newest entry first.

  Consumed by /audit-log (full history with dynamic filters). The static
  HTML is pre-rendered by tools/build-content-pages.js, including the
  "Latest changes" summary, which lists every entry on the newest date.
  Re-run `node tools/build-content-pages.js` after adding an entry.

  Entry fields:
    date       ISO YYYY-MM-DD (the date we logged it)
    firm       firm slug — must match the slug key in data/firms.js
    firmName   display name
    logo       logo path
    category   one of: rule | promo | feature | payout | platform | account-size
    headline   one-line summary (sentence case, no period)
    was        previous state (short string; empty for "feature" / "new" entries)
    is         current state
    note       optional follow-up detail
    source     optional URL we sourced the change from
    firmPage   firm review slug for the "read review" link (clean URL, no .html)
    correction optional true: the entry corrects PropChamps' own data rather
               than reporting a change the firm made
    superseded optional { date, note }: a later audit contradicted this entry.
               The entry stays (it's a record) but renders as superseded,
               with the note explaining what's true now.
*/
window.CHANGELOG = [
  {
    date: '2026-10-23', firm: 'tradeify', firmName: 'Tradeify', logo: '/logos/tradify.png',
    category: 'payout', correction: true,
    headline: 'Tradeify Lightning pays every 5 days, not on demand',
    was: 'Lightning listed with instant / on-demand payouts',
    is: 'Every 5 days as marketed, with no fixed minimum days: a payout profit goal plus 20% / 25% / 30% consistency, $1,000 minimum',
    note: '"Instant" describes how Lightning is funded (no evaluation), not how it pays. Also updated: Growth evaluation resets are $169 / $229 on 100K / 150K (were $155 / $215). Tradeify\'s help center blocked our fetch, so Lightning\'s profit goals and caps come from search-index excerpts of it.',
    source: 'https://tradeify.co/',
    firmPage: 'tradeify'
  },
  {
    date: '2026-10-23', firm: 'lucid-trading', firmName: 'Lucid Trading', logo: '/logos/lucid.png',
    category: 'rule',
    headline: 'Lucid Flex and Daily evaluations use a 40% consistency rule',
    was: '50% evaluation consistency on Flex and Daily',
    is: '40% as standard; 50% is a paid add-on',
    note: 'Also corrected: Pro and Direct have no fixed payout window (eligibility is a profit goal plus the 40% or 20% consistency rule), Pro 25K has no DLL, and the 5-funded-account limit is per household across every Lucid account type. Lucid\'s own articles still disagree on Daily\'s evaluation consistency (we follow the newest, dated Oct 20) and on the Pro 25K DLL (we follow its evaluation and DLL articles).',
    source: 'https://support.lucidtrading.com/',
    firmPage: 'lucid-trading'
  },
  {
    date: '2026-10-23', firm: 'alpha-futures', firmName: 'Alpha Futures', logo: '/logos/alpha.png',
    category: 'rule', correction: true,
    headline: 'Alpha account limits: 5 qualified accounts per plan, 3 on Advanced',
    was: '3 funded accounts per household, $450K combined',
    is: 'Zero 5 · Standard 5 (3 if bought before Jul 27, 2026) · Direct 5 · Advanced 3',
    note: 'Also corrected: the $79-$289 resets are evaluation resets (qualified resets are $399-$999), Direct has no winning-day rule, minimum requests are $200 (Zero), $500 (Standard, Direct) and $1,000 (Advanced), and Alpha\'s published total is $70M in performance fees paid.',
    source: 'https://help.alpha-futures.com/en/articles/9492088',
    firmPage: 'alpha-futures'
  },
  {
    date: '2026-10-23', firm: 'top-one-futures', firmName: 'Top One Futures', logo: '/logos/topone.png',
    category: 'rule', correction: true,
    headline: 'Top One Elite Access: $39 evaluation, activation fee after you pass',
    was: 'Listed at $139 / $218 / $259 / $359 with no funded DLL',
    is: '$39 one-time evaluation at every size, then a $139 / $189 / $259 / $359 activation fee; funded DLL $500 / $1,000 / $1,250 / $1,750',
    note: 'Elite Access payouts are on request after 5 profitable days, not on a fixed 5-day calendar. Also updated: Instant Sim 2.0 caps are $1,000 / $2,000 / $2,500 / $3,000 per request for accounts bought on or after Jul 27, 2026, and Top One\'s published total is $30M+.',
    source: 'https://help.toponefutures.com/en/articles/14595016',
    firmPage: 'top-one-futures'
  },
  {
    date: '2026-10-23', firm: 'top-one-futures', firmName: 'Top One Futures', logo: '/logos/topone.png',
    category: 'feature',
    headline: 'Top One X-Ultra closed to new purchases',
    was: '',
    is: 'X-Ultra is no longer sold; X-Daily Spark is the current limited LaunchPad release',
    note: 'X-Daily Spark: 50K only, $39 evaluation, $189 activation, daily payouts and an 80/20 split. Existing X-Ultra accounts keep their rules. X-Daily Spark isn\'t in our plan tables yet.',
    source: 'https://help.toponefutures.com/',
    firmPage: 'top-one-futures'
  },
  {
    date: '2026-10-23', firm: 'my-funded-futures', firmName: 'My Funded Futures', logo: '/logos/myfunded.png',
    category: 'rule', correction: true,
    headline: 'MFF Pro contract limits and payout cycle corrected',
    was: 'Pro max 5 / 10 / 15 minis · bi-weekly payouts · Rapid "scale up to $100K"',
    is: 'Pro max 3 / 6 / 9 minis · payouts every 14 calendar days · $100K sim payout cap per user',
    note: 'MFF\'s help center states no per-payout cap for Rapid: you need a $1,100 / $2,100 / $3,100 / $4,600 buffer first, and a $10K session moves you to Live. Builder\'s 150K cap is $4,500 per cycle.',
    source: 'https://help.myfundedfutures.com/',
    firmPage: 'my-funded-futures'
  },
  {
    date: '2026-10-23', firm: 'fundednext', firmName: 'FundedNext', logo: '/logos/fundednext.png',
    category: 'payout', correction: true,
    headline: 'FundedNext Rapid minimum withdrawal is $250 at every size',
    was: '$250 / $250 / $500 by account size',
    is: '$250 minimum on every funded account',
    note: 'Prices updated to FundedNext\'s current offer prices: Flex $74.99 / $144.99 / $259.99 (first two purchases) and Rapid $79.99 / $169.99 / $279.99. FundedNext also sells a $50K Direct account (no challenge, 20% consistency) that isn\'t in our plan tables yet.',
    source: 'https://helpfutures.fundednext.com/',
    firmPage: 'fundednext'
  },
  {
    date: '2026-10-23', firm: 'take-profit', firmName: 'Take Profit Trader', logo: '/logos/takeprofit.png',
    category: 'platform', correction: true,
    headline: 'Take Profit Trader platform list: 14 platforms',
    was: 'Three different platform lists (6, 9 and 13 names)',
    is: 'TradingView, NinjaTrader and Tradovate (CQG) plus 11 Rithmic platforms, MotiveWave included',
    note: 'Also logged: tests bought from Aug 17, 2026 need 3 minimum trading days (older tests 5), and wallet withdrawals of $250 or less carry a $50 fee.',
    source: 'https://takeprofittraderhelp.zendesk.com/hc/en-us/articles/15173017163549',
    firmPage: 'take-profit-trader'
  },
  {
    date: '2026-08-17', firm: 'take-profit', firmName: 'Take Profit Trader', logo: '/logos/takeprofit.png',
    category: 'rule',
    headline: 'Take Profit Trader — full TEST → PRO → PRO+ ladder documented',
    was: 'Single "Evaluation" entry · PRO+ split typo · placeholder platforms',
    is: 'TEST (eval) → PRO (sim 80/20) → PRO+ (live 90/10) ladder',
    note: 'Confirmed the daily loss limit remains removed at every stage (a homepage read that suggested a $1,100 DLL was a misread). Documented the three-stage ladder: TEST evaluation uses EOD trailing drawdown and 50% consistency; PRO is simulated-funded 80/20 with day-one payouts and switches to intraday trailing drawdown; PRO+ is a real live-market account at 90/10 with EOD drawdown. Fixed the PRO+ split (was mis-typed 90/20), added the real platform list, and clarified the $130 one-time activation vs monthly subscription. Standard eval is 5 minimum trading days. Sourced from the TPT site and current rule references.',
    source: '',
    firmPage: 'take-profit-trader',
    superseded: { date: '2026-10-23', note: "Tests bought from Aug 17, 2026 need 3 minimum trading days, not 5 (older tests keep 5). PRO withdrawals have no minimum days once the balance clears the buffer." }
  },
  {
    date: '2026-08-17', firm: 'top-one-futures', firmName: 'Top One Futures', logo: '/logos/topone.png',
    category: 'rule',
    headline: 'Top One refresh — S2F dropped, four paths rebuilt from the site',
    was: 'Elite · Instant Sim · S2F · Ignite (mismatched plan data)',
    is: 'Elite Access · Elite Daily · Instant Sim · Ignite (all 90% split)',
    note: 'S2F Sim PRO is gone. Rebuilt all four paths cleanly: Elite Access (one-time 1-day pass, no DLL, 5-day payouts), Elite Daily (monthly eval, daily payouts, DLL $500-$1,850), Instant Sim Funded (monthly, skip eval, 20% consistency, trailing drawdown), Ignite (one-time instant funding, 15% consistency, now includes 150K). All pay a flat 90% split. List pricing added. Sourced from the Top One site.',
    source: '',
    firmPage: 'top-one-futures',
    superseded: { date: '2026-10-23', note: "Instant Sim Funded is a one-time purchase, not monthly (Sept 18, 2026 audit). Elite Access has a funded DLL ($500 / $1,000 / $1,250 / $1,750) and pays on request after 5 profitable days, not on a fixed 5-day calendar." }
  },
  {
    date: '2026-08-17', firm: 'my-funded-futures', firmName: 'My Funded Futures', logo: '/logos/myfunded.png',
    category: 'rule',
    headline: 'MFF lineup refresh — Flex retired, Rapid EOD added, Builder reworked',
    was: 'Rapid · Pro · Flex · Builder (50K-150K)',
    is: 'Rapid · Rapid EOD · Pro · Builder (25K/50K)',
    note: 'Flex is discontinued. New limited-time Rapid EOD keeps daily payouts but uses end-of-day drawdown in the funded stage (4-day pass, 30% eval consistency). Builder is now 25K/50K only with 48-hour sim payouts and a five-payout ladder to a real Live account at Blue Row Capital. Rapid confirmed: EOD in eval then intraday trailing once funded. Sourced from the MFF plan pages (rapid, rapid-eod, pro, builder).',
    source: '',
    firmPage: 'my-funded-futures',
    superseded: { date: '2026-10-05', note: "Builder is sold at 25K-150K again (one-time, with a per-size soft-pause DLL). The first request can come 48 hours after the first trade; each payout cycle then needs 2 trading days." }
  },
  {
    date: '2026-08-17', firm: 'alpha-futures', firmName: 'Alpha Futures', logo: '/logos/alpha.png',
    category: 'rule',
    headline: 'Alpha overhauled — Standard returns, new Direct plan, CHAMP now 40% off',
    was: 'Zero + Advanced live · Standard legacy-only · CHAMP 10% off',
    is: 'Zero · Standard · Advanced · Direct all live · CHAMP 40% off',
    note: 'Standard is back on the site (50K-150K, monthly $129/$239/$349). New one-time Direct plan added (straight-to-funded, 25K-150K, $349/$519/$689/$859, 20% consistency). Zero and Advanced list prices increased and Advanced dropped its $149 activation fee. Code CHAMP now takes 40% off (matches the public ALPHA40 promo). Sourced from the Alpha Futures site.',
    source: '',
    firmPage: 'alpha-futures',
    superseded: { date: '2026-10-23', note: "Alpha's own banner codes changed by our Oct 23, 2026 check: 40% off Zero, 50% off Standard, Direct and Advanced. CHAMP's 40% no longer matches the public code on every plan, and we're re-confirming the CHAMP rate at checkout." }
  },
  {
    date: '2026-08-17', firm: 'tradeify', firmName: 'Tradeify', logo: '/logos/tradify.png',
    category: 'rule',
    headline: 'Tradeify audit — Growth max accounts and Select target corrected',
    was: 'Growth listed 10 funded accounts · Select 50K target $2,500',
    is: 'Growth 5 funded accounts · Select 50K target $3,000',
    note: 'Also updated: Select evaluation reset fees now $75/$109/$169/$239, and Lightning 150K daily loss limit $3,000 (was $3,750) and max drawdown $5,250 (was $6,000). Growth, Select Daily/Flex funded paths, and all pricing verified unchanged. Sourced from Tradeify checkout configurator.',
    source: '',
    firmPage: 'tradeify'
  },
  {
    date: '2026-08-17', firm: 'apex-trader', firmName: 'Apex Trader Funding', logo: '/logos/apex.png',
    category: 'rule',
    headline: 'Apex refreshed — Intraday vs EOD split out, EOD DLL corrected',
    was: 'Combined Intraday/EOD entries · EOD DLL listed $500/$1,000/$2,000/$3,000',
    is: 'Intraday Trail (no DLL) and EOD Trail (DLL $500/$1,000/$1,500/$2,000) as separate plans',
    note: 'Full pricing added with the 90% CHAMP coupon (Standard and No-Activation-Fee variants, all sizes). Targets $1,500/$3,000/$6,000/$9,000, drawdown $1,000/$2,000/$3,000/$4,000, 1-day pass, 100% of first $25K then 90/10. Verified from Apex funding-path configurator.',
    source: '',
    firmPage: 'apex-trader',
    superseded: { date: '2026-09-18', note: "Apex pays 100% with no split, not \"100% of the first $25K then 90/10\"." }
  },
  {
    date: '2026-08-17', firm: 'lucid-trading', firmName: 'Lucid Trading', logo: '/logos/lucid.png',
    category: 'rule',
    headline: 'Lucid lineup refreshed — Daily added, LucidScale DLL, Black retired',
    was: 'Pro · Black · Flex · Direct',
    is: 'Pro · Flex · Daily · Direct (Black discontinued)',
    note: 'New LucidDaily (configurable eval — pick EOD/Intraday drawdown + DLL on/off, daily payouts). Funded accounts now use the LucidScale DLL model (60% of peak EOD above initial trail). Pro pays out in 3 days. Prices refreshed with CHAMP coupon. Verified from Lucid account pages.',
    source: '',
    firmPage: 'lucid-trading',
    superseded: { date: '2026-10-23', note: "Lucid Pro has no fixed payout window. You request once the profit goal, buffer and 40% funded consistency rule are met, which takes at least 3 profitable days in practice (our reading of the rule)." }
  },
  {
    date: '2026-08-17', firm: 'fundednext', firmName: 'FundedNext', logo: '/logos/fundednext.png',
    category: 'feature',
    headline: 'FundedNext Futures added to PropChamps',
    was: 'Not listed',
    is: 'Full listing — Flex, Legacy and Rapid (Pro / Daily)',
    note: 'Flex pays a 95% reward share with no daily loss limit; Rapid passes in one day. All use EOD drawdown and allow news trading. Platforms: NinjaTrader, Tradovate, TradingView. Code CHAMP.',
    source: '',
    firmPage: 'fundednext'
  },
  {
    date: '2026-05-28', firm: 'alpha-futures', firmName: 'Alpha Futures', logo: '/logos/alpha.png',
    category: 'promo',
    headline: 'Zero plan activation fee dropped to $0',
    was: '$99 activation on one-day pass',
    is: '$0 — activation waived on the Zero plan',
    note: 'Flat 90% profit split unchanged. Confirmed at checkout against the 50K and 100K sizes.',
    source: '',
    firmPage: 'alpha-futures'
  },
  {
    date: '2026-05-22', firm: 'tradeify', firmName: 'Tradeify', logo: '/logos/tradify.png',
    category: 'platform',
    headline: 'Added Tradesea + Rithmic feeds across Select and Lightning',
    was: 'Tradovate + WealthCharts only',
    is: 'Tradovate · WealthCharts · Tradesea · Rithmic',
    note: 'No additional cost on Select or Lightning paths. Growth plan still Tradovate + WealthCharts.',
    source: '',
    firmPage: 'tradeify',
    superseded: { date: '2026-10-05', note: "Tradesea and Rithmic are listed on every Tradeify plan, Growth included." }
  },
  {
    date: '2026-05-18', firm: 'take-profit', firmName: 'Take Profit Trader', logo: '/logos/takeprofit.png',
    category: 'rule',
    headline: 'Daily loss limit removed on every account size',
    was: 'DLL: $1,500 at 50K · $2,500 at 100K · $3,500 at 150K',
    is: 'No daily loss limit',
    note: 'Trailing drawdown method unchanged. Min trading days still 5 before payout request.',
    source: '',
    firmPage: 'take-profit-trader',
    superseded: { date: '2026-10-23', note: "The DLL is still removed. The payout timing is outdated: PRO accounts can withdraw from day one once the balance clears the buffer, and tests bought from Aug 17, 2026 need 3 minimum trading days." }
  },
  {
    date: '2026-05-12', firm: 'apex-trader', firmName: 'Apex Trader Funding', logo: '/logos/apex.png',
    category: 'promo',
    headline: 'CHAMP code stacks to 90% off + $0 activation',
    was: '80% off · activation fee still applied at funded',
    is: '90% off + activation fee waived',
    note: 'Verified at checkout on Instant Funding and EOD Trail across 50K, 100K, 150K. Biggest combined deal we have tracked.',
    source: '',
    firmPage: 'apex-trader',
    superseded: { date: '2026-10-23', note: "Per Apex's help center (Oct 2026, read through a search-index excerpt because Apex blocked our fetch), coupon codes don't apply to resets or PA activation fees. $0 activation comes from buying the No-Activation-Fee evaluation, which has a higher list price." }
  },
  {
    date: '2026-05-04', firm: 'my-funded-futures', firmName: 'My Funded Futures', logo: '/logos/myfunded.png',
    category: 'feature',
    headline: 'Rapid Live $10K session launched',
    was: '',
    is: 'New lower-barrier path to live capital — $10K session, 90% split',
    note: 'Replaces the older Rapid Pro flow on smaller accounts. Existing Rapid Pro traders grandfathered through Aug.',
    source: '',
    firmPage: 'my-funded-futures',
    superseded: { date: '2026-10-23', note: "Current rule: a $10,000 net-profit session on a Rapid sim-funded account moves you to Live automatically, and profit above $10K that day is forfeited." }
  },
  {
    date: '2026-04-26', firm: 'lucid-trading', firmName: 'Lucid Trading', logo: '/logos/lucid.png',
    category: 'rule',
    headline: 'Consistency rule loosened — 40% → 35% on funded',
    was: '40% consistency required on funded accounts',
    is: '35% consistency on funded · no rule during evaluation',
    note: 'Evaluation-phase rule was already removed in March. This change applies post-funding.',
    source: '',
    firmPage: 'lucid-trading',
    superseded: { date: '2026-10-23', note: "Lucid Pro funded consistency is 40%. The 35% rule applies only to legacy accounts bought or reset before 11/28/2025." }
  },
  {
    date: '2026-04-20', firm: 'top-one-futures', firmName: 'Top One Futures', logo: '/logos/topone.png',
    category: 'payout',
    headline: 'Payout cadence tightened to 7 days',
    was: 'Bi-weekly payouts (every 14 days)',
    is: 'Weekly payouts (every 7 days)',
    note: 'Applies on funded accounts that have cleared the first payout. Min request size still $500.',
    source: '',
    firmPage: 'top-one-futures',
    superseded: { date: '2026-10-23', note: "There is no weekly cadence. Elite Access pays on request after 5 profitable days, Elite Daily pays daily from day 1, and Instant Sim and Ignite pay once their profit target and consistency rule are met." }
  },
  {
    date: '2026-04-14', firm: 'tradeify', firmName: 'Tradeify', logo: '/logos/tradify.png',
    category: 'rule',
    headline: 'Consistency rule removed during evaluation',
    was: '40% consistency required during evaluation',
    is: 'No consistency rule during evaluation (35% still applies on funded)',
    note: 'Funded-phase rule unchanged. Trader-reported clarity of which rule applies when has improved.',
    source: '',
    firmPage: 'tradeify',
    superseded: { date: '2026-10-23', note: "This applies to Growth. Select evaluations use a 40% rule (50% with a paid add-on) and have none once funded; Lightning uses 20% / 25% / 30%." }
  },
  {
    date: '2026-04-08', firm: 'apex-trader', firmName: 'Apex Trader Funding', logo: '/logos/apex.png',
    category: 'rule',
    headline: 'EOD trailing drawdown method clarified',
    was: 'Drawdown locked at start of day · ambiguous reset logic',
    is: 'Trailing on closed P&L at EOD · locks once balance reaches starting + max DD',
    note: 'No mechanical change to the rule — the published docs now match how it actually behaves.',
    source: '',
    firmPage: 'apex-trader'
  },
  {
    date: '2026-04-02', firm: 'alpha-futures', firmName: 'Alpha Futures', logo: '/logos/alpha.png',
    category: 'account-size',
    headline: '$200K account added to the Pro plan',
    was: 'Max account: 150K',
    is: 'Max account: 200K (Pro plan only)',
    note: 'Drawdown scales: $7,000 max DD, $4,500 profit target. Same trailing method.',
    source: '',
    firmPage: 'alpha-futures',
    superseded: { date: '2026-10-05', note: "Alpha has no Pro plan and no 200K account. Current plans: Zero (25K-100K), Standard and Advanced (50K-150K) and Direct (25K-150K)." }
  },
  {
    date: '2026-03-27', firm: 'take-profit', firmName: 'Take Profit Trader', logo: '/logos/takeprofit.png',
    category: 'payout',
    headline: 'First payout window shortened to 5 trading days',
    was: '10 trading days before first payout request',
    is: '5 trading days before first payout request',
    note: 'Min trading days for subsequent payouts unchanged. Applies retroactively to active funded accounts.',
    source: '',
    firmPage: 'take-profit-trader',
    superseded: { date: '2026-10-23', note: "PRO accounts have no minimum profit days and no payout windows: you can withdraw from day one once the balance clears the buffer." }
  },
  {
    date: '2026-03-22', firm: 'my-funded-futures', firmName: 'My Funded Futures', logo: '/logos/myfunded.png',
    category: 'rule',
    headline: 'News restriction window widened',
    was: '2 minutes before / 2 minutes after high-impact news',
    is: '5 minutes before / 5 minutes after',
    note: 'Applies to NFP, FOMC, CPI on funded accounts. Evaluation phase unchanged.',
    source: '',
    firmPage: 'my-funded-futures',
    superseded: { date: '2026-10-23', note: "MFF's help center gives the Tier-1 news window as 2 minutes before to 2 minutes after, on Rapid and Pro sim-funded accounts. News is allowed in evaluations and on Builder." }
  },
  {
    date: '2026-03-18', firm: 'lucid-trading', firmName: 'Lucid Trading', logo: '/logos/lucid.png',
    category: 'feature',
    headline: 'New "Lucid Direct" 1-day pass added',
    was: '',
    is: 'Instant funding path — single day pass, no eval required',
    note: 'Higher upfront cost than evaluation route ($299 vs $99) but skips the 5-day eval. 75% split on Direct.',
    source: '',
    firmPage: 'lucid-trading',
    superseded: { date: '2026-10-05', note: "Lucid Direct is straight to funded (no evaluation) and pays 90/10 like every Lucid path. Its 20% consistency rule means at least 5 profitable days before a payout in practice (our reading)." }
  },
  {
    date: '2026-03-11', firm: 'apex-trader', firmName: 'Apex Trader Funding', logo: '/logos/apex.png',
    category: 'payout',
    headline: 'Payout split bumped to 100% on first $25K',
    was: '90% / 10% from dollar one',
    is: '100% on first $25K · then 90% / 10%',
    note: 'Applies on all funded accounts. Min request size now $1,000 (was $500).',
    source: '',
    firmPage: 'apex-trader',
    superseded: { date: '2026-09-18', note: "Apex pays 100% with no split, and the minimum request is $500, not $1,000." }
  },
  {
    date: '2026-03-05', firm: 'top-one-futures', firmName: 'Top One Futures', logo: '/logos/topone.png',
    category: 'platform',
    headline: 'NinjaTrader added as a supported feed',
    was: 'Rithmic + Tradovate only',
    is: 'Rithmic · Tradovate · NinjaTrader',
    note: 'NinjaTrader licensing included on accounts 100K and above. No change to commission structure.',
    source: '',
    firmPage: 'top-one-futures',
    superseded: { date: '2026-10-05', note: "Top One's current platforms: Tradovate, NinjaTrader, TradingView, BlackArrow and WealthCharts. Rithmic is not listed." }
  },
  {
    date: '2026-02-28', firm: 'tradeify', firmName: 'Tradeify', logo: '/logos/tradify.png',
    category: 'promo',
    headline: 'CHAMP code activated — 35% off all plans',
    was: 'No public discount',
    is: '35% off Growth · Select · Lightning · Builder',
    note: 'First time Tradeify has offered a public discount on the Builder plan. Verified at checkout on all four.',
    source: '',
    firmPage: 'tradeify',
    superseded: { date: '2026-10-05', note: "Tradeify sells Growth, Select and Lightning; there is no Builder plan. We don't have a confirmed CHAMP percentage on file for Tradeify, so the discount shows at checkout." }
  },
  {
    date: '2026-02-19', firm: 'alpha-futures', firmName: 'Alpha Futures', logo: '/logos/alpha.png',
    category: 'rule',
    headline: 'Removed consistency rule on the Zero plan',
    was: '30% consistency required across all plans',
    is: 'Zero plan: no consistency rule · Pro: 30% (unchanged)',
    note: 'Funded-phase consistency on Zero now matches the eval-phase rule (which was already absent).',
    source: '',
    firmPage: 'alpha-futures',
    superseded: { date: '2026-10-23', note: "Alpha has no Pro plan. Zero has no consistency rule in the evaluation but a 40% rule on qualified accounts." }
  },
  {
    date: '2026-02-10', firm: 'lucid-trading', firmName: 'Lucid Trading', logo: '/logos/lucid.png',
    category: 'rule',
    headline: 'Min trading days removed on the Pro path',
    was: '5 minimum trading days before first payout',
    is: 'No minimum trading days · payout requestable from first profit day',
    note: 'Pro path only. Flex and Direct paths still require 5 days. First sub-1-day-to-funded path we have tracked.',
    source: '',
    firmPage: 'lucid-trading',
    superseded: { date: '2026-10-23', note: "Pro still has no fixed minimum days, but a payout isn't available from the first profit day: the 40% funded consistency rule means at least 3 profitable days in practice (our reading)." }
  }
];
