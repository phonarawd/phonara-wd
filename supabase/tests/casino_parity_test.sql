-- ============================================================
-- Casino parity — TS engine constants vs SQL _game_result
-- ============================================================
-- Constants are generated from packages/game-engine/src/casino-parity.test.ts.
-- Each of 12 games has two deterministic paths using the same seed triple.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.test_game_float_stream_numeric(
  p_server_seed TEXT,
  p_client_seed TEXT,
  p_nonce INT,
  p_count INT
)
RETURNS NUMERIC[]
LANGUAGE plpgsql
AS $$
DECLARE
  v_out NUMERIC[] := ARRAY[]::NUMERIC[];
  v_cursor INT := 0;
  v_sig BYTEA;
  v_i INT;
  v_f NUMERIC;
BEGIN
  WHILE cardinality(v_out) < p_count LOOP
    v_sig := extensions.hmac(
      convert_to(p_client_seed || ':' || p_nonce::TEXT || ':' || v_cursor::TEXT, 'UTF8'),
      convert_to(p_server_seed, 'UTF8'),
      'sha256'
    );

    v_i := 0;
    WHILE v_i + 3 < length(v_sig) AND cardinality(v_out) < p_count LOOP
      v_f :=
        get_byte(v_sig, v_i)::NUMERIC / 256
        + get_byte(v_sig, v_i + 1)::NUMERIC / 65536
        + get_byte(v_sig, v_i + 2)::NUMERIC / 16777216
        + get_byte(v_sig, v_i + 3)::NUMERIC / 4294967296;
      v_out := array_append(v_out, v_f);
      v_i := v_i + 4;
    END LOOP;

    v_cursor := v_cursor + 1;
  END LOOP;

  RETURN v_out;
END;
$$;

DO $$
DECLARE
  v_seed TEXT := 'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb';
  v_client TEXT := 'parity_client';
  v_nonce INT := 1;
  v_result JSONB;
  v_old NUMERIC[];
  v_new DOUBLE PRECISION[];
  v_case INT;
  v_idx INT;
  v_shuffle_idx INT;
  v_old_mines_j INT;
  v_new_mines_j INT;
