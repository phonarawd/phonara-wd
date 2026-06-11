-- ============================================================
-- Responsible Gambling foundation
-- ============================================================
-- Adds user limits, self-exclusion, monthly net-loss helpers, entry guards, and
-- RG-excluded affiliate commission base without changing settlement legs.
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Conservative operator caps and cooldown policy ──────────────────────────
INSERT INTO app_config (key, value, description, is_public) VALUES
  ('rg_operator_loss_cap_game_phon', '10000.000000',
   'Operator maximum monthly game net-loss limit in PHON. Adjustable after AML review.', FALSE),
  ('rg_operator_loss_cap_game_usdt', '100.000000',
   'Operator maximum monthly game net-loss limit in USDT. Adjustable after AML review.', FALSE),
  ('rg_operator_loss_cap_trading_phon', '10000.000000',
   'Operator maximum monthly trading net-loss limit in PHON. Adjustable after AML review.', FALSE),
  ('rg_operator_loss_cap_trading_usdt', '100.000000',
   'Operator maximum monthly trading net-loss limit in USDT. Adjustable after AML review.', FALSE),
  ('rg_operator_deposit_cap_krw', '1000000',
   'Operator maximum monthly KRW deposit request limit. Adjustable after AML review.', FALSE),
  ('rg_limit_increase_cooldown_hours', '24',
   'Cooldown hours before a user-requested RG limit increase becomes effective.', FALSE),
  ('rg_self_exclusion_min_lock_hours', '24',
   'Minimum hours before support can release a self-exclusion.', FALSE),
  ('rg_self_exclusion_release_cooldown_hours', '24',
   'Cooldown hours after support releases a self-exclusion before entry resumes.', FALSE)
ON CONFLICT (key) DO NOTHING;

-- ─── RG state tables ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rg_user_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  limit_kind TEXT NOT NULL CHECK (limit_kind IN ('loss', 'deposit')),
  domain TEXT CHECK (domain IN ('game', 'trading')),
  currency currency NOT NULL,
  current_limit TEXT NOT NULL CHECK (current_limit ~ '^\d+(\.\d+)?$' AND current_limit::NUMERIC > 0),
  pending_limit TEXT CHECK (pending_limit IS NULL OR (pending_limit ~ '^\d+(\.\d+)?$' AND pending_limit::NUMERIC > 0)),
  pending_effective_at TIMESTAMPTZ,
  last_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (limit_kind = 'loss' AND domain IN ('game', 'trading') AND currency IN ('PHON', 'USDT'))
    OR (limit_kind = 'deposit' AND domain IS NULL AND currency = 'KRW')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS rg_user_limits_scope_uidx
  ON rg_user_limits (user_id, limit_kind, COALESCE(domain, ''), currency);
CREATE INDEX IF NOT EXISTS rg_user_limits_user_idx ON rg_user_limits (user_id);

CREATE TABLE IF NOT EXISTS rg_loss_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL CHECK (domain IN ('game', 'trading')),
  currency currency NOT NULL CHECK (currency IN ('PHON', 'USDT')),
  month_start DATE NOT NULL,
  realized_loss TEXT NOT NULL DEFAULT '0.000000' CHECK (realized_loss ~ '^\d+(\.\d+)?$'),
  unrealized_loss TEXT NOT NULL DEFAULT '0.000000' CHECK (unrealized_loss ~ '^\d+(\.\d+)?$'),
  net_loss TEXT NOT NULL DEFAULT '0.000000' CHECK (net_loss ~ '^\d+(\.\d+)?$'),
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, domain, currency, month_start)
);

CREATE INDEX IF NOT EXISTS rg_loss_tracking_scope_idx
  ON rg_loss_tracking (domain, currency, month_start);

CREATE TABLE IF NOT EXISTS rg_exclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'release_requested', 'released', 'expired')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  excluded_until TIMESTAMPTZ NOT NULL,
  min_release_at TIMESTAMPTZ NOT NULL,
  release_requested_at TIMESTAMPTZ,
  release_requested_by UUID REFERENCES profiles(id),
  released_at TIMESTAMPTZ,
  released_by UUID REFERENCES profiles(id),
  release_cooldown_until TIMESTAMPTZ,
  reason TEXT,
  release_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (excluded_until > starts_at),
  CHECK (min_release_at >= starts_at)
);

