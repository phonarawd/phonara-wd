-- ============================================================
-- Migration: 20260721000005_trade_t0d_candles_display_safety.sql
-- Trade Wave T0-d: rpc_get_candles display safety + settlement boundary
-- ============================================================
-- Display-only: when price_ticks count is 0–1, forward-fill flat bars from
-- oracle_prices mark (min N bars) so charts are not empty.
-- Settlement boundary: money RPCs use oracle_prices + _assert_price_fresh only;
-- rpc_get_candles output must never feed settlement (enforced by SQL grep tests).
-- ============================================================

SET search_path = public, pg_temp;

INSERT INTO app_config (key, value, description, is_public)
VALUES
  (
    'candles_oracle_forward_fill_min_bars',
    '60',
    'T0-d: minimum display-only forward-fill bars when price_ticks count is 0–1.',
    FALSE
  ),
  (
    'trade_t0d_candles_display_safety_version',
    '1',
    'T0-d rpc_get_candles oracle forward-fill + settlement boundary gate.',
    FALSE
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  is_public = FALSE,
  updated_at = NOW();

CREATE OR REPLACE FUNCTION rpc_get_candles(
  p_symbol   TEXT,
  p_interval TEXT,
  p_limit    INT DEFAULT 200
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sec           INT;
  v_interval      INTERVAL;
  v_limit         INT := LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500);
  v_series_limit  INT;
  v_precision     INT;
  v_has_spot      BOOLEAN;
  v_oracle_price  NUMERIC;
  v_tick_count    INT;
  v_min_bars      INT := 60;
  v_oracle_seed   BOOLEAN := FALSE;
BEGIN
  v_sec := CASE p_interval
    WHEN '1m' THEN 60
    WHEN '3m' THEN 180
    WHEN '5m' THEN 300
    WHEN '15m' THEN 900
    WHEN '1h' THEN 3600
    WHEN '4h' THEN 14400
    WHEN '1d' THEN 86400
    ELSE NULL
  END;

  IF v_sec IS NULL THEN
    RAISE EXCEPTION 'invalid_interval';
  END IF;

  v_interval := (v_sec || ' seconds')::INTERVAL;

  SELECT COALESCE(
    (SELECT price_precision FROM futures_markets WHERE symbol = p_symbol),
    (SELECT price_precision FROM spot_markets WHERE symbol = p_symbol),
    6
  ) INTO v_precision;

  SELECT EXISTS (SELECT 1 FROM spot_markets WHERE symbol = p_symbol) INTO v_has_spot;

  SELECT COALESCE(
    (SELECT value::INT FROM app_config WHERE key = 'candles_oracle_forward_fill_min_bars'),
    60
  ) INTO v_min_bars;
  v_min_bars := LEAST(GREATEST(v_min_bars, 1), 500);

  SELECT price::NUMERIC INTO v_oracle_price
    FROM oracle_prices
   WHERE symbol = p_symbol
     AND price::NUMERIC > 0;

  SELECT COUNT(*)::INT INTO v_tick_count
    FROM price_ticks
   WHERE symbol = p_symbol;

  v_oracle_seed := (v_tick_count <= 1 AND v_oracle_price IS NOT NULL);
  v_series_limit := CASE
    WHEN v_oracle_seed THEN LEAST(v_limit, v_min_bars)
    ELSE v_limit
  END;

  RETURN (
    WITH tick_buckets AS (
      SELECT
        date_bin(v_interval, created_at, '1970-01-01 00:00:00+00'::TIMESTAMPTZ) AS bucket_at,
        (ARRAY_AGG(price::NUMERIC ORDER BY created_at ASC))[1] AS o,
        MAX(price::NUMERIC) AS h,
        MIN(price::NUMERIC) AS l,
        (ARRAY_AGG(price::NUMERIC ORDER BY created_at DESC))[1] AS c
      FROM price_ticks
      WHERE symbol = p_symbol
      GROUP BY 1
    ),
    tick_bounds AS (
      SELECT MAX(bucket_at) AS max_tick_bucket FROM tick_buckets
    ),
    bounds AS (
      SELECT
        CASE
          WHEN v_oracle_seed THEN
            GREATEST(
              COALESCE(
                (SELECT max_tick_bucket FROM tick_bounds),
                '-infinity'::TIMESTAMPTZ
              ),
              date_bin(v_interval, NOW(), '1970-01-01 00:00:00+00'::TIMESTAMPTZ)
            )
          ELSE (SELECT max_tick_bucket FROM tick_bounds)
        END AS max_bucket
    ),
    series AS (
      SELECT generate_series(
        max_bucket - ((v_series_limit - 1) * v_interval),
        max_bucket,
        v_interval
      ) AS bucket_at
      FROM bounds
      WHERE max_bucket IS NOT NULL
    ),
    spot_volume AS (
      SELECT
        date_bin(v_interval, created_at, '1970-01-01 00:00:00+00'::TIMESTAMPTZ) AS bucket_at,
        SUM(phon_amount::NUMERIC) AS volume
      FROM spot_trades
      WHERE market = p_symbol
      GROUP BY 1
    ),
    filled AS (
      SELECT
        s.bucket_at,
        COALESCE(tb.o, prev.c, CASE WHEN v_oracle_seed THEN v_oracle_price END) AS o,
        COALESCE(tb.h, prev.c, CASE WHEN v_oracle_seed THEN v_oracle_price END) AS h,
        COALESCE(tb.l, prev.c, CASE WHEN v_oracle_seed THEN v_oracle_price END) AS l,
        COALESCE(tb.c, prev.c, CASE WHEN v_oracle_seed THEN v_oracle_price END) AS c,
        CASE
          WHEN v_has_spot THEN COALESCE(sv.volume, 0)
          ELSE NULL
        END AS volume
      FROM series s
      LEFT JOIN tick_buckets tb ON tb.bucket_at = s.bucket_at
      LEFT JOIN spot_volume sv ON sv.bucket_at = s.bucket_at
      LEFT JOIN LATERAL (
        SELECT c
          FROM tick_buckets prior
         WHERE prior.bucket_at < s.bucket_at
         ORDER BY prior.bucket_at DESC
         LIMIT 1
      ) prev ON TRUE
    )
    SELECT COALESCE(
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'time', EXTRACT(EPOCH FROM bucket_at)::BIGINT,
          'open', ROUND(o, v_precision)::TEXT,
          'high', ROUND(h, v_precision)::TEXT,
          'low', ROUND(l, v_precision)::TEXT,
          'close', ROUND(c, v_precision)::TEXT,
          'volume', CASE WHEN volume IS NULL THEN NULL ELSE _fmt6(volume) END
        )
        ORDER BY bucket_at
      ),
      '[]'::JSONB
    )
    FROM filled
    WHERE c IS NOT NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_candles(TEXT, TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_candles(TEXT, TEXT, INT) TO authenticated, service_role;
