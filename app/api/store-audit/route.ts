import { NextResponse } from "next/server";
import { scanStore, type StoreAuditResult } from "@/lib/store-audit-scanner";

export const runtime = "nodejs";

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

function auditSummary(result: StoreAuditResult) {
  return [
    `Automated preliminary score: ${result.overallScore}/100 (Grade ${result.grade})`,
    ...result.categories.map((item) => `${item.name}: ${item.score}/100 — ${item.summary}`),
    "",
    "Limitations:",
    ...result.limitations.map((item) => `- ${item}`),
  ].join("\n");
}

async function notifyLead(input: {
  businessName: string;
  country: string;
  storeUrl: string;
  email: string;
  whatsapp: string;
  productCount: string;
  result: StoreAuditResult | null;
  scanError: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL || "AgentSiraji Website <onboarding@resend.dev>",
      to: [to],
      reply_to: input.email,
      subject: `Store Audit V2 — ${input.businessName} (${input.country})${input.result ? ` — ${input.result.overallScore}/100` : ""}`,
      text: [
        "New AgentSiraji Store Audit V2 request",
        "",
        `Business: ${input.businessName}`,
        `Country: ${input.country}`,
        `Store/Page: ${input.storeUrl}`,
        `Email: ${input.email}`,
        `WhatsApp: ${input.whatsapp}`,
        `Product count: ${input.productCount}`,
        "",
        input.result ? auditSummary(input.result) : `Automated scan unavailable: ${input.scanError || "Unknown scan error"}`,
        "",
        "Human review should verify browser performance, checkout behavior, tracking accuracy, and business-specific recommendations before a final commercial audit is sent.",
      ].join("\n"),
    }),
    signal: AbortSignal.timeout(8_000),
  });

  return response.ok;
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

    let result: StoreAuditResult | null = null;
    let scanError: string | null = null;
    try {
      result = await scanStore(storeUrl);
    } catch (error) {
      scanError = error instanceof Error ? error.message : "The automated scan could not access this store.";
    }

    let notificationDelivered = false;
    try {
      notificationDelivered = await notifyLead({ businessName, country, storeUrl, email, whatsapp, productCount, result, scanError });
    } catch {
      notificationDelivered = false;
    }

    if (!result) {
      return json({
        ok: true,
        result: null,
        manualReview: true,
        notificationDelivered,
        message: `We could not create an automated score for this page (${scanError || "access unavailable"}). It needs manual review.`,
      });
    }

    return json({
      ok: true,
      result,
      manualReview: true,
      notificationDelivered,
      message: notificationDelivered
        ? "Preliminary score created. Your request was also sent for human review."
        : "Preliminary score created. Email notification is not connected yet, so please save this result and contact hello@agentsiraji.com if you want the human review now.",
    });
  } catch {
    return json({ message: "Unable to run the audit right now. Please try again or email hello@agentsiraji.com." }, 500);
  }
}
