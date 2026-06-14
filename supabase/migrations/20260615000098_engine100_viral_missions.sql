-- ============================================================
-- ENGINE 100 — viral mission RPCs (quota + conservation)
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Separate enum (do not extend mission_code) ────────────────────────────────
DO $$ BEGIN
  CREATE TYPE viral_mission_code AS ENUM (
    'share_referral_link',
    'share_story_template',
    'invite_friend_signup',
    'affiliate_content_post',
    'viral_streak_share'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Config: rewards + quotas ────────────────────────────────────────────────
INSERT INTO app_config (key, value, description) VALUES
  ('viral_share_referral_link_reward_phon', '25', 'PHON reward for share_referral_link claim.'),
  ('viral_share_referral_link_max_per_day', '3', 'Max share_referral_link claims per UTC day.'),
  ('viral_share_story_template_reward_phon', '50', 'PHON reward for share_story_template claim.'),
  ('viral_share_story_template_max_per_week', '2', 'Max share_story_template claims per UTC week.'),
  ('viral_invite_friend_signup_reward_phon', '100', 'PHON reward for invite_friend_signup claim.'),
  ('viral_invite_friend_signup_max_per_day', '5', 'Max invite_friend_signup claims per UTC day.'),
  ('viral_affiliate_content_post_reward_phon', '200', 'PHON reward for affiliate_content_post claim.'),
  ('viral_affiliate_content_post_max_per_month', '1', 'Max affiliate_content_post claims per UTC month.'),
  ('viral_streak_share_reward_phon', '75', 'PHON reward for viral_streak_share claim.'),
  ('viral_streak_share_min_days', '7', 'Minimum login streak days for viral_streak_share.'),
  ('viral_streak_share_max_per_day', '1', 'Max viral_streak_share claims per UTC day.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('rpc_claim_viral_mission', 10, 0.2, 1, 60)
ON CONFLICT (rpc_name) DO NOTHING;

-- ─── Append-only claim log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS viral_mission_claims (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  mission          viral_mission_code NOT NULL,
  window_key       TEXT NOT NULL,
  phon_awarded     TEXT NOT NULL DEFAULT '0.000000',
  ledger_entry_id  UUID REFERENCES wallet_ledger(id),
  client_request_id TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}'::JSONB,
  claimed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, mission, window_key)
);

CREATE INDEX IF NOT EXISTS vmc_user_mission_idx ON viral_mission_claims (user_id, mission, claimed_at DESC);

ALTER TABLE viral_mission_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "viral_mission_claims: own read" ON viral_mission_claims;
CREATE POLICY "viral_mission_claims: own read" ON viral_mission_claims
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "viral_mission_claims: admin rw" ON viral_mission_claims;
CREATE POLICY "viral_mission_claims: admin rw" ON viral_mission_claims
  FOR ALL USING (_is_admin());

-- ─── Reward classifier extension ───────────────────────────────────────────────
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
    'viral_mission_reward',
    'staking_reward'
  );
$$;

REVOKE ALL ON FUNCTION _is_reward_issuance_reason(TEXT) FROM PUBLIC, anon, authenticated;

-- ─── Internal helpers ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _viral_mission_reward(p_mission viral_mission_code)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT value FROM app_config WHERE key = 'viral_' || p_mission::TEXT || '_reward_phon'),
    '0'
  );
$$;

REVOKE ALL ON FUNCTION _viral_mission_reward(viral_mission_code) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _viral_quota_window_key(p_mission viral_mission_code)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW() AT TIME ZONE 'UTC';
BEGIN
  RETURN CASE p_mission
    WHEN 'share_referral_link' THEN 'day:' || to_char(v_now, 'YYYY-MM-DD')
    WHEN 'invite_friend_signup' THEN 'day:' || to_char(v_now, 'YYYY-MM-DD')
    WHEN 'viral_streak_share' THEN 'day:' || to_char(v_now, 'YYYY-MM-DD')
    WHEN 'share_story_template' THEN 'week:' || to_char(v_now, 'IYYY-IW')
    WHEN 'affiliate_content_post' THEN 'month:' || to_char(v_now, 'YYYY-MM')
  END;
END;
$$;

REVOKE ALL ON FUNCTION _viral_quota_window_key(viral_mission_code) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _viral_quota_max(p_mission viral_mission_code)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT value::INT FROM app_config WHERE key = 'viral_' || p_mission::TEXT ||
      CASE p_mission
        WHEN 'share_referral_link' THEN '_max_per_day'
        WHEN 'invite_friend_signup' THEN '_max_per_day'
        WHEN 'viral_streak_share' THEN '_max_per_day'
        WHEN 'share_story_template' THEN '_max_per_week'
        WHEN 'affiliate_content_post' THEN '_max_per_month'
      END),
    1
  );
$$;

REVOKE ALL ON FUNCTION _viral_quota_max(viral_mission_code) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _viral_quota_used(p_user_id UUID, p_mission viral_mission_code)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT count(*)::INT
    FROM viral_mission_claims
   WHERE user_id = p_user_id
     AND mission = p_mission
     AND window_key LIKE split_part(_viral_quota_window_key(p_mission), ':', 1) || ':%';
$$;

