-- Fix blackjack PF shuffle float indexing (1-based, 51 floats for 52-card FY).

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _bj_shuffle(p_floats DOUBLE PRECISION[])
RETURNS INT[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_deck INT[] := ARRAY(SELECT generate_series(1, 52));
  v_i INT;
  v_j INT;
  v_tmp INT;
BEGIN
  FOR v_i IN REVERSE 52..2 LOOP
    v_j := floor(_require_game_float(p_floats, 53 - v_i) * v_i)::INT + 1;
    v_tmp := v_deck[v_i];
    v_deck[v_i] := v_deck[v_j];
    v_deck[v_j] := v_tmp;
  END LOOP;
  RETURN v_deck;
END;
$$;

REVOKE ALL ON FUNCTION _bj_shuffle(DOUBLE PRECISION[]) FROM PUBLIC, anon, authenticated;

-- Patch _game_result blackjack branch to request 51 floats.
CREATE OR REPLACE FUNCTION _game_result(
  p_game game_code,
  p_server_seed TEXT,
  p_client_seed TEXT,
  p_nonce INT,
  p_selection JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_floats DOUBLE PRECISION[];
  v_f DOUBLE PRECISION;
  v_roll NUMERIC;
  v_target NUMERIC;
  v_probability NUMERIC;
  v_multiplier NUMERIC := 0;
  v_won BOOLEAN := FALSE;
  v_result JSONB;
  v_rows INT;
  v_risk TEXT;
  v_path JSONB := '[]'::JSONB;
  v_bucket INT := 0;
  v_dir INT;
  v_mine_count INT;
  v_revealed INT[];
  v_positions INT[] := ARRAY[]::INT[];
  v_cells INT[] := ARRAY[]::INT[];
  v_j INT;
  v_tmp INT;
  v_hit BOOLEAN := FALSE;
  v_guess TEXT;
  v_current_card INT;
  v_next_card INT;
  v_float_idx INT;
  v_cards JSONB := '[]'::JSONB;
  v_rounds JSONB := '[]'::JSONB;
  v_correct BOOLEAN;
  v_lines INT;
  v_winning INT;
BEGIN
  CASE p_game
    WHEN 'dice' THEN
      v_floats := _game_float_stream(p_server_seed, p_client_seed, p_nonce, 1);
      v_roll := floor(_require_game_float(v_floats, 1) * 10000)::NUMERIC / 100;
      v_target := (p_selection->>'target')::NUMERIC;
      IF p_selection->>'direction' = 'over' THEN
        v_won := v_roll > v_target;
        v_probability := (9999 - floor(v_target * 100))::NUMERIC / 10000;
      ELSIF p_selection->>'direction' = 'under' THEN
        v_won := v_roll < v_target;
        v_probability := floor(v_target * 100)::NUMERIC / 10000;
      ELSE
        RAISE EXCEPTION 'invalid_dice_direction';
      END IF;
      IF v_probability <= 0 THEN RAISE EXCEPTION 'invalid_dice_target'; END IF;
      v_multiplier := CASE WHEN v_won THEN floor(99 / v_probability) / 100 ELSE 0 END;
      v_result := jsonb_build_object('roll', v_roll, 'won', v_won);

    WHEN 'limbo' THEN
      v_floats := _game_float_stream(p_server_seed, p_client_seed, p_nonce, 1);
      v_f := _require_game_float(v_floats, 1);
      v_roll := LEAST(1000000, GREATEST(1, floor(99.0 / (1.0 - v_f))::NUMERIC / 100));
      v_target := (p_selection->>'target')::NUMERIC;
      IF v_target > _app_config_numeric('casino_limbo_max_target', 1000000) THEN
        RAISE EXCEPTION 'limbo_target_too_high';
      END IF;
      v_won := v_roll >= v_target;
      v_multiplier := CASE WHEN v_won THEN v_target ELSE 0 END;
      v_result := jsonb_build_object('resultMultiplier', v_roll, 'won', v_won);

    WHEN 'crash' THEN
      v_floats := _game_float_stream(p_server_seed, p_client_seed, p_nonce, 1);
      v_f := _require_game_float(v_floats, 1);
      v_roll := GREATEST(1, floor(99.0 / (1.0 - v_f))::NUMERIC / 100);
      v_target := (p_selection->>'autoCashout')::NUMERIC;
      v_won := v_target <= v_roll AND v_target >= 1.01;
      v_multiplier := CASE WHEN v_won THEN v_target ELSE 0 END;
      v_result := jsonb_build_object('crashMultiplier', v_roll, 'cashedOut', v_won, 'cashoutMultiplier', v_multiplier);

    WHEN 'plinko' THEN
      v_rows := (p_selection->>'rows')::INT;
      v_risk := p_selection->>'risk';
      IF v_rows NOT IN (8, 12, 16) THEN RAISE EXCEPTION 'invalid_plinko_selection'; END IF;
      v_floats := _game_float_stream(p_server_seed, p_client_seed, p_nonce, v_rows);
      FOR v_row_idx IN 1..v_rows LOOP
        v_dir := CASE WHEN _require_game_float(v_floats, v_row_idx) < 0.5 THEN 0 ELSE 1 END;
        v_path := v_path || to_jsonb(v_dir);
        v_bucket := v_bucket + v_dir;
      END LOOP;
      v_multiplier := _plinko_multiplier(v_rows, v_risk, v_bucket);
      v_result := jsonb_build_object('path', v_path, 'bucket', v_bucket, 'bucketMultiplier', to_char(v_multiplier, 'FM999999999990.0'));

    WHEN 'mines' THEN
      v_mine_count := (p_selection->>'mineCount')::INT;
      SELECT array_agg((value)::INT) INTO v_revealed FROM jsonb_array_elements_text(p_selection->'revealedCells');
      IF v_mine_count < 1 OR v_mine_count > 24 THEN RAISE EXCEPTION 'invalid_mines_selection'; END IF;
      IF COALESCE(cardinality(v_revealed), 0) > 25 - v_mine_count THEN RAISE EXCEPTION 'revealed_cells_exceed_safe'; END IF;
      IF EXISTS (SELECT 1 FROM unnest(COALESCE(v_revealed, ARRAY[]::INT[])) c GROUP BY c HAVING count(*) > 1) THEN
        RAISE EXCEPTION 'revealed_cells_not_distinct';
      END IF;
      v_floats := _game_float_stream(p_server_seed, p_client_seed, p_nonce, 25);
      v_cells := ARRAY(SELECT generate_series(0, 24));
      FOR v_shuffle_idx IN REVERSE 25..2 LOOP
        v_j := floor(_require_game_float(v_floats, v_shuffle_idx - 1) * v_shuffle_idx)::INT + 1;
        v_tmp := v_cells[v_shuffle_idx];
        v_cells[v_shuffle_idx] := v_cells[v_j];
        v_cells[v_j] := v_tmp;
      END LOOP;
      v_positions := v_cells[1:v_mine_count];
      v_hit := EXISTS (
        SELECT 1 FROM unnest(COALESCE(v_revealed, ARRAY[]::INT[])) r
        WHERE r = ANY(v_positions)
      );
      v_multiplier := CASE
        WHEN v_hit OR COALESCE(cardinality(v_revealed), 0) = 0 THEN 0
        ELSE _mines_multiplier(v_mine_count, cardinality(v_revealed))
      END;
      v_result := jsonb_build_object('minePositions', to_jsonb(v_positions), 'hitMine', v_hit);

    WHEN 'hilo' THEN
      IF jsonb_array_length(p_selection->'guesses') > 10 THEN RAISE EXCEPTION 'hilo_too_many_guesses'; END IF;
      v_floats := _game_float_stream(p_server_seed, p_client_seed, p_nonce, 11);
      v_float_idx := 1;
      IF p_selection ? 'startCard' AND p_selection->>'startCard' IS NOT NULL THEN
        v_current_card := (p_selection->>'startCard')::INT;
      ELSE
        v_current_card := floor(_require_game_float(v_floats, v_float_idx) * 13)::INT + 1;
        v_float_idx := v_float_idx + 1;
      END IF;
      v_cards := v_cards || to_jsonb(v_current_card);
      v_won := jsonb_array_length(p_selection->'guesses') > 0;
      v_multiplier := 1;
      FOR v_guess IN SELECT jsonb_array_elements_text(p_selection->'guesses') LOOP
        v_next_card := floor(_require_game_float(v_floats, v_float_idx) * 13)::INT + 1;
        v_float_idx := v_float_idx + 1;
        v_cards := v_cards || to_jsonb(v_next_card);
        IF v_guess = 'skip' THEN
          v_correct := TRUE;
        ELSIF v_guess = 'higher' THEN
          v_correct := v_next_card > v_current_card;
        ELSIF v_guess = 'lower' THEN
          v_correct := v_next_card < v_current_card;
        ELSE
          RAISE EXCEPTION 'invalid_hilo_guess';
        END IF;
        IF v_guess <> 'skip' THEN
          v_multiplier := CASE WHEN v_correct THEN floor(v_multiplier * _hilo_step_multiplier(v_current_card, v_guess) * 100) / 100 ELSE 0 END;
        END IF;
        v_rounds := v_rounds || jsonb_build_object('card', v_current_card, 'guess', v_guess, 'correct', v_correct, 'multiplier', v_multiplier);
        v_current_card := v_next_card;
        IF NOT v_correct THEN
          v_won := FALSE;
          EXIT;
        END IF;
      END LOOP;
      IF NOT v_won OR jsonb_array_length(v_rounds) = 0 THEN
        v_multiplier := 0;
      END IF;
      v_result := jsonb_build_object('cards', v_cards, 'rounds', v_rounds, 'won', v_won);

    WHEN 'mint_reels' THEN
      v_lines := (p_selection->>'lines')::INT;
      v_floats := _game_float_stream(p_server_seed, p_client_seed, p_nonce, 5);
      v_multiplier := _slot_spin_multiplier(_mint_reels_reels(), _mint_reels_paytable(), v_lines, v_floats);
      v_result := jsonb_build_object('totalMultiplier', v_multiplier);

    WHEN 'gold_rush' THEN
      v_lines := (p_selection->>'lines')::INT;
      v_floats := _game_float_stream(p_server_seed, p_client_seed, p_nonce, 5);
      v_multiplier := _slot_spin_multiplier(_gold_rush_reels(), _gold_rush_paytable(), v_lines, v_floats);
      v_result := jsonb_build_object('totalMultiplier', v_multiplier);

    WHEN 'roulette' THEN
      v_floats := _game_float_stream(p_server_seed, p_client_seed, p_nonce, 1);
      v_winning := floor(_require_game_float(v_floats, 1) * 37)::INT;
      v_multiplier := _roulette_evaluate(p_selection, v_winning);
      v_result := jsonb_build_object('winningNumber', v_winning, 'totalMultiplier', v_multiplier);

    WHEN 'blackjack' THEN
      v_floats := _game_float_stream(p_server_seed, p_client_seed, p_nonce, 51);
      v_multiplier := _bj_play(p_selection, v_floats);
      v_result := jsonb_build_object('totalMultiplier', v_multiplier);

    ELSE
      RAISE EXCEPTION 'invalid_game_code';
  END CASE;

  RETURN jsonb_build_object(
    'result', v_result,
    'payout_multiplier', _fmt6(v_multiplier),
    'won', v_multiplier > 0
  );
END;
$$;

REVOKE ALL ON FUNCTION _game_result(game_code, TEXT, TEXT, INT, JSONB) FROM PUBLIC, anon, authenticated;
