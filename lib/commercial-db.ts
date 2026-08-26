import { db } from "@/lib/db";
import type { Market } from "@/lib/catalog";
import type { PaymentProvider } from "@/lib/billing";

type PlanCode = "starter" | "growth" | "pro";
type ManualReviewDecision = "APPROVED" | "REJECTED" | "NEEDS_INFORMATION";

const providerMap: Record<PaymentProvider, string> = {
  sslcommerz: "SSLCOMMERZ",
  "bank-transfer": "BANK_TRANSFER",
  paddle: "PADDLE",
  "manual-invoice": "MANUAL_INVOICE",
};

export type CheckoutCommercialContext = {
  planId: string;
  priceId: string;
  planCode: PlanCode;
  market: Market;
  currency: string;
  setupAmount: number;
  recurringAmount: number;
  billingInterval: string;
};

export async function getCheckoutCommercialContext(input: {
  plan: PlanCode;
  market: Market;
}): Promise<CheckoutCommercialContext> {
  const sql = db();
  const dbMarket = input.market === "bd" ? "BD" : "INTL";
  const rows = await sql`
    SELECT p.id AS plan_id, pr.id AS price_id, p.code AS plan_code,
      pr.market, pr.currency, pr.setup_amount, pr.recurring_amount, pr.billing_interval
    FROM plans p
    JOIN products prod ON prod.id = p.product_id
    JOIN prices pr ON pr.plan_id = p.id
    WHERE prod.code = 'commerce'
      AND p.code = ${input.plan}
      AND pr.market = ${dbMarket}
      AND p.active = true
      AND pr.active = true
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) throw new Error("Commercial plan or price is not configured.");
  return {
    planId: String(row.plan_id),
    priceId: String(row.price_id),
    planCode: row.plan_code as PlanCode,
    market: input.market,
    currency: String(row.currency),
    setupAmount: Number(row.setup_amount),
    recurringAmount: Number(row.recurring_amount),
    billingInterval: String(row.billing_interval),
  };
}

export function toDatabaseProvider(provider: PaymentProvider) {
  return providerMap[provider];
}

export type PendingCheckout = {
  accountId: string;
  organizationId: string;
  subscriptionId: string;
  paymentId: string;
  planId: string;
  priceId: string;
  currency: string;
  amount: number;
  setupAmount: number;
  recurringAmount: number;
};

export async function createPendingCheckout(input: {
  email: string;
  displayName?: string;
  organizationName: string;
  plan: PlanCode;
  market: Market;
  provider: PaymentProvider;
}): Promise<PendingCheckout> {
  const sql = db();
  const context = await getCheckoutCommercialContext({ plan: input.plan, market: input.market });
  const provider = toDatabaseProvider(input.provider);
  const countryCode = input.market === "bd" ? "BD" : "US";
  const totalAmount = context.setupAmount + context.recurringAmount;

  const accountRows = await sql`
    INSERT INTO accounts (email, display_name, status)
    VALUES (${input.email.trim().toLowerCase()}, ${input.displayName?.trim() || null}, 'PENDING')
    ON CONFLICT (email) DO UPDATE SET
      display_name = COALESCE(EXCLUDED.display_name, accounts.display_name), updated_at = now()
    RETURNING id
  `;
  const accountId = String(accountRows[0].id);

  const organizationRows = await sql`
    INSERT INTO organizations (name, country_code, default_currency, status)
    VALUES (${input.organizationName.trim()}, ${countryCode}, ${context.currency}, 'ACTIVE')
    RETURNING id
  `;
  const organizationId = String(organizationRows[0].id);

  await sql`INSERT INTO organization_members (organization_id, account_id, role)
    VALUES (${organizationId}, ${accountId}, 'OWNER')`;

  const subscriptionRows = await sql`
    INSERT INTO subscriptions (organization_id, plan_id, price_id, status, provider)
    VALUES (${organizationId}, ${context.planId}, ${context.priceId}, 'PENDING', ${provider})
    RETURNING id
  `;
  const subscriptionId = String(subscriptionRows[0].id);

  const paymentRows = await sql`
    INSERT INTO payments (organization_id, subscription_id, provider, currency, amount, status)
    VALUES (${organizationId}, ${subscriptionId}, ${provider}, ${context.currency}, ${totalAmount}, 'PENDING_PAYMENT')
    RETURNING id
  `;
  const paymentId = String(paymentRows[0].id);

  return { accountId, organizationId, subscriptionId, paymentId, planId: context.planId,
    priceId: context.priceId, currency: context.currency, amount: totalAmount,
    setupAmount: context.setupAmount, recurringAmount: context.recurringAmount };
}

export type PendingGatewayPayment = {
  paymentId: string;
  organizationId: string;
  subscriptionId: string;
  currency: string;
  amount: number;
  status: string;
  providerTransactionId: string | null;
};

export async function assignProviderTransaction(input: { paymentId: string; providerTransactionId: string }) {
  const sql = db();
  const rows = await sql`
    UPDATE payments SET provider_transaction_id = ${input.providerTransactionId}, updated_at = now()
    WHERE id = ${input.paymentId} AND status = 'PENDING_PAYMENT' AND provider_transaction_id IS NULL
    RETURNING id
  `;
  if (!rows[0]) throw new Error("Pending payment could not be assigned to the provider transaction.");
}

export async function getPendingGatewayPayment(input: { provider: PaymentProvider; providerTransactionId: string }): Promise<PendingGatewayPayment | null> {
  const sql = db();
  const provider = toDatabaseProvider(input.provider);
  const rows = await sql`
    SELECT id AS payment_id, organization_id, subscription_id, currency, amount, status, provider_transaction_id
    FROM payments WHERE provider = ${provider} AND provider_transaction_id = ${input.providerTransactionId} LIMIT 1
  `;
  const row = rows[0];
  if (!row || !row.subscription_id) return null;
  return { paymentId: String(row.payment_id), organizationId: String(row.organization_id),
    subscriptionId: String(row.subscription_id), currency: String(row.currency), amount: Number(row.amount),
    status: String(row.status), providerTransactionId: row.provider_transaction_id ? String(row.provider_transaction_id) : null };
}

export type GatewayPaymentStatus = { paymentStatus: string; subscriptionStatus: string | null; entitlementStatus: string | null };

export async function getGatewayPaymentStatus(input: { provider: PaymentProvider; providerTransactionId: string }): Promise<GatewayPaymentStatus | null> {
  const sql = db();
  const provider = toDatabaseProvider(input.provider);
  const rows = await sql`
    SELECT p.status AS payment_status, s.status AS subscription_status, e.status AS entitlement_status
    FROM payments p LEFT JOIN subscriptions s ON s.id = p.subscription_id
    LEFT JOIN entitlements e ON e.subscription_id = s.id
    WHERE p.provider = ${provider} AND p.provider_transaction_id = ${input.providerTransactionId} LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return { paymentStatus: String(row.payment_status),
    subscriptionStatus: row.subscription_status ? String(row.subscription_status) : null,
    entitlementStatus: row.entitlement_status ? String(row.entitlement_status) : null };
}