REVOKE ALL ON FUNCTION _viral_quota_used(UUID, viral_mission_code) FROM PUBLIC, anon, authenticated;

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
         AND created_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC')
    ) THEN
      RAISE EXCEPTION 'viral_invite_not_eligible';
    END IF;
  END IF;

  IF p_mission = 'viral_streak_share' THEN
    SELECT COALESCE(value::INT, 7) INTO v_min FROM app_config WHERE key = 'viral_streak_share_min_days';
    SELECT COALESCE(current_streak, 0) INTO v_streak
      FROM user_streaks WHERE user_id = p_user_id;
    IF COALESCE(v_streak, 0) < v_min THEN
      RAISE EXCEPTION 'viral_streak_not_eligible';
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_viral_mission_eligible(UUID, viral_mission_code)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _grant_viral_mission(
  p_user_id UUID,
  p_mission viral_mission_code,
  p_window_key TEXT,
  p_client_request_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reward    TEXT;
  v_idem      TEXT;
  v_ledger_id UUID;
  v_claim_id  UUID;
BEGIN
  v_reward := _viral_mission_reward(p_mission);
  IF v_reward IS NULL OR v_reward::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'viral_reward_unconfigured';
  END IF;

  v_idem := 'viral:' || p_user_id::TEXT || ':' || p_mission::TEXT || ':' || p_window_key;

  SELECT id INTO v_claim_id FROM viral_mission_claims
   WHERE user_id = p_user_id AND mission = p_mission AND window_key = p_window_key;
  IF FOUND THEN
    RETURN v_claim_id;
  END IF;

  v_ledger_id := _credit_wallet_internal(
    p_user_id, 'PHON', v_reward, 'viral_mission_reward', v_idem
  );

  INSERT INTO viral_mission_claims (
    user_id, mission, window_key, phon_awarded, ledger_entry_id,
    client_request_id, metadata
  ) VALUES (
    p_user_id, p_mission, p_window_key, v_reward, v_ledger_id,
    p_client_request_id, p_metadata
  ) RETURNING id INTO v_claim_id;

  RETURN v_claim_id;
END;
$$;

REVOKE ALL ON FUNCTION _grant_viral_mission(UUID, viral_mission_code, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;

-- ─── Client RPCs ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_claim_viral_mission(
  p_mission TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_mission    viral_mission_code;
  v_window     TEXT;
  v_used       INT;
  v_max        INT;
  v_slot       INT;
  v_window_key TEXT;
  v_claim_id   UUID;
  v_reward     TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  PERFORM _assert_system_live();
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_claim_viral_mission');

  BEGIN
    v_mission := p_mission::viral_mission_code;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_viral_mission';
  END;

  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_user_id, p_client_request_id, 'rpc_claim_viral_mission')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'duplicate_request';
    END IF;
  END IF;

  PERFORM _assert_viral_mission_eligible(v_user_id, v_mission);

  v_window := _viral_quota_window_key(v_mission);
  v_used := _viral_quota_used(v_user_id, v_mission);
  v_max := _viral_quota_max(v_mission);

  IF v_used >= v_max THEN
    RAISE EXCEPTION 'viral_quota_exhausted';
  END IF;

  v_slot := v_used + 1;
  v_window_key := v_window || ':' || v_slot::TEXT;

  v_claim_id := _grant_viral_mission(
    v_user_id, v_mission, v_window_key, p_client_request_id,
    jsonb_build_object('slot', v_slot, 'window', v_window)
  );

  v_reward := _viral_mission_reward(v_mission);

  RETURN jsonb_build_object(
    'ok', TRUE,
    'claim_id', v_claim_id,
    'mission', v_mission,
    'phon_awarded', v_reward,
    'used', v_used + 1,
    'max', v_max,
    'window_key', v_window_key
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_claim_viral_mission(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_claim_viral_mission(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION rpc_get_viral_mission_status()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_m       viral_mission_code;
  v_items   JSONB := '[]'::JSONB;
  v_used    INT;
  v_max     INT;
  v_streak  INT;
  v_min     INT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  FOREACH v_m IN ARRAY ARRAY[
    'share_referral_link'::viral_mission_code,
    'share_story_template',
    'invite_friend_signup',
    'affiliate_content_post',
    'viral_streak_share'
  ] LOOP
    v_used := _viral_quota_used(v_user_id, v_m);
    v_max := _viral_quota_max(v_m);
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'mission', v_m,
      'used', v_used,
      'max', v_max,
      'remaining', GREATEST(v_max - v_used, 0),
      'window', _viral_quota_window_key(v_m),
      'reward_phon', _viral_mission_reward(v_m)
    ));
  END LOOP;

  SELECT COALESCE(current_streak, 0) INTO v_streak FROM user_streaks WHERE user_id = v_user_id;
  SELECT COALESCE(value::INT, 7) INTO v_min FROM app_config WHERE key = 'viral_streak_share_min_days';

  RETURN jsonb_build_object(
    'ok', TRUE,
    'missions', v_items,
    'streak_days', COALESCE(v_streak, 0),
    'streak_target_days', v_min
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_viral_mission_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_viral_mission_status() TO authenticated;

-- ─── Table GRANTs ──────────────────────────────────────────────────────────────
REVOKE ALL ON TABLE viral_mission_claims FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE viral_mission_claims TO authenticated;
