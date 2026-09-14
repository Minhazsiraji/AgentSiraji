import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await readSession(request);
  return NextResponse.json(
    session
      ? { ok: true, authenticated: true, session }
      : { ok: true, authenticated: false, session: null },
    { headers: { "Cache-Control": "no-store, private", Pragma: "no-cache" } },
  );
}
