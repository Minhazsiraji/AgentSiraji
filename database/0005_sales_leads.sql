CREATE TABLE IF NOT EXISTS sales_leads (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_type text NOT NULL CHECK (lead_type IN ('STORE_AUDIT', 'CONTACT')),
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST')),
  business_name text,
  contact_name text,
  country text,
  store_url text,
  email text NOT NULL,
  phone text,
  product_count text,
  interest text,
  message text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  landing_path text,
  meta_event_id text,
  marketing_consent boolean NOT NULL DEFAULT false,
  audit_result jsonb,
  audit_scan_error text,
  owner_note text,
  payment_method text,
  payment_reference text,
  payment_status text NOT NULL DEFAULT 'NOT_APPLICABLE'
    CHECK (payment_status IN ('NOT_APPLICABLE', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sales_leads_status_created_idx ON sales_leads (status, created_at DESC);
CREATE INDEX IF NOT EXISTS sales_leads_email_idx ON sales_leads (lower(email));
CREATE INDEX IF NOT EXISTS sales_leads_campaign_idx ON sales_leads (utm_campaign, created_at DESC);

CREATE TABLE IF NOT EXISTS sales_lead_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id bigint NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sales_lead_events_lead_idx ON sales_lead_events (lead_id, created_at DESC);
