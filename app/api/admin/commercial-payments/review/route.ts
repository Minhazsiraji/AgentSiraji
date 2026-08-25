import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { reviewManualPayment } from "@/lib/commercial-db";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const maxBodyBytes = 8_192;

function json(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" },
  });
}

function authorized(request: Request) {
  const expected = process.env.COMMERCIAL_ADMIN_REVIEW_TOKEN;
  const supplied = request.headers.get("x-agentsiraji-admin-token");
  if (!expected || expected.length < 32 || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return json({ error: "Unauthorized manual-payment review." }, 401);
  }

  try {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return json({ error: "Content-Type must be application/json." }, 415);
    }

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (!Number.isFinite(contentLength) || contentLength > maxBodyBytes) {
      return json({ error: "Request is too large." }, 413);
    }

    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return json({ error: "Request origin is not allowed." }, 403);
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxBodyBytes) {
      return json({ error: "Request is too large." }, 413);
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return json({ error: "Invalid JSON payload." }, 400);
    }

    const paymentId = typeof body.paymentId === "string" ? body.paymentId.trim() : "";
    const decision = String(body.decision ?? "");
    const reviewNote = typeof body.reviewNote === "string" ? body.reviewNote.trim() : "";

    if (!uuidPattern.test(paymentId) || !["APPROVED", "REJECTED", "NEEDS_INFORMATION"].includes(decision)) {
      return json({ error: "A valid payment reference and review decision are required." }, 400);
    }

    if (reviewNote.length > 1_000) {
      return json({ error: "Review note is too long." }, 400);
    }

    const result = await reviewManualPayment({
      paymentId,
      decision: decision as "APPROVED" | "REJECTED" | "NEEDS_INFORMATION",
      reviewNote: reviewNote || null,
      reviewedByAccountId: null,
    });

    return json({ ok: true, ...result });
  } catch (error) {
    console.error("Manual-payment review failed", error);
    return json({ error: "The manual-payment review could not be completed." }, 409);
  }
}
