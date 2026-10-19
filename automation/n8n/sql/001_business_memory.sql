-- Separate business memory schema. n8n's internal tables remain in public.
CREATE SCHEMA IF NOT EXISTS business_os;
CREATE TABLE IF NOT EXISTS business_os.prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  website text,
  country text,
  segment text,
  source_url text,
  verified_need text,
  quality_score integer CHECK (quality_score BETWEEN 0 AND 100),
  score_explanation jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'research'
    CHECK (status IN ('research','review','approved','contacted','replied','meeting','proposal','won','lost','do_not_contact')),
  do_not_contact boolean NOT NULL DEFAULT false,
  next_action_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prospect_status_idx ON business_os.prospects(status, next_action_at);
CREATE TABLE IF NOT EXISTS business_os.decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES business_os.prospects(id) ON DELETE SET NULL,
  decision_kind text NOT NULL,
  proposed_action jsonb NOT NULL DEFAULT '{}'::jsonb,
  decision text NOT NULL DEFAULT 'pending'
    CHECK (decision IN ('pending','approved','rejected','revised')),
  feedback text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS business_os.outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES business_os.prospects(id) ON DELETE SET NULL,
  channel text NOT NULL,
  event_kind text NOT NULL,
  measurement jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outcomes_time_idx ON business_os.outcomes(occurred_at DESC);
CREATE TABLE IF NOT EXISTS business_os.brand_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_code text UNIQUE NOT NULL,
  approved_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  revision integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- No automatic outbound messaging or publishing privileges are granted here.
