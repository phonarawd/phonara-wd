-- ============================================================
-- Scheduled price-feed Edge Function invocation
-- ============================================================
-- Runs once per minute. The Edge Function handles external exchange fetches
-- and submits individual source prices to rpc_submit_oracle_source_price.
--
-- Required Vault secrets, created outside migrations:
--   price_feed_url        = deployed Edge Function URL
--   price_feed_invoke_key = service-role bearer used to invoke the function
--
-- If secrets are absent (for example during local db reset), the scheduled
-- command no-ops while still applying cleanly.
-- ============================================================

SET search_path = public, pg_temp;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

SELECT cron.unschedule('phonara_price_feed')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'phonara_price_feed');

SELECT cron.schedule(
  'phonara_price_feed',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := (
      SELECT decrypted_secret
        FROM vault.decrypted_secrets
       WHERE name = 'price_feed_url'
       LIMIT 1
    ),
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (
        SELECT decrypted_secret
          FROM vault.decrypted_secrets
         WHERE name = 'price_feed_invoke_key'
         LIMIT 1
      ),
      'Content-Type',
      'application/json'
    ),
    body := '{}'::jsonb
  )
  WHERE EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'price_feed_url'
  )
  AND EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'price_feed_invoke_key'
  );
  $cron$
);
