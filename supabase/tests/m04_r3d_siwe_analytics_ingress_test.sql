-- ============================================================
-- M-04 / R3-d — SIWE/analytics anon revoke · HMAC service ingress
-- Platform audit: audit-r3d-siwe-analytics-ingress
-- RED-first owner: anon EXECUTE 0 · service dual-bucket · payload/retention
-- ============================================================

BEGIN;

-- M04-0: grants — anon must not EXECUTE public SIWE/analytics mutators
DO $$
BEGIN
  ASSERT NOT has_function_privilege(
    'anon',
    'public.rpc_create_siwe_challenge(text, integer)',
    'EXECUTE'
  ),
    'anon must NOT EXECUTE rpc_create_siwe_challenge (M-04)';
  ASSERT has_function_privilege(
    'authenticated',
    'public.rpc_create_siwe_challenge(text, integer)',
    'EXECUTE'
  ),
    'authenticated may EXECUTE rpc_create_siwe_challenge';
  ASSERT has_function_privilege(
    'service_role',
    'public.rpc_service_create_siwe_challenge(text, integer, text)',
    'EXECUTE'
  ),
    'service_role must EXECUTE rpc_service_create_siwe_challenge';
  ASSERT NOT has_function_privilege(
    'anon',
    'public.rpc_service_create_siwe_challenge(text, integer, text)',
    'EXECUTE'
  ),
    'anon must NOT EXECUTE rpc_service_create_siwe_challenge';
  ASSERT NOT has_function_privilege(
    'authenticated',
    'public.rpc_service_create_siwe_challenge(text, integer, text)',
    'EXECUTE'
  ),
    'authenticated must NOT EXECUTE rpc_service_create_siwe_challenge';

  ASSERT NOT has_function_privilege(
    'anon',
    'public.rpc_record_product_analytics_event(text, text, jsonb, text, text, timestamp with time zone)',
    'EXECUTE'
  ),
    'anon must NOT EXECUTE rpc_record_product_analytics_event (M-04)';
  ASSERT has_function_privilege(
    'authenticated',
    'public.rpc_record_product_analytics_event(text, text, jsonb, text, text, timestamp with time zone)',
    'EXECUTE'
  ),
    'authenticated may EXECUTE rpc_record_product_analytics_event';
  ASSERT has_function_privilege(
    'service_role',
    'public.rpc_service_record_product_analytics_event(text, text, jsonb, text, text, timestamp with time zone, text, uuid)',
    'EXECUTE'
  ),
    'service_role must EXECUTE rpc_service_record_product_analytics_event';
  ASSERT NOT has_function_privilege(
    'anon',
    'public.rpc_service_record_product_analytics_event(text, text, jsonb, text, text, timestamp with time zone, text, uuid)',
    'EXECUTE'
  ),
    'anon must NOT EXECUTE rpc_service_record_product_analytics_event';

  ASSERT to_regclass('public.service_ingress_rate_buckets') IS NOT NULL,
    'service_ingress_rate_buckets missing';
  ASSERT EXISTS (
    SELECT 1 FROM app_config WHERE key = 'product_analytics_retention_days'
  ), 'product_analytics_retention_days missing';
  ASSERT EXISTS (
    SELECT 1 FROM app_config WHERE key = 'product_analytics_max_properties_bytes'
  ), 'product_analytics_max_properties_bytes missing';
  ASSERT EXISTS (
    SELECT 1 FROM rpc_rate_limit_configs
     WHERE rpc_name = 'service_ingress_siwe_challenge' AND is_active
  ), 'service_ingress_siwe_challenge rate config missing';
  ASSERT EXISTS (
    SELECT 1 FROM rpc_rate_limit_configs
     WHERE rpc_name = 'service_ingress_product_analytics' AND is_active
  ), 'service_ingress_product_analytics rate config missing';

  RAISE NOTICE 'M04-0 OK — grants + schema';
END;
$$;

-- M04-1: service SIWE challenge · dual IP/resource buckets · anon blocked
DO $$
DECLARE
  v_addr TEXT := '0x2222222222222222222222222222222222222222';
  v_ip TEXT := repeat('a', 64); -- fake hmac hex
  v_ch JSONB;
