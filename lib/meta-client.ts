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
  const raw = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
  if (!raw) return undefined;
  try { return decodeURIComponent(raw); } catch { return raw; }
}

function setMarketingCookie(name: string, value: string) {
  if (typeof document === "undefined" || !hasMarketingConsent()) return;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=7776000; Path=/; SameSite=Lax${secure}`;
}

function fbcFromLandingUrl() {
  if (typeof window === "undefined" || !hasMarketingConsent()) return undefined;
  const existing = cookie("_fbc");
  if (existing) return existing.slice(0, 200);
  const fbclid = new URLSearchParams(window.location.search).get("fbclid")?.trim();
  if (!fbclid || fbclid.length > 500) return undefined;
  const value = `fb.1.${Date.now()}.${fbclid}`;
  setMarketingCookie("_fbc", value);
  return value.slice(0, 200);
}

function visitorExternalId() {
  if (typeof window === "undefined" || !hasMarketingConsent()) return undefined;
  const key = "agentsiraji_meta_external_id";
  try {
    const existing = window.localStorage.getItem(key)?.trim();
    if (existing && /^[A-Za-z0-9_-]{12,100}$/.test(existing)) return existing;
    const random = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const value = `asv_${random}`.slice(0, 100);
    window.localStorage.setItem(key, value);
    return value;
  } catch {
    return undefined;
  }
}

export function getMetaBrowserIdentifiers() {
  if (!hasMarketingConsent()) return { fbp: undefined, fbc: undefined };
  return { fbp: cookie("_fbp")?.slice(0, 200), fbc: fbcFromLandingUrl() };
}

async function waitForMetaBrowserIdentifiers(timeoutMs = 1400) {
  const started = Date.now();
  let ids = getMetaBrowserIdentifiers();
  while (!ids.fbp && Date.now() - started < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, 100));
    ids = getMetaBrowserIdentifiers();
  }
  return ids;
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
    const ids = await waitForMetaBrowserIdentifiers();
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
        externalId: visitorExternalId(),
        fbp: ids.fbp,
        fbc: ids.fbc,
        eventSourceUrl: window.location.origin + window.location.pathname,
      }),
      keepalive: true,
    });
  } catch {
    // The browser event remains useful if the server call is unavailable.
  }

  return eventId;
}

/**
 * Called only after the token-protected starter status endpoint confirms PAID.
 * Uses the SAME Purchase/eventID as the server CAPI verification signal.
 */
export function trackVerifiedStarterBrowserPurchase(verifiedEventId: string) {
  if (!hasMarketingConsent() || !/^as_starter_purchase_[a-f0-9-]{36}$/i.test(verifiedEventId)) return false;
  const args = ["track", "Purchase", {
    value: 5000, currency: "BDT", content_name: "AgentSiraji E-commerce Starter",
  }, { eventID: verifiedEventId }];
  if (pixelReady) window.fbq?.(...args);
  else if (pendingPixelEvents.length < 50) pendingPixelEvents.push(args);
  return true;
}
