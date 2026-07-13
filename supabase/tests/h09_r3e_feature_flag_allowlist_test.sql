-- ============================================================
-- H-09 / R3-e — rpc_set_feature_enabled sports/live_crash + AAL2
-- Platform audit: audit-r3e-auth-hibp-feature-flag
-- ============================================================
-- RED-first owner: without migration, sports/live_crash raise invalid_feature
-- and body lacks _assert_admin_aal2 (E10 wipe). After apply: allowlist + MFA
-- + reason/audit; unknown feature still rejected; non-admin forbidden.
-- Auth HIBP is Management API (not asserted here).
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
  v_user  UUID := gen_random_uuid();
  v_ok    JSONB;
  v_def   TEXT;
  v_blocked BOOLEAN;
  v_msg   TEXT;
  v_sports_before TEXT;
  v_crash_before TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_admin, 'authenticated', 'authenticated',
     'h09_admin_' || v_admin::TEXT || '@test.local', NOW(), NOW()),
    (v_user, 'authenticated', 'authenticated',
     'h09_user_' || v_user::TEXT || '@test.local', NOW(), NOW());
  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  SELECT value INTO v_sports_before FROM app_config WHERE key = 'feature_sports_enabled';
  SELECT value INTO v_crash_before FROM app_config WHERE key = 'feature_live_crash_enabled';
  ASSERT v_sports_before IS NOT NULL, 'feature_sports_enabled missing';
  ASSERT v_crash_before IS NOT NULL, 'feature_live_crash_enabled missing';

  -- ── 1. Body must enforce Admin MFA (AAL2) ─────────────────────────────────
  v_def := pg_get_functiondef(
    'public.rpc_set_feature_enabled(text,boolean,text)'::regprocedure
  );
  ASSERT position('_assert_admin_aal2(' IN v_def) > 0,
    'rpc_set_feature_enabled must call _assert_admin_aal2()';
  ASSERT position('''sports''' IN v_def) > 0,
    'rpc_set_feature_enabled allowlist must include sports';
  ASSERT position('''live_crash''' IN v_def) > 0,
    'rpc_set_feature_enabled allowlist must include live_crash';

  -- ── 2. Admin + AAL2 can toggle sports and live_crash ──────────────────────
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT,
    true
  );

  v_ok := rpc_set_feature_enabled('sports', FALSE, 'h09 r3e sports allowlist');
  ASSERT v_ok->>'feature' = 'sports' AND (v_ok->>'enabled')::BOOLEAN = FALSE,
    'sports toggle failed';
  ASSERT EXISTS (
    SELECT 1 FROM app_config
     WHERE key = 'feature_sports_enabled' AND value = 'false'
  ), 'sports app_config not updated';

  v_ok := rpc_set_feature_enabled('live_crash', FALSE, 'h09 r3e live_crash allowlist');
  ASSERT v_ok->>'feature' = 'live_crash' AND (v_ok->>'enabled')::BOOLEAN = FALSE,
    'live_crash toggle failed';
  ASSERT EXISTS (
    SELECT 1 FROM app_config
     WHERE key = 'feature_live_crash_enabled' AND value = 'false'
  ), 'live_crash app_config not updated';

  ASSERT EXISTS (
    SELECT 1 FROM audit_logs
     WHERE actor_id = v_admin
       AND action = 'feature_toggle'
       AND payload->>'feature' IN ('sports', 'live_crash')
    HAVING COUNT(DISTINCT payload->>'feature') = 2
  ), 'sports/live_crash feature_toggle audit missing';

  -- restore prior values
  PERFORM rpc_set_feature_enabled(
    'sports',
    v_sports_before = 'true',
    'h09 r3e restore sports'
  );
  PERFORM rpc_set_feature_enabled(
    'live_crash',
    v_crash_before = 'true',
    'h09 r3e restore live_crash'
  );

  -- ── 3. Unknown feature rejected ───────────────────────────────────────────
  v_blocked := FALSE;
  BEGIN
    PERFORM rpc_set_feature_enabled('not_a_real_feature', TRUE, 'should fail');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF lower(v_msg) = 'invalid_feature' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, 'unknown feature must raise invalid_feature';

  -- ── 4. Empty reason rejected ──────────────────────────────────────────────
  v_blocked := FALSE;
  BEGIN
    PERFORM rpc_set_feature_enabled('sports', TRUE, '   ');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF lower(v_msg) = 'reason_required' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, 'blank reason must raise reason_required';

  -- ── 5. Admin without AAL2 blocked ─────────────────────────────────────────
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'aal', 'aal1')::TEXT,
    true
  );
  v_blocked := FALSE;
  BEGIN
    PERFORM rpc_set_feature_enabled('sports', TRUE, 'aal1 should fail');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'ERR_MFA_REQUIRED' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, 'admin aal1 must raise ERR_MFA_REQUIRED';

  -- ── 6. Non-admin forbidden ────────────────────────────────────────────────
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user::TEXT, 'aal', 'aal2')::TEXT,
    true
  );
  v_blocked := FALSE;
  BEGIN
    PERFORM rpc_set_feature_enabled('sports', TRUE, 'non-admin should fail');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF lower(v_msg) = 'forbidden' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, 'non-admin must raise forbidden';

  RAISE NOTICE 'H-09 R3-e OK — sports/live_crash allowlist · AAL2 · reason/audit';
END;
$$;

ROLLBACK;
