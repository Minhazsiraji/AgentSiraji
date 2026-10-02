"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createMetaEventId, trackMetaEvent, markPixelReady } from "@/lib/meta-client";

const configuredPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const configuredPixelId = configuredPixel && /^\d+$/.test(configuredPixel) ? configuredPixel : undefined;

const viewContentPages = new Map([
  ["/pricing", "AgentSiraji Commerce pricing"],
  ["/products/commerce", "AgentSiraji Commerce"],
  ["/store-audit", "AgentSiraji Store Audit"],
]);

function conversionEventId(event: Event, prefix: string) {
  const detail = event instanceof CustomEvent ? event.detail as { eventId?: unknown } | null : null;
  const value = detail?.eventId;
  return typeof value === "string" && /^[A-Za-z0-9_.:-]{8,100}$/.test(value)
    ? value
    : createMetaEventId(prefix);
}

export function MetaTracking() {
  const pathname = usePathname();
  const [pixelId, setPixelId] = useState<string | undefined>(configuredPixelId);
  const trackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (pixelId) return;
    void fetch("/api/integrations/public", { cache: "no-store" })
      .then(response => response.json() as Promise<{ pixelId?: unknown }>)
      .then(data => {
        if (typeof data.pixelId === "string" && /^\d+$/.test(data.pixelId)) setPixelId(data.pixelId);
      })
      .catch(() => undefined);
  }, [pixelId]);

  useEffect(() => {
    if (!pixelId || !pathname || trackedPath.current === pathname) return;
    trackedPath.current = pathname;
    const pageEventId = createMetaEventId("pageview");
    void trackMetaEvent("PageView", {}, pageEventId);
    const contentName = viewContentPages.get(pathname);
    if (contentName) void trackMetaEvent("ViewContent", { content_name: contentName, content_type: "product" });
  }, [pathname, pixelId]);

  useEffect(() => {
    if (!pixelId) return;
    const handleSavedLead = (event: Event) => {
      const eventId = conversionEventId(event, "lead");
      void trackMetaEvent("Lead", { content_name: "AgentSiraji Free Store Audit", lead_type: "store_audit" }, eventId);
    };
    const handleSavedContact = (event: Event) => {
      const eventId = conversionEventId(event, "contact");
      void trackMetaEvent("Contact", { content_name: "AgentSiraji enquiry" }, eventId);
    };
    const handleCommerceIntentSaved = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail as { eventId?: unknown; plan?: unknown; market?: unknown } | null : null;
      const eventId = conversionEventId(event, "commerce_plan_intent");
      const plan = typeof detail?.plan === "string" ? detail.plan : "unknown";
      const market = typeof detail?.market === "string" ? detail.market : "unknown";
      void trackMetaEvent("Lead", {
        content_name: `AgentSiraji Commerce ${plan}`,
        content_category: "commerce_plan_intent",
        plan,
        market,
      }, eventId);
    };
    window.addEventListener("agentsiraji:lead-saved", handleSavedLead);
    window.addEventListener("agentsiraji:contact-saved", handleSavedContact);
    window.addEventListener("agentsiraji:commerce-intent-saved", handleCommerceIntentSaved);
    return () => {
      window.removeEventListener("agentsiraji:lead-saved", handleSavedLead);
      window.removeEventListener("agentsiraji:contact-saved", handleSavedContact);
      window.removeEventListener("agentsiraji:commerce-intent-saved", handleCommerceIntentSaved);
    };
  }, [pixelId]);

  if (!pixelId) return null;

  return (
    <Script id="agentsiraji-meta-pixel-bootstrap" strategy="afterInteractive" onReady={markPixelReady}>
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');`}
    </Script>
  );
}
