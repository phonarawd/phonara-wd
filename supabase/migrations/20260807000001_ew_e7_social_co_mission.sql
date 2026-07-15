-- ============================================================
-- Migration: ew_e7_social_co_mission
-- E7 Social — co-mission + whale deposit threshold
-- Plan: ew-e7-social-wave (#252) · ADR-014
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Enums ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE co_mission_code AS ENUM ('co_share_referral');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE whale_mission_code AS ENUM ('whale_deposit_1m');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Config ──────────────────────────────────────────────────────────────────

INSERT INTO app_config (key, value, description) VALUES
  ('co_share_referral_reward_phon', '50.000000',
   'PHON reward per participant when co_share_referral completes.'),
  ('whale_deposit_1m_threshold_phon', '1000000.000000',
   'Lifetime PHON from krw_deposit_credit required for whale_deposit_1m.'),
  ('whale_deposit_1m_reward_phon', '10000.000000',
   'PHON reward for whale_deposit_1m one-shot claim.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('rpc_invite_co_mission', 10, 0.2, 1, 60),
  ('rpc_accept_co_mission', 10, 0.2, 1, 60),
  ('rpc_complete_co_mission', 10, 0.2, 1, 60),
  ('rpc_claim_whale_mission', 5, 0.1, 1, 60)
ON CONFLICT (rpc_name) DO NOTHING;

-- ─── Reward issuance whitelist (extend) ──────────────────────────────────────

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
    'golden_earth_tier_upgrade',
    'co_mission_reward',
    'whale_mission_reward'
  );
$$;

REVOKE ALL ON FUNCTION _is_reward_issuance_reason(TEXT)
  FROM PUBLIC, anon, authenticated;

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS co_mission_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission             co_mission_code NOT NULL,
  initiator_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  partner_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  window_key          TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'expired')),
  initiator_ready_at  TIMESTAMPTZ,
  partner_ready_at    TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT co_mission_sessions_distinct_users CHECK (initiator_id <> partner_id),
  CONSTRAINT co_mission_sessions_pair_window_uq
    UNIQUE (initiator_id, partner_id, mission, window_key)
);

CREATE INDEX IF NOT EXISTS co_mission_sessions_initiator_idx
  ON co_mission_sessions (initiator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS co_mission_sessions_partner_idx
  ON co_mission_sessions (partner_id, created_at DESC);

ALTER TABLE co_mission_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "co_mission_sessions: participant select" ON co_mission_sessions;
CREATE POLICY "co_mission_sessions: participant select" ON co_mission_sessions
  FOR SELECT USING (auth.uid() = initiator_id OR auth.uid() = partner_id);

DROP POLICY IF EXISTS "co_mission_sessions: admin select" ON co_mission_sessions;
CREATE POLICY "co_mission_sessions: admin select" ON co_mission_sessions
  FOR SELECT USING (_is_admin());

REVOKE ALL ON TABLE co_mission_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE co_mission_sessions TO authenticated;
GRANT ALL ON TABLE co_mission_sessions TO service_role;

CREATE TABLE IF NOT EXISTS co_mission_claims (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES co_mission_sessions(id) ON DELETE RESTRICT,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  mission          co_mission_code NOT NULL,
  window_key       TEXT NOT NULL,
  phon_awarded     TEXT NOT NULL DEFAULT '0.000000',
  ledger_entry_id  UUID REFERENCES wallet_ledger(id),
  claimed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, mission, window_key)
);

CREATE INDEX IF NOT EXISTS co_mission_claims_user_idx
  ON co_mission_claims (user_id, claimed_at DESC);

ALTER TABLE co_mission_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "co_mission_claims: own select" ON co_mission_claims;
CREATE POLICY "co_mission_claims: own select" ON co_mission_claims
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "co_mission_claims: admin select" ON co_mission_claims;
CREATE POLICY "co_mission_claims: admin select" ON co_mission_claims
  FOR SELECT USING (_is_admin());

