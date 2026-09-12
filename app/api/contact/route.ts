import { NextResponse } from "next/server";
import { attributionFromRequest } from "@/lib/attribution";
import { deliverLeadToLeadPilot } from "@/lib/leadpilot";
import { isMetaEventId, sendMetaEvent } from "@/lib/meta";
import { createSalesLead, recordSalesLeadEvent } from "@/lib/sales-leads";

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

function metaContext(data: Record<string, unknown>) {
  const eventId = isMetaEventId(data.metaEventId) ? data.metaEventId.trim() : null;
  const marketingConsent = data.marketingConsent === true && Boolean(eventId);
  return {
    eventId: marketingConsent ? eventId : null,
    marketingConsent,
    fbp: marketingConsent && typeof data.fbp === "string" ? data.fbp.trim().slice(0, 200) : undefined,
    fbc: marketingConsent && typeof data.fbc === "string" ? data.fbc.trim().slice(0, 200) : undefined,
  };
}

async function mirrorContactLead(input: { leadId: string; name: string; email: string; interest: string; message: string; pageUrl: string }) {
  const delivery = await deliverLeadToLeadPilot({
    customerName: input.name,
    email: input.email,
    service: input.interest,
    pageUrl: input.pageUrl,
    sourceName: "AgentSiraji Contact",
    message: `AgentSiraji lead #${input.leadId}. ${input.message}`,
  });
  if (!delivery.configured) return;
  const eventType = delivery.delivered ? "LEADPILOT_DELIVERED" : "LEADPILOT_FAILED";
  const note = delivery.delivered
    ? `Contact mirrored${delivery.leadId ? ` as LeadPilot lead ${delivery.leadId}` : ""}${delivery.duplicate ? " (duplicate matched)" : ""}.`
    : `Contact mirror failed${delivery.status ? ` with HTTP ${delivery.status}` : ""}.`;
  await recordSalesLeadEvent(input.leadId, eventType, note).catch(() => undefined);
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
    try { body = JSON.parse(rawBody); } catch { return json({ message: "Invalid JSON payload." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ message: "Invalid contact form payload." }, 400);

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
    ) return json({ message: "Please check the form and complete every field." }, 400);

    const attribution = attributionFromRequest(request, "/contact");
    const meta = metaContext(data);
    let lead;
    try {
      lead = await createSalesLead({
        leadType: "CONTACT",
        contactName: name,
        email,
        interest,
        message,
        ...attribution,
        metaEventId: meta.eventId,
        marketingConsent: meta.marketingConsent,
      });
    } catch (error) {
      console.error("Contact lead persistence failed", error);
      return json({ message: "We could not safely save your enquiry. Please retry." }, 503);
    }

    const pageUrl = new URL("/contact", request.url).toString();
    const metaDelivery = meta.marketingConsent && meta.eventId
      ? sendMetaEvent({
        eventName: "Contact",
        eventId: meta.eventId,
        eventSourceUrl: pageUrl,
        email,
        fbp: meta.fbp,
        fbc: meta.fbc,
        userAgent: request.headers.get("user-agent") || undefined,
        clientIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
        customData: { content_name: "AgentSiraji enquiry", interest },
      }).catch(() => undefined)
      : Promise.resolve(undefined);
    const leadPilotDelivery = mirrorContactLead({ leadId: lead.id, name, email, interest, message, pageUrl }).catch(() => undefined);

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO_EMAIL;
    if (!apiKey || !to) {
      await Promise.all([metaDelivery, leadPilotDelivery]);
      return json({ ok: true, leadId: lead.id, notificationDelivered: false, message: `Your enquiry is saved as lead #${lead.id}.` });
    }

    let notificationDelivered = false;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.CONTACT_FROM_EMAIL || "AgentSiraji Website <onboarding@resend.dev>",
          to: [to],
          reply_to: email,
          subject: `New AgentSiraji inquiry: ${interest}`,
          text: `Lead ID: ${lead.id}\nName: ${name}\nEmail: ${email}\nInterest: ${interest}\nSource: ${[attribution.utmSource, attribution.utmMedium, attribution.utmCampaign].filter(Boolean).join(" / ") || "Direct / un-attributed"}\n\n${message}`,
        }),
        signal: AbortSignal.timeout(8_000),
      });
      notificationDelivered = response.ok;
    } catch { notificationDelivered = false; }
    await Promise.all([metaDelivery, leadPilotDelivery]);

    return json({ ok: true, leadId: lead.id, notificationDelivered, message: `Your enquiry is saved as lead #${lead.id}.` });
  } catch (error) {
    console.error("Contact request failed", error);
    return json({ message: "Unable to send right now. Please email info@agentsiraji.com." }, 500);
  }
}