CREATE INDEX IF NOT EXISTS rg_exclusions_user_active_idx
  ON rg_exclusions (user_id, status, excluded_until DESC);

CREATE TABLE IF NOT EXISTS rg_block_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'loss_limit_reached',
      'deposit_limit_exceeded',
      'self_exclusion_started',
      'self_exclusion_released'
    )
  ),
  domain TEXT CHECK (domain IN ('game', 'trading')),
  currency currency,
  month_start DATE,
  effective_start_at TIMESTAMPTZ NOT NULL,
  effective_end_at TIMESTAMPTZ NOT NULL,
  related_entity_id UUID,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (effective_end_at > effective_start_at)
);

CREATE INDEX IF NOT EXISTS rg_block_events_user_window_idx
  ON rg_block_events (user_id, effective_start_at, effective_end_at);
CREATE INDEX IF NOT EXISTS rg_block_events_scope_idx
  ON rg_block_events (event_type, domain, currency, month_start);

ALTER TABLE rg_user_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE rg_loss_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE rg_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rg_block_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rg_user_limits: own read" ON rg_user_limits;
CREATE POLICY "rg_user_limits: own read"
  ON rg_user_limits FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "rg_user_limits: admin rw" ON rg_user_limits;
CREATE POLICY "rg_user_limits: admin rw"
  ON rg_user_limits FOR ALL USING (_is_admin()) WITH CHECK (_is_admin());

DROP POLICY IF EXISTS "rg_loss_tracking: own read" ON rg_loss_tracking;
CREATE POLICY "rg_loss_tracking: own read"
  ON rg_loss_tracking FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "rg_loss_tracking: admin read" ON rg_loss_tracking;
CREATE POLICY "rg_loss_tracking: admin read"
  ON rg_loss_tracking FOR SELECT USING (_is_admin());

DROP POLICY IF EXISTS "rg_exclusions: own read" ON rg_exclusions;
CREATE POLICY "rg_exclusions: own read"
  ON rg_exclusions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "rg_exclusions: admin rw" ON rg_exclusions;
CREATE POLICY "rg_exclusions: admin rw"
  ON rg_exclusions FOR ALL USING (_is_admin()) WITH CHECK (_is_admin());

DROP POLICY IF EXISTS "rg_block_events: admin read" ON rg_block_events;
CREATE POLICY "rg_block_events: admin read"
  ON rg_block_events FOR SELECT USING (_is_admin());

GRANT SELECT ON rg_user_limits, rg_loss_tracking, rg_exclusions TO authenticated;
GRANT SELECT ON rg_block_events TO authenticated;
GRANT ALL ON rg_user_limits, rg_loss_tracking, rg_exclusions, rg_block_events TO service_role;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE
  ON rg_user_limits, rg_loss_tracking, rg_exclusions, rg_block_events
  FROM anon, authenticated;

CREATE TRIGGER rg_user_limits_updated_at
  BEFORE UPDATE ON rg_user_limits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Helpers ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _rg_month_start(p_at TIMESTAMPTZ DEFAULT NOW())
RETURNS DATE
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT date_trunc('month', p_at)::DATE;
$$;

CREATE OR REPLACE FUNCTION _rg_config_numeric(p_key TEXT, p_default TEXT)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((SELECT value::NUMERIC FROM app_config WHERE key = p_key), p_default::NUMERIC);
$$;

