-- Step 5 admin RPCs — inject _assert_admin_aal2() (guard-coverage strict gate)

SET search_path = public, pg_temp;

DO $mig$
DECLARE
  v_sigs TEXT[] := ARRAY[
    'public.rpc_admin_list_casino_catalog()',
    'public.rpc_admin_settle_sports_fixture_quorum(uuid, integer, integer, text, boolean)'
  ];
  v_sig TEXT;
  v_def TEXT;
  v_new TEXT;
  v_try TEXT;
  v_pat TEXT;
  v_patterns TEXT[] := ARRAY[
    '(  IF NOT _is_admin\(\) THEN RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)''; END IF;)',
    '(  IF NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)'';\s+END IF;)',
    '(  IF auth\.uid\(\) IS NULL OR NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)'';\s+END IF;)',
    '(  IF auth\.uid\(\) IS NOT NULL AND NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)'';\s+END IF;)',
    '(  IF auth\.uid\(\) IS NULL OR NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''FORBIDDEN'';\s+END IF;)'
  ];
BEGIN
  FOREACH v_sig IN ARRAY v_sigs LOOP
    v_def := pg_get_functiondef(v_sig::regprocedure);
    v_def := replace(v_def, E'\r\n', E'\n');

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
      RAISE EXCEPTION 'admin MFA aal2 anchor not found in %', v_sig;
    END IF;

    EXECUTE v_new;
  END LOOP;
END
$mig$;
