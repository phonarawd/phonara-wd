-- ============================================================
-- PIR P2 — PF boundary float golden vectors (SQL authority)
-- ============================================================
-- Mirrors packages/game-engine/src/fairness/pf-golden-vectors.ts
-- Seed triple + formula floors must stay SQL↔TS locked.
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_seed TEXT := 'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb';
  v_client TEXT := 'parity_client';
  v_nonce INT := 1;
  v_floats DOUBLE PRECISION[];
  v_f_max DOUBLE PRECISION := 1.0 - power(2.0::DOUBLE PRECISION, -32);
  v_f_min DOUBLE PRECISION := 0.0;
  v_result JSONB;
BEGIN
  -- Stream pin: first float of golden seed (TS PF_GOLDEN_SEED_FLOATS[0])
  v_floats := _game_float_stream(v_seed, v_client, v_nonce, 8);
  ASSERT abs(v_floats[1] - 0.18378638522699475) < 1e-15,
    format('P2 float stream[0] drift: %s', v_floats[1]);

  -- Dice / momentum roll boundaries
  ASSERT floor(v_f_min * 10000)::INT / 100.0 = 0, 'P2 dice roll at f=0';
  ASSERT floor(v_f_max * 10000)::INT / 100.0 = 99.99, 'P2 dice roll at f=max';

  -- Crash / limbo multiplier boundaries
  ASSERT GREATEST(1, floor(99.0 / (1.0 - v_f_min))::NUMERIC / 100) = 1,
    'P2 crash/limbo at f=0';
  ASSERT LEAST(1000000, GREATEST(1, floor(99.0 / (1.0 - v_f_max))::NUMERIC / 100)) = 1000000,
    'P2 limbo clamp at f=max';

  -- Plinko direction boundary
  ASSERT (v_f_min < 0.5) = TRUE, 'P2 plinko left at f=0';
  ASSERT (0.5::DOUBLE PRECISION < 0.5) = FALSE, 'P2 plinko right at f=0.5';

  -- HiLo card / roulette pocket / mines shuffle j
  ASSERT floor(v_f_min * 13)::INT + 1 = 1, 'P2 hilo card min';
  ASSERT floor(v_f_max * 13)::INT + 1 = 13, 'P2 hilo card max';
  ASSERT floor(v_f_min * 37)::INT = 0, 'P2 roulette min';
  ASSERT floor(v_f_max * 37)::INT = 36, 'P2 roulette max';
  ASSERT floor(v_f_min * 25)::INT = 0, 'P2 mines/bj shuffle j min';
  ASSERT floor(v_f_max * 25)::INT = 24, 'P2 mines/bj shuffle j max';

  -- Slot reel stop sentinel (stripLen=2)
  ASSERT floor(v_f_min * 2)::INT = 0, 'P2 slot stop min';
  ASSERT floor(v_f_max * 2)::INT = 1, 'P2 slot stop max';

  -- 12-game seed results (subset — full matrix in casino_parity_test.sql)
  v_result := _game_result('dice', v_seed, v_client, v_nonce, '{"target":"50.00","direction":"over"}'::JSONB);
  ASSERT (v_result->'result'->>'roll')::NUMERIC = 18.37, 'P2 dice seed roll';

  v_result := _game_result('limbo', v_seed, v_client, v_nonce, '{"target":"2.00"}'::JSONB);
  ASSERT (v_result->'result'->>'resultMultiplier')::NUMERIC = 1.21, 'P2 limbo seed';

  v_result := _game_result('crash', v_seed, v_client, v_nonce, '{"autoCashout":"2.00"}'::JSONB);
  ASSERT (v_result->'result'->>'crashMultiplier')::NUMERIC = 1.21, 'P2 crash seed';

  v_result := _game_result('mines', v_seed, v_client, v_nonce, '{"mineCount":3,"revealedCells":[0,1,2]}'::JSONB);
  ASSERT v_result->'result'->'minePositions' = '[6,0,4]'::JSONB, 'P2 mines seed';

  v_result := _game_result('hilo', v_seed, v_client, v_nonce, '{"startCard":7,"guesses":["higher"]}'::JSONB);
  ASSERT (v_result->'result'->>'won')::BOOLEAN = FALSE, 'P2 hilo seed';

  v_result := _game_result('plinko', v_seed, v_client, v_nonce, '{"rows":12,"risk":"low"}'::JSONB);
  ASSERT (v_result->'result'->>'bucket')::INT = 5, 'P2 plinko seed';

  v_result := _game_result('deepshaft', v_seed, v_client, v_nonce, '{"riskTier":"standard","targetDepth":5}'::JSONB);
  ASSERT (v_result->'result'->>'totalMultiplier')::NUMERIC = 1.51, 'P2 deepshaft seed';

  v_result := _game_result('momentum', v_seed, v_client, v_nonce, '{"comboBefore":0,"cashOut":false}'::JSONB);
  ASSERT (v_result->'result'->>'roll')::NUMERIC = 18.37, 'P2 momentum seed';

  v_result := _game_result('mint_reels', v_seed, v_client, v_nonce, '{"lines":20}'::JSONB);
  ASSERT (v_result->'result'->>'totalMultiplier')::NUMERIC = 0, 'P2 mint_reels seed';

  v_result := _game_result('gold_rush', v_seed, v_client, v_nonce, '{"lines":20}'::JSONB);
  ASSERT (v_result->'result'->>'totalMultiplier')::NUMERIC = 0, 'P2 gold_rush seed';

  v_result := _game_result('roulette', v_seed, v_client, v_nonce, '{"bets":[{"type":"red","value":null,"stakeWeight":1}]}'::JSONB);
  ASSERT (v_result->'result'->>'winningNumber')::INT = 6, 'P2 roulette seed';

  v_result := _game_result('blackjack', v_seed, v_client, v_nonce, '{"actions":[{"seat":0,"move":"stand"}]}'::JSONB);
  ASSERT (v_result->'result'->>'totalMultiplier')::NUMERIC = 2, 'P2 blackjack seed';

  RAISE NOTICE 'PIR P2 PF GOLDEN VECTORS OK — 12-game seed + boundary float floors';
END;
$$;

ROLLBACK;
