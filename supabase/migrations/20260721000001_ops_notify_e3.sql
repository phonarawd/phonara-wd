-- ============================================================
-- Migration: 20260721000001_ops_notify_e3
-- E3 — ops_alerts → ops-notify edge (Telegram) outbox + claim workflow
-- ============================================================

SET search_path = public, pg_temp;

-- ─── ops_notify_outbox (Telegram / HMAC webhook dispatch queue) ───────────────
CREATE TABLE IF NOT EXISTS ops_notify_outbox (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id                 UUID REFERENCES ops_alerts(id) ON DELETE SET NULL,
  notify_kind              TEXT NOT NULL CHECK (notify_kind IN ('immediate', 'digest')),
  dedupe_key               TEXT NOT NULL,
  severity                 TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  payload                  JSONB NOT NULL DEFAULT '{}'::JSONB,
  status                   TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'retryable_failed', 'failed', 'manual_review', 'sent')),
  attempts                 INT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  provider_idempotency_key   TEXT NOT NULL,
  claimed_at               TIMESTAMPTZ,
  claimed_by               TEXT,
  claim_expires_at         TIMESTAMPTZ,
  next_attempt_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error_code          TEXT,
  sent_at                  TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ops_notify_outbox_dedupe_active_uidx
  ON ops_notify_outbox (dedupe_key)
  WHERE status IN ('pending', 'processing', 'retryable_failed');

CREATE INDEX IF NOT EXISTS ops_notify_outbox_dispatch_claim_idx
  ON ops_notify_outbox (next_attempt_at, created_at)
  WHERE status IN ('pending', 'retryable_failed');

CREATE INDEX IF NOT EXISTS ops_notify_outbox_processing_claim_idx
  ON ops_notify_outbox (claim_expires_at)
  WHERE status = 'processing';

ALTER TABLE ops_notify_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ops_notify_outbox: admin read" ON ops_notify_outbox;
CREATE POLICY "ops_notify_outbox: admin read"
  ON ops_notify_outbox FOR SELECT
  USING (_is_admin());

REVOKE ALL ON TABLE ops_notify_outbox FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE ops_notify_outbox TO authenticated;
GRANT ALL ON TABLE ops_notify_outbox TO service_role;

INSERT INTO app_config (key, value, description)
VALUES
  ('ops_telegram_notify_enabled', 'true',
   'When true, critical ops_alerts enqueue Telegram ops-notify outbox rows.'),
  ('ops_telegram_digest_hours_utc', '3,13',
   'UTC hours for critical pager digest (03:00/13:00 UTC ≈ 12:00/22:00 KST).')
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      description = EXCLUDED.description,
      updated_at = NOW();

