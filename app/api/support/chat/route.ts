import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createMockSupportReply } from "@/lib/support-assistant";

const MAX_BODY_BYTES = 4096;
const MAX_MESSAGE_CHARS = 1000;

const noStoreHeaders = {
  "Cache-Control": "no-store, private",
  Pragma: "no-cache",
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400, headers: noStoreHeaders });
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin support requests are not allowed." }, { status: 403, headers: noStoreHeaders });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return badRequest("Expected application/json.");
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413, headers: noStoreHeaders });
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return badRequest("Malformed JSON.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return badRequest("Invalid request body.");
  }

  const message = (body as { message?: unknown }).message;
  if (typeof message !== "string") {
    return badRequest("Message is required.");
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return badRequest("Message cannot be empty.");
  }

  if (trimmed.length > MAX_MESSAGE_CHARS) {
    return badRequest(`Message must be ${MAX_MESSAGE_CHARS} characters or fewer.`);
  }

  const reply = createMockSupportReply(trimmed);
  const ticketId = reply.handoff ? `MOCK-${randomUUID().slice(0, 8).toUpperCase()}` : undefined;

  return NextResponse.json(
    {
      mode: "mock",
      reply: reply.answer,
      confidence: reply.confidence,
      intent: reply.intent,
      handoff: reply.handoff,
      ticketId,
      links: reply.links ?? [],
      notice: "Mock support only. No live moderator queue or AI provider is connected yet.",
    },
    { headers: noStoreHeaders },
  );
}
