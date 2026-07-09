-- ============================================================
-- Migration: 20260715000001_p6_edge_observability
-- Phase 6 — Edge observability: provider health + edge ops events
-- ============================================================

SET search_path = public, pg_temp;

-- ─── provider_health (DB authority for external provider status) ─────────────
CREATE TABLE IF NOT EXISTS provider_health (
  provider              TEXT NOT NULL,
  domain                TEXT NOT NULL,
  channel               TEXT NOT NULL DEFAULT '',
  status                TEXT NOT NULL CHECK (
    status IN ('healthy', 'degraded', 'unavailable', 'missing_config')
  ),
  last_ok_at            TIMESTAMPTZ,
  last_error_at         TIMESTAMPTZ,
  last_error_code       TEXT,
  consecutive_failures  INT NOT NULL DEFAULT 0 CHECK (consecutive_failures >= 0),
  last_request_id       TEXT,
  metadata              JSONB NOT NULL DEFAULT '{}'::JSONB,
  observed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, domain, channel)
);

CREATE INDEX IF NOT EXISTS provider_health_status_idx
  ON provider_health (domain, status, observed_at DESC);

ALTER TABLE provider_health ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_health: admin read" ON provider_health;
CREATE POLICY "provider_health: admin read"
  ON provider_health FOR SELECT
  USING (_is_admin());

REVOKE ALL ON TABLE provider_health FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE provider_health TO authenticated;
GRANT ALL ON TABLE provider_health TO service_role;

-- ─── edge_ops_events (append-only Edge lifecycle events) ───────────────────
CREATE TABLE IF NOT EXISTS edge_ops_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id        TEXT NOT NULL,
  function_name     TEXT NOT NULL,
  event_key         TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('ok', 'error')),
  duration_ms       INT CHECK (duration_ms IS NULL OR duration_ms >= 0),
  duration_bucket   TEXT,
  batch_count       INT CHECK (batch_count IS NULL OR batch_count >= 0),
  skipped_count     INT CHECK (skipped_count IS NULL OR skipped_count >= 0),
  error_code        TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS edge_ops_events_lookup_idx
  ON edge_ops_events (function_name, created_at DESC);

CREATE INDEX IF NOT EXISTS edge_ops_events_request_idx
  ON edge_ops_events (request_id, created_at DESC);

ALTER TABLE edge_ops_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "edge_ops_events: admin read" ON edge_ops_events;
CREATE POLICY "edge_ops_events: admin read"
  ON edge_ops_events FOR SELECT
  USING (_is_admin());

REVOKE ALL ON TABLE edge_ops_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE edge_ops_events TO authenticated;
GRANT ALL ON TABLE edge_ops_events TO service_role;

