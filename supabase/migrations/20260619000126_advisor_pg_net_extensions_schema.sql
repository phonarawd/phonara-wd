-- ============================================================
-- Migration: 20260619000126_advisor_pg_net_extensions_schema
-- ============================================================
-- Security-advisor cleanup (extension_in_public):
-- pg_net does not support ALTER EXTENSION ... SET SCHEMA on hosted Postgres.
-- Recreate in extensions schema and restore the price-feed cron job.
-- ============================================================

SET search_path = public, pg_temp;

SELECT cron.unschedule('phonara_price_feed')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'phonara_price_feed');

DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

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
