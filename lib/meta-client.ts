const pendingPixelEvents: unknown[][] = [];
let pixelReady = false;

export function markPixelReady() {
  pixelReady = true;
  for (const args of pendingPixelEvents.splice(0)) window.fbq?.(...args);
}

export type ClientMetaEventName = Exclude<import("./meta").MetaEventName, "Purchase">;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
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
  return { fbp: cookie("_fbp")?.slice(0, 200), fbc: cookie("_fbc")?.slice(0, 200) };
}

export async function trackMetaEvent(
  eventName: ClientMetaEventName,
  customData: Record<string, string | number | boolean> = {},
  eventId = createMetaEventId(eventName.toLowerCase()),
  contact?: { email?: string; phone?: string },
) {
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
