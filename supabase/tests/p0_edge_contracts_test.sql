-- P0 edge contracts — notification claim/complete, PG webhook replay, withdrawal broadcast claim
BEGIN;

-- ── PG webhook replay idempotency ─────────────────────────────────────────────
DO $$
DECLARE
  v_res1 JSONB;
  v_res2 JSONB;
  v_res3 JSONB;
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;

  v_res1 := rpc_service_register_pg_webhook_replay(
    'nonce-e2e-001',
    1700000000,
    'sigdigest001',
    'reqhash001',
    'bodyhash001',
    'pg_bank'
  );
  ASSERT COALESCE((v_res1->>'ok')::BOOLEAN, FALSE),
    format('first replay register must succeed, got %s', v_res1);
  ASSERT NOT COALESCE((v_res1->>'duplicate')::BOOLEAN, FALSE),
    'first replay must not be duplicate';

  v_res2 := rpc_service_register_pg_webhook_replay(
    'nonce-e2e-001',
    1700000000,
    'sigdigest001',
    'reqhash001',
    'bodyhash001',
    'pg_bank'
  );
  ASSERT COALESCE((v_res2->>'ok')::BOOLEAN, FALSE),
    format('duplicate replay must succeed idempotently, got %s', v_res2);
  ASSERT COALESCE((v_res2->>'duplicate')::BOOLEAN, FALSE),
    'second identical replay must be duplicate=true';

  v_res3 := rpc_service_register_pg_webhook_replay(
    'nonce-e2e-001',
    1700000000,
    'sigdigest001',
    'reqhash002',
    'bodyhash999',
    'pg_bank'
  );
  ASSERT COALESCE((v_res3->>'conflict')::BOOLEAN, FALSE),
    format('same replay key with different body hash must conflict, got %s', v_res3);

  RAISE NOTICE 'P0 EDGE OK — pg webhook replay idempotent + conflict detection';
  RESET ROLE;
END;
$$;

-- ── notification dispatch claim / complete ────────────────────────────────────
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_id  UUID;
  v_claim1 JSONB;
  v_claim2 JSONB;
  v_complete JSONB;
  v_status TEXT;
  v_idem TEXT;
BEGIN
  RESET ROLE;

  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'p0_notif_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  INSERT INTO notification_outbox (user_id, channel, event_type, payload, status)
  VALUES (v_uid, 'email', 'deposit_credited', '{"rail":"test"}'::JSONB, 'pending')
  RETURNING id INTO v_id;

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;

  v_claim1 := rpc_service_claim_notification_dispatch_batch('worker-a', 10, 300);
  ASSERT (v_claim1->>'claimed')::INT = 1,
    format('worker-a must claim one row, got %s', v_claim1->>'claimed');
  v_idem := v_claim1->'items'->0->>'provider_idempotency_key';
  ASSERT v_idem = format('notification:dispatch:%s:0', v_id),
    format('provider idempotency key must be stable, got %s', v_idem);

  v_claim2 := rpc_service_claim_notification_dispatch_batch('worker-b', 10, 300);
  ASSERT (v_claim2->>'claimed')::INT = 0,
    format('worker-b must not double-claim processing row, got %s', v_claim2->>'claimed');

  v_complete := rpc_service_complete_notification_dispatch(
    v_id, 'worker-a', 'retryable_failed', 'email_not_configured', TRUE
  );
  ASSERT v_complete->>'status' = 'retryable_failed',
    format('dispatch failure must not mark sent, got %s', v_complete);

  SELECT status INTO v_status FROM notification_outbox WHERE id = v_id;
  ASSERT v_status <> 'sent',
    format('failed dispatch must never leave row as sent, got %s', v_status);
  ASSERT (SELECT attempts FROM notification_outbox WHERE id = v_id) = 1,
    'provider-attempted failure must increment attempts once';

  UPDATE notification_outbox SET next_attempt_at = NOW() WHERE id = v_id;
  v_claim1 := rpc_service_claim_notification_dispatch_batch('worker-a', 10, 300);
  ASSERT (v_claim1->>'claimed')::INT = 1,
    format('retryable row must be reclaimable, got %s', v_claim1->>'claimed');

  v_complete := rpc_service_complete_notification_dispatch(
    v_id, 'worker-a', 'sent', NULL, TRUE
  );
  ASSERT v_complete->>'status' = 'sent',
    format('successful complete must mark sent, got %s', v_complete);

  RAISE NOTICE 'P0 EDGE OK — notification claim single-flight + failure≠sent';
  RESET ROLE;
END;
$$;

-- ── withdrawal broadcast claim + mark gate ────────────────────────────────────
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_admin UUID := gen_random_uuid();
  v_wr_id UUID;
  v_res JSONB;
  v_claim JSONB;
  v_mark JSONB;
  v_mark_blocked BOOLEAN := FALSE;
  v_dup_blocked BOOLEAN := FALSE;
