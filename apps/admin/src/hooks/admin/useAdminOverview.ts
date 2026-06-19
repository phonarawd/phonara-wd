import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Json } from '@phonara/shared-types';
import { getOpsAlertsRaw, getOpsHealthRaw } from '../../domain/ops';
import { useAppConfig } from '../use-app-config';
import { useAdminMfaReady } from '../use-admin-mfa-ready';

export type HealthStatus = 'ok' | 'warning' | 'critical';

export type CheckId =
  | 'system_mode'
  | 'reconciliation_latest'
  | 'cron_liquidation_liveness'
  | 'liquidation_recent_error'
  | 'treasury_freshness'
  | 'operator_high_risk_actions'
  | 'hash_chain_integrity'
  | 'pending_exceptions'
  | 'treasury_solvency';

export interface OpsHealthCheck {
  id: CheckId;
  status: HealthStatus;
  summary: string;
  observedAt: string | null;
  lastRunAt: string | null;
  lastSuccessfulAt: string | null;
  lastErrorAt: string | null;
  runbookKey: string;
}

export interface OpsHealthResponse {
  status: HealthStatus;
  lastUpdatedAt: string;
  checks: OpsHealthCheck[];
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

function parseCheck(value: Json): OpsHealthCheck | null {
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

export function parseOpsHealth(value: Json): OpsHealthResponse {
  if (!isRecord(value)) throw new Error('invalid_ops_health');
  const status = parseStatus(value['status']);
  const lastUpdatedAt =
    typeof value['lastUpdatedAt'] === 'string' ? value['lastUpdatedAt'] : new Date().toISOString();
  const rawChecks = Array.isArray(value['checks']) ? value['checks'] : [];
  return {
    status,
    lastUpdatedAt,
    checks: rawChecks.map(parseCheck).filter((check): check is OpsHealthCheck => check !== null),
  };
}

async function fetchOpsHealth(): Promise<OpsHealthResponse> {
  return parseOpsHealth(await getOpsHealthRaw());
}

async function fetchOpsAlertsSummary(): Promise<{ unresolved: number }> {
  const data = await getOpsAlertsRaw(['open', 'acknowledged']);
  if (!isRecord(data)) return { unresolved: 0 };
  const rawAlerts = Array.isArray(data['alerts']) ? data['alerts'] : [];
  const unresolved = rawAlerts.filter((row) => {
    if (!isRecord(row)) return false;
    const status = row['status'];
    return status === 'open' || status === 'acknowledged';
  }).length;
  return { unresolved };
}

export function findHealthCheck(
  checks: OpsHealthCheck[],
  id: CheckId,
): OpsHealthCheck | undefined {
  return checks.find((check) => check.id === id);
}

/** Engine-backed overview health + alert summary (Tier A). */
export function useAdminOverview() {
  const qc = useQueryClient();
  const { data: fallbackConfig } = useAppConfig();
  const mfaReady = useAdminMfaReady();

  const healthQuery = useQuery({
    queryKey: ['ops-health', 'overview'],
    queryFn: fetchOpsHealth,
    enabled: mfaReady,
    staleTime: 60_000,
    refetchInterval: mfaReady ? 60_000 : false,
  });

  const alertsQuery = useQuery({
    queryKey: ['ops-alerts-summary'],
    queryFn: fetchOpsAlertsSummary,
    enabled: mfaReady,
    staleTime: 60_000,
    refetchInterval: mfaReady ? 60_000 : false,
  });

  const refreshAll = useCallback(async () => {
    await Promise.all([
      healthQuery.refetch(),
      alertsQuery.refetch(),
      qc.invalidateQueries({ queryKey: ['app-config'] }),
    ]);
  }, [alertsQuery, healthQuery, qc]);

  return {
    health: healthQuery.data,
    isLoading: healthQuery.isLoading,
    isFetching: healthQuery.isFetching,
    error: healthQuery.error,
    unresolvedAlerts: alertsQuery.data?.unresolved ?? 0,
    fallbackConfig,
    refreshAll,
  };
}
