import { useCallback, useMemo } from 'react';

import {
  parseDecayPolicyRows,
  parseEarnMissionLimits,
  parseGoldenEarthLimits,
  parseTierDistribution,
  type AdminDecayPolicyRow,
  type AdminEarnMissionLimitRow,
  type AdminGoldenEarthLimitRow,
  type AdminTierDistributionRow,
  type DecayMonitorPhase,
  type UserEarnVipReadRow,
} from '@/product/bridge/parse-admin-tiers-desk';

const SEED_CONFIG: Record<string, string> = {
  golden_earth_cap_bronze: '1000',
  golden_earth_cap_silver: '2000',
  golden_earth_cap_gold: '3500',
  golden_earth_cap_platinum: '5500',
  golden_earth_cap_diamond: '8000',
  golden_earth_reward_bronze: '3.000000',
  golden_earth_reward_silver: '4.000000',
  golden_earth_reward_gold: '5.000000',
  golden_earth_reward_platinum: '6.000000',
  golden_earth_reward_diamond: '7.000000',
};

const SEED_VIP_ROWS: UserEarnVipReadRow[] = [
  { tier: 'bronze', xp: 1200, updated_at: '2026-07-01T08:00:00.000Z' },
  { tier: 'bronze', xp: 800, updated_at: '2026-07-02T10:00:00.000Z' },
  { tier: 'silver', xp: 12000, updated_at: '2026-07-03T12:00:00.000Z' },
  { tier: 'gold', xp: 55000, updated_at: '2026-06-28T09:00:00.000Z' },
  { tier: 'platinum', xp: 210000, updated_at: '2026-06-20T15:00:00.000Z' },
  { tier: 'diamond', xp: 620000, updated_at: '2026-06-10T11:00:00.000Z' },
];

export interface UseAdminTiersDesk {
  distribution: AdminTierDistributionRow[];
  goldenEarthLimits: AdminGoldenEarthLimitRow[];
  earnMissionLimits: AdminEarnMissionLimitRow[];
  decayPolicy: AdminDecayPolicyRow[];
  decayPhase: DecayMonitorPhase;
  totalMembers: number;
  isLoading: boolean;
  isError: boolean;
  refresh: () => Promise<void>;
}

/** Mock tiers desk — seed distribution + config for tests and offline preview. */
export function useAdminTiersDeskMock(): UseAdminTiersDesk {
  const distribution = useMemo(() => parseTierDistribution(SEED_VIP_ROWS), []);
  const goldenEarthLimits = useMemo(() => parseGoldenEarthLimits(SEED_CONFIG), []);
  const earnMissionLimits = useMemo(() => parseEarnMissionLimits(), []);
  const decayPolicy = useMemo(() => parseDecayPolicyRows(), []);
  const totalMembers = useMemo(
    () => distribution.reduce((sum, row) => sum + row.count, 0),
    [distribution],
  );

  const refresh = useCallback(async () => undefined, []);

  return {
    distribution,
    goldenEarthLimits,
    earnMissionLimits,
    decayPolicy,
    decayPhase: 'deferred',
    totalMembers,
    isLoading: false,
    isError: false,
    refresh,
  };
}
