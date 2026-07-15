-- ============================================================
-- Migration: ew_e1_tier_decay
-- E1 Tier Decay — grace · max 1-tier drop · warnings · keep mission
-- Plan: ew-e1-decay-wave (#240) · ADR-010
-- ============================================================

SET search_path = public, pg_temp;

-- ─── app_config thresholds ───────────────────────────────────────────────────

INSERT INTO app_config (key, value, description) VALUES
  ('tier_decay_grace_days', '45', 'Default VIP tier maintenance grace days (Closed Beta).'),
  ('tier_decay_grace_days_diamond', '60', 'Diamond VIP tier maintenance grace days.'),
  ('tier_decay_warn_days', '30,15,7,3', 'Days-before-decay warning schedule (CSV).'),
  ('tier_decay_silver_krw', '100000', 'Silver keep: KRW deposit sum in grace window.'),
  ('tier_decay_silver_usdt_volume', '1000', 'Silver keep: USDT wager/trade volume.'),
  ('tier_decay_gold_krw', '500000', 'Gold keep: KRW deposit sum.'),
  ('tier_decay_gold_usdt_volume', '5000', 'Gold keep: USDT volume.'),
  ('tier_decay_platinum_krw', '2000000', 'Platinum keep: KRW deposit sum.'),
  ('tier_decay_platinum_usdt_volume', '20000', 'Platinum keep: USDT volume.'),
  ('tier_decay_diamond_krw', '5000000', 'Diamond keep: KRW deposit sum.'),
  ('tier_decay_diamond_usdt_volume', '50000', 'Diamond keep: USDT volume.')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;

-- ─── user_earn_vip decay columns ─────────────────────────────────────────────

ALTER TABLE user_earn_vip
  ADD COLUMN IF NOT EXISTS last_qualifying_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_decay_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS decay_warnings_sent INT[] NOT NULL DEFAULT '{}';

UPDATE user_earn_vip
   SET last_qualifying_at = COALESCE(
     last_qualifying_at,
     tier_upgraded_on::TIMESTAMPTZ,
     updated_at,
     NOW()
   )
 WHERE last_qualifying_at IS NULL;

-- ─── append-only decay history ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tier_decay_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_tier       earn_vip_tier NOT NULL,
  to_tier         earn_vip_tier NOT NULL,
  xp_before       BIGINT NOT NULL,
  xp_after        BIGINT NOT NULL,
  reason          TEXT NOT NULL DEFAULT 'maintenance_missed',
  grace_days      INT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tier_decay_events_user_idx
  ON tier_decay_events (user_id, created_at DESC);

ALTER TABLE tier_decay_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tier_decay_events: own read" ON tier_decay_events;
DROP POLICY IF EXISTS "tier_decay_events: admin read" ON tier_decay_events;
DROP POLICY IF EXISTS "tier_decay_events: consolidated select" ON tier_decay_events;
CREATE POLICY "tier_decay_events: consolidated select" ON tier_decay_events
  FOR SELECT USING (auth.uid() = user_id OR _is_admin());

REVOKE ALL ON tier_decay_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON tier_decay_events TO authenticated;
GRANT ALL ON tier_decay_events TO service_role;

ALTER TABLE tier_decay_events DROP CONSTRAINT IF EXISTS tier_decay_one_step;
ALTER TABLE tier_decay_events
  ADD CONSTRAINT tier_decay_one_step
  CHECK (_earn_tier_index(from_tier) = _earn_tier_index(to_tier) + 1);

-- ─── helpers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _tier_decay_config_int(p_key TEXT, p_default INT)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    NULLIF((SELECT value FROM app_config WHERE key = p_key), '')::INT,
    p_default
  );
$$;

REVOKE ALL ON FUNCTION _tier_decay_config_int(TEXT, INT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _tier_decay_config_numeric(p_key TEXT, p_default NUMERIC)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    NULLIF((SELECT value FROM app_config WHERE key = p_key), '')::NUMERIC,
    p_default
  );
$$;

