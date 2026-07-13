-- ============================================================
-- PIR E4 — Sweep chunk LIMIT + has_more (liq / funding / stop / affiliate)
-- ============================================================
-- Anchors:
--   • rpc_run_* return has_more + batch_limit
--   • LIMIT caps examined rows per TX
--   • funding does not advance next_funding_at while has_more
--   • cron wrappers drain via has_more (+ keyset last_id for liq/stop)
-- ============================================================

-- ── E4-0: functiondef + privilege anchors ───────────────────────────────────
BEGIN;

DO $$
DECLARE
  v_liq_def TEXT;
  v_stop_def TEXT;
  v_fund_def TEXT;
  v_aff_def TEXT;
  v_apply_def TEXT;
BEGIN
  ASSERT to_regprocedure('public.rpc_run_liquidations(integer, uuid)') IS NOT NULL,
    'rpc_run_liquidations(integer, uuid) must exist';
  ASSERT to_regprocedure('public.rpc_run_stop_orders(integer, uuid)') IS NOT NULL,
    'rpc_run_stop_orders(integer, uuid) must exist';
  ASSERT to_regprocedure('public.rpc_run_funding_accrual(integer)') IS NOT NULL,
    'rpc_run_funding_accrual(integer) must exist';
  ASSERT to_regprocedure('public._apply_funding_for_market(text, text, timestamp with time zone, integer)') IS NOT NULL,
    '_apply_funding_for_market(..., integer) must exist';
  ASSERT to_regprocedure('public.rpc_run_affiliate_settlements(date, integer)') IS NOT NULL,
    'rpc_run_affiliate_settlements(date, integer) must exist';
  ASSERT to_regprocedure('public._run_affiliate_settlements(date, integer)') IS NOT NULL,
    '_run_affiliate_settlements(date, integer) must exist';
  ASSERT to_regprocedure('public._run_funding_accrual_logged()') IS NOT NULL,
    '_run_funding_accrual_logged() must exist';

  v_liq_def := pg_get_functiondef('public.rpc_run_liquidations(integer, uuid)'::regprocedure);
  v_stop_def := pg_get_functiondef('public.rpc_run_stop_orders(integer, uuid)'::regprocedure);
  v_fund_def := pg_get_functiondef('public.rpc_run_funding_accrual(integer)'::regprocedure);
  v_apply_def := pg_get_functiondef(
    'public._apply_funding_for_market(text, text, timestamp with time zone, integer)'::regprocedure
  );
  v_aff_def := pg_get_functiondef('public._run_affiliate_settlements(date, integer)'::regprocedure);

  ASSERT position('has_more' IN v_liq_def) > 0, 'liquidations must return has_more';
  ASSERT position('LIMIT' IN upper(v_liq_def)) > 0, 'liquidations must LIMIT batch';
  ASSERT position('has_more' IN v_stop_def) > 0, 'stop orders must return has_more';
  ASSERT position('has_more' IN v_fund_def) > 0, 'funding accrual must return has_more';
  ASSERT position('has_more' IN v_apply_def) > 0, 'apply funding must return has_more';
  ASSERT position('has_more' IN v_aff_def) > 0, 'affiliate settlements must return has_more';
  ASSERT position('LIMIT' IN upper(v_aff_def)) > 0, 'affiliate pay loop must LIMIT batch';

  ASSERT NOT has_function_privilege('anon', 'public.rpc_run_liquidations(integer, uuid)', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_run_liquidations';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_run_liquidations(integer, uuid)', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_run_liquidations';
  ASSERT has_function_privilege('service_role', 'public.rpc_run_liquidations(integer, uuid)', 'EXECUTE'),
    'service_role must EXECUTE rpc_run_liquidations';

  ASSERT NOT has_function_privilege('anon', 'public.rpc_run_funding_accrual(integer)', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_run_funding_accrual';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_run_funding_accrual(integer)', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_run_funding_accrual';
  ASSERT has_function_privilege('service_role', 'public.rpc_run_funding_accrual(integer)', 'EXECUTE'),
    'service_role must EXECUTE rpc_run_funding_accrual';

  ASSERT NOT has_function_privilege('authenticated', 'public._pir_sweep_batch_limit(integer)', 'EXECUTE'),
    'authenticated must NOT EXECUTE _pir_sweep_batch_limit';

  RAISE NOTICE 'PIR E4-0 OK — LIMIT/has_more functiondef + grants';
END;
$$;

ROLLBACK;

-- ── E4-1: liquidations batch LIMIT + has_more + keyset drain ────────────────
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_ids UUID[] := ARRAY[]::UUID[];
  v_i INT;
  v_res JSONB;
  v_res2 JSONB;
  v_open INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'pir_e4_liq_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '1000000.000000' WHERE user_id = v_uid;
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = 'true' WHERE key = 'feature_futures_enabled';

  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('BTCUSDT-SIM', '68000.000000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  UPDATE futures_markets
  SET is_active = TRUE, max_leverage = 20, max_user_positions = 50, max_open_interest = '100000000.000000'
  WHERE symbol = 'BTCUSDT-SIM';
  UPDATE market_circuit_breakers SET is_halted = FALSE WHERE symbol = 'BTCUSDT-SIM';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  FOR v_i IN 1..3 LOOP
    v_ids := v_ids || ARRAY[(
      rpc_open_futures_position(
        'BTCUSDT-SIM', 'long', 'USDT', '100.000000', '5', NULL, NULL,
        'pir-e4-liq-' || v_i::TEXT || '-' || v_uid::TEXT
      )->>'position_id'
    )::UUID];
  END LOOP;

  PERFORM set_config('request.jwt.claims', '{}', true);

  v_res := rpc_run_liquidations(1, NULL);
  ASSERT (v_res->>'examined')::INT = 1,
    format('batch_limit=1 must examine 1, got %s', v_res);
  ASSERT (v_res->>'batch_limit')::INT = 1, 'batch_limit echo mismatch';
  ASSERT COALESCE((v_res->>'has_more')::BOOLEAN, FALSE) = TRUE,
    format('3 open positions with limit=1 must has_more, got %s', v_res);
  ASSERT v_res->>'last_id' IS NOT NULL, 'last_id required for keyset';

  v_res2 := rpc_run_liquidations(1, (v_res->>'last_id')::UUID);
  ASSERT (v_res2->>'examined')::INT = 1, format('second chunk must examine 1, got %s', v_res2);
  ASSERT (v_res2->>'last_id')::UUID <> (v_res->>'last_id')::UUID,
    'keyset must advance last_id across chunks';

  SELECT COUNT(*)::INT INTO v_open FROM futures_positions WHERE user_id = v_uid AND status = 'open';
  ASSERT v_open = 3, format('healthy positions must stay open, got %s', v_open);

  RAISE NOTICE 'PIR E4-1 OK — liquidations LIMIT/has_more/keyset';
END;
$$;

ROLLBACK;

-- ── E4-2: funding holds next_funding_at while has_more ──────────────────────
BEGIN;

DO $$
DECLARE
  v_uid_a UUID := gen_random_uuid();
  v_uid_b UUID := gen_random_uuid();
  v_pos_a UUID;
  v_pos_b UUID;
  v_before TIMESTAMPTZ;
  v_after TIMESTAMPTZ;
  v_res JSONB;
  v_res2 JSONB;
  v_usdt_before NUMERIC;
  v_usdt_after NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_uid_a, 'authenticated', 'authenticated', 'pir_e4_fa_' || v_uid_a::TEXT || '@test.local', NOW(), NOW()),
    (v_uid_b, 'authenticated', 'authenticated', 'pir_e4_fb_' || v_uid_b::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '10000.000000' WHERE user_id IN (v_uid_a, v_uid_b);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_funding_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = 'true' WHERE key = 'feature_futures_enabled';

  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('BTCUSDT-SIM', '68000.000000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  UPDATE futures_markets
  SET is_active = TRUE, max_leverage = 10, max_user_positions = 50, max_open_interest = '10000000.000000'
  WHERE symbol = 'BTCUSDT-SIM';
  UPDATE market_circuit_breakers SET is_halted = FALSE WHERE symbol = 'BTCUSDT-SIM';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid_a::TEXT)::TEXT, true);
  v_pos_a := (rpc_open_futures_position(
    'BTCUSDT-SIM', 'long', 'USDT', '1000.000000', '5', NULL, NULL,
    'pir-e4-fund-a-' || v_uid_a::TEXT
  )->>'position_id')::UUID;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid_b::TEXT)::TEXT, true);
  v_pos_b := (rpc_open_futures_position(
    'BTCUSDT-SIM', 'short', 'USDT', '1000.000000', '5', NULL, NULL,
    'pir-e4-fund-b-' || v_uid_b::TEXT
  )->>'position_id')::UUID;

  UPDATE funding_rates
  SET rate = '0.000100', next_funding_at = NOW() - INTERVAL '1 minute', updated_at = NOW()
  WHERE market = 'BTCUSDT-SIM';

  SELECT next_funding_at INTO v_before FROM funding_rates WHERE market = 'BTCUSDT-SIM';

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_before;

  PERFORM set_config('request.jwt.claims', '{}', true);

  v_res := rpc_run_funding_accrual(1);
  ASSERT COALESCE((v_res->>'has_more')::BOOLEAN, FALSE) = TRUE,
    format('two unpaid positions with limit=1 must has_more, got %s', v_res);
  ASSERT (v_res->>'advanced')::INT = 0,
    format('must not advance schedule while has_more, got %s', v_res);

  SELECT next_funding_at INTO v_after FROM funding_rates WHERE market = 'BTCUSDT-SIM';
  ASSERT v_after = v_before,
    format('next_funding_at must hold while chunked, before=%s after=%s', v_before, v_after);

  v_res2 := rpc_run_funding_accrual(1);
  ASSERT COALESCE((v_res2->>'has_more')::BOOLEAN, FALSE) = FALSE,
    format('second chunk must finish market, got %s', v_res2);
  ASSERT (v_res2->>'advanced')::INT = 1,
    format('schedule advances only after full market drain, got %s', v_res2);

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_after;
  ASSERT v_usdt_after = v_usdt_before,
    format('USDT Σ must hold across chunked funding: %s -> %s', v_usdt_before, v_usdt_after);

  ASSERT v_pos_a IS NOT NULL AND v_pos_b IS NOT NULL, 'positions must open';

  RAISE NOTICE 'PIR E4-2 OK — funding has_more holds next_funding_at · Σ=0';
