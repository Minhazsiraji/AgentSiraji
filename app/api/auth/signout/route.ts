import { NextResponse } from "next/server";
import { authCookieOptions, authSessionCookie, revokeCurrentSession } from "@/lib/auth";
import { requestOriginAllowed } from "@/lib/request-safety";

export async function POST(request: Request) {
  if (!requestOriginAllowed(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  await revokeCurrentSession(request);
  const response = NextResponse.json({ ok: true }, {
    headers: { "Cache-Control": "no-store, private", Pragma: "no-cache" },
  });
  response.cookies.set(authSessionCookie, "", { ...authCookieOptions(new Date(0)), maxAge: 0 });
  return response;
}
