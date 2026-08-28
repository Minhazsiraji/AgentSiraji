INSERT INTO plans (product_id, code, name, active, metadata)
SELECT id, 'pro', 'Pro', true, '{"subscription":true}'::jsonb
FROM products
WHERE code = 'adintel'
ON CONFLICT (product_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  active = true,
  metadata = plans.metadata || EXCLUDED.metadata,
  updated_at = now();

INSERT INTO prices (plan_id, market, currency, setup_amount, recurring_amount, billing_interval, active)
SELECT p.id, v.market, v.currency, 0, v.recurring_amount, v.billing_interval, true
FROM plans p
JOIN products prod ON prod.id = p.product_id
CROSS JOIN (VALUES
  ('BD', 'BDT', 700, 'MONTH'),
  ('BD', 'BDT', 7000, 'YEAR'),
  ('INTL', 'USD', 1900, 'MONTH'),
  ('INTL', 'USD', 19000, 'YEAR')
) AS v(market, currency, recurring_amount, billing_interval)
WHERE prod.code = 'adintel' AND p.code = 'pro'
ON CONFLICT (plan_id, market, billing_interval) DO UPDATE SET
  currency = EXCLUDED.currency,
  setup_amount = EXCLUDED.setup_amount,
  recurring_amount = EXCLUDED.recurring_amount,
  active = true;