export async function submitManualPayment(input: {
  paymentId: string;
  provider: "bank-transfer" | "manual-invoice";
  bankName: string;
  senderName: string;
  senderAccountHint?: string | null;
  transactionReference: string;
  submittedAmount: number;
  paymentDate: string;
  proofUrl?: string | null;
}) {
  const sql = db();
  const provider = toDatabaseProvider(input.provider);
  const paymentRows = await sql`
    UPDATE payments SET status = 'UNDER_REVIEW', updated_at = now()
    WHERE id = ${input.paymentId} AND provider = ${provider} AND status = 'PENDING_PAYMENT'
      AND amount = ${input.submittedAmount}
    RETURNING id, organization_id, subscription_id, amount, currency
  `;
  const payment = paymentRows[0];
  if (!payment || !payment.subscription_id) {
    throw new Error("Manual payment could not be submitted. Check the payment reference and exact amount.");
  }
  const submissionRows = await sql`
    INSERT INTO manual_payment_submissions (
      payment_id, bank_name, sender_name, sender_account_hint, transaction_reference,
      submitted_amount, payment_date, proof_url, review_status
    ) VALUES (
      ${input.paymentId}, ${input.bankName.trim()}, ${input.senderName.trim()}, ${input.senderAccountHint?.trim() || null},
      ${input.transactionReference.trim()}, ${input.submittedAmount}, ${input.paymentDate}, ${input.proofUrl?.trim() || null}, 'UNDER_REVIEW'
    )
    ON CONFLICT (payment_id) DO UPDATE SET
      bank_name = EXCLUDED.bank_name, sender_name = EXCLUDED.sender_name,
      sender_account_hint = EXCLUDED.sender_account_hint, transaction_reference = EXCLUDED.transaction_reference,
      submitted_amount = EXCLUDED.submitted_amount, payment_date = EXCLUDED.payment_date,
      proof_url = EXCLUDED.proof_url, review_status = 'UNDER_REVIEW', reviewed_by_account_id = NULL,
      reviewed_at = NULL, review_note = NULL, updated_at = now()
    RETURNING id
  `;
  await sql`
    INSERT INTO audit_log (organization_id, action, entity_type, entity_id, details)
    VALUES (${String(payment.organization_id)}, 'MANUAL_PAYMENT_SUBMITTED', 'payment', ${input.paymentId},
      jsonb_build_object('provider', ${provider}::text, 'submission_id', ${String(submissionRows[0].id)}::text))
  `;
  return { submissionId: String(submissionRows[0].id), paymentId: input.paymentId,
    organizationId: String(payment.organization_id), subscriptionId: String(payment.subscription_id),
    amount: Number(payment.amount), currency: String(payment.currency), status: "UNDER_REVIEW" as const };
}

