-- Phase 4 Launch RC — 24h prod soak remediation (operator gate · one-time)
-- Clears known Launch RC blockers before soak spot-check re-run.
-- Usage: psql $DATABASE_URL -f scripts/trade-desk-launch-rc-soak-remediate.sql
-- Then: psql $DATABASE_URL -f scripts/trade-desk-launch-rc-soak-spotcheck.sql
BEGIN;

-- MATIC_USDT: active market with stale oracle (>300s) — deactivate until feed restored
UPDATE spot_markets
   SET is_active = FALSE
 WHERE symbol = 'MATIC_USDT'
   AND is_active = TRUE;

-- stack_test_* critical alerts from ops pager/Telegram notify smoke — resolve residue
UPDATE ops_alerts
   SET status = 'resolved',
       resolved_at = NOW(),
       resolve_reason = 'Launch RC soak cleanup — stack_test notify smoke residue',
       updated_at = NOW()
 WHERE severity = 'critical'
   AND status IN ('open', 'acknowledged')
   AND (
     dedupe_key LIKE 'stack_test_%'
     OR runbook_key LIKE 'stack_test_%'
   );

DO $$
DECLARE
  v_stale_symbols INT;
  v_open_critical_alerts INT;
BEGIN
  SELECT COUNT(*)::INT INTO v_stale_symbols
    FROM spot_markets sm
    JOIN oracle_prices op ON op.symbol = sm.symbol
   WHERE sm.is_active
     AND EXTRACT(EPOCH FROM (NOW() - op.updated_at)) > 300;

  SELECT COUNT(*)::INT INTO v_open_critical_alerts
    FROM ops_alerts
   WHERE severity = 'critical'
     AND status IN ('open', 'acknowledged');

  IF v_stale_symbols > 0 THEN
    RAISE EXCEPTION 'Launch RC soak remediate incomplete: % stale active symbol(s) remain', v_stale_symbols;
  END IF;
  IF v_open_critical_alerts > 0 THEN
    RAISE EXCEPTION 'Launch RC soak remediate incomplete: % open critical alert(s) remain', v_open_critical_alerts;
  END IF;

  RAISE NOTICE 'Launch RC soak remediate OK — stale_symbols=0 open_critical_alerts=0';
END;
$$;

COMMIT;
