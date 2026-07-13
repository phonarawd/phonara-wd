-- E22 sports parity — odds acceptance · partial cashout · correct_score · catalog
BEGIN;

-- E22-0: schema + grants
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = 'sports_odds_acceptance' AND e.enumlabel = 'strict'
  ), 'sports_odds_acceptance.strict missing';
  ASSERT EXISTS (
    SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = 'sports_selection' AND e.enumlabel = 'score'
  ), 'sports_selection.score missing';
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'sports_bets'
       AND column_name = 'original_stake'
  ), 'sports_bets.original_stake missing';
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'sports_bets'
       AND column_name = 'partial_cashout_total'
  ), 'sports_bets.partial_cashout_total missing';
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'sports_sport_catalog'
  ), 'sports_sport_catalog missing';
  ASSERT EXISTS (
    SELECT 1 FROM sports_market_type_registry
     WHERE market_type = 'correct_score' AND settle_handler = 'correct_score'
  ), 'correct_score registry missing';
  ASSERT EXISTS (
    SELECT 1 FROM app_config WHERE key = 'sports_odds_acceptance_default'
  ), 'sports_odds_acceptance_default missing';

  ASSERT has_function_privilege(
    'authenticated',
    'public.rpc_place_sports_bet(jsonb, text, text, text, text, text, text, text)',
    'EXECUTE'
  ), 'authenticated must EXECUTE rpc_place_sports_bet';
  ASSERT has_function_privilege(
    'authenticated',
    'public.rpc_preview_sports_partial_cashout(uuid, text)',
    'EXECUTE'
  ), 'authenticated must EXECUTE rpc_preview_sports_partial_cashout';
  ASSERT has_function_privilege(
    'authenticated',
    'public.rpc_partial_cashout_sports_bet(uuid, text, text, text)',
    'EXECUTE'
  ), 'authenticated must EXECUTE rpc_partial_cashout_sports_bet';
  ASSERT has_function_privilege(
    'authenticated',
    'public.rpc_list_sports_catalog()',
    'EXECUTE'
  ), 'authenticated must EXECUTE rpc_list_sports_catalog';
  ASSERT has_function_privilege(
    'anon',
    'public.rpc_list_sports_catalog()',
    'EXECUTE'
  ), 'anon must EXECUTE rpc_list_sports_catalog';
  ASSERT NOT has_function_privilege(
    'authenticated',
    'public._sports_resolve_place_odds(text, text, sports_odds_acceptance)',
    'EXECUTE'
  ), 'authenticated must NOT EXECUTE _sports_resolve_place_odds';
  ASSERT NOT has_function_privilege(
    'authenticated',
    'public._sports_settle_correct_score_legs(uuid, integer, integer)',
    'EXECUTE'
  ), 'authenticated must NOT EXECUTE _sports_settle_correct_score_legs';
  ASSERT NOT has_function_privilege(
    'authenticated',
    'public._sports_cashout_offer(uuid)',
    'EXECUTE'
  ), 'authenticated must NOT EXECUTE _sports_cashout_offer';

  RAISE NOTICE 'E22-0 OK — schema + grants';
END;
$$;

-- E22-1: odds acceptance — accept_any when drifted · strict rejects
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_outcome_id UUID;
  v_bet JSONB;
  v_leg_odds TEXT;
  v_blocked BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'e22_odds_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '50000.000000' WHERE user_id = v_uid;
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = '999999' WHERE key = 'sports_odds_velocity_ms';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:e22-odds-1',
      'leagueCode', 'epl',
      'homeName', 'Odds Home',
      'awayName', 'Odds Away',
      'kickoffAt', (NOW() + INTERVAL '2 days')::TEXT,
      'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:e22-odds-1:match_1x2',
      'marketType', 'match_1x2',
      'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:e22-odds-1:match_1x2:home', 'selection', 'home')
      )
    ))
  ));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert',
    'outcomeId', 'test-vendor:e22-odds-1:match_1x2:home',
    'odds', '2.000000',
    'capturedAt', (NOW() - INTERVAL '2 minutes')::TEXT
  ));
  -- drift odds upward (later capturedAt so _sports_latest_odds resolves 2.15)
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert',
    'outcomeId', 'test-vendor:e22-odds-1:match_1x2:home',
    'odds', '2.150000',
    'capturedAt', NOW()::TEXT
  ));

  SELECT id INTO v_outcome_id
  FROM sports_outcomes
  WHERE canonical_outcome_id = 'test-vendor:e22-odds-1:match_1x2:home';

  UPDATE sports_markets m
     SET status = 'open',
         suspended_until = NULL,
         suspend_reason = NULL
    FROM sports_outcomes o
   WHERE o.id = v_outcome_id
     AND m.id = o.market_id;
  UPDATE sports_fixtures f
     SET suspended_until = NULL
    FROM sports_outcomes o
    JOIN sports_markets m ON m.id = o.market_id
   WHERE o.id = v_outcome_id
     AND f.id = m.fixture_id;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  -- strict must reject drifted client odds
  BEGIN
    PERFORM rpc_place_sports_bet(
      jsonb_build_array(jsonb_build_object(
        'outcome_id', v_outcome_id,
        'odds_at_bet', '2.000000'
      )),
      '25.000000',
      'PHON',
      'e22-strict-' || v_uid::TEXT,
      NULL, NULL, NULL,
      'strict'
    );
    RAISE EXCEPTION 'strict must fail on odds drift';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%odds_changed%' THEN
        v_blocked := TRUE;
      ELSE
        RAISE;
      END IF;
  END;
  ASSERT v_blocked, 'expected odds_changed under strict';

  -- accept_any takes latest odds
  v_bet := rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object(
      'outcome_id', v_outcome_id,
      'odds_at_bet', '2.000000'
    )),
    '25.000000',
    'PHON',
    'e22-any-' || v_uid::TEXT,
    NULL, NULL, NULL,
    'accept_any'
  );
  ASSERT v_bet ? 'bet_id', format('accept_any place failed: %s', v_bet);

  SELECT l.odds_at_bet INTO v_leg_odds
  FROM sports_bet_legs l
  WHERE l.bet_id = (v_bet->>'bet_id')::UUID;
  ASSERT trunc(v_leg_odds::NUMERIC, 6) = trunc(2.15::NUMERIC, 6),
    format('resolved odds expected 2.15 got %s', v_leg_odds);

  RESET ROLE;
  RAISE NOTICE 'E22-1 OK — accept_any · strict reject';
