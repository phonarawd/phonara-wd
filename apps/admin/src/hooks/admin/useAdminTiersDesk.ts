import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  parseDecayPolicyRows,
  parseEarnMissionLimits,
  parseGoldenEarthLimits,
  parseTierDistribution,
  ADMIN_TIERS_GOLDEN_EARTH_CAP_KEYS,
  ADMIN_TIERS_GOLDEN_EARTH_REWARD_KEYS,
  type UserEarnVipReadRow,
} from '@/product/bridge/parse-admin-tiers-desk';
import { supabase } from '../../lib/supabase';
import type { UseAdminTiersDesk } from './useAdminTiersDeskMock';

export type { UseAdminTiersDesk } from './useAdminTiersDeskMock';

type AppConfigRow = {
  key: string;
  value: string;
};

const QUERY_KEY = ['admin-tiers-desk'] as const;

const CONFIG_SELECT_KEYS = [
  ...ADMIN_TIERS_GOLDEN_EARTH_CAP_KEYS,
  ...ADMIN_TIERS_GOLDEN_EARTH_REWARD_KEYS,
] as const;

/** Engine-backed tiers desk — `user_earn_vip` + `app_config` read only (§29.2 R0 · E4 write gap). */
export function useAdminTiersDesk(): UseAdminTiersDesk {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const [vipResult, configResult] = await Promise.all([
        supabase.from('user_earn_vip' as never).select('tier,xp,updated_at'),
        supabase
          .from('app_config')
          .select('key,value')
          .in('key', [...CONFIG_SELECT_KEYS]),
      ]);

      if (vipResult.error) throw vipResult.error;
      if (configResult.error) throw configResult.error;

      const config: Record<string, string> = {};
      for (const row of (configResult.data ?? []) as AppConfigRow[]) {
        config[row.key] = row.value;
      }

      return {
        vipRows: (vipResult.data ?? []) as unknown as UserEarnVipReadRow[],
        config,
      };
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const distribution = useMemo(() => parseTierDistribution(data?.vipRows ?? []), [data?.vipRows]);

  const goldenEarthLimits = useMemo(
    () => parseGoldenEarthLimits(data?.config ?? {}),
    [data?.config],
  );

  const earnMissionLimits = useMemo(() => parseEarnMissionLimits(), []);

  const decayPolicy = useMemo(() => parseDecayPolicyRows(), []);

  const totalMembers = useMemo(
    () => distribution.reduce((sum, row) => sum + row.count, 0),
    [distribution],
  );

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    distribution,
    goldenEarthLimits,
    earnMissionLimits,
    decayPolicy,
    decayPhase: 'deferred',
    totalMembers,
    isLoading,
    isError,
    refresh,
  };
}
