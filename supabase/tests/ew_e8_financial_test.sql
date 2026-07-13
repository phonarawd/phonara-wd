-- E8 Financial — P2P · API keys · giftcard redeem reverse · conservation
BEGIN;

-- E8-0: system accounts + config + tables
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM system_accounts WHERE code = 'p2p_transfer_fee_phon'
  ), 'p2p_transfer_fee_phon missing';
  ASSERT EXISTS (
    SELECT 1 FROM system_accounts WHERE code = 'giftcard_redeem_hold_phon'
  ), 'giftcard_redeem_hold_phon missing';
  ASSERT EXISTS (
    SELECT 1 FROM system_accounts WHERE code = 'giftcard_redeem_settled_phon'
  ), 'giftcard_redeem_settled_phon missing';
  ASSERT EXISTS (
    SELECT 1 FROM app_config WHERE key = 'feature_p2p_transfer_enabled'
  ), 'p2p feature flag missing';
  ASSERT EXISTS (
    SELECT 1 FROM app_config WHERE key = 'feature_giftcard_redeem_enabled'
  ), 'giftcard_redeem feature flag missing';
  ASSERT to_regclass('public.p2p_transfers') IS NOT NULL, 'p2p_transfers missing';
  ASSERT to_regclass('public.trading_api_keys') IS NOT NULL, 'trading_api_keys missing';
  ASSERT to_regclass('public.giftcard_redeem_requests') IS NOT NULL, 'giftcard_redeem_requests missing';
  ASSERT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'rpc_transfer_to_user'
  ), 'rpc_transfer_to_user missing';
  ASSERT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'rpc_create_trading_api_key'
  ), 'rpc_create_trading_api_key missing';
  ASSERT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'rpc_create_giftcard_redeem_request'
  ), 'rpc_create_giftcard_redeem_request missing';
  RAISE NOTICE 'E8-0 OK — schema + config';
END;
$$;

-- E8-1: P2P happy path Σ=0 · self-transfer deny · insufficient
DO $$
DECLARE
  v_a UUID := gen_random_uuid();
  v_b UUID := gen_random_uuid();
  v_recipient TEXT;
  v_res JSONB;
  v_before_a NUMERIC;
  v_after_a NUMERIC;
  v_before_b NUMERIC;
  v_after_b NUMERIC;
  v_fee_before NUMERIC;
  v_fee_after NUMERIC;
  v_delta_a NUMERIC;
  v_delta_b NUMERIC;
  v_delta_fee NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_a, 'authenticated', 'authenticated', 'e8_a_' || v_a::TEXT || '@t.local', NOW(), NOW()),
    (v_b, 'authenticated', 'authenticated', 'e8_b_' || v_b::TEXT || '@t.local', NOW(), NOW());

  UPDATE profiles SET username = 'e8user_b_' || substr(replace(v_b::TEXT, '-', ''), 1, 8) WHERE id = v_b;
  SELECT username INTO v_recipient FROM profiles WHERE id = v_b;

  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = '0' WHERE key = 'p2p_transfer_fee_bps';
  UPDATE app_config SET value = 'true' WHERE key = 'feature_p2p_transfer_enabled';

  INSERT INTO sanctions_screenings (user_id, status, screened_at)
  VALUES (v_a, 'clear', NOW()), (v_b, 'clear', NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets
     SET phon_available = '1000.000000',
         phon_real_available = '1000.000000',
         phon_bonus_available = '0.000000',
         phon_locked = '0.000000'
   WHERE user_id = v_a;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_a::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  BEGIN
    PERFORM rpc_transfer_to_user(v_a::TEXT, '10.000000', NULL, 'e8-self');
    RAISE EXCEPTION 'self transfer must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%p2p_self_transfer%' THEN RAISE; END IF;
  END;

  BEGIN
    PERFORM rpc_transfer_to_user(v_recipient, '999999.000000', NULL, 'e8-insuf');
    RAISE EXCEPTION 'insufficient must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%insufficient%' THEN RAISE; END IF;
  END;

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SELECT phon_available::NUMERIC INTO v_before_a FROM wallets WHERE user_id = v_a;
  SELECT phon_available::NUMERIC INTO v_before_b FROM wallets WHERE user_id = v_b;
  SELECT balance::NUMERIC INTO v_fee_before
    FROM system_accounts WHERE code = 'p2p_transfer_fee_phon';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_a::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  v_res := rpc_transfer_to_user(
    v_recipient,
    '100.000000',
    'hello',
    'e8-p2p-1'
  );
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), format('transfer must ok %s', v_res);
  ASSERT (v_res->>'net_amount')::NUMERIC = 100, 'fee 0 → net=amount';

  v_res := rpc_transfer_to_user(
    v_recipient,
    '100.000000',
    'hello',
    'e8-p2p-1'
  );
  ASSERT COALESCE((v_res->>'idempotent')::BOOLEAN, FALSE), 'second call must be idempotent';

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SELECT phon_available::NUMERIC INTO v_after_a FROM wallets WHERE user_id = v_a;
  SELECT phon_available::NUMERIC INTO v_after_b FROM wallets WHERE user_id = v_b;
  SELECT balance::NUMERIC INTO v_fee_after
    FROM system_accounts WHERE code = 'p2p_transfer_fee_phon';

  v_delta_a := v_after_a - v_before_a;
  v_delta_b := v_after_b - v_before_b;
  v_delta_fee := v_fee_after - v_fee_before;
  ASSERT v_delta_a = -100, format('sender delta %s', v_delta_a);
  ASSERT v_delta_b = 100, format('recipient delta %s', v_delta_b);
  ASSERT v_delta_fee = 0, format('fee delta %s', v_delta_fee);
  ASSERT v_delta_a + v_delta_b + v_delta_fee = 0, 'P2P Σ != 0';

  RAISE NOTICE 'E8-1 OK — P2P transfer conservation';
