-- ============================================================
-- Earn Hub — tier limits, UI-aligned rewards, qualified referral,
-- repeatable missions, hub status RPC
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE referral_state AS ENUM (
    'registered', 'pending', 'qualified', 'blocked', 'paid'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE repeatable_mission_code AS ENUM (
    'weekly_play5', 'weekly_win3', 'weekly_deposit_once', 'weekly_spin_daily', 'weekly_login_all',
    'social_follow_x', 'social_join_telegram', 'social_share_win', 'social_join_discord',
    'tier_reach_silver', 'tier_reach_gold', 'tier_fomo_streak', 'tier_keep_status',
    'daily_today_spin', 'daily_quiz'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE reward_ticket_type AS ENUM ('discount_pct', 'free_trade');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── referrals: qualified reward state ───────────────────────────────────────
ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS state referral_state NOT NULL DEFAULT 'registered',
  ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pending_phon TEXT NOT NULL DEFAULT '0.000000',
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

UPDATE referrals
   SET state = 'paid'
 WHERE rewarded_at IS NOT NULL AND state = 'registered';

-- ─── roulette: multi-spin per day ────────────────────────────────────────────
ALTER TABLE roulette_spins
  ADD COLUMN IF NOT EXISTS spin_index INT NOT NULL DEFAULT 1;

ALTER TABLE roulette_spins DROP CONSTRAINT IF EXISTS roulette_spins_user_id_spun_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS roulette_spins_user_date_idx_uq
  ON roulette_spins (user_id, spun_date, spin_index);

-- ─── earn seasons ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS earn_seasons (
  id           INT PRIMARY KEY,
  title_key    TEXT NOT NULL,
  starts_at    TIMESTAMPTZ NOT NULL,
  ends_at      TIMESTAMPTZ NOT NULL,
  goal_xp      BIGINT NOT NULL DEFAULT 100000,
  is_active    BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO earn_seasons (id, title_key, starts_at, ends_at, goal_xp, is_active)
VALUES (
  1, 'earn.season.1',
  date_trunc('month', NOW() AT TIME ZONE 'UTC'),
  date_trunc('month', NOW() AT TIME ZONE 'UTC') + INTERVAL '30 days',
  100000, TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ─── repeatable mission claims ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS repeatable_mission_claims (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  mission           repeatable_mission_code NOT NULL,
  window_key        TEXT NOT NULL,
  phon_awarded      TEXT NOT NULL DEFAULT '0.000000',
  ledger_entry_id   UUID REFERENCES wallet_ledger(id),
  client_request_id TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}'::JSONB,
  claimed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, mission, window_key)
);

CREATE INDEX IF NOT EXISTS rmc_user_mission_idx
  ON repeatable_mission_claims (user_id, mission, claimed_at DESC);

-- ─── reward tickets ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_reward_tickets (
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticket_type reward_ticket_type NOT NULL,
  quantity   INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, ticket_type)
);

-- ─── daily referral payout counter ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_payout_daily (
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payout_date  DATE NOT NULL,
  payout_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, payout_date)
);

-- ─── app_config ──────────────────────────────────────────────────────────────
INSERT INTO app_config (key, value, description) VALUES
  ('launch_slots_total', '1000', 'FOMO launch bonus slot display total.'),
  ('earn_phon_to_usdt_rate', '0.164', 'Display-only PHON→USDT estimate rate.'),
  ('referral_qualified_reward_phon', '10000', 'Referrer PHON on qualified referral.'),
  ('referral_pending_reward_phon', '500', 'Referrer pending PHON on welcome claim.'),
  ('referral_velocity_max_24h', '50', 'Global qualified referrals per referrer per 24h flag threshold.'),
  ('earn_season_global_xp', '62000', 'Display season progress numerator seed.')
ON CONFLICT (key) DO NOTHING;

-- ─── Tier helpers ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _earn_user_tier(p_user_id UUID)
RETURNS earn_vip_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT tier FROM user_earn_vip WHERE user_id = p_user_id),
    'bronze'::earn_vip_tier
  );
$$;

