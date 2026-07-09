-- Guard coverage: Phase 2.5 admin ops read RPCs require AAL2 (20260714000001 gap).
SET search_path = public, pg_temp;

DO $mig$
DECLARE
  v_sigs TEXT[] := ARRAY[
    'public.rpc_admin_get_ops_dashboard()',
    'public.rpc_admin_list_exception_queue(text, integer)',
    'public.rpc_admin_list_alert_thresholds()'
  ];
  v_sig TEXT;
  v_def TEXT;
  v_new TEXT;
BEGIN
  FOREACH v_sig IN ARRAY v_sigs LOOP
    v_def := pg_get_functiondef(v_sig::regprocedure);
    v_def := replace(v_def, E'\r\n', E'\n');

    IF position('_assert_admin_aal2(' IN v_def) > 0 THEN
      CONTINUE;
    END IF;

    v_new := regexp_replace(
      v_def,
      '(  IF NOT _is_admin\(\) THEN RAISE EXCEPTION ''forbidden''; END IF;)',
      E'\\1\n  PERFORM _assert_admin_aal2();',
      ''
    );

    IF v_new = v_def THEN
      RAISE EXCEPTION 'admin ops AAL2 anchor not found in %', v_sig;
    END IF;

    EXECUTE v_new;
  END LOOP;
END
$mig$;
