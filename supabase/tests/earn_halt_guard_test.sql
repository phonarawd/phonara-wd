-- ============================================================
-- Earn / referral — global system-live guard (halt / read-only)
-- ============================================================
-- Proves _assert_system_live() blocks Earn and referral entry RPCs under
-- system_halt and system_readonly. Per-feature Earn kill switches are deferred;
-- global halt is the launch safety net.
--
-- Also asserts rpc_set_system_mode carries admin AAL2 (kill-switch integrity).
-- Runs in one transaction and ROLLS BACK — no residue.
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_uid       UUID := gen_random_uuid();
  v_referrer  UUID := gen_random_uuid();
  v_blocked   BOOLEAN := FALSE;
  v_msg       TEXT;
  v_def       TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_uid, 'authenticated', 'authenticated', 'earn_halt_' || v_uid::TEXT || '@test.local', NOW(), NOW()),
    (v_referrer, 'authenticated', 'authenticated', 'earn_ref_' || v_referrer::TEXT || '@test.local', NOW(), NOW());

  UPDATE profiles SET username = 'ref' || substr(v_referrer::TEXT, 1, 8) WHERE id = v_referrer;

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  UPDATE app_config SET value = 'false'
   WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');

  -- ── Kill-switch integrity: halt toggle requires admin AAL2 ───────────────
  v_def := pg_get_functiondef('public.rpc_set_system_mode(boolean,boolean,text)'::regprocedure);
  ASSERT position('_assert_admin_aal2(' IN v_def) > 0,
    'rpc_set_system_mode must call _assert_admin_aal2() so halt cannot be cleared without MFA';

  -- ── system_halt blocks ─────────────────────────────────────────────────────
  UPDATE app_config SET value = 'true' WHERE key = 'system_halt';
  UPDATE app_config SET value = 'false' WHERE key = 'system_readonly';

  BEGIN
    PERFORM rpc_claim_welcome_bonus();
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'system_halted' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked,
    format('system_halt must block rpc_claim_welcome_bonus, got: %s', COALESCE(v_msg, '<none>'));

  v_blocked := FALSE;
  v_msg := NULL;
  BEGIN
    PERFORM rpc_claim_daily_reward();
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'system_halted' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked,
    format('system_halt must block rpc_claim_daily_reward, got: %s', COALESCE(v_msg, '<none>'));

  v_blocked := FALSE;
  v_msg := NULL;
  BEGIN
    PERFORM rpc_claim_repeatable_mission('social_follow_x', 'earn-halt-test');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'system_halted' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked,
    format('system_halt must block rpc_claim_repeatable_mission, got: %s', COALESCE(v_msg, '<none>'));

  v_blocked := FALSE;
  v_msg := NULL;
  BEGIN
    PERFORM rpc_register_referral((SELECT username FROM profiles WHERE id = v_referrer));
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'system_halted' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked,
    format('system_halt must block rpc_register_referral, got: %s', COALESCE(v_msg, '<none>'));

  -- ── system_readonly blocks (halt off) ────────────────────────────────────
  UPDATE app_config SET value = 'false' WHERE key = 'system_halt';
  UPDATE app_config SET value = 'true' WHERE key = 'system_readonly';

  v_blocked := FALSE;
  v_msg := NULL;
  BEGIN
    PERFORM rpc_claim_welcome_bonus();
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'system_readonly' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked,
    format('system_readonly must block rpc_claim_welcome_bonus, got: %s', COALESCE(v_msg, '<none>'));

  v_blocked := FALSE;
  v_msg := NULL;
  BEGIN
    PERFORM rpc_claim_daily_reward();
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'system_readonly' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked,
    format('system_readonly must block rpc_claim_daily_reward, got: %s', COALESCE(v_msg, '<none>'));

  v_blocked := FALSE;
  v_msg := NULL;
  BEGIN
    PERFORM rpc_claim_repeatable_mission('social_follow_x', 'earn-ro-test');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'system_readonly' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked,
    format('system_readonly must block rpc_claim_repeatable_mission, got: %s', COALESCE(v_msg, '<none>'));

  RAISE NOTICE 'EARN HALT GUARD OK — welcome/daily/repeatable/referral blocked under halt and readonly; rpc_set_system_mode has AAL2';
END;
$$;

ROLLBACK;
