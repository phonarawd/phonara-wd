-- ============================================================
-- Mines client result leak — _mines_client_result isolation
-- ============================================================
-- Partial cashout must not expose full minePositions[] in client payloads.
-- Terminal outcomes (hit mine / all safe cells revealed) keep full layout.
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_seed TEXT := 'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb';
  v_client TEXT := 'parity_client';
  v_nonce INT := 1;
  v_full JSONB;
  v_client_result JSONB;
  v_selection JSONB;
BEGIN
  -- Attack 2 replay: 1 safe tile cashout — no full minePositions leak.
  v_selection := '{"mineCount":3,"revealedCells":[1]}'::JSONB;
  v_full := _game_result('mines', v_seed, v_client, v_nonce, v_selection)->'result';
  ASSERT (v_full->>'hitMine')::BOOLEAN = FALSE, 'partial cashout must not hit mine';
  v_client_result := _mines_client_result(v_full, v_selection);
  ASSERT NOT (v_client_result ? 'minePositions'),
    'partial cashout client result must omit minePositions';
  ASSERT (v_client_result->>'hitMine')::BOOLEAN = FALSE,
    'partial cashout client hitMine must be false';

  -- Hit mine — terminal, full layout exposed to client.
  v_selection := '{"mineCount":3,"revealedCells":[0,1,2]}'::JSONB;
  v_full := _game_result('mines', v_seed, v_client, v_nonce, v_selection)->'result';
  ASSERT (v_full->>'hitMine')::BOOLEAN = TRUE, 'hit mine parity setup failed';
  v_client_result := _mines_client_result(v_full, v_selection);
  ASSERT v_client_result->'minePositions' = '[6,0,4]'::JSONB,
    'hit mine client result must expose full minePositions';
  ASSERT (v_client_result->>'hitMine')::BOOLEAN = TRUE,
    'hit mine client hitMine must be true';

  -- Full board clear — terminal, full layout exposed to client.
  v_selection := '{"mineCount":3,"revealedCells":[1,2,3,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]}'::JSONB;
  v_full := _game_result('mines', v_seed, v_client, v_nonce, v_selection)->'result';
  ASSERT (v_full->>'hitMine')::BOOLEAN = FALSE, 'full clear must not hit mine';
  ASSERT _mines_is_terminal(v_selection, FALSE), 'full clear must be terminal';
  v_client_result := _mines_client_result(v_full, v_selection);
  ASSERT v_client_result->'minePositions' = v_full->'minePositions',
    'full clear client result must expose full minePositions';
  ASSERT jsonb_array_length(v_client_result->'minePositions') = 3,
    'full clear must retain mine count in client payload';
END;
$$;

ROLLBACK;
