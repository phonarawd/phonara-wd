-- Archived from remote migration 20260630065624 (name parity for local db reset)
-- Source: Supabase Management API (read-only audit closeout)

-- Harden anon-executable SECURITY DEFINER functions flagged by Supabase security advisor.
-- Revoke EXECUTE from anon (and PUBLIC, to be safe) on internal/auth-gated functions.
-- NOTE: intentionally PUBLIC functions are NOT touched:
--   rpc_get_golden_earth_status (returns global stats to logged-out users by design)
--   rpc_list_cms_content       (returns only status='published' marketing content)

-- _is_admin(): admin-check helper. anon always gets false; no reason to expose via REST.
REVOKE EXECUTE ON FUNCTION public._is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public._is_admin() FROM PUBLIC;

-- rpc_get_compliance_status(): raises 'unauthenticated' when auth.uid() is NULL,
-- so anon can never use it; remove the dead exposure.
REVOKE EXECUTE ON FUNCTION public.rpc_get_compliance_status() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rpc_get_compliance_status() FROM PUBLIC;
