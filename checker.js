/* Agent-Ready Store Audit — free lite checker (client-side, no backend).
 *
 * Core logic is pure functions over strings so it can be tested in Node:
 *   runChecks(inputs) -> { score, maxScore, checks: [...], fixes: [...] }
 * Browser glue is at the bottom, guarded by `typeof window !== 'undefined'`.
 * In Node: module.exports = { runChecks, CHECKS, SELF_CHECK_QUESTIONS }.
 */

'use strict';

var CHECKS = [
  { id: 1,  name: 'llms.txt present',                 weight: 8,  why: 'AI assistants read llms.txt to learn what your store sells. Without it, they guess from scattered pages.' },
  { id: 2,  name: 'robots.txt allows AI shopping bots', weight: 8, why: 'If GPTBot / OAI-SearchBot are disallowed, ChatGPT cannot crawl your store at all.' },
  { id: 3,  name: 'Product structured data (JSON-LD)', weight: 12, why: 'Product schema is how assistants extract name, price and availability reliably instead of scraping text.' },
  { id: 4,  name: 'Price + availability in structured data', weight: 10, why: 'A product without a machine-readable price and stock status cannot be recommended or bought by an agent.' },
  { id: 5,  name: 'Product feed exists',              weight: 10, why: 'Since mid-2026 most ChatGPT Shopping picks come from merchant feeds, not crawled pages. No feed = invisible.' },
  { id: 6,  name: 'Sitemap lists products',           weight: 8,  why: 'A sitemap that lists product URLs is the fallback discovery path when no feed exists.' },
  { id: 7,  name: 'Products render without JavaScript', weight: 8, why: 'If prices only appear after JS runs, many crawlers see an empty page.' },
  { id: 8,  name: 'Shipping + returns pages exist',   weight: 8,  why: 'Assistants will not recommend a store whose shipping and returns terms they cannot read.' },
  { id: 9,  name: 'Reviews / ratings markup',         weight: 6,  why: 'AggregateRating markup is a trust signal assistants use to rank otherwise similar products.' },
  { id: 10, name: 'Image alt text',                   weight: 8,  why: 'Alt text is how an assistant "sees" your product images and matches them to a shopper\'s request.' },
  { id: 11, name: 'Canonical URLs',                   weight: 6,  why: 'Canonical tags stop duplicate product URLs from splitting your visibility.' },
  { id: 12, name: 'Agent-completable checkout',        weight: 8,  why: 'The end goal is a purchase. Express wallets and agent-checkout support (UCP/ACP) decide whether an assistant can finish the sale.' }
];

var SELF_CHECK_QUESTIONS = [
  { key: 'llms',     label: 'Do you have an llms.txt file at yourstore.com/llms.txt?', checkId: 1 },
  { key: 'robots',   label: 'Does your robots.txt allow GPTBot and OAI-SearchBot? (no "Disallow: /" for them)', checkId: 2 },
  { key: 'feed',     label: 'Do you have a product feed — Google Merchant Center, an Etsy feed, or a products.xml file?', checkId: 5 },
  { key: 'nojs',     label: 'If you turn JavaScript off, do your product names and prices still show on the page?', checkId: 7 },
  { key: 'policies', label: 'Are shipping and returns policy pages linked from your footer?', checkId: 8 },
  { key: 'reviews',  label: 'Do your product pages show star ratings or a review count?', checkId: 9 },
  { key: 'wallet',   label: 'Can a customer check out with Apple Pay or Google Pay?', checkId: 12 },
  { key: 'hub',      label: 'Have you submitted your store to OpenAI\'s Business Hub / ChatGPT merchant onboarding?', checkId: 12 }
];

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function extractJsonLd(html) {
  var out = [];
  var re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  var m;
  while ((m = re.exec(html)) !== null) {
    try { out.push(JSON.parse(m[1].trim())); }
    catch (e) { out.push({ __parseError: true, __raw: m[1].slice(0, 200) }); }
  }
  return out;
}

