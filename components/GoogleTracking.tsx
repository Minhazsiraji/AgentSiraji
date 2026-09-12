"use client";

import Script from "next/script";
import { startTransition, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { marketingConsentKey, measurementConsentChangedEvent } from "@/lib/meta-client";
import { initializeGoogleTag, revokeGoogleConsent, trackGoogleLead, trackGooglePageView, validGoogleTagId } from "@/lib/google-client";

const configuredGoogleTag = process.env.NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID?.trim();
const configuredGoogleTagId = configuredGoogleTag && validGoogleTagId(configuredGoogleTag) ? configuredGoogleTag : undefined;

export function GoogleTracking() {
  const pathname = usePathname();
  const [tagId, setTagId] = useState<string | undefined>(configuredGoogleTagId);
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);
  const trackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (tagId) return;
    void fetch("/api/integrations/public", { cache: "no-store" })
      .then(response => response.json() as Promise<{ googleTagId?: unknown }>)
      .then(data => {
        if (typeof data.googleTagId === "string" && validGoogleTagId(data.googleTagId)) setTagId(data.googleTagId);
      })
      .catch(() => undefined);
  }, [tagId]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(marketingConsentKey);
      if (saved === "granted" || saved === "denied") startTransition(() => setConsent(saved));
    } catch { /* Optional measurement remains disabled when storage is unavailable. */ }

    const handleConsent = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail as { value?: unknown } | null : null;
      const value = detail?.value;
      if (value === "granted" || value === "denied") setConsent(value);
    };
    window.addEventListener(measurementConsentChangedEvent, handleConsent);
    return () => window.removeEventListener(measurementConsentChangedEvent, handleConsent);
  }, []);

  useEffect(() => {
    if (consent === "denied") {
      revokeGoogleConsent();
      trackedPath.current = null;
    }
  }, [consent]);

  useEffect(() => {
    if (consent !== "granted" || !tagId || !pathname || trackedPath.current === pathname) return;
    trackedPath.current = pathname;
    trackGooglePageView(pathname);
  }, [consent, pathname, tagId]);

  useEffect(() => {
    if (consent !== "granted" || !tagId) return;
    const handleSavedLead = () => { trackGoogleLead("store_audit"); };
    const handleSavedContact = () => { trackGoogleLead("contact"); };
    window.addEventListener("agentsiraji:lead-saved", handleSavedLead);
    window.addEventListener("agentsiraji:contact-saved", handleSavedContact);
    return () => {
      window.removeEventListener("agentsiraji:lead-saved", handleSavedLead);
      window.removeEventListener("agentsiraji:contact-saved", handleSavedContact);
    };
  }, [consent, tagId]);

  if (consent !== "granted" || !tagId) return null;
  return (
    <Script
      id="agentsiraji-google-tag"
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`}
      strategy="afterInteractive"
      onReady={() => initializeGoogleTag(tagId)}
    />
  );
}
