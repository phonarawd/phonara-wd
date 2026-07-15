import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  countCompletedOnboardingMissions,
  formatWelcomeRewardAmount,
  ONBOARDING_D0_MISSIONS,
  ONBOARDING_D0_MISSION_COUNT,
  resolveOnboardingMissionCardState,
  type OnboardingD0MissionId,
  type OnboardingMissionStatusSnapshot,
} from '@/domain/onboarding-missions-display-contract';
import { ONBOARDING_COMPLETE_ROUTE } from '@/domain/onboarding-handoff-display-contract';
import { formatPhonRewardDisplay } from '@/domain/viral-missions-display-contract';
import type { ViralMissionItem } from '@/features/earn/use-viral-missions';
import { isOnboardingComplete, markOnboardingComplete } from '@/lib/onboarding-funnel';
import { callRpc } from '@/lib/rpc';
import { supabase } from '@/lib/supabase';
import { translateError } from '@/lib/translate-error';
import { productToast } from '@/product/primitives/toast-zone';
import { useT } from '@/product/i18n';

export type WelcomeBonusClaimResult = {
  already_claimed: boolean;
  phon_awarded: string;
  referral_bonus?: string;
};

export const onboardingMissionsKeys = {
  status: (userId: string | null) => ['onboarding-missions-status', userId] as const,
};

async function fetchOnboardingMissionStatus(
  userId: string,
): Promise<OnboardingMissionStatusSnapshot> {
  const [welcomeRes, profileMissionRes, profileRes, viralData] = await Promise.all([
    supabase.from('welcome_bonuses').select('phon_awarded').eq('user_id', userId).maybeSingle(),
    supabase
      .from('missions')
      .select('phon_awarded, completed_at')
      .eq('user_id', userId)
      .eq('mission', 'complete_profile')
      .maybeSingle(),
    supabase.from('profiles').select('username').eq('id', userId).maybeSingle(),
    callRpc('rpc_get_viral_mission_status'),
  ]);

  if (welcomeRes.error) throw welcomeRes.error;
  if (profileMissionRes.error) throw profileMissionRes.error;
  if (profileRes.error) throw profileRes.error;

  const viralPayload = viralData as { missions?: ViralMissionItem[] } | null;
  const shareRow = viralPayload?.missions?.find((row) => row.mission === 'share_referral_link');

  const profileComplete =
    Boolean(profileMissionRes.data?.completed_at) || Boolean(profileRes.data?.username?.trim());

  return {
    welcomeClaimed: Boolean(welcomeRes.data),
    welcomeRewardPhon: welcomeRes.data?.phon_awarded ?? null,
    profileComplete,
    profileRewardPhon: profileMissionRes.data?.phon_awarded ?? null,
    shareUsed: shareRow?.used ?? 0,
    shareRewardPhon: shareRow?.reward_phon ?? null,
  };
}

export type OnboardingMissionCardView = {
  id: OnboardingD0MissionId;
  titleKey: MessageKey;
  descKey: MessageKey;
  engine: 'exists' | 'partial';
  continueRoute: string | null;
  state: ReturnType<typeof resolveOnboardingMissionCardState>;
  rewardLabel: string;
};

export type OnboardingMissionsPageControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  loading: boolean;
  claiming: boolean;
  error: MessageKey | null;
  missions: OnboardingMissionCardView[];
  completedCount: number;
  missionCount: typeof ONBOARDING_D0_MISSION_COUNT;
  welcomeClaimed: boolean;
  claimWelcomeBonus: () => Promise<void>;
  finish: () => void;
  skip: () => void;
};

export function useOnboardingMissionsPageController(): OnboardingMissionsPageControllerView {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<MessageKey | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      void navigate({ to: '/login', replace: true });
      return;
    }
    if (isOnboardingComplete(session.user.id)) {
      void navigate({ to: ONBOARDING_COMPLETE_ROUTE, replace: true });
    }
  }, [authLoading, navigate, session]);

  const {
    data: status = null,
    isLoading: statusLoading,
    error: statusError,
  } = useQuery({
    queryKey: onboardingMissionsKeys.status(userId),
    queryFn: () => fetchOnboardingMissionStatus(userId!),
    enabled: Boolean(userId),
    staleTime: 15_000,
  });

  const finishFunnel = useCallback(() => {
    if (!userId) return;
    markOnboardingComplete(userId);
    void navigate({ to: ONBOARDING_COMPLETE_ROUTE, replace: true });
  }, [navigate, userId]);

  const claimWelcomeBonus = useCallback(async () => {
    if (!userId || claiming) return;
    setClaiming(true);
    setClaimError(null);
    try {
      const data = await callRpc('rpc_claim_welcome_bonus', {
        p_idempotency_key: `welcome:${userId}`,
      });

      const payload = data as unknown as WelcomeBonusClaimResult;
      if (!payload.already_claimed) {
        productToast.show({
          zone: 'warm',
          key: 'welcome.earnedPhon',
          values: { amount: formatWelcomeRewardAmount(payload.phon_awarded) },
        });
      }

      await queryClient.invalidateQueries({ queryKey: onboardingMissionsKeys.status(userId) });
    } catch (err) {
      setClaimError(translateError(err, 'error.UNKNOWN'));
    } finally {
      setClaiming(false);
    }
  }, [claiming, queryClient, userId]);

  const missions: OnboardingMissionCardView[] = ONBOARDING_D0_MISSIONS.map((mission) => {
    const snapshot: OnboardingMissionStatusSnapshot = status ?? {
      welcomeClaimed: false,
      welcomeRewardPhon: null,
      profileComplete: false,
      profileRewardPhon: null,
      shareUsed: 0,
      shareRewardPhon: null,
    };
    const state = resolveOnboardingMissionCardState(mission.id, snapshot);

    const rewardPhon =
      mission.id === 'welcome-bonus'
        ? snapshot.welcomeRewardPhon
        : mission.id === 'growth-completeProfile'
          ? snapshot.profileRewardPhon
          : snapshot.shareRewardPhon;

    return {
      ...mission,
      state,
      rewardLabel: rewardPhon ? formatPhonRewardDisplay(rewardPhon) : '—',
    };
  });

  const completedCount = status ? countCompletedOnboardingMissions(status) : 0;
  const queryError = statusError ? translateError(statusError, 'error.UNKNOWN') : null;

  return {
    t,
    loading: authLoading || statusLoading,
    claiming,
    error: claimError ?? queryError,
    missions,
    completedCount,
    missionCount: ONBOARDING_D0_MISSION_COUNT,
    welcomeClaimed: Boolean(status?.welcomeClaimed),
    claimWelcomeBonus,
    finish: finishFunnel,
    skip: finishFunnel,
  };
}
