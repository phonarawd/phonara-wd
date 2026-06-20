-- ============================================================
-- Migration: 20260620000135_assert_amount_text_positive
-- ============================================================
-- P0 #1 money-path input guard: reject zero and non-positive amounts
-- at the canonical text guard. Format regex alone allowed p_amount='0'
-- through rpc_request_withdrawal (queue spam / empty withdrawal rows).
-- Only _assert_amount_text body changes; no money-path core logic touched.
-- ============================================================

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _assert_amount_text(p_value TEXT)
RETURNS VOID
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_value IS NULL OR p_value !~ '^\d+(\.\d+)?$' THEN
    RAISE EXCEPTION 'invalid_amount' USING HINT = COALESCE(p_value, 'null');
  END IF;
  IF p_value::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_amount_text(TEXT) FROM PUBLIC, anon, authenticated;
