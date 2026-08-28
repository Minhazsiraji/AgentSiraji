import { db } from "@/lib/db";
import type { Market } from "@/lib/catalog";
import type { PaymentProvider } from "@/lib/billing";
import { toDatabaseProvider } from "@/lib/commercial-db";

export type ProductSubscriptionContext = {
  productId: string;
  productCode: string;
  planId: string;
  priceId: string;
  planCode: string;
  planName: string;
  market: Market;
  currency: string;
  setupAmount: number;
  recurringAmount: number;
  billingInterval: string;
  salesEnabled: boolean;
  displayPrice: number | null;
  billingMatchesDisplay: boolean;
};

function activeOfferPrice(row: Record<string, unknown>, now = new Date()) {
  const regular = row.regular_price == null ? null : Number(row.regular_price);
  const offer = row.offer_price == null ? null : Number(row.offer_price);
  if (!row.offer_enabled || offer == null) return regular;
  const starts = row.offer_starts_at ? new Date(String(row.offer_starts_at)) : null;
  const ends = row.offer_ends_at ? new Date(String(row.offer_ends_at)) : null;
  if (starts && now < starts) return regular;
  if (ends && now >= ends) return regular;
  return offer;
}

export async function getProductSubscriptionContext(input: {
  product: string;
  plan: string;
  market: Market;
}): Promise<ProductSubscriptionContext> {
  const sql = db();
  const dbMarket = input.market === "bd" ? "BD" : "INTL";
  const rows = await sql`
    SELECT prod.id AS product_id, prod.code AS product_code,
      p.id AS plan_id, p.code AS plan_code, p.name AS plan_name,
      pr.id AS price_id, pr.market, pr.currency, pr.setup_amount,
      pr.recurring_amount, pr.billing_interval,
      o.regular_price, o.offer_price, o.offer_enabled,
      o.offer_starts_at, o.offer_ends_at, o.sales_enabled
    FROM products prod
    JOIN plans p ON p.product_id = prod.id
    JOIN prices pr ON pr.plan_id = p.id
    LEFT JOIN commercial_product_offers o
      ON o.product_id = prod.id AND o.plan_code = p.code AND o.market = pr.market
    WHERE prod.code = ${input.product}
      AND p.code = ${input.plan}
      AND pr.market = ${dbMarket}
      AND p.active = true
      AND pr.active = true
    LIMIT 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) throw new Error("Subscription plan or billing price is not configured.");

  const displayPrice = activeOfferPrice(row);
  const currency = String(row.currency);
  const recurringAmount = Number(row.recurring_amount);
  const displayInBillingUnits = displayPrice == null
    ? null
    : currency === "USD"
      ? Math.round(displayPrice * 100)
      : Math.round(displayPrice);

  return {
    productId: String(row.product_id),
    productCode: String(row.product_code),
    planId: String(row.plan_id),
    priceId: String(row.price_id),
    planCode: String(row.plan_code),
    planName: String(row.plan_name),
    market: input.market,
    currency,
    setupAmount: Number(row.setup_amount),
    recurringAmount,
    billingInterval: String(row.billing_interval),
    salesEnabled: Boolean(row.sales_enabled),
    displayPrice,
    billingMatchesDisplay: displayInBillingUnits != null && displayInBillingUnits === recurringAmount,
  };
}

export type PendingProductSubscription = {
  accountId: string;
  organizationId: string;
  subscriptionId: string;
  paymentId: string;
  currency: string;
  amount: number;
  setupAmount: number;
  recurringAmount: number;
  context: ProductSubscriptionContext;
};

export async function createPendingProductSubscription(input: {
  product: string;
  plan: string;
  market: Market;
  provider: PaymentProvider;
  email: string;
  displayName?: string;
  organizationName: string;
}): Promise<PendingProductSubscription> {
  const sql = db();
  const context = await getProductSubscriptionContext({
    product: input.product,
    plan: input.plan,
    market: input.market,
  });

  if (!context.billingMatchesDisplay) {
    throw new Error("Displayed pricing and provider billing are not synchronized.");
  }
  if (process.env.VERCEL_ENV === "production" && !context.salesEnabled) {
    throw new Error("This subscription is not enabled for sale yet.");
  }

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

  await sql`
    INSERT INTO organization_members (organization_id, account_id, role)
    VALUES (${organizationId}, ${accountId}, 'OWNER')
  `;

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

  return {
    accountId,
    organizationId,
    subscriptionId,
    paymentId,
    currency: context.currency,
    amount: totalAmount,
    setupAmount: context.setupAmount,
    recurringAmount: context.recurringAmount,
    context,
  };
}
