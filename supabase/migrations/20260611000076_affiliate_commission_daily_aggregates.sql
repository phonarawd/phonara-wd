-- ============================================================
-- T3: RG-clean affiliate commission daily aggregates
-- ============================================================
-- Materializes daily direct affiliate GGR/fee aggregates from the RG-clean base
-- function. This is a derived cache for settlement inputs, not a ledger.
-- ============================================================

SET search_path = public, pg_temp;

CREATE TABLE affiliate_commission_daily_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_date DATE NOT NULL,
  affiliate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL CHECK (domain IN ('game', 'trading')),
  currency currency NOT NULL CHECK (currency IN ('PHON', 'USDT')),
  gross_revenue TEXT NOT NULL CHECK (gross_revenue ~ '^-?\d+(\.\d+)?$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (aggregate_date, affiliate_id, referred_id, domain, currency)
);

CREATE INDEX affiliate_commission_daily_affiliate_date_idx
  ON affiliate_commission_daily_aggregates (affiliate_id, aggregate_date DESC);
CREATE INDEX affiliate_commission_daily_child_date_idx
  ON affiliate_commission_daily_aggregates (referred_id, aggregate_date DESC);

CREATE TRIGGER affiliate_commission_daily_updated_at
  BEFORE UPDATE ON affiliate_commission_daily_aggregates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE affiliate_commission_daily_aggregates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliate_commission_daily: own read"
  ON affiliate_commission_daily_aggregates FOR SELECT
  USING (auth.uid() = affiliate_id OR _is_admin());
CREATE POLICY "affiliate_commission_daily: admin rw"
  ON affiliate_commission_daily_aggregates FOR ALL
  USING (_is_admin())
  WITH CHECK (_is_admin());

REVOKE ALL ON affiliate_commission_daily_aggregates FROM PUBLIC, anon, authenticated;
GRANT SELECT ON affiliate_commission_daily_aggregates TO authenticated;
GRANT ALL ON affiliate_commission_daily_aggregates TO service_role;

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
      ar.parent_id AS referrer_id,
      ar.child_id AS referred_id,
      'game'::TEXT AS domain,
      sal.currency,
      CASE WHEN sal.direction = 'credit' THEN sal.amount::NUMERIC ELSE -sal.amount::NUMERIC END AS amount,
      sal.created_at
    FROM system_account_ledger sal
    JOIN affiliate_relationships ar ON ar.child_id = sal.related_user_id
    WHERE sal.account_code IN ('game_house_phon', 'game_house_usdt')
      AND sal.reason_code = 'game_house_settle'
      AND sal.created_at >= p_from
      AND sal.created_at < p_to

    UNION ALL

    SELECT
      ar.parent_id AS referrer_id,
      ar.child_id AS referred_id,
      'trading'::TEXT AS domain,
      sal.currency,
      CASE WHEN sal.direction = 'credit' THEN sal.amount::NUMERIC ELSE -sal.amount::NUMERIC END AS amount,
      sal.created_at
    FROM system_account_ledger sal
    JOIN affiliate_relationships ar ON ar.child_id = sal.related_user_id
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

CREATE OR REPLACE FUNCTION _refresh_affiliate_commission_daily_aggregates(
  p_from_date DATE DEFAULT CURRENT_DATE,
  p_to_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_from DATE := COALESCE(p_from_date, CURRENT_DATE);
  v_to DATE := COALESCE(p_to_date, COALESCE(p_from_date, CURRENT_DATE));
  v_day DATE;
  v_rows INT;
  v_total_rows INT := 0;
  v_days INT := 0;
BEGIN
  IF v_to < v_from THEN
    RAISE EXCEPTION 'invalid_date_range';
  END IF;
  IF v_to - v_from > 366 THEN
    RAISE EXCEPTION 'date_range_too_large';
  END IF;

  FOR v_day IN
    SELECT generate_series(v_from, v_to, INTERVAL '1 day')::DATE
  LOOP
    DELETE FROM affiliate_commission_daily_aggregates
     WHERE aggregate_date = v_day;

    INSERT INTO affiliate_commission_daily_aggregates (
      aggregate_date,
      affiliate_id,
      referred_id,
      domain,
      currency,
      gross_revenue
    )
    SELECT
      v_day,
      referrer_id,
      referred_id,
      domain,
      currency,
      gross_revenue
    FROM rg_affiliate_commission_base(v_day::TIMESTAMPTZ, (v_day + 1)::TIMESTAMPTZ);

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_total_rows := v_total_rows + v_rows;
    v_days := v_days + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'from_date', v_from,
    'to_date', v_to,
    'aggregate_days', v_days,
    'rows', v_total_rows
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_refresh_affiliate_commission_daily_aggregates(
  p_from_date DATE DEFAULT CURRENT_DATE,
  p_to_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN _refresh_affiliate_commission_daily_aggregates(p_from_date, p_to_date);
END;
$$;

REVOKE ALL ON FUNCTION rg_affiliate_commission_base(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _refresh_affiliate_commission_daily_aggregates(DATE, DATE) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION rpc_refresh_affiliate_commission_daily_aggregates(DATE, DATE) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION rg_affiliate_commission_base(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION rpc_refresh_affiliate_commission_daily_aggregates(DATE, DATE) TO authenticated, service_role;

SELECT cron.unschedule(jobid)
  FROM cron.job
 WHERE jobname = 'phonara_affiliate_commission_daily_aggregate';

SELECT cron.schedule(
  'phonara_affiliate_commission_daily_aggregate',
  '40 2 * * *',
  $cron$SELECT public.rpc_refresh_affiliate_commission_daily_aggregates(CURRENT_DATE - 1, CURRENT_DATE);$cron$
);
