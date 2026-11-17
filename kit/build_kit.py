# -*- coding: utf-8 -*-
"""Build the Agent-Ready Store Audit Fix Kit PDF (paid kit, $29 / launch $19).
English content, WenQuanYi Micro Hei embedded (no CID fonts)."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Preformatted,
                                PageBreak, KeepTogether, HRFlowable)

WQY = '/home/hatch/workspace/make-money/fonts/wqy-microhei.ttc'
pdfmetrics.registerFont(TTFont('WQY', WQY, subfontIndex=0))
F = 'WQY'

TITLE = ParagraphStyle('t', fontName=F, fontSize=26, leading=32, alignment=TA_CENTER, spaceAfter=4 * mm)
SUB = ParagraphStyle('sub', fontName=F, fontSize=12, leading=17, alignment=TA_CENTER, spaceAfter=6 * mm)
H1 = ParagraphStyle('h1', fontName=F, fontSize=16, leading=21, spaceBefore=8 * mm, spaceAfter=3 * mm)
H2 = ParagraphStyle('h2', fontName=F, fontSize=13, leading=18, spaceBefore=5 * mm, spaceAfter=2 * mm)
BODY = ParagraphStyle('b', fontName=F, fontSize=11, leading=16, spaceAfter=2 * mm)
BUL = ParagraphStyle('bul', fontName=F, fontSize=11, leading=16, spaceAfter=1.5 * mm, leftIndent=6 * mm, bulletIndent=0)
SMALL = ParagraphStyle('s', fontName=F, fontSize=9.5, leading=14, spaceAfter=2 * mm)
CODE = ParagraphStyle('code', fontName=F, fontSize=9.5, leading=13.5, leftIndent=4 * mm)

def P(text, style=BODY):
    return Paragraph(text, style)

def B(text):
    return Paragraph('&bull;&nbsp;&nbsp;' + text, BUL)

def CODEBLOCK(text):
    return Preformatted(text, CODE)

story = []
story.append(Spacer(1, 18 * mm))
story.append(P('Agent-Ready Store Audit', TITLE))
story.append(P('The Fix Kit', TITLE))
story.append(P('How to make your store findable — and buyable — by AI shopping assistants', SUB))
story.append(HRFlowable(width='60%', thickness=1, color='#0b6e4f', spaceAfter=6 * mm, spaceBefore=2 * mm, hAlign='CENTER'))
story.append(P('One-time purchase. No subscription. No software to install — this kit is a guide, checklists, and copy-paste files you apply to the store you already have.', BODY))
story.append(P('Who this is for: Etsy sellers, WooCommerce and Squarespace stores, and independent shops that are NOT on Shopify. If you are on Shopify, AgentWatch and similar tools already serve you.', BODY))
story.append(P('A note on honesty: this kit cannot guarantee ChatGPT will recommend your products. Nobody can promise that. What it does is remove the technical reasons assistants cannot find, read, or buy from your store — the same 12 checks as the free lite checker, with the actual fixes.', BODY))

story.append(P('1. Why this matters now', H1))
story.append(P('AI-referred traffic to US retail sites rose 62% year over year in July 2026, and is up 1,219% since October 2024. Visitors who arrive via an AI assistant convert 60% better and spend 53% more per visit. (Adobe Analytics, as reported by Verlua, August 2026.)', BODY))
story.append(P('At the same time the rules changed. Since mid-2026, about 65% of ChatGPT Shopping recommendations come from merchant feeds, not from crawled web pages — and 450 of 687 tracked merchants lost at least a third of their ChatGPT visibility in July 2026. (Profound, September 2026. Note: Profound\'s numbers come from vendor-run prompts, not real shopper sessions, so treat them as directional.) OpenAI launched its Business Hub for merchants in November 2026.', BODY))
story.append(P('Translation: the assistants are sending better buyers than ever, but only to stores they can read. Most small stores fail on basic readability — no product feed, blocked crawlers, prices hidden behind JavaScript. Those are fixable in an afternoon, and this kit walks through each one.', BODY))

story.append(P('2. How to read your audit score', H1))
story.append(B('<b>80–100 — Agent-ready.</b> Your store is readable by assistants. Fix the remaining items and re-check monthly.'))
story.append(B('<b>50–79 — Partly visible.</b> Assistants can find some of your store. You are probably losing recommendations to competitors who fixed the basics.'))
story.append(B('<b>0–49 — Mostly invisible.</b> Assistants probably cannot find or buy from your store at all. Work through the high-priority fixes in Section 3 first.'))
story.append(P('Scores are not rankings and they change as platforms change their requirements. Re-run the free checker after each fix — a fix that does not move your score did not work.', BODY))

story.append(P('3. The 12 checks — what they are and how to fix them', H1))

checks = [
 ('1. llms.txt present (8 points)',
  'What it is: a plain-text file at yourstore.com/llms.txt that tells AI assistants what your store sells, in your own words.',
  'How to fix: copy the template in Section 5, fill in your store name, URL, bestsellers, categories, shipping and returns summaries, and contact. Upload it to your site root. Keep it under one page — assistants read the top first. Update it when your bestsellers change.'),
 ('2. robots.txt allows AI shopping bots (8 points)',
  'What it is: your robots.txt must allow GPTBot and OAI-SearchBot. If either is disallowed, ChatGPT cannot crawl your store at all.',
  'How to fix: use the template in Section 5. Do not copy a generic "block all AI bots" snippet from a blog — that is the single most common self-inflicted cause of invisibility. After editing, fetch yourstore.com/robots.txt in a browser to confirm the change is live.'),
 ('3. Product structured data — JSON-LD (12 points)',
  'What it is: a JSON-LD block on every product page declaring the product with schema.org vocabulary.',
  'How to fix: WooCommerce — the Yoast SEO or Rank Math plugin adds Product schema automatically; check it is enabled. Squarespace — Product schema is built in on Commerce product pages. Etsy — Etsy adds its own schema; you cannot edit it, so focus on checks 1, 2, 5 and 8 instead. Independent sites — add the block from the template in Section 5 to your product template, not page by page. Validate at validator.schema.org.'),
 ('4. Price + availability in structured data (10 points)',
  'What it is: inside the Product schema, offers.price, offers.priceCurrency and offers.availability (e.g. https://schema.org/InStock).',
  'How to fix: this usually fails because the price is rendered by JavaScript or the theme omits the offers block. If your platform generates schema automatically, check that the price field is populated and the currency is set. Out-of-stock products should say OutOfStock, not disappear — disappearing products teach assistants your store is unreliable.'),
 ('5. Product feed exists (10 points)',
  'What it is: a machine-readable list of your products (Google Merchant Center feed, Etsy feed, or a products.xml file). Since mid-2026 this is the main way ChatGPT Shopping discovers products.',
  'How to fix: WooCommerce — install the Google for WooCommerce plugin and connect Google Merchant Center; it generates and syncs the feed. Squarespace — Commerce &gt; Google Shopping, connect Merchant Center. Etsy — your listings are already in Etsy\'s feed; instead submit your shop to OpenAI\'s Business Hub (see Section 7). Add the feed URL to robots.txt as a Sitemap line so crawlers find it.'),
 ('6. Sitemap lists products (8 points)',
  'What it is: your sitemap.xml must include product URLs, not just blog posts and policy pages.',
  'How to fix: WooCommerce — Yoast/Rank Math include products by default; check the sitemap includes /product/ URLs. Squarespace — the sitemap is automatic and includes products. Etsy — no sitemap control; skip this check and put the effort into the feed and Business Hub. Submit the sitemap in Google Search Console so you know it is being read.'),
 ('7. Products render without JavaScript (8 points)',
  'What it is: product name and price must appear in the raw HTML. If they only appear after JavaScript runs, many crawlers see an empty page.',
  'How to fix: test it yourself — open a product page, disable JavaScript in your browser, reload. If the price vanishes, your theme or app is client-side rendered. WooCommerce/Squarespace/Etsy themes render server-side by default; the problem usually comes from a page-builder or a headless setup. Switch on server-side rendering or pre-rendering for product pages.'),
 ('8. Shipping + returns pages exist (8 points)',
  'What it is: shipping and returns policy pages linked from your footer, written in plain language.',
  'How to fix: write one page each, or one combined "Shipping &amp; Returns" page linked twice. Include: processing time, shipping destinations and cost, delivery time, return window, who pays return shipping, and how refunds are issued. Assistants quote these pages to shoppers, so vague policies cost you recommendations.'),
 ('9. Reviews / ratings markup (6 points)',
  'What it is: AggregateRating in your Product schema, plus visible star ratings on the page.',
  'How to fix: enable reviews on your platform and make sure your schema plugin includes the rating. With zero reviews you cannot fake this — instead, email your last 20 customers and ask for a review; five genuine reviews beat a perfect score with none. Never buy reviews.'),
 ('10. Image alt text (8 points)',
  'What it is: every product image needs a descriptive alt attribute — it is how an assistant "sees" the image.',
  'How to fix: alt text should describe the product ("Blue ceramic mug, 12 oz, matte finish"), not stuff keywords ("mug buy cheap best mug"). Most platforms let you edit alt text in the media library; do your 20 bestsellers first.'),
 ('11. Canonical URLs (6 points)',
  'What it is: a &lt;link rel="canonical"&gt; on every page telling search engines which URL is the real one.',
  'How to fix: WooCommerce — Yoast/Rank Math handle this. Squarespace — built in. Etsy — built in. If you run a custom site, add the canonical to your template. The symptom of a missing canonical is the same product appearing under three URLs and none of them ranking.'),
 ('12. Agent-completable checkout (8 points)',
  'What it is: whether an assistant can finish the purchase — express wallets (Apple Pay / Google Pay) and agent-checkout support (Universal Commerce Protocol / Agentic Commerce Protocol).',
  'How to fix: enable Apple Pay and Google Pay in your payment settings today — that alone is most of the value. Full agent checkout (UCP/ACP) is rolling out through 2026 and support varies by platform; Section 7 explains what is real now and what to do about it. This check cannot be fully verified from a static page, so confirm it with a real test purchase.'),
]
for title, what, fix in checks:
    story.append(P(title, H2))
    story.append(P(what, BODY))
    story.append(P(fix, BODY))

story.append(P('4. Per-platform checklists', H1))

story.append(P('Etsy sellers', H2))
story.append(P('Etsy controls your product pages, schema and sitemap — you cannot edit them. Your leverage is elsewhere:', BODY))
for t in [
 'Write an llms.txt and host it on a simple page you control (your own domain, Carrd, or a free static site) that links to your Etsy shop; link that page from your shop announcement.',
 'Your robots.txt is Etsy\'s, not yours — you cannot change it. Instead, submit your shop to OpenAI\'s Business Hub (Section 7) and keep your listings\' titles and tags precise: the first 55 characters of the title matter most.',
 'Fill in every listing attribute (materials, size, colour) and add a shop policies section with processing time, shipping and returns. Assistants read these.',
 'Enable reviews: follow up every order with a short thank-you message asking for a review. Five real reviews change your visibility more than any technical fix available to you.',
 'Alt text: Etsy uses your image filenames and listing text; name image files descriptively before upload (blue-ceramic-mug.jpg, not IMG_4821.jpg).',
]:
    story.append(B(t))

story.append(P('WooCommerce stores', H2))
story.append(P('You control everything, so work the list in this order:', BODY))
for t in [
 'Install Yoast SEO or Rank Math; enable Product schema and check one product page at validator.schema.org.',
 'Install Google for WooCommerce; connect Google Merchant Center; confirm the feed syncs and has no errors.',
 'Add llms.txt and the robots.txt Allow rules from Section 5 (use a file manager or the Rank Math file editor).',
 'Check a product page with JavaScript disabled. If the price vanishes, your theme or builder is the problem — switch the product template to server rendering.',
 'Enable Apple Pay and Google Pay in WooCommerce Payments or Stripe.',
 'Submit the sitemap in Google Search Console and the store in OpenAI\'s Business Hub.',
]:
    story.append(B(t))

story.append(P('Squarespace stores', H2))
story.append(P('Most technical pieces are built in; your work is content and connections:', BODY))
for t in [
 'Commerce &gt; Google Shopping: connect Google Merchant Center and confirm the feed is live.',
 'Add llms.txt via Settings &gt; Developer Tools &gt; Custom Files (or link it from a page you control) and confirm the robots rules in Settings &gt; SEO.',
 'Product schema, sitemap and canonicals are automatic — verify one product page at validator.schema.org rather than assuming.',
 'Write shipping and returns pages and link them in the footer navigation.',
 'Enable Apple Pay in Commerce &gt; Payments; add at least five product reviews (Commerce &gt; Reviews).',
 'Submit the store to OpenAI\'s Business Hub.',
]:
    story.append(B(t))

story.append(P('5. Copy-paste templates', H1))
story.append(P('Replace the ALL-CAPS placeholders with your own details. The snippet generator included with this kit (snippet-generator.html) fills these in for you — open it in any browser, no upload needed.', BODY))
story.append(P('llms.txt — save as llms.txt in your site root', H2))
story.append(CODEBLOCK('# YOUR STORE NAME\n\n> One sentence describing what you sell and who it is for.\n\n## Store\n\n- Store URL: https://YOURSTORE.COM\n- Contact: YOUR EMAIL\n- Shipping: SHIPS FROM / TO, PROCESSING TIME\n- Returns: RETURN WINDOW AND TERMS IN ONE LINE\n\n## Bestsellers\n\n- PRODUCT NAME — one line: what it is, price, who it is for\n- PRODUCT NAME — one line\n- PRODUCT NAME — one line\n\n## Categories\n\n- CATEGORY: https://YOURSTORE.COM/category-url\n- CATEGORY: https://YOURSTORE.COM/category-url\n\n## Policies\n\n- Shipping: https://YOURSTORE.COM/shipping\n- Returns: https://YOURSTORE.COM/returns\n'))
story.append(P('robots.txt — add these lines (keep your existing rules)', H2))
story.append(CODEBLOCK('User-agent: GPTBot\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: ChatGPT-User\nAllow: /\n\nSitemap: https://YOURSTORE.COM/sitemap.xml\nSitemap: https://YOURSTORE.COM/products.xml'))
story.append(P('Product JSON-LD — one block per product page', H2))
story.append(CODEBLOCK('<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Product",\n  "name": "PRODUCT NAME",\n  "description": "ONE SENTENCE.",\n  "image": "https://YOURSTORE.COM/images/product.jpg",\n  "offers": {\n    "@type": "Offer",\n    "price": "19.99",\n    "priceCurrency": "USD",\n    "availability": "https://schema.org/InStock"\n  }\n}\n</script>'))

story.append(P('6. Product feeds, in 10 minutes', H1))
story.append(P('A feed is a file listing every product with its title, price, image, availability and link. You do not write it by hand — your platform generates it:', BODY))
story.append(B('<b>WooCommerce:</b> Google for WooCommerce plugin &rarr; connect Merchant Center &rarr; the feed syncs automatically. Check Merchant Center for errors weekly for the first month.'))
story.append(B('<b>Squarespace:</b> Commerce &gt; Google Shopping &rarr; connect Merchant Center.'))
story.append(B('<b>Etsy:</b> no feed of your own — your listings are in Etsy\'s feed. Your job is titles, attributes and policies, plus Business Hub (Section 7).'))
story.append(P('Common feed rejections and their fixes: missing GTIN (use "identifier_exists: false" for handmade goods), price mismatch between feed and page (sync again after any price change), and out-of-stock items listed as in stock (fix your stock sync before anything else).', BODY))

story.append(P('7. Agent checkout (UCP / ACP) — what is real', H1))
story.append(P('Universal Commerce Protocol (Google) and Agentic Commerce Protocol (OpenAI/Stripe) are the emerging standards that let an assistant complete a purchase inside a chat. As of November 2026 they are rolling out, not universal: support depends on your platform and payment provider, and the details change monthly.', BODY))
story.append(P('What to do now:', BODY))
story.append(B('Enable Apple Pay and Google Pay. This is available today on every major platform and is most of the practical value.'))
story.append(B('Submit your store to OpenAI\'s Business Hub and keep your Merchant Center feed healthy. These are the two onboarding paths assistants actually use today.'))
story.append(B('Do not pay anyone who promises to "make you UCP-ready" for a fee. There is no certification to buy; readiness is feed + schema + express checkout.'))
story.append(B('Re-check quarterly: when your platform announces agent-checkout support, enable it the same week.'))

story.append(P('8. Your 14-day plan', H1))
for t in [
 '<b>Day 1:</b> run the free checker, write down your score, and fix robots.txt + llms.txt (Sections 3 and 5). Re-run the checker.',
 '<b>Day 2–3:</b> connect your product feed (Section 6) and validate one product page\'s schema.',
 '<b>Day 4–5:</b> publish shipping and returns pages; add alt text to your 20 bestsellers.',
 '<b>Day 6–7:</b> enable Apple Pay / Google Pay; ask your last 20 customers for reviews.',
 '<b>Day 8:</b> submit the store to OpenAI\'s Business Hub and your sitemap to Google Search Console.',
 '<b>Day 9–14:</b> fix whatever still fails, re-run the checker, and write down the before/after scores. If the score does not move, the fix did not take — check that the change is actually live on the public site, not only in your admin.',
]:
    story.append(B(t))

story.append(P('Sources and limits', H1))
story.append(P('Adobe Analytics traffic and conversion figures: Adobe, as reported by Verlua, August 2026. Profound feed-share and visibility figures: Profound, September 2026 — vendor-run prompts, not real shopper sessions. AgentWatch: Product Hunt listing, 11 November 2026 (Shopify-only). Platform steps were correct for WooCommerce, Squarespace and Etsy as of November 2026; admin menus move — search your platform\'s help centre if a menu has moved.', SMALL))
story.append(P('This kit is general guidance, not legal or platform advice. If a platform\'s own documentation contradicts this kit, follow the platform.', SMALL))
story.append(P('Agent-Ready Store Audit — Fix Kit. Free lite checker: run the checks again any time; no data leaves your browser.', SMALL))

doc = SimpleDocTemplate('/home/hatch/workspace/make-money/store-audit/kit/agent-ready-store-audit-kit.pdf',
                        pagesize=A4, topMargin=18 * mm, bottomMargin=18 * mm, leftMargin=20 * mm, rightMargin=20 * mm,
                        title='Agent-Ready Store Audit — Fix Kit')
doc.build(story)
print('PDF built')
