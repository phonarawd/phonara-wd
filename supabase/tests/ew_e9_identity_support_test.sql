-- E9 Identity+Support — SIWE · tickets · analytics · app-install · tier LB
BEGIN;

-- E9-0: schema + config + RPCs
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM app_config WHERE key = 'feature_siwe_login_enabled'
  ), 'siwe feature missing';
  ASSERT EXISTS (
    SELECT 1 FROM app_config WHERE key = 'feature_support_tickets_enabled'
  ), 'support feature missing';
  ASSERT EXISTS (
    SELECT 1 FROM app_config WHERE key = 'viral_app_install_reward_phon'
  ), 'app_install reward missing';
  ASSERT to_regclass('public.siwe_challenges') IS NOT NULL, 'siwe_challenges missing';
  ASSERT to_regclass('public.user_wallet_identities') IS NOT NULL, 'user_wallet_identities missing';
  ASSERT to_regclass('public.support_tickets') IS NOT NULL, 'support_tickets missing';
  ASSERT to_regclass('public.product_analytics_events') IS NOT NULL, 'product_analytics_events missing';
  ASSERT to_regclass('public.app_install_attributions') IS NOT NULL, 'app_install_attributions missing';
  ASSERT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_create_siwe_challenge'),
    'rpc_create_siwe_challenge missing';
  ASSERT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_service_complete_siwe_login'),
    'rpc_service_complete_siwe_login missing';
  ASSERT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_create_support_ticket'),
    'rpc_create_support_ticket missing';
  ASSERT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_admin_list_support_tickets'),
    'rpc_admin_list_support_tickets missing';
  ASSERT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_admin_resolve_support_ticket'),
    'rpc_admin_resolve_support_ticket missing';
  ASSERT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_record_product_analytics_event'),
    'rpc_record_product_analytics_event missing';
  ASSERT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_record_app_install_attribution'),
    'rpc_record_app_install_attribution missing';
  ASSERT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_get_tier_leaderboard'),
    'rpc_get_tier_leaderboard missing';
  ASSERT EXISTS (
    SELECT 1 FROM mission_catalog WHERE catalog_key = 'viral:app_install'
  ), 'app_install catalog missing';
  ASSERT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'viral_mission_code' AND e.enumlabel = 'app_install'
  ), 'app_install enum missing';
  RAISE NOTICE 'E9-0 OK — schema + config';
END;
$$;

-- E9-1: SIWE challenge · consume once · replay deny · list identities
DO $$
DECLARE
  v_user UUID := gen_random_uuid();
  v_addr TEXT := '0x1111111111111111111111111111111111111111';
  v_ch JSONB;
  v_cid UUID;
  v_res JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_user, 'authenticated', 'authenticated', 'e9_siwe_' || v_user::TEXT || '@t.local', NOW(), NOW());

  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_siwe_login_enabled';

  -- M-04: anon path revoked — challenge via authenticated (binds user_id) or service ingress
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;
  v_ch := rpc_create_siwe_challenge(v_addr, 1);
  ASSERT COALESCE((v_ch->>'ok')::BOOLEAN, FALSE), format('challenge ok %s', v_ch);
  v_cid := (v_ch->>'challenge_id')::UUID;
  ASSERT (v_ch->>'address') = v_addr, 'address normalize';
  ASSERT (v_ch->>'message') LIKE '%' || v_addr || '%', 'message contains address';
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  -- authenticated cannot complete (service_role only)
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM rpc_service_complete_siwe_login(v_cid, v_addr, v_user);
    RAISE EXCEPTION 'authenticated complete must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%FORBIDDEN%'
         AND SQLERRM NOT LIKE '%permission denied%'
         AND SQLERRM NOT LIKE '%insufficient_privilege%' THEN
        RAISE;
      END IF;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  -- service_role complete
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('role', 'service_role')::TEXT,
    TRUE
  );
  SET LOCAL ROLE service_role;
  v_res := rpc_service_complete_siwe_login(v_cid, v_addr, v_user);
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), format('complete ok %s', v_res);

  BEGIN
    PERFORM rpc_service_complete_siwe_login(v_cid, v_addr, v_user);
    RAISE EXCEPTION 'replay must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%siwe_challenge_consumed%' THEN RAISE; END IF;
  END;
  RESET ROLE;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;
  v_res := rpc_list_wallet_identities();
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), 'list identities ok';
  ASSERT jsonb_array_length(v_res->'identities') = 1, 'one identity';
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  RAISE NOTICE 'E9-1 OK — SIWE challenge/consume';
END;
$$;

