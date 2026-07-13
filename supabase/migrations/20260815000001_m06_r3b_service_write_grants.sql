-- M-06 / Platform audit R3-b (audit-r3b-service-write-grants)
-- 1) Minimize client DML base GRANTs on service-write tables (SELECT remain;
--    intentional writes only: profiles UPDATE · push_subscriptions CRUD).
-- 2) Revoke PostgREST-callable trigger/helper EXECUTE from PUBLIC/anon/authenticated.
-- 3) Stop recurrence: public DEFAULT PRIVILEGES no longer auto-grant ALL/EXECUTE
--    to anon/authenticated (new objects must GRANT explicitly).

SET search_path = public, pg_temp;

-- ─── 1. Client table write surface — allowlist only ───────────────────────────

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA public
  FROM PUBLIC, anon, authenticated;

-- Intentional direct client writes (RLS still constrains rows).
GRANT UPDATE ON TABLE public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.push_subscriptions TO authenticated;

-- Service automation owner remains full-access.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- ─── 2. Trigger functions — never client-callable via PostgREST ──────────────

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prorettype = 'trigger'::regtype
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated',
      r.sig
    );
  END LOOP;
END;
$$;

-- Explicit pin for known SECURITY DEFINER trigger leak (E4 tier preserve).
REVOKE ALL ON FUNCTION public._earn_vip_preserve_prime_elite()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._earn_vip_preserve_prime_elite() TO service_role;

-- ─── 3. DEFAULT PRIVILEGES — no auto client ALL/EXECUTE on new objects ───────
-- Supabase creators historically defaulted public tables/functions to
-- anon+authenticated ALL/EXECUTE. Future CREATE TABLE/FUNCTION must GRANT
-- explicitly (matching grants_rls_inventory allowlist discipline).

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO service_role;

-- supabase_admin default privileges are owned by the platform role and cannot
-- be altered by migration postgres on hosted Supabase (42501). Migration DDL
-- in this repo is applied as postgres, so postgres defaults are the recurrence
-- control we can enforce here.

