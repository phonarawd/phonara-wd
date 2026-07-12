-- R10 — Platform rollout soak spot-check (read-only · Plan audit-r10-rollout-soak)
-- Operator gate — run on remote prod or staging during soak window.
-- Usage: psql $DATABASE_URL -f scripts/platform-r10-rollout-spotcheck.sql
BEGIN;

DO $$
DECLARE
  v_open_critical_alerts INT;
  v_pending_critical_notify INT;
  v_withdrawal_flag TEXT;
  v_cross_flag TEXT;
  v_funding_flag TEXT;
  v_system_halt TEXT;
  v_system_readonly TEXT;
  v_missing_cron INT;
  v_stale_sports_odds INT;
  v_sports_stale_threshold INT := 120;
BEGIN
  -- T1 Launch OFF rails must stay OFF during baseline soak
  SELECT value INTO v_withdrawal_flag FROM app_config WHERE key = 'feature_withdrawal_enabled';
  SELECT value INTO v_cross_flag FROM app_config WHERE key = 'feature_cross_margin_enabled';
  SELECT value INTO v_funding_flag FROM app_config WHERE key = 'feature_funding_enabled';
  SELECT value INTO v_system_halt FROM app_config WHERE key = 'system_halt';
  SELECT value INTO v_system_readonly FROM app_config WHERE key = 'system_readonly';

  IF COALESCE(v_withdrawal_flag, 'false') <> 'false' THEN
    RAISE WARNING 'R10 soak: feature_withdrawal_enabled must stay false until withdrawal 5조건 Green';
  END IF;
  IF COALESCE(v_cross_flag, 'false') <> 'false' THEN
    RAISE WARNING 'R10 soak: feature_cross_margin_enabled must stay false (T1)';
  END IF;
  IF COALESCE(v_funding_flag, 'false') <> 'false' THEN
    RAISE WARNING 'R10 soak: feature_funding_enabled must stay false (T1)';
  END IF;
  IF COALESCE(v_system_halt, 'false') = 'true' OR COALESCE(v_system_readonly, 'false') = 'true' THEN
    RAISE WARNING 'R10 soak: system_halt/system_readonly active — investigate before rail flip';
  END IF;

  -- Cron health — platform ops jobs
  SELECT COUNT(*)::INT INTO v_missing_cron
    FROM (VALUES
      ('trade-open-order-fills'),
      ('trade-spot-order-fills'),
      ('trade-stop-orders')
    ) AS expected(jobname)
   WHERE NOT EXISTS (
     SELECT 1 FROM cron.job j WHERE j.jobname = expected.jobname AND j.active
   );
  IF v_missing_cron > 0 THEN
    RAISE WARNING 'R10 soak: % trade cron job(s) missing or inactive', v_missing_cron;
  END IF;

  -- Sports odds freshness (SLO-SPORTS-ODDS)
  SELECT COUNT(*)::INT INTO v_stale_sports_odds
    FROM sports_outcomes so
    JOIN sports_events se ON se.id = so.event_id
   WHERE se.status IN ('scheduled', 'live')
     AND so.odds IS NOT NULL
     AND EXTRACT(EPOCH FROM (NOW() - COALESCE(so.updated_at, se.updated_at))) > v_sports_stale_threshold;
  IF v_stale_sports_odds > 0 THEN
    RAISE WARNING 'R10 soak: % sports outcome(s) stale > %s (SLO-SPORTS-ODDS)', v_stale_sports_odds, v_sports_stale_threshold;
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
    RAISE WARNING 'R10 soak: % open critical ops_alerts', v_open_critical_alerts;
  END IF;
  IF v_pending_critical_notify > 0 THEN
    RAISE WARNING 'R10 soak: % pending critical ops_notify_outbox rows', v_pending_critical_notify;
  END IF;

  RAISE NOTICE 'R10 platform rollout soak spotcheck complete (read-only)';
END $$;

ROLLBACK;
