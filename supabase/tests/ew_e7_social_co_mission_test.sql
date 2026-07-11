-- E7 Social co-mission + whale — invite/accept/complete · affiliate · threshold · conservation
BEGIN;

-- E7-0: enums + config seed
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = 'co_mission_code' AND e.enumlabel = 'co_share_referral'
  ), 'co_share_referral enum missing';
  ASSERT EXISTS (
    SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = 'whale_mission_code' AND e.enumlabel = 'whale_deposit_1m'
  ), 'whale_deposit_1m enum missing';
  ASSERT EXISTS (
    SELECT 1 FROM app_config WHERE key = 'co_share_referral_reward_phon'
  ), 'co reward config missing';
  ASSERT EXISTS (
    SELECT 1 FROM app_config WHERE key = 'whale_deposit_1m_threshold_phon'
  ), 'whale threshold config missing';
  ASSERT _is_reward_issuance_reason('co_mission_reward'), 'co_mission_reward must be issuance';
  ASSERT _is_reward_issuance_reason('whale_mission_reward'), 'whale_mission_reward must be issuance';
  RAISE NOTICE 'E7-0 OK — enums + config';
END;
$$;

-- E7-1: invite requires affiliate link; accept + complete grants both
DO $$
DECLARE
  v_a UUID := gen_random_uuid();
  v_b UUID := gen_random_uuid();
  v_stranger UUID := gen_random_uuid();
  v_window TEXT;
  v_session_id UUID;
  v_res JSONB;
  v_before_a NUMERIC;
  v_after_a NUMERIC;
  v_before_b NUMERIC;
  v_after_b NUMERIC;
  v_sys_before NUMERIC;
  v_sys_after NUMERIC;
  v_claims INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_a, 'authenticated', 'authenticated', 'e7_a_' || v_a::TEXT || '@t.local', NOW(), NOW()),
    (v_b, 'authenticated', 'authenticated', 'e7_b_' || v_b::TEXT || '@t.local', NOW(), NOW()),
    (v_stranger, 'authenticated', 'authenticated', 'e7_s_' || v_stranger::TEXT || '@t.local', NOW(), NOW());

  PERFORM _affiliate_create_relationship(v_b, v_a);

  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  v_window := _co_mission_day_window();

  -- Stranger invite must fail
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_a::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM rpc_invite_co_mission('co_share_referral', v_stranger);
    RAISE EXCEPTION 'stranger invite must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%co_mission_not_linked%' THEN
        RAISE;
      END IF;
  END;

  v_res := rpc_invite_co_mission('co_share_referral', v_b);
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), format('invite must ok, got %s', v_res);
  v_session_id := (v_res->>'session_id')::UUID;
  ASSERT v_res->>'status' = 'pending', 'invite status pending';

  -- Partner accepts
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_b::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  v_res := rpc_accept_co_mission(v_session_id);
  ASSERT v_res->>'status' = 'active', format('accept must active, got %s', v_res);

  -- Seed viral share claims for both (eligibility)
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  INSERT INTO viral_mission_claims (user_id, mission, window_key, phon_awarded)
  VALUES
    (v_a, 'share_referral_link', v_window || ':1', '0.000000'),
    (v_b, 'share_referral_link', v_window || ':1', '0.000000');

  SELECT phon_available::NUMERIC INTO v_before_a FROM wallets WHERE user_id = v_a;
  SELECT phon_available::NUMERIC INTO v_before_b FROM wallets WHERE user_id = v_b;
  SELECT balance::NUMERIC INTO v_sys_before
    FROM system_accounts WHERE code = 'reward_issuance_phon';

  -- Both mark complete
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_a::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;
  v_res := rpc_complete_co_mission(v_session_id);
  ASSERT COALESCE((v_res->>'waiting_partner')::BOOLEAN, FALSE), 'first complete waits partner';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_b::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  v_res := rpc_complete_co_mission(v_session_id);
  ASSERT v_res->>'status' = 'completed', format('second complete must finish, got %s', v_res);

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  SELECT phon_available::NUMERIC INTO v_after_a FROM wallets WHERE user_id = v_a;
  SELECT phon_available::NUMERIC INTO v_after_b FROM wallets WHERE user_id = v_b;
  SELECT balance::NUMERIC INTO v_sys_after
    FROM system_accounts WHERE code = 'reward_issuance_phon';

  ASSERT v_after_a - v_before_a = 50, format('A reward delta, got %s', v_after_a - v_before_a);
  ASSERT v_after_b - v_before_b = 50, format('B reward delta, got %s', v_after_b - v_before_b);
  -- Mint debit goes more negative by 100
  ASSERT v_sys_before - v_sys_after = 100, format('system mint Δ must be 100, got %s', v_sys_before - v_sys_after);

  SELECT COUNT(*)::INT INTO v_claims FROM co_mission_claims WHERE session_id = v_session_id;
  ASSERT v_claims = 2, format('expected 2 claims, got %s', v_claims);

  RAISE NOTICE 'E7-1 OK — co-mission grant + conservation';
