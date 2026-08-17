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
 * LAST DATA UPDATE — June 08, 2026 (full plan-rules refresh from ops sheet)
 *   Alpha:      Zero (one-day pass · flat 90% · $0 activation) · Advanced (90% day-1 · $149 activation · no news restrictions) · Standard (LEGACY — removed from website 05/01/26, active for prior accounts only)
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
    "rating": 4.7,
    "reviewCount": 160,
    "country": "US",
    "maxAllocation": "$150K",
    "platformsList": ["Tradovate","WealthCharts","Tradesea","Rithmic"],
    "payoutTotal": "$5M+",
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
      "payouts": "Daily option (Select Daily) + 5-day payout (Growth, Select Flex, Lightning)"
    },
    "boxMore": {
      "deal": "Use code CHAMP at checkout. As of 03/31/26 Tradeify removed monthly subscriptions — all plans are now one-time payments. Tradesea and Rithmic data feeds added.",
      "programs": "GROWTH — One-time payment · 25K-150K · Eval + Funded (35% funded consistency · 5-day payouts · 5 max accounts)\nSELECT — One-time payment · 25K-150K · Eval, then choose Daily or Flex funding path\nLIGHTNING — One-time payment · 25K-150K · 20% consistency · 5-day payouts · 5 max accounts",
      "rules": "Growth Eval (25K-150K): Profit target $1,500 / $3,000 / $6,000 / $9,000 · Drawdown $1,000 / $2,000 / $3,500 / $5,000 · DLL $600 / $1,250 / $2,500 / $3,750\nSelect Eval (25K-150K): Profit target $1,500 / $3,000 / $6,000 / $9,000 · Drawdown $1,000 / $2,000 / $3,000 / $4,500 · No DLL · 40% consistency\nLightning (25K-150K): 20% consistency · DLL none on 25K then $1,250 / $2,500 / $3,000",
      "payouts": "Growth funded: 5-day payout frequency · 35% funded consistency · 10 max accounts\nSelect Daily path: daily payouts · max payout $600 / $1,000 / $1,500 / $2,500 (25K-150K)\nSelect Flex path: 5-day payout · max payout $1,250 / $3,000 / $4,000 / $5,000 · no DLL\nLightning: 5-day payout · 5 max accounts"
    },
    "programs": [
      "Growth — eval then funded (35% consistency, 5-day payouts, 5 max accounts)",
      "Select — eval, then choose Daily or Flex funding path",
      "Lightning — 25K-150K with 20% consistency, 5-day payouts"
    ],
    "rules": [
      "Pricing: One-time payments — Growth $59 / $87 / $153 / $221 (25K-150K), Select $65 / $99 / $159 / $221, Lightning $207 / $295 / $396 / $478",
      "Growth reset fees: $60 / $95 / $169 / $229 (25K-150K)",
      "Select reset fees: $75 / $109 / $169 / $239 (25K-150K)",
      "Activation fee: None on all plans",
      "Consistent Trader Reward Pool (Select): unlock larger reward pools with consistency below 40% and never exceeding 75% of max drawdown"
    ],
    "payouts": [
      "Growth: 5-day payout frequency, 35% funded consistency",
      "Select Daily: daily payouts, max $600 / $1,000 / $1,500 / $2,500 (25K-150K)",
      "Select Flex: 5-day payout, max $1,250 / $3,000 / $4,000 / $5,000 (25K-150K)",
      "Lightning: 5-day payout, 5 max accounts"
    ],
    "platforms": ["Tradovate · WealthCharts · Tradesea / Rithmic"],
    "warning": "Tradeify changed to one-time payments on 03/31/26 and added Tradesea/Rithmic data feeds. Always confirm current checkout pricing before purchasing.",
    "plansDetailed": [
      {
        "name": "GROWTH",
        "featured": true,
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["One-Time Payment", "$59 / $87 / $153 / $221"],
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
          ["One-Time Payment", "$65 / $99 / $159 / $221"],
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
          ["Max Payout", "$600 / $1,000 / $1,500 / $2,500 (25K-150K)"],
          ["Daily Loss Limit", "$500 / $1,000 / $1,250 / $1,750"],
          ["Max Drawdown", "$1,000 / $2,000 / $2,500 / $3,500"],
          ["Consistency (Funded)", "None"]
        ]
      },
      {
        "name": "SELECT — Flex Path",
        "rules": [
          ["Payout Frequency", "5 days"],
          ["Max Payout", "$1,250 / $3,000 / $4,000 / $5,000 (25K-150K)"],
          ["Daily Loss Limit", "None"],
          ["Max Drawdown", "$1,000 / $2,000 / $3,000 / $4,500"],
          ["Consistency (Funded)", "None"]
        ]
      },
      {
        "name": "LIGHTNING",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["One-Time Payment", "$207 / $295 / $396 / $478"],
          ["Daily Loss Limit", "None (25K) / $1,250 / $2,500 / $3,000"],
          ["Max Drawdown", "$1,000 / $2,000 / $4,000 / $5,250"],
          ["Consistency", "20%"],
          ["Payout Frequency", "5 days"],
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
          "Max Payout": "No cap",
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
          "Max Payout": "$600 · $1,000 · $1,500 · $2,500",
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
          "Max Payout": "$1,250 · $3,000 · $4,000 · $5,000",
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
          "Consistency Rule": "20%",
          "Payout Split": "Straight to Funded",
          "Payout Frequency": "5 days",
          "Max Payout": "No cap",
          "Activation Fee": "None (one-time payment)",
          "Reset Fee": "Straight To Funded",
          "Platforms": "Tradovate · WealthCharts · Tradesea / Rithmic",
          "Promo Code": "CHAMP"
        }
      }
    ],
    "note": "Tradeify removed subscriptions and switched to one-time payments on 03/31/26. Tradesea and Rithmic data feeds added on the same date. Growth and Select cover 25K-150K. Select lets you pick Daily payouts or Flex (no DLL) after passing the evaluation. Lightning pricing: $207 / $295 / $396 / $478 (25K-150K). Always confirm current checkout pricing."
  },
  "lucid-trading": {
    "slug": "lucid-trading",
    "rating": 4.7,
    "reviewCount": 50,
    "country": "US",
    "maxAllocation": "$150K",
    "platformsList": ["Tradovate","NinjaTrader","TradingView","TradeSea","MotiveWave","Quantower"],
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
    "summary": "Lucid runs four futures account paths: Pro (full ladder, 1-day pass, 3-day payouts), Flex (optional DLL, no funded consistency, scaling plan), Daily (configurable eval + daily payouts), and Direct (straight to funded, no eval). All pay a 90/10 split and use the LucidScale DLL model (60% of peak EOD balance above your initial trail) on funded accounts. Free activation on Pro, Flex and Daily. Platforms: Tradovate, NinjaTrader, TradingView, TradeSea, MotiveWave, Quantower. Code CHAMP applies at checkout.",
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
      "payouts": "Pro 3-day payouts · Daily daily payouts · Flex 5-day · Direct 5-day min"
    },
    "boxMore": {
      "deal": "Use code CHAMP at checkout. Four account paths — Pro for the full size ladder with 3-day payouts, Flex for a scaling plan with no funded consistency, Daily for a configurable eval with daily payouts, Direct to skip the evaluation entirely.",
      "programs": "LUCID PRO\nProfit Target: $1,250 / $3,000 / $6,000 / $9,000 (25K-150K)\nMax Loss (EOD): $1,000 / $2,000 / $3,000 / $4,500\nDLL: $600 / $1,200 / $1,800 / $2,700 (optional)\n\nLUCID FLEX\nSame targets/drawdowns as Pro · 50% eval consistency, none funded · scaling plan\n\nLUCID DAILY\nSame targets/drawdowns · configurable eval (pick EOD or Intraday drawdown, DLL on/off) · daily payouts when funded\n\nLUCID DIRECT (straight to funded)\nMax Loss (EOD): $1,000 / $2,000 / $3,500 / $5,000 · DLL: None / $1,200 / $2,100 / $3,000 · Consistency 20% · max 5 accounts",
      "rules": "PRO: Consistency 40% · pass in 1 day · Activation FREE · LucidScale DLL 60% of peak EOD above initial trail (funded)\nFLEX: 50% eval consistency · no funded consistency · scaling plan · Activation FREE\nDAILY: 50% eval consistency · no funded consistency · choose EOD/Intraday drawdown + DLL on/off · Activation FREE\nDIRECT: Consistency 20% · straight to funded · max accounts 5 · min day to payout 5",
      "payouts": "PRO: 3 days to payout · payout profit target $250 / $500 / $750 / $1,000 · 5 payouts to live\nFLEX: 5 days to payout · min days of profit 5 of $100 / $150 / $200 / $250 · 5 payouts to live\nDAILY: daily payouts · no funded consistency\nDIRECT: 5-day min to payout · 90/10 split"
    },
    "programs": [
      "Lucid Pro — full 25K-150K ladder, 1-day pass, 3-day payouts",
      "Lucid Flex — optional DLL, no funded consistency, scaling plan",
      "Lucid Daily — configurable eval (EOD/Intraday + DLL on/off), daily payouts",
      "Lucid Direct — straight to funded, no evaluation"
    ],
    "rules": [
      "Pricing (with CHAMP): Pro $70.60 / $115.40 / $180.40 / $245.50, Flex $50.30 / $90.20 / $170.60 / $250.40, Direct $230.30 / $360.50 / $490.00 / $585.20 (25K-150K). Daily pricing is configurable at checkout. Promotional pricing was active at last check — confirm at checkout.",
      "Drawdown: end-of-day (EOD) on Pro, Flex, Direct; Daily lets you pick EOD or Intraday in the eval (funded Daily is Intraday)",
      "LucidScale DLL: on funded accounts, the daily loss limit above your initial trail becomes 60% of peak EOD balance",
      "Max size: 2 / 4 / 6 / 10 minis (20 / 40 / 60 / 100 micros) by account size across all paths",
      "Reset fees: Pro $70 / $115 / $180 / $245 · Flex $50 / $90 / $170 / $250 · Direct straight to funded"
    ],
    "payouts": [
      "Pro: 3 days to payout, payout profit target $250 / $500 / $750 / $1,000, 5 payouts to live",
      "Flex: 5 days to payout, min days of profit 5 of $100 / $150 / $200 / $250, scaling plan, 5 payouts to live",
      "Daily: daily payouts, no funded consistency",
      "Direct: 5-day minimum to payout, max 5 accounts"
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
          ["Daily Loss Limit", "$600 / $1,200 / $1,800 / $2,700 (can toggle off in eval)"],
          ["Consistency", "40%"],
          ["Max Size", "2 / 4 / 6 / 10 minis (20 / 40 / 60 / 100 micros)"],
          ["Funded: DLL Below Initial Trail", "$600 / $1,200 / $1,800 / $2,700"],
          ["Funded: LucidScale DLL Above Trail", "60% of Peak EOD Balance"],
          ["Payout Profit Target (Funded)", "$250 / $500 / $750 / $1,000"],
          ["Days to Payout", "3"],
          ["Payouts to Live", "5"],
          ["Activation Fee", "FREE"],
          ["Reset Fee", "$70 / $115 / $180 / $245"],
          ["Platforms", "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower"],
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
          ["Consistency (Eval)", "50%"],
          ["Consistency (Funded)", "None"],
          ["Max Size", "2 / 4 / 6 / 10 minis (20 / 40 / 60 / 100 micros)"],
          ["Funded: Min Days of Profit", "5 of $100 / $150 / $200 / $250"],
          ["Days to Payout", "5"],
          ["Scaling Plan", "Yes"],
          ["Payouts to Live", "5"],
          ["Activation Fee", "FREE"],
          ["Reset Fee", "$50 / $90 / $170 / $250"],
          ["Platforms", "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower"],
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
          ["Consistency (Eval)", "50%"],
          ["Consistency (Funded)", "None"],
          ["Max Size", "2 / 4 / 6 / 10 minis (20 / 40 / 60 / 100 micros)"],
          ["Funded: Drawdown Type", "Intraday"],
          ["Funded: DLL", "$600 / $1,200 / $1,800 / $2,700"],
          ["Payouts", "Daily"],
          ["Activation Fee", "FREE"],
          ["Platforms", "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower"],
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
          ["Min Days to Payout", "5"],
          ["Max Accounts", "5"],
          ["Activation Fee", "Included in one-time payment"],
          ["Platforms", "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower"],
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
          "Daily Loss Limit": "$600 · $1,200 · $1,800 · $2,700 (optional)",
          "Min. Trading Days": "1-day pass · 3 to payout",
          "Consistency Rule": "40%",
          "Payout Split": "90% Trader / 10% Lucid",
          "Payout Frequency": "3 days to payout",
          "Max Payout": "No cap",
          "Activation Fee": "FREE",
          "Reset Fee": "$70 · $115 · $180 · $245",
          "Platforms": "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower",
          "Promo Code": "CHAMP",
          "Notes": "LucidScale DLL 60% of peak EOD above trail · 5 payouts to live · w/ CHAMP $70.60 · $115.40 · $180.40 · $245.50"
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
          "Daily Loss Limit": "$600 · $1,200 · $1,800 · $2,700 (optional)",
          "Min. Trading Days": "5 profit days · 5 to payout",
          "Consistency Rule": "50% eval · none funded",
          "Payout Split": "90% Trader / 10% Lucid",
          "Payout Frequency": "5 days",
          "Max Payout": "No cap",
          "Activation Fee": "FREE",
          "Reset Fee": "$50 · $90 · $170 · $250",
          "Platforms": "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower",
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
          "Daily Loss Limit": "$600 · $1,200 · $1,800 · $2,700 (optional)",
          "Min. Trading Days": "Daily payouts",
          "Consistency Rule": "50% eval · none funded",
          "Payout Split": "90% Trader / 10% Lucid",
          "Payout Frequency": "Daily",
          "Max Payout": "No cap",
          "Activation Fee": "FREE",
          "Reset Fee": "Configurable",
          "Platforms": "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower",
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
          "Min. Trading Days": "5 to payout",
          "Consistency Rule": "20%",
          "Payout Split": "90% Trader / 10% Lucid",
          "Payout Frequency": "5 days",
          "Max Payout": "No cap",
          "Activation Fee": "One-time payment $230.30 · $360.50 · $490.00 · $585.20",
          "Reset Fee": "N/A (straight to funded)",
          "Platforms": "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower",
          "Promo Code": "CHAMP",
          "Notes": "Straight to funded (no eval) · LucidScale DLL 60% peak EOD above trail (50K+) · max 5 accounts"
        }
      }
    ],
    "note": "Lucid Trading offers four futures paths: Pro (1-day pass, 3-day payouts), Flex (optional DLL, scaling plan, no funded consistency), Daily (configurable eval — choose EOD/Intraday drawdown and DLL on/off — with daily payouts), and Direct (straight to funded, no eval, max 5 accounts). All 90/10 split with the LucidScale DLL model on funded accounts (60% of peak EOD balance above the initial trail). Lucid Black is discontinued (legacy accounts only). Prices shown reflect CHAMP-coupon pricing at last check — confirm the current price at checkout. Code CHAMP."
  },
  "alpha-futures": {
    "slug": "alpha-futures",
    "rating": 4.6,
    "reviewCount": 49,
    "country": "GB",
    "maxAllocation": "$150K",
    "platformsList": ["AlphaTrader","WealthCharts","Quantower","DeepCharts"],
    "payoutTotal": "$10M+",
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
    "offerSub": "CHAMP takes 40% off at checkout across every Alpha plan — Zero, Standard, Advanced, and the new one-time Direct.",
    "summary": "Alpha Futures runs four paths as of August 2026. Zero is the cheap one-day eval pass (flat 90% split, $0 activation, monthly $89–$279 list). Standard is back on the site as a live plan (50K–150K, monthly $129–$349). Advanced is the premium eval — 90% from day one, no daily loss limit ever, no news restrictions, $15,000 per-request withdrawals (monthly $209–$489). Direct is a new one-time, straight-to-funded option (25K–150K, $349–$859) with a 20% consistency rule. Code CHAMP takes 40% off. UK-based; runs on AlphaTrader, WealthCharts, Quantower and DeepCharts.",
    "highlights": ["40% Off With CHAMP", "Zero One-Day Pass", "Advanced 90% + No DLL"],
    "bestFor": ["Biggest Discount (40%)", "One-Day Pass (Zero)", "Instant Funding (Direct)"],
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
      "deal": "Code CHAMP takes 40% off at checkout (matches the site's public ALPHA40 promo). List monthly pricing:\\n\\nZERO: $89 / $139 / $279 (25K-100K)\\nSTANDARD: $129 / $239 / $349 (50K-150K)\\nADVANCED: $209 / $349 / $489 (50K-150K)\\nDIRECT (one-time): $349 / $519 / $689 / $859 (25K-150K)\\n\\nZero and Standard carry no activation fee. Always verify current checkout pricing.",
      "programs": "ALPHA ZERO — 25K/50K/100K · one-day eval pass · flat 90% split · $0 activation · monthly $89 / $139 / $279\\nALPHA STANDARD — 50K/100K/150K · back on the site · monthly $129 / $239 / $349 · $0 activation\\nALPHA ADVANCED — 50K/100K/150K · 90% from day 1 · no DLL ever · no news restrictions · monthly $209 / $349 / $489\\nALPHA DIRECT — 25K/50K/100K/150K · one-time $349 / $519 / $689 / $859 · straight to funded · 20% consistency",
      "rules": "ZERO: no eval min days (one-day pass) · 5 qualified days to first payout · no eval consistency · 40% qualified consistency · qualified reset $79 / $119 / $249\\nSTANDARD: 2 eval days · 5 qualified days · 50% eval / 40% qualified consistency · DLL none eval, $1,000 / $2,000 / $3,000 qualified · qualified reset $109 / $199 / $289\\nADVANCED: 3 eval days · 5 qualified days · 40% eval consistency · none qualified · no DLL either stage · no news restrictions · no scaling (full contracts day 1)\\nDIRECT: straight to funded (no eval) · 20% consistency · DLL $500 / $1,000 / $2,000 / $3,000 · no scaling",
      "payouts": "ZERO: 90% flat · withdraw up to 50% of profits, up to 4x/month · payout cap $1,000 / $1,500 / $2,500 (25K-100K) · 5 winning days of $200+ to first payout\\nSTANDARD: payout cap $3,000 / $4,000 / $5,000 (50K-150K) · up to 4x/month\\nADVANCED: 90% from day 1 · request every 5 winning trading days of $200+ · withdraw up to $15,000 per request, up to 4x/month\\nDIRECT: payout cap $1,000 / $2,000 / $2,500 / $3,000 (25K-150K)\\nAll plans: max 3 funded accounts (Standard/Advanced share a $450K combined cap)"
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
      "Max accounts: 3 funded across plans; Standard and Advanced share a $450K combined cap",
      "Withdrawals: 50% of profits, up to 4x per month, after 5 winning days of $200+"
    ],
    "payouts": [
      "Zero: 90% flat · payout cap $1,000 / $1,500 / $2,500 (25K-100K) · up to 4x/month",
      "Standard: payout cap $3,000 / $4,000 / $5,000 (50K-150K) · up to 4x/month",
      "Advanced: 90% from day 1 · withdraw up to $15,000 per request · every 5 winning days of $200+",
      "Direct: payout cap $1,000 / $2,000 / $2,500 / $3,000 (25K-150K)"
    ],
    "platforms": ["AlphaTrader", "WealthCharts", "Quantower", "DeepCharts"],
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
          ["Qualified Reset Fee", "$79 / $119 / $249"],
          ["Profit Split", "90% flat"],
          ["Payout Cap", "$1,000 / $1,500 / $2,500"],
          ["Withdrawal Cadence", "Up to 50% of profits · up to 4x per month"],
          ["Max Accounts", "3 funded"],
          ["Platforms", "AlphaTrader · WealthCharts · Quantower · DeepCharts"],
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
          ["Qualified Reset Fee", "$109 / $199 / $289"],
          ["Profit Split", "90%"],
          ["Payout Cap", "$3,000 / $4,000 / $5,000"],
          ["Max Accounts", "3 funded · $450K combined cap"],
          ["Platforms", "AlphaTrader · WealthCharts · Quantower · DeepCharts"],
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
          ["Reset Fee", "None in qualified (eval reset = monthly price)"],
          ["Profit Split", "90% from day 1 (not tiered)"],
          ["Withdrawal Limit", "Up to $15,000 per request"],
          ["Payout Frequency", "Every 5 winning trading days of $200+ profit"],
          ["Max Accounts", "3 funded · $450K combined cap"],
          ["Hold Through News", "Yes — NO restrictions (Eval & Qualified)"],
          ["Scaling Plan", "None — full contract limits from day 1"],
          ["Platforms", "AlphaTrader · WealthCharts · Quantower · DeepCharts"],
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
          ["Payout Cap", "$1,000 / $2,000 / $2,500 / $3,000"],
          ["Profit Split", "90%"],
          ["Scaling Plan", "None"],
          ["Platforms", "AlphaTrader · WealthCharts · Quantower · DeepCharts"],
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
          "Max Payout": "$1,000 · $1,500 · $2,500",
          "Activation Fee": "$0 · monthly $89 / $139 / $279 (list)",
          "Reset Fee": "$79 · $119 · $249 (qualified)",
          "Platforms": "AlphaTrader · WealthCharts · Quantower · DeepCharts",
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
          "Max Payout": "$3,000 · $4,000 · $5,000",
          "Activation Fee": "$0 · monthly $129 / $239 / $349 (list)",
          "Reset Fee": "$109 · $199 · $289 (qualified)",
          "Platforms": "AlphaTrader · WealthCharts · Quantower · DeepCharts",
          "Promo Code": "CHAMP — 40% off",
          "Notes": "Back on the site in 2026 · CHAMP takes 40% off (public promo ALPHA40)"
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
          "Max Payout": "$15,000 per request",
          "Activation Fee": "None · monthly $209 / $349 / $489 (list)",
          "Reset Fee": "Eval reset = monthly price · none in qualified",
          "Platforms": "AlphaTrader · WealthCharts · Quantower · DeepCharts",
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
          "Payout Frequency": "4x a month (5 winning days)",
          "Max Payout": "$1,000 · $2,000 · $2,500 · $3,000",
          "Activation Fee": "None (one-time payment)",
          "Reset Fee": "N/A (one-time)",
          "Platforms": "AlphaTrader · WealthCharts · Quantower · DeepCharts",
          "Promo Code": "CHAMP — 40% off",
          "Notes": "One-time $349 / $519 / $689 / $859 (list) · straight to funded"
        }
      }
    ],
    "note": "Alpha Futures overhauled its lineup in 2026. Four plans now: Zero (one-day eval pass, flat 90% split, $0 activation, monthly $89-$279 list), Standard (back on the site, 50K-150K, monthly $129-$349), Advanced (premium eval — 90% from day 1, no DLL ever, no news restrictions, $15,000 per-request withdrawals, monthly $209-$489), and Direct (new one-time straight-to-funded, 25K-150K, $349-$859, 20% consistency). Code CHAMP takes 40% off at checkout (matching the public ALPHA40 promo). Max 3 funded accounts across plans; Standard and Advanced share a $450K combined cap. Withdrawals are 50% of profits, up to 4x per month, after 5 winning days of $200+. Pricing shown is list monthly — always verify the current checkout price."
  },
  "apex-trader": {
    "slug": "apex-trader",
    "rating": 4.4,
    "reviewCount": 1248,
    "country": "US",
    "maxAllocation": "$300K",
    "platformsList": ["Rithmic","Tradovate","WealthCharts","TradingView"],
    "payoutTotal": "$300M+",
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
    "summary": "Apex runs the biggest active CHAMP discount — 90% off the evaluation. Two account types: Intraday Trail (tighter trailing drawdown, no daily loss limit) and EOD Trail (end-of-day drawdown with a daily loss limit). Both pass in a single day, cover 25K-150K, and run on Rithmic, Tradovate, WealthCharts and TradingView. Each comes in a Standard build (lowest eval price) or a No-Activation-Fee build (higher eval price, no funded activation fee). One-time fee, no rebill, eval active 30 days.",
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
      "payouts": "Payouts every 5 trading days · 100% of first $25K then 90/10"
    },
    "boxMore": {
      "deal": "CHAMP takes 90% off the eval. Prices with the coupon:\\n\\nINTRADAY TRAIL (Standard): $16.70 / $24.90 / $39.90 / $59.90 (25K-150K)\\nINTRADAY TRAIL (No Activation Fee): $69 / $49 / $59 / $169\\nEOD TRAIL (Standard): $45 / $55 / $99 / $189\\nEOD TRAIL (No Activation Fee): $99 / $119 / $159 / $249\\n\\nOne-time fee, no rebill, eval active for 30 days, no resets. Always verify current checkout pricing.",
      "programs": "INTRADAY TRAIL — tighter trailing drawdown, NO daily loss limit\\nEOD TRAIL — end-of-day drawdown WITH a daily loss limit ($500 / $1,000 / $1,500 / $2,000)\\n\\nEach comes as Standard (lowest eval price) or No Activation Fee (higher eval, skips the funded activation fee).",
      "rules": "Min days to pass = 1\\nEval max contracts: 4 / 6 / 8 / 12 minis (25K-150K)\\nProfit target: $1,500 / $3,000 / $6,000 / $9,000\\nMax drawdown: $1,000 / $2,000 / $3,000 / $4,000\\nEOD daily loss limit: $500 / $1,000 / $1,500 / $2,000 (Intraday has none)\\nFunded consistency: 50%",
      "payouts": "Payout frequency: every 5 trading days\\nPayout split: 100% of first $25K, then 90/10\\nScaling built in for the funded (PA) account"
    },
    "programs": [
      "Intraday Trail — tighter trailing drawdown, no daily loss limit (25K-150K)",
      "EOD Trail — end-of-day drawdown with a daily loss limit (25K-150K)"
    ],
    "rules": [
      "Pricing with CHAMP (90% off): Intraday Standard $16.70 / $24.90 / $39.90 / $59.90 · Intraday No-Activation $69 / $49 / $59 / $169 · EOD Standard $45 / $55 / $99 / $189 · EOD No-Activation $99 / $119 / $159 / $249 (25K-150K)",
      "One-time fee, no rebill, evaluation active for 30 days, no resets",
      "Eval max contracts: 4 / 6 / 8 / 12 minis by account size · scaling built in for the funded account",
      "EOD Trail daily loss limit: $500 / $1,000 / $1,500 / $2,000; Intraday Trail has no daily loss limit"
    ],
    "payouts": [
      "Payout frequency: every 5 trading days",
      "Payout split: 100% of the first $25K in profit, then 90/10",
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
          ["Price — Standard (w/ CHAMP)", "$16.70 / $24.90 / $39.90 / $59.90"],
          ["Price — No Activation Fee", "$69.00 / $49.00 / $59.00 / $169.00"],
          ["Min Days to Pass", "1"],
          ["Max Contracts (Eval)", "4 / 6 / 8 / 12 minis (40 / 60 / 80 / 120 micros)"],
          ["Profit Target", "$1,500 / $3,000 / $6,000 / $9,000"],
          ["Max Drawdown", "$1,000 / $2,000 / $3,000 / $4,000"],
          ["Drawdown Type", "Intraday Trail"],
          ["Daily Loss Limit", "None"],
          ["Funded Consistency", "50%"],
          ["Payout Frequency", "Every 5 trading days"],
          ["Payout Split", "100% of first $25K, then 90/10"],
          ["Reset Fee", "N/A (one-time, no rebill)"],
          ["Platforms", "Rithmic · Tradovate · WealthCharts · TradingView"],
          ["Promo Code", "CHAMP — 90% off"]
        ]
      },
      {
        "name": "EOD Trail",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Price — Standard (w/ CHAMP)", "$45.00 / $55.00 / $99.00 / $189.00"],
          ["Price — No Activation Fee", "$99.00 / $119.00 / $159.00 / $249.00"],
          ["Min Days to Pass", "1"],
          ["Max Contracts (Eval)", "4 / 6 / 8 / 12 minis (40 / 60 / 80 / 120 micros)"],
          ["Profit Target", "$1,500 / $3,000 / $6,000 / $9,000"],
          ["Max Drawdown", "$1,000 / $2,000 / $3,000 / $4,000"],
          ["Drawdown Type", "End of Day"],
          ["Daily Loss Limit", "$500 / $1,000 / $1,500 / $2,000"],
          ["Funded Consistency", "50%"],
          ["Payout Frequency", "Every 5 trading days"],
          ["Payout Split", "100% of first $25K, then 90/10"],
          ["Reset Fee", "N/A (one-time, no rebill)"],
          ["Platforms", "Rithmic · Tradovate · WealthCharts · TradingView"],
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
          "Daily Loss Limit": "None",
          "Min. Trading Days": "1 day to pass",
          "Consistency Rule": "50% funded",
          "Payout Split": "100% first $25K · then 90/10",
          "Payout Frequency": "Every 5 trading days",
          "Max Payout": "No cap",
          "Activation Fee": "None on No-Activation variant",
          "Reset Fee": "N/A (one-time, no rebill)",
          "Platforms": "Rithmic · Tradovate · WealthCharts · TradingView",
          "Promo Code": "CHAMP — 90% off",
          "Notes": "w/ CHAMP — Standard $16.70 · $24.90 · $39.90 · $59.90 · No-Activation $69 · $49 · $59 · $169"
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
          "Payout Split": "100% first $25K · then 90/10",
          "Payout Frequency": "Every 5 trading days",
          "Max Payout": "No cap",
          "Activation Fee": "None on No-Activation variant",
          "Reset Fee": "N/A (one-time, no rebill)",
          "Platforms": "Rithmic · Tradovate · WealthCharts · TradingView",
          "Promo Code": "CHAMP — 90% off",
          "Notes": "w/ CHAMP — Standard $45 · $55 · $99 · $189 · No-Activation $99 · $119 · $159 · $249"
        }
      }
    ],
    "note": "Apex Trader Funding runs two evaluation types: Intraday Trail (tighter trailing drawdown, no daily loss limit) and EOD Trail (end-of-day drawdown with a daily loss limit of $500 / $1,000 / $1,500 / $2,000 across 25K-150K). Both pass in one day, target $1,500 / $3,000 / $6,000 / $9,000, and cap drawdown at $1,000 / $2,000 / $3,000 / $4,000. CHAMP takes 90% off the eval; each type comes as Standard (lowest eval price) or No Activation Fee (higher eval, skips the funded activation fee). Funded accounts pay 100% of the first $25K then 90/10, with payouts every 5 trading days and a 50% consistency rule. One-time fee, no rebill — always verify current checkout pricing. Code CHAMP."
  },
  "take-profit": {
    "slug": "take-profit",
    "rating": 4.5,
    "reviewCount": 180,
    "country": "US",
    "maxAllocation": "$150K",
    "platformsList": ["Rithmic","Tradovate"],
    "payoutTotal": "$60M+",
    "payoutCount": "18,000+",
    "payoutAvg": "$3,300",
    "payoutLargest": "$35K",
    "payoutMedianTime": "2 days",
    "name": "Take Profit Trader",
    "initials": "TP",
    "logo": "/logos/takeprofit.png",
    "logoText": "TP",
    "affiliateUrl": "https://takeprofittrader.com/?referralCode=CHAMP",
    "type": "Evaluation · 25K-150K",
    "tagline": "Evaluation · DLL removed",
    "badge": null,
    "featured": false,
    "live": true,
    "tags": ["no-dll", "evaluation"],
    "filters": ["evaluation", "nodll"],
    "promo": {
      "code": "CHAMP",
      "discount": "$40 off"
    },
    "offerLine": "$40 OFF",
    "offerSub": "DLL removed across all sizes · Clean account ladder",
    "summary": "Take Profit Trader keeps the rule set simple — DLL removed across all five account sizes (25K through 150K). Clean ladder, straightforward drawdowns, code CHAMP for $40 off.",
    "highlights": ["DLL Removed (All Sizes)", "Simple Ladder", "$40 Off"],
    "bestFor": ["No DLL", "Straightforward Rules", "Simple Ladder"],
    "stats": [
      ["Discount", "$40 Off"],
      ["Code", "CHAMP"],
      ["DLL", "Removed across all"]
    ],
    "boxPreviews": {
      "deal": "$40 off · Code CHAMP at checkout",
      "programs": "Single evaluation product · 25K, 50K, 75K, 100K, 150K",
      "rules": "DLL REMOVED on all 5 sizes",
      "payouts": "See Take Profit Trader site for current payout structure"
    },
    "boxMore": {
      "deal": "Apply code CHAMP at checkout for $40 off Take Profit Trader.",
      "programs": "Five account sizes: 25K, 50K, 75K, 100K, 150K\nSingle evaluation path — no separate plan tiers",
      "rules": "All sizes have DLL REMOVED\nProfit Target: $1,500 / $3,000 / $4,500 / $6,000 / $9,000 (25K-150K)\nDrawdown: $1,500 / $2,000 / $2,500 / $3,000 / $4,500\nMax Size: 3 / 6 / 9 / 12 / 15 minis (30 / 60 / 90 / 120 / 150 micros)",
      "payouts": "See Take Profit Trader site for current payout cadence and split."
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
    "payouts": ["See Take Profit Trader site for current payout structure"],
    "platforms": ["See Take Profit Trader site for current platform list"],
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
          "Min. Trading Days": "5 Trading Days",
          "Consistency Rule": "50%",
          "Payout Split": "PRO 80%/20% PRO+ 90%/20%",
          "Payout Frequency": "Daily",
          "Max Payout": "No cap",
          "Activation Fee": "MONTHLY FEE $150 · $170 · $245 · $330 · $360",
          "Reset Fee": "$79 · $99 · $139 · $169 · $199",
          "Platforms": "TradingView · NinjaTrader · Tradovate · Bookmap · MultiCharts · Trade Navigator · R|Trader · VolFix · ATAS · Investor R/T · Quantower · Finamark · Jigsaw Trader",
          "Promo Code": "CHAMP"
        }
      }
    ],
    "note": "Take Profit Trader keeps the rule set simple — DLL has been REMOVED across all five account sizes (25K through 150K). Drawdowns: $1,500 / $2,000 / $2,500 / $3,000 / $4,500. Max contracts: 3 / 6 / 9 / 12 / 15 minis by size. Use CHAMP for $40 off."
  },
  "top-one-futures": {
    "slug": "top-one-futures",
    "rating": 4.7,
    "reviewCount": 75,
    "country": "US",
    "maxAllocation": "$200K",
    "platformsList": ["Rithmic","NinjaTrader","TradingView"],
    "payoutTotal": "$25M+",
    "payoutCount": "8,000+",
    "payoutAvg": "$3,100",
    "payoutLargest": "$31K",
    "payoutMedianTime": "1 day",
    "name": "Top One Futures",
    "initials": "TO",
    "logo": "/logos/topone.png",
    "logoText": "TO",
    "affiliateUrl": "https://toponefutures.com/?linkId=lp_707970&sourceId=thetradingchamp&tenantId=toponefutures",
    "type": "Elite · Instant Sim · S2F · Ignite",
    "tagline": "Elite · Instant Sim Funded · S2F Sim PRO · Ignite",
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
    "offerSub": "Elite · Instant Sim · S2F · Ignite — 4 paths",
    "summary": "Top One Futures runs four paths: 1-Step Elite Challenge (1-day pass), Instant Sim Funded (skip the eval entirely), S2F Sim PRO (10-day min trading days), and Ignite (instant funding on smaller accounts). High discount with code CHAMP.",
    "highlights": ["Multiple Paths", "Instant Options", "High Current Discount"],
    "bestFor": ["Highest Discount", "Path Variety", "Instant Options"],
    "stats": [
      ["Discount", "60% Off"],
      ["Code", "CHAMP"],
      ["Paths", "Elite · Instant · S2F · Ignite"]
    ],
    "boxPreviews": {
      "deal": "60% off · Code CHAMP at checkout",
      "programs": "1-Step Elite, Instant Sim Funded, S2F Sim PRO, Ignite",
      "rules": "1-day pass on Elite · 25% funded consistency · Instant Sim has 20% consistency",
      "payouts": "See site · Multiple plan-specific payout cadences"
    },
    "boxMore": {
      "deal": "Use code CHAMP at checkout — currently 60% off across Top One Futures plans.",
      "programs": "1-STEP ELITE — Challenge with 1-day pass · 25K-150K\nINSTANT SIM FUNDED — Skip the eval, start funded · 25K-150K\nS2F SIM PRO — 10-day min trading days, ESS 20% · 25K-150K\nIGNITE — Instant funding on 25K-100K",
      "rules": "1-Step Elite: 1 day to pass · No challenge consistency · 25% funded consistency\nInstant Sim: 20% consistency · Skip evaluation\nS2F: ESS 20% · Min 10 trading days to payout\nIgnite: 15% consistency · Instant funded",
      "payouts": "See Top One Futures site for current payout structure on each plan."
    },
    "programs": [
      "1-Step Elite Challenge — 1-day pass funded path",
      "Instant Sim Funded — skip eval, start funded",
      "S2F Sim PRO — 10-day min trading days",
      "Ignite — instant funding on smaller accounts (25K-100K)"
    ],
    "rules": [
      "Elite: 1 day to pass, $149 activation fee, 3 max accounts",
      "Instant Sim: 20% consistency, max 3-5 accounts",
      "S2F Sim PRO: 20% ESS, 10-day min trading days, max 3-10 accounts",
      "Ignite: 15% consistency, max 6-10 accounts"
    ],
    "payouts": ["See Top One Futures site for current payout cadence"],
    "platforms": ["See Top One Futures site for current platform list"],
    "warning": null,
    "plansDetailed": [
      {
        "name": "1-STEP ELITE Challenge",
        "featured": true,
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Profit Target", "$1,500 / $3,000 / $6,000 / $9,000"],
          ["Daily Loss Limit", "$625 / $1,250 / $2,500 / $3,750"],
          ["Max Drawdown", "$1,000 / $2,000 / $3,000 / $4,500"],
          ["Max Contracts", "1 mini (10 micros) / 4 minis (40 micros) / 8 minis (80 micros) / 12 minis (120 micros)"],
          ["Min Days to Pass", "1"],
          ["Consistency (Challenge)", "None"],
          ["Consistency (Funded)", "25%"],
          ["Reset Fee", "$29 / $39 / $79 / $119"],
          ["Activation Fee", "$149"],
          ["Max Accounts", "3"],
          ["Monthly Fee", "$45 / $68 / $136 / $201"]
        ]
      },
      {
        "name": "Instant Sim Funded",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Daily Loss Limit", "$625 / $1,250 / $2,500 / $3,750"],
          ["Max Drawdown", "$1,000 / $2,000 / $4,000 / $6,000"],
          ["Max Contracts", "1 mini (10 micros) / 4 minis (40 micros) / 8 minis (80 micros) / 12 minis (120 micros)"],
          ["Consistency", "20%"],
          ["Max Accounts", "5 (25K-50K) · 3 (100K-150K)"],
          ["One-Time Fee", "$272 / $441 / $534 / $610"]
        ]
      },
      {
        "name": "S2F Sim PRO Account",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Daily Loss Limit", "$500 / $1,000 / $2,000 / $3,000"],
          ["Max Drawdown", "$1,000 / $1,625 / $3,250 / $5,000"],
          ["Max Contracts", "1 mini (10 micros) / 4 minis (40 micros) / 8 minis (80 micros) / 12 minis (120 micros)"],
          ["Equity Stability Score (ESS)", "20%"],
          ["Min Trading Days to Payout", "10"],
          ["Max Accounts", "10"],
          ["One-Time Fee", "$141 / $232 / $348 / $400"]
        ]
      },
      {
        "name": "IGNITE Instant Funding",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K"],
          ["Daily Loss Limit", "$500 / $1,000 / $2,000"],
          ["Max Drawdown", "$1,000 / $2,000 / $4,000"],
          ["Max Contracts", "1 mini (10 micros) / 3 minis (30 micros) / 5 minis (50 micros)"],
          ["Consistency", "15%"],
          ["Max Accounts", "10 (25K-50K) · 6 (100K)"],
          ["One-Time Fee", "$120 / $219 / $310"]
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
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,500",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "$625 · $1,250 · $2,500 · $3,750",
          "Min. Trading Days": "5 Green Days for Payout 0 Min days for Eval",
          "Consistency Rule": "None challenge · 40% Funded",
          "Payout Split": "90% / 10%",
          "Payout Frequency": "Daily",
          "Max Payout": "No cap",
          "Activation Fee": "$139 · $189 · $259 · $359",
          "Reset Fee": "$35 FOR ALL (Eval) $299 · $499 · $849 · $1,349 (Funded)",
          "Platforms": "Tradovate · NinjaTrader · Tradingview",
          "Promo Code": "CHAMP"
        }
      },
      {
        "name": "INSTANT SIM FUNDED",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "Instant funded path",
          "Max Drawdown": "$1,000 · $2,000 · $4,000 · $6,000",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "$625 · $1,250 · $2,500 · $3,750",
          "Min. Trading Days": "Instant funded (10 days 7 Green Days to Payout)",
          "Consistency Rule": "20%",
          "Payout Split": "90% / 10%",
          "Payout Frequency": "Daily",
          "Max Payout": "No cap",
          "Activation Fee": "One-time $272 · $441 · $534 · $610",
          "Reset Fee": "Straight To Funded",
          "Platforms": "Tradovate · NinjaTrader · Tradingview",
          "Promo Code": "CHAMP"
        }
      },
      {
        "name": "ELITE DAILY",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K",
          "Profit Target": "$1,500 · $3,000 · $6,000",
          "Max Drawdown": "$1,000 · $1,625 · $3,250",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "$500 · $1,000 · $3,000",
          "Min. Trading Days": "Pass Eval in 1 Day 5 Green Days",
          "Consistency Rule": "40% (Challenge) NONE (Funded)",
          "Payout Split": "90% / 10%",
          "Payout Frequency": "Daily",
          "Max Payout": "No cap",
          "Activation Fee": "NONE",
          "Reset Fee": "$89 · $119 · $219",
          "Platforms": "Tradovate · NinjaTrader · Tradingview",
          "Promo Code": "CHAMP",
          "Notes": "Monthly fee $89 / $109 / $199"
        }
      },
      {
        "name": "IGNITE",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "Instant funded path",
          "Max Drawdown": "$1,000 · $2,000 · $4,000 · $6,000",
          "Drawdown Type": "EOD",
          "Daily Loss Limit": "$500 · $1,000 · $2,000 · $3,000",
          "Min. Trading Days": "Instant funded (10 days 7 Green Days to payout)",
          "Consistency Rule": "15%",
          "Payout Split": "90% / 10%",
          "Payout Frequency": "Daily",
          "Max Payout": "No cap",
          "Activation Fee": "One-time $120 · $219 · $310",
          "Reset Fee": "Straight To Funded",
          "Platforms": "Tradovate · NinjaTrader · Tradingview",
          "Promo Code": "CHAMP"
        }
      }
    ],
    "note": "Top One Futures runs four paths: 1-Step Elite Challenge (1-day pass with $149 activation), Instant Sim Funded (skip eval, 20% consistency), S2F Sim PRO (10-day min, ESS 20%), and Ignite (instant funding on 25K-100K with 15% consistency). High discount with code CHAMP."
  },
  "my-funded-futures": {
    "slug": "my-funded-futures",
    "rating": 4.5,
    "reviewCount": 234,
    "country": "US",
    "maxAllocation": "$450K",
    "platformsList": ["NinjaTrader","Tradovate","TradingView","Quantower","DeepChart","Fintevo"],
    "payoutTotal": "$80M+",
    "payoutCount": "25,000+",
    "payoutAvg": "$3,200",
    "payoutLargest": "$42K",
    "payoutMedianTime": "6 hours",
    "name": "My Funded Futures",
    "initials": "MF",
    "logo": "/logos/myfunded.png",
    "logoText": "MF",
    "affiliateUrl": "https://www.myfundedfutures.com/challenge?ref=5148&code=champ",
    "type": "Rapid · Rapid EOD · Pro · Builder",
    "tagline": "Rapid · Rapid EOD · Pro · Builder — No DLL, no activation fee",
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
    "offerSub": "Rapid · Rapid EOD · Pro · Builder — No DLL, no activation fee",
    "summary": "My Funded Futures runs four products as of August 2026: Rapid (daily payouts, 90/10, intraday-trailing once funded), the new limited-time Rapid EOD (daily payouts but end-of-day drawdown in funded), Pro (bi-weekly payouts, 80/20, up to $100K per cycle), and Builder (25K/50K subscription eval, 48-hour payouts, and a five-payout ladder to a real Live account at Blue Row Capital). No plan has a daily loss limit or an activation fee. Code CHAMP takes up to 50% off. Flex has been retired.",
    "highlights": ["No DLL Across All", "No Activation Fee", "Daily Payouts (Rapid)"],
    "bestFor": ["No DLL", "No Activation Fee", "Frequent Payouts"],
    "stats": [
      ["Discount", "Up to 50%"],
      ["Plans", "Rapid · Rapid EOD · Pro · Builder"],
      ["DLL", "None across all"]
    ],
    "boxPreviews": {
      "deal": "Use code CHAMP at checkout · up to 50% off",
      "programs": "Rapid (daily) · Rapid EOD (daily, EOD drawdown) · Pro (bi-weekly) · Builder (path to live)",
      "rules": "No DLL · no activation fee · 50% eval consistency (30% on Rapid EOD, none on Builder eval)",
      "payouts": "Daily (Rapid / Rapid EOD) · bi-weekly (Pro) · every 48h (Builder sim)"
    },
    "boxMore": {
      "deal": "Use code CHAMP at checkout (up to 50% off). MFF also rotates public per-plan promos (RAPID, EOD, UNCAPPED, builder) — CHAMP is Champ's affiliate code. List monthly pricing (starts): Rapid $79 (25K) / $157 (50K) · Pro $227 (50K, ~$114 promo) · Builder $63 (25K) / $125 (50K). Always verify current checkout pricing.",
      "programs": "RAPID — daily payouts · 25K-150K · 90/10 · EOD in eval, intraday trailing once funded (locks after a $100 buffer) · 2-day pass · 50% eval consistency\\nRAPID EOD — limited-time · daily payouts but EOD drawdown in funded (no intraday trail) · 90/10 · 4-day pass · 30% eval consistency\\nPRO — bi-weekly payouts · 50K-150K · 80/20 · up to $100K per cycle · no Tier-1 news · 2-day pass\\nBUILDER — 25K/50K subscription eval · EOD trailing · 48-hour payouts · 80/20 · five-payout ladder to a real Live account at Blue Row Capital",
      "rules": "All plans: NO DLL (Builder 50K has a $1,000 soft pause), NO activation fee\\nRAPID: 2 min days · 50% eval consistency · min payout $500\\nRAPID EOD: 4 min days · 30% eval consistency · min payout $500\\nPRO: 2 min days · 50% eval consistency · max contracts 5 / 10 / 15 mini · no Tier-1 news · must trade every 7 days · min payout $1,000\\nBUILDER: 1-day pass · no eval consistency · 50% consistency at payout stage · min 2 qualifying days per cycle",
      "payouts": "RAPID / RAPID EOD: daily · min payout $500 · scale up to $100K in payouts\\nPRO: bi-weekly (14 days from first trade) · min payout $1,000 · up to $100K per cycle · 3 consecutive payouts triggers Live risk review\\nBUILDER (sim): every 48 hours · min payout $250 (25K) / $500 (50K) · max $1,000 (25K) / $2,000 (50K) per cycle · 5 approved payouts unlocks a real Live account at Blue Row Capital (daily payouts, 80/20, EOD trailing, no DLL, no consistency)"
    },
    "programs": [
      "Funded Futures Rapid — daily payouts · 25K-150K · 90/10 · intraday trailing once funded · no DLL · no activation fee",
      "Rapid EOD — limited-time · daily payouts with end-of-day drawdown in funded · 90/10 · no DLL",
      "Funded Futures Pro — bi-weekly payouts · 50K-150K · 80/20 · up to $100K per cycle · no DLL",
      "Builder — 25K/50K subscription eval · 48-hour payouts · 80/20 · five-payout ladder to a real Live account"
    ],
    "rules": [
      "All plans: NO daily loss limit (Builder 50K has a $1,000 soft pause), NO activation fee",
      "Rapid: EOD drawdown in eval, intraday trailing once funded (locks permanently after a $100 buffer), 2-day pass, 50% eval consistency",
      "Rapid EOD: daily payouts but EOD drawdown in the funded stage too, 4-day pass, 30% eval consistency (limited-time plan)",
      "Pro: EOD trailing, 80/20, bi-weekly payouts up to $100K per cycle, no Tier-1 news trading, must trade at least every 7 days",
      "Builder: 25K/50K only, EOD trailing, 48-hour payouts, five approved sim payouts unlock a real Live funded account at Blue Row Capital",
      "Funded consistency: none on Rapid/Rapid EOD/Pro; 50% at Builder's payout stage"
    ],
    "payouts": [
      "Rapid / Rapid EOD: daily, min payout $500",
      "Pro: bi-weekly (14 days from first trade), min payout $1,000, up to $100K per cycle",
      "Builder (sim): every 48 hours, min $250 (25K) / $500 (50K); 5 payouts → real Live account",
      "Scale up to $100K in total payouts based on plan and performance"
    ],
    "platforms": ["NinjaTrader", "Tradovate", "TradingView", "Quantower", "DeepChart", "Fintevo"],
    "warning": "MFF retired the Flex plan and added a limited-time Rapid EOD variant; Builder is now 25K/50K only with 48-hour payouts. Rapid uses EOD drawdown in evaluation but switches to intraday trailing once funded. Always confirm current plan availability and checkout pricing.",
    "plansDetailed": [
      {
        "name": "Funded Futures Rapid",
        "featured": true,
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Monthly Price (from)", "$79 (25K) · $157 (50K)"],
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
          ["Platforms", "NinjaTrader · Tradovate · TradingView · Quantower · DeepChart · Fintevo"],
          ["Promo Code", "CHAMP"]
        ]
      },
      {
        "name": "Rapid EOD (limited-time)",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Monthly Price (50K)", "$126 promo (from $157)"],
          ["Profit Target", "$1,500 / $3,000 / $6,000 / $9,000"],
          ["Max Drawdown", "$1,000 / $2,000 / $3,000 / $4,500"],
          ["Drawdown Type", "End-of-Day (Eval & Funded) — no intraday trail"],
          ["Daily Loss Limit", "None"],
          ["Min Trading Days", "4"],
          ["Consistency (Eval)", "30%"],
          ["Consistency (Funded)", "None"],
          ["Profit Split", "90% / 10%"],
          ["Payout Frequency", "Daily"],
          ["Minimum Payout", "$500"],
          ["Activation Fee", "$0"],
          ["Platforms", "NinjaTrader · Tradovate · TradingView · Quantower · DeepChart · Fintevo"],
          ["Promo Code", "CHAMP (public promo: EOD)"]
        ]
      },
      {
        "name": "Funded Futures Pro",
        "rules": [
          ["Account Sizes", "50K / 100K / 150K"],
          ["Monthly Price (from)", "$114 promo (50K, reg $227)"],
          ["Profit Target", "$3,000 / $6,000 / $9,000"],
          ["Max Drawdown", "$2,000 / $3,000 / $4,500"],
          ["Drawdown Type", "End-of-Day trailing"],
          ["Daily Loss Limit", "None"],
          ["Max Contracts", "5 / 10 / 15 mini"],
          ["Min Trading Days", "2"],
          ["Consistency (Eval)", "50%"],
          ["Consistency (Funded)", "None"],
          ["Profit Split", "80% / 20%"],
          ["Payout Frequency", "Bi-weekly (14 days from first trade)"],
          ["Minimum Payout", "$1,000"],
          ["Max Payout / Cycle", "$100,000"],
          ["News Restriction", "No Tier-1 news trading · must trade every 7 days"],
          ["Live Transition", "3 consecutive payouts → risk-team review"],
          ["Activation Fee", "$0"],
          ["Reset Fee", "$227 / $344 / $477"],
          ["Platforms", "NinjaTrader · Tradovate · TradingView · Quantower · DeepChart · Fintevo"],
          ["Promo Code", "CHAMP"]
        ]
      },
      {
        "name": "Builder Plan (path to Live)",
        "rules": [
          ["Account Sizes", "25K / 50K"],
          ["Monthly Price", "$63 (25K) · $125 (50K)"],
          ["Profit Target", "$1,500 (25K) · $3,000 (50K)"],
          ["Max Drawdown (EOD trailing)", "$1,000 (25K) · $2,000 (50K)"],
          ["Daily Loss Limit", "None (25K) · $1,000 soft pause (50K)"],
          ["Min Days to Pass", "1"],
          ["Consistency (Eval)", "None"],
          ["Consistency (Payout stage)", "50%"],
          ["Profit Split", "80% / 20%"],
          ["Payout Frequency (Sim)", "Every 48 hours"],
          ["Minimum Payout", "$250 (25K) · $500 (50K)"],
          ["Max Payout / Cycle", "$1,000 (25K) · $2,000 (50K)"],
          ["Activation Fee", "$0"],
          ["Path to Live", "5 approved sim payouts → real Live account at Blue Row Capital (daily payouts, 80/20, EOD trailing, no DLL, no consistency)"],
          ["Platforms", "NinjaTrader · Tradovate · TradingView · Quantower · DeepChart · Fintevo"],
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
          "Max Payout": "Scale up to $100K",
          "Activation Fee": "FREE · monthly from $79 (25K)",
          "Reset Fee": "$87 · $157 · $267 · $347",
          "Platforms": "NinjaTrader · Tradovate · TradingView · Quantower · DeepChart · Fintevo",
          "Promo Code": "CHAMP",
          "Notes": "Intraday trail locks after a $100 buffer · min payout $500"
        }
      },
      {
        "name": "RAPID EOD",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $3,000 · $6,000 · $9,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,500",
          "Drawdown Type": "EOD (eval & funded)",
          "Daily Loss Limit": "None",
          "Min. Trading Days": "4 days to pass",
          "Consistency Rule": "30% eval · none funded",
          "Payout Split": "90% / 10%",
          "Payout Frequency": "Daily",
          "Max Payout": "Scale up to $100K",
          "Activation Fee": "FREE · 50K ~$126 promo (from $157)",
          "Reset Fee": "See site (mirrors Rapid)",
          "Platforms": "NinjaTrader · Tradovate · TradingView · Quantower · DeepChart · Fintevo",
          "Promo Code": "CHAMP",
          "Notes": "Limited-time · daily payouts but EOD drawdown in funded (no intraday trail) · min payout $500"
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
          "Payout Frequency": "Bi-weekly (min $1,000)",
          "Max Payout": "$100K per cycle",
          "Activation Fee": "FREE · monthly from $114 promo (reg $227)",
          "Reset Fee": "$227 · $344 · $477",
          "Platforms": "NinjaTrader · Tradovate · TradingView · Quantower · DeepChart · Fintevo",
          "Promo Code": "CHAMP",
          "Notes": "No Tier-1 news · max contracts 5/10/15 mini · 3 payouts → Live review · trade every 7 days"
        }
      },
      {
        "name": "BUILDER PLAN",
        "featured": false,
        "rules": {
          "Account Sizes": "25K · 50K",
          "Profit Target": "$1,500 · $3,000",
          "Max Drawdown": "$1,000 · $2,000",
          "Drawdown Type": "EOD trailing",
          "Daily Loss Limit": "None (25K) · $1,000 soft pause (50K)",
          "Min. Trading Days": "1 day to pass",
          "Consistency Rule": "None eval · 50% at payout",
          "Payout Split": "80% / 20%",
          "Payout Frequency": "Every 48 hours (sim)",
          "Max Payout": "$1,000 (25K) · $2,000 (50K) per cycle",
          "Activation Fee": "FREE · monthly $63 (25K) · $125 (50K)",
          "Reset Fee": "$63 · $125",
          "Platforms": "NinjaTrader · Tradovate · TradingView · Quantower · DeepChart · Fintevo",
          "Promo Code": "CHAMP",
          "Notes": "5 sim payouts → real Live account at Blue Row Capital · min payout $250 / $500"
        }
      }
    ],
    "note": "My Funded Futures runs four products as of August 2026: Rapid (daily payouts, 90/10, EOD drawdown in eval then intraday trailing once funded — locks after a $100 buffer), the limited-time Rapid EOD (daily payouts but end-of-day drawdown in the funded stage too, 4-day pass, 30% eval consistency), Pro (bi-weekly payouts, 80/20, up to $100K per cycle, no Tier-1 news trading), and Builder (25K/50K subscription eval, 48-hour sim payouts, and a five-payout ladder to a real Live account at Blue Row Capital). No plan carries a daily loss limit (Builder's 50K has a $1,000 soft pause) or an activation fee. Code CHAMP takes up to 50% off; MFF also rotates public per-plan promos. Flex has been retired."
  },
  "fundednext": {
    "slug": "fundednext",
    "rating": 4.6,
    "reviewCount": 0,
    "country": "AE",
    "maxAllocation": "$150K",
    "platformsList": ["NinjaTrader","Tradovate","TradingView"],
    "payoutTotal": "$306.9M+",
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
    "summary": "FundedNext brings its track record ($306.9M+ paid across its programs) to futures with three account types. Flex pays a 95% reward share with no daily loss limit; Legacy is the low-cost path; Rapid passes in a single day with a Pro option (no DLL, rewards every 3 days) or a Daily option (daily payouts). All use end-of-day drawdown, allow news trading, and run on NinjaTrader, Tradovate and TradingView. Code CHAMP applies at checkout.",
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
      "rules": "EOD max loss limit · no DLL on Flex/Legacy/Rapid-Pro · 40% consistency in challenge",
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
      "Pricing: one-time challenge fees — Flex $69.99 / $129.99 / $249.99 (50K-150K), Legacy $79.99 / $199.99 / $239.99 (25K-100K), Rapid $79.99 / $169.99 / $279.99 (25K-100K). Promotional pricing was active at last check — confirm at checkout.",
      "Drawdown: end-of-day (EOD) max loss limit on all account types",
      "Daily loss limit: none on Flex, Legacy and Rapid Pro; Rapid Daily has a DLL ($500 / $1,000 / $1,250)",
      "Consistency: 40% during the challenge on Flex, Legacy and Rapid Pro; none on Rapid Daily",
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
    "warning": "FundedNext Futures had promotional (sale) pricing live at last check — always confirm the current one-time fee at checkout. The $306.9M+ payout figure reflects FundedNext's published total across all of its programs, not futures alone.",
    "plansDetailed": [
      {
        "name": "FLEX",
        "featured": true,
        "rules": [
          ["Account Sizes", "50K / 100K / 150K"],
          ["One-Time Fee", "$69.99 / $129.99 / $249.99"],
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
          ["Max Withdrawal", "50% of profit up to $1,500 / $2,500 / $4,000"],
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
          ["Max Withdrawal", "50% of profit up to $3,000 / $6,000 / $6,000"],
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
          ["One-Time Fee", "$79.99 / $169.99 / $279.99"],
          ["Days to Pass", "1"],
          ["Profit Target", "$1,500 / $3,000 / $5,000"],
          ["Max Loss Limit (EOD)", "$1,000 / $2,000 / $2,500"],
          ["Daily Loss Limit", "None"],
          ["Consistency (Challenge)", "None"],
          ["News Trading", "Allowed"],
          ["Max Contracts", "2 mini (20 micro) / 4 mini (40 micro) / 6 mini (60 micro)"],
          ["Rewards (Funded)", "Every 3 days"],
          ["Min Cycle Profit", "$500"],
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
          ["One-Time Fee", "$79.99 / $169.99 / $279.99"],
          ["Days to Pass", "1"],
          ["Profit Target", "$1,500 / $3,000 / $5,000"],
          ["Max Loss Limit (EOD)", "$1,000 / $2,000 / $2,500"],
          ["Daily Loss Limit", "$500 / $1,000 / $1,250"],
          ["Consistency (Challenge)", "None"],
          ["News Trading", "Allowed"],
          ["Max Contracts", "2 mini (20 micro) / 4 mini (40 micro) / 6 mini (60 micro)"],
          ["Rewards (Funded)", "Daily"],
          ["Min Cycle Profit", "$500"],
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
          "Notes": "1-day pass · no daily loss limit"
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
    "note": "FundedNext Futures offers Flex (50K-150K, 95% split), Legacy (25K-100K, 80% split) and Rapid (25K-100K, 1-day pass, Pro or Daily). All use end-of-day drawdown and allow news trading. Platforms: NinjaTrader, Tradovate, TradingView. Prices reflect promotional pricing at last check — confirm the current one-time fee at checkout. Code CHAMP."
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
