import { useCallback, useMemo } from 'react';

import type {
  AdminEarnLimitRow,
  AdminMissionCatalogUpsertInput,
  AdminViralMissionRow,
} from '@/product/bridge/parse-admin-missions-config';
import { parseEarnLimits, parseViralMissions } from '@/product/bridge/parse-admin-missions-config';

const SEED_CONFIG: Record<string, string> = {
  referral_qualified_reward_phon: '10000',
  referral_pending_reward_phon: '500',
  referral_velocity_max_24h: '50',
  earn_phon_to_usdt_rate: '0.164',
  earn_season_global_xp: '62000',
  launch_slots_total: '1000',
  viral_share_referral_link_reward_phon: '300',
  viral_share_referral_link_max_per_day: '3',
  viral_share_story_template_reward_phon: '50',
  viral_share_story_template_max_per_week: '2',
  viral_invite_friend_signup_reward_phon: '10000',
  viral_invite_friend_signup_max_per_day: '5',
  viral_affiliate_content_post_reward_phon: '200',
  viral_affiliate_content_post_max_per_month: '1',
  viral_streak_share_reward_phon: '75',
  viral_streak_share_min_days: '7',
  viral_streak_share_max_per_day: '1',
};

export interface UseAdminMissionsDesk {
  earnLimits: AdminEarnLimitRow[];
  viralMissions: AdminViralMissionRow[];
  isLoading: boolean;
  isError: boolean;
  isSaving: boolean;
  writeUiUnlocked: boolean;
  refresh: () => Promise<void>;
  upsertMission: (input: AdminMissionCatalogUpsertInput) => Promise<void>;
}

/** Mock missions desk — seed for tests and offline preview (write UI unlocked after GATE). */
export function useAdminMissionsDeskMock(): UseAdminMissionsDesk {
  const earnLimits = useMemo(() => parseEarnLimits(SEED_CONFIG), []);
  const viralMissions = useMemo(() => parseViralMissions(SEED_CONFIG), []);

  const refresh = useCallback(async () => undefined, []);
  const upsertMission = useCallback(async () => {
    return;
  }, []);

  return {
    earnLimits,
    viralMissions,
    isLoading: false,
    isError: false,
    isSaving: false,
    writeUiUnlocked: true,
    refresh,
    upsertMission,
  };
}