function flattenJsonLd(node, acc) {
  acc = acc || [];
  if (!node || typeof node !== 'object') return acc;
  if (Array.isArray(node)) { node.forEach(function (n) { flattenJsonLd(n, acc); }); return acc; }
  acc.push(node);
  if (node['@graph']) flattenJsonLd(node['@graph'], acc);
  if (node.mainEntity) flattenJsonLd(node.mainEntity, acc);
  if (node.itemListElement) flattenJsonLd(node.itemListElement, acc);
  return acc;
}

function findProducts(jsonLdBlocks) {
  var products = [];
  jsonLdBlocks.forEach(function (b) {
    flattenJsonLd(b).forEach(function (n) {
      var t = n['@type'];
      if (t === 'Product' || (Array.isArray(t) && t.indexOf('Product') !== -1)) products.push(n);
    });
  });
  return products;
}

function countImgs(html) {
  var tags = html.match(/<img\b[^>]*>/gi) || [];
  var withAlt = tags.filter(function (t) {
    var m = t.match(/\balt\s*=\s*["']([^"']*)["']/i);
    return m && m[1].trim().length > 0;
  }).length;
  return { total: tags.length, withAlt: withAlt };
}

function firstProductUrl(html, base) {
  var re = /<a\b[^>]*href=["']([^"']*(?:product|item|shop\/[^"']*|listing)[^"']*)["']/gi;
  var m;
  while ((m = re.exec(html)) !== null) {
    var href = m[1];
    if (href.indexOf('#') === 0 || href.indexOf('javascript:') === 0) continue;
    try { return new URL(href, base).href; } catch (e) { /* keep scanning */ }
  }
  return null;
}

function hasLink(html, pattern) {
  var re = new RegExp('<a\\b[^>]*href=["\'][^"\']*' + pattern + '[^"\']*["\']', 'i');
  return re.test(html);
}

function robotsAllows(robotsTxt, bot) {
  if (!robotsTxt) return null; // unknown
  var groups = [];
  var cur = null;
  robotsTxt.split(/\r?\n/).forEach(function (raw) {
    var line = raw.split('#')[0].trim();
    if (!line) return;
    var ua = line.match(/^User-agent:\s*(.+)$/i);
    if (ua) {
      var name = ua[1].trim().toLowerCase();
      if (cur && cur.sawRule) { groups.push(cur); cur = null; }
      if (!cur) cur = { agents: [], disallows: [], allows: [], sawRule: false };
      cur.agents.push(name);
      return;
    }
    var dis = line.match(/^Disallow:\s*(.*)$/i);
    if (dis && cur) { cur.sawRule = true; cur.disallows.push(dis[1].trim()); return; }
    var allow = line.match(/^Allow:\s*(.*)$/i);
    if (allow && cur) { cur.sawRule = true; cur.allows.push(allow[1].trim()); }
  });
  if (cur) groups.push(cur);
  var target = bot.toLowerCase();
  var match = null, star = null;
  groups.forEach(function (g) {
    if (g.agents.indexOf(target) !== -1) match = g;
    if (g.agents.indexOf('*') !== -1) star = g;
  });
  var g = match || star;
  if (!g) return true; // no rules at all = allowed
  if (g.allows.indexOf('/') !== -1) return true;
  // Blocked if a Disallow covers everything or the product paths.
  return !g.disallows.some(function (p) {
    return p === '/' || p.indexOf('/product') === 0 || p.indexOf('/shop') === 0 ||
      p.indexOf('/item') === 0 || p.indexOf('/listing') === 0;
  });
}

/* inputs:
 * {
 *   homepageHtml, productHtml, robotsTxt, llmsTxt, sitemapXml, feedHint,
 *   homepageUrl, answers: { llms, robots, feed, nojs, policies, reviews, wallet, hub } (true/false/null),
 *   fetchErrors: { robots: bool, llms: bool, sitemap: bool, product: bool }
 * }
 * Any missing string is treated as "not available" -> check becomes 'unknown'
 * unless a self-check answer covers it.
 */
