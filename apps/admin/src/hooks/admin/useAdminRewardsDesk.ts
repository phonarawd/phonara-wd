import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { AdminAuditEvent } from '@/shared-types';
import { supabase } from '../../lib/supabase';
import { useAuditLogs } from '../use-audit-logs';
import type { AdminUserRow } from './useAdminUsersDeskMock';
import type {
  AdminRewardAdjustmentRow,
  ManualRewardAdjustInput,
  RewardCurrency,
  RewardDirection,
  RewardsFilters,
  UseAdminRewardsDesk,
} from './useAdminRewardsDeskMock';

export type {
  AdminRewardAdjustmentRow,
  ManualRewardAdjustInput,
  RewardCurrency,
  RewardDirection,
  RewardsFilters,
  UseAdminRewardsDesk,
} from './useAdminRewardsDeskMock';

const MIN_ADJUST_REASON = 8;
const USERS_QUERY_KEY = ['admin-rewards-users'] as const;

function mapKycTier(raw: string): AdminUserRow['kycTier'] {
  if (raw === 'id_verified') return 'tier3';
  if (raw === 'phone_verified') return 'tier2';
  if (raw === 'email_verified') return 'tier1';
  return 'tier0';
}

function mapUserRow(raw: Record<string, unknown>): AdminUserRow {
  return {
    id: String(raw['id'] ?? ''),
    emailMasked: String(raw['email_masked'] ?? '—'),
    displayName: String(raw['display_name'] ?? '—'),
    kycTier: mapKycTier(String(raw['kyc_tier'] ?? 'anonymous')),
    status: (String(raw['status'] ?? 'active') as AdminUserRow['status']) || 'active',
    mfaEnabled: raw['mfa_enabled'] === true,
    lastSessionAt: String(raw['last_session_at'] ?? new Date(0).toISOString()),
    balanceCash: String(raw['balance_cash'] ?? '0'),
    balanceBonus: String(raw['balance_bonus'] ?? '0'),
    balanceLocked: String(raw['balance_locked'] ?? '0'),
    activeSessions: Number(raw['active_sessions'] ?? 0),
    riskFlagCount: Number(raw['risk_flag_count'] ?? 0),
  };
}

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

function mapAdjustmentFromAudit(log: {
  id: string;
  created_at: string;
  entity_id: string | null;
  payload: unknown;
}): AdminRewardAdjustmentRow | null {
  if (!log.payload || typeof log.payload !== 'object') return null;
  const payload = log.payload as Record<string, unknown>;
  const currency = String(payload['currency'] ?? 'PHON') as RewardCurrency;
  const direction = String(payload['direction'] ?? 'credit') as RewardDirection;
  const amount = String(payload['amount'] ?? '0');
  const reason = String(payload['reason'] ?? '');
  return {
    id: log.id,
    userMask: log.entity_id ? `${log.entity_id.slice(0, 6)}…` : '—',
    currency,
    amount,
    direction,
    reason,
    at: log.created_at,
  };
}

/** Engine-backed rewards desk — manual wallet credit/debit (§29.2 R3). */
export function useAdminRewardsDesk(): UseAdminRewardsDesk {
  const qc = useQueryClient();
  const { data: auditLogs = [] } = useAuditLogs(100);
  const [filters, setFilters] = useState<RewardsFilters>({ search: '' });
  const [localAudit, setLocalAudit] = useState<AdminAuditEvent[]>([]);

  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await (
        supabase as {
          rpc: (
            fn: string,
            args: Record<string, unknown>,
          ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
        }
      ).rpc('rpc_admin_list_users', { p_search: null, p_limit: 200 });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapUserRow);
    },
    staleTime: 15_000,
  });

  const filteredUsers = useMemo(() => filterUsers(users, filters), [filters, users]);

  const recentAdjustments = useMemo(
    () =>
      auditLogs
        .filter((log) => log.action === 'admin_manual_wallet_adjust')
        .map((log) => mapAdjustmentFromAudit(log))
        .filter((row): row is AdminRewardAdjustmentRow => row !== null),
    [auditLogs],
  );

  const audit: AdminAuditEvent[] = useMemo(
    () => [
      ...localAudit,
      ...auditLogs
        .filter((log) => log.action === 'admin_manual_wallet_adjust')
        .map((log) => ({
          id: log.id,
          at: log.created_at,
          actorKey: 'admin.primitive.audit.actor.system' as const,
          actionKey: 'admin.rewards.audit.adjust',
          reason:
            log.payload && typeof log.payload === 'object' && 'reason' in log.payload
              ? String((log.payload as { reason?: string }).reason ?? '')
              : '',
          subject: log.entity_id ?? '—',
        })),
    ],
    [auditLogs, localAudit],
  );

  const invalidate = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    await qc.invalidateQueries({ queryKey: ['audit-logs'] });
  }, [qc]);

  const manualAdjust = useCallback(
    async (userId: string, input: ManualRewardAdjustInput): Promise<boolean> => {
      if (input.reason.trim().length < MIN_ADJUST_REASON) return false;
      try {
        const { error } = await (
          supabase as {
            rpc: (
              fn: string,
              args: Record<string, unknown>,
            ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
          }
        ).rpc('rpc_admin_manual_wallet_adjust', {
          p_user_id: userId,
          p_currency: input.currency,
          p_amount: input.amount,
          p_direction: input.direction,
          p_reason: input.reason.trim(),
          p_client_request_id: input.clientRequestId,
        });
        if (error) throw error;
        setLocalAudit((prev) =>
          [
            {
              id: `${userId}-${input.clientRequestId}`,
              at: new Date().toISOString(),
              actorKey: 'admin.primitive.audit.actor.system',
              actionKey: 'admin.rewards.audit.adjust',
              subject: userId,
              reason: input.reason.trim(),
            },
            ...prev,
          ].slice(0, 20),
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
    users,
    filteredUsers,
    filters,
    setFilters,
    recentAdjustments,
    manualAdjust,
    audit,
    loading: isLoading,
    isError,
    refresh,
  };
}
