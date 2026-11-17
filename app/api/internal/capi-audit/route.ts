import { NextResponse } from "next/server";
import { sendMetaEvent } from "@/lib/meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("token") !== "audit_9b5d4d20d4fe45e59c9c2d4b9a7f2e71") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const eventId = "agentsiraji_capi_audit_" + crypto.randomUUID();
  const result = await sendMetaEvent({
    eventName: "PageView",
    eventId,
    eventSourceUrl: "https://agentsiraji.com/ecommerce-starter",
    email: "agentsiraji-capi-audit@example.invalid",
    phone: "01700000000",
    clientIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: request.headers.get("user-agent") || "AgentSiraji-CAPI-Audit",
    customData: { audit: "starter-capi-check" },
  });
  return NextResponse.json({ ok: true, eventId, ...result }, { headers: { "Cache-Control": "no-store" } });
}
