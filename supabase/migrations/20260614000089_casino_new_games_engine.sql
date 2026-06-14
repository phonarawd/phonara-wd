-- ============================================================
-- New casino games: mint_reels, gold_rush, roulette, blackjack
-- Extends _game_result / _game_max_payout_multiplier + feature flags.
-- Enum values added in 20260614000088_game_code_enum_new_games.sql
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Slot helpers (3×5, 20 paylines) ───────────────────────────────────────

CREATE OR REPLACE FUNCTION _slot_stop(p_strip INT[], p_f DOUBLE PRECISION)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT floor(p_f * cardinality(p_strip))::INT;
$$;

REVOKE ALL ON FUNCTION _slot_stop(INT[], DOUBLE PRECISION) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _slot_line_mult(
  p_symbols INT[],
  p_paytable JSONB
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_base INT := NULL;
  v_sym INT;
  v_count INT := 0;
  v_tier INT;
BEGIN
  FOREACH v_sym IN ARRAY p_symbols LOOP
    IF v_sym <> 7 THEN v_base := v_sym; EXIT; END IF;
  END LOOP;
  IF v_base IS NULL THEN RETURN 0; END IF;

  FOREACH v_sym IN ARRAY p_symbols LOOP
    IF v_sym = v_base OR v_sym = 7 THEN v_count := v_count + 1;
    ELSE EXIT;
    END IF;
  END LOOP;

  IF v_count < 3 THEN RETURN 0; END IF;
  v_tier := v_count - 3;
  RETURN COALESCE((p_paytable->v_base::TEXT->>v_tier)::NUMERIC, 0);
END;
$$;

REVOKE ALL ON FUNCTION _slot_line_mult(INT[], JSONB) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _slot_spin_multiplier(
  p_reels INT[][],
  p_paytable JSONB,
  p_lines INT,
  p_floats DOUBLE PRECISION[]
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_paylines INT[][] := ARRAY[
    ARRAY[1,1,1,1,1], ARRAY[0,0,0,0,0], ARRAY[2,2,2,2,2], ARRAY[0,1,2,1,0], ARRAY[2,1,0,1,2],
    ARRAY[0,0,1,0,0], ARRAY[2,2,1,2,2], ARRAY[1,0,0,0,1], ARRAY[1,2,2,2,1], ARRAY[0,1,1,1,0],
    ARRAY[2,1,1,1,2], ARRAY[1,1,0,1,1], ARRAY[1,1,2,1,1], ARRAY[0,1,0,1,0], ARRAY[2,1,2,1,2],
    ARRAY[1,0,1,0,1], ARRAY[1,2,1,2,1], ARRAY[0,0,2,0,0], ARRAY[2,2,0,2,2], ARRAY[0,2,2,2,0]
  ];
  v_stops INT[] := ARRAY[]::INT[];
  v_row0 INT[] := ARRAY[]::INT[];
  v_row1 INT[] := ARRAY[]::INT[];
  v_row2 INT[] := ARRAY[]::INT[];
  v_total NUMERIC := 0;
  v_li INT;
  v_col INT;
  v_row INT;
  v_symbols INT[];
  v_stop INT;
  v_strip INT[];
  v_sym INT;
BEGIN
  IF p_lines < 1 OR p_lines > 20 THEN RAISE EXCEPTION 'invalid_slot_lines'; END IF;

  FOR v_col IN 1..5 LOOP
    v_strip := p_reels[v_col];
    v_stop := _slot_stop(v_strip, _require_game_float(p_floats, v_col));
    v_stops := array_append(v_stops, v_stop);
    v_sym := v_strip[1 + ((v_stop + 0) % cardinality(v_strip))];
    v_row0 := array_append(v_row0, v_sym);
    v_sym := v_strip[1 + ((v_stop + 1) % cardinality(v_strip))];
    v_row1 := array_append(v_row1, v_sym);
    v_sym := v_strip[1 + ((v_stop + 2) % cardinality(v_strip))];
    v_row2 := array_append(v_row2, v_sym);
  END LOOP;

  FOR v_li IN 1..p_lines LOOP
    v_symbols := ARRAY[]::INT[];
    FOR v_col IN 1..5 LOOP
      v_row := v_paylines[v_li][v_col];
      v_sym := CASE v_row WHEN 0 THEN v_row0[v_col] WHEN 1 THEN v_row1[v_col] ELSE v_row2[v_col] END;
      v_symbols := array_append(v_symbols, v_sym);
    END LOOP;
    v_total := v_total + _slot_line_mult(v_symbols, p_paytable);
  END LOOP;

  RETURN v_total / p_lines;
END;
$$;

REVOKE ALL ON FUNCTION _slot_spin_multiplier(INT[][], JSONB, INT, DOUBLE PRECISION[]) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _mint_reels_paytable()
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT '{"0":[5,15,40],"1":[5,20,50],"2":[8,25,75],"3":[10,40,100],"4":[15,60,150],"5":[20,100,250],"6":[50,200,500]}'::JSONB;
$$;

REVOKE ALL ON FUNCTION _mint_reels_paytable() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _mint_reels_reels()
RETURNS INT[][]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY[
    ARRAY[0,1,2,3,4,5,6,0,1,2,3,4,5,6,7,0,1,2,3,4],
    ARRAY[1,2,3,4,5,6,0,1,2,3,4,5,6,7,1,2,3,4,5,6],
    ARRAY[2,3,4,5,6,0,1,2,3,4,5,6,7,2,3,4,5,6,0,1],
    ARRAY[3,4,5,6,0,1,2,3,4,5,6,7,3,4,5,6,0,1,2,3],
    ARRAY[4,5,6,0,1,2,3,4,5,6,7,4,5,6,0,1,2,3,4,5]
  ]::INT[][];
$$;

REVOKE ALL ON FUNCTION _mint_reels_reels() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _gold_rush_paytable()
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT '{"0":[4,12,35],"1":[6,18,45],"2":[10,30,80],"3":[12,45,120],"4":[18,70,180],"5":[25,120,300],"6":[60,250,600]}'::JSONB;
$$;

REVOKE ALL ON FUNCTION _gold_rush_paytable() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _gold_rush_reels()
RETURNS INT[][]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY[
    ARRAY[6,5,4,3,2,1,0,6,5,4,3,2,1,0,7,6,5,4,3,2],
    ARRAY[5,6,4,3,2,1,0,5,6,4,3,2,1,0,7,5,6,4,3,2],
    ARRAY[4,5,6,3,2,1,0,4,5,6,3,2,1,0,7,4,5,6,3,2],
    ARRAY[3,4,5,6,2,1,0,3,4,5,6,2,1,0,7,3,4,5,6,2],
    ARRAY[2,3,4,5,6,1,0,2,3,4,5,6,1,0,7,2,3,4,5,6]
  ]::INT[][];
$$;

REVOKE ALL ON FUNCTION _gold_rush_reels() FROM PUBLIC, anon, authenticated;

-- ─── Roulette helpers ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _roulette_leg_max_mult(p_type TEXT)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_type
    WHEN 'straight' THEN 36 WHEN 'split' THEN 18
    WHEN 'red' THEN 2 WHEN 'black' THEN 2 WHEN 'even' THEN 2 WHEN 'odd' THEN 2
    WHEN 'low' THEN 2 WHEN 'high' THEN 2
    WHEN 'dozen1' THEN 3 WHEN 'dozen2' THEN 3 WHEN 'dozen3' THEN 3
    WHEN 'column1' THEN 3 WHEN 'column2' THEN 3 WHEN 'column3' THEN 3
    ELSE 0 END;
$$;

REVOKE ALL ON FUNCTION _roulette_leg_max_mult(TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _roulette_leg_wins(p_type TEXT, p_value INT, p_winning INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_winning = 0 THEN RETURN p_type = 'straight' AND p_value = 0; END IF;
  CASE p_type
    WHEN 'straight' THEN RETURN p_value = p_winning;
    WHEN 'split' THEN RETURN p_value IS NOT NULL AND (p_value = p_winning OR p_value + 1 = p_winning);
    WHEN 'red' THEN RETURN p_winning IN (1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36);
    WHEN 'black' THEN RETURN p_winning NOT IN (0,1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36);
    WHEN 'even' THEN RETURN p_winning <> 0 AND p_winning % 2 = 0;
    WHEN 'odd' THEN RETURN p_winning % 2 = 1;
    WHEN 'low' THEN RETURN p_winning BETWEEN 1 AND 18;
    WHEN 'high' THEN RETURN p_winning BETWEEN 19 AND 36;
    WHEN 'dozen1' THEN RETURN p_winning BETWEEN 1 AND 12;
    WHEN 'dozen2' THEN RETURN p_winning BETWEEN 13 AND 24;
    WHEN 'dozen3' THEN RETURN p_winning BETWEEN 25 AND 36;
    WHEN 'column1' THEN RETURN p_winning IN (1,4,7,10,13,16,19,22,25,28,31,34);
    WHEN 'column2' THEN RETURN p_winning IN (2,5,8,11,14,17,20,23,26,29,32,35);
    WHEN 'column3' THEN RETURN p_winning IN (3,6,9,12,15,18,21,24,27,30,33,36);
    ELSE RETURN FALSE;
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION _roulette_leg_wins(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _roulette_evaluate(p_selection JSONB, p_winning INT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_leg JSONB;
  v_weight_sum NUMERIC := 0;
  v_total NUMERIC := 0;
  v_type TEXT;
  v_value INT;
  v_weight NUMERIC;
  v_won BOOLEAN;
BEGIN
  FOR v_leg IN SELECT jsonb_array_elements(p_selection->'bets') LOOP
    v_weight_sum := v_weight_sum + (v_leg->>'stakeWeight')::NUMERIC;
  END LOOP;
  IF v_weight_sum <= 0 THEN RAISE EXCEPTION 'invalid_roulette_bets'; END IF;

  FOR v_leg IN SELECT jsonb_array_elements(p_selection->'bets') LOOP
    v_type := v_leg->>'type';
    v_value := CASE WHEN v_leg->>'value' IS NULL OR v_leg->>'value' = 'null' THEN NULL
                    ELSE (v_leg->>'value')::INT END;
    v_weight := (v_leg->>'stakeWeight')::NUMERIC;
    v_won := _roulette_leg_wins(v_type, v_value, p_winning);
    IF v_won THEN
      v_total := v_total + _roulette_leg_max_mult(v_type) * v_weight / v_weight_sum;
    END IF;
  END LOOP;
  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION _roulette_evaluate(JSONB, INT) FROM PUBLIC, anon, authenticated;

-- ─── Blackjack helpers (single deck, S17) ───────────────────────────────────

CREATE OR REPLACE FUNCTION _bj_card_value(p_card INT)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN ((p_card - 1) % 13) + 1 >= 10 THEN 10 ELSE ((p_card - 1) % 13) + 1 END;
$$;

REVOKE ALL ON FUNCTION _bj_card_value(INT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _bj_hand_value(p_cards INT[])
RETURNS INT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_total INT := 0;
  v_aces INT := 0;
  v_c INT;
BEGIN
  FOREACH v_c IN ARRAY p_cards LOOP
    v_total := v_total + _bj_card_value(v_c);
    IF _bj_card_value(v_c) = 1 THEN v_aces := v_aces + 1; END IF;
  END LOOP;
  WHILE v_aces > 0 AND v_total + 10 <= 21 LOOP
    v_total := v_total + 10;
    v_aces := v_aces - 1;
  END LOOP;
  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION _bj_hand_value(INT[]) FROM PUBLIC, anon, authenticated;

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
    v_j := floor(_require_game_float(p_floats, 52 - v_i) * v_i)::INT + 1;
    v_tmp := v_deck[v_i];
    v_deck[v_i] := v_deck[v_j];
    v_deck[v_j] := v_tmp;
  END LOOP;
  RETURN v_deck;
END;
$$;

REVOKE ALL ON FUNCTION _bj_shuffle(DOUBLE PRECISION[]) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _bj_play(p_selection JSONB, p_floats DOUBLE PRECISION[])
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_deck INT[];
  v_idx INT := 1;
  v_player INT[];
  v_dealer INT[];
  v_action JSONB;
  v_move TEXT;
  v_pv INT;
  v_dv INT;
  v_is_bj BOOLEAN;
BEGIN
  v_deck := _bj_shuffle(p_floats);
  v_player := ARRAY[v_deck[1], v_deck[2]];
  v_dealer := ARRAY[v_deck[3], v_deck[4]];
  v_idx := 5;

  FOR v_action IN SELECT jsonb_array_elements(p_selection->'actions') LOOP
    v_move := v_action->>'move';
    IF v_move = 'stand' THEN NULL;
    ELSIF v_move = 'hit' THEN
      v_player := array_append(v_player, v_deck[v_idx]); v_idx := v_idx + 1;
    ELSIF v_move = 'double' THEN
      IF cardinality(v_player) <> 2 THEN RAISE EXCEPTION 'invalid_action'; END IF;
      v_player := array_append(v_player, v_deck[v_idx]); v_idx := v_idx + 1;
    ELSE
      RAISE EXCEPTION 'invalid_action';
    END IF;
  END LOOP;

  -- Dealer S17
  WHILE _bj_hand_value(v_dealer) <= 17 LOOP
    IF _bj_hand_value(v_dealer) = 17 THEN EXIT; END IF;
    v_dealer := array_append(v_dealer, v_deck[v_idx]); v_idx := v_idx + 1;
    IF _bj_hand_value(v_dealer) > 21 THEN EXIT; END IF;
  END LOOP;

  v_pv := _bj_hand_value(v_player);
  v_dv := _bj_hand_value(v_dealer);
  v_is_bj := cardinality(v_player) = 2 AND v_pv = 21;

  IF v_pv > 21 THEN RETURN 0; END IF;
  IF v_is_bj AND v_dv <> 21 THEN RETURN 2.5; END IF;
  IF v_dv > 21 THEN RETURN 2; END IF;
  IF v_pv > v_dv THEN RETURN 2; END IF;
  IF v_pv = v_dv THEN RETURN 1; END IF;
  RETURN 0;
END;
$$;

REVOKE ALL ON FUNCTION _bj_play(JSONB, DOUBLE PRECISION[]) FROM PUBLIC, anon, authenticated;

-- ─── Feature flags + exposure caps ───────────────────────────────────────────

INSERT INTO app_config (key, value, description) VALUES
  ('feature_game_mint_reels_enabled', 'true', 'Per-game kill switch for Mint Reels.'),
  ('feature_game_gold_rush_enabled', 'true', 'Per-game kill switch for Gold Rush.'),
  ('feature_game_roulette_enabled', 'true', 'Per-game kill switch for Casino Roulette (not Earn roulette).'),
  ('feature_game_blackjack_enabled', 'true', 'Per-game kill switch for Blackjack.'),
  ('casino_mint_reels_house_exposure_cap_phon', '999999999', 'Mint Reels max house exposure PHON.'),
  ('casino_mint_reels_house_exposure_cap_usdt', '999999999', 'Mint Reels max house exposure USDT.'),
  ('casino_gold_rush_house_exposure_cap_phon', '999999999', 'Gold Rush max house exposure PHON.'),
  ('casino_gold_rush_house_exposure_cap_usdt', '999999999', 'Gold Rush max house exposure USDT.'),
  ('casino_roulette_house_exposure_cap_phon', '999999999', 'Casino Roulette max house exposure PHON.'),
  ('casino_roulette_house_exposure_cap_usdt', '999999999', 'Casino Roulette max house exposure USDT.'),
  ('casino_blackjack_house_exposure_cap_phon', '999999999', 'Blackjack max house exposure PHON.'),
  ('casino_blackjack_house_exposure_cap_usdt', '999999999', 'Blackjack max house exposure USDT.')
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
      RETURN 500.0 / v_lines;
    WHEN 'gold_rush' THEN
      v_lines := (p_selection->>'lines')::INT;
      IF v_lines < 1 OR v_lines > 20 THEN RAISE EXCEPTION 'invalid_slot_lines'; END IF;
      RETURN 600.0 / v_lines;
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
    ELSE
      RAISE EXCEPTION 'invalid_game_code';
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION _game_max_payout_multiplier(game_code, JSONB) FROM PUBLIC, anon, authenticated;

-- ─── Extend _game_result ────────────────────────────────────────────────────

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
      v_floats := _game_float_stream(p_server_seed, p_client_seed, p_nonce, 52);
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
