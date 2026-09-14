import { NextResponse } from "next/server";
import { attributionFromRequest } from "@/lib/attribution";
import { commercePlans } from "@/lib/catalog";
import { deliverLeadToLeadPilot } from "@/lib/leadpilot";
import { isMetaEventId, sendMetaEvent } from "@/lib/meta";
import { createSalesLead, recordSalesLeadEvent } from "@/lib/sales-leads";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\-\s\d]{7,40}$/;
const maxBodyBytes = 16_384;
const rateLimitWindowMs = 10 * 60 * 1000;
const rateLimitMax = 5;
const maxTrackedClients = 5_000;
const attempts = new Map<string, { count: number; resetAt: number }>();
const planIds = new Set(commercePlans.map((plan) => plan.id));
const sellingChannels = new Set(["Facebook / Messenger", "Instagram", "WhatsApp", "Existing website", "Marketplace", "Other"]);

type Market = "bd" | "international";

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
      for (const [storedKey, value] of attempts) if (value.resetAt <= now) attempts.delete(storedKey);
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

function isHttpUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
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

async function mirrorCommerceIntent(input: {
  leadId: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  planName: string;
  marketLabel: string;
  sellingChannel: string;
  storeUrl: string;
  notes: string;
  pageUrl: string;
}) {
  const delivery = await deliverLeadToLeadPilot({
    customerName: input.contactName,
    email: input.email,
    phone: input.phone,
    service: `AgentSiraji Commerce — ${input.planName}`,
    location: input.country,
    pageUrl: input.pageUrl,
    sourceName: "AgentSiraji Commerce Plan Intent",
    message: [
      `AgentSiraji lead #${input.leadId}.`,
      `Business: ${input.businessName}.`,
      `Selected plan: ${input.planName}.`,
      `Market: ${input.marketLabel}.`,
      `Selling via: ${input.sellingChannel}.`,
      input.storeUrl ? `Store/page: ${input.storeUrl}.` : "",
      input.notes ? `Notes: ${input.notes}` : "",
    ].filter(Boolean).join(" "),
  });
  if (!delivery.configured) return;
  const eventType = delivery.delivered ? "LEADPILOT_DELIVERED" : "LEADPILOT_FAILED";
  const note = delivery.delivered
    ? `Commerce plan intent mirrored${delivery.leadId ? ` as LeadPilot lead ${delivery.leadId}` : ""}${delivery.duplicate ? " (duplicate matched)" : ""}.`
    : `Commerce plan intent mirror failed${delivery.status ? ` with HTTP ${delivery.status}` : ""}.`;
  await recordSalesLeadEvent(input.leadId, eventType, note).catch(() => undefined);
}

