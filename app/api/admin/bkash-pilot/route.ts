import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

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

export async function GET(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized bKash configuration access." }, 401);
  const number = process.env.BKASH_PILOT_SEND_MONEY_NUMBER?.trim() || "";
  if (!/^01\d{9}$/.test(number)) {
    return json({
      ok: true,
      configured: false,
      message: "BKASH_PILOT_SEND_MONEY_NUMBER is not configured with an 11-digit Bangladesh mobile number.",
    });
  }
  return json({
    ok: true,
    configured: true,
    method: "bKash Send Money",
    number,
    instruction: "Share this number only with a qualified pilot customer. Verify the transaction in bKash before marking payment VERIFIED.",
  });
}
