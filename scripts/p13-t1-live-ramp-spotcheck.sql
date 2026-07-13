-- P13 T1 live ramp feature-gate spot-check (read-only · YAML #237)
-- Operator / AI MCP: run on remote prod. No DDL. No money mutation.
-- Usage: psql $DATABASE_URL -f scripts/p13-t1-live-ramp-spotcheck.sql
--        or Supabase Dashboard SQL Editor (service_role / DB owner)
BEGIN;

DO $$
DECLARE
  v_spot TEXT;
  v_futures TEXT;
  v_game TEXT;
  v_sports TEXT;
  v_deposit TEXT;
  v_cross TEXT;
  v_funding TEXT;
  v_withdrawal TEXT;
  v_halt TEXT;
  v_readonly TEXT;
  v_pos_cap TEXT;
  v_major_oi_bad INT;
  v_phon_oi_bad INT;
  v_lev_bad INT;
BEGIN
  -- 1) Weekly live-ramp rails ON (spot · futures isolated · casino · sports · deposit)
  SELECT value INTO v_spot FROM app_config WHERE key = 'feature_spot_enabled';
  SELECT value INTO v_futures FROM app_config WHERE key = 'feature_futures_enabled';
  SELECT value INTO v_game FROM app_config WHERE key = 'feature_game_enabled';
  SELECT value INTO v_sports FROM app_config WHERE key = 'feature_sports_enabled';
  SELECT value INTO v_deposit FROM app_config WHERE key = 'feature_deposit_enabled';

  ASSERT COALESCE(v_spot, 'false') = 'true',
    format('T1 FAIL: feature_spot_enabled must be true (got %s)', v_spot);
  ASSERT COALESCE(v_futures, 'false') = 'true',
    format('T1 FAIL: feature_futures_enabled must be true (got %s)', v_futures);
  ASSERT COALESCE(v_game, 'false') = 'true',
    format('T1 FAIL: feature_game_enabled must be true (got %s)', v_game);
  ASSERT COALESCE(v_sports, 'false') = 'true',
    format('T1 FAIL: feature_sports_enabled must be true (got %s)', v_sports);
  ASSERT COALESCE(v_deposit, 'false') = 'true',
    format('T1 FAIL: feature_deposit_enabled must be true (got %s)', v_deposit);

  -- 2) Launch gates OFF (Plan §20.14.7) — cross · funding · withdrawal
  SELECT value INTO v_cross FROM app_config WHERE key = 'feature_cross_margin_enabled';
  SELECT value INTO v_funding FROM app_config WHERE key = 'feature_funding_enabled';
  SELECT value INTO v_withdrawal FROM app_config WHERE key = 'feature_withdrawal_enabled';
  SELECT value INTO v_halt FROM app_config WHERE key = 'system_halt';
  SELECT value INTO v_readonly FROM app_config WHERE key = 'system_readonly';

  ASSERT COALESCE(v_cross, 'true') = 'false',
    format('T1 FAIL: feature_cross_margin_enabled must be false (got %s)', v_cross);
  ASSERT COALESCE(v_funding, 'true') = 'false',
    format('T1 FAIL: feature_funding_enabled must be false (got %s)', v_funding);
  ASSERT COALESCE(v_withdrawal, 'true') = 'false',
    format('T1 FAIL: feature_withdrawal_enabled must be false (got %s)', v_withdrawal);
  ASSERT COALESCE(v_halt, 'true') = 'false',
    format('T1 FAIL: system_halt must be false (got %s)', v_halt);
  ASSERT COALESCE(v_readonly, 'true') = 'false',
    format('T1 FAIL: system_readonly must be false (got %s)', v_readonly);

  -- 3) Caps — max positions 50 · leverage 5 · OI 40% of seed
  SELECT value INTO v_pos_cap FROM app_config WHERE key = 'max_open_positions_per_user';
  ASSERT COALESCE(v_pos_cap, '') = '50',
    format('T1 FAIL: max_open_positions_per_user expected 50 got %s', v_pos_cap);

  SELECT COUNT(*)::INT INTO v_lev_bad
    FROM futures_markets
   WHERE is_active
     AND max_leverage IS DISTINCT FROM '5';
  ASSERT v_lev_bad = 0,
    format('T1 FAIL: %s active futures not at max_leverage=5', v_lev_bad);

  SELECT COUNT(*)::INT INTO v_major_oi_bad
    FROM futures_markets
   WHERE is_active
     AND symbol LIKE '%USDT-SIM'
     AND max_open_interest IS DISTINCT FROM '200000.000000';
  ASSERT v_major_oi_bad = 0,
    format('T1 FAIL: %s major futures OI not at 200000 (40%% seed)', v_major_oi_bad);

  SELECT COUNT(*)::INT INTO v_phon_oi_bad
    FROM futures_markets
   WHERE is_active
     AND symbol = 'PHONUSDT-PERP'
     AND max_open_interest IS DISTINCT FROM '40000.000000';
  ASSERT v_phon_oi_bad = 0,
    format('T1 FAIL: PHONUSDT-PERP OI not at 40000 (40%% seed)');

  RAISE NOTICE 'T1 spotcheck hard ASSERT OK — weekly rails ON · launch OFF · OI 40%%';
END $$;

-- Display-only probes
SELECT 'app_config' AS section, key AS item, value AS detail
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

SELECT 'futures' AS section, symbol AS item,
       max_leverage || ' / OI=' || COALESCE(max_open_interest, 'NULL') AS detail
  FROM futures_markets
 WHERE is_active
 ORDER BY symbol;

SELECT 'ops_alerts_open' AS section, COUNT(*)::TEXT AS item, 'open' AS detail
  FROM ops_alerts
 WHERE status = 'open';

SELECT 'review_queue_pending' AS section, COUNT(*)::TEXT AS item, 'pending|in_review' AS detail
  FROM admin_review_queue
 WHERE status IN ('pending', 'in_review');

SELECT 'withdrawals_pending' AS section, COUNT(*)::TEXT AS item, 'pending|approved' AS detail
  FROM withdrawal_requests
 WHERE status IN ('pending', 'approved');

ROLLBACK;
