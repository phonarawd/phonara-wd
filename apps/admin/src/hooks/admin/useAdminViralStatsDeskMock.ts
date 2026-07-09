import { useCallback, useMemo } from 'react';

import {
  buildPartialFlags,
  parseCommissionAggregates,
  parseReferralSnapshot,
  parseViralMissionClaimAggregates,
  type AdminViralCommissionAggregate,
  type AdminViralMissionClaimAggregate,
  type AdminViralReferralSnapshot,
  type AdminViralStatsPartialFlags,
} from '@/product/bridge/parse-admin-viral-stats';

const SEED_RELATIONSHIPS = [
  { parent_id: 'aff-001', created_at: '2026-07-03T10:00:00.000Z' },
  { parent_id: 'aff-001', created_at: '2026-07-02T08:00:00.000Z' },
  { parent_id: 'aff-002', created_at: '2026-06-28T12:00:00.000Z' },
  { parent_id: 'aff-003', created_at: '2026-07-04T06:00:00.000Z' },
];

const SEED_CLAIMS = [
  {
    mission: 'share_referral_link',
    phon_awarded: '300.000000',
    claimed_at: '2026-07-04T09:00:00.000Z',
  },
  {
    mission: 'share_referral_link',
    phon_awarded: '300.000000',
    claimed_at: '2026-07-03T11:00:00.000Z',
  },
  {
    mission: 'invite_friend_signup',
    phon_awarded: '10000.000000',
    claimed_at: '2026-07-02T15:00:00.000Z',
  },
];

const SEED_COMMISSIONS = [
  {
    domain: 'game',
    currency: 'PHON',
    gross_revenue: '120.500000',
    aggregate_date: '2026-07-03',
  },
  {
    domain: 'game',
    currency: 'USDT',
    gross_revenue: '4.250000',
    aggregate_date: '2026-07-03',
  },
];

export interface UseAdminViralStatsDesk {
  referralSnapshot: AdminViralReferralSnapshot;
  missionClaims: AdminViralMissionClaimAggregate[];
  commissionAggregates: AdminViralCommissionAggregate[];
  partialFlags: AdminViralStatsPartialFlags;
  shareEventsAvailable: false;
  isLoading: boolean;
  isError: boolean;
  refresh: () => Promise<void>;
}

/** Mock viral stats desk — seed aggregates for tests and offline preview. */
export function useAdminViralStatsDeskMock(): UseAdminViralStatsDesk {
  const referralSnapshot = useMemo(
    () => parseReferralSnapshot(SEED_RELATIONSHIPS, SEED_RELATIONSHIPS.length),
    [],
  );
  const missionClaims = useMemo(() => parseViralMissionClaimAggregates(SEED_CLAIMS), []);
  const commissionAggregates = useMemo(() => parseCommissionAggregates(SEED_COMMISSIONS), []);
  const partialFlags = useMemo(
    () =>
      buildPartialFlags({
        relationshipRows: SEED_RELATIONSHIPS.length,
        relationshipLimit: 5000,
        claimRows: SEED_CLAIMS.length,
        claimLimit: 500,
        commissionRows: SEED_COMMISSIONS.length,
        commissionLimit: 200,
      }),
    [],
  );

  const refresh = useCallback(async () => undefined, []);

  return {
    referralSnapshot,
    missionClaims,
    commissionAggregates,
    partialFlags,
    shareEventsAvailable: false,
    isLoading: false,
    isError: false,
    refresh,
  };
}
