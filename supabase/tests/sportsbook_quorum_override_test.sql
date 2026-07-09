-- Step 5 — admin quorum manual settle + mismatch persistence

BEGIN;

DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
  v_uid UUID := gen_random_uuid();
  v_fixture_id UUID;
  v_mismatch_id UUID;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_admin, 'authenticated', 'authenticated', 'sports_quorum_admin_' || v_admin::TEXT || '@test.local', NOW(), NOW()),
    (v_uid, 'authenticated', 'authenticated', 'sports_quorum_user_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '10000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:quorum-1',
      'leagueCode', 'epl',
      'homeName', 'Quorum Home',
      'awayName', 'Quorum Away',
      'kickoffAt', (NOW() - INTERVAL '4 hours')::TEXT,
      'status', 'live'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:quorum-1:match_1x2',
      'marketType', 'match_1x2',
      'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:quorum-1:match_1x2:home', 'selection', 'home'),
        jsonb_build_object('outcomeId', 'test-vendor:quorum-1:match_1x2:draw', 'selection', 'draw'),
        jsonb_build_object('outcomeId', 'test-vendor:quorum-1:match_1x2:away', 'selection', 'away')
      )
    ))
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert',
    'outcomeId', 'test-vendor:quorum-1:match_1x2:home',
    'odds', '2.000000',
    'capturedAt', NOW()::TEXT
  ));

  SELECT id INTO v_fixture_id FROM sports_fixtures WHERE canonical_fixture_id = 'test-vendor:quorum-1';

  PERFORM rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object(
      'outcome_id', (SELECT id FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:quorum-1:match_1x2:home'),
      'odds_at_bet', '2.000000'
    )),
    '100.000000',
    'PHON',
    'sports-quorum-idem-' || v_uid::TEXT
  );

  PERFORM set_config('request.jwt.claims', '{}', true);
  v_mismatch_id := rpc_record_sports_score_quorum_mismatch(
    'test-vendor:quorum-1',
    'epl',
    2, 1,
    1, 2,
    'the-odds-api',
    'football-data'
  );
  ASSERT v_mismatch_id IS NOT NULL, 'mismatch row should be inserted';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT, true);
  PERFORM rpc_admin_settle_sports_fixture_quorum(v_fixture_id, 2, 0, 'admin quorum override e2e', TRUE);

  ASSERT (SELECT status FROM sports_fixtures WHERE id = v_fixture_id) = 'finished', 'fixture should be finished';
  ASSERT (
    SELECT resolved_at IS NOT NULL FROM sports_score_quorum_events WHERE id = v_mismatch_id
  ), 'mismatch should be resolved';

  ASSERT (
    SELECT COUNT(*) FROM audit_logs
    WHERE action = 'sports_score_quorum_override' AND entity_id = v_fixture_id
  ) = 1, 'quorum override audit required';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  ASSERT v_phon_before = v_phon_after, 'conservation after admin quorum settle';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  BEGIN
    PERFORM rpc_admin_settle_sports_fixture_quorum(v_fixture_id, 1, 0, 'non-admin should fail', FALSE);
    RAISE EXCEPTION 'expected FORBIDDEN for non-admin';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT ILIKE '%FORBIDDEN%' THEN
      RAISE;
    END IF;
  END;
END;
$$;

ROLLBACK;
