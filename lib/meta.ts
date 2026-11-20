import { createHash } from "node:crypto";
import { envOrStored, readStoredIntegrations } from "@/lib/integration-config";

export const metaEventNames = [
  "PageView",
  "ViewContent",
  "Lead",
  "Contact",
  "InitiateCheckout",
  "Purchase",
] as const;

export type MetaEventName = (typeof metaEventNames)[number];

type MetaEventInput = {
  eventName: MetaEventName;
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  email?: string;
  phone?: string;
  externalId?: string;
  fbp?: string;
  fbc?: string;
  userAgent?: string;
  clientIp?: string;
  customData?: Record<string, string | number | boolean | null | undefined>;
};

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return /^01[3-9]\d{8}$/.test(digits) ? `88${digits}` : digits;
}

export function isMetaEventId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_.:-]{8,100}$/.test(value.trim());
}

function cleanEventId(value: string) {
  return value.trim().slice(0, 100);
}

async function dispatchMetaEvent(input: MetaEventInput, verifiedStarterPayment: boolean) {
  if (input.eventName === "Purchase" && !verifiedStarterPayment) return { sent: false as const, reason: "Purchase reporting requires independently verified payment." };
  if (!isMetaEventId(input.eventId)) return { sent: false as const, reason: "A stable Meta event ID is required." };

  let stored: Awaited<ReturnType<typeof readStoredIntegrations>> = {};
  if (!process.env.META_PIXEL_ID?.trim() || !process.env.META_CAPI_ACCESS_TOKEN?.trim()) {
    try { stored = await readStoredIntegrations(); } catch { /* Environment configuration remains the primary fail-closed path. */ }
  }
  const pixelId = envOrStored(stored, "metaPixelId", "META_PIXEL_ID");
  const accessToken = envOrStored(stored, "metaCapiAccessToken", "META_CAPI_ACCESS_TOKEN");

  const publicPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  if (!pixelId || !/^\d+$/.test(pixelId) || !accessToken || (publicPixel && pixelId !== publicPixel)) {
    return { sent: false as const, reason: "Meta CAPI is not configured." };
  }

  const configuredTestEventCode = process.env.META_TEST_EVENT_CODE?.trim() || stored.metaTestEventCode?.trim();
  const production = process.env.VERCEL_ENV === "production";
  if (!production && !configuredTestEventCode) return { sent: false as const, reason: "Test events need a test event code." };

  const eventId = cleanEventId(input.eventId);
  const userData: Record<string, unknown> = {};
  if (input.email?.trim()) userData.em = [hash(normalizeEmail(input.email))];
  if (input.phone?.trim()) userData.ph = [hash(normalizePhone(input.phone))];
  if (input.externalId?.trim()) userData.external_id = [hash(input.externalId.trim().slice(0, 100))];
  if (input.fbp?.trim()) userData.fbp = input.fbp.trim().slice(0, 200);
  if (input.fbc?.trim()) userData.fbc = input.fbc.trim().slice(0, 200);
  if (input.userAgent) userData.client_user_agent = input.userAgent.slice(0, 500);
  if (input.clientIp) userData.client_ip_address = input.clientIp;

  const customData = Object.fromEntries(
    Object.entries(input.customData ?? {}).filter(([, value]) => value !== undefined && value !== null),
  );

  const version = process.env.META_GRAPH_API_VERSION?.trim() || "v26.0";
  const endpoint = new URL(`https://graph.facebook.com/${version}/${encodeURIComponent(pixelId)}/events`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${accessToken}` },
    redirect: "error",
    body: JSON.stringify({
      ...(!production && configuredTestEventCode ? { test_event_code: configuredTestEventCode } : {}),
      data: [{
        event_name: input.eventName,
        event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: input.eventSourceUrl?.slice(0, 500),
        user_data: userData,
        custom_data: customData,
      }],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as {
      error?: { code?: number; error_subcode?: number; type?: string; message?: string }
    } | null;
    const metaCode = typeof payload?.error?.code === "number" ? payload.error.code : undefined;
    const metaSubcode = typeof payload?.error?.error_subcode === "number" ? payload.error.error_subcode : undefined;
    console.error("AgentSiraji Meta event rejected", {
      eventName: input.eventName, status: response.status, metaCode, metaSubcode,
    });
    return {
      sent: false as const,
      reason: "Meta rejected the event.",
      status: response.status,
      metaCode,
      metaSubcode,
      metaType: payload?.error?.type?.slice(0, 100),
      metaMessage: payload?.error?.message?.slice(0, 300),
    };
  }

  const accepted = await response.json().catch(() => null) as { events_received?: number } | null;
  const eventsReceived = typeof accepted?.events_received === "number" ? accepted.events_received : 0;
  if (eventsReceived < 1) {
    console.error("AgentSiraji Meta event returned no received events", {
      eventName: input.eventName, status: response.status, eventsReceived,
    });
    return { sent: false as const, reason: "Meta did not confirm receiving the event.", eventsReceived };
  }

  return { sent: true as const, eventsReceived };
}

// Only the authenticated starter-review route calls this after the database confirms PAID.
// Public event routes cannot invoke a Purchase event.
export async function sendVerifiedStarterPurchaseEvent(input: Omit<MetaEventInput, "eventName">) {
  return dispatchMetaEvent({ ...input, eventName: "Purchase" }, true);
}
export async function sendMetaEvent(input: MetaEventInput) {
  return dispatchMetaEvent(input, false);
}
