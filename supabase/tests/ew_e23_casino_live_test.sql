-- E23 casino live — PF controls · progressive mines · live crash · no autobet
BEGIN;

-- E23-0: schema + grants positive/negative
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'user_game_pf_state'
  ), 'user_game_pf_state missing';
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'game_progressive_sessions'
  ), 'game_progressive_sessions missing';
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'live_crash_rounds'
  ), 'live_crash_rounds missing';
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'live_crash_bets'
  ), 'live_crash_bets missing';

  ASSERT EXISTS (
    SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = 'progressive_session_status' AND e.enumlabel = 'active'
  ), 'progressive_session_status.active missing';
  ASSERT EXISTS (
    SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = 'live_crash_round_status' AND e.enumlabel = 'betting'
  ), 'live_crash_round_status.betting missing';

  ASSERT EXISTS (
    SELECT 1 FROM app_config WHERE key = 'feature_live_crash_enabled'
  ), 'feature_live_crash_enabled missing';
  ASSERT EXISTS (
    SELECT 1 FROM app_config WHERE key = 'live_crash_betting_seconds'
  ), 'live_crash_betting_seconds missing';
  ASSERT EXISTS (
    SELECT 1 FROM app_config WHERE key = 'progressive_session_ttl_seconds'
  ), 'progressive_session_ttl_seconds missing';

  ASSERT has_function_privilege(
    'authenticated',
    'public.rpc_get_game_pf_state()',
    'EXECUTE'
  ), 'authenticated must EXECUTE rpc_get_game_pf_state';
  ASSERT has_function_privilege(
    'authenticated',
    'public.rpc_set_game_client_seed(text)',
    'EXECUTE'
  ), 'authenticated must EXECUTE rpc_set_game_client_seed';
  ASSERT has_function_privilege(
    'authenticated',
    'public.rpc_rotate_game_server_seed(text)',
    'EXECUTE'
  ), 'authenticated must EXECUTE rpc_rotate_game_server_seed';
  ASSERT has_function_privilege(
    'authenticated',
    'public.rpc_place_game_bet(uuid, text, text, jsonb, text, text, jsonb, boolean)',
    'EXECUTE'
  ), 'authenticated must EXECUTE rpc_place_game_bet 8-arg';
  ASSERT has_function_privilege(
    'authenticated',
    'public.rpc_progressive_start(text, text, text, jsonb, text, text, boolean)',
    'EXECUTE'
  ), 'authenticated must EXECUTE rpc_progressive_start';
  ASSERT has_function_privilege(
    'authenticated',
    'public.rpc_progressive_step(uuid, jsonb, text)',
    'EXECUTE'
  ), 'authenticated must EXECUTE rpc_progressive_step';
  ASSERT has_function_privilege(
    'authenticated',
    'public.rpc_progressive_cashout(uuid, text)',
    'EXECUTE'
  ), 'authenticated must EXECUTE rpc_progressive_cashout';
  ASSERT has_function_privilege(
    'authenticated',
    'public.rpc_live_crash_place_bet(text, text, text, text, text, boolean)',
    'EXECUTE'
  ), 'authenticated must EXECUTE rpc_live_crash_place_bet';
  ASSERT has_function_privilege(
    'authenticated',
    'public.rpc_live_crash_cashout(uuid, text)',
    'EXECUTE'
  ), 'authenticated must EXECUTE rpc_live_crash_cashout';
  ASSERT has_function_privilege(
    'anon',
    'public.rpc_live_crash_get_current()',
    'EXECUTE'
  ), 'anon must EXECUTE rpc_live_crash_get_current';
  ASSERT has_function_privilege(
    'authenticated',
    'public.rpc_live_crash_get_current()',
    'EXECUTE'
  ), 'authenticated must EXECUTE rpc_live_crash_get_current';

  ASSERT NOT has_function_privilege(
    'anon',
    'public.rpc_progressive_start(text, text, text, jsonb, text, text, boolean)',
    'EXECUTE'
  ), 'anon must NOT EXECUTE rpc_progressive_start';
  ASSERT NOT has_function_privilege(
    'anon',
    'public.rpc_live_crash_place_bet(text, text, text, text, text, boolean)',
    'EXECUTE'
  ), 'anon must NOT EXECUTE rpc_live_crash_place_bet';
  ASSERT NOT has_function_privilege(
    'authenticated',
    'public._game_pf_ensure_state(uuid)',
    'EXECUTE'
  ), 'authenticated must NOT EXECUTE _game_pf_ensure_state';
  ASSERT NOT has_function_privilege(
    'authenticated',
    'public._progressive_settle_session(uuid, progressive_session_status, numeric, jsonb, jsonb)',
    'EXECUTE'
  ), 'authenticated must NOT EXECUTE _progressive_settle_session';
  ASSERT NOT has_function_privilege(
    'authenticated',
    'public.rpc_live_crash_advance()',
    'EXECUTE'
  ), 'authenticated must NOT EXECUTE rpc_live_crash_advance';
  ASSERT NOT has_function_privilege(
    'authenticated',
    'public.rpc_sweep_stale_progressive_sessions()',
    'EXECUTE'
  ), 'authenticated must NOT EXECUTE rpc_sweep_stale_progressive_sessions';
  ASSERT has_function_privilege(
    'service_role',
    'public.rpc_live_crash_advance()',
    'EXECUTE'
  ), 'service_role must EXECUTE rpc_live_crash_advance';
  ASSERT has_function_privilege(
    'service_role',
    'public.rpc_sweep_stale_progressive_sessions()',
    'EXECUTE'
  ), 'service_role must EXECUTE rpc_sweep_stale_progressive_sessions';

  RAISE NOTICE 'E23-0 OK — schema + grants';
