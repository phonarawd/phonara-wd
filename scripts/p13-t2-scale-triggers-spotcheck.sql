-- P13 T2 scale trigger spot-check (read-only · YAML #238)
-- Operator / AI MCP: run on remote prod. No DDL. No money mutation.
-- Usage: psql $DATABASE_URL -f scripts/p13-t2-scale-triggers-spotcheck.sql
--        or Supabase Dashboard SQL Editor (service_role / DB owner)
--
-- Measures DAU/접속 hints + current OI/cap posture for band classification.
-- Does NOT auto-apply S1/S2/S3 caps — operator apply after checklist.
BEGIN;

DO $$
DECLARE
  v_dau_24h BIGINT;
  v_active_users BIGINT;
  v_pos_cap TEXT;
  v_major_oi_sample TEXT;
  v_phon_oi TEXT;
  v_lev_bad INT;
  v_band TEXT;
BEGIN
  -- 1) DAU proxy — prefer auth.users.last_sign_in_at (24h), else profiles.updated_at
  SELECT COUNT(*)::BIGINT INTO v_dau_24h
    FROM auth.users u
   WHERE u.last_sign_in_at IS NOT NULL
     AND u.last_sign_in_at >= (now() - interval '24 hours');

  IF v_dau_24h IS NULL OR v_dau_24h = 0 THEN
    SELECT COUNT(*)::BIGINT INTO v_dau_24h
      FROM profiles
     WHERE deleted_at IS NULL
       AND updated_at >= (now() - interval '24 hours');
  END IF;

  SELECT COUNT(*)::BIGINT INTO v_active_users
    FROM profiles
   WHERE deleted_at IS NULL;

  -- Band classify (same thresholds as display-contract)
  IF v_dau_24h < 500 THEN
    v_band := 'below_s1';
  ELSIF v_dau_24h < 2000 THEN
    v_band := 's1_early';
  ELSIF v_dau_24h < 10000 THEN
    v_band := 's2_growth';
  ELSE
    v_band := 's3_scale';
  END IF;

  RAISE NOTICE 'T2 DAU_24h=% · profiles=% · band=%', v_dau_24h, v_active_users, v_band;

  -- 2) Current T1 posture still valid until operator applies a higher band
  SELECT value INTO v_pos_cap FROM app_config WHERE key = 'max_open_positions_per_user';
  ASSERT COALESCE(v_pos_cap, '') = '50',
    format('T2 FAIL: max_open_positions_per_user expected 50 got %s', v_pos_cap);

  SELECT COUNT(*)::INT INTO v_lev_bad
    FROM futures_markets
   WHERE is_active
     AND max_leverage IS DISTINCT FROM '5';
  ASSERT v_lev_bad = 0,
    format('T2 FAIL: %s active futures not at max_leverage=5', v_lev_bad);

  SELECT max_open_interest INTO v_major_oi_sample
    FROM futures_markets
   WHERE is_active AND symbol LIKE '%USDT-SIM'
   ORDER BY symbol
   LIMIT 1;

  SELECT max_open_interest INTO v_phon_oi
    FROM futures_markets
   WHERE is_active AND symbol = 'PHONUSDT-PERP';

  RAISE NOTICE 'T2 OI sample major=% · PHON=% (T1=200k/40k · S1=250k/50k · S2=300k/60k · S3=400k/80k)',
    v_major_oi_sample, v_phon_oi;

  RAISE NOTICE 'T2 spotcheck hard ASSERT OK — positions cap · lev 5 · DAU band classified';
END $$;

-- Display-only probes
SELECT 'dau_proxy_auth_24h' AS section,
       COUNT(*)::TEXT AS item,
       'auth.users.last_sign_in_at 24h' AS detail
  FROM auth.users
 WHERE last_sign_in_at IS NOT NULL
   AND last_sign_in_at >= (now() - interval '24 hours');

SELECT 'dau_proxy_profiles_24h' AS section,
       COUNT(*)::TEXT AS item,
       'profiles.updated_at 24h' AS detail
  FROM profiles
 WHERE deleted_at IS NULL
   AND updated_at >= (now() - interval '24 hours');

SELECT 'profiles_total' AS section, COUNT(*)::TEXT AS item, 'active' AS detail
  FROM profiles
 WHERE deleted_at IS NULL;

SELECT 'app_config' AS section, key AS item, value AS detail
  FROM app_config
 WHERE key IN (
   'max_open_positions_per_user',
   'feature_cross_margin_enabled',
   'feature_funding_enabled',
   'feature_withdrawal_enabled',
   'system_halt',
   'system_readonly'
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

ROLLBACK;
