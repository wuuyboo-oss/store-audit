# Agent-Ready Store Audit

Free lite checker + paid Fix Kit for non-Shopify stores (Etsy, WooCommerce, Squarespace, independent shops). Tells a store owner whether AI shopping assistants (ChatGPT Shopping etc.) can find their products, read prices, and complete a purchase.

## Files

| File | What it is |
|---|---|
| `index.html` | Free lite checker landing page (URL / paste-HTML / self-check tabs, results, kit upsell) |
| `style.css` | Checker styles |
| `checker.js` | All 12 checks, scoring (0–100), fix list, text-report download. Pure logic + browser glue; Node-testable (`module.exports`) |
| `demo-fixture.html` + `demo-fixture-data.json` | Built-in demo store (fictional candle shop). Scores **56/100** by design |
| `test-checker.js` | Node verification — `node test-checker.js` (78 assertions, all passing) |
| `kit/agent-ready-store-audit-kit.pdf` | Paid Fix Kit, 7 pages (12 checks + fixes, per-platform checklists, templates, 14-day plan) |
| `kit/snippet-generator.html` | Interactive llms.txt + robots.txt generator (client-side only) |
| `kit/llms-template.txt`, `kit/robots-template.txt`, `kit/product-jsonld-template.txt` | Copy-paste templates |
| `kit/listing.md` | Dodo listing copy + payout notes |
| `kit/build_kit.py` | ReportLab script that builds the PDF (WenQuanYi Micro Hei embedded) |

## The 12 checks (weights sum to 100)

1. llms.txt present (8) · 2. robots.txt allows AI bots (8) · 3. Product JSON-LD (12) · 4. Price + availability in schema (10) · 5. Product feed (10) · 6. Sitemap lists products (8) · 7. Renders without JS (8) · 8. Shipping + returns pages (8) · 9. Reviews markup (6) · 10. Image alt text (8) · 11. Canonical URLs (6) · 12. Agent-completable checkout (8)

## Honest limits (stated on the page too)

- Pure client-side fetching hits CORS on many stores → paste-HTML mode + 8-question self-check fallback.
- Full agent-checkout support (UCP/ACP) cannot be verified from a static page — check 12 is a signal, not proof.
- A good score does not guarantee ChatGPT recommendations; a bad score means it very likely cannot find the store at all.
- Demand evidence: Adobe Analytics +62% YoY AI-referred traffic (verified via Adobe); Profound feed-shift figures are vendor-run prompts, not real shopper sessions. See `~/workspace/make-money/research-myown-overseas.md`.

## Status

- Built 2026-11-17; deployed to GitHub Pages 2026-11-18: https://wuuyboo-oss.github.io/store-audit/ (main page + `kit/` incl. the snippet generator). Real-browser test 2026-11-18 02:01 found 5 issues (stale results on failed URL checks, paste-mode mislabelling, demo/paste score mismatch, self-check Q8 not wired, kit/ not deployed); all fixed 2026-11-18 and covered by tests.
- Pricing: $29 one-time, launch $19 for the first 20 buyers.
- Payout: Dodo Payments (Alipay payout), chosen 2026-11-17 — Gumroad is OUT (China payout unconfirmed, no PayPal account). Dodo onboarding submitted 2026-11-18 00:47, review pending (up to 72h). After approval: create the $29 product in the Dodo dashboard, upload `kit/agent-ready-store-audit-kit.zip`, paste the checkout link into `index.html` (replacing `REPLACE_WITH_YOUR_PRODUCT_ID`), redeploy.
