ALTER TABLE sales_leads
  ADD COLUMN IF NOT EXISTS payment_expected_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS payment_verified_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS payment_currency text NOT NULL DEFAULT 'BDT',
  ADD COLUMN IF NOT EXISTS payment_sender_hint text,
  ADD COLUMN IF NOT EXISTS payment_date date,
  ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_verification_note text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_leads_payment_expected_amount_positive'
  ) THEN
    ALTER TABLE sales_leads ADD CONSTRAINT sales_leads_payment_expected_amount_positive
      CHECK (payment_expected_amount IS NULL OR payment_expected_amount > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_leads_payment_verified_amount_positive'
  ) THEN
    ALTER TABLE sales_leads ADD CONSTRAINT sales_leads_payment_verified_amount_positive
      CHECK (payment_verified_amount IS NULL OR payment_verified_amount > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_leads_payment_currency_bdt'
  ) THEN
    ALTER TABLE sales_leads ADD CONSTRAINT sales_leads_payment_currency_bdt
      CHECK (payment_currency = 'BDT');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS sales_leads_payment_status_idx
  ON sales_leads (payment_status, payment_verified_at DESC);
