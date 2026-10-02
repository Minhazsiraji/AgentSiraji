"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { initializeGoogleTag, trackGoogleLead, trackGooglePageView, validGoogleTagId } from "@/lib/google-client";

const configuredGoogleTag = process.env.NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID?.trim();
const configuredGoogleTagId = configuredGoogleTag && validGoogleTagId(configuredGoogleTag) ? configuredGoogleTag : undefined;

export function GoogleTracking() {
  const pathname = usePathname();
  const [tagId, setTagId] = useState<string | undefined>(configuredGoogleTagId);
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
    if (!tagId || !pathname || trackedPath.current === pathname) return;
    trackedPath.current = pathname;
    trackGooglePageView(pathname);
  }, [pathname, tagId]);

  useEffect(() => {
    if (!tagId) return;
    const handleSavedLead = () => { trackGoogleLead("store_audit"); };
    const handleSavedContact = () => { trackGoogleLead("contact"); };
    window.addEventListener("agentsiraji:lead-saved", handleSavedLead);
    window.addEventListener("agentsiraji:contact-saved", handleSavedContact);
    return () => {
      window.removeEventListener("agentsiraji:lead-saved", handleSavedLead);
      window.removeEventListener("agentsiraji:contact-saved", handleSavedContact);
    };
  }, [tagId]);

  if (!tagId) return null;

  return (
    <Script
      id="agentsiraji-google-tag"
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`}
      strategy="afterInteractive"
      onReady={() => { initializeGoogleTag(tagId); }}
    />
  );
}
