import { useCallback, useMemo } from 'react';
import { createAdminMockHook } from '@/hooks/admin/createAdminMockHook';
import type { AdminAuditEvent } from '@/shared-types';
// L1-15-C C1 — admin users desk mock SOT.
// createAdminMockHook single instance + facade. mock/display-only. supabase/rpc 0.
// Balance fields are STRINGS — never parseFloat / Number(.

const MIN_REASON = 4;

export type UserStatus = 'active' | 'suspended' | 'banned';
export type KycTier = 'tier0' | 'tier1' | 'tier2' | 'tier3';

export interface AdminUserRow {
  id: string;
  emailMasked: string;
  displayName: string;
  kycTier: KycTier;
  status: UserStatus;
  mfaEnabled: boolean;
  lastSessionAt: string;
  balanceCash: string;
  balanceBonus: string;
  balanceLocked: string;
  activeSessions: number;
  riskFlagCount: number;
}

export interface UsersFilters {
  search: string;
  status: UserStatus[];
  kyc: KycTier[];
}

export interface AdminUserSelfExclusion {
  id: string;
  userId: string;
  status: 'active' | 'release_requested';
  excludedUntil: string;
}

const SEED: AdminUserRow[] = [
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
  {
    id: 'u_b15e30',
    emailMasked: 'an***@kak.io',
    displayName: 'Andre L.',
    kycTier: 'tier1',
    status: 'active',
    mfaEnabled: false,
    lastSessionAt: '2026-06-17T06:55:00.000Z',
    balanceCash: '192000',
    balanceBonus: '8000',
    balanceLocked: '0',
    activeSessions: 1,
    riskFlagCount: 0,
  },
  {
    id: 'u_e0820c',
    emailMasked: 'mi***@nav.kr',
    displayName: 'Minji R.',
    kycTier: 'tier2',
    status: 'active',
    mfaEnabled: true,
    lastSessionAt: '2026-06-17T05:20:00.000Z',
    balanceCash: '742000',
    balanceBonus: '0',
    balanceLocked: '55000',
    activeSessions: 3,
    riskFlagCount: 0,
  },
  {
    id: 'u_12c4a9',
    emailMasked: 'ke***@out.com',
    displayName: 'Kevin T.',
    kycTier: 'tier1',
    status: 'active',
    mfaEnabled: false,
    lastSessionAt: '2026-06-17T04:42:00.000Z',
    balanceCash: '48000',
    balanceBonus: '16000',
    balanceLocked: '0',
    activeSessions: 1,
    riskFlagCount: 0,
  },
  {
    id: 'u_a40f77',
    emailMasked: 'ha***@nav.kr',
    displayName: 'Hana S.',
    kycTier: 'tier0',
    status: 'active',
    mfaEnabled: false,
    lastSessionAt: '2026-06-17T03:11:00.000Z',
    balanceCash: '12000',
    balanceBonus: '0',
    balanceLocked: '0',
    activeSessions: 1,
    riskFlagCount: 0,
  },
  {
    id: 'u_3010d2',
    emailMasked: 'do***@gma.com',
    displayName: 'Dohyun C.',
    kycTier: 'tier2',
    status: 'suspended',
    mfaEnabled: true,
    lastSessionAt: '2026-06-16T22:15:00.000Z',
    balanceCash: '318000',
    balanceBonus: '0',
    balanceLocked: '318000',
    activeSessions: 0,
    riskFlagCount: 2,
  },
  {
    id: 'u_f87b11',
    emailMasked: 'ev***@yan.com',
    displayName: 'Eva M.',
    kycTier: 'tier1',
    status: 'suspended',
    mfaEnabled: false,
    lastSessionAt: '2026-06-16T18:40:00.000Z',
    balanceCash: '0',
    balanceBonus: '0',
    balanceLocked: '0',
    activeSessions: 0,
    riskFlagCount: 1,
  },
  {
    id: 'u_c910f4',
    emailMasked: 'ba***@out.com',
    displayName: 'Bassel N.',
    kycTier: 'tier3',
    status: 'banned',
    mfaEnabled: false,
    lastSessionAt: '2026-06-15T11:02:00.000Z',
    balanceCash: '0',
    balanceBonus: '0',
    balanceLocked: '2110000',
    activeSessions: 0,
    riskFlagCount: 4,
  },
  {
    id: 'u_77a8e1',
    emailMasked: 'li***@nav.kr',
    displayName: 'Lina Q.',
    kycTier: 'tier2',
    status: 'active',
    mfaEnabled: true,
    lastSessionAt: '2026-06-17T01:33:00.000Z',
    balanceCash: '910000',
    balanceBonus: '44000',
    balanceLocked: '0',
    activeSessions: 2,
    riskFlagCount: 0,
  },
];

