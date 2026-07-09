-- ============================================================
-- E4 — dual-session wallet/position race guard (Launch Engine)
-- ============================================================
-- Go/No-Go FAIL #4 closure: anchors FOR UPDATE / advisory lock invariants
-- on wallet + position settlement paths, then exercises live race branches
-- (sequential dual-session simulation) with grand-total conservation Σ=0.
--
-- True HTTP parallel coverage: scripts/pentest/lib/attacks.ts (Attack 1/2).
-- Local SQL runner uses one backend per file (see oi_cap_race_test.sql).
-- ============================================================

-- ── Test 0: wallet + position lock invariants ───────────────────────────────
BEGIN;

DO $$
DECLARE
  v_lock_def   TEXT;
  v_debit_def  TEXT;
  v_credit_def TEXT;
  v_settle_def TEXT;
BEGIN
  v_lock_def := pg_get_functiondef(
    'public._lock_wallet_internal(uuid,currency,text,text,text)'::regprocedure
  );
  v_debit_def := pg_get_functiondef(
    'public._debit_wallet_internal(uuid,currency,text,text,text)'::regprocedure
  );
  v_credit_def := pg_get_functiondef(
    'public._credit_wallet_internal(uuid,currency,text,text,text)'::regprocedure
  );
  v_settle_def := pg_get_functiondef(
    'public._settle_futures_position(uuid,numeric,position_status,text)'::regprocedure
  );

  ASSERT v_lock_def LIKE '%FROM wallets WHERE user_id = p_user_id FOR UPDATE%',
    '_lock_wallet_internal must row-lock wallets with FOR UPDATE';
  ASSERT v_debit_def LIKE '%FROM wallets WHERE user_id = p_user_id FOR UPDATE%',
    '_debit_wallet_internal must row-lock wallets with FOR UPDATE';
  ASSERT v_credit_def LIKE '%FROM wallets WHERE user_id = p_user_id FOR UPDATE%',
    '_credit_wallet_internal must row-lock wallets with FOR UPDATE';
  ASSERT v_settle_def LIKE '%FROM futures_positions WHERE id = p_pos_id FOR UPDATE%',
    '_settle_futures_position must row-lock futures_positions with FOR UPDATE';

  ASSERT position(
    'pg_advisory_xact_lock'
    IN pg_get_functiondef('public._assert_position_limits(uuid,text,numeric)'::regprocedure)
  ) > 0, '_assert_position_limits must take an advisory transaction lock';

  RAISE NOTICE 'CONCURRENT RACE E4-0 OK — wallet FOR UPDATE + position FOR UPDATE + OI advisory lock anchored';
END;
$$;

ROLLBACK;

-- ── Test 1: wallet double-lock race (insufficient_available on second leg) ──
BEGIN;

DO $$
DECLARE
  v_uid          UUID := gen_random_uuid();
  v_usdt_before  NUMERIC;
  v_usdt_after   NUMERIC;
  v_phon_before  NUMERIC;
  v_phon_after   NUMERIC;
  v_blocked      BOOLEAN := FALSE;
  v_msg          TEXT;
  v_lock_count   INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'race_wd_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '100.000000', usdt_locked = '0.000000'
   WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT'),
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_usdt_before, v_phon_before;

  PERFORM _lock_wallet_internal(
    v_uid, 'USDT', '70.000000', 'race_test_lock_a', 'race-lock-a-' || v_uid::TEXT
  );

  BEGIN
    PERFORM _lock_wallet_internal(
      v_uid, 'USDT', '70.000000', 'race_test_lock_b', 'race-lock-b-' || v_uid::TEXT
    );
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
      IF v_msg = 'insufficient_available' THEN v_blocked := TRUE; END IF;
  END;

  ASSERT v_blocked,
    format('second concurrent lock must raise insufficient_available, got %s', COALESCE(v_msg, '<none>'));

  SELECT COUNT(*)::INT INTO v_lock_count
    FROM wallet_ledger
   WHERE user_id = v_uid
     AND direction = 'lock'
     AND reason_code = 'race_test_lock_a';
  ASSERT v_lock_count = 1, format('only first lock leg must persist, got %s', v_lock_count);

  ASSERT (SELECT usdt_locked::NUMERIC FROM wallets WHERE user_id = v_uid) = 70.000000,
    'wallet locked balance must reflect first lock only';

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT'),
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_usdt_after, v_phon_after;

  ASSERT v_usdt_after = v_usdt_before,
    format('USDT grand total changed after wallet lock race: before=%s after=%s', v_usdt_before, v_usdt_after);
  ASSERT v_phon_after = v_phon_before,
    format('PHON grand total changed after wallet lock race: before=%s after=%s', v_phon_before, v_phon_after);
  ASSERT NOT EXISTS (SELECT 1 FROM verify_ledger_hash_chain(v_uid)),
    'wallet ledger hash chain broken after wallet lock race';

  RAISE NOTICE 'CONCURRENT RACE E4-1 OK — wallet double-lock blocked with Σ=0';
