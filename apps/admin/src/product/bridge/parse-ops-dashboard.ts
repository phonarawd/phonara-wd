import type { Json } from '@phonara/shared-types';

import type { CheckId, HealthStatus, OpsHealthCheck } from '@/hooks/admin/useAdminOverview';

export type OpsDashboardQueueRow = {
  queueType: string;
  openCount: number;
  overdueCount: number;
};

export type OpsDashboardAlerts = {
  open: number;
  critical: number;
};

export type OpsDashboard = {
  overallStatus: HealthStatus;
  fetchedAt: string;
  exceptionQueues: OpsDashboardQueueRow[];
  opsAlerts: OpsDashboardAlerts;
  healthChecks: OpsHealthCheck[];
};

/**
 * ADMIN_UX_CANON §3 landing order — withdrawals first, not RPC count-desc.
 * Unknown queue types sort after known ones (then overdue/open as tiebreak).
 */
export const EXCEPTION_QUEUE_CANON_ORDER = [
  'withdrawal',
  'deposit',
  'deposit_exception',
  'kyc',
  'kyc_review',
  'aml',
  'sanctions',
  'sanctions_screening',
  'affiliate',
] as const;

function exceptionQueueCanonRank(queueType: string): number {
  const idx = (EXCEPTION_QUEUE_CANON_ORDER as readonly string[]).indexOf(queueType);
  return idx === -1 ? EXCEPTION_QUEUE_CANON_ORDER.length : idx;
}

/** Presentation-only sort for home exception cards (engine payload order unchanged). */
export function sortExceptionQueuesByCanon(
  rows: readonly OpsDashboardQueueRow[],
): OpsDashboardQueueRow[] {
  return [...rows].sort((a, b) => {
    const byCanon = exceptionQueueCanonRank(a.queueType) - exceptionQueueCanonRank(b.queueType);
    if (byCanon !== 0) return byCanon;
    if (b.overdueCount !== a.overdueCount) return b.overdueCount - a.overdueCount;
    return b.openCount - a.openCount;
  });
}

function isRecord(value: Json | unknown): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStatus(value: unknown): HealthStatus {
  return value === 'critical' || value === 'warning' || value === 'ok' ? value : 'warning';
}

function parseCheckId(value: unknown): CheckId | null {
  const ids: CheckId[] = [
    'system_mode',
    'reconciliation_latest',
    'cron_liquidation_liveness',
    'liquidation_recent_error',
    'treasury_freshness',
    'operator_high_risk_actions',
    'hash_chain_integrity',
    'pending_exceptions',
    'treasury_solvency',
  ];
  return ids.includes(value as CheckId) ? (value as CheckId) : null;
}

function parseOptionalTimestamp(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return value;
}

function parseHealthCheck(value: Json): OpsHealthCheck | null {
  if (!isRecord(value)) return null;
  const id = parseCheckId(value['id']);
  if (!id) return null;
  return {
    id,
    status: parseStatus(value['status']),
    summary: typeof value['summary'] === 'string' ? value['summary'] : '',
    observedAt: parseOptionalTimestamp(value['observedAt']),
    lastRunAt: parseOptionalTimestamp(value['lastRunAt']),
    lastSuccessfulAt: parseOptionalTimestamp(value['lastSuccessfulAt']),
    lastErrorAt: parseOptionalTimestamp(value['lastErrorAt']),
    runbookKey: typeof value['runbookKey'] === 'string' ? value['runbookKey'] : '',
  };
}

function parseQueueRow(value: Json): OpsDashboardQueueRow | null {
  if (!isRecord(value)) return null;
  const queueType = typeof value['queueType'] === 'string' ? value['queueType'] : null;
  if (!queueType) return null;
  return {
    queueType,
    openCount: typeof value['openCount'] === 'number' ? value['openCount'] : 0,
    overdueCount: typeof value['overdueCount'] === 'number' ? value['overdueCount'] : 0,
  };
}

/** Parses `rpc_admin_get_ops_dashboard` JSON for the admin home surface. */
export function parseOpsDashboard(value: Json): OpsDashboard {
  if (!isRecord(value)) throw new Error('invalid_ops_dashboard');
  const rawQueues = Array.isArray(value['exceptionQueues']) ? value['exceptionQueues'] : [];
  const rawChecks = Array.isArray(value['healthChecks']) ? value['healthChecks'] : [];
  const rawAlerts = isRecord(value['opsAlerts']) ? value['opsAlerts'] : {};

  return {
    overallStatus: parseStatus(value['overallStatus']),
    fetchedAt:
      typeof value['fetchedAt'] === 'string' ? value['fetchedAt'] : new Date().toISOString(),
    exceptionQueues: sortExceptionQueuesByCanon(
      rawQueues.map(parseQueueRow).filter((row): row is OpsDashboardQueueRow => row !== null),
    ),
    opsAlerts: {
      open: typeof rawAlerts['open'] === 'number' ? rawAlerts['open'] : 0,
      critical: typeof rawAlerts['critical'] === 'number' ? rawAlerts['critical'] : 0,
    },
    healthChecks: rawChecks
      .map((row) => parseHealthCheck(row as Json))
      .filter((check): check is OpsHealthCheck => check !== null),
  };
}
