-- AgentSiraji starter launch pricing update.
-- New customers pay ৳5,000 at start: ৳3,000 setup + ৳2,000 first-month hosting/support.
-- Domain remains a separate actual-cost charge.
ALTER TABLE starter_orders
  DROP CONSTRAINT IF EXISTS starter_orders_amount_bdt_check;

ALTER TABLE starter_orders
  ALTER COLUMN amount_bdt SET DEFAULT 5000;

UPDATE starter_orders
SET amount_bdt = 5000,
    updated_at = now()
WHERE amount_bdt = 3000
  AND status IN ('PENDING_PAYMENT','PENDING_VERIFICATION');

ALTER TABLE starter_orders
  ADD CONSTRAINT starter_orders_amount_bdt_check
  CHECK (amount_bdt IN (3000, 5000));
