import { db } from "@/lib/db";
import type { Market } from "@/lib/catalog";
import type { PaymentProvider } from "@/lib/billing";

type PlanCode = "starter" | "growth" | "pro";

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
    SELECT
      p.id AS plan_id,
      pr.id AS price_id,
      p.code AS plan_code,
      pr.market,
      pr.currency,
      pr.setup_amount,
      pr.recurring_amount,
      pr.billing_interval
    FROM plans p
    JOIN products prod
      ON prod.id = p.product_id
    JOIN prices pr
      ON pr.plan_id = p.id
    WHERE prod.code = 'commerce'
      AND p.code = ${input.plan}
      AND pr.market = ${dbMarket}
      AND p.active = true
      AND pr.active = true
    LIMIT 1
  `;

  const row = rows[0];

  if (!row) {
    throw new Error("Commercial plan or price is not configured.");
  }

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
  const context = await getCheckoutCommercialContext({
    plan: input.plan,
    market: input.market,
  });

  const provider = toDatabaseProvider(input.provider);
  const countryCode = input.market === "bd" ? "BD" : "US";
  const totalAmount = context.setupAmount + context.recurringAmount;

  const accountRows = await sql`
    INSERT INTO accounts (email, display_name, status)
    VALUES (
      ${input.email.trim().toLowerCase()},
      ${input.displayName?.trim() || null},
      'PENDING'
    )
    ON CONFLICT (email)
    DO UPDATE SET
      display_name = COALESCE(EXCLUDED.display_name, accounts.display_name),
      updated_at = now()
    RETURNING id
  `;

  const accountId = String(accountRows[0].id);

  const organizationRows = await sql`
    INSERT INTO organizations (
      name,
      country_code,
      default_currency,
      status
    )
    VALUES (
      ${input.organizationName.trim()},
      ${countryCode},
      ${context.currency},
      'ACTIVE'
    )
    RETURNING id
  `;

  const organizationId = String(organizationRows[0].id);

  await sql`
    INSERT INTO organization_members (
      organization_id,
      account_id,
      role
    )
    VALUES (
      ${organizationId},
      ${accountId},
      'OWNER'
    )
  `;

  const subscriptionRows = await sql`
    INSERT INTO subscriptions (
      organization_id,
      plan_id,
      price_id,
      status,
      provider
    )
    VALUES (
      ${organizationId},
      ${context.planId},
      ${context.priceId},
      'PENDING',
      ${provider}
    )
    RETURNING id
  `;

  const subscriptionId = String(subscriptionRows[0].id);

  const paymentRows = await sql`
    INSERT INTO payments (
      organization_id,
      subscription_id,
      provider,
      currency,
      amount,
      status
    )
    VALUES (
      ${organizationId},
      ${subscriptionId},
      ${provider},
      ${context.currency},
      ${totalAmount},
      'PENDING_PAYMENT'
    )
    RETURNING id
  `;

  const paymentId = String(paymentRows[0].id);

  return {
    accountId,
    organizationId,
    subscriptionId,
    paymentId,
    planId: context.planId,
    priceId: context.priceId,
    currency: context.currency,
    amount: totalAmount,
  };
}