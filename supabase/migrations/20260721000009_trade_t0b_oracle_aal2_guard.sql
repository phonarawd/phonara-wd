-- ============================================================
-- Migration: 20260721000009_trade_t0b_oracle_aal2_guard
-- Re-inject _assert_admin_aal2() into rpc_update_oracle_price after T0-b
-- CREATE OR REPLACE wiped the guard injected by prior sweeps.
-- Scope: guard line only — no oracle/circuit-breaker body changes.
-- ============================================================

SET search_path = public, pg_temp;

DO $mig$
DECLARE
  v_sig TEXT := 'public.rpc_update_oracle_price(text, text, text, text)';
  v_def TEXT;
  v_new TEXT;
  v_try TEXT;
  v_pat TEXT;
  v_patterns TEXT[] := ARRAY[
    '(  IF v_actor_id IS NOT NULL AND NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''forbidden'';\s+END IF;)',
    '(  IF v_actor_id IS NOT NULL AND NOT _is_admin\(\) THEN RAISE EXCEPTION ''forbidden''; END IF;)'
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
    RAISE EXCEPTION 'oracle admin anchor not found in %', v_sig;
  END IF;

  EXECUTE v_new;
END
$mig$;
