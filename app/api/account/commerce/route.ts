import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { db } from "@/lib/db";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, private", Pragma: "no-cache" },
  });
}

export async function GET(request: Request) {
  const session = await readSession(request);
  if (!session) return json({ error: "Sign in is required." }, 401);

  try {
    const sql = db();
    const rows = await sql`
      SELECT
        o.id AS organization_id,
        o.name AS organization_name,
        om.role AS membership_role,
        s.id AS subscription_id,
        s.status AS subscription_status,
        s.current_period_start,
        s.current_period_end,
        s.cancel_at_period_end,
        pl.code AS plan_code,
        pl.name AS plan_name,
        pr.setup_amount,
        pr.recurring_amount,
        pr.billing_interval,
        p.provider,
        p.provider_transaction_id,
        p.currency,
        p.amount,
        p.status AS payment_status,
        p.paid_at,
        e.status AS entitlement_status
      FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      LEFT JOIN subscriptions s ON s.organization_id = o.id
      LEFT JOIN plans pl ON pl.id = s.plan_id
      LEFT JOIN prices pr ON pr.id = s.price_id
      LEFT JOIN LATERAL (
        SELECT payment.*
        FROM payments payment
        WHERE payment.organization_id = o.id
          AND (s.id IS NULL OR payment.subscription_id = s.id)
        ORDER BY payment.created_at DESC
        LIMIT 1
      ) p ON true
      LEFT JOIN entitlements e ON e.organization_id = o.id AND e.subscription_id = s.id
      WHERE om.account_id = ${session.accountId}
        AND o.status = 'ACTIVE'
      ORDER BY COALESCE(s.updated_at, o.updated_at) DESC
    `;

    return json({
      ok: true,
      account: { email: session.email, displayName: session.displayName },
      organizations: rows.map(row => ({
        organizationId: String(row.organization_id),
        organizationName: String(row.organization_name),
        membershipRole: String(row.membership_role),
        subscriptionId: row.subscription_id ? String(row.subscription_id) : null,
        subscriptionStatus: row.subscription_status ? String(row.subscription_status) : null,
        currentPeriodStart: row.current_period_start ? new Date(String(row.current_period_start)).toISOString() : null,
        currentPeriodEnd: row.current_period_end ? new Date(String(row.current_period_end)).toISOString() : null,
        cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
        planCode: row.plan_code ? String(row.plan_code) : null,
        planName: row.plan_name ? String(row.plan_name) : null,
        setupAmount: row.setup_amount == null ? null : Number(row.setup_amount),
        recurringAmount: row.recurring_amount == null ? null : Number(row.recurring_amount),
        billingInterval: row.billing_interval ? String(row.billing_interval) : null,
        provider: row.provider ? String(row.provider) : null,
        transactionId: row.provider_transaction_id ? String(row.provider_transaction_id) : null,
        currency: row.currency ? String(row.currency) : null,
        amount: row.amount == null ? null : Number(row.amount),
        paymentStatus: row.payment_status ? String(row.payment_status) : null,
        paidAt: row.paid_at ? new Date(String(row.paid_at)).toISOString() : null,
        entitlementStatus: row.entitlement_status ? String(row.entitlement_status) : null,
      })),
    });
  } catch (error) {
    console.error("Authenticated Commerce account lookup failed", error);
    return json({ error: "Commerce account status could not be loaded." }, 500);
  }
}
