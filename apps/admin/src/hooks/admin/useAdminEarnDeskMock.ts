import { useCallback } from 'react';
import { createAdminMockHook } from '@/hooks/admin/createAdminMockHook';
import type { AdminAuditEvent } from '@/shared-types';

// L1-15-F · Admin Earn/Referral Desk mock SOT.
// Two domains: Agents (onboard/tier/suspend) + Settlements (pending/approved/paid).
// Persist under `phonara-admin-earn-*` only. Cross-desk storage 0-touch.
// String-only numeric display fields · no float math · no rpc/supabase.
// Commission state semantics = affiliate_settlements.state (pending/approved/paid).

const MIN_REASON = 4;

export type AgentTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AgentTreeDepth = '1' | '2';
export type AgentStatus = 'pending' | 'active' | 'suspended';
export type SettlementState = 'pending' | 'approved' | 'paid';

export interface AdminEarnAgentRow {
  id: string;
  agentCode: string;
  displayName: string;
  tier: AgentTier;
  treeDepth: AgentTreeDepth;
  status: AgentStatus;
  referralCount: string;
  pendingPayout: string;
  joinedAt: string;
  lastChangedAt?: string;
}

export interface AdminEarnSettlementRow {
  id: string;
  agentCode: string;
  agentDisplayName: string;
  periodKey: string;
  amount: string;
  currency: string;
  state: SettlementState;
  downlineCount?: string;
  createdAt: string;
  lastChangedAt?: string;
}

export interface AgentFilters {
  search: string;
  tier: AgentTier | 'all';
  status: AgentStatus | 'all';
}

export interface SettlementFilters {
  search: string;
  state: SettlementState | 'all';
}

// --- SEED -------------------------------------------------------------------

const SEED_AGENTS: AdminEarnAgentRow[] = [
  {
    id: 'ag_01',
    agentCode: 'PHN-A001',
    displayName: 'Aurora Park',
    tier: 'platinum',
    treeDepth: '2',
    status: 'active',
    referralCount: '184',
    pendingPayout: '12450',
    joinedAt: '2025-09-01T00:00:00.000Z',
  },
  {
    id: 'ag_02',
    agentCode: 'PHN-A002',
    displayName: 'Brennan Cole',
    tier: 'gold',
    treeDepth: '2',
    status: 'active',
    referralCount: '112',
    pendingPayout: '6820',
    joinedAt: '2025-10-12T00:00:00.000Z',
  },
  {
    id: 'ag_03',
    agentCode: 'PHN-A003',
    displayName: 'Caitlin Vu',
    tier: 'gold',
    treeDepth: '2',
    status: 'active',
    referralCount: '94',
    pendingPayout: '4310',
    joinedAt: '2025-11-04T00:00:00.000Z',
  },
  {
    id: 'ag_04',
    agentCode: 'PHN-A004',
    displayName: 'Dario Mensah',
    tier: 'silver',
    treeDepth: '1',
    status: 'active',
    referralCount: '57',
    pendingPayout: '1820',
    joinedAt: '2026-01-18T00:00:00.000Z',
  },
  {
    id: 'ag_05',
    agentCode: 'PHN-A005',
    displayName: 'Esme Rivera',
    tier: 'silver',
    treeDepth: '1',
    status: 'active',
    referralCount: '48',
    pendingPayout: '1240',
    joinedAt: '2026-02-02T00:00:00.000Z',
  },
  {
    id: 'ag_06',
    agentCode: 'PHN-A006',
    displayName: 'Felix Brand',
    tier: 'bronze',
    treeDepth: '1',
    status: 'pending',
    referralCount: '0',
    pendingPayout: '0',
    joinedAt: '2026-06-10T00:00:00.000Z',
  },
  {
    id: 'ag_07',
    agentCode: 'PHN-A007',
    displayName: 'Gita Sharma',
    tier: 'bronze',
    treeDepth: '1',
    status: 'pending',
    referralCount: '0',
    pendingPayout: '0',
    joinedAt: '2026-06-12T00:00:00.000Z',
  },
  {
    id: 'ag_08',
    agentCode: 'PHN-A008',
    displayName: 'Hiro Tanaka',
    tier: 'bronze',
    treeDepth: '2',
    status: 'pending',
    referralCount: '0',
    pendingPayout: '0',
    joinedAt: '2026-06-14T00:00:00.000Z',
  },
  {
    id: 'ag_09',
    agentCode: 'PHN-A009',
    displayName: 'Iris Volkov',
    tier: 'silver',
    treeDepth: '2',
    status: 'suspended',
    referralCount: '33',
    pendingPayout: '0',
    joinedAt: '2025-08-22T00:00:00.000Z',
  },
  {
    id: 'ag_10',
    agentCode: 'PHN-A010',
    displayName: 'Jonah Reyes',
    tier: 'bronze',
    treeDepth: '1',
    status: 'suspended',
    referralCount: '12',
    pendingPayout: '0',
    joinedAt: '2025-12-30T00:00:00.000Z',
  },
];

