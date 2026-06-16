-- ============================================================
-- Migration: 20260616000107_wave_s11_sports_ingest_ops
-- Wave-S11: ingest health · lag metrics · ops_alerts sync
-- ============================================================

SET search_path = public, pg_temp;

CREATE TABLE IF NOT EXISTS sports_ingest_health (
  channel             TEXT NOT NULL,
  league_code         TEXT NOT NULL DEFAULT '_all',
  vendor              TEXT,
  status              TEXT NOT NULL,
  last_success_at     TIMESTAMPTZ,
  last_attempt_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error_at       TIMESTAMPTZ,
  last_error          TEXT,
  lag_ms              BIGINT,
  messages_processed  BIGINT NOT NULL DEFAULT 0,
  metadata            JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (channel, league_code),
  CONSTRAINT sports_ingest_health_status_chk CHECK (
    status IN ('healthy', 'degraded', 'stale', 'error', 'disabled', 'skipped')
  ),
  CONSTRAINT sports_ingest_health_channel_chk CHECK (
    channel IN ('rest', 'ws', 'settle', 'orchestrator')
  )
);

CREATE INDEX IF NOT EXISTS sports_ingest_health_status_idx
  ON sports_ingest_health (status, updated_at DESC);

ALTER TABLE sports_ingest_health ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role all sports_ingest_health" ON sports_ingest_health;
CREATE POLICY "service_role all sports_ingest_health" ON sports_ingest_health
  FOR ALL USING (auth.role() = 'service_role');

REVOKE ALL ON sports_ingest_health FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sports_ingest_health TO service_role;

