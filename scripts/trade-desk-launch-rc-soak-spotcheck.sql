-- Phase 4 Launch RC — 24h prod soak spot-check (read-only · Plan §4D · P3-C extension)
-- Operator gate — run on remote prod or staging after Tier 1 green.
-- Usage: psql $DATABASE_URL -f scripts/trade-desk-launch-rc-soak-spotcheck.sql
BEGIN;

DO $$
DECLARE
  v_stale_threshold INT := 300;
  v_stale_symbols INT;
  v_open_critical_alerts INT;
  v_pending_critical_notify INT;
  v_spot_flag TEXT;
  v_futures_flag TEXT;
  v_staking_flag TEXT;
  v_funding_flag TEXT;
  v_missing_cron INT;
  -- P3-C load/realtime read-only burst spotcheck (prod write 금지)
  v_p3c_burst_window_sec INT := 60;
  v_p3c_burst_max INT := 12000;
  v_p3c_btc_min INT := 1;
  v_p3c_ticks_window INT;
  v_p3c_btc_ticks INT;
  v_p3c_symbols_no_ticks INT;
  v_p3c_oracle_tick_lag_sec NUMERIC;
BEGIN
  -- Oracle freshness — all active spot symbols < 300s
  SELECT COUNT(*)::INT INTO v_stale_symbols
    FROM spot_markets sm
    JOIN oracle_prices op ON op.symbol = sm.symbol
   WHERE sm.is_active
     AND EXTRACT(EPOCH FROM (NOW() - op.updated_at)) > v_stale_threshold;
  IF v_stale_symbols > 0 THEN
    RAISE WARNING 'Launch RC soak: % active symbol(s) oracle stale > %s', v_stale_symbols, v_stale_threshold;
  END IF;

  -- Feature flags — spot/futures/staking ON (funding per S2 may stay OFF)
  SELECT value INTO v_spot_flag FROM app_config WHERE key = 'feature_spot_enabled';
  SELECT value INTO v_futures_flag FROM app_config WHERE key = 'feature_futures_enabled';
  SELECT value INTO v_staking_flag FROM app_config WHERE key = 'feature_staking_enabled';
  SELECT value INTO v_funding_flag FROM app_config WHERE key = 'feature_funding_enabled';

  ASSERT COALESCE(v_spot_flag, 'false') = 'true', 'feature_spot_enabled must be true for Launch RC soak';
  ASSERT COALESCE(v_futures_flag, 'false') = 'true', 'feature_futures_enabled must be true for Launch RC soak';
  ASSERT COALESCE(v_staking_flag, 'false') = 'true', 'feature_staking_enabled must be true for Launch RC soak';

  -- Cron health — trade desk jobs registered
  SELECT COUNT(*)::INT INTO v_missing_cron
    FROM (VALUES
      ('trade-open-order-fills'),
      ('trade-spot-order-fills'),
      ('trade-stop-orders'),
      ('trade-funding-accrual')
    ) AS expected(jobname)
   WHERE NOT EXISTS (
     SELECT 1 FROM cron.job j WHERE j.jobname = expected.jobname AND j.active
   );
  IF v_missing_cron > 0 THEN
    RAISE WARNING 'Launch RC soak: % trade cron job(s) missing or inactive', v_missing_cron;
  END IF;

  -- Alert silence — open critical ops alerts + stuck critical notify outbox
  SELECT COUNT(*)::INT INTO v_open_critical_alerts
    FROM ops_alerts
   WHERE severity = 'critical'
     AND status IN ('open', 'acknowledged');

  SELECT COUNT(*)::INT INTO v_pending_critical_notify
    FROM ops_notify_outbox
   WHERE severity = 'critical'
     AND status IN ('pending', 'processing', 'retryable_failed', 'manual_review');

  IF v_open_critical_alerts > 0 THEN
    RAISE WARNING 'Launch RC soak: % open critical ops_alerts', v_open_critical_alerts;
  END IF;
  IF v_pending_critical_notify > 0 THEN
    RAISE WARNING 'Launch RC soak: % pending critical ops_notify_outbox rows', v_pending_critical_notify;
  END IF;

  -- P3-C: price_ticks burst observation (read-only · no INSERT simulation on prod)
  SELECT COUNT(*)::INT INTO v_p3c_ticks_window
    FROM price_ticks
   WHERE created_at > NOW() - make_interval(secs => v_p3c_burst_window_sec);

  SELECT COUNT(*)::INT INTO v_p3c_btc_ticks
    FROM price_ticks
   WHERE symbol = 'BTC_USDT'
     AND created_at > NOW() - make_interval(secs => v_p3c_burst_window_sec);

  SELECT COUNT(*)::INT INTO v_p3c_symbols_no_ticks
    FROM spot_markets sm
   WHERE sm.is_active
     AND NOT EXISTS (
       SELECT 1
         FROM price_ticks pt
        WHERE pt.symbol = sm.symbol
          AND pt.created_at > NOW() - make_interval(secs => v_p3c_burst_window_sec)
     );

  SELECT EXTRACT(EPOCH FROM (
           NOW() - COALESCE(
             (SELECT MAX(pt.created_at)
                FROM price_ticks pt
                JOIN spot_markets sm ON sm.symbol = pt.symbol AND sm.is_active),
             NOW()
           )
         )) INTO v_p3c_oracle_tick_lag_sec;

  IF COALESCE(v_spot_flag, 'false') = 'true' AND v_p3c_btc_ticks < v_p3c_btc_min THEN
    RAISE WARNING 'P3-C soak: BTC_USDT price_ticks=% in last %ss (min %)', v_p3c_btc_ticks, v_p3c_burst_window_sec, v_p3c_btc_min;
  END IF;

  IF v_p3c_symbols_no_ticks > 0 THEN
    RAISE WARNING 'P3-C soak: % active spot symbol(s) without price_ticks in last %ss', v_p3c_symbols_no_ticks, v_p3c_burst_window_sec;
  END IF;

  IF v_p3c_ticks_window > v_p3c_burst_max THEN
    RAISE WARNING 'P3-C soak: price_ticks burst % rows in %ss exceeds max %', v_p3c_ticks_window, v_p3c_burst_window_sec, v_p3c_burst_max;
  END IF;

  IF v_p3c_oracle_tick_lag_sec > v_stale_threshold THEN
    RAISE WARNING 'P3-C soak: active symbol tick lag %ss exceeds oracle stale threshold %ss', v_p3c_oracle_tick_lag_sec, v_stale_threshold;
  END IF;

  RAISE NOTICE 'Launch RC 24h soak spot-check OK — stale_symbols=% spot=% futures=% staking=% funding=% missing_cron=% open_critical_alerts=% pending_critical_notify=% p3c_ticks_window=% p3c_btc_ticks=% p3c_symbols_no_ticks=% p3c_tick_lag_s=%',
    v_stale_symbols,
    v_spot_flag,
    v_futures_flag,
    v_staking_flag,
    v_funding_flag,
    v_missing_cron,
    v_open_critical_alerts,
    v_pending_critical_notify,
    v_p3c_ticks_window,
    v_p3c_btc_ticks,
    v_p3c_symbols_no_ticks,
    v_p3c_oracle_tick_lag_sec;
END;
$$;

ROLLBACK;