BEGIN
  v_result := _game_result('dice', v_seed, v_client, v_nonce, '{"target":"50.00","direction":"over"}'::JSONB);
  ASSERT (v_result->'result'->>'roll')::NUMERIC = 18.37, 'dice over roll parity failed';
  ASSERT (v_result->'result'->>'won')::BOOLEAN = FALSE, 'dice over win parity failed';
  ASSERT v_result->>'payout_multiplier' = '0.000000', 'dice over payout parity failed';

  v_result := _game_result('dice', v_seed, v_client, v_nonce, '{"target":"25.00","direction":"under"}'::JSONB);
  ASSERT (v_result->'result'->>'roll')::NUMERIC = 18.37, 'dice under roll parity failed';
  ASSERT (v_result->'result'->>'won')::BOOLEAN = TRUE, 'dice under win parity failed';
  ASSERT v_result->>'payout_multiplier' = '3.960000', 'dice under payout parity failed';

  v_result := _game_result('limbo', v_seed, v_client, v_nonce, '{"target":"2.00"}'::JSONB);
  ASSERT (v_result->'result'->>'resultMultiplier')::NUMERIC = 1.21, 'limbo 2x result parity failed';
  ASSERT (v_result->'result'->>'won')::BOOLEAN = FALSE, 'limbo 2x win parity failed';
  ASSERT v_result->>'payout_multiplier' = '0.000000', 'limbo 2x payout parity failed';

  v_result := _game_result('limbo', v_seed, v_client, v_nonce, '{"target":"5.00"}'::JSONB);
  ASSERT (v_result->'result'->>'resultMultiplier')::NUMERIC = 1.21, 'limbo 5x result parity failed';
  ASSERT (v_result->'result'->>'won')::BOOLEAN = FALSE, 'limbo 5x win parity failed';
  ASSERT v_result->>'payout_multiplier' = '0.000000', 'limbo 5x payout parity failed';

  v_result := _game_result('crash', v_seed, v_client, v_nonce, '{"autoCashout":"2.00"}'::JSONB);
  ASSERT (v_result->'result'->>'crashMultiplier')::NUMERIC = 1.21, 'crash 2x multiplier parity failed';
  ASSERT (v_result->'result'->>'cashedOut')::BOOLEAN = FALSE, 'crash 2x cashout parity failed';
  ASSERT (v_result->'result'->>'cashoutMultiplier')::NUMERIC = 0, 'crash 2x payout parity failed';

  v_result := _game_result('crash', v_seed, v_client, v_nonce, '{"autoCashout":"5.00"}'::JSONB);
  ASSERT (v_result->'result'->>'crashMultiplier')::NUMERIC = 1.21, 'crash 5x multiplier parity failed';
  ASSERT (v_result->'result'->>'cashedOut')::BOOLEAN = FALSE, 'crash 5x cashout parity failed';
  ASSERT (v_result->'result'->>'cashoutMultiplier')::NUMERIC = 0, 'crash 5x payout parity failed';

  v_result := _game_result('mines', v_seed, v_client, v_nonce, '{"mineCount":3,"revealedCells":[0,1,2]}'::JSONB);
  ASSERT v_result->'result'->'minePositions' = '[6,0,4]'::JSONB, 'mines 3 positions parity failed';
  ASSERT (v_result->'result'->>'hitMine')::BOOLEAN = TRUE, 'mines 3 hit parity failed';

  v_result := _game_result('mines', v_seed, v_client, v_nonce, '{"mineCount":24,"revealedCells":[0]}'::JSONB);
  ASSERT v_result->'result'->'minePositions' = '[6,0,4,5,13,19,11,8,20,14,16,21,24,1,3,10,17,9,12,18,2,7,23,15]'::JSONB,
    'mines 24 positions parity failed';
  ASSERT (v_result->'result'->>'hitMine')::BOOLEAN = TRUE, 'mines 24 hit parity failed';

  v_result := _game_result('hilo', v_seed, v_client, v_nonce, '{"startCard":7,"guesses":["higher"]}'::JSONB);
  ASSERT v_result->'result'->'cards' = '[7,3]'::JSONB, 'hilo one cards parity failed';
  ASSERT v_result->'result'->'rounds' = '[{"card":7,"guess":"higher","correct":false,"multiplier":0}]'::JSONB,
    'hilo one rounds parity failed';
  ASSERT (v_result->'result'->>'won')::BOOLEAN = FALSE, 'hilo one win parity failed';

  v_result := _game_result('hilo', v_seed, v_client, v_nonce, '{"startCard":null,"guesses":["skip","higher","lower"]}'::JSONB);
  ASSERT v_result->'result'->'cards' = '[3,6,12,4]'::JSONB, 'hilo three cards parity failed';
  ASSERT v_result->'result'->'rounds' =
    '[{"card":3,"guess":"skip","correct":true,"multiplier":1},{"card":6,"guess":"higher","correct":true,"multiplier":1.83},{"card":12,"guess":"lower","correct":true,"multiplier":2.14}]'::JSONB,
    'hilo three rounds parity failed';
  ASSERT (v_result->'result'->>'won')::BOOLEAN = TRUE, 'hilo three win parity failed';
  ASSERT v_result->>'payout_multiplier' = '2.140000', 'hilo three payout parity failed';

  v_result := _game_result('plinko', v_seed, v_client, v_nonce, '{"rows":12,"risk":"low"}'::JSONB);
  ASSERT v_result->'result'->'path' = '[0,0,1,0,1,0,0,0,0,1,1,1]'::JSONB, 'plinko 12 path parity failed';
  ASSERT (v_result->'result'->>'bucket')::INT = 5, 'plinko 12 bucket parity failed';
  ASSERT v_result->'result'->>'bucketMultiplier' = '0.9', 'plinko 12 multiplier parity failed';

  v_result := _game_result('plinko', v_seed, v_client, v_nonce, '{"rows":16,"risk":"high"}'::JSONB);
  ASSERT v_result->'result'->'path' = '[0,0,1,0,1,0,0,0,0,1,1,1,0,0,1,1]'::JSONB, 'plinko 16 path parity failed';
  ASSERT (v_result->'result'->>'bucket')::INT = 7, 'plinko 16 bucket parity failed';
  ASSERT v_result->'result'->>'bucketMultiplier' = '0.3', 'plinko 16 multiplier parity failed';

  v_result := _game_result('deepshaft', v_seed, v_client, v_nonce, '{"riskTier":"standard","targetDepth":5}'::JSONB);
  ASSERT (v_result->'result'->>'reachedDepth')::INT = 5, 'deepshaft reached depth parity failed';
  ASSERT (v_result->'result'->>'caveIn')::BOOLEAN = FALSE, 'deepshaft caveIn parity failed';
  ASSERT (v_result->'result'->>'totalMultiplier')::NUMERIC = 1.51, 'deepshaft payout parity failed';
  ASSERT jsonb_array_length(v_result->'result'->'levels') = 5, 'deepshaft levels parity failed';

  v_result := _game_result('momentum', v_seed, v_client, v_nonce, '{"comboBefore":0,"cashOut":false}'::JSONB);
  ASSERT (v_result->'result'->>'won')::BOOLEAN = FALSE, 'momentum play won parity failed';
  ASSERT (v_result->'result'->>'roll')::NUMERIC = 18.37, 'momentum play roll parity failed';

  v_result := _game_result('momentum', v_seed, v_client, v_nonce, '{"comboBefore":3,"cashOut":true}'::JSONB);
  ASSERT (v_result->'result'->>'cashedOut')::BOOLEAN = TRUE, 'momentum cashout parity failed';
  ASSERT (v_result->'result'->>'totalMultiplier')::NUMERIC = 16.29, 'momentum cashout mult parity failed';

  v_result := _game_result('mint_reels', v_seed, v_client, v_nonce, '{"lines":20}'::JSONB);
  ASSERT (v_result->'result'->>'totalMultiplier')::NUMERIC = 0, 'mint_reels 20 lines multiplier parity failed';
  ASSERT v_result->>'payout_multiplier' = '0.000000', 'mint_reels 20 lines payout parity failed';

  v_result := _game_result('mint_reels', v_seed, v_client, v_nonce, '{"lines":1}'::JSONB);
  ASSERT (v_result->'result'->>'totalMultiplier')::NUMERIC = 0, 'mint_reels 1 line multiplier parity failed';
  ASSERT v_result->>'payout_multiplier' = '0.000000', 'mint_reels 1 line payout parity failed';

  v_result := _game_result('gold_rush', v_seed, v_client, v_nonce, '{"lines":20}'::JSONB);
  ASSERT (v_result->'result'->>'totalMultiplier')::NUMERIC = 0, 'gold_rush 20 lines multiplier parity failed';
  ASSERT v_result->>'payout_multiplier' = '0.000000', 'gold_rush 20 lines payout parity failed';

  v_result := _game_result('gold_rush', v_seed, v_client, v_nonce, '{"lines":1}'::JSONB);
  ASSERT (v_result->'result'->>'totalMultiplier')::NUMERIC = 0, 'gold_rush 1 line multiplier parity failed';
  ASSERT v_result->>'payout_multiplier' = '0.000000', 'gold_rush 1 line payout parity failed';

  v_result := _game_result('roulette', v_seed, v_client, v_nonce, '{"bets":[{"type":"red","value":null,"stakeWeight":1}]}'::JSONB);
  ASSERT (v_result->'result'->>'winningNumber')::INT = 6, 'roulette red winning number parity failed';
  ASSERT (v_result->'result'->>'totalMultiplier')::NUMERIC = 0, 'roulette red multiplier parity failed';
  ASSERT v_result->>'payout_multiplier' = '0.000000', 'roulette red payout parity failed';

  v_result := _game_result('roulette', v_seed, v_client, v_nonce, '{"bets":[{"type":"straight","value":7,"stakeWeight":1}]}'::JSONB);
  ASSERT (v_result->'result'->>'winningNumber')::INT = 6, 'roulette straight winning number parity failed';
  ASSERT (v_result->'result'->>'totalMultiplier')::NUMERIC = 0, 'roulette straight multiplier parity failed';
  ASSERT v_result->>'payout_multiplier' = '0.000000', 'roulette straight payout parity failed';

  v_result := _game_result('blackjack', v_seed, v_client, v_nonce, '{"actions":[{"seat":0,"move":"stand"}]}'::JSONB);
  ASSERT (v_result->'result'->>'totalMultiplier')::NUMERIC = 2, 'blackjack stand multiplier parity failed';
  ASSERT v_result->>'payout_multiplier' = '2.000000', 'blackjack stand payout parity failed';

  v_result := _game_result('blackjack', v_seed, v_client, v_nonce, '{"actions":[{"seat":0,"move":"hit"},{"seat":0,"move":"stand"}]}'::JSONB);
  ASSERT (v_result->'result'->>'totalMultiplier')::NUMERIC = 2, 'blackjack hit-stand multiplier parity failed';
  ASSERT v_result->>'payout_multiplier' = '2.000000', 'blackjack hit-stand payout parity failed';

  FOR v_case IN 1..2000 LOOP
    v_seed := encode(extensions.digest('part-c-existing-result:' || v_case::TEXT, 'sha256'), 'hex');
    v_client := 'part_c_client_' || (v_case % 97)::TEXT;
    v_nonce := (v_case % 251) + 1;
    v_old := pg_temp.test_game_float_stream_numeric(v_seed, v_client, v_nonce, 25);
    v_new := _game_float_stream(v_seed, v_client, v_nonce, 25);

    ASSERT floor(v_old[1] * 10000)::INT = floor(v_new[1] * 10000)::INT,
      format('dice domain changed at case %s', v_case);
    ASSERT floor(99 / (1 - v_old[1]))::INT = floor(99.0 / (1.0 - v_new[1]))::INT,
      format('crash/limbo domain changed at case %s', v_case);

    FOR v_idx IN 1..16 LOOP
      ASSERT (v_old[v_idx] < 0.5) = (v_new[v_idx] < 0.5),
        format('plinko direction changed at case %s idx %s', v_case, v_idx);
      ASSERT floor(v_old[v_idx] * 13)::INT = floor(v_new[v_idx] * 13)::INT,
        format('hilo card changed at case %s idx %s', v_case, v_idx);
    END LOOP;

    FOR v_shuffle_idx IN REVERSE 25..2 LOOP
      v_old_mines_j := floor(v_old[v_shuffle_idx - 1] * v_shuffle_idx)::INT + 1;
      v_new_mines_j := floor(v_new[v_shuffle_idx - 1] * v_shuffle_idx)::INT + 1;
      ASSERT v_old_mines_j = v_new_mines_j,
        format('mines shuffle changed at case %s shuffle_idx %s', v_case, v_shuffle_idx);
    END LOOP;
  END LOOP;

  RAISE NOTICE 'CASINO PARITY OK — 12 games × 2 deterministic paths match TS constants';
  RAISE NOTICE 'CASINO DOUBLE DOMAIN OK — legacy NUMERIC and new double keep 6-game result boundaries unchanged across 2000 seeds';
