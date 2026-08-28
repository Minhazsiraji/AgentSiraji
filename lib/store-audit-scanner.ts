import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type AuditCategory = {
  key: string;
  name: string;
  score: number;
  status: "strong" | "needs-work" | "weak";
  summary: string;
  checks: string[];
};

export type StoreAuditResult = {
  version: "v2";
  mode: "automated-preliminary";
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  scannedUrl: string;
  scannedAt: string;
  categories: AuditCategory[];
  limitations: string[];
};

const maxHtmlBytes = 2_000_000;
const userAgent = "AgentSiraji-StoreAudit/2.0 (+https://agent-siraji.vercel.app/store-audit)";

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function status(score: number): AuditCategory["status"] {
  if (score >= 75) return "strong";
  if (score >= 50) return "needs-work";
  return "weak";
}

function grade(score: number): StoreAuditResult["grade"] {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

function has(html: string, pattern: RegExp) {
  return pattern.test(html);
}

function count(html: string, pattern: RegExp) {
  return html.match(pattern)?.length ?? 0;
}

function isPrivateIpv4(address: string) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string) {
  const value = address.toLowerCase();
  if (value === "::" || value === "::1") return true;
  if (value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb")) return true;
  const mapped = value.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mapped ? isPrivateIpv4(mapped) : false;
}

async function assertPublicHttpUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only public HTTP(S) store URLs can be audited.");
  if (url.username || url.password) throw new Error("URLs containing credentials cannot be audited.");
  const hostname = url.hostname.toLowerCase();
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Private or local network addresses cannot be audited.");
  }

  if (isIP(hostname)) {
    if ((isIP(hostname) === 4 && isPrivateIpv4(hostname)) || (isIP(hostname) === 6 && isPrivateIpv6(hostname))) {
      throw new Error("Private or local network addresses cannot be audited.");
    }
    return url;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length) throw new Error("The store host could not be resolved.");
  for (const item of addresses) {
    if ((item.family === 4 && isPrivateIpv4(item.address)) || (item.family === 6 && isPrivateIpv6(item.address))) {
      throw new Error("The store resolves to a private or local network address.");
    }
  }
  return url;
}

