-- Mines LAW 1 attack 2 — strip unrevealed minePositions from client bet responses.
-- Internal _game_result + DB result_payload remain full for settlement / reveal / parity.

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _mines_is_terminal(
  p_selection JSONB,
  p_hit BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_mine_count INT;
  v_revealed_count INT;
BEGIN
  v_mine_count := (p_selection->>'mineCount')::INT;
  SELECT COALESCE(count(*)::INT, 0)
    INTO v_revealed_count
    FROM jsonb_array_elements_text(COALESCE(p_selection->'revealedCells', '[]'::JSONB));
  RETURN p_hit OR v_revealed_count >= (25 - v_mine_count);
END;
$$;

REVOKE ALL ON FUNCTION _mines_is_terminal(JSONB, BOOLEAN) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _mines_client_result(
  p_full_result JSONB,
  p_selection JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_hit BOOLEAN := COALESCE((p_full_result->>'hitMine')::BOOLEAN, FALSE);
BEGIN
  IF _mines_is_terminal(p_selection, v_hit) THEN
    RETURN p_full_result;
  END IF;
  RETURN jsonb_build_object('hitMine', FALSE);
END;
$$;

REVOKE ALL ON FUNCTION _mines_client_result(JSONB, JSONB) FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  v_def TEXT;
  v_new TEXT;
BEGIN
  v_def := pg_get_functiondef('public.rpc_place_game_bet(uuid,text,text,jsonb,text,text,jsonb)'::regprocedure);

  IF position('v_client_result JSONB' IN v_def) = 0 THEN
    v_new := replace(v_def, 'v_result JSONB;', 'v_result JSONB;
  v_client_result JSONB;');
    IF v_new = v_def THEN RAISE EXCEPTION 'mines leak fix: v_result declare anchor not found'; END IF;
    v_def := v_new;
  END IF;

  IF position('_mines_client_result(v_existing.result_payload' IN v_def) = 0 THEN
    v_new := replace(
      v_def,
      '''result'', v_existing.result_payload',
      '''result'', CASE WHEN v_existing.game = ''mines''::game_code
        THEN _mines_client_result(v_existing.result_payload, v_existing.selection)
        ELSE v_existing.result_payload END'
    );
    IF v_new = v_def THEN RAISE EXCEPTION 'mines leak fix: idempotency result anchor not found'; END IF;
    v_def := v_new;
  END IF;

  IF position('v_client_result := CASE WHEN v_round.game' IN v_def) = 0 THEN
    v_new := replace(
      v_def,
      'v_result := v_resolution->''result'';',
      'v_result := v_resolution->''result'';
  v_client_result := CASE WHEN v_round.game = ''mines''::game_code
    THEN _mines_client_result(v_result, p_selection)
    ELSE v_result END;'
    );
    IF v_new = v_def THEN RAISE EXCEPTION 'mines leak fix: v_result assign anchor not found'; END IF;
    v_def := v_new;
  END IF;

  IF position('''result'', v_client_result,' IN v_def) = 0 THEN
    v_new := replace(v_def, '''result'', v_result,', '''result'', v_client_result,');
    IF v_new = v_def THEN RAISE EXCEPTION 'mines leak fix: return result anchor not found'; END IF;
    v_def := v_new;
  END IF;

  EXECUTE v_def;
END;
$$;
