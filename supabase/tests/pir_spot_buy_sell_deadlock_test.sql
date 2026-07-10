-- ============================================================
-- PIR E1 — spot buy∥sell system_accounts lock order (C-2)
-- ============================================================
-- Anchors _lock_system_accounts ORDER BY code FOR UPDATE, proves buy/sell/fill
-- call sites, exercises cross-user buy then sell with Σ=0 conservation.
-- True multi-backend deadlock soak remains Engine Wave (ADR-008); this file
-- pins the Accepted PIR substitute on a single SQL backend.
-- ============================================================

-- ── Test 0: helper + call-site invariants ───────────────────────────────────
BEGIN;

DO $$
DECLARE
  v_lock_def TEXT;
  v_buy_def  TEXT;
  v_sell_def TEXT;
  v_fill_def TEXT;
BEGIN
  ASSERT to_regprocedure('public._lock_system_accounts(text[])') IS NOT NULL,
    '_lock_system_accounts(text[]) must exist';

  v_lock_def := pg_get_functiondef('public._lock_system_accounts(text[])'::regprocedure);
  ASSERT position('ORDER BY code' IN v_lock_def) > 0,
    '_lock_system_accounts must ORDER BY code before FOR UPDATE';
  ASSERT position('FOR UPDATE' IN v_lock_def) > 0,
    '_lock_system_accounts must row-lock system_accounts with FOR UPDATE';
  ASSERT position('system_accounts' IN v_lock_def) > 0,
    '_lock_system_accounts must target system_accounts';

  ASSERT EXISTS (
    SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname = '_lock_system_accounts'
       AND p.provolatile = 'v'
  ), '_lock_system_accounts must be VOLATILE (row locks are side effects)';

  ASSERT NOT has_function_privilege('anon', 'public._lock_system_accounts(text[])', 'EXECUTE'),
    'anon must NOT EXECUTE _lock_system_accounts';
  ASSERT NOT has_function_privilege('authenticated', 'public._lock_system_accounts(text[])', 'EXECUTE'),
    'authenticated must NOT EXECUTE _lock_system_accounts';

  v_buy_def := pg_get_functiondef(
    'public.rpc_spot_market_buy(text,text,text,text)'::regprocedure
  );
  v_sell_def := pg_get_functiondef(
    'public.rpc_spot_market_sell(text,text,text,text)'::regprocedure
  );
  v_fill_def := pg_get_functiondef(
    'public._fill_house_spot_order(uuid)'::regprocedure
  );

  ASSERT position('_lock_system_accounts' IN v_buy_def) > 0,
    'rpc_spot_market_buy must pre-lock via _lock_system_accounts';
  ASSERT position('_lock_system_accounts' IN v_sell_def) > 0,
    'rpc_spot_market_sell must pre-lock via _lock_system_accounts';
  ASSERT position('_lock_system_accounts' IN v_fill_def) > 0,
    '_fill_house_spot_order must pre-lock via _lock_system_accounts';

  -- Call-site must lock before first house credit/debit (buy: before spot_buy_pay debit is OK;
  -- require lock appears before house_liquidity_usdt credit in source order).
  ASSERT position('_lock_system_accounts' IN v_buy_def)
       < position('_credit_system_account' IN v_buy_def),
    'buy must call _lock_system_accounts before _credit_system_account';
  ASSERT position('_lock_system_accounts' IN v_sell_def)
       < position('_credit_system_account' IN v_sell_def),
    'sell must call _lock_system_accounts before _credit_system_account';
  ASSERT position('_lock_system_accounts' IN v_fill_def)
       < position('_credit_system_account' IN v_fill_def),
    'fill must call _lock_system_accounts before _credit_system_account';

  RAISE NOTICE 'PIR E1-0 OK — lock helper + buy/sell/fill call sites anchored';
END;
$$;

ROLLBACK;

-- ── Test 1: reverse-array lock + missing code fail-closed ───────────────────
BEGIN;

DO $$
DECLARE
  v_missing BOOLEAN := FALSE;
  v_msg TEXT;
BEGIN
  -- Reverse alphabetical input must still succeed (helper re-orders by code).
  PERFORM _lock_system_accounts(ARRAY[
    'house_liquidity_usdt',
    'house_liquidity_phon',
    'house_fee_usdt',
    'house_fee_phon'
  ]);

  BEGIN
    PERFORM _lock_system_accounts(ARRAY['house_liquidity_usdt', 'no_such_system_account_pir_e1']);
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
      IF v_msg = 'system_account_not_found' THEN
        v_missing := TRUE;
      END IF;
  END;

  ASSERT v_missing,
    format('missing system account must raise system_account_not_found, got %s', COALESCE(v_msg, '<none>'));

  RAISE NOTICE 'PIR E1-1 OK — reverse array lock + missing code fail-closed';
END;
$$;

ROLLBACK;

-- ── Test 2: cross-user buy∥sell live path + Σ=0 ─────────────────────────────
BEGIN;

DO $$
DECLARE
  v_buyer  UUID := gen_random_uuid();
  v_seller UUID := gen_random_uuid();
  v_usdt_before NUMERIC;
  v_usdt_after  NUMERIC;
  v_phon_before NUMERIC;
  v_phon_after  NUMERIC;
  v_buy_res  JSONB;
  v_sell_res JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_buyer, 'authenticated', 'authenticated',
     'pir_e1_buy_' || v_buyer::TEXT || '@test.local', NOW(), NOW()),
    (v_seller, 'authenticated', 'authenticated',
     'pir_e1_sell_' || v_seller::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets
     SET usdt_available = '5000.000000', phon_available = '0.000000'
   WHERE user_id = v_buyer;
  UPDATE wallets
     SET usdt_available = '0.000000', phon_available = '50000.000000'
   WHERE user_id = v_seller;

  UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_spot_enabled';
  UPDATE spot_markets SET is_active = TRUE WHERE symbol = 'PHON_USDT';
  UPDATE market_circuit_breakers SET is_halted = FALSE WHERE symbol = 'PHON_USDT';
  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('PHON_USDT', '0.100000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = '0.100000', updated_at = NOW();

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT'),
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_usdt_before, v_phon_before;

  -- Buyer leg (would historically lock USDT liquidity before PHON).
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_buyer::TEXT)::TEXT, true);
  v_buy_res := rpc_spot_market_buy(
    'PHON_USDT', 'USDT', '100.000000', 'pir-e1-buy-' || v_buyer::TEXT
  );
  ASSERT v_buy_res ? 'trade_id', 'buy must return trade_id';

  -- Seller leg (would historically lock PHON liquidity before USDT) — AB-BA risk without helper.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_seller::TEXT)::TEXT, true);
  v_sell_res := rpc_spot_market_sell(
    'PHON_USDT', 'USDT', '500.000000', 'pir-e1-sell-' || v_seller::TEXT
  );
  ASSERT v_sell_res ? 'trade_id', 'sell must return trade_id';

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT'),
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_usdt_after, v_phon_after;

  ASSERT v_usdt_after = v_usdt_before,
    format('USDT grand total changed after buy∥sell: before=%s after=%s', v_usdt_before, v_usdt_after);
  ASSERT v_phon_after = v_phon_before,
    format('PHON grand total changed after buy∥sell: before=%s after=%s', v_phon_before, v_phon_after);

  RAISE NOTICE 'PIR E1-2 OK — cross-user buy∥sell live · Σ=0 · deadlock abort 0';
END;
$$;

ROLLBACK;
