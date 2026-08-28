CREATE TABLE IF NOT EXISTS commercial_product_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  plan_code text NOT NULL,
  plan_name text NOT NULL,
  market text NOT NULL,
  currency text NOT NULL,
  regular_price numeric(14,2),
  offer_price numeric(14,2),
  annual_price numeric(14,2),
  billing_unit text NOT NULL DEFAULT 'month',
  offer_unit_label text,
  offer_enabled boolean NOT NULL DEFAULT false,
  offer_starts_at timestamptz,
  offer_ends_at timestamptz,
  sales_enabled boolean NOT NULL DEFAULT false,
  usage_limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT commercial_product_offers_market_check CHECK (market IN ('BD','INTL','EMERGING')),
  CONSTRAINT commercial_product_offers_prices_check CHECK (
    (regular_price IS NULL OR regular_price >= 0) AND
    (offer_price IS NULL OR offer_price >= 0) AND
    (annual_price IS NULL OR annual_price >= 0)
  ),
  CONSTRAINT commercial_product_offers_offer_window_check CHECK (
    offer_starts_at IS NULL OR offer_ends_at IS NULL OR offer_starts_at < offer_ends_at
  ),
  UNIQUE(product_id, plan_code, market)
);

CREATE INDEX IF NOT EXISTS commercial_product_offers_product_idx
  ON commercial_product_offers(product_id, sort_order, plan_code, market);

INSERT INTO commercial_product_offers (
  product_id, plan_code, plan_name, market, currency, regular_price, annual_price,
  billing_unit, offer_enabled, sales_enabled, usage_limits, sort_order
)
SELECT p.id, 'pro', 'Pro', 'BD', 'BDT', 700, 7000, 'month', false, false,
  '{"searches_per_month":500,"daily_safety_cap":100,"ai_analyses_per_month":100,"saved_ads":250,"creative_lab":true,"landing_intel":true,"exports":true,"country_access":"all"}'::jsonb, 10
FROM products p WHERE p.code='adintel'
ON CONFLICT (product_id, plan_code, market) DO NOTHING;

INSERT INTO commercial_product_offers (
  product_id, plan_code, plan_name, market, currency, regular_price, annual_price,
  billing_unit, offer_enabled, sales_enabled, usage_limits, sort_order
)
SELECT p.id, 'pro', 'Pro', 'INTL', 'USD', 19, 190, 'month', false, false,
  '{"searches_per_month":500,"daily_safety_cap":100,"ai_analyses_per_month":100,"saved_ads":250,"creative_lab":true,"landing_intel":true,"exports":true,"country_access":"all"}'::jsonb, 10
FROM products p WHERE p.code='adintel'
ON CONFLICT (product_id, plan_code, market) DO NOTHING;
