"use client";

import { useLayoutEffect } from "react";
import { marketingConsentKey, measurementConsentChangedEvent } from "@/lib/meta-client";

export function MeasurementBootstrap() {
  useLayoutEffect(() => {
    try {
      window.localStorage.setItem(marketingConsentKey, "granted");
    } catch {
      // Measurement clients also default to enabled when first-party storage is unavailable.
    }
    window.dispatchEvent(new CustomEvent(measurementConsentChangedEvent, { detail: { value: "granted" } }));
  }, []);

  return null;
}
