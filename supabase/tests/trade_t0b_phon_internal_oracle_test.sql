-- ============================================================
-- Trade T0-b sub-gate: PHON internal oracle (S3)
-- ============================================================
-- Proves internal 1min cron tick append, PHONUSDT-PERP mark mirror,
-- admin override path, and no external market_sources for PHON.
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_phon_source_count INT;
  v_perp_source_count INT;
  v_cron_jobid BIGINT;
  v_ticks_before INT;
  v_ticks_after INT;
  v_perp_ticks_before INT;
  v_perp_ticks_after INT;
  v_phon_price TEXT;
  v_perp_price TEXT;
  v_res JSONB;
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', true);

  SELECT COUNT(*)::INT INTO v_phon_source_count
    FROM market_sources
   WHERE internal_symbol = 'PHON_USDT'
     AND provider IN ('binance', 'bybit', 'okx')
     AND enabled = TRUE;
  ASSERT v_phon_source_count = 0,
    format('PHON_USDT must not have external market_sources, got %s', v_phon_source_count);

  SELECT COUNT(*)::INT INTO v_perp_source_count
    FROM market_sources
   WHERE internal_symbol = 'PHONUSDT-PERP'
     AND provider IN ('binance', 'bybit', 'okx')
     AND enabled = TRUE;
  ASSERT v_perp_source_count = 0,
    format('PHONUSDT-PERP must not have external market_sources, got %s', v_perp_source_count);

  SELECT jobid INTO v_cron_jobid
    FROM cron.job
   WHERE jobname = 'phonara_phon_internal_oracle';
  ASSERT v_cron_jobid IS NOT NULL,
    'phonara_phon_internal_oracle cron job must exist';

  ASSERT EXISTS (
    SELECT 1 FROM app_config WHERE key = 'phon_internal_oracle_enabled' AND value = 'true'
  ), 'phon_internal_oracle_enabled app_config must be true';

  -- Internal cron: re-publish current mark, append ticks, mirror PERP.
  UPDATE market_circuit_breakers
     SET is_halted = FALSE,
         max_tick_pct = 10.0,
         staleness_seconds = 300,
         halt_reason = NULL,
         halted_at = NULL,
         price_at_halt = NULL,
         resumed_at = NULL,
         updated_at = NOW()
   WHERE symbol IN ('PHON_USDT', 'PHONUSDT-PERP');
  UPDATE spot_markets SET is_active = TRUE WHERE symbol = 'PHON_USDT';
  UPDATE futures_markets SET is_active = TRUE WHERE symbol = 'PHONUSDT-PERP';

  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES
    ('PHON_USDT', '0.010000', NOW()),
    ('PHONUSDT-PERP', '0.009500', NOW())
  ON CONFLICT (symbol) DO UPDATE
    SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

  SELECT COUNT(*)::INT INTO v_ticks_before FROM price_ticks WHERE symbol = 'PHON_USDT';
  SELECT COUNT(*)::INT INTO v_perp_ticks_before FROM price_ticks WHERE symbol = 'PHONUSDT-PERP';

  v_res := rpc_run_phon_internal_oracle();
  ASSERT COALESCE((v_res->>'circuit_breaker_triggered')::BOOLEAN, FALSE) = FALSE,
    format('internal cron must not trip PHON circuit breaker, got %s', v_res);
  ASSERT v_res->>'price' = '0.010000',
    format('internal cron must re-publish PHON mark, got %s', v_res);

  SELECT COUNT(*)::INT INTO v_ticks_after FROM price_ticks WHERE symbol = 'PHON_USDT';
  SELECT COUNT(*)::INT INTO v_perp_ticks_after FROM price_ticks WHERE symbol = 'PHONUSDT-PERP';
  ASSERT v_ticks_after = v_ticks_before + 1,
    format('PHON internal cron must append one price_tick, before=%s after=%s', v_ticks_before, v_ticks_after);
  ASSERT v_perp_ticks_after = v_perp_ticks_before + 1,
    format('PERP mirror must append one price_tick, before=%s after=%s', v_perp_ticks_before, v_perp_ticks_after);

  SELECT price INTO v_phon_price FROM oracle_prices WHERE symbol = 'PHON_USDT';
  SELECT price INTO v_perp_price FROM oracle_prices WHERE symbol = 'PHONUSDT-PERP';
  ASSERT v_phon_price = '0.010000',
    format('PHON oracle price must remain 0.010000 after cron, got %s', v_phon_price);
  ASSERT v_perp_price = v_phon_price,
    format('PHONUSDT-PERP must mirror PHON_USDT mark, phon=%s perp=%s', v_phon_price, v_perp_price);

  -- Admin override: new PHON mark mirrors PERP.
  v_res := rpc_update_oracle_price('PHON_USDT', '0.010100', 'admin regression test', 'admin');
  ASSERT COALESCE((v_res->>'circuit_breaker_triggered')::BOOLEAN, FALSE) = FALSE,
    format('admin PHON update must succeed, got %s', v_res);
  ASSERT (v_res->'perp_mirror'->>'price') = '0.010100',
    format('admin PHON update must mirror PERP, got %s', v_res);

  SELECT price INTO v_perp_price FROM oracle_prices WHERE symbol = 'PHONUSDT-PERP';
  ASSERT v_perp_price = '0.010100',
    format('PHONUSDT-PERP must equal admin-updated PHON mark, got %s', v_perp_price);
END;
$$;

DO $$
BEGIN
  ASSERT NOT has_function_privilege(
    'anon',
    'public.rpc_run_phon_internal_oracle()',
    'EXECUTE'
  ), 'anon must not execute rpc_run_phon_internal_oracle';
  ASSERT has_function_privilege(
    'service_role',
    'public.rpc_run_phon_internal_oracle()',
    'EXECUTE'
  ), 'service_role must execute rpc_run_phon_internal_oracle';
END;
$$;

ROLLBACK;
