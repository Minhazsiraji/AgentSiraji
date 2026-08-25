import { NextResponse } from "next/server";
import { getGatewayPaymentStatus } from "@/lib/commercial-db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const transactionId = url.searchParams.get("transactionId")?.trim() ?? "";

    if (!transactionId.startsWith("txn_")) {
      return NextResponse.json(
        { error: "A valid Paddle transaction ID is required." },
        { status: 400 },
      );
    }

    const status = await getGatewayPaymentStatus({
      provider: "paddle",
      providerTransactionId: transactionId,
    });

    if (!status) {
      return NextResponse.json(
        { error: "Paddle transaction was not found." },
        { status: 404 },
      );
    }

    const active =
      status.paymentStatus === "PAID" &&
      status.subscriptionStatus === "ACTIVE" &&
      status.entitlementStatus === "ACTIVE";

    return NextResponse.json({
      ok: true,
      active,
      paymentStatus: status.paymentStatus,
      subscriptionStatus: status.subscriptionStatus,
      entitlementStatus: status.entitlementStatus,
    });
  } catch (error) {
    console.error("Paddle payment status lookup failed", error);

    return NextResponse.json(
      { error: "Payment status could not be checked." },
      { status: 500 },
    );
  }
}
