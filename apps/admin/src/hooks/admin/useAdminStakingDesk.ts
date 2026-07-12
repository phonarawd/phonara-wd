import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminAuditEvent } from '@/shared-types';
import { callRpc } from '../../lib/rpc';
import { useAuditLogs } from '../use-audit-logs';
import { useAdminMfaReady } from '../use-admin-mfa-ready';

export type AdminStakingPoolRow = {
  id: string;
  term: string;
  referenceAsset: string;
  stakeCurrency: string;
  estimatedApr: string;
  lockDays: number;
  isActive: boolean;
};

export type UseAdminStakingDesk = {
  pools: AdminStakingPoolRow[];
  loading: boolean;
  isError: boolean;
  busy: boolean;
  auditEvents: AdminAuditEvent[];
  refresh: () => Promise<void>;
  setPoolActive: (poolId: string, isActive: boolean, reason: string) => Promise<void>;
};

type StakingPoolRow = {
  id: string;
  term: string;
  reference_asset: string | null;
  stake_currency: string | null;
  estimated_apr: string;
  lock_days: number;
  is_active: boolean;
};

function mapPool(row: StakingPoolRow): AdminStakingPoolRow {
  return {
    id: row.id,
    term: row.term,
    referenceAsset: row.reference_asset ?? 'PHON',
    stakeCurrency: row.stake_currency ?? 'PHON',
    estimatedApr: row.estimated_apr,
    lockDays: row.lock_days,
    isActive: row.is_active,
  };
}

function mapAudit(row: {
  id: string;
  created_at: string;
  action: string;
  payload: unknown;
}): AdminAuditEvent {
  const payload =
    row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    at: row.created_at,
    actorKey: 'admin.primitive.audit.actor.operator',
    actionKey: 'admin.staking.audit.toggle',
    reason: typeof payload['reason'] === 'string' ? payload['reason'] : undefined,
    subject:
      typeof payload['is_active'] === 'boolean'
        ? payload['is_active']
          ? 'active'
          : 'inactive'
        : undefined,
  };
}

export function useAdminStakingDesk(): UseAdminStakingDesk {
  const qc = useQueryClient();
  const mfaReady = useAdminMfaReady();
  const { data: auditLogs = [] } = useAuditLogs(50);
  const [busy, setBusy] = useState(false);

  const poolsQuery = useQuery({
    queryKey: ['admin', 'staking-pools'],
    enabled: mfaReady,
    queryFn: async () => {
      const data = await callRpc('rpc_admin_list_staking_pools');
      return (data as StakingPoolRow[]).map(mapPool);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      poolId,
      isActive,
      reason,
    }: {
      poolId: string;
      isActive: boolean;
      reason: string;
    }) => {
      await callRpc('rpc_admin_set_staking_pool_active', {
        p_pool_id: poolId,
        p_is_active: isActive,
        p_reason: reason,
      });
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'staking-pools'] });
    },
  });

  const setPoolActive = useCallback(
    async (poolId: string, isActive: boolean, reason: string) => {
      setBusy(true);
      try {
        await toggleMutation.mutateAsync({ poolId, isActive, reason });
      } finally {
        setBusy(false);
      }
    },
    [toggleMutation],
  );

  const refresh = useCallback(async () => {
    await poolsQuery.refetch();
  }, [poolsQuery]);

  const pools = useMemo(() => poolsQuery.data ?? [], [poolsQuery.data]);
  const auditEvents = useMemo(
    () =>
      auditLogs
        .filter((row) => row.action === 'staking_pool_active_set')
        .slice(0, 8)
        .map(mapAudit),
    [auditLogs],
  );

  return {
    pools,
    loading: poolsQuery.isLoading,
    isError: poolsQuery.isError,
    busy: busy || toggleMutation.isPending,
    auditEvents,
    refresh,
    setPoolActive,
  };
}
