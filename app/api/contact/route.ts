import { NextResponse } from "next/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxBodyBytes = 16_384;
const rateLimitWindowMs = 10 * 60 * 1000;
const rateLimitMax = 5;
const maxTrackedClients = 5_000;
const allowedInterests = new Set([
  "Commerce sales",
  "LeadPilot early access",
  "AdIntel early access",
  "Doctor's Diary updates",
  "Business License enquiry",
  "Partnership or other enquiry",
]);
const attempts = new Map<string, { count: number; resetAt: number }>();

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
    if (attempts.size >= maxTrackedClients) {
      for (const [storedKey, value] of attempts) {
        if (value.resetAt <= now) attempts.delete(storedKey);
      }
      while (attempts.size >= maxTrackedClients) {
        const oldestKey = attempts.keys().next().value as string | undefined;
        if (!oldestKey) break;
        attempts.delete(oldestKey);
      }
    }
    attempts.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return false;
  }
  current.count += 1;
  return current.count > rateLimitMax;
}

export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return json({ message: "Content-Type must be application/json." }, 415);
    }

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (!Number.isFinite(contentLength) || contentLength > maxBodyBytes) {
      return json({ message: "Request is too large." }, 413);
    }

    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return json({ message: "Request origin is not allowed." }, 403);
    }

    if (isRateLimited(clientKey(request))) {
      return json({ message: "Too many requests. Please wait before trying again." }, 429, { "Retry-After": "600" });
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
      return json({ message: "Invalid contact form payload." }, 400);
    }

    const data = body as Record<string, unknown>;
    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim();
    const interest = String(data.interest || "").trim();
    const message = String(data.message || "").trim();

    if (data.website) return json({ ok: true });
    if (
      name.length < 2 || name.length > 80 ||
      !emailPattern.test(email) || email.length > 120 ||
      !allowedInterests.has(interest) ||
      message.length < 20 || message.length > 2000
    ) {
      return json({ message: "Please check the form and complete every field." }, 400);
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO_EMAIL;
    if (!apiKey || !to) {
      return json({ message: "The contact form is being connected. For now, email hello@agentsiraji.com." }, 503);
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || "AgentSiraji Website <onboarding@resend.dev>",
        to: [to],
        reply_to: email,
        subject: `New AgentSiraji inquiry: ${interest}`,
        text: `Name: ${name}\nEmail: ${email}\nInterest: ${interest}\n\n${message}`,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) throw new Error("Email service rejected the request");
    return json({ ok: true });
  } catch {
    return json({ message: "Unable to send right now. Please email hello@agentsiraji.com." }, 500);
  }
}