BEGIN
  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_siwe_login_enabled';

  -- Anon cannot call client challenge RPC
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM rpc_create_siwe_challenge(v_addr, 1);
    RAISE EXCEPTION 'anon create_siwe_challenge must fail';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%anon create_siwe_challenge must fail%' THEN RAISE; END IF;
      -- privilege or permission denied variants
      NULL;
  END;
  RESET ROLE;

  -- Service ingress creates challenge with IP hmac
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('role', 'service_role')::TEXT,
    TRUE
  );
  SET LOCAL ROLE service_role;
  v_ch := rpc_service_create_siwe_challenge(v_addr, 1, v_ip);
  ASSERT COALESCE((v_ch->>'ok')::BOOLEAN, FALSE), format('service challenge %s', v_ch);
  ASSERT (v_ch->>'address') = v_addr, 'address normalize';

  -- Dual bucket: burn IP + resource capacity then expect rate_limit_exceeded
  UPDATE rpc_rate_limit_configs
     SET capacity = 2, refill_rate = 0, cost = 1
   WHERE rpc_name = 'service_ingress_siwe_challenge';
  DELETE FROM service_ingress_rate_buckets
   WHERE resource = 'service_ingress_siwe_challenge';

  v_ch := rpc_service_create_siwe_challenge(v_addr, 1, repeat('b', 64));
  ASSERT COALESCE((v_ch->>'ok')::BOOLEAN, FALSE), 'first after reset ok';
  v_ch := rpc_service_create_siwe_challenge(v_addr, 1, repeat('b', 64));
  ASSERT COALESCE((v_ch->>'ok')::BOOLEAN, FALSE), 'second after reset ok';
  BEGIN
    PERFORM rpc_service_create_siwe_challenge(v_addr, 1, repeat('b', 64));
    RAISE EXCEPTION 'ip bucket must trip';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%rate_limit_exceeded%' THEN RAISE; END IF;
  END;

  -- Resource bucket independent of IP (global resource key)
  UPDATE rpc_rate_limit_configs
     SET capacity = 1, refill_rate = 0, cost = 1
   WHERE rpc_name = 'service_ingress_siwe_challenge';
  DELETE FROM service_ingress_rate_buckets
   WHERE resource = 'service_ingress_siwe_challenge';

  PERFORM rpc_service_create_siwe_challenge(v_addr, 1, repeat('c', 64));
  BEGIN
    -- different IP hmac, same resource — resource bucket should trip
    PERFORM rpc_service_create_siwe_challenge(v_addr, 1, repeat('d', 64));
    RAISE EXCEPTION 'resource bucket must trip';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%rate_limit_exceeded%' THEN RAISE; END IF;
  END;

  -- Restore configs used by other tests in this transaction
  UPDATE rpc_rate_limit_configs
     SET capacity = 20, refill_rate = 0.5, cost = 1, window_sec = 60
   WHERE rpc_name = 'service_ingress_siwe_challenge';
  DELETE FROM service_ingress_rate_buckets
   WHERE resource = 'service_ingress_siwe_challenge';

  RESET ROLE;
  RAISE NOTICE 'M04-1 OK — SIWE service ingress + dual bucket';
END;
$$;

-- M04-2: complete resolves identity — no client-trusted orphan user bind without challenge/identity
DO $$
DECLARE
  v_user UUID := gen_random_uuid();
  v_other UUID := gen_random_uuid();
  v_addr TEXT := '0x3333333333333333333333333333333333333333';
  v_ch JSONB;
  v_cid UUID;
  v_res JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_user, 'authenticated', 'authenticated', 'm04_siwe_' || v_user::TEXT || '@t.local', NOW(), NOW()),
    (v_other, 'authenticated', 'authenticated', 'm04_o_' || v_other::TEXT || '@t.local', NOW(), NOW());

  UPDATE app_config SET value = 'true' WHERE key = 'feature_siwe_login_enabled';

  -- Authenticated challenge stores user_id on row
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;
  v_ch := rpc_create_siwe_challenge(v_addr, 1);
  v_cid := (v_ch->>'challenge_id')::UUID;
  RESET ROLE;
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('role', 'service_role')::TEXT,
    TRUE
  );

  SET LOCAL ROLE service_role;
  -- Bound challenge.user_id must match resolved user
  BEGIN
    PERFORM rpc_service_complete_siwe_login(v_cid, v_addr, v_other);
    RAISE EXCEPTION 'mismatched user must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%siwe_user_mismatch%' THEN RAISE; END IF;
  END;

  v_res := rpc_service_complete_siwe_login(v_cid, v_addr, v_user);
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), format('complete ok %s', v_res);
  ASSERT (v_res->>'user_id') = v_user::TEXT, 'complete user';

  -- Lookup helper returns identity
  v_res := rpc_service_lookup_siwe_identity(v_addr, 1);
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), 'lookup ok';
  ASSERT (v_res->>'user_id') = v_user::TEXT, 'lookup user';

  RESET ROLE;
  RAISE NOTICE 'M04-2 OK — SIWE identity bind';
