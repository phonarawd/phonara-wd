-- ============================================================
-- Migration: 20260714000001_p1b_admin_ops_visibility
-- Phase 2.5 — Admin/ops observability contract (DB/RPC only; no UI)
-- ============================================================
-- Operator single-pane read contract:
--   money flow aggregates, edge failure counts, reconciliation,
--   security baseline (advisor-equivalent inventory), exception queues,
--   ops_alert_thresholds with audit history.
-- ============================================================

SET search_path = public, pg_temp;

-- ─── ops_alert_thresholds (operator-tunable alert promotion) ─────────────────
CREATE TABLE IF NOT EXISTS ops_alert_thresholds (
  domain            TEXT NOT NULL,
  threshold_key     TEXT NOT NULL,
  severity          TEXT NOT NULL CHECK (severity IN ('warn', 'high', 'critical')),
  threshold_value   INT NOT NULL CHECK (threshold_value >= 0),
  window_seconds    INT NOT NULL CHECK (window_seconds > 0),
  dedupe_scope      TEXT NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by        TEXT NOT NULL,
  change_reason     TEXT NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (domain, threshold_key)
);

CREATE INDEX IF NOT EXISTS ops_alert_thresholds_active_idx
  ON ops_alert_thresholds (domain, is_active)
  WHERE is_active;

ALTER TABLE ops_alert_thresholds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ops_alert_thresholds: admin read" ON ops_alert_thresholds;
CREATE POLICY "ops_alert_thresholds: admin read"
  ON ops_alert_thresholds FOR SELECT
  USING (_is_admin());

REVOKE ALL ON TABLE ops_alert_thresholds FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE ops_alert_thresholds TO authenticated;
GRANT ALL ON TABLE ops_alert_thresholds TO service_role;

