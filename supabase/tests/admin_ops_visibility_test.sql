-- ============================================================
-- Admin ops visibility — Phase 2.5 contract SQL integration test
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
  v_user UUID := gen_random_uuid();
  v_res JSONB;
  v_blocked BOOLEAN;
  v_msg TEXT;
  v_count INT;
  v_thr JSONB;
  v_alert_id UUID;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_admin, 'authenticated', 'authenticated', 'admin_ops_vis_' || v_admin::TEXT || '@test.local', NOW(), NOW()),
    (v_user, 'authenticated', 'authenticated', 'admin_ops_vis_user_' || v_user::TEXT || '@test.local', NOW(), NOW());

  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  -- Seed rows must exist with system:migration actor
  SELECT COUNT(*)::INT INTO v_count FROM ops_alert_thresholds;
  ASSERT v_count >= 5,
    format('ops_alert_thresholds must have Phase 2.5 seed rows, got %s', v_count);

  ASSERT EXISTS (
    SELECT 1 FROM ops_alert_thresholds
    WHERE threshold_key = 'ops.reconciliation.mismatch_threshold'
      AND threshold_value = 1
      AND severity = 'critical'
      AND changed_by = 'system:migration'
      AND change_reason <> ''
  ), 'reconciliation mismatch threshold seed must be critical threshold 1';

  -- Non-admin forbidden on dashboard
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user::TEXT)::TEXT, true);
  v_blocked := FALSE;
  BEGIN
    PERFORM rpc_admin_get_ops_dashboard();
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF lower(v_msg) = 'forbidden' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, 'non-admin must not read ops dashboard';

  -- Admin dashboard shape
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT, true);
  v_res := rpc_admin_get_ops_dashboard();

  ASSERT v_res ? 'overallStatus', 'dashboard must include overallStatus';
  ASSERT v_res ? 'moneyFlow', 'dashboard must include moneyFlow';
  ASSERT v_res ? 'edgeFailures', 'dashboard must include edgeFailures';
  ASSERT v_res ? 'reconciliation', 'dashboard must include reconciliation';
  ASSERT v_res ? 'securityBaseline', 'dashboard must include securityBaseline';
  ASSERT v_res ? 'healthChecks', 'dashboard must include healthChecks';
  ASSERT (v_res->'securityBaseline') ? 'rlsOffPublicTables',
    'securityBaseline must expose rlsOffPublicTables advisor-equivalent count';
  ASSERT jsonb_array_length(v_res->'healthChecks') = 9,
    format('dashboard healthChecks must mirror 9 health checks, got %s', jsonb_array_length(v_res->'healthChecks'));

  -- Exception queue listing
  v_res := rpc_admin_list_exception_queue('admin_review', 10);
  ASSERT v_res ? 'items', 'exception queue must return items array';

  v_res := rpc_admin_list_alert_thresholds();
  ASSERT v_res ? 'thresholds', 'threshold list must return thresholds';
  ASSERT jsonb_array_length(v_res->'thresholds') >= 5,
    'threshold list must include seeded rows';

  -- Threshold change requires reason + audit history
  v_res := rpc_admin_set_alert_threshold(
    'notification',
    'ops.notification.failure_warn_threshold',
    4,
    900,
    'ops visibility test threshold tweak'
  );
  ASSERT (v_res->>'ok')::BOOLEAN, 'threshold update must succeed';

  SELECT COUNT(*)::INT INTO v_count
  FROM ops_alert_threshold_history
  WHERE threshold_key = 'ops.notification.failure_warn_threshold'
    AND new_value = 4
    AND changed_by = 'admin:' || v_admin::TEXT
    AND change_reason = 'ops visibility test threshold tweak';
  ASSERT v_count = 1, 'threshold history must record admin change with reason';

  ASSERT EXISTS (
    SELECT 1 FROM audit_logs
    WHERE actor_id = v_admin
      AND action = 'ops_alert_threshold_updated'
  ), 'threshold update must write audit_logs row';

  -- Empty reason must fail
  v_blocked := FALSE;
  BEGIN
    PERFORM rpc_admin_set_alert_threshold(
      'notification', 'ops.notification.failure_warn_threshold', 3, 900, '  '
    );
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'reason_required' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, 'threshold update must require non-empty reason';

  -- Threshold-based alert promotion: broadcast failure
  INSERT INTO withdrawal_requests (
    user_id, wallet_id, currency, amount, destination, status, idempotency_key
  )
  SELECT v_user, w.id, 'USDT', '10.000000', '{}'::JSONB, 'broadcast_failed', 'ops-vis-wd-' || gen_random_uuid()::TEXT
  FROM wallets w WHERE w.user_id = v_user LIMIT 1;

  v_res := _sync_threshold_ops_alerts();
  ASSERT (v_res->>'promoted')::INT >= 1,
    'broadcast_failed withdrawal must promote threshold ops alert';

  SELECT id INTO v_alert_id
  FROM ops_alerts
  WHERE dedupe_key = 'threshold:withdrawal:broadcast_failure'
    AND status IN ('open', 'acknowledged')
  LIMIT 1;
  ASSERT v_alert_id IS NOT NULL, 'withdrawal broadcast threshold alert must exist';

  -- Health sync chains threshold promotion
  v_res := rpc_sync_ops_alerts_from_health();
  ASSERT v_res ? 'thresholdSync', 'health sync must include thresholdSync payload';

  RAISE NOTICE 'ADMIN OPS VISIBILITY OK — dashboard, thresholds, exception queues, and promotion verified';
END;
$$;

ROLLBACK;
