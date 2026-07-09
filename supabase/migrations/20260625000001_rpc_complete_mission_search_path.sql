-- Pin search_path on legacy rpc_complete_mission (SECURITY DEFINER hardening).
-- Sealed from anon/authenticated in 20260609000025; service_role internal path only.

ALTER FUNCTION public.rpc_complete_mission(text)
  SET search_path = public, pg_temp;
