import { NextResponse } from "next/server";
import { checkoutRoutes, type PaymentProvider } from "@/lib/billing";

const planIds = new Set(["starter", "growth", "pro"]);
const bdProviders = new Set<PaymentProvider>(["sslcommerz", "bank-transfer"]);
const intlProviders = new Set<PaymentProvider>(["paddle", "manual-invoice"]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid checkout payload." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const plan = typeof data.plan === "string" ? data.plan : "";
  const market = data.market === "bd" || data.market === "international" ? data.market : null;
  const provider = typeof data.provider === "string" ? (data.provider as PaymentProvider) : null;

  if (!planIds.has(plan) || !market || !provider) {
    return NextResponse.json({ error: "Plan, market, and payment method are required." }, { status: 400 });
  }

  const providerAllowed = market === "bd" ? bdProviders.has(provider) : intlProviders.has(provider);
  if (!providerAllowed) {
    return NextResponse.json({ error: "That payment method is not available for this market." }, { status: 400 });
  }

  const route = checkoutRoutes.find((item) => item.provider === provider && item.market === market);
  if (!route) {
    return NextResponse.json({ error: "Checkout route is not configured." }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    mode: route.mode,
    provider: route.provider,
    market: route.market,
    plan,
    status: provider === "bank-transfer" || provider === "manual-invoice" ? "under_review_after_submission" : "awaiting_verified_gateway_payment",
    activationRule:
      provider === "bank-transfer"
        ? "Authorized AgentSiraji admin approval is required after bank receipt verification."
        : provider === "sslcommerz" || provider === "paddle"
          ? "Server-side payment verification is required before activation."
          : "Authorized AgentSiraji verification is required before activation.",
  });
}
