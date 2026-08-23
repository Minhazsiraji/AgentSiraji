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

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const form = new URLSearchParams(rawBody);

    const tranId = form.get("tran_id")?.trim() ?? "";
    const valId = form.get("val_id")?.trim() ?? "";
    const callbackStatus = form.get("status")?.trim() ?? "";

    if (!tranId || !valId) {
      return NextResponse.json(
        { error: "Missing SSLCOMMERZ transaction identifiers." },
        { status: 400 },
      );
    }

    const payment = await getPendingGatewayPayment({
      provider: "sslcommerz",
      providerTransactionId: tranId,
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Unknown SSLCOMMERZ transaction." },
        { status: 404 },
      );
    }

    const validation = await validateSSLCommerzTransaction(valId);

    const validationStatus = validation.status?.toUpperCase() ?? "";
    const validStatus =
      validationStatus === "VALID" ||
      validationStatus === "VALIDATED";

    if (!validStatus) {
      return NextResponse.json(
        {
          error: "SSLCOMMERZ server-side validation did not confirm payment.",
          status: validationStatus || callbackStatus || "UNKNOWN",
        },
        { status: 400 },
      );
    }

    if (validation.tran_id !== tranId) {
      return NextResponse.json(
        { error: "SSLCOMMERZ transaction ID mismatch." },
        { status: 409 },
      );
    }

    const validatedAmount = Number(validation.amount);

    if (
      !Number.isFinite(validatedAmount) ||
      Math.round(validatedAmount * 100) !== payment.amount * 100
    ) {
      return NextResponse.json(
        { error: "SSLCOMMERZ payment amount mismatch." },
        { status: 409 },
      );
    }

    const validatedCurrency = (
      validation.currency_type ||
      validation.currency ||
      ""
    ).toUpperCase();

    if (validatedCurrency !== payment.currency.toUpperCase()) {
      return NextResponse.json(
        { error: "SSLCOMMERZ payment currency mismatch." },
        { status: 409 },
      );
    }

    if (
      validation.value_a &&
      validation.value_a !== payment.paymentId
    ) {
      return NextResponse.json(
        { error: "SSLCOMMERZ payment reference mismatch." },
        { status: 409 },
      );
    }

    const providerEventId = `${tranId}:${valId}`;

    const event = await recordPaymentEvent({
      provider: "sslcommerz",
      providerEventId,
      eventType: "PAYMENT_VALIDATED",
      payloadDigest: sha256(rawBody),
    });

    if (!event.inserted) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        status: "already_processed",
      });
    }

    await activateVerifiedGatewayPayment({
      paymentId: payment.paymentId,
      organizationId: payment.organizationId,
      subscriptionId: payment.subscriptionId,
      providerTransactionId: tranId,
    });

    if (event.eventId) {
      await markPaymentEventProcessed(event.eventId);
    }

    return NextResponse.json({
      ok: true,
      status: "paid",
      subscription: "active",
      entitlement: "active",
    });
  } catch (error) {
    console.error("SSLCOMMERZ IPN processing failed", error);

    return NextResponse.json(
      { error: "SSLCOMMERZ payment verification failed." },
      { status: 500 },
    );
  }
}