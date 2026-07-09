import { useCallback, useMemo, useState } from 'react';

import { createAdminMockHook } from '@/hooks/admin/createAdminMockHook';
import type { AdminAuditEvent } from '@/shared-types';
import type { AdminUserRow } from './useAdminUsersDeskMock';

const MIN_ADJUST_REASON = 8;

export type RewardCurrency = 'PHON' | 'USDT' | 'KRW';
export type RewardDirection = 'credit' | 'debit';

export interface RewardsFilters {
  search: string;
}

export interface AdminRewardAdjustmentRow {
  id: string;
  userMask: string;
  currency: RewardCurrency;
  amount: string;
  direction: RewardDirection;
  reason: string;
  at: string;
}

export interface ManualRewardAdjustInput {
  currency: RewardCurrency;
  amount: string;
  direction: RewardDirection;
  reason: string;
  clientRequestId: string;
}

const SEED_USERS: AdminUserRow[] = [
  {
    id: 'u_8af201',
    emailMasked: 'ji***@nav.kr',
    displayName: 'Jihoon K.',
    kycTier: 'tier2',
    status: 'active',
    mfaEnabled: true,
    lastSessionAt: '2026-06-17T08:02:00.000Z',
    balanceCash: '1284500',
    balanceBonus: '32000',
    balanceLocked: '0',
    activeSessions: 2,
    riskFlagCount: 0,
  },
  {
    id: 'u_3c911b',
    emailMasked: 'su***@gma.com',
    displayName: 'Suyeon P.',
    kycTier: 'tier3',
    status: 'active',
    mfaEnabled: true,
    lastSessionAt: '2026-06-17T07:48:00.000Z',
    balanceCash: '5840000',
    balanceBonus: '120000',
    balanceLocked: '240000',
    activeSessions: 1,
    riskFlagCount: 1,
  },
];

const SEED_HISTORY: AdminRewardAdjustmentRow[] = [
  {
    id: 'adj_01',
    userMask: 'ji***@nav.kr',
    currency: 'PHON',
    amount: '50000.000000',
    direction: 'credit',
    reason: '이벤트 보상 지급',
    at: '2026-06-16T14:20:00.000Z',
  },
];

function filterUsers(rows: AdminUserRow[], filters: RewardsFilters): AdminUserRow[] {
  const q = filters.search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (row) =>
      row.id.toLowerCase().includes(q) ||
      row.displayName.toLowerCase().includes(q) ||
      row.emailMasked.toLowerCase().includes(q),
  );
}

const useUsersMock = createAdminMockHook<AdminUserRow, RewardsFilters>({
  storageKey: 'phonara-admin-rewards-users-v1',
  seedRows: SEED_USERS,
  seedFilters: { search: '' },
  filterFn: filterUsers,
  auditCap: 0,
});

export interface UseAdminRewardsDesk {
  users: AdminUserRow[];
  filteredUsers: AdminUserRow[];
  filters: RewardsFilters;
  setFilters: (next: RewardsFilters | ((prev: RewardsFilters) => RewardsFilters)) => void;
  recentAdjustments: AdminRewardAdjustmentRow[];
  manualAdjust: (userId: string, input: ManualRewardAdjustInput) => Promise<boolean>;
  audit: AdminAuditEvent[];
  loading: boolean;
  isError: boolean;
  refresh: () => Promise<void>;
}

export function useAdminRewardsDeskMock(): UseAdminRewardsDesk {
  const usersMock = useUsersMock();
  const [history, setHistory] = useState<AdminRewardAdjustmentRow[]>(SEED_HISTORY);
  const [audit, setAudit] = useState<AdminAuditEvent[]>([]);
  const [loading] = useState(false);
  const [isError] = useState(false);

  const manualAdjust = useCallback(
    async (userId: string, input: ManualRewardAdjustInput): Promise<boolean> => {
      if (input.reason.trim().length < MIN_ADJUST_REASON) return false;
      const user = usersMock.allRows.find((row) => row.id === userId);
      if (!user) return false;
      const row: AdminRewardAdjustmentRow = {
        id: `adj_${Date.now()}`,
        userMask: user.emailMasked,
        currency: input.currency,
        amount: input.amount,
        direction: input.direction,
        reason: input.reason.trim(),
        at: new Date().toISOString(),
      };
      setHistory((prev) => [row, ...prev].slice(0, 50));
      setAudit((prev) =>
        [
          {
            id: row.id,
            at: row.at,
            actorKey: 'admin.primitive.audit.actor.system',
            actionKey: 'admin.rewards.audit.adjust',
            subject: userId,
            reason: row.reason,
          },
          ...prev,
        ].slice(0, 20),
      );
      return true;
    },
    [usersMock.rows],
  );

  const refresh = useCallback(async () => undefined, []);

  return useMemo(
    () => ({
      users: usersMock.allRows,
      filteredUsers: usersMock.rows,
      filters: usersMock.filters,
      setFilters: usersMock.setFilters,
      recentAdjustments: history,
      manualAdjust,
      audit,
      loading,
      isError,
      refresh,
    }),
    [audit, history, isError, loading, manualAdjust, refresh, usersMock],
  );
}
