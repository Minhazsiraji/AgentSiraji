import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function handleCancel(request: Request) {
  const url = new URL(request.url);
  const tranId = url.searchParams.get("tran_id")?.trim() ?? "";
  const redirect = new URL("/checkout/commerce", request.url);
  redirect.searchParams.set("payment", "cancelled");

  if (!tranId) return NextResponse.redirect(redirect, 303);

  const sql = db();
  const rows = await sql`
    UPDATE payments
    SET status = 'CANCELLED', updated_at = now()
    WHERE provider = 'SSLCOMMERZ'
      AND provider_transaction_id = ${tranId}
      AND status = 'PENDING_PAYMENT'
    RETURNING subscription_id
  `;

  const subscriptionId = rows[0]?.subscription_id;
  if (subscriptionId) {
    await sql`
      UPDATE subscriptions
      SET status = 'EXPIRED', updated_at = now()
      WHERE id = ${String(subscriptionId)} AND status = 'PENDING'
    `;
  }

  return NextResponse.redirect(redirect, 303);
}

export async function GET(request: Request) {
  return handleCancel(request);
}

export async function POST(request: Request) {
  return handleCancel(request);
}
