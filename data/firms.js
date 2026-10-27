/**
 * ============================================================
 * PROPCHAMPS — CENTRAL FIRM DATA
 * ============================================================
 *
 * Single source of truth for all prop firm data on PropChamps.
 * When firm rules, promo codes, payouts, or affiliate links
 * change, update them HERE — every page (index, compare, deals)
 * reflects the change automatically.
 *
 * USAGE:
 *   <script src="/data/firms.js"></script>
 *   Then access: window.FIRMS["tradeify"].name
 *
 * SCHEMA (per firm):
 *   slug              — unique key (also the keys of window.FIRMS)
 *   name              — display name (e.g., "Tradeify")
 *   initials          — 2-letter fallback if logo missing (e.g., "TR")
 *   logo              — image path (e.g., "/logos/tradify.png")
 *   logoText          — text fallback for logo (e.g., "TR")
 *   affiliateUrl      — full affiliate link (with CHAMP code where applicable)
 *   type              — short category line (e.g., "Growth · Select · Lightning")
 *   tagline           — marketing tagline for deals page
 *   badge             — "hot" | "new" | null — corner badge on deals card
 *   featured          — true/false — feature on deals page
 *   live              — true/false — set false to hide a firm without removing it
 *   tags              — array of marketing tags for deals filtering
 *   filters           — array of filter keys for compare page
 *   promo             — { code, discount }
 *   offerLine         — bold deals page offer headline (e.g., "50% OFF")
 *   offerSub          — deals page offer subtext
 *   summary           — full paragraph for deals page summary
 *   highlights        — short bullets for compare card
 *   bestFor           — short bullets for compare matrix "Best For"
 *   stats             — array of [label, value] pairs for deals card
 *   boxPreviews       — { deal, programs, rules, payouts } — short preview text
 *   boxMore           — { deal, programs, rules, payouts } — longer expanded text
 *   programs          — array of program description lines (deals page)
 *   rules             — array of rule lines (deals page)
 *   payouts           — array of payout lines (deals page)
 *   platforms         — array of platform lines (deals page)
 *   warning           — caution copy or null
 *   plansDetailed     — array of detailed plans for index modal
 *                       each plan: { name, featured?, rules: [[label, value], ...] }
 *   plansSummary      — array of compact plans for compare matrix
 *                       each plan: { name, featured?, rules: { label: value, ... } }
 *   note              — footer note shown below plans
 *
 * EDIT NOTES:
 *   • Always escape apostrophes in single-quoted strings, or use double quotes.
 *   • plansDetailed and plansSummary serve TWO different views:
 *       - plansDetailed: index.html modal — 15+ rule fields per plan
 *       - plansSummary:  compare.html matrix — 11 standardized fields
 *     If you only update one, the other view will be stale.
 *   • To hide a firm without removing it: set live: false.
 *   • To remove a firm entirely: delete its entry AND remove from FIRM_ORDER.
 *
 * OCT 27, 2026 — no "rating" / "reviewCount" fields: PropChamps publishes no star ratings or review counts. Do not re-add.
 *
 * OCT 23, 2026 VERIFICATION (targeted payout/limits/consistency check vs official help centers; full fact
 *   sheet with per-value source URLs lives in the SEO run's verified-facts.md). Read directly:
 *   support.lucidtrading.com, help.alpha-futures.com + alpha-futures.com, help.toponefutures.com +
 *   toponefutures.com, help.myfundedfutures.com, helpfutures.fundednext.com, takeprofittraderhelp.zendesk.com
 *   + takeprofittrader.com, tradeify.co (homepage plan data + /funded-trader-agreement). BLOCKED (Cloudflare
 *   challenge, not bypassed): help.tradeify.co, apextraderfunding.com + support.apextraderfunding.com,
 *   lucidtrading.com — Tradeify/Apex payout details below come from search-index excerpts of those pages.
 *   Changed: Tradeify Lightning payouts = every 5 days as marketed (no fixed min days; profit goal + 20/25/30%
 *     consistency), NOT instant/on-demand; Lightning split 90/10; Growth resets $169/$229 on 100K/150K.
 *   Lucid Flex & Daily eval consistency now 40% (50% = paid add-on); Pro/Direct have NO fixed payout window
 *     ("3 days"/"5 days" were implied by 40%/20% consistency); Pro 25K has no DLL; funded limit is 5 per
 *     household across ALL Lucid types; Pro legacy 100%-of-first-$10K note.
 *   Alpha max accounts = Zero 5 / Standard 5 / Direct 5 / Advanced 3 qualified (old "3 per household · $450K"
 *     removed); $79-$289 resets are EVALUATION resets (qualified resets $399-$999); Direct has no winning-day
 *     rule; payout minimums added; public promo is now MYALPHA40 (Zero) / MYALPHA50 (Std/Direct/Adv), not
 *     ALPHA40; firm-published total $70M+.
 *   Top One Elite Access eval = $39 flat (the "$39 flat entry" note was RIGHT; $139-$359 is the activation fee,
 *     the old "$139/$218/$259/$359 list" was wrong); Elite Access has a funded DLL; payouts after 5 profitable
 *     days (not "every 5 days"); Instant Sim 2.0 caps $1,000-$3,000; Elite Daily eval resets $66-$215; X-Ultra
 *     closed to new purchases; total $30M+; news rules added.
 *   MFF Pro max contracts 3/6/9; Builder 150K cap $4,500; Rapid has no stated per-payout cap ("scale up to
 *     $100K" removed); Builder live has a DLL. FundedNext current offer prices + $250 min withdrawal on all
 *     Rapid sizes. TPT: one 14-platform list everywhere (from its knowledge base). Apex: unchanged (blocked).
 *   Still owner/checkout-gated: every CHAMP %, TPT CHAMP 40% vs $40, Lucid VAULT vs CHAMP, Apex activation fees.
 *
 * LAST DATA UPDATE — Oct 5, 2026 (full 8-firm re-audit vs each firm's live site + help center)
 *   Pricing now stored as LIST price + "CHAMP applies the discount" (durable vs stale promo nets):
 *     converted Apex, Tradeify, MFF to list; Alpha/TPT/TopOne already list; Lucid/FundedNext kept current
 *     (net matched site). Payout TOTALS refreshed to each firm's published figure (Tradeify $350M+, Apex
 *     $800M+, MFF $250M+, FundedNext $380M+, TopOne $29M+); payout count/avg/largest/median are UNVERIFIED
 *     estimates (firms don't publish them) — do not treat as sourced. Key fixes: MFF Builder now 25K-150K
 *     one-time + per-size soft-pause DLL; MFF Rapid-EOD phantom 100K/150K removed; platforms corrected
 *     (Alpha +TradingView/"DeepChart"; Apex 3 platforms, TV via Tradovate; TPT Rithmic→R-Trader +MotiveWave;
 *     Lucid +6 (CQG/Rithmic); TopOne +BlackArrow/WealthCharts; MFF +Hyperprop −DeepChart). Tradeify Lightning
 *     payouts = instant + Select Daily/Flex caps re-tiered; FundedNext Rapid-Pro consistency is funded-only +
 *     Rapid min-withdrawal $250; Alpha $450K cap = 3 accts/household (any mix) + Advanced reset $189/$319/$449.
 *     Added per-firm news policies (Lucid/TPT/TopOne/Alpha) + new offerings (Apex legacy $300K & 20 accts,
 *     Tradeify Select 300K + 50% add-on, FundedNext Rapid-Pro DLL option). OWNER/DEFERRED: Lucid public code
 *     is now VAULT (CHAMP = affiliate) — confirm displayed code; exact CHAMP %s still checkout-gated; Lucid
 *     advertises $700M+/500K traders (our stats left, under review); TopOne X-Ultra full spec; Apex funded
 *     activation-fee amounts.
 * PRIOR DATA UPDATE — Sept 18, 2026 (accuracy audit vs each firm's live help center — verified fixes applied)
 *   Sept audit highlights: Apex 4.0 (100% split, no split · payouts capped 6-ladder · max alloc $150K) ·
 *     "No cap" corrected to real per-payout caps on Apex/Tradeify/Lucid/TopOne · MFF + TopOne Instant now
 *     one-time (not monthly) · TopOne Instant EOD-trailing + $28M payouts · MFF Rapid EOD 25K/50K + funded
 *     no-news · Alpha Standard is CURRENT (add TradingView; Advanced reset $189/$319/$449) · Tradeify
 *     Lightning 20/25/30 consistency + instant payouts + Select caps re-tiered · TPT min 3 days + CHAMP 40%
 *     off · FundedNext Rapid price drop. Deferred to ops-sheet confirm: all exact CHAMP %s, a few checkout-
 *     gated prices/reset fees, TopOne S2F Sim Pro full spec, Lucid Direct pricing.
 * PRIOR DATA UPDATE — June 08, 2026 (full plan-rules refresh from ops sheet)
 *   Alpha:      Zero (one-day pass · flat 90% · $0 activation) · Advanced (90% day-1 · $149 activation [SUPERSEDED: $0 for accounts bought after Jul 8, 2026] · no news restrictions) · Standard (CURRENT — back on the site; a short-lived "Premium" replaced it then was dropped)
 *   Tradeify:   one-time payments + Tradesea/Rithmic (effective 03/31/26)
 *   Lucid:      Pro · Black (legacy) · Flex · Direct
 *   MyFunded:   Rapid Live $10K-session transition (effective 04/16/26)
 *   TakeProfit: DLL removed across all sizes
 *   TopOne:     1-Step Elite · Instant Sim · S2F · Ignite (live values only)
 *   Apex:       no changes from previous data
 * ============================================================
 */