-- ─── append-only threshold change history ────────────────────────────────────
CREATE TABLE IF NOT EXISTS ops_alert_threshold_history (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain                  TEXT NOT NULL,
  threshold_key           TEXT NOT NULL,
  severity                TEXT NOT NULL,
  previous_value          INT,
  new_value               INT NOT NULL,
  previous_window_seconds INT,
  new_window_seconds      INT NOT NULL,
  changed_by              TEXT NOT NULL,
  change_reason           TEXT NOT NULL,
  changed_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ops_alert_threshold_history_lookup_idx
  ON ops_alert_threshold_history (domain, threshold_key, changed_at DESC);

ALTER TABLE ops_alert_threshold_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ops_alert_threshold_history: admin read" ON ops_alert_threshold_history;
CREATE POLICY "ops_alert_threshold_history: admin read"
  ON ops_alert_threshold_history FOR SELECT
  USING (_is_admin());

REVOKE ALL ON TABLE ops_alert_threshold_history FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE ops_alert_threshold_history TO authenticated;
GRANT ALL ON TABLE ops_alert_threshold_history TO service_role;

-- Seed defaults — changed_by system:migration per Phase 2.5 contract
INSERT INTO ops_alert_thresholds (
  domain, threshold_key, severity, threshold_value, window_seconds,
  dedupe_scope, changed_by, change_reason
) VALUES
  ('notification', 'ops.notification.failure_warn_threshold', 'warn', 3, 900,
   'channel', 'system:migration', 'Phase 2.5 seed — notification warn promotion'),
  ('notification', 'ops.notification.failure_critical_threshold', 'critical', 10, 3600,
   'channel', 'system:migration', 'Phase 2.5 seed — notification critical promotion'),
  ('withdrawal', 'ops.withdrawal.broadcast_failure_threshold', 'high', 1, 86400,
   'withdrawal', 'system:migration', 'Phase 2.5 seed — broadcast failure immediate high'),
  ('price_feed', 'ops.price_feed.provider_failure_threshold', 'warn', 3, 1800,
   'provider_symbol', 'system:migration', 'Phase 2.5 seed — provider failure warn'),
  ('reconciliation', 'ops.reconciliation.mismatch_threshold', 'critical', 1, 86400,
   'global', 'system:migration', 'Phase 2.5 seed — reconciliation mismatch critical')
ON CONFLICT (domain, threshold_key) DO NOTHING;

-- ─── Internal: active threshold lookup ───────────────────────────────────────
CREATE OR REPLACE FUNCTION _get_active_ops_alert_threshold(
  p_domain TEXT,
  p_threshold_key TEXT
)
RETURNS ops_alert_thresholds
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT t.*
  FROM ops_alert_thresholds t
  WHERE t.domain = p_domain
    AND t.threshold_key = p_threshold_key
    AND t.is_active
    AND t.effective_from <= NOW()
  ORDER BY t.effective_from DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION _get_active_ops_alert_threshold(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

-- ─── Internal: security baseline snapshot (advisor-equivalent inventory) ─────
CREATE OR REPLACE FUNCTION _build_security_baseline_snapshot()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rls_off INT := 0;
  v_definer_no_path INT := 0;
  v_status TEXT := 'ok';
BEGIN
  SELECT COUNT(*)::INT
    INTO v_rls_off
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND NOT c.relrowsecurity;

  SELECT COUNT(*)::INT
    INTO v_definer_no_path
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef
    AND NOT EXISTS (
      SELECT 1
      FROM unnest(COALESCE(p.proconfig, ARRAY[]::TEXT[])) cfg
      WHERE cfg LIKE 'search_path=%'
    );

  IF v_rls_off > 0 OR v_definer_no_path > 0 THEN
    v_status := 'critical';
  END IF;

  RETURN jsonb_build_object(
    'status', v_status,
    'rlsOffPublicTables', v_rls_off,
    'definerWithoutSearchPath', v_definer_no_path,
    'observedAt', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION _build_security_baseline_snapshot()
  FROM PUBLIC, anon, authenticated;

-- ─── Internal: money flow + edge failure aggregates ──────────────────────────
CREATE OR REPLACE FUNCTION _build_money_flow_snapshot()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
BEGIN
  RETURN jsonb_build_object(
    'withdrawals', jsonb_build_object(
      'pending', (SELECT COUNT(*)::INT FROM withdrawal_requests WHERE status = 'pending'),
      'approved', (SELECT COUNT(*)::INT FROM withdrawal_requests WHERE status = 'approved'),
      'broadcasting', (SELECT COUNT(*)::INT FROM withdrawal_requests WHERE status = 'broadcasting'),
      'broadcast_failed', (SELECT COUNT(*)::INT FROM withdrawal_requests WHERE status = 'broadcast_failed'),
      'processing', (SELECT COUNT(*)::INT FROM withdrawal_requests WHERE status = 'processing'),
      'sent', (SELECT COUNT(*)::INT FROM withdrawal_requests WHERE status = 'sent'),
      'completed', (SELECT COUNT(*)::INT FROM withdrawal_requests WHERE status = 'completed'),
      'rejected', (SELECT COUNT(*)::INT FROM withdrawal_requests WHERE status = 'rejected')
    ),
    'deposits', jsonb_build_object(
      'unmatched_bank_transfers', (
        SELECT COUNT(*)::INT FROM bank_incoming_transfers WHERE matched_deposit_id IS NULL
      ),
      'unmatched_chain_transfers', (
        SELECT COUNT(*)::INT FROM on_chain_incoming_transfers WHERE matched_deposit_id IS NULL
      ),
      'pending_review_queue', (
        SELECT COUNT(*)::INT
        FROM admin_review_queue
        WHERE status IN ('pending', 'in_review')
          AND queue_type IN ('deposit', 'kyc', 'aml', 'sanctions')
      )
    ),
    'observedAt', v_now
  );
END;
$$;

REVOKE ALL ON FUNCTION _build_money_flow_snapshot()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _build_edge_failure_snapshot()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_stale_processing INT := 0;
BEGIN
  SELECT COUNT(*)::INT
    INTO v_stale_processing
  FROM notification_outbox
  WHERE status = 'processing'
    AND claim_expires_at IS NOT NULL
    AND claim_expires_at < v_now;

  RETURN jsonb_build_object(
    'notifications', jsonb_build_object(
      'pending', (SELECT COUNT(*)::INT FROM notification_outbox WHERE status = 'pending'),
      'processing', (SELECT COUNT(*)::INT FROM notification_outbox WHERE status = 'processing'),
      'retryable_failed', (SELECT COUNT(*)::INT FROM notification_outbox WHERE status = 'retryable_failed'),
      'failed', (SELECT COUNT(*)::INT FROM notification_outbox WHERE status = 'failed'),
      'manual_review', (SELECT COUNT(*)::INT FROM notification_outbox WHERE status = 'manual_review'),
      'stale_processing', v_stale_processing
    ),
    'withdrawals', jsonb_build_object(
      'broadcast_failed', (SELECT COUNT(*)::INT FROM withdrawal_requests WHERE status = 'broadcast_failed'),
      'approved_awaiting_broadcast', (
        SELECT COUNT(*)::INT
        FROM withdrawal_requests
        WHERE status = 'approved'
          AND on_chain_tx_hash IS NULL
      )
    ),
    'webhooks', jsonb_build_object(
      'replay_rows_24h', (
        SELECT COUNT(*)::INT
        FROM pg_webhook_replay
        WHERE first_seen_at >= v_now - INTERVAL '24 hours'
      )
    ),
    'observedAt', v_now
  );
END;
$$;

REVOKE ALL ON FUNCTION _build_edge_failure_snapshot()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _build_reconciliation_snapshot()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_latest_at TIMESTAMPTZ;
  v_failed BOOLEAN := FALSE;
  v_failed_types TEXT;
  v_hc_wallet_broken INT := 0;
  v_hc_system_broken INT := 0;
BEGIN
  SELECT MAX(run_at) INTO v_latest_at FROM reconciliation_log;

  IF v_latest_at IS NOT NULL THEN
    SELECT
      EXISTS (
        SELECT 1 FROM reconciliation_log
        WHERE run_at = v_latest_at
          AND (is_match = FALSE OR triggered_halt = TRUE)
      ),
      string_agg(check_type, ', ' ORDER BY check_type)
    INTO v_failed, v_failed_types
    FROM reconciliation_log
    WHERE run_at = v_latest_at
      AND (is_match = FALSE OR triggered_halt = TRUE);

    SELECT
      COALESCE(MAX(broken_count) FILTER (WHERE check_type = 'hash_chain_wallet'), 0),
      COALESCE(MAX(broken_count) FILTER (WHERE check_type = 'hash_chain_system'), 0)
    INTO v_hc_wallet_broken, v_hc_system_broken
    FROM reconciliation_log
    WHERE run_at = v_latest_at
      AND check_type IN ('hash_chain_wallet', 'hash_chain_system');
  END IF;

  RETURN jsonb_build_object(
    'latestRunAt', v_latest_at,
    'latestFailed', COALESCE(v_failed, FALSE),
    'failedCheckTypes', v_failed_types,
    'hashChainWalletBroken', v_hc_wallet_broken,
    'hashChainSystemBroken', v_hc_system_broken,
    'status', CASE
      WHEN v_latest_at IS NULL THEN 'warning'
      WHEN v_failed OR v_hc_wallet_broken > 0 OR v_hc_system_broken > 0 THEN 'critical'
      ELSE 'ok'
    END,
    'observedAt', v_now
  );
END;
$$;

REVOKE ALL ON FUNCTION _build_reconciliation_snapshot()
  FROM PUBLIC, anon, authenticated;

-- ─── Internal: threshold-based alert promotion ───────────────────────────────
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
    UPDATE ops_alerts
       SET severity = p_severity,
           summary = p_summary,
           runbook_key = p_runbook_key,
           last_seen_at = v_now,
           occurrence_count = occurrence_count + 1,
           metadata = COALESCE(p_metadata, '{}'::JSONB),
           updated_at = v_now
     WHERE id = v_alert.id;
    RETURN;
  END IF;

  INSERT INTO ops_alerts (
    dedupe_key, source_check_id, severity, status,
    summary, runbook_key, metadata
  ) VALUES (
    p_dedupe_key, p_source_check_id, p_severity, 'open',
    p_summary, p_runbook_key, COALESCE(p_metadata, '{}'::JSONB)
  );
END;
$$;

REVOKE ALL ON FUNCTION _upsert_threshold_ops_alert(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _sync_threshold_ops_alerts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_thr ops_alert_thresholds;
  v_count INT;
  v_rec RECORD;
  v_promoted INT := 0;
BEGIN
  -- reconciliation mismatch — threshold 1 critical
  v_thr := _get_active_ops_alert_threshold('reconciliation', 'ops.reconciliation.mismatch_threshold');
  IF v_thr.threshold_key IS NOT NULL THEN
    SELECT COUNT(*)::INT INTO v_count
    FROM reconciliation_log
    WHERE run_at >= v_now - make_interval(secs => v_thr.window_seconds)
      AND (is_match = FALSE OR triggered_halt = TRUE);

    IF v_count >= v_thr.threshold_value THEN
      PERFORM _upsert_threshold_ops_alert(
        'threshold:reconciliation:mismatch',
        'reconciliation_mismatch',
        'critical',
        v_count::TEXT || ' reconciliation mismatch(es) in window',
        'reconciliation_mismatch',
        jsonb_build_object('count', v_count, 'windowSeconds', v_thr.window_seconds)
      );
      v_promoted := v_promoted + 1;
    END IF;
  END IF;

  -- withdrawal broadcast failure — threshold 1 high → critical severity in ops_alerts
  v_thr := _get_active_ops_alert_threshold('withdrawal', 'ops.withdrawal.broadcast_failure_threshold');
  IF v_thr.threshold_key IS NOT NULL THEN
    SELECT COUNT(*)::INT INTO v_count
    FROM withdrawal_requests
    WHERE status = 'broadcast_failed'
      AND updated_at >= v_now - make_interval(secs => v_thr.window_seconds);

    IF v_count >= v_thr.threshold_value THEN
      PERFORM _upsert_threshold_ops_alert(
        'threshold:withdrawal:broadcast_failure',
        'withdrawal_broadcast_failure',
        'critical',
        v_count::TEXT || ' withdrawal broadcast failure(s) require review',
        'withdrawal.broadcast_failed',
        jsonb_build_object('count', v_count, 'windowSeconds', v_thr.window_seconds)
      );
      v_promoted := v_promoted + 1;
    END IF;
  END IF;

  -- notification failures by channel
  v_thr := _get_active_ops_alert_threshold('notification', 'ops.notification.failure_critical_threshold');
  IF v_thr.threshold_key IS NOT NULL THEN
    FOR v_rec IN
      SELECT channel, COUNT(*)::INT AS cnt
      FROM notification_outbox
      WHERE status IN ('failed', 'manual_review')
        AND COALESCE(sent_at, created_at) >= v_now - make_interval(secs => v_thr.window_seconds)
      GROUP BY channel
      HAVING COUNT(*) >= v_thr.threshold_value
    LOOP
      PERFORM _upsert_threshold_ops_alert(
        'threshold:notification:critical:' || v_rec.channel,
        'notification_dispatch_failure',
        'critical',
        v_rec.cnt::TEXT || ' terminal notification failure(s) on channel ' || v_rec.channel,
        'notification.dispatch_failed',
        jsonb_build_object('channel', v_rec.channel, 'count', v_rec.cnt)
      );
      v_promoted := v_promoted + 1;
    END LOOP;
  END IF;

  v_thr := _get_active_ops_alert_threshold('notification', 'ops.notification.failure_warn_threshold');
  IF v_thr.threshold_key IS NOT NULL THEN
    FOR v_rec IN
      SELECT channel, COUNT(*)::INT AS cnt
      FROM notification_outbox
      WHERE status IN ('retryable_failed', 'failed')
        AND COALESCE(sent_at, created_at) >= v_now - make_interval(secs => v_thr.window_seconds)
      GROUP BY channel
      HAVING COUNT(*) >= v_thr.threshold_value
    LOOP
      PERFORM _upsert_threshold_ops_alert(
        'threshold:notification:warn:' || v_rec.channel,
        'notification_dispatch_failure',
        'warning',
        v_rec.cnt::TEXT || ' notification failure(s) on channel ' || v_rec.channel,
        'notification.dispatch_degraded',
        jsonb_build_object('channel', v_rec.channel, 'count', v_rec.cnt)
      );
      v_promoted := v_promoted + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ok', TRUE, 'promoted', v_promoted, 'syncedAt', v_now);
END;
$$;

REVOKE ALL ON FUNCTION _sync_threshold_ops_alerts()
  FROM PUBLIC, anon, authenticated;

-- Extend health sync to include threshold promotion (append-only to return payload)
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
        UPDATE ops_alerts
           SET severity = v_severity,
               summary = v_check->>'summary',
               runbook_key = COALESCE(v_check->>'runbookKey', runbook_key),
               last_seen_at = v_now,
               occurrence_count = occurrence_count + 1,
               metadata = v_metadata,
               updated_at = v_now
         WHERE id = v_alert.id;
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
        );
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

-- ─── Admin read RPCs ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_admin_get_ops_dashboard()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_health JSONB;
  v_money JSONB;
  v_edge JSONB;
  v_recon JSONB;
  v_security JSONB;
  v_open_alerts INT := 0;
  v_critical_alerts INT := 0;
  v_overall TEXT := 'ok';
  v_exc JSONB;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT _is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;

  v_health := _ops_build_health_snapshot();
  v_money := _build_money_flow_snapshot();
  v_edge := _build_edge_failure_snapshot();
  v_recon := _build_reconciliation_snapshot();
  v_security := _build_security_baseline_snapshot();

  SELECT COUNT(*)::INT,
         COUNT(*) FILTER (WHERE severity = 'critical')::INT
    INTO v_open_alerts, v_critical_alerts
  FROM ops_alerts
  WHERE status IN ('open', 'acknowledged');

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'queueType', queue_type,
    'openCount', cnt,
    'overdueCount', overdue
  ) ORDER BY cnt DESC), '[]'::JSONB)
  INTO v_exc
  FROM (
    SELECT
      queue_type,
      COUNT(*)::INT AS cnt,
      COUNT(*) FILTER (WHERE sla_due_at < v_now)::INT AS overdue
    FROM admin_review_queue
    WHERE status IN ('pending', 'in_review')
    GROUP BY queue_type
  ) q;

  IF (v_health->>'status') = 'critical'
     OR (v_recon->>'status') = 'critical'
     OR (v_security->>'status') = 'critical'
     OR v_critical_alerts > 0 THEN
    v_overall := 'critical';
  ELSIF (v_health->>'status') = 'warning'
     OR (v_recon->>'status') = 'warning'
     OR v_open_alerts > 0 THEN
    v_overall := 'warning';
  END IF;

  RETURN jsonb_build_object(
    'overallStatus', v_overall,
    'fetchedAt', v_now,
    'platformMode', (
      SELECT jsonb_build_object(
        'systemHalt', COALESCE(MAX(value) FILTER (WHERE key = 'system_halt'), 'false'),
        'systemReadonly', COALESCE(MAX(value) FILTER (WHERE key = 'system_readonly'), 'false'),
        'observedAt', MAX(updated_at) FILTER (WHERE key IN ('system_halt', 'system_readonly'))
      )
      FROM app_config
      WHERE key IN ('system_halt', 'system_readonly')
    ),
    'reconciliation', v_recon,
    'moneyFlow', v_money,
    'edgeFailures', v_edge,
    'exceptionQueues', v_exc,
    'opsAlerts', jsonb_build_object(
      'open', v_open_alerts,
      'critical', v_critical_alerts
    ),
    'securityBaseline', v_security,
    'healthChecks', v_health->'checks'
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_admin_list_exception_queue(
  p_domain TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit INT;
  v_rows JSONB := '[]'::JSONB;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT _is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;

  v_limit := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);

  IF p_domain IS NULL OR p_domain = 'admin_review' THEN
    SELECT COALESCE(jsonb_agg(row_to_json(q)::JSONB ORDER BY q.sla_due_at ASC NULLS LAST), '[]'::JSONB)
      INTO v_rows
    FROM (
      SELECT
        id,
        'admin_review' AS domain,
        queue_type AS item_type,
        entity_type,
        entity_id,
        user_id,
        status,
        reason,
        sla_due_at,
        created_at
      FROM admin_review_queue
      WHERE status IN ('pending', 'in_review')
      ORDER BY sla_due_at ASC NULLS LAST, created_at ASC
      LIMIT v_limit
    ) q;
  ELSIF p_domain = 'notification' THEN
    SELECT COALESCE(jsonb_agg(row_to_json(q)::JSONB ORDER BY q.observed_at DESC), '[]'::JSONB)
      INTO v_rows
    FROM (
      SELECT
        id,
        'notification' AS domain,
        channel AS item_type,
        status,
        attempts,
        last_error_code,
        last_error,
        COALESCE(sent_at, created_at) AS observed_at,
        created_at
      FROM notification_outbox
      WHERE status IN ('failed', 'manual_review', 'retryable_failed')
      ORDER BY COALESCE(sent_at, created_at) DESC
      LIMIT v_limit
    ) q;
  ELSIF p_domain = 'withdrawal' THEN
    SELECT COALESCE(jsonb_agg(row_to_json(q)::JSONB ORDER BY q.updated_at DESC), '[]'::JSONB)
      INTO v_rows
    FROM (
      SELECT
        id,
        'withdrawal' AS domain,
        status AS item_type,
        currency,
        amount,
        user_id,
        on_chain_tx_hash,
        updated_at,
        created_at
      FROM withdrawal_requests
      WHERE status IN ('broadcast_failed', 'approved', 'broadcasting')
      ORDER BY updated_at DESC
      LIMIT v_limit
    ) q;
  ELSIF p_domain = 'deposit' THEN
    SELECT COALESCE(jsonb_agg(row_to_json(q)::JSONB ORDER BY q.created_at DESC), '[]'::JSONB)
      INTO v_rows
    FROM (
      SELECT
        id,
        'deposit_bank' AS domain,
        transfer_id AS item_type,
        amount_krw AS amount,
        depositor_name,
        reference_code,
        received_at,
        created_at
      FROM bank_incoming_transfers
      WHERE matched_deposit_id IS NULL
      ORDER BY created_at DESC
      LIMIT v_limit
    ) q;
  ELSIF p_domain = 'price_feed' THEN
    SELECT COALESCE(jsonb_agg(row_to_json(q)::JSONB ORDER BY q.submitted_at ASC), '[]'::JSONB)
      INTO v_rows
    FROM (
      SELECT
        symbol,
        'price_feed' AS domain,
        COUNT(DISTINCT source_name)::INT AS source_count,
        MAX(submitted_at) AS latest_submitted_at,
        MIN(submitted_at) AS oldest_submitted_at
      FROM oracle_source_prices
      GROUP BY symbol
      HAVING MAX(submitted_at) < v_now - INTERVAL '15 minutes'
         OR COUNT(DISTINCT source_name) < 2
      ORDER BY MIN(submitted_at) ASC
      LIMIT v_limit
    ) q;
  ELSE
    RAISE EXCEPTION 'invalid_exception_domain';
  END IF;

  RETURN jsonb_build_object(
    'domain', COALESCE(p_domain, 'admin_review'),
    'items', v_rows,
    'fetchedAt', v_now
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_admin_list_alert_thresholds()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT _is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;

  RETURN jsonb_build_object(
    'thresholds', COALESCE((
      SELECT jsonb_agg(row_to_json(t)::JSONB ORDER BY t.domain, t.threshold_key)
      FROM ops_alert_thresholds t
      WHERE t.is_active
    ), '[]'::JSONB),
    'fetchedAt', NOW()
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_admin_set_alert_threshold(
  p_domain TEXT,
  p_threshold_key TEXT,
  p_threshold_value INT,
  p_window_seconds INT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_row ops_alert_thresholds%ROWTYPE;
  v_actor_ref TEXT;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT _is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  PERFORM _assert_admin_aal2();

  IF p_reason IS NULL OR length(btrim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;
  IF p_threshold_value IS NULL OR p_threshold_value < 0 THEN
    RAISE EXCEPTION 'invalid_threshold_value';
  END IF;
  IF p_window_seconds IS NULL OR p_window_seconds <= 0 THEN
    RAISE EXCEPTION 'invalid_window_seconds';
  END IF;

  SELECT * INTO v_row
  FROM ops_alert_thresholds
  WHERE domain = p_domain AND threshold_key = p_threshold_key
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'threshold_not_found'; END IF;

  v_actor_ref := 'admin:' || v_actor::TEXT;

  INSERT INTO ops_alert_threshold_history (
    domain, threshold_key, severity,
    previous_value, new_value,
    previous_window_seconds, new_window_seconds,
    changed_by, change_reason
  ) VALUES (
    v_row.domain, v_row.threshold_key, v_row.severity,
    v_row.threshold_value, p_threshold_value,
    v_row.window_seconds, p_window_seconds,
    v_actor_ref, p_reason
  );

  UPDATE ops_alert_thresholds
     SET threshold_value = p_threshold_value,
         window_seconds = p_window_seconds,
         changed_by = v_actor_ref,
         change_reason = p_reason,
         updated_at = NOW()
   WHERE domain = p_domain AND threshold_key = p_threshold_key;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (
    v_actor,
    'ops_alert_threshold_updated',
    'ops_alert_threshold',
    NULL,
    jsonb_build_object(
      'domain', p_domain,
      'threshold_key', p_threshold_key,
      'previous_value', v_row.threshold_value,
      'new_value', p_threshold_value,
      'previous_window_seconds', v_row.window_seconds,
      'new_window_seconds', p_window_seconds,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object(
    'ok', TRUE,
    'domain', p_domain,
    'thresholdKey', p_threshold_key,
    'thresholdValue', p_threshold_value,
    'windowSeconds', p_window_seconds
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_get_ops_dashboard() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION rpc_admin_list_exception_queue(TEXT, INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION rpc_admin_list_alert_thresholds() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION rpc_admin_set_alert_threshold(TEXT, TEXT, INT, INT, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION rpc_admin_get_ops_dashboard() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION rpc_admin_list_exception_queue(TEXT, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION rpc_admin_list_alert_thresholds() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION rpc_admin_set_alert_threshold(TEXT, TEXT, INT, INT, TEXT) TO authenticated, service_role;
