import { useCallback, useMemo, useState } from 'react';

import { createAdminMockHook } from '@/hooks/admin/createAdminMockHook';
import type { AdminAuditEvent } from '@/shared-types';

const MIN_REASON = 4;

export type ReferralApprovalState = 'pending' | 'approved' | 'rejected';

export interface AdminReferralApprovalRow {
  id: string;
  settlementId: string;
  affiliateMask: string;
  periodKey: string;
  amount: string;
  currency: string;
  state: ReferralApprovalState;
  requestedAt: string;
}

export interface ReferralApprovalFilters {
  search: string;
}

const SEED_APPROVALS: AdminReferralApprovalRow[] = [
  {
    id: 'ap_01',
    settlementId: 'st_01',
    affiliateMask: 'u_aur***park',
    periodKey: '2026-06-15',
    amount: '8420.000000',
    currency: 'USDT',
    state: 'pending',
    requestedAt: '2026-06-15T10:00:00.000Z',
  },
  {
    id: 'ap_02',
    settlementId: 'st_02',
    affiliateMask: 'u_bre***cole',
    periodKey: '2026-06-15',
    amount: '4310.000000',
    currency: 'USDT',
    state: 'pending',
    requestedAt: '2026-06-15T10:05:00.000Z',
  },
  {
    id: 'ap_03',
    settlementId: 'st_03',
    affiliateMask: 'u_cai***vu',
    periodKey: '2026-06-14',
    amount: '1200000.000000',
    currency: 'PHON',
    state: 'pending',
    requestedAt: '2026-06-14T18:30:00.000Z',
  },
];

function filterApprovals(
  rows: AdminReferralApprovalRow[],
  filters: ReferralApprovalFilters,
): AdminReferralApprovalRow[] {
  const q = filters.search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (row) =>
      row.affiliateMask.toLowerCase().includes(q) ||
      row.periodKey.toLowerCase().includes(q) ||
      row.id.toLowerCase().includes(q),
  );
}

const useApprovalsMock = createAdminMockHook<AdminReferralApprovalRow, ReferralApprovalFilters>({
  storageKey: 'phonara-admin-referrals-approvals-v1',
  seedRows: SEED_APPROVALS,
  seedFilters: { search: '' },
  filterFn: filterApprovals,
  auditCap: 50,
});

export interface UseAdminReferralsDesk {
  approvals: AdminReferralApprovalRow[];
  filteredApprovals: AdminReferralApprovalRow[];
  pendingApprovals: AdminReferralApprovalRow[];
  filters: ReferralApprovalFilters;
  setFilters: (
    filters: ReferralApprovalFilters | ((prev: ReferralApprovalFilters) => ReferralApprovalFilters),
  ) => void;
  approveCommission: (id: string, reason: string) => Promise<boolean>;
  runSettlements: (settlementDate: string, reason: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  audit: AdminAuditEvent[];
  resetForTest: () => void;
}

const validReason = (reason: string) => reason.trim().length >= MIN_REASON;

export function useAdminReferralsDeskMock(): UseAdminReferralsDesk {
  const desk = useApprovalsMock();
  const [runAudit, setRunAudit] = useState<AdminAuditEvent[]>([]);

  const pendingApprovals = useMemo(
    () => desk.allRows.filter((row) => row.state === 'pending'),
    [desk.allRows],
  );

  const approveCommission = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      const row = desk.allRows.find((r) => r.id === id);
      if (!row || row.state !== 'pending') return false;
      const at = new Date().toISOString();
      desk.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, state: 'approved' }),
      );
      desk.appendAudit({
        id: `${id}-approve-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.referrals.audit.approve',
        subject: row.affiliateMask,
        reason: reason.trim(),
      });
      return true;
    },
    [desk],
  );

  const runSettlements = useCallback(
    async (_settlementDate: string, reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      const at = new Date().toISOString();
      setRunAudit((prev) =>
        [
          {
            id: `run-settlements-${at}`,
            at,
            actorKey: 'admin.primitive.audit.actor.system',
            actionKey: 'admin.referrals.audit.runSettlements',
            subject: _settlementDate,
            reason: reason.trim(),
          },
          ...prev,
        ].slice(0, 50),
      );
      return true;
    },
    [],
  );

  const refresh = useCallback(async () => {
    await Promise.resolve();
  }, []);

  const audit = useMemo(
    () => [...desk.audit, ...runAudit].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)),
    [desk.audit, runAudit],
  );

  const resetForTest = useCallback(() => {
    desk.resetForTest();
    setRunAudit([]);
  }, [desk]);

  return {
    approvals: desk.allRows,
    filteredApprovals: desk.rows,
    pendingApprovals,
    filters: desk.filters,
    setFilters: desk.setFilters,
    approveCommission,
    runSettlements,
    refresh,
    audit,
    resetForTest,
  };
}

export function maskAffiliateId(affiliateId: string): string {
  if (affiliateId.length < 10) return affiliateId;
  return `u_${affiliateId.slice(0, 3)}***${affiliateId.slice(-3)}`;
}

export function formatCommissionPair(totalCommission: unknown): {
  amount: string;
  currency: string;
} {
  if (
    typeof totalCommission === 'object' &&
    totalCommission !== null &&
    !Array.isArray(totalCommission)
  ) {
    const entries = Object.entries(totalCommission as Record<string, string>);
    if (entries.length > 0) {
      const [currency, amount] = entries[0]!;
      return { currency, amount: String(amount) };
    }
  }
  return { currency: 'PHON', amount: '0' };
}