END;
$$;

-- E23-1: PF ensure/get/set/rotate · place_game_bet account PF nonce++ · one-shot nonce=1
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_pf JSONB;
  v_nonce1 INT;
  v_nonce2 INT;
  v_hash1 TEXT;
  v_prev TEXT;
  v_round_id UUID;
  v_bet JSONB;
  v_bet_nonce INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'e23_pf_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '50000.000000' WHERE user_id = v_uid;
  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true'
    WHERE key IN ('feature_game_enabled', 'feature_game_dice_enabled');

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  v_pf := rpc_get_game_pf_state();
  ASSERT v_pf ? 'client_seed', format('pf state: %s', v_pf);
  ASSERT v_pf ? 'server_seed_hash', 'server_seed_hash required';
  ASSERT NOT (v_pf ? 'active_server_seed'), 'must never leak active_server_seed';
  ASSERT (v_pf->>'next_nonce')::INT = 1, 'initial nonce must be 1';
  v_nonce1 := (v_pf->>'next_nonce')::INT;
  v_hash1 := v_pf->>'server_seed_hash';

  v_pf := rpc_set_game_client_seed('e23-client-seed-alpha');
  ASSERT v_pf->>'client_seed' = 'e23-client-seed-alpha', 'client seed set';

  v_pf := rpc_rotate_game_server_seed(NULL);
  ASSERT (v_pf->>'next_nonce')::INT = 1, 'rotate resets nonce';
  ASSERT v_pf->>'previous_server_seed' IS NOT NULL, 'previous seed revealed';
  ASSERT v_pf->>'server_seed_hash' IS DISTINCT FROM v_hash1, 'new hash after rotate';
  v_prev := v_pf->>'previous_server_seed';
  ASSERT length(v_prev) = 64, 'previous seed hex length';

  -- Account PF place increments nonce
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, TRUE);
  v_round_id := (rpc_open_game_round('dice')->>'round_id')::UUID;
  SET LOCAL ROLE authenticated;

  v_pf := rpc_get_game_pf_state();
  v_nonce1 := (v_pf->>'next_nonce')::INT;

  v_bet := rpc_place_game_bet(
    v_round_id, 'PHON', '10.000000',
    '{"target":"50.00","direction":"over"}'::JSONB,
    'ignored-when-account-pf',
    'e23-pf-place-' || v_uid::TEXT,
    NULL,
    TRUE
  );
  ASSERT v_bet->>'status' IN ('won', 'lost'), format('account pf place: %s', v_bet);
  ASSERT (v_bet->>'nonce')::INT = v_nonce1, format('bet nonce %s expected %s', v_bet->>'nonce', v_nonce1);

  v_pf := rpc_get_game_pf_state();
  v_nonce2 := (v_pf->>'next_nonce')::INT;
  ASSERT v_nonce2 = v_nonce1 + 1,
    format('nonce increment expected %s got %s', v_nonce1 + 1, v_nonce2);

  -- One-shot path still uses nonce=1
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, TRUE);
  v_round_id := (rpc_open_game_round('dice')->>'round_id')::UUID;
  SET LOCAL ROLE authenticated;

  v_bet := rpc_place_game_bet(
    v_round_id, 'PHON', '10.000000',
    '{"target":"50.00","direction":"over"}'::JSONB,
    'one-shot-client-seed',
    'e23-oneshot-' || v_uid::TEXT,
    NULL,
    FALSE
  );
  ASSERT v_bet->>'status' IN ('won', 'lost'), format('oneshot place: %s', v_bet);
  ASSERT (v_bet->>'nonce')::INT = 1, 'oneshot nonce must be 1';

  RESET ROLE;
  SELECT nonce INTO v_bet_nonce FROM game_bets WHERE idempotency_key = 'e23-oneshot-' || v_uid::TEXT;
  ASSERT v_bet_nonce = 1, 'stored oneshot nonce=1';

  SELECT next_nonce INTO v_nonce2 FROM user_game_pf_state WHERE user_id = v_uid;
  ASSERT v_nonce2 = v_nonce1 + 1, 'oneshot must not bump account nonce';

  RAISE NOTICE 'E23-1 OK — PF controls · account nonce++ · oneshot nonce=1';
