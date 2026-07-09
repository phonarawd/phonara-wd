import { describe, expect, it } from 'vitest';

import { messages, type MessageKey } from '@phonara/i18n';

import {
  ONBOARDING_D0_MISSION_UI_ID,
  ONBOARDING_JOURNEY_STEPS,
  listOnboardingJourneyMessageKeys,
  resolveOnboardingJourneyStep,
} from '../onboarding-journey-display-contract';

describe('onboarding-journey-display-contract §13.11', () => {
  it('defines 8 steps d0–d7 with isolated D0 mission id', () => {
    expect(ONBOARDING_JOURNEY_STEPS).toHaveLength(8);
    expect(ONBOARDING_D0_MISSION_UI_ID).toBe('onboarding-welcome');
    expect(ONBOARDING_JOURNEY_STEPS[0]?.route).toBe('/onboarding/missions');
  });

  it('marks deposit and first play as optional', () => {
    const d5 = resolveOnboardingJourneyStep('d5');
    const d6 = resolveOnboardingJourneyStep('d6');
    expect(d5.optional).toBe(true);
    expect(d6.optional).toBe(true);
    expect(resolveOnboardingJourneyStep('d1').optional).toBe(false);
  });

  it('aligns primary CTA routes with Plan §13.11 · P7 invite handoff', () => {
    expect(resolveOnboardingJourneyStep('d1').route).toBe('/home/attendance');
    expect(resolveOnboardingJourneyStep('d2').route).toBe('/home/missions/invite');
    expect(resolveOnboardingJourneyStep('d3').route).toBe('/home/missions/invite');
    expect(resolveOnboardingJourneyStep('d4').route).toBe('/account/profile');
    expect(resolveOnboardingJourneyStep('d5').route).toBe('/wallet/deposit');
    expect(resolveOnboardingJourneyStep('d7').route).toBe('/home/missions');
  });

  it('registers ko+en i18n keys for every journey step', () => {
    for (const key of listOnboardingJourneyMessageKeys()) {
      expect(messages.ko[key as MessageKey], `missing ko: ${key}`).toBeTruthy();
      expect(messages.en[key as MessageKey], `missing en: ${key}`).toBeTruthy();
    }
  });
});
