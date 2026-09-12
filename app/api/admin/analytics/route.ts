import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSalesAnalytics } from "@/lib/sales-analytics";

function json(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

function authorized(request: Request) {
  const expected = process.env.COMMERCIAL_ADMIN_REVIEW_TOKEN;
  const supplied = request.headers.get("x-agentsiraji-admin-token");
  if (!expected || expected.length < 32 || !supplied) return false;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function GET(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized analytics access." }, 401);

  try {
    const analytics = await getSalesAnalytics();
    return json({ ok: true, analytics });
  } catch (error) {
    console.error("Admin analytics failed", error);
    return json({ error: "Analytics are temporarily unavailable." }, 500);
  }
}