const SEED_SETTLEMENTS: AdminEarnSettlementRow[] = [
  {
    id: 'st_01',
    agentCode: 'PHN-A001',
    agentDisplayName: 'Aurora Park',
    periodKey: '2026-06',
    amount: '8420',
    currency: 'USDT',
    state: 'pending',
    downlineCount: '184',
    createdAt: '2026-06-15T00:00:00.000Z',
  },
  {
    id: 'st_02',
    agentCode: 'PHN-A002',
    agentDisplayName: 'Brennan Cole',
    periodKey: '2026-06',
    amount: '4310',
    currency: 'USDT',
    state: 'pending',
    downlineCount: '112',
    createdAt: '2026-06-15T00:00:00.000Z',
  },
  {
    id: 'st_03',
    agentCode: 'PHN-A003',
    agentDisplayName: 'Caitlin Vu',
    periodKey: '2026-06',
    amount: '2940',
    currency: 'USDT',
    state: 'pending',
    downlineCount: '94',
    createdAt: '2026-06-15T00:00:00.000Z',
  },
  {
    id: 'st_04',
    agentCode: 'PHN-A001',
    agentDisplayName: 'Aurora Park',
    periodKey: '2026-05',
    amount: '7980',
    currency: 'USDT',
    state: 'approved',
    downlineCount: '174',
    createdAt: '2026-05-31T00:00:00.000Z',
  },
  {
    id: 'st_05',
    agentCode: 'PHN-A004',
    agentDisplayName: 'Dario Mensah',
    periodKey: '2026-05',
    amount: '1620',
    currency: 'USDT',
    state: 'approved',
    downlineCount: '55',
    createdAt: '2026-05-31T00:00:00.000Z',
  },
  {
    id: 'st_06',
    agentCode: 'PHN-A002',
    agentDisplayName: 'Brennan Cole',
    periodKey: '2026-05',
    amount: '3960',
    currency: 'USDT',
    state: 'paid',
    downlineCount: '108',
    createdAt: '2026-05-31T00:00:00.000Z',
  },
  {
    id: 'st_07',
    agentCode: 'PHN-A005',
    agentDisplayName: 'Esme Rivera',
    periodKey: '2026-04',
    amount: '1180',
    currency: 'USDT',
    state: 'paid',
    downlineCount: '46',
    createdAt: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'st_08',
    agentCode: 'PHN-A003',
    agentDisplayName: 'Caitlin Vu',
    periodKey: '2026-04',
    amount: '0.084',
    currency: 'BTC',
    state: 'paid',
    downlineCount: '88',
    createdAt: '2026-04-30T00:00:00.000Z',
  },
];

// --- filters ---------------------------------------------------------------

function filterAgents(rows: AdminEarnAgentRow[], f: AgentFilters): AdminEarnAgentRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.tier !== 'all' && r.tier !== f.tier) return false;
    if (f.status !== 'all' && r.status !== f.status) return false;
    if (!q) return true;
    return r.agentCode.toLowerCase().includes(q) || r.displayName.toLowerCase().includes(q);
  });
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
      r.agentDisplayName.toLowerCase().includes(q) ||
      r.periodKey.toLowerCase().includes(q)
    );
  });
}

// --- hook factories --------------------------------------------------------

const useAgentsMock = createAdminMockHook<AdminEarnAgentRow, AgentFilters>({
  storageKey: 'phonara-admin-earn-agents-v1',
  seedRows: SEED_AGENTS,
  seedFilters: { search: '', tier: 'all', status: 'all' },
  filterFn: filterAgents,
  auditCap: 100,
});

