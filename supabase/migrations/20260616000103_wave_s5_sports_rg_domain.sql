-- ============================================================
-- Migration: 20260616000103_wave_s5_sports_rg_domain
-- RG domain wiring for sportsbook place path
-- ============================================================

SET search_path = public, pg_temp;

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
    IF p_domain NOT IN ('game', 'trading', 'sports') OR p_currency NOT IN ('PHON', 'USDT') THEN
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
  ELSIF p_domain = 'sports' THEN
    SELECT COALESCE(SUM((
      stake::NUMERIC - CASE WHEN status = 'won' THEN potential_payout::NUMERIC ELSE 0 END
    )), 0)
      INTO v_realized
      FROM sports_bets
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

INSERT INTO app_config (key, value, description) VALUES
  ('rg_operator_loss_cap_sports_phon', '1000000.000000', 'Operator default monthly sports PHON loss cap.'),
  ('rg_operator_loss_cap_sports_usdt', '100000.000000', 'Operator default monthly sports USDT loss cap.')
ON CONFLICT (key) DO NOTHING;