REVOKE ALL ON FUNCTION _earn_user_tier(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_tier_index(p_tier earn_vip_tier)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN 0 WHEN 'silver' THEN 1 WHEN 'gold' THEN 2
    WHEN 'platinum' THEN 3 WHEN 'diamond' THEN 4 ELSE 0 END;
$$;

REVOKE ALL ON FUNCTION _earn_tier_index(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_limit_attendance(p_tier earn_vip_tier)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT 1;
$$;
REVOKE ALL ON FUNCTION _earn_limit_attendance(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_limit_roulette(p_tier earn_vip_tier)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN 1 WHEN 'silver' THEN 1 WHEN 'gold' THEN 2
    WHEN 'platinum' THEN 2 WHEN 'diamond' THEN 3 ELSE 1 END;
$$;
REVOKE ALL ON FUNCTION _earn_limit_roulette(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_limit_referral_payout(p_tier earn_vip_tier)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN 3 WHEN 'silver' THEN 5 WHEN 'gold' THEN 8
    WHEN 'platinum' THEN 12 WHEN 'diamond' THEN 20 ELSE 3 END;
$$;
REVOKE ALL ON FUNCTION _earn_limit_referral_payout(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_limit_viral_share(p_tier earn_vip_tier)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN 3 WHEN 'silver' THEN 4 WHEN 'gold' THEN 5
    WHEN 'platinum' THEN 6 WHEN 'diamond' THEN 8 ELSE 3 END;
$$;
REVOKE ALL ON FUNCTION _earn_limit_viral_share(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_limit_daily_quiz(p_tier earn_vip_tier)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN 1 WHEN 'silver' THEN 1 WHEN 'gold' THEN 2
    WHEN 'platinum' THEN 2 WHEN 'diamond' THEN 3 ELSE 1 END;
$$;
REVOKE ALL ON FUNCTION _earn_limit_daily_quiz(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_referral_multiplier(p_tier earn_vip_tier)
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_tier
    WHEN 'bronze' THEN 1.0 WHEN 'silver' THEN 1.1 WHEN 'gold' THEN 1.25
    WHEN 'platinum' THEN 1.5 WHEN 'diamond' THEN 2.0 ELSE 1.0 END;
$$;
REVOKE ALL ON FUNCTION _earn_referral_multiplier(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _attendance_reward_for_day(p_cycle_day INT)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE LEAST(GREATEST(p_cycle_day, 1), 7)
    WHEN 1 THEN 1000 WHEN 2 THEN 1000 WHEN 3 THEN 1000
    WHEN 4 THEN 1500 WHEN 5 THEN 2000 WHEN 6 THEN 2500
    WHEN 7 THEN 5000 ELSE 1000 END;
$$;

REVOKE ALL ON FUNCTION _attendance_reward_for_day(INT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _earn_kst_midnight_utc()
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
AS $$
  SELECT (
    (date_trunc('day', NOW() AT TIME ZONE 'Asia/Seoul') + INTERVAL '1 day')
    AT TIME ZONE 'Asia/Seoul'
  );
$$;

REVOKE ALL ON FUNCTION _earn_kst_midnight_utc() FROM PUBLIC, anon, authenticated;

-- ─── _grant_mission rewards (UI-aligned) ─────────────────────────────────────
CREATE OR REPLACE FUNCTION _grant_mission(
  p_user_id UUID,
  p_mission mission_code
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rewards   JSONB := jsonb_build_object(
    'complete_profile', '500.000000',
    'first_trade',      '1000.000000',
    'first_game',       '1000.000000',
    'first_deposit',    '3000.000000',
    'kyc_verified',     '2000.000000',
    'invite_3_friends', '30000.000000',
    'streak_7_days',    '5000.000000',
    'streak_30_days',   '30000.000000'
  );
  v_phon_text TEXT := v_rewards ->> p_mission::TEXT;
  v_idem_key  TEXT := 'mission:' || p_user_id::TEXT || ':' || p_mission::TEXT;
  v_ledger_id UUID;
BEGIN
  PERFORM 1 FROM missions
   WHERE user_id = p_user_id AND mission = p_mission AND completed_at IS NOT NULL;
  IF FOUND THEN RETURN; END IF;
  IF v_phon_text IS NULL THEN RETURN; END IF;

  PERFORM _credit_wallet_internal(
    p_user_id, 'PHON', v_phon_text, 'mission_reward', v_idem_key
  );

  SELECT id INTO v_ledger_id
    FROM wallet_ledger WHERE idempotency_key = v_idem_key LIMIT 1;

  INSERT INTO missions (user_id, mission, phon_awarded, ledger_entry_id, completed_at)
  VALUES (p_user_id, p_mission, v_phon_text, v_ledger_id, NOW())
  ON CONFLICT (user_id, mission) DO UPDATE SET
    phon_awarded    = EXCLUDED.phon_awarded,
    ledger_entry_id = EXCLUDED.ledger_entry_id,
    completed_at    = EXCLUDED.completed_at;
END;
$$;

REVOKE ALL ON FUNCTION _grant_mission(UUID, mission_code) FROM PUBLIC, anon, authenticated;

-- ─── Referral qualify ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _referral_payout_used_today(p_user_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(payout_count, 0)
    FROM referral_payout_daily
   WHERE user_id = p_user_id AND payout_date = CURRENT_DATE;
$$;

REVOKE ALL ON FUNCTION _referral_payout_used_today(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _try_qualify_referral(p_referred_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ref         referrals%ROWTYPE;
  v_referrer    UUID;
  v_tier        earn_vip_tier;
  v_cap         INT;
  v_used        INT;
  v_base        NUMERIC;
  v_mult        NUMERIC;
  v_reward      NUMERIC;
  v_reward_text TEXT;
  v_idem        TEXT;
  v_ledger      UUID;
BEGIN
  SELECT * INTO v_ref FROM referrals WHERE referred_id = p_referred_id FOR UPDATE;
  IF NOT FOUND OR v_ref.state NOT IN ('registered', 'pending') THEN
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_referred_id AND (is_banned OR activity_frozen)) THEN
    UPDATE referrals SET state = 'blocked', blocked_reason = 'referred_account_frozen'
     WHERE id = v_ref.id;
    RETURN;
  END IF;

  v_referrer := v_ref.referrer_id;
  IF v_referrer = p_referred_id THEN
    UPDATE referrals SET state = 'blocked', blocked_reason = 'self_referral' WHERE id = v_ref.id;
    RETURN;
  END IF;

  v_tier := _earn_user_tier(v_referrer);
  v_cap := _earn_limit_referral_payout(v_tier);
  v_used := COALESCE(_referral_payout_used_today(v_referrer), 0);

  IF v_used >= v_cap THEN
    UPDATE referrals SET state = 'blocked', blocked_reason = 'payout_cap_exceeded' WHERE id = v_ref.id;
    RETURN;
  END IF;

  SELECT COALESCE(value::NUMERIC, 10000) INTO v_base FROM app_config WHERE key = 'referral_qualified_reward_phon';
  v_mult := _earn_referral_multiplier(v_tier);
  v_reward := v_base * v_mult;
  v_reward_text := TO_CHAR(v_reward, 'FM9999990.000000');
  v_idem := 'referral_qualified:' || v_ref.id::TEXT;

  PERFORM _credit_wallet_internal(v_referrer, 'PHON', v_reward_text, 'referral_bonus', v_idem);
  SELECT id INTO v_ledger FROM wallet_ledger WHERE idempotency_key = v_idem LIMIT 1;

  UPDATE referrals SET
    state = 'paid',
    qualified_at = NOW(),
    referrer_phon = v_reward_text,
    referrer_ledger_id = v_ledger,
    rewarded_at = NOW()
  WHERE id = v_ref.id;

  INSERT INTO referral_payout_daily (user_id, payout_date, payout_count)
  VALUES (v_referrer, CURRENT_DATE, 1)
  ON CONFLICT (user_id, payout_date) DO UPDATE
    SET payout_count = referral_payout_daily.payout_count + 1;
END;
$$;

REVOKE ALL ON FUNCTION _try_qualify_referral(UUID) FROM PUBLIC, anon, authenticated;

-- ─── rpc_claim_daily_reward ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_claim_daily_reward()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id      UUID := auth.uid();
  v_today        DATE := CURRENT_DATE;
  v_yesterday    DATE := CURRENT_DATE - INTERVAL '1 day';
  v_streak_row   user_streaks%ROWTYPE;
  v_new_streak   INT;
  v_cycle_day    INT;
  v_phon_amount  NUMERIC;
  v_phon_text    TEXT;
  v_idem_key     TEXT := 'daily:' || v_user_id::TEXT || ':' || v_today::TEXT;
  v_ledger_id    UUID;
  v_next_cycle   INT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_claim_daily_reward');

  PERFORM 1 FROM daily_claims WHERE user_id = v_user_id AND claimed_date = v_today;
  IF FOUND THEN
    RETURN (SELECT jsonb_build_object(
      'already_claimed', TRUE,
      'phon_awarded', phon_awarded,
      'streak_day', streak_day,
      'cycle_day', ((streak_day - 1) % 7) + 1
    ) FROM daily_claims WHERE user_id = v_user_id AND claimed_date = v_today);
  END IF;

  SELECT * INTO v_streak_row FROM user_streaks WHERE user_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id) VALUES (v_user_id) ON CONFLICT DO NOTHING;
    SELECT * INTO v_streak_row FROM user_streaks WHERE user_id = v_user_id FOR UPDATE;
  END IF;

  IF v_streak_row.last_claimed_date = v_yesterday THEN
    v_new_streak := v_streak_row.current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  v_cycle_day := ((v_new_streak - 1) % 7) + 1;
  v_phon_amount := _attendance_reward_for_day(v_cycle_day);
  v_phon_text := TO_CHAR(v_phon_amount, 'FM9999990.000000');

  PERFORM _credit_wallet_internal(v_user_id, 'PHON', v_phon_text, 'daily_claim', v_idem_key);
  SELECT id INTO v_ledger_id FROM wallet_ledger WHERE idempotency_key = v_idem_key LIMIT 1;

  INSERT INTO daily_claims (user_id, claimed_date, streak_day, phon_awarded, ledger_entry_id)
  VALUES (v_user_id, v_today, v_new_streak, v_phon_text, v_ledger_id);

  UPDATE user_streaks SET
    current_streak    = v_new_streak,
    longest_streak    = GREATEST(longest_streak, v_new_streak),
    last_claimed_date = v_today,
    total_phon_earned = TO_CHAR(
      TO_NUMBER(COALESCE(NULLIF(total_phon_earned,''),'0'), '9999999.999999') + v_phon_amount,
      'FM9999999.000000'
    )
  WHERE user_id = v_user_id;

  IF v_new_streak = 7 THEN
    PERFORM _grant_mission(v_user_id, 'streak_7_days');
  ELSIF v_new_streak = 30 THEN
    PERFORM _grant_mission(v_user_id, 'streak_30_days');
  END IF;

  PERFORM _try_qualify_referral(v_user_id);

  v_next_cycle := (v_cycle_day % 7) + 1;

  RETURN jsonb_build_object(
    'already_claimed', FALSE,
    'phon_awarded', v_phon_text,
    'streak_day', v_new_streak,
    'cycle_day', v_cycle_day,
    'next_day_preview', TO_CHAR(_attendance_reward_for_day(v_next_cycle), 'FM9999990.000000')
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_claim_daily_reward() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_claim_daily_reward() TO authenticated, service_role;

-- ─── Roulette (UI-aligned 8 slots, multi-spin) ───────────────────────────────
CREATE OR REPLACE FUNCTION _roulette_weighted_index(p_roll INT)
RETURNS INT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_weights INT[] := ARRAY[1800,2000,1500,1200,1200,800,1200,300];
  v_cumulative INT := 0;
  v_idx INT;
BEGIN
  FOR v_idx IN 1..array_length(v_weights, 1) LOOP
    v_cumulative := v_cumulative + v_weights[v_idx];
    IF p_roll < v_cumulative THEN
      RETURN v_idx - 1;
    END IF;
  END LOOP;
  RETURN array_length(v_weights, 1) - 1;
END;
$$;

REVOKE ALL ON FUNCTION _roulette_weighted_index(INT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _roulette_roll_from_seed(
  p_server_seed TEXT,
  p_user_id UUID,
  p_spin_date DATE,
  p_spin_index INT DEFAULT 1
)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sig BYTEA;
  v_f NUMERIC;
BEGIN
  v_sig := extensions.hmac(
    convert_to(p_user_id::TEXT || ':' || p_spin_date::TEXT || ':' || p_spin_index::TEXT, 'UTF8'),
    convert_to(p_server_seed, 'UTF8'),
    'sha256'
  );
  v_f :=
    get_byte(v_sig, 0)::NUMERIC / 256
    + get_byte(v_sig, 1)::NUMERIC / 65536
    + get_byte(v_sig, 2)::NUMERIC / 16777216
    + get_byte(v_sig, 3)::NUMERIC / 4294967296;
  RETURN floor(v_f * 10000)::INT;
END;
$$;

REVOKE ALL ON FUNCTION _roulette_roll_from_seed(TEXT, UUID, DATE, INT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_spin_roulette()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := CURRENT_DATE;
  v_prizes NUMERIC[] := ARRAY[200,100,300,0,500,1000,0,5000];
  v_tier earn_vip_tier;
  v_max INT;
  v_used INT;
  v_spin_index INT;
  v_seed TEXT;
  v_seed_hash TEXT;
  v_roll INT;
  v_prize_idx INT;
  v_phon_amount NUMERIC;
  v_phon_text TEXT;
  v_idem_key TEXT;
  v_ledger_id UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('game');
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_spin_roulette');
  PERFORM _assert_onboarding_consent(v_user_id);

  v_tier := _earn_user_tier(v_user_id);
  v_max := _earn_limit_roulette(v_tier);
  SELECT COUNT(*)::INT INTO v_used FROM roulette_spins
   WHERE user_id = v_user_id AND spun_date = v_today;

  IF v_used >= v_max THEN
    RETURN jsonb_build_object(
      'already_spun', TRUE,
      'quota_exhausted', TRUE,
      'used', v_used,
      'max', v_max,
      'remaining', 0
    );
  END IF;

  v_spin_index := v_used + 1;
  v_seed := encode(extensions.gen_random_bytes(32), 'hex');
  v_seed_hash := encode(extensions.digest(v_seed, 'sha256'), 'hex');
  v_roll := _roulette_roll_from_seed(v_seed, v_user_id, v_today, v_spin_index);
  v_prize_idx := _roulette_weighted_index(v_roll);
  v_phon_amount := v_prizes[v_prize_idx + 1];
  v_phon_text := TO_CHAR(v_phon_amount, 'FM9999990.000000');
  v_idem_key := 'roulette:' || v_user_id::TEXT || ':' || v_today::TEXT || ':' || v_spin_index::TEXT;

  IF v_phon_amount > 0 THEN
    PERFORM _credit_wallet_internal(v_user_id, 'PHON', v_phon_text, 'roulette_spin', v_idem_key);
    SELECT id INTO v_ledger_id FROM wallet_ledger WHERE idempotency_key = v_idem_key LIMIT 1;
  END IF;

  INSERT INTO roulette_spins (
    user_id, spun_date, spin_index, prize_index, phon_awarded,
    server_seed_hash, server_seed, ledger_entry_id
  ) VALUES (
    v_user_id, v_today, v_spin_index, v_prize_idx, v_phon_text,
    v_seed_hash, v_seed, v_ledger_id
  );

  RETURN jsonb_build_object(
    'already_spun', FALSE,
    'prize_index', v_prize_idx,
    'phon_awarded', v_phon_text,
    'seed_hash', v_seed_hash,
    'used', v_spin_index,
    'max', v_max,
    'remaining', GREATEST(v_max - v_spin_index, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_spin_roulette() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_spin_roulette() TO authenticated, service_role;

-- ─── Welcome bonus: pending referral (no immediate full referrer pay) ────────
CREATE OR REPLACE FUNCTION rpc_claim_welcome_bonus(p_idempotency_key TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id         UUID := auth.uid();
  v_base_phon       NUMERIC := 10000;
  v_bonus_phon      NUMERIC := 0;
  v_total_phon      NUMERIC;
  v_total_text      TEXT;
  v_ref_row         referrals%ROWTYPE;
  v_ledger_id       UUID;
  v_idempotency_key TEXT;
  v_pending         NUMERIC;
  v_pending_text    TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;

  PERFORM 1 FROM welcome_bonuses WHERE user_id = v_user_id;
  IF FOUND THEN
    RETURN (SELECT jsonb_build_object(
      'already_claimed', TRUE,
      'phon_awarded', phon_awarded,
      'referral_bonus', referral_bonus
    ) FROM welcome_bonuses WHERE user_id = v_user_id);
  END IF;

  SELECT * INTO v_ref_row FROM referrals WHERE referred_id = v_user_id;
  IF v_ref_row.id IS NOT NULL THEN
    v_bonus_phon := 1000;
  END IF;

  v_total_phon := v_base_phon + v_bonus_phon;
  v_total_text := TO_CHAR(v_total_phon, 'FM9999990.000000');
  v_idempotency_key := COALESCE(p_idempotency_key, 'welcome:' || v_user_id::TEXT);

  PERFORM _credit_wallet_internal(v_user_id, 'PHON', v_total_text, 'welcome_bonus', v_idempotency_key);
  SELECT id INTO v_ledger_id FROM wallet_ledger WHERE idempotency_key = v_idempotency_key LIMIT 1;

  INSERT INTO welcome_bonuses (user_id, phon_awarded, referral_bonus, ledger_entry_id)
  VALUES (v_user_id, v_total_text, TO_CHAR(v_bonus_phon, 'FM9999990.000000'), v_ledger_id);

  IF v_ref_row.id IS NOT NULL AND v_ref_row.state IN ('registered', 'pending') THEN
    SELECT COALESCE(value::NUMERIC, 500) INTO v_pending FROM app_config WHERE key = 'referral_pending_reward_phon';
    v_pending_text := TO_CHAR(v_pending, 'FM9999990.000000');
    UPDATE referrals SET state = 'pending', pending_phon = v_pending_text, referred_phon = TO_CHAR(v_bonus_phon, 'FM9999990.000000')
     WHERE id = v_ref_row.id;
  END IF;

  RETURN jsonb_build_object(
    'already_claimed', FALSE,
    'phon_awarded', v_total_text,
    'referral_bonus', TO_CHAR(v_bonus_phon, 'FM9999990.000000')
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_claim_welcome_bonus(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_claim_welcome_bonus(TEXT) TO authenticated, service_role;

-- ─── Viral tier-scaled quotas ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _viral_quota_max(p_mission viral_mission_code)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_tier earn_vip_tier;
  v_base INT;
BEGIN
  IF p_mission IN ('share_referral_link', 'invite_friend_signup') AND v_user IS NOT NULL THEN
    v_tier := _earn_user_tier(v_user);
    RETURN _earn_limit_viral_share(v_tier);
  END IF;
  SELECT COALESCE(value::INT, 1) INTO v_base FROM app_config WHERE key = 'viral_' || p_mission::TEXT ||
    CASE p_mission
      WHEN 'share_story_template' THEN '_max_per_week'
      WHEN 'affiliate_content_post' THEN '_max_per_month'
      ELSE '_max_per_day'
    END;
  RETURN v_base;
END;
$$;

REVOKE ALL ON FUNCTION _viral_quota_max(viral_mission_code) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _assert_viral_mission_eligible(
  p_user_id UUID,
  p_mission viral_mission_code
)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_streak INT;
  v_min    INT;
BEGIN
  IF p_mission = 'invite_friend_signup' THEN
    IF NOT EXISTS (
      SELECT 1 FROM referrals
       WHERE referrer_id = p_user_id
         AND state IN ('qualified', 'paid')
         AND qualified_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC')
    ) AND NOT EXISTS (
      SELECT 1 FROM referrals
       WHERE referrer_id = p_user_id
         AND state = 'paid'
         AND rewarded_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC')
    ) THEN
      RAISE EXCEPTION 'viral_invite_not_eligible';
    END IF;
  END IF;

  IF p_mission = 'viral_streak_share' THEN
    SELECT COALESCE(value::INT, 7) INTO v_min FROM app_config WHERE key = 'viral_streak_share_min_days';
    SELECT COALESCE(current_streak, 0) INTO v_streak FROM user_streaks WHERE user_id = p_user_id;
    IF COALESCE(v_streak, 0) < v_min THEN
      RAISE EXCEPTION 'viral_streak_not_eligible';
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_viral_mission_eligible(UUID, viral_mission_code) FROM PUBLIC, anon, authenticated;

-- invite_3_friends: qualified count
CREATE OR REPLACE FUNCTION _on_referral_rewarded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT;
BEGIN
  IF NEW.state = 'paid' AND (OLD.state IS DISTINCT FROM 'paid') THEN
    SELECT COUNT(*) INTO v_count FROM referrals
     WHERE referrer_id = NEW.referrer_id AND state = 'paid';
    IF v_count >= 3 THEN
      BEGIN
        PERFORM _grant_mission(NEW.referrer_id, 'invite_3_friends');
      EXCEPTION WHEN OTHERS THEN NULL;
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

-- ─── Repeatable mission helpers ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _repeatable_reward(p_mission repeatable_mission_code)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_mission
    WHEN 'weekly_play5' THEN '2000.000000'
    WHEN 'weekly_win3' THEN '3000.000000'
    WHEN 'weekly_deposit_once' THEN '1500.000000'
    WHEN 'weekly_spin_daily' THEN '1000.000000'
    WHEN 'weekly_login_all' THEN '800.000000'
    WHEN 'social_follow_x' THEN '300.000000'
    WHEN 'social_join_telegram' THEN '300.000000'
    WHEN 'social_share_win' THEN '500.000000'
    WHEN 'social_join_discord' THEN '300.000000'
    WHEN 'tier_reach_silver' THEN '5000.000000'
    WHEN 'tier_reach_gold' THEN '15000.000000'
    WHEN 'tier_fomo_streak' THEN '10000.000000'
    WHEN 'tier_keep_status' THEN '4000.000000'
    WHEN 'daily_today_spin' THEN '200.000000'
    WHEN 'daily_quiz' THEN '200.000000'
    ELSE '0.000000' END;
$$;

REVOKE ALL ON FUNCTION _repeatable_reward(repeatable_mission_code) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _repeatable_week_window()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT to_char(date_trunc('week', NOW() AT TIME ZONE 'UTC'), 'IYYY-"W"IW');
$$;
REVOKE ALL ON FUNCTION _repeatable_week_window() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _repeatable_progress(
  p_user_id UUID,
  p_mission repeatable_mission_code
)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_week_start TIMESTAMPTZ := date_trunc('week', NOW() AT TIME ZONE 'UTC');
BEGIN
  CASE p_mission
    WHEN 'weekly_play5' THEN
      RETURN (SELECT COUNT(*)::INT FROM game_bets WHERE user_id = p_user_id AND settled_at >= v_week_start AND status = 'settled');
    WHEN 'weekly_win3' THEN
      RETURN (SELECT COUNT(*)::INT FROM game_bets WHERE user_id = p_user_id AND settled_at >= v_week_start AND status = 'settled' AND payout::NUMERIC > stake::NUMERIC);
    WHEN 'weekly_deposit_once' THEN
      RETURN (SELECT CASE WHEN EXISTS (
        SELECT 1 FROM wallet_ledger wl
        JOIN wallets w ON w.id = wl.wallet_id
        WHERE w.user_id = p_user_id AND wl.entry_type = 'deposit' AND wl.created_at >= v_week_start
      ) THEN 1 ELSE 0 END);
    WHEN 'weekly_spin_daily' THEN
      RETURN (SELECT COUNT(DISTINCT spun_date)::INT FROM roulette_spins WHERE user_id = p_user_id AND spun_date >= v_week_start::DATE);
    WHEN 'weekly_login_all' THEN
      RETURN (SELECT COUNT(DISTINCT claimed_date)::INT FROM daily_claims WHERE user_id = p_user_id AND claimed_date >= v_week_start::DATE);
    WHEN 'daily_today_spin' THEN
      RETURN (SELECT CASE WHEN EXISTS (
        SELECT 1 FROM roulette_spins WHERE user_id = p_user_id AND spun_date = CURRENT_DATE
      ) THEN 1 ELSE 0 END);
    WHEN 'tier_fomo_streak' THEN
      RETURN COALESCE((SELECT current_streak FROM user_streaks WHERE user_id = p_user_id), 0);
    ELSE
      RETURN 0;
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION _repeatable_progress(UUID, repeatable_mission_code) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _repeatable_target(p_mission repeatable_mission_code)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_mission
    WHEN 'weekly_play5' THEN 5 WHEN 'weekly_win3' THEN 3
    WHEN 'weekly_deposit_once' THEN 1 WHEN 'weekly_spin_daily' THEN 7
    WHEN 'weekly_login_all' THEN 7 WHEN 'daily_today_spin' THEN 1
    WHEN 'tier_fomo_streak' THEN 30
    ELSE 1 END;
$$;

REVOKE ALL ON FUNCTION _repeatable_target(repeatable_mission_code) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _repeatable_is_claimed(
  p_user_id UUID,
  p_mission repeatable_mission_code
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM repeatable_mission_claims
     WHERE user_id = p_user_id
       AND mission = p_mission
       AND window_key LIKE CASE
         WHEN p_mission::TEXT LIKE 'weekly_%' THEN _repeatable_week_window() || '%'
         WHEN p_mission::TEXT LIKE 'social_%' THEN _repeatable_week_window() || '%'
         WHEN p_mission::TEXT LIKE 'tier_%' THEN 'lifetime:%'
         ELSE to_char(CURRENT_DATE, 'YYYY-MM-DD') || '%'
       END
  );
$$;

REVOKE ALL ON FUNCTION _repeatable_is_claimed(UUID, repeatable_mission_code) FROM PUBLIC, anon, authenticated;

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
  ELSIF v_mission LIKE 'social_%' THEN
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

CREATE OR REPLACE FUNCTION rpc_get_repeatable_mission_status(p_lane TEXT DEFAULT 'all')
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_m repeatable_mission_code;
  v_items JSONB := '[]'::JSONB;
  v_progress INT;
  v_target INT;
  v_claimed BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;

  FOREACH v_m IN ARRAY ARRAY[
    'weekly_play5'::repeatable_mission_code, 'weekly_win3', 'weekly_deposit_once',
    'weekly_spin_daily', 'weekly_login_all',
    'social_follow_x', 'social_join_telegram', 'social_share_win', 'social_join_discord',
    'tier_reach_silver', 'tier_reach_gold', 'tier_fomo_streak', 'tier_keep_status',
    'daily_today_spin', 'daily_quiz'
  ] LOOP
    IF p_lane <> 'all' AND NOT (v_m::TEXT LIKE p_lane || '%') THEN
      CONTINUE;
    END IF;
    v_progress := _repeatable_progress(v_user_id, v_m);
    v_target := _repeatable_target(v_m);
    v_claimed := _repeatable_is_claimed(v_user_id, v_m);
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'mission', v_m,
      'progress', v_progress,
      'target', v_target,
      'claimed', v_claimed,
      'claimable', NOT v_claimed AND (v_progress >= v_target OR v_m::TEXT LIKE 'social_%' OR v_m::TEXT LIKE 'tier_reach%'),
      'reward_phon', _repeatable_reward(v_m)
    ));
  END LOOP;

  RETURN jsonb_build_object('ok', TRUE, 'missions', v_items);
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_repeatable_mission_status(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_repeatable_mission_status(TEXT) TO authenticated;

-- ─── rpc_get_earn_hub_status ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_get_earn_hub_status()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_tier earn_vip_tier;
  v_xp BIGINT;
  v_next_xp BIGINT;
  v_att_used INT;
  v_att_max INT;
  v_rou_used INT;
  v_rou_max INT;
  v_ref_payout_used INT;
  v_ref_payout_max INT;
  v_streak INT;
  v_cycle INT;
  v_next_reward NUMERIC;
  v_phon_bal TEXT;
  v_discount INT;
  v_free INT;
  v_usdt_rate NUMERIC;
  v_season earn_seasons%ROWTYPE;
  v_slots_filled INT;
  v_slots_total INT;
  v_global_xp BIGINT;
  v_tiers TEXT[] := ARRAY['bronze','silver','gold','platinum','diamond'];
  v_actions TEXT[] := ARRAY['attendance','roulette','golden_earth_tap','referral_payout','viral_share','daily_quiz'];
  v_matrix JSONB := '[]'::JSONB;
  v_t earn_vip_tier;
  v_i INT;
  v_j INT;
  v_row JSONB;
  v_limits_today JSONB := '[]'::JSONB;
  v_invited INT;
  v_qualified INT;
  v_pending INT;
  v_ge_cap INT;
  v_ge_used INT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;

  v_tier := _earn_user_tier(v_user_id);
  SELECT COALESCE(xp, 0) INTO v_xp FROM user_earn_vip WHERE user_id = v_user_id;
  v_next_xp := CASE v_tier
    WHEN 'bronze' THEN 5000 WHEN 'silver' THEN 25000 WHEN 'gold' THEN 100000
    WHEN 'platinum' THEN 500000 ELSE NULL END;

  v_att_max := _earn_limit_attendance(v_tier);
  v_att_used := (SELECT CASE WHEN EXISTS (SELECT 1 FROM daily_claims WHERE user_id = v_user_id AND claimed_date = CURRENT_DATE) THEN 1 ELSE 0 END);
  v_rou_max := _earn_limit_roulette(v_tier);
  v_rou_used := (SELECT COUNT(*)::INT FROM roulette_spins WHERE user_id = v_user_id AND spun_date = CURRENT_DATE);
  v_ref_payout_max := _earn_limit_referral_payout(v_tier);
  v_ref_payout_used := COALESCE(_referral_payout_used_today(v_user_id), 0);

  SELECT COALESCE(current_streak, 0) INTO v_streak FROM user_streaks WHERE user_id = v_user_id;
  v_cycle := CASE WHEN v_att_used > 0 THEN ((v_streak - 1) % 7) + 1 ELSE (v_streak % 7) + 1 END;
  v_next_reward := _attendance_reward_for_day(v_cycle);

  SELECT phon_available INTO v_phon_bal FROM wallets WHERE user_id = v_user_id;
  SELECT COALESCE(quantity, 0) INTO v_discount FROM user_reward_tickets WHERE user_id = v_user_id AND ticket_type = 'discount_pct';
  SELECT COALESCE(quantity, 0) INTO v_free FROM user_reward_tickets WHERE user_id = v_user_id AND ticket_type = 'free_trade';
  SELECT COALESCE(value::NUMERIC, 0.164) INTO v_usdt_rate FROM app_config WHERE key = 'earn_phon_to_usdt_rate';

  SELECT * INTO v_season FROM earn_seasons WHERE is_active ORDER BY id LIMIT 1;
  SELECT COUNT(*)::INT INTO v_slots_filled FROM welcome_bonuses;
  SELECT COALESCE(value::INT, 1000) INTO v_slots_total FROM app_config WHERE key = 'launch_slots_total';
  SELECT COALESCE(value::BIGINT, 62000) INTO v_global_xp FROM app_config WHERE key = 'earn_season_global_xp';

  SELECT COUNT(*)::INT, COUNT(*) FILTER (WHERE state IN ('qualified','paid'))::INT,
         COUNT(*) FILTER (WHERE state = 'pending')::INT
    INTO v_invited, v_qualified, v_pending
    FROM referrals WHERE referrer_id = v_user_id;

  v_ge_cap := _golden_earth_base_cap(v_tier);
  SELECT COALESCE(tap_count, 0) INTO v_ge_used FROM golden_earth_daily
   WHERE user_id = v_user_id AND kst_date = (NOW() AT TIME ZONE 'Asia/Seoul')::DATE;

  FOR v_i IN 0..4 LOOP
    v_t := v_tiers[v_i + 1]::earn_vip_tier;
    v_row := jsonb_build_array(
      _earn_limit_attendance(v_t),
      _earn_limit_roulette(v_t),
      _golden_earth_base_cap(v_t),
      _earn_limit_referral_payout(v_t),
      _earn_limit_viral_share(v_t),
      _earn_limit_daily_quiz(v_t)
    );
    v_matrix := v_matrix || jsonb_build_array(v_row);
  END LOOP;

  v_limits_today := jsonb_build_array(
    jsonb_build_object('action','attendance','label_key','earn.limits.action.attendance',
      'used', v_att_used, 'max', v_att_max, 'remaining', GREATEST(v_att_max - v_att_used, 0),
      'resets_at', _earn_kst_midnight_utc()),
    jsonb_build_object('action','roulette','label_key','earn.limits.action.roulette',
      'used', v_rou_used, 'max', v_rou_max, 'remaining', GREATEST(v_rou_max - v_rou_used, 0),
      'resets_at', _earn_kst_midnight_utc()),
    jsonb_build_object('action','referral_payout','label_key','earn.limits.action.referralPayout',
      'used', v_ref_payout_used, 'max', v_ref_payout_max,
      'remaining', GREATEST(v_ref_payout_max - v_ref_payout_used, 0),
      'resets_at', _earn_kst_midnight_utc()),
    jsonb_build_object('action','golden_earth_tap','label_key','earn.limits.action.goldenEarthTap',
      'used', v_ge_used, 'max', v_ge_cap, 'remaining', GREATEST(v_ge_cap - v_ge_used, 0),
      'resets_at', _earn_kst_midnight_utc())
  );

  RETURN jsonb_build_object(
    'tier', v_tier,
    'tier_label_key', 'earn.tier.' || v_tier::TEXT,
    'xp', v_xp,
    'next_tier_xp', v_next_xp,
    'attendance', jsonb_build_object(
      'used', v_att_used, 'max', v_att_max, 'remaining', GREATEST(v_att_max - v_att_used, 0),
      'cycle_day', v_cycle, 'next_reward_phon', TO_CHAR(v_next_reward, 'FM9999990.000000'),
      'resets_at', _earn_kst_midnight_utc()),
    'roulette', jsonb_build_object(
      'used', v_rou_used, 'max', v_rou_max, 'remaining', GREATEST(v_rou_max - v_rou_used, 0),
      'resets_at', _earn_kst_midnight_utc()),
    'referral', jsonb_build_object(
      'share_unlimited', TRUE,
      'total_invited', v_invited,
      'qualified_total', v_qualified,
      'pending_review', v_pending,
      'payout_today', jsonb_build_object(
        'used', v_ref_payout_used, 'max', v_ref_payout_max,
        'remaining', GREATEST(v_ref_payout_max - v_ref_payout_used, 0)),
      'per_friend_bonus_multiplier', TO_CHAR(_earn_referral_multiplier(v_tier), 'FM0.00')),
    'season', jsonb_build_object(
      'id', COALESCE(v_season.id, 1),
      'percent', LEAST(100, (v_global_xp * 100 / NULLIF(COALESCE(v_season.goal_xp, 100000), 0))::INT),
      'days_left', GREATEST(0, EXTRACT(DAY FROM COALESCE(v_season.ends_at, NOW() + INTERVAL '9 days') - NOW())::INT)),
    'launch_slots', jsonb_build_object('filled', v_slots_filled, 'total', v_slots_total),
    'wallet', jsonb_build_object(
      'phon_balance', COALESCE(v_phon_bal, '0.000000'),
      'discount_tickets', v_discount,
      'free_trade_tickets', v_free,
      'usdt_estimate', TO_CHAR(COALESCE(v_phon_bal, '0')::NUMERIC * v_usdt_rate, 'FM9990.00')),
    'cooldown', jsonb_build_object('active', FALSE, 'retry_at', NULL, 'reason_key', NULL),
    'limits_today', v_limits_today,
    'limits_matrix', jsonb_build_object(
      'actions', to_jsonb(v_actions),
      'tiers', to_jsonb(v_tiers),
      'max_per_day', v_matrix,
      'current_tier_index', _earn_tier_index(v_tier),
      'multipliers', jsonb_build_array(1.0, 1.1, 1.25, 1.5, 2.0)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_earn_hub_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_earn_hub_status() TO authenticated;

CREATE OR REPLACE FUNCTION rpc_get_earn_activity_feed(p_limit INT DEFAULT 20)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_items JSONB;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  p_limit := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);

  SELECT COALESCE(jsonb_agg(row ORDER BY sort_at DESC), '[]'::JSONB) INTO v_items
  FROM (
    SELECT jsonb_build_object(
      'kind', 'daily_claim', 'amount_phon', dc.phon_awarded, 'at', dc.created_at
    ) AS row, dc.created_at AS sort_at
    FROM daily_claims dc WHERE dc.user_id = v_user_id
    UNION ALL
    SELECT jsonb_build_object(
      'kind', 'roulette', 'amount_phon', rs.phon_awarded, 'at', rs.created_at
    ), rs.created_at FROM roulette_spins rs WHERE rs.user_id = v_user_id
    UNION ALL
    SELECT jsonb_build_object(
      'kind', 'viral_mission', 'amount_phon', vmc.phon_awarded, 'at', vmc.claimed_at
    ), vmc.claimed_at FROM viral_mission_claims vmc WHERE vmc.user_id = v_user_id
    ORDER BY sort_at DESC
    LIMIT p_limit
  ) sub;

  RETURN jsonb_build_object('ok', TRUE, 'items', v_items);
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_earn_activity_feed(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_earn_activity_feed(INT) TO authenticated;

-- ─── RLS + GRANTs ────────────────────────────────────────────────────────────
ALTER TABLE earn_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE repeatable_mission_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reward_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_payout_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "earn_seasons: public read" ON earn_seasons;
CREATE POLICY "earn_seasons: public read" ON earn_seasons FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "rmc: own read" ON repeatable_mission_claims;
CREATE POLICY "rmc: own read" ON repeatable_mission_claims FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tickets: own read" ON user_reward_tickets;
CREATE POLICY "tickets: own read" ON user_reward_tickets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "rpd: own read" ON referral_payout_daily;
CREATE POLICY "rpd: own read" ON referral_payout_daily FOR SELECT USING (auth.uid() = user_id);

REVOKE ALL ON TABLE earn_seasons FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE earn_seasons TO anon, authenticated;

REVOKE ALL ON TABLE repeatable_mission_claims FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE repeatable_mission_claims TO authenticated;

REVOKE ALL ON TABLE user_reward_tickets FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE user_reward_tickets TO authenticated;

REVOKE ALL ON TABLE referral_payout_daily FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE referral_payout_daily TO authenticated;

-- Update viral rewards in config
UPDATE app_config SET value = '300' WHERE key = 'viral_share_referral_link_reward_phon';
UPDATE app_config SET value = '10000' WHERE key = 'viral_invite_friend_signup_reward_phon';

-- Tier multi-spin is enforced inside rpc_spin_roulette; relax the legacy 1/day token bucket.
UPDATE rpc_rate_limit_configs
   SET capacity = 10, refill_rate = 0.5, cost = 1, window_sec = 60
 WHERE rpc_name = 'rpc_spin_roulette';