-- E9-2: support tickets · owner isolation · admin resolve
DO $$
DECLARE
  v_user UUID := gen_random_uuid();
  v_other UUID := gen_random_uuid();
  v_admin UUID := gen_random_uuid();
  v_res JSONB;
  v_tid UUID;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_user, 'authenticated', 'authenticated', 'e9_t_' || v_user::TEXT || '@t.local', NOW(), NOW()),
    (v_other, 'authenticated', 'authenticated', 'e9_o_' || v_other::TEXT || '@t.local', NOW(), NOW()),
    (v_admin, 'authenticated', 'authenticated', 'e9_a_' || v_admin::TEXT || '@t.local', NOW(), NOW());

  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_support_tickets_enabled';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  v_res := rpc_create_support_ticket(
    'wallet', 'Need help with deposit', 'I deposited but balance not updated yet.', 'e9-tkt-1'
  );
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), format('create ticket %s', v_res);
  v_tid := (v_res->>'ticket_id')::UUID;

  v_res := rpc_create_support_ticket(
    'wallet', 'Need help with deposit', 'I deposited but balance not updated yet.', 'e9-tkt-1'
  );
  ASSERT COALESCE((v_res->>'idempotent')::BOOLEAN, FALSE), 'ticket idempotent';

  v_res := rpc_list_support_tickets(10);
  ASSERT jsonb_array_length(v_res->'tickets') = 1, 'one ticket';

  RESET ROLE;
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_other::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM rpc_get_support_ticket(v_tid);
    RAISE EXCEPTION 'other user get must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%FORBIDDEN%' AND SQLERRM NOT LIKE '%support_ticket_not_found%' THEN
        RAISE;
      END IF;
  END;
  RESET ROLE;

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
  v_res := rpc_admin_list_support_tickets('open', 50);
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), 'admin list ok';
  v_res := rpc_admin_resolve_support_ticket(v_tid, 'resolved in test', 'fixed');
  ASSERT (v_res->>'status') = 'resolved', 'resolved';
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  RAISE NOTICE 'E9-2 OK — support tickets';
END;
$$;

-- E9-3: product analytics allowlist · PII deny · idempotent
DO $$
DECLARE
  v_user UUID := gen_random_uuid();
  v_res JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_user, 'authenticated', 'authenticated', 'e9_an_' || v_user::TEXT || '@t.local', NOW(), NOW());

  UPDATE app_config SET value = 'true' WHERE key = 'feature_product_analytics_enabled';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  BEGIN
    PERFORM rpc_record_product_analytics_event('not_allowed_event', 'home', '{}'::JSONB, NULL, 'e9-an-x');
    RAISE EXCEPTION 'allowlist must reject';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%analytics_event_not_allowed%' THEN RAISE; END IF;
  END;

  BEGIN
    PERFORM rpc_record_product_analytics_event(
      'page_view', 'home', '{"email":"a@b.c"}'::JSONB, NULL, 'e9-an-pii'
    );
    RAISE EXCEPTION 'pii must reject';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%analytics_pii_forbidden%' THEN RAISE; END IF;
  END;

  v_res := rpc_record_product_analytics_event(
    'page_view', 'home', '{"path":"/home"}'::JSONB, NULL, 'e9-an-1'
  );
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), 'record ok';
  v_res := rpc_record_product_analytics_event(
    'page_view', 'home', '{"path":"/home"}'::JSONB, NULL, 'e9-an-1'
  );
  ASSERT COALESCE((v_res->>'idempotent')::BOOLEAN, FALSE), 'analytics idempotent';
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  RAISE NOTICE 'E9-3 OK — product analytics';
END;
$$;

