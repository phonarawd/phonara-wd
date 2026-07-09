/**
 * P4-B — Trade desk observability + operator KPI baseline (Plan trade_desk_qa_audit · v6 L2).
 * Five KPI definitions · detection-layer wiring · Sentry/APM defer (ADR-004).
 *
 * Authority: TRADE_DESK_OBSERVABILITY.md · OBSERVABILITY_PRIVACY.md · ADR-004
 */

import { TRADE_WALLET_REFRESH_MAX_MS } from './trade-desk-perf-display-contract';

/** P4-B implementation todo (Plan §9). */
export const TRADE_DESK_OBSERVABILITY_TODO = 'p4-observability' as const;

/** Appendix C L2 backlog todo — five operator KPI definitions (dashboard build post-L9). */
export const TRADE_DESK_OBSERVABILITY_BACKLOG_TODO = 'backlog-kpi-dashboard' as const;

export const TRADE_DESK_OBSERVABILITY_DOC = 'docs/OPERATIONS/TRADE_DESK_OBSERVABILITY.md' as const;

export const TRADE_DESK_OBSERVABILITY_E0_SLOT =
  'docs/OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/observability-kpi-baseline.md' as const;

export const TRADE_DESK_SENTRY_DEFER_ADR =
  'docs/PRODUCT/ADR/004-trade-desk-sentry-defer.md' as const;

export const TRADE_DESK_OBSERVABILITY_PRIVACY_DOC = 'docs/OBSERVABILITY_PRIVACY.md' as const;

export type TradeDeskObservabilityLayer = 'edge' | 'db-rpc' | 'web-client' | 'operator';

export type TradeDeskKpiMetricId =
  | 'submit-success'
  | 'wallet-refresh'
  | 'realtime-disconnect'
  | 'fetch-retry'
  | 'rpc-failure';

/** Exactly five operator KPIs (Plan P4-B · v6 L2). */
export const TRADE_DESK_KPI_METRIC_IDS: readonly TradeDeskKpiMetricId[] = [
  'submit-success',
  'wallet-refresh',
  'realtime-disconnect',
  'fetch-retry',
  'rpc-failure',
] as const;

export type TradeDeskKpiRow = {
  readonly id: TradeDeskKpiMetricId;
  readonly label: string;
  readonly definition: string;
  readonly formula: string;
  readonly targetSource: string;
  readonly detectionLayer: TradeDeskObservabilityLayer;
  /** Post-deploy baseline — null until operator first measurement. */
  readonly baseline: number | null;
  readonly target: number | null;
};

export type TradeDeskDetectionLayerRow = {
  readonly layer: TradeDeskObservabilityLayer;
  readonly currentAsset: string;
  readonly gap: string;
  readonly action: string;
};

/** Wallet refresh SLA aligns with P3-A T3 advisory threshold. */
export const TRADE_DESK_KPI_WALLET_REFRESH_SLA_MS = TRADE_WALLET_REFRESH_MAX_MS;

export const TRADE_DESK_OBSERVABILITY_DETECTION_LAYERS: readonly TradeDeskDetectionLayerRow[] = [
  {
    layer: 'edge',
    currentAsset: 'supabase/functions/_shared/edge-observability.ts',
    gap: 'no trade-desk dedicated dashboard',
    action: 'soak · ops runbook · edge_ops_events read-only spotcheck',
  },
  {
    layer: 'db-rpc',
    currentAsset: '24h soak spotcheck · trade-desk-launch-rc-soak-spotcheck.sql',
    gap: 'no trade RPC SLO aggregate view',
    action: 'P3-C load/realtime soak extension · CI sql advisors',
  },
  {
    layer: 'web-client',
    currentAsset: 'RPC error → toast stable code · fetch-error banner',
    gap: 'Sentry/APM runtime SDK 0',
    action: 'ADR-004 defer + manual incident checklist (post-L9 SDK optional)',
  },
  {
    layer: 'operator',
    currentAsset: 'TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md',
    gap: 'Zero-Defect L9 observability signoff row missing',
    action: 'L9 release-approval-record · one KPI baseline measurement',
  },
] as const;

