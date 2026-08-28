import { NextResponse } from "next/server";
import { assignProviderTransaction } from "@/lib/commercial-db";
import { checkoutRoutes, type PaymentProvider } from "@/lib/billing";
import { createSSLCommerzSandboxSession } from "@/lib/sslcommerz";
import { createProductPaddleSandboxTransaction } from "@/lib/product-paddle";
import { createPendingProductSubscription } from "@/lib/subscription-checkout";

const bdProviders = new Set<PaymentProvider>(["sslcommerz", "bank-transfer"]);
const intlProviders = new Set<PaymentProvider>(["paddle", "manual-invoice"]);
const maxBodyBytes = 12_288;
const codePattern = /^[a-z0-9][a-z0-9-]{0,63}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function bounded(value: unknown, max: number) {
  const text = String(value ?? "").trim();
  return text.length > 0 && text.length <= max ? text : null;
}

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV === "production" && process.env.COMMERCIAL_LIVE_CHECKOUT_ENABLED !== "true") {
    return json({ error: "Live subscription checkout is not enabled yet." }, { status: 503 });
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
      return json({ error: "Invalid subscription checkout payload." }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const product = bounded(data.product, 64);
    const plan = bounded(data.plan, 64);
    const market = data.market === "bd" || data.market === "international" ? data.market : null;
    const provider = typeof data.provider === "string" ? data.provider as PaymentProvider : null;
    const email = bounded(data.email, 254);
    const displayName = bounded(data.displayName, 120);
    const organizationName = bounded(data.organizationName, 160);
    const phone = bounded(data.phone, 40) ?? "01700000000";

    if (!product || !plan || !codePattern.test(product) || !codePattern.test(plan) || !market || !provider || !email || !emailPattern.test(email) || !organizationName) {
      return json({ error: "Product, plan, market, customer email, business name, and payment method are required." }, { status: 400 });
    }

    const providerAllowed = market === "bd" ? bdProviders.has(provider) : intlProviders.has(provider);
    if (!providerAllowed) {
      return json({ error: "That payment method is not available for this market." }, { status: 400 });
    }
    const route = checkoutRoutes.find((item) => item.provider === provider && item.market === market);
    if (!route) return json({ error: "Checkout route is not configured." }, { status: 409 });

    const pending = await createPendingProductSubscription({
      product,
      plan,
      market,
      provider,
      email,
      displayName: displayName ?? undefined,
      organizationName,
    });

    if (provider === "sslcommerz") {
      const transactionId = createTransactionId();
      await assignProviderTransaction({ paymentId: pending.paymentId, providerTransactionId: transactionId });
      const baseUrl = new URL(request.url).origin;
      const session = await createSSLCommerzSandboxSession({
        tranId: transactionId,
        amount: pending.amount,
        customerName: displayName ?? organizationName,
        customerEmail: email,
        customerPhone: phone,
        paymentId: pending.paymentId,
        plan,
        baseUrl,
      });
      return json({
        ok: true,
        mode: "sandbox",
        provider,
        product,
        market,
        plan,
        status: "redirect_to_gateway",
        paymentId: pending.paymentId,
        transactionId,
        redirectUrl: session.gatewayUrl,
        activationRule: "Access activates only after verified SSLCOMMERZ server-side validation.",
      });
    }

    if (provider === "paddle") {
      const baseUrl = new URL(request.url).origin;
      const paddle = await createProductPaddleSandboxTransaction({
        paymentId: pending.paymentId,
        product,
        plan,
        setupAmount: pending.setupAmount,
        recurringAmount: pending.recurringAmount,
        checkoutUrl: `${baseUrl}/checkout/${encodeURIComponent(product)}?plan=${encodeURIComponent(plan)}`,
      });
      await assignProviderTransaction({ paymentId: pending.paymentId, providerTransactionId: paddle.transactionId });
      return json({
        ok: true,
        mode: "sandbox",
        provider,
        product,
        market,
        plan,
        status: "redirect_to_gateway",
        paymentId: pending.paymentId,
        transactionId: paddle.transactionId,
        redirectUrl: paddle.checkoutUrl,
        activationRule: "Access activates only after a verified Paddle transaction.completed webhook.",
      });
    }

    return json({
      ok: true,
      mode: route.mode,
      provider,
      product,
      market,
      plan,
      status: "awaiting_manual_submission",
      paymentId: pending.paymentId,
      expectedAmount: pending.amount,
      currency: pending.currency,
      activationRule: "Payment evidence moves the subscription to review only. Authorized AgentSiraji approval is required for activation.",
    });
  } catch (error) {
    console.error("Subscription checkout failed", error);
    const message = error instanceof Error ? error.message : "Subscription checkout could not be created.";
    const safeMessage = message.includes("not configured")
      ? "This payment method is still being connected for this product. Choose another available method or contact support."
      : message.includes("not enabled for sale")
        ? "This subscription is not enabled for sale yet."
        : message.includes("not synchronized")
          ? "Displayed pricing and provider billing are not synchronized yet. Checkout remains blocked for safety."
          : "The subscription checkout could not be created. Please try again or contact support.";
    return json({ error: safeMessage }, { status: 409 });
  }
}
