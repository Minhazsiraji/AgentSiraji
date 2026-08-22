import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.PADDLE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Paddle sandbox webhook secret is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("paddle-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Paddle signature." }, { status: 400 });
  }

  // Signature verification and event persistence are intentionally blocked until
  // the real sandbox secret is supplied. No subscription/entitlement may activate
  // from an unverified webhook payload.
  return NextResponse.json(
    {
      ok: false,
      status: "verification_required",
      message: "Webhook received. Paddle signature verification is required before activation.",
    },
    { status: 202 },
  );
}
