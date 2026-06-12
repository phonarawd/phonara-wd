-- ============================================================
-- Task 6.3 — sanctions screening resolution RPC
-- ============================================================

-- ── clear: admin resolves pending screening ───────────────────────────────────
BEGIN;
DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
  v_user UUID := gen_random_uuid();
  v_screening_id UUID;
  v_res JSONB;
  v_queue_count INT;
  v_audit_count INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_admin, 'authenticated', 'authenticated', 'san_res_admin_' || v_admin::TEXT || '@test.local', NOW(), NOW()),
    (v_user, 'authenticated', 'authenticated', 'san_res_user_' || v_user::TEXT || '@test.local', NOW(), NOW());
  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  INSERT INTO sanctions_screenings (user_id, status, screened_at, source, details)
  VALUES (v_user, 'pending', NOW(), 'kyc_submission', '{"trigger":"kyc_submission"}'::JSONB)
  RETURNING id INTO v_screening_id;

  INSERT INTO admin_review_queue (queue_type, entity_type, entity_id, user_id, reason, status, sla_due_at)
  VALUES ('sanctions_screening', 'sanctions_screening', v_screening_id, v_user, 'kyc_submission', 'pending', NOW() + INTERVAL '24 hours');

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT,
    true
  );

  v_res := rpc_resolve_sanctions_screening(v_screening_id, 'clear', 'manual review complete');
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), format('clear must succeed, got %s', v_res);

  ASSERT EXISTS (
    SELECT 1 FROM sanctions_screenings WHERE id = v_screening_id AND status = 'clear'
  ), 'screening must be clear';

  SELECT COUNT(*) INTO v_queue_count
    FROM admin_review_queue
   WHERE entity_id = v_screening_id AND status = 'resolved';
  ASSERT v_queue_count >= 1, 'sanctions queue item must be resolved';

  PERFORM _assert_sanctions_screening(v_user);

  SELECT COUNT(*) INTO v_audit_count
    FROM audit_logs
   WHERE actor_id = v_admin
     AND action = 'sanctions_screening_resolved'
     AND entity_type = 'sanctions_screenings'
     AND entity_id = v_screening_id
     AND payload->>'decision' = 'clear';
  ASSERT v_audit_count = 1, 'clear decision must write audit log';

  RAISE NOTICE 'SANCTIONS RESOLVE CLEAR OK';
END;
$$;
ROLLBACK;

-- ── hit: applies freeze side effects ────────────────────────────────────────
BEGIN;
DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
  v_user UUID := gen_random_uuid();
  v_screening_id UUID;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_admin, 'authenticated', 'authenticated', 'san_hit_admin_' || v_admin::TEXT || '@test.local', NOW(), NOW()),
    (v_user, 'authenticated', 'authenticated', 'san_hit_user_' || v_user::TEXT || '@test.local', NOW(), NOW());
  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  INSERT INTO sanctions_screenings (user_id, status, screened_at, source)
  VALUES (v_user, 'pending', NOW(), 'kyc_submission')
  RETURNING id INTO v_screening_id;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT,
    true
  );

  PERFORM rpc_resolve_sanctions_screening(v_screening_id, 'hit', 'confirmed sanctions match');

  ASSERT EXISTS (SELECT 1 FROM profiles WHERE id = v_user AND activity_frozen = TRUE);
  ASSERT EXISTS (
    SELECT 1 FROM risk_flags WHERE user_id = v_user AND flag_type = 'sanctions_hit' AND status = 'active'
  );
  ASSERT EXISTS (
    SELECT 1 FROM str_cases WHERE user_id = v_user AND case_type = 'sanctions_hit' AND status IN ('open', 'reviewing')
  );

  RAISE NOTICE 'SANCTIONS RESOLVE HIT OK';
END;
$$;
ROLLBACK;

-- ── aal1 admin rejected ───────────────────────────────────────────────────────
BEGIN;
DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
  v_user UUID := gen_random_uuid();
  v_screening_id UUID;
  v_blocked BOOLEAN := FALSE;
  v_msg TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_admin, 'authenticated', 'authenticated', 'san_aal1_admin_' || v_admin::TEXT || '@test.local', NOW(), NOW()),
    (v_user, 'authenticated', 'authenticated', 'san_aal1_user_' || v_user::TEXT || '@test.local', NOW(), NOW());
  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  INSERT INTO sanctions_screenings (user_id, status, screened_at, source)
  VALUES (v_user, 'pending', NOW(), 'test')
  RETURNING id INTO v_screening_id;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'aal', 'aal1')::TEXT,
    true
  );

  BEGIN
    PERFORM rpc_resolve_sanctions_screening(v_screening_id, 'clear', 'must fail without aal2');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg LIKE 'ERR_MFA_REQUIRED%' THEN v_blocked := TRUE; END IF;
  END;

  ASSERT v_blocked, format('aal1 admin must be rejected, got %s', COALESCE(v_msg, '<none>'));
  ASSERT EXISTS (SELECT 1 FROM sanctions_screenings WHERE id = v_screening_id AND status = 'pending');

  RAISE NOTICE 'SANCTIONS RESOLVE AAL1 BLOCK OK';
END;
$$;
ROLLBACK;
