-- ============================================================
-- Guard symmetry: welcome bonus + KYC review
-- ============================================================
-- Gap 1: rpc_claim_welcome_bonus — re-inject _assert_system_live() after
--        20260624000001 CREATE OR REPLACE wiped 20260623000005 injection.
-- Gap 2: rpc_review_kyc_submission — inject _assert_admin_aal2() after
--        20260623000002 CREATE OR REPLACE (admin MFA on KYC approve/reject).
-- Scope: guard PERFORM calls only — no money/ledger/settlement body changes.
-- ============================================================

SET search_path = public, pg_temp;

-- ── Gap 1: rpc_claim_welcome_bonus — system_live after auth check ───────────
DO $$
DECLARE
  v_def TEXT;
  v_new TEXT;
BEGIN
  v_def := pg_get_functiondef('public.rpc_claim_welcome_bonus(text)'::regprocedure);
  v_def := replace(v_def, E'\r\n', E'\n');

  IF position('_assert_system_live(' IN v_def) > 0 THEN
    RETURN;
  END IF;

  v_new := replace(
    v_def,
    E'IF v_user_id IS NULL THEN RAISE EXCEPTION ''UNAUTHENTICATED''; END IF;',
    E'IF v_user_id IS NULL THEN RAISE EXCEPTION ''UNAUTHENTICATED''; END IF;\n\n  PERFORM _assert_system_live();'
  );

  IF v_new = v_def THEN
    RAISE EXCEPTION 'rpc_claim_welcome_bonus system_live anchor (UNAUTHENTICATED) not found';
  END IF;

  EXECUTE v_new;
END;
$$;

-- ── Gap 2: rpc_review_kyc_submission — admin AAL2 after _is_admin() ────────
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
  v_def := pg_get_functiondef(
    'public.rpc_review_kyc_submission(uuid, text, text)'::regprocedure
  );
  v_def := replace(v_def, E'\r\n', E'\n');

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
    RAISE EXCEPTION 'rpc_review_kyc_submission admin MFA aal2 anchor not found';
  END IF;

  EXECUTE v_new;
END
$mig$;
