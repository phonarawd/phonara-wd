import { useCallback, useMemo, useState } from 'react';

import { useAuditLogs } from '../use-audit-logs';
import type { AdminAuditFeedRow, AuditDomain, AuditFilters } from './useAdminAuditAlertsMock';

const AUDIT_DOMAINS: AuditDomain[] = ['wallet', 'compliance', 'users', 'sports', 'system'];

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

function filterAuditFeed(rows: AdminAuditFeedRow[], filters: AuditFilters): AdminAuditFeedRow[] {
  const q = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.domains.length > 0 && !filters.domains.includes(row.domain)) return false;
    if (!withinPreset(row.at, filters.datePreset)) return false;
    if (!q) return true;
    return (
      row.actionKey.toLowerCase().includes(q) ||
      (row.subject ?? '').toLowerCase().includes(q) ||
      (row.reason ?? '').toLowerCase().includes(q)
    );
  });
}

function payloadField(payload: unknown, key: string): string {
  if (typeof payload !== 'object' || payload === null) return '';
  const value = (payload as Record<string, unknown>)[key];
  return value == null ? '' : String(value);
}

/** Read-only audit desk (`/audit`) — backed by `useAuditLogs`. */
export function useAdminAuditDesk() {
  const { data: auditLogs = [], isLoading, isError, isFetching, refetch } = useAuditLogs(200);

  const [auditFilters, setAuditFilters] = useState<AuditFilters>({
    search: '',
    domains: [],
    datePreset: 'all',
  });

  const auditFeed = useMemo<AdminAuditFeedRow[]>(() => {
    return auditLogs.map((log) => {
      const subjectFromPayload =
        payloadField(log.payload, 'subject') || payloadField(log.payload, 'feature');
      return {
        id: log.id,
        at: log.created_at,
        actorKey: 'admin.primitive.audit.actor.system',
        domain: domainForAction(log.action),
        actionKey: log.action,
        subject: log.entity_id ?? (subjectFromPayload || '—'),
        reason: payloadField(log.payload, 'reason') || undefined,
      };
    });
  }, [auditLogs]);

  const filteredAuditFeed = useMemo(
    () => filterAuditFeed(auditFeed, auditFilters),
    [auditFeed, auditFilters],
  );

  const refreshAuditFeed = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    auditFeed,
    filteredAuditFeed,
    auditFilters,
    setAuditFilters,
    refreshAuditFeed,
    auditDomains: AUDIT_DOMAINS,
    isLoading,
    isError,
    isFetching,
  };
}
