import { hasMarketingConsent } from "./meta-client";

const pendingGoogleEvents: Array<[string, Record<string, string | number | boolean>]> = [];
let googleReady = false;
let activeTagId = "";

export function validGoogleTagId(value: string) {
  return /^(G-|AW-|GT-)[A-Z0-9_-]+$/i.test(value.trim());
}

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
}

export function initializeGoogleTag(tagId: string) {
  const cleanId = tagId.trim();
  if (!validGoogleTagId(cleanId) || !hasMarketingConsent()) return false;
  ensureGtag();
  activeTagId = cleanId;
  googleReady = true;
  window.gtag?.("js", new Date());
  window.gtag?.("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  });
  window.gtag?.("config", cleanId, { send_page_view: false });
  for (const [name, params] of pendingGoogleEvents.splice(0)) window.gtag?.("event", name, params);
  return true;
}

export function revokeGoogleConsent() {
  pendingGoogleEvents.length = 0;
  googleReady = false;
  activeTagId = "";
  if (typeof window === "undefined") return;
  ensureGtag();
  window.gtag?.("consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

export function trackGoogleEvent(name: string, params: Record<string, string | number | boolean> = {}) {
  if (!hasMarketingConsent()) return false;
  if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(name)) return false;
  if (googleReady && activeTagId) window.gtag?.("event", name, params);
  else if (pendingGoogleEvents.length < 50) pendingGoogleEvents.push([name, params]);
  return true;
}

export function trackGooglePageView(pathname: string) {
  if (typeof window === "undefined") return false;
  return trackGoogleEvent("page_view", {
    page_path: pathname.slice(0, 500),
    page_location: `${window.location.origin}${pathname}`.slice(0, 1000),
    page_title: document.title.slice(0, 300),
  });
}

export function trackGoogleLead(source: "store_audit" | "contact") {
  return trackGoogleEvent("generate_lead", { lead_source: source });
}