CREATE OR REPLACE FUNCTION rpc_record_sports_ingest_health(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_channel TEXT := COALESCE(NULLIF(btrim(p_payload->>'channel'), ''), 'orchestrator');
  v_league  TEXT := COALESCE(NULLIF(btrim(p_payload->>'leagueCode'), ''), '_all');
  v_status  TEXT := COALESCE(NULLIF(btrim(p_payload->>'status'), ''), 'healthy');
  v_now     TIMESTAMPTZ := NOW();
BEGIN
  IF v_channel NOT IN ('rest', 'ws', 'settle', 'orchestrator') THEN
    RAISE EXCEPTION 'invalid_ingest_health_channel';
  END IF;

  IF v_status NOT IN ('healthy', 'degraded', 'stale', 'error', 'disabled', 'skipped') THEN
    RAISE EXCEPTION 'invalid_ingest_health_status';
  END IF;

  INSERT INTO sports_ingest_health (
    channel, league_code, vendor, status,
    last_success_at, last_attempt_at, last_error_at, last_error,
    lag_ms, messages_processed, metadata, updated_at
  ) VALUES (
    v_channel,
    v_league,
    NULLIF(p_payload->>'vendor', ''),
    v_status,
    CASE
      WHEN (p_payload->>'lastSuccessAt') IS NOT NULL AND btrim(p_payload->>'lastSuccessAt') <> ''
      THEN (p_payload->>'lastSuccessAt')::TIMESTAMPTZ
      WHEN v_status = 'healthy' THEN v_now
      ELSE NULL
    END,
    v_now,
    CASE
      WHEN (p_payload->>'lastErrorAt') IS NOT NULL AND btrim(p_payload->>'lastErrorAt') <> ''
      THEN (p_payload->>'lastErrorAt')::TIMESTAMPTZ
      WHEN v_status = 'error' THEN v_now
      ELSE NULL
    END,
    NULLIF(p_payload->>'lastError', ''),
    NULLIF(p_payload->>'lagMs', '')::BIGINT,
    COALESCE(NULLIF(p_payload->>'messagesProcessed', '')::BIGINT, 0),
    COALESCE(p_payload->'metadata', '{}'::JSONB),
    v_now
  )
  ON CONFLICT (channel, league_code) DO UPDATE SET
    vendor = EXCLUDED.vendor,
    status = EXCLUDED.status,
    last_success_at = COALESCE(EXCLUDED.last_success_at, sports_ingest_health.last_success_at),
    last_attempt_at = EXCLUDED.last_attempt_at,
    last_error_at = EXCLUDED.last_error_at,
    last_error = EXCLUDED.last_error,
    lag_ms = EXCLUDED.lag_ms,
    messages_processed = sports_ingest_health.messages_processed + EXCLUDED.messages_processed,
    metadata = sports_ingest_health.metadata || EXCLUDED.metadata,
    updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object(
    'ok', true,
    'channel', v_channel,
    'leagueCode', v_league,
    'status', v_status
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_record_sports_ingest_health(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_record_sports_ingest_health(JSONB) TO service_role;

CREATE OR REPLACE FUNCTION rpc_sync_sports_ingest_ops_alerts(
  p_rest_stale_ms  BIGINT DEFAULT 900000,
  p_ws_stale_ms    BIGINT DEFAULT 180000,
  p_settle_stale_ms BIGINT DEFAULT 3600000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row sports_ingest_health%ROWTYPE;
  v_alert ops_alerts%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
  v_threshold BIGINT;
  v_lag BIGINT;
  v_dedupe TEXT;
  v_severity TEXT;
  v_summary TEXT;
  v_opened INT := 0;
  v_resolved INT := 0;
BEGIN
  FOR v_row IN
    SELECT * FROM sports_ingest_health
    WHERE channel IN ('rest', 'ws', 'settle')
      AND league_code = '_all'
  LOOP
    v_threshold := CASE v_row.channel
      WHEN 'rest' THEN p_rest_stale_ms
      WHEN 'ws' THEN p_ws_stale_ms
      WHEN 'settle' THEN p_settle_stale_ms
      ELSE 900000
    END;

    v_lag := COALESCE(
      v_row.lag_ms,
      CASE
        WHEN v_row.last_success_at IS NULL THEN v_threshold + 1
        ELSE (EXTRACT(EPOCH FROM (v_now - v_row.last_success_at)) * 1000)::BIGINT
      END
    );

    v_dedupe := 'sports_ingest_stale:' || v_row.channel;

    IF v_row.status IN ('stale', 'error') OR v_lag > v_threshold THEN
      v_severity := CASE WHEN v_row.status = 'error' THEN 'critical' ELSE 'warning' END;
      v_summary := format(
        'Sports ingest %s stale (lag %s ms, threshold %s ms)',
        v_row.channel,
        v_lag,
        v_threshold
      );

      SELECT * INTO v_alert
      FROM ops_alerts
      WHERE dedupe_key = v_dedupe
        AND status IN ('open', 'acknowledged')
      FOR UPDATE;

      IF FOUND THEN
        UPDATE ops_alerts
           SET severity = v_severity,
               summary = v_summary,
               last_seen_at = v_now,
               occurrence_count = occurrence_count + 1,
               metadata = jsonb_build_object(
                 'channel', v_row.channel,
                 'lagMs', v_lag,
                 'thresholdMs', v_threshold,
                 'lastError', v_row.last_error
               ),
               updated_at = v_now
         WHERE id = v_alert.id;
        v_opened := v_opened + 1;
      ELSE
        INSERT INTO ops_alerts (
          dedupe_key, source_check_id, severity, status,
          summary, runbook_key, first_seen_at, last_seen_at,
          occurrence_count, metadata
        ) VALUES (
          v_dedupe,
          v_dedupe,
          v_severity,
          'open',
          v_summary,
          'sports_ingest_stale',
          v_now,
          v_now,
          1,
          jsonb_build_object(
            'channel', v_row.channel,
            'lagMs', v_lag,
            'thresholdMs', v_threshold,
            'lastError', v_row.last_error
          )
        );
        v_opened := v_opened + 1;
      END IF;
    ELSE
      UPDATE ops_alerts
         SET status = 'resolved',
             resolved_at = v_now,
             updated_at = v_now
       WHERE dedupe_key = v_dedupe
         AND status IN ('open', 'acknowledged');
      IF FOUND THEN
        v_resolved := v_resolved + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('opened', v_opened, 'resolved', v_resolved);
END;
$$;

REVOKE ALL ON FUNCTION rpc_sync_sports_ingest_ops_alerts(BIGINT, BIGINT, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_sync_sports_ingest_ops_alerts(BIGINT, BIGINT, BIGINT) TO service_role;
