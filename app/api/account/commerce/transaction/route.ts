import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const providerMap = {
  paddle: "PADDLE",
  sslcommerz: "SSLCOMMERZ",
} as const;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider")?.trim() as keyof typeof providerMap | undefined;
    const transactionId = url.searchParams.get("transactionId")?.trim() ?? "";

    if (!provider || !(provider in providerMap) || !transactionId) {
      return NextResponse.json({ error: "A valid provider and transaction reference are required." }, { status: 400 });
    }

    const sql = db();
    const rows = await sql`
      SELECT
        p.provider_transaction_id,
        p.provider,
        p.currency,
        p.amount,
        p.status AS payment_status,
        p.paid_at,
        s.status AS subscription_status,
        s.current_period_start,
        s.current_period_end,
        s.cancel_at_period_end,
        e.status AS entitlement_status,
        pl.code AS plan_code,
        pl.name AS plan_name,
        pr.setup_amount,
        pr.recurring_amount,
        pr.billing_interval
      FROM payments p
      LEFT JOIN subscriptions s ON s.id = p.subscription_id
      LEFT JOIN entitlements e ON e.subscription_id = s.id
      LEFT JOIN plans pl ON pl.id = s.plan_id
      LEFT JOIN prices pr ON pr.id = s.price_id
      WHERE p.provider = ${providerMap[provider]}
        AND p.provider_transaction_id = ${transactionId}
      LIMIT 1
    `;

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Commerce transaction was not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      provider,
      transactionId: String(row.provider_transaction_id),
      planCode: row.plan_code ? String(row.plan_code) : null,
      planName: row.plan_name ? String(row.plan_name) : null,
      currency: String(row.currency),
      amount: Number(row.amount),
      setupAmount: row.setup_amount == null ? null : Number(row.setup_amount),
      recurringAmount: row.recurring_amount == null ? null : Number(row.recurring_amount),
      billingInterval: row.billing_interval ? String(row.billing_interval) : null,
      paymentStatus: String(row.payment_status),
      subscriptionStatus: row.subscription_status ? String(row.subscription_status) : null,
      entitlementStatus: row.entitlement_status ? String(row.entitlement_status) : null,
      paidAt: row.paid_at ? new Date(String(row.paid_at)).toISOString() : null,
      currentPeriodStart: row.current_period_start ? new Date(String(row.current_period_start)).toISOString() : null,
      currentPeriodEnd: row.current_period_end ? new Date(String(row.current_period_end)).toISOString() : null,
      cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    });
  } catch (error) {
    console.error("Commerce customer transaction lookup failed", error);
    return NextResponse.json({ error: "Commerce account status could not be loaded." }, { status: 500 });
  }
}