function filterUsers(rows: AdminUserRow[], f: UsersFilters): AdminUserRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status.length > 0 && !f.status.includes(r.status)) return false;
    if (f.kyc.length > 0 && !f.kyc.includes(r.kycTier)) return false;
    if (!q) return true;
    return (
      r.emailMasked.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.displayName.toLowerCase().includes(q)
    );
  });
}

const useUsersMock = createAdminMockHook<AdminUserRow, UsersFilters>({
  storageKey: 'admin:users:v1',
  seedRows: SEED,
  seedFilters: { search: '', status: [], kyc: [] },
  filterFn: filterUsers,
  auditCap: 100,
});

const SELF_EXCLUSION_SEED: AdminUserSelfExclusion[] = [
  {
    id: 'exc_3010d2',
    userId: 'u_3010d2',
    status: 'release_requested',
    excludedUntil: '2026-09-01T00:00:00.000Z',
  },
];

export interface UseAdminUsersDesk {
  users: AdminUserRow[];
  filteredUsers: AdminUserRow[];
  filters: UsersFilters;
  setFilters: (f: UsersFilters | ((p: UsersFilters) => UsersFilters)) => void;
  audit: AdminAuditEvent[];
  selfExclusionByUserId: ReadonlyMap<string, AdminUserSelfExclusion>;

  suspendUser: (id: string, reason: string) => void | Promise<void>;
  banUser: (id: string, reason: string) => void | Promise<void>;
  unsuspendUser: (id: string, reason: string) => void | Promise<void>;
  releaseSelfExclusion: (exclusionId: string, reason: string) => Promise<void>;
  loading: boolean;
  isError: boolean;
  refresh: () => Promise<void>;
  resetForTest: () => void;
}

const nowIso = () => new Date().toISOString();
const validReason = (r: string) => r.trim().length >= MIN_REASON;

export function useAdminUsersDeskMock(): UseAdminUsersDesk {
  const m = useUsersMock();

  const audit = useCallback(
    (id: string, actionKey: string, reason: string, suffix: string) => {
      m.appendAudit({
        id: `${id}-${suffix}-${nowIso()}`,
        at: nowIso(),
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey,
        subject: id,
        reason: reason.trim(),
      });
    },
    [m],
  );

  const suspendUser = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = m.allRows.find((r) => r.id === id);
      if (!row || row.status !== 'active') return;
      m.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, status: 'suspended', activeSessions: 0 }),
      );
      audit(id, 'admin.users.audit.suspend', reason, 'suspend');
    },
    [m, audit],
  );

  const banUser = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = m.allRows.find((r) => r.id === id);
      if (!row || row.status === 'banned') return;
      m.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, status: 'banned', activeSessions: 0 }),
      );
      audit(id, 'admin.users.audit.ban', reason, 'ban');
    },
    [m, audit],
  );

  const unsuspendUser = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = m.allRows.find((r) => r.id === id);
      if (!row || row.status !== 'suspended') return;
      m.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, status: 'active' }),
      );
      audit(id, 'admin.users.audit.unsuspend', reason, 'unsuspend');
    },
    [m, audit],
  );

  const releaseSelfExclusion = useCallback(
    async (exclusionId: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = SELF_EXCLUSION_SEED.find((item) => item.id === exclusionId);
      if (!row) return;
      audit(row.userId, 'admin.users.audit.releaseSelfExclusion', reason, 'releaseSelfExclusion');
    },
    [audit],
  );

  const selfExclusionByUserId = useMemo(() => {
    const map = new Map<string, AdminUserSelfExclusion>();
    for (const row of SELF_EXCLUSION_SEED) {
      map.set(row.userId, row);
    }
    return map;
  }, []);

  return {
    users: m.allRows,
    filteredUsers: m.rows,
    filters: m.filters,
    setFilters: m.setFilters,
    audit: m.audit,
    selfExclusionByUserId,
    suspendUser,
    banUser,
    unsuspendUser,
    releaseSelfExclusion,
    loading: false,
    isError: false,
    refresh: async () => undefined,
    resetForTest: m.resetForTest,
  };
}

// Display-only string sum: i18n interpolation chooses the format; this helper
// returns the cash leg untouched for table summary display.
export function userBalanceSummaryParts(row: AdminUserRow): {
  cash: string;
  bonus: string;
  locked: string;
} {
  return {
    cash: row.balanceCash,
    bonus: row.balanceBonus,
    locked: row.balanceLocked,
  };
}