REVOKE ALL ON FUNCTION _tier_decay_config_numeric(TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _tier_decay_grace_days(p_tier earn_vip_tier)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN p_tier = 'diamond' THEN _tier_decay_config_int('tier_decay_grace_days_diamond', 60)
    ELSE _tier_decay_config_int('tier_decay_grace_days', 45)
  END;
$$;

REVOKE ALL ON FUNCTION _tier_decay_grace_days(earn_vip_tier) FROM PUBLIC, anon, authenticated;

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
    ELSE NULL
  END;
$$;

REVOKE ALL ON FUNCTION _tier_decay_previous(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _tier_decay_xp_cap(p_tier earn_vip_tier)
RETURNS BIGINT
LANGUAGE sql
IMMUTABLE
AS $$
  -- Cap XP so automatic XP upgrade cannot instantly restore the lost tier.
  SELECT CASE p_tier
    WHEN 'bronze' THEN 4999
    WHEN 'silver' THEN 24999
    WHEN 'gold' THEN 99999
    WHEN 'platinum' THEN 499999
    ELSE 9223372036854775807
  END;
$$;

REVOKE ALL ON FUNCTION _tier_decay_xp_cap(earn_vip_tier) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _tier_decay_window_start(p_tier earn_vip_tier, p_as_of TIMESTAMPTZ DEFAULT NOW())
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_as_of - make_interval(days => _tier_decay_grace_days(p_tier));
$$;

REVOKE ALL ON FUNCTION _tier_decay_window_start(earn_vip_tier, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _tier_decay_krw_deposited(
  p_user_id UUID,
  p_since TIMESTAMPTZ
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(SUM(amount_krw::NUMERIC), 0)
    FROM krw_deposit_requests
   WHERE user_id = p_user_id
     AND status = 'credited'
     AND credited_at >= p_since;
$$;

REVOKE ALL ON FUNCTION _tier_decay_krw_deposited(UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _tier_decay_usdt_volume(
  p_user_id UUID,
  p_since TIMESTAMPTZ
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DECLARE
    v_rate NUMERIC := COALESCE(
      NULLIF((SELECT value FROM app_config WHERE key = 'earn_phon_to_usdt_rate'), '')::NUMERIC,
      0.164
    );
    v_game NUMERIC := 0;
    v_sports NUMERIC := 0;
    v_crypto NUMERIC := 0;
  BEGIN
    SELECT COALESCE(SUM(
      CASE
        WHEN currency::TEXT = 'USDT' THEN stake::NUMERIC
        WHEN currency::TEXT = 'PHON' THEN stake::NUMERIC * v_rate
        ELSE 0
      END
    ), 0)
      INTO v_game
      FROM game_bets
     WHERE user_id = p_user_id
       AND created_at >= p_since
       AND status IN ('won', 'lost', 'pending');

    SELECT COALESCE(SUM(
      CASE
        WHEN currency::TEXT = 'USDT' THEN stake::NUMERIC
        WHEN currency::TEXT = 'PHON' THEN stake::NUMERIC * v_rate
        ELSE 0
      END
    ), 0)
      INTO v_sports
      FROM sports_bets
     WHERE user_id = p_user_id
       AND created_at >= p_since;

    SELECT COALESCE(SUM(amount::NUMERIC), 0)
      INTO v_crypto
      FROM crypto_deposit_requests
     WHERE user_id = p_user_id
       AND status = 'credited'
       AND credited_at >= p_since
       AND asset::TEXT = 'USDT';

    RETURN v_game + v_sports + v_crypto;
  END;
$$;

REVOKE ALL ON FUNCTION _tier_decay_usdt_volume(UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _tier_decay_meets_maintenance(
  p_user_id UUID,
  p_tier earn_vip_tier,
  p_as_of TIMESTAMPTZ DEFAULT NOW()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DECLARE
    v_since TIMESTAMPTZ := _tier_decay_window_start(p_tier, p_as_of);
    v_krw NUMERIC;
    v_vol NUMERIC;
    v_krw_need NUMERIC;
    v_vol_need NUMERIC;
  BEGIN
    IF p_tier = 'bronze' THEN
      RETURN TRUE;
    END IF;

    v_krw := _tier_decay_krw_deposited(p_user_id, v_since);
    v_vol := _tier_decay_usdt_volume(p_user_id, v_since);

    IF p_tier = 'silver' THEN
      v_krw_need := _tier_decay_config_numeric('tier_decay_silver_krw', 100000);
      v_vol_need := _tier_decay_config_numeric('tier_decay_silver_usdt_volume', 1000);
    ELSIF p_tier = 'gold' THEN
      v_krw_need := _tier_decay_config_numeric('tier_decay_gold_krw', 500000);
      v_vol_need := _tier_decay_config_numeric('tier_decay_gold_usdt_volume', 5000);
    ELSIF p_tier = 'platinum' THEN
      v_krw_need := _tier_decay_config_numeric('tier_decay_platinum_krw', 2000000);
      v_vol_need := _tier_decay_config_numeric('tier_decay_platinum_usdt_volume', 20000);
    ELSIF p_tier = 'diamond' THEN
      v_krw_need := _tier_decay_config_numeric('tier_decay_diamond_krw', 5000000);
      v_vol_need := _tier_decay_config_numeric('tier_decay_diamond_usdt_volume', 50000);
    ELSE
      RETURN TRUE;
    END IF;

    RETURN v_krw >= v_krw_need OR v_vol >= v_vol_need;
  END;
$$;

REVOKE ALL ON FUNCTION _tier_decay_meets_maintenance(UUID, earn_vip_tier, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _tier_decay_touch_qualifying(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE user_earn_vip
     SET last_qualifying_at = NOW(),
         decay_warnings_sent = '{}',
         updated_at = NOW()
   WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION _tier_decay_touch_qualifying(UUID) FROM PUBLIC, anon, authenticated;

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

-- ─── public RPCs ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_run_tier_decay(
  p_limit INT DEFAULT 500,
  p_as_of TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID;
  v_scanned INT := 0;
  v_decayed INT := 0;
  v_warned INT := 0;
  v_res JSONB;
  v_warn JSONB;
BEGIN
  -- Cron / service: auth.uid() NULL. Interactive: admin only.
  IF auth.uid() IS NOT NULL AND NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_uid IN
    SELECT user_id
      FROM user_earn_vip
     WHERE tier <> 'bronze'
     ORDER BY COALESCE(last_qualifying_at, updated_at) ASC
     LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 500), 5000))
  LOOP
    v_scanned := v_scanned + 1;
    v_warn := _tier_decay_maybe_warn(v_uid, p_as_of);
    v_warned := v_warned + COALESCE((v_warn->>'warned')::INT, 0);
    v_res := _tier_decay_apply_one(v_uid, p_as_of);
    IF COALESCE((v_res->>'ok')::BOOLEAN, FALSE) THEN
      v_decayed := v_decayed + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'scanned', v_scanned,
    'decayed', v_decayed,
    'warned', v_warned
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_run_tier_decay(INT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_run_tier_decay(INT, TIMESTAMPTZ) TO service_role;
-- Admin may run manually via JWT + _is_admin inside body.
GRANT EXECUTE ON FUNCTION rpc_run_tier_decay(INT, TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION rpc_get_tier_decay_status()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_vip user_earn_vip%ROWTYPE;
  v_grace INT;
  v_anchor TIMESTAMPTZ;
  v_days_left INT;
  v_meets BOOLEAN;
  v_since TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;

  SELECT * INTO v_vip FROM user_earn_vip WHERE user_id = v_user_id;
  IF NOT FOUND THEN
    PERFORM _ensure_user_earn_vip(v_user_id);
    SELECT * INTO v_vip FROM user_earn_vip WHERE user_id = v_user_id;
  END IF;

  v_grace := _tier_decay_grace_days(v_vip.tier);
  v_anchor := COALESCE(v_vip.last_qualifying_at, v_vip.updated_at, NOW());
  v_days_left := CEIL(EXTRACT(EPOCH FROM (v_anchor + make_interval(days => v_grace) - NOW())) / 86400.0)::INT;
  IF v_days_left < 0 THEN v_days_left := 0; END IF;
  v_meets := _tier_decay_meets_maintenance(v_user_id, v_vip.tier, NOW());
  v_since := _tier_decay_window_start(v_vip.tier, NOW());

  RETURN jsonb_build_object(
    'tier', v_vip.tier,
    'eligible', v_vip.tier <> 'bronze',
    'grace_days', v_grace,
    'days_left', v_days_left,
    'meets_maintenance', v_meets,
    'lower_tier', _tier_decay_previous(v_vip.tier),
    'last_qualifying_at', v_anchor,
    'last_decay_at', v_vip.last_decay_at,
    'krw_deposited', _tier_decay_krw_deposited(v_user_id, v_since)::TEXT,
    'usdt_volume', _tier_decay_usdt_volume(v_user_id, v_since)::TEXT,
    'warnings_sent', to_jsonb(COALESCE(v_vip.decay_warnings_sent, '{}'))
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_tier_decay_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_tier_decay_status() TO authenticated, service_role;

-- ─── tier_keep_status progress + monthly claim window ────────────────────────

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
  v_tier earn_vip_tier;
BEGIN
  CASE p_mission
    WHEN 'weekly_play5' THEN
      RETURN (
        SELECT COUNT(*)::INT
          FROM game_bets
         WHERE user_id = p_user_id
           AND settled_at >= v_week_start
           AND status IN ('won', 'lost')
      );
    WHEN 'weekly_win3' THEN
      RETURN (
        SELECT COUNT(*)::INT
          FROM game_bets
         WHERE user_id = p_user_id
           AND settled_at >= v_week_start
           AND status = 'won'
      );
    WHEN 'weekly_deposit_once' THEN
      RETURN (
        SELECT CASE WHEN EXISTS (
          SELECT 1
            FROM wallet_ledger wl
           WHERE wl.user_id = p_user_id
             AND wl.direction = 'credit'
             AND wl.reason_code IN ('krw_deposit_credit', 'crypto_deposit_credit')
             AND wl.created_at >= v_week_start
        ) THEN 1 ELSE 0 END
      );
    WHEN 'weekly_spin_daily' THEN
      RETURN (
        SELECT COUNT(DISTINCT spun_date)::INT
          FROM roulette_spins
         WHERE user_id = p_user_id
           AND spun_date >= v_week_start::DATE
      );
    WHEN 'weekly_login_all' THEN
      RETURN (
        SELECT COUNT(DISTINCT claimed_date)::INT
          FROM daily_claims
         WHERE user_id = p_user_id
           AND claimed_date >= v_week_start::DATE
      );
    WHEN 'daily_today_spin' THEN
      RETURN (
        SELECT CASE WHEN EXISTS (
          SELECT 1
            FROM roulette_spins
           WHERE user_id = p_user_id
             AND spun_date = CURRENT_DATE
        ) THEN 1 ELSE 0 END
      );
    WHEN 'tier_fomo_streak' THEN
      RETURN COALESCE((SELECT current_streak FROM user_streaks WHERE user_id = p_user_id), 0);
    WHEN 'tier_keep_status' THEN
      v_tier := _earn_user_tier(p_user_id);
      IF v_tier = 'bronze' THEN
        RETURN 0;
      END IF;
      IF _tier_decay_meets_maintenance(p_user_id, v_tier, NOW()) THEN
        RETURN 1;
      END IF;
      RETURN 0;
    ELSE
      RETURN 0;
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION _repeatable_progress(UUID, repeatable_mission_code)
  FROM PUBLIC, anon, authenticated;

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
         WHEN p_mission = 'tier_keep_status' THEN
           to_char(date_trunc('month', NOW() AT TIME ZONE 'UTC'), 'YYYY-MM') || '%'
         WHEN p_mission::TEXT LIKE 'weekly_%' THEN _repeatable_week_window() || '%'
         WHEN p_mission::TEXT LIKE 'social_%' THEN _repeatable_week_window() || '%'
         WHEN p_mission::TEXT LIKE 'tier_%' THEN 'lifetime:%'
         ELSE to_char(CURRENT_DATE, 'YYYY-MM-DD') || '%'
       END
  );
$$;

REVOKE ALL ON FUNCTION _repeatable_is_claimed(UUID, repeatable_mission_code)
  FROM PUBLIC, anon, authenticated;

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
  ELSIF v_mission = 'tier_keep_status' THEN
    v_tier := _earn_user_tier(v_user_id);
    IF v_tier = 'bronze' THEN RAISE EXCEPTION 'mission_not_eligible'; END IF;
    IF v_progress < v_target THEN RAISE EXCEPTION 'mission_not_eligible'; END IF;
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
    WHEN v_mission = 'tier_keep_status' THEN
      to_char(date_trunc('month', NOW() AT TIME ZONE 'UTC'), 'YYYY-MM') || ':keep'
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

  IF v_mission = 'tier_keep_status' THEN
    PERFORM _tier_decay_touch_qualifying(v_user_id);
  END IF;

  RETURN jsonb_build_object('ok', TRUE, 'claim_id', v_claim_id, 'phon_awarded', v_reward, 'mission', v_mission);
END;
$$;

REVOKE ALL ON FUNCTION rpc_claim_repeatable_mission(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_claim_repeatable_mission(TEXT, TEXT) TO authenticated;

-- ─── cron ────────────────────────────────────────────────────────────────────

SELECT cron.unschedule(jobid)
  FROM cron.job
 WHERE jobname = 'phonara_tier_decay_daily';

SELECT cron.schedule(
  'phonara_tier_decay_daily',
  '15 3 * * *',
  $cron$SELECT public.rpc_run_tier_decay(500, NOW());$cron$
);
