/**
 * `/onboarding/missions` — Day 0 welcome mission intro (§13.10.6).
 * Welcome bonus = engine exists · profile + share = ENGINE:partial deep-link intro.
 */

import type { MessageKey } from '@phonara/i18n';

import type { MissionCardDisplayState } from './viral-missions-display-contract';

export const ONBOARDING_MISSIONS_ROUTE = '/onboarding/missions' as const;

export type OnboardingD0MissionEngine = 'exists' | 'partial';

export type OnboardingD0MissionId = 'welcome-bonus' | 'growth-completeProfile' | 'viral-shareLink';

export type OnboardingD0MissionDef = {
  id: OnboardingD0MissionId;
  titleKey: MessageKey;
  descKey: MessageKey;
  engine: OnboardingD0MissionEngine;
  /** null = primary action handled on-page (welcome claim). */
  continueRoute: string | null;
};

export const ONBOARDING_D0_MISSIONS: readonly OnboardingD0MissionDef[] = [
  {
    id: 'welcome-bonus',
    titleKey: 'onboarding.missions.welcome.title',
    descKey: 'onboarding.missions.welcome.desc',
    engine: 'exists',
    continueRoute: null,
  },
  {
    id: 'growth-completeProfile',
    titleKey: 'onboarding.missions.profile.title',
    descKey: 'onboarding.missions.profile.desc',
    engine: 'partial',
    continueRoute: '/account',
  },
  {
    id: 'viral-shareLink',
    titleKey: 'onboarding.missions.share.title',
    descKey: 'onboarding.missions.share.desc',
    engine: 'partial',
    continueRoute: '/home',
  },
] as const;

export const ONBOARDING_D0_MISSION_COUNT = ONBOARDING_D0_MISSIONS.length;

export type OnboardingMissionStatusSnapshot = {
  welcomeClaimed: boolean;
  welcomeRewardPhon: string | null;
  profileComplete: boolean;
  profileRewardPhon: string | null;
  shareUsed: number;
  shareRewardPhon: string | null;
};

export function resolveOnboardingMissionCardState(
  missionId: OnboardingD0MissionId,
  status: OnboardingMissionStatusSnapshot,
): MissionCardDisplayState {
  switch (missionId) {
    case 'welcome-bonus':
      return status.welcomeClaimed ? 'completed' : 'reward_pending';
    case 'growth-completeProfile':
      return status.profileComplete ? 'completed' : 'in_progress';
    case 'viral-shareLink':
      return status.shareUsed > 0 ? 'completed' : 'in_progress';
    default:
      return 'in_progress';
  }
}

export function countCompletedOnboardingMissions(status: OnboardingMissionStatusSnapshot): number {
  return ONBOARDING_D0_MISSIONS.filter(
    (mission) => resolveOnboardingMissionCardState(mission.id, status) === 'completed',
  ).length;
}

/** Display-only formatting for welcome toast — RPC decimal string, no client math. */
export function formatWelcomeRewardAmount(phon: string): string {
  const numeric = Number.parseFloat(phon);
  if (!Number.isFinite(numeric)) return phon;
  return numeric.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