END;
$$;

-- E8-2: API key create once-secret · list masked · revoke
DO $$
DECLARE
  v_u UUID := gen_random_uuid();
  v_res JSONB;
  v_key_id UUID;
  v_secret TEXT;
  v_list JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_u, 'authenticated', 'authenticated', 'e8_k_' || v_u::TEXT || '@t.local', NOW(), NOW());

  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_u::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  v_res := rpc_create_trading_api_key('bot-1', ARRAY['read', 'trade']::TEXT[]);
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), format('create key %s', v_res);
  ASSERT COALESCE((v_res->>'secret_shown_once')::BOOLEAN, FALSE), 'secret_shown_once';
  v_secret := v_res->>'api_key';
  v_key_id := (v_res->>'id')::UUID;
  ASSERT v_secret LIKE 'phon_live_%', 'secret prefix';
  ASSERT length(v_secret) > 20, 'secret length';

  v_list := rpc_list_trading_api_keys();
  ASSERT jsonb_array_length(v_list->'keys') = 1, 'list count';
  ASSERT (v_list->'keys'->0->>'api_key') IS NULL, 'list must not re-expose secret';
  ASSERT (v_list->'keys'->0->>'key_masked') LIKE '%…%', 'masked';

  v_res := rpc_revoke_trading_api_key(v_key_id);
  ASSERT COALESCE((v_res->>'revoked')::BOOLEAN, FALSE), 'revoke';

  v_list := rpc_list_trading_api_keys();
  ASSERT (v_list->'keys'->0->>'revoked_at') IS NOT NULL, 'revoked_at set';

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  ASSERT EXISTS (
    SELECT 1 FROM trading_api_keys
     WHERE id = v_key_id AND key_hash = _trading_api_key_hash(v_secret)
  ), 'hash must match secret';
  ASSERT NOT EXISTS (
    SELECT 1 FROM trading_api_keys WHERE id = v_key_id AND key_hash = v_secret
  ), 'plaintext must not be stored as hash';

  RAISE NOTICE 'E8-2 OK — trading API keys';
END;
$$;

