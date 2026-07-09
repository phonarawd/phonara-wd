import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Tables } from '@phonara/shared-types';
import type { AdminAuditEvent } from '@/shared-types';
import { callRpc } from '../../lib/rpc';
import { AFFILIATE_SETTLEMENTS_ROW } from '@phonara/shared-types';
import { supabase } from '../../lib/supabase';
import type {
  AdminEarnSettlementRow,
  AgentFilters,
  AgentStatus,
  AgentTier,
  SettlementFilters,
  SettlementState,
  UseAdminEarnDesk,
} from './useAdminEarnDeskMock';

export type {
  AdminEarnAgentRow,
  AdminEarnSettlementRow,
  AgentFilters,
  AgentTier,
  AgentTreeDepth,
  AgentStatus,
  SettlementFilters,
  SettlementState,
  UseAdminEarnDesk,
} from './useAdminEarnDeskMock';

const SETTLEMENT_STATES: SettlementState[] = ['pending', 'approved', 'paid'];
const AGENT_TIERS: AgentTier[] = ['bronze', 'silver', 'gold', 'platinum'];
const AGENT_STATUSES: AgentStatus[] = ['pending', 'active', 'suspended'];

type SettlementRow = Tables<'affiliate_settlements'>;

function mapSettlementState(state: string): SettlementState {
  if (state === 'approved' || state === 'paid') return state;
  return 'pending';
}

function mapSettlement(row: SettlementRow): AdminEarnSettlementRow {
  const total =
    typeof row.total_commission === 'object' && row.total_commission !== null
      ? JSON.stringify(row.total_commission)
      : String(row.total_commission ?? '0');
  return {
    id: row.id,
    agentCode: row.affiliate_id.slice(0, 8),
    agentDisplayName: row.tier_code,
    periodKey: row.settlement_date,
    amount: total.slice(0, 48),
    currency: 'PHON',
    state: mapSettlementState(row.state),
    createdAt: row.created_at,
    lastChangedAt: row.updated_at,
  };
}

function filterSettlements(
  rows: AdminEarnSettlementRow[],
  f: SettlementFilters,
): AdminEarnSettlementRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.state !== 'all' && r.state !== f.state) return false;
    if (!q) return true;
    return (
      r.agentCode.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.periodKey.toLowerCase().includes(q)
    );
  });
}

/** Engine-backed earn desk — settlements RPC wired; agent desk Tier C (no RPC). */
export function useAdminEarnDesk(): UseAdminEarnDesk {
  const qc = useQueryClient();
  const [agentFilters, setAgentFilters] = useState<AgentFilters>({
    search: '',
    tier: 'all',
    status: 'all',
  });
  const [settlementFilters, setSettlementFilters] = useState<SettlementFilters>({
    search: '',
    state: 'all',
  });
  const [audit, setAudit] = useState<AdminAuditEvent[]>([]);

  const settlementsQuery = useQuery({
    queryKey: ['admin-earn-settlements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_settlements')
        .select(AFFILIATE_SETTLEMENTS_ROW)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map(mapSettlement);
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const settlements = settlementsQuery.data ?? [];

  const filteredSettlements = useMemo(
    () => filterSettlements(settlements, settlementFilters),
    [settlements, settlementFilters],
  );

  const invalidate = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['admin-earn-settlements'] });
    await settlementsQuery.refetch();
  }, [qc, settlementsQuery]);

  const refresh = useCallback(async () => {
    await settlementsQuery.refetch();
  }, [settlementsQuery]);

  const approveSettlement = useCallback(
    (id: string): boolean => {
      const row = settlements.find((r) => r.id === id);
      if (!row || row.state !== 'pending') return false;
      void (async () => {
        try {
          await callRpc('rpc_approve_affiliate_commission', {
            p_approval_id: id,
            p_reason: 'admin settlement approve',
          });
          setAudit((prev) =>
            [
              {
                id: `${id}-approve-${Date.now()}`,
                at: new Date().toISOString(),
                actorKey: 'admin.primitive.audit.actor.system',
                actionKey: 'admin.earn.settlements.audit.approve',
                subject: id,
              },
              ...prev,
            ].slice(0, 50),
          );
          await invalidate();
        } catch {
          // display-only failure
        }
      })();
      return true;
    },
    [invalidate, settlements],
  );

  const tierCFalse = useCallback(() => false, []);

  const bulkApproveSettlements = useCallback(
    (ids: string[]): boolean => {
      let any = false;
      for (const id of ids) {
        if (approveSettlement(id)) any = true;
      }
      return any;
    },
    [approveSettlement],
  );

  return {
    agents: [],
    filteredAgents: [],
    agentFilters,
    setAgentFilters,
    approveAgent: tierCFalse,
    suspendAgent: tierCFalse,
    setAgentTier: tierCFalse,
    bulkApproveAgents: tierCFalse,
    bulkSuspendAgents: tierCFalse,
    agentTiers: AGENT_TIERS,
    agentStatuses: AGENT_STATUSES,
    settlements,
    filteredSettlements,
    settlementFilters,
    setSettlementFilters,
    approveSettlement,
    markSettlementPaid: tierCFalse,
    rejectSettlement: tierCFalse,
    bulkApproveSettlements,
    bulkMarkSettlementsPaid: tierCFalse,
    settlementStates: SETTLEMENT_STATES,
    audit,
    loading: settlementsQuery.isLoading,
    isError: settlementsQuery.isError,
    refresh,
    resetForTest: () => {
      setAgentFilters({ search: '', tier: 'all', status: 'all' });
      setSettlementFilters({ search: '', state: 'all' });
      setAudit([]);
    },
  };
}
