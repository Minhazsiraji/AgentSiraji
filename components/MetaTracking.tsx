"use client";

import Script from "next/script";
import { startTransition, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createMetaEventId, marketingConsentKey, trackMetaEvent, markPixelReady, revokePixelConsent } from "@/lib/meta-client";

const configuredPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const configuredPixelId = configuredPixel && /^\d+$/.test(configuredPixel) ? configuredPixel : undefined;

const viewContentPages = new Map([
  ["/pricing", "AgentSiraji Commerce pricing"],
  ["/products/commerce", "AgentSiraji Commerce"],
  ["/store-audit", "AgentSiraji Store Audit"],
]);

export function MetaTracking() {
  const pathname = usePathname();
  const [pixelId, setPixelId] = useState<string | undefined>(configuredPixelId);
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const trackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (pixelId) return;
    void fetch("/api/integrations/public", { cache: "no-store" })
      .then(response => response.json() as Promise<{ pixelId?: unknown }>)
      .then(data => { if (typeof data.pixelId === "string" && /^\d+$/.test(data.pixelId)) setPixelId(data.pixelId); })
      .catch(() => undefined);
  }, [pixelId]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(marketingConsentKey);
      if (saved === "granted" || saved === "denied") startTransition(() => setConsent(saved));
    } catch { /* Optional tracking stays disabled when storage is unavailable. */ }
  }, []);

  useEffect(() => {
    if (consent !== "granted" || !pixelId || !pathname || trackedPath.current === pathname) return;
    trackedPath.current = pathname;
    const pageEventId = createMetaEventId("pageview");
    void trackMetaEvent("PageView", {}, pageEventId);
    const contentName = viewContentPages.get(pathname);
    if (contentName) void trackMetaEvent("ViewContent", { content_name: contentName, content_type: "product" });
  }, [consent, pathname, pixelId]);

  useEffect(() => {
    if (consent !== "granted" || !pixelId) return;
    const handleSavedLead = () => {
      const eventId = createMetaEventId("lead");
      void trackMetaEvent("Lead", { content_name: "AgentSiraji Free Store Audit", lead_type: "store_audit" }, eventId);
    };
    const handleSavedContact = () => {
      const eventId = createMetaEventId("contact");
      void trackMetaEvent("Contact", { content_name: "AgentSiraji enquiry" }, eventId);
    };
    window.addEventListener("agentsiraji:lead-saved", handleSavedLead);
    window.addEventListener("agentsiraji:contact-saved", handleSavedContact);
    return () => {
      window.removeEventListener("agentsiraji:lead-saved", handleSavedLead);
      window.removeEventListener("agentsiraji:contact-saved", handleSavedContact);
    };
  }, [consent, pixelId]);

  function choose(value: "granted" | "denied") {
    try { window.localStorage.setItem(marketingConsentKey, value); } catch { value = "denied"; }
    if (value === "denied") { revokePixelConsent(); trackedPath.current = null; }
    else window.fbq?.("consent", "grant");
    setConsent(value);
    setPreferencesOpen(false);
  }

  return (
    <>
      {consent === "granted" && pixelId ? (
        <>
          <Script id="agentsiraji-meta-pixel-bootstrap" strategy="afterInteractive" onReady={markPixelReady}>
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)n=f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');`}
          </Script>
        </>
      ) : null}
      {pixelId && consent !== null && !preferencesOpen ? <button type="button" className="marketing-preferences" onClick={() => setPreferencesOpen(true)}>Privacy choices</button> : null}
      {(consent === null || preferencesOpen) && pixelId ? (
        <aside className="marketing-consent" aria-label="Marketing measurement choice">
          <strong>Help us measure AgentSiraji</strong>
          <p>Allow Meta to measure page visits and enquiries. With permission, we share event details for ad measurement. <a href="/privacy">Privacy policy</a>. You can change this choice later.</p>
          <div><button type="button" onClick={() => choose("granted")}>Allow measurement</button><button type="button" className="secondary" onClick={() => choose("denied")}>Decline</button></div>
        </aside>
      ) : null}
    </>
  );
}
