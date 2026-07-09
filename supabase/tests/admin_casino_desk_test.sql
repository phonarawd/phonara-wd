-- Admin casino desk RPC — catalog list + per-game status (non-money)

BEGIN;
DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
  v_payload JSONB;
  v_games JSONB;
  v_set JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (
    v_admin,
    'authenticated',
    'authenticated',
    'casino_desk_admin_' || v_admin::TEXT || '@test.local',
    NOW(),
    NOW()
  );
  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT, true);

  v_payload := rpc_admin_list_casino_catalog();
  v_games := v_payload->'games';
  ASSERT jsonb_typeof(v_games) = 'array', 'catalog games must be array';
  ASSERT jsonb_array_length(v_games) = 12, 'catalog must list all 12 game_code values';

  v_set := rpc_admin_set_casino_game_status('dice', 'maintenance', 'scheduled rng calibration');
  ASSERT (v_set->>'ok')::BOOLEAN IS TRUE, 'set status must return ok';
  ASSERT (
    SELECT value FROM app_config WHERE key = 'casino_game_status_dice'
  ) = 'maintenance', 'status key must persist';
  ASSERT (
    SELECT value FROM app_config WHERE key = 'feature_game_dice_enabled'
  ) = 'false', 'maintenance must disable per-game feature flag';

  v_set := rpc_admin_set_casino_game_status('dice', 'live', 'calibration complete');
  ASSERT (
    SELECT value FROM app_config WHERE key = 'feature_game_dice_enabled'
  ) = 'true', 'live must re-enable per-game feature flag';

  ASSERT EXISTS (
    SELECT 1 FROM audit_logs
    WHERE actor_id = v_admin
      AND action = 'admin_casino_game_status'
      AND payload->>'game' = 'dice'
  ), 'status change must write audit row';

  RAISE NOTICE 'ADMIN CASINO DESK RPC OK — catalog + status + audit';
END;
$$;
ROLLBACK;

-- Negative: non-admin forbidden
BEGIN;
DO $$
DECLARE
  v_user UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (
    v_user,
    'authenticated',
    'authenticated',
    'casino_desk_user_' || v_user::TEXT || '@test.local',
    NOW(),
    NOW()
  );
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user::TEXT)::TEXT, true);
  BEGIN
    PERFORM rpc_admin_list_casino_catalog();
    RAISE EXCEPTION 'expected forbidden for non-admin';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT ILIKE '%forbidden%' THEN
        RAISE;
      END IF;
  END;
  RAISE NOTICE 'ADMIN CASINO DESK RPC NEGATIVE OK — non-admin blocked';
END;
$$;
ROLLBACK;
