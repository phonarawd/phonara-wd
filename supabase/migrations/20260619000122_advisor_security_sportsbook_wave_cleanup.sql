-- ============================================================
-- Migration: 20260619000122_advisor_security_sportsbook_wave_cleanup
-- ============================================================
-- Supabase security-advisor cleanup (WARN-level; behaviour unchanged):
--
--   1. anon_security_definer_function_executable — sportsbook admin and
--      auth-only RPCs inherited EXECUTE via PUBLIC. Revoke FROM PUBLIC + anon,
--      re-GRANT to authenticated + service_role only. Public odds/catalog RPCs
--      (rpc_list_sports_fixtures, rpc_get_fixture_markets,
--      rpc_get_live_fixture_state, rpc_list_sports_market_types) stay on anon
--      by product design. _is_admin() keeps anon EXECUTE for RLS evaluation
--      (see 20260609000054 + anon_lockdown_test.sql Test 1c-2).
--
--   2. function_search_path_mutable — pin search_path at function level via
--      ALTER FUNCTION ... SET search_path (proconfig), matching 000013 pattern.
--
-- Idempotent: re-running REVOKE/ALTER is a no-op.
-- ============================================================

SET search_path = public, pg_temp;

-- 1. Lock anon out of sportsbook admin / auth-only RPCs.
DO $$
DECLARE
  r RECORD;
  v_sig TEXT;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'rpc_admin_list_linked_device_users',
        'rpc_admin_list_outcome_liability',
        'rpc_admin_list_sports_exposure',
        'rpc_admin_list_sports_risk_events',
        'rpc_admin_list_unsettled_sports_fixtures',
        'rpc_admin_suspend_sports_market',
        'rpc_get_sports_bet',
        'rpc_list_my_sports_bets',
        'rpc_preview_sports_cashout'
      )
  LOOP
    v_sig := r.sig::TEXT;
    EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || v_sig || ' FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || v_sig || ' FROM anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION ' || v_sig || ' TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION ' || v_sig || ' TO service_role';
  END LOOP;
END;
$$;

-- 2. Pin search_path for advisor-flagged internal helpers and sports helpers.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        '_bj_card_value',
        '_bj_hand_value',
        '_bj_play',
        '_bj_shuffle',
        '_depositor_name_matches',
        '_gold_rush_paytable',
        '_gold_rush_reels',
        '_is_liquidation_breached',
        '_mint_reels_paytable',
        '_mint_reels_reels',
        '_normalize_person_name',
        '_roulette_evaluate',
        '_roulette_leg_max_mult',
        '_roulette_leg_wins',
        '_slot_line_mult',
        '_slot_spin_multiplier',
        '_slot_stop',
        '_sports_league_sport_code',
        '_sports_leg_result_from_margin',
        '_sports_map_selection',
        '_sports_market_total_line',
        '_sports_odds_exact_match',
        '_sports_spread_margin',
        '_sports_system_combinations'
      )
  LOOP
    EXECUTE 'ALTER FUNCTION ' || r.sig::TEXT || ' SET search_path = public, pg_temp';
  END LOOP;
END;
$$;
