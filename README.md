# PropChamps

Comparison site for futures prop trading firms — rules, drawdown limits, payouts, and live promo codes.

Live site: https://propchamps.net

## Structure

```
.
├── index.html           # Homepage with firm grid
├── compare.html         # Side-by-side firm comparison tool
├── deals.html           # Active promo codes / discounts
├── privacy.html         # Privacy policy
├── data/firms.js        # Firm data (rules, payouts, links)
├── firms/               # Per-firm landing pages
├── logos/               # Brand and firm logos
├── _redirects           # Cloudflare Pages redirect rules
├── robots.txt
└── sitemap.xml
```

## Hosting

Deployed via Cloudflare Pages, connected to this repo. Pushes to `main` deploy automatically.

## Local preview

Any static file server works. Example:

```
python3 -m http.server 8080
```
