import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { reviewManualPayment } from "@/lib/commercial-db";

function authorized(request: Request) {
  const expected = process.env.COMMERCIAL_ADMIN_REVIEW_TOKEN;
  const supplied = request.headers.get("x-agentsiraji-admin-token");
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized manual-payment review." }, { status: 401 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const paymentId = typeof body.paymentId === "string" ? body.paymentId.trim() : "";
    const decision = body.decision;
    if (!paymentId || !["APPROVED", "REJECTED", "NEEDS_INFORMATION"].includes(String(decision))) {
      return NextResponse.json({ error: "paymentId and a valid review decision are required." }, { status: 400 });
    }

    const result = await reviewManualPayment({
      paymentId,
      decision: decision as "APPROVED" | "REJECTED" | "NEEDS_INFORMATION",
      reviewNote: typeof body.reviewNote === "string" ? body.reviewNote : null,
      reviewedByAccountId: typeof body.reviewedByAccountId === "string" ? body.reviewedByAccountId : null,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Manual-payment review failed.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
