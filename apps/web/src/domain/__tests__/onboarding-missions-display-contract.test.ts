import { describe, expect, it } from 'vitest';

import {
  countCompletedOnboardingMissions,
  ONBOARDING_D0_MISSION_COUNT,
  resolveOnboardingMissionCardState,
} from '../onboarding-missions-display-contract';

describe('onboarding-missions-display-contract', () => {
  const emptyStatus = {
    welcomeClaimed: false,
    welcomeRewardPhon: null,
    profileComplete: false,
    profileRewardPhon: null,
    shareUsed: 0,
    shareRewardPhon: null,
  };

  it('exposes three Day 0 missions', () => {
    expect(ONBOARDING_D0_MISSION_COUNT).toBe(3);
  });

  it('marks welcome bonus as reward_pending until claimed', () => {
    expect(resolveOnboardingMissionCardState('welcome-bonus', emptyStatus)).toBe('reward_pending');
    expect(
      resolveOnboardingMissionCardState('welcome-bonus', { ...emptyStatus, welcomeClaimed: true }),
    ).toBe('completed');
  });

  it('counts completed missions from card states', () => {
    expect(countCompletedOnboardingMissions(emptyStatus)).toBe(0);
    expect(
      countCompletedOnboardingMissions({
        ...emptyStatus,
        welcomeClaimed: true,
        profileComplete: true,
        shareUsed: 1,
      }),
    ).toBe(3);
  });
});
