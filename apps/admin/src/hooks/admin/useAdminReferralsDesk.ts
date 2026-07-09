import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Tables } from '@phonara/shared-types';
import type { AdminAuditEvent } from '@/shared-types';
import { callRpc } from '../../lib/rpc';
import { supabase } from '../../lib/supabase';
import type {
  AdminReferralApprovalRow,
  ReferralApprovalFilters,
  ReferralApprovalState,
  UseAdminReferralsDesk,
} from './useAdminReferralsDeskMock';
import { formatCommissionPair, maskAffiliateId } from './useAdminReferralsDeskMock';

export type {
  AdminReferralApprovalRow,
  ReferralApprovalFilters,
  ReferralApprovalState,
  UseAdminReferralsDesk,
} from './useAdminReferralsDeskMock';

export { formatCommissionPair, maskAffiliateId } from './useAdminReferralsDeskMock';

const MIN_REASON = 4;
const QUERY_KEY = ['admin-referrals-approvals'] as const;

type ApprovalRow = Tables<'affiliate_commission_approvals'> & {
  affiliate_settlements: Pick<
    Tables<'affiliate_settlements'>,
    'settlement_date' | 'tier_code'
  > | null;
};

function mapApprovalState(status: string): ReferralApprovalState {
  if (status === 'approved' || status === 'rejected') return status;
  return 'pending';
}

function mapApproval(row: ApprovalRow): AdminReferralApprovalRow {
  const { amount, currency } = formatCommissionPair(row.total_commission);
  return {
    id: row.id,
    settlementId: row.settlement_id,
    affiliateMask: maskAffiliateId(row.affiliate_id),
    periodKey: row.affiliate_settlements?.settlement_date ?? '—',
    amount,
    currency,
    state: mapApprovalState(row.status),
    requestedAt: row.requested_at,
  };
}

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

/** Engine-backed referrals desk — commission approvals + settlement batch run (§29.2). */
export function useAdminReferralsDesk(): UseAdminReferralsDesk {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<ReferralApprovalFilters>({ search: '' });
  const [audit, setAudit] = useState<AdminAuditEvent[]>([]);

  const { data: approvals = [], refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_commission_approvals')
        .select(
          'id,settlement_id,affiliate_id,status,total_commission,requested_at,affiliate_settlements(settlement_date,tier_code)',
        )
        .order('requested_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((row) => mapApproval(row as ApprovalRow));
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const pendingApprovals = useMemo(
    () => approvals.filter((row) => row.state === 'pending'),
    [approvals],
  );

  const filteredApprovals = useMemo(
    () => filterApprovals(pendingApprovals, filters),
    [filters, pendingApprovals],
  );

  const invalidate = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: QUERY_KEY });
    await refetch();
  }, [qc, refetch]);

  const approveCommission = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      try {
        await callRpc('rpc_approve_affiliate_commission', {
          p_approval_id: id,
          p_reason: reason.trim(),
        });
        setAudit((prev) =>
          [
            {
              id: `${id}-approve-${Date.now()}`,
              at: new Date().toISOString(),
              actorKey: 'admin.primitive.audit.actor.system',
              actionKey: 'admin.referrals.audit.approve',
              subject: id,
              reason: reason.trim(),
            },
            ...prev,
          ].slice(0, 50),
        );
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [invalidate],
  );

  const runSettlements = useCallback(
    async (settlementDate: string, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      try {
        await callRpc('rpc_run_affiliate_settlements', {
          p_settlement_date: settlementDate,
        });
        setAudit((prev) =>
          [
            {
              id: `run-settlements-${Date.now()}`,
              at: new Date().toISOString(),
              actorKey: 'admin.primitive.audit.actor.system',
              actionKey: 'admin.referrals.audit.runSettlements',
              subject: settlementDate,
              reason: reason.trim(),
            },
            ...prev,
          ].slice(0, 50),
        );
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [invalidate],
  );

  const refresh = useCallback(async () => {
    await invalidate();
  }, [invalidate]);

  return {
    approvals,
    filteredApprovals,
    pendingApprovals,
    filters,
    setFilters,
    approveCommission,
    runSettlements,
    refresh,
    audit,
    resetForTest: () => {
      setFilters({ search: '' });
      setAudit([]);
    },
  };
}
