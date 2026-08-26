import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  activateVerifiedGatewayPayment,
  getPendingGatewayPayment,
  markPaymentEventProcessed,
  recordPaymentEvent,
} from "@/lib/commercial-db";
import { querySSLCommerzTransaction } from "@/lib/sslcommerz";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function processSuccess(request: Request) {
  const checkoutRedirect = new URL("/checkout/commerce", request.url);

  try {
    const url = new URL(request.url);
    const tranId = url.searchParams.get("tran_id")?.trim() ?? "";

    if (!tranId) {
      checkoutRedirect.searchParams.set("payment", "verification-pending");
      return NextResponse.redirect(checkoutRedirect, 303);
    }

    const payment = await getPendingGatewayPayment({
      provider: "sslcommerz",
      providerTransactionId: tranId,
    });

    if (!payment) {
      checkoutRedirect.searchParams.set("payment", "unknown");
      return NextResponse.redirect(checkoutRedirect, 303);
    }

    const transaction = await querySSLCommerzTransaction(tranId);

    if (!transaction) {
      checkoutRedirect.searchParams.set("payment", "verification-pending");
      return NextResponse.redirect(checkoutRedirect, 303);
    }

    const status = transaction.status?.toUpperCase() ?? "";

    if (status !== "VALID" && status !== "VALIDATED") {
      checkoutRedirect.searchParams.set("payment", "verification-failed");
      return NextResponse.redirect(checkoutRedirect, 303);
    }

    const validatedAmount = Number(
      transaction.amount ?? transaction.currency_amount,
    );

    if (
      !Number.isFinite(validatedAmount) ||
      Math.round(validatedAmount * 100) !== payment.amount * 100
    ) {
      checkoutRedirect.searchParams.set("payment", "amount-mismatch");
      return NextResponse.redirect(checkoutRedirect, 303);
    }

    const validatedCurrency = (
      transaction.currency_type ?? ""
    ).toUpperCase();

    if (
      validatedCurrency &&
      validatedCurrency !== payment.currency.toUpperCase()
    ) {
      checkoutRedirect.searchParams.set("payment", "currency-mismatch");
      return NextResponse.redirect(checkoutRedirect, 303);
    }

    if (
      transaction.value_a &&
      transaction.value_a !== payment.paymentId
    ) {
      checkoutRedirect.searchParams.set("payment", "reference-mismatch");
      return NextResponse.redirect(checkoutRedirect, 303);
    }

    const providerEventId =
      transaction.val_id
        ? `${tranId}:${transaction.val_id}`
        : `query:${tranId}`;

    const event = await recordPaymentEvent({
      provider: "sslcommerz",
      providerEventId,
      eventType: "TRANSACTION_QUERY_VALIDATED",
      payloadDigest: sha256(
        JSON.stringify(transaction),
      ),
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

    const accountRedirect = new URL("/account/commerce", request.url);
    accountRedirect.searchParams.set("provider", "sslcommerz");
    accountRedirect.searchParams.set("transactionId", tranId);
    return NextResponse.redirect(accountRedirect, 303);
  } catch (error) {
    console.error(
      "SSLCOMMERZ transaction-query verification failed",
      error,
    );

    checkoutRedirect.searchParams.set("payment", "verification-failed");
    return NextResponse.redirect(checkoutRedirect, 303);
  }
}

export async function POST(request: Request) {
  return processSuccess(request);
}

export async function GET(request: Request) {
  return processSuccess(request);
}
