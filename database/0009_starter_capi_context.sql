-- Preserve the original website request context for verified Starter Purchase CAPI events.
ALTER TABLE starter_orders ADD COLUMN IF NOT EXISTS client_ip text;
ALTER TABLE starter_orders ADD COLUMN IF NOT EXISTS user_agent text;
