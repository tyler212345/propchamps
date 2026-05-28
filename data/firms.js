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
 * LAST DATA UPDATE — May 04, 2026
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
      "programs": "GROWTH — One-time payment · 25K-150K · Eval + Funded (35% funded consistency · 5-day payouts · 10 max accounts)\nSELECT — One-time payment · 25K-150K · Eval, then choose Daily or Flex funding path\nLIGHTNING — One-time payment · 25K-150K · 20% consistency · 5-day payouts · 5 max accounts",
      "rules": "Growth Eval (25K-150K): Profit target $1,500 / $3,000 / $6,000 / $9,000 · Drawdown $1,000 / $2,000 / $3,500 / $5,000 · DLL $600 / $1,250 / $2,500 / $3,750\nSelect Eval (25K-150K): Profit target $1,500 / $2,500 / $6,000 / $9,000 · Drawdown $1,000 / $2,000 / $3,000 / $4,500 · No DLL · 40% consistency\nLightning (25K-150K): 20% consistency · DLL none on 25K then $1,250 / $2,500 / $3,750",
      "payouts": "Growth funded: 5-day payout frequency · 35% funded consistency · 10 max accounts\nSelect Daily path: daily payouts · max payout $600 / $1,000 / $1,500 / $2,500 (25K-150K)\nSelect Flex path: 5-day payout · max payout $1,250 / $3,000 / $4,000 / $5,000 · no DLL\nLightning: 5-day payout · 5 max accounts"
    },
    "programs": [
      "Growth — eval then funded (35% consistency, 5-day payouts, 10 max accounts)",
      "Select — eval, then choose Daily or Flex funding path",
      "Lightning — 25K-150K with 20% consistency, 5-day payouts"
    ],
    "rules": [
      "Pricing: One-time payments — Growth $59 / $87 / $153 / $221 (25K-150K), Select $65 / $99 / $159 / $221, Lightning $207 / $295 / $396 / $478",
      "Growth reset fees: $60 / $95 / $169 / $229 (25K-150K)",
      "Select reset fees: $65 / $95 / $155 / $215 (25K-150K)",
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
          ["Max Accounts (Funded)", "10"],
          ["Platforms", "Tradovate · WealthCharts · Tradesea / Rithmic"],
          ["Promo Code", "CHAMP"]
        ]
      },
      {
        "name": "SELECT — Evaluation",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["One-Time Payment", "$65 / $99 / $159 / $221"],
          ["Profit Target", "$1,500 / $2,500 / $6,000 / $9,000"],
          ["Max Drawdown", "$1,000 / $2,000 / $3,000 / $4,500"],
          ["Daily Loss Limit", "None"],
          ["Consistency", "40%"],
          ["Reset Fee", "$65 / $95 / $155 / $215"],
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
          ["Daily Loss Limit", "None (25K) / $1,250 / $2,500 / $3,750"],
          ["Max Drawdown", "$1,000 / $2,000 / $4,000 / $6,000"],
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
          "Daily Loss Limit": "$600 · $1,250 · $2,500 · $3,750",
          "Max Drawdown": "$1,000 · $2,000 · $3,500 · $5,000",
          "Min. Trading Days": "None",
          "Consistency Rule": "None eval · 35% funded",
          "Payout Split": "See site for full details",
          "Payout Frequency": "5 days (funded)",
          "Platforms": "Tradovate · WealthCharts · Tradesea / Rithmic",
          "Promo Code": "CHAMP",
          "Activation Fee": "None (one-time payment)"
        }
      },
      {
        "name": "SELECT — DAILY PATH",
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $2,500 · $6,000 · $9,000",
          "Daily Loss Limit": "None eval · $500 · $1,000 · $1,250 · $1,750 funded",
          "Max Drawdown": "$1,000 · $2,000 · $2,500 · $3,500",
          "Min. Trading Days": "None",
          "Consistency Rule": "40% eval · none funded",
          "Payout Split": "See site for full details",
          "Payout Frequency": "Daily · max $600 / $1,000 / $1,500 / $2,500",
          "Platforms": "Tradovate · WealthCharts · Tradesea / Rithmic",
          "Promo Code": "CHAMP",
          "Activation Fee": "None (one-time payment)"
        }
      },
      {
        "name": "SELECT — FLEX PATH",
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $2,500 · $6,000 · $9,000",
          "Daily Loss Limit": "None",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,500",
          "Min. Trading Days": "None",
          "Consistency Rule": "40% eval · none funded",
          "Payout Split": "See site for full details",
          "Payout Frequency": "5 days · max $1,250 / $3,000 / $4,000 / $5,000",
          "Platforms": "Tradovate · WealthCharts",
          "Promo Code": "CHAMP",
          "Activation Fee": "None (one-time payment)"
        }
      },
      {
        "name": "LIGHTNING",
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "See site for full details",
          "Daily Loss Limit": "None (25K) · $1,250 · $2,500 · $3,750",
          "Max Drawdown": "$1,000 · $2,000 · $4,000 · $6,000",
          "Min. Trading Days": "None",
          "Consistency Rule": "20%",
          "Payout Split": "See site for full details",
          "Payout Frequency": "5 days",
          "Platforms": "Tradovate · WealthCharts",
          "Promo Code": "CHAMP",
          "Activation Fee": "None (one-time payment)"
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
    "name": "Lucid",
    "initials": "LU",
    "logo": "/logos/lucid.png",
    "logoText": "LU",
    "affiliateUrl": "https://lucidtrading.com/ref/TheTradingChamp/",
    "type": "Pro · Black · Flex · Direct",
    "tagline": "Pro · Black · Flex · Direct",
    "badge": "hot",
    "featured": true,
    "live": true,
    "tags": ["discount", "fast-payout", "no-dll", "instant"],
    "filters": ["evaluation", "beginner", "fast-payout", "nodll"],
    "promo": {
      "code": "CHAMP",
      "discount": "50% off"
    },
    "offerLine": "50% OFF",
    "offerSub": "Pro · Black · Flex · Direct — multi-plan lineup, 1-day Pro pass",
    "summary": "Lucid covers four account paths: Pro (full ladder, 1-day pass), Black (legacy, only active for accounts bought before 01/03/26), Flex (no DLL, no funded consistency), and Direct (straight to funded). Two data feeds — CGQ for Tradovate/NinjaTrader/TradingView, Rithmic for TradeSea/MotiveWave/Quantower.",
    "highlights": ["Free Activation", "1-Day Pro Pass", "No DLL on Flex"],
    "bestFor": ["Fast Pass", "Free Activation", "Path Flexibility"],
    "stats": [
      ["Discount", "50% Off"],
      ["Code", "CHAMP"],
      ["Fast Pass", "1-day on Pro"]
    ],
    "boxPreviews": {
      "deal": "Use code CHAMP at checkout",
      "programs": "PRO, BLACK (legacy), FLEX, DIRECT",
      "rules": "No DLL on FLEX / Direct-to-funded option / plan-specific consistency",
      "payouts": "Pro min 5 days profit · Flex 5-day payout · Black bonus payouts"
    },
    "boxMore": {
      "deal": "Use code CHAMP at checkout. Compare the four account paths before choosing — Pro for the full size ladder, Flex for no-DLL trading, Direct to skip the eval entirely.",
      "programs": "LUCID PRO\nProfit Target: $1,250 / $3,000 / $6,000 / $9,000 (25K-150K)\nMax Loss: $1,000 / $2,000 / $3,000 / $4,500\nDLL: None (25K) / $1,200 / $1,800 / $2,700\n\nLUCID BLACK (removed from website but active for accounts bought before 01/03/26)\nProfit Target: $1,250 / $3,000 / $6,000 (25K-100K)\nMax Loss: $1,000 / $2,000 / $3,000\nDLL: N/A · Bonus payouts available\n\nLUCID FLEX\nProfit Target: $1,250 / $3,000 / $6,000 / $9,000 (25K-150K)\nMax Loss: $1,000 / $2,000 / $3,000 / $4,500\nDLL: None\n\nLUCID DIRECT\nStraight-to-funded structure",
      "rules": "PRO: Consistency 40% · Pass funded in 1 day · Activation Fee FREE\nBLACK: Eval consistency 40% · Funded consistency 60% · Bonus payouts (not on payout #1)\nFLEX: No DLL · 50% eval consistency · No funded consistency · Activation FREE\nDIRECT: Consistency 20% · Max accounts 5 · Min day to payout 5",
      "payouts": "PRO: Min days of profit 5 with size-based minimums ($50 / $100 / $150 / $200) · Min payout request $500 · Payouts to live 6\nPayout 1 cap: $1,000 / $2,000 / $2,500 / $3,000\nPayout 2 cap: $1,500 / $2,500 / $3,000 / $3,500\nBLACK: Bonus payouts $2,500 / $5,000 / $7,000 (25K-100K, not on payout #1)\nFLEX: Days to payout = 5 · Payouts to live = 6 · 90/10 split · Max payout 50% of profit up to $1,000 / $2,000 / $2,500 / $3,000"
    },
    "programs": [
      "Lucid Pro — full size ladder from 25K to 150K (1-day pass)",
      "Lucid Black — legacy, removed from website but still active for accounts bought before 01/03/26",
      "Lucid Flex — no DLL product line",
      "Lucid Direct — straight-to-funded account"
    ],
    "rules": [
      "Pro max size: 2 / 4 / 6 / 10 minis by account size",
      "Flex max size: 2 / 4 / 6 / 8 minis by account size",
      "Direct: no DLL on 25K, then $1,200 / $2,100 / $3,000 on larger accounts",
      "Direct one-time payment: $238 / $364 / $490 / $588 (25K-150K)",
      "Flex: 90/10 payout split, no buffer balance, max payouts don't scale"
    ],
    "payouts": [
      "Pro: 5 days of profit, min $500 payout request, payouts to live 6",
      "Flex: 5-day cycle, 50% of profit up to size-based caps, payouts to live 6",
      "Direct: 5-day min to payout",
      "Black: bonus payouts not available on payout #1"
    ],
    "platforms": [
      "CGQ feed: Tradovate · NinjaTrader · TradingView",
      "Rithmic feed: TradeSea · MotiveWave · Quantower"
    ],
    "warning": null,
    "plansDetailed": [
      {
        "name": "Lucid Pro",
        "featured": true,
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Profit Target", "$1,250 / $3,000 / $6,000 / $9,000"],
          ["Max Loss Limit", "$1,000 / $2,000 / $3,000 / $4,500"],
          ["DLL", "None / $1,200 / $1,800 / $2,700"],
          ["Max Size", "2 / 4 / 6 / 10 minis"],
          ["Reset Fee", "$75 / $100 / $170 / $225"],
          ["One-Time Payment", "$84 / $112 / $192.50 / $259"],
          ["Activation Fee", "Free"],
          ["Consistency", "40%"],
          ["Pass Funded In", "1 day"],
          ["Min Days of Profit", "5 days with $50 / $100 / $150 / $200 thresholds"],
          ["Payouts to Live", "6"],
          ["Buffer Balance", "$26,100 / $52,100 / $103,100 / $154,600"],
          ["Minimum Payout Request", "$500"],
          ["Payout 1 Cap", "$1,000 / $2,000 / $2,500 / $3,000"],
          ["Payout 2 Cap", "$1,500 / $2,500 / $3,000 / $3,500"]
        ]
      },
      {
        "name": "Lucid Black",
        "rules": [
          ["Website Status", "Removed from website but active if bought before 01/03/26"],
          ["Account Sizes", "25K / 50K / 100K"],
          ["Profit Target", "$1,250 / $3,000 / $6,000"],
          ["Max Loss", "$1,000 / $2,000 / $3,000"],
          ["DLL", "N/A"],
          ["Max Size", "2 / 4 / 6 minis"],
          ["One-Time Payment", "$91 / $126 / $280"],
          ["Reset Fee", "$85 / $115 / $250"],
          ["Consistency (Funded)", "60%"],
          ["Consistency (Eval)", "40%"],
          ["Bonus Payout", "$2,500 / $5,000 / $7,000 (not available on payout #1)"]
        ]
      },
      {
        "name": "Lucid Flex",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Profit Target", "$1,250 / $3,000 / $6,000 / $9,000"],
          ["Max Loss", "$1,000 / $2,000 / $3,000 / $4,500"],
          ["DLL", "N/A"],
          ["Max Size", "2 / 4 / 6 / 8 minis"],
          ["One-Time Payment", "$70 / $91 / $157.50 / $241.50"],
          ["Reset Fee", "$60 / $85 / $140 / $225"],
          ["Activation Fee", "Free"],
          ["Consistency (Eval)", "50%"],
          ["Consistency (Funded)", "None"],
          ["Days to Payout", "5"],
          ["Payouts to Live", "6"],
          ["Payout Split", "90/10 (trader 90% / Lucid 10%)"],
          ["Max Payout", "50% of profit up to $1,000 / $2,000 / $2,500 / $3,000"],
          ["Buffer Balance", "None — maximums do not scale"]
        ]
      },
      {
        "name": "Lucid Direct",
        "rules": [
          ["Path", "Straight to funded account"],
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Max Loss", "$1,000 / $2,000 / $3,500 / See site"],
          ["DLL", "N/A (25K) / $1,200 / $2,100 / $3,000"],
          ["Lucid Scale DLL", "60% of peak EOD balance (50K-150K)"],
          ["Max Size", "2 / 4 / 6 / 10 minis"],
          ["Consistency", "20%"],
          ["One-Time Payment", "$238 / $364 / $490 / $588"],
          ["Max Accounts", "5"],
          ["Min Day to Payout", "5"]
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
          "Daily Loss Limit": "None · $1,200 · $1,800 · $2,700",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,500",
          "Min. Trading Days": "1-day pass to funded",
          "Consistency Rule": "40%",
          "Payout Split": "Trader-friendly · see size caps",
          "Payout Frequency": "5 profit days · min request $500",
          "Platforms": "Tradovate · NinjaTrader · TradingView · TradeSea · MotiveWave · Quantower",
          "Promo Code": "CHAMP",
          "Activation Fee": "FREE"
        }
      },
      {
        "name": "LUCID FLEX",
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,250 · $3,000 · $6,000 · $9,000",
          "Daily Loss Limit": "No DLL",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,500",
          "Min. Trading Days": "5 days to payout",
          "Consistency Rule": "50% eval · none funded",
          "Payout Split": "90/10 (90% trader)",
          "Payout Frequency": "5-day cycle · 50% of profit up to size caps",
          "Platforms": "CGQ + Rithmic feeds",
          "Promo Code": "CHAMP",
          "Activation Fee": "FREE"
        }
      },
      {
        "name": "LUCID DIRECT",
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "Straight to funded",
          "Daily Loss Limit": "N/A (25K) · $1,200 · $2,100 · $3,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,500 · See site",
          "Min. Trading Days": "5 days to payout",
          "Consistency Rule": "20%",
          "Payout Split": "See site for full details",
          "Payout Frequency": "5-day cycle",
          "Platforms": "CGQ + Rithmic feeds",
          "Promo Code": "CHAMP",
          "Activation Fee": "One-time payment $238 / $364 / $490 / $588"
        }
      }
    ],
    "note": "Lucid runs four paths: Pro (full ladder, 1-day pass, free activation), Black (legacy — only active for accounts bought before 01/03/26, has bonus payouts), Flex (no DLL, no funded consistency, 90/10 split), and Direct (straight to funded, 20% consistency). CGQ data feed covers Tradovate/NinjaTrader/TradingView. Rithmic data feed covers TradeSea/MotiveWave/Quantower."
  },
  "alpha-futures": {
    "slug": "alpha-futures",
    "rating": 4.6,
    "reviewCount": 49,
    "country": "GB",
    "maxAllocation": "$150K",
    "platformsList": ["Tradesea","Rithmic"],
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
    "type": "Zero · Advanced · Standard (legacy)",
    "tagline": "Zero · Advanced · Standard (legacy)",
    "badge": "new",
    "featured": false,
    "live": true,
    "tags": ["discount", "evaluation"],
    "filters": ["evaluation", "highest-discount"],
    "promo": {
      "code": "CHAMP",
      "discount": "10% off"
    },
    "offerLine": "Use Code CHAMP",
    "offerSub": "Zero one-day pass · Advanced 90% always · Standard legacy",
    "summary": "Alpha Futures (updated 05/01/26): Zero is now a one-day eval pass with flat 90% split and $0 activation. Advanced stays the premium path with no DLL, no qualified consistency, no news restrictions, $149 activation, and $1,000–$15,000 withdrawal range. Standard has been removed from the website but remains active for accounts purchased before 05/01/26.",
    "highlights": ["Zero One-Day Pass", "Advanced 90% Always", "No News Restrictions (Advanced)"],
    "bestFor": ["One-Day Pass (Zero)", "Advanced 90% Split", "No News Restrictions"],
    "stats": [
      ["Plans", "Zero · Advanced"],
      ["Code", "CHAMP"],
      ["Top Split", "90% (Advanced)"]
    ],
    "boxPreviews": {
      "deal": "Use code CHAMP at checkout · Zero $0 activation · Advanced $149 activation",
      "programs": "Zero (one-day pass, $0 activation), Advanced (90% flat, $149 activation), Standard (legacy)",
      "rules": "Zero: no eval consistency · Advanced: no DLL, no news restrictions · Standard: legacy",
      "payouts": "Zero: 90% flat · Advanced: 90% with $200+ winning-day requests · Both 50% of profit, up to 4x/month"
    },
    "boxMore": {
      "deal": "Use code CHAMP at checkout. Updated 05/01/26: monthly subscription pricing now displayed (Zero $79–$239/mo, Advanced $139–$419/mo). Activation fees: $0 (Zero), $149 (Advanced, due within 30 days of passing). Standard removed from website — accounts bought before 05/01/26 remain active.",
      "programs": "ALPHA ZERO — 25K, 50K, 100K · One-day eval pass · Flat 90% split · $0 activation · Monthly $79 / $119 / $239\nALPHA ADVANCED — 50K, 100K, 150K · 90% from day 1 · No DLL ever · No news restrictions · $149 activation · Monthly $139 / $279 / $419\nALPHA STANDARD (legacy) — Removed from website but active for accounts bought before 05/01/26",
      "rules": "ZERO: No eval min days (one-day pass) · 5 qualified days to first payout · No eval consistency · 40% qualified consistency · Eval reset $69 / $109 / $219 · Qualified reset removed · Scaling on 50K/100K qualified only\nADVANCED: 2 eval days · 5 qualified days · 50% eval consistency · None qualified · No DLL on either stage · No news restrictions · No scaling (full contracts day 1) · Eval reset = monthly subscription price\nSTANDARD (legacy): 2 eval days · 3 qualified days · DLL none eval / $1,000 / $2,000 / $3,000 qualified · 50% eval / 40% qualified consistency · Tiered split 70/80/90% — only active for accounts bought before 05/01/26",
      "payouts": "ZERO: 90% flat · Withdraw up to 50% of profits, up to 4x/month · Withdrawal range $200–$1,000 / $200–$1,500 / $200–$2,500 (25K-100K) · MLL stays fixed (does NOT slide to $0 on first withdrawal) · 5 winning days of $200+ to first payout · Max 3 funded accounts (all sizes)\nADVANCED: 90% from day 1 (not tiered) · Request every 5 winning trading days of $200+ profit · Withdrawal range $1,000–$15,000 per request, up to 4x/month · Max 3 funded accounts up to $450K combined cap\nSTANDARD (legacy): 70% (payouts 1-2) → 80% (3-4) → 90% (5+) · Withdrawal up to $15,000 per request (industry leading) · Max 3 funded accounts up to $450K combined cap"
    },
    "programs": [
      "Alpha Zero — 25K-100K · one-day eval pass · flat 90% split · $0 activation",
      "Alpha Advanced — 50K-150K · 90% from day 1 · no DLL · no news restrictions · $149 activation",
      "Alpha Standard (legacy) — removed from website 05/01/26 but active for accounts bought before that date"
    ],
    "rules": [
      "Zero: no eval min trading days (one-day pass possible), no eval consistency, $0 activation",
      "Advanced: no DLL on eval or qualified, no qualified consistency, no news restrictions, $149 activation",
      "Standard (legacy): tiered 70/80/90% split — accounts bought before 05/01/26 only",
      "Max accounts unified: 3 funded across all plans, with $450K combined cap on Standard/Advanced",
      "Withdrawal: 50% of profits, up to 4x per month, after 5 winning days of $200+"
    ],
    "payouts": [
      "Zero: 90% flat · withdrawal range $200–$1,000 / $200–$1,500 / $200–$2,500 (25K-100K) · up to 4x/month",
      "Advanced: 90% from day 1 · request every 5 winning days of $200+ · withdrawal range $1,000–$15,000 per request",
      "Standard (legacy): tiered 70/80/90% by payout count · up to $15,000 per request"
    ],
    "platforms": ["See Alpha Futures site for current platform list"],
    "warning": "Alpha Standard was removed from the website on 05/01/26. Accounts bought before that date remain active under the original Standard rules. New traders should choose Zero or Advanced.",
    "plansDetailed": [
      {
        "name": "Alpha Zero",
        "featured": true,
        "rules": [
          ["Account Sizes", "25K / 50K / 100K"],
          ["Monthly Price", "$79 / $119 / $239"],
          ["Activation Fee", "$0 (all sizes)"],
          ["Profit Target", "$1,500 / $3,000 / $6,000"],
          ["Max Drawdown (MLL)", "$1,000 / $2,000 / $3,000"],
          ["Daily Loss Guard (DLL)", "$500 / $1,000 / $2,000"],
          ["Max Position", "1 mini (10 micros) / 3 minis (30 micros) / 6 minis (60 micros)"],
          ["Min Trading Days (Eval)", "None (one-day pass possible)"],
          ["Min Trading Days (Qualified)", "5"],
          ["Consistency (Eval)", "None"],
          ["Consistency (Qualified)", "40%"],
          ["Eval Reset Fee", "$69 / $109 / $219"],
          ["Qualified Reset Fee", "Removed (no separate qualified reset)"],
          ["Profit Split", "90% flat (Qualified)"],
          ["Withdrawal Limit", "$200–$1,000 / $200–$1,500 / $200–$2,500"],
          ["Withdrawal Cadence", "Up to 50% of profits · up to 4x per month"],
          ["MLL Behavior", "Does NOT slide to $0 at first withdrawal — stays fixed"],
          ["Max Accounts", "3 funded (all sizes)"],
          ["Hold Through News", "Yes (eval) · Yes with 2-min buffer (qualified)"],
          ["Scaling Plan (Qualified)", "No on 25K · Yes on 50K and 100K"]
        ]
      },
      {
        "name": "Alpha Advanced",
        "rules": [
          ["Account Sizes", "50K / 100K / 150K"],
          ["Monthly Price", "$139 / $279 / $419"],
          ["Activation Fee", "$149 (due within 30 days of passing)"],
          ["Profit Target", "$4,000 / $8,000 / $12,000"],
          ["Max Drawdown (MLL)", "$1,750 / $3,500 / $5,250"],
          ["Daily Loss Guard (DLL)", "None (Eval & Qualified)"],
          ["Max Position", "5 minis (50 micros) / 10 minis (100 micros) / 15 minis (150 micros)"],
          ["Min Trading Days (Eval)", "2"],
          ["Min Trading Days (Qualified)", "5"],
          ["Consistency (Eval)", "50%"],
          ["Consistency (Qualified)", "None"],
          ["Eval Reset Fee", "$139 / $279 / $419 (= monthly subscription)"],
          ["Profit Split", "90% from day 1 (not tiered)"],
          ["Payout Frequency", "Every 5 winning trading days of $200+ profit"],
          ["Withdrawal Limit", "$1,000–$15,000 per request"],
          ["Withdrawal Cadence", "Up to 50% of profits · up to 4x per month"],
          ["Max Accounts", "3 funded · $450K combined cap"],
          ["Hold Through News", "Yes — NO restrictions (Eval & Qualified)"],
          ["Scaling Plan", "None — full contract limits from day 1"]
        ]
      },
      {
        "name": "Alpha Standard (legacy — removed 05/01/26)",
        "rules": [
          ["Website Status", "Removed from website 05/01/26 · active only for accounts bought before that date"],
          ["Account Sizes", "50K / 100K / 150K"],
          ["Profit Target", "$3,000 / $6,000 / $9,000"],
          ["Max Drawdown", "$2,000 / $4,000 / $6,000"],
          ["DLL (Eval)", "None"],
          ["DLL (Qualified)", "$1,000 / $2,000 / $3,000"],
          ["Max Position", "5 minis (50 micros) / 10 minis (100 micros) / 15 minis (150 micros)"],
          ["Min Trading Days (Eval)", "2"],
          ["Min Trading Days (Qualified)", "3"],
          ["Consistency (Eval)", "50%"],
          ["Consistency (Qualified)", "40%"],
          ["Reset Fee", "$59 / $129 / $199"],
          ["Profit Split", "Tiered: 70% (payouts 1-2) → 80% (3-4) → 90% (5+)"],
          ["Withdrawal Limit", "Up to $15,000 per request (industry leading)"],
          ["Max Accounts", "3 funded · $450K combined cap"],
          ["Hold Through News", "Yes (eval) · Yes with restrictions (qualified)"]
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
          "Daily Loss Limit": "$500 · $1,000 · $2,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,000",
          "Min. Trading Days": "None eval (one-day pass) · 5 qualified",
          "Consistency Rule": "None eval · 40% qualified",
          "Payout Split": "90% flat",
          "Payout Frequency": "Up to 4x/month · 50% of profits · range $200–$2,500 by size",
          "Platforms": "See site for full details",
          "Promo Code": "CHAMP",
          "Activation Fee": "$0 · monthly $79 / $119 / $239"
        }
      },
      {
        "name": "ALPHA ADVANCED",
        "rules": {
          "Account Sizes": "50K · 100K · 150K",
          "Profit Target": "$4,000 · $8,000 · $12,000",
          "Daily Loss Limit": "None (Eval & Qualified)",
          "Max Drawdown": "$1,750 · $3,500 · $5,250",
          "Min. Trading Days": "2 eval · 5 qualified",
          "Consistency Rule": "50% eval · none qualified",
          "Payout Split": "90% from day 1 (not tiered)",
          "Payout Frequency": "Every 5 winning days of $200+ · $1,000–$15,000 per request",
          "Platforms": "See site for full details",
          "Promo Code": "CHAMP",
          "Activation Fee": "$149 · monthly $139 / $279 / $419"
        }
      },
      {
        "name": "ALPHA STANDARD (LEGACY)",
        "rules": {
          "Account Sizes": "50K · 100K · 150K",
          "Profit Target": "$3,000 · $6,000 · $9,000",
          "Daily Loss Limit": "None eval · $1,000 · $2,000 · $3,000 qualified",
          "Max Drawdown": "$2,000 · $4,000 · $6,000",
          "Min. Trading Days": "2 eval · 3 qualified",
          "Consistency Rule": "50% eval · 40% qualified",
          "Payout Split": "70% (1-2) · 80% (3-4) · 90% (5+)",
          "Payout Frequency": "Up to $15,000 per request",
          "Platforms": "See site for full details",
          "Promo Code": "CHAMP",
          "Activation Fee": "Legacy — removed from website 05/01/26"
        }
      }
    ],
    "note": "Alpha Futures (updated 05/01/26): Zero is now a one-day pass with flat 90% split and $0 activation; monthly $79–$239. Advanced is the premium path — 90% from day 1, no DLL, no qualified consistency, no news restrictions, $149 activation, monthly $139–$419, withdrawal $1,000–$15,000 per request. Standard was removed from the website on 05/01/26 but remains active for accounts purchased before that date. Max accounts are 3 funded across all plans (Standard/Advanced have a $450K combined cap). Withdrawals are 50% of profits, up to 4x per month, after 5 winning days of $200+."
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
    "name": "Apex Futures",
    "initials": "AP",
    "logo": "/logos/apex.png",
    "logoText": "AP",
    "affiliateUrl": "https://apextraderfunding.com/member/aff/go/thetradingchamp",
    "type": "Intraday · EOD · 3 Platforms",
    "tagline": "Intraday Trail · EOD Trail · Rithmic · Tradovate · WealthCharts",
    "badge": "popular",
    "featured": false,
    "live": true,
    "tags": ["fast-payout"],
    "filters": ["evaluation", "fast-payout"],
    "promo": {
      "code": "CHAMP",
      "discount": "See pricing"
    },
    "offerLine": "90% OFF · No activation fee",
    "offerSub": "CHAMP unlocks both: 90% off the eval AND removes the activation fee entirely. Up to 20 accounts.",
    "summary": "Apex Trader Funding currently runs the biggest active CHAMP discount — 90% off the evaluation AND no activation fee on the Performance Account. Intraday and EOD Trail accounts on Rithmic, Tradovate, and WealthCharts. 1 day to pass, up to 20 max accounts, 5 trading day payouts.",
    "highlights": ["90% Off + No Activation", "1-Day Pass", "20 Max Accounts"],
    "bestFor": ["Biggest Active Discount", "Fast Pass", "Multi-Account Scaling"],
    "stats": [
      ["CHAMP Discount", "90% Off"],
      ["Activation Fee", "$0 (was $79)"],
      ["Max Accounts", "20"]
    ],
    "boxPreviews": {
      "deal": "CHAMP = 90% off eval + $0 activation fee (was $79)",
      "programs": "Intraday + EOD on multiple feeds",
      "rules": "20 accounts · 50% consistency · DLL yes",
      "payouts": "5 trading days · 6 max payout requests"
    },
    "boxMore": {
      "deal": "Current CHAMP pricing — biggest active discount on the site:\\n\\n50K NO ACTIVATION FEE EOD TRAIL:\\nOne Pack: $109 (was $1,098) — one-time fee, no rebill, 30-day eval\\nFive Pack: $445 (was $4,450) — one-time fee, no rebill, no resets\\n\\nAll plan sizes (25K / 50K / 100K / 150K) get the 90% off + $0 activation. Always verify current checkout pricing before purchase.",
      "programs": "APEX 1 — Intraday Trail / Rithmic\\nAPEX 2 — Intraday Trail / Tradovate\\nAPEX 3 — Intraday Trail / WealthCharts\\nAPEX 4 — EOD Trail / Rithmic, Tradovate, WealthCharts",
      "rules": "Min days to pass = 1\\nEval max contracts: 4 / 6 / 8 / 12 minis\\nProfit target: $1,500 / $3,000 / $6,000 / $9,000\\nMax drawdown: $1,000 / $2,000 / $3,000 / $4,000\\nPerformance account max accounts: 20\\nDLL: yes\\nConsistency: 50%\\nActivation fee: $79",
      "payouts": "Activation deadline: 7 days from eval pass\\nPayout frequency: 5 trading days\\nPayout split: none-100%\\nMax payout requests: 6"
    },
    "programs": [
      "Intraday Trail on Rithmic / Tradovate / WealthCharts",
      "EOD Trail on Rithmic / Tradovate / WealthCharts"
    ],
    "rules": [
      "Performance account max contracts: 2 / 4 / 6 / 10 minis",
      "Scaling contracts: yes",
      "Accepts credit cards note included on EOD pricing section"
    ],
    "payouts": [
      "5 trading day payout frequency",
      "Max payout requests: 6",
      "Activation deadline after eval pass: 7 days"
    ],
    "platforms": [
      "Rithmic",
      "Tradovate",
      "WealthCharts",
      "TradingView compatible",
      "Browser / Mobile / Mac compatible"
    ],
    "warning": "Apex pricing changes often. Always verify the current checkout pricing before purchase.",
    "plansDetailed": [
      {
        "name": "Intraday Trail — Evaluation",
        "featured": true,
        "rules": [
          ["Platforms", "Rithmic / Tradovate / WealthCharts"],
          ["Min Days to Pass", "1"],
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Max Contracts", "4 / 6 / 8 / 12 minis"],
          ["Profit Target", "$1,500 / $3,000 / $6,000 / $9,000"],
          ["Max Drawdown", "$1,000 / $2,000 / $3,000 / $4,000"],
          ["Scaling", "Built-In for PA"],
          ["Reset Fee", "N/A"]
        ]
      },
      {
        "name": "Intraday Trail — Performance Account",
        "rules": [
          ["Activation Fee", "$79"],
          ["Activation Deadline", "7 days from eval pass"],
          ["Payout Frequency", "5 trading days"],
          ["Max Accounts", "20"],
          ["Max Contracts", "2 / 4 / 6 / 10 minis"],
          ["Scaling Contracts", "Yes"],
          ["Max Drawdown", "$1,000 / $2,000 / $3,000 / $4,000"],
          ["DLL", "Yes"],
          ["Consistency", "50%"],
          ["Payout Split", "None–100%"],
          ["Payout Requests", "6"]
        ]
      },
      {
        "name": "EOD Trail — Evaluation",
        "rules": [
          ["Platforms", "Rithmic / Tradovate / WealthCharts"],
          ["Min Days to Pass", "1"],
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Max Contracts", "4 / 6 / 8 / 12 minis"],
          ["Profit Target", "$1,500 / $3,000 / $6,000 / $9,000"],
          ["Max Drawdown", "$1,000 / $2,000 / $3,000 / $4,000"],
          ["Scaling", "Built-In for PA"],
          ["Reset Fee", "N/A"]
        ]
      },
      {
        "name": "EOD Trail — Performance Account",
        "rules": [
          ["Activation Fee", "$79"],
          ["Activation Deadline", "7 days from eval pass"],
          ["Payout Frequency", "5 trading days"],
          ["Max Accounts", "20"],
          ["Max Contracts", "2 / 4 / 6 / 10 minis"],
          ["Scaling Contracts", "Yes"],
          ["Max Drawdown", "$1,000 / $2,000 / $3,000 / $4,000"],
          ["DLL", "Yes"],
          ["Consistency", "50%"],
          ["Payout Split", "None–100%"],
          ["Payout Requests", "6"]
        ]
      }
    ],
    "plansSummary": [
      {
        "name": "NO ACTIVATION FEE — EOD TRAIL",
        "featured": true,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $3,000 · $6,000 · $9,000",
          "Daily Loss Limit": "$500 · $1,000 · $2,000 · $3,000",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,000",
          "Min. Trading Days": "1 day to pass",
          "Consistency Rule": "50% in PA",
          "Payout Split": "None–100%",
          "Payout Frequency": "Every 5 trading days",
          "Platforms": "Rithmic · Tradovate · WealthCharts",
          "Promo Code": "CHAMP — 90% off",
          "Activation Fee": "$0 with CHAMP (was $79)"
        }
      },
      {
        "name": "INTRADAY TRAIL",
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $3,000 · $6,000 · $9,000",
          "Daily Loss Limit": "DLL in PA only",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,000",
          "Min. Trading Days": "1 day to pass",
          "Consistency Rule": "50% in PA",
          "Payout Split": "None–100%",
          "Payout Frequency": "Every 5 trading days",
          "Platforms": "Rithmic · Tradovate · WealthCharts",
          "Promo Code": "CHAMP — 90% off",
          "Activation Fee": "$0 with CHAMP (was $79)"
        }
      },
      {
        "name": "EOD TRAIL — STANDARD",
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $3,000 · $6,000 · $9,000",
          "Daily Loss Limit": "DLL in PA only",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,000",
          "Min. Trading Days": "1 day to pass",
          "Consistency Rule": "50% in PA",
          "Payout Split": "None–100%",
          "Payout Frequency": "Every 5 trading days",
          "Platforms": "Rithmic · Tradovate · WealthCharts",
          "Promo Code": "CHAMP — 90% off",
          "Activation Fee": "$79"
        }
      }
    ],
    "note": "Apex's current CHAMP deal — 90% off the eval AND $0 activation fee on the No-Activation EOD Trail — is the biggest active discount on PropChamps. Always verify current checkout pricing before purchase."
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
          "Daily Loss Limit": "REMOVED across all sizes",
          "Max Drawdown": "$1,500 · $2,000 · $2,500 · $3,000 · $4,500",
          "Min. Trading Days": "See site for full details",
          "Consistency Rule": "See site for full details",
          "Payout Split": "See site for full details",
          "Payout Frequency": "See site for full details",
          "Platforms": "See site for full details",
          "Promo Code": "CHAMP",
          "Activation Fee": "See site for full details"
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
        "name": "1-STEP ELITE",
        "featured": true,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "$1,500 · $3,000 · $6,000 · $9,000",
          "Daily Loss Limit": "$625 · $1,250 · $2,500 · $3,750",
          "Max Drawdown": "$1,000 · $2,000 · $3,000 · $4,500",
          "Min. Trading Days": "1 day to pass",
          "Consistency Rule": "None challenge · 25% funded",
          "Payout Split": "See site for full details",
          "Payout Frequency": "See site for full details",
          "Platforms": "See site for full details",
          "Promo Code": "CHAMP",
          "Activation Fee": "$149"
        }
      },
      {
        "name": "INSTANT SIM FUNDED",
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "Instant funded path",
          "Daily Loss Limit": "$625 · $1,250 · $2,500 · $3,750",
          "Max Drawdown": "$1,000 · $2,000 · $4,000 · $6,000",
          "Min. Trading Days": "See site for full details",
          "Consistency Rule": "20%",
          "Payout Split": "See site for full details",
          "Payout Frequency": "See site for full details",
          "Platforms": "See site for full details",
          "Promo Code": "CHAMP",
          "Activation Fee": "One-time $272 · $441 · $534 · $610"
        }
      },
      {
        "name": "S2F SIM PRO",
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "See site for full details",
          "Daily Loss Limit": "$500 · $1,000 · $2,000 · $3,000",
          "Max Drawdown": "$1,000 · $1,625 · $3,250 · $5,000",
          "Min. Trading Days": "10 days to payout",
          "Consistency Rule": "ESS 20%",
          "Payout Split": "See site for full details",
          "Payout Frequency": "See site for full details",
          "Platforms": "See site for full details",
          "Promo Code": "CHAMP",
          "Activation Fee": "One-time $141 · $232 · $348 · $400"
        }
      },
      {
        "name": "IGNITE",
        "rules": {
          "Account Sizes": "25K · 50K · 100K",
          "Profit Target": "Instant funded path",
          "Daily Loss Limit": "$500 · $1,000 · $2,000",
          "Max Drawdown": "$1,000 · $2,000 · $4,000",
          "Min. Trading Days": "Instant funded",
          "Consistency Rule": "15%",
          "Payout Split": "See site for full details",
          "Payout Frequency": "See site for full details",
          "Platforms": "See site for full details",
          "Promo Code": "CHAMP",
          "Activation Fee": "One-time $120 · $219 · $310"
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
    "platformsList": ["Tradovate","Rithmic","NinjaTrader","TradingView"],
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
    "type": "Rapid · Pro · Flex · Builder",
    "tagline": "Rapid · Pro · Flex · Builder Plan",
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
    "offerSub": "Rapid · Pro · Flex · Builder — No DLL, no activation fee",
    "summary": "My Funded Futures runs four products: Rapid (daily payouts), Pro (bi-weekly), Flex (weekly), and Builder Plan (subscription evaluation with EOD drawdown). All accounts have NO daily loss limit and NO activation fee. Updated 04/16/26 with new Rapid Live transition rule ($10K net profit in a single session = automatic Live status; profit beyond $10K is forfeited).",
    "highlights": ["No DLL Across All", "No Activation Fee", "4 Product Paths"],
    "bestFor": ["No DLL", "No Activation Fee", "Frequent Payouts"],
    "stats": [
      ["Discount", "Up to 50%"],
      ["Code", "CHAMP"],
      ["DLL", "None across all"]
    ],
    "boxPreviews": {
      "deal": "Use code CHAMP at checkout · Up to 50% off",
      "programs": "Rapid (daily), Pro (bi-weekly), Flex (weekly), Builder Plan",
      "rules": "No DLL · No activation fee · 50% eval consistency · None funded",
      "payouts": "Daily (Rapid) · Bi-weekly (Pro) · Weekly (Flex) · 5-winning-days (Builder)"
    },
    "boxMore": {
      "deal": "Use code CHAMP at checkout. Updated 04/16/26: Rapid Live transition triggers at $10,000 net profit in a single session — profit above $10K for that day is forfeited.",
      "programs": "RAPID — Daily payouts · 25K-150K · No DLL · 50% eval consistency\nPRO — Bi-weekly payouts · No DLL · 50% eval consistency\nFLEX — Weekly payouts · No DLL · 50% eval consistency\nBUILDER PLAN — Subscription evaluation · EOD drawdown · 80/20 split",
      "rules": "RAPID Live: Max Loss $1,000 / $2,000 / $3,000 / $4,500 (25K-150K) · EOD drawdown floors at $0\nMax Contracts (Rapid Live): 2 / 4 / 6 / 8 minis (25K-150K)\nBUILDER eval: 50% rule (no day > 50% of total profit) · No fixed min days · Pricing $127 / $267 / $377 monthly (50K / 100K / 150K)\nBUILDER funded: Starts at $0 · EOD drawdown · No DLL · No funded consistency",
      "payouts": "RAPID: Daily payouts available\nPRO: Bi-weekly\nFLEX: Weekly\nBUILDER: Every 5 winning days · Min payout $250 · 80% trader / 20% company · 5 consecutive payouts unlocks Live funded account"
    },
    "programs": [
      "Funded Futures Rapid — daily payout, no DLL, no activation fee",
      "Funded Futures Pro — bi-weekly payout, no DLL, no activation fee",
      "Funded Futures Flex — weekly payout, no DLL, no activation fee",
      "Builder Plan — subscription evaluation with EOD drawdown, 80/20 split, path to live account"
    ],
    "rules": [
      "All four products: NO DLL, NO activation fee",
      "Eval consistency: 50% across all (no day can be more than 50% of total profit)",
      "Funded consistency: None across all",
      "Rapid Live transition (updated 04/16/26): $10,000 net profit in one session = automatic Live; profit beyond $10K for that day is forfeited",
      "Builder funded: 5 consecutive payouts unlocks real Live funded account"
    ],
    "payouts": [
      "Rapid: Daily",
      "Pro: Bi-weekly",
      "Flex: Weekly",
      "Builder: Every 5 winning days, min $250, 80% trader / 20% company"
    ],
    "platforms": ["See My Funded Futures site for current platform list"],
    "warning": "Rapid Live transition rule (04/16/26): hitting $10,000 net profit in a single session auto-transitions you to Live — and any profit above $10K for that session is forfeited.",
    "plansDetailed": [
      {
        "name": "Funded Futures Rapid",
        "featured": true,
        "rules": [
          ["Payout Frequency", "Daily"],
          ["Daily Loss Limit", "No DLL"],
          ["Activation Fee", "None"],
          ["Consistency (Eval)", "50%"],
          ["Consistency (Funded)", "None"]
        ]
      },
      {
        "name": "Funded Futures Pro",
        "rules": [
          ["Payout Frequency", "Bi-weekly"],
          ["Daily Loss Limit", "No DLL"],
          ["Activation Fee", "None"],
          ["Consistency (Eval)", "50%"],
          ["Consistency (Funded)", "None"]
        ]
      },
      {
        "name": "Funded Futures Flex",
        "rules": [
          ["Payout Frequency", "Weekly"],
          ["Daily Loss Limit", "No DLL"],
          ["Activation Fee", "None"],
          ["Consistency (Eval)", "50%"],
          ["Consistency (Funded)", "None"]
        ]
      },
      {
        "name": "Rapid Live Account",
        "rules": [
          ["Account Sizes", "25K / 50K / 100K / 150K"],
          ["Initial Balance", "$0 across all sizes"],
          ["Max Loss Limit", "$1,000 / $2,000 / $3,000 / $4,500"],
          ["Drawdown Type", "End-of-Day (EOD)"],
          ["Drawdown Floor", "Stops at $0 (account ends at $0)"],
          ["Max Contracts", "2 / 4 / 6 / 8 minis (20 / 40 / 60 / 80 micros)"],
          ["Payouts", "Daily payouts available"],
          ["Live Transition (04/16/26)", "$10K net profit in a single session = automatic Live status; profit above $10K for that day is forfeited"]
        ]
      },
      {
        "name": "Builder Plan — Evaluation",
        "rules": [
          ["Profit Target", "~5-10% of account size (e.g. ~$3,000 on 50K)"],
          ["Daily Loss Limit", "None"],
          ["Max Drawdown (EOD)", "$2,000 / $3,000 / $4,500 (50K / 100K / 150K)"],
          ["Consistency (Eval)", "50% rule (no day > 50% of total profit)"],
          ["Min Days to Pass", "Not strictly fixed — must show consistent performance"],
          ["Monthly Subscription", "$127 / $267 / $377 (50K / 100K / 150K)"],
          ["Activation Fee", "None ($0)"],
          ["Eval Reset", "$127 / $267 / $377"]
        ]
      },
      {
        "name": "Builder Plan — Funded (Sim)",
        "rules": [
          ["Initial Balance", "$0"],
          ["Drawdown Type", "End-of-Day (EOD) — does not trail intraday"],
          ["Daily Loss Limit", "None"],
          ["Consistency (Funded)", "None"],
          ["Max Contracts", "3 / 6 / 9 minis (15 / 30 / 45 micros) for 50K / 100K / 150K"],
          ["Payout Frequency", "Every 5 winning days (weekly)"],
          ["Minimum Payout", "$250"],
          ["Profit Split", "80% trader / 20% company"],
          ["Path to Live", "Complete 5 consecutive payouts → eligible for real Live funded account"]
        ]
      }
    ],
    "plansSummary": [
      {
        "name": "FUNDED FUTURES RAPID",
        "featured": true,
        "rules": {
          "Account Sizes": "25K · 50K · 100K · 150K",
          "Profit Target": "See site for full details",
          "Daily Loss Limit": "No DLL",
          "Max Drawdown": "EOD · $1,000 · $2,000 · $3,000 · $4,500 (Rapid Live)",
          "Min. Trading Days": "See site for full details",
          "Consistency Rule": "50% eval · none funded",
          "Payout Split": "See site for full details",
          "Payout Frequency": "Daily",
          "Platforms": "See site for full details",
          "Promo Code": "CHAMP",
          "Activation Fee": "FREE"
        }
      },
      {
        "name": "FUNDED FUTURES PRO",
        "rules": {
          "Account Sizes": "See site for full details",
          "Profit Target": "See site for full details",
          "Daily Loss Limit": "No DLL",
          "Max Drawdown": "See site for full details",
          "Min. Trading Days": "See site for full details",
          "Consistency Rule": "50% eval · none funded",
          "Payout Split": "See site for full details",
          "Payout Frequency": "Bi-weekly",
          "Platforms": "See site for full details",
          "Promo Code": "CHAMP",
          "Activation Fee": "FREE"
        }
      },
      {
        "name": "FUNDED FUTURES FLEX",
        "rules": {
          "Account Sizes": "See site for full details",
          "Profit Target": "See site for full details",
          "Daily Loss Limit": "No DLL",
          "Max Drawdown": "See site for full details",
          "Min. Trading Days": "See site for full details",
          "Consistency Rule": "50% eval · none funded",
          "Payout Split": "See site for full details",
          "Payout Frequency": "Weekly",
          "Platforms": "See site for full details",
          "Promo Code": "CHAMP",
          "Activation Fee": "FREE"
        }
      },
      {
        "name": "BUILDER PLAN",
        "rules": {
          "Account Sizes": "50K · 100K · 150K",
          "Profit Target": "~5-10% of size (~$3,000 on 50K)",
          "Daily Loss Limit": "None",
          "Max Drawdown": "EOD · $2,000 · $3,000 · $4,500",
          "Min. Trading Days": "Consistent performance required",
          "Consistency Rule": "50% eval · none funded",
          "Payout Split": "80% trader / 20% company",
          "Payout Frequency": "Every 5 winning days · min $250",
          "Platforms": "See site for full details",
          "Promo Code": "CHAMP",
          "Activation Fee": "$0 · monthly $127 / $267 / $377"
        }
      }
    ],
    "note": "My Funded Futures runs four products: Rapid (daily payouts), Pro (bi-weekly), Flex (weekly), and Builder Plan (monthly subscription, EOD drawdown, 80/20 split, path to real Live account after 5 consecutive payouts). All have NO DLL and NO activation fee. Rapid Live transition (updated 04/16/26): $10K net profit in one session triggers auto-Live status; profit beyond $10K for that session is forfeited."
  }
};

/**
 * Canonical firm display order. Pages iterate this for consistent ordering.
 */
window.FIRM_ORDER = [
  "tradeify",
  "lucid-trading",
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
