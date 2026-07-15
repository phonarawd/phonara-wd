-- ============================================================
-- Wave 4 (SEC-AAL2-01) — rpc_admin_list_sports_exposure AAL2 guard symmetry
-- ============================================================
-- Plan: 스포츠 무료 실배당 완결 로드맵 · sb-w4-sec-aal2-exposure
--
-- Sibling admin sports RPCs (rpc_admin_set_sports_risk_tier,
-- rpc_admin_suspend_sports_market, rpc_settle_sports_fixture, ...) already
-- require step-up MFA via `_assert_admin_aal2()`
-- (20260620000139_guard_symmetry_aal2_systemlive_sweep.sql). This admin
-- read RPC was missed — it only checks `_is_admin()`. Same idempotent
-- catalog-based injection technique as
-- 20260626000006_guard_aal2_step5_admin_rpcs.sql (acts on the live
-- pg_get_functiondef, not historical file text — safe regardless of which
-- migration last defined the function).
-- ============================================================

SET search_path = public, pg_temp;

DO $mig$
DECLARE
  v_sig  TEXT := 'public.rpc_admin_list_sports_exposure(text)';
  v_def  TEXT;
  v_new  TEXT;
  v_pat  TEXT;
  v_try  TEXT;
  v_patterns TEXT[] := ARRAY[
    '(  IF NOT _is_admin\(\) THEN RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)''; END IF;)',
    '(  IF NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)'';\s+END IF;)',
    '(  IF auth\.uid\(\) IS NULL OR NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)'';\s+END IF;)',
    '(  IF auth\.uid\(\) IS NOT NULL AND NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)'';\s+END IF;)'
  ];
BEGIN
  v_def := pg_get_functiondef(v_sig::regprocedure);
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
    RAISE EXCEPTION 'admin MFA aal2 anchor not found in %', v_sig;
  END IF;

  EXECUTE v_new;
END
$mig$;
