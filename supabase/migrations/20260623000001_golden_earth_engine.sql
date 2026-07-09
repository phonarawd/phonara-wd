-- ============================================================
-- Golden Earth — live tap engine (no ads · tier caps · FOMO)
-- ============================================================

SET search_path = public, pg_temp;

-- ─── VIP tier (earn lane · distinct from kyc_tier) ───────────────────────────
DO $$ BEGIN
  CREATE TYPE earn_vip_tier AS ENUM (
    'bronze', 'silver', 'gold', 'platinum', 'diamond'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS user_earn_vip (
  user_id           UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  xp                BIGINT NOT NULL DEFAULT 0,
  tier              earn_vip_tier NOT NULL DEFAULT 'bronze',
  tier_upgraded_on  DATE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS golden_earth_global (
  id                INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_taps        BIGINT NOT NULL DEFAULT 9872341,
  jackpot_every     BIGINT NOT NULL DEFAULT 500000,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO golden_earth_global (id, total_taps, jackpot_every)
VALUES (1, 9872341, 500000)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS golden_earth_daily (
  user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kst_date                DATE NOT NULL,
  tap_count               INT NOT NULL DEFAULT 0,
  regen_pool              INT NOT NULL DEFAULT 0,
  last_regen_at           TIMESTAMPTZ,
  bonus_taps              INT NOT NULL DEFAULT 0,
  tier_upgrade_bonus      INT NOT NULL DEFAULT 0,
  first_tap_claimed       BOOLEAN NOT NULL DEFAULT FALSE,
  combo_streak            INT NOT NULL DEFAULT 0,
  combo_boost_remaining   INT NOT NULL DEFAULT 0,
  combo_boost_multiplier  NUMERIC NOT NULL DEFAULT 1.0,
  last_tap_at             TIMESTAMPTZ,
  earned_phon             TEXT NOT NULL DEFAULT '0.000000',
  PRIMARY KEY (user_id, kst_date)
);

CREATE INDEX IF NOT EXISTS ged_user_date_idx ON golden_earth_daily (user_id, kst_date DESC);

CREATE TABLE IF NOT EXISTS golden_earth_taps (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  kst_date          DATE NOT NULL,
  tap_index         INT NOT NULL,
  phon_awarded      TEXT NOT NULL,
  multiplier        NUMERIC NOT NULL DEFAULT 1.0,
  is_jackpot        BOOLEAN NOT NULL DEFAULT FALSE,
  is_global_jackpot BOOLEAN NOT NULL DEFAULT FALSE,
  ledger_entry_id   UUID REFERENCES wallet_ledger(id),
  client_request_id TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, client_request_id)
);

CREATE INDEX IF NOT EXISTS get_user_date_idx ON golden_earth_taps (user_id, kst_date, tap_index);

-- ─── Config ──────────────────────────────────────────────────────────────────
INSERT INTO app_config (key, value, description) VALUES
  ('golden_earth_cap_bronze', '1000', 'Daily base tap cap — bronze.'),
  ('golden_earth_cap_silver', '2000', 'Daily base tap cap — silver.'),
  ('golden_earth_cap_gold', '3500', 'Daily base tap cap — gold.'),
  ('golden_earth_cap_platinum', '5500', 'Daily base tap cap — platinum.'),
  ('golden_earth_cap_diamond', '8000', 'Daily base tap cap — diamond.'),
  ('golden_earth_reward_bronze', '3.000000', 'PHON per tap — bronze.'),
  ('golden_earth_reward_silver', '4.000000', 'PHON per tap — silver.'),
  ('golden_earth_reward_gold', '5.000000', 'PHON per tap — gold.'),
  ('golden_earth_reward_platinum', '6.000000', 'PHON per tap — platinum.'),
  ('golden_earth_reward_diamond', '8.000000', 'PHON per tap — diamond.'),
  ('golden_earth_xp_threshold_silver', '5000', 'XP for silver tier.'),
  ('golden_earth_xp_threshold_gold', '25000', 'XP for gold tier.'),
  ('golden_earth_xp_threshold_platinum', '100000', 'XP for platinum tier.'),
  ('golden_earth_xp_threshold_diamond', '500000', 'XP for diamond tier.'),
  ('golden_earth_regen_interval_min', '30', 'Minutes between regen grants after base cap hit.'),
  ('golden_earth_regen_amount', '80', 'Taps added per regen grant.'),
  ('golden_earth_regen_daily_cap', '800', 'Max regen taps per KST day.'),
  ('golden_earth_golden_hour_start', '12', 'Golden hour start (KST hour, inclusive).'),
  ('golden_earth_golden_hour_end', '13', 'Golden hour end (KST hour, exclusive).'),
  ('golden_earth_golden_hour_mult', '2', 'PHON multiplier during golden hour.'),
  ('golden_earth_diamond_golden_mult', '3', 'Diamond PHON multiplier during golden hour.'),
  ('golden_earth_first_tap_min', '100.000000', 'Minimum PHON for first tap of KST day.'),
  ('golden_earth_streak_7_cap_pct', '15', 'Extra daily cap % when login streak >= 7.'),
  ('golden_earth_streak_30_phon_mult', '2', 'PHON multiplier when login streak >= 30.'),
  ('golden_earth_tier_upgrade_taps', '1000', 'Bonus taps on tier upgrade day.'),
  ('golden_earth_tier_upgrade_phon', '500.000000', 'Instant PHON on tier upgrade.'),
  ('golden_earth_mission_daily_cap', '900', 'Max bonus taps from in-app missions per day.'),
  ('golden_earth_mission_daily_claim', '200', 'Bonus taps when daily reward claimed.'),
  ('golden_earth_mission_casino_bet', '300', 'Bonus taps when any casino bet settled today.'),
  ('golden_earth_mission_viral_share', '400', 'Bonus taps when share_referral_link claimed today.'),
  ('golden_earth_jackpot_chance_bps', '50', 'Mini jackpot chance in basis points (50 = 0.5%).'),
  ('golden_earth_jackpot_min', '50.000000', 'Mini jackpot min PHON.'),
  ('golden_earth_jackpot_max', '500.000000', 'Mini jackpot max PHON.'),
  ('golden_earth_global_jackpot_min', '10000.000000', 'Global jackpot min PHON.'),
  ('golden_earth_global_jackpot_max', '50000.000000', 'Global jackpot max PHON.'),
  ('golden_earth_no_ads', 'true', 'Policy flag — no ad/survey bonus paths.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('rpc_golden_earth_tap', 3, 2.5, 1, 60)
ON CONFLICT (rpc_name) DO UPDATE
  SET capacity = EXCLUDED.capacity,
      refill_rate = EXCLUDED.refill_rate,
      is_active = TRUE;

-- ─── Reward classifier ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _is_reward_issuance_reason(p_reason_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_reason_code IN (
    'welcome_bonus',
    'referral_bonus',
    'daily_claim',
    'roulette_spin',
    'mission_reward',
    'staking_reward',
    'viral_mission_reward',
    'golden_earth_tap',
    'golden_earth_jackpot',
    'golden_earth_tier_upgrade'
  );
$$;

REVOKE ALL ON FUNCTION _is_reward_issuance_reason(TEXT) FROM PUBLIC, anon, authenticated;

-- ─── Helpers ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _golden_earth_kst_date()
RETURNS DATE
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT (NOW() AT TIME ZONE 'Asia/Seoul')::DATE;
$$;

REVOKE ALL ON FUNCTION _golden_earth_kst_date() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _golden_earth_kst_now()
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT NOW() AT TIME ZONE 'Asia/Seoul';
$$;

REVOKE ALL ON FUNCTION _golden_earth_kst_now() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _golden_earth_config_int(p_key TEXT, p_default INT)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((SELECT value::INT FROM app_config WHERE key = p_key), p_default);
$$;

REVOKE ALL ON FUNCTION _golden_earth_config_int(TEXT, INT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _golden_earth_config_num(p_key TEXT, p_default NUMERIC)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((SELECT value::NUMERIC FROM app_config WHERE key = p_key), p_default);
$$;

REVOKE ALL ON FUNCTION _golden_earth_config_num(TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _golden_earth_config_text(p_key TEXT, p_default TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((SELECT value FROM app_config WHERE key = p_key), p_default);
$$;

REVOKE ALL ON FUNCTION _golden_earth_config_text(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _golden_earth_tier_for_xp(p_xp BIGINT)
RETURNS earn_vip_tier
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_diamond  INT := _golden_earth_config_int('golden_earth_xp_threshold_diamond', 500000);
  v_platinum INT := _golden_earth_config_int('golden_earth_xp_threshold_platinum', 100000);
  v_gold     INT := _golden_earth_config_int('golden_earth_xp_threshold_gold', 25000);
  v_silver   INT := _golden_earth_config_int('golden_earth_xp_threshold_silver', 5000);
BEGIN
  IF p_xp >= v_diamond THEN RETURN 'diamond'; END IF;
  IF p_xp >= v_platinum THEN RETURN 'platinum'; END IF;
  IF p_xp >= v_gold THEN RETURN 'gold'; END IF;
  IF p_xp >= v_silver THEN RETURN 'silver'; END IF;
  RETURN 'bronze';
END;
$$;

REVOKE ALL ON FUNCTION _golden_earth_tier_for_xp(BIGINT) FROM PUBLIC, anon, authenticated;

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
  END;
$$;

REVOKE ALL ON FUNCTION _golden_earth_reward_base(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _golden_earth_is_golden_hour()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXTRACT(HOUR FROM _golden_earth_kst_now()) >= _golden_earth_config_int('golden_earth_golden_hour_start', 12)
     AND EXTRACT(HOUR FROM _golden_earth_kst_now()) < _golden_earth_config_int('golden_earth_golden_hour_end', 13);
$$;

REVOKE ALL ON FUNCTION _golden_earth_is_golden_hour() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _golden_earth_mission_bonus_taps(p_user_id UUID, p_kst_date DATE)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bonus INT := 0;
  v_cap   INT := _golden_earth_config_int('golden_earth_mission_daily_cap', 900);
BEGIN
  IF EXISTS (
    SELECT 1 FROM daily_claims
     WHERE user_id = p_user_id AND claimed_date = CURRENT_DATE
  ) THEN
    v_bonus := v_bonus + _golden_earth_config_int('golden_earth_mission_daily_claim', 200);
  END IF;

  IF EXISTS (
    SELECT 1 FROM game_bets
     WHERE user_id = p_user_id
       AND status IN ('won', 'lost', 'cancelled')
       AND (created_at AT TIME ZONE 'Asia/Seoul')::DATE = p_kst_date
  ) THEN
    v_bonus := v_bonus + _golden_earth_config_int('golden_earth_mission_casino_bet', 300);
  END IF;

  IF EXISTS (
    SELECT 1 FROM viral_mission_claims
     WHERE user_id = p_user_id
       AND mission = 'share_referral_link'
       AND window_key LIKE 'day:' || to_char(p_kst_date, 'YYYY-MM-DD') || '%'
  ) THEN
    v_bonus := v_bonus + _golden_earth_config_int('golden_earth_mission_viral_share', 400);
  END IF;

  RETURN LEAST(v_bonus, v_cap);
END;
$$;

REVOKE ALL ON FUNCTION _golden_earth_mission_bonus_taps(UUID, DATE) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _ensure_user_earn_vip(p_user_id UUID)
RETURNS user_earn_vip
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row user_earn_vip;
BEGIN
  INSERT INTO user_earn_vip (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_row FROM user_earn_vip WHERE user_id = p_user_id;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION _ensure_user_earn_vip(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _golden_earth_effective_cap(
  p_user_id UUID,
  p_tier earn_vip_tier,
  p_daily golden_earth_daily,
  p_login_streak INT
)
RETURNS INT
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_base      INT;
  v_streak_pct INT;
  v_cap       INT;
BEGIN
  v_base := _golden_earth_base_cap(p_tier);
  IF COALESCE(p_login_streak, 0) >= 7 THEN
    v_streak_pct := _golden_earth_config_int('golden_earth_streak_7_cap_pct', 15);
    v_base := v_base + (v_base * v_streak_pct / 100);
  END IF;

  v_cap := v_base
    + COALESCE(p_daily.bonus_taps, 0)
    + COALESCE(p_daily.tier_upgrade_bonus, 0)
    + COALESCE(p_daily.regen_pool, 0);

  RETURN v_cap;
END;
$$;

REVOKE ALL ON FUNCTION _golden_earth_effective_cap(UUID, earn_vip_tier, golden_earth_daily, INT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _golden_earth_maybe_regen(
  p_user_id UUID,
  p_kst_date DATE,
  p_daily golden_earth_daily,
  p_tier earn_vip_tier,
  p_login_streak INT
)
RETURNS golden_earth_daily
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row           golden_earth_daily := p_daily;
  v_base_cap      INT;
  v_regen_amount  INT := _golden_earth_config_int('golden_earth_regen_amount', 80);
  v_regen_cap     INT := _golden_earth_config_int('golden_earth_regen_daily_cap', 800);
  v_interval_min  INT := _golden_earth_config_int('golden_earth_regen_interval_min', 30);
  v_effective     INT;
BEGIN
  v_effective := _golden_earth_effective_cap(p_user_id, p_tier, v_row, p_login_streak);
  v_base_cap := _golden_earth_base_cap(p_tier);

  IF v_row.tap_count < v_base_cap + v_row.bonus_taps + v_row.tier_upgrade_bonus THEN
    RETURN v_row;
  END IF;

  IF v_row.regen_pool >= v_regen_cap THEN
    RETURN v_row;
  END IF;

  IF v_row.last_regen_at IS NOT NULL
     AND v_row.last_regen_at > NOW() - (v_interval_min || ' minutes')::INTERVAL THEN
    RETURN v_row;
  END IF;

  v_row.regen_pool := LEAST(v_row.regen_pool + v_regen_amount, v_regen_cap);
  v_row.last_regen_at := NOW();

  UPDATE golden_earth_daily SET
    regen_pool = v_row.regen_pool,
    last_regen_at = v_row.last_regen_at
  WHERE user_id = p_user_id AND kst_date = p_kst_date;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION _golden_earth_maybe_regen(UUID, DATE, golden_earth_daily, earn_vip_tier, INT)
  FROM PUBLIC, anon, authenticated;

-- ─── Status RPC (public global + authenticated personal) ───────────────────────
CREATE OR REPLACE FUNCTION rpc_get_golden_earth_status()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id       UUID := auth.uid();
  v_global        golden_earth_global;
  v_kst_date      DATE := _golden_earth_kst_date();
  v_vip           user_earn_vip;
  v_daily         golden_earth_daily;
  v_login_streak  INT := 0;
  v_effective_cap INT;
  v_remaining     INT;
  v_next_tier     earn_vip_tier;
  v_next_xp       BIGINT;
  v_golden_hour   BOOLEAN := _golden_earth_is_golden_hour();
  v_minutes_left  INT;
  v_regen_next    TIMESTAMPTZ;
  v_interval_min  INT := _golden_earth_config_int('golden_earth_regen_interval_min', 30);
  v_base_reward   NUMERIC;
  v_max_phon      NUMERIC;
BEGIN
  SELECT * INTO v_global FROM golden_earth_global WHERE id = 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'authenticated', FALSE,
      'global_total', v_global.total_taps,
      'global_jackpot_every', v_global.jackpot_every,
      'global_until_jackpot', GREATEST(v_global.jackpot_every - (v_global.total_taps % v_global.jackpot_every), 0),
      'golden_hour_active', v_golden_hour,
      'no_ads', TRUE
    );
  END IF;

  v_vip := _ensure_user_earn_vip(v_user_id);

  SELECT COALESCE(current_streak, 0) INTO v_login_streak
    FROM user_streaks WHERE user_id = v_user_id;

  SELECT * INTO v_daily FROM golden_earth_daily
   WHERE user_id = v_user_id AND kst_date = v_kst_date;

  IF NOT FOUND THEN
    v_daily.user_id := v_user_id;
    v_daily.kst_date := v_kst_date;
    v_daily.bonus_taps := _golden_earth_mission_bonus_taps(v_user_id, v_kst_date);
  ELSE
    v_daily.bonus_taps := _golden_earth_mission_bonus_taps(v_user_id, v_kst_date);
  END IF;

  v_daily := _golden_earth_maybe_regen(v_user_id, v_kst_date, v_daily, v_vip.tier, v_login_streak);

  v_effective_cap := _golden_earth_effective_cap(v_user_id, v_vip.tier, v_daily, v_login_streak);
  v_remaining := GREATEST(v_effective_cap - COALESCE(v_daily.tap_count, 0), 0);
  v_base_reward := _golden_earth_reward_base(v_vip.tier);
  v_max_phon := v_remaining * v_base_reward * CASE WHEN v_golden_hour THEN 2 ELSE 1 END;

  v_next_tier := CASE v_vip.tier
    WHEN 'bronze' THEN 'silver'::earn_vip_tier
    WHEN 'silver' THEN 'gold'::earn_vip_tier
    WHEN 'gold' THEN 'platinum'::earn_vip_tier
    WHEN 'platinum' THEN 'diamond'::earn_vip_tier
    ELSE NULL
  END;

  v_next_xp := CASE v_vip.tier
    WHEN 'bronze' THEN _golden_earth_config_int('golden_earth_xp_threshold_silver', 5000)
    WHEN 'silver' THEN _golden_earth_config_int('golden_earth_xp_threshold_gold', 25000)
    WHEN 'gold' THEN _golden_earth_config_int('golden_earth_xp_threshold_platinum', 100000)
    WHEN 'platinum' THEN _golden_earth_config_int('golden_earth_xp_threshold_diamond', 500000)
    ELSE NULL
  END;

  IF v_golden_hour THEN
    v_minutes_left := (
      (_golden_earth_config_int('golden_earth_golden_hour_end', 13) * 60)
      - (EXTRACT(HOUR FROM _golden_earth_kst_now())::INT * 60 + EXTRACT(MINUTE FROM _golden_earth_kst_now())::INT)
    );
    v_minutes_left := GREATEST(v_minutes_left, 0);
  END IF;

  IF v_daily.last_regen_at IS NOT NULL AND v_daily.regen_pool < _golden_earth_config_int('golden_earth_regen_daily_cap', 800) THEN
    v_regen_next := v_daily.last_regen_at + (v_interval_min || ' minutes')::INTERVAL;
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'authenticated', TRUE,
    'tier', v_vip.tier,
    'xp', v_vip.xp,
    'next_tier', v_next_tier,
    'next_tier_xp', v_next_xp,
    'global_total', v_global.total_taps,
    'global_jackpot_every', v_global.jackpot_every,
    'global_until_jackpot', GREATEST(v_global.jackpot_every - (v_global.total_taps % v_global.jackpot_every), 0),
    'tap_count', COALESCE(v_daily.tap_count, 0),
    'daily_cap', v_effective_cap,
    'remaining', v_remaining,
    'earned_phon_today', COALESCE(v_daily.earned_phon, '0.000000'),
    'max_phon_today_estimate', to_char(v_max_phon, 'FM999999999.000000'),
    'base_reward_per_tap', to_char(v_base_reward, 'FM999999999.000000'),
    'golden_hour_active', v_golden_hour,
    'golden_hour_minutes_left', v_minutes_left,
    'regen_pool', COALESCE(v_daily.regen_pool, 0),
    'regen_next_at', v_regen_next,
    'combo_streak', COALESCE(v_daily.combo_streak, 0),
    'combo_boost_remaining', COALESCE(v_daily.combo_boost_remaining, 0),
    'combo_boost_multiplier', COALESCE(v_daily.combo_boost_multiplier, 1),
    'login_streak', v_login_streak,
    'streak_bonus_active', COALESCE(v_login_streak, 0) >= 7,
    'streak_30_mult_active', COALESCE(v_login_streak, 0) >= 30,
    'bonus_taps', COALESCE(v_daily.bonus_taps, 0),
    'no_ads', TRUE
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_golden_earth_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_get_golden_earth_status() TO anon, authenticated;

-- ─── Tap RPC ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_golden_earth_tap(p_client_request_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id         UUID := auth.uid();
  v_kst_date        DATE := _golden_earth_kst_date();
  v_vip             user_earn_vip;
  v_old_tier        earn_vip_tier;
  v_daily           golden_earth_daily;
  v_login_streak    INT := 0;
  v_effective_cap   INT;
  v_tier            earn_vip_tier;
  v_base_reward     NUMERIC;
  v_reward          NUMERIC;
  v_mult            NUMERIC := 1.0;
  v_is_jackpot      BOOLEAN := FALSE;
  v_is_global_jp    BOOLEAN := FALSE;
  v_idem            TEXT;
  v_ledger_id       UUID;
  v_tap_id          UUID;
  v_global          golden_earth_global;
  v_new_global      BIGINT;
  v_reason          TEXT := 'golden_earth_tap';
  v_first_min       NUMERIC;
  v_roll            INT;
  v_jp_min          NUMERIC;
  v_jp_max          NUMERIC;
  v_tier_upgrade    BOOLEAN := FALSE;
  v_upgrade_phon    TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  PERFORM _assert_system_live();
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_golden_earth_tap');

  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    SELECT id INTO v_tap_id FROM golden_earth_taps
     WHERE user_id = v_user_id AND client_request_id = p_client_request_id;
    IF FOUND THEN
      RETURN (
        SELECT jsonb_build_object(
          'ok', TRUE,
          'duplicate', TRUE,
          'phon_awarded', phon_awarded,
          'tap_index', tap_index,
          'is_jackpot', is_jackpot,
          'is_global_jackpot', is_global_jackpot
        ) FROM golden_earth_taps WHERE id = v_tap_id
      );
    END IF;
  END IF;

  v_vip := _ensure_user_earn_vip(v_user_id);
  v_old_tier := v_vip.tier;

  SELECT COALESCE(current_streak, 0) INTO v_login_streak
    FROM user_streaks WHERE user_id = v_user_id;

  INSERT INTO golden_earth_daily (user_id, kst_date, bonus_taps)
  VALUES (v_user_id, v_kst_date, _golden_earth_mission_bonus_taps(v_user_id, v_kst_date))
  ON CONFLICT (user_id, kst_date) DO UPDATE
    SET bonus_taps = _golden_earth_mission_bonus_taps(v_user_id, v_kst_date);

  SELECT * INTO v_daily FROM golden_earth_daily
   WHERE user_id = v_user_id AND kst_date = v_kst_date
   FOR UPDATE;

  v_daily := _golden_earth_maybe_regen(v_user_id, v_kst_date, v_daily, v_vip.tier, v_login_streak);
  SELECT * INTO v_daily FROM golden_earth_daily
   WHERE user_id = v_user_id AND kst_date = v_kst_date
   FOR UPDATE;

  v_effective_cap := _golden_earth_effective_cap(v_user_id, v_vip.tier, v_daily, v_login_streak);

  IF v_daily.tap_count >= v_effective_cap THEN
    RAISE EXCEPTION 'golden_earth_daily_cap_exhausted';
  END IF;

  -- Combo tracking
  IF v_daily.last_tap_at IS NOT NULL
     AND v_daily.last_tap_at > NOW() - INTERVAL '800 milliseconds' THEN
    v_daily.combo_streak := COALESCE(v_daily.combo_streak, 0) + 1;
  ELSE
    v_daily.combo_streak := 1;
  END IF;

  IF v_daily.combo_streak >= 200 THEN
    v_daily.combo_boost_remaining := 200;
    v_daily.combo_boost_multiplier := 2.0;
    v_daily.combo_streak := 0;
  ELSIF v_daily.combo_streak >= 50 THEN
    v_daily.combo_boost_remaining := 50;
    v_daily.combo_boost_multiplier := 1.5;
    v_daily.combo_streak := 0;
  END IF;

  v_tier := v_vip.tier;
  v_base_reward := _golden_earth_reward_base(v_tier);
  v_reward := v_base_reward;
  v_mult := 1.0;

  IF v_daily.combo_boost_remaining > 0 THEN
    v_mult := v_daily.combo_boost_multiplier;
    v_reward := v_reward * v_mult;
    v_daily.combo_boost_remaining := v_daily.combo_boost_remaining - 1;
  END IF;

  IF _golden_earth_is_golden_hour() THEN
    IF v_tier = 'diamond' THEN
      v_reward := v_reward * _golden_earth_config_num('golden_earth_diamond_golden_mult', 3);
      v_mult := v_mult * _golden_earth_config_num('golden_earth_diamond_golden_mult', 3);
    ELSE
      v_reward := v_reward * _golden_earth_config_num('golden_earth_golden_hour_mult', 2);
      v_mult := v_mult * _golden_earth_config_num('golden_earth_golden_hour_mult', 2);
    END IF;
  END IF;

  IF COALESCE(v_login_streak, 0) >= 30 THEN
    v_reward := v_reward * _golden_earth_config_num('golden_earth_streak_30_phon_mult', 2);
    v_mult := v_mult * _golden_earth_config_num('golden_earth_streak_30_phon_mult', 2);
  END IF;

  IF NOT v_daily.first_tap_claimed THEN
    v_first_min := _golden_earth_config_num('golden_earth_first_tap_min', 100);
    IF v_reward < v_first_min THEN
      v_reward := v_first_min;
    END IF;
    v_daily.first_tap_claimed := TRUE;
  END IF;

  v_roll := floor(random() * 10000)::INT;
  IF v_roll < _golden_earth_config_int('golden_earth_jackpot_chance_bps', 50) THEN
    v_jp_min := _golden_earth_config_num('golden_earth_jackpot_min', 50);
    v_jp_max := _golden_earth_config_num('golden_earth_jackpot_max', 500);
    v_reward := v_jp_min + floor(random() * (v_jp_max - v_jp_min + 1));
    v_is_jackpot := TRUE;
    v_reason := 'golden_earth_jackpot';
  END IF;

  SELECT * INTO v_global FROM golden_earth_global WHERE id = 1 FOR UPDATE;
  v_new_global := v_global.total_taps + 1;

  IF v_new_global % v_global.jackpot_every = 0 THEN
    v_jp_min := _golden_earth_config_num('golden_earth_global_jackpot_min', 10000);
    v_jp_max := _golden_earth_config_num('golden_earth_global_jackpot_max', 50000);
    v_reward := v_jp_min + floor(random() * (v_jp_max - v_jp_min + 1));
    v_is_jackpot := TRUE;
    v_is_global_jp := TRUE;
    v_reason := 'golden_earth_jackpot';
  END IF;

  v_idem := 'golden_earth:' || v_user_id::TEXT || ':' || v_kst_date::TEXT || ':' || (v_daily.tap_count + 1)::TEXT;
  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    v_idem := 'golden_earth:req:' || p_client_request_id;
  END IF;

  v_ledger_id := _credit_wallet_internal(
    v_user_id, 'PHON', to_char(v_reward, 'FM999999999.000000'), v_reason, v_idem
  );

  v_daily.tap_count := v_daily.tap_count + 1;
  v_daily.last_tap_at := NOW();
  v_daily.earned_phon := to_char(
    to_number(COALESCE(NULLIF(v_daily.earned_phon, ''), '0'), '999999999.999999') + v_reward,
    'FM999999999.000000'
  );

  UPDATE golden_earth_daily SET
    tap_count = v_daily.tap_count,
    combo_streak = v_daily.combo_streak,
    combo_boost_remaining = v_daily.combo_boost_remaining,
    combo_boost_multiplier = v_daily.combo_boost_multiplier,
    first_tap_claimed = v_daily.first_tap_claimed,
    last_tap_at = v_daily.last_tap_at,
    earned_phon = v_daily.earned_phon,
    bonus_taps = v_daily.bonus_taps
  WHERE user_id = v_user_id AND kst_date = v_kst_date;

  UPDATE user_earn_vip SET
    xp = xp + 1,
    tier = _golden_earth_tier_for_xp(xp + 1),
    tier_upgraded_on = CASE
      WHEN _golden_earth_tier_for_xp(xp + 1) <> tier THEN _golden_earth_kst_date()
      ELSE tier_upgraded_on
    END,
    updated_at = NOW()
  WHERE user_id = v_user_id
  RETURNING * INTO v_vip;

  IF v_vip.tier <> v_old_tier THEN
    v_tier_upgrade := TRUE;
    UPDATE golden_earth_daily SET
      tier_upgrade_bonus = tier_upgrade_bonus + _golden_earth_config_int('golden_earth_tier_upgrade_taps', 1000)
    WHERE user_id = v_user_id AND kst_date = v_kst_date;

    v_upgrade_phon := _golden_earth_config_text('golden_earth_tier_upgrade_phon', '500.000000');
    PERFORM _credit_wallet_internal(
      v_user_id, 'PHON', v_upgrade_phon, 'golden_earth_tier_upgrade',
      'golden_earth:tier_up:' || v_user_id::TEXT || ':' || v_kst_date::TEXT || ':' || v_vip.tier::TEXT
    );
  END IF;

  UPDATE golden_earth_global SET total_taps = v_new_global, updated_at = NOW() WHERE id = 1;

  INSERT INTO golden_earth_taps (
    user_id, kst_date, tap_index, phon_awarded, multiplier,
    is_jackpot, is_global_jackpot, ledger_entry_id, client_request_id,
    metadata
  ) VALUES (
    v_user_id, v_kst_date, v_daily.tap_count,
    to_char(v_reward, 'FM999999999.000000'), v_mult,
    v_is_jackpot, v_is_global_jp, v_ledger_id, p_client_request_id,
    jsonb_build_object('tier', v_vip.tier, 'combo_streak', v_daily.combo_streak)
  ) RETURNING id INTO v_tap_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'duplicate', FALSE,
    'tap_id', v_tap_id,
    'tap_index', v_daily.tap_count,
    'phon_awarded', to_char(v_reward, 'FM999999999.000000'),
    'remaining', GREATEST(
      _golden_earth_effective_cap(v_user_id, v_vip.tier, v_daily, v_login_streak) - v_daily.tap_count,
      0
    ),
    'daily_cap', _golden_earth_effective_cap(v_user_id, v_vip.tier, v_daily, v_login_streak),
    'is_jackpot', v_is_jackpot,
    'is_global_jackpot', v_is_global_jp,
    'tier', v_vip.tier,
    'tier_upgraded', v_tier_upgrade,
    'combo_streak', v_daily.combo_streak,
    'combo_boost_remaining', v_daily.combo_boost_remaining,
    'golden_hour_active', _golden_earth_is_golden_hour(),
    'global_total', v_new_global
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_golden_earth_tap(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_golden_earth_tap(TEXT) TO authenticated;

-- ─── RLS + GRANT ─────────────────────────────────────────────────────────────
ALTER TABLE user_earn_vip ENABLE ROW LEVEL SECURITY;
ALTER TABLE golden_earth_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE golden_earth_taps ENABLE ROW LEVEL SECURITY;
ALTER TABLE golden_earth_global ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_earn_vip: own read" ON user_earn_vip;
CREATE POLICY "user_earn_vip: own read" ON user_earn_vip
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_earn_vip: admin rw" ON user_earn_vip;
CREATE POLICY "user_earn_vip: admin rw" ON user_earn_vip
  FOR ALL USING (_is_admin());

DROP POLICY IF EXISTS "golden_earth_daily: own read" ON golden_earth_daily;
CREATE POLICY "golden_earth_daily: own read" ON golden_earth_daily
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "golden_earth_daily: admin rw" ON golden_earth_daily;
CREATE POLICY "golden_earth_daily: admin rw" ON golden_earth_daily
  FOR ALL USING (_is_admin());

DROP POLICY IF EXISTS "golden_earth_taps: own read" ON golden_earth_taps;
CREATE POLICY "golden_earth_taps: own read" ON golden_earth_taps
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "golden_earth_taps: admin rw" ON golden_earth_taps;
CREATE POLICY "golden_earth_taps: admin rw" ON golden_earth_taps
  FOR ALL USING (_is_admin());

DROP POLICY IF EXISTS "golden_earth_global: public read" ON golden_earth_global;
CREATE POLICY "golden_earth_global: public read" ON golden_earth_global
  FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "golden_earth_global: admin rw" ON golden_earth_global;
CREATE POLICY "golden_earth_global: admin rw" ON golden_earth_global
  FOR ALL USING (_is_admin());

GRANT SELECT ON user_earn_vip, golden_earth_daily, golden_earth_taps TO authenticated;
GRANT SELECT ON golden_earth_global TO anon, authenticated;
