import { NextResponse } from "next/server";
import { authCookieOptions, authSessionCookie, consumeMagicLink } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site-url";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  const verified = await consumeMagicLink(token);
  if (!verified) {
    return NextResponse.redirect(new URL("/sign-in?error=expired", getSiteUrl()));
  }

  const response = NextResponse.redirect(new URL(verified.redirectPath, getSiteUrl()));
  response.cookies.set(authSessionCookie, verified.rawSession, authCookieOptions(verified.expiresAt));
  response.headers.set("Cache-Control", "no-store, private");
  return response;
}
