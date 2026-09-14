CREATE TABLE IF NOT EXISTS auth_magic_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  redirect_path text NOT NULL DEFAULT '/account/commerce',
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  requested_ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_magic_links_account_idx
  ON auth_magic_links (account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS auth_magic_links_expiry_idx
  ON auth_magic_links (expires_at);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  session_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_sessions_account_idx
  ON auth_sessions (account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx
  ON auth_sessions (expires_at);

CREATE TABLE IF NOT EXISTS platform_account_roles (
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('PLATFORM_OWNER', 'PLATFORM_ADMIN')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, role)
);

CREATE TABLE IF NOT EXISTS auth_security_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_security_events_account_idx
  ON auth_security_events (account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS auth_security_events_type_idx
  ON auth_security_events (event_type, created_at DESC);
