import { NextResponse } from "next/server";
import {
  assignProviderTransaction,
  createPendingCheckout,
} from "@/lib/commercial-db";
import {
  checkoutRoutes,
  type PaymentProvider,
} from "@/lib/billing";
import { createSSLCommerzSandboxSession } from "@/lib/sslcommerz";

const planIds = new Set(["starter", "growth", "pro"]);
const bdProviders = new Set<PaymentProvider>([
  "sslcommerz",
  "bank-transfer",
]);
const intlProviders = new Set<PaymentProvider>([
  "paddle",
  "manual-invoice",
]);

type PlanCode = "starter" | "growth" | "pro";

function createTransactionId() {
  const time = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();

  return `AS${time}${random}`.slice(0, 30);
}

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid checkout payload." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    const plan =
      typeof data.plan === "string" ? data.plan : "";

    const market =
      data.market === "bd" || data.market === "international"
        ? data.market
        : null;

    const provider =
      typeof data.provider === "string"
        ? (data.provider as PaymentProvider)
        : null;

    if (!planIds.has(plan) || !market || !provider) {
      return NextResponse.json(
        {
          error:
            "Plan, market, and payment method are required.",
        },
        { status: 400 },
      );
    }

    const providerAllowed =
      market === "bd"
        ? bdProviders.has(provider)
        : intlProviders.has(provider);

    if (!providerAllowed) {
      return NextResponse.json(
        {
          error:
            "That payment method is not available for this market.",
        },
        { status: 400 },
      );
    }

    const route = checkoutRoutes.find(
      (item) =>
        item.provider === provider &&
        item.market === market,
    );

    if (!route) {
      return NextResponse.json(
        { error: "Checkout route is not configured." },
        { status: 409 },
      );
    }

    /*
     * Sandbox identity only.
     *
     * Before public launch this must come from the real
     * customer checkout form/account instead of fixed data.
     */
    const sandboxCustomer = {
      email: "commerce-sandbox@agentsiraji.com",
      displayName: "AgentSiraji Sandbox Customer",
      organizationName: `AgentSiraji Commerce Sandbox ${Date.now()}`,
      phone: "01700000000",
    };

    if (provider === "sslcommerz") {
      if (market !== "bd") {
        return NextResponse.json(
          { error: "SSLCOMMERZ is only available for Bangladesh." },
          { status: 400 },
        );
      }

      const pending = await createPendingCheckout({
        email: sandboxCustomer.email,
        displayName: sandboxCustomer.displayName,
        organizationName: sandboxCustomer.organizationName,
        plan: plan as PlanCode,
        market,
        provider,
      });

      const transactionId = createTransactionId();

      await assignProviderTransaction({
        paymentId: pending.paymentId,
        providerTransactionId: transactionId,
      });

      const baseUrl = new URL(request.url).origin;

      const session =
        await createSSLCommerzSandboxSession({
          tranId: transactionId,
          amount: pending.amount,
          customerName: sandboxCustomer.displayName,
          customerEmail: sandboxCustomer.email,
          customerPhone: sandboxCustomer.phone,
          paymentId: pending.paymentId,
          plan,
          baseUrl,
        });

      return NextResponse.json({
        ok: true,
        mode: "sandbox",
        provider: "sslcommerz",
        market,
        plan,
        status: "redirect_to_gateway",
        paymentId: pending.paymentId,
        transactionId,
        redirectUrl: session.gatewayUrl,
        activationRule:
          "Payment activates only after verified SSLCOMMERZ server-side validation.",
      });
    }

    /*
     * These remain controlled test routes until their
     * dedicated persistence/provider implementations are wired.
     */
    return NextResponse.json({
      ok: true,
      mode: route.mode,
      provider: route.provider,
      market: route.market,
      plan,
      status:
        provider === "bank-transfer" ||
        provider === "manual-invoice"
          ? "under_review_after_submission"
          : "awaiting_verified_gateway_payment",
      activationRule:
        provider === "bank-transfer"
          ? "Authorized AgentSiraji admin approval is required after bank receipt verification."
          : provider === "paddle"
            ? "Verified Paddle webhook processing is required before activation."
            : "Authorized AgentSiraji verification is required before activation.",
    });
  } catch (error) {
    console.error("Commerce checkout failed", error);

    return NextResponse.json(
      {
        error:
          "The sandbox checkout could not be created.",
      },
      { status: 500 },
    );
  }
}