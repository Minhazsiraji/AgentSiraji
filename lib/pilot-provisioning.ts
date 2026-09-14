import { db } from "@/lib/db";
import { getCheckoutCommercialContext } from "@/lib/commercial-db";
import { bkashPilotPaymentMethod } from "@/lib/sales-leads";

export const pilotPlanCodes = ["starter", "growth", "pro"] as const;
export type PilotPlanCode = (typeof pilotPlanCodes)[number];

type ProvisionedPilotCustomer = {
  accountId: string;
  organizationId: string;
  subscriptionId: string;
  paymentId: string;
  planCode: PilotPlanCode;
  alreadyProvisioned: boolean;
};

function isPilotPlanCode(value: string): value is PilotPlanCode {
  return pilotPlanCodes.includes(value as PilotPlanCode);
}

function asText(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

export async function provisionVerifiedBkashLead(input: {
  leadId: string;
  planCode: string;
  actorAccountId: string;
}): Promise<ProvisionedPilotCustomer> {
  if (!/^\d{1,20}$/.test(input.leadId)) throw new Error("Pilot provisioning requires a valid lead ID.");
  if (!isPilotPlanCode(input.planCode)) throw new Error("Select Starter, Growth or Pro before activating the customer.");

  const sql = db();

  const existingAuditRows = await sql`
    SELECT organization_id,
      details->>'account_id' AS account_id,
      details->>'subscription_id' AS subscription_id,
      details->>'payment_id' AS payment_id,
      details->>'plan_code' AS plan_code
    FROM audit_log
    WHERE action = 'BKASH_PILOT_PROVISIONED'
      AND entity_type = 'sales_lead'
      AND entity_id = ${input.leadId}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const existingAudit = existingAuditRows[0];
  if (existingAudit?.organization_id && existingAudit.account_id && existingAudit.subscription_id && existingAudit.payment_id) {
    const existingPlan = asText(existingAudit.plan_code);
    if (existingPlan && existingPlan !== input.planCode) {
      throw new Error(`Lead #${input.leadId} is already provisioned on the ${existingPlan} plan.`);
    }
    return {
      accountId: asText(existingAudit.account_id),
      organizationId: asText(existingAudit.organization_id),
      subscriptionId: asText(existingAudit.subscription_id),
      paymentId: asText(existingAudit.payment_id),
      planCode: input.planCode,
      alreadyProvisioned: true,
    };
  }

  const leadRows = await sql`
    SELECT id, business_name, contact_name, email, country, status,
      payment_method, payment_reference, payment_status,
      payment_expected_amount, payment_verified_amount, payment_date
    FROM sales_leads
    WHERE id = ${input.leadId}
    LIMIT 1
  `;
  const lead = leadRows[0];
  if (!lead) throw new Error("Lead not found for pilot provisioning.");
  if (asText(lead.status) !== "WON" || asText(lead.payment_status) !== "VERIFIED") {
    throw new Error("Only a WON lead with VERIFIED payment can be provisioned.");
  }
  if (asText(lead.payment_method) !== bkashPilotPaymentMethod) {
    throw new Error("Pilot customer provisioning requires verified bKash Send Money.");
  }

  const email = asText(lead.email).trim().toLowerCase();
  const transactionReference = asText(lead.payment_reference).trim();
  const displayName = asText(lead.contact_name).trim() || null;
  const organizationName = asText(lead.business_name).trim() || displayName || email;
  const expectedAmount = Number(lead.payment_expected_amount);
  const verifiedAmount = Number(lead.payment_verified_amount);
  if (!email || !transactionReference || transactionReference.length < 6 || !Number.isFinite(expectedAmount) || expectedAmount <= 0) {
    throw new Error("Verified lead payment details are incomplete.");
  }
  if (!Number.isFinite(verifiedAmount) || verifiedAmount !== expectedAmount || !lead.payment_date) {
    throw new Error("Verified payment must exactly match the expected BDT amount and include a payment date.");
  }

  const context = await getCheckoutCommercialContext({ plan: input.planCode, market: "bd" });
  const planTotal = context.setupAmount + context.recurringAmount;
  if (expectedAmount !== planTotal) {
    throw new Error(`Verified BDT amount does not match the ${input.planCode} launch price (${planTotal}).`);
  }

  const providerTransactionId = `BKASH:${transactionReference}`;
  const existingPaymentRows = await sql`
    SELECT p.id AS payment_id, p.organization_id, p.subscription_id, a.id AS account_id
    FROM payments p
    JOIN organization_members om ON om.organization_id = p.organization_id AND om.role = 'OWNER'
    JOIN accounts a ON a.id = om.account_id
    WHERE p.provider = 'MANUAL_INVOICE'
      AND p.provider_transaction_id = ${providerTransactionId}
    LIMIT 1
  `;
  if (existingPaymentRows[0]) {
    throw new Error("This bKash transaction has already been used for another commercial payment.");
  }

  const rows = await sql`
    WITH lead AS (
      SELECT id, business_name, contact_name, email, payment_reference,
        payment_expected_amount, payment_verified_amount, payment_date
      FROM sales_leads
      WHERE id = ${input.leadId}
        AND status = 'WON'
        AND payment_status = 'VERIFIED'
        AND payment_method = ${bkashPilotPaymentMethod}
        AND payment_expected_amount = ${planTotal}
        AND payment_verified_amount = ${planTotal}
      FOR UPDATE
    ),
    account_upsert AS (
      INSERT INTO accounts (email, display_name, status)
      SELECT lower(email), NULLIF(contact_name, ''), 'PENDING' FROM lead
      ON CONFLICT (email) DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, accounts.display_name),
        updated_at = now()
      RETURNING id
    ),
    organization_insert AS (
      INSERT INTO organizations (name, country_code, default_currency, status)
      SELECT ${organizationName}, 'BD', 'BDT', 'ACTIVE' FROM lead
      RETURNING id
    ),
    membership_insert AS (
      INSERT INTO organization_members (organization_id, account_id, role)
      SELECT o.id, a.id, 'OWNER'
      FROM organization_insert o CROSS JOIN account_upsert a
      RETURNING organization_id, account_id
    ),
    subscription_insert AS (
      INSERT INTO subscriptions (organization_id, plan_id, price_id, status, provider, current_period_start)
      SELECT m.organization_id, ${context.planId}, ${context.priceId}, 'ACTIVE', 'MANUAL_INVOICE', now()
      FROM membership_insert m
      RETURNING id, organization_id
    ),
    payment_insert AS (
      INSERT INTO payments (
        organization_id, subscription_id, provider, provider_transaction_id,
        currency, amount, status, paid_at
      )
      SELECT s.organization_id, s.id, 'MANUAL_INVOICE', ${providerTransactionId},
        'BDT', ${planTotal}, 'PAID', now()
      FROM subscription_insert s
      RETURNING id, organization_id, subscription_id
    ),
    entitlement_insert AS (
      INSERT INTO entitlements (organization_id, product_id, subscription_id, status, starts_at, metadata)
      SELECT p.organization_id, pl.product_id, p.subscription_id, 'ACTIVE', now(),
        jsonb_build_object('source', 'BKASH_PILOT', 'sales_lead_id', ${input.leadId}::text)
      FROM payment_insert p
      JOIN plans pl ON pl.id = ${context.planId}
      ON CONFLICT (organization_id, product_id) DO UPDATE SET
        subscription_id = EXCLUDED.subscription_id,
        status = 'ACTIVE', starts_at = COALESCE(entitlements.starts_at, now()),
        ends_at = NULL, metadata = entitlements.metadata || EXCLUDED.metadata,
        updated_at = now()
      RETURNING organization_id
    ),
    audit_insert AS (
      INSERT INTO audit_log (
        actor_account_id, organization_id, action, entity_type, entity_id, details
      )
      SELECT ${input.actorAccountId}, p.organization_id, 'BKASH_PILOT_PROVISIONED',
        'sales_lead', ${input.leadId},
        jsonb_build_object(
          'account_id', m.account_id,
          'subscription_id', p.subscription_id,
          'payment_id', p.id,
          'plan_code', ${input.planCode},
          'payment_method', ${bkashPilotPaymentMethod},
          'transaction_reference', ${transactionReference}
        )
      FROM payment_insert p
      JOIN membership_insert m ON m.organization_id = p.organization_id
      RETURNING organization_id
    ),
    lead_event AS (
      INSERT INTO sales_lead_events (lead_id, event_type, from_status, to_status, note)
      SELECT ${input.leadId}, 'COMMERCE_PROVISIONED', 'WON', 'WON',
        ${`Commerce ${input.planCode} customer provisioned after verified bKash payment.`}
      FROM audit_insert
      RETURNING id
    )
    SELECT m.account_id, p.organization_id, p.subscription_id, p.id AS payment_id
    FROM payment_insert p
    JOIN membership_insert m ON m.organization_id = p.organization_id
    JOIN entitlement_insert e ON e.organization_id = p.organization_id
    JOIN lead_event le ON true
  `;

  const row = rows[0];
  if (!row) throw new Error("Pilot customer provisioning did not complete.");
  return {
    accountId: asText(row.account_id),
    organizationId: asText(row.organization_id),
    subscriptionId: asText(row.subscription_id),
    paymentId: asText(row.payment_id),
    planCode: input.planCode,
    alreadyProvisioned: false,
  };
}