CREATE OR REPLACE FUNCTION _rg_operator_cap(
  p_limit_kind TEXT,
  p_domain TEXT,
  p_currency currency
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_key TEXT;
BEGIN
  IF p_limit_kind = 'loss' THEN
    IF p_domain NOT IN ('game', 'trading') OR p_currency NOT IN ('PHON', 'USDT') THEN
      RAISE EXCEPTION 'rg_invalid_limit_scope';
    END IF;
    v_key := 'rg_operator_loss_cap_' || p_domain || '_' || lower(p_currency::TEXT);
  ELSIF p_limit_kind = 'deposit' THEN
    IF p_domain IS NOT NULL OR p_currency <> 'KRW' THEN
      RAISE EXCEPTION 'rg_invalid_limit_scope';
    END IF;
    v_key := 'rg_operator_deposit_cap_krw';
  ELSE
    RAISE EXCEPTION 'rg_invalid_limit_kind';
  END IF;

  RETURN _rg_config_numeric(v_key, '0');
END;
$$;

CREATE OR REPLACE FUNCTION _rg_user_effective_limit(
  p_user_id UUID,
  p_limit_kind TEXT,
  p_domain TEXT,
  p_currency currency
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row rg_user_limits%ROWTYPE;
  v_cap NUMERIC := _rg_operator_cap(p_limit_kind, p_domain, p_currency);
  v_user_limit NUMERIC;
BEGIN
  SELECT * INTO v_row
    FROM rg_user_limits
   WHERE user_id = p_user_id
     AND limit_kind = p_limit_kind
     AND COALESCE(domain, '') = COALESCE(p_domain, '')
     AND currency = p_currency
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN v_cap;
  END IF;

  v_user_limit := CASE
    WHEN v_row.pending_limit IS NOT NULL
     AND v_row.pending_effective_at IS NOT NULL
     AND v_row.pending_effective_at <= NOW()
    THEN v_row.pending_limit::NUMERIC
    ELSE v_row.current_limit::NUMERIC
  END;

  RETURN LEAST(v_user_limit, v_cap);
END;
$$;

CREATE OR REPLACE FUNCTION _rg_self_exclusion_active(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM rg_exclusions
     WHERE user_id = p_user_id
       AND (
         (status IN ('active', 'release_requested') AND starts_at <= NOW() AND excluded_until > NOW())
         OR (status = 'released' AND release_cooldown_until IS NOT NULL AND release_cooldown_until > NOW())
       )
  );
$$;

CREATE OR REPLACE FUNCTION _rg_trading_unrealized_loss(
  p_user_id UUID,
  p_currency currency
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  r RECORD;
  v_mark NUMERIC;
  v_pnl NUMERIC;
  v_loss NUMERIC := 0;
BEGIN
  FOR r IN
    SELECT id, market, side, entry_price::NUMERIC AS entry_price,
           quantity::NUMERIC AS quantity, margin_currency, open_fee::NUMERIC AS open_fee
      FROM futures_positions
     WHERE user_id = p_user_id
       AND status = 'open'
       AND margin_currency = p_currency
  LOOP
    v_mark := _assert_price_fresh(r.market);
    IF r.side = 'long' THEN
      v_pnl := r.quantity * (v_mark - r.entry_price);
    ELSE
      v_pnl := r.quantity * (r.entry_price - v_mark);
    END IF;

    IF v_pnl < 0 THEN
      v_loss := v_loss + abs(v_pnl);
    END IF;
  END LOOP;

  RETURN trunc(GREATEST(v_loss, 0), 6);
END;
$$;

CREATE OR REPLACE FUNCTION _rg_current_month_net_loss(
  p_user_id UUID,
  p_domain TEXT,
  p_currency currency,
  p_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_month_start TIMESTAMPTZ := _rg_month_start(p_at)::TIMESTAMPTZ;
  v_month_end TIMESTAMPTZ := (_rg_month_start(p_at) + INTERVAL '1 month')::TIMESTAMPTZ;
  v_realized NUMERIC := 0;
  v_unrealized NUMERIC := 0;
BEGIN
  IF p_domain = 'game' THEN
    SELECT COALESCE(SUM((stake::NUMERIC - COALESCE(payout, '0')::NUMERIC)), 0)
      INTO v_realized
      FROM game_bets
     WHERE user_id = p_user_id
       AND currency = p_currency
       AND status IN ('won', 'lost')
       AND settled_at >= v_month_start
       AND settled_at < v_month_end;
  ELSIF p_domain = 'trading' THEN
    SELECT COALESCE(SUM(
      CASE
        WHEN pl.event = 'open' THEN COALESCE(pl.fee, '0')::NUMERIC
        WHEN pl.event IN ('close', 'liquidate', 'auto_liquidate') THEN
          -COALESCE(pl.realized_pnl, '0')::NUMERIC + COALESCE(pl.fee, '0')::NUMERIC
        ELSE 0
      END
    ), 0)
      INTO v_realized
      FROM position_ledger pl
      JOIN futures_positions fp ON fp.id = pl.position_id
     WHERE pl.user_id = p_user_id
       AND fp.margin_currency = p_currency
       AND pl.created_at >= v_month_start
       AND pl.created_at < v_month_end;

    SELECT v_realized + COALESCE(SUM(fee_amount::NUMERIC), 0)
      INTO v_realized
      FROM spot_trades
     WHERE user_id = p_user_id
       AND fee_currency = p_currency
       AND created_at >= v_month_start
       AND created_at < v_month_end;

    v_unrealized := _rg_trading_unrealized_loss(p_user_id, p_currency);
  ELSE
    RAISE EXCEPTION 'rg_invalid_domain';
  END IF;

  RETURN trunc(GREATEST(v_realized + v_unrealized, 0), 6);
END;
$$;

CREATE OR REPLACE FUNCTION _rg_refresh_user_month_loss(
  p_user_id UUID,
  p_domain TEXT,
  p_currency currency,
  p_month_start DATE DEFAULT _rg_month_start(NOW())
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_net NUMERIC;
  v_limit NUMERIC;
BEGIN
  v_net := _rg_current_month_net_loss(p_user_id, p_domain, p_currency, p_month_start::TIMESTAMPTZ);
  v_limit := _rg_user_effective_limit(p_user_id, 'loss', p_domain, p_currency);

  INSERT INTO rg_loss_tracking (
    user_id, domain, currency, month_start, realized_loss, unrealized_loss, net_loss, refreshed_at
  ) VALUES (
    p_user_id, p_domain, p_currency, p_month_start, _fmt6(v_net), '0.000000', _fmt6(v_net), NOW()
  )
  ON CONFLICT (user_id, domain, currency, month_start) DO UPDATE SET
    net_loss = EXCLUDED.net_loss,
    realized_loss = EXCLUDED.realized_loss,
    unrealized_loss = EXCLUDED.unrealized_loss,
    refreshed_at = NOW();

  IF v_net >= v_limit THEN
    INSERT INTO rg_block_events (
      user_id, event_type, domain, currency, month_start,
      effective_start_at, effective_end_at, reason
    )
    SELECT p_user_id, 'loss_limit_reached', p_domain, p_currency, p_month_start,
           p_month_start::TIMESTAMPTZ,
           (p_month_start + INTERVAL '1 month')::TIMESTAMPTZ,
           'monthly_loss_limit'
     WHERE NOT EXISTS (
       SELECT 1 FROM rg_block_events
        WHERE user_id = p_user_id
          AND event_type = 'loss_limit_reached'
          AND domain = p_domain
          AND currency = p_currency
          AND month_start = p_month_start
     );
  END IF;

  RETURN jsonb_build_object('net_loss', _fmt6(v_net), 'limit', _fmt6(v_limit));
END;
$$;

CREATE OR REPLACE FUNCTION _assert_rg_domain_entry_allowed(
  p_user_id UUID,
  p_domain TEXT,
  p_currency currency
)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_month DATE := _rg_month_start(NOW());
  v_loss NUMERIC;
  v_limit NUMERIC;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF _rg_self_exclusion_active(p_user_id) THEN
    RAISE EXCEPTION 'rg_self_excluded';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rg:' || p_user_id::TEXT || ':' || p_domain || ':' || p_currency::TEXT));

  v_loss := _rg_current_month_net_loss(p_user_id, p_domain, p_currency, v_month::TIMESTAMPTZ);
  v_limit := _rg_user_effective_limit(p_user_id, 'loss', p_domain, p_currency);

  IF v_loss >= v_limit THEN
    RAISE EXCEPTION 'rg_loss_limit_reached'
      USING DETAIL = format('domain=%s currency=%s loss=%s limit=%s', p_domain, p_currency, _fmt6(v_loss), _fmt6(v_limit));
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION _assert_rg_deposit_allowed(
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
  v_month_start TIMESTAMPTZ := _rg_month_start(NOW())::TIMESTAMPTZ;
  v_month_end TIMESTAMPTZ := (_rg_month_start(NOW()) + INTERVAL '1 month')::TIMESTAMPTZ;
  v_limit NUMERIC;
  v_used NUMERIC;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF p_currency <> 'KRW' THEN
    RAISE EXCEPTION 'rg_invalid_limit_scope';
  END IF;
  IF _rg_self_exclusion_active(p_user_id) THEN
    RAISE EXCEPTION 'rg_self_excluded';
  END IF;

  v_limit := _rg_user_effective_limit(p_user_id, 'deposit', NULL, p_currency);

  SELECT COALESCE(SUM(amount_krw::NUMERIC), 0)
    INTO v_used
    FROM krw_deposit_requests
   WHERE user_id = p_user_id
     AND created_at >= v_month_start
     AND created_at < v_month_end
     AND status::TEXT NOT IN ('failed', 'expired', 'admin_rejected', 'cancelled');

  IF v_used + p_amount > v_limit THEN
    RAISE EXCEPTION 'rg_deposit_limit_exceeded'
      USING DETAIL = format('currency=%s used=%s amount=%s limit=%s', p_currency, _fmt6(v_used), _fmt6(p_amount), _fmt6(v_limit));
  END IF;
END;
$$;

-- ─── User/admin RPCs ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_set_rg_limit(
  p_limit_kind TEXT,
  p_domain TEXT,
  p_currency TEXT,
  p_amount TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_currency currency;
  v_amount NUMERIC;
  v_cap NUMERIC;
  v_existing rg_user_limits%ROWTYPE;
  v_effective NUMERIC;
  v_cooldown_hours NUMERIC;
  v_pending_at TIMESTAMPTZ;
  v_pending BOOLEAN := FALSE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM _assert_amount_text(p_amount);
  v_amount := p_amount::NUMERIC;
  IF v_amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  BEGIN
    v_currency := p_currency::currency;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_currency';
  END;

  IF p_limit_kind = 'deposit' THEN
    p_domain := NULL;
  END IF;

  v_cap := _rg_operator_cap(p_limit_kind, p_domain, v_currency);
  IF v_amount > v_cap THEN
    RAISE EXCEPTION 'rg_limit_above_operator_cap'
      USING DETAIL = format('amount=%s cap=%s', _fmt6(v_amount), _fmt6(v_cap));
  END IF;

  SELECT * INTO v_existing
    FROM rg_user_limits
   WHERE user_id = v_user_id
     AND limit_kind = p_limit_kind
     AND COALESCE(domain, '') = COALESCE(p_domain, '')
     AND currency = v_currency
   FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO rg_user_limits (user_id, limit_kind, domain, currency, current_limit)
    VALUES (v_user_id, p_limit_kind, p_domain, v_currency, _fmt6(v_amount));

    INSERT INTO audit_logs (actor_id, action, entity_type, payload)
    VALUES (v_user_id, 'rg_limit_set', 'rg_user_limits',
      jsonb_build_object('kind', p_limit_kind, 'domain', p_domain, 'currency', v_currency, 'limit', _fmt6(v_amount)));

    RETURN jsonb_build_object('ok', TRUE, 'pending', FALSE, 'current_limit', _fmt6(v_amount));
  END IF;

  v_effective := _rg_user_effective_limit(v_user_id, p_limit_kind, p_domain, v_currency);

  IF v_amount <= v_effective THEN
    UPDATE rg_user_limits
       SET current_limit = _fmt6(v_amount),
           pending_limit = NULL,
           pending_effective_at = NULL,
           last_changed_at = NOW()
     WHERE id = v_existing.id;

    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
    VALUES (v_user_id, 'rg_limit_set', 'rg_user_limits', v_existing.id,
      jsonb_build_object('kind', p_limit_kind, 'domain', p_domain, 'currency', v_currency, 'limit', _fmt6(v_amount)));
  ELSE
    v_cooldown_hours := _rg_config_numeric('rg_limit_increase_cooldown_hours', '24');
    v_pending_at := NOW() + (v_cooldown_hours || ' hours')::INTERVAL;
    v_pending := TRUE;

    UPDATE rg_user_limits
       SET pending_limit = _fmt6(v_amount),
           pending_effective_at = v_pending_at,
           last_changed_at = NOW()
     WHERE id = v_existing.id;

    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
    VALUES (v_user_id, 'rg_limit_increase_requested', 'rg_user_limits', v_existing.id,
      jsonb_build_object('kind', p_limit_kind, 'domain', p_domain, 'currency', v_currency,
                         'pending_limit', _fmt6(v_amount), 'effective_at', v_pending_at));
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'pending', v_pending,
    'current_limit', CASE WHEN v_pending THEN _fmt6(v_existing.current_limit::NUMERIC) ELSE _fmt6(v_amount) END,
    'pending_limit', CASE WHEN v_pending THEN _fmt6(v_amount) ELSE NULL END,
    'pending_effective_at', v_pending_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_set_self_exclusion(
  p_excluded_until TIMESTAMPTZ,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_min_hours NUMERIC := _rg_config_numeric('rg_self_exclusion_min_lock_hours', '24');
  v_min_release_at TIMESTAMPTZ;
  v_id UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF p_excluded_until IS NULL OR p_excluded_until <= NOW() THEN
    RAISE EXCEPTION 'rg_invalid_self_exclusion_until';
  END IF;

  v_min_release_at := NOW() + (v_min_hours || ' hours')::INTERVAL;

  INSERT INTO rg_exclusions (user_id, starts_at, excluded_until, min_release_at, reason)
  VALUES (v_user_id, NOW(), p_excluded_until, v_min_release_at, p_reason)
  RETURNING id INTO v_id;

  INSERT INTO rg_block_events (
    user_id, event_type, effective_start_at, effective_end_at, related_entity_id, reason
  ) VALUES (
    v_user_id, 'self_exclusion_started', NOW(), p_excluded_until, v_id, p_reason
  );

  INSERT INTO risk_flags (user_id, flag_type, details)
  SELECT v_user_id, 'rg_self_exclusion', jsonb_build_object('exclusion_id', v_id, 'excluded_until', p_excluded_until)
   WHERE NOT EXISTS (
     SELECT 1 FROM risk_flags
      WHERE user_id = v_user_id AND flag_type = 'rg_self_exclusion' AND status = 'active'
   );

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (v_user_id, 'rg_self_exclusion_set', 'rg_exclusions', v_id,
    jsonb_build_object('excluded_until', p_excluded_until, 'min_release_at', v_min_release_at, 'reason', p_reason));

  RETURN jsonb_build_object('ok', TRUE, 'exclusion_id', v_id, 'excluded_until', p_excluded_until, 'min_release_at', v_min_release_at);
END;
$$;

CREATE OR REPLACE FUNCTION rpc_request_self_exclusion_release(
  p_exclusion_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_row rg_exclusions%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) < 3 THEN RAISE EXCEPTION 'reason_required'; END IF;

  SELECT * INTO v_row FROM rg_exclusions WHERE id = p_exclusion_id AND user_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'rg_exclusion_not_found'; END IF;
  IF NOW() < v_row.min_release_at THEN RAISE EXCEPTION 'rg_self_exclusion_min_lock'; END IF;

  UPDATE rg_exclusions
     SET status = 'release_requested',
         release_requested_at = NOW(),
         release_requested_by = v_user_id,
         release_reason = p_reason
   WHERE id = p_exclusion_id;

  INSERT INTO admin_review_queue (queue_type, entity_type, entity_id, user_id, reason, sla_due_at, payload)
  VALUES ('rg_self_exclusion_release', 'rg_exclusions', p_exclusion_id, v_user_id, p_reason,
          NOW() + INTERVAL '24 hours', jsonb_build_object('reason', p_reason))
  ON CONFLICT DO NOTHING;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (v_user_id, 'rg_self_exclusion_release_requested', 'rg_exclusions', p_exclusion_id,
    jsonb_build_object('reason', p_reason));

  RETURN jsonb_build_object('ok', TRUE, 'status', 'release_requested');
END;
$$;

CREATE OR REPLACE FUNCTION rpc_admin_release_self_exclusion(
  p_exclusion_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_row rg_exclusions%ROWTYPE;
  v_cooldown_hours NUMERIC := _rg_config_numeric('rg_self_exclusion_release_cooldown_hours', '24');
  v_cooldown_until TIMESTAMPTZ;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT _is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) < 3 THEN RAISE EXCEPTION 'reason_required'; END IF;

  SELECT * INTO v_row FROM rg_exclusions WHERE id = p_exclusion_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'rg_exclusion_not_found'; END IF;
  IF NOW() < v_row.min_release_at THEN RAISE EXCEPTION 'rg_self_exclusion_min_lock'; END IF;

  v_cooldown_until := NOW() + (v_cooldown_hours || ' hours')::INTERVAL;

  UPDATE rg_exclusions
     SET status = 'released',
         released_at = NOW(),
         released_by = v_actor,
         release_cooldown_until = v_cooldown_until,
         release_reason = p_reason
   WHERE id = p_exclusion_id;

  UPDATE rg_block_events
     SET effective_end_at = v_cooldown_until
   WHERE related_entity_id = p_exclusion_id
     AND event_type = 'self_exclusion_started'
     AND effective_end_at > v_cooldown_until;

  INSERT INTO rg_block_events (
    user_id, event_type, effective_start_at, effective_end_at, related_entity_id, reason
  ) VALUES (
    v_row.user_id, 'self_exclusion_released', NOW(), v_cooldown_until, p_exclusion_id, p_reason
  );

  UPDATE risk_flags
     SET status = 'cleared', cleared_at = NOW(), cleared_by = v_actor
   WHERE user_id = v_row.user_id
     AND flag_type = 'rg_self_exclusion'
     AND status = 'active';

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (v_actor, 'rg_self_exclusion_released', 'rg_exclusions', p_exclusion_id,
    jsonb_build_object('reason', p_reason, 'cooldown_until', v_cooldown_until));

  RETURN jsonb_build_object('ok', TRUE, 'status', 'released', 'cooldown_until', v_cooldown_until);
END;
$$;

REVOKE ALL ON FUNCTION rpc_set_rg_limit(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_set_rg_limit(TEXT, TEXT, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION rpc_set_self_exclusion(TIMESTAMPTZ, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_set_self_exclusion(TIMESTAMPTZ, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION rpc_request_self_exclusion_release(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_request_self_exclusion_release(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION rpc_admin_release_self_exclusion(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_release_self_exclusion(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION _rg_month_start(TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _rg_config_numeric(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _rg_operator_cap(TEXT, TEXT, currency) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _rg_user_effective_limit(UUID, TEXT, TEXT, currency) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _rg_self_exclusion_active(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _rg_trading_unrealized_loss(UUID, currency) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _rg_current_month_net_loss(UUID, TEXT, currency, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _rg_refresh_user_month_loss(UUID, TEXT, currency, DATE) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _assert_rg_domain_entry_allowed(UUID, TEXT, currency) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _assert_rg_deposit_allowed(UUID, currency, NUMERIC) FROM PUBLIC, anon, authenticated;

-- ─── Entry guard injection ───────────────────────────────────────────────────
DO $$
DECLARE
  v_def TEXT;
  v_new TEXT;
BEGIN
  v_def := pg_get_functiondef('public.rpc_place_game_bet(uuid,text,text,jsonb,text,text,jsonb)'::regprocedure);
  IF position('_assert_rg_domain_entry_allowed' IN v_def) = 0 THEN
    v_new := replace(
      v_def,
      'SELECT * INTO v_round FROM game_rounds WHERE id = p_round_id FOR UPDATE;',
      'PERFORM _assert_rg_domain_entry_allowed(v_user_id, ''game'', v_ccy);

  SELECT * INTO v_round FROM game_rounds WHERE id = p_round_id FOR UPDATE;'
    );
    IF v_new = v_def THEN RAISE EXCEPTION 'rg game guard anchor not found'; END IF;
    EXECUTE v_new;
  END IF;

  v_def := pg_get_functiondef('public.rpc_open_futures_position(text,text,text,text,text,text,text,text)'::regprocedure);
  IF position('_assert_rg_domain_entry_allowed' IN v_def) = 0 THEN
    v_new := replace(
      v_def,
      'v_margin := p_margin_amount::NUMERIC;',
      'PERFORM _assert_rg_domain_entry_allowed(v_user_id, ''trading'', v_ccy);

  v_margin := p_margin_amount::NUMERIC;'
    );
    IF v_new = v_def THEN RAISE EXCEPTION 'rg futures guard anchor not found'; END IF;
    EXECUTE v_new;
  END IF;

  v_def := pg_get_functiondef('public.rpc_spot_market_buy(text,text)'::regprocedure);
  IF position('_assert_rg_domain_entry_allowed' IN v_def) = 0 THEN
    v_new := replace(
      v_def,
      'SELECT * INTO v_mkt FROM spot_markets WHERE symbol = ''PHON_USDT'' AND is_active;',
      'PERFORM _assert_rg_domain_entry_allowed(v_user_id, ''trading'', ''USDT'');

  SELECT * INTO v_mkt FROM spot_markets WHERE symbol = ''PHON_USDT'' AND is_active;'
    );
    IF v_new = v_def THEN RAISE EXCEPTION 'rg spot buy guard anchor not found'; END IF;
    EXECUTE v_new;
  END IF;

  v_def := pg_get_functiondef('public.rpc_spot_market_sell(text,text)'::regprocedure);
  IF position('_assert_rg_domain_entry_allowed' IN v_def) = 0 THEN
    v_new := replace(
      v_def,
      'SELECT * INTO v_mkt FROM spot_markets WHERE symbol = ''PHON_USDT'' AND is_active;',
      'PERFORM _assert_rg_domain_entry_allowed(v_user_id, ''trading'', ''PHON'');

  SELECT * INTO v_mkt FROM spot_markets WHERE symbol = ''PHON_USDT'' AND is_active;'
    );
    IF v_new = v_def THEN RAISE EXCEPTION 'rg spot sell guard anchor not found'; END IF;
    EXECUTE v_new;
  END IF;

  v_def := pg_get_functiondef('public.rpc_create_krw_deposit_request(text,text)'::regprocedure);
  IF position('_assert_rg_deposit_allowed' IN v_def) = 0 THEN
    v_new := replace(
      v_def,
      'IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN',
      'PERFORM _assert_rg_deposit_allowed(v_user_id, ''KRW'', p_amount_krw::NUMERIC);

  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN'
    );
    IF v_new = v_def THEN RAISE EXCEPTION 'rg deposit guard anchor not found'; END IF;
    EXECUTE v_new;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION rpc_place_game_bet(UUID, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_game_bet(UUID, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB) TO authenticated, service_role;

REVOKE ALL ON FUNCTION rpc_open_futures_position(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_open_futures_position(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION rpc_spot_market_buy(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_spot_market_buy(TEXT, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION rpc_spot_market_sell(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_spot_market_sell(TEXT, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION rpc_create_krw_deposit_request(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_create_krw_deposit_request(TEXT, TEXT) TO authenticated;

-- ─── RG-excluded affiliate commission base ───────────────────────────────────
CREATE OR REPLACE FUNCTION _rg_commission_excluded(
  p_user_id UUID,
  p_domain TEXT,
  p_currency currency,
  p_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM rg_block_events e
     WHERE e.user_id = p_user_id
       AND (e.domain IS NULL OR e.domain = p_domain)
       AND (e.currency IS NULL OR e.currency = p_currency)
       AND p_at >= e.effective_start_at
       AND p_at < e.effective_end_at
  );
$$;

CREATE OR REPLACE FUNCTION rg_affiliate_commission_base(
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ
)
RETURNS TABLE (
  referrer_id UUID,
  referred_id UUID,
  domain TEXT,
  currency currency,
  gross_revenue TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH base AS (
    SELECT
      r.referrer_id,
      r.referred_id,
      'game'::TEXT AS domain,
      sal.currency,
      CASE WHEN sal.direction = 'credit' THEN sal.amount::NUMERIC ELSE -sal.amount::NUMERIC END AS amount,
      sal.created_at
    FROM system_account_ledger sal
    JOIN game_bets gb ON gb.id::TEXT = sal.related_tx_id
    JOIN referrals r ON r.referred_id = gb.user_id
    WHERE sal.account_code IN ('game_house_phon', 'game_house_usdt')
      AND sal.reason_code = 'game_house_settle'
      AND sal.created_at >= p_from
      AND sal.created_at < p_to

    UNION ALL

    SELECT
      r.referrer_id,
      r.referred_id,
      'trading'::TEXT AS domain,
      sal.currency,
      CASE WHEN sal.direction = 'credit' THEN sal.amount::NUMERIC ELSE -sal.amount::NUMERIC END AS amount,
      sal.created_at
    FROM system_account_ledger sal
    JOIN referrals r ON r.referred_id = sal.related_user_id
    WHERE sal.account_code IN ('house_fee_phon', 'house_fee_usdt', 'insurance_fund_phon', 'insurance_fund_usdt')
      AND sal.reason_code IN ('spot_buy_fee', 'spot_sell_fee', 'futures_open_fee', 'futures_close_fee', 'futures_counterparty')
      AND sal.created_at >= p_from
      AND sal.created_at < p_to
  )
  SELECT
    b.referrer_id,
    b.referred_id,
    b.domain,
    b.currency,
    _fmt6(SUM(b.amount)) AS gross_revenue
  FROM base b
  WHERE NOT _rg_commission_excluded(b.referred_id, b.domain, b.currency, b.created_at)
  GROUP BY b.referrer_id, b.referred_id, b.domain, b.currency
  HAVING SUM(b.amount) <> 0;
$$;

REVOKE ALL ON FUNCTION _rg_commission_excluded(UUID, TEXT, currency, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION rg_affiliate_commission_base(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rg_affiliate_commission_base(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
