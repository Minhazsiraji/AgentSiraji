import { NextResponse } from "next/server";
import { rateLimited, requestOriginAllowed } from "@/lib/request-safety";
import { metaEventNames, sendMetaEvent, type MetaEventName } from "@/lib/meta";

export const runtime = "nodejs";

const clientEvents = new Set<MetaEventName>(["PageView", "ViewContent"]);
const maxBodyBytes = 16_384;

export async function POST(request: Request) {
  try {
    if (rateLimited(request, "meta", 100)) return NextResponse.json({ error: "Too many events." }, { status: 429 });
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json." }, { status: 415 });
    }
    if (!requestOriginAllowed(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxBodyBytes) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid event." }, { status: 400 });
    const eventName = typeof body.eventName === "string" ? body.eventName as MetaEventName : null;
    const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
    if (body.consentGranted !== true) return NextResponse.json({ ok: true, sent: false });
    if (!eventName || !metaEventNames.includes(eventName) || !clientEvents.has(eventName) || !/^[A-Za-z0-9_.:-]{8,100}$/.test(eventId)) {
      return NextResponse.json({ error: "Invalid Meta event." }, { status: 400 });
    }

    const customData = body.customData && typeof body.customData === "object" && !Array.isArray(body.customData)
      ? Object.fromEntries(Object.entries(body.customData as Record<string, unknown>).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)).slice(0, 20)) as Record<string, string | number | boolean>
      : {};
    const result = await sendMetaEvent({
      eventName,
      eventId,
      userAgent: request.headers.get("user-agent") || undefined,
      clientIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      customData,
      email: typeof body.email === "string" ? body.email : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      fbp: typeof body.fbp === "string" ? body.fbp : undefined,
      fbc: typeof body.fbc === "string" ? body.fbc : undefined,
      eventSourceUrl: "https://agentsiraji.com",
    });
    return NextResponse.json({ ok: true, sent: result.sent });
  } catch {
    return NextResponse.json({ error: "Meta event could not be recorded." }, { status: 400 });
  }
}
