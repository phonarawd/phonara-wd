-- Fix SQL test regressions from earn_hub tier migration:
-- 1. _roulette_roll_from_seed overload ambiguity (live_surface_hardening_test)
-- 2. invite_3_friends trigger lost rewarded_at path (mission_security_test)
-- 3. _viral_quota_max ignored app_config cap (reward_conservation_test)

SET search_path = public, pg_temp;

-- ─── 1. Roulette: drop ambiguous 3-arg overload; reveal uses spin_index ───────

DROP FUNCTION IF EXISTS public._roulette_roll_from_seed(TEXT, UUID, DATE);

CREATE OR REPLACE FUNCTION rpc_reveal_roulette_spin(p_spin_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_spin roulette_spins%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;

  SELECT * INTO v_spin
  FROM roulette_spins
  WHERE user_id = v_user_id AND spun_date = p_spin_date
  ORDER BY spin_index DESC
  LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'spin_not_found'; END IF;

  RETURN jsonb_build_object(
    'spun_date', v_spin.spun_date,
    'spin_index', v_spin.spin_index,
    'prize_index', v_spin.prize_index,
    'phon_awarded', v_spin.phon_awarded,
    'server_seed_hash', v_spin.server_seed_hash,
    'server_seed', v_spin.server_seed,
    'roll', public._roulette_roll_from_seed(
      v_spin.server_seed::TEXT,
      v_user_id,
      v_spin.spun_date,
      v_spin.spin_index
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_reveal_roulette_spin(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_reveal_roulette_spin(DATE) TO authenticated, service_role;

-- ─── 2. invite_3_friends: fire on rewarded_at OR state=paid ─────────────────

CREATE OR REPLACE FUNCTION _on_referral_rewarded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT;
BEGIN
  IF (OLD.rewarded_at IS NULL AND NEW.rewarded_at IS NOT NULL)
     OR (NEW.state = 'paid' AND OLD.state IS DISTINCT FROM 'paid')
  THEN
    SELECT COUNT(*) INTO v_count
      FROM referrals
     WHERE referrer_id = NEW.referrer_id
       AND (rewarded_at IS NOT NULL OR state = 'paid');

    IF v_count >= 3 THEN
      BEGIN
        PERFORM _grant_mission(NEW.referrer_id, 'invite_3_friends');
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION _on_referral_rewarded() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS referrals_invite_mission ON referrals;
CREATE TRIGGER referrals_invite_mission
  AFTER UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION _on_referral_rewarded();

-- ─── 3. Viral quota: app_config cap + tier ceiling via LEAST ─────────────────

CREATE OR REPLACE FUNCTION _viral_quota_max(p_mission viral_mission_code)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_config INT;
  v_tier_cap INT;
BEGIN
  SELECT COALESCE(value::INT, 1) INTO v_config
    FROM app_config
   WHERE key = 'viral_' || p_mission::TEXT ||
     CASE p_mission
       WHEN 'share_story_template' THEN '_max_per_week'
       WHEN 'affiliate_content_post' THEN '_max_per_month'
       ELSE '_max_per_day'
     END;

  IF p_mission IN ('share_referral_link', 'invite_friend_signup') AND v_user IS NOT NULL THEN
    v_tier_cap := _earn_limit_viral_share(_earn_user_tier(v_user));
    RETURN LEAST(v_config, v_tier_cap);
  END IF;

  RETURN v_config;
END;
$$;

REVOKE ALL ON FUNCTION _viral_quota_max(viral_mission_code) FROM PUBLIC, anon, authenticated;