END;
$$;

-- E23-2: progressive mines start→safe reveal→cashout Σ=0 · bust path
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_start JSONB;
  v_step JSONB;
  v_cash JSONB;
  v_session_id UUID;
  v_mines INT[];
  v_safe INT;
  v_cell INT;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
  v_bust JSONB;
  v_session2 UUID;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'e23_mines_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '50000.000000' WHERE user_id = v_uid;
  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true'
    WHERE key IN (
      'feature_game_enabled',
      'feature_game_mines_enabled'
    );

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  v_start := rpc_progressive_start(
    'mines', 'PHON', '100.000000',
    '{"mineCount":3}'::JSONB,
    'e23-mines-client',
    'e23-mines-start-' || v_uid::TEXT,
    FALSE
  );
  ASSERT v_start->>'status' = 'active', format('start: %s', v_start);
  ASSERT (v_start->'public_state'->>'mineCount')::INT = 3, 'mineCount';
  ASSERT NOT (v_start ? 'secret_state'), 'RPC must not return secret_state';
  v_session_id := (v_start->>'session_id')::UUID;

  RESET ROLE;
  SELECT ARRAY(
    SELECT (value)::INT
      FROM jsonb_array_elements_text(secret_state->'minePositions')
  ) INTO v_mines
  FROM game_progressive_sessions WHERE id = v_session_id;

  ASSERT cardinality(v_mines) = 3, format('expected 3 mines got %s', cardinality(v_mines));

  -- pick first safe cell
  v_safe := NULL;
  FOR v_cell IN 0..24 LOOP
    IF NOT (v_cell = ANY(v_mines)) THEN
      v_safe := v_cell;
      EXIT;
    END IF;
  END LOOP;
  ASSERT v_safe IS NOT NULL, 'no safe cell';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  v_step := rpc_progressive_step(
    v_session_id,
    jsonb_build_object('cell', v_safe),
    'e23-mines-step-' || v_uid::TEXT
  );
  ASSERT v_step->>'status' = 'active', format('step: %s', v_step);
  ASSERT (v_step->>'current_multiplier')::NUMERIC > 1,
    format('mult after reveal: %s', v_step->>'current_multiplier');

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;
  ASSERT v_phon_before = v_phon_after,
    format('conservation after step (lock only): before=%s after=%s', v_phon_before, v_phon_after);

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  v_cash := rpc_progressive_cashout(
    v_session_id,
    'e23-mines-cash-' || v_uid::TEXT
  );
  ASSERT v_cash->>'status' = 'cashed_out', format('cashout: %s', v_cash);
  ASSERT (v_cash->>'payout')::NUMERIC > 100, format('payout: %s', v_cash->>'payout');

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;
  ASSERT v_phon_before = v_phon_after,
    format('conservation after cashout: before=%s after=%s', v_phon_before, v_phon_after);

  -- Bust path
  v_start := rpc_progressive_start(
    'mines', 'PHON', '50.000000',
    '{"mineCount":5}'::JSONB,
    'e23-mines-bust-client',
    'e23-mines-bust-start-' || v_uid::TEXT,
    FALSE
  );
  v_session2 := (v_start->>'session_id')::UUID;

  RESET ROLE;
  SELECT (secret_state->'minePositions'->>0)::INT INTO v_cell
  FROM game_progressive_sessions WHERE id = v_session2;

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  v_bust := rpc_progressive_step(
    v_session2,
    jsonb_build_object('cell', v_cell),
    'e23-mines-bust-step-' || v_uid::TEXT
  );
  ASSERT v_bust->>'status' = 'busted', format('bust: %s', v_bust);
  ASSERT (v_bust->>'payout')::NUMERIC = 0, 'bust payout 0';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;
  ASSERT v_phon_before = v_phon_after,
    format('conservation after bust: before=%s after=%s', v_phon_before, v_phon_after);

  RESET ROLE;
  RAISE NOTICE 'E23-2 OK — progressive mines cashout · bust · Σ=0';
END;
$$;