export async function reviewManualPayment(input: {
  paymentId: string;
  decision: ManualReviewDecision;
  reviewNote?: string | null;
  reviewedByAccountId?: string | null;
}) {
  const sql = db();
  const rows = await sql`
    SELECT p.id AS payment_id, p.organization_id, p.subscription_id, p.status AS payment_status,
      m.id AS submission_id, m.review_status
    FROM payments p JOIN manual_payment_submissions m ON m.payment_id = p.id
    WHERE p.id = ${input.paymentId} AND p.provider IN ('BANK_TRANSFER', 'MANUAL_INVOICE') LIMIT 1
  `;
  const row = rows[0];
  if (!row || !row.subscription_id) throw new Error("Manual payment submission was not found.");
  if (!['UNDER_REVIEW', 'NEEDS_INFORMATION'].includes(String(row.payment_status))) {
    throw new Error("Manual payment is no longer reviewable.");
  }

  const nextPaymentStatus = input.decision === 'APPROVED' ? 'PAID' : input.decision;
  await sql`
    UPDATE manual_payment_submissions SET review_status = ${input.decision},
      reviewed_by_account_id = ${input.reviewedByAccountId ?? null}, reviewed_at = now(),
      review_note = ${input.reviewNote?.trim() || null}, updated_at = now()
    WHERE payment_id = ${input.paymentId}
  `;
  await sql`
    UPDATE payments SET status = ${nextPaymentStatus},
      paid_at = CASE WHEN ${input.decision} = 'APPROVED' THEN COALESCE(paid_at, now()) ELSE paid_at END,
      updated_at = now() WHERE id = ${input.paymentId}
  `;

  if (input.decision === 'APPROVED') {
    await sql`UPDATE subscriptions SET status = 'ACTIVE', updated_at = now()
      WHERE id = ${String(row.subscription_id)} AND organization_id = ${String(row.organization_id)} AND status = 'PENDING'`;
    const productRows = await sql`
      SELECT p.product_id FROM subscriptions s JOIN plans p ON p.id = s.plan_id
      WHERE s.id = ${String(row.subscription_id)} LIMIT 1
    `;
    if (!productRows[0]) throw new Error("Subscription product could not be resolved.");
    await sql`
      INSERT INTO entitlements (organization_id, product_id, subscription_id, status, starts_at)
      VALUES (${String(row.organization_id)}, ${String(productRows[0].product_id)}, ${String(row.subscription_id)}, 'ACTIVE', now())
      ON CONFLICT (organization_id, product_id) DO UPDATE SET
        subscription_id = EXCLUDED.subscription_id, status = 'ACTIVE',
        starts_at = COALESCE(entitlements.starts_at, now()), ends_at = NULL, updated_at = now()
    `;
  }

  await sql`
    INSERT INTO audit_log (actor_account_id, organization_id, action, entity_type, entity_id, details)
    VALUES (${input.reviewedByAccountId ?? null}, ${String(row.organization_id)}, ${`MANUAL_PAYMENT_${input.decision}`},
      'payment', ${input.paymentId}, jsonb_build_object('review_note', ${input.reviewNote?.trim() || null}::text))
  `;
  return { paymentId: input.paymentId, paymentStatus: nextPaymentStatus,
    subscriptionStatus: input.decision === 'APPROVED' ? 'ACTIVE' : 'PENDING',
    entitlementStatus: input.decision === 'APPROVED' ? 'ACTIVE' : null };
}

