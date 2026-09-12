import { NextResponse } from "next/server";
import { rateLimited, requestOriginAllowed } from "@/lib/request-safety";
import { isMetaEventId, metaEventNames, sendMetaEvent, type MetaEventName } from "@/lib/meta";

export const runtime = "nodejs";

const clientEvents = new Set<MetaEventName>(["PageView", "ViewContent"]);
const maxBodyBytes = 16_384;

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } });
}

function sourceUrl(request: Request, value: unknown) {
  const requestUrl = new URL(request.url);
  if (typeof value !== "string") return requestUrl.origin;
  try {
    const candidate = new URL(value);
    if (candidate.origin !== requestUrl.origin) return requestUrl.origin;
    candidate.hash = "";
    candidate.search = "";
    return candidate.toString().slice(0, 500);
  } catch {
    return requestUrl.origin;
  }
}

export async function POST(request: Request) {
  try {
    if (rateLimited(request, "meta", 100)) return json({ error: "Too many events." }, 429);
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return json({ error: "Content-Type must be application/json." }, 415);
    }
    if (!requestOriginAllowed(request)) return json({ error: "Request origin is not allowed." }, 403);

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxBodyBytes) return json({ error: "Request is too large." }, 413);
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid event." }, 400);
    const eventName = typeof body.eventName === "string" ? body.eventName as MetaEventName : null;
    const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
    if (body.consentGranted !== true) return json({ ok: true, sent: false });
    if (!eventName || !metaEventNames.includes(eventName) || !clientEvents.has(eventName) || !isMetaEventId(eventId)) {
      return json({ error: "Invalid Meta event." }, 400);
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
      fbp: typeof body.fbp === "string" ? body.fbp : undefined,
      fbc: typeof body.fbc === "string" ? body.fbc : undefined,
      eventSourceUrl: sourceUrl(request, body.eventSourceUrl),
    });
    return json({ ok: true, sent: result.sent });
  } catch {
    return json({ error: "Meta event could not be recorded." }, 400);
  }
}
