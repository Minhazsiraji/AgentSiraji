import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  activateVerifiedGatewayPayment,
  getPendingGatewayPayment,
  markPaymentEventProcessed,
  recordPaymentEvent,
} from "@/lib/commercial-db";
import { validateSSLCommerzTransaction } from "@/lib/sslcommerz";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function processSuccess(request: Request, rawBody: string) {
  const redirect = new URL("/checkout/commerce", request.url);

  try {
    const url = new URL(request.url);
    const form = new URLSearchParams(rawBody);

    const tranId =
      form.get("tran_id")?.trim() ||
      url.searchParams.get("tran_id")?.trim() ||
      "";

    const valId =
      form.get("val_id")?.trim() ||
      url.searchParams.get("val_id")?.trim() ||
      "";

    if (!tranId || !valId) {
      redirect.searchParams.set("payment", "verification-pending");
      return NextResponse.redirect(redirect, 303);
    }

    const payment = await getPendingGatewayPayment({
      provider: "sslcommerz",
      providerTransactionId: tranId,
    });

    if (!payment) {
      redirect.searchParams.set("payment", "unknown");
      return NextResponse.redirect(redirect, 303);
    }

    const validation = await validateSSLCommerzTransaction(valId);
    const status = validation.status?.toUpperCase() ?? "";

    if (status !== "VALID" && status !== "VALIDATED") {
      redirect.searchParams.set("payment", "verification-failed");
      return NextResponse.redirect(redirect, 303);
    }

    if (validation.tran_id !== tranId) {
      redirect.searchParams.set("payment", "mismatch");
      return NextResponse.redirect(redirect, 303);
    }

    const validatedAmount = Number(validation.amount);

    if (
      !Number.isFinite(validatedAmount) ||
      Math.round(validatedAmount * 100) !== payment.amount * 100
    ) {
      redirect.searchParams.set("payment", "amount-mismatch");
      return NextResponse.redirect(redirect, 303);
    }

    const validatedCurrency = (
      validation.currency_type ||
      validation.currency ||
      ""
    ).toUpperCase();

    if (validatedCurrency !== payment.currency.toUpperCase()) {
      redirect.searchParams.set("payment", "currency-mismatch");
      return NextResponse.redirect(redirect, 303);
    }

    if (validation.value_a && validation.value_a !== payment.paymentId) {
      redirect.searchParams.set("payment", "reference-mismatch");
      return NextResponse.redirect(redirect, 303);
    }

    const event = await recordPaymentEvent({
      provider: "sslcommerz",
      providerEventId: `${tranId}:${valId}`,
      eventType: "SUCCESS_CALLBACK_VALIDATED",
      payloadDigest: sha256(rawBody || `${tranId}:${valId}`),
    });

    if (event.inserted) {
      await activateVerifiedGatewayPayment({
        paymentId: payment.paymentId,
        organizationId: payment.organizationId,
        subscriptionId: payment.subscriptionId,
        providerTransactionId: tranId,
      });

      if (event.eventId) {
        await markPaymentEventProcessed(event.eventId);
      }
    }

    redirect.searchParams.set("payment", "verified");
    return NextResponse.redirect(redirect, 303);
  } catch (error) {
    console.error("SSLCOMMERZ success verification failed", error);
    redirect.searchParams.set("payment", "verification-failed");
    return NextResponse.redirect(redirect, 303);
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  return processSuccess(request, rawBody);
}

export async function GET(request: Request) {
  return processSuccess(request, "");
}