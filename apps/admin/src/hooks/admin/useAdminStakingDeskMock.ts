import { useCallback, useMemo, useState } from 'react';
import type { AdminAuditEvent } from '@/shared-types';
import type { AdminStakingPoolRow, UseAdminStakingDesk } from './useAdminStakingDesk';

const MIN_REASON = 4;

const SEED_POOLS: AdminStakingPoolRow[] = [
  {
    id: 'pool-flexible',
    term: 'flexible',
    referenceAsset: 'PHON',
    stakeCurrency: 'PHON',
    estimatedApr: '8.50',
    lockDays: 0,
    isActive: true,
  },
  {
    id: 'pool-30d',
    term: 'days_30',
    referenceAsset: 'PHON',
    stakeCurrency: 'PHON',
    estimatedApr: '12.00',
    lockDays: 30,
    isActive: false,
  },
];

export function useAdminStakingDeskMock(): UseAdminStakingDesk & {
  resetForTest: () => void;
} {
  const [pools, setPools] = useState<AdminStakingPoolRow[]>(() =>
    SEED_POOLS.map((p) => ({ ...p })),
  );
  const [busy, setBusy] = useState(false);
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>([]);

  const resetForTest = useCallback(() => {
    setPools(SEED_POOLS.map((p) => ({ ...p })));
    setBusy(false);
    setAuditEvents([]);
  }, []);

  const setPoolActive = useCallback(async (poolId: string, isActive: boolean, reason: string) => {
    if (reason.trim().length < MIN_REASON) {
      throw new Error('reason_too_short');
    }
    setBusy(true);
    try {
      setPools((prev) => prev.map((p) => (p.id === poolId ? { ...p, isActive } : p)));
      setAuditEvents((prev) => [
        {
          id: `audit-${Date.now()}`,
          at: new Date().toISOString(),
          actorKey: 'admin.primitive.audit.actor.operator',
          actionKey: 'admin.staking.audit.toggle',
          reason: reason.trim(),
          subject: isActive ? 'active' : 'inactive',
        },
        ...prev,
      ]);
    } finally {
      setBusy(false);
    }
  }, []);

  const refresh = useCallback(async () => undefined, []);

  return useMemo(
    () => ({
      pools,
      loading: false,
      isError: false,
      busy,
      auditEvents,
      refresh,
      setPoolActive,
      resetForTest,
    }),
    [auditEvents, busy, pools, refresh, resetForTest, setPoolActive],
  );
}
