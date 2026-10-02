export const marketingConsentKey = "agentsiraji_marketing_consent";
export const measurementConsentChangedEvent = "agentsiraji:measurement-consent-changed";
const pendingPixelEvents: unknown[][] = [];
let pixelReady = false;

export function markPixelReady() {
  pixelReady = true;
  if (hasMarketingConsent()) for (const args of pendingPixelEvents.splice(0)) window.fbq?.(...args);
  else pendingPixelEvents.length = 0;
}

export function revokePixelConsent() {
  pendingPixelEvents.length = 0;
  window.fbq?.("consent", "revoke");
  for (const name of ["_fbp", "_fbc"]) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.agentsiraji.com; SameSite=Lax`;
  }
}

export type ClientMetaEventName = Exclude<import("./meta").MetaEventName, "Purchase">;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function hasMarketingConsent() {
  if (typeof window === "undefined") return false;
  try { return window.localStorage.getItem(marketingConsentKey) === "granted"; } catch { return false; }
}

export function createMetaEventId(prefix = "event") {
  const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${uuid}`.slice(0, 100);
}

function cookie(name: string) {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

export function getMetaBrowserIdentifiers() {
  if (!hasMarketingConsent()) return { fbp: undefined, fbc: undefined };
  return { fbp: cookie("_fbp")?.slice(0, 200), fbc: cookie("_fbc")?.slice(0, 200) };
}

export async function trackMetaEvent(
  eventName: ClientMetaEventName,
  customData: Record<string, string | number | boolean> = {},
  eventId = createMetaEventId(eventName.toLowerCase()),
  contact?: { email?: string; phone?: string },
) {
  if (!hasMarketingConsent()) return null;

  const args = ["track", eventName, customData, { eventID: eventId }];
  if (pixelReady) window.fbq?.(...args);
  else if (pendingPixelEvents.length < 50) pendingPixelEvents.push(args);
  // Accepted Lead/Contact conversions are paired with CAPI by their accepting form endpoint.
  // Checkout conversion tracking remains dormant while live checkout is production-gated.
  if (eventName === "Lead" || eventName === "Contact" || eventName === "InitiateCheckout") return eventId;

  try {
    await fetch("/api/meta/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventId,
        consentGranted: true,
        customData,
        email: contact?.email,
        phone: contact?.phone,
        fbp: cookie("_fbp"),
        fbc: cookie("_fbc"),
        eventSourceUrl: window.location.origin + window.location.pathname,
      }),
      keepalive: true,
    });
  } catch {
    // The browser event remains useful if the server call is unavailable.
  }

  return eventId;
}