END;
$$;

-- E22-2: partial cashout — preview · execute · Σ=0 · stake reduced · still pending
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_outcome_id UUID;
  v_bet_id UUID;
  v_preview JSONB;
  v_partial JSONB;
  v_full JSONB;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
  v_stake TEXT;
  v_status sports_bet_status;
  v_orig TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'e22_pc_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '50000.000000' WHERE user_id = v_uid;
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = '999999' WHERE key = 'sports_odds_velocity_ms';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:e22-pc-1',
      'leagueCode', 'epl',
      'homeName', 'Partial Home',
      'awayName', 'Partial Away',
      'kickoffAt', (NOW() + INTERVAL '1 day')::TEXT,
      'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:e22-pc-1:match_1x2',
      'marketType', 'match_1x2',
      'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:e22-pc-1:match_1x2:home', 'selection', 'home')
      )
    ))
  ));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert',
    'outcomeId', 'test-vendor:e22-pc-1:match_1x2:home',
    'odds', '2.000000',
    'capturedAt', NOW()::TEXT
  ));

  SELECT id INTO v_outcome_id
  FROM sports_outcomes
  WHERE canonical_outcome_id = 'test-vendor:e22-pc-1:match_1x2:home';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  v_bet_id := (rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object(
      'outcome_id', v_outcome_id,
      'odds_at_bet', '2.000000'
    )),
    '100.000000',
    'PHON',
    'e22-pc-place-' || v_uid::TEXT
  )->>'bet_id')::UUID;

  -- Conservation Σ must run as superuser: authenticated RLS hides other wallets
  -- and all system_accounts (admin-only SELECT), which would mask house legs.
  RESET ROLE;
  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  SET LOCAL ROLE authenticated;
  v_preview := rpc_preview_sports_partial_cashout(v_bet_id, '40.000000');
  ASSERT v_preview->>'cashout_amount' IS NOT NULL, format('partial preview: %s', v_preview);
  ASSERT trunc((v_preview->>'remaining_stake')::NUMERIC, 6) = trunc(60::NUMERIC, 6),
    format('remaining_stake expected 60 got %s', v_preview->>'remaining_stake');

  v_partial := rpc_partial_cashout_sports_bet(
    v_bet_id,
    '40.000000',
    v_preview->>'cashout_amount',
    'e22-pc-exec-' || v_uid::TEXT
  );
  ASSERT (v_partial->>'status') = 'pending', format('partial status: %s', v_partial);
  ASSERT (v_partial->>'partial')::BOOLEAN IS TRUE, 'partial flag';
  ASSERT trunc((v_partial->>'remaining_stake')::NUMERIC, 6) = trunc(60::NUMERIC, 6),
    'remaining stake after partial';

  SELECT stake, status, original_stake
    INTO v_stake, v_status, v_orig
  FROM sports_bets WHERE id = v_bet_id;
  ASSERT v_status = 'pending', 'bet must stay pending after partial';
  ASSERT trunc(v_stake::NUMERIC, 6) = trunc(60::NUMERIC, 6), format('stake now %s', v_stake);
  ASSERT trunc(v_orig::NUMERIC, 6) = trunc(100::NUMERIC, 6), format('original_stake %s', v_orig);
  ASSERT (
    SELECT COUNT(*) FROM sports_bet_legs
     WHERE bet_id = v_bet_id AND leg_status = 'pending'
  ) = 1, 'legs must stay pending';

  RESET ROLE;
  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;
  ASSERT v_phon_before = v_phon_after,
    format('conservation after partial: before=%s after=%s', v_phon_before, v_phon_after);

  -- full cashout of remaining stake
  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  SET LOCAL ROLE authenticated;
  v_preview := rpc_preview_sports_cashout(v_bet_id);
  v_full := rpc_cashout_sports_bet(
    v_bet_id,
    v_preview->>'cashout_amount',
    'e22-pc-full-' || v_uid::TEXT
  );
  ASSERT (v_full->>'status') = 'cashed_out', format('full cashout: %s', v_full);

  RESET ROLE;
  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;
  ASSERT v_phon_before = v_phon_after,
    format('conservation after full cashout: before=%s after=%s', v_phon_before, v_phon_after);

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  RAISE NOTICE 'E22-2 OK — partial cashout · conservation · full remaining';
END;
$$;

