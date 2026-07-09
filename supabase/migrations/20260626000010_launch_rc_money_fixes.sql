-- ============================================================
-- Launch RC Wave 1 — money/DB fixes (H1/H2/M2/M4/M5/L1-L2/E1-E3)
-- ============================================================

SET search_path = public, pg_temp;

-- ─── H1: Admin KRW match — bypass depositor name check ───────────────────────
CREATE OR REPLACE FUNCTION _admin_credit_krw_deposit_internal(
  p_deposit_id UUID,
  p_transfer_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dep    krw_deposit_requests%ROWTYPE;
  v_bit_id UUID;
  v_job_id UUID;
  v_ledger UUID;
BEGIN
  SELECT * INTO v_dep FROM krw_deposit_requests WHERE id = p_deposit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit_not_found'; END IF;
  IF v_dep.status NOT IN ('pending', 'matched') THEN
    RAISE EXCEPTION 'deposit_not_pending';
  END IF;

  INSERT INTO bank_incoming_transfers (transfer_id, amount_krw, depositor_name, reference_code)
  VALUES (p_transfer_id, v_dep.amount_krw, 'admin_override', v_dep.reference_code)
  RETURNING id INTO v_bit_id;

  UPDATE bank_incoming_transfers SET matched_deposit_id = p_deposit_id WHERE id = v_bit_id;
  UPDATE krw_deposit_requests
     SET status = 'matched', matched_at = COALESCE(matched_at, NOW())
   WHERE id = p_deposit_id
     AND status IN ('pending', 'matched');

  v_ledger := _credit_krw_deposit_internal(p_deposit_id, p_transfer_id);

  INSERT INTO deposit_reconciliation_jobs (source, matched_count, exception_count, payload)
  VALUES ('admin_match', 1, 0,
    jsonb_build_object('transfer_id', p_transfer_id, 'deposit_id', p_deposit_id))
  RETURNING id INTO v_job_id;

  UPDATE bank_incoming_transfers SET reconciliation_job_id = v_job_id WHERE id = v_bit_id;

  RETURN jsonb_build_object(
    'ok', TRUE, 'deposit_id', p_deposit_id, 'ledger_id', v_ledger, 'auto_matched', FALSE
  );

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'duplicate_transfer_id' USING HINT = p_transfer_id;
END;
$$;

REVOKE ALL ON FUNCTION _admin_credit_krw_deposit_internal(UUID, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_admin_match_krw_deposit(
  p_deposit_id UUID,
  p_transfer_id TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dep krw_deposit_requests%ROWTYPE;
  v_res JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();
  IF p_reason IS NULL OR length(btrim(p_reason)) < 4 THEN RAISE EXCEPTION 'reason_too_short'; END IF;
  IF p_transfer_id IS NULL OR length(btrim(p_transfer_id)) < 4 THEN RAISE EXCEPTION 'invalid_transfer_id'; END IF;

  SELECT * INTO v_dep FROM krw_deposit_requests WHERE id = p_deposit_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit_not_found'; END IF;

  v_res := _admin_credit_krw_deposit_internal(p_deposit_id, btrim(p_transfer_id));

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (auth.uid(), 'krw_deposit_admin_match', 'krw_deposit_requests', p_deposit_id,
          jsonb_build_object('reason', p_reason, 'transfer_id', p_transfer_id, 'result', v_res));

  RETURN v_res;
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_match_krw_deposit(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_match_krw_deposit(UUID, TEXT, TEXT) TO authenticated, service_role;

-- ─── H2: Staking rewards always PHON; principal unlock uses stake_currency ───
UPDATE staking_pools SET reward_currency = 'PHON' WHERE reward_currency IS DISTINCT FROM 'PHON';

CREATE OR REPLACE FUNCTION rpc_claim_staking_reward(p_position_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pos staking_positions%ROWTYPE;
  v_pool staking_pools%ROWTYPE;
  v_accrued NUMERIC;
  v_claimed NUMERIC;
  v_payable NUMERIC;
  v_elapsed_days NUMERIC;
  v_reward_id UUID := gen_random_uuid();
  v_ledger_id UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_claim_staking_reward');

  SELECT * INTO v_pos FROM staking_positions WHERE id = p_position_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'position_not_found'; END IF;
  IF v_pos.user_id <> v_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_pos.status <> 'active' THEN RAISE EXCEPTION 'not_active'; END IF;

  SELECT * INTO v_pool FROM staking_pools WHERE id = v_pos.pool_id;

  v_elapsed_days := EXTRACT(EPOCH FROM (NOW() - v_pos.staked_at)) / 86400.0;
  v_accrued := v_pos.principal::NUMERIC * v_pos.apr_snapshot::NUMERIC * (v_elapsed_days / 365.0);
  v_claimed := v_pos.reward_claimed::NUMERIC;
  v_payable := v_accrued - v_claimed;

  IF trunc(v_payable, 6) <= 0 THEN
    RETURN jsonb_build_object('claimed', FALSE, 'reason', 'nothing_to_claim', 'reward', '0.000000');
  END IF;

  v_ledger_id := _credit_wallet_internal(v_user_id, 'PHON', _fmt6(v_payable),
    'staking_reward', 'stake_reward:' || v_reward_id::TEXT);

  INSERT INTO staking_rewards (id, staking_position_id, user_id, reward_amount, ledger_entry_id)
  VALUES (v_reward_id, p_position_id, v_user_id, _fmt6(v_payable), v_ledger_id);

  UPDATE staking_positions SET reward_claimed = _fmt6(v_claimed + v_payable) WHERE id = p_position_id;

  RETURN jsonb_build_object('claimed', TRUE, 'reward', _fmt6(v_payable),
    'reward_currency', 'PHON', 'total_claimed', _fmt6(v_claimed + v_payable));
END;
$$;

REVOKE ALL ON FUNCTION rpc_claim_staking_reward(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_claim_staking_reward(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_unstake_phon(p_position_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pos staking_positions%ROWTYPE;
  v_pool staking_pools%ROWTYPE;
  v_accrued NUMERIC;
  v_claimed NUMERIC;
  v_payable NUMERIC;
  v_elapsed_days NUMERIC;
  v_reward_id UUID := gen_random_uuid();
  v_ledger_id UUID;
  v_stake_curr currency;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_unstake_phon');

  SELECT * INTO v_pos FROM staking_positions WHERE id = p_position_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'position_not_found'; END IF;
  IF v_pos.user_id <> v_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_pos.status <> 'active' THEN RAISE EXCEPTION 'not_active'; END IF;

  IF v_pos.lock_days > 0 AND v_pos.unlock_at IS NOT NULL AND NOW() < v_pos.unlock_at THEN
    RAISE EXCEPTION 'still_locked';
  END IF;

  SELECT * INTO v_pool FROM staking_pools WHERE id = v_pos.pool_id;
  v_stake_curr := COALESCE(v_pos.stake_currency, v_pool.stake_currency, 'PHON'::currency);

  v_elapsed_days := EXTRACT(EPOCH FROM (NOW() - v_pos.staked_at)) / 86400.0;
  v_accrued := v_pos.principal::NUMERIC * v_pos.apr_snapshot::NUMERIC * (v_elapsed_days / 365.0);
  v_claimed := v_pos.reward_claimed::NUMERIC;
  v_payable := v_accrued - v_claimed;

  IF trunc(v_payable, 6) > 0 THEN
    v_ledger_id := _credit_wallet_internal(v_user_id, 'PHON', _fmt6(v_payable),
      'staking_reward', 'stake_reward:' || v_reward_id::TEXT);
    INSERT INTO staking_rewards (id, staking_position_id, user_id, reward_amount, ledger_entry_id)
    VALUES (v_reward_id, p_position_id, v_user_id, _fmt6(v_payable), v_ledger_id);
  ELSE
    v_payable := 0;
  END IF;

  PERFORM _unlock_wallet_internal(v_user_id, v_stake_curr, v_pos.principal,
    'staking_unlock', 'stake_unlock:' || p_position_id::TEXT);

  UPDATE staking_positions SET
    status = 'unstaked',
    reward_claimed = _fmt6(v_claimed + v_payable),
    unstaked_at = NOW()
  WHERE id = p_position_id;

  RETURN jsonb_build_object('unstaked', TRUE, 'principal_returned', v_pos.principal,
    'stake_currency', v_stake_curr::TEXT, 'final_reward', _fmt6(v_payable),
    'reward_currency', 'PHON');
END;
$$;

REVOKE ALL ON FUNCTION rpc_unstake_phon(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_unstake_phon(UUID) TO authenticated, service_role;

-- ─── M4: Referral velocity cap (24h qualified count) ─────────────────────────
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
  v_velocity    INT;
  v_velocity_ct INT;
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

  SELECT COALESCE(NULLIF(value, '')::INT, 50) INTO v_velocity
    FROM app_config WHERE key = 'referral_velocity_max_24h';
  SELECT COUNT(*)::INT INTO v_velocity_ct
    FROM referrals
   WHERE referrer_id = v_referrer
     AND qualified_at >= NOW() - INTERVAL '24 hours';
  IF v_velocity_ct >= v_velocity THEN
    UPDATE referrals SET state = 'blocked', blocked_reason = 'referral_velocity_exceeded'
     WHERE id = v_ref.id;
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

-- ─── L1/L2: Remove dead missions from status/claim surfaces ─────────────────
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
    WHEN 'daily_today_spin' THEN '200.000000'
    ELSE '0.000000' END;
$$;

REVOKE ALL ON FUNCTION _repeatable_reward(repeatable_mission_code) FROM PUBLIC, anon, authenticated;

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
    'tier_reach_silver', 'tier_reach_gold', 'tier_fomo_streak',
    'daily_today_spin'
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
GRANT EXECUTE ON FUNCTION rpc_get_repeatable_mission_status(TEXT) TO authenticated, service_role;

-- ─── M2: Sports live delay BEFORE fixture FOR UPDATE locks ───────────────────
CREATE OR REPLACE FUNCTION _sports_any_live_leg(p_legs JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_i INT;
  v_outcome_id UUID;
  v_live BOOLEAN;
BEGIN
  IF p_legs IS NULL OR jsonb_typeof(p_legs) <> 'array' THEN
    RETURN FALSE;
  END IF;
  FOR v_i IN 0 .. jsonb_array_length(p_legs) - 1 LOOP
    v_outcome_id := (p_legs->v_i->>'outcome_id')::UUID;
    IF v_outcome_id IS NULL THEN CONTINUE; END IF;
    SELECT (f.status = 'live') INTO v_live
      FROM sports_outcomes o
      JOIN sports_markets m ON m.id = o.market_id
      JOIN sports_fixtures f ON f.id = m.fixture_id
     WHERE o.id = v_outcome_id;
    IF COALESCE(v_live, FALSE) THEN RETURN TRUE; END IF;
  END LOOP;
  RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION _sports_any_live_leg(JSONB) FROM PUBLIC, anon, authenticated;

-- Patch rpc_place_sports_bet: delay before locks, re-validate odds after delay
CREATE OR REPLACE FUNCTION rpc_place_sports_bet(
  p_legs            JSONB,
  p_stake           TEXT,
  p_currency        TEXT,
  p_idempotency_key TEXT,
  p_device_hash     TEXT DEFAULT NULL,
  p_ip_hash         TEXT DEFAULT NULL,
  p_bet_kind        TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing sports_bets%ROWTYPE;
  v_ccy currency;
  v_stake NUMERIC;
  v_leg_count INT;
  v_i INT;
  v_leg JSONB;
  v_outcome_id UUID;
  v_outcome sports_outcomes%ROWTYPE;
  v_market sports_markets%ROWTYPE;
  v_fixture sports_fixtures%ROWTYPE;
  v_latest RECORD;
  v_max_age INT;
  v_client_odds TEXT;
  v_combined NUMERIC := 1;
  v_payout NUMERIC;
  v_bet_id UUID := gen_random_uuid();
  v_lock_id UUID;
  v_fixture_id UUID;
  v_sgp_fixture UUID;
  v_seen_outcomes UUID[] := '{}';
  v_seen_fixtures UUID[] := '{}';
  v_is_live BOOLEAN;
  v_leg_outcomes UUID[] := '{}';
  v_kind sports_bet_kind;
  v_max_legs INT := 8;
  v_sgp_max INT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  SELECT * INTO v_existing FROM sports_bets
  WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'bet_id', v_existing.id,
      'status', v_existing.status,
      'combined_odds', v_existing.combined_odds,
      'potential_payout', v_existing.potential_payout,
      'bet_kind', v_existing.bet_kind,
      'already_placed', TRUE
    );
  END IF;

  PERFORM _assert_sports_user_risk_allowed(v_user_id);
  PERFORM _assert_sports_device_signals(v_user_id, p_device_hash, p_ip_hash);
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_place_sports_bet');
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('sports');
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_amount_text(p_stake);

  BEGIN
    v_ccy := p_currency::currency;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_currency';
  END;
  IF v_ccy NOT IN ('PHON', 'USDT') THEN
    RAISE EXCEPTION 'invalid_currency';
  END IF;

  PERFORM _assert_rg_domain_entry_allowed(v_user_id, 'sports', v_ccy);

  v_stake := p_stake::NUMERIC;
  IF v_stake <= 0 THEN RAISE EXCEPTION 'invalid_stake'; END IF;
  PERFORM _assert_sports_stake_limits(v_ccy, v_stake);
  PERFORM _assert_sports_risk_stake_cap(v_user_id, v_ccy, v_stake);
  PERFORM _assert_sports_user_daily_limits(v_user_id, v_ccy, v_stake);

  IF p_legs IS NULL OR jsonb_typeof(p_legs) <> 'array' THEN
    RAISE EXCEPTION 'invalid_legs';
  END IF;

  v_leg_count := jsonb_array_length(p_legs);
  v_sgp_max := COALESCE(
    NULLIF((SELECT value FROM app_config WHERE key = 'sports_sgp_max_legs'), '')::INT,
    12
  );

  IF p_bet_kind IS NULL OR btrim(p_bet_kind) = '' THEN
    v_kind := CASE
      WHEN v_leg_count = 1 THEN 'single'::sports_bet_kind
      ELSE 'combo'::sports_bet_kind
    END;
  ELSE
    BEGIN
      v_kind := lower(btrim(p_bet_kind))::sports_bet_kind;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'invalid_bet_kind';
    END;
  END IF;

  v_max_legs := CASE WHEN v_kind = 'sgp' THEN v_sgp_max ELSE 8 END;
  IF v_leg_count < 1 OR v_leg_count > v_max_legs THEN
    RAISE EXCEPTION 'invalid_leg_count';
  END IF;

  -- M2: anti-arb delay BEFORE acquiring fixture row locks
  IF _sports_any_live_leg(p_legs) THEN
    PERFORM _sports_live_acceptance_delay(v_user_id, v_ccy, v_stake, TRUE);
  END IF;

  FOR v_i IN 0 .. v_leg_count - 1 LOOP
    v_leg := p_legs->v_i;
    v_outcome_id := (v_leg->>'outcome_id')::UUID;
    IF v_outcome_id IS NULL THEN RAISE EXCEPTION 'invalid_outcome_id'; END IF;

    IF v_outcome_id = ANY(v_seen_outcomes) THEN
      RAISE EXCEPTION 'duplicate_outcome';
    END IF;
    v_seen_outcomes := array_append(v_seen_outcomes, v_outcome_id);

    SELECT * INTO v_outcome FROM sports_outcomes WHERE id = v_outcome_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'outcome_not_found'; END IF;

    SELECT * INTO v_market FROM sports_markets WHERE id = v_outcome.market_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;

    SELECT * INTO v_fixture FROM sports_fixtures WHERE id = v_market.fixture_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'fixture_not_found'; END IF;

    PERFORM _sports_assert_market_placeable(v_market.id, v_fixture.id);
    PERFORM _assert_sports_no_market_hedge(v_user_id, v_market.id);

    v_is_live := v_fixture.status = 'live';
    IF v_fixture.status NOT IN ('scheduled', 'live') THEN
      RAISE EXCEPTION 'fixture_not_open';
    END IF;

    IF NOT v_is_live THEN
      IF v_fixture.kickoff_at <= NOW() THEN RAISE EXCEPTION 'kickoff_passed'; END IF;
    END IF;
    v_max_age := _sports_odds_max_age_for_fixture(v_fixture.id, v_is_live);

    SELECT * INTO v_latest FROM _sports_latest_odds(v_outcome_id);
    IF v_latest.odds IS NULL THEN RAISE EXCEPTION 'odds_unavailable'; END IF;
    IF v_latest.captured_at < NOW() - make_interval(secs => v_max_age) THEN
      RAISE EXCEPTION 'odds_stale';
    END IF;

    v_client_odds := btrim(v_leg->>'odds_at_bet');
    IF v_client_odds IS NULL OR v_client_odds !~ '^\d+(\.\d+)?$' THEN
      RAISE EXCEPTION 'invalid_odds_at_bet';
    END IF;
    IF v_client_odds::NUMERIC <= 1 THEN RAISE EXCEPTION 'invalid_odds_at_bet'; END IF;
    IF NOT _sports_odds_exact_match(v_latest.odds, v_client_odds) THEN
      RAISE EXCEPTION 'odds_changed'
        USING DETAIL = format('expected=%s client=%s', v_latest.odds, v_client_odds);
    END IF;

    IF v_kind = 'sgp' THEN
      IF v_sgp_fixture IS NULL THEN
        v_sgp_fixture := v_fixture.id;
      ELSIF v_sgp_fixture <> v_fixture.id THEN
        RAISE EXCEPTION 'sgp_fixture_mismatch';
      END IF;
    ELSIF v_kind = 'combo' AND v_leg_count > 1 AND v_fixture.id = ANY(v_seen_fixtures) THEN
      RAISE EXCEPTION 'duplicate_fixture';
    END IF;
    v_seen_fixtures := array_append(v_seen_fixtures, v_fixture.id);

    v_combined := v_combined * v_client_odds::NUMERIC;
    v_leg_outcomes := array_append(v_leg_outcomes, v_outcome_id);
  END LOOP;

  IF v_kind = 'sgp' AND v_leg_count < 2 THEN
    RAISE EXCEPTION 'sgp_min_legs';
  END IF;

  v_payout := trunc(v_stake * v_combined, 6);
  PERFORM _assert_sports_payout_cap(v_ccy, v_payout);
  PERFORM _assert_sports_house_exposure(v_ccy, v_payout);

  FOR v_i IN 1 .. array_length(v_leg_outcomes, 1) LOOP
    PERFORM _assert_sports_outcome_liability(v_leg_outcomes[v_i], v_ccy, v_payout);
  END LOOP;

  v_lock_id := _lock_wallet_internal(
    v_user_id,
    v_ccy,
    _fmt6(v_stake),
    'sports_stake_lock',
    'sbet_lock:' || v_user_id::TEXT || ':' || p_idempotency_key
  );

  INSERT INTO sports_bets (
    id, user_id, currency, stake, combined_odds, potential_payout,
    status, idempotency_key, stake_lock_id, bet_kind
  ) VALUES (
    v_bet_id, v_user_id, v_ccy, _fmt6(v_stake), _fmt6(v_combined), _fmt6(v_payout),
    'pending', p_idempotency_key, v_lock_id, v_kind
  );

  FOR v_i IN 0 .. v_leg_count - 1 LOOP
    v_leg := p_legs->v_i;
    v_outcome_id := (v_leg->>'outcome_id')::UUID;

    SELECT m.fixture_id INTO v_fixture_id
    FROM sports_outcomes o
    JOIN sports_markets m ON m.id = o.market_id
    WHERE o.id = v_outcome_id;

    INSERT INTO sports_bet_legs (bet_id, outcome_id, fixture_id, odds_at_bet)
    VALUES (v_bet_id, v_outcome_id, v_fixture_id, btrim(v_leg->>'odds_at_bet'));
  END LOOP;

  PERFORM _record_sports_device_signal(v_user_id, v_bet_id, p_device_hash, p_ip_hash);

  RETURN jsonb_build_object(
    'bet_id', v_bet_id,
    'status', 'pending',
    'bet_kind', v_kind,
    'combined_odds', _fmt6(v_combined),
    'potential_payout', _fmt6(v_payout),
    'already_placed', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

-- ─── E1: Pin search_path on advisor-flagged helpers ─────────────────────────
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
        '_earn_user_tier', '_earn_tier_index', '_earn_limit_attendance', '_earn_limit_roulette',
        '_earn_limit_referral_payout', '_earn_limit_viral_share', '_earn_limit_daily_quiz',
        '_earn_referral_multiplier', '_attendance_reward_for_day', '_earn_kst_midnight_utc',
        '_repeatable_reward', '_repeatable_week_window', '_repeatable_progress',
        '_repeatable_target', '_repeatable_is_claimed',
        '_deepshaft_cave_prob', '_deepshaft_complete_prob', '_deepshaft_payout_mult',
        '_deepshaft_level_growth_mult', '_deepshaft_evaluate', '_deepshaft_client_result',
        '_momentum_combo_mult', '_momentum_cash_payout_mult', '_momentum_evaluate',
        '_mines_is_terminal', '_mines_client_result', '_mines_multiplier',
        '_sports_any_live_leg', '_admin_credit_krw_deposit_internal'
      )
  LOOP
    EXECUTE 'ALTER FUNCTION ' || r.sig::TEXT || ' SET search_path = public, pg_temp';
  END LOOP;
END;
$$;

-- ─── E2: REVOKE trigger guard from anon ──────────────────────────────────────
REVOKE ALL ON FUNCTION _guard_funding_rates_nonzero() FROM PUBLIC, anon;

-- ─── E3: RLS initplan — re-wrap any policies added since 00123 ────────────────
CREATE OR REPLACE FUNCTION _advisor_wrap_rls_auth_expr(p_expr TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result TEXT := COALESCE(p_expr, '');
BEGIN
  IF v_result = '' THEN RETURN v_result; END IF;
  WHILE v_result LIKE '%auth.uid()%' AND v_result NOT LIKE '%(select auth.uid())%' LOOP
    v_result := replace(v_result, 'auth.uid()', '(select auth.uid())');
  END LOOP;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION _advisor_wrap_rls_auth_expr(TEXT) FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  pol RECORD;
  v_qual TEXT;
  v_with_check TEXT;
  v_new_qual TEXT;
  v_new_with_check TEXT;
  v_cmd TEXT;
  v_permissive TEXT;
  v_roles TEXT;
  v_sql TEXT;
BEGIN
  FOR pol IN
    SELECT
      n.nspname AS schemaname,
      c.relname AS tablename,
      p.polname AS policyname,
      p.polpermissive,
      p.polcmd,
      p.polroles,
      pg_get_expr(p.polqual, p.polrelid) AS qual_expr,
      pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expr
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
  LOOP
    v_qual := pol.qual_expr;
    v_with_check := pol.with_check_expr;
    IF COALESCE(v_qual, '') NOT ILIKE '%auth.uid()%'
       AND COALESCE(v_with_check, '') NOT ILIKE '%auth.uid()%' THEN
      CONTINUE;
    END IF;
    v_new_qual := _advisor_wrap_rls_auth_expr(v_qual);
    v_new_with_check := _advisor_wrap_rls_auth_expr(v_with_check);
    IF v_new_qual IS NOT DISTINCT FROM v_qual
       AND v_new_with_check IS NOT DISTINCT FROM v_with_check THEN
      CONTINUE;
    END IF;
    v_cmd := CASE pol.polcmd
      WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE' WHEN '*' THEN 'ALL' ELSE 'ALL' END;
    v_permissive := CASE WHEN pol.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END;
    SELECT string_agg(quote_ident(r.rolname), ', ' ORDER BY r.rolname) INTO v_roles
      FROM pg_roles r WHERE r.oid = ANY (pol.polroles);
    IF v_roles IS NULL OR v_roles = '' THEN v_roles := 'public'; END IF;
    EXECUTE format('DROP POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    v_sql := format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
      pol.policyname, pol.schemaname, pol.tablename, v_permissive, v_cmd, v_roles);
    IF v_new_qual IS NOT NULL AND v_new_qual <> '' THEN
      v_sql := v_sql || format(' USING (%s)', v_new_qual);
    ELSIF v_cmd IN ('SELECT', 'UPDATE', 'DELETE', 'ALL') THEN
      v_sql := v_sql || ' USING (true)';
    END IF;
    IF v_new_with_check IS NOT NULL AND v_new_with_check <> '' THEN
      v_sql := v_sql || format(' WITH CHECK (%s)', v_new_with_check);
    END IF;
    EXECUTE v_sql;
  END LOOP;
END;
$$;

DROP FUNCTION _advisor_wrap_rls_auth_expr(TEXT);
