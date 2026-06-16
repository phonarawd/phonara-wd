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

ROLLBACK;