REVOKE ALL ON TABLE co_mission_claims FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE co_mission_claims TO authenticated;
GRANT ALL ON TABLE co_mission_claims TO service_role;

CREATE TABLE IF NOT EXISTS whale_mission_claims (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  mission          whale_mission_code NOT NULL,
  phon_awarded     TEXT NOT NULL DEFAULT '0.000000',
  deposit_phon     TEXT NOT NULL DEFAULT '0.000000',
  ledger_entry_id  UUID REFERENCES wallet_ledger(id),
  client_request_id TEXT,
  claimed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, mission)
);

CREATE INDEX IF NOT EXISTS whale_mission_claims_user_idx
  ON whale_mission_claims (user_id, claimed_at DESC);

ALTER TABLE whale_mission_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whale_mission_claims: own select" ON whale_mission_claims;
CREATE POLICY "whale_mission_claims: own select" ON whale_mission_claims
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "whale_mission_claims: admin select" ON whale_mission_claims;
CREATE POLICY "whale_mission_claims: admin select" ON whale_mission_claims
  FOR SELECT USING (_is_admin());

REVOKE ALL ON TABLE whale_mission_claims FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE whale_mission_claims TO authenticated;
GRANT ALL ON TABLE whale_mission_claims TO service_role;

-- ─── Helpers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _co_mission_day_window()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT 'day:' || to_char((NOW() AT TIME ZONE 'UTC'), 'YYYY-MM-DD');
$$;

REVOKE ALL ON FUNCTION _co_mission_day_window()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _co_mission_partners_linked(p_a UUID, p_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM affiliate_relationships
     WHERE (child_id = p_a AND parent_id = p_b)
        OR (child_id = p_b AND parent_id = p_a)
  );
$$;

REVOKE ALL ON FUNCTION _co_mission_partners_linked(UUID, UUID)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _co_mission_reward(p_mission co_mission_code)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT value FROM app_config WHERE key = p_mission::TEXT || '_reward_phon'),
    '0'
  );
$$;

REVOKE ALL ON FUNCTION _co_mission_reward(co_mission_code)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _co_mission_share_eligible(p_user_id UUID, p_window TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM viral_mission_claims
     WHERE user_id = p_user_id
       AND mission = 'share_referral_link'::viral_mission_code
       AND window_key LIKE p_window || ':%'
  );
$$;

REVOKE ALL ON FUNCTION _co_mission_share_eligible(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _grant_co_mission_claim(
  p_session_id UUID,
  p_user_id UUID,
  p_mission co_mission_code,
  p_window_key TEXT
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
  SELECT id INTO v_claim_id
    FROM co_mission_claims
   WHERE user_id = p_user_id AND mission = p_mission AND window_key = p_window_key;
  IF FOUND THEN
    RETURN v_claim_id;
  END IF;

  v_reward := _co_mission_reward(p_mission);
  IF v_reward IS NULL OR v_reward::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'co_mission_reward_unconfigured';
  END IF;

  v_idem := 'co:' || p_session_id::TEXT || ':' || p_user_id::TEXT;
  v_ledger_id := _credit_wallet_internal(
    p_user_id, 'PHON', v_reward, 'co_mission_reward', v_idem
  );

  INSERT INTO co_mission_claims (
    session_id, user_id, mission, window_key, phon_awarded, ledger_entry_id
  ) VALUES (
    p_session_id, p_user_id, p_mission, p_window_key, v_reward, v_ledger_id
  )
  RETURNING id INTO v_claim_id;

  RETURN v_claim_id;
END;
$$;

REVOKE ALL ON FUNCTION _grant_co_mission_claim(UUID, UUID, co_mission_code, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _whale_lifetime_deposit_phon(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(SUM(amount::NUMERIC), 0)
    FROM wallet_ledger
   WHERE user_id = p_user_id
     AND currency = 'PHON'
     AND direction = 'credit'
     AND reason_code = 'krw_deposit_credit';
$$;

REVOKE ALL ON FUNCTION _whale_lifetime_deposit_phon(UUID)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _whale_mission_threshold(p_mission whale_mission_code)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT value FROM app_config WHERE key = p_mission::TEXT || '_threshold_phon'),
    '0'
  );
$$;

REVOKE ALL ON FUNCTION _whale_mission_threshold(whale_mission_code)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _whale_mission_reward(p_mission whale_mission_code)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT value FROM app_config WHERE key = p_mission::TEXT || '_reward_phon'),
    '0'
  );
