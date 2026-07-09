-- ============================================================
-- Migration: 20260712000005_fix_is_admin_anon_rls_execute_grant
-- Restore anon EXECUTE on _is_admin() for RLS policy evaluation.
-- 20260712000001 revoked anon/PUBLIC; anon SET ROLE SELECT on app_config
-- (and similar) fails with "permission denied for function _is_admin".
-- SECURITY DEFINER _is_admin() returns false for anon — safe for REST too.
-- ============================================================

SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public._is_admin() TO anon;
