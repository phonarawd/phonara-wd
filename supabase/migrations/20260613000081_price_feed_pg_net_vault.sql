-- ============================================================
-- Price-feed scheduler infrastructure: pg_net + Supabase Vault
-- ============================================================
-- The price feed must reach an Edge Function over HTTPS. Keep secrets out of
-- migrations: operators/scripts create `price_feed_url` and
-- `price_feed_invoke_key` in Vault from environment at deploy time.
-- ============================================================

SET search_path = public, pg_temp;

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
