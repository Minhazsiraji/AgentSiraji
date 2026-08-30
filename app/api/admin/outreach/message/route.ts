import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const maxBodyBytes = 8_000;

function json(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" },
  });
}

function authorized(request: Request) {
  const expected = process.env.OUTREACH_ADMIN_TOKEN || process.env.COMMERCIAL_ADMIN_REVIEW_TOKEN;
  const supplied = request.headers.get("x-agentsiraji-admin-token");
  if (!expected || expected.length < 32 || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized outreach access." }, 401);

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: "Request origin is not allowed." }, 403);
  }

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "Content-Type must be application/json." }, 415);
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBodyBytes) {
    return json({ error: "Request is too large." }, 413);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON payload." }, 400);
  }

  const profileUrl = typeof body.profileUrl === "string" ? body.profileUrl.trim() : "";
  const dm = typeof body.dm === "string" ? body.dm.trim() : "";
  if (!profileUrl || profileUrl.length > 500 || !dm || dm.length > 2_500) {
    return json({ error: "A valid official contact URL and DM are required." }, 400);
  }

  try {
    const sql = db();
    const rows = await sql`
      UPDATE outreach_leads
      SET personalized_dm = ${dm}, updated_at = now()
      WHERE profile_url = ${profileUrl}
        AND first_sent_at IS NULL
        AND closed = false
      RETURNING id
    `;
    if (!rows[0]) return json({ error: "Unsent lead was not found." }, 404);
    return json({ ok: true });
  } catch (error) {
    console.error("Outreach DM save failed", error);
    return json({ error: "DM could not be saved." }, 500);
  }
}
