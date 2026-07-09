-- E3 — ops_alerts → ops_notify_outbox → claim/complete (Telegram ops-notify pipeline)
BEGIN;

DO $$
DECLARE
  v_alert_id UUID;
  v_dedupe TEXT := 'ops_notify_e3_test:' || gen_random_uuid()::TEXT;
  v_outbox INT;
  v_status TEXT;
  v_res JSONB;
  v_item JSONB;
  v_notify_id UUID;
BEGIN
  INSERT INTO ops_alerts (
    dedupe_key, source_check_id, severity, status,
    summary, runbook_key, metadata
  ) VALUES (
    v_dedupe,
    'ops_notify_e3_test',
    'critical',
    'open',
    'E3 test critical alert for Telegram outbox',
    'ops_notify_e3_test',
    jsonb_build_object('test', TRUE)
  )
  RETURNING id INTO v_alert_id;

  PERFORM _enqueue_ops_telegram_for_alert(v_alert_id, 'immediate');

  SELECT COUNT(*)::INT INTO v_outbox
    FROM ops_notify_outbox
   WHERE alert_id = v_alert_id
     AND notify_kind = 'immediate'
     AND status = 'pending';

  ASSERT v_outbox = 1,
    format('critical alert must enqueue immediate ops_notify_outbox row, got %s', v_outbox);

  UPDATE ops_alerts
     SET severity = 'warning',
         summary = 'E3 downgraded warning should not enqueue',
         updated_at = NOW()
   WHERE id = v_alert_id;

  PERFORM _enqueue_ops_telegram_for_alert(v_alert_id, 'immediate');

  SELECT COUNT(*)::INT INTO v_outbox
    FROM ops_notify_outbox
   WHERE alert_id = v_alert_id;

  ASSERT v_outbox = 1,
    format('warning alert must not create additional immediate outbox rows, got %s', v_outbox);

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;

  v_res := rpc_service_claim_ops_notify_batch('e3-test-worker', 5, 300);
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE),
    format('claim must succeed, got %s', v_res);
  ASSERT COALESCE((v_res->>'claimed')::INT, 0) >= 1,
    format('claim must return at least one row, got %s', v_res);

  v_item := (v_res->'items'->0);
  v_notify_id := (v_item->>'id')::UUID;

  v_res := rpc_service_complete_ops_notify(
    v_notify_id,
    'e3-test-worker',
    'sent',
    NULL,
    FALSE
  );
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE),
    format('complete sent must succeed, got %s', v_res);

  SELECT status INTO v_status
    FROM ops_notify_outbox
   WHERE id = v_notify_id;

  ASSERT v_status = 'sent',
    format('outbox row must be sent after complete, got %s', v_status);

  RAISE NOTICE 'OPS NOTIFY E3 OK — critical alert enqueues outbox + claim/complete';
END;
$$;

DO $$
DECLARE
  v_res JSONB;
  v_enqueued INT;
  v_dedupe TEXT := 'ops_notify_e3_digest:' || gen_random_uuid()::TEXT;
  v_alert_id UUID;
BEGIN
  INSERT INTO ops_alerts (
    dedupe_key, source_check_id, severity, status,
    summary, runbook_key, metadata
  ) VALUES (
    v_dedupe,
    'ops_notify_e3_digest',
    'critical',
    'open',
    'E3 digest alert',
    'ops_notify_e3_digest',
    '{}'::JSONB
  )
  RETURNING id INTO v_alert_id;

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;

  v_res := rpc_service_enqueue_ops_telegram_digest(
    (SELECT split_part(value, ',', 1)::INT
       FROM app_config
      WHERE key = 'ops_telegram_digest_hours_utc'
      LIMIT 1)
  );

  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE),
    format('digest enqueue must succeed, got %s', v_res);

  v_enqueued := COALESCE((v_res->>'enqueued')::INT, 0);
  ASSERT v_enqueued >= 1,
    format('digest enqueue must enqueue at least one row, got %s', v_res);

  RAISE NOTICE 'OPS NOTIFY E3 OK — digest enqueue for scheduled hour';
END;
$$;

ROLLBACK;
