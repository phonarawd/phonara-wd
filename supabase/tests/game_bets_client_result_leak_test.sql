-- ============================================================
-- game_bets client result — direct SELECT back door closed
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_user UUID := gen_random_uuid();
  v_round_id UUID := gen_random_uuid();
  v_bet_id UUID := gen_random_uuid();
  v_full JSONB;
  v_client JSONB;
  v_denied BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_user, 'authenticated', 'authenticated', 'gb_client_' || v_user::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '1000.000000' WHERE user_id = v_user;

  INSERT INTO game_rounds (id, game, server_seed_hash, server_seed, status, settled_at)
  VALUES (
    v_round_id,
    'mines',
    encode(extensions.digest('mines-leak-seed', 'sha256'), 'hex'),
    'mines-leak-seed',
    'settled',
    NOW()
  );

  v_full := _game_result(
    'mines',
    'mines-leak-seed',
    'client-seed',
    1,
    '{"mineCount":3,"revealedCells":[1]}'::JSONB
  )->'result';

  INSERT INTO game_bets (
    id, round_id, user_id, game, currency, stake, selection, client_seed, nonce,
    result_payload, payout, status, idempotency_key, settled_at
  ) VALUES (
    v_bet_id,
    v_round_id,
    v_user,
    'mines',
    'PHON',
    '10.000000',
    '{"mineCount":3,"revealedCells":[1]}'::JSONB,
    'client-seed',
    1,
    v_full,
    '11.200000',
    'won',
    'gb_client_leak_' || v_bet_id::TEXT,
    NOW()
  );

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user::TEXT)::TEXT, true);
  SET LOCAL ROLE authenticated;

  BEGIN
    PERFORM result_payload FROM game_bets WHERE id = v_bet_id;
    RAISE EXCEPTION 'authenticated must not SELECT game_bets directly';
  EXCEPTION
    WHEN insufficient_privilege THEN
      v_denied := TRUE;
  END;

  ASSERT v_denied, 'authenticated direct game_bets SELECT must be denied';

  SELECT result_payload
    INTO v_client
    FROM v_game_bets_client
   WHERE id = v_bet_id;

  ASSERT NOT (v_client ? 'minePositions'),
    'partial cashout client view must omit minePositions';
  ASSERT (v_client->>'hitMine')::BOOLEAN = FALSE,
    'partial cashout client view hitMine must be false';

  RESET ROLE;

  -- Terminal mines (hit mine) → full layout on client view.
  v_full := _game_result(
    'mines',
    'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb',
    'parity_client',
    1,
    '{"mineCount":3,"revealedCells":[0,1,2]}'::JSONB
  )->'result';

  UPDATE game_bets
     SET result_payload = v_full,
         selection = '{"mineCount":3,"revealedCells":[0,1,2]}'::JSONB,
         status = 'lost'
   WHERE id = v_bet_id;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user::TEXT)::TEXT, true);
  SET LOCAL ROLE authenticated;

  SELECT result_payload
    INTO v_client
    FROM v_game_bets_client
   WHERE id = v_bet_id;

  ASSERT v_client->'minePositions' = '[6,0,4]'::JSONB,
    'terminal hit-mine client view must expose full minePositions';

  RESET ROLE;
END;
$$;

DO $$
DECLARE
  v_user UUID := gen_random_uuid();
  v_round_id UUID := gen_random_uuid();
  v_bet_id UUID := gen_random_uuid();
  v_full JSONB;
  v_client JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_user, 'authenticated', 'authenticated', 'ds_client_' || v_user::TEXT || '@test.local', NOW(), NOW());

  INSERT INTO game_rounds (id, game, server_seed_hash, server_seed, status, settled_at)
  VALUES (
    v_round_id,
    'deepshaft',
    encode(extensions.digest('deepshaft-leak-seed', 'sha256'), 'hex'),
    'deepshaft-leak-seed',
    'settled',
    NOW()
  );

  v_full := _game_result(
    'deepshaft',
    'deepshaft-leak-seed',
    'client-seed',
    1,
    '{"riskTier":"standard","targetDepth":5}'::JSONB
  )->'result';

  INSERT INTO game_bets (
    id, round_id, user_id, game, currency, stake, selection, client_seed, nonce,
    result_payload, payout, status, idempotency_key, settled_at
  ) VALUES (
    v_bet_id,
    v_round_id,
    v_user,
    'deepshaft',
    'PHON',
    '10.000000',
    '{"riskTier":"standard","targetDepth":5}'::JSONB,
    'client-seed',
    1,
    v_full,
    '15.100000',
    'won',
    'ds_client_leak_' || v_bet_id::TEXT,
    NOW()
  );

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user::TEXT)::TEXT, true);
  SET LOCAL ROLE authenticated;

  SELECT result_payload INTO v_client FROM v_game_bets_client WHERE id = v_bet_id;

  ASSERT NOT (v_client ? 'levels'),
    'pre-reveal deepshaft client view must omit levels';
  ASSERT v_client ? 'reachedDepth',
    'deepshaft client summary must remain';

  RESET ROLE;

  INSERT INTO game_seed_reveals (round_id, server_seed)
  VALUES (v_round_id, 'deepshaft-leak-seed');

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user::TEXT)::TEXT, true);
  SET LOCAL ROLE authenticated;

  SELECT result_payload INTO v_client FROM v_game_bets_client WHERE id = v_bet_id;

  ASSERT v_client ? 'levels',
    'post-reveal deepshaft client view must expose levels';
  ASSERT jsonb_array_length(v_client->'levels') > 0,
    'post-reveal deepshaft levels must be non-empty';

  RESET ROLE;
END;
$$;

ROLLBACK;