export async function recordPaymentEvent(input: { provider: PaymentProvider; providerEventId: string; eventType: string; payloadDigest: string }) {
  const sql = db();
  const provider = toDatabaseProvider(input.provider);
  const rows = await sql`
    INSERT INTO payment_events (provider, provider_event_id, event_type, payload_digest)
    VALUES (${provider}, ${input.providerEventId}, ${input.eventType}, ${input.payloadDigest})
    ON CONFLICT (provider, provider_event_id) DO NOTHING RETURNING id
  `;
  return { inserted: Boolean(rows[0]), eventId: rows[0] ? String(rows[0].id) : null };
}

export async function markPaymentEventProcessed(eventId: string) {
  const sql = db();
  await sql`UPDATE payment_events SET processed_at = now() WHERE id = ${eventId}`;
}

export async function markGatewayPaymentFailed(input: { provider: PaymentProvider; providerTransactionId: string }) {
  const sql = db();
  const provider = toDatabaseProvider(input.provider);
  await sql`UPDATE payments SET status = 'FAILED', updated_at = now()
    WHERE provider = ${provider} AND provider_transaction_id = ${input.providerTransactionId} AND status = 'PENDING_PAYMENT'`;
}

export async function linkProviderSubscription(input: { subscriptionId: string; providerSubscriptionId?: string | null; providerCustomerId?: string | null }) {
  if (!input.providerSubscriptionId && !input.providerCustomerId) return;
  const sql = db();
  await sql`
    UPDATE subscriptions SET provider_subscription_id = COALESCE(${input.providerSubscriptionId ?? null}, provider_subscription_id),
      provider_customer_id = COALESCE(${input.providerCustomerId ?? null}, provider_customer_id), updated_at = now()
    WHERE id = ${input.subscriptionId}
  `;
}

export async function updateProviderSubscriptionState(input: {
  provider: PaymentProvider; providerSubscriptionId: string;
  subscriptionStatus: "ACTIVE" | "PAST_DUE" | "CANCELLED" | "SUSPENDED";
  entitlementStatus: "ACTIVE" | "SUSPENDED" | "REVOKED";
}) {
  const sql = db();
  const provider = toDatabaseProvider(input.provider);
  const rows = await sql`UPDATE subscriptions SET status = ${input.subscriptionStatus}, updated_at = now()
    WHERE provider = ${provider} AND provider_subscription_id = ${input.providerSubscriptionId}
    RETURNING id, organization_id`;
  const row = rows[0];
  if (!row) return false;
  await sql`UPDATE entitlements SET status = ${input.entitlementStatus},
    ends_at = CASE WHEN ${input.entitlementStatus} = 'REVOKED' THEN COALESCE(ends_at, now()) ELSE NULL END, updated_at = now()
    WHERE subscription_id = ${String(row.id)} AND organization_id = ${String(row.organization_id)}`;
  return true;
}

export async function activateVerifiedGatewayPayment(input: { paymentId: string; organizationId: string; subscriptionId: string; providerTransactionId: string }) {
  const sql = db();
  const paymentRows = await sql`
    UPDATE payments SET status = 'PAID', paid_at = COALESCE(paid_at, now()), updated_at = now()
    WHERE id = ${input.paymentId} AND organization_id = ${input.organizationId}
      AND subscription_id = ${input.subscriptionId} AND provider_transaction_id = ${input.providerTransactionId}
      AND status IN ('PENDING_PAYMENT', 'PAID') RETURNING id
  `;
  if (!paymentRows[0]) throw new Error("Verified payment could not be activated.");
  await sql`UPDATE subscriptions SET status = 'ACTIVE', updated_at = now()
    WHERE id = ${input.subscriptionId} AND organization_id = ${input.organizationId} AND status IN ('PENDING', 'ACTIVE')`;
  const productRows = await sql`SELECT p.product_id FROM subscriptions s JOIN plans p ON p.id = s.plan_id
    WHERE s.id = ${input.subscriptionId} LIMIT 1`;
  if (!productRows[0]) throw new Error("Subscription product could not be resolved.");
  await sql`
    INSERT INTO entitlements (organization_id, product_id, subscription_id, status, starts_at)
    VALUES (${input.organizationId}, ${String(productRows[0].product_id)}, ${input.subscriptionId}, 'ACTIVE', now())
    ON CONFLICT (organization_id, product_id) DO UPDATE SET subscription_id = EXCLUDED.subscription_id,
      status = 'ACTIVE', starts_at = COALESCE(entitlements.starts_at, now()), ends_at = NULL, updated_at = now()
  `;
}