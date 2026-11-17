-- AgentSiraji ৳3,000 E-commerce Starter: isolated manual-payment workflow.
-- Safe to re-run. Does not change the existing Commerce checkout or plans.
CREATE TABLE IF NOT EXISTS starter_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token_hash text NOT NULL,
  full_name text NOT NULL,
  mobile text NOT NULL,
  email text,
  business_name text,
  business_type text NOT NULL,
  facebook_page text,
  status text NOT NULL DEFAULT 'PENDING_PAYMENT'
    CHECK (status IN ('PENDING_PAYMENT','PENDING_VERIFICATION','PAID','REJECTED','CANCELLED')),
  amount_bdt integer NOT NULL DEFAULT 3000 CHECK (amount_bdt = 3000),
  payment_method text CHECK (payment_method IN ('BKASH','CITY_BANK')),
  transaction_reference text,
  submitted_amount_bdt integer CHECK (submitted_amount_bdt IS NULL OR submitted_amount_bdt > 0),
  proof_url text,
  submitted_at timestamptz,
  verified_at timestamptz,
  verified_by_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  verification_note text,
  marketing_consent boolean NOT NULL DEFAULT false,
  checkout_event_id text,
  fbp text,
  fbc text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  purchase_event_processed_at timestamptz,
  purchase_event_claimed_at timestamptz,
  purchase_event_result text NOT NULL DEFAULT 'PENDING'
    CHECK (purchase_event_result IN ('PENDING','SENT','SKIPPED_CONSENT','FAILED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS starter_payment_reference_unique
  ON starter_orders (payment_method, lower(transaction_reference))
  WHERE transaction_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS starter_orders_status_idx ON starter_orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS starter_orders_event_retry_idx ON starter_orders(status, purchase_event_processed_at, purchase_event_claimed_at);