const useSettlementsMock = createAdminMockHook<AdminEarnSettlementRow, SettlementFilters>({
  storageKey: 'phonara-admin-earn-settlements-v1',
  seedRows: SEED_SETTLEMENTS,
  seedFilters: { search: '', state: 'all' },
  filterFn: filterSettlements,
  auditCap: 100,
});

const AGENT_TIERS: AgentTier[] = ['bronze', 'silver', 'gold', 'platinum'];
const AGENT_STATUSES: AgentStatus[] = ['pending', 'active', 'suspended'];
const SETTLEMENT_STATES: SettlementState[] = ['pending', 'approved', 'paid'];

export interface UseAdminEarnDesk {
  // agents
  agents: AdminEarnAgentRow[];
  filteredAgents: AdminEarnAgentRow[];
  agentFilters: AgentFilters;
  setAgentFilters: (f: AgentFilters | ((p: AgentFilters) => AgentFilters)) => void;
  approveAgent: (id: string) => boolean;
  suspendAgent: (id: string, reason: string) => boolean;
  setAgentTier: (id: string, tier: AgentTier, reason: string) => boolean;
  bulkApproveAgents: (ids: string[]) => boolean;
  bulkSuspendAgents: (ids: string[], reason: string) => boolean;
  agentTiers: AgentTier[];
  agentStatuses: AgentStatus[];

  // settlements
  settlements: AdminEarnSettlementRow[];
  filteredSettlements: AdminEarnSettlementRow[];
  settlementFilters: SettlementFilters;
  setSettlementFilters: (
    f: SettlementFilters | ((p: SettlementFilters) => SettlementFilters),
  ) => void;
  approveSettlement: (id: string, reason: string) => Promise<boolean> | boolean;
  markSettlementPaid: (id: string, reason: string) => boolean;
  rejectSettlement: (id: string, reason: string) => boolean;
  bulkApproveSettlements: (ids: string[], reason: string) => boolean;
  bulkMarkSettlementsPaid: (ids: string[], reason: string) => boolean;
  settlementStates: SettlementState[];

  // shared
  audit: AdminAuditEvent[];
  loading: boolean;
  isError: boolean;
  refresh: () => Promise<void>;
  resetForTest: () => void;
}

const nowIso = () => new Date().toISOString();
const validReason = (r: string | undefined) =>
  typeof r === 'string' && r.trim().length >= MIN_REASON;

