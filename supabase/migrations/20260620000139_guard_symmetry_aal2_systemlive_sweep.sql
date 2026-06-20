-- ============================================================
-- Migration: 20260620000139_guard_symmetry_aal2_systemlive_sweep
-- Re-inject admin AAL2 + system_live guards wiped by later CREATE OR REPLACE.
-- Scope: guard PERFORM calls only — no money/ledger/settlement body changes.
-- ============================================================

SET search_path = public, pg_temp;

-- ── AAL2 sweep: mutate admin RPCs ───────────────────────────────────────────
DO $mig$
DECLARE
  v_sigs TEXT[] := ARRAY[
    'public.rpc_check_casino_rtp_drift()',
    'public.rpc_admin_match_crypto_deposit(text, text, text, text, integer)',
    'public.rpc_admin_set_sports_risk_tier(uuid, text, text, text, integer)',
    'public.rpc_admin_suspend_sports_market(uuid, integer, text)',
    'public.rpc_settle_sports_fixture(uuid, text, text)',
    'public.rpc_settle_sports_fixture_scores(uuid, integer, integer, text)',
    'public.rpc_settle_sports_prop_outcomes(uuid, uuid[], text)',
    'public.rpc_void_sports_bet(uuid, text)',
    'public.rpc_void_sports_fixture_dead_heat(uuid, uuid, text)',
    'public.rpc_void_sports_market(uuid, text)',
    'public.rpc_suspend_sports_fixture(uuid, integer, text)',
    'public.rpc_transition_fixture_live(uuid)'
  ];
  v_sig TEXT;
  v_def TEXT;
  v_new TEXT;
  v_try TEXT;
  v_pat TEXT;
  v_patterns TEXT[] := ARRAY[
    '(  IF NOT _is_admin\(\) THEN RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)''; END IF;)',
    '(  IF NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)'';\s+END IF;)',
    '(  IF NOT _is_admin\(\) AND auth\.uid\(\) IS NOT NULL THEN\s+RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)'';\s+END IF;)',
    '(  IF auth\.uid\(\) IS NOT NULL AND NOT _is_admin\(\) THEN RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)''; END IF;)',
    '(  IF auth\.uid\(\) IS NOT NULL AND NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''(?:forbidden|FORBIDDEN)'';\s+END IF;)',
    '(  IF auth\.uid\(\) IS NULL OR NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''FORBIDDEN'';\s+END IF;)',
    '(  IF v_actor_id IS NOT NULL AND NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''forbidden'';\s+END IF;)',
    '(  IF v_actor IS NULL OR NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''FORBIDDEN'';\s+END IF;)',
    '(  IF v_actor_id IS NULL OR NOT _is_admin\(\) THEN\s+RAISE EXCEPTION ''FORBIDDEN'';\s+END IF;)',
    '(  IF auth\.role\(\) = ''anon'' OR \(auth\.role\(\) = ''authenticated'' AND NOT _is_admin\(\)\) THEN\s+RAISE EXCEPTION ''forbidden'';\s+END IF;)'
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

-- ── system_live sweep: user balance-moving RPCs ─────────────────────────────
DO $mig$
DECLARE
  v_sigs TEXT[] := ARRAY[
    'public.rpc_claim_staking_reward(uuid)',
    'public.rpc_unstake_phon(uuid)',
    'public.rpc_cancel_game_bet(uuid)',
    'public.rpc_cashout_sports_bet(uuid, text, text)',
    'public.rpc_lock_wallet(currency, text, text, text, uuid)',
    'public.rpc_unlock_wallet(currency, text, text, text, uuid)'
  ];
  v_sig TEXT;
  v_def TEXT;
  v_new TEXT;
BEGIN
  FOREACH v_sig IN ARRAY v_sigs LOOP
    v_def := pg_get_functiondef(v_sig::regprocedure);
    v_def := replace(v_def, E'\r\n', E'\n');

    IF position('_assert_system_live(' IN v_def) > 0 THEN
      CONTINUE;
    END IF;

    v_new := regexp_replace(
      v_def,
      E'\nBEGIN\n',
      E'\nBEGIN\n  PERFORM _assert_system_live();\n',
      ''
    );

    IF v_new = v_def THEN
      RAISE EXCEPTION 'system_live guard anchor (BEGIN) not found in %', v_sig;
    END IF;

    EXECUTE v_new;
  END LOOP;
END
$mig$;
