-- Encrypted AgentSiraji-only integration settings. The application creates this table lazily too.
CREATE TABLE IF NOT EXISTS agentsiraji_integrations (
  id text PRIMARY KEY,
  encrypted_config text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