export function useAdminEarnDeskMock(): UseAdminEarnDesk {
  const ag = useAgentsMock();
  const st = useSettlementsMock();

  const approveAgent = useCallback(
    (id: string): boolean => {
      const row = ag.allRows.find((r) => r.id === id);
      if (!row) return false;
      if (row.status !== 'pending') return false;
      const at = nowIso();
      ag.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, status: 'active', lastChangedAt: at }),
      );
      ag.appendAudit({
        id: `${row.agentCode}-approve-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.earn.agents.audit.approve',
        subject: row.agentCode,
      });
      return true;
    },
    [ag],
  );

  const suspendAgent = useCallback(
    (id: string, reason: string): boolean => {
      if (!validReason(reason)) return false;
      const row = ag.allRows.find((r) => r.id === id);
      if (!row) return false;
      if (row.status === 'suspended') return false;
      const at = nowIso();
      ag.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, status: 'suspended', lastChangedAt: at }),
      );
      ag.appendAudit({
        id: `${row.agentCode}-suspend-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.earn.agents.audit.suspend',
        subject: row.agentCode,
        reason: reason.trim(),
      });
      return true;
    },
    [ag],
  );

  const setAgentTier = useCallback(
    (id: string, tier: AgentTier, reason: string): boolean => {
      if (!validReason(reason)) return false;
      const row = ag.allRows.find((r) => r.id === id);
      if (!row) return false;
      if (row.tier === tier) return false;
      const at = nowIso();
      ag.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, tier, lastChangedAt: at }),
      );
      ag.appendAudit({
        id: `${row.agentCode}-tier-${tier}-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: `admin.earn.agents.audit.tier.${tier}`,
        subject: row.agentCode,
        reason: reason.trim(),
      });
      return true;
    },
    [ag],
  );

  const bulkApproveAgents = useCallback(
    (ids: string[]): boolean => {
      let any = false;
      for (const id of ids) if (approveAgent(id)) any = true;
      return any;
    },
    [approveAgent],
  );

  const bulkSuspendAgents = useCallback(
    (ids: string[], reason: string): boolean => {
      if (!validReason(reason)) return false;
      let any = false;
      for (const id of ids) if (suspendAgent(id, reason)) any = true;
      return any;
    },
    [suspendAgent],
  );

  const approveSettlement = useCallback(
    (id: string, reason: string): boolean => {
      if (!validReason(reason)) return false;
      const row = st.allRows.find((r) => r.id === id);
      if (!row) return false;
      if (row.state !== 'pending') return false;
      const at = nowIso();
      st.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, state: 'approved', lastChangedAt: at }),
      );
      st.appendAudit({
        id: `${row.agentCode}-stl-approve-${row.periodKey}-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.earn.settlements.audit.approve',
        subject: row.agentCode,
        reason: reason.trim(),
      });
      return true;
    },
    [st],
  );

  const markSettlementPaid = useCallback(
    (id: string, reason: string): boolean => {
      if (!validReason(reason)) return false;
      const row = st.allRows.find((r) => r.id === id);
      if (!row) return false;
      if (row.state !== 'approved') return false;
      const at = nowIso();
      st.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, state: 'paid', lastChangedAt: at }),
      );
      st.appendAudit({
        id: `${row.agentCode}-stl-paid-${row.periodKey}-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.earn.settlements.audit.paid',
        subject: row.agentCode,
        reason: reason.trim(),
      });
      return true;
    },
    [st],
  );

  const rejectSettlement = useCallback(
    (id: string, reason: string): boolean => {
      if (!validReason(reason)) return false;
      const row = st.allRows.find((r) => r.id === id);
      if (!row) return false;
      if (row.state !== 'pending') return false;
      const at = nowIso();
      // Reject snaps back to pending semantics — display-only audit entry,
      // no state mutation beyond clearing approval pipeline. We keep state
      // as pending and log a reject event for visibility.
      st.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, lastChangedAt: at }),
      );
      st.appendAudit({
        id: `${row.agentCode}-stl-reject-${row.periodKey}-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.earn.settlements.audit.reject',
        subject: row.agentCode,
        reason: reason.trim(),
      });
      return true;
    },
    [st],
  );

  const bulkApproveSettlements = useCallback(
    (ids: string[], reason: string): boolean => {
      if (!validReason(reason)) return false;
      let any = false;
      for (const id of ids) if (approveSettlement(id, reason)) any = true;
      return any;
    },
    [approveSettlement],
  );

  const bulkMarkSettlementsPaid = useCallback(
    (ids: string[], reason: string): boolean => {
      if (!validReason(reason)) return false;
      let any = false;
      for (const id of ids) if (markSettlementPaid(id, reason)) any = true;
      return any;
    },
    [markSettlementPaid],
  );

  const audit: AdminAuditEvent[] = [...ag.audit, ...st.audit].sort((a, b) =>
    a.at < b.at ? 1 : a.at > b.at ? -1 : 0,
  );

  const resetForTest = useCallback(() => {
    ag.resetForTest();
    st.resetForTest();
  }, [ag, st]);

  return {
    agents: ag.allRows,
    filteredAgents: ag.rows,
    agentFilters: ag.filters,
    setAgentFilters: ag.setFilters,
    approveAgent,
    suspendAgent,
    setAgentTier,
    bulkApproveAgents,
    bulkSuspendAgents,
    agentTiers: AGENT_TIERS,
    agentStatuses: AGENT_STATUSES,

    settlements: st.allRows,
    filteredSettlements: st.rows,
    settlementFilters: st.filters,
    setSettlementFilters: st.setFilters,
    approveSettlement,
    markSettlementPaid,
    rejectSettlement,
    bulkApproveSettlements,
    bulkMarkSettlementsPaid,
    settlementStates: SETTLEMENT_STATES,

    audit,
    loading: false,
    isError: false,
    refresh: async () => undefined,
    resetForTest,
  };
}
