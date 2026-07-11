-- ============================================================
-- Migration: ew_e4_tier_option_b
-- E4 Option B — rpc_get_user_tier_summary · Prime Elite · caps · admin write
-- Plan: ew-e4-tier-option-b-wave (#246) · ADR-013
-- Prerequisite: 20260804000001_ew_e4_prime_elite_enum (enum must be committed)
-- ============================================================

SET search_path = public, pg_temp;

-- --- 1. app_config (fee / caps — operator tunable) ---

INSERT INTO app_config (key, value, description) VALUES
  ('tier_fee_discount_bps_bronze', '0', 'Option B trade fee discount bps (0=0%).'),
  ('tier_fee_discount_bps_silver', '1000', 'Option B trade fee discount bps.'),
  ('tier_fee_discount_bps_gold', '1500', 'Option B trade fee discount bps.'),
  ('tier_fee_discount_bps_platinum', '2500', 'Option B trade fee discount bps.'),
  ('tier_fee_discount_bps_diamond', '3500', 'Option B trade fee discount bps.'),
  ('tier_fee_discount_bps_prime_elite', '5000', 'Option B trade fee discount bps.'),
  ('tier_leverage_cap_bronze', '5', 'Option B max futures leverage.'),
  ('tier_leverage_cap_silver', '10', 'Option B max futures leverage.'),
  ('tier_leverage_cap_gold', '20', 'Option B max futures leverage.'),
  ('tier_leverage_cap_platinum', '50', 'Option B max futures leverage.'),
  ('tier_leverage_cap_diamond', '75', 'Option B max futures leverage.'),
  ('tier_leverage_cap_prime_elite', '100', 'Option B max futures leverage.'),
  ('tier_stake_mult_bronze', '1.0', 'Option B casino/sports stake multiplier.'),
  ('tier_stake_mult_silver', '1.25', 'Option B casino/sports stake multiplier.'),
  ('tier_stake_mult_gold', '1.5', 'Option B casino/sports stake multiplier.'),
  ('tier_stake_mult_platinum', '2.0', 'Option B casino/sports stake multiplier.'),
  ('tier_stake_mult_diamond', '3.0', 'Option B casino/sports stake multiplier.'),
  ('tier_stake_mult_prime_elite', '5.0', 'Option B casino/sports stake multiplier.'),
  ('tier_withdraw_daily_phon_bronze', '100000.000000', 'Option B daily withdraw cap PHON.'),
  ('tier_withdraw_daily_phon_silver', '500000.000000', 'Option B daily withdraw cap PHON.'),
  ('tier_withdraw_daily_phon_gold', '2000000.000000', 'Option B daily withdraw cap PHON.'),
  ('tier_withdraw_daily_phon_platinum', '10000000.000000', 'Option B daily withdraw cap PHON.'),
  ('tier_withdraw_daily_phon_diamond', '', 'Empty = unlimited.'),
  ('tier_withdraw_daily_phon_prime_elite', '', 'Empty = unlimited.'),
  ('golden_earth_cap_prime_elite', '12000', 'Prime Elite golden earth daily tap cap.'),
  ('golden_earth_reward_prime_elite', '10', 'Prime Elite golden earth base reward.')
ON CONFLICT (key) DO NOTHING;

-- --- 2. Admin events (append-only) ---

CREATE TABLE IF NOT EXISTS tier_admin_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  actor_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  from_tier    earn_vip_tier NOT NULL,
  to_tier      earn_vip_tier NOT NULL,
  from_xp      BIGINT NOT NULL,
  to_xp        BIGINT NOT NULL,
  reason       TEXT NOT NULL CHECK (length(btrim(reason)) >= 4),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tier_admin_events_user_idx
  ON tier_admin_events (user_id, created_at DESC);

ALTER TABLE tier_admin_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tier_admin_events_admin_select ON tier_admin_events;
CREATE POLICY tier_admin_events_admin_select ON tier_admin_events
  FOR SELECT TO authenticated
  USING (_is_admin());

REVOKE ALL ON TABLE tier_admin_events FROM PUBLIC, anon;
GRANT SELECT ON TABLE tier_admin_events TO authenticated;
GRANT ALL ON TABLE tier_admin_events TO service_role;

-- ??? 4. Tier helper updates (prime_elite) ????????????????????????????????????

CREATE OR REPLACE FUNCTION _earn_tier_index(p_tier earn_vip_tier)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN 0
    WHEN 'silver' THEN 1
    WHEN 'gold' THEN 2
    WHEN 'platinum' THEN 3
    WHEN 'diamond' THEN 4
    WHEN 'prime_elite' THEN 5
    ELSE 0
  END;
$$;

REVOKE ALL ON FUNCTION _earn_tier_index(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_limit_roulette(p_tier earn_vip_tier)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN 1
    WHEN 'silver' THEN 1
    WHEN 'gold' THEN 2
    WHEN 'platinum' THEN 2
    WHEN 'diamond' THEN 3
    WHEN 'prime_elite' THEN 5
    ELSE 1
  END;
$$;

REVOKE ALL ON FUNCTION _earn_limit_roulette(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_limit_referral_payout(p_tier earn_vip_tier)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN 3
    WHEN 'silver' THEN 5
    WHEN 'gold' THEN 8
    WHEN 'platinum' THEN 12
    WHEN 'diamond' THEN 20
    WHEN 'prime_elite' THEN 50
    ELSE 3
  END;
$$;

REVOKE ALL ON FUNCTION _earn_limit_referral_payout(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_limit_viral_share(p_tier earn_vip_tier)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN 3
    WHEN 'silver' THEN 4
    WHEN 'gold' THEN 5
    WHEN 'platinum' THEN 6
    WHEN 'diamond' THEN 8
    WHEN 'prime_elite' THEN 12
    ELSE 3
  END;
$$;

REVOKE ALL ON FUNCTION _earn_limit_viral_share(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_limit_daily_quiz(p_tier earn_vip_tier)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN 1
    WHEN 'silver' THEN 1
    WHEN 'gold' THEN 2
    WHEN 'platinum' THEN 2
    WHEN 'diamond' THEN 3
    WHEN 'prime_elite' THEN 5
    ELSE 1
  END;
$$;

REVOKE ALL ON FUNCTION _earn_limit_daily_quiz(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_referral_multiplier(p_tier earn_vip_tier)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN 1.0
    WHEN 'silver' THEN 1.1
    WHEN 'gold' THEN 1.25
    WHEN 'platinum' THEN 1.5
    WHEN 'diamond' THEN 2.0
    WHEN 'prime_elite' THEN 3.0
    ELSE 1.0
  END;
$$;

REVOKE ALL ON FUNCTION _earn_referral_multiplier(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _golden_earth_base_cap(p_tier earn_vip_tier)
RETURNS INT
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN _golden_earth_config_int('golden_earth_cap_bronze', 1000)
    WHEN 'silver' THEN _golden_earth_config_int('golden_earth_cap_silver', 2000)
    WHEN 'gold' THEN _golden_earth_config_int('golden_earth_cap_gold', 3500)
    WHEN 'platinum' THEN _golden_earth_config_int('golden_earth_cap_platinum', 5500)
    WHEN 'diamond' THEN _golden_earth_config_int('golden_earth_cap_diamond', 8000)
    WHEN 'prime_elite' THEN _golden_earth_config_int('golden_earth_cap_prime_elite', 12000)
    ELSE _golden_earth_config_int('golden_earth_cap_bronze', 1000)
  END;
$$;

REVOKE ALL ON FUNCTION _golden_earth_base_cap(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _golden_earth_reward_base(p_tier earn_vip_tier)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN _golden_earth_config_num('golden_earth_reward_bronze', 3)
    WHEN 'silver' THEN _golden_earth_config_num('golden_earth_reward_silver', 4)
    WHEN 'gold' THEN _golden_earth_config_num('golden_earth_reward_gold', 5)
    WHEN 'platinum' THEN _golden_earth_config_num('golden_earth_reward_platinum', 6)
    WHEN 'diamond' THEN _golden_earth_config_num('golden_earth_reward_diamond', 8)
    WHEN 'prime_elite' THEN _golden_earth_config_num('golden_earth_reward_prime_elite', 10)
    ELSE _golden_earth_config_num('golden_earth_reward_bronze', 3)
  END;
$$;

REVOKE ALL ON FUNCTION _golden_earth_reward_base(earn_vip_tier) FROM PUBLIC, anon, authenticated;

-- Decay: prime_elite ? diamond (manual path only; auto apply skips)
CREATE OR REPLACE FUNCTION _tier_decay_previous(p_tier earn_vip_tier)
RETURNS earn_vip_tier
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_tier
    WHEN 'silver' THEN 'bronze'::earn_vip_tier
    WHEN 'gold' THEN 'silver'::earn_vip_tier
    WHEN 'platinum' THEN 'gold'::earn_vip_tier
    WHEN 'diamond' THEN 'platinum'::earn_vip_tier
    WHEN 'prime_elite' THEN 'diamond'::earn_vip_tier
    ELSE NULL
  END;
$$;

REVOKE ALL ON FUNCTION _tier_decay_previous(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _tier_decay_grace_days(p_tier earn_vip_tier)
RETURNS INT
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN p_tier = 'bronze' THEN 0
    WHEN p_tier = 'diamond' THEN _tier_decay_config_int('tier_decay_grace_days_diamond', 60)
    WHEN p_tier = 'prime_elite' THEN 0  -- manual only
    ELSE _tier_decay_config_int('tier_decay_grace_days', 45)
  END;
$$;

REVOKE ALL ON FUNCTION _tier_decay_grace_days(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _tier_decay_xp_cap(p_tier earn_vip_tier)
RETURNS BIGINT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN 4999
    WHEN 'silver' THEN 24999
    WHEN 'gold' THEN 99999
    WHEN 'platinum' THEN 499999
    WHEN 'diamond' THEN 999999999
    WHEN 'prime_elite' THEN 999999999
    ELSE 4999
  END;
$$;

REVOKE ALL ON FUNCTION _tier_decay_xp_cap(earn_vip_tier) FROM PUBLIC, anon, authenticated;

-- ??? 5. Option B policy helpers ??????????????????????????????????????????????

CREATE OR REPLACE FUNCTION _earn_vip_fee_discount_bps(p_tier earn_vip_tier)
RETURNS INT
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN COALESCE(_app_config_numeric('tier_fee_discount_bps_bronze', 0), 0)::INT
    WHEN 'silver' THEN COALESCE(_app_config_numeric('tier_fee_discount_bps_silver', 1000), 1000)::INT
    WHEN 'gold' THEN COALESCE(_app_config_numeric('tier_fee_discount_bps_gold', 1500), 1500)::INT
    WHEN 'platinum' THEN COALESCE(_app_config_numeric('tier_fee_discount_bps_platinum', 2500), 2500)::INT
    WHEN 'diamond' THEN COALESCE(_app_config_numeric('tier_fee_discount_bps_diamond', 3500), 3500)::INT
    WHEN 'prime_elite' THEN COALESCE(_app_config_numeric('tier_fee_discount_bps_prime_elite', 5000), 5000)::INT
    ELSE 0
  END;
$$;

REVOKE ALL ON FUNCTION _earn_vip_fee_discount_bps(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_vip_fee_rate(p_user_id UUID, p_base_rate NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bps INT;
  v_mult NUMERIC;
BEGIN
  IF p_base_rate IS NULL OR p_base_rate < 0 THEN
    RAISE EXCEPTION 'invalid_fee_rate';
  END IF;
  v_bps := _earn_vip_fee_discount_bps(_earn_user_tier(p_user_id));
  v_bps := GREATEST(LEAST(v_bps, 10000), 0);
  v_mult := (10000 - v_bps)::NUMERIC / 10000;
  RETURN trunc(p_base_rate * v_mult, 8);
END;
$$;

REVOKE ALL ON FUNCTION _earn_vip_fee_rate(UUID, NUMERIC) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_vip_trade_leverage_cap(p_tier earn_vip_tier)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN COALESCE(_app_config_numeric('tier_leverage_cap_bronze', 5), 5)
    WHEN 'silver' THEN COALESCE(_app_config_numeric('tier_leverage_cap_silver', 10), 10)
    WHEN 'gold' THEN COALESCE(_app_config_numeric('tier_leverage_cap_gold', 20), 20)
    WHEN 'platinum' THEN COALESCE(_app_config_numeric('tier_leverage_cap_platinum', 50), 50)
    WHEN 'diamond' THEN COALESCE(_app_config_numeric('tier_leverage_cap_diamond', 75), 75)
    WHEN 'prime_elite' THEN COALESCE(_app_config_numeric('tier_leverage_cap_prime_elite', 100), 100)
    ELSE 5
  END;
$$;

REVOKE ALL ON FUNCTION _earn_vip_trade_leverage_cap(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_vip_stake_mult(p_tier earn_vip_tier)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN COALESCE(_app_config_numeric('tier_stake_mult_bronze', 1.0), 1.0)
    WHEN 'silver' THEN COALESCE(_app_config_numeric('tier_stake_mult_silver', 1.25), 1.25)
    WHEN 'gold' THEN COALESCE(_app_config_numeric('tier_stake_mult_gold', 1.5), 1.5)
    WHEN 'platinum' THEN COALESCE(_app_config_numeric('tier_stake_mult_platinum', 2.0), 2.0)
    WHEN 'diamond' THEN COALESCE(_app_config_numeric('tier_stake_mult_diamond', 3.0), 3.0)
    WHEN 'prime_elite' THEN COALESCE(_app_config_numeric('tier_stake_mult_prime_elite', 5.0), 5.0)
    ELSE 1.0
  END;
$$;

REVOKE ALL ON FUNCTION _earn_vip_stake_mult(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_vip_withdrawal_daily_cap(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tier earn_vip_tier;
  v_key TEXT;
  v_raw TEXT;
BEGIN
  v_tier := _earn_user_tier(p_user_id);
  v_key := 'tier_withdraw_daily_phon_' || v_tier::TEXT;
  SELECT value INTO v_raw FROM app_config WHERE key = v_key;
  IF v_raw IS NULL OR length(btrim(v_raw)) = 0 THEN
    RETURN NULL; -- unlimited
  END IF;
  IF v_raw !~ '^\d+(\.\d+)?$' THEN
    RAISE EXCEPTION 'invalid_tier_withdraw_cap';
  END IF;
  RETURN v_raw::NUMERIC;
END;
$$;

REVOKE ALL ON FUNCTION _earn_vip_withdrawal_daily_cap(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_vip_assert_leverage(p_user_id UUID, p_leverage NUMERIC, p_market_max NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cap NUMERIC;
  v_eff NUMERIC;
BEGIN
  v_cap := _earn_vip_trade_leverage_cap(_earn_user_tier(p_user_id));
  v_eff := LEAST(COALESCE(p_market_max, v_cap), v_cap);
  IF p_leverage > v_eff THEN
    RAISE EXCEPTION 'leverage_too_high' USING HINT = 'tier_cap';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _earn_vip_assert_leverage(UUID, NUMERIC, NUMERIC)
  FROM PUBLIC, anon, authenticated;

-- ??? 6. Preserve prime_elite against XP / accidental demote ???????????????????

CREATE OR REPLACE FUNCTION _earn_vip_preserve_prime_elite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Block auto path from promoting INTO prime_elite
  IF NEW.tier = 'prime_elite' AND (OLD.tier IS DISTINCT FROM 'prime_elite') THEN
    IF current_setting('phonara.allow_prime_elite_change', true) IS DISTINCT FROM '1' THEN
      NEW.tier := OLD.tier;
    END IF;
  END IF;

  -- Block auto path from demoting OUT OF prime_elite
  IF OLD.tier = 'prime_elite' AND NEW.tier IS DISTINCT FROM 'prime_elite' THEN
    IF current_setting('phonara.allow_prime_elite_change', true) IS DISTINCT FROM '1' THEN
      NEW.tier := 'prime_elite';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_earn_vip_preserve_prime_elite ON user_earn_vip;
CREATE TRIGGER trg_earn_vip_preserve_prime_elite
  BEFORE UPDATE OF tier ON user_earn_vip
  FOR EACH ROW
  EXECUTE FUNCTION _earn_vip_preserve_prime_elite();

-- ??? 7. Decay skip prime_elite (patch apply_one) ?????????????????????????????

CREATE OR REPLACE FUNCTION _tier_decay_apply_one(
  p_user_id UUID,
  p_as_of TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_vip user_earn_vip%ROWTYPE;
  v_to earn_vip_tier;
  v_grace INT;
  v_xp_after BIGINT;
BEGIN
  SELECT * INTO v_vip FROM user_earn_vip WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'no_vip_row');
  END IF;

  IF v_vip.tier = 'bronze' THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'floor_tier');
  END IF;

  IF v_vip.tier = 'prime_elite' THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'prime_elite_manual_only');
  END IF;

  IF _tier_decay_meets_maintenance(p_user_id, v_vip.tier, p_as_of) THEN
    PERFORM _tier_decay_touch_qualifying(p_user_id);
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'maintained');
  END IF;

  v_grace := _tier_decay_grace_days(v_vip.tier);
  IF COALESCE(v_vip.last_qualifying_at, v_vip.updated_at) > p_as_of - make_interval(days => v_grace) THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'grace_active');
  END IF;

  v_to := _tier_decay_previous(v_vip.tier);
  IF v_to IS NULL THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'no_lower_tier');
  END IF;

  v_xp_after := LEAST(v_vip.xp, _tier_decay_xp_cap(v_to));

  UPDATE user_earn_vip
     SET tier = v_to,
         xp = v_xp_after,
         last_decay_at = p_as_of,
         last_qualifying_at = p_as_of,
         decay_warnings_sent = '{}',
         updated_at = p_as_of
   WHERE user_id = p_user_id;

  INSERT INTO tier_decay_events (
    user_id, from_tier, to_tier, xp_before, xp_after, reason, grace_days
  ) VALUES (
    p_user_id, v_vip.tier, v_to, v_vip.xp, v_xp_after, 'maintenance_missed', v_grace
  );

  PERFORM _enqueue_notification(
    p_user_id,
    'in_app',
    'tier_decay_warning',
    jsonb_build_object(
      'phase', 'decayed',
      'from_tier', v_vip.tier,
      'to_tier', v_to,
      'grace_days', v_grace
    )
  );
  PERFORM _enqueue_notification(
    p_user_id,
    'push',
    'tier_decay_warning',
    jsonb_build_object(
      'phase', 'decayed',
      'from_tier', v_vip.tier,
      'to_tier', v_to,
      'grace_days', v_grace
    )
  );

  RETURN jsonb_build_object(
    'ok', TRUE,
    'from_tier', v_vip.tier,
    'to_tier', v_to,
    'xp_after', v_xp_after
  );
END;
$$;

REVOKE ALL ON FUNCTION _tier_decay_apply_one(UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

-- ??? 8. Wire stake caps (casino + sports) ????????????????????????????????????

CREATE OR REPLACE FUNCTION _assert_game_stake_limits(
  p_game game_code,
  p_currency currency,
  p_stake NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_suffix TEXT := lower(p_currency::TEXT);
  v_min NUMERIC;
  v_max NUMERIC;
  v_uid UUID := auth.uid();
BEGIN
  v_min := _app_config_numeric('casino_' || p_game::TEXT || '_min_stake_' || v_suffix,
           _app_config_numeric('casino_min_stake_' || v_suffix, 0));
  v_max := _app_config_numeric('casino_' || p_game::TEXT || '_max_stake_' || v_suffix,
           _app_config_numeric('casino_max_stake_' || v_suffix, 999999999));

  IF v_uid IS NOT NULL THEN
    v_max := trunc(v_max * _earn_vip_stake_mult(_earn_user_tier(v_uid)), 6);
  END IF;

  IF p_stake < v_min OR p_stake > v_max THEN
    RAISE EXCEPTION 'stake_out_of_range' USING HINT = p_game::TEXT || ':' || p_currency::TEXT;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_game_stake_limits(game_code, currency, NUMERIC)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _assert_sports_stake_limits(p_currency currency, p_stake NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_suffix TEXT := lower(p_currency::TEXT);
  v_min NUMERIC;
  v_max NUMERIC;
  v_uid UUID := auth.uid();
BEGIN
  v_min := _app_config_numeric('sports_min_stake_' || v_suffix, 0);
  v_max := _app_config_numeric('sports_max_stake_' || v_suffix, 999999999);

  IF v_uid IS NOT NULL THEN
    v_max := trunc(v_max * _earn_vip_stake_mult(_earn_user_tier(v_uid)), 6);
  END IF;

  IF p_stake < v_min OR p_stake > v_max THEN
    RAISE EXCEPTION 'stake_out_of_range' USING HINT = p_currency::TEXT;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_sports_stake_limits(currency, NUMERIC)
  FROM PUBLIC, anon, authenticated;

-- ??? 9. rpc_get_user_tier_summary ????????????????????????????????????????????

CREATE OR REPLACE FUNCTION rpc_get_user_tier_summary()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_tier earn_vip_tier;
  v_xp BIGINT := 0;
  v_next_xp BIGINT;
  v_fee_bps INT;
  v_lev NUMERIC;
  v_stake NUMERIC;
  v_wd NUMERIC;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  v_tier := _earn_user_tier(v_uid);
  SELECT COALESCE(xp, 0) INTO v_xp FROM user_earn_vip WHERE user_id = v_uid;

  v_next_xp := CASE v_tier
    WHEN 'bronze' THEN 5000
    WHEN 'silver' THEN 25000
    WHEN 'gold' THEN 100000
    WHEN 'platinum' THEN 500000
    ELSE NULL  -- diamond / prime_elite: no XP next
  END;

  v_fee_bps := _earn_vip_fee_discount_bps(v_tier);
  v_lev := _earn_vip_trade_leverage_cap(v_tier);
  v_stake := _earn_vip_stake_mult(v_tier);
  v_wd := _earn_vip_withdrawal_daily_cap(v_uid);

  RETURN jsonb_build_object(
    'tier', v_tier::TEXT,
    'xp', v_xp,
    'next_tier_xp', v_next_xp,
    'prime_elite', v_tier = 'prime_elite',
    'invite_only_next', v_tier = 'diamond',
    'fee_discount_bps', v_fee_bps,
    'fee_multiplier', to_char((10000 - v_fee_bps)::NUMERIC / 10000, 'FM0.00000000'),
    'trade_leverage_cap', to_char(v_lev, 'FM9999990.######'),
    'stake_multiplier', to_char(v_stake, 'FM9999990.######'),
    'withdrawal_daily_cap_phon', CASE
      WHEN v_wd IS NULL THEN NULL
      ELSE to_char(v_wd, 'FM9999999990.000000')
    END,
    'limits', jsonb_build_object(
      'attendance', _earn_limit_attendance(v_tier),
      'roulette', _earn_limit_roulette(v_tier),
      'referral_payout', _earn_limit_referral_payout(v_tier),
      'viral_share', _earn_limit_viral_share(v_tier),
      'daily_quiz', _earn_limit_daily_quiz(v_tier),
      'referral_multiplier', to_char(_earn_referral_multiplier(v_tier), 'FM9999990.######')
    ),
    'option', 'B',
    'fetched_at', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_user_tier_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_user_tier_summary() TO authenticated, service_role;

-- ??? 10. Admin write ?????????????????????????????????????????????????????????

CREATE OR REPLACE FUNCTION rpc_admin_set_user_earn_vip_tier(
  p_user_id UUID,
  p_tier TEXT,
  p_reason TEXT,
  p_xp BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tier earn_vip_tier;
  v_from earn_vip_tier;
  v_from_xp BIGINT;
  v_to_xp BIGINT;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  PERFORM _assert_admin_aal2();

  IF p_reason IS NULL OR length(btrim(p_reason)) < 4 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_user';
  END IF;

  BEGIN
    v_tier := lower(btrim(p_tier))::earn_vip_tier;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'invalid_tier';
  END;

  INSERT INTO user_earn_vip (user_id, xp, tier, updated_at)
  VALUES (p_user_id, COALESCE(p_xp, 0), 'bronze', NOW())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT tier, xp INTO v_from, v_from_xp
    FROM user_earn_vip
   WHERE user_id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  v_to_xp := COALESCE(p_xp, v_from_xp);

  -- Allow trigger to change prime_elite
  PERFORM set_config('phonara.allow_prime_elite_change', '1', true);

  UPDATE user_earn_vip
     SET tier = v_tier,
         xp = v_to_xp,
         tier_upgraded_on = CASE
           WHEN v_tier <> v_from THEN CURRENT_DATE
           ELSE tier_upgraded_on
         END,
         updated_at = NOW()
   WHERE user_id = p_user_id;

  INSERT INTO tier_admin_events (
    user_id, actor_id, from_tier, to_tier, from_xp, to_xp, reason
  ) VALUES (
    p_user_id, auth.uid(), v_from, v_tier, v_from_xp, v_to_xp, btrim(p_reason)
  );

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (
    auth.uid(),
    'admin.earn_vip_tier.set',
    'user',
    p_user_id,
    jsonb_build_object(
      'from_tier', v_from::TEXT,
      'to_tier', v_tier::TEXT,
      'from_xp', v_from_xp,
      'to_xp', v_to_xp,
      'reason', btrim(p_reason)
    )
  );

  RETURN jsonb_build_object(
    'ok', TRUE,
    'user_id', p_user_id::TEXT,
    'from_tier', v_from::TEXT,
    'to_tier', v_tier::TEXT,
    'xp', v_to_xp
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_set_user_earn_vip_tier(UUID, TEXT, TEXT, BIGINT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_set_user_earn_vip_tier(UUID, TEXT, TEXT, BIGINT)
  TO authenticated, service_role;

-- ??? 11. Withdrawal daily cap (tier-tied) ????????????????????????????????????

CREATE OR REPLACE FUNCTION _earn_vip_assert_withdrawal_daily(
  p_user_id UUID,
  p_currency currency,
  p_amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cap NUMERIC;
  v_today NUMERIC;
BEGIN
  v_cap := _earn_vip_withdrawal_daily_cap(p_user_id);

  -- NULL = unlimited (diamond / prime_elite) ? skip flat soft-launch cap
  IF v_cap IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(amount::NUMERIC), 0) INTO v_today
    FROM withdrawal_requests
   WHERE user_id = p_user_id
     AND currency = p_currency
     AND status NOT IN ('rejected', 'cancelled')
     AND created_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC');

  IF v_today + p_amount > v_cap THEN
    RAISE EXCEPTION 'ERR_WITHDRAWAL_DAILY_CAP';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _earn_vip_assert_withdrawal_daily(UUID, currency, NUMERIC)
  FROM PUBLIC, anon, authenticated;

-- Wire into latest rpc_request_withdrawal (replace flat-only cap block)
CREATE OR REPLACE FUNCTION rpc_request_withdrawal(
  p_currency TEXT,
  p_amount TEXT,
  p_destination JSONB,
  p_idempotency_key TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id       UUID := auth.uid();
  v_ccy           currency;
  v_wallet        wallets%ROWTYPE;
  v_wr_id         UUID;
  v_lock_id       UUID;
  v_chain         TEXT;
  v_account       TEXT;
  v_dest          JSONB;
  v_rate_id       UUID;
  v_rate          NUMERIC;
  v_captured      TIMESTAMPTZ;
  v_expected_krw  TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('withdrawal');
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_withdrawal_mfa_step_up();

  BEGIN
    v_ccy := p_currency::currency;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_currency';
  END;

  PERFORM _assert_amount_text(p_amount);

  IF v_ccy = 'USDT' THEN
    v_chain := COALESCE(p_destination->>'chain', '');
    IF v_chain NOT IN ('TRC20', 'ERC20') THEN
      RAISE EXCEPTION 'invalid_chain';
    END IF;
    IF COALESCE(length(btrim(p_destination->>'address')), 0) < 10 THEN
      RAISE EXCEPTION 'invalid_destination';
    END IF;
    v_dest := COALESCE(p_destination, '{}'::JSONB);
  ELSIF v_ccy = 'PHON' THEN
    v_account := btrim(COALESCE(p_destination->>'account', p_destination->>'address', ''));
    IF length(v_account) < 6 THEN
      RAISE EXCEPTION 'invalid_destination';
    END IF;
    v_dest := COALESCE(p_destination, '{}'::JSONB)
      || jsonb_build_object(
           'type', 'bank',
           'chain', 'BANK',
           'account', v_account,
           'address', v_account,
           'currency', 'PHON'
         );

    SELECT id, rate::NUMERIC, captured_at
      INTO v_rate_id, v_rate, v_captured
      FROM exchange_rate_snapshots
     WHERE base_currency = 'PHON'
       AND quote_currency = 'KRW'
       AND is_active = TRUE
       AND rate::NUMERIC > 0
     ORDER BY captured_at DESC
     LIMIT 1;

    IF v_rate_id IS NULL OR v_rate IS NULL OR v_rate <= 0 THEN
      RAISE EXCEPTION 'phon_krw_rate_unavailable';
    END IF;

    IF v_captured < NOW() - INTERVAL '15 minutes' THEN
      RAISE EXCEPTION 'phon_krw_rate_stale';
    END IF;

    v_expected_krw := _fmt6(p_amount::NUMERIC * v_rate);
  ELSE
    RAISE EXCEPTION 'invalid_currency';
  END IF;

  PERFORM _assert_withdrawal_whitelist(v_user_id, v_dest, v_ccy);

  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  PERFORM _assert_kyc_withdrawal_gate(v_user_id);
  PERFORM _assert_sanctions_screening(v_user_id);
  PERFORM _aml_assert_withdrawal_defense(v_user_id, p_amount, v_ccy);
  PERFORM _assert_solvency_withdrawal_gate(v_ccy);

  -- E4 Option B: tier daily cap (replaces flat-only enforcement)
  PERFORM _earn_vip_assert_withdrawal_daily(v_user_id, v_ccy, p_amount::NUMERIC);

  SELECT id INTO v_wr_id FROM withdrawal_requests
   WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', TRUE, 'withdrawal_id', v_wr_id, 'idempotent', TRUE);
  END IF;

  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_user_id, p_client_request_id, 'rpc_request_withdrawal')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'duplicate_request';
    END IF;
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  v_wr_id := gen_random_uuid();
  v_lock_id := rpc_lock_wallet(
    v_ccy, p_amount, 'withdrawal_request_lock',
    'wd_lock:' || v_user_id::TEXT || ':' || p_idempotency_key,
    v_wr_id
  );

  INSERT INTO withdrawal_requests (
    id, user_id, wallet_id, currency, amount, destination, status,
    idempotency_key, client_request_id, ledger_lock_id,
    expected_krw, rate_snapshot_id
  ) VALUES (
    v_wr_id, v_user_id, v_wallet.id, v_ccy, p_amount, v_dest,
    'pending', p_idempotency_key, p_client_request_id, v_lock_id,
    v_expected_krw, v_rate_id
  );

  PERFORM _aml_log_event(v_user_id, 'withdrawal_requested', 'info',
    jsonb_build_object(
      'withdrawal_id', v_wr_id,
      'amount', p_amount,
      'currency', v_ccy,
      'expected_krw', v_expected_krw,
      'rate_snapshot_id', v_rate_id
    ));

  RETURN jsonb_build_object(
    'ok', TRUE,
    'withdrawal_id', v_wr_id,
    'expected_krw', v_expected_krw,
    'rate_snapshot_id', v_rate_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION rpc_request_withdrawal(TEXT, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_request_withdrawal(TEXT, TEXT, JSONB, TEXT, TEXT) TO authenticated;

-- ?????? 12. Decay warn skip for prime_elite ??????????????????????????????????????????????????????????????????????????

CREATE OR REPLACE FUNCTION _tier_decay_maybe_warn(
  p_user_id UUID,
  p_as_of TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_vip user_earn_vip%ROWTYPE;
  v_grace INT;
  v_anchor TIMESTAMPTZ;
  v_days_left INT;
  v_warn INT;
  v_sent INT[];
  v_csv TEXT;
  v_parts TEXT[];
  v_warn_days INT[];
  v_enqueued INT := 0;
BEGIN
  SELECT * INTO v_vip FROM user_earn_vip WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_vip.tier = 'bronze' THEN
    RETURN jsonb_build_object('ok', FALSE, 'warned', 0);
  END IF;
  IF v_vip.tier = 'prime_elite' THEN
    RETURN jsonb_build_object('ok', FALSE, 'warned', 0, 'reason', 'prime_elite_manual_only');
  END IF;

  IF _tier_decay_meets_maintenance(p_user_id, v_vip.tier, p_as_of) THEN
    PERFORM _tier_decay_touch_qualifying(p_user_id);
    RETURN jsonb_build_object('ok', TRUE, 'warned', 0, 'reason', 'maintained');
  END IF;

  v_grace := _tier_decay_grace_days(v_vip.tier);
  v_anchor := COALESCE(v_vip.last_qualifying_at, v_vip.updated_at, p_as_of);
  v_days_left := CEIL(EXTRACT(EPOCH FROM (v_anchor + make_interval(days => v_grace) - p_as_of)) / 86400.0)::INT;
  IF v_days_left < 0 THEN
    v_days_left := 0;
  END IF;

  v_sent := COALESCE(v_vip.decay_warnings_sent, '{}');
  v_csv := COALESCE(
    (SELECT value FROM app_config WHERE key = 'tier_decay_warn_days'),
    '30,15,7,3'
  );
  v_parts := string_to_array(replace(v_csv, ' ', ''), ',');
  SELECT COALESCE(ARRAY_AGG(p::INT ORDER BY p::INT DESC), '{}'::INT[])
    INTO v_warn_days
    FROM unnest(v_parts) AS p
   WHERE p ~ '^\d+$';

  FOREACH v_warn IN ARRAY v_warn_days
  LOOP
    IF v_days_left <= v_warn AND NOT (v_warn = ANY (v_sent)) THEN
      PERFORM _enqueue_notification(
        p_user_id,
        'push',
        'tier_decay_warning',
        jsonb_build_object(
          'phase', 'warning',
          'days_left', v_days_left,
          'warn_at_days', v_warn,
          'tier', v_vip.tier,
          'lower_tier', _tier_decay_previous(v_vip.tier)
        )
      );
      PERFORM _enqueue_notification(
        p_user_id,
        'in_app',
        'tier_decay_warning',
        jsonb_build_object(
          'phase', 'warning',
          'days_left', v_days_left,
          'warn_at_days', v_warn,
          'tier', v_vip.tier,
          'lower_tier', _tier_decay_previous(v_vip.tier)
        )
      );
      v_sent := array_append(v_sent, v_warn);
      v_enqueued := v_enqueued + 1;
    END IF;
  END LOOP;

  IF v_enqueued > 0 THEN
    UPDATE user_earn_vip
       SET decay_warnings_sent = v_sent,
           updated_at = p_as_of
     WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'warned', v_enqueued,
    'days_left', v_days_left
  );
END;
$$;

REVOKE ALL ON FUNCTION _tier_decay_maybe_warn(UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
