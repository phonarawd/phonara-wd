-- Deepshaft + Momentum casino engines (enum in 20260617000120_game_code_enum_deepshaft_momentum.sql)

SET search_path = public, pg_temp;

-- ─── Deepshaft helpers ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _deepshaft_cave_prob(p_tier TEXT, p_depth INT)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_tier
    WHEN 'safe' THEN LEAST(0.18, 0.035 + power(GREATEST(p_depth - 1, 0)::NUMERIC, 1.15) * 0.008)
    WHEN 'standard' THEN LEAST(0.28, 0.053 + power(GREATEST(p_depth - 1, 0)::NUMERIC, 1.15) * 0.012)
    WHEN 'deep' THEN LEAST(0.38, 0.085 + power(GREATEST(p_depth - 1, 0)::NUMERIC, 1.15) * 0.016)
    ELSE NULL
  END;
$$;

REVOKE ALL ON FUNCTION _deepshaft_cave_prob(TEXT, INT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _deepshaft_complete_prob(p_tier TEXT, p_target_depth INT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_p NUMERIC := 1;
  v_d INT;
BEGIN
  IF p_target_depth < 1 OR p_target_depth > 15 THEN
    RAISE EXCEPTION 'invalid_deepshaft_depth';
  END IF;
  FOR v_d IN 1..p_target_depth LOOP
    v_p := v_p * (1 - _deepshaft_cave_prob(p_tier, v_d));
  END LOOP;
  RETURN v_p;
END;
$$;

REVOKE ALL ON FUNCTION _deepshaft_complete_prob(TEXT, INT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _deepshaft_payout_mult(p_tier TEXT, p_target_depth INT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_prob NUMERIC;
  v_raw NUMERIC;
BEGIN
  v_prob := _deepshaft_complete_prob(p_tier, p_target_depth);
  IF v_prob <= 0 THEN RETURN 0; END IF;
  v_raw := 1 / v_prob;
  RETURN floor(v_raw * 99) / 100;
END;
$$;

REVOKE ALL ON FUNCTION _deepshaft_payout_mult(TEXT, INT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _deepshaft_level_growth_mult(p_tier TEXT, p_depth INT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_raw NUMERIC := 1;
  v_d INT;
  v_k NUMERIC;
  v_scale NUMERIC;
BEGIN
  IF p_depth < 1 THEN RETURN 1; END IF;
  IF p_tier NOT IN ('safe', 'standard', 'deep') THEN RAISE EXCEPTION 'invalid_deepshaft_tier'; END IF;
  v_k := CASE p_tier WHEN 'safe' THEN 0.042 WHEN 'standard' THEN 0.065 WHEN 'deep' THEN 0.088 END;
  v_scale := CASE p_tier WHEN 'safe' THEN 0.88 WHEN 'standard' THEN 1.0 WHEN 'deep' THEN 1.12 END;
  FOR v_d IN 1..p_depth LOOP
    v_raw := v_raw * (1 + v_k * power(v_d::NUMERIC, 1.35) * v_scale);
  END LOOP;
  RETURN floor(v_raw * 100) / 100;
END;
$$;

REVOKE ALL ON FUNCTION _deepshaft_level_growth_mult(TEXT, INT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _deepshaft_evaluate(p_selection JSONB, p_floats DOUBLE PRECISION[])
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_tier TEXT := p_selection->>'riskTier';
  v_target INT := (p_selection->>'targetDepth')::INT;
  v_depth INT;
  v_f DOUBLE PRECISION;
  v_prob NUMERIC;
  v_levels JSONB := '[]'::JSONB;
  v_level_mult NUMERIC;
  v_reached INT := 0;
BEGIN
  IF v_tier NOT IN ('safe', 'standard', 'deep') THEN RAISE EXCEPTION 'invalid_deepshaft_tier'; END IF;
  IF v_target < 1 OR v_target > 15 THEN RAISE EXCEPTION 'invalid_deepshaft_depth'; END IF;

  FOR v_depth IN 1..v_target LOOP
    v_f := _require_game_float(p_floats, v_depth);
    v_prob := _deepshaft_cave_prob(v_tier, v_depth);
    IF v_f < v_prob THEN
      v_levels := v_levels || jsonb_build_object(
        'depth', v_depth,
        'outcome', 'cavein',
        'levelMultiplier', 0
      );
      RETURN jsonb_build_object(
        'levels', v_levels,
        'reachedDepth', v_reached,
        'caveIn', TRUE,
        'totalMultiplier', 0,
        'won', FALSE
      );
    END IF;
    v_reached := v_depth;
    v_level_mult := _deepshaft_level_growth_mult(v_tier, v_depth);
    v_levels := v_levels || jsonb_build_object(
      'depth', v_depth,
      'outcome', 'gold',
      'levelMultiplier', v_level_mult
    );
  END LOOP;

  RETURN jsonb_build_object(
    'levels', v_levels,
    'reachedDepth', v_reached,
    'caveIn', FALSE,
    'totalMultiplier', _deepshaft_payout_mult(v_tier, v_target),
    'won', TRUE
  );
END;
$$;

REVOKE ALL ON FUNCTION _deepshaft_evaluate(JSONB, DOUBLE PRECISION[]) FROM PUBLIC, anon, authenticated;

-- ─── Momentum helpers ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _momentum_combo_mult(p_combo INT)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_combo
    WHEN 1 THEN 3.08 WHEN 2 THEN 7.42 WHEN 3 THEN 16.46 WHEN 4 THEN 35.3 WHEN 5 THEN 74.54
    WHEN 6 THEN 156.31 WHEN 7 THEN 326.64 WHEN 8 THEN 681.52 WHEN 9 THEN 1420.83 WHEN 10 THEN 2961.07
    WHEN 11 THEN 6169.89 WHEN 12 THEN 12854.95 WHEN 13 THEN 26782.16 WHEN 14 THEN 55797.16 WHEN 15 THEN 116245.09
    ELSE 0
  END;
$$;

REVOKE ALL ON FUNCTION _momentum_combo_mult(INT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _momentum_cash_payout_mult(p_combo INT)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT floor(_momentum_combo_mult(p_combo) * 99) / 100;
$$;

REVOKE ALL ON FUNCTION _momentum_cash_payout_mult(INT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _momentum_evaluate(p_selection JSONB, p_floats DOUBLE PRECISION[])
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_combo_before INT := (p_selection->>'comboBefore')::INT;
  v_cash_out BOOLEAN := COALESCE((p_selection->>'cashOut')::BOOLEAN, FALSE);
  v_roll NUMERIC;
  v_won BOOLEAN;
  v_combo_after INT;
  v_combo_mult NUMERIC;
  v_total NUMERIC;
BEGIN
  IF v_combo_before < 0 OR v_combo_before > 15 THEN RAISE EXCEPTION 'invalid_momentum_combo'; END IF;

  IF v_cash_out THEN
    IF v_combo_before < 1 THEN RAISE EXCEPTION 'invalid_momentum_cashout'; END IF;
    v_combo_mult := _momentum_combo_mult(v_combo_before);
    v_total := _momentum_cash_payout_mult(v_combo_before);
    RETURN jsonb_build_object(
      'won', TRUE,
      'roll', 0,
      'comboBefore', v_combo_before,
      'comboAfter', 0,
      'comboMultiplier', v_combo_mult,
      'cashedOut', TRUE,
      'totalMultiplier', v_total
    );
  END IF;

  v_roll := floor(_require_game_float(p_floats, 1) * 10000)::NUMERIC / 100;
  v_won := v_roll >= 52;

  IF NOT v_won THEN
    RETURN jsonb_build_object(
      'won', FALSE,
      'roll', v_roll,
      'comboBefore', v_combo_before,
      'comboAfter', 0,
      'comboMultiplier', 0,
      'cashedOut', FALSE,
      'totalMultiplier', 0
    );
  END IF;

  v_combo_after := LEAST(v_combo_before + 1, 15);
  v_combo_mult := _momentum_combo_mult(v_combo_after);
  RETURN jsonb_build_object(
    'won', TRUE,
    'roll', v_roll,
    'comboBefore', v_combo_before,
    'comboAfter', v_combo_after,
    'comboMultiplier', v_combo_mult,
    'cashedOut', FALSE,
    'totalMultiplier', 0
  );
END;
$$;

REVOKE ALL ON FUNCTION _momentum_evaluate(JSONB, DOUBLE PRECISION[]) FROM PUBLIC, anon, authenticated;

-- ─── Feature flags + exposure caps ───────────────────────────────────────────

INSERT INTO app_config (key, value, description) VALUES
  ('feature_game_deepshaft_enabled', 'true', 'Per-game kill switch for Deepshaft.'),
  ('feature_game_momentum_enabled', 'true', 'Per-game kill switch for Momentum.'),
  ('casino_deepshaft_house_exposure_cap_phon', '999999999', 'Deepshaft max house exposure PHON.'),
  ('casino_deepshaft_house_exposure_cap_usdt', '999999999', 'Deepshaft max house exposure USDT.'),
  ('casino_momentum_house_exposure_cap_phon', '999999999', 'Momentum max house exposure PHON.'),
  ('casino_momentum_house_exposure_cap_usdt', '999999999', 'Momentum max house exposure USDT.')
ON CONFLICT (key) DO NOTHING;

-- ─── Extend _game_max_payout_multiplier ─────────────────────────────────────

CREATE OR REPLACE FUNCTION _game_max_payout_multiplier(p_game game_code, p_selection JSONB)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target NUMERIC;
  v_target_cents INT;
  v_probability NUMERIC;
  v_guess TEXT;
  v_current INT;
  v_mult NUMERIC := 1;
  v_rows INT;
  v_risk TEXT;
  v_max NUMERIC := 0;
  v_lines INT;
  v_leg JSONB;
  v_weight_sum NUMERIC := 0;
  v_type TEXT;
  v_tier TEXT;
  v_depth INT;
BEGIN
  CASE p_game
    WHEN 'crash' THEN
      v_target := (p_selection->>'autoCashout')::NUMERIC;
      RETURN v_target;
    WHEN 'limbo' THEN
      v_target := (p_selection->>'target')::NUMERIC;
      IF v_target > _app_config_numeric('casino_limbo_max_target', 1000000) THEN
        RAISE EXCEPTION 'limbo_target_too_high';
      END IF;
      RETURN v_target;
    WHEN 'dice' THEN
      v_target := (p_selection->>'target')::NUMERIC;
      v_target_cents := floor(v_target * 100);
      IF p_selection->>'direction' = 'over' THEN
        v_probability := (9999 - v_target_cents)::NUMERIC / 10000;
      ELSE
        v_probability := v_target_cents::NUMERIC / 10000;
      END IF;
      IF v_probability <= 0 THEN RAISE EXCEPTION 'invalid_dice_target'; END IF;
      RETURN floor(99 / v_probability) / 100;
    WHEN 'mines' THEN
      RETURN _mines_multiplier((p_selection->>'mineCount')::INT, jsonb_array_length(p_selection->'revealedCells'));
    WHEN 'hilo' THEN
      v_current := COALESCE((p_selection->>'startCard')::INT, 7);
      FOR v_guess IN SELECT jsonb_array_elements_text(p_selection->'guesses') LOOP
        v_mult := floor(v_mult * _hilo_step_multiplier(v_current, v_guess) * 100) / 100;
      END LOOP;
      RETURN v_mult;
    WHEN 'plinko' THEN
      v_rows := (p_selection->>'rows')::INT;
      v_risk := p_selection->>'risk';
      FOR v_bucket_idx IN 0..v_rows LOOP
        v_max := GREATEST(v_max, _plinko_multiplier(v_rows, v_risk, v_bucket_idx));
      END LOOP;
      RETURN v_max;
    WHEN 'mint_reels' THEN
      v_lines := (p_selection->>'lines')::INT;
      IF v_lines < 1 OR v_lines > 20 THEN RAISE EXCEPTION 'invalid_slot_lines'; END IF;
      RETURN 75.0 / v_lines;
    WHEN 'gold_rush' THEN
      v_lines := (p_selection->>'lines')::INT;
      IF v_lines < 1 OR v_lines > 20 THEN RAISE EXCEPTION 'invalid_slot_lines'; END IF;
      RETURN 80.0 / v_lines;
    WHEN 'roulette' THEN
      FOR v_leg IN SELECT jsonb_array_elements(p_selection->'bets') LOOP
        v_weight_sum := v_weight_sum + (v_leg->>'stakeWeight')::NUMERIC;
      END LOOP;
      IF v_weight_sum <= 0 THEN RAISE EXCEPTION 'invalid_roulette_bets'; END IF;
      FOR v_leg IN SELECT jsonb_array_elements(p_selection->'bets') LOOP
        v_type := v_leg->>'type';
        v_max := v_max + _roulette_leg_max_mult(v_type) * (v_leg->>'stakeWeight')::NUMERIC / v_weight_sum;
      END LOOP;
      RETURN v_max;
    WHEN 'blackjack' THEN
      RETURN 2.5;
    WHEN 'deepshaft' THEN
      v_tier := p_selection->>'riskTier';
      v_depth := (p_selection->>'targetDepth')::INT;
      IF v_tier NOT IN ('safe', 'standard', 'deep') THEN RAISE EXCEPTION 'invalid_deepshaft_tier'; END IF;
      IF v_depth < 1 OR v_depth > 15 THEN RAISE EXCEPTION 'invalid_deepshaft_depth'; END IF;
      RETURN _deepshaft_payout_mult(v_tier, v_depth);
    WHEN 'momentum' THEN
      IF COALESCE((p_selection->>'cashOut')::BOOLEAN, FALSE) THEN
        RETURN _momentum_cash_payout_mult((p_selection->>'comboBefore')::INT);
      END IF;
      RETURN 0;
    ELSE
      RAISE EXCEPTION 'invalid_game_code';
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION _game_max_payout_multiplier(game_code, JSONB) FROM PUBLIC, anon, authenticated;

-- ─── Extend _game_result ───────────────────────────────────────────────────────

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

    WHEN 'deepshaft' THEN
      v_floats := _game_float_stream(p_server_seed, p_client_seed, p_nonce, 15);
      v_result := _deepshaft_evaluate(p_selection, v_floats);
      v_multiplier := (v_result->>'totalMultiplier')::NUMERIC;

    WHEN 'momentum' THEN
      v_floats := _game_float_stream(p_server_seed, p_client_seed, p_nonce, 1);
      v_result := _momentum_evaluate(p_selection, v_floats);
      v_multiplier := (v_result->>'totalMultiplier')::NUMERIC;

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
