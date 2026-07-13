\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE
  v_result JSONB;
  v_status TEXT;
  v_count INT;
BEGIN
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';

  v_result := rpc_record_sports_ingest_health(jsonb_build_object(
    'channel', 'rest',
    'leagueCode', '_all',
    'status', 'healthy',
    'messagesProcessed', 3,
    'metadata', jsonb_build_object('test', true)
  ));
  ASSERT (v_result->>'ok')::BOOLEAN, 'record health must return ok';

  SELECT status INTO v_status
  FROM sports_ingest_health
  WHERE channel = 'rest' AND league_code = '_all';
  ASSERT v_status = 'healthy', format('expected healthy, got %s', v_status);

  UPDATE sports_ingest_health
     SET last_success_at = NOW() - INTERVAL '2 hours',
         status = 'stale',
         lag_ms = 7200000
   WHERE channel = 'rest' AND league_code = '_all';

  v_result := rpc_sync_sports_ingest_ops_alerts(900000, 180000, 3600000);
  ASSERT COALESCE((v_result->>'opened')::INT, 0) >= 1, 'stale rest must open ops alert';

  SELECT COUNT(*) INTO v_count
  FROM ops_alerts
  WHERE dedupe_key = 'sports_ingest_stale:rest'
    AND status IN ('open', 'acknowledged');
  ASSERT v_count >= 1, 'ops alert row must exist for stale rest';

  UPDATE sports_ingest_health
     SET last_success_at = NOW(),
         status = 'healthy',
         lag_ms = 0
   WHERE channel = 'rest' AND league_code = '_all';

  v_result := rpc_sync_sports_ingest_ops_alerts(900000, 180000, 3600000);
  ASSERT COALESCE((v_result->>'resolved')::INT, 0) >= 1, 'healthy rest must resolve ops alert';

  DELETE FROM ops_alerts WHERE dedupe_key = 'sports_ingest_stale:rest';
  DELETE FROM sports_ingest_health WHERE channel = 'rest' AND league_code = '_all';
END $$;

-- ============================================================
-- Wave 1 (sb-w1-health-sla-migration) — read-path freshness recompute.
-- A stored 'healthy' row whose last_success_at is far beyond the stale
-- threshold must NOT still report 'healthy' via rpc_get_sports_ingest_health
-- (the "662h ago but still healthy" bug) — the raw table `status` column may
-- keep the naive stored string, but the recomputed read path must not.
-- ============================================================
DO $$
DECLARE
  v_row_count INT;
  v_effective TEXT;
  v_stored TEXT;
BEGIN
  DELETE FROM sports_ingest_health WHERE channel = 'rest' AND league_code = '_all';

  PERFORM rpc_record_sports_ingest_health(jsonb_build_object(
    'channel', 'rest',
    'leagueCode', '_all',
    'status', 'healthy',
    'messagesProcessed', 1
  ));

  -- Simulate a worker that stopped writing long ago while the last stored
  -- value was still 'healthy' (default rest threshold is 900_000ms = 15min).
  UPDATE sports_ingest_health
     SET last_success_at = NOW() - INTERVAL '2 hours',
         lag_ms = NULL
   WHERE channel = 'rest' AND league_code = '_all';

  SELECT COUNT(*), MAX(v->>'stored_status'), MAX(v->>'status')
    INTO v_row_count, v_stored, v_effective
    FROM rpc_get_sports_ingest_health('rest', '_all') AS v;

  ASSERT v_row_count = 1, format('expected exactly one rest/_all health row, got %s', v_row_count);
  ASSERT v_stored = 'healthy',
    format('stored_status must still show the naive write, got %s', v_stored);
  ASSERT v_effective = 'stale',
    format('RED: 2h-old success with 15min threshold must recompute to stale, got %s', v_effective);

  -- Fresh success must still read as healthy (no false-positive downgrade).
  UPDATE sports_ingest_health
     SET last_success_at = NOW(),
         lag_ms = NULL
   WHERE channel = 'rest' AND league_code = '_all';

  SELECT v->>'status' INTO v_effective
    FROM rpc_get_sports_ingest_health('rest', '_all') AS v;
  ASSERT v_effective = 'healthy',
    format('fresh success must read as healthy, got %s', v_effective);

  -- Explicit terminal statuses (e.g. disabled) are not re-evaluated by age.
  UPDATE sports_ingest_health
     SET status = 'disabled',
         last_success_at = NOW() - INTERVAL '5 days'
   WHERE channel = 'rest' AND league_code = '_all';

  SELECT v->>'status' INTO v_effective
    FROM rpc_get_sports_ingest_health('rest', '_all') AS v;
  ASSERT v_effective = 'disabled',
    format('explicit disabled must pass through unchanged, got %s', v_effective);

  DELETE FROM sports_ingest_health WHERE channel = 'rest' AND league_code = '_all';
END $$;

ROLLBACK;
