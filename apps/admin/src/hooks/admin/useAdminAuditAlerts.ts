import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Json } from '@phonara/shared-types';
import type { AdminAuditEvent } from '@/components/admin/primitives';
import {
  ackOpsAlert,
  getOpsAlertsRaw,
  resolveOpsAlert,
} from '../../domain/ops';
import { useAuditLogs } from '../use-audit-logs';
import { useAdminMfaReady } from '../use-admin-mfa-ready';
import type {
  AdminAlertRow,
  AdminAuditFeedRow,
  AlertFilters,
  AuditDomain,
  AuditFilters,
  UseAdminAuditAlerts,
} from './useAdminAuditAlertsMock';

export type {
  AdminAlertRow,
  AdminAuditFeedRow,
  AlertFilters,
  AuditDomain,
  AuditFilters,
  AlertSeverity,
  AlertStatus,
  UseAdminAuditAlerts,
} from './useAdminAuditAlertsMock';

const MIN_REASON = 4;

function isRecord(value: Json | unknown): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseAlertRow(value: Json): AdminAlertRow | null {
  if (!isRecord(value)) return null;
  const id = typeof value['id'] === 'string' ? value['id'] : null;
  const sourceCheckId =
    typeof value['source_check_id'] === 'string' ? value['source_check_id'] : null;
  const severity = value['severity'];
  const status = value['status'];
  if (!id || !sourceCheckId) return null;
  if (severity !== 'warning' && severity !== 'critical') return null;
  if (status !== 'open' && status !== 'acknowledged' && status !== 'resolved') return null;
  return {
    id,
    dedupeKey:
      typeof value['dedupe_key'] === 'string' ? value['dedupe_key'] : sourceCheckId,
    sourceCheckId,
    severity,
    status,
    summary: typeof value['summary'] === 'string' ? value['summary'] : '',
    runbookKey: typeof value['runbook_key'] === 'string' ? value['runbook_key'] : '',
    firstSeenAt: typeof value['first_seen_at'] === 'string' ? value['first_seen_at'] : '',
    lastSeenAt: typeof value['last_seen_at'] === 'string' ? value['last_seen_at'] : '',
    occurrenceCount:
      typeof value['occurrence_count'] === 'number' ? value['occurrence_count'] : 1,
  };
}

async function fetchAlerts(): Promise<AdminAlertRow[]> {
  const raw = await getOpsAlertsRaw();
  if (!isRecord(raw)) return [];
  const rows = Array.isArray(raw['alerts']) ? raw['alerts'] : [];
  return rows.map(parseAlertRow).filter((row): row is AdminAlertRow => row !== null);
}

function domainForAction(action: string): AuditDomain {
  if (action.includes('withdraw') || action.includes('deposit') || action.includes('wallet')) {
    return 'wallet';
  }
  if (action.includes('kyc') || action.includes('str') || action.includes('compliance')) {
    return 'compliance';
  }
  if (action.includes('user') || action.includes('ban') || action.includes('mfa')) {
    return 'users';
  }
  if (action.includes('sport') || action.includes('market')) return 'sports';
  return 'system';
}

function withinPreset(at: string, preset: AuditFilters['datePreset']): boolean {
  if (preset === 'all') return true;
  const ms = Date.now() - new Date(at).getTime();
  if (preset === '1h') return ms <= 3_600_000;
  if (preset === '24h') return ms <= 86_400_000;
  return ms <= 604_800_000;
}

function filterAuditFeed(rows: AdminAuditFeedRow[], f: AuditFilters): AdminAuditFeedRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.domains.length > 0 && !f.domains.includes(r.domain)) return false;
    if (!withinPreset(r.at, f.datePreset)) return false;
    if (!q) return true;
    return (
      r.actionKey.toLowerCase().includes(q) ||
      (r.subject ?? '').toLowerCase().includes(q) ||
      (r.reason ?? '').toLowerCase().includes(q)
    );
  });
}

function filterAlerts(rows: AdminAlertRow[], f: AlertFilters): AdminAlertRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.severity.length > 0 && !f.severity.includes(r.severity)) return false;
    if (f.status.length > 0 && !f.status.includes(r.status)) return false;
    if (!q) return true;
    return (
      r.summary.toLowerCase().includes(q) ||
      r.sourceCheckId.toLowerCase().includes(q) ||
      r.dedupeKey.toLowerCase().includes(q)
    );
  });
}

