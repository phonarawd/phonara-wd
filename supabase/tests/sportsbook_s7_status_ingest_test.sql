-- ============================================================
-- Sportsbook S7 status ingest + auto-settle path
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_outcome UUID;
  v_fixture_id UUID;
  v_result JSONB;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'sports_s7_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '5000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:s7-1', 'leagueCode', 'epl',
      'homeName', 'S7H', 'awayName', 'S7A',
      'kickoffAt', (NOW() + INTERVAL '1 day')::TEXT, 'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:s7-1:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:s7-1:match_1x2:home', 'selection', 'home')
      )
    ))
  ));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:s7-1:match_1x2:home',
    'odds', '2.000000', 'capturedAt', NOW()::TEXT));

  SELECT id INTO v_outcome FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:s7-1:match_1x2:home';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  PERFORM rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object('outcome_id', v_outcome, 'odds_at_bet', '2.000000')),
    '50.000000', 'PHON', 'sports-s7-' || v_uid::TEXT);

  PERFORM set_config('request.jwt.claims', '{}', true);
  v_result := rpc_ingest_sports_fixture_status(
    'test-vendor:s7-1', 'finished', 2, 0, NULL, 's7_auto_settle', TRUE);

  ASSERT (v_result->>'status') = 'finished', 'status ingest must mark finished';
  ASSERT v_result ? 'auto_settle', 'auto_settle payload must be present';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  ASSERT v_phon_after = v_phon_before, 'PHON conserved after S7 ingest auto-settle win';
  ASSERT EXISTS (
    SELECT 1 FROM sports_fixture_events e
    JOIN sports_fixtures f ON f.id = e.fixture_id
    WHERE f.canonical_fixture_id = 'test-vendor:s7-1' AND e.event_type = 'status_finished'
  ), 'fixture event row must be recorded';
END;
$$;

ROLLBACK;
