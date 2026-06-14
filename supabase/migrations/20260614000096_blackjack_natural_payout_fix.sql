-- Blackjack payout: natural BJ beats dealer 21 with 3+ cards (match TS isBlackjack flag).

SET search_path = public, pg_temp;

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
  v_player_bj BOOLEAN;
  v_dealer_bj BOOLEAN;
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

  WHILE _bj_hand_value(v_dealer) < 17 LOOP
    v_dealer := array_append(v_dealer, v_deck[v_idx]); v_idx := v_idx + 1;
  END LOOP;

  v_pv := _bj_hand_value(v_player);
  v_dv := _bj_hand_value(v_dealer);
  v_player_bj := cardinality(v_player) = 2 AND v_pv = 21;
  v_dealer_bj := cardinality(v_dealer) = 2 AND v_dv = 21;

  IF v_pv > 21 THEN RETURN 0; END IF;
  IF v_player_bj AND NOT v_dealer_bj THEN RETURN 2.5; END IF;
  IF v_dealer_bj AND NOT v_player_bj THEN RETURN 0; END IF;
  IF v_dv > 21 THEN RETURN 2; END IF;
  IF v_pv > v_dv THEN RETURN 2; END IF;
  IF v_pv = v_dv THEN RETURN 1; END IF;
  RETURN 0;
END;
$$;

REVOKE ALL ON FUNCTION _bj_play(JSONB, DOUBLE PRECISION[]) FROM PUBLIC, anon, authenticated;
