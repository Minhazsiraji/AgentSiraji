import { NextResponse } from "next/server";
import { readStoredIntegrations } from "@/lib/integration-config";

export const dynamic = "force-dynamic";

const defaultPixelId = "1054067190449122";
const defaultGoogleTagId = "G-RQHGR4FNF5";

function validGoogleTagId(value?: string) {
  return Boolean(value && /^(G-|AW-|GT-)[A-Z0-9_-]+$/i.test(value));
}

export async function GET() {
  const envPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || process.env.META_PIXEL_ID?.trim() || "";
  const envGoogle = process.env.NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID?.trim() || "";
  try {
    const stored = await readStoredIntegrations();
    const pixelId = /^\d+$/.test(envPixel) ? envPixel : stored.metaPixelId && /^\d+$/.test(stored.metaPixelId) ? stored.metaPixelId : defaultPixelId;
    const googleTagId = validGoogleTagId(envGoogle) ? envGoogle : validGoogleTagId(stored.googleMeasurementId) ? stored.googleMeasurementId : defaultGoogleTagId;
    return NextResponse.json({ pixelId, googleTagId }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ pixelId: /^\d+$/.test(envPixel) ? envPixel : defaultPixelId, googleTagId: validGoogleTagId(envGoogle) ? envGoogle : defaultGoogleTagId }, { headers: { "Cache-Control": "no-store" } });
  }
}
