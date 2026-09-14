import { NextResponse } from "next/server";
import { createMagicLink } from "@/lib/auth";
import { readJson, rateLimited, RequestError } from "@/lib/request-safety";
import { getSiteUrl } from "@/lib/site-url";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, private", Pragma: "no-cache" },
  });
}

export async function POST(request: Request) {
  if (rateLimited(request, "auth-magic-link", 5)) {
    return json({ ok: true, message: "If this email can sign in, a fresh link will be sent shortly." }, 200);
  }

  try {
    const body = await readJson(request, 4096);
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const next = typeof body.next === "string" ? body.next : "/account/commerce";
    if (!emailPattern.test(email) || email.length > 254) {
      return json({ message: "Enter a valid email address." }, 400);
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const link = await createMagicLink(email, next, ip);
    if (link) {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.CONTACT_FROM_EMAIL || "AgentSiraji <onboarding@resend.dev>";
      if (!apiKey) {
        console.error("Auth magic link could not be sent because RESEND_API_KEY is missing.");
        return json({ message: "Sign-in email delivery is temporarily unavailable." }, 503);
      }

      const verifyUrl = `${getSiteUrl()}/api/auth/verify?token=${encodeURIComponent(link.rawToken)}`;
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [link.email],
          subject: "Your AgentSiraji sign-in link",
          text: [
            "Sign in to AgentSiraji",
            "",
            "Open this one-time link within 15 minutes:",
            verifyUrl,
            "",
            "If you did not request this link, you can ignore this email.",
          ].join("\n"),
        }),
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) {
        console.error("Auth magic link email delivery failed", response.status);
        return json({ message: "Sign-in email delivery is temporarily unavailable." }, 503);
      }
    }

    return json({ ok: true, message: "If this email can sign in, a one-time link has been sent." });
  } catch (error) {
    if (error instanceof RequestError) return json({ message: error.message }, error.status);
    console.error("Magic-link request failed", error);
    return json({ message: "Unable to request sign-in right now." }, 500);
  }
}