const validReason = (r: string) => r.trim().length >= MIN_REASON;

const AUDIT_DOMAINS: AuditDomain[] = ['wallet', 'compliance', 'users', 'sports', 'system'];

/** Engine-backed alerts + audit feed — replaces mock in production hubs. */
export function useAdminAuditAlerts(): UseAdminAuditAlerts {
  const qc = useQueryClient();
  const mfaReady = useAdminMfaReady();
  const { data: alerts = [], refetch: refetchAlerts } = useQuery({
    queryKey: ['ops-alerts'],
    queryFn: fetchAlerts,
    enabled: mfaReady,
    staleTime: 60_000,
    refetchInterval: mfaReady ? 60_000 : false,
  });
  const { data: auditLogs = [], refetch: refetchAuditLogs } = useAuditLogs(200);

  const [auditFilters, setAuditFilters] = useState<AuditFilters>({
    search: '',
    domains: [],
    datePreset: 'all',
  });
  const [alertFilters, setAlertFilters] = useState<AlertFilters>({
    search: '',
    severity: [],
    status: [],
  });
  const [alertAudit, setAlertAudit] = useState<AdminAuditEvent[]>([]);

  const auditFeed = useMemo<AdminAuditFeedRow[]>(() => {
    return auditLogs.map((log) => ({
      id: log.id,
      at: log.created_at,
      actorKey: 'admin.primitive.audit.actor.system',
      domain: domainForAction(log.action),
      actionKey: log.action,
      subject:
        typeof log.payload === 'object' && log.payload !== null
          ? String((log.payload as Record<string, unknown>)['feature'] ?? log.action)
          : log.action,
      reason:
        typeof log.payload === 'object' && log.payload !== null
          ? String((log.payload as Record<string, unknown>)['reason'] ?? '')
          : undefined,
    }));
  }, [auditLogs]);

  const filteredAuditFeed = useMemo(
    () => filterAuditFeed(auditFeed, auditFilters),
    [auditFeed, auditFilters],
  );

  const filteredAlerts = useMemo(
    () => filterAlerts(alerts, alertFilters),
    [alerts, alertFilters],
  );

  const refreshAuditFeed = useCallback(() => {
    void refetchAuditLogs();
  }, [refetchAuditLogs]);

  const invalidate = useCallback(async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['ops-alerts'] }),
      qc.invalidateQueries({ queryKey: ['ops-health'] }),
      qc.invalidateQueries({ queryKey: ['audit-logs'] }),
    ]);
  }, [qc]);

  const ackAlert = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      void (async () => {
        await ackOpsAlert({ alertId: id, reason: reason.trim() });
        await invalidate();
        void refetchAlerts();
      })();
    },
    [invalidate, refetchAlerts],
  );

  const confirmAckAlert = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      try {
        await ackOpsAlert({ alertId: id, reason: reason.trim() });
        await invalidate();
        await refetchAlerts();
        return true;
      } catch {
        return false;
      }
    },
    [invalidate, refetchAlerts],
  );

  const resolveAlert = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      void (async () => {
        await resolveOpsAlert({ alertId: id, reason: reason.trim() });
        await invalidate();
        void refetchAlerts();
      })();
    },
    [invalidate, refetchAlerts],
  );

  const bulkAckAlert = useCallback(
    (ids: string[], reason: string) => {
      if (!validReason(reason)) return;
      for (const id of ids) ackAlert(id, reason);
    },
    [ackAlert],
  );

  const bulkResolveAlert = useCallback(
    (ids: string[], reason: string) => {
      if (!validReason(reason)) return;
      for (const id of ids) resolveAlert(id, reason);
    },
    [resolveAlert],
  );

  const resetForTest = useCallback(() => {
    setAuditFilters({ search: '', domains: [], datePreset: 'all' });
    setAlertFilters({ search: '', severity: [], status: [] });
    setAlertAudit([]);
  }, []);

  return {
    auditFeed,
    filteredAuditFeed,
    auditFilters,
    setAuditFilters,
    refreshAuditFeed,
    auditDomains: AUDIT_DOMAINS,
    alerts,
    filteredAlerts,
    alertFilters,
    setAlertFilters,
    ackAlert,
    resolveAlert,
    bulkAckAlert,
    bulkResolveAlert,
    alertAudit,
    resetForTest,
    confirmAckAlert,
  };
}
