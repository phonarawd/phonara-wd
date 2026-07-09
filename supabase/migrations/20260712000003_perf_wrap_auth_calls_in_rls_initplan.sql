-- Archived from remote migration 20260630065947 (name parity for local db reset)
-- Source: Supabase Management API (read-only audit closeout)

-- Fix auth_rls_initplan (perf lint 0003): wrap auth.<fn>()/current_setting() in a
-- scalar subselect so it is evaluated once per query instead of once per row.
-- Logic is identical; only evaluation count changes.

ALTER POLICY "users read own wagering" ON public.bonus_wagering_requirements
  USING (user_id = (select auth.uid()));

ALTER POLICY "notification_outbox: service insert" ON public.notification_outbox
  WITH CHECK ((select current_setting('role', true)) = 'service_role');
