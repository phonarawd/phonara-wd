import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  buildPartialFlags,
  parseCommissionAggregates,
  parseReferralSnapshot,
  parseViralMissionClaimAggregates,
  type AffiliateRelationshipReadRow,
  type CommissionAggregateReadRow,
  type ViralMissionClaimReadRow,
} from '@/product/bridge/parse-admin-viral-stats';
import { supabase } from '../../lib/supabase';
import type { UseAdminViralStatsDesk } from './useAdminViralStatsDeskMock';

export type { UseAdminViralStatsDesk } from './useAdminViralStatsDeskMock';

const QUERY_KEY = ['admin-viral-stats'] as const;
const RELATIONSHIP_SAMPLE_LIMIT = 5000;
const CLAIM_SAMPLE_LIMIT = 500;
const COMMISSION_SAMPLE_LIMIT = 200;

/** Engine-backed viral stats desk — partial aggregates read only (§29.2 R0 · share events gap). */
export function useAdminViralStatsDesk(): UseAdminViralStatsDesk {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const [countResult, relationshipsResult, claimsResult, commissionsResult] = await Promise.all(
        [
          supabase.from('affiliate_relationships').select('*', { count: 'exact', head: true }),
          supabase
            .from('affiliate_relationships')
            .select('parent_id,created_at')
            .order('created_at', { ascending: false })
            .limit(RELATIONSHIP_SAMPLE_LIMIT),
          supabase
            .from('viral_mission_claims')
            .select('mission,phon_awarded,claimed_at')
            .order('claimed_at', { ascending: false })
            .limit(CLAIM_SAMPLE_LIMIT),
          supabase
            .from('affiliate_commission_daily_aggregates')
            .select('domain,currency,gross_revenue,aggregate_date')
            .order('aggregate_date', { ascending: false })
            .limit(COMMISSION_SAMPLE_LIMIT),
        ],
      );

      if (countResult.error) throw countResult.error;
      if (relationshipsResult.error) throw relationshipsResult.error;
      if (claimsResult.error) throw claimsResult.error;
      if (commissionsResult.error) throw commissionsResult.error;

      const relationshipRows = (relationshipsResult.data ?? []) as AffiliateRelationshipReadRow[];
      const claimRows = (claimsResult.data ?? []) as ViralMissionClaimReadRow[];
      const commissionRows = (commissionsResult.data ?? []) as CommissionAggregateReadRow[];

      return {
        totalLinks: countResult.count ?? relationshipRows.length,
        relationshipRows,
        claimRows,
        commissionRows,
      };
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const referralSnapshot = useMemo(
    () => parseReferralSnapshot(data?.relationshipRows ?? [], data?.totalLinks ?? 0),
    [data?.relationshipRows, data?.totalLinks],
  );

  const missionClaims = useMemo(
    () => parseViralMissionClaimAggregates(data?.claimRows ?? []),
    [data?.claimRows],
  );

  const commissionAggregates = useMemo(
    () => parseCommissionAggregates(data?.commissionRows ?? []),
    [data?.commissionRows],
  );

  const partialFlags = useMemo(
    () =>
      buildPartialFlags({
        relationshipRows: data?.relationshipRows.length ?? 0,
        relationshipLimit: RELATIONSHIP_SAMPLE_LIMIT,
        claimRows: data?.claimRows.length ?? 0,
        claimLimit: CLAIM_SAMPLE_LIMIT,
        commissionRows: data?.commissionRows.length ?? 0,
        commissionLimit: COMMISSION_SAMPLE_LIMIT,
      }),
    [data?.claimRows.length, data?.commissionRows.length, data?.relationshipRows.length],
  );

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    referralSnapshot,
    missionClaims,
    commissionAggregates,
    partialFlags,
    shareEventsAvailable: false,
    isLoading,
    isError,
    refresh,
  };
}
