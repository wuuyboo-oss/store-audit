# Agent-Ready Store Audit

Free lite checker + paid Fix Kit for non-Shopify stores (Etsy, WooCommerce, Squarespace, independent shops). Tells a store owner whether AI shopping assistants (ChatGPT Shopping etc.) can find their products, read prices, and complete a purchase.

## Files

| File | What it is |
|---|---|
| `index.html` | Free lite checker landing page (URL / paste-HTML / self-check tabs, results, kit upsell) |
| `style.css` | Checker styles |
| `checker.js` | All 12 checks, scoring (0–100), fix list, text-report download. Pure logic + browser glue; Node-testable (`module.exports`) |
| `demo-fixture.html` + `demo-fixture-data.json` | Built-in demo store (fictional candle shop). Scores **56/100** by design |
| `test-checker.js` | Node verification — `node test-checker.js` (57 assertions, all passing) |
| `kit/agent-ready-store-audit-kit.pdf` | Paid Fix Kit, 7 pages (12 checks + fixes, per-platform checklists, templates, 14-day plan) |
| `kit/snippet-generator.html` | Interactive llms.txt + robots.txt generator (client-side only) |
| `kit/llms-template.txt`, `kit/robots-template.txt`, `kit/product-jsonld-template.txt` | Copy-paste templates |
| `kit/listing.md` | Gumroad listing copy + internal payout notes |
| `kit/build_kit.py` | ReportLab script that builds the PDF (WenQuanYi Micro Hei embedded) |

## The 12 checks (weights sum to 100)

1. llms.txt present (8) · 2. robots.txt allows AI bots (8) · 3. Product JSON-LD (12) · 4. Price + availability in schema (10) · 5. Product feed (10) · 6. Sitemap lists products (8) · 7. Renders without JS (8) · 8. Shipping + returns pages (8) · 9. Reviews markup (6) · 10. Image alt text (8) · 11. Canonical URLs (6) · 12. Agent-completable checkout (8)

## Honest limits (stated on the page too)

- Pure client-side fetching hits CORS on many stores → paste-HTML mode + 8-question self-check fallback.
- Full agent-checkout support (UCP/ACP) cannot be verified from a static page — check 12 is a signal, not proof.
- A good score does not guarantee ChatGPT recommendations; a bad score means it very likely cannot find the store at all.
- Demand evidence: Adobe Analytics +62% YoY AI-referred traffic (verified via Adobe); Profound feed-shift figures are vendor-run prompts, not real shopper sessions. See `~/workspace/make-money/research-myown-overseas.md`.

## Status

- Built + verified 2026-11-17. NOT deployed (no GitHub Pages, no Gumroad listing yet).
- Pricing: $29 one-time, launch $19 for the first 20 buyers.
- Payout caveat: Gumroad payout for a mainland-China seller is unconfirmed (no local-bank payout for China; PayPal route unclear; no Visa-card payouts). Dodo Payments (Alipay payout) is the fallback — needs the seller's ID verification. Decide the payout route before listing.
