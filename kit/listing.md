# Dodo Payments listing — Agent-Ready Store Audit: Fix Kit

## Decision (2026-11-17, sir's choice)
Dodo Payments, Alipay payout. Gumroad is OUT (China payout unconfirmed, no PayPal account). Dodo is the merchant of record: it sells the kit, handles tax, and pays out to the seller's Alipay.

## Product (create in the Dodo dashboard)
- Name: Agent-Ready Store Audit — Fix Kit (for Etsy, WooCommerce & Squarespace)
- Type: one-time payment, $29 USD (launch price $19 for the first 20 buyers — set the launch price in Dodo, then raise to $29)
- Digital delivery: upload `agent-ready-store-audit-kit.zip` in the dashboard — Dodo emails the buyer a secure download link automatically after payment. No file hosting needed on our side.
- Checkout link: dashboard → product → Share / Copy checkout link, looks like `https://checkout.dodopayments.com/buy/prod_xxxxxxxxxxxx` — paste it into `index.html` replacing `REPLACE_WITH_YOUR_PRODUCT_ID`, then deploy the checker site to GitHub Pages.

## Fees (Dodo, verified Nov 2026)
- 4% + $0.40 per transaction; international cards +1.5%. A $29 sale to a non-US card ≈ 5.5% + $0.40 ≈ $2.00 in fees, keeps ~$27. No setup or monthly fees.
- Payouts: twice a month by default; minimum $50; $5 fee on payouts under $1,000. Alipay for a mainland individual: up to ¥50,000 per payout, ¥300,000 per year per recipient (limits per Dodo's payout info — confirm in the dashboard).
- Payouts start only after a separate monitoring review — sales can come in while withdrawals are still pending review.

## Seller setup steps (sir's part, ~30 min + 1–3 day review)
1. Go to dodopayments.com → Get Started → sign up with email (passwordless, 6-digit code by email).
2. Identity verification: ID document + selfie via Persona; onboard as an individual / unregistered business (no company needed).
3. Add payout: Alipay account in your own name.
4. Create the product as above, upload the kit zip, copy the checkout link and send it to me.
5. I wire the link into the checker page and deploy it to GitHub Pages.

## Caution (honest)
- One community report (Gefei's community, Oct 2026) says Dodo is "no longer recommended since Aug 2026" — a single community view, not a verified failure; if Dodo rejects the account, the fallback is Creem (also Yes for China, Alipay payouts) or Paddle.
- Dodo only supports digital delivery — fine for this kit; it does not support physical goods or Shopify plugins (not needed here).

## Product name
Agent-Ready Store Audit — Fix Kit (for Etsy, WooCommerce & Squarespace)

## Price
- $29 one-time. Launch price $19 for the first 20 buyers.

## Short description (Gumroad summary)
AI assistants are sending better buyers than ever — but only to stores they can read. This kit shows you exactly why ChatGPT Shopping can't find your store, and gives you the copy-paste fixes. Built for stores NOT on Shopify.

## Long description
AI-referred traffic to US retail sites rose 62% year over year, and those visitors convert 60% better (Adobe Analytics, July 2026). But since mid-2026, most ChatGPT Shopping picks come from merchant feeds, not crawled pages — and most small stores fail on the basics: no product feed, blocked crawlers, prices hidden behind JavaScript.

This kit is the fix, not just the diagnosis:

- **The full Fix Kit PDF (7 pages):** the 12 checks explained one by one — what each one is, why it matters, and the exact fix, with per-platform checklists for Etsy, WooCommerce and Squarespace, a 14-day action plan, and an honest section on agent checkout (UCP/ACP) — what is real now and what isn't.
- **llms.txt + robots.txt snippet generator:** open it in your browser, fill in your store details, copy the two files. No upload, no account.
- **Copy-paste templates:** llms.txt, robots.txt, and Product JSON-LD — replace the placeholders and you're done.

One-time payment. No subscription. No software to install. Works with the free lite checker (run it any time to see your score move).

**What this is not:** a guarantee that ChatGPT will recommend your products. Nobody can promise that. It removes the technical reasons assistants can't find, read, or buy from your store.

**Who it's for:** Etsy sellers, WooCommerce and Squarespace stores, and independent shops. If you're on Shopify, tools like AgentWatch already cover you.

## What's included (files in the zip)
- agent-ready-store-audit-kit.pdf (7 pages)
- snippet-generator.html (llms.txt + robots.txt generator, runs offline in any browser)
- llms-template.txt, robots-template.txt, product-jsonld-template.txt

## Tags
ecommerce, chatgpt, ai-shopping, etsy, woocommerce, squarespace, seo, store-audit, llms-txt, agentic-commerce

## Payout / seller notes (internal — do NOT publish)
- Gumroad fees (2026): direct sales 10% + $0.50 + card processing ~2.9% + $0.30 — a $29 sale keeps ~$24.46; Discover sales flat 30%. No monthly fee. Payout minimum $100.
- Payout for a mainland-China seller is UNCLEAR: Gumroad does not pay out to a Visa/credit card, and China is not on its local-bank payout list (120 countries). The only stated route for China is PayPal in USD, unconfirmed country-by-country; PayPal China withdrawals to a bank are a flat $35/wire (min $150). Do NOT promise the buyer anything about payout — this is a seller-side issue.
- Fallback if Gumroad payout fails: sell the same kit from our own page with Dodo Payments checkout (Alipay payout, $0 upfront) — needs the seller's ID verification once. Decide before launch; do not list on Gumroad until the payout route is confirmed.
- Kill criterion (from research): 200+ free-checker users and 0 paid conversions in 14 days → the audit is a nice-to-have; pivot the same checker into a $9/mo visibility monitor.
