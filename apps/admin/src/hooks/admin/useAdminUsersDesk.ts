import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminAuditEvent } from '@/shared-types';
import { supabase } from '../../lib/supabase';
import { useAuditLogs } from '../use-audit-logs';
import type {
  AdminUserRow,
  AdminUserSelfExclusion,
  KycTier,
  UserStatus,
  UsersFilters,
} from './useAdminUsersDeskMock';

export type {
  AdminUserRow,
  AdminUserSelfExclusion,
  KycTier,
  UserStatus,
  UsersFilters,
} from './useAdminUsersDeskMock';
export { userBalanceSummaryParts } from './useAdminUsersDeskMock';

const MIN_REASON = 4;
const MIN_ADJUST_REASON = 8;

export type ManualAdjustInput = {
  currency: 'PHON' | 'USDT' | 'KRW';
  amount: string;
  direction: 'credit' | 'debit';
  reason: string;
  clientRequestId: string;
};

function mapKycTier(raw: string): KycTier {
  if (raw === 'id_verified') return 'tier3';
  if (raw === 'phone_verified') return 'tier2';
  if (raw === 'email_verified') return 'tier1';
  return 'tier0';
}

function mapRow(raw: Record<string, unknown>): AdminUserRow {
  return {
    id: String(raw['id'] ?? ''),
    emailMasked: String(raw['email_masked'] ?? '—'),
    displayName: String(raw['display_name'] ?? '—'),
    kycTier: mapKycTier(String(raw['kyc_tier'] ?? 'anonymous')),
    status: (String(raw['status'] ?? 'active') as UserStatus) || 'active',
    mfaEnabled: raw['mfa_enabled'] === true,
    lastSessionAt: String(raw['last_session_at'] ?? new Date(0).toISOString()),
    balanceCash: String(raw['balance_cash'] ?? '0'),
    balanceBonus: String(raw['balance_bonus'] ?? '0'),
    balanceLocked: String(raw['balance_locked'] ?? '0'),
    activeSessions: Number(raw['active_sessions'] ?? 0),
    riskFlagCount: Number(raw['risk_flag_count'] ?? 0),
  };
}

function filterUsers(rows: AdminUserRow[], f: UsersFilters): AdminUserRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status.length > 0 && !f.status.includes(r.status)) return false;
    if (f.kyc.length > 0 && !f.kyc.includes(r.kycTier)) return false;
    if (!q) return true;
    return (
      r.id.toLowerCase().includes(q) ||
      r.displayName.toLowerCase().includes(q) ||
      r.emailMasked.toLowerCase().includes(q)
    );
  });
}

export function useAdminUsersDesk() {
  const qc = useQueryClient();
  const { data: auditLogs = [] } = useAuditLogs(50);
  const [filters, setFilters] = useState<UsersFilters>({
    search: '',
    status: [],
    kyc: [],
  });

  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin-users-desk'],
    queryFn: async () => {
      const { data, error } = await (
        supabase as {
          rpc: (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>;
        }
      ).rpc('rpc_admin_list_users', { p_search: null, p_limit: 200 });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapRow);
    },
    staleTime: 15_000,
  });

  const { data: selfExclusions = [] } = useQuery({
    queryKey: ['admin-users-self-exclusions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rg_exclusions')
        .select('id, user_id, status, excluded_until')
        .in('status', ['active', 'release_requested']);
      if (error) throw error;
      return (data ?? []).map(
        (row): AdminUserSelfExclusion => ({
          id: String(row.id),
          userId: String(row.user_id),
          status: row.status as AdminUserSelfExclusion['status'],
          excludedUntil: String(row.excluded_until),
        }),
      );
    },
    staleTime: 15_000,
  });

  const selfExclusionByUserId = useMemo(() => {
    const map = new Map<string, AdminUserSelfExclusion>();
    for (const row of selfExclusions) {
      map.set(row.userId, row);
    }
    return map;
  }, [selfExclusions]);

  const audit: AdminAuditEvent[] = useMemo(
    () =>
      auditLogs
        .filter((l) => l.action.startsWith('admin.users.'))
        .map((l) => ({
          id: l.id,
          at: l.created_at,
          actorKey: 'admin.audit.actor.system',
          actionKey: l.action,
          reason:
            l.payload && typeof l.payload === 'object' && 'reason' in l.payload
              ? String((l.payload as { reason?: string }).reason ?? '')
              : '',
          subject: l.entity_id ?? '—',
        })),
    [auditLogs],
  );

  const filteredUsers = useMemo(() => filterUsers(users, filters), [users, filters]);

  const invalidate = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['admin-users-desk'] });
    await qc.invalidateQueries({ queryKey: ['admin-users-self-exclusions'] });
    await qc.invalidateQueries({ queryKey: ['audit-logs'] });
  }, [qc]);

  const runAction = useCallback(
    async (id: string, action: string, reason: string) => {
      if (reason.trim().length < MIN_REASON) {
        throw new Error('reason_too_short');
      }
      const { error } = await (
        supabase as {
          rpc: (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>;
        }
      ).rpc('rpc_admin_set_user_activity', { p_user_id: id, p_action: action, p_reason: reason });
      if (error) throw error;
      await invalidate();
    },
    [invalidate],
  );

  const manualAdjustWallet = useCallback(
    async (id: string, input: ManualAdjustInput) => {
      if (input.reason.trim().length < MIN_ADJUST_REASON) {
        throw new Error('reason_too_short');
      }
      const { error } = await (
        supabase as {
          rpc: (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>;
        }
      ).rpc('rpc_admin_manual_wallet_adjust', {
        p_user_id: id,
        p_currency: input.currency,
        p_amount: input.amount,
        p_direction: input.direction,
        p_reason: input.reason.trim(),
        p_client_request_id: input.clientRequestId,
      });
      if (error) throw error;
      await invalidate();
    },
    [invalidate],
  );

  const releaseSelfExclusion = useCallback(
    async (exclusionId: string, reason: string) => {
      if (reason.trim().length < MIN_REASON) {
        throw new Error('reason_too_short');
      }
      const { error } = await (
        supabase as {
          rpc: (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>;
        }
      ).rpc('rpc_admin_release_self_exclusion', { p_exclusion_id: exclusionId, p_reason: reason });
      if (error) throw error;
      await invalidate();
    },
    [invalidate],
  );

  const refresh = useCallback(async () => {
    await invalidate();
  }, [invalidate]);

  return {
    users,
    filteredUsers,
    filters,
    setFilters,
    audit,
    selfExclusionByUserId,
    suspendUser: (id: string, reason: string) => runAction(id, 'suspend', reason),
    banUser: (id: string, reason: string) => runAction(id, 'ban', reason),
    unsuspendUser: (id: string, reason: string) => runAction(id, 'unsuspend', reason),
    releaseSelfExclusion,
    resetMfa: (id: string, reason: string) => {
      void id;
      void reason;
      return undefined;
    },
    killSession: (id: string, reason: string) => {
      void id;
      void reason;
      return undefined;
    },
    manualAdjustWallet,
    loading: isLoading,
    isError,
    refresh,
    resetForTest: () => undefined,
  };
}
