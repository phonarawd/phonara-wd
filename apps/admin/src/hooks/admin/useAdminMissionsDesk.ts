import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { parseEarnLimits, parseViralMissions } from '@/product/bridge/parse-admin-missions-config';
import { supabase } from '../../lib/supabase';
import type { UseAdminMissionsDesk } from './useAdminMissionsDeskMock';

export type { UseAdminMissionsDesk } from './useAdminMissionsDeskMock';

type AppConfigRow = {
  key: string;
  value: string;
  description: string | null;
};

const QUERY_KEY = ['admin-missions-app-config'] as const;

const CONFIG_SELECT_KEYS = [
  'referral_qualified_reward_phon',
  'referral_pending_reward_phon',
  'referral_velocity_max_24h',
  'earn_phon_to_usdt_rate',
  'earn_season_global_xp',
  'launch_slots_total',
  'viral_share_referral_link_reward_phon',
  'viral_share_referral_link_max_per_day',
  'viral_share_story_template_reward_phon',
  'viral_share_story_template_max_per_week',
  'viral_invite_friend_signup_reward_phon',
  'viral_invite_friend_signup_max_per_day',
  'viral_affiliate_content_post_reward_phon',
  'viral_affiliate_content_post_max_per_month',
  'viral_streak_share_reward_phon',
  'viral_streak_share_min_days',
  'viral_streak_share_max_per_day',
] as const;

/** Engine-backed missions desk — `app_config` read only (§29.2 R0 · write deferred E2). */
export function useAdminMissionsDesk(): UseAdminMissionsDesk {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('app_config')
        .select('key,value,description')
        .in('key', [...CONFIG_SELECT_KEYS]);
      if (error) throw error;

      const values: Record<string, string> = {};
      const descriptions: Record<string, string | null> = {};
      for (const row of (rows ?? []) as AppConfigRow[]) {
        values[row.key] = row.value;
        descriptions[row.key] = row.description;
      }
      return { values, descriptions };
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const earnLimits = useMemo(
    () => parseEarnLimits(data?.values ?? {}, data?.descriptions ?? {}),
    [data],
  );

  const viralMissions = useMemo(() => parseViralMissions(data?.values ?? {}), [data?.values]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    earnLimits,
    viralMissions,
    isLoading,
    isError,
    refresh,
  };
}
