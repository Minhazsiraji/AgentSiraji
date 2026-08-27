import { NextResponse } from "next/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\-\s\d]{7,40}$/;
const maxBodyBytes = 12_288;
const rateLimitWindowMs = 10 * 60 * 1000;
const rateLimitMax = 4;
const attempts = new Map<string, { count: number; resetAt: number }>();
const productRanges = new Set(["1–20", "21–50", "51–100", "101–500", "500+"]);

function json(body: object, status = 200, extraHeaders?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache", ...extraHeaders },
  });
}

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return false;
  }
  current.count += 1;
  return current.count > rateLimitMax;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return json({ message: "Content-Type must be application/json." }, 415);
    }

    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return json({ message: "Request origin is not allowed." }, 403);
    }

    if (isRateLimited(clientKey(request))) {
      return json({ message: "Too many audit requests. Please wait before trying again." }, 429, { "Retry-After": "600" });
    }

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (!Number.isFinite(contentLength) || contentLength > maxBodyBytes) {
      return json({ message: "Request is too large." }, 413);
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxBodyBytes) {
      return json({ message: "Request is too large." }, 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ message: "Invalid JSON payload." }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ message: "Invalid audit request." }, 400);
    }

    const data = body as Record<string, unknown>;
    if (data.website) return json({ ok: true });

    const businessName = String(data.businessName || "").trim();
    const country = String(data.country || "").trim();
    const storeUrl = String(data.storeUrl || "").trim();
    const email = String(data.email || "").trim();
    const whatsapp = String(data.whatsapp || "").trim();
    const productCount = String(data.productCount || "").trim();

    if (
      businessName.length < 2 || businessName.length > 100 ||
      country.length < 2 || country.length > 60 ||
      !isHttpUrl(storeUrl) || storeUrl.length > 300 ||
      !emailPattern.test(email) || email.length > 120 ||
      !phonePattern.test(whatsapp) ||
      !productRanges.has(productCount)
    ) {
      return json({ message: "Please check the form and complete every field correctly." }, 400);
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO_EMAIL;
    if (!apiKey || !to) {
      return json({ message: "Store Audit is being connected. Please email hello@agentsiraji.com for now." }, 503);
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || "AgentSiraji Website <onboarding@resend.dev>",
        to: [to],
        reply_to: email,
        subject: `Store Audit request — ${businessName} (${country})`,
        text: [
          "New AgentSiraji Store Audit request",
          "",
          `Business: ${businessName}`,
          `Country: ${country}`,
          `Store/Page: ${storeUrl}`,
          `Email: ${email}`,
          `WhatsApp: ${whatsapp}`,
          `Product count: ${productCount}`,
          "",
          "Audit manually across: performance, mobile UX, product discovery, checkout, SEO, tracking, trust, media, conversion, and future readiness.",
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) throw new Error("Email service rejected the request");
    return json({ ok: true });
  } catch {
    return json({ message: "Unable to submit the audit right now. Please email hello@agentsiraji.com." }, 500);
  }
}
