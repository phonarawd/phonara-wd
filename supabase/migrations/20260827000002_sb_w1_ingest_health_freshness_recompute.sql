-- ============================================================
-- Wave 1 — Sports ingest health SLA truthfulness (read-path recompute)
-- ============================================================
-- Plan: 스포츠 무료 실배당 완결 로드맵 · sb-w1-health-sla-migration
--
-- Problem: `rpc_record_sports_ingest_health` stores whatever `status` the
-- worker last reported and never re-evaluates it. If a worker's last write
-- was 'healthy' and then the worker stops entirely, `sports_ingest_health`
-- keeps reporting 'healthy' indefinitely even hours/days later — the stored
-- string is stale truth, not live truth.
--
-- Fix (additive, read-path only — `rpc_record_sports_ingest_health` write
-- path is untouched): a new read RPC recomputes freshness from
-- `last_success_at` against a stale threshold at query time, the same way
-- `rpc_sync_sports_ingest_ops_alerts` already computes lag for alerting.
-- Terminal/explicit statuses ('disabled', 'skipped', 'error') pass through
-- unchanged — only a naive 'healthy'/'degraded' claim that has gone stale by
-- wall-clock time is downgraded to 'stale'.
-- ============================================================

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION rpc_get_sports_ingest_health(
  p_channel      TEXT DEFAULT NULL,
  p_league_code  TEXT DEFAULT NULL,
  p_rest_stale_ms    BIGINT DEFAULT 900000,
  p_ws_stale_ms      BIGINT DEFAULT 180000,
  p_settle_stale_ms  BIGINT DEFAULT 3600000
)
RETURNS SETOF JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row sports_ingest_health%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
  v_threshold BIGINT;
  v_age_ms BIGINT;
  v_lag_ms BIGINT;
  v_effective_status TEXT;
BEGIN
  FOR v_row IN
    SELECT * FROM sports_ingest_health
    WHERE (p_channel IS NULL OR channel = p_channel)
      AND (p_league_code IS NULL OR league_code = p_league_code)
    ORDER BY channel, league_code
  LOOP
    v_threshold := CASE v_row.channel
      WHEN 'rest' THEN p_rest_stale_ms
      WHEN 'ws' THEN p_ws_stale_ms
      WHEN 'settle' THEN p_settle_stale_ms
      ELSE 900000
    END;

    v_age_ms := CASE
      WHEN v_row.last_success_at IS NULL THEN NULL
      ELSE (EXTRACT(EPOCH FROM (v_now - v_row.last_success_at)) * 1000)::BIGINT
    END;

    v_lag_ms := COALESCE(v_row.lag_ms, v_age_ms, v_threshold + 1);

    -- Terminal/explicit statuses are not re-evaluated; only a stored
    -- 'healthy'/'degraded' claim can go stale purely by elapsed wall-clock
    -- time without a fresh write.
    v_effective_status := CASE
      WHEN v_row.status IN ('disabled', 'skipped', 'error') THEN v_row.status
      WHEN v_row.last_success_at IS NULL THEN 'stale'
      WHEN v_age_ms > v_threshold THEN 'stale'
      ELSE v_row.status
    END;

    RETURN QUERY SELECT jsonb_build_object(
      'channel', v_row.channel,
      'league_code', v_row.league_code,
      'vendor', v_row.vendor,
      'stored_status', v_row.status,
      'status', v_effective_status,
      'last_success_at', v_row.last_success_at,
      'last_error_at', v_row.last_error_at,
      'last_error', v_row.last_error,
      'lag_ms', v_lag_ms,
      'age_ms', v_age_ms,
      'threshold_ms', v_threshold,
      'updated_at', v_row.updated_at
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_sports_ingest_health(TEXT, TEXT, BIGINT, BIGINT, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_sports_ingest_health(TEXT, TEXT, BIGINT, BIGINT, BIGINT) TO service_role;
