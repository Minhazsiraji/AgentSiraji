import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  activateVerifiedGatewayPayment,
  getPendingGatewayPayment,
  linkProviderSubscription,
  markGatewayPaymentFailed,
  markPaymentEventProcessed,
  recordPaymentEvent,
  updateProviderSubscriptionState,
} from "@/lib/commercial-db";
import { verifyPaddleWebhook } from "@/lib/paddle";

const maxBodyBytes = 262_144;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

const handledEvents = new Set([
  "transaction.completed",
  "transaction.payment_failed",
  "subscription.activated",
  "subscription.past_due",
  "subscription.paused",
  "subscription.resumed",
  "subscription.canceled",
]);

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("paddle-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Paddle signature." },
        { status: 400 },
      );
    }

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (!Number.isFinite(contentLength) || contentLength > maxBodyBytes) {
      return NextResponse.json({ error: "Paddle webhook payload is too large." }, { status: 413 });
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxBodyBytes) {
      return NextResponse.json({ error: "Paddle webhook payload is too large." }, { status: 413 });
    }

    const event = await verifyPaddleWebhook(rawBody, signature);

    if (!handledEvents.has(event.eventType)) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        eventType: event.eventType,
      });
    }

    const paymentEvent = await recordPaymentEvent({
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

    if (event.eventType === "transaction.completed") {
      const transaction = event.data as unknown as {
        id?: string;
        status?: string;
        currencyCode?: string;
        subscriptionId?: string | null;
        customerId?: string | null;
        subscription_id?: string | null;
        customer_id?: string | null;
        customData?: {
          agentsiraji_payment_id?: string;
          agentsiraji_plan?: string;
        } | null;
      };

      const transactionId = transaction.id ?? "";

      if (!transactionId || transaction.status !== "completed") {
        return NextResponse.json(
          { error: "Invalid Paddle completed transaction." },
          { status: 400 },
        );
      }

      const payment = await getPendingGatewayPayment({
        provider: "paddle",
        providerTransactionId: transactionId,
      });

      if (!payment) {
        if (paymentEvent.eventId) {
          await markPaymentEventProcessed(paymentEvent.eventId);
        }

        return NextResponse.json({
          ok: true,
          ignored: true,
          reason: "unknown_transaction",
        });
      }

      if (
        transaction.customData?.agentsiraji_payment_id &&
        transaction.customData.agentsiraji_payment_id !== payment.paymentId
      ) {
        return NextResponse.json(
          { error: "Paddle payment reference mismatch." },
          { status: 409 },
        );
      }

      if (
        transaction.currencyCode &&
        transaction.currencyCode.toUpperCase() !== payment.currency.toUpperCase()
      ) {
        return NextResponse.json(
          { error: "Paddle currency mismatch." },
          { status: 409 },
        );
      }

      await activateVerifiedGatewayPayment({
        paymentId: payment.paymentId,
        organizationId: payment.organizationId,
        subscriptionId: payment.subscriptionId,
        providerTransactionId: transactionId,
      });

      await linkProviderSubscription({
        subscriptionId: payment.subscriptionId,
        providerSubscriptionId:
          transaction.subscriptionId ?? transaction.subscription_id ?? null,
        providerCustomerId:
          transaction.customerId ?? transaction.customer_id ?? null,
      });

      if (paymentEvent.eventId) {
        await markPaymentEventProcessed(paymentEvent.eventId);
      }

      return NextResponse.json({
        ok: true,
        status: "paid",
        subscription: "active",
        entitlement: "active",
      });
    }

    if (event.eventType === "transaction.payment_failed") {
      const transaction = event.data as unknown as { id?: string };
      const transactionId = transaction.id ?? "";

      if (transactionId) {
        await markGatewayPaymentFailed({
          provider: "paddle",
          providerTransactionId: transactionId,
        });
      }

      if (paymentEvent.eventId) {
        await markPaymentEventProcessed(paymentEvent.eventId);
      }

      return NextResponse.json({
        ok: true,
        status: "payment_failed",
      });
    }

    const subscription = event.data as unknown as { id?: string };
    const providerSubscriptionId = subscription.id ?? "";

    if (!providerSubscriptionId) {
      if (paymentEvent.eventId) {
        await markPaymentEventProcessed(paymentEvent.eventId);
      }

      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: "missing_subscription_id",
      });
    }

    const lifecycleState =
      event.eventType === "subscription.activated" ||
      event.eventType === "subscription.resumed"
        ? {
            subscriptionStatus: "ACTIVE" as const,
            entitlementStatus: "ACTIVE" as const,
          }
        : event.eventType === "subscription.past_due"
          ? {
              subscriptionStatus: "PAST_DUE" as const,
              entitlementStatus: "SUSPENDED" as const,
            }
          : event.eventType === "subscription.canceled"
            ? {
                subscriptionStatus: "CANCELLED" as const,
                entitlementStatus: "REVOKED" as const,
              }
            : {
                subscriptionStatus: "SUSPENDED" as const,
                entitlementStatus: "SUSPENDED" as const,
              };

    const updated = await updateProviderSubscriptionState({
      provider: "paddle",
      providerSubscriptionId,
      ...lifecycleState,
    });

    if (paymentEvent.eventId) {
      await markPaymentEventProcessed(paymentEvent.eventId);
    }

    return NextResponse.json({
      ok: true,
      status: updated ? "subscription_updated" : "subscription_not_linked",
      eventType: event.eventType,
    });
  } catch (error) {
    console.error("Paddle webhook processing failed", error);

    return NextResponse.json(
      { error: "Paddle webhook verification failed." },
      { status: 400 },
    );
  }
}
