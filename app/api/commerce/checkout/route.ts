import { NextResponse } from "next/server";
import { assignProviderTransaction, createPendingCheckout } from "@/lib/commercial-db";
import { checkoutRoutes, type PaymentProvider } from "@/lib/billing";
import { createSSLCommerzSandboxSession } from "@/lib/sslcommerz";
import { createPaddleSandboxTransaction } from "@/lib/paddle";

const planIds = new Set(["starter", "growth", "pro"]);
const bdProviders = new Set<PaymentProvider>(["sslcommerz", "bank-transfer"]);
const intlProviders = new Set<PaymentProvider>(["paddle", "manual-invoice"]);
const maxBodyBytes = 8_192;
type PlanCode = "starter" | "growth" | "pro";

function createTransactionId() {
  const time = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  return `AS${time}${random}`.slice(0, 30);
}

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV === "production" && process.env.COMMERCIAL_LIVE_CHECKOUT_ENABLED !== "true") {
    return json(
      { error: "Live Commerce checkout is not enabled yet. Contact AgentSiraji for launch enquiries." },
      { status: 503 },
    );
  }

  try {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return json({ error: "Content-Type must be application/json." }, { status: 415 });
    }

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (!Number.isFinite(contentLength) || contentLength > maxBodyBytes) {
      return json({ error: "Request is too large." }, { status: 413 });
    }

    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return json({ error: "Request origin is not allowed." }, { status: 403 });
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxBodyBytes) {
      return json({ error: "Request is too large." }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return json({ error: "Invalid checkout payload." }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const plan = typeof data.plan === "string" ? data.plan : "";
    const market = data.market === "bd" || data.market === "international" ? data.market : null;
    const provider = typeof data.provider === "string" ? data.provider as PaymentProvider : null;

    if (!planIds.has(plan) || !market || !provider) {
      return json({ error: "Plan, market, and payment method are required." }, { status: 400 });
    }

    const providerAllowed = market === "bd" ? bdProviders.has(provider) : intlProviders.has(provider);
    if (!providerAllowed) {
      return json({ error: "That payment method is not available for this market." }, { status: 400 });
    }

    const route = checkoutRoutes.find((item) => item.provider === provider && item.market === market);
    if (!route) {
      return json({ error: "Checkout route is not configured." }, { status: 409 });
    }

    const sandboxCustomer = {
      email: "commerce-sandbox@agentsiraji.com",
      displayName: "AgentSiraji Sandbox Customer",
      organizationName: `AgentSiraji Commerce Sandbox ${Date.now()}`,
      phone: "01700000000",
    };

    const pending = await createPendingCheckout({
      email: sandboxCustomer.email,
      displayName: sandboxCustomer.displayName,
      organizationName: sandboxCustomer.organizationName,
      plan: plan as PlanCode,
      market,
      provider,
    });

    if (provider === "sslcommerz") {
      const transactionId = createTransactionId();
      await assignProviderTransaction({ paymentId: pending.paymentId, providerTransactionId: transactionId });
      const baseUrl = new URL(request.url).origin;
      const session = await createSSLCommerzSandboxSession({
        tranId: transactionId,
        amount: pending.amount,
        customerName: sandboxCustomer.displayName,
        customerEmail: sandboxCustomer.email,
        customerPhone: sandboxCustomer.phone,
        paymentId: pending.paymentId,
        plan,
        baseUrl,
      });

      return json({
        ok: true,
        mode: "sandbox",
        provider,
        market,
        plan,
        status: "redirect_to_gateway",
        paymentId: pending.paymentId,
        transactionId,
        redirectUrl: session.gatewayUrl,
        activationRule: "Payment activates only after verified SSLCOMMERZ server-side validation.",
      });
    }

    if (provider === "paddle") {
      const baseUrl = new URL(request.url).origin;
      const paddleTransaction = await createPaddleSandboxTransaction({
        paymentId: pending.paymentId,
        plan,
        setupAmount: pending.setupAmount,
        recurringAmount: pending.recurringAmount,
        checkoutUrl: `${baseUrl}/checkout/commerce?plan=${encodeURIComponent(plan)}`,
      });

      await assignProviderTransaction({
        paymentId: pending.paymentId,
        providerTransactionId: paddleTransaction.transactionId,
      });

      return json({
        ok: true,
        mode: "sandbox",
        provider,
        market,
        plan,
        status: "redirect_to_gateway",
        paymentId: pending.paymentId,
        transactionId: paddleTransaction.transactionId,
        redirectUrl: paddleTransaction.checkoutUrl,
        activationRule: "Payment activates only after a verified Paddle transaction.completed webhook.",
      });
    }

    return json({
      ok: true,
      mode: route.mode,
      provider,
      market,
      plan,
      status: "awaiting_manual_submission",
      paymentId: pending.paymentId,
      expectedAmount: pending.amount,
      currency: pending.currency,
      activationRule: provider === "bank-transfer"
        ? "A bank receipt submission moves this payment to review only. Authorized AgentSiraji approval is required for activation."
        : "A manual invoice payment reference moves this payment to review only. Authorized AgentSiraji approval is required for activation.",
    });
  } catch (error) {
    console.error("Commerce checkout failed", error);
    return json({ error: "The Commerce checkout could not be created. Please try again or contact support." }, { status: 500 });
  }
}