CREATE OR REPLACE FUNCTION _enqueue_ops_telegram_for_alert(
  p_alert_id UUID,
  p_notify_kind TEXT DEFAULT 'immediate'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_alert ops_alerts%ROWTYPE;
  v_enabled TEXT;
  v_kind TEXT;
  v_dedupe TEXT;
  v_idem TEXT;
  v_inserted INT;
BEGIN
  v_kind := COALESCE(NULLIF(btrim(p_notify_kind), ''), 'immediate');
  IF v_kind NOT IN ('immediate', 'digest') THEN
    RAISE EXCEPTION 'invalid_notify_kind';
  END IF;

  SELECT value INTO v_enabled
    FROM app_config
   WHERE key = 'ops_telegram_notify_enabled';
  IF COALESCE(v_enabled, 'true') <> 'true' THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_alert
    FROM ops_alerts
   WHERE id = p_alert_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_alert.severity <> 'critical'
     OR v_alert.status NOT IN ('open', 'acknowledged') THEN
    RETURN FALSE;
  END IF;

  IF v_kind = 'immediate' THEN
    v_dedupe := 'ops_telegram:immediate:' || v_alert.id::TEXT;
    v_idem := v_dedupe;
  ELSE
    v_dedupe := 'ops_telegram:digest:'
      || v_alert.id::TEXT || ':'
      || to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD-HH24');
    v_idem := v_dedupe;
  END IF;

  INSERT INTO ops_notify_outbox (
    alert_id,
    notify_kind,
    dedupe_key,
    severity,
    payload,
    provider_idempotency_key
  ) VALUES (
    v_alert.id,
    v_kind,
    v_dedupe,
    v_alert.severity,
    jsonb_build_object(
      'alert_id', v_alert.id,
      'dedupe_key', v_alert.dedupe_key,
      'source_check_id', v_alert.source_check_id,
      'severity', v_alert.severity,
      'status', v_alert.status,
      'summary', v_alert.summary,
      'runbook_key', v_alert.runbook_key,
      'occurrence_count', v_alert.occurrence_count,
      'last_seen_at', v_alert.last_seen_at,
      'notify_kind', v_kind
    ),
    v_idem
  )
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted > 0;
END;
$$;

REVOKE ALL ON FUNCTION _enqueue_ops_telegram_for_alert(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_service_enqueue_ops_telegram_digest(
  p_digest_hour_utc INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_alert ops_alerts%ROWTYPE;
  v_hour INT;
  v_allowed TEXT;
  v_enqueued INT := 0;
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_hour := COALESCE(
    p_digest_hour_utc,
    EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'UTC'))::INT
  );

  SELECT value INTO v_allowed
    FROM app_config
   WHERE key = 'ops_telegram_digest_hours_utc';

  IF v_allowed IS NOT NULL
     AND btrim(v_allowed) <> ''
     AND NOT (v_hour::TEXT = ANY (string_to_array(replace(v_allowed, ' ', ''), ','))) THEN
    RETURN jsonb_build_object('ok', TRUE, 'skipped', TRUE, 'reason', 'digest_hour_not_scheduled', 'hourUtc', v_hour);
  END IF;

  FOR v_alert IN
    SELECT *
      FROM ops_alerts
     WHERE severity = 'critical'
       AND status IN ('open', 'acknowledged')
     ORDER BY last_seen_at DESC
  LOOP
    IF _enqueue_ops_telegram_for_alert(v_alert.id, 'digest') THEN
      v_enqueued := v_enqueued + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'enqueued', v_enqueued,
    'hourUtc', v_hour,
    'digestAt', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_enqueue_ops_telegram_digest(INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_enqueue_ops_telegram_digest(INT)
  TO service_role;

CREATE OR REPLACE FUNCTION rpc_service_claim_ops_notify_batch(
  p_worker_id          TEXT,
  p_batch_size         INT DEFAULT 20,
  p_claim_ttl_seconds  INT DEFAULT 300
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_worker TEXT;
  v_limit  INT;
  v_ttl    INT;
  v_row    ops_notify_outbox%ROWTYPE;
  v_items  JSONB := '[]'::JSONB;
  v_count  INT := 0;
  v_attempt INT;
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_worker := NULLIF(btrim(p_worker_id), '');
  IF v_worker IS NULL THEN
    RAISE EXCEPTION 'invalid_worker_id';
  END IF;

  v_limit := LEAST(GREATEST(COALESCE(p_batch_size, 20), 1), 50);
  v_ttl := GREATEST(COALESCE(p_claim_ttl_seconds, 300), 60);

  UPDATE ops_notify_outbox
     SET status = CASE
           WHEN attempts >= 5 THEN 'failed'
           ELSE 'retryable_failed'
         END,
         claimed_at = NULL,
         claimed_by = NULL,
         claim_expires_at = NULL,
         last_error_code = COALESCE(last_error_code, 'claim_timeout'),
         next_attempt_at = NOW() + (
           LEAST(GREATEST(attempts, 1), 5) * INTERVAL '30 seconds'
         ),
         updated_at = NOW()
   WHERE status = 'processing'
     AND claim_expires_at IS NOT NULL
     AND claim_expires_at < NOW();

  FOR v_row IN
    SELECT *
      FROM ops_notify_outbox
     WHERE status IN ('pending', 'retryable_failed')
       AND next_attempt_at <= NOW()
     ORDER BY
       CASE severity WHEN 'critical' THEN 0 ELSE 1 END,
       created_at
     LIMIT v_limit
     FOR UPDATE SKIP LOCKED
  LOOP
    v_attempt := v_row.attempts;

    UPDATE ops_notify_outbox
       SET status = 'processing',
           claimed_at = NOW(),
           claimed_by = v_worker,
           claim_expires_at = NOW() + (v_ttl || ' seconds')::INTERVAL,
           updated_at = NOW()
     WHERE id = v_row.id;

    v_items := v_items || jsonb_build_object(
      'id', v_row.id,
      'alert_id', v_row.alert_id,
      'notify_kind', v_row.notify_kind,
      'severity', v_row.severity,
      'payload', v_row.payload,
      'attempts', v_attempt,
      'provider_idempotency_key', v_row.provider_idempotency_key
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'claimed', v_count,
    'items', v_items
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_claim_ops_notify_batch(TEXT, INT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_claim_ops_notify_batch(TEXT, INT, INT)
  TO service_role;

CREATE OR REPLACE FUNCTION rpc_service_complete_ops_notify(
  p_notify_id          UUID,
  p_worker_id          TEXT,
  p_outcome            TEXT,
  p_error_code         TEXT DEFAULT NULL,
  p_provider_attempted BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_worker TEXT;
  v_row    ops_notify_outbox%ROWTYPE;
  v_outcome TEXT;
  v_attempts INT;
  v_max_attempts CONSTANT INT := 5;
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_worker := NULLIF(btrim(p_worker_id), '');
  IF v_worker IS NULL THEN
    RAISE EXCEPTION 'invalid_worker_id';
  END IF;

  v_outcome := NULLIF(btrim(p_outcome), '');
  IF v_outcome IS NULL OR v_outcome NOT IN (
    'sent', 'retryable_failed', 'failed', 'manual_review'
  ) THEN
    RAISE EXCEPTION 'invalid_outcome';
  END IF;

  SELECT * INTO v_row
    FROM ops_notify_outbox
   WHERE id = p_notify_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ops_notify_not_found';
  END IF;

  IF v_row.status = 'sent' THEN
    RETURN jsonb_build_object('ok', TRUE, 'idempotent', TRUE, 'status', 'sent');
  END IF;

  IF v_row.status <> 'processing' THEN
    RAISE EXCEPTION 'invalid_ops_notify_status';
  END IF;

  IF v_row.claimed_by IS DISTINCT FROM v_worker
     AND (v_row.claim_expires_at IS NULL OR v_row.claim_expires_at >= NOW()) THEN
    RAISE EXCEPTION 'claim_owner_mismatch';
  END IF;

  v_attempts := v_row.attempts;
  IF p_provider_attempted THEN
    v_attempts := v_attempts + 1;
  END IF;

  IF v_outcome = 'sent' THEN
    UPDATE ops_notify_outbox
       SET status = 'sent',
           sent_at = NOW(),
           attempts = v_attempts,
           last_error_code = NULL,
           claimed_at = NULL,
           claimed_by = NULL,
           claim_expires_at = NULL,
           updated_at = NOW()
     WHERE id = p_notify_id;

    RETURN jsonb_build_object(
      'ok', TRUE,
      'status', 'sent',
      'provider_idempotency_key', v_row.provider_idempotency_key
    );
  END IF;

  IF v_outcome = 'manual_review' THEN
    UPDATE ops_notify_outbox
       SET status = 'manual_review',
           attempts = v_attempts,
           last_error_code = p_error_code,
           claimed_at = NULL,
           claimed_by = NULL,
           claim_expires_at = NULL,
           updated_at = NOW()
     WHERE id = p_notify_id;

    RETURN jsonb_build_object('ok', TRUE, 'status', 'manual_review');
  END IF;

  IF v_outcome = 'failed' OR v_attempts >= v_max_attempts THEN
    UPDATE ops_notify_outbox
       SET status = 'failed',
           attempts = v_attempts,
           last_error_code = p_error_code,
           claimed_at = NULL,
           claimed_by = NULL,
           claim_expires_at = NULL,
           updated_at = NOW()
     WHERE id = p_notify_id;

    RETURN jsonb_build_object('ok', TRUE, 'status', 'failed');
  END IF;

  UPDATE ops_notify_outbox
     SET status = 'retryable_failed',
         attempts = v_attempts,
         last_error_code = p_error_code,
         claimed_at = NULL,
         claimed_by = NULL,
         claim_expires_at = NULL,
         next_attempt_at = NOW() + (LEAST(v_attempts, 5) * INTERVAL '30 seconds'),
         updated_at = NOW()
   WHERE id = p_notify_id;

  RETURN jsonb_build_object('ok', TRUE, 'status', 'retryable_failed', 'attempts', v_attempts);
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_complete_ops_notify(UUID, TEXT, TEXT, TEXT, BOOLEAN)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_complete_ops_notify(UUID, TEXT, TEXT, TEXT, BOOLEAN)
  TO service_role;

-- Hook critical alert lifecycle → Telegram outbox (immediate notify)
CREATE OR REPLACE FUNCTION _upsert_threshold_ops_alert(
  p_dedupe_key TEXT,
  p_source_check_id TEXT,
  p_severity TEXT,
  p_summary TEXT,
  p_runbook_key TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_alert ops_alerts%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
  v_was_critical BOOLEAN := FALSE;
BEGIN
  IF p_severity NOT IN ('warning', 'critical') THEN
    RAISE EXCEPTION 'invalid_alert_severity';
  END IF;

  SELECT * INTO v_alert
  FROM ops_alerts
  WHERE dedupe_key = p_dedupe_key
    AND status IN ('open', 'acknowledged')
  FOR UPDATE;

  IF FOUND THEN
    v_was_critical := v_alert.severity = 'critical';

    UPDATE ops_alerts
       SET severity = p_severity,
           summary = p_summary,
           runbook_key = p_runbook_key,
           last_seen_at = v_now,
           occurrence_count = occurrence_count + 1,
           metadata = COALESCE(p_metadata, '{}'::JSONB),
           updated_at = v_now
     WHERE id = v_alert.id
     RETURNING * INTO v_alert;

    IF p_severity = 'critical' AND NOT v_was_critical THEN
      PERFORM _enqueue_ops_telegram_for_alert(v_alert.id, 'immediate');
    END IF;

    RETURN;
  END IF;

  INSERT INTO ops_alerts (
    dedupe_key, source_check_id, severity, status,
    summary, runbook_key, metadata
  ) VALUES (
    p_dedupe_key, p_source_check_id, p_severity, 'open',
    p_summary, p_runbook_key, COALESCE(p_metadata, '{}'::JSONB)
  )
  RETURNING * INTO v_alert;

  IF p_severity = 'critical' THEN
    PERFORM _enqueue_ops_telegram_for_alert(v_alert.id, 'immediate');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _upsert_threshold_ops_alert(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _sync_ops_alerts_from_health()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_snapshot JSONB;
  v_check JSONB;
  v_dedupe_key TEXT;
  v_check_id TEXT;
  v_check_status TEXT;
  v_severity TEXT;
  v_alert ops_alerts%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
  v_opened INT := 0;
  v_updated INT := 0;
  v_resolved INT := 0;
  v_metadata JSONB;
  v_threshold JSONB;
  v_was_critical BOOLEAN;
BEGIN
  v_snapshot := _ops_build_health_snapshot();

  FOR v_check IN SELECT value FROM jsonb_array_elements(v_snapshot->'checks')
  LOOP
    v_check_id := v_check->>'id';
    v_check_status := v_check->>'status';
    v_dedupe_key := v_check_id;
    v_metadata := v_check - 'id' - 'status' - 'summary' - 'runbookKey';

    IF v_check_status IN ('warning', 'critical') THEN
      v_severity := v_check_status;

      SELECT * INTO v_alert
      FROM ops_alerts
      WHERE dedupe_key = v_dedupe_key
        AND status IN ('open', 'acknowledged')
      FOR UPDATE;

      IF FOUND THEN
        v_was_critical := v_alert.severity = 'critical';

        UPDATE ops_alerts
           SET severity = v_severity,
               summary = v_check->>'summary',
               runbook_key = COALESCE(v_check->>'runbookKey', runbook_key),
               last_seen_at = v_now,
               occurrence_count = occurrence_count + 1,
               metadata = v_metadata,
               updated_at = v_now
         WHERE id = v_alert.id
         RETURNING * INTO v_alert;

        IF v_severity = 'critical' AND NOT v_was_critical THEN
          PERFORM _enqueue_ops_telegram_for_alert(v_alert.id, 'immediate');
        END IF;

        v_updated := v_updated + 1;
      ELSE
        INSERT INTO ops_alerts (
          dedupe_key, source_check_id, severity, status,
          summary, runbook_key, first_seen_at, last_seen_at,
          occurrence_count, metadata
        ) VALUES (
          v_dedupe_key,
          v_check_id,
          v_severity,
          'open',
          v_check->>'summary',
          COALESCE(v_check->>'runbookKey', 'unknown'),
          v_now,
          v_now,
          1,
          v_metadata
        )
        RETURNING * INTO v_alert;

        IF v_severity = 'critical' THEN
          PERFORM _enqueue_ops_telegram_for_alert(v_alert.id, 'immediate');
        END IF;

        v_opened := v_opened + 1;
      END IF;
    ELSIF v_check_status = 'ok' THEN
      FOR v_alert IN
        SELECT *
        FROM ops_alerts
        WHERE dedupe_key = v_dedupe_key
          AND status IN ('open', 'acknowledged')
        FOR UPDATE
      LOOP
        UPDATE ops_alerts
           SET status = 'resolved',
               resolved_at = v_now,
               resolve_reason = 'auto_resolved',
               updated_at = v_now
         WHERE id = v_alert.id;

        INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
        VALUES (
          NULL,
          'ops_alert_auto_resolved',
          'ops_alert',
          v_alert.id,
          jsonb_build_object(
            'source_check_id', v_check_id,
            'dedupe_key', v_dedupe_key,
            'previous_status', v_alert.status
          )
        );

        v_resolved := v_resolved + 1;
      END LOOP;
    END IF;
  END LOOP;

  v_threshold := _sync_threshold_ops_alerts();

  RETURN jsonb_build_object(
    'ok', TRUE,
    'opened', v_opened,
    'updated', v_updated,
    'resolved', v_resolved,
    'syncedAt', v_now,
    'thresholdSync', v_threshold
  );
END;
$$;

-- ─── Edge cron: ops-notify worker + critical pager digest (12:00/22:00 KST) ───
SELECT cron.unschedule('phonara_ops_notify')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'phonara_ops_notify');

SELECT cron.unschedule('phonara_ops_notify_digest')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'phonara_ops_notify_digest');

SELECT cron.schedule(
  'phonara_ops_notify',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'ops_notify_url' LIMIT 1),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'ops_notify_invoke_key' LIMIT 1),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
  WHERE EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'ops_notify_url')
    AND EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'ops_notify_invoke_key');
  $cron$
);

SELECT cron.schedule(
  'phonara_ops_notify_digest',
  '0 3,13 * * *',
  $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'ops_notify_url' LIMIT 1) || '?digest=critical',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'ops_notify_invoke_key' LIMIT 1),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
  WHERE EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'ops_notify_url')
    AND EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'ops_notify_invoke_key');
  $cron$
);