END;
$$;

-- E7-2: complete without viral share → not eligible
DO $$
DECLARE
  v_a UUID := gen_random_uuid();
  v_b UUID := gen_random_uuid();
  v_session_id UUID;
  v_res JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_a, 'authenticated', 'authenticated', 'e7_ne_a_' || v_a::TEXT || '@t.local', NOW(), NOW()),
    (v_b, 'authenticated', 'authenticated', 'e7_ne_b_' || v_b::TEXT || '@t.local', NOW(), NOW());

  PERFORM _affiliate_create_relationship(v_b, v_a);
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_a::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;
  v_res := rpc_invite_co_mission('co_share_referral', v_b);
  v_session_id := (v_res->>'session_id')::UUID;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_b::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  PERFORM rpc_accept_co_mission(v_session_id);
  PERFORM rpc_complete_co_mission(v_session_id);

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_a::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  BEGIN
    PERFORM rpc_complete_co_mission(v_session_id);
    RAISE EXCEPTION 'must fail without share eligibility';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%co_mission_initiator_not_eligible%'
         AND SQLERRM NOT LIKE '%co_mission_partner_not_eligible%' THEN
        RAISE;
      END IF;
  END;

  RAISE NOTICE 'E7-2 OK — eligibility gate';
END;
$$;

-- E7-3: whale threshold claim + deny below threshold
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_res JSONB;
  v_before NUMERIC;
  v_after NUMERIC;
  v_sys_before NUMERIC;
  v_sys_after NUMERIC;
  v_idem TEXT := 'e7_whale_dep_' || gen_random_uuid()::TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 'e7_w_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  -- Below threshold
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM rpc_claim_whale_mission('whale_deposit_1m');
    RAISE EXCEPTION 'below threshold must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%whale_threshold_not_met%' THEN
        RAISE;
      END IF;
  END;

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  -- Seed 1M PHON krw deposit credit with conservation counterparty
  PERFORM _credit_wallet_internal(
    v_uid, 'PHON', '1000000.000000', 'krw_deposit_credit', v_idem
  );
  PERFORM _debit_system_account(
    'deposit_conversion_phon', '1000000.000000', 'krw_deposit_credit',
    v_uid, v_idem, NULL
  );

  SELECT phon_available::NUMERIC INTO v_before FROM wallets WHERE user_id = v_uid;
  SELECT balance::NUMERIC INTO v_sys_before
    FROM system_accounts WHERE code = 'reward_issuance_phon';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;
  v_res := rpc_claim_whale_mission('whale_deposit_1m', 'e7-whale-req-1');
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), format('whale claim must ok, got %s', v_res);
  ASSERT v_res->>'phon_awarded' = '10000.000000', format('reward, got %s', v_res->>'phon_awarded');

  BEGIN
    PERFORM rpc_claim_whale_mission('whale_deposit_1m');
    RAISE EXCEPTION 'double claim must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%whale_mission_already_claimed%' THEN
        RAISE;
      END IF;
  END;

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  SELECT phon_available::NUMERIC INTO v_after FROM wallets WHERE user_id = v_uid;
  SELECT balance::NUMERIC INTO v_sys_after
    FROM system_accounts WHERE code = 'reward_issuance_phon';

  ASSERT v_after - v_before = 10000, format('whale delta, got %s', v_after - v_before);
  ASSERT v_sys_before - v_sys_after = 10000, format('whale mint Δ, got %s', v_sys_before - v_sys_after);

  RAISE NOTICE 'E7-3 OK — whale threshold + conservation';
END;
$$;

-- E7-4: anon cannot execute client RPCs
DO $$
DECLARE
  v_ok BOOLEAN := FALSE;
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM rpc_get_co_mission_status();
    RAISE EXCEPTION 'anon status must fail';
  EXCEPTION
    WHEN OTHERS THEN
      v_ok := TRUE;
  END;
  ASSERT v_ok, 'anon co status must be denied';
  RAISE NOTICE 'E7-4 OK — anon deny';
END;
$$;

ROLLBACK;
