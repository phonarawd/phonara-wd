-- Fix INT[][] reel strip extraction in _slot_spin_multiplier (p_reels[col][i] not p_reels[col]).

SET search_path = public, pg_temp;

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
  v_strip_len INT;
  v_sym INT;
  v_idx INT;
BEGIN
  IF p_lines < 1 OR p_lines > 20 THEN RAISE EXCEPTION 'invalid_slot_lines'; END IF;

  FOR v_col IN 1..5 LOOP
    v_strip_len := cardinality(p_reels[v_col]);
    v_stop := _slot_stop(
      ARRAY(SELECT (p_reels[v_col][i])::INT FROM generate_series(1, v_strip_len) AS i),
      _require_game_float(p_floats, v_col)
    );
    v_stops := array_append(v_stops, v_stop);
    v_idx := 1 + ((v_stop + 0) % v_strip_len);
    v_row0 := array_append(v_row0, (p_reels[v_col][v_idx])::INT);
    v_idx := 1 + ((v_stop + 1) % v_strip_len);
    v_row1 := array_append(v_row1, (p_reels[v_col][v_idx])::INT);
    v_idx := 1 + ((v_stop + 2) % v_strip_len);
    v_row2 := array_append(v_row2, (p_reels[v_col][v_idx])::INT);
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
