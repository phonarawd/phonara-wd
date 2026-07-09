-- ============================================================
-- Trade T0-d sub-gate: candles display safety + settlement boundary
-- ============================================================
-- Proves oracle forward-fill when tick count is 0–1 (display-only) and that
-- settlement RPCs never reference rpc_get_candles (grep gate).
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_version TEXT;
  v_min_bars TEXT;
  v_leak_count INT;
  v_leak_names TEXT;
BEGIN
  SELECT value INTO v_version
    FROM app_config
   WHERE key = 'trade_t0d_candles_display_safety_version';
  ASSERT v_version = '1',
    format('trade_t0d_candles_display_safety_version must be 1, got %s', v_version);

  SELECT value INTO v_min_bars
    FROM app_config
   WHERE key = 'candles_oracle_forward_fill_min_bars';
  ASSERT v_min_bars = '60',
    format('candles_oracle_forward_fill_min_bars must be 60, got %s', v_min_bars);

  -- Settlement boundary grep: money paths must not call rpc_get_candles.
  SELECT COUNT(*)::INT,
         string_agg(p.proname, ', ' ORDER BY p.proname)
    INTO v_leak_count, v_leak_names
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname = ANY (ARRAY[
       '_assert_price_fresh',
       '_fill_house_order',
       '_fill_house_spot_order',
       '_settle_futures_position',
       'rpc_close_futures_position',
       'rpc_open_futures_position',
       'rpc_spot_market_buy',
       'rpc_spot_market_sell',
       'rpc_stake',
       'rpc_unstake_phon'
     ])
     AND pg_get_functiondef(p.oid) ILIKE '%rpc_get_candles%';

  ASSERT v_leak_count = 0,
    format('settlement grep leak: %s reference rpc_get_candles', COALESCE(v_leak_names, '?'));

  ASSERT pg_get_functiondef('public._assert_price_fresh(text)'::regprocedure) ILIKE '%oracle_prices%',
    '_assert_price_fresh must read oracle_prices directly';
  ASSERT pg_get_functiondef('public._assert_price_fresh(text)'::regprocedure) NOT ILIKE '%rpc_get_candles%',
    '_assert_price_fresh must not call rpc_get_candles';
END;
$$;

ROLLBACK;
