-- Fix slot paytable JSONB array tier lookup in _slot_line_mult.

SET search_path = public, pg_temp;

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
  RETURN COALESCE(jsonb_array_element_text(p_paytable->v_base::TEXT, v_tier)::NUMERIC, 0);
END;
$$;

REVOKE ALL ON FUNCTION _slot_line_mult(INT[], JSONB) FROM PUBLIC, anon, authenticated;
