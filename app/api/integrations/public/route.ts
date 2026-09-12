import { NextResponse } from "next/server";
import { readStoredIntegrations } from "@/lib/integration-config";

export const dynamic = "force-dynamic";

// Public AgentSiraji dataset ID; credentials remain server-side.
const defaultPixelId = "1054067190449122";

export async function GET() {
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || process.env.META_PIXEL_ID?.trim();
  if (pixel && /^\d+$/.test(pixel)) return NextResponse.json({ pixelId: pixel }, { headers: { "Cache-Control": "no-store" } });
  try {
    const stored = await readStoredIntegrations();
    return NextResponse.json({ pixelId: stored.metaPixelId && /^\d+$/.test(stored.metaPixelId) ? stored.metaPixelId : defaultPixelId }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ pixelId: defaultPixelId }, { headers: { "Cache-Control": "no-store" } }); }
}
