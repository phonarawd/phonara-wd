-- ============================================================
-- Closed Beta readiness — engine safety inventory (no prod money rehearsal)
-- ============================================================
-- Plan todo: p6-closed-beta-money-rehearsal
-- Actual Closed Beta / real-money rehearsal is DEFERRED until operator
-- explicitly approves. This test pins prerequisites only — claim RPCs,
-- ops visibility, observability tables, emergency controls, and scenario
-- test coverage contracts. Each block ROLLBACKs — no residue.
--
-- Scenario matrix SSOT: docs/ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md
-- ============================================================

BEGIN;
DO $$
BEGIN
  RAISE NOTICE 'CLOSED BETA STATUS: prod real-money rehearsal DEFERRED — operator explicit approval required';
  RAISE NOTICE 'CLOSED BETA SSOT: docs/ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md';
END;
$$;
ROLLBACK;

-- ── P0 edge claim / webhook contracts (Beta scenarios 1–2) ───────────────────
BEGIN;
DO $$
BEGIN
  ASSERT to_regprocedure('public.rpc_service_claim_notification_dispatch_batch(text, integer, integer)') IS NOT NULL,
    'notification dispatch claim RPC must exist for beta deposit notify path';
  ASSERT to_regprocedure('public.rpc_service_complete_notification_dispatch(uuid, text, text, text, boolean)') IS NOT NULL,
    'notification dispatch complete RPC must exist';
  ASSERT to_regprocedure('public.rpc_service_claim_withdrawal_broadcast_batch(text, integer, integer)') IS NOT NULL,
    'withdrawal broadcast claim RPC must exist for beta withdrawal path';
  ASSERT to_regprocedure('public.rpc_service_mark_withdrawal_broadcast(uuid, text, text, text)') IS NOT NULL,
    'withdrawal broadcast mark RPC must exist';
  ASSERT to_regprocedure('public.rpc_service_register_pg_webhook_replay(text, bigint, text, text, text, text)') IS NOT NULL,
    'PG webhook replay RPC must exist for beta deposit ingest';
  ASSERT to_regprocedure('public.rpc_service_claim_ops_notify_batch(text, integer, integer)') IS NOT NULL,
    'ops-notify claim RPC must exist for beta ops pager path';
  ASSERT to_regprocedure('public.rpc_service_complete_ops_notify(uuid, text, text, text, boolean)') IS NOT NULL,
    'ops-notify complete RPC must exist';
  ASSERT to_regclass('public.ops_notify_outbox') IS NOT NULL,
    'ops_notify_outbox must exist for Telegram ops pager';

  ASSERT NOT has_function_privilege('anon', 'public.rpc_service_claim_notification_dispatch_batch(text, integer, integer)', 'EXECUTE'),
    'anon must NOT claim notification dispatch';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_service_claim_withdrawal_broadcast_batch(text, integer, integer)', 'EXECUTE'),
    'authenticated must NOT claim withdrawal broadcast';
  ASSERT has_function_privilege('service_role', 'public.rpc_service_claim_notification_dispatch_batch(text, integer, integer)', 'EXECUTE'),
    'service_role must claim notification dispatch';

  RAISE NOTICE 'CLOSED BETA READINESS OK — P0 edge claim/webhook contracts';
END;
$$;
ROLLBACK;

-- ── Phase 2.5 ops visibility (Beta scenario 5–6 exception handling) ──────────
BEGIN;
DO $$
DECLARE
  v_thr INT;
BEGIN
  ASSERT to_regclass('public.ops_alert_thresholds') IS NOT NULL,
    'ops_alert_thresholds must exist';
  ASSERT to_regprocedure('public.rpc_admin_get_ops_dashboard()') IS NOT NULL,
    'rpc_admin_get_ops_dashboard must exist for operator exception triage';
  ASSERT to_regprocedure('public.rpc_admin_set_alert_threshold(text, text, integer, integer, text)') IS NOT NULL,
    'rpc_admin_set_alert_threshold must exist';

  SELECT COUNT(*)::INT INTO v_thr FROM ops_alert_thresholds WHERE is_active;
  ASSERT v_thr >= 5,
    format('ops_alert_thresholds must have active seed rows, got %s', v_thr);

  ASSERT EXISTS (
    SELECT 1 FROM ops_alert_thresholds
    WHERE threshold_key = 'ops.reconciliation.mismatch_threshold'
      AND severity = 'critical'
      AND threshold_value = 1
      AND changed_by = 'system:migration'
  ), 'reconciliation mismatch must be critical threshold 1 for beta exit criteria';

  RAISE NOTICE 'CLOSED BETA READINESS OK — ops visibility contract';