END;
$$;

-- M04-3: analytics anon blocked · service ingress · payload limit · idempotency · retention
DO $$
DECLARE
  v_user UUID := gen_random_uuid();
  v_res JSONB;
  v_big JSONB;
  v_purged JSONB;
  v_old_id UUID;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_user, 'authenticated', 'authenticated', 'm04_an_' || v_user::TEXT || '@t.local', NOW(), NOW());

  UPDATE app_config SET value = 'true' WHERE key = 'feature_product_analytics_enabled';
  UPDATE app_config SET value = '90' WHERE key = 'product_analytics_retention_days';
  UPDATE app_config SET value = '256' WHERE key = 'product_analytics_max_properties_bytes';

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM rpc_record_product_analytics_event('page_view', 'home', '{}'::JSONB, 'anon-1', 'm04-x');
    RAISE EXCEPTION 'anon analytics must fail';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%anon analytics must fail%' THEN RAISE; END IF;
      NULL;
  END;
  RESET ROLE;
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('role', 'service_role')::TEXT,
    TRUE
  );

  SET LOCAL ROLE service_role;
  v_res := rpc_service_record_product_analytics_event(
    'page_view', 'home', '{"path":"/home"}'::JSONB, 'anon-m04', 'm04-an-1', NULL,
    repeat('e', 64), NULL
  );
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), format('service analytics %s', v_res);

  v_res := rpc_service_record_product_analytics_event(
    'page_view', 'home', '{"path":"/home"}'::JSONB, 'anon-m04', 'm04-an-1', NULL,
    repeat('e', 64), NULL
  );
  ASSERT COALESCE((v_res->>'idempotent')::BOOLEAN, FALSE), 'anon client_event_id idempotent';

  -- Payload too large
  v_big := jsonb_build_object('blob', repeat('x', 400));
  BEGIN
    PERFORM rpc_service_record_product_analytics_event(
      'page_view', 'home', v_big, 'anon-m04', 'm04-an-big', NULL,
      repeat('f', 64), NULL
    );
    RAISE EXCEPTION 'payload limit must trip';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%analytics_payload_too_large%' THEN RAISE; END IF;
  END;

  -- Authenticated path also enforces payload limit
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM rpc_record_product_analytics_event(
      'page_view', 'home', v_big, NULL, 'm04-auth-big'
    );
    RAISE EXCEPTION 'auth payload limit must trip';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%analytics_payload_too_large%' THEN RAISE; END IF;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  -- Retention purge
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('role', 'service_role')::TEXT,
    TRUE
  );
  SET LOCAL ROLE service_role;
  INSERT INTO product_analytics_events (
    id, user_id, anonymous_id, event_name, surface, properties, client_event_id, occurred_at, received_at
  ) VALUES (
    gen_random_uuid(), NULL, 'old', 'page_view', 'home', '{}'::JSONB, 'm04-old',
    NOW() - INTERVAL '120 days', NOW() - INTERVAL '120 days'
  )
  RETURNING id INTO v_old_id;

  v_purged := rpc_service_purge_siwe_analytics_retention();
  ASSERT COALESCE((v_purged->>'ok')::BOOLEAN, FALSE), format('purge %s', v_purged);
  ASSERT NOT EXISTS (
    SELECT 1 FROM product_analytics_events WHERE id = v_old_id
  ), 'old analytics row purged';

  RESET ROLE;
  UPDATE app_config SET value = '2048' WHERE key = 'product_analytics_max_properties_bytes';
  RAISE NOTICE 'M04-3 OK — analytics ingress · payload · retention';
END;
$$;

ROLLBACK;