END;
$$;

ROLLBACK;

-- ── Test 2: futures margin double-open race ─────────────────────────────────
BEGIN;

DO $$
DECLARE
  v_uid          UUID := gen_random_uuid();
  v_pos          JSONB;
  v_blocked      BOOLEAN := FALSE;
  v_msg          TEXT;
  v_open_count   INT;
  v_usdt_before  NUMERIC;
  v_usdt_after   NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'race_fut_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '100.000000', usdt_locked = '0.000000'
   WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_futures_enabled';
  UPDATE futures_markets
     SET is_active = TRUE, max_leverage = 20, max_user_positions = 100, max_open_interest = '1000000.000000'
   WHERE symbol = 'PHONUSDT-PERP';
  UPDATE market_circuit_breakers SET is_halted = FALSE WHERE symbol = 'PHONUSDT-PERP';
  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('PHONUSDT-PERP', '0.010000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = '0.010000', updated_at = NOW();

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_before;

  v_pos := rpc_open_futures_position(
    'PHONUSDT-PERP', 'long', 'USDT', '90.000000', '5', NULL, NULL,
    'race-open-1-' || v_uid::TEXT
  );
  ASSERT (v_pos->>'position_id') IS NOT NULL, 'first futures open must succeed';

  BEGIN
    PERFORM rpc_open_futures_position(
      'PHONUSDT-PERP', 'long', 'USDT', '90.000000', '5', NULL, NULL,
      'race-open-2-' || v_uid::TEXT
    );
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
      IF v_msg = 'insufficient_available' THEN v_blocked := TRUE; END IF;
  END;

  ASSERT v_blocked,
    format('second concurrent futures open must raise insufficient_available, got %s', COALESCE(v_msg, '<none>'));

  SELECT COUNT(*)::INT INTO v_open_count
    FROM futures_positions
   WHERE user_id = v_uid AND status = 'open';
  ASSERT v_open_count = 1,
    format('only one open position must remain after margin race, got %s', v_open_count);

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_after;

  ASSERT v_usdt_after = v_usdt_before,
    format('USDT grand total changed after futures open race: before=%s after=%s', v_usdt_before, v_usdt_after);
  ASSERT NOT EXISTS (SELECT 1 FROM verify_ledger_hash_chain(v_uid)),
    'wallet ledger hash chain broken after futures open race';

  RAISE NOTICE 'CONCURRENT RACE E4-2 OK — futures margin double-open blocked with Σ=0';
END;
$$;

ROLLBACK;

-- ── Test 3: dual-session close (user) vs liquidation sweep (service) ────────
BEGIN;

DO $$
DECLARE
  v_uid          UUID := gen_random_uuid();
  v_pos          JSONB;
  v_pos_id       UUID;
  v_sweep        JSONB;
  v_events       INT;
  v_usdt_before  NUMERIC;
  v_usdt_after   NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'race_close_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '1000000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly');
  UPDATE app_config SET value = 'true' WHERE key IN ('feature_futures_enabled', 'consent_gate_enabled');
  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'test', TRUE
  FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']) AS doc_type
  ON CONFLICT DO NOTHING;

  UPDATE futures_markets
     SET is_active = TRUE, max_leverage = 100, max_user_positions = 100, max_open_interest = '1000000.000000'
   WHERE symbol = 'PHONUSDT-PERP';
  UPDATE market_circuit_breakers SET is_halted = FALSE WHERE symbol = 'PHONUSDT-PERP';
  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('PHONUSDT-PERP', '0.010000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = '0.010000', updated_at = NOW();

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_before;

  v_pos := rpc_open_futures_position(
    'PHONUSDT-PERP', 'long', 'USDT', '1000.000000', '10', NULL, NULL,
    'race-close-' || v_uid::TEXT
  );
  v_pos_id := (v_pos->>'position_id')::UUID;

  UPDATE oracle_prices SET price = '0.010500', updated_at = NOW()
   WHERE symbol = 'PHONUSDT-PERP';
  PERFORM rpc_close_futures_position(v_pos_id);

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_after;

  ASSERT v_usdt_after = v_usdt_before,
    format('USDT not conserved after user close: before=%s after=%s', v_usdt_before, v_usdt_after);

  UPDATE oracle_prices SET price = '0.009000', updated_at = NOW()
   WHERE symbol = 'PHONUSDT-PERP';
  PERFORM set_config('request.jwt.claims', '{}', true);
  v_sweep := rpc_run_liquidations();

  SELECT COUNT(*) INTO v_events FROM position_ledger
   WHERE position_id = v_pos_id AND event IN ('close', 'liquidate', 'auto_liquidate');

  ASSERT (v_sweep->>'liquidated')::INT = 0,
    'service liquidation sweep must not settle an already-closed position: ' || v_sweep::TEXT;
  ASSERT v_events = 1, 'expected exactly one settlement event after close/sweep race, got ' || v_events;

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_after;

  ASSERT v_usdt_after = v_usdt_before,
    format('USDT changed after post-close sweep: before=%s after=%s', v_usdt_before, v_usdt_after);
  ASSERT NOT EXISTS (SELECT 1 FROM verify_ledger_hash_chain(v_uid)),
    'wallet ledger hash chain broken after close/sweep dual-session race';

  RAISE NOTICE 'CONCURRENT RACE E4-3 OK — user close then service sweep did not double-settle (Σ=0)';
END;
$$;

ROLLBACK;

-- ── Test 4: withdrawal double-lock race (user session) ──────────────────────
BEGIN;

DO $$
DECLARE
  v_uid          UUID := gen_random_uuid();
  v_res          JSONB;
  v_blocked      BOOLEAN := FALSE;
  v_msg          TEXT;
  v_pending      INT;
  v_phon_before  NUMERIC;
  v_phon_after   NUMERIC;
  v_locked       NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'race_wdw_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  UPDATE profiles SET kyc_tier = 'id_verified' WHERE id = v_uid;
  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'test', TRUE
  FROM unnest(ARRAY[
    'terms_of_service','privacy_policy','risk_disclosure','age_verification'
  ]::TEXT[]) AS doc_type;
  INSERT INTO sanctions_screenings (user_id, status, screened_at)
  VALUES (v_uid, 'clear', NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  PERFORM _credit_wallet_internal(v_uid, 'PHON', '100.000000',
    'test_funding', 'race-wd-fund-' || v_uid::TEXT);
  PERFORM _debit_system_account('reward_issuance_phon', '100.000000',
    'test_funding', v_uid, 'race-wd-fund-' || v_uid::TEXT, NULL);

  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled', 'withdrawal_mfa_step_up_enabled');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_withdrawal_enabled';
  UPDATE treasury_reserves SET real_balance = '99999999.000000' WHERE currency = 'PHON';
  UPDATE app_config SET value = '0' WHERE key IN (
    'aml_min_account_age_hours', 'aml_rapid_credit_hours', 'aml_kyc_approval_cooldown_hours'
  );
  PERFORM rpc_run_reconciliation();

  UPDATE exchange_rate_snapshots SET is_active = FALSE
   WHERE base_currency = 'PHON' AND quote_currency = 'KRW';
  INSERT INTO exchange_rate_snapshots (base_currency, quote_currency, rate, source, is_active)
  VALUES ('PHON', 'KRW', '10.000000', 'race_wd_test', TRUE);

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  v_res := rpc_request_withdrawal(
    'PHON', '80.000000',
    jsonb_build_object('type', 'bank', 'chain', 'BANK', 'account', '110123456789', 'address', '110123456789'),
    'race-wd-1-' || v_uid::TEXT, NULL
  );
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE),
    format('first withdrawal lock must succeed, got %s', v_res);

  BEGIN
    PERFORM rpc_request_withdrawal(
      'PHON', '80.000000',
      jsonb_build_object('type', 'bank', 'chain', 'BANK', 'account', '110123456789', 'address', '110123456789'),
      'race-wd-2-' || v_uid::TEXT, NULL
    );
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
      IF v_msg = 'insufficient_available' THEN v_blocked := TRUE; END IF;
  END;

  ASSERT v_blocked,
    format('second concurrent withdrawal must raise insufficient_available, got %s', COALESCE(v_msg, '<none>'));

  SELECT phon_locked::NUMERIC INTO v_locked FROM wallets WHERE user_id = v_uid;
  ASSERT v_locked = 80.000000,
    format('only first withdrawal should lock funds, locked=%s', v_locked);

  SELECT COUNT(*)::INT INTO v_pending
    FROM withdrawal_requests
   WHERE user_id = v_uid AND status = 'pending';
  ASSERT v_pending = 1,
    format('only one pending withdrawal must exist after race, got %s', v_pending);

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  ASSERT v_phon_after = v_phon_before,
    format('PHON grand total changed after withdrawal race: before=%s after=%s', v_phon_before, v_phon_after);
  ASSERT NOT EXISTS (SELECT 1 FROM verify_ledger_hash_chain(v_uid)),
    'wallet ledger hash chain broken after withdrawal race';

  RAISE NOTICE 'CONCURRENT RACE E4-4 OK — withdrawal double-lock blocked with Σ=0';
END;
$$;

ROLLBACK;
