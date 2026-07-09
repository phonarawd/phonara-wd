/**
 * §13.11 First 7-day onboarding journey — display contract.
 * Authority: docs/SSOT/ONBOARDING_JOURNEY_CANON.md · Plan §13.11
 */

import { HOME_MISSIONS_INVITE_ROUTE } from './home-missions-invite-display-contract';

export const ONBOARDING_JOURNEY_DAY_COUNT = 7 as const;

export type OnboardingJourneyDayId = 'd0' | 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'd7';

export type OnboardingJourneyStep = {
  readonly day: OnboardingJourneyDayId;
  readonly titleKey: `onboarding.journey.${OnboardingJourneyDayId}.title`;
  readonly bodyKey: `onboarding.journey.${OnboardingJourneyDayId}.body`;
  readonly ctaKey: `onboarding.journey.${OnboardingJourneyDayId}.cta`;
  readonly route: string;
  readonly optional: boolean;
};

/** D0 isolated mission handoff id — hub duplicate claim 0 (§3.4.3). */
export const ONBOARDING_D0_MISSION_UI_ID = 'onboarding-welcome' as const;

export const ONBOARDING_JOURNEY_STEPS: readonly OnboardingJourneyStep[] = [
  {
    day: 'd0',
    titleKey: 'onboarding.journey.d0.title',
    bodyKey: 'onboarding.journey.d0.body',
    ctaKey: 'onboarding.journey.d0.cta',
    route: '/onboarding/missions',
    optional: false,
  },
  {
    day: 'd1',
    titleKey: 'onboarding.journey.d1.title',
    bodyKey: 'onboarding.journey.d1.body',
    ctaKey: 'onboarding.journey.d1.cta',
    route: '/home/attendance',
    optional: false,
  },
  {
    day: 'd2',
    titleKey: 'onboarding.journey.d2.title',
    bodyKey: 'onboarding.journey.d2.body',
    ctaKey: 'onboarding.journey.d2.cta',
    route: HOME_MISSIONS_INVITE_ROUTE,
    optional: false,
  },
  {
    day: 'd3',
    titleKey: 'onboarding.journey.d3.title',
    bodyKey: 'onboarding.journey.d3.body',
    ctaKey: 'onboarding.journey.d3.cta',
    route: HOME_MISSIONS_INVITE_ROUTE,
    optional: false,
  },
  {
    day: 'd4',
    titleKey: 'onboarding.journey.d4.title',
    bodyKey: 'onboarding.journey.d4.body',
    ctaKey: 'onboarding.journey.d4.cta',
    route: '/account/profile',
    optional: false,
  },
  {
    day: 'd5',
    titleKey: 'onboarding.journey.d5.title',
    bodyKey: 'onboarding.journey.d5.body',
    ctaKey: 'onboarding.journey.d5.cta',
    route: '/wallet/deposit',
    optional: true,
  },
  {
    day: 'd6',
    titleKey: 'onboarding.journey.d6.title',
    bodyKey: 'onboarding.journey.d6.body',
    ctaKey: 'onboarding.journey.d6.cta',
    route: '/casino',
    optional: true,
  },
  {
    day: 'd7',
    titleKey: 'onboarding.journey.d7.title',
    bodyKey: 'onboarding.journey.d7.body',
    ctaKey: 'onboarding.journey.d7.cta',
    route: '/home/missions',
    optional: false,
  },
] as const;

export const ONBOARDING_JOURNEY_OPTIONAL_BADGE_KEY = 'onboarding.journey.optionalBadge' as const;

export function resolveOnboardingJourneyStep(day: OnboardingJourneyDayId): OnboardingJourneyStep {
  const step = ONBOARDING_JOURNEY_STEPS.find((s) => s.day === day);
  if (!step) {
    throw new Error(`Unknown onboarding journey day: ${day}`);
  }
  return step;
}

/** All journey copy keys — must exist in `@phonara/i18n` ko+en (`p6-doc-platform-canon-sync`). */
export function listOnboardingJourneyMessageKeys(): readonly string[] {
  const keys = ONBOARDING_JOURNEY_STEPS.flatMap((step) => [
    step.titleKey,
    step.bodyKey,
    step.ctaKey,
  ]);
  return [...keys, ONBOARDING_JOURNEY_OPTIONAL_BADGE_KEY];
}