END;
$$;

ROLLBACK;

-- ── E4-3: affiliate pay loop LIMIT + has_more ───────────────────────────────
BEGIN;

DO $$
DECLARE
  v_day DATE := CURRENT_DATE;
  v_a UUID := gen_random_uuid();
  v_b UUID := gen_random_uuid();
  v_user_a UUID := gen_random_uuid();
  v_user_b UUID := gen_random_uuid();
  v_res JSONB;
  v_res2 JSONB;
  v_paid_total INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_a, 'authenticated', 'authenticated', 'pir_e4_aff_a_' || v_a::TEXT || '@test.local', NOW(), NOW()),
    (v_b, 'authenticated', 'authenticated', 'pir_e4_aff_b_' || v_b::TEXT || '@test.local', NOW(), NOW()),
    (v_user_a, 'authenticated', 'authenticated', 'pir_e4_u_a_' || v_user_a::TEXT || '@test.local', NOW(), NOW()),
    (v_user_b, 'authenticated', 'authenticated', 'pir_e4_u_b_' || v_user_b::TEXT || '@test.local', NOW(), NOW());

  INSERT INTO affiliate_relationships (child_id, parent_id)
  VALUES (v_user_a, v_a), (v_user_b, v_b);

  UPDATE affiliate_tier_configs
     SET direct_commission_bps = 1000,
         override_commission_bps = 0
   WHERE tier_code = 'standard';

  INSERT INTO affiliate_commission_daily_aggregates (
    aggregate_date, affiliate_id, referred_id, domain, currency, gross_revenue
  ) VALUES
    (v_day, v_a, v_user_a, 'trading', 'USDT', '100.000000'),
    (v_day, v_b, v_user_b, 'trading', 'USDT', '100.000000');

  PERFORM set_config('request.jwt.claims', '{}', true);

  v_res := rpc_run_affiliate_settlements(v_day, 1);
  ASSERT (v_res->>'examined')::INT = 1,
    format('affiliate batch_limit=1 must examine 1, got %s', v_res);
  ASSERT COALESCE((v_res->>'has_more')::BOOLEAN, FALSE) = TRUE,
    format('two computed settlements with limit=1 must has_more, got %s', v_res);

  v_res2 := rpc_run_affiliate_settlements(v_day, 1);
  ASSERT COALESCE((v_res2->>'has_more')::BOOLEAN, FALSE) = FALSE,
    format('second affiliate chunk must drain, got %s', v_res2);

  v_paid_total := COALESCE((v_res->>'paid')::INT, 0) + COALESCE((v_res2->>'paid')::INT, 0);
  ASSERT v_paid_total = 2, format('both affiliates must be paid across chunks, got %s+%s', v_res, v_res2);

  RAISE NOTICE 'PIR E4-3 OK — affiliate LIMIT/has_more drain';
END;
$$;

ROLLBACK;
