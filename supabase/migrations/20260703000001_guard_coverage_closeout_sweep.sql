-- ============================================================
-- Migration: 20260703000001_guard_coverage_closeout_sweep
-- Re-inject guard-coverage gaps wiped by later CREATE OR REPLACE.
-- Scope: PERFORM guard lines only — no money/ledger/settlement body changes.
-- Patterns: 20260620000139 (AAL2 + system_live sweep) · 20260609000019 (feature after system_live)
-- Siblings: rpc_admin_list_cms_content · rpc_stake · rpc_request_withdrawal
-- ============================================================

SET search_path = public, pg_temp;

-- ── AAL2 sweep: read-only admin list RPCs (rpc_admin_list_cms_content pattern) ─
DO $mig$
DECLARE
  v_sigs TEXT[] := ARRAY[
    'public.rpc_admin_list_role_grants()',
    'public.rpc_admin_list_mfa_policy()',
    'public.rpc_admin_list_staking_pools()'
  ];
  v_sig TEXT;
  v_def TEXT;
  v_new TEXT;
  v_try TEXT;
  v_pat TEXT;
  v_patterns TEXT[] := ARRAY[
    '(  IF auth\.uid\(\) IS NULL OR NOT _is_admin\(\) THEN RAISE EXCEPTION ''FORBIDDEN''; END IF;)',
    '(  IF auth\.uid\(\) IS NULL OR NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''FORBIDDEN'';\s+END IF;)',
    '(  IF auth\.uid\(\) IS NULL OR NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)'';\s+END IF;)'
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

-- ── Staking balance RPCs: rpc_stake guard order (auth → system_live → rate_limit → feature) ─
DO $mig$
DECLARE
  v_rec RECORD;
  v_def TEXT;
  v_new TEXT;
BEGIN
  FOR v_rec IN
    SELECT *
    FROM (
      VALUES
        (
          'public.rpc_claim_staking_reward(uuid)'::TEXT,
          'rpc_claim_staking_reward'
        ),
        (
          'public.rpc_unstake_phon(uuid)'::TEXT,
          'rpc_unstake_phon'
        )
    ) AS t(sig, rate_key)
  LOOP
    v_def := pg_get_functiondef(v_rec.sig::regprocedure);
    v_def := replace(v_def, E'\r\n', E'\n');

    IF position('_assert_system_live(' IN v_def) > 0
       AND position('_assert_feature_enabled(' IN v_def) > 0 THEN
      CONTINUE;
    END IF;

    v_new := regexp_replace(
      v_def,
      'IF v_user_id IS NULL THEN RAISE EXCEPTION ''UNAUTHENTICATED''; END IF;',
      'IF v_user_id IS NULL THEN RAISE EXCEPTION ''UNAUTHENTICATED''; END IF;' || E'\n  PERFORM _assert_system_live();',
      ''
    );

    IF v_new = v_def THEN
      RAISE EXCEPTION 'staking auth anchor not found in %', v_rec.sig;
    END IF;

    v_def := v_new;
    v_new := regexp_replace(
      v_def,
      'PERFORM _enforce_rate_limit\(v_user_id, ''' || v_rec.rate_key || '''\);',
      'PERFORM _enforce_rate_limit(v_user_id, ''' || v_rec.rate_key || ''');' || E'\n  PERFORM _assert_feature_enabled(''staking'');',
      ''
    );

    IF v_new = v_def THEN
      RAISE EXCEPTION 'staking rate_limit anchor not found in %', v_rec.sig;
    END IF;

    EXECUTE v_new;
  END LOOP;
END
$mig$;

-- ── rpc_lock_wallet: rpc_request_withdrawal guard order (auth → system_live → feature) ─
DO $mig$
DECLARE
  v_sig TEXT := 'public.rpc_lock_wallet(currency, text, text, text, uuid)';
  v_def TEXT;
  v_new TEXT;
BEGIN
  v_def := pg_get_functiondef(v_sig::regprocedure);
  v_def := replace(v_def, E'\r\n', E'\n');

  IF position('_assert_system_live(' IN v_def) > 0
     AND position('_assert_feature_enabled(' IN v_def) > 0 THEN
    RETURN;
  END IF;

  v_new := regexp_replace(
    v_def,
    'IF v_user_id IS NULL THEN RAISE EXCEPTION ''unauthenticated''; END IF;',
    'IF v_user_id IS NULL THEN RAISE EXCEPTION ''unauthenticated''; END IF;' || E'\n  PERFORM _assert_system_live();' || E'\n  PERFORM _assert_feature_enabled(''withdrawal'');',
    ''
  );

  IF v_new = v_def THEN
    RAISE EXCEPTION 'lock_wallet auth anchor not found in %', v_sig;
  END IF;

  EXECUTE v_new;
END
$mig$;