-- ─── Service RPC: upsert provider health ─────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_service_upsert_provider_health(
  p_provider TEXT,
  p_domain TEXT,
  p_channel TEXT DEFAULT '',
  p_status TEXT DEFAULT 'healthy',
  p_error_code TEXT DEFAULT NULL,
  p_request_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_prev provider_health%ROWTYPE;
  v_failures INT := 0;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'service_role_only';
  END IF;

  IF p_status NOT IN ('healthy', 'degraded', 'unavailable', 'missing_config') THEN
    RAISE EXCEPTION 'invalid_provider_health_status';
  END IF;

  SELECT * INTO v_prev
  FROM provider_health
  WHERE provider = p_provider
    AND domain = p_domain
    AND channel = COALESCE(p_channel, '');

  IF p_status = 'healthy' THEN
    v_failures := 0;
  ELSIF FOUND THEN
    v_failures := v_prev.consecutive_failures + 1;
  ELSE
    v_failures := 1;
  END IF;

  INSERT INTO provider_health (
    provider, domain, channel, status,
    last_ok_at, last_error_at, last_error_code,
    consecutive_failures, last_request_id, metadata,
    observed_at, updated_at
  ) VALUES (
    p_provider,
    p_domain,
    COALESCE(p_channel, ''),
    p_status,
    CASE WHEN p_status = 'healthy' THEN v_now ELSE v_prev.last_ok_at END,
    CASE WHEN p_status = 'healthy' THEN v_prev.last_error_at ELSE v_now END,
    CASE WHEN p_status = 'healthy' THEN NULL ELSE p_error_code END,
    v_failures,
    p_request_id,
    COALESCE(p_metadata, '{}'::JSONB),
    v_now,
    v_now
  )
  ON CONFLICT (provider, domain, channel) DO UPDATE SET
    status = EXCLUDED.status,
    last_ok_at = CASE
      WHEN EXCLUDED.status = 'healthy' THEN v_now
      ELSE provider_health.last_ok_at
    END,
    last_error_at = CASE
      WHEN EXCLUDED.status = 'healthy' THEN provider_health.last_error_at
      ELSE v_now
    END,
    last_error_code = CASE
      WHEN EXCLUDED.status = 'healthy' THEN NULL
      ELSE EXCLUDED.last_error_code
    END,
    consecutive_failures = EXCLUDED.consecutive_failures,
    last_request_id = EXCLUDED.last_request_id,
    metadata = EXCLUDED.metadata,
    observed_at = v_now,
    updated_at = v_now;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'provider', p_provider,
    'domain', p_domain,
    'channel', COALESCE(p_channel, ''),
    'status', p_status,
    'consecutiveFailures', v_failures,
    'requestId', p_request_id
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_upsert_provider_health(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_upsert_provider_health(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB)
  TO service_role;

-- ─── Service RPC: record edge ops event ──────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_service_record_edge_ops_event(
  p_request_id TEXT,
  p_function_name TEXT,
  p_event_key TEXT,
  p_status TEXT,
  p_duration_ms INT DEFAULT NULL,
  p_duration_bucket TEXT DEFAULT NULL,
  p_batch_count INT DEFAULT NULL,
  p_skipped_count INT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'service_role_only';
  END IF;

  IF p_status NOT IN ('ok', 'error') THEN
    RAISE EXCEPTION 'invalid_edge_ops_status';
  END IF;

  INSERT INTO edge_ops_events (
    request_id, function_name, event_key, status,
    duration_ms, duration_bucket, batch_count, skipped_count,
    error_code, metadata
  ) VALUES (
    p_request_id,
    p_function_name,
    p_event_key,
    p_status,
    p_duration_ms,
    p_duration_bucket,
    p_batch_count,
    p_skipped_count,
    p_error_code,
    COALESCE(p_metadata, '{}'::JSONB)
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'id', v_id,
    'requestId', p_request_id,
    'eventKey', p_event_key
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_record_edge_ops_event(TEXT, TEXT, TEXT, TEXT, INT, TEXT, INT, INT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_record_edge_ops_event(TEXT, TEXT, TEXT, TEXT, INT, TEXT, INT, INT, TEXT, JSONB)
  TO service_role;

-- ─── Extend edge failure snapshot with provider health ───────────────────────
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
  v_degraded_providers INT := 0;
  v_unavailable_providers INT := 0;
  v_missing_config_providers INT := 0;
  v_edge_errors_24h INT := 0;
BEGIN
  SELECT COUNT(*)::INT
    INTO v_stale_processing
  FROM notification_outbox
  WHERE status = 'processing'
    AND claim_expires_at IS NOT NULL
    AND claim_expires_at < v_now;

  SELECT
    COUNT(*) FILTER (WHERE status = 'degraded')::INT,
    COUNT(*) FILTER (WHERE status = 'unavailable')::INT,
    COUNT(*) FILTER (WHERE status = 'missing_config')::INT
  INTO v_degraded_providers, v_unavailable_providers, v_missing_config_providers
  FROM provider_health;

  SELECT COUNT(*)::INT
    INTO v_edge_errors_24h
  FROM edge_ops_events
  WHERE status = 'error'
    AND created_at >= v_now - INTERVAL '24 hours';

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
    'providerHealth', jsonb_build_object(
      'degraded', v_degraded_providers,
      'unavailable', v_unavailable_providers,
      'missingConfig', v_missing_config_providers,
      'recentRows', (
        SELECT COALESCE(jsonb_agg(row_to_json(ph)::JSONB ORDER BY ph.observed_at DESC), '[]'::JSONB)
        FROM (
          SELECT provider, domain, channel, status, last_error_code,
                 consecutive_failures, last_request_id, observed_at
          FROM provider_health
          WHERE status <> 'healthy'
          ORDER BY observed_at DESC
          LIMIT 20
        ) ph
      )
    ),
    'edgeOpsEvents', jsonb_build_object(
      'errors24h', v_edge_errors_24h
    ),
    'observedAt', v_now
  );
END;
$$;

REVOKE ALL ON FUNCTION _build_edge_failure_snapshot()
  FROM PUBLIC, anon, authenticated;
