-- ============================================================
-- Sportsbook anti-arbitrage / hedge / liability defense
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_home UUID;
  v_away UUID;
  v_msg TEXT;
  v_blocked BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'sports_arb_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '50000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:arb-1', 'leagueCode', 'epl',
      'homeName', 'ArbH', 'awayName', 'ArbA',
      'kickoffAt', (NOW() + INTERVAL '2 days')::TEXT, 'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:arb-1:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:arb-1:match_1x2:home', 'selection', 'home'),
        jsonb_build_object('outcomeId', 'test-vendor:arb-1:match_1x2:away', 'selection', 'away')
      )
    ))
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:arb-1:match_1x2:home',
    'odds', '1.600000', 'capturedAt', NOW()::TEXT));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:arb-1:match_1x2:away',
    'odds', '2.400000', 'capturedAt', NOW()::TEXT));

  SELECT id INTO v_home FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:arb-1:match_1x2:home';
  SELECT id INTO v_away FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:arb-1:match_1x2:away';

  PERFORM rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object('outcome_id', v_home, 'odds_at_bet', '1.600000')),
    '100.000000', 'PHON', 'sports-arb-first-' || v_uid::TEXT);

  BEGIN
    PERFORM rpc_place_sports_bet(
      jsonb_build_array(jsonb_build_object('outcome_id', v_away, 'odds_at_bet', '2.400000')),
      '100.000000', 'PHON', 'sports-arb-second-' || v_uid::TEXT);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'market_hedge_blocked' THEN v_blocked := TRUE; END IF;
  END;

  ASSERT v_blocked, format('same-market hedge must block, got %s', COALESCE(v_msg, '<none>'));
END;
$$;

DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
  v_uid UUID := gen_random_uuid();
  v_home UUID;
  v_msg TEXT;
  v_blocked BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_admin, 'authenticated', 'authenticated', 'sports_arb_admin_' || v_admin::TEXT || '@test.local', NOW(), NOW()),
    (v_uid, 'authenticated', 'authenticated', 'sports_ban_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '5000.000000' WHERE user_id = v_uid;
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT)::TEXT, true);
  PERFORM rpc_admin_set_sports_risk_tier(v_uid, 'banned', 'test ban');
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:ban-1', 'leagueCode', 'epl',
      'homeName', 'BanH', 'awayName', 'BanA',
      'kickoffAt', (NOW() + INTERVAL '2 days')::TEXT, 'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:ban-1:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:ban-1:match_1x2:home', 'selection', 'home')
      )
    ))
  ));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:ban-1:match_1x2:home',
    'odds', '2.000000', 'capturedAt', NOW()::TEXT));

  SELECT id INTO v_home FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:ban-1:match_1x2:home';

  BEGIN
    PERFORM rpc_place_sports_bet(
      jsonb_build_array(jsonb_build_object('outcome_id', v_home, 'odds_at_bet', '2.000000')),
      '10.000000', 'PHON', 'sports-ban-' || v_uid::TEXT);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'sports_user_banned' THEN v_blocked := TRUE; END IF;
  END;

  ASSERT v_blocked, format('banned user must block, got %s', COALESCE(v_msg, '<none>'));
END;
$$;

DO $$
DECLARE
  v_market_id UUID;
  v_status sports_market_status;
BEGIN
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:overround-1', 'leagueCode', 'epl',
      'homeName', 'ORH', 'awayName', 'ORA',
      'kickoffAt', (NOW() + INTERVAL '2 days')::TEXT, 'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:overround-1:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:overround-1:match_1x2:home', 'selection', 'home'),
        jsonb_build_object('outcomeId', 'test-vendor:overround-1:match_1x2:away', 'selection', 'away')
      )
    ))
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:overround-1:match_1x2:home',
    'odds', '2.500000', 'capturedAt', NOW()::TEXT));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:overround-1:match_1x2:away',
    'odds', '2.500000', 'capturedAt', NOW()::TEXT));

  SELECT m.id, m.status INTO v_market_id, v_status
  FROM sports_markets m
  WHERE m.canonical_market_id = 'test-vendor:overround-1:match_1x2';

  ASSERT v_status = 'suspended', 'arb implied sum must auto-suspend market';
END;
$$;

ROLLBACK;
