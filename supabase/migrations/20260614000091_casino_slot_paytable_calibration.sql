-- Calibrate slot paytables/reels for sub-100% RTP (matches TS engine constants).

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _mint_reels_paytable()
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT '{"0":[1,2,5],"1":[1,3,6],"2":[2,4,8],"3":[2,5,10],"4":[3,8,15],"5":[4,10,25],"6":[10,30,75]}'::JSONB;
$$;

CREATE OR REPLACE FUNCTION _mint_reels_reels()
RETURNS INT[][]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY[
    ARRAY[0,0,1,1,2,2,3,3,4,4,5,5,6,0,1,2,3,4,5,7],
    ARRAY[0,1,1,2,2,3,3,4,4,5,5,6,0,1,2,3,4,5,6,7],
    ARRAY[0,0,1,2,2,3,3,4,4,5,5,6,1,2,3,4,5,6,0,7],
    ARRAY[0,1,1,2,3,3,4,4,5,5,6,0,1,2,3,4,5,6,2,7],
    ARRAY[0,0,1,1,2,3,3,4,5,5,6,0,1,2,3,4,5,6,4,7]
  ]::INT[][];
$$;

CREATE OR REPLACE FUNCTION _gold_rush_paytable()
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT '{"0":[1,2,4],"1":[1,3,5],"2":[2,4,7],"3":[2,5,9],"4":[3,7,14],"5":[4,9,20],"6":[12,35,80]}'::JSONB;
$$;

CREATE OR REPLACE FUNCTION _gold_rush_reels()
RETURNS INT[][]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY[
    ARRAY[0,0,1,1,2,2,3,4,4,5,5,6,0,1,2,3,4,5,6,7],
    ARRAY[0,1,1,2,2,3,3,4,5,5,6,0,1,2,3,4,5,6,0,7],
    ARRAY[0,0,1,2,2,3,4,4,5,5,6,1,2,3,4,5,6,0,1,7],
    ARRAY[0,1,2,2,3,3,4,5,5,6,0,1,2,3,4,5,6,0,1,7],
    ARRAY[0,0,1,1,2,3,3,4,5,6,0,1,2,3,4,5,6,2,3,7]
  ]::INT[][];
$$;

-- Patch exposure caps for calibrated jackpots (75 / 80 max line mult).
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
    ELSE
      RAISE EXCEPTION 'invalid_game_code';
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION _game_max_payout_multiplier(game_code, JSONB) FROM PUBLIC, anon, authenticated;
