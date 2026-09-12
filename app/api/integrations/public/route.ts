import { NextResponse } from "next/server";
import { readStoredIntegrations } from "@/lib/integration-config";

export const dynamic = "force-dynamic";

const defaultPixelId = "1054067190449122";

function validGoogleTagId(value?: string) {
  return Boolean(value && /^(G-|AW-|GT-)[A-Z0-9_-]+$/i.test(value));
}

export async function GET() {
  const envPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || process.env.META_PIXEL_ID?.trim() || "";
  const envGoogle = process.env.NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID?.trim() || "";
  try {
    const stored = await readStoredIntegrations();
    const pixelId = /^\d+$/.test(envPixel) ? envPixel : stored.metaPixelId && /^\d+$/.test(stored.metaPixelId) ? stored.metaPixelId : defaultPixelId;
    const googleTagId = validGoogleTagId(envGoogle) ? envGoogle : validGoogleTagId(stored.googleMeasurementId) ? stored.googleMeasurementId : undefined;
    return NextResponse.json({ pixelId, ...(googleTagId ? { googleTagId } : {}) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ pixelId: /^\d+$/.test(envPixel) ? envPixel : defaultPixelId, ...(validGoogleTagId(envGoogle) ? { googleTagId: envGoogle } : {}) }, { headers: { "Cache-Control": "no-store" } });
  }
}