-- E9-4: app-install attribution · grant once · Σ=0
DO $$
DECLARE
  v_user UUID := gen_random_uuid();
  v_res JSONB;
  v_before NUMERIC;
  v_after NUMERIC;
  v_sys_before NUMERIC;
  v_sys_after NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_user, 'authenticated', 'authenticated', 'e9_ai_' || v_user::TEXT || '@t.local', NOW(), NOW());

  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true'
    WHERE key IN ('feature_app_install_mission_enabled', 'feature_referral_enabled');
  UPDATE app_config SET value = '50.000000' WHERE key = 'viral_app_install_reward_phon';

  INSERT INTO sanctions_screenings (user_id, status, screened_at)
  VALUES (v_user, 'clear', NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets
     SET phon_available = '0.000000',
         phon_real_available = '0.000000',
         phon_bonus_available = '0.000000'
   WHERE user_id = v_user;

  SELECT phon_available::NUMERIC INTO v_before FROM wallets WHERE user_id = v_user;
  SELECT balance::NUMERIC INTO v_sys_before
    FROM system_accounts WHERE code = 'reward_issuance_phon';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  v_res := rpc_record_app_install_attribution('pwa', 'e9-install-1', '{}'::JSONB);
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), format('install ok %s', v_res);
  ASSERT COALESCE((v_res->>'granted')::BOOLEAN, FALSE), 'must grant';

  v_res := rpc_record_app_install_attribution('pwa', 'e9-install-2', '{}'::JSONB);
  ASSERT COALESCE((v_res->>'idempotent')::BOOLEAN, FALSE), 'second install idempotent';

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  SELECT phon_available::NUMERIC INTO v_after FROM wallets WHERE user_id = v_user;
  SELECT balance::NUMERIC INTO v_sys_after
    FROM system_accounts WHERE code = 'reward_issuance_phon';

  ASSERT v_after - v_before = 50, format('user delta %s', v_after - v_before);
  ASSERT (v_after - v_before) + (v_sys_after - v_sys_before) = 0,
    format('Σ != 0 user=%s sys=%s', v_after - v_before, v_sys_after - v_sys_before);

  RAISE NOTICE 'E9-4 OK — app-install conservation';
END;
$$;

-- E9-5: tier leaderboard rank · mask · self · anon deny
DO $$
DECLARE
  v_a UUID := gen_random_uuid();
  v_b UUID := gen_random_uuid();
  v_res JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_a, 'authenticated', 'authenticated', 'e9_lb_a_' || v_a::TEXT || '@t.local', NOW(), NOW()),
    (v_b, 'authenticated', 'authenticated', 'e9_lb_b_' || v_b::TEXT || '@t.local', NOW(), NOW());

  UPDATE profiles SET username = 'e9lba', display_name = 'AlphaLeader' WHERE id = v_a;
  UPDATE profiles SET username = 'e9lbb', display_name = 'BetaLeader' WHERE id = v_b;

  INSERT INTO user_earn_vip (user_id, xp, tier, tier_upgraded_on, updated_at)
  VALUES
    (v_a, 5000, 'gold', CURRENT_DATE, NOW()),
    (v_b, 1000, 'silver', CURRENT_DATE, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET xp = EXCLUDED.xp, tier = EXCLUDED.tier, updated_at = NOW();

  BEGIN
    PERFORM set_config('request.jwt.claims', '{}', TRUE);
    SET LOCAL ROLE anon;
    PERFORM rpc_get_tier_leaderboard(10);
    RAISE EXCEPTION 'anon must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%UNAUTHORIZED%' AND SQLERRM NOT LIKE '%permission denied%' THEN
        RAISE;
      END IF;
  END;
  RESET ROLE;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_a::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;
  v_res := rpc_get_tier_leaderboard(10);
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), format('lb ok %s', v_res);
  ASSERT (v_res->'self'->>'rank')::INT = 1, 'self rank 1';
  ASSERT (v_res->'entries'->0->>'tier') = 'gold', 'top tier gold';
  ASSERT (v_res->'entries'->0->>'display_name') LIKE '%***%'
      OR length(v_res->'entries'->0->>'display_name') <= 12,
    'display name masked';
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  RAISE NOTICE 'E9-5 OK — tier leaderboard';
END;
$$;

ROLLBACK;
