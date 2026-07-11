import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getOpsDashboardRaw } from '@/domain/ops';
import { parseOpsDashboard, type OpsDashboardQueueRow } from '@/product/bridge/parse-ops-dashboard';
import { callRpc } from '../../lib/rpc';

type ViralAnalyticsRpc = {
  referrals?: {
    total?: number;
    unique_referrers?: number;
    recent_7d?: number;
  };
  viral_missions?: Array<{
    mission?: string;
    claim_count?: number;
    phon_awarded_total?: string;
  }>;
};

export type AdminEarnActivityMissionClaim = {
  mission: string;
  claimCount: number;
  phonAwardedTotal: string;
};

const EMPTY_QUEUES: OpsDashboardQueueRow[] = [];

/** Read-only E6 activity desk — Ops dashboard queues plus viral aggregate snapshots. */
export function useAdminEarnActivityDesk() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-earn-activity-desk'],
    queryFn: async () => {
      const [opsDashboard, viralRaw] = await Promise.all([
        getOpsDashboardRaw().then(parseOpsDashboard),
        callRpc('rpc_admin_get_viral_analytics'),
      ]);
      return { opsDashboard, viral: (viralRaw ?? {}) as ViralAnalyticsRpc };
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const referralSnapshot = useMemo(
    () => ({
      total: Number(data?.viral.referrals?.total ?? 0),
      uniqueReferrers: Number(data?.viral.referrals?.unique_referrers ?? 0),
      recent7d: Number(data?.viral.referrals?.recent_7d ?? 0),
    }),
    [data?.viral.referrals],
  );

  const missionClaimTotals = useMemo<AdminEarnActivityMissionClaim[]>(
    () =>
      (data?.viral.viral_missions ?? []).map((row) => ({
        mission: String(row.mission ?? ''),
        claimCount: Number(row.claim_count ?? 0),
        phonAwardedTotal: String(row.phon_awarded_total ?? '0'),
      })),
    [data?.viral.viral_missions],
  );

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    queueRows: data?.opsDashboard.exceptionQueues ?? EMPTY_QUEUES,
    alerts: data?.opsDashboard.opsAlerts ?? { open: 0, critical: 0 },
    referralSnapshot,
    missionClaimTotals,
    loading: isLoading,
    error: isError,
    refresh,
  };
}