BEGIN
  RESET ROLE;

  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_uid, 'authenticated', 'authenticated', 'p0_wd_' || v_uid::TEXT || '@test.local', NOW(), NOW()),
    (v_admin, 'authenticated', 'authenticated', 'p0_wd_admin_' || v_admin::TEXT || '@test.local', NOW(), NOW());

  UPDATE profiles SET role = 'admin', kyc_tier = 'id_verified' WHERE id = v_admin;
  UPDATE profiles SET kyc_tier = 'id_verified' WHERE id = v_uid;

  PERFORM _credit_wallet_internal(v_uid, 'PHON', '50.000000', 'test_funding', 'p0-wd-fund-001');
  PERFORM _debit_system_account('reward_issuance_phon', '50.000000', 'test_funding', v_uid, 'p0-wd-fund-001', NULL);

  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'test', TRUE
    FROM unnest(ARRAY[
      'terms_of_service','privacy_policy','risk_disclosure','age_verification'
    ]::TEXT[]) AS doc_type;
  INSERT INTO sanctions_screenings (user_id, status, screened_at)
  VALUES (v_uid, 'clear', NOW());

  UPDATE treasury_reserves SET real_balance = '99999999.000000' WHERE currency = 'PHON';
  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_withdrawal_enabled';
  UPDATE app_config SET value = '0' WHERE key IN (
    'aml_min_account_age_hours', 'aml_rapid_credit_hours', 'aml_kyc_approval_cooldown_hours'
  );
  PERFORM rpc_run_reconciliation();

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, TRUE);
  SET LOCAL ROLE authenticated;
  v_res := rpc_request_withdrawal(
    'PHON', '10.000000',
    jsonb_build_object('type', 'bank', 'chain', 'BANK', 'account', '110123456789', 'address', '110123456789'),
    'p0-wd-req-001', NULL
  );
  v_wr_id := (v_res->>'withdrawal_id')::UUID;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT, TRUE);
  SET LOCAL ROLE authenticated;
  PERFORM rpc_approve_withdrawal(v_wr_id, 'p0 edge broadcast claim test');

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;

  BEGIN
    PERFORM rpc_service_mark_withdrawal_broadcast(v_wr_id, '0xdeadbeef', 'must_fail_without_claim', 'worker-x');
  EXCEPTION WHEN OTHERS THEN
    v_mark_blocked := TRUE;
  END;
  ASSERT v_mark_blocked, 'mark broadcast must reject approved row without claim';

  v_claim := rpc_service_claim_withdrawal_broadcast_batch('worker-x', 5, 600);
  ASSERT (v_claim->>'claimed')::INT = 1,
    format('worker must claim approved withdrawal, got %s', v_claim->>'claimed');

  v_mark := rpc_service_mark_withdrawal_broadcast(
    v_wr_id, '0xdeadbeef', 'p0_test_broadcast', 'worker-x'
  );
  ASSERT COALESCE((v_mark->>'ok')::BOOLEAN, FALSE),
    format('mark broadcast must succeed after claim, got %s', v_mark);

  BEGIN
    PERFORM rpc_service_mark_withdrawal_broadcast(v_wr_id, '0xotherhash', 'duplicate', 'worker-x');
  EXCEPTION WHEN OTHERS THEN
    v_dup_blocked := TRUE;
  END;
  ASSERT v_dup_blocked, 'duplicate broadcast with different tx hash must be rejected';

  v_mark := rpc_service_mark_withdrawal_broadcast(v_wr_id, '0xdeadbeef', 'idempotent', 'worker-x');
  ASSERT COALESCE((v_mark->>'idempotent')::BOOLEAN, FALSE),
    format('same tx hash replay must be idempotent, got %s', v_mark);

  RAISE NOTICE 'P0 EDGE OK — withdrawal broadcast claim gate + idempotent mark';
  RESET ROLE;
END;
$$;

-- ── ops-notify claim + complete gate (Launch E3) ─────────────────────────────
DO $$
DECLARE
  v_alert_id UUID;
  v_notify_id UUID;
  v_claim JSONB;
  v_complete JSONB;
  v_status TEXT;
BEGIN
  RESET ROLE;

  INSERT INTO ops_alerts (
    dedupe_key, source_check_id, severity, status,
    summary, runbook_key, metadata
  ) VALUES (
    'p0_edge_ops_notify:' || gen_random_uuid()::TEXT,
    'p0_edge_ops_notify',
    'critical',
    'open',
    'P0 edge ops-notify claim test',
    'p0_edge_ops_notify',
    '{}'::JSONB
  )
  RETURNING id INTO v_alert_id;

  -- Internal helper: EXECUTE revoked from service_role (ops_notify_e3 migration).
  PERFORM _enqueue_ops_telegram_for_alert(v_alert_id, 'immediate');

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;

  v_claim := rpc_service_claim_ops_notify_batch('p0-edge-worker', 5, 300);
  ASSERT COALESCE((v_claim->>'claimed')::INT, 0) = 1,
    format('ops-notify claim must return one row, got %s', v_claim);

  v_notify_id := ((v_claim->'items'->0)->>'id')::UUID;

  v_complete := rpc_service_complete_ops_notify(
    v_notify_id, 'p0-edge-worker', 'retryable_failed', 'telegram_not_configured', FALSE
  );
  ASSERT v_complete->>'status' = 'retryable_failed',
    format('retryable failure must not mark sent, got %s', v_complete);

  SELECT status INTO v_status FROM ops_notify_outbox WHERE id = v_notify_id;
  ASSERT v_status <> 'sent',
    format('failed ops-notify must never leave row as sent, got %s', v_status);

  UPDATE ops_notify_outbox SET next_attempt_at = NOW() WHERE id = v_notify_id;
  v_claim := rpc_service_claim_ops_notify_batch('p0-edge-worker', 5, 300);
  ASSERT (v_claim->>'claimed')::INT = 1,
    format('retryable ops-notify row must be reclaimable, got %s', v_claim->>'claimed');

  v_complete := rpc_service_complete_ops_notify(
    v_notify_id, 'p0-edge-worker', 'sent', NULL, FALSE
  );
  ASSERT v_complete->>'status' = 'sent',
    format('successful ops-notify complete must mark sent, got %s', v_complete);

  RAISE NOTICE 'P0 EDGE OK — ops-notify claim single-flight + failure≠sent';
  RESET ROLE;
END;
$$;

ROLLBACK;
