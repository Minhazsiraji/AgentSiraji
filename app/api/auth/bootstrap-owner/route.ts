import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { readJson, RequestError } from "@/lib/request-safety";

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, private", Pragma: "no-cache" } });
}

function validLegacyToken(supplied: string) {
  const expected = process.env.COMMERCIAL_ADMIN_REVIEW_TOKEN?.trim() || "";
  if (expected.length < 32 || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const session = await readSession(request);
  if (!session) return json({ error: "Sign in before bootstrapping the platform owner." }, 401);

  try {
    const body = await readJson(request, 4096);
    const legacyToken = typeof body.legacyAdminToken === "string" ? body.legacyAdminToken.trim() : "";
    if (!validLegacyToken(legacyToken)) return json({ error: "Legacy owner proof was rejected." }, 403);

    const sql = db();
    const existing = await sql`SELECT account_id FROM platform_account_roles WHERE role = 'PLATFORM_OWNER' LIMIT 1`;
    if (existing[0]) return json({ error: "Platform owner bootstrap is already closed." }, 409);

    await sql`
      INSERT INTO platform_account_roles (account_id, role)
      VALUES (${session.accountId}, 'PLATFORM_OWNER')
      ON CONFLICT DO NOTHING
    `;
    await sql`
      INSERT INTO auth_security_events (account_id, event_type, detail)
      VALUES (${session.accountId}, 'PLATFORM_OWNER_BOOTSTRAPPED', 'Initial platform owner established using authenticated email session plus legacy owner proof')
    `;
    return json({ ok: true, message: "Platform owner established. Future admin access uses your authenticated session." });
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status);
    console.error("Platform owner bootstrap failed", error);
    return json({ error: "Platform owner bootstrap could not be completed." }, 500);
  }
}