END;
$$;

-- ============================================================
-- E23 GROWTH — progressive · live crash · PF seed controls pin
-- One-shot _game_result paths above remain the 12-game authority.
-- Money/Σ=0 paths: ew_e23_casino_live_test.sql (GATE).
-- ============================================================
DO $$
BEGIN
  ASSERT to_regprocedure(
    'public.rpc_progressive_start(text, text, text, jsonb, text, text, boolean)'
  ) IS NOT NULL,
    'E23 GROWTH: rpc_progressive_start missing';
  ASSERT to_regprocedure(
    'public.rpc_progressive_step(uuid, jsonb, text)'
  ) IS NOT NULL,
    'E23 GROWTH: rpc_progressive_step missing';
  ASSERT to_regprocedure(
    'public.rpc_progressive_cashout(uuid, text)'
  ) IS NOT NULL,
    'E23 GROWTH: rpc_progressive_cashout missing';
  ASSERT to_regprocedure(
    'public.rpc_live_crash_place_bet(text, text, text, text, text, boolean)'
  ) IS NOT NULL,
    'E23 GROWTH: rpc_live_crash_place_bet missing';
  ASSERT to_regprocedure(
    'public.rpc_live_crash_cashout(uuid, text)'
  ) IS NOT NULL,
    'E23 GROWTH: rpc_live_crash_cashout missing';
  ASSERT to_regprocedure('public.rpc_live_crash_get_current()') IS NOT NULL,
    'E23 GROWTH: rpc_live_crash_get_current missing';
  ASSERT to_regprocedure('public.rpc_get_game_pf_state()') IS NOT NULL,
    'E23 GROWTH: rpc_get_game_pf_state missing';
  ASSERT to_regprocedure('public.rpc_set_game_client_seed(text)') IS NOT NULL,
    'E23 GROWTH: rpc_set_game_client_seed missing';
  ASSERT to_regprocedure('public.rpc_rotate_game_server_seed(text)') IS NOT NULL,
    'E23 GROWTH: rpc_rotate_game_server_seed missing';

  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_game_pf_state'
  ), 'E23 GROWTH: user_game_pf_state missing';
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'game_progressive_sessions'
  ), 'E23 GROWTH: game_progressive_sessions missing';
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'live_crash_rounds'
  ), 'E23 GROWTH: live_crash_rounds missing';
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'live_crash_bets'
  ), 'E23 GROWTH: live_crash_bets missing';

  -- Server autobet must stay absent (parity growth must not introduce it).
  ASSERT NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname ILIKE '%autobet%'
  ), 'E23 GROWTH: server autobet RPC must not exist';

  RAISE NOTICE 'E23 GROWTH OK — progressive · live crash · PF RPCs pinned · one-shot parity suite intact';
END;
$$;

ROLLBACK;