function runChecks(inputs) {
  inputs = inputs || {};
  var hp = inputs.homepageHtml || '';
  var pp = inputs.productHtml || hp;
  var results = [];
  var fixes = [];

  function push(id, status, points, detail, fix) {
    var meta = CHECKS[id - 1];
    results.push({ id: id, name: meta.name, weight: meta.weight, status: status, points: points, detail: detail, fix: fix || null });
    if (status !== 'pass' && fix) fixes.push({ check: meta.name, priority: status === 'fail' ? 'high' : 'medium', fix: fix });
  }

  // --- 1. llms.txt ---
  if (inputs.llmsTxt !== undefined && inputs.llmsTxt !== null) {
    if (String(inputs.llmsTxt).trim().length > 20) push(1, 'pass', 8, 'llms.txt found and non-empty.');
    else push(1, 'fail', 0, 'llms.txt exists but is empty.', 'Write an llms.txt listing your store, bestsellers and policies (see the fix kit for a template).');
  } else if (inputs.answers && inputs.answers.llms === true) {
    push(1, 'pass', 8, 'You confirmed an llms.txt exists (self-check).');
  } else if (inputs.answers && inputs.answers.llms === false) {
    push(1, 'fail', 0, 'No llms.txt (self-check).', 'Write an llms.txt listing your store, bestsellers and policies (see the fix kit for a template).');
  } else {
    push(1, 'unknown', 0, 'Could not check llms.txt (fetch blocked or not attempted). Answer the self-check question to score this.', 'Check whether yourstore.com/llms.txt exists; if not, add one.');
  }

  // --- 2. robots.txt ---
  var r = inputs.robotsTxt;
  if (r !== undefined && r !== null) {
    var gpt = robotsAllows(r, 'GPTBot'), oai = robotsAllows(r, 'OAI-SearchBot'), gg = robotsAllows(r, 'Googlebot');
    if (gpt && oai && gg) push(2, 'pass', 8, 'robots.txt allows GPTBot, OAI-SearchBot and Googlebot.');
    else {
      var blocked = [];
      if (!gpt) blocked.push('GPTBot'); if (!oai) blocked.push('OAI-SearchBot'); if (!gg) blocked.push('Googlebot');
      push(2, 'fail', 0, 'robots.txt blocks: ' + blocked.join(', ') + '.', 'Add explicit Allow rules for GPTBot and OAI-SearchBot in robots.txt (see the fix kit).');
    }
  } else if (inputs.answers && inputs.answers.robots === true) {
    push(2, 'pass', 8, 'You confirmed robots.txt allows AI bots (self-check).');
  } else if (inputs.answers && inputs.answers.robots === false) {
    push(2, 'fail', 0, 'robots.txt blocks AI bots (self-check).', 'Add explicit Allow rules for GPTBot and OAI-SearchBot in robots.txt (see the fix kit).');
  } else {
    push(2, 'unknown', 0, 'Could not fetch robots.txt. Answer the self-check question to score this.', 'Open yourstore.com/robots.txt and check for GPTBot / OAI-SearchBot rules.');
  }

  // --- 3. JSON-LD Product ---
  var blocks = extractJsonLd(pp);
  var products = findProducts(blocks);
  var parseErr = blocks.some(function (b) { return b.__parseError; });
  if (products.length > 0) {
    push(3, 'pass', 12, 'Found ' + products.length + ' Product structured-data block(s).');
  } else if (parseErr) {
    push(3, 'fail', 0, 'Found JSON-LD but it is invalid JSON.', 'Fix the JSON syntax in your structured-data block; a single bad comma invalidates the whole block.');
  } else if (hp) {
    push(3, 'fail', 0, 'No Product JSON-LD found on the product page.', 'Add Product schema (name, image, description, offers) to every product page.');
  } else {
    push(3, 'unknown', 0, 'No page HTML available to check.', 'Paste a product page HTML to check structured data.');
  }

  // --- 4. Price + availability ---
  if (products.length > 0) {
    var ok = products.some(function (p) {
      var offers = p.offers;
      if (!offers) return false;
      var list = Array.isArray(offers) ? offers : [offers];
      return list.some(function (o) {
        return o && o.price !== undefined && o.price !== null && String(o.price).trim() !== '' &&
          o.availability && String(o.availability).length > 0;
      });
    });
    if (ok) push(4, 'pass', 10, 'Price and availability are present in structured data.');
    else push(4, 'fail', 0, 'Product schema exists but price or availability is missing.', 'Add offers.price, offers.priceCurrency and offers.availability (e.g. https://schema.org/InStock) to your Product schema.');
  } else if (hp) {
    push(4, 'fail', 0, 'No Product schema, so no machine-readable price/availability.', 'Add Product schema with offers to your product pages.');
  } else {
    push(4, 'unknown', 0, 'No page HTML available to check.', 'Paste a product page HTML to check price markup.');
  }

  // --- 5. Product feed ---
  var feedFound = false, feedEvidence = '';
  if (inputs.feedHint) { feedFound = true; feedEvidence = inputs.feedHint; }
  if (!feedFound && r) {
    var sm = r.match(/Sitemap:\s*(\S+)/i);
    if (sm && /product|feed|shop/i.test(sm[1])) { feedFound = true; feedEvidence = 'robots.txt points to a product sitemap/feed: ' + sm[1]; }
  }
  if (!feedFound && hp) {
    if (/products\.xml|product[_-]?feed|google.*merchant|merchant.*feed|\.xml["'][^>]*feed/i.test(hp)) { feedFound = true; feedEvidence = 'A feed link was found in the homepage HTML.'; }
  }
  if (feedFound) push(5, 'pass', 10, feedEvidence);
  else if (inputs.answers && inputs.answers.feed === true) push(5, 'pass', 10, 'You confirmed a product feed exists (self-check).');
  else if (inputs.answers && inputs.answers.feed === false) push(5, 'fail', 0, 'No product feed (self-check).', 'Create a product feed (Google Merchant Center for WooCommerce, or your platform\'s feed) and link it in robots.txt.');
  else push(5, 'unknown', 0, 'No feed found in the fetched pages. Answer the self-check question to confirm.', 'Check whether your platform generates a product feed; if not, create one and link it from robots.txt.');

  // --- 6. Sitemap ---
  if (inputs.sitemapXml !== undefined && inputs.sitemapXml !== null) {
    var s = String(inputs.sitemapXml);
    var hasProducts = /product|item|listing|shop\//i.test(s);
    if (hasProducts) push(6, 'pass', 8, 'Sitemap exists and lists product URLs.');
    else push(6, 'warn', 4, 'Sitemap exists but no product URLs were detected in it.', 'Make sure your sitemap includes product pages, not just blog posts and policy pages.');
  } else if (hp && /sitemap/i.test(hp)) {
    push(6, 'warn', 4, 'A sitemap link was found on the homepage but its contents could not be fetched.', 'Open your sitemap and confirm product URLs are listed.');
  } else {
    push(6, 'unknown', 0, 'Could not fetch the sitemap.', 'Confirm yourstore.com/sitemap.xml exists and lists product URLs.');
  }

  // --- 7. JS-only rendering ---
  if (inputs.answers && inputs.answers.nojs === true) {
    push(7, 'pass', 8, 'You confirmed prices show with JavaScript off (self-check).');
  } else if (inputs.answers && inputs.answers.nojs === false) {
    push(7, 'fail', 0, 'Prices need JavaScript to appear (self-check).', 'Render product name and price in the server HTML (server-side rendering or pre-rendering).');
  } else if (hp) {
    var hasPriceText = /\$\s?\d|€\s?\d|£\s?\d|\d+\.\d{2}/.test(hp.replace(/<script[\s\S]*?<\/script>/gi, ''));
    var shellOnly = /<div[^>]*id=["'](root|app|__next)["'][^>]*>\s*<\/div>/i.test(hp) && !hasPriceText;
    if (hasPriceText) push(7, 'pass', 8, 'Product prices appear in the raw HTML (no JavaScript needed).');
    else if (shellOnly) push(7, 'fail', 0, 'The page is an empty app shell — content only appears after JavaScript runs.', 'Render product name and price in the server HTML.');
    else push(7, 'warn', 4, 'No prices were found in the raw homepage HTML. This may be a JS-rendered store.', 'Check with JavaScript disabled; if prices vanish, switch on server-side rendering.');
  } else {
    push(7, 'unknown', 0, 'No page HTML available to check.', 'Paste homepage HTML or answer the self-check question.');
  }

  // --- 8. Policies ---
  var ship = hasLink(hp, 'shipping|delivery');
  var ret = hasLink(hp, 'return|refund');
  if (ship && ret) push(8, 'pass', 8, 'Shipping and returns pages are linked.');
  else if (ship || ret) push(8, 'warn', 4, 'Only one of shipping / returns is linked.', 'Link both a shipping policy and a returns policy from your footer.');
  else if (inputs.answers && inputs.answers.policies === true) push(8, 'pass', 8, 'You confirmed both policy pages exist (self-check).');
  else if (inputs.answers && inputs.answers.policies === false) push(8, 'fail', 0, 'No shipping/returns pages (self-check).', 'Publish shipping and returns pages and link them from your footer.');
  else if (hp) push(8, 'fail', 0, 'No shipping or returns links found on the homepage.', 'Publish shipping and returns pages and link them from your footer.');
  else push(8, 'unknown', 0, 'No page HTML available to check.', 'Paste homepage HTML or answer the self-check question.');

  // --- 9. Reviews ---
  var hasRating = false;
  products.forEach(function (p) { if (p.aggregateRating) hasRating = true; });
  if (!hasRating && /aggregateRating|reviewCount|ratingValue/i.test(pp)) hasRating = true;
  if (hasRating) push(9, 'pass', 6, 'Review/rating markup found.');
  else if (inputs.answers && inputs.answers.reviews === true) push(9, 'pass', 6, 'You confirmed ratings show on product pages (self-check).');
  else if (inputs.answers && inputs.answers.reviews === false) push(9, 'fail', 0, 'No ratings shown (self-check).', 'Enable reviews on your platform and add AggregateRating to your Product schema.');
  else if (hp) push(9, 'fail', 0, 'No review or rating markup found.', 'Enable reviews on your platform and add AggregateRating to your Product schema.');
  else push(9, 'unknown', 0, 'No page HTML available to check.', 'Paste a product page HTML or answer the self-check question.');

  // --- 10. Alt text ---
  if (hp) {
    var imgs = countImgs(hp);
    if (imgs.total === 0) push(10, 'warn', 4, 'No <img> tags found in the homepage HTML (images may load via CSS/JS).', 'Give every product image a descriptive alt attribute.');
    else {
      var pct = Math.round(100 * imgs.withAlt / imgs.total);
      if (pct >= 80) push(10, 'pass', 8, pct + '% of images (' + imgs.withAlt + '/' + imgs.total + ') have alt text.');
      else if (pct >= 50) push(10, 'warn', 4, 'Only ' + pct + '% of images (' + imgs.withAlt + '/' + imgs.total + ') have alt text.', 'Add descriptive alt text to the remaining product images.');
      else push(10, 'fail', 0, 'Only ' + pct + '% of images (' + imgs.withAlt + '/' + imgs.total + ') have alt text.', 'Add descriptive alt text to every product image — it is how assistants "see" your products.');
    }
  } else {
    push(10, 'unknown', 0, 'No page HTML available to check.', 'Paste homepage HTML to check image alt text.');
  }

  // --- 11. Canonical ---
  if (hp) {
    if (/<link[^>]*rel=["']canonical["']/i.test(hp)) push(11, 'pass', 6, 'Canonical link present.');
    else push(11, 'fail', 0, 'No canonical link found.', 'Add a <link rel="canonical"> to every page; most platforms do this automatically — check your SEO settings.');
  } else {
    push(11, 'unknown', 0, 'No page HTML available to check.', 'Paste homepage HTML to check canonical tags.');
  }

  // --- 12. Agent-completable checkout ---
  var wallet = /apple\s*pay|google\s*pay/i.test(hp);
  var ucp = /universal commerce protocol|\bUCP\b|agentic commerce protocol|\bACP\b|agent.?checkout|chatgpt.*checkout|buy.*chatgpt/i.test(hp);
  var checkoutLink = hasLink(hp, 'checkout|cart');
  var httpsOk = !inputs.homepageUrl || inputs.homepageUrl.indexOf('https://') === 0;
  if (inputs.answers && inputs.answers.hub === true && (wallet || checkoutLink)) {
    push(12, 'pass', 8, 'Store is submitted to OpenAI Business Hub and offers express checkout. (Static checks cannot fully verify agent checkout — confirm a test purchase via an assistant.)');
  } else if (wallet && checkoutLink && httpsOk) {
    push(12, 'warn', 4, 'Express wallets detected, but agent-checkout support (UCP/ACP) could not be verified from the page. This check cannot be fully proven statically.', 'Submit your store to OpenAI\'s Business Hub and confirm your checkout supports agent-initiated purchases; see the fix kit.');
  } else if (inputs.answers && inputs.answers.wallet === true) {
    push(12, 'warn', 4, 'You confirmed express wallets (self-check), but agent-checkout support could not be verified statically.', 'Submit your store to OpenAI\'s Business Hub and confirm agent-initiated checkout works.');
  } else if (checkoutLink) {
    push(12, 'warn', 4, 'A checkout exists, but no express wallet or agent-checkout signal was found.', 'Enable Apple Pay / Google Pay and check your platform\'s agent-checkout (UCP/ACP) support.');
  } else if (inputs.answers && inputs.answers.wallet === false) {
    push(12, 'fail', 0, 'No express wallet checkout (self-check).', 'Enable Apple Pay / Google Pay — assistants prefer checkouts they can complete in one step.');
  } else if (hp) {
    push(12, 'warn', 4, 'No express-wallet or agent-checkout signal found in the page.', 'Enable Apple Pay / Google Pay and check your platform\'s agent-checkout (UCP/ACP) support.');
  } else {
    push(12, 'unknown', 0, 'No page HTML available to check.', 'Paste homepage HTML or answer the self-check questions.');
  }

  var score = results.reduce(function (s, r) { return s + r.points; }, 0);
  var maxScore = CHECKS.reduce(function (s, c) { return s + c.weight; }, 0);
  fixes.sort(function (a, b) { return (a.priority === 'high' ? 0 : 1) - (b.priority === 'high' ? 0 : 1); });
  return { score: score, maxScore: maxScore, checks: results, fixes: fixes };
}

function verdict(score, max) {
  var pct = Math.round(100 * score / max);
  if (pct >= 80) return 'Agent-ready — your store is in good shape. Fix the remaining items to stay ahead.';
  if (pct >= 50) return 'Partly visible — AI assistants can find some of your store, but you are likely losing recommendations.';
  return 'Mostly invisible — AI shopping assistants probably cannot find or buy from your store yet.';
}

function textReport(storeUrl, result) {
  var lines = [];
  lines.push('AGENT-READY STORE AUDIT — LITE CHECK');
  lines.push('Store: ' + (storeUrl || 'not given'));
  lines.push('Date: ' + new Date().toISOString().slice(0, 10));
  lines.push('Score: ' + result.score + ' / ' + result.maxScore + ' — ' + verdict(result.score, result.maxScore));
  lines.push('');
  result.checks.forEach(function (c) {
    lines.push('[' + c.status.toUpperCase() + '] ' + c.id + '. ' + c.name + ' — ' + c.points + '/' + c.weight);
    lines.push('    ' + c.detail);
    if (c.fix) lines.push('    Fix: ' + c.fix);
  });
  lines.push('');
  lines.push('PRIORITISED FIXES');
  if (result.fixes.length === 0) lines.push('None — everything passed.');
  result.fixes.forEach(function (f, i) { lines.push((i + 1) + '. [' + f.priority + '] ' + f.check + ': ' + f.fix); });
  lines.push('');
  lines.push('Note: this lite checker runs entirely in your browser. Some checks cannot be verified');
  lines.push('from a static page (notably full agent-checkout support). For the complete fix kit');
  lines.push('with per-platform checklists and copy-paste llms.txt / robots.txt templates, see');
  lines.push('the Agent-Ready Store Audit Fix Kit.');
  return lines.join('\n');
}

/* ---------------- Browser glue ---------------- */
if (typeof window !== 'undefined') {
  window.StoreAudit = { runChecks: runChecks, CHECKS: CHECKS, SELF_CHECK_QUESTIONS: SELF_CHECK_QUESTIONS, verdict: verdict, textReport: textReport, firstProductUrl: firstProductUrl };

  document.addEventListener('DOMContentLoaded', function () {
    var $ = function (id) { return document.getElementById(id); };
    var mode = 'url';
    var lastResult = null, lastUrl = '';

    function showTab(which) {
      mode = which;
      ['url', 'paste', 'self'].forEach(function (m) {
        $('tab-' + m).classList.toggle('active', m === which);
        $('panel-' + m).classList.toggle('hidden', m !== which);
      });
    }
    ['url', 'paste', 'self'].forEach(function (m) {
      $('tab-' + m).addEventListener('click', function () { showTab(m); });
    });

    function render(result, url) {
      lastResult = result; lastUrl = url;
      var pct = Math.round(100 * result.score / result.maxScore);
      $('results').classList.remove('hidden');
      $('score-num').textContent = result.score + ' / ' + result.maxScore;
      $('score-bar').style.width = pct + '%';
      $('score-bar').className = 'score-bar ' + (pct >= 80 ? 'good' : pct >= 50 ? 'ok' : 'bad');
      $('verdict').textContent = verdict(result.score, result.maxScore);
      var html = '';
      result.checks.forEach(function (c) {
        html += '<div class="check ' + c.status + '"><div class="check-head"><span class="badge">' + c.status.toUpperCase() + '</span>' +
          '<strong>' + c.id + '. ' + c.name + '</strong><span class="pts">' + c.points + '/' + c.weight + '</span></div>' +
          '<p>' + c.detail + '</p>' + (c.fix ? '<p class="fix">Fix: ' + c.fix + '</p>' : '') + '</div>';
      });
      $('checks').innerHTML = html;
      var fh = '';
      if (result.fixes.length) {
        fh = '<h3>Prioritised fixes</h3><ol>' + result.fixes.map(function (f) {
          return '<li><strong>[' + f.priority + ']</strong> ' + f.check + ' — ' + f.fix + '</li>';
        }).join('') + '</ol>';
      } else { fh = '<h3>Prioritised fixes</h3><p>None — everything passed.</p>'; }
      $('fixes').innerHTML = fh;
      $('download').classList.remove('hidden');
      $('results').scrollIntoView({ behavior: 'smooth' });
    }

    function readAnswers() {
      var a = {};
      SELF_CHECK_QUESTIONS.forEach(function (q) {
        var el = document.querySelector('input[name="q-' + q.key + '"]:checked');
        a[q.key] = el ? el.value === 'yes' : null;
      });
      return a;
    }

    async function tryFetch(url) {
      try {
        var res = await fetch(url, { mode: 'cors' });
        if (!res.ok) return { ok: false, status: res.status };
        return { ok: true, text: await res.text() };
      } catch (e) { return { ok: false, error: String(e) }; }
    }

    function normaliseUrl(raw) {
      raw = raw.trim();
      if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
      return raw.replace(/\/+$/, '');
    }

    $('run-url').addEventListener('click', async function () {
      var url = normaliseUrl($('store-url').value);
      if (!url) { $('url-status').textContent = 'Enter a store URL first.'; return; }
      $('url-status').textContent = 'Fetching ' + url + ' … (if this fails, your browser is blocking cross-site fetches — use the paste-HTML tab instead.)';
      var hp = await tryFetch(url + '/');
      if (!hp.ok) {
        $('url-status').textContent = 'Could not fetch the store from this browser (CORS / network). Use the "Paste HTML" tab: view-source the homepage, copy it, paste it here — no data leaves your browser.';
        showTab('paste');
        return;
      }
      var inputs = { homepageHtml: hp.text, homepageUrl: url, answers: readAnswers() };
      var robots = await tryFetch(url + '/robots.txt');
      if (robots.ok) inputs.robotsTxt = robots.text;
      var llms = await tryFetch(url + '/llms.txt');
      if (llms.ok) inputs.llmsTxt = llms.text;
      var sm = await tryFetch(url + '/sitemap.xml');
      if (sm.ok) inputs.sitemapXml = sm.text;
      var purl = firstProductUrl(hp.text, url + '/');
      if (purl) {
        var pr = await tryFetch(purl);
        if (pr.ok) inputs.productHtml = pr.text;
      }
      var result = runChecks(inputs);
      $('url-status').textContent = purl ? 'Checked homepage + product page.' : 'Checked homepage (no product link found on it).';
      render(result, url);
    });

    $('run-paste').addEventListener('click', function () {
      var html = $('paste-html').value;
      if (!html.trim()) { $('paste-status').textContent = 'Paste homepage HTML first.'; return; }
      var inputs = { homepageHtml: html, productHtml: html, answers: readAnswers() };
      var result = runChecks(inputs);
      $('paste-status').textContent = 'Checked from pasted HTML. Checks that need separate files (llms.txt, robots.txt, feed, sitemap) use your self-check answers.';
      render(result, $('paste-url').value || '');
    });

    $('run-self').addEventListener('click', function () {
      var inputs = { homepageHtml: '', answers: readAnswers() };
      var result = runChecks(inputs);
      render(result, '');
    });

    $('demo').addEventListener('click', async function () {
      $('url-status').textContent = 'Loading the built-in demo store…';
      var hp = await tryFetch('demo-fixture.html');
      if (!hp.ok) { $('url-status').textContent = 'Demo fixture could not be loaded.'; return; }
      var fx = await tryFetch('demo-fixture-data.json');
      var inputs = { homepageHtml: hp.text, homepageUrl: 'https://demo-store.example', answers: {} };
      if (fx.ok) {
        try {
          var d = JSON.parse(fx.text);
          inputs.productHtml = d.productHtml; inputs.robotsTxt = d.robotsTxt;
          inputs.llmsTxt = d.llmsTxt; inputs.sitemapXml = d.sitemapXml; inputs.feedHint = d.feedHint || null;
        } catch (e) { /* ignore */ }
      }
      var result = runChecks(inputs);
      $('url-status').textContent = 'Demo store checked (a fictional candle shop with typical problems).';
      render(result, 'https://demo-store.example');
    });

    $('download').addEventListener('click', function () {
      if (!lastResult) return;
      var blob = new Blob([textReport(lastUrl, lastResult)], { type: 'text/plain' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'store-audit-report.txt';
      a.click();
      URL.revokeObjectURL(a.href);
    });

    // Build self-check questions in both panels
    [['self-questions'], ['paste-questions']].forEach(function (pair) {
      var host = $(pair[0]);
      if (!host) return;
      SELF_CHECK_QUESTIONS.forEach(function (q) {
        var div = document.createElement('div');
        div.className = 'q';
        div.innerHTML = '<p>' + q.label + '</p>' +
          '<label><input type="radio" name="q-' + q.key + '" value="yes"> Yes</label> ' +
          '<label><input type="radio" name="q-' + q.key + '" value="no"> No</label> ' +
          '<label><input type="radio" name="q-' + q.key + '" value="unknown" checked> Don\'t know</label>';
        host.appendChild(div);
      });
    });
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runChecks: runChecks, CHECKS: CHECKS, SELF_CHECK_QUESTIONS: SELF_CHECK_QUESTIONS, verdict: verdict, textReport: textReport, firstProductUrl: firstProductUrl, extractJsonLd: extractJsonLd };
}