async function notifyOwner(input: {
  leadId: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  planName: string;
  marketLabel: string;
  sellingChannel: string;
  storeUrl: string;
  notes: string;
  attribution: string;
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
      subject: `Commerce plan request — ${input.planName} — ${input.businessName}`,
      text: [
        "New direct AgentSiraji Commerce plan request",
        `Lead ID: ${input.leadId}`,
        `Plan: ${input.planName}`,
        `Market: ${input.marketLabel}`,
        "",
        `Business: ${input.businessName}`,
        `Contact: ${input.contactName}`,
        `Email: ${input.email}`,
        `WhatsApp/phone: ${input.phone}`,
        `Country: ${input.country}`,
        `Selling channel: ${input.sellingChannel}`,
        `Store/page: ${input.storeUrl || "Not supplied"}`,
        `Attribution: ${input.attribution}`,
        "",
        `Notes: ${input.notes || "None"}`,
        "",
        "No payment has been collected. Confirm scope before sending any payment instruction.",
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
    if (origin && origin !== new URL(request.url).origin) return json({ message: "Request origin is not allowed." }, 403);
    if (isRateLimited(clientKey(request))) return json({ message: "Too many requests. Please wait before trying again." }, 429, { "Retry-After": "600" });

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (!Number.isFinite(contentLength) || contentLength > maxBodyBytes) return json({ message: "Request is too large." }, 413);
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxBodyBytes) return json({ message: "Request is too large." }, 413);

    let body: unknown;
    try { body = JSON.parse(rawBody); } catch { return json({ message: "Invalid JSON payload." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ message: "Invalid Commerce request." }, 400);
    const data = body as Record<string, unknown>;
    if (data.website) return json({ ok: true });

    const planId = String(data.plan || "").trim().toLowerCase();
    const market = data.market === "bd" || data.market === "international" ? data.market as Market : null;
    const businessName = String(data.businessName || "").trim();
    const contactName = String(data.contactName || "").trim();
    const email = String(data.email || "").trim();
    const phone = String(data.phone || "").trim();
    const country = String(data.country || "").trim();
    const storeUrl = String(data.storeUrl || "").trim();
    const sellingChannel = String(data.sellingChannel || "").trim();
    const notes = String(data.notes || "").trim();
    const selectedPlan = commercePlans.find((plan) => plan.id === planId);

    if (
      !selectedPlan || !planIds.has(planId as never) || !market ||
      businessName.length < 2 || businessName.length > 100 ||
      contactName.length < 2 || contactName.length > 80 ||
      !emailPattern.test(email) || email.length > 120 ||
      !phonePattern.test(phone) ||
      country.length < 2 || country.length > 60 ||
      storeUrl.length > 300 || !isHttpUrl(storeUrl) ||
      !sellingChannels.has(sellingChannel) || notes.length > 1200
    ) return json({ message: "Please check the form and complete the required fields correctly." }, 400);

    const marketLabel = market === "bd" ? "Bangladesh" : "International";
    const interest = `Commerce sales — ${selectedPlan.name} (${marketLabel})`;
    const message = [
      `Direct ${selectedPlan.name} plan request.`,
      `Market: ${marketLabel}.`,
      `Current selling channel: ${sellingChannel}.`,
      storeUrl ? `Store/page: ${storeUrl}.` : "",
      notes ? `Customer notes: ${notes}` : "",
      "No payment collected; scope confirmation required before payment instruction.",
    ].filter(Boolean).join(" ");
    const attribution = attributionFromRequest(request, "/start/commerce");
    const meta = metaContext(data);

    let lead;
    try {
      lead = await createSalesLead({
        leadType: "CONTACT",
        businessName,
        contactName,
        country,
        storeUrl: storeUrl || null,
        email,
        phone,
        interest,
        message,
        ...attribution,
        metaEventId: meta.eventId,
        marketingConsent: meta.marketingConsent,
      });
      await recordSalesLeadEvent(lead.id, "COMMERCE_ORDER_INTENT", `${selectedPlan.name} / ${marketLabel}`).catch(() => undefined);
    } catch (error) {
      console.error("Commerce order intent persistence failed", error);
      return json({ message: "We could not safely save your Commerce request. Please retry before leaving this page." }, 503);
    }

    const pageUrl = new URL(`/start/commerce?plan=${encodeURIComponent(selectedPlan.id)}`, request.url).toString();
    const metaDelivery = meta.marketingConsent && meta.eventId
      ? sendMetaEvent({
        eventName: "Lead",
        eventId: meta.eventId,
        eventSourceUrl: pageUrl,
        email,
        phone,
        fbp: meta.fbp,
        fbc: meta.fbc,
        userAgent: request.headers.get("user-agent") || undefined,
        clientIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
        customData: { content_name: `AgentSiraji Commerce ${selectedPlan.name}`, content_category: "commerce_plan_intent", plan: selectedPlan.id, market },
      }).catch(() => undefined)
      : Promise.resolve(undefined);
    const leadPilotDelivery = mirrorCommerceIntent({
      leadId: lead.id, businessName, contactName, email, phone, country,
      planName: selectedPlan.name, marketLabel, sellingChannel, storeUrl, notes, pageUrl,
    }).catch(() => undefined);

    let notificationDelivered = false;
    try {
      notificationDelivered = await notifyOwner({
        leadId: lead.id, businessName, contactName, email, phone, country,
        planName: selectedPlan.name, marketLabel, sellingChannel, storeUrl, notes,
        attribution: [attribution.utmSource, attribution.utmMedium, attribution.utmCampaign].filter(Boolean).join(" / ") || "Direct / un-attributed",
      });
    } catch { notificationDelivered = false; }
    await Promise.all([metaDelivery, leadPilotDelivery]);

    return json({
      ok: true,
      leadId: lead.id,
      notificationDelivered,
      message: `Your ${selectedPlan.name} request is saved as lead #${lead.id}. No payment has been taken. AgentSiraji will confirm scope and payment instructions before onboarding.`,
    });
  } catch (error) {
    console.error("Commerce order intent failed", error);
    return json({ message: "Unable to save your Commerce request right now. Please try again or email info@agentsiraji.com." }, 500);
  }
}
