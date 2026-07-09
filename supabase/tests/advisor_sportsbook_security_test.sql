-- ============================================================
-- Advisor sportsbook security cleanup — SQL integration test
-- ============================================================
-- Guards 20260619000122_advisor_security_sportsbook_wave_cleanup.
-- Runs in one transaction and ROLLS BACK — no residue.
-- ============================================================

BEGIN;

DO $$
DECLARE
  r RECORD;
  v_sig TEXT;
  v_bad_search_path TEXT := '';
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
        'rpc_admin_resume_sports_market',
        'rpc_admin_suspend_sports_market',
        'rpc_get_sports_bet',
        'rpc_list_my_sports_bets',
        'rpc_preview_sports_cashout'
      )
  LOOP
    v_sig := r.sig::TEXT;
    ASSERT NOT has_function_privilege('anon', v_sig, 'EXECUTE'),
      format('anon must NOT execute %s after sportsbook advisor cleanup', v_sig);
    ASSERT has_function_privilege('authenticated', v_sig, 'EXECUTE'),
      format('authenticated must still execute %s', v_sig);
    ASSERT has_function_privilege('service_role', v_sig, 'EXECUTE'),
      format('service_role must still execute %s', v_sig);
  END LOOP;

  ASSERT has_function_privilege('anon',
    'public.rpc_list_sports_fixtures(date, text, text)', 'EXECUTE'),
    'anon must still execute public sports fixture catalog RPC';
  ASSERT has_function_privilege('anon',
    'public.rpc_get_fixture_markets(uuid)', 'EXECUTE'),
    'anon must still execute public fixture markets RPC';
  ASSERT has_function_privilege('anon',
    'public.rpc_get_live_fixture_state(uuid)', 'EXECUTE'),
    'anon must still execute public live fixture state RPC';
  ASSERT has_function_privilege('anon',
    'public.rpc_list_sports_market_types()', 'EXECUTE'),
    'anon must still execute public sports market types RPC';

  FOR r IN
    SELECT p.proname, p.oid::regprocedure AS sig, p.proconfig
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
    IF r.proconfig IS NULL
       OR NOT EXISTS (SELECT 1 FROM unnest(r.proconfig) c WHERE c LIKE 'search_path=%') THEN
      v_bad_search_path := v_bad_search_path || ' ' || r.sig::TEXT;
    END IF;
  END LOOP;

  ASSERT v_bad_search_path = '',
    format('sportsbook advisor functions missing function-level search_path:%s', v_bad_search_path);

  RAISE NOTICE 'ADVISOR SPORTSBOOK SECURITY OK — admin/auth RPCs locked; public catalog RPCs intact; search_path pinned';
END;
$$;

ROLLBACK;