-- E8-3: giftcard redeem create conservation · reject refund
DO $$
DECLARE
  v_u UUID := gen_random_uuid();
  v_admin UUID := gen_random_uuid();
  v_res JSONB;
  v_redeem_id UUID;
  v_before NUMERIC;
  v_after NUMERIC;
  v_hold_before NUMERIC;
  v_hold_after NUMERIC;
  v_fee_before NUMERIC;
  v_fee_after NUMERIC;
  v_cost NUMERIC;
  v_gross NUMERIC;
  v_fee NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_u, 'authenticated', 'authenticated', 'e8_r_' || v_u::TEXT || '@t.local', NOW(), NOW()),
    (v_admin, 'authenticated', 'authenticated', 'e8_adm_' || v_admin::TEXT || '@t.local', NOW(), NOW());

  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true'
    WHERE key IN ('feature_giftcard_redeem_enabled', 'feature_withdrawal_enabled');

  INSERT INTO sanctions_screenings (user_id, status, screened_at)
  VALUES (v_u, 'clear', NOW());

  UPDATE giftcard_fee_market
     SET enabled = TRUE, last_checked_at = NOW()
   WHERE kind = 'culture';

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;
  PERFORM rpc_service_ingest_usdt_krw_rate('1380.000000', 'e8-redeem-test');

  RESET ROLE;
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets
     SET phon_available = '50000.000000',
         phon_real_available = '50000.000000',
         phon_bonus_available = '0.000000',
         phon_locked = '0.000000'
   WHERE user_id = v_u;

  SELECT phon_available::NUMERIC INTO v_before FROM wallets WHERE user_id = v_u;
  SELECT balance::NUMERIC INTO v_hold_before
    FROM system_accounts WHERE code = 'giftcard_redeem_hold_phon';
  SELECT balance::NUMERIC INTO v_fee_before
    FROM system_accounts WHERE code = 'giftcard_fee_phon';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_u::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  v_res := rpc_preview_giftcard_redeem('culture', '10000');
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), format('preview %s', v_res);
  v_cost := (v_res->>'phon_cost')::NUMERIC;
  v_gross := (v_res->>'phon_gross')::NUMERIC;
  v_fee := (v_res->>'fee_phon')::NUMERIC;
  ASSERT abs(v_cost - (v_gross + v_fee)) < 0.000001, 'cost = gross + fee';

  v_res := rpc_create_giftcard_redeem_request('culture', '10000', 'e8-gcr-1');
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), format('create redeem %s', v_res);
  v_redeem_id := (v_res->>'redeem_id')::UUID;
  v_cost := (v_res->>'phon_cost')::NUMERIC;
  v_gross := (v_res->>'phon_gross')::NUMERIC;
  v_fee := (v_res->>'fee_phon')::NUMERIC;

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SELECT phon_available::NUMERIC INTO v_after FROM wallets WHERE user_id = v_u;
  SELECT balance::NUMERIC INTO v_hold_after
    FROM system_accounts WHERE code = 'giftcard_redeem_hold_phon';
  SELECT balance::NUMERIC INTO v_fee_after
    FROM system_accounts WHERE code = 'giftcard_fee_phon';

  ASSERT abs((v_before - v_after) - v_cost) < 0.000001,
    format('user debit %s vs %s', v_before - v_after, v_cost);
  ASSERT abs((v_hold_after - v_hold_before) - v_gross) < 0.000001, 'hold credit';
  ASSERT abs((v_fee_after - v_fee_before) - v_fee) < 0.000001, 'fee credit';
  ASSERT abs(
    (v_after - v_before) + (v_hold_after - v_hold_before) + (v_fee_after - v_fee_before)
  ) < 0.000001, 'redeem create Σ != 0';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', v_admin::TEXT,
      'role', 'authenticated',
      'aal', 'aal2'
    )::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;
  v_res := rpc_admin_reject_giftcard_redeem(v_redeem_id, 'e8 reject test');
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), format('reject %s', v_res);

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SELECT phon_available::NUMERIC INTO v_after FROM wallets WHERE user_id = v_u;
  ASSERT abs(v_after - v_before) < 0.000001,
    format('full refund expected %s vs %s', v_after, v_before);

  RAISE NOTICE 'E8-3 OK — giftcard redeem conservation + reject';
END;
$$;

-- E8-4: grants — anon deny · authenticated EXECUTE client RPCs
DO $$
BEGIN
  ASSERT NOT has_table_privilege('anon', 'public.p2p_transfers', 'SELECT'),
    'anon must NOT SELECT p2p_transfers';
  ASSERT has_table_privilege('authenticated', 'public.p2p_transfers', 'SELECT'),
    'authenticated may SELECT p2p_transfers';
  ASSERT NOT has_table_privilege('authenticated', 'public.p2p_transfers', 'INSERT'),
    'authenticated must NOT INSERT p2p_transfers';

  ASSERT NOT has_table_privilege('anon', 'public.trading_api_keys', 'SELECT'),
    'anon must NOT SELECT trading_api_keys';
  ASSERT has_table_privilege('authenticated', 'public.trading_api_keys', 'SELECT'),
    'authenticated may SELECT trading_api_keys';
  ASSERT NOT has_table_privilege('authenticated', 'public.trading_api_keys', 'INSERT'),
    'authenticated must NOT INSERT trading_api_keys';

  ASSERT NOT has_table_privilege('anon', 'public.giftcard_redeem_requests', 'SELECT'),
    'anon must NOT SELECT giftcard_redeem_requests';
  ASSERT has_table_privilege('authenticated', 'public.giftcard_redeem_requests', 'SELECT'),
    'authenticated may SELECT giftcard_redeem_requests';
  ASSERT NOT has_table_privilege('authenticated', 'public.giftcard_redeem_requests', 'INSERT'),
    'authenticated must NOT INSERT giftcard_redeem_requests';

  ASSERT has_function_privilege('authenticated', 'public.rpc_transfer_to_user(text,text,text,text)', 'EXECUTE'),
    'authenticated EXECUTE rpc_transfer_to_user';
  ASSERT NOT has_function_privilege('anon', 'public.rpc_transfer_to_user(text,text,text,text)', 'EXECUTE'),
    'anon deny rpc_transfer_to_user';
  ASSERT has_function_privilege('authenticated', 'public.rpc_create_trading_api_key(text,text[])', 'EXECUTE'),
    'authenticated EXECUTE rpc_create_trading_api_key';
  ASSERT NOT has_function_privilege(
    'authenticated', 'public._p2p_resolve_recipient(text)', 'EXECUTE'
  ), 'authenticated must NOT EXECUTE _p2p_resolve_recipient';

  RAISE NOTICE 'E8-4 OK — grants/RLS inventory';
END;
$$;

ROLLBACK;
