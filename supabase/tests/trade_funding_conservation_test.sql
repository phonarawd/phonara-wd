-- Trade E1: funding schedule advance (zero-rate path)
BEGIN;

DO $$
DECLARE
  v_before TIMESTAMPTZ;
  v_after TIMESTAMPTZ;
BEGIN
  UPDATE funding_rates
  SET rate = '0', next_funding_at = NOW() - INTERVAL '1 minute'
  WHERE market = 'BTCUSDT-SIM';

  SELECT next_funding_at INTO v_before FROM funding_rates WHERE market = 'BTCUSDT-SIM';

  PERFORM rpc_run_funding_accrual();

  SELECT next_funding_at INTO v_after FROM funding_rates WHERE market = 'BTCUSDT-SIM';

  IF v_after <= v_before THEN
    RAISE EXCEPTION 'expected next_funding_at advance, before=% after=%', v_before, v_after;
  END IF;
END $$;

ROLLBACK;