window.FIRMS = {
  "tradeify": {
    "slug": "tradeify",
    "lastAudited": "2026-10-23",
    "country": "US",
    "maxAllocation": "$300K",
    "platformsList": ["Tradovate","WealthCharts","Tradesea","Rithmic"],
    "payoutTotal": "$350M+",
    "payoutCount": "1,500+",
    "payoutAvg": "$3,000",
    "payoutLargest": "$22K",
    "payoutMedianTime": "5 days",
    "name": "Tradeify",
    "initials": "TR",
    "logo": "/logos/tradify.png",
    "logoText": "TR",
    "affiliateUrl": "https://tradeify.co/?ref=CHAMP",
    "type": "Growth · Select · Lightning",
    "tagline": "Growth · Select · Lightning",
    "badge": "new",
    "featured": false,
    "live": true,
    "tags": ["fast-payout", "no-dll"],
    "filters": ["evaluation", "fast-payout", "nodll"],
    "promo": {
      "code": "CHAMP",
      "discount": "See pricing"
    },
    "offerLine": "Use Code CHAMP",
    "offerSub": "Growth · Select (Daily / Flex) · Lightning",
    "summary": "Tradeify offers Growth, Select, and Lightning paths — all now one-time payments (updated 03/31/26). Select is the standout: after evaluation you choose Daily payouts or the Flex path with no DLL. Tradesea and Rithmic data feeds added 03/31/26. Code CHAMP applies at checkout.",
    "highlights": ["Daily Payout Option", "No DLL on Select Flex", "3 Distinct Paths"],
    "bestFor": ["Daily Payouts", "No DLL on Flex", "Path Flexibility"],
    "stats": [
      ["Paths", "3 Options"],
      ["Code", "CHAMP"],
      ["Platforms", "Tradovate · WealthCharts · Tradesea / Rithmic"]
    ],
    "boxPreviews": {
      "deal": "One-time payments · Code CHAMP at checkout",
      "programs": "Growth, Select (Daily or Flex), Lightning",
      "rules": "Growth uses DLL · Select Flex removes DLL · Lightning no DLL on 25K",
      "payouts": "Daily (Select Daily) · 5-day (Growth, Select Flex, Lightning)"
    },
    "boxMore": {
      "deal": "Use code CHAMP at checkout. As of 03/31/26 Tradeify removed monthly subscriptions — all plans are now one-time payments. Tradesea and Rithmic data feeds added.",
      "programs": "GROWTH — One-time payment · 25K-150K · Eval + Funded (35% funded consistency · 5-day payouts · 5 max accounts)\nSELECT — One-time payment · 25K-150K · Eval, then choose Daily or Flex funding path\nLIGHTNING — One-time payment · 25K-150K · instant funding (no eval) · 20% / 25% / 30% consistency (P1 / P2 / P3+) · 5-day payouts · 5 max accounts",
      "rules": "Growth Eval (25K-150K): Profit target $1,500 / $3,000 / $6,000 / $9,000 · Drawdown $1,000 / $2,000 / $3,500 / $5,000 · DLL $600 / $1,250 / $2,500 / $3,750\nSelect Eval (25K-150K): Profit target $1,500 / $3,000 / $6,000 / $9,000 · Drawdown $1,000 / $2,000 / $3,000 / $4,500 · No DLL · 40% consistency\nLightning (25K-150K): 20% consistency · DLL none on 25K then $1,250 / $2,500 / $3,000",
      "payouts": "Growth funded: 5-day payout frequency · 35% funded consistency · 5 max accounts\nSelect Daily path: daily payouts · max payout $600 / $1,250 / $1,750 / $2,500 (25K-150K)\nSelect Flex path: 5-day payout · max payout $1,250 / $2,500 / $3,500 / $4,500 · no DLL\nLightning: 5-day payouts (no fixed min days; profit goal + consistency) · $1,000 min · 5 max accounts"
    },
    "programs": [
      "Growth — eval then funded (35% consistency, 5-day payouts, 5 max accounts)",
      "Select — eval, then choose Daily or Flex funding path",
      "Lightning — 25K-150K instant funding (no eval), 20% / 25% / 30% consistency, 5-day payouts"
    ],
    "rules": [
      "Pricing (list, one-time · code CHAMP applies the current discount at checkout): Growth $99 / $145 / $255 / $369 (25K-150K), Select $109 / $165 / $265 / $369, Lightning $345 / $492 / $660 / $796",
      "Growth reset fees: $60 / $95 / $169 / $229 (25K-150K)",
      "Select reset fees: $75 / $109 / $169 / $239 (25K-150K)",
      "Activation fee: None on all plans",
      "Consistent Trader Reward Pool (Select): unlock larger reward pools with consistency below 40% and never exceeding 75% of max drawdown"
    ],
    "payouts": [
      "Growth: 5-day payout frequency, 35% funded consistency",
      "Select Daily: daily payouts, max $600 / $1,250 / $1,750 / $2,500 (25K-150K)",
      "Select Flex: 5-day payout, max $1,250 / $2,500 / $3,500 / $4,500 (25K-150K)",
      "Lightning: 5-day payouts as marketed (no fixed minimum days — payout profit goal + 20/25/30% consistency), $1,000 minimum, 5 max accounts"
    ],
    "platforms": ["Tradovate · WealthCharts · Tradesea / Rithmic"],
    "warning": "Tradeify changed to one-time payments on 03/31/26 and added Tradesea/Rithmic data feeds. Always confirm current checkout pricing before purchasing.",
    "plansDetailed": [
      {
        "name": "GROWTH",
        "featured": true,
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["One-Time Payment (list)", "$99 / $145 / $255 / $369"],
          ["Profit Target (Eval)", "$1,500 / $3,000 / $6,000 / $9,000"],
          ["Max Drawdown", "$1,000 / $2,000 / $3,500 / $5,000"],
          ["Daily Loss Limit", "$600 / $1,250 / $2,500 / $3,750"],
          ["Consistency (Eval)", "None"],
          ["Consistency (Funded)", "35%"],
          ["Reset Fee", "$60 / $95 / $169 / $229"],
          ["Activation Fee", "None"],
          ["Max Contracts", "1 mini (10 micros) / 4 minis (40 micros) / 8 minis (80 micros) / 12 minis (120 micros)"],
          ["Payout Frequency (Funded)", "5 days"],
          ["Max Accounts (Funded)", "5"],
          ["Platforms", "Tradovate · WealthCharts · Tradesea / Rithmic"],
          ["Promo Code", "CHAMP"]
        ]
      },
      {
        "name": "SELECT — Evaluation",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["One-Time Payment (list)", "$109 / $165 / $265 / $369"],
          ["Profit Target", "$1,500 / $3,000 / $6,000 / $9,000"],
          ["Max Drawdown", "$1,000 / $2,000 / $3,000 / $4,500"],
          ["Daily Loss Limit", "None"],
          ["Consistency", "40%"],
          ["Reset Fee", "$75 / $109 / $169 / $239"],
          ["Activation Fee", "None"],
          ["Max Contracts", "1 mini (10 micros) / 4 minis (40 micros) / 8 minis (80 micros) / 12 minis (120 micros)"],
          ["After Eval", "Choose Daily or Flex funding path"]
        ]
      },
      {
        "name": "SELECT — Daily Path",
        "rules": [
          ["Payout Frequency", "Daily"],
          ["Max Payout", "$600 / $1,250 / $1,750 / $2,500 (25K-150K)"],
          ["Daily Loss Limit", "$500 / $1,000 / $1,250 / $1,750"],
          ["Max Drawdown", "$1,000 / $2,000 / $2,500 / $3,500"],
          ["Consistency (Funded)", "None"]
        ]
      },
      {
        "name": "SELECT — Flex Path",
        "rules": [
          ["Payout Frequency", "5 days"],
          ["Max Payout", "$1,250 / $2,500 / $3,500 / $4,500 (25K-150K)"],
          ["Daily Loss Limit", "None"],
          ["Max Drawdown", "$1,000 / $2,000 / $3,000 / $4,500"],
          ["Consistency (Funded)", "None"]
        ]
      },
      {
        "name": "LIGHTNING",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["One-Time Payment (list)", "$345 / $492 / $660 / $796"],
          ["Daily Loss Limit", "None (25K) / $1,250 / $2,500 / $3,000"],
          ["Max Drawdown", "$1,000 / $2,000 / $4,000 / $5,250"],
          ["Consistency", "20% / 25% / 30% (P1 / P2 / P3+)"],
          ["Payout Frequency", "5 days (no fixed min days · profit goal + consistency)"],
          ["Payout Profit Goal", "$1,500 / $3,000 / $6,000 / $9,000 (1st) → $1,000 / $2,000 / $3,500 / $4,500 (2nd+)"],
          ["Minimum Payout", "$1,000"],
          ["Profit Split", "90% / 10%"],
          ["Max Accounts", "5"],
          ["Max Contracts", "1 mini (10 micros) / 4 minis (40 micros) / 8 minis (80 micros) / 12 minis (120 micros)"],
          ["Platforms", "Tradovate · WealthCharts · Tradesea / Rithmic"],
          ["Promo Code", "CHAMP"]
        ]
      },
      {
        "name": "Consistent Trader Reward Pool (Select)",
        "rules": [
          ["Eligibility", "Disciplined performance during SIM funded phase"],
          ["Requirement 1", "Consistency score below 40%"],
          ["Requirement 2", "Never exceeded 75% of max drawdown"],
          ["Reward", "Unlocks larger reward pools"]
        ]
      }
    ],
    "plansSummary": [
      {
        "name": "GROWTH",
        "featured": true,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $3,000 · $6,000 · $9,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,500 · $5,000",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "$600 · $1,250 · $2,500 · $3,750",
          "Min. Trading Days": "1",
          "Consistency Rule": "None eval · 35% funded",
          "Payout Split": "90% Trader 10% Tradeify",
          "Payout Frequency": "5 days (funded)",
          "Max Payout": "Capped: $1,000·$1,500·$2,000·$2,500 (1st) → $1,000·$3,000·$4,000·$5,000 (4+)",
          "Activation Fee": "None (one-time payment)",
          "Reset Fee": "$60 · $95 · $169 · $229",
          "Platforms": "Tradovate · WealthCharts · Tradesea / Rithmic",
          "Promo Code": "CHAMP",
          "Notes": "Crypto payouts available"
        }
      },
      {
        "name": "SELECT — DAILY PATH",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $3,000 · $6,000 · $9,000",
          "Max Drawdown": "$1,000 · $2,000 · $2,500 · $3,500",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "None eval · $500 · $1,000 · $1,250 · $1,750 funded",
          "Min. Trading Days": "3",
          "Consistency Rule": "40% eval · none funded",
          "Payout Split": "90% Trader 10% Tradeify",
          "Payout Frequency": "Daily",
          "Max Payout": "$600 · $1,250 · $1,750 · $2,500",
          "Activation Fee": "None (one-time payment)",
          "Reset Fee": "$75 · $109 · $169 · $239",
          "Platforms": "Tradovate · WealthCharts · Tradesea / Rithmic",
          "Promo Code": "CHAMP"
        }
      },
      {
        "name": "SELECT — FLEX PATH",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $3,000 · $6,000 · $9,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,500",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "None",
          "Min. Trading Days": "3",
          "Consistency Rule": "40% eval · none funded",
          "Payout Split": "90% Trader 10% Tradeify",
          "Payout Frequency": "5 days",
          "Max Payout": "$1,250 · $2,500 · $3,500 · $4,500",
          "Activation Fee": "None (one-time payment)",
          "Reset Fee": "$75 · $109 · $169 · $239",
          "Platforms": "Tradovate · WealthCharts · Tradesea / Rithmic",
          "Promo Code": "CHAMP"
        }
      },
      {
        "name": "LIGHTNING",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "Straight To Funded",
          "Max Drawdown": "$1,000 · $2,000 · $4,000 · $5,250",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "None (25K) · $1,250 · $2,500 · $3,000",
          "Min. Trading Days": "Instant Funded",
          "Consistency Rule": "20% / 25% / 30% (P1 / P2 / P3+)",
          "Payout Split": "90% Trader 10% Tradeify",
          "Payout Frequency": "5 days (no fixed min days; profit goal + consistency)",
          "Max Payout": "Capped: $1,000·$2,000·$2,500·$3,000 (payouts 1-3) → $1,000·$2,500·$3,000·$3,500 (4+) · min $1,000",
          "Activation Fee": "None (one-time payment)",
          "Reset Fee": "Straight To Funded",
          "Platforms": "Tradovate · WealthCharts · Tradesea / Rithmic",
          "Promo Code": "CHAMP"
        }
      }
    ],
    "note": "Tradeify removed subscriptions and switched to one-time payments on 03/31/26. Tradesea and Rithmic data feeds added on the same date. Growth covers 25K-150K; Select also offers a limited 300K tier (list $449) and an optional 50%-consistency add-on. Select lets you pick Daily payouts or Flex (no DLL) after passing the evaluation. Lightning pricing (list): $345 / $492 / $660 / $796 (25K-150K). Max 5 simulated funded accounts per person AND per household, any mix of Growth / Select / Lightning; copying your own trades across your own accounts is allowed (no opposing positions), copying between people is not. Code CHAMP applies the current discount at checkout. Always confirm current checkout pricing."
  },
  "lucid-trading": {
    "slug": "lucid-trading",
    "lastAudited": "2026-10-23",
    "country": "US",
    "maxAllocation": "$150K",
    "platformsList": ["Tradovate","NinjaTrader","TradingView","TradeSea","MotiveWave","Quantower","Sierra Chart","Jigsaw","Bookmap","ATAS","R|Trader Pro","MultiCharts"],
    "payoutTotal": "$2M+",
    "payoutCount": "800+",
    "payoutAvg": "$2,500",
    "payoutLargest": "$18K",
    "payoutMedianTime": "1 day",
    "name": "Lucid Trading",
    "initials": "LU",
    "logo": "/logos/lucid.png",
    "logoText": "LU",
    "affiliateUrl": "https://lucidtrading.com/ref/TheTradingChamp/",
    "type": "Pro · Flex · Daily · Direct",
    "tagline": "Pro · Flex · Daily · Direct",
    "badge": "hot",
    "featured": true,
    "live": true,
    "tags": ["discount", "fast-payout", "no-dll", "instant"],
    "filters": ["evaluation", "beginner", "fast-payout", "nodll"],
    "promo": {
      "code": "CHAMP",
      "discount": "See pricing"
    },
    "offerLine": "Use Code CHAMP",
    "offerSub": "Pro · Flex · Daily · Direct — 4 paths, 1-day Pro pass",
    "summary": "Lucid runs four futures account paths: Pro (full ladder, 1-day pass, payouts on request with no fixed window), Flex (optional DLL, no funded consistency, scaling plan), Daily (configurable eval + daily payouts), and Direct (straight to funded, no eval). All pay a 90/10 split and use the LucidScale DLL model (60% of peak EOD balance above your initial trail) on funded accounts. Free activation on Pro, Flex and Daily. Platforms: Tradovate, NinjaTrader, TradingView, TradeSea, MotiveWave, Quantower. Code CHAMP applies at checkout.",
    "highlights": ["Free Activation", "1-Day Pro Pass", "Daily Payout Option"],
    "bestFor": ["Fast Pass", "Daily Payouts", "Path Flexibility"],
    "stats": [
      ["Paths", "4 · Pro / Flex / Daily / Direct"],
      ["Code", "CHAMP"],
      ["Fast Pass", "1-day on Pro"]
    ],
    "boxPreviews": {
      "deal": "Use code CHAMP at checkout",
      "programs": "PRO, FLEX, DAILY, DIRECT",
      "rules": "EOD drawdown · optional DLL on Pro/Flex/Daily · Direct skips the eval",
      "payouts": "Pro on request (no fixed window) · Daily daily payouts · Flex after 5 profit days · Direct on request (20% consistency)"
    },
    "boxMore": {
      "deal": "Use code CHAMP at checkout. Four account paths — Pro for the full size ladder with on-request payouts, Flex for a scaling plan with no funded consistency, Daily for a configurable eval with daily payouts, Direct to skip the evaluation entirely.",
      "programs": "LUCID PRO\nProfit Target: $1,250 / $3,000 / $6,000 / $9,000 (25K-150K)\nMax Loss (EOD): $1,000 / $2,000 / $3,000 / $4,500\nDLL: None (25K) / $1,200 / $1,800 / $2,700 (optional)\n\nLUCID FLEX\nSame targets/drawdowns as Pro · 40% eval consistency (50% add-on), none funded · scaling plan\n\nLUCID DAILY\nSame targets/drawdowns · configurable eval (pick EOD or Intraday drawdown, DLL on/off, 40% or 50% consistency) · daily payouts when funded\n\nLUCID DIRECT (straight to funded)\nMax Loss (EOD): $1,000 / $2,000 / $3,500 / $5,000 · DLL: None / $1,200 / $2,100 / $3,000 · Consistency 20% · counts toward the 5-funded household limit",
      "rules": "PRO: Consistency 40% (funded) · pass in 1 day · Activation FREE · LucidScale DLL 60% of peak EOD above initial trail (funded)\nFLEX: 40% eval consistency (50% add-on) · no funded consistency · scaling plan · Activation FREE\nDAILY: 40% eval consistency (50% add-on) · no funded consistency · choose EOD/Intraday drawdown + DLL on/off · Activation FREE\nDIRECT: Consistency 20% · straight to funded · no fixed payout window\nALL: max 5 funded accounts per household across every Lucid type · up to 10 evals",
      "payouts": "PRO: no fixed payout window · per-cycle profit goal $250 / $500 / $750 / $1,000 · 40% consistency · balance above buffer (initial MLL + $100) · $500 min · 5 payouts to live\nFLEX: after 5 profit days of $100 / $150 / $200 / $250 · 50% of profit up to $1,000 / $2,000 / $2,500 / $3,000 · no buffer · 5 payouts to live\nDAILY: daily payout requests · no funded consistency · no per-payout cap above the buffer\nDIRECT: no fixed window · profit goal + 20% consistency · 90/10 split"
    },
    "programs": [
      "Lucid Pro — full 25K-150K ladder, 1-day pass, payouts on request (no fixed window)",
      "Lucid Flex — optional DLL, no funded consistency, scaling plan",
      "Lucid Daily — configurable eval (EOD/Intraday + DLL on/off), daily payouts",
      "Lucid Direct — straight to funded, no evaluation"
    ],
    "rules": [
      "Pricing (with CHAMP): Pro $70.60 / $115.40 / $180.40 / $245.50, Flex $50.30 / $90.20 / $170.60 / $250.40, Direct $230.30 / $360.50 / $490.00 / $585.20 (25K-150K). Daily pricing is configurable at checkout. Promotional pricing was active at last check — confirm at checkout.",
      "Drawdown: end-of-day (EOD) on Pro, Flex, Direct; Daily lets you pick EOD or Intraday in the eval (funded Daily is Intraday)",
      "LucidScale DLL: on funded accounts, the daily loss limit above your initial trail becomes 60% of peak EOD balance",
      "Max size: 2 / 4 / 6 / 10 minis (20 / 40 / 60 / 100 micros) by account size across all paths",
      "Reset fees: Pro $70 / $115 / $180 / $245 · Flex $50 / $90 / $170 / $250 · Direct straight to funded",
      "News: LucidDaily PROHIBITS trading red-folder news (hard breach); Pro, Flex and Direct permit trading around news (trader assumes slippage); all positions flat by 4:45 PM EST"
    ],
    "payouts": [
      "Pro: no fixed payout window — per-cycle profit goal $250 / $500 / $750 / $1,000, 40% consistency, balance above the buffer (initial MLL + $100); $500 minimum; 5 payouts to live",
      "Flex: 5 profit days of $100 / $150 / $200 / $250 per cycle, $500 minimum, 50% of profit up to $1,000 / $2,000 / $2,500 / $3,000, no buffer, scaling plan, 5 payouts to live",
      "Daily: daily payout requests, no funded consistency, no per-payout cap above the buffer, $500 minimum",
      "Direct: no fixed payout window — profit goal + 20% consistency, $500 minimum; counts toward the 5-funded household limit"
    ],
    "platforms": [
      "Tradovate · NinjaTrader · TradingView",
      "TradeSea · MotiveWave · Quantower"
    ],
    "warning": "Lucid had promotional (coupon) pricing live at last check — always confirm the current price at checkout. Lucid Black is discontinued (legacy accounts only).",
    "plansDetailed": [
      {
        "name": "Lucid Pro",
        "featured": true,
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Price (w/ CHAMP)", "$70.60 / $115.40 / $180.40 / $245.50"],
          ["Profit Target", "$1,250 / $3,000 / $6,000 / $9,000"],
          ["Max Loss Limit (EOD)", "$1,000 / $2,000 / $3,000 / $4,500"],
          ["Daily Loss Limit", "None (25K) / $1,200 / $1,800 / $2,700 (optional — on/off at purchase)"],
          ["Consistency", "40% (funded)"],
          ["Max Size", "2 / 4 / 6 / 10 minis (20 / 40 / 60 / 100 micros)"],
          ["Funded: DLL Below Initial Trail", "None (25K) / $1,200 / $1,800 / $2,700"],
          ["Funded: LucidScale DLL Above Trail", "60% of Peak EOD Balance"],
          ["Payout Profit Target (Funded)", "$250 / $500 / $750 / $1,000"],
          ["Days to Payout", "No fixed window (40% consistency ⇒ 3+ profit days)"],
          ["Payouts to Live", "5"],
          ["Activation Fee", "FREE"],
          ["Reset Fee", "$70 / $115 / $180 / $245"],
          ["Platforms", "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower +6 (CQG & Rithmic)"],
          ["Promo Code", "CHAMP"]
        ]
      },
      {
        "name": "Lucid Flex",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Price (w/ CHAMP)", "$50.30 / $90.20 / $170.60 / $250.40"],
          ["Profit Target", "$1,250 / $3,000 / $6,000 / $9,000"],
          ["Max Loss Limit (EOD)", "$1,000 / $2,000 / $3,000 / $4,500"],
          ["Daily Loss Limit", "$600 / $1,200 / $1,800 / $2,700 (can toggle off)"],
          ["Consistency (Eval)", "40% (50% with paid add-on)"],
          ["Consistency (Funded)", "None"],
          ["Max Size", "2 / 4 / 6 / 10 minis (20 / 40 / 60 / 100 micros)"],
          ["Funded: Min Days of Profit", "5 of $100 / $150 / $200 / $250"],
          ["Days to Payout", "5 profit days (no fixed window)"],
          ["Scaling Plan", "Yes"],
          ["Payouts to Live", "5"],
          ["Activation Fee", "FREE"],
          ["Reset Fee", "$50 / $90 / $170 / $250"],
          ["Platforms", "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower +6 (CQG & Rithmic)"],
          ["Promo Code", "CHAMP"]
        ]
      },
      {
        "name": "Lucid Daily",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Price", "Configurable — select drawdown + DLL options at checkout"],
          ["Profit Target", "$1,250 / $3,000 / $6,000 / $9,000"],
          ["Max Loss Limit", "$1,000 / $2,000 / $3,000 / $4,500"],
          ["Drawdown (Eval)", "Choose EOD or Intraday"],
          ["Daily Loss Limit", "Optional (ON / OFF)"],
          ["Consistency (Eval)", "40% (50% with paid add-on)"],
          ["Consistency (Funded)", "None"],
          ["Max Size", "2 / 4 / 6 / 10 minis (20 / 40 / 60 / 100 micros)"],
          ["Funded: Drawdown Type", "Intraday"],
          ["Funded: DLL", "$600 / $1,200 / $1,800 / $2,700"],
          ["Payouts", "Daily"],
          ["Activation Fee", "FREE"],
          ["Platforms", "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower +6 (CQG & Rithmic)"],
          ["Promo Code", "CHAMP"]
        ]
      },
      {
        "name": "Lucid Direct",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Price (w/ CHAMP)", "$230.30 / $360.50 / $490.00 / $585.20"],
          ["Structure", "Straight to funded — no evaluation"],
          ["Max Loss Limit (EOD)", "$1,000 / $2,000 / $3,500 / $5,000"],
          ["DLL Below Initial Trail", "None / $1,200 / $2,100 / $3,000"],
          ["LucidScale DLL Above Trail", "None (25K) / 60% of Peak EOD Balance"],
          ["Consistency", "20%"],
          ["Max Size", "2 / 4 / 6 / 10 minis (20 / 40 / 60 / 100 micros)"],
          ["Min Days to Payout", "No fixed minimum (20% consistency ⇒ 5+ profit days)"],
          ["Payout Profit Goal", "$1,500 / $3,000 / $6,000 / $9,000 (1st) → $1,250 / $2,500 / $3,500 / $4,500 (2nd+)"],
          ["Max Accounts", "5 funded per household (shared across all Lucid types)"],
          ["Activation Fee", "Included in one-time payment"],
          ["Platforms", "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower +6 (CQG & Rithmic)"],
          ["Promo Code", "CHAMP"]
        ]
      }
    ],
    "plansSummary": [
      {
        "name": "LUCID PRO",
        "featured": true,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,250 · $3,000 · $6,000 · $9,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,500",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "None (25K) · $1,200 · $1,800 · $2,700 (optional)",
          "Min. Trading Days": "1-day pass · no fixed payout window",
          "Consistency Rule": "None eval · 40% funded",
          "Payout Split": "90% Trader / 10% Lucid",
          "Payout Frequency": "On request once eligible (3+ profit days in practice)",
          "Max Payout": "Capped in sim-funded: $1,000·$2,000·$2,500·$3,000 (1st) → $1,500·$2,500·$3,000·$3,500 (2nd+)",
          "Activation Fee": "FREE",
          "Reset Fee": "$70 · $115 · $180 · $245",
          "Platforms": "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower +6 (CQG & Rithmic)",
          "Promo Code": "CHAMP",
          "Notes": "LucidScale DLL 60% of peak EOD above trail · buffer = initial MLL + $100 · $500 min · 5 payouts to live · accounts bought/reset before 11/28/2025 keep 100% of first $10K + 35% consistency · w/ CHAMP $70.60 · $115.40 · $180.40 · $245.50"
        }
      },
      {
        "name": "LUCID FLEX",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,250 · $3,000 · $6,000 · $9,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,500",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "Optional (amount set at purchase)",
          "Min. Trading Days": "5 profit days · 5 to payout",
          "Consistency Rule": "40% eval (50% add-on) · none funded",
          "Payout Split": "90% Trader / 10% Lucid",
          "Payout Frequency": "After 5 profit days (no fixed window)",
          "Max Payout": "50% of cycle, capped $1,000·$2,000·$2,500·$3,000 · min $500 · no buffer",
          "Activation Fee": "FREE",
          "Reset Fee": "$50 · $90 · $170 · $250",
          "Platforms": "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower +6 (CQG & Rithmic)",
          "Promo Code": "CHAMP",
          "Notes": "Scaling plan · min days of profit 5 of $100/$150/$200/$250 · 5 payouts to live · w/ CHAMP $50.30 · $90.20 · $170.60 · $250.40"
        }
      },
      {
        "name": "LUCID DAILY",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,250 · $3,000 · $6,000 · $9,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,500",
          "Drawdown Type": "EOD or Intraday (choose) · Intraday funded",
          "Daily Loss Limit": "Optional (amount set at purchase)",
          "Min. Trading Days": "Daily payouts",
          "Consistency Rule": "40% eval (50% add-on) · none funded",
          "Payout Split": "90% Trader / 10% Lucid",
          "Payout Frequency": "Daily",
          "Max Payout": "No per-payout cap above buffer · $500 min · max daily sim profit $6K·$8K·$10K·$12K (then moved live)",
          "Activation Fee": "FREE",
          "Reset Fee": "Configurable",
          "Platforms": "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower +6 (CQG & Rithmic)",
          "Promo Code": "CHAMP",
          "Notes": "Daily payouts · configurable eval — pick EOD/Intraday drawdown + DLL on/off; price varies at checkout"
        }
      },
      {
        "name": "LUCID DIRECT",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "Straight to funded",
          "Max Drawdown": "$1,000 · $2,000 · $3,500 · $5,000",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "None · $1,200 · $2,100 · $3,000",
          "Min. Trading Days": "No fixed min (20% consistency ⇒ 5+ profit days)",
          "Consistency Rule": "20%",
          "Payout Split": "90% Trader / 10% Lucid",
          "Payout Frequency": "On request once eligible (5+ profit days in practice)",
          "Max Payout": "Capped: $1,000·$2,000·$2,500·$3,000 (payouts 1-3) → $1,000·$2,500·$3,000·$3,500 (4-5)",
          "Activation Fee": "One-time payment $230.30 · $360.50 · $490.00 · $585.20",
          "Reset Fee": "N/A (straight to funded)",
          "Platforms": "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower +6 (CQG & Rithmic)",
          "Promo Code": "CHAMP",
          "Notes": "Straight to funded (no eval) · payout profit goal $1,500·$3,000·$6,000·$9,000 (1st) then $1,250·$2,500·$3,500·$4,500 · $500 min · LucidScale DLL 60% peak EOD above trail (50K+) · counts toward the 5-funded household limit"
        }
      }
    ],
    "note": "Lucid Trading offers four futures paths: Pro (1-day pass, payouts on request with no fixed window), Flex (optional DLL, scaling plan, no funded consistency), Daily (configurable eval — choose EOD/Intraday drawdown, DLL on/off and 40% or 50% consistency — with daily payouts), and Direct (straight to funded, no eval). Limits: up to 10 evaluations and 5 funded accounts per household (all Lucid funded types combined, 10 total); trade copiers are permitted. With the DLL switched on, funded Pro, Flex, Daily and 50K+ Direct accounts can request payouts intraday from that session's profit. All 90/10 split with the LucidScale DLL model on funded accounts (60% of peak EOD balance above the initial trail). Lucid Black is discontinued (legacy accounts only). Lucid also runs LucidMaxx, an invite-only (non-purchasable) eval-to-live tier for qualifying funded traders. Prices shown reflect CHAMP-coupon pricing at last check — confirm the current price at checkout. Code CHAMP."
  },
  "alpha-futures": {
    "slug": "alpha-futures",
    "lastAudited": "2026-10-23",
    "country": "GB",
    "maxAllocation": "$150K",
    "platformsList": ["AlphaTrader","TradingView","WealthCharts","Quantower","DeepChart"],
    "payoutTotal": "$70M+",
    "payoutCount": "3,000+",
    "payoutAvg": "$3,300",
    "payoutLargest": "$28K",
    "payoutMedianTime": "1 day",
    "name": "Alpha Futures",
    "initials": "AF",
    "logo": "/logos/alpha.png",
    "logoText": "AF",
    "affiliateUrl": "https://app.alpha-futures.com/signup/CHAMP/",
    "type": "Zero · Standard · Advanced · Direct",
    "tagline": "Zero · Standard · Advanced · Direct · 40% off with CHAMP",
    "badge": "new",
    "featured": false,
    "live": true,
    "tags": ["discount", "evaluation"],
    "filters": ["evaluation", "highest-discount"],
    "promo": {
      "code": "CHAMP",
      "discount": "40% off"
    },
    "offerLine": "40% OFF",
    "offerSub": "Code CHAMP is set up for 40% off on every Alpha plan — Zero, Standard, Advanced and the one-time Direct. Alpha also runs its own public codes, so compare the checkout total.",
    "summary": "Alpha Futures runs four paths as of August 2026. Zero is the cheap one-day eval pass (flat 90% split, $0 activation, monthly $89–$279 list). Standard is back on the site as a live plan (50K–150K, monthly $129–$349). Advanced is the premium eval — 90% from day one, no daily loss limit ever, no news restrictions, $15,000 per-request withdrawals (monthly $209–$489). Direct is a new one-time, straight-to-funded option (25K–150K, $349–$859) with a 20% consistency rule. Code CHAMP takes 40% off. UK-based; runs on AlphaTrader, TradingView, WealthCharts, Quantower and DeepChart.",
    "highlights": ["40% Off With CHAMP", "Zero One-Day Pass", "Advanced 90% + No DLL"],
    "bestFor": ["One-Day Pass (Zero)", "Instant Funding (Direct)", "No DLL (Advanced)"],
    "stats": [
      ["CHAMP Discount", "40% Off"],
      ["Plans", "Zero · Standard · Advanced · Direct"],
      ["Top Split", "90%"]
    ],
    "boxPreviews": {
      "deal": "Code CHAMP = 40% off any Alpha plan at checkout",
      "programs": "Zero (1-day pass) · Standard (value) · Advanced (premium, no DLL) · Direct (one-time, straight to funded)",
      "rules": "Zero/Standard/Advanced are monthly evals · Direct is one-time straight-to-funded · Advanced has no DLL and no news restrictions",
      "payouts": "90% split on Zero/Advanced · withdraw 50% of profits up to 4x/month · Advanced allows $15,000 per request"
    },
    "boxMore": {
      "deal": "Code CHAMP takes 40% off at checkout (public promos at the Oct 23, 2026 check: MYALPHA40 = 40% off Zero, MYALPHA50 = 50% off Standard, Direct & Advanced). List monthly pricing:\\n\\nZERO: $89 / $139 / $279 (25K-100K)\\nSTANDARD: $129 / $239 / $349 (50K-150K)\\nADVANCED: $209 / $349 / $489 (50K-150K)\\nDIRECT (one-time): $349 / $519 / $689 / $859 (25K-150K)\\n\\nZero and Standard carry no activation fee. Always verify current checkout pricing.",
      "programs": "ALPHA ZERO — 25K/50K/100K · one-day eval pass · flat 90% split · $0 activation · monthly $89 / $139 / $279\\nALPHA STANDARD — 50K/100K/150K · back on the site · monthly $129 / $239 / $349 · $0 activation\\nALPHA ADVANCED — 50K/100K/150K · 90% from day 1 · no DLL ever · no news restrictions · monthly $209 / $349 / $489\\nALPHA DIRECT — 25K/50K/100K/150K · one-time $349 / $519 / $689 / $859 · straight to funded · 20% consistency",
      "rules": "ZERO: no eval min days (one-day pass) · 5 qualified days to first payout · no eval consistency · 40% qualified consistency · eval reset $79 / $119 / $249 · qualified reset $399 / $499 / $799\\nSTANDARD: 2 eval days · 5 qualified days · 50% eval / 40% qualified consistency · DLL none eval, $1,000 / $2,000 / $3,000 qualified · eval reset $109 / $199 / $289 · qualified reset $599 / $799 / $999\\nADVANCED: 3 eval days · 5 qualified days · 40% eval consistency · none qualified · no DLL either stage · no news restrictions · no scaling (full contracts day 1)\\nDIRECT: straight to funded (no eval) · 20% consistency · DLL $500 / $1,000 / $2,000 / $3,000 · no scaling",
      "payouts": "ZERO: 90% flat · withdraw up to 50% of profits, up to 4x/month · payout cap $1,000 / $1,500 / $2,500 (25K-100K) · $200 min · 5 winning days of $200+ before each request\\nSTANDARD: payout cap $3,000 / $4,000 / $5,000 (50K-150K) · $500 min · up to 4x/month\\nADVANCED: 90% from day 1 · request every 5 winning trading days of $200+ · withdraw up to $15,000 per request ($1,000 min), up to 4x/month\\nDIRECT: payout cap $1,000 / $2,000 / $2,500 / $3,000 (25K-150K) · $500 min · no winning-day rule — withdrawal profit target + 20% consistency\\nMax qualified accounts: Zero 5 · Standard 5 (3 if bought before Jul 27, 2026) · Direct 5 · Advanced 3 (holding any active Advanced caps you at 3) · one individual per household"
    },
    "programs": [
      "Alpha Zero — 25K-100K · one-day eval pass · flat 90% split · $0 activation · monthly $89 / $139 / $279",
      "Alpha Standard — 50K-150K · back on the site · monthly $129 / $239 / $349 · $0 activation",
      "Alpha Advanced — 50K-150K · 90% from day 1 · no DLL · no news restrictions · monthly $209 / $349 / $489",
      "Alpha Direct — 25K-150K · one-time $349 / $519 / $689 / $859 · straight to funded · 20% consistency"
    ],
    "rules": [
      "Code CHAMP takes 40% off any plan at checkout",
      "Zero: no eval min trading days (one-day pass possible), no eval consistency, $0 activation, flat 90% split",
      "Standard: 2 eval days, 50% eval / 40% qualified consistency, DLL $1,000 / $2,000 / $3,000 in the funded stage, $0 activation",
      "Advanced: no DLL on eval or qualified, no qualified consistency, no news restrictions, no scaling (full contracts day 1)",
      "Direct: one-time payment, straight to funded, 20% consistency, no scaling",
      "Max qualified accounts: Zero 5, Standard 5 (3 if bought before Jul 27, 2026), Direct 5, Advanced 3 — any active Advanced qualified account caps you at 3; one individual per household",
      "Withdrawals (Zero/Standard/Advanced): up to 50% of profits, up to 4x per month, after every 5 winning days of $200+; Direct uses withdrawal profit targets + 20% consistency instead"
    ],
    "payouts": [
      "Zero: 90% flat · payout cap $1,000 / $1,500 / $2,500 (25K-100K) · $200 min · up to 4x/month",
      "Standard: payout cap $3,000 / $4,000 / $5,000 (50K-150K) · $500 min · up to 4x/month",
      "Advanced: 90% from day 1 · withdraw up to $15,000 per request ($1,000 min) · every 5 winning days of $200+",
      "Direct: payout cap $1,000 / $2,000 / $2,500 / $3,000 (25K-150K) · $500 min · withdrawal profit target $1,500 / $3,000 / $6,000 / $9,000 (1st) then $1,000 / $2,000 / $4,000 / $6,000 + 20% consistency"
    ],
    "platforms": ["AlphaTrader", "TradingView", "WealthCharts", "Quantower", "DeepChart"],
    "warning": "Alpha overhauled its lineup in 2026 — Standard returned to the site and a one-time Direct plan was added. Pricing shown is list monthly; code CHAMP takes 40% off at checkout. Always confirm the current checkout price before purchasing.",
    "plansDetailed": [
      {
        "name": "Alpha Zero",
        "featured": true,
        "rules": [
          ["Account Sizes", "25K / 50K / 100K"],
          ["Monthly Price (list)", "$89 / $139 / $279"],
          ["With CHAMP", "40% off at checkout"],
          ["Activation Fee", "$0 (all sizes)"],
          ["Profit Target", "$1,500 / $3,000 / $6,000"],
          ["Max Drawdown (MLL)", "$1,000 / $2,000 / $3,000"],
          ["Daily Loss Guard (DLL)", "$500 / $1,000 / $2,000"],
          ["Min Trading Days (Eval)", "None (one-day pass possible)"],
          ["Min Trading Days (Qualified)", "5"],
          ["Consistency (Eval)", "None"],
          ["Consistency (Qualified)", "40%"],
          ["Evaluation Reset Fee", "$79 / $119 / $249"],
          ["Qualified Reset Fee", "$399 / $499 / $799 (max 2, only before a first payout request)"],
          ["Profit Split", "90% flat"],
          ["Payout Cap", "$1,000 / $1,500 / $2,500 ($200 min)"],
          ["Withdrawal Cadence", "Up to 50% of profits · up to 4x per month · every 5 winning days of $200+"],
          ["Max Accounts", "5 qualified"],
          ["Platforms", "AlphaTrader · TradingView · WealthCharts · Quantower · DeepChart"],
          ["Promo Code", "CHAMP — 40% off"]
        ]
      },
      {
        "name": "Alpha Standard",
        "rules": [
          ["Account Sizes", "50K / 100K / 150K"],
          ["Monthly Price (list)", "$129 / $239 / $349"],
          ["With CHAMP", "40% off at checkout"],
          ["Activation Fee", "$0 (all sizes)"],
          ["Profit Target", "$3,000 / $6,000 / $9,000"],
          ["Max Drawdown (MLL)", "$2,000 / $3,000 / $4,500"],
          ["Daily Loss Guard (DLL)", "None (Eval) · $1,000 / $2,000 / $3,000 (Qualified)"],
          ["Min Trading Days (Eval)", "2"],
          ["Min Trading Days (Qualified)", "5"],
          ["Consistency (Eval)", "50%"],
          ["Consistency (Qualified)", "40%"],
          ["Evaluation Reset Fee", "$109 / $199 / $289"],
          ["Qualified Reset Fee", "$599 / $799 / $999 (max 2, only before a first payout request)"],
          ["Profit Split", "90%"],
          ["Payout Cap", "$3,000 / $4,000 / $5,000 ($500 min)"],
          ["Max Accounts", "5 qualified (3 if bought before Jul 27, 2026)"],
          ["Platforms", "AlphaTrader · TradingView · WealthCharts · Quantower · DeepChart"],
          ["Promo Code", "CHAMP — 40% off"]
        ]
      },
      {
        "name": "Alpha Advanced",
        "rules": [
          ["Account Sizes", "50K / 100K / 150K"],
          ["Monthly Price (list)", "$209 / $349 / $489"],
          ["With CHAMP", "40% off at checkout"],
          ["Activation Fee", "None"],
          ["Profit Target", "$4,000 / $8,000 / $12,000"],
          ["Max Drawdown (MLL)", "$1,750 / $3,500 / $5,250"],
          ["Daily Loss Guard (DLL)", "None (Eval & Qualified)"],
          ["Min Trading Days (Eval)", "3"],
          ["Min Trading Days (Qualified)", "5"],
          ["Consistency (Eval)", "40%"],
          ["Consistency (Qualified)", "None"],
          ["Reset Fee", "$189 / $319 / $449 (eval) · none in qualified"],
          ["Profit Split", "90% from day 1 (not tiered)"],
          ["Withdrawal Limit", "Up to $15,000 per request ($1,000 min)"],
          ["Payout Frequency", "Every 5 winning trading days of $200+ profit"],
          ["Max Accounts", "3 qualified (any active Advanced caps your total at 3)"],
          ["Hold Through News", "Yes — NO restrictions (Eval & Qualified)"],
          ["Scaling Plan", "None — full contract limits from day 1"],
          ["Platforms", "AlphaTrader · TradingView · WealthCharts · Quantower · DeepChart"],
          ["Promo Code", "CHAMP — 40% off"]
        ]
      },
      {
        "name": "Alpha Direct (one-time, straight to funded)",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["One-Time Price (list)", "$349 / $519 / $689 / $859"],
          ["With CHAMP", "40% off at checkout"],
          ["Structure", "Straight to funded — no evaluation"],
          ["Profit Target (1st)", "$1,500 / $3,000 / $6,000 / $9,000"],
          ["Profit Target (subsequent)", "$1,000 / $2,000 / $4,000 / $6,000"],
          ["Max Drawdown (EOD MLL)", "$1,000 / $2,000 / $3,000 / $4,500"],
          ["Daily Loss Limit", "$500 / $1,000 / $2,000 / $3,000"],
          ["Consistency", "20%"],
          ["Payout Cap", "$1,000 / $2,000 / $2,500 / $3,000 ($500 min)"],
          ["Withdrawal Cadence", "Up to 4x per month once the withdrawal profit target + 20% consistency are met (no winning-day rule)"],
          ["Max Accounts", "5 qualified"],
          ["Profit Split", "90%"],
          ["Scaling Plan", "None"],
          ["Platforms", "AlphaTrader · TradingView · WealthCharts · Quantower · DeepChart"],
          ["Promo Code", "CHAMP — 40% off"]
        ]
      }
    ],
    "plansSummary": [
      {
        "name": "ALPHA ZERO",
        "featured": true,
        "rules": {
          "Account Sizes": "25K · 50K · 100K",
          "Profit Target": "$1,500 · $3,000 · $6,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,000",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "$500 · $1,000 · $2,000",
          "Min. Trading Days": "None eval (one-day pass) · 5 qualified",
          "Consistency Rule": "None eval · 40% qualified",
          "Payout Split": "90% / 10%",
          "Payout Frequency": "4x a month (5 winning days)",
          "Max Payout": "$1,000 · $1,500 · $2,500 ($200 min)",
          "Activation Fee": "$0 · monthly $89 / $139 / $279 (list)",
          "Reset Fee": "$79 · $119 · $249 (eval) · $399 · $499 · $799 (qualified)",
          "Platforms": "AlphaTrader · TradingView · WealthCharts · Quantower · DeepChart",
          "Promo Code": "CHAMP — 40% off",
          "Notes": "One-day eval pass · list prices shown, CHAMP takes 40% off"
        }
      },
      {
        "name": "ALPHA STANDARD",
        "featured": false,
        "rules": {
          "Account Sizes": "50K · 100K · 150K",
          "Profit Target": "$3,000 · $6,000 · $9,000",
          "Max Drawdown": "$2,000 · $3,000 · $4,500",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "None eval · $1,000 · $2,000 · $3,000 qualified",
          "Min. Trading Days": "2 eval · 5 qualified",
          "Consistency Rule": "50% eval · 40% qualified",
          "Payout Split": "90% / 10%",
          "Payout Frequency": "4x a month (5 winning days)",
          "Max Payout": "$3,000 · $4,000 · $5,000 ($500 min)",
          "Activation Fee": "$0 · monthly $129 / $239 / $349 (list)",
          "Reset Fee": "$109 · $199 · $289 (eval) · $599 · $799 · $999 (qualified)",
          "Platforms": "AlphaTrader · TradingView · WealthCharts · Quantower · DeepChart",
          "Promo Code": "CHAMP — 40% off",
          "Notes": "Back on the site in 2026 · CHAMP takes 40% off (public promo at Oct 23 check: MYALPHA50, 50% off Standard)"
        }
      },
      {
        "name": "ALPHA ADVANCED",
        "featured": false,
        "rules": {
          "Account Sizes": "50K · 100K · 150K",
          "Profit Target": "$4,000 · $8,000 · $12,000",
          "Max Drawdown": "$1,750 · $3,500 · $5,250",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "None (Eval & Qualified)",
          "Min. Trading Days": "3 eval · 5 qualified",
          "Consistency Rule": "40% eval · none qualified",
          "Payout Split": "90% from day 1",
          "Payout Frequency": "4x a month (5 winning days)",
          "Max Payout": "$15,000 per request ($1,000 min)",
          "Activation Fee": "None · monthly $209 / $349 / $489 (list)",
          "Reset Fee": "$189 · $319 · $449 (eval) · none in qualified",
          "Platforms": "AlphaTrader · TradingView · WealthCharts · Quantower · DeepChart",
          "Promo Code": "CHAMP — 40% off",
          "Notes": "No DLL, no news restrictions, no scaling · $15K per-request withdrawals"
        }
      },
      {
        "name": "ALPHA DIRECT",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $3,000 · $6,000 · $9,000 (then $1,000 · $2,000 · $4,000 · $6,000)",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,500",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "$500 · $1,000 · $2,000 · $3,000",
          "Min. Trading Days": "Straight to funded (no eval)",
          "Consistency Rule": "20%",
          "Payout Split": "90% / 10%",
          "Payout Frequency": "Up to 4x a month (profit target + 20% consistency; no winning-day rule)",
          "Max Payout": "$1,000 · $2,000 · $2,500 · $3,000 ($500 min)",
          "Activation Fee": "None (one-time payment)",
          "Reset Fee": "N/A (one-time)",
          "Platforms": "AlphaTrader · TradingView · WealthCharts · Quantower · DeepChart",
          "Promo Code": "CHAMP — 40% off",
          "Notes": "One-time $349 / $519 / $689 / $859 (list) · straight to funded"
        }
      }
    ],
    "note": "Alpha Futures overhauled its lineup in 2026. Four plans now: Zero (one-day eval pass, flat 90% split, $0 activation, monthly $89-$279 list), Standard (back on the site, 50K-150K, monthly $129-$349), Advanced (premium eval — 90% from day 1, no DLL ever, no news restrictions, $15,000 per-request withdrawals, monthly $209-$489), and Direct (new one-time straight-to-funded, 25K-150K, $349-$859, 20% consistency). Code CHAMP takes 40% off at checkout (public promos at the Oct 23, 2026 check: MYALPHA40 on Zero, MYALPHA50 on Standard, Direct & Advanced). Max qualified accounts: Zero 5, Standard 5 (3 if bought before Jul 27, 2026), Direct 5, Advanced 3 (an active Advanced account caps you at 3); one individual per household; copying your own trades across your own accounts is allowed, group/reverse/automated trading is not. Zero, Standard and Advanced withdraw up to 50% of profits, up to 4x per month, after every 5 winning days of $200+; Direct uses withdrawal profit targets plus a 20% consistency rule. Pricing shown is list monthly — always verify the current checkout price."
  },
  "apex-trader": {
    "slug": "apex-trader",
    "lastAudited": "2026-10-05",
    "country": "US",
    "maxAllocation": "$150K",
    "platformsList": ["Rithmic","Tradovate","WealthCharts"],
    "payoutTotal": "$800M+",
    "payoutCount": "150K+",
    "payoutAvg": "$2,000",
    "payoutLargest": "$58K",
    "payoutMedianTime": "4 hours",
    "name": "Apex Trader Funding",
    "initials": "AP",
    "logo": "/logos/apex.png",
    "logoText": "AP",
    "affiliateUrl": "https://apextraderfunding.com/member/aff/go/thetradingchamp",
    "type": "Intraday Trail · EOD Trail",
    "tagline": "Intraday Trail · EOD Trail · 90% off with CHAMP",
    "badge": "popular",
    "featured": false,
    "live": true,
    "tags": ["discount", "fast-payout"],
    "filters": ["evaluation", "fast-payout"],
    "promo": {
      "code": "CHAMP",
      "discount": "90% off"
    },
    "offerLine": "90% OFF",
    "offerSub": "CHAMP takes 90% off the eval on either Intraday or EOD Trail. A No-Activation-Fee variant is available to skip the funded activation fee.",
    "summary": "Apex runs the biggest active CHAMP discount — 90% off the evaluation. Two account types: Intraday Trail (tighter trailing drawdown, no daily loss limit) and EOD Trail (end-of-day drawdown with a daily loss limit). Both pass in a single day, cover 25K-150K, and run on Rithmic, Tradovate and WealthCharts (TradingView via Tradovate). Each comes in a Standard build (lowest eval price) or a No-Activation-Fee build (higher eval price, no funded activation fee). One-time fee, no rebill, eval active 30 days.",
    "highlights": ["90% Off Eval", "1-Day Pass", "Intraday or EOD Trail"],
    "bestFor": ["Biggest Active Discount", "Fast Pass", "Multi-Account Scaling"],
    "stats": [
      ["CHAMP Discount", "90% Off"],
      ["Types", "Intraday / EOD Trail"],
      ["Pass In", "1 Day"]
    ],
    "boxPreviews": {
      "deal": "CHAMP = 90% off the eval (Intraday or EOD Trail)",
      "programs": "Intraday Trail (no DLL) · EOD Trail (has DLL)",
      "rules": "1 day to pass · 50% funded consistency · one-time fee, no rebill",
      "payouts": "Payouts every 5 trading days · 100% (no split)"
    },
    "boxMore": {
      "deal": "CHAMP takes 90% off the eval. List eval pricing (90% off with CHAMP at checkout):\\n\\nINTRADAY TRAIL (Standard): $167 / $249 / $790 / $1,190 (25K-150K)\\nINTRADAY TRAIL (No Activation Fee): $690 / $490 / $590 / $1,890\\nEOD TRAIL (Standard): $490 / $590 / $1,190 / $2,190\\nEOD TRAIL (No Activation Fee): $1,090 / $1,190 / $1,590 / $2,490\\n\\nOne-time fee, no rebill, eval active for 30 days, no resets. Always verify current checkout pricing.",
      "programs": "INTRADAY TRAIL — tighter trailing drawdown, NO daily loss limit\\nEOD TRAIL — end-of-day drawdown WITH a daily loss limit ($500 / $1,000 / $1,500 / $2,000)\\n\\nEach comes as Standard (lowest eval price) or No Activation Fee (higher eval, skips the funded activation fee).",
      "rules": "Min days to pass = 1\\nEval max contracts: 4 / 6 / 8 / 12 minis (25K-150K)\\nProfit target: $1,500 / $3,000 / $6,000 / $9,000\\nMax drawdown: $1,000 / $2,000 / $3,000 / $4,000\\nEOD daily loss limit: $500 / $1,000 / $1,500 / $2,000 (Intraday has none)\\nFunded consistency: 50%",
      "payouts": "Payout frequency: every 5 trading days\\nPayout split: 100% — no split (funded PAs keep 100%)\\nScaling built in for the funded (PA) account"
    },
    "programs": [
      "Intraday Trail — tighter trailing drawdown, no daily loss limit (25K-150K)",
      "EOD Trail — end-of-day drawdown with a daily loss limit (25K-150K)"
    ],
    "rules": [
      "Pricing (list eval · CHAMP takes 90% off at checkout): Intraday Standard $167 / $249 / $790 / $1,190 · Intraday No-Activation $690 / $490 / $590 / $1,890 · EOD Standard $490 / $590 / $1,190 / $2,190 · EOD No-Activation $1,090 / $1,190 / $1,590 / $2,490 (25K-150K)",
      "One-time fee, no rebill, evaluation active for 30 days, no resets",
      "Eval max contracts: 4 / 6 / 8 / 12 minis by account size · scaling built in for the funded account",
      "EOD Trail daily loss limit: $500 / $1,000 / $1,500 / $2,000; Intraday Trail has no daily loss limit in the eval (the funded Intraday account adds a scaling daily loss limit)",
      "Trading through news with your normal strategy is allowed, but dedicated news-only / straddle strategies and hedging are prohibited; positions must be flat by market close"
    ],
    "payouts": [
      "Payout frequency: every 5 trading days",
      "Payout split: 100% — no split (funded PAs keep 100% of the approved amount)",
      "Max payout is capped per request and rises over the first payouts (25K-150K: $1,000 / $1,500 / $2,000 / $2,500 first, up to $1,000 / $3,000 / $4,000 / $5,000 by the 6th); max 6 payouts per PA, min $500",
      "Funded consistency rule: 50%"
    ],
    "platforms": [
      "Rithmic",
      "Tradovate",
      "WealthCharts",
      "TradingView compatible"
    ],
    "warning": "Apex pricing changes often and prices reflect a live coupon. Always verify the current checkout price before purchase.",
    "plansDetailed": [
      {
        "name": "Intraday Trail",
        "featured": true,
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Eval Price (list)", "$167 / $249 / $790 / $1,190"],
          ["No-Activation Price (list)", "$690 / $490 / $590 / $1,890"],
          ["Min Days to Pass", "1"],
          ["Max Contracts (Eval)", "4 / 6 / 8 / 12 minis (40 / 60 / 80 / 120 micros)"],
          ["Profit Target", "$1,500 / $3,000 / $6,000 / $9,000"],
          ["Max Drawdown", "$1,000 / $2,000 / $3,000 / $4,000"],
          ["Drawdown Type", "Intraday Trail"],
          ["Daily Loss Limit", "None"],
          ["Funded Consistency", "50%"],
          ["Payout Frequency", "Every 5 trading days"],
          ["Payout Split", "100% — no split (funded PAs keep 100%)"],
          ["Reset Fee", "N/A (one-time, no rebill)"],
          ["Platforms", "Rithmic · Tradovate · WealthCharts"],
          ["Promo Code", "CHAMP — 90% off"]
        ]
      },
      {
        "name": "EOD Trail",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Eval Price (list)", "$490 / $590 / $1,190 / $2,190"],
          ["No-Activation Price (list)", "$1,090 / $1,190 / $1,590 / $2,490"],
          ["Min Days to Pass", "1"],
          ["Max Contracts (Eval)", "4 / 6 / 8 / 12 minis (40 / 60 / 80 / 120 micros)"],
          ["Profit Target", "$1,500 / $3,000 / $6,000 / $9,000"],
          ["Max Drawdown", "$1,000 / $2,000 / $3,000 / $4,000"],
          ["Drawdown Type", "End of Day"],
          ["Daily Loss Limit", "$500 / $1,000 / $1,500 / $2,000"],
          ["Funded Consistency", "50%"],
          ["Payout Frequency", "Every 5 trading days"],
          ["Payout Split", "100% — no split (funded PAs keep 100%)"],
          ["Reset Fee", "N/A (one-time, no rebill)"],
          ["Platforms", "Rithmic · Tradovate · WealthCharts"],
          ["Promo Code", "CHAMP — 90% off"]
        ]
      }
    ],
    "plansSummary": [
      {
        "name": "INTRADAY TRAIL",
        "featured": true,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $3,000 · $6,000 · $9,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,000",
          "Drawdown Type": "Intraday Trail",
          "Daily Loss Limit": "None in eval · scaling DLL once funded",
          "Min. Trading Days": "1 day to pass",
          "Consistency Rule": "50% funded",
          "Payout Split": "100% — no split",
          "Payout Frequency": "Every 5 trading days",
          "Max Payout": "Capped per payout: $1,000·$1,500·$2,000·$2,500 (1st) → up to $5,000 by 6th · max 6 · min $500",
          "Activation Fee": "None on No-Activation variant",
          "Reset Fee": "N/A (one-time, no rebill)",
          "Platforms": "Rithmic · Tradovate · WealthCharts",
          "Promo Code": "CHAMP — 90% off",
          "Notes": "List eval — Standard $167 · $249 · $790 · $1,190 · No-Activation $690 · $490 · $590 · $1,890 · CHAMP ~90% off"
        }
      },
      {
        "name": "EOD TRAIL",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $3,000 · $6,000 · $9,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,000",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "$500 · $1,000 · $1,500 · $2,000",
          "Min. Trading Days": "1 day to pass",
          "Consistency Rule": "50% funded",
          "Payout Split": "100% — no split",
          "Payout Frequency": "Every 5 trading days",
          "Max Payout": "Capped per payout: $1,000·$1,500·$2,000·$2,500 (1st) → up to $5,000 by 6th · max 6 · min $500",
          "Activation Fee": "None on No-Activation variant",
          "Reset Fee": "N/A (one-time, no rebill)",
          "Platforms": "Rithmic · Tradovate · WealthCharts",
          "Promo Code": "CHAMP — 90% off",
          "Notes": "List eval — Standard $490 · $590 · $1,190 · $2,190 · No-Activation $1,090 · $1,190 · $1,590 · $2,490 · CHAMP ~90% off"
        }
      }
    ],
    "note": "Apex Trader Funding runs two evaluation types: Intraday Trail (tighter trailing drawdown, no daily loss limit) and EOD Trail (end-of-day drawdown with a daily loss limit of $500 / $1,000 / $1,500 / $2,000 across 25K-150K). Both pass in one day, target $1,500 / $3,000 / $6,000 / $9,000, and cap drawdown at $1,000 / $2,000 / $3,000 / $4,000. CHAMP takes 90% off the eval; each type comes as Standard (lowest eval price) or No Activation Fee (higher eval, skips the funded activation fee). Funded accounts keep 100% (no split), with payouts every 5 trading days (capped per request, max 6 payouts per PA) and a 50% consistency rule. Up to 20 funded (PA) accounts; Apex also brings back its legacy accounts (6 sizes up to $300K) during sale periods. One-time fee, no rebill — always verify current checkout pricing. Code CHAMP."
  },
  "take-profit": {
    "slug": "take-profit",
    "lastAudited": "2026-10-23",
    "country": "US",
    "maxAllocation": "$150K",
    "platformsList": ["NinjaTrader","TradingView","Tradovate","Quantower","R|Trader","MotiveWave","Bookmap","ATAS","MultiCharts","Trade Navigator","VolFix","Investor R/T","Finamark","Jigsaw Trader"],
    "payoutTotal": "$60M+",
    "payoutCount": "18,000+",
    "payoutAvg": "$3,300",
    "payoutLargest": "$35K",
    "payoutMedianTime": "~1 day",
    "name": "Take Profit Trader",
    "initials": "TP",
    "logo": "/logos/takeprofit.png",
    "logoText": "TP",
    "affiliateUrl": "https://takeprofittrader.com/?referralCode=CHAMP",
    "type": "Test → PRO → PRO+ · 25K-150K",
    "tagline": "Test → PRO → PRO+ · No daily loss limit",
    "badge": null,
    "featured": false,
    "live": true,
    "tags": ["no-dll", "evaluation"],
    "filters": ["evaluation", "nodll"],
    "promo": {
      "code": "CHAMP",
      "discount": "40% off"
    },
    "offerLine": "40% OFF",
    "offerSub": "DLL removed across all sizes · Clean account ladder",
    "summary": "Take Profit Trader runs a three-stage ladder with no daily loss limit at any stage. You buy the TEST evaluation (EOD trailing drawdown, 50% consistency), pass into a PRO simulated-funded account (80/20 split, day-one payouts, switches to intraday trailing drawdown), then graduate to PRO+, a real live-market account paying 90/10 with EOD drawdown. Five account sizes (25K-150K), monthly subscription, code CHAMP for 40% off.",
    "highlights": ["DLL Removed (All Sizes)", "Simple Ladder", "40% Off"],
    "bestFor": ["No DLL", "Straightforward Rules", "Simple Ladder"],
    "stats": [
      ["Discount", "40% Off"],
      ["Code", "CHAMP"],
      ["DLL", "Removed across all"]
    ],
    "boxPreviews": {
      "deal": "40% off · Code CHAMP at checkout",
      "programs": "Single evaluation product · 25K, 50K, 75K, 100K, 150K",
      "rules": "DLL REMOVED on all 5 sizes",
      "payouts": "PRO (sim) 80/20 · PRO+ (live) 90/10 · day-one payouts"
    },
    "boxMore": {
      "deal": "Apply code CHAMP at checkout for 40% off Take Profit Trader.",
      "programs": "Five account sizes: 25K, 50K, 75K, 100K, 150K\nSingle evaluation path — no separate plan tiers",
      "rules": "All sizes have DLL REMOVED\nProfit Target: $1,500 / $3,000 / $4,500 / $6,000 / $9,000 (25K-150K)\nDrawdown: $1,500 / $2,000 / $2,500 / $3,000 / $4,500\nMax Size: 3 / 6 / 9 / 12 / 15 minis (30 / 60 / 90 / 120 / 150 micros)",
      "payouts": "TEST: simulated, no withdrawals\nPRO (sim funded): day-one payouts, 80/20 split, intraday trailing drawdown\nPRO+ (live market): day-one payouts, 90/10 split, EOD drawdown\nPayouts land within one business day via Plaid / PayPal / Wise"
    },
    "programs": [
      "25K — single evaluation product",
      "50K — single evaluation product",
      "75K — single evaluation product",
      "100K — single evaluation product",
      "150K — single evaluation product"
    ],
    "rules": [
      "DLL has been REMOVED across all account sizes",
      "Drawdown ladder: $1,500 / $2,000 / $2,500 / $3,000 / $4,500 (25K-150K)",
      "Max position size: 3 / 6 / 9 / 12 / 15 minis by size"
    ],
    "payouts": [
      "TEST evaluation: simulated, no withdrawals",
      "PRO (sim funded): day-one payouts, 80/20 split",
      "PRO+ (live market): day-one payouts, 90/10 split",
      "Payouts processed within one business day via Plaid / PayPal / Wise"
    ],
    "platforms": ["NinjaTrader · TradingView · Tradovate (CQG)", "Quantower · R|Trader · MotiveWave · Bookmap · ATAS · MultiCharts (Rithmic)", "Trade Navigator · VolFix · Investor R/T · Finamark · Jigsaw Trader (Rithmic)"],
    "warning": null,
    "plansDetailed": [
      {
        "name": "25K Account",
        "rules": [
          ["Profit Target", "$1,500"],
          ["Max Size", "3 minis / 30 micros"],
          ["Daily Loss Limit", "REMOVED"],
          ["Drawdown", "$1,500"]
        ]
      },
      {
        "name": "50K Account",
        "featured": true,
        "rules": [
          ["Profit Target", "$3,000"],
          ["Max Size", "6 minis / 60 micros"],
          ["Daily Loss Limit", "REMOVED"],
          ["Drawdown", "$2,000"]
        ]
      },
      {
        "name": "75K Account",
        "rules": [
          ["Profit Target", "$4,500"],
          ["Max Size", "9 minis / 90 micros"],
          ["Daily Loss Limit", "REMOVED"],
          ["Drawdown", "$2,500"]
        ]
      },
      {
        "name": "100K Account",
        "rules": [
          ["Profit Target", "$6,000"],
          ["Max Size", "12 minis / 120 micros"],
          ["Daily Loss Limit", "REMOVED"],
          ["Drawdown", "$3,000"]
        ]
      },
      {
        "name": "150K Account",
        "rules": [
          ["Profit Target", "$9,000"],
          ["Max Size", "15 minis / 150 micros"],
          ["Daily Loss Limit", "REMOVED"],
          ["Drawdown", "$4,500"]
        ]
      }
    ],
    "plansSummary": [
      {
        "name": "EVALUATION",
        "featured": true,
        "rules": {
          "Account Sizes": "25K · 50K · 75K · 100K · 150K",
          "Profit Target": "$1,500 · $3,000 · $4,500 · $6,000 · $9,000",
          "Max Drawdown": "$1,500 · $2,000 · $2,500 · $3,000 · $4,500",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "REMOVED across all sizes",
          "Min. Trading Days": "3 Trading Days",
          "Consistency Rule": "50% (Test only)",
          "News Rule": "Test: none · PRO & PRO+: flat around high-impact news",
          "Payout Split": "PRO 80/20 · PRO+ 90/10",
          "Payout Frequency": "Daily",
          "Max Payout": "No cap · PRO buffer = max drawdown (withdraw above $26,500 · $52,000 · $77,500 · $103,000 · $154,500)",
          "Activation Fee": "$130 one-time (often waived) · monthly $150 · $170 · $245 · $330 · $360",
          "Reset Fee": "$79 · $99 · $139 · $169 · $199",
          "Platforms": "TradingView · NinjaTrader · Tradovate · Bookmap · MultiCharts · MotiveWave · Trade Navigator · R|Trader · VolFix · ATAS · Investor R/T · Quantower · Finamark · Jigsaw Trader",
          "Promo Code": "CHAMP"
        }
      }
    ],
    "note": "Take Profit Trader runs a three-stage ladder — TEST (evaluation) → PRO (simulated funded) → PRO+ (live market) — with NO daily loss limit at any stage across all five account sizes (25K-150K). TEST uses EOD trailing drawdown with a 50% consistency rule; targets are $1,500 / $3,000 / $4,500 / $6,000 / $9,000 and drawdowns $1,500 / $2,000 / $2,500 / $3,000 / $4,500. On passing, PRO pays 80/20 with day-one payouts and switches to intraday trailing drawdown (the single biggest rule change between stages); PRO+ is a real live-market account paying 90/10 with EOD drawdown and no buffer. Max contracts 3 / 6 / 9 / 12 / 15 minis by size. Monthly subscription $150 / $170 / $245 / $330 / $360 plus a one-time $130 activation (often waived by promo). Use CHAMP for 40% off (public promo at the Oct 23, 2026 check: NOFEE40 = 40% off the test for life + $130 activation waived). Minimum 3 trading days to get funded (tests bought before Aug 17, 2026: 5). PRO withdrawals start once the balance clears the buffer (= the max drawdown), with no minimum profit days, no funded consistency and no maximum; withdrawals of $250 or less from the wallet carry a $50 fee. On moving to PRO+, $5,000 of PRO profit stays frozen while PRO+ is active. News: Test is unrestricted; PRO & PRO+ must be flat 1 minute before to 1 minute after FOMC, NFP and CPI. Up to 5 active funded accounts per person (PRO + PRO+ combined; tests unlimited; max 10 passed-test activations per 30 days); approved trade copiers may be used across your own accounts only."
  },
  "top-one-futures": {
    "slug": "top-one-futures",
    "lastAudited": "2026-10-23",
    "country": "US",
    "maxAllocation": "$150K",
    "platformsList": ["Tradovate","NinjaTrader","TradingView","BlackArrow","WealthCharts"],
    "payoutTotal": "$30M+",
    "payoutCount": "228,000+ accounts",
    "payoutAvg": "~$1,500",
    "payoutLargest": "$31K",
    "payoutMedianTime": "<12 hours",
    "name": "Top One Futures",
    "initials": "TO",
    "logo": "/logos/topone.png",
    "logoText": "TO",
    "affiliateUrl": "https://toponefutures.com/?linkId=lp_707970&sourceId=thetradingchamp&tenantId=toponefutures",
    "type": "Elite Access · Elite Daily · Instant Sim · Ignite",
    "tagline": "Elite Access · Elite Daily · Instant Sim Funded · Ignite — 4 paths",
    "badge": "hot",
    "featured": false,
    "live": true,
    "tags": ["discount", "instant"],
    "filters": ["evaluation", "instant", "highest-discount"],
    "promo": {
      "code": "CHAMP",
      "discount": "60% off"
    },
    "offerLine": "60% OFF",
    "offerSub": "Elite Access · Elite Daily · Instant Sim · Ignite — 4 paths",
    "summary": "Top One Futures runs four paths, all paying a flat 90% split. Elite Access is the cheap one-time 1-day-pass eval ($39 entry, no daily loss limit in the eval, payouts after 5 profitable days). Elite Daily is a monthly-subscription eval with daily payouts. Instant Sim Funded skips the evaluation entirely for a one-time fee (20% consistency, EOD-trailing drawdown). Ignite is a one-time instant-funding path (15% consistency, 10 copy-trade accounts). Code CHAMP applies the current discount at checkout; the site also rotates public promos. Runs on Tradovate, NinjaTrader, BlackArrow and WealthCharts (TradingView via Tradovate).",
    "highlights": ["Flat 90% Split", "1-Day Pass or Instant", "4 Funding Paths"],
    "bestFor": ["High Discount", "Path Variety", "Instant Options"],
    "stats": [
      ["Discount", "60% Off"],
      ["Plans", "Elite Access · Elite Daily · Instant · Ignite"],
      ["Split", "90% flat"]
    ],
    "boxPreviews": {
      "deal": "Code CHAMP at checkout · big current discount",
      "programs": "Elite Access (1-day pass) · Elite Daily (daily payouts) · Instant Sim Funded · Ignite (instant)",
      "rules": "No eval DLL on Elite Access · Instant Sim 20% consistency · Ignite 15% consistency · flat 90% split",
      "payouts": "Daily (Elite Daily) · after 5 profitable days (Elite Access) · profit target + consistency (Instant Sim / Ignite) · 90% to trader"
    },
    "boxMore": {
      "deal": "Use code CHAMP at checkout. The site rotates public promos (Oct 23, 2026 check: BOGO on Elite Access; code 30M = 50% off Elite Daily & Ignite, 45% off Instant) — CHAMP is Champ's affiliate code. List pricing (before discount):\\n\\nELITE ACCESS (one-time): $39 evaluation (all sizes) + activation $139 / $189 / $259 / $359 after passing (25K-150K)\\nELITE DAILY (monthly): $178 / $218 / $398 / $549\\nINSTANT SIM FUNDED (one-time): $419 / $679 / $821 / $939\\nIGNITE (one-time): $218 / $398 / $563 / $799\\n\\nAlways verify the current checkout price.",
      "programs": "ELITE ACCESS — one-time $39 eval · 1-day pass · EOD drawdown · no eval DLL · payouts after 5 profitable days · 90% split · 25K-150K\\nELITE DAILY — monthly subscription · EOD drawdown · daily payouts · 40% eval consistency · 90% split · 25K-150K\\nINSTANT SIM FUNDED — one-time · skip the eval, start funded · trailing drawdown · 20% consistency · 5-day payouts · 25K-150K\\nIGNITE — one-time · instant funding · trailing EOD drawdown · 15% consistency · 10 copy-trade accounts · 25K-150K",
      "rules": "ELITE ACCESS: 1 day to pass · no eval consistency · no eval DLL · funded DLL $500 / $1,000 / $1,250 / $1,750 · 40% funded consistency · eval reset $35 · activation $139 / $189 / $259 / $359\\nELITE DAILY: 40% eval consistency · none funded · no activation fee · DLL $500 / $1,000 / $1,250 / $1,850\\nINSTANT SIM FUNDED: 20% consistency · no eval · DLL $625 / $1,250 / $2,500 / $3,000 · max 5 accounts (3 on 100K-150K)\\nIGNITE: 15% consistency · no eval · DLL $500 / $1,000 / $2,000 / $3,000 · max 10 accounts\\nNEWS: Elite Daily & Elite Access funded — no trades 2 min before/after high-impact news; Instant Sim & Ignite — no news rule",
      "payouts": "ELITE ACCESS: after 5 profitable days ($200 / $250 / $300 / $350) · buffer + $500 · $500 min · 90% split\\nELITE DAILY: daily · buffer $1,500 / $2,500 / $3,500 / $4,500 · $500 min · 90% split\\nINSTANT SIM FUNDED: profit target 6% → 5% → 4% + 20% consistency · 90% split\\nIGNITE: 5% profit target per payout + 15% consistency · $250 min · 90% split · copy trading only between Ignite accounts of the same size\\nAll paths pay a flat 90% to the trader; after the 1st payout, 50% of each Elite payout must be new profit."
    },
    "programs": [
      "Elite Access — one-time $39 eval, 1-day pass, no eval DLL, payouts after 5 profitable days, 90% split",
      "Elite Daily — monthly subscription eval, daily payouts, 90% split",
      "Instant Sim Funded — skip the eval, one-time fee, 20% consistency, 90% split",
      "Ignite — one-time instant funding, 15% consistency, 10 copy-trade accounts, 90% split"
    ],
    "rules": [
      "All four paths pay a flat 90% split to the trader",
      "Elite Access: $39 one-time eval, 1 day to pass, no daily loss limit or consistency in the eval, funded DLL $500 / $1,000 / $1,250 / $1,750 and 40% funded consistency, $35 eval reset, activation $139 / $189 / $259 / $359 after passing",
      "Elite Daily: monthly subscription, 40% eval consistency, no funded consistency, no activation fee",
      "Instant Sim Funded: no evaluation, 20% consistency, trailing drawdown, max 5 accounts (3 on 100K-150K)",
      "Ignite: no evaluation, 15% consistency, trailing EOD drawdown, up to 10 accounts (same size), copy trading only between Ignite accounts of the same size",
      "News: Elite Daily and Elite Access funded accounts may not trade 2 minutes before or after high-impact news; Instant Sim Funded and Ignite have no news rule"
    ],
    "payouts": [
      "Elite Access: on request after 5 profitable days ($200 / $250 / $300 / $350), balance above buffer + $500, $500 min, max $1,000 / $1,500 / $2,000 / $2,500",
      "Elite Daily: daily, $500 min, max $750 / $1,000 / $1,500 / $2,250 per request",
      "Instant Sim Funded: profit target 6% (1st) → 5% → 4% plus 20% consistency; max $1,000 / $2,000 / $2,500 / $3,000 (2.0 accounts)",
      "Ignite: 5% profit target per payout plus 15% consistency, no minimum days, $250 min, max $500 / $1,000 / $1,500 / $2,000"
    ],
    "platforms": ["Tradovate", "NinjaTrader", "TradingView", "BlackArrow", "WealthCharts"],
    "warning": "Top One changes pricing and promos frequently. Prices shown are list (pre-discount); code CHAMP applies the current discount at checkout. Always confirm the live checkout price and plan availability.",
    "plansDetailed": [
      {
        "name": "Elite Access (1-day pass)",
        "featured": true,
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Structure", "One-time payment · evaluation"],
          ["Evaluation Fee", "$39 one-time (all sizes) · site shows $139 / $189 / $259 / $359 struck through"],
          ["Time to Pass", "1 day"],
          ["Profit Target", "$1,500 / $3,000 / $6,000 / $9,000"],
          ["Max Drawdown (EOD)", "$1,000 / $2,000 / $3,000 / $4,000 eval · $1,000 / $2,000 / $3,000 / $3,500 funded"],
          ["Daily Loss Limit", "None (eval) · $500 / $1,000 / $1,250 / $1,750 funded (soft)"],
          ["Consistency (Eval)", "None"],
          ["Consistency (Funded)", "40%"],
          ["Reset Fee", "$35 eval (all sizes) · $299-$1,349 funded"],
          ["Activation Fee", "$139 / $189 / $259 / $359 (after passing)"],
          ["Max Contracts", "1 / 3 / 5 / 7 mini"],
          ["Max Accounts", "10 funded (same size; shared with Elite Access Intraday)"],
          ["Payout Frequency", "On request after 5 profitable days ($200 / $250 / $300 / $350)"],
          ["Payout Buffer", "$1,500 / $2,000 / $3,000 / $4,500 (request needs buffer + $500)"],
          ["Max Payout / Request", "$1,000 / $1,500 / $2,000 / $2,500 ($500 min)"],
          ["Profit Split", "90% to trader"],
          ["Platforms", "Tradovate · NinjaTrader · TradingView · BlackArrow · WealthCharts"],
          ["Promo Code", "CHAMP"]
        ]
      },
      {
        "name": "Elite Daily (daily payouts)",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Structure", "Monthly subscription · evaluation"],
          ["Monthly Price (list)", "$178 / $218 / $398 / $549"],
          ["Profit Target", "$1,500 / $3,000 / $6,000 / $9,000"],
          ["Max Drawdown (EOD)", "$1,000 / $2,000 / $3,000 / $4,500 eval · $1,000 / $2,000 / $2,500 / $3,500 funded"],
          ["Daily Loss Limit", "$500 / $1,000 / $1,250 / $1,850"],
          ["Consistency (Eval)", "40%"],
          ["Consistency (Funded)", "None"],
          ["Activation Fee", "None"],
          ["Max Contracts", "1 / 3 / 5 / 7 mini"],
          ["Max Accounts", "5 per household (evaluation + funded combined)"],
          ["Payout Frequency", "Daily"],
          ["Max Payout / Request", "$750 / $1,000 / $1,500 / $2,250 ($500 min) · buffer $1,500 / $2,500 / $3,500 / $4,500"],
          ["Profit Split", "90% to trader"],
          ["Platforms", "Tradovate · NinjaTrader · TradingView · BlackArrow · WealthCharts"],
          ["Promo Code", "CHAMP"]
        ]
      },
      {
        "name": "Instant Sim Funded (no eval)",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Structure", "One-time · straight to funded (Instant 2.0)"],
          ["Price (list, one-time)", "$419 / $679 / $821 / $939"],
          ["Profit Target", "Instant funded — no eval target"],
          ["Max Drawdown (EOD trailing)", "$1,000 / $2,000 / $4,000 / $5,250"],
          ["Daily Loss Limit", "$625 / $1,250 / $2,500 / $3,000"],
          ["Consistency (Funded)", "20%"],
          ["Max Contracts", "1 / 3 / 5 / 7 mini"],
          ["Max Accounts", "5 (25K-50K) · 3 (100K-150K) · all the same size"],
          ["Payout Frequency", "When the profit target (6% → 5% → 4%) and 20% consistency are met (marketed as 5-day payouts)"],
          ["Max Payout / Request", "$1,000 / $2,000 / $2,500 / $3,000 (bought on/after Jul 27, 2026; earlier $1,500 / $2,500 / $3,000 / $3,500)"],
          ["Profit Split", "90% to trader"],
          ["Platforms", "Tradovate · NinjaTrader · TradingView · BlackArrow · WealthCharts"],
          ["Promo Code", "CHAMP"]
        ]
      },
      {
        "name": "Ignite (instant funding)",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Structure", "One-time payment · straight to funded"],
          ["List Price", "$218 / $398 / $563 / $799"],
          ["Max Drawdown (Trailing EOD)", "$1,000 / $2,000 / $4,000 / $6,000"],
          ["Daily Loss Limit", "$500 / $1,000 / $2,000 / $3,000"],
          ["Consistency", "15%"],
          ["Max Contracts", "1 / 3 / 5 / 7 mini"],
          ["Max Accounts", "10 (same size)"],
          ["Copy-Trade Accounts", "10 (Ignite-to-Ignite, same size only)"],
          ["Payout Rules", "5% profit target per payout + 15% consistency · no min days · $250 min · max $500 / $1,000 / $1,500 / $2,000"],
          ["Profit Split", "90% to trader"],
          ["Platforms", "Tradovate · NinjaTrader · TradingView · BlackArrow · WealthCharts"],
          ["Promo Code", "CHAMP"]
        ]
      }
    ],
    "plansSummary": [
      {
        "name": "ELITE ACCESS",
        "featured": true,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $3,000 · $6,000 · $9,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,000",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "None eval · $500 · $1,000 · $1,250 · $1,750 funded",
          "Min. Trading Days": "1 day to pass · 5 profitable days per payout",
          "Consistency Rule": "None eval · 40% funded",
          "Payout Split": "90% / 10%",
          "Payout Frequency": "After 5 profitable days ($200-$350/day), on request",
          "Max Payout": "Capped per request: $1,000 · $1,500 · $2,000 · $2,500 (by size) · $500 min · buffer $1,500 · $2,000 · $3,000 · $4,500",
          "Activation Fee": "$139 · $189 · $259 · $359",
          "Reset Fee": "$35 eval (all sizes) · $299-$1,349 funded",
          "Platforms": "Tradovate · NinjaTrader · TradingView · BlackArrow · WealthCharts",
          "Promo Code": "CHAMP",
          "Notes": "$39 flat one-time eval (any size) · $35 reset · activation-on-pass $139–$359 · Elite ACCESS Intraday variant: intraday-trailing funded drawdown, activation $69 · $94 · $129 · $179"
        }
      },
      {
        "name": "ELITE DAILY",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $3,000 · $6,000 · $9,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,500",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "$500 · $1,000 · $1,250 · $1,850",
          "Min. Trading Days": "Pass in 1 day",
          "Consistency Rule": "40% eval · none funded",
          "Payout Split": "90% / 10%",
          "Payout Frequency": "Daily",
          "Max Payout": "Capped per request: $750 · $1,000 · $1,500 · $2,250 · $500 min · buffer $1,500 · $2,500 · $3,500 · $4,500",
          "Activation Fee": "None · monthly $178 / $218 / $398 / $549 (list)",
          "Reset Fee": "eval $66 · $82 · $154 · $215 (help center) · funded $299 · $499 · $849 · $1,250",
          "Platforms": "Tradovate · NinjaTrader · TradingView · BlackArrow · WealthCharts",
          "Promo Code": "CHAMP",
          "Notes": "Monthly subscription eval with daily payouts from day 1 · funded drawdown $1,000 · $2,000 · $2,500 · $3,500 · max 5 accounts per household (eval + funded)"
        }
      },
      {
        "name": "INSTANT SIM FUNDED",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "Instant funded (no eval)",
          "Max Drawdown": "$1,000 · $2,000 · $4,000 · $5,250",
          "Drawdown Type": "EOD trailing",
          "Daily Loss Limit": "$625 · $1,250 · $2,500 · $3,000",
          "Min. Trading Days": "None — start funded",
          "Consistency Rule": "20% funded",
          "Payout Split": "90% / 10%",
          "Payout Frequency": "5-day payouts (marketed) · profit target 6% → 5% → 4% + 20% consistency",
          "Max Payout": "Capped per request: $1,000 · $2,000 · $2,500 · $3,000 (Instant 2.0, bought on/after Jul 27, 2026)",
          "Activation Fee": "One-time $419 / $679 / $821 / $939 (list)",
          "Reset Fee": "Straight to funded",
          "Platforms": "Tradovate · NinjaTrader · TradingView · BlackArrow · WealthCharts",
          "Promo Code": "CHAMP",
          "Notes": "Skip the eval · Instant 2.0 (one-time) · max 5 accounts (3 on 100K-150K)"
        }
      },
      {
        "name": "IGNITE",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "Instant funded (no eval)",
          "Max Drawdown": "$1,000 · $2,000 · $4,000 · $6,000",
          "Drawdown Type": "Trailing EOD",
          "Daily Loss Limit": "$500 · $1,000 · $2,000 · $3,000",
          "Min. Trading Days": "None — instant funded",
          "Consistency Rule": "15%",
          "Payout Split": "90% / 10%",
          "Payout Frequency": "On request once the 5% profit target + 15% consistency are met (no min days)",
          "Max Payout": "Capped per request: $500 · $1,000 · $1,500 · $2,000 (by size) · $250 min",
          "Activation Fee": "One-time $218 / $398 / $563 / $799 (list)",
          "Reset Fee": "Straight to funded",
          "Platforms": "Tradovate · NinjaTrader · TradingView · BlackArrow · WealthCharts",
          "Promo Code": "CHAMP",
          "Notes": "Up to 10 accounts (same size) · copy trading only between Ignite accounts of the same size · optional No-DLL add-on (~30% more)"
        }
      }
    ],
    "note": "Top One Futures runs four paths as of August 2026, all paying a flat 90% split: Elite Access (one-time, 1-day pass, no daily loss limit in the eval but a $500–$1,750 funded DLL, payouts after 5 profitable days), Elite Daily (monthly-subscription eval with daily payouts, 40% eval consistency), Instant Sim Funded (skip the eval for a one-time fee, 20% consistency, EOD-trailing drawdown), and Ignite (one-time instant funding, 15% consistency, 10 copy-trade accounts). LaunchPad: X-Ultra is no longer available for new purchases (rules still apply to existing accounts); the current limited LaunchPad release is X-Daily Spark ($50K only, $39 one-time eval, $189 activation, daily payouts, 80/20, no consistency rule). Account limits are per household and per category (Elite Access 10, Elite Daily 5, Instant 5 or 3, Ignite 10, LaunchPad 3), all accounts in a category the same size; copy trading only between accounts of the same type and size, never with another person. Optional No-DLL add-on (Oct 16, 2026) on Elite Access, Elite Daily and Ignite. Prices shown are list (pre-discount); code CHAMP applies the current discount and the site also rotates public promos. Runs on Tradovate, NinjaTrader, BlackArrow and WealthCharts (TradingView via Tradovate)."
  },
  "my-funded-futures": {
    "slug": "my-funded-futures",
    "lastAudited": "2026-10-23",
    "country": "US",
    "maxAllocation": "$450K",
    "platformsList": ["NinjaTrader","Tradovate","TradingView","Quantower","Hyperprop"],
    "payoutTotal": "$250M+",
    "payoutCount": "25,000+",
    "payoutAvg": "$3,200",
    "payoutLargest": "$42K",
    "payoutMedianTime": "Instant",
    "name": "My Funded Futures",
    "initials": "MF",
    "logo": "/logos/myfunded.png",
    "logoText": "MF",
    "affiliateUrl": "https://www.myfundedfutures.com/challenge?ref=5148&code=champ",
    "type": "Rapid · Rapid EOD · Pro · Builder",
    "tagline": "Rapid · Rapid EOD · Pro · Builder — No activation fee",
    "badge": "new",
    "featured": false,
    "live": true,
    "tags": ["discount", "fast-payout", "no-dll"],
    "filters": ["evaluation", "beginner", "fast-payout", "nodll"],
    "promo": {
      "code": "CHAMP",
      "discount": "Up to 50% off"
    },
    "offerLine": "Use Code CHAMP",
    "offerSub": "Rapid · Rapid EOD · Pro · Builder — no DLL on Rapid & Pro, no activation fee",
    "summary": "My Funded Futures runs four products as of August 2026: Rapid (daily payouts, 90/10, intraday-trailing once funded), Rapid EOD (25K/50K, daily payouts but end-of-day drawdown in funded), Pro (bi-weekly payouts, 80/20, up to $100K in sim payouts per user), and Builder (25K-150K eval, 48-hour payouts, and a five-payout ladder to a real Live account at Blue Row Capital). All plans are one-time purchases (no monthly renewals, effective Aug 2026). Rapid, Rapid EOD and Pro have no daily loss limit (Builder has a soft daily pause), and no plan has an activation fee. Code CHAMP takes up to 50% off. Flex has been retired.",
    "highlights": ["No DLL on Rapid & Pro", "No Activation Fee", "Daily Payouts (Rapid)"],
    "bestFor": ["No DLL", "No Activation Fee", "Frequent Payouts"],
    "stats": [
      ["Discount", "Up to 50%"],
      ["Plans", "Rapid · Rapid EOD · Pro · Builder"],
      ["DLL", "None (Builder: soft pause)"]
    ],
    "boxPreviews": {
      "deal": "Use code CHAMP at checkout · up to 50% off",
      "programs": "Rapid (daily) · Rapid EOD (daily, EOD drawdown) · Pro (bi-weekly) · Builder (path to live)",
      "rules": "No DLL · no activation fee · 50% eval consistency (30% on Rapid EOD, none on Builder eval)",
      "payouts": "Daily (Rapid / Rapid EOD) · bi-weekly (Pro) · every 48h (Builder sim)"
    },
    "boxMore": {
      "deal": "Use code CHAMP at checkout (up to 50% off). MFF also rotates public per-plan promos (RAPID, EOD, UNCAPPED, builder) — CHAMP is Champ's affiliate code. All plans are one-time purchases (no monthly renewals since Aug 2026). List one-time pricing: Rapid $145 / $209 / $356 / $463 (25K-150K) · Rapid EOD $145 / $225 (25K/50K) · Pro $265 / $401 / $557 (50K-150K) · Builder $105 / $153 / $282 / $398 (25K-150K). Always verify current checkout pricing.",
      "programs": "RAPID — daily payouts · 25K-150K · 90/10 · EOD in eval, intraday trailing once funded (locks after a $100 buffer) · 2-day pass · 50% eval consistency\\nRAPID EOD — 25K/50K · daily payouts but EOD drawdown in funded (no intraday trail) · 90/10 · 4-day pass · 30% eval consistency\\nPRO — bi-weekly payouts · 50K-150K · 80/20 · up to $100K in sim payouts per user · no Tier-1 news · 2-day pass\\nBUILDER — 25K-150K eval · EOD trailing · 48-hour payouts · 80/20 · five-payout ladder to a real Live account at Blue Row Capital",
      "rules": "Rapid / Rapid EOD / Pro: NO DLL (Builder carries a per-size soft pause: $600 / $1,000 / $1,750 / $2,500), NO activation fee\\nRAPID: 2 min days · 50% eval consistency · min payout $500\\nRAPID EOD: 4 min days · 30% eval consistency · min payout $500\\nPRO: 2 min days · 50% eval consistency · max contracts 3 / 6 / 9 mini · no Tier-1 news when funded · must trade every 7 days · min payout $1,000\\nBUILDER: 1-day pass · no eval consistency · 50% consistency at payout stage · min 2 qualifying days per cycle · news unrestricted\\nACCOUNTS: up to 10 evals · 5 sim-funded if all 25K/50K, 3 if any 100K/150K · Builder 1 sim-funded (2 on 25K) · Rapid EOD 3 · copy trading allowed across your own accounts",
      "payouts": "RAPID / RAPID EOD: daily · first payout 24h after first trade once the buffer ($1,100 / $2,100 / $3,100 / $4,600) is cleared · min payout $500 · no per-payout cap stated (Rapid EOD: explicitly none) · $10K net profit in one day on Rapid auto-moves you Live (excess that day forfeited)\\nPRO: every 14 calendar days from first trade · buffer $2,100 / $3,100 / $4,600 (up to 60% of profit withdrawable before clearing it) · min payout $1,000 · $100K sim payout cap per user · 3 consecutive payouts or $20K profit triggers a Live review\\nBUILDER (sim): first request 48h after first trade · buffer $1,100 / $2,100 / $3,100 / $4,600 · min payout $250 / $500 / $1,000 / $1,500 · max $1,000 / $2,000 / $3,000 / $4,500 per cycle · 5 approved payouts unlocks a real Live account at Blue Row Capital (daily payouts, 80/20, EOD trailing, live DLL applies, no consistency)"
    },
    "programs": [
      "Funded Futures Rapid — daily payouts · 25K-150K · 90/10 · intraday trailing once funded · no DLL · no activation fee",
      "Rapid EOD — 25K/50K · daily payouts with end-of-day drawdown in funded · 90/10 · no DLL",
      "Funded Futures Pro — bi-weekly payouts · 50K-150K · 80/20 · up to $100K in sim payouts per user · no DLL",
      "Builder — 25K-150K eval · 48-hour payouts · 80/20 · five-payout ladder to a real Live account"
    ],
    "rules": [
      "All plans: NO daily loss limit (Builder carries a per-size soft pause: $600 / $1,000 / $1,750 / $2,500), NO activation fee",
      "Rapid: EOD drawdown in eval, intraday trailing once funded (locks permanently after a $100 buffer), 2-day pass, 50% eval consistency; funded accounts may not trade Tier-1 news",
      "Rapid EOD: 25K/50K only, daily payouts but EOD drawdown in the funded stage too, 4-day pass, 30% eval consistency; funded accounts may not trade Tier-1 news",
      "Pro: EOD trailing, 80/20, bi-weekly payouts up to $100K in sim payouts per user, no Tier-1 news trading, must trade at least every 7 days",
      "Builder: 25K-150K, EOD trailing, 48-hour payouts, five approved sim payouts unlock a real Live funded account at Blue Row Capital",
      "Funded consistency: none on Rapid/Rapid EOD/Pro; 50% at Builder's payout stage"
    ],
    "payouts": [
      "Rapid / Rapid EOD: daily once the buffer is cleared ($1,100 / $2,100 / $3,100 / $4,600), min payout $500, no per-payout cap stated",
      "Pro: every 14 calendar days from first trade, min payout $1,000, $100K sim payout cap per user",
      "Builder (sim): first request 48h after first trade, min $250 / $500 / $1,000 / $1,500, max $1,000 / $2,000 / $3,000 / $4,500 per cycle; 5 payouts → real Live account",
      "Live triggers: Rapid — $10K net profit in one day (automatic) or risk-team review; Pro — 3 consecutive payouts or $20K profit (review); Builder — 5 approved payouts"
    ],
    "platforms": ["NinjaTrader", "Tradovate", "TradingView", "Quantower", "Hyperprop"],
    "warning": "MFF retired the Flex plan and added a Rapid EOD variant (25K/50K); all plans are now one-time purchases (no monthly renewals). Builder is 25K-150K with 48-hour payouts. Rapid uses EOD drawdown in evaluation but switches to intraday trailing once funded. Always confirm current plan availability and checkout pricing.",
    "plansDetailed": [
      {
        "name": "Funded Futures Rapid",
        "featured": true,
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Price (list, one-time)", "$145 / $209 / $356 / $463"],
          ["Profit Target", "$1,500 / $3,000 / $6,000 / $9,000"],
          ["Max Drawdown", "$1,000 / $2,000 / $3,000 / $4,500"],
          ["Drawdown Type", "EOD (Eval) → Intraday Trailing (Funded), locks after $100 buffer"],
          ["Daily Loss Limit", "None"],
          ["Min Trading Days", "2"],
          ["Consistency (Eval)", "50%"],
          ["Consistency (Funded)", "None"],
          ["Profit Split", "90% / 10%"],
          ["Payout Frequency", "Daily"],
          ["Minimum Payout", "$500"],
          ["Activation Fee", "$0"],
          ["Reset Fee", "$87 / $157 / $267 / $347"],
          ["Platforms", "NinjaTrader · Tradovate · TradingView · Quantower · Hyperprop"],
          ["Promo Code", "CHAMP"]
        ]
      },
      {
        "name": "Rapid EOD",
        "rules": [
          ["Account Sizes", "25K / 50K"],
          ["Price (list, one-time)", "$145 / $225"],
          ["Profit Target", "$1,500 / $3,000"],
          ["Max Drawdown", "$1,000 / $2,000"],
          ["Drawdown Type", "End-of-Day (Eval & Funded) — no intraday trail"],
          ["Daily Loss Limit", "None"],
          ["Min Trading Days", "4"],
          ["Consistency (Eval)", "30%"],
          ["Consistency (Funded)", "None"],
          ["Profit Split", "90% / 10%"],
          ["Payout Frequency", "Daily"],
          ["Minimum Payout", "$500"],
          ["Activation Fee", "$0"],
          ["Platforms", "NinjaTrader · Tradovate · TradingView · Quantower · Hyperprop"],
          ["Promo Code", "CHAMP (public promo: EOD)"]
        ]
      },
      {
        "name": "Funded Futures Pro",
        "rules": [
          ["Account Sizes", "50K / 100K / 150K"],
          ["Price (list, one-time)", "$265 / $401 / $557"],
          ["Profit Target", "$3,000 / $6,000 / $9,000"],
          ["Max Drawdown", "$2,000 / $3,000 / $4,500"],
          ["Drawdown Type", "End-of-Day trailing"],
          ["Daily Loss Limit", "None"],
          ["Max Contracts", "3 / 6 / 9 mini"],
          ["Min Trading Days", "2"],
          ["Consistency (Eval)", "50%"],
          ["Consistency (Funded)", "None"],
          ["Profit Split", "80% / 20%"],
          ["Payout Frequency", "Bi-weekly (14 days from first trade)"],
          ["Minimum Payout", "$1,000"],
          ["Max Payout / Cycle", "$100,000 (sim payout cap per user; profit above it is forfeited)"],
          ["Payout Buffer", "$2,100 / $3,100 / $4,600 (up to 60% of profit withdrawable before it is cleared)"],
          ["News Restriction", "No Tier-1 news trading · must trade every 7 days"],
          ["Live Transition", "3 consecutive payouts or $20K profit → risk-team review"],
          ["Activation Fee", "$0"],
          ["Reset Fee", "$227 / $344 / $477"],
          ["Platforms", "NinjaTrader · Tradovate · TradingView · Quantower · Hyperprop"],
          ["Promo Code", "CHAMP"]
        ]
      },
      {
        "name": "Builder Plan (path to Live)",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Price (list, one-time)", "$105 / $153 / $282 / $398"],
          ["Profit Target", "$1,500 / $3,000 / $6,000 / $9,000"],
          ["Max Drawdown (EOD trailing)", "$1,000 / $2,000 / $3,000 / $4,500"],
          ["Daily Loss Limit (soft pause)", "$600 / $1,000 / $1,750 / $2,500"],
          ["Min Days to Pass", "1"],
          ["Consistency (Eval)", "None"],
          ["Consistency (Payout stage)", "50%"],
          ["Profit Split", "80% / 20%"],
          ["Payout Frequency (Sim)", "First request 48h after first trade · 2 trading days + net profit per cycle"],
          ["Payout Buffer", "$1,100 / $2,100 / $3,100 / $4,600"],
          ["Minimum Payout", "$250 / $500 / $1,000 / $1,500"],
          ["Max Payout / Cycle", "$1,000 / $2,000 / $3,000 / $4,500"],
          ["Max Sim-Funded Accounts", "1 per user (2 on 25K)"],
          ["Activation Fee", "$0 (one-time, no renewal)"],
          ["Path to Live", "5 approved sim payouts → real Live account at Blue Row Capital (daily payouts, 80/20, EOD trailing, live DLL applies, no consistency)"],
          ["Platforms", "NinjaTrader · Tradovate · TradingView · Quantower · Hyperprop"],
          ["Promo Code", "CHAMP (public promo: builder)"]
        ]
      }
    ],
    "plansSummary": [
      {
        "name": "FUNDED FUTURES RAPID",
        "featured": true,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $3,000 · $6,000 · $9,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,500",
          "Drawdown Type": "EOD (eval) · intraday trailing (funded)",
          "Daily Loss Limit": "None",
          "Min. Trading Days": "2 days to pass",
          "Consistency Rule": "50% eval · none funded",
          "Payout Split": "90% / 10%",
          "Payout Frequency": "Daily",
          "Max Payout": "No per-payout cap stated · buffer $1,100 · $2,100 · $3,100 · $4,600 · $10K day → auto Live",
          "Activation Fee": "FREE · one-time (list $145 · $209 · $356 · $463)",
          "Reset Fee": "$87 · $157 · $267 · $347",
          "Platforms": "NinjaTrader · Tradovate · TradingView · Quantower · Hyperprop",
          "Promo Code": "CHAMP",
          "Notes": "Funded starts at $0 · intraday trail stops once the max-loss level reaches +$100 · first payout 24h after first trade · min payout $500"
        }
      },
      {
        "name": "RAPID EOD",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K",
          "Profit Target": "$1,500 · $3,000",
          "Max Drawdown": "$1,000 · $2,000",
          "Drawdown Type": "EOD (eval & funded)",
          "Daily Loss Limit": "None",
          "Min. Trading Days": "4 days to pass",
          "Consistency Rule": "30% eval · none funded",
          "Payout Split": "90% / 10%",
          "Payout Frequency": "Daily",
          "Max Payout": "No cap per payout · buffer $1,100 · $2,100, then $250 · $500 net profit since last payout",
          "Activation Fee": "FREE · one-time (list $145 · $225)",
          "Reset Fee": "See site (mirrors Rapid)",
          "Platforms": "NinjaTrader · Tradovate · TradingView · Quantower · Hyperprop",
          "Promo Code": "CHAMP",
          "Notes": "25K/50K only · daily payouts but EOD drawdown in funded (no intraday trail) · no Tier-1 news when funded · min payout $500"
        }
      },
      {
        "name": "FUNDED FUTURES PRO",
        "featured": false,
        "rules": {
          "Account Sizes": "50K · 100K · 150K",
          "Profit Target": "$3,000 · $6,000 · $9,000",
          "Max Drawdown": "$2,000 · $3,000 · $4,500",
          "Drawdown Type": "EOD trailing",
          "Daily Loss Limit": "None",
          "Min. Trading Days": "2 days to pass",
          "Consistency Rule": "50% eval · none funded",
          "Payout Split": "80% / 20%",
          "Payout Frequency": "Every 14 calendar days (min $1,000)",
          "Max Payout": "$100K in sim payouts per user",
          "Activation Fee": "FREE · one-time (list $265 · $401 · $557)",
          "Reset Fee": "$227 · $344 · $477",
          "Platforms": "NinjaTrader · Tradovate · TradingView · Quantower · Hyperprop",
          "Promo Code": "CHAMP",
          "Notes": "No Tier-1 news when funded · max contracts 3/6/9 mini · buffer $2,100/$3,100/$4,600 · $100K sim payout cap per user · 3 payouts or $20K profit → Live review · trade every 7 days"
        }
      },
      {
        "name": "BUILDER PLAN",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $3,000 · $6,000 · $9,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,500",
          "Drawdown Type": "EOD trailing",
          "Daily Loss Limit": "$600 · $1,000 · $1,750 · $2,500 (soft pause)",
          "Min. Trading Days": "1 day to pass",
          "Consistency Rule": "None eval · 50% at payout",
          "Payout Split": "80% / 20%",
          "Payout Frequency": "2 trading days per cycle (first request 48h after first trade)",
          "Max Payout": "$1,000 · $2,000 · $3,000 · $4,500 per cycle",
          "Activation Fee": "FREE · one-time (list $105 · $153 · $282 · $398)",
          "Reset Fee": "See site",
          "Platforms": "NinjaTrader · Tradovate · TradingView · Quantower · Hyperprop",
          "Promo Code": "CHAMP",
          "Notes": "5 sim payouts → real Live account at Blue Row Capital · min payout $250 / $500 / $1,000 / $1,500 · 1 sim-funded Builder per user (2 on 25K)"
        }
      }
    ],
    "note": "My Funded Futures runs four products as of August 2026: Rapid (daily payouts, 90/10, EOD drawdown in eval then intraday trailing once funded — locks after a $100 buffer), Rapid EOD (25K/50K — daily payouts but end-of-day drawdown in the funded stage too, 4-day pass, 30% eval consistency), Pro (bi-weekly payouts, 80/20, up to $100K in sim payouts per user, no Tier-1 news trading), and Builder (25K-150K eval, 48-hour sim payouts, and a five-payout ladder to a real Live account at Blue Row Capital). All plans are one-time purchases (no monthly renewals, since Aug 2026). No plan carries a daily loss limit (Builder carries a per-size soft pause, $600–$2,500) or an activation fee. Code CHAMP takes up to 50% off; MFF also rotates public per-plan promos. Flex has been retired. Account limits: up to 10 evaluations; 5 sim-funded accounts if all are 25K/50K, 3 if any is 100K/150K; Builder allows 1 sim-funded account per user (2 on 25K) and Rapid EOD 3; copy trading is allowed across your own accounts (Tradesyncer, Tradovate group trading). MFF also sells limited 'Studio' plans (#001 $10K, #002 $20K, #003 $5K) on myfundedfutures.com/studio: static max loss, no DLL, no consistency rule, payouts anytime, 1 Studio account at a time."
  },
  "fundednext": {
    "slug": "fundednext",
    "lastAudited": "2026-10-23",
    "country": "AE",
    "maxAllocation": "$150K",
    "platformsList": ["NinjaTrader","Tradovate","TradingView"],
    "payoutTotal": "$380M+",
    "payoutCount": "—",
    "payoutAvg": "—",
    "payoutLargest": "—",
    "payoutMedianTime": "24 hours",
    "name": "FundedNext",
    "initials": "FN",
    "logo": "/logos/fundednext.png",
    "logoText": "FN",
    "affiliateUrl": "https://fundednext.com/?fpr=CHAMP",
    "type": "Flex · Legacy · Rapid",
    "tagline": "Flex · Legacy · Rapid",
    "badge": "new",
    "featured": true,
    "live": true,
    "tags": ["fast-payout","no-dll","high-split"],
    "filters": ["evaluation","fast-payout","nodll"],
    "promo": { "code": "CHAMP", "discount": "See pricing" },
    "offerLine": "Use Code CHAMP",
    "offerSub": "Flex · Legacy · Rapid (Pro / Daily)",
    "summary": "FundedNext brings its track record ($380M+ paid across its programs) to futures with three account types. Flex pays a 95% reward share with no daily loss limit; Legacy is the low-cost path; Rapid passes in a single day with a Pro option (no DLL, rewards every 3 days) or a Daily option (daily payouts). All use end-of-day drawdown, allow news trading, and run on NinjaTrader, Tradovate and TradingView. Code CHAMP applies at checkout.",
    "highlights": ["Up to 95% Split", "1-Day Pass (Rapid)", "No DLL on Flex/Legacy"],
    "bestFor": ["High Profit Split", "Fast Funding", "News Trading"],
    "stats": [
      ["Account Types", "3 · Flex / Legacy / Rapid"],
      ["Top Split", "95% (Flex)"],
      ["Code", "CHAMP"]
    ],
    "boxPreviews": {
      "deal": "Code CHAMP at checkout · one-time challenge fee",
      "programs": "Flex, Legacy, Rapid (Pro or Daily)",
      "rules": "EOD max loss limit · no DLL on Flex/Legacy/Rapid-Pro · 40% consistency (challenge: Flex/Legacy · funded: Rapid Pro)",
      "payouts": "Flex 95% split · Rapid 90% · Legacy 80% · payouts within 24h"
    },
    "boxMore": {
      "deal": "Use code CHAMP at checkout. FundedNext Futures charges a one-time challenge fee. Promotional pricing was live at last check — confirm the current price at checkout. Reward share up to 95% on Flex.",
      "programs": "FLEX — 50K-150K · one-time fee · challenge then 5-day benchmark to funded · 95% split\nLEGACY — 25K-100K · lowest targets · 80% split\nRAPID — 25K-100K · 1-day pass · choose Pro (no DLL, rewards every 3 days) or Daily (daily rewards)",
      "rules": "Flex challenge (50K-150K): Profit target $2,500 / $5,000 / $8,000 · EOD max loss $1,500 / $2,500 / $4,000 · no DLL · 40% consistency\nLegacy challenge (25K-100K): Profit target $1,250 / $3,000 / $6,000 · EOD max loss $1,000 / $2,000 / $3,000 · no DLL · 40% consistency\nRapid challenge (25K-100K): 1 day to pass · Profit target $1,500 / $3,000 / $5,000 · EOD max loss $1,000 / $2,000 / $2,500 · Pro no DLL / Daily has DLL",
      "payouts": "Flex funded: 5 benchmark days · $500 min cycle profit · 95% split · withdraw 50% of profit up to $1,500 / $2,500 / $4,000\nLegacy funded: 80% split · withdraw up to $3,000 / $6,000 / $6,000\nRapid funded: 90% split · Pro rewards every 3 days / Daily rewards daily · withdraw up to $800 / $1,200 / $2,500"
    },
    "programs": [
      "Flex — challenge then 5-day benchmark to funded, 95% reward share (50K-150K)",
      "Legacy — lowest-cost path, 80% reward share (25K-100K)",
      "Rapid — 1-day pass, choose Pro (no DLL) or Daily (daily payouts), 90% share (25K-100K)"
    ],
    "rules": [
      "Pricing (help-center offer prices, Oct 2026): one-time challenge fees — Flex $74.99 / $144.99 / $259.99 (50K-150K; first 2 purchases, then $84.99 / $159.99 / $289.99; base $141.99 / $273.99 / $490.99), Legacy $79.99 / $199.99 / $239.99 (25K-100K), Rapid $79.99 / $169.99 / $279.99 (25K-100K; base $159.98 / $299.98 / $499.98). Promotional pricing — confirm at checkout.",
      "Drawdown: end-of-day (EOD) max loss limit on all account types",
      "Daily loss limit: none on Flex, Legacy and Rapid Pro; Rapid Daily has a DLL ($500 / $1,000 / $1,250)",
      "Consistency: 40% during the challenge on Flex and Legacy; Rapid Pro's 40% applies in the funded stage only; Rapid Daily has none",
      "News trading: allowed on all account types"
    ],
    "payouts": [
      "Flex: 95% reward share, 5 benchmark days, $500 minimum cycle profit",
      "Legacy: 80% reward share",
      "Rapid Pro: 90% share, rewards every 3 days",
      "Rapid Daily: 90% share, daily rewards",
      "Processing: ~99.99% of payouts within 24 hours"
    ],
    "platforms": ["NinjaTrader · Tradovate · TradingView"],
    "warning": "FundedNext Futures had promotional (sale) pricing live at last check — always confirm the current one-time fee at checkout. The $380M+ payout figure reflects FundedNext's published total across all of its programs, not futures alone.",
    "plansDetailed": [
      {
        "name": "FLEX",
        "featured": true,
        "rules": [
          ["Account Sizes", "50K / 100K / 150K"],
          ["One-Time Fee", "$74.99 / $144.99 / $259.99 (offer; $84.99 / $159.99 / $289.99 from 3rd purchase)"],
          ["Profit Target", "$2,500 / $5,000 / $8,000"],
          ["Max Loss Limit (EOD)", "$1,500 / $2,500 / $4,000"],
          ["Daily Loss Limit", "None"],
          ["Buffer Required", "None"],
          ["Consistency (Challenge)", "40%"],
          ["News Trading", "Allowed"],
          ["Max Contracts", "3 mini (30 micro) / 5 mini (50 micro) / 8 mini (80 micro)"],
          ["Benchmark Days (Funded)", "5"],
          ["Daily Benchmark (Funded)", "$200 / $200 / $250"],
          ["Min Cycle Profit", "$500"],
          ["Consistency (Funded)", "None"],
          ["Max Withdrawal", "50% of profit up to $1,500 / $2,500 / $4,000 ($250 min; account concludes after 5 rewards)"],
          ["Reward Share", "95%"],
          ["Platforms", "NinjaTrader · Tradovate · TradingView"],
          ["Promo Code", "CHAMP"]
        ]
      },
      {
        "name": "LEGACY",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K"],
          ["One-Time Fee", "$79.99 / $199.99 / $239.99"],
          ["Profit Target", "$1,250 / $3,000 / $6,000"],
          ["Max Loss Limit (EOD)", "$1,000 / $2,000 / $3,000"],
          ["Daily Loss Limit", "None"],
          ["Consistency (Challenge)", "40%"],
          ["News Trading", "Allowed"],
          ["Max Contracts (Challenge)", "2 mini (20 micro) / 3 mini (30 micro) / 5 mini (50 micro)"],
          ["Benchmark Days (Funded)", "5"],
          ["Daily Benchmark (Funded)", "$100 / $200 / $200"],
          ["Min Cycle Profit", "$500"],
          ["Consistency (Funded)", "None"],
          ["Max Withdrawal", "50% of profit up to $3,000 / $6,000 / $6,000 ($250 min; cap and 50% limit removed after 30 benchmark days)"],
          ["Reward Share", "80%"],
          ["Max Contracts (Funded)", "3 mini (30 micro) / 5 mini (50 micro) / 7 mini (70 micro)"],
          ["Platforms", "NinjaTrader · Tradovate · TradingView"],
          ["Promo Code", "CHAMP"]
        ]
      },
      {
        "name": "RAPID — Pro Plan",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K"],
          ["One-Time Fee", "$79.99 / $169.99 / $279.99 (offer)"],
          ["Days to Pass", "1"],
          ["Profit Target", "$1,500 / $3,000 / $5,000"],
          ["Max Loss Limit (EOD)", "$1,000 / $2,000 / $2,500"],
          ["Daily Loss Limit", "None"],
          ["Consistency (Challenge)", "None"],
          ["News Trading", "Allowed"],
          ["Max Contracts", "2 mini (20 micro) / 4 mini (40 micro) / 6 mini (60 micro)"],
          ["Rewards (Funded)", "Every 3 days ($500 profit in the cycle + 40% consistency)"],
          ["Min Withdrawal", "$250 (all sizes)"],
          ["Max Withdrawal", "$800 / $1,200 / $2,500"],
          ["Reward Share", "90%"],
          ["Consistency (Funded)", "40%"],
          ["Platforms", "NinjaTrader · Tradovate · TradingView"],
          ["Promo Code", "CHAMP"]
        ]
      },
      {
        "name": "RAPID — Daily Plan",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K"],
          ["One-Time Fee", "$79.99 / $169.99 / $279.99 (offer)"],
          ["Days to Pass", "1"],
          ["Profit Target", "$1,500 / $3,000 / $5,000"],
          ["Max Loss Limit (EOD)", "$1,000 / $2,000 / $2,500"],
          ["Daily Loss Limit", "$500 / $1,000 / $1,250"],
          ["Consistency (Challenge)", "None"],
          ["News Trading", "Allowed"],
          ["Max Contracts", "2 mini (20 micro) / 4 mini (40 micro) / 6 mini (60 micro)"],
          ["Rewards (Funded)", "Daily (EOD balance at buffer $26,100 / $52,100 / $102,600 + $500 profit in the cycle)"],
          ["Min Withdrawal", "$250 (all sizes)"],
          ["Max Withdrawal", "$800 / $1,200 / $2,500"],
          ["Reward Share", "90%"],
          ["Consistency (Funded)", "None"],
          ["Platforms", "NinjaTrader · Tradovate · TradingView"],
          ["Promo Code", "CHAMP"]
        ]
      }
    ],
    "plansSummary": [
      {
        "name": "FLEX",
        "featured": true,
        "rules": {
          "Account Sizes": "50K · 100K · 150K",
          "Profit Target": "$2,500 · $5,000 · $8,000",
          "Max Drawdown": "$1,500 · $2,500 · $4,000",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "None",
          "Min. Trading Days": "None eval · 5 benchmark funded",
          "Consistency Rule": "40% eval · none funded",
          "Payout Split": "95% Trader",
          "Payout Frequency": "After 5-day benchmark cycle",
          "Max Payout": "50% of profit · $1,500 · $2,500 · $4,000",
          "Activation Fee": "None (one-time fee)",
          "Reset Fee": "See checkout",
          "Platforms": "NinjaTrader · Tradovate · TradingView",
          "Promo Code": "CHAMP",
          "Notes": "No daily loss limit · news trading allowed"
        }
      },
      {
        "name": "LEGACY",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K",
          "Profit Target": "$1,250 · $3,000 · $6,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,000",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "None",
          "Min. Trading Days": "None eval · 5 benchmark funded",
          "Consistency Rule": "40% eval · none funded",
          "Payout Split": "80% Trader",
          "Payout Frequency": "After 5-day benchmark cycle",
          "Max Payout": "50% of profit · $3,000 · $6,000 · $6,000",
          "Activation Fee": "None (one-time fee)",
          "Reset Fee": "See checkout",
          "Platforms": "NinjaTrader · Tradovate · TradingView",
          "Promo Code": "CHAMP",
          "Notes": "Lowest targets · funded contract limits rise to 3/5/7 mini"
        }
      },
      {
        "name": "RAPID — PRO",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K",
          "Profit Target": "$1,500 · $3,000 · $5,000",
          "Max Drawdown": "$1,000 · $2,000 · $2,500",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "None",
          "Min. Trading Days": "1 (pass in a day)",
          "Consistency Rule": "None eval · 40% funded",
          "Payout Split": "90% Trader",
          "Payout Frequency": "Every 3 days",
          "Max Payout": "$800 · $1,200 · $2,500",
          "Activation Fee": "None (one-time fee)",
          "Reset Fee": "See checkout",
          "Platforms": "NinjaTrader · Tradovate · TradingView",
          "Promo Code": "CHAMP",
          "Notes": "1-day pass · no DLL · optional DLL add-on lowers price to $59.99 / $129.99 / $229.99 · $250 min withdrawal · concludes after 5 rewards"
        }
      },
      {
        "name": "RAPID — DAILY",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K",
          "Profit Target": "$1,500 · $3,000 · $5,000",
          "Max Drawdown": "$1,000 · $2,000 · $2,500",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "$500 · $1,000 · $1,250",
          "Min. Trading Days": "1 (pass in a day)",
          "Consistency Rule": "None",
          "Payout Split": "90% Trader",
          "Payout Frequency": "Daily",
          "Max Payout": "$800 · $1,200 · $2,500",
          "Activation Fee": "None (one-time fee)",
          "Reset Fee": "See checkout",
          "Platforms": "NinjaTrader · Tradovate · TradingView",
          "Promo Code": "CHAMP",
          "Notes": "Daily payouts · has a daily loss limit"
        }
      }
    ],
    "note": "FundedNext Futures offers Flex (50K-150K, 95% split), Legacy (25K-100K, 80% split) and Rapid (25K-100K, 1-day pass, Pro or Daily). All use end-of-day drawdown and allow news trading. Platforms: NinjaTrader, Tradovate, TradingView. Limits: up to 5 active FundedNext (funded) accounts per user and per household, max 10 issued per calendar month; challenges up to $750K combined allocation. Copying your own trades between your own accounts (even across firms) is allowed; signal services and group trading are not. FundedNext also sells a $50K Direct account (no challenge, 20% perpetual consistency, $2,100 buffer, $800-$1,200 per withdrawal, 90% share; offer $169.99). Prices reflect promotional pricing at last check — confirm the current one-time fee at checkout. Code CHAMP."
  }
};

/**
 * Canonical firm display order. Pages iterate this for consistent ordering.
 */
window.FIRM_ORDER = [
  "tradeify",
  "lucid-trading",
  "fundednext",
  "alpha-futures",
  "apex-trader",
  "take-profit",
  "top-one-futures",
  "my-funded-futures"
];

/**
 * Helper: array of firm objects in canonical order.
 * Filters firms with live === false unless includeHidden is true.
 */
window.getFirms = function(includeHidden) {
  return window.FIRM_ORDER
    .map(function(slug) { return window.FIRMS[slug]; })
    .filter(function(f) { return f && (includeHidden || f.live !== false); });
};

/**
 * Helper: get a firm by slug.
 */
window.getFirm = function(slug) {
  return window.FIRMS[slug];
};