-- E23-3: live crash place → fly → cashout/auto · crash busts remaining · Σ=0
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_uid2 UUID := gen_random_uuid();
  v_adv JSONB;
  v_bet JSONB;
  v_bet2 JSONB;
  v_cash JSONB;
  v_bet_id UUID;
  v_bet2_id UUID;
  v_round_id UUID;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
  v_status live_crash_bet_status;
  v_cur JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'e23_crash_' || v_uid::TEXT || '@t.local', NOW(), NOW());
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid2, 'authenticated', 'authenticated',
          'e23_crash2_' || v_uid2::TEXT || '@t.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '50000.000000'
   WHERE user_id IN (v_uid, v_uid2);
  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true'
    WHERE key IN (
      'feature_game_enabled',
      'feature_game_crash_enabled',
      'feature_live_crash_enabled'
    );

  -- Create betting round (postgres / service path)
  PERFORM set_config('request.jwt.claims', '{}', true);
  v_adv := rpc_live_crash_advance();
  ASSERT v_adv->>'action' = 'created_betting', format('advance create: %s', v_adv);
  v_round_id := (v_adv->>'round_id')::UUID;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  v_bet := rpc_live_crash_place_bet(
    'PHON', '100.000000', '2.000000',
    'e23-live-client',
    'e23-live-place-' || v_uid::TEXT,
    FALSE
  );
  ASSERT v_bet->>'status' = 'pending', format('place: %s', v_bet);
  v_bet_id := (v_bet->>'bet_id')::UUID;

  RESET ROLE;
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid2::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  -- Second user: no auto — will be busted on crash
  v_bet2 := rpc_live_crash_place_bet(
    'PHON', '50.000000', NULL,
    'e23-live-client-2',
    'e23-live-place2-' || v_uid2::TEXT,
    FALSE
  );
  v_bet2_id := (v_bet2->>'bet_id')::UUID;

  RESET ROLE;
  -- Close betting window and advance to flying
  UPDATE live_crash_rounds
     SET betting_closes_at = NOW() - INTERVAL '1 second'
   WHERE id = v_round_id;

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  PERFORM set_config('request.jwt.claims', '{}', true);
  v_adv := rpc_live_crash_advance();
  ASSERT v_adv->>'action' = 'started_flying', format('fly: %s', v_adv);

  -- Force current mult high enough for auto-cashout / manual cashout
  UPDATE live_crash_rounds
     SET flew_at = NOW() - INTERVAL '30 seconds',
         crash_multiplier = GREATEST(crash_multiplier::NUMERIC, 50)::TEXT
   WHERE id = v_round_id;

  -- Manual cashout for user1 (or auto on next advance)
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  BEGIN
    v_cash := rpc_live_crash_cashout(v_bet_id, 'e23-live-cash-' || v_uid::TEXT);
  EXCEPTION WHEN OTHERS THEN
    -- If already auto-eligible, advance tick will settle
    v_cash := NULL;
  END;

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', true);
  v_adv := rpc_live_crash_advance();

  SELECT status INTO v_status FROM live_crash_bets WHERE id = v_bet_id;
  ASSERT v_status = 'cashed_out',
    format('user1 expected cashed_out got %s · cash=%s · adv=%s', v_status, v_cash, v_adv);

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;
  ASSERT v_phon_before = v_phon_after,
    format('conservation after cashout: before=%s after=%s', v_phon_before, v_phon_after);

  -- Crash remaining
  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  UPDATE live_crash_rounds
     SET flew_at = NOW() - INTERVAL '1 day'
   WHERE id = v_round_id;

  v_adv := rpc_live_crash_advance();
  ASSERT v_adv->>'action' = 'crashed', format('crash: %s', v_adv);

  SELECT status INTO v_status FROM live_crash_bets WHERE id = v_bet2_id;
  ASSERT v_status = 'busted', format('user2 expected busted got %s', v_status);

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;
  ASSERT v_phon_before = v_phon_after,
    format('conservation after crash: before=%s after=%s', v_phon_before, v_phon_after);

  -- Public get_current after crash may expose seed
  v_cur := rpc_live_crash_get_current();
  ASSERT v_cur->'round'->>'id' = v_round_id::TEXT
      OR v_cur->'round' IS NOT NULL,
    format('get_current: %s', v_cur);

  RAISE NOTICE 'E23-3 OK — live crash place · cashout · bust · Σ=0';
END;
$$;

-- E23-4: server autobet RPC must not exist
DO $$
BEGIN
  ASSERT NOT EXISTS (
    SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname ILIKE '%autobet%'
  ), 'no public *autobet* functions allowed';
  ASSERT NOT EXISTS (
    SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname = 'rpc_server_autobet'
  ), 'rpc_server_autobet must not exist';

  RAISE NOTICE 'E23-4 OK — no server autobet RPC';
END;
$$;

ROLLBACK;
