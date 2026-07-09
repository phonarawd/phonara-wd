-- Fix repeatable mission social branch: enum cannot use LIKE without cast
CREATE OR REPLACE FUNCTION rpc_claim_repeatable_mission(
  p_mission TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_mission repeatable_mission_code;
  v_progress INT;
  v_target INT;
  v_window_key TEXT;
  v_reward TEXT;
  v_idem TEXT;
  v_ledger UUID;
  v_claim_id UUID;
  v_tier earn_vip_tier;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _assert_onboarding_consent(v_user_id);

  BEGIN v_mission := p_mission::repeatable_mission_code;
  EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'invalid_mission'; END;

  IF _repeatable_is_claimed(v_user_id, v_mission) THEN
    RAISE EXCEPTION 'mission_already_claimed';
  END IF;

  v_progress := _repeatable_progress(v_user_id, v_mission);
  v_target := _repeatable_target(v_mission);

  IF v_mission = 'tier_reach_silver' THEN
    v_tier := _earn_user_tier(v_user_id);
    IF _earn_tier_index(v_tier) < 1 THEN RAISE EXCEPTION 'mission_not_eligible'; END IF;
  ELSIF v_mission = 'tier_reach_gold' THEN
    v_tier := _earn_user_tier(v_user_id);
    IF _earn_tier_index(v_tier) < 2 THEN RAISE EXCEPTION 'mission_not_eligible'; END IF;
  ELSIF v_mission::TEXT LIKE 'social_%' THEN
    NULL;
  ELSIF v_progress < v_target THEN
    RAISE EXCEPTION 'mission_not_eligible';
  END IF;

  IF v_mission = 'daily_quiz' THEN
    v_tier := _earn_user_tier(v_user_id);
    IF (SELECT COUNT(*) FROM repeatable_mission_claims rmc
        WHERE rmc.user_id = v_user_id AND rmc.mission = 'daily_quiz'
          AND rmc.window_key LIKE to_char(CURRENT_DATE, 'YYYY-MM-DD') || '%')
       >= _earn_limit_daily_quiz(v_tier) THEN
      RAISE EXCEPTION 'daily_quiz_quota_exhausted';
    END IF;
  END IF;

  v_window_key := CASE
    WHEN v_mission::TEXT LIKE 'weekly_%' THEN _repeatable_week_window() || ':1'
    WHEN v_mission::TEXT LIKE 'social_%' THEN _repeatable_week_window() || ':social'
    WHEN v_mission::TEXT LIKE 'tier_%' THEN 'lifetime:' || v_mission::TEXT
    ELSE to_char(CURRENT_DATE, 'YYYY-MM-DD') || ':1'
  END;

  v_reward := _repeatable_reward(v_mission);
  v_idem := 'repeatable:' || v_user_id::TEXT || ':' || v_mission::TEXT || ':' || v_window_key;

  PERFORM _credit_wallet_internal(v_user_id, 'PHON', v_reward, 'mission_reward', v_idem);
  SELECT id INTO v_ledger FROM wallet_ledger WHERE idempotency_key = v_idem LIMIT 1;

  INSERT INTO repeatable_mission_claims (user_id, mission, window_key, phon_awarded, ledger_entry_id, client_request_id)
  VALUES (v_user_id, v_mission, v_window_key, v_reward, v_ledger, p_client_request_id)
  RETURNING id INTO v_claim_id;

  RETURN jsonb_build_object('ok', TRUE, 'claim_id', v_claim_id, 'phon_awarded', v_reward, 'mission', v_mission);
END;
$$;

REVOKE ALL ON FUNCTION rpc_claim_repeatable_mission(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_claim_repeatable_mission(TEXT, TEXT) TO authenticated;