async function fetchPublicHtml(rawUrl: string) {
  let current = await assertPublicHttpUrl(rawUrl);
  const startedAt = Date.now();

  for (let redirect = 0; redirect <= 3; redirect += 1) {
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      headers: { "User-Agent": userAgent, Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(10_000),
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location || redirect === 3) throw new Error("The store redirected too many times.");
      current = await assertPublicHttpUrl(new URL(location, current).toString());
      continue;
    }

    if (!response.ok) throw new Error(`The store returned HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error("The submitted URL did not return an HTML store page.");
    }

    const declaredLength = Number(response.headers.get("content-length") || "0");
    if (Number.isFinite(declaredLength) && declaredLength > maxHtmlBytes) throw new Error("The store page is too large for the preliminary audit.");
    const html = await response.text();
    if (new TextEncoder().encode(html).byteLength > maxHtmlBytes) throw new Error("The store page is too large for the preliminary audit.");

    return { html, finalUrl: current.toString(), elapsedMs: Date.now() - startedAt, headers: response.headers };
  }

  throw new Error("Unable to fetch the store page.");
}

function category(key: string, name: string, scoreValue: number, summary: string, checks: string[]): AuditCategory {
  const score = clamp(scoreValue);
  return { key, name, score, status: status(score), summary, checks };
}

export async function scanStore(rawUrl: string): Promise<StoreAuditResult> {
  const { html, finalUrl, elapsedMs, headers } = await fetchPublicHtml(rawUrl);
  const lower = html.toLowerCase();
  const htmlBytes = new TextEncoder().encode(html).byteLength;

  const title = has(html, /<title[^>]*>\s*[^<]{3,}[^<]*<\/title>/i);
  const description = has(html, /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,}["']/i) || has(html, /<meta[^>]+content=["'][^"']{20,}["'][^>]+name=["']description["']/i);
  const canonical = has(html, /<link[^>]+rel=["'][^"']*canonical[^"']*["']/i);
  const robotsMeta = has(html, /<meta[^>]+name=["']robots["']/i);
  const language = has(html, /<html[^>]+lang=["'][a-z]{2,}/i);
  const jsonLd = has(html, /application\/ld\+json/i);
  const productSchema = /["']@type["']\s*:\s*["']product["']/i.test(html);
  const openGraph = has(html, /property=["']og:(title|description|image)["']/i);
  const viewport = has(html, /<meta[^>]+name=["']viewport["']/i);
  const mediaQueries = /@media\s*\(/i.test(html);
  const responsiveImages = /srcset=|<picture\b/i.test(html);

  const imageCount = count(html, /<img\b/gi);
  const lazyImages = count(html, /<img\b[^>]*loading=["']lazy["']/gi);
  const altImages = count(html, /<img\b[^>]*alt=["'][^"']+["']/gi);
  const lazyRatio = imageCount ? lazyImages / imageCount : 1;
  const altRatio = imageCount ? altImages / imageCount : 1;

  const hasSearch = /type=["']search["']|aria-label=["'][^"']*search|placeholder=["'][^"']*search/i.test(html);
  const hasCategories = /categor(y|ies)|collection|department/i.test(lower);
  const hasFilters = /filter|sort by|price range|size|colour|color/i.test(lower);
  const hasNav = /<nav\b/i.test(html);
  const productLinks = count(html, /href=["'][^"']*(product|products|item|shop)\//gi);

  const hasCart = /cart|basket|bag/i.test(lower);
  const hasAddToCart = /add to cart|add-to-cart|buy now|add to bag/i.test(lower);
  const hasCheckout = /checkout|check out/i.test(lower);
  const hasPayment = /payment|visa|mastercard|paypal|bkash|nagad|sslcommerz|paddle|esewa|khalti|mobile money/i.test(lower);
  const hasCod = /cash on delivery|\bcod\b/i.test(lower);

  const hasGa = /googletagmanager\.com\/gtag|google-analytics\.com|gtag\(/i.test(html);
  const hasGtm = /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]+/i.test(html);
  const hasMetaPixel = /connect\.facebook\.net|fbq\(/i.test(html);
  const hasOtherTracking = /tiktok|clarity\.ms|hotjar|snaptr|pinterest/i.test(lower);

  const isHttps = finalUrl.startsWith("https://");
  const hasPrivacy = /href=["'][^"']*(privacy|data-protection)/i.test(html);
  const hasTerms = /href=["'][^"']*(terms|conditions)/i.test(html);
  const hasRefund = /href=["'][^"']*(refund|return|cancellation)/i.test(html);
  const hasContact = /href=["'][^"']*(contact|mailto:|tel:)/i.test(html);
  const hasIdentity = /address|about us|company|business/i.test(lower);

  const hasInventory = /in stock|out of stock|stock|inventory|available/i.test(lower);
  const hasReviews = /review|rating|testimonial|stars/i.test(lower);
  const hasDelivery = /shipping|delivery|dispatch/i.test(lower);
  const hasOrderTracking = /track order|order status|tracking/i.test(lower);
  const hasDataLayer = /dataLayer|__NEXT_DATA__|application\/json/i.test(html);
  const feedReady = /google shopping|merchant center|product feed|facebook catalog|meta catalog/i.test(lower);

  const compressed = Boolean(headers.get("content-encoding"));
  let performanceScore = elapsedMs <= 800 ? 70 : elapsedMs <= 1500 ? 60 : elapsedMs <= 2500 ? 48 : 35;
  if (htmlBytes <= 250_000) performanceScore += 15;
  else if (htmlBytes <= 600_000) performanceScore += 8;
  if (compressed) performanceScore += 15;

  const categories = [
    category("performance", "Performance", performanceScore, `Initial HTML fetched in ${elapsedMs} ms; document size ${Math.round(htmlBytes / 1024)} KB.`, [compressed ? "HTML compression detected" : "No response compression detected", "Preliminary delivery signal only — LCP/CLS require browser-based measurement"]),
    category("mobile", "Mobile-first UX", (viewport ? 45 : 0) + (responsiveImages ? 25 : 0) + (mediaQueries ? 20 : 0) + (hasNav ? 10 : 0), viewport ? "Mobile viewport and responsive signals were detected." : "The page is missing a standard mobile viewport signal.", [viewport ? "Viewport meta present" : "Viewport meta missing", responsiveImages ? "Responsive image markup detected" : "No srcset/picture signal detected"]),
    category("discovery", "Product discovery", (hasSearch ? 25 : 0) + (hasCategories ? 20 : 0) + (hasFilters ? 20 : 0) + (hasNav ? 15 : 0) + (productLinks > 2 ? 20 : productLinks ? 10 : 0), "Checks whether shoppers can find products without relying on messages.", [hasSearch ? "Search signal detected" : "No search control detected on this page", hasFilters ? "Filter/sort language detected" : "No filter/sort signal detected"]),
    category("checkout", "Checkout", (hasAddToCart ? 25 : 0) + (hasCart ? 20 : 0) + (hasCheckout ? 20 : 0) + (hasPayment ? 20 : 0) + (hasCod ? 15 : 0), "Looks for visible purchase-path and payment signals on the public page.", [hasAddToCart ? "Purchase CTA detected" : "No add-to-cart/buy-now signal detected", hasPayment ? "Payment method language detected" : "No payment method signal detected"]),
    category("seo", "SEO readiness", (title ? 20 : 0) + (description ? 20 : 0) + (canonical ? 15 : 0) + (robotsMeta ? 5 : 0) + (language ? 10 : 0) + (jsonLd ? 20 : 0) + (openGraph ? 10 : 0), "Checks core crawl, metadata, sharing, and structured-data signals.", [title ? "Page title present" : "Page title missing", description ? "Meta description present" : "Meta description missing", jsonLd ? "JSON-LD structured data detected" : "No JSON-LD detected"]),
    category("tracking", "Tracking", (hasGa ? 25 : 0) + (hasGtm ? 25 : 0) + (hasMetaPixel ? 30 : 0) + (hasOtherTracking ? 20 : 0), "Detects common analytics and advertising tags visible in public HTML.", [hasMetaPixel ? "Meta Pixel signal detected" : "Meta Pixel not detected in public HTML", hasGa || hasGtm ? "Google analytics/tag signal detected" : "Google analytics/tag signal not detected"]),
    category("trust", "Trust", (isHttps ? 25 : 0) + (hasPrivacy ? 20 : 0) + (hasTerms ? 15 : 0) + (hasRefund ? 15 : 0) + (hasContact ? 15 : 0) + (hasIdentity ? 10 : 0), "Looks for HTTPS and public credibility/policy signals.", [isHttps ? "HTTPS active" : "HTTPS not active", hasPrivacy ? "Privacy link detected" : "Privacy link not detected", hasRefund ? "Refund/return link detected" : "Refund/return link not detected"]),
    category("media", "Media", Math.round(lazyRatio * 35) + Math.round(altRatio * 30) + (responsiveImages ? 25 : 0) + (imageCount <= 60 ? 10 : 5), `${imageCount} image element${imageCount === 1 ? "" : "s"} detected on the audited page.`, [`${Math.round(lazyRatio * 100)}% of image tags use lazy loading`, `${Math.round(altRatio * 100)}% of image tags have non-empty alt text`]),
    category("conversion", "Conversion", (hasAddToCart ? 20 : 0) + (hasCart ? 15 : 0) + (hasInventory ? 15 : 0) + (hasReviews ? 15 : 0) + (hasDelivery ? 15 : 0) + (hasCheckout ? 10 : 0) + (hasOrderTracking ? 10 : 0), "Checks public signals that reduce purchase uncertainty and friction.", [hasInventory ? "Stock/availability signal detected" : "No stock/availability signal detected", hasReviews ? "Review/rating signal detected" : "No review/rating signal detected", hasDelivery ? "Delivery/shipping signal detected" : "No delivery/shipping signal detected"]),
    category("future", "Future readiness", (jsonLd ? 25 : 0) + (productSchema ? 30 : 0) + (hasDataLayer ? 20 : 0) + (feedReady ? 10 : 0) + (canonical ? 15 : 0), "Checks whether the public page exposes structured signals useful for feeds, automation, and AI discovery.", [productSchema ? "Product structured data detected" : "Product structured data not detected", hasDataLayer ? "Machine-readable data layer signal detected" : "No obvious data-layer signal detected"]),
  ];

  const overallScore = clamp(categories.reduce((sum, item) => sum + item.score, 0) / categories.length);

  return {
    version: "v2",
    mode: "automated-preliminary",
    overallScore,
    grade: grade(overallScore),
    scannedUrl: finalUrl,
    scannedAt: new Date().toISOString(),
    categories,
    limitations: [
      "This is a preliminary automated audit of one publicly accessible page, not a certification or security test.",
      "Browser-only behavior, authenticated checkout, real Core Web Vitals (LCP/CLS/INP), server-side tracking, and business operations still require human verification.",
      "Some platforms block automated access; those stores may require a manual audit instead.",
    ],
  };
}
