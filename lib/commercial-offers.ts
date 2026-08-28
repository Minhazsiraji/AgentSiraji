import { db } from "@/lib/db";

export type CommercialMarket = "BD" | "INTL" | "EMERGING";

export type CommercialOfferInput = {
  productCode: string;
  planCode: string;
  planName: string;
  market: CommercialMarket;
  currency: string;
  regularPrice: number | null;
  offerPrice: number | null;
  annualPrice: number | null;
  billingUnit: string;
  offerUnitLabel: string | null;
  offerEnabled: boolean;
  offerStartsAt: string | null;
  offerEndsAt: string | null;
  salesEnabled: boolean;
  usageLimits: Record<string, unknown>;
  sortOrder: number;
};

export async function listCommercialProductsAndOffers() {
  const sql = db();
  const rows = await sql`
    SELECT
      p.code AS product_code,
      p.name AS product_name,
      p.status AS product_status,
      o.id AS offer_id,
      o.plan_code,
      o.plan_name,
      o.market,
      o.currency,
      o.regular_price,
      o.offer_price,
      o.annual_price,
      o.billing_unit,
      o.offer_unit_label,
      o.offer_enabled,
      o.offer_starts_at,
      o.offer_ends_at,
      o.sales_enabled,
      o.usage_limits,
      o.sort_order,
      o.updated_at
    FROM products p
    LEFT JOIN commercial_product_offers o ON o.product_id = p.id
    ORDER BY p.name, o.sort_order, o.plan_name, o.market
  `;

  const products = new Map<string, {
    code: string;
    name: string;
    status: string;
    offers: Array<Record<string, unknown>>;
  }>();

  for (const row of rows) {
    const code = String(row.product_code);
    if (!products.has(code)) {
      products.set(code, {
        code,
        name: String(row.product_name),
        status: String(row.product_status),
        offers: [],
      });
    }
    if (row.offer_id) {
      products.get(code)!.offers.push({
        id: String(row.offer_id),
        planCode: String(row.plan_code),
        planName: String(row.plan_name),
        market: String(row.market),
        currency: String(row.currency),
        regularPrice: row.regular_price == null ? null : Number(row.regular_price),
        offerPrice: row.offer_price == null ? null : Number(row.offer_price),
        annualPrice: row.annual_price == null ? null : Number(row.annual_price),
        billingUnit: String(row.billing_unit),
        offerUnitLabel: row.offer_unit_label == null ? null : String(row.offer_unit_label),
        offerEnabled: Boolean(row.offer_enabled),
        offerStartsAt: row.offer_starts_at ? new Date(row.offer_starts_at as string).toISOString() : null,
        offerEndsAt: row.offer_ends_at ? new Date(row.offer_ends_at as string).toISOString() : null,
        salesEnabled: Boolean(row.sales_enabled),
        usageLimits: row.usage_limits ?? {},
        sortOrder: Number(row.sort_order ?? 0),
        updatedAt: row.updated_at ? new Date(row.updated_at as string).toISOString() : null,
      });
    }
  }

  return [...products.values()];
}

export async function upsertCommercialOffer(input: CommercialOfferInput) {
  const sql = db();
  const productRows = await sql`SELECT id FROM products WHERE code = ${input.productCode} LIMIT 1`;
  const product = productRows[0];
  if (!product) throw new Error("Product was not found.");

  const rows = await sql`
    INSERT INTO commercial_product_offers (
      product_id, plan_code, plan_name, market, currency,
      regular_price, offer_price, annual_price, billing_unit, offer_unit_label,
      offer_enabled, offer_starts_at, offer_ends_at, sales_enabled, usage_limits,
      sort_order, updated_at
    ) VALUES (
      ${String(product.id)}, ${input.planCode}, ${input.planName}, ${input.market}, ${input.currency},
      ${input.regularPrice}, ${input.offerPrice}, ${input.annualPrice}, ${input.billingUnit}, ${input.offerUnitLabel},
      ${input.offerEnabled}, ${input.offerStartsAt}, ${input.offerEndsAt}, ${input.salesEnabled},
      ${JSON.stringify(input.usageLimits)}::jsonb, ${input.sortOrder}, now()
    )
    ON CONFLICT (product_id, plan_code, market) DO UPDATE SET
      plan_name = EXCLUDED.plan_name,
      currency = EXCLUDED.currency,
      regular_price = EXCLUDED.regular_price,
      offer_price = EXCLUDED.offer_price,
      annual_price = EXCLUDED.annual_price,
      billing_unit = EXCLUDED.billing_unit,
      offer_unit_label = EXCLUDED.offer_unit_label,
      offer_enabled = EXCLUDED.offer_enabled,
      offer_starts_at = EXCLUDED.offer_starts_at,
      offer_ends_at = EXCLUDED.offer_ends_at,
      sales_enabled = EXCLUDED.sales_enabled,
      usage_limits = EXCLUDED.usage_limits,
      sort_order = EXCLUDED.sort_order,
      updated_at = now()
    RETURNING id
  `;
  return { id: String(rows[0].id) };
}
