-- ============================================================
-- Game-day gap patch: halt + AAL2 guard symmetry
-- ============================================================
-- Gap 1: rpc_approve_withdrawal — inject _assert_system_live() on approve
--        path only (reject remains live during halt; see 000063).
-- Gap 2: rpc_set_feature_enabled — re-inject _assert_admin_aal2() after
--        000099 CREATE OR REPLACE wiped migration 000084 injection.
-- Scope: guard PERFORM calls only — no money/ledger/settlement body changes.
-- ============================================================

SET search_path = public, pg_temp;

-- ── Gap 1: rpc_approve_withdrawal — system_live before feature guard ─────────
DO $$
DECLARE
  v_def TEXT;
  v_new TEXT;
BEGIN
  v_def := pg_get_functiondef('public.rpc_approve_withdrawal(uuid,text)'::regprocedure);

  IF position('_assert_system_live(' IN v_def) > 0 THEN
    RETURN;
  END IF;

  v_new := replace(
    v_def,
    'PERFORM _assert_feature_enabled(''withdrawal'');',
    E'PERFORM _assert_system_live();\n  PERFORM _assert_feature_enabled(''withdrawal'');'
  );

  IF v_new = v_def THEN
    RAISE EXCEPTION 'rpc_approve_withdrawal system_live anchor (_assert_feature_enabled) not found';
  END IF;

  EXECUTE v_new;
END;
$$;

-- ── Gap 2: rpc_set_feature_enabled — admin AAL2 after _is_admin() ────────────
DO $mig$
DECLARE
  v_def TEXT;
  v_new TEXT;
  v_try TEXT;
  v_pat TEXT;
  v_patterns TEXT[] := ARRAY[
    '(  IF NOT _is_admin\(\) THEN RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)''; END IF;)',
    '(  IF NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)'';\s+END IF;)'
  ];
BEGIN
  v_def := pg_get_functiondef('public.rpc_set_feature_enabled(text,boolean,text)'::regprocedure);

  IF position('_assert_admin_aal2(' IN v_def) > 0 THEN
    RETURN;
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
    RAISE EXCEPTION 'rpc_set_feature_enabled admin MFA aal2 anchor not found';
  END IF;

  EXECUTE v_new;
END
$mig$;