-- E22-3: correct_score settle — line 1-0 wins when FT is 1-0
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_fixture_id UUID;
  v_market_id UUID;
  v_outcome_id UUID;
  v_bet_id UUID;
  v_leg_status sports_leg_status;
  v_settle JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'e22_cs_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '10000.000000' WHERE user_id = v_uid;
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = '999999' WHERE key = 'sports_odds_velocity_ms';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:e22-cs-1',
      'leagueCode', 'epl',
      'homeName', 'Score Home',
      'awayName', 'Score Away',
      'kickoffAt', (NOW() + INTERVAL '3 days')::TEXT,
      'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:e22-cs-1:correct_score',
      'marketType', 'correct_score',
      'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object(
          'outcomeId', 'test-vendor:e22-cs-1:correct_score:1-0',
          'selection', 'score',
          'line', '1-0'
        )
      )
    ))
  ));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert',
    'outcomeId', 'test-vendor:e22-cs-1:correct_score:1-0',
    'odds', '8.500000',
    'capturedAt', NOW()::TEXT
  ));

  SELECT id INTO v_fixture_id FROM sports_fixtures
   WHERE canonical_fixture_id = 'test-vendor:e22-cs-1';
  SELECT id INTO v_market_id FROM sports_markets
   WHERE canonical_market_id = 'test-vendor:e22-cs-1:correct_score';
  SELECT id INTO v_outcome_id FROM sports_outcomes
   WHERE canonical_outcome_id = 'test-vendor:e22-cs-1:correct_score:1-0';

  ASSERT v_outcome_id IS NOT NULL, 'correct_score outcome missing';
  ASSERT (
    SELECT selection::TEXT FROM sports_outcomes WHERE id = v_outcome_id
  ) = 'score', 'selection must be score';

  -- Must place via RPC so stake is locked; raw INSERT leaves phon_locked=0 →
  -- _finalize_sports_bet raises insufficient_locked on settle.
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;
  v_bet_id := (rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object(
      'outcome_id', v_outcome_id,
      'odds_at_bet', '8.500000'
    )),
    '10.000000',
    'PHON',
    'e22-cs-' || v_uid::TEXT
  )->>'bet_id')::UUID;
  RESET ROLE;

  PERFORM set_config('request.jwt.claims', '{}', true);
  v_settle := rpc_settle_sports_fixture_scores(v_fixture_id, 1, 0, 'e22_cs_test');
  ASSERT (v_settle->'markets'->>'correct_score')::INT >= 1,
    format('correct_score settle count: %s', v_settle);

  SELECT leg_status INTO v_leg_status
  FROM sports_bet_legs WHERE bet_id = v_bet_id;
  ASSERT v_leg_status = 'won', format('expected won got %s', v_leg_status);

  RAISE NOTICE 'E22-3 OK — correct_score 1-0 won';
END;
$$;

-- E22-4: rpc_list_sports_catalog returns football etc.
DO $$
DECLARE
  v_catalog JSONB;
  v_codes TEXT[];
BEGIN
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', gen_random_uuid()::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  v_catalog := rpc_list_sports_catalog();
  ASSERT jsonb_typeof(v_catalog) = 'array', format('catalog type: %s', jsonb_typeof(v_catalog));

  SELECT array_agg(x->>'sport_code' ORDER BY x->>'sport_code')
    INTO v_codes
  FROM jsonb_array_elements(v_catalog) AS x;

  ASSERT 'football' = ANY(v_codes), format('football missing in %s', v_catalog);
  ASSERT 'basketball' = ANY(v_codes), format('basketball missing in %s', v_catalog);
  ASSERT 'tennis' = ANY(v_codes), format('tennis missing in %s', v_catalog);
  ASSERT NOT ('default' = ANY(v_codes)), 'default must be disabled / omitted';

  RESET ROLE;
  RAISE NOTICE 'E22-4 OK — sports catalog list';
END;
$$;

ROLLBACK;