export const TRADE_DESK_KPI_MATRIX: readonly TradeDeskKpiRow[] = [
  {
    id: 'submit-success',
    label: 'Submit Success %',
    definition:
      'Trade submit RPC success divided by submit attempts (spot + futures market/limit).',
    formula: 'success_count / attempt_count × 100',
    targetSource: 'edge-observability · toast stable code · trade-toast registry',
    detectionLayer: 'web-client',
    baseline: null,
    target: null,
  },
  {
    id: 'wallet-refresh',
    label: 'Wallet Refresh %',
    definition: `Wallet balance query succeeds within ${TRADE_DESK_KPI_WALLET_REFRESH_SLA_MS}ms after fill event.`,
    formula: 'refresh_within_sla / fill_events × 100',
    targetSource: 'trade-desk-perf E2E T3 · useWallet invalidate · realtime health',
    detectionLayer: 'web-client',
    baseline: null,
    target: null,
  },
  {
    id: 'realtime-disconnect',
    label: 'Realtime Disconnect %',
    definition: 'Sessions with oracle_prices channel disconnect after first subscribe.',
    formula: 'disconnect_sessions / total_sessions × 100',
    targetSource: 'P3-C load/realtime soak · trade-market-status banner · client hook',
    detectionLayer: 'db-rpc',
    baseline: null,
    target: null,
  },
  {
    id: 'fetch-retry',
    label: 'Fetch Retry %',
    definition:
      'Desk market-data fetch error banner shown then retry succeeds without full reload.',
    formula: 'retry_success / fetch_error_events × 100',
    targetSource: 'trade-desk-fetch-error-banner · P0-1 telemetry defer',
    detectionLayer: 'web-client',
    baseline: null,
    target: null,
  },
  {
    id: 'rpc-failure',
    label: 'RPC Failure %',
    definition: 'Trade RPC 5xx, timeout, or PostgREST error divided by trade RPC calls.',
    formula: 'failure_count / rpc_call_count × 100',
    targetSource: 'CI advisors · edge logs · ops_alerts read-only',
    detectionLayer: 'edge',
    baseline: null,
    target: null,
  },
] as const;

/** Manual checklist items when Sentry/APM deferred (ADR-004). */
export const TRADE_DESK_MANUAL_INCIDENT_CHECKLIST: readonly string[] = [
  'Browser DevTools console — uncaught errors on /trade · /trade/futures submit path',
  'Network tab — trade rpc_* 4xx/5xx · PostgREST timeout · duplicate idempotency',
  'Toast stable code — no silent RPC success (trade-toast registry)',
  'trade-desk-fetch-error banner — retry clears without hard refresh',
  'trade-market-status banner — disconnect/stale/freeze vs lag classification',
  '24h soak spotcheck — oracle age · cron health · ops_alerts critical 0',
  'edge_ops_events read-only — provider_health degraded/unavailable rows',
] as const;

export function findTradeDeskKpiRow(id: TradeDeskKpiMetricId): TradeDeskKpiRow | undefined {
  return TRADE_DESK_KPI_MATRIX.find((row) => row.id === id);
}

export function isTradeDeskKpiBaselineReady(): boolean {
  return TRADE_DESK_KPI_MATRIX.every((row) => row.baseline !== null && row.target !== null);
}

export function assertTradeDeskObservabilitySync(): void {
  if (TRADE_DESK_KPI_METRIC_IDS.length !== 5) {
    throw new Error('trade-desk-observability: KPI count must be exactly 5');
  }
  if (TRADE_DESK_KPI_MATRIX.length !== TRADE_DESK_KPI_METRIC_IDS.length) {
    throw new Error('trade-desk-observability: KPI matrix out of sync with metric ids');
  }
  for (const id of TRADE_DESK_KPI_METRIC_IDS) {
    if (!findTradeDeskKpiRow(id)) {
      throw new Error(`trade-desk-observability: missing KPI row for ${id}`);
    }
  }
  if (TRADE_DESK_OBSERVABILITY_DETECTION_LAYERS.length !== 4) {
    throw new Error('trade-desk-observability: detection layers must be 4');
  }
  if (TRADE_DESK_MANUAL_INCIDENT_CHECKLIST.length < 5) {
    throw new Error('trade-desk-observability: manual checklist too short for Sentry defer');
  }
}
