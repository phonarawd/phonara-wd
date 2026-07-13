-- P13 T0-A prod preflight spot-check (read-only · YAML #232)
-- Operator / AI MCP: run on remote prod. No DDL. No money mutation.
-- Usage: psql $DATABASE_URL -f scripts/p13-ops-prod-preflight-spotcheck.sql
--        or Supabase Dashboard SQL Editor (service_role / DB owner for vault.*)
BEGIN;

DO $$
DECLARE
  v_missing_cron INT;
  v_vault_count INT;
  v_insurance_rows INT;
  v_treasury_rows INT;
  v_cross TEXT;
  v_funding TEXT;
  v_halt TEXT;
  v_readonly TEXT;
  v_pos_cap TEXT;
  v_major_lev_ok INT;
  v_major_oi_ok INT;
BEGIN
  -- 1) pg_cron live — 14 required jobs active
  SELECT COUNT(*)::INT INTO v_missing_cron
    FROM (VALUES
      ('phonara_auto_liquidations'),
      ('phonara_ops_notify'),
      ('phonara_ops_notify_digest'),
      ('phonara_casino_stale_pending_sweep'),
      ('phonara_daily_reconciliation'),
      ('phonara_price_feed'),
      ('phonara_phon_internal_oracle'),
      ('phonara_crypto_chain_watcher'),
      ('phonara_usdt_krw_feed'),
      ('phonara_notification_dispatch'),
      ('trade-open-order-fills'),
      ('trade-spot-order-fills'),
      ('trade-stop-orders'),
      ('trade-funding-accrual')
    ) AS expected(jobname)
   WHERE NOT EXISTS (
     SELECT 1 FROM cron.job j WHERE j.jobname = expected.jobname AND j.active
   );
  ASSERT v_missing_cron = 0,
    format('T0-A FAIL: %s required cron job(s) missing or inactive', v_missing_cron);

  -- 2) price-feed Vault secrets present (names only — never SELECT secret)
  SELECT COUNT(*)::INT INTO v_vault_count
    FROM vault.secrets
   WHERE name IN ('price_feed_url', 'price_feed_invoke_key');
  ASSERT v_vault_count = 2,
    format('T0-A FAIL: price-feed Vault secrets expected 2 got %s', v_vault_count);

  -- 3) insurance + treasury seed rows exist
  SELECT COUNT(*)::INT INTO v_insurance_rows
    FROM system_accounts
   WHERE code IN ('insurance_fund_phon', 'insurance_fund_usdt');
  ASSERT v_insurance_rows = 2,
    format('T0-A FAIL: insurance_fund_* rows expected 2 got %s', v_insurance_rows);

  SELECT COUNT(*)::INT INTO v_treasury_rows
    FROM treasury_reserves
   WHERE currency IN ('PHON', 'USDT', 'KRW');
  ASSERT v_treasury_rows = 3,
    format('T0-A FAIL: treasury_reserves currencies expected 3 got %s', v_treasury_rows);

  -- 4) OI / leverage defaults present on active futures
  SELECT COUNT(*)::INT INTO v_major_lev_ok
    FROM futures_markets
   WHERE is_active
     AND symbol LIKE '%USDT-SIM'
     AND max_leverage IS NOT NULL
     AND max_leverage <> '';
  ASSERT v_major_lev_ok > 0, 'T0-A FAIL: active major futures missing max_leverage';

  SELECT COUNT(*)::INT INTO v_major_oi_ok
    FROM futures_markets
   WHERE is_active
     AND max_open_interest IS NOT NULL;
  ASSERT v_major_oi_ok > 0, 'T0-A FAIL: active futures missing max_open_interest';

  SELECT value INTO v_pos_cap FROM app_config WHERE key = 'max_open_positions_per_user';
  ASSERT COALESCE(v_pos_cap, '') = '50',
    format('T0-A FAIL: max_open_positions_per_user expected 50 got %s', v_pos_cap);

  -- 5) Feature gate initial (Plan §20.14.7)
  SELECT value INTO v_cross FROM app_config WHERE key = 'feature_cross_margin_enabled';
  SELECT value INTO v_funding FROM app_config WHERE key = 'feature_funding_enabled';
  SELECT value INTO v_halt FROM app_config WHERE key = 'system_halt';
  SELECT value INTO v_readonly FROM app_config WHERE key = 'system_readonly';

  ASSERT COALESCE(v_cross, 'true') = 'false',
    format('T0-A FAIL: feature_cross_margin_enabled must be false (got %s)', v_cross);
  -- Funding settlement OFF is T0-A policy (§20.14.7). Drift = WARNING so operator
  -- can flip before soft launch without blocking cron/Vault hard checks.
  IF COALESCE(v_funding, 'true') <> 'false' THEN
    RAISE WARNING 'T0-A: feature_funding_enabled=% (expected false for T0-A initial)', v_funding;
  END IF;
  ASSERT COALESCE(v_halt, 'true') = 'false',
    format('T0-A FAIL: system_halt must be false (got %s)', v_halt);
  ASSERT COALESCE(v_readonly, 'true') = 'false',
    format('T0-A FAIL: system_readonly must be false (got %s)', v_readonly);

  RAISE NOTICE 'T0-A spotcheck hard ASSERT OK — review funding WARNING + balance probes';
END $$;

-- Display-only probes (do not ASSERT balances — operator funds before soft launch)
SELECT 'cron' AS section, jobname, schedule, active::TEXT AS detail
  FROM cron.job
 WHERE jobname IN (
   'phonara_auto_liquidations',
   'phonara_ops_notify',
   'phonara_ops_notify_digest',
   'phonara_casino_stale_pending_sweep',
   'phonara_daily_reconciliation',
   'phonara_price_feed',
   'phonara_phon_internal_oracle',
   'phonara_crypto_chain_watcher',
   'phonara_usdt_krw_feed',
   'phonara_notification_dispatch',
   'trade-open-order-fills',
   'trade-spot-order-fills',
   'trade-stop-orders',
   'trade-funding-accrual'
 )
 ORDER BY jobname;

SELECT 'vault' AS section, name AS jobname, NULL::TEXT AS schedule, 'present' AS detail
  FROM vault.secrets
 WHERE name IN ('price_feed_url', 'price_feed_invoke_key')
 ORDER BY name;

SELECT 'app_config' AS section, key AS jobname, NULL::TEXT AS schedule, value AS detail
  FROM app_config
 WHERE key IN (
   'system_halt',
   'system_readonly',
   'feature_cross_margin_enabled',
   'feature_funding_enabled',
   'feature_withdrawal_enabled',
   'feature_deposit_enabled',
   'feature_spot_enabled',
   'feature_futures_enabled',
   'feature_game_enabled',
   'feature_sports_enabled',
   'max_open_positions_per_user'
 )
 ORDER BY key;

SELECT 'insurance' AS section, code AS jobname, NULL::TEXT AS schedule, balance AS detail
  FROM system_accounts
 WHERE code IN (
   'insurance_fund_phon',
   'insurance_fund_usdt',
   'operator_contributed_capital_phon',
   'operator_contributed_capital_usdt'
 )
 ORDER BY code;

SELECT 'treasury' AS section, currency AS jobname, buffer_pct::TEXT AS schedule, real_balance AS detail
  FROM treasury_reserves
 ORDER BY currency;

SELECT 'futures' AS section, symbol AS jobname,
       max_leverage AS schedule,
       COALESCE(max_open_interest, 'NULL') AS detail
  FROM futures_markets
 WHERE is_active
 ORDER BY symbol;

ROLLBACK;
