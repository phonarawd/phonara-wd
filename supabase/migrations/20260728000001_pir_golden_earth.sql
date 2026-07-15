-- PIR E3 (H-1): Golden Earth — shorten global row lock + global jackpot idempotency.
-- 1) Defer golden_earth_global FOR UPDATE until after user-local reward calc
--    so concurrent taps can prep in parallel (global serializes only at the end).
-- 2) Global jackpot ledger key = golden_earth:gjp:{total_taps} (double-pay safe).
-- 3) Replace random() rolls with extensions.gen_random_bytes.
-- Plan: platform_integrity_remediation_v1 · pir-e3-golden-earth

-- ─── Secure roll helper (0 .. p_sides-1) ─────────────────────────────────────

CREATE OR REPLACE FUNCTION _golden_earth_secure_roll(p_sides INT)
RETURNS INT
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bytes BYTEA;
  v_val   BIGINT;
BEGIN
  IF p_sides IS NULL OR p_sides <= 0 THEN
    RAISE EXCEPTION 'invalid_roll_sides';
  END IF;

  v_bytes := extensions.gen_random_bytes(4);
  v_val := (get_byte(v_bytes, 0)::BIGINT << 24)
         + (get_byte(v_bytes, 1)::BIGINT << 16)
         + (get_byte(v_bytes, 2)::BIGINT << 8)
         +  get_byte(v_bytes, 3)::BIGINT;

  RETURN (v_val % p_sides)::INT;
END;
$$;

REVOKE ALL ON FUNCTION _golden_earth_secure_roll(INT) FROM PUBLIC, anon, authenticated;

-- ─── Tap RPC (lock-late + gjp idempotency + secure rolls) ───────────────────

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
  v_jp_span         INT;
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

  -- Mini jackpot (user-local · no global lock yet)
  v_roll := _golden_earth_secure_roll(10000);
  IF v_roll < _golden_earth_config_int('golden_earth_jackpot_chance_bps', 50) THEN
    v_jp_min := _golden_earth_config_num('golden_earth_jackpot_min', 50);
    v_jp_max := _golden_earth_config_num('golden_earth_jackpot_max', 500);
    v_jp_span := GREATEST((v_jp_max - v_jp_min)::INT + 1, 1);
    v_reward := v_jp_min + _golden_earth_secure_roll(v_jp_span);
    v_is_jackpot := TRUE;
    v_reason := 'golden_earth_jackpot';
  END IF;

  -- PIR E3: acquire global row lock LATE — after all user-local reward prep.
  SELECT * INTO v_global FROM golden_earth_global WHERE id = 1 FOR UPDATE;
  v_new_global := v_global.total_taps + 1;

  IF v_new_global % v_global.jackpot_every = 0 THEN
    v_jp_min := _golden_earth_config_num('golden_earth_global_jackpot_min', 10000);
    v_jp_max := _golden_earth_config_num('golden_earth_global_jackpot_max', 50000);
    v_jp_span := GREATEST((v_jp_max - v_jp_min)::INT + 1, 1);
    v_reward := v_jp_min + _golden_earth_secure_roll(v_jp_span);
    v_is_jackpot := TRUE;
    v_is_global_jp := TRUE;
    v_reason := 'golden_earth_jackpot';
  END IF;

  -- Global jackpot uses milestone-scoped idempotency (defense in depth).
  IF v_is_global_jp THEN
    v_idem := 'golden_earth:gjp:' || v_new_global::TEXT;
  ELSIF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    v_idem := 'golden_earth:req:' || p_client_request_id;
  ELSE
    v_idem := 'golden_earth:' || v_user_id::TEXT || ':' || v_kst_date::TEXT || ':' || (v_daily.tap_count + 1)::TEXT;
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

  -- Counter UPDATE at TX tail (still under the late FOR UPDATE).
  UPDATE golden_earth_global SET total_taps = v_new_global, updated_at = NOW() WHERE id = 1;

  INSERT INTO golden_earth_taps (
    user_id, kst_date, tap_index, phon_awarded, multiplier,
    is_jackpot, is_global_jackpot, ledger_entry_id, client_request_id,
    metadata
  ) VALUES (
    v_user_id, v_kst_date, v_daily.tap_count,
    to_char(v_reward, 'FM999999999.000000'), v_mult,
    v_is_jackpot, v_is_global_jp, v_ledger_id, p_client_request_id,
    jsonb_build_object(
      'tier', v_vip.tier,
      'combo_streak', v_daily.combo_streak,
      'global_total', v_new_global
    )
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

REVOKE ALL ON FUNCTION rpc_golden_earth_tap(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_golden_earth_tap(TEXT) TO authenticated;
