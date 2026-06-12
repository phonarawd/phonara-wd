-- ============================================================
-- Migration: 20260613000084_admin_mfa_aal2_guard
-- Admin interactive RPCs require MFA (JWT aal = aal2).
-- ============================================================
-- Service-role / cron paths (auth.uid() IS NULL) are unchanged.
-- rpc_liquidate_position is excluded: non-admin users may liquidate
-- their own positions and must not be subject to admin MFA.
-- ============================================================

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _assert_admin_aal2()
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF auth.jwt()->>'aal' IS DISTINCT FROM 'aal2' THEN
      RAISE EXCEPTION 'ERR_MFA_REQUIRED';
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_admin_aal2() FROM PUBLIC, anon, authenticated;

-- Inject PERFORM _assert_admin_aal2() immediately after each rpc_* admin guard
-- that references _is_admin(). Uses live pg_get_functiondef text so money/ledger
-- bodies are not rewritten. Idempotent; fails loudly if anchor missing.
DO $mig$
DECLARE
  v_rec RECORD;
  v_def TEXT;
  v_new TEXT;
  v_try TEXT;
  v_pat TEXT;
  v_patterns TEXT[] := ARRAY[
    -- single-line IF NOT _is_admin()
    '(  IF NOT _is_admin\(\) THEN RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)''; END IF;)',
    -- multi-line IF NOT _is_admin()
    '(  IF NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)'';\s+END IF;)',
    -- single-line auth.uid() AND NOT _is_admin()
    '(  IF auth\.uid\(\) IS NOT NULL AND NOT _is_admin\(\) THEN RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)''; END IF;)',
    -- multi-line auth.uid() AND NOT _is_admin()
    '(  IF auth\.uid\(\) IS NOT NULL AND NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)'';\s+END IF;)',
    -- multi-line v_actor_id AND NOT _is_admin()
    '(  IF v_actor_id IS NOT NULL AND NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''forbidden'';\s+END IF;)',
    -- multi-line auth.role() OR authenticated non-admin
    '(  IF auth\.role\(\) = ''anon'' OR \(auth\.role\(\) = ''authenticated'' AND NOT _is_admin\(\)\) THEN\s+RAISE EXCEPTION ''forbidden'';\s+END IF;)'
  ];
BEGIN
  FOR v_rec IN
    SELECT
      p.oid,
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname LIKE 'rpc\_%'
      AND p.proname <> 'rpc_liquidate_position'
      AND pg_get_functiondef(p.oid) LIKE '%\_is\_admin()%'
  LOOP
    v_def := pg_get_functiondef(v_rec.oid);

    IF position('_assert_admin_aal2(' IN v_def) > 0 THEN
      CONTINUE;
    END IF;

    v_new := v_def;
    FOREACH v_pat IN ARRAY v_patterns LOOP
      v_try := regexp_replace(
        v_new,
        v_pat,
        E'\\1\n  PERFORM _assert_admin_aal2();',
        ''
      );
      IF v_try <> v_new THEN
        v_new := v_try;
        EXIT;
      END IF;
    END LOOP;

    IF v_new = v_def THEN
      RAISE EXCEPTION 'admin MFA aal2 anchor not found in %(%)', v_rec.proname, v_rec.args;
    END IF;

    EXECUTE v_new;
  END LOOP;
END
$mig$;