$$;

REVOKE ALL ON FUNCTION _whale_mission_reward(whale_mission_code)
  FROM PUBLIC, anon, authenticated;

-- ─── Client RPCs — co-mission ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_invite_co_mission(
  p_mission TEXT,
  p_partner_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_mission co_mission_code;
  v_window  TEXT;
  v_session co_mission_sessions%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF p_partner_id IS NULL THEN RAISE EXCEPTION 'co_mission_partner_required'; END IF;
  IF p_partner_id = v_user_id THEN RAISE EXCEPTION 'co_mission_self_forbidden'; END IF;

  PERFORM _assert_system_live();
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_invite_co_mission');

  BEGIN
    v_mission := p_mission::co_mission_code;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_co_mission';
  END;

  IF NOT _co_mission_partners_linked(v_user_id, p_partner_id) THEN
    RAISE EXCEPTION 'co_mission_not_linked';
  END IF;

  v_window := _co_mission_day_window();

  -- Reverse pair same window → reject (one social edge per day)
  IF EXISTS (
    SELECT 1 FROM co_mission_sessions
     WHERE initiator_id = p_partner_id
       AND partner_id = v_user_id
       AND mission = v_mission
       AND window_key = v_window
       AND status IN ('pending', 'active', 'completed')
  ) THEN
    RAISE EXCEPTION 'co_mission_pair_exists';
  END IF;

  SELECT * INTO v_session
    FROM co_mission_sessions
   WHERE initiator_id = v_user_id
     AND partner_id = p_partner_id
     AND mission = v_mission
     AND window_key = v_window;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'session_id', v_session.id,
      'mission', v_session.mission,
      'status', v_session.status,
      'window_key', v_session.window_key,
      'partner_id', v_session.partner_id,
      'already_exists', TRUE
    );
  END IF;

  INSERT INTO co_mission_sessions (
    mission, initiator_id, partner_id, window_key, status
  ) VALUES (
    v_mission, v_user_id, p_partner_id, v_window, 'pending'
  )
  RETURNING * INTO v_session;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'session_id', v_session.id,
    'mission', v_session.mission,
    'status', v_session.status,
    'window_key', v_session.window_key,
    'partner_id', v_session.partner_id
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_invite_co_mission(TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_invite_co_mission(TEXT, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION rpc_accept_co_mission(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session co_mission_sessions%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF p_session_id IS NULL THEN RAISE EXCEPTION 'co_mission_session_required'; END IF;

  PERFORM _assert_system_live();
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_accept_co_mission');

  SELECT * INTO v_session
    FROM co_mission_sessions
   WHERE id = p_session_id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'co_mission_not_found'; END IF;
  IF v_session.partner_id <> v_user_id THEN RAISE EXCEPTION 'co_mission_not_partner'; END IF;
  IF v_session.status = 'active' THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'session_id', v_session.id,
      'status', v_session.status
    );
  END IF;
  IF v_session.status <> 'pending' THEN
    RAISE EXCEPTION 'co_mission_not_pending';
  END IF;

  UPDATE co_mission_sessions
     SET status = 'active', updated_at = NOW()
   WHERE id = p_session_id
   RETURNING * INTO v_session;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'session_id', v_session.id,
    'mission', v_session.mission,
    'status', v_session.status,
    'window_key', v_session.window_key
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_accept_co_mission(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_accept_co_mission(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION rpc_complete_co_mission(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session co_mission_sessions%ROWTYPE;
  v_init_claim UUID;
  v_part_claim UUID;
  v_reward TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF p_session_id IS NULL THEN RAISE EXCEPTION 'co_mission_session_required'; END IF;

  PERFORM _assert_system_live();
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_complete_co_mission');

  SELECT * INTO v_session
    FROM co_mission_sessions
   WHERE id = p_session_id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'co_mission_not_found'; END IF;
  IF v_user_id <> v_session.initiator_id AND v_user_id <> v_session.partner_id THEN
    RAISE EXCEPTION 'co_mission_forbidden';
  END IF;
  IF v_session.status = 'completed' THEN
    v_reward := _co_mission_reward(v_session.mission);
    RETURN jsonb_build_object(
      'ok', TRUE,
      'session_id', v_session.id,
      'status', 'completed',
      'already_completed', TRUE,
      'phon_awarded', v_reward
    );
  END IF;
  IF v_session.status <> 'active' THEN
    RAISE EXCEPTION 'co_mission_not_active';
  END IF;

  IF v_user_id = v_session.initiator_id THEN
    UPDATE co_mission_sessions
       SET initiator_ready_at = COALESCE(initiator_ready_at, NOW()),
           updated_at = NOW()
     WHERE id = p_session_id
     RETURNING * INTO v_session;
  ELSE
    UPDATE co_mission_sessions
       SET partner_ready_at = COALESCE(partner_ready_at, NOW()),
           updated_at = NOW()
     WHERE id = p_session_id
     RETURNING * INTO v_session;
  END IF;

  IF v_session.initiator_ready_at IS NULL OR v_session.partner_ready_at IS NULL THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'session_id', v_session.id,
      'status', 'active',
      'waiting_partner', TRUE,
      'initiator_ready', v_session.initiator_ready_at IS NOT NULL,
      'partner_ready', v_session.partner_ready_at IS NOT NULL
    );
  END IF;

  -- Both ready — eligibility (co_share_referral)
  IF v_session.mission = 'co_share_referral' THEN
    IF NOT _co_mission_share_eligible(v_session.initiator_id, v_session.window_key) THEN
      RAISE EXCEPTION 'co_mission_initiator_not_eligible';
    END IF;
    IF NOT _co_mission_share_eligible(v_session.partner_id, v_session.window_key) THEN
      RAISE EXCEPTION 'co_mission_partner_not_eligible';
    END IF;
  END IF;

  v_init_claim := _grant_co_mission_claim(
    v_session.id, v_session.initiator_id, v_session.mission, v_session.window_key
  );
  v_part_claim := _grant_co_mission_claim(
    v_session.id, v_session.partner_id, v_session.mission, v_session.window_key
  );

  UPDATE co_mission_sessions
     SET status = 'completed',
         completed_at = NOW(),
         updated_at = NOW()
   WHERE id = p_session_id
   RETURNING * INTO v_session;

  v_reward := _co_mission_reward(v_session.mission);

  RETURN jsonb_build_object(
    'ok', TRUE,
    'session_id', v_session.id,
    'status', 'completed',
    'phon_awarded', v_reward,
    'initiator_claim_id', v_init_claim,
    'partner_claim_id', v_part_claim
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_complete_co_mission(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_complete_co_mission(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION rpc_get_co_mission_status()
RETURNS SETOF JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  RETURN QUERY
  SELECT jsonb_build_object(
    'session_id', s.id,
    'mission', s.mission,
    'status', s.status,
    'window_key', s.window_key,
    'initiator_id', s.initiator_id,
    'partner_id', s.partner_id,
    'role', CASE WHEN s.initiator_id = v_user_id THEN 'initiator' ELSE 'partner' END,
    'initiator_ready', s.initiator_ready_at IS NOT NULL,
    'partner_ready', s.partner_ready_at IS NOT NULL,
    'completed_at', s.completed_at,
    'reward_phon', _co_mission_reward(s.mission),
    'share_eligible', _co_mission_share_eligible(v_user_id, s.window_key)
  )
  FROM co_mission_sessions s
  WHERE s.initiator_id = v_user_id OR s.partner_id = v_user_id
  ORDER BY s.created_at DESC
  LIMIT 50;
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_co_mission_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_co_mission_status() TO authenticated;

-- ─── Client RPCs — whale ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_claim_whale_mission(
  p_mission TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id   UUID := auth.uid();
  v_mission   whale_mission_code;
  v_threshold TEXT;
  v_deposited NUMERIC;
  v_reward    TEXT;
  v_idem      TEXT;
  v_ledger_id UUID;
  v_claim_id  UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  PERFORM _assert_system_live();
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_claim_whale_mission');

  BEGIN
    v_mission := p_mission::whale_mission_code;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_whale_mission';
  END;

  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_user_id, p_client_request_id, 'rpc_claim_whale_mission')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'duplicate_request';
    END IF;
  END IF;

  SELECT id INTO v_claim_id
    FROM whale_mission_claims
   WHERE user_id = v_user_id AND mission = v_mission;
  IF FOUND THEN
    RAISE EXCEPTION 'whale_mission_already_claimed';
  END IF;

  v_threshold := _whale_mission_threshold(v_mission);
  v_deposited := _whale_lifetime_deposit_phon(v_user_id);
  IF v_deposited < v_threshold::NUMERIC THEN
    RAISE EXCEPTION 'whale_threshold_not_met';
  END IF;

  v_reward := _whale_mission_reward(v_mission);
  IF v_reward IS NULL OR v_reward::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'whale_reward_unconfigured';
  END IF;

  v_idem := 'whale:' || v_user_id::TEXT || ':' || v_mission::TEXT;
  v_ledger_id := _credit_wallet_internal(
    v_user_id, 'PHON', v_reward, 'whale_mission_reward', v_idem
  );

  INSERT INTO whale_mission_claims (
    user_id, mission, phon_awarded, deposit_phon, ledger_entry_id, client_request_id
  ) VALUES (
    v_user_id, v_mission, v_reward,
    TO_CHAR(v_deposited, 'FM9999999990.000000'),
    v_ledger_id, p_client_request_id
  )
  RETURNING id INTO v_claim_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'claim_id', v_claim_id,
    'mission', v_mission,
    'phon_awarded', v_reward,
    'deposit_phon', TO_CHAR(v_deposited, 'FM9999999990.000000'),
    'threshold_phon', v_threshold
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_claim_whale_mission(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_claim_whale_mission(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION rpc_get_whale_mission_status()
RETURNS SETOF JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id   UUID := auth.uid();
  v_mission   whale_mission_code;
  v_deposited NUMERIC;
  v_threshold TEXT;
  v_claimed   BOOLEAN;
  v_claim_id  UUID;
  v_awarded   TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  v_deposited := _whale_lifetime_deposit_phon(v_user_id);

  FOREACH v_mission IN ARRAY ENUM_RANGE(NULL::whale_mission_code)
  LOOP
    v_threshold := _whale_mission_threshold(v_mission);
    SELECT id, phon_awarded INTO v_claim_id, v_awarded
      FROM whale_mission_claims
     WHERE user_id = v_user_id AND mission = v_mission;
    v_claimed := FOUND;

    RETURN NEXT jsonb_build_object(
      'mission', v_mission,
      'threshold_phon', v_threshold,
      'deposit_phon', TO_CHAR(v_deposited, 'FM9999999990.000000'),
      'eligible', v_deposited >= v_threshold::NUMERIC,
      'claimed', v_claimed,
      'claim_id', v_claim_id,
      'reward_phon', _whale_mission_reward(v_mission),
      'phon_awarded', v_awarded
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_whale_mission_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_whale_mission_status() TO authenticated;
