import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  activateVerifiedGatewayPayment,
  getPendingGatewayPayment,
  markPaymentEventProcessed,
  recordPaymentEvent,
} from "@/lib/commercial-db";
import { verifyPaddleWebhook } from "@/lib/paddle";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request) {
  try {
    const signature =
      request.headers.get("paddle-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Paddle signature." },
        { status: 400 },
      );
    }

    const rawBody = await request.text();

    const event = await verifyPaddleWebhook(
      rawBody,
      signature,
    );

    if (event.eventType !== "transaction.completed") {
      return NextResponse.json({
        ok: true,
        ignored: true,
        eventType: event.eventType,
      });
    }

    const transaction =
      event.data as unknown as {
        id?: string;
        status?: string;
        currencyCode?: string;
        customData?: {
          agentsiraji_payment_id?: string;
          agentsiraji_plan?: string;
        } | null;
        details?: {
          totals?: {
            grandTotal?: string;
            total?: string;
          };
        } | null;
      };

    const transactionId = transaction.id ?? "";

    if (
      !transactionId ||
      transaction.status !== "completed"
    ) {
      return NextResponse.json(
        { error: "Invalid Paddle completed transaction." },
        { status: 400 },
      );
    }

    const payment =
      await getPendingGatewayPayment({
        provider: "paddle",
        providerTransactionId: transactionId,
      });

    if (!payment) {
      return NextResponse.json(
        { error: "Unknown Paddle transaction." },
        { status: 404 },
      );
    }

    if (
      transaction.customData
        ?.agentsiraji_payment_id &&
      transaction.customData
        .agentsiraji_payment_id !== payment.paymentId
    ) {
      return NextResponse.json(
        { error: "Paddle payment reference mismatch." },
        { status: 409 },
      );
    }

    if (
      transaction.currencyCode &&
      transaction.currencyCode.toUpperCase() !==
        payment.currency.toUpperCase()
    ) {
      return NextResponse.json(
        { error: "Paddle currency mismatch." },
        { status: 409 },
      );
    }


    const paymentEvent =
      await recordPaymentEvent({
        provider: "paddle",
        providerEventId: event.eventId,
        eventType: event.eventType,
        payloadDigest: sha256(rawBody),
      });

    if (!paymentEvent.inserted) {
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
      providerTransactionId: transactionId,
    });

    if (paymentEvent.eventId) {
      await markPaymentEventProcessed(
        paymentEvent.eventId,
      );
    }

    return NextResponse.json({
      ok: true,
      status: "paid",
      subscription: "active",
      entitlement: "active",
    });
  } catch (error) {
    console.error(
      "Paddle webhook processing failed",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Paddle webhook verification failed.",
      },
      { status: 400 },
    );
  }
}