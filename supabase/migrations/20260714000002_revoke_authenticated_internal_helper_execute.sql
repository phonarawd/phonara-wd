-- ============================================================
-- Migration: 20260714000002_revoke_authenticated_internal_helper_execute
-- Close security_definer_inventory drift: internal `_` helpers must not
-- be PostgREST-callable by authenticated (definer RPC bodies only).
-- Extends 20260712000004 (anon revoke) to authenticated.
-- ============================================================

SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public._fmt6(numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._sports_odds_exact_match(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._guard_funding_rates_nonzero() FROM PUBLIC, anon, authenticated;
