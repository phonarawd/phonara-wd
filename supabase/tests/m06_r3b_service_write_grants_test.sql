-- ============================================================
-- M-06 / R3-b — service-write GRANT minimize · trigger/helper revoke
-- Platform audit: audit-r3b-service-write-grants
-- ============================================================

BEGIN;

DO $$
DECLARE
  r RECORD;
  v_auth_writes TEXT := '';
  v_anon_writes TEXT := '';
  v_trigger_leak TEXT := '';
  v_defacl_leak TEXT := '';
  v_acl TEXT;
BEGIN
  -- ── 1. Client direct writes allowlisted only ───────────────────────────────
  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND (
        has_table_privilege('anon', c.oid, 'INSERT')
        OR has_table_privilege('anon', c.oid, 'UPDATE')
        OR has_table_privilege('anon', c.oid, 'DELETE')
        OR has_table_privilege('anon', c.oid, 'TRUNCATE')
        OR has_table_privilege('anon', c.oid, 'TRIGGER')
        OR has_table_privilege('anon', c.oid, 'REFERENCES')
      )
    ORDER BY c.relname
  LOOP
    v_anon_writes := v_anon_writes || ' ' || r.tbl;
  END LOOP;

  ASSERT v_anon_writes = '',
    format('anon must not have direct table write grants (M-06):%s', v_anon_writes);

  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname NOT IN ('profiles', 'push_subscriptions')
      AND (
        has_table_privilege('authenticated', c.oid, 'INSERT')
        OR has_table_privilege('authenticated', c.oid, 'UPDATE')
        OR has_table_privilege('authenticated', c.oid, 'DELETE')
        OR has_table_privilege('authenticated', c.oid, 'TRUNCATE')
        OR has_table_privilege('authenticated', c.oid, 'TRIGGER')
        OR has_table_privilege('authenticated', c.oid, 'REFERENCES')
      )
    ORDER BY c.relname
  LOOP
    v_auth_writes := v_auth_writes || ' ' || r.tbl;
  END LOOP;

  ASSERT v_auth_writes = '',
    format(
      'authenticated direct table writes must be allowlisted only (M-06):%s',
      v_auth_writes
    );

  ASSERT has_table_privilege('authenticated', 'public.profiles', 'UPDATE'),
    'authenticated may UPDATE profiles (allowlist)';
  ASSERT NOT has_table_privilege('authenticated', 'public.profiles', 'INSERT'),
    'authenticated must NOT INSERT profiles';
  ASSERT has_table_privilege('authenticated', 'public.push_subscriptions', 'INSERT')
     AND has_table_privilege('authenticated', 'public.push_subscriptions', 'UPDATE')
     AND has_table_privilege('authenticated', 'public.push_subscriptions', 'DELETE'),
    'authenticated may manage push_subscriptions (allowlist)';

  ASSERT has_table_privilege('service_role', 'public.live_crash_rounds', 'INSERT'),
    'service_role must retain INSERT on service-write live_crash_rounds';
  ASSERT has_table_privilege('service_role', 'public.wallets', 'UPDATE'),
    'service_role must retain UPDATE on wallets';

  -- ── 2. Trigger functions not PostgREST-callable ────────────────────────────
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prorettype = 'trigger'::regtype
      AND (
        has_function_privilege('anon', p.oid, 'EXECUTE')
        OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
      )
    ORDER BY p.proname
  LOOP
    v_trigger_leak := v_trigger_leak || ' ' || r.sig::TEXT;
  END LOOP;

  ASSERT v_trigger_leak = '',
    format('trigger functions must not be executable by clients (M-06):%s', v_trigger_leak);

  ASSERT NOT has_function_privilege(
    'anon', 'public._earn_vip_preserve_prime_elite()', 'EXECUTE'
  ), 'anon must NOT EXECUTE _earn_vip_preserve_prime_elite';
  ASSERT NOT has_function_privilege(
    'authenticated', 'public._earn_vip_preserve_prime_elite()', 'EXECUTE'
  ), 'authenticated must NOT EXECUTE _earn_vip_preserve_prime_elite';
  ASSERT NOT has_function_privilege(
    'anon', 'public.set_updated_at()', 'EXECUTE'
  ), 'anon must NOT EXECUTE set_updated_at';
  ASSERT NOT has_function_privilege(
    'authenticated', 'public.set_updated_at()', 'EXECUTE'
  ), 'authenticated must NOT EXECUTE set_updated_at';

  -- ── 3. DEFAULT PRIVILEGES (postgres creator) — no auto client ALL/EXECUTE ──
  -- Hosted Supabase blocks ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin
  -- from migration postgres (42501). Pin the enforceable postgres defaults only.
  FOR r IN
    SELECT
      defaclrole::regrole::TEXT AS grantor,
      CASE defaclobjtype
        WHEN 'r' THEN 'table'
        WHEN 'S' THEN 'sequence'
        WHEN 'f' THEN 'function'
        ELSE defaclobjtype::TEXT
      END AS objtype,
      defaclacl::TEXT AS acl
    FROM pg_default_acl
    WHERE defaclnamespace = 'public'::regnamespace
      AND defaclrole = 'postgres'::regrole
  LOOP
    v_acl := COALESCE(r.acl, '');
    IF r.objtype IN ('table', 'sequence') THEN
      IF v_acl ~ 'anon=[^/]*[awdDxt]' OR v_acl ~ 'authenticated=[^/]*[awdDxt]' THEN
        v_defacl_leak := v_defacl_leak || format(' %s/%s=%s', r.grantor, r.objtype, v_acl);
      END IF;
      IF v_acl ~ '(^|[{,])=[^/]*[awdDxt]' THEN
        v_defacl_leak := v_defacl_leak || format(' %s/%s=PUBLIC:%s', r.grantor, r.objtype, v_acl);
      END IF;
    ELSIF r.objtype = 'function' THEN
      IF v_acl ~ 'anon=X' OR v_acl ~ 'authenticated=X' OR v_acl ~ '(^|[{,])=X/' THEN
        v_defacl_leak := v_defacl_leak || format(' %s/function=%s', r.grantor, v_acl);
      END IF;
    END IF;
  END LOOP;

  ASSERT v_defacl_leak = '',
    format(
      'postgres public DEFAULT PRIVILEGES must not auto-grant client write/execute (M-06):%s',
      v_defacl_leak
    );

  RAISE NOTICE 'M-06 R3-b OK — client writes allowlisted · triggers revoked · default privileges minimized';
END;
$$;

ROLLBACK;
