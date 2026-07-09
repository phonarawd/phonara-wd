-- ============================================================
-- Migration: 20260712000004_internal_helper_anon_execute_revoke
-- Audit Fix Queue 3 — revoke anon/PUBLIC EXECUTE on formatting helpers
-- that are only invoked from SECURITY DEFINER RPC bodies (not client API).
-- ============================================================

SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public._fmt6(numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._sports_odds_exact_match(text, text) FROM PUBLIC, anon;
