-- Platform kill-switch client read parity (E9)
-- Ensures usePlatformGates keys are is_public and readable by anon/authenticated.

BEGIN;

DO $$
DECLARE
  v_expected TEXT[] := ARRAY[
    'system_halt',
    'system_readonly',
    'feature_game_enabled',
    'feature_spot_enabled',
    'feature_futures_enabled',
    'feature_staking_enabled',
    'feature_deposit_enabled',
    'feature_withdrawal_enabled',
    'feature_sports_enabled'
  ];
  v_key TEXT;
  v_is_public BOOLEAN;
  v_anon_count INT;
  v_user_count INT;
  v_user UUID := gen_random_uuid();
BEGIN
  FOREACH v_key IN ARRAY v_expected LOOP
    SELECT is_public INTO v_is_public FROM app_config WHERE key = v_key;
    ASSERT v_is_public IS TRUE,
      format('app_config.%s must be is_public for client read parity', v_key);
  END LOOP;

  PERFORM set_config('request.jwt.claims', '{}', true);
  SET ROLE anon;
  SELECT COUNT(*) INTO v_anon_count
    FROM app_config
   WHERE key = ANY(v_expected);
  RESET ROLE;

  ASSERT v_anon_count = array_length(v_expected, 1),
    format('anon must read all %s platform gate keys, got %s', array_length(v_expected, 1), v_anon_count);

  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_user, 'authenticated', 'authenticated',
          'platform_gate_' || v_user::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user::TEXT)::TEXT, true);
  SET ROLE authenticated;
  SELECT COUNT(*) INTO v_user_count
    FROM app_config
   WHERE key = ANY(v_expected);
  RESET ROLE;

  ASSERT v_user_count = array_length(v_expected, 1),
    format('authenticated must read all %s platform gate keys, got %s', array_length(v_expected, 1), v_user_count);

  RAISE NOTICE 'platform_gate_client_read OK — % keys public + readable', array_length(v_expected, 1);
END;
$$;

ROLLBACK;