END;
$$;
ROLLBACK;

-- ── Phase 6 edge observability (Beta scenario 5 provider failure path) ────────
BEGIN;
DO $$
BEGIN
  ASSERT to_regclass('public.provider_health') IS NOT NULL,
    'provider_health table must exist';
  ASSERT to_regclass('public.edge_ops_events') IS NOT NULL,
    'edge_ops_events table must exist';
  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'rpc_service_upsert_provider_health'
  ), 'rpc_service_upsert_provider_health must exist';
  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'rpc_service_record_edge_ops_event'
  ), 'rpc_service_record_edge_ops_event must exist';

  RAISE NOTICE 'CLOSED BETA READINESS OK — edge observability contract';
END;
$$;
ROLLBACK;

-- ── Emergency halt / readonly (Beta rollback procedure prerequisite) ──────────
BEGIN;
DO $$
BEGIN
  ASSERT to_regprocedure('public.rpc_set_system_mode(boolean, boolean, text)') IS NOT NULL,
    'rpc_set_system_mode must exist for beta rollback/readonly procedure';

  ASSERT EXISTS (SELECT 1 FROM app_config WHERE key = 'system_halt'),
    'app_config.system_halt must exist';
  ASSERT EXISTS (SELECT 1 FROM app_config WHERE key = 'system_readonly'),
    'app_config.system_readonly must exist';

  ASSERT NOT has_function_privilege('anon', 'public.rpc_set_system_mode(boolean, boolean, text)', 'EXECUTE'),
    'anon must NOT execute rpc_set_system_mode';

  RAISE NOTICE 'CLOSED BETA READINESS OK — emergency system mode contract';
END;
$$;
ROLLBACK;

-- ── Ledger conservation authority (Beta scenarios 1–4 invariant gate) ───────
BEGIN;
DO $$
BEGIN
  ASSERT to_regprocedure('public.verify_ledger_hash_chain(uuid)') IS NOT NULL,
    'verify_ledger_hash_chain must exist';
  ASSERT to_regprocedure('public.verify_system_account_hash_chain(text)') IS NOT NULL,
    'verify_system_account_hash_chain must exist';
  ASSERT to_regprocedure('public.rpc_run_reconciliation()') IS NOT NULL,
    'rpc_run_reconciliation must exist for beta exit reconciliation all-match';

  ASSERT to_regclass('public.reconciliation_log') IS NOT NULL,
    'reconciliation_log must exist';

  RAISE NOTICE 'CLOSED BETA READINESS OK — ledger conservation authority';
END;
$$;
ROLLBACK;

-- ── Domain settlement RPC inventory (Beta scenarios 3–4 — SQL authority only) ─
BEGIN;
DO $$
BEGIN
  ASSERT to_regprocedure(
    'public.rpc_place_game_bet(uuid, text, text, jsonb, text, text, jsonb)'
  ) IS NOT NULL,
    'rpc_place_game_bet must exist for beta scenario 3 (casino settle authority)';

  ASSERT to_regprocedure(
    'public.rpc_place_sports_bet(jsonb, text, text, text, text, text, text, text)'
  ) IS NOT NULL,
    'rpc_place_sports_bet must exist for beta scenario 4 (sports settle authority)';

  RAISE NOTICE 'CLOSED BETA READINESS OK — domain settlement RPC inventory';
END;
$$;
ROLLBACK;

-- ── Beta activation gate — documented defer (no prod flag flip in this test) ──
BEGIN;
DO $$
BEGIN
  -- Closed Beta is NOT auto-enabled. Operator must:
  --   1. Review docs/ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md
  --   2. Configure allowlist accounts + currency caps (app_config / risk config)
  --   3. Explicitly approve prod rehearsal in operator chat
  --   4. Run L5–L8 gate ladder per docs/SSOT/OPERATOR_GATES.md
  ASSERT TRUE, 'closed beta defer contract acknowledged';

  RAISE NOTICE 'CLOSED BETA READINESS COMPLETE — engine safety + testability pinned; prod rehearsal DEFERRED';
END;
$$;
ROLLBACK;
