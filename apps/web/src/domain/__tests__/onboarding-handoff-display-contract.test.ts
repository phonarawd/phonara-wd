import { describe, expect, it } from 'vitest';

import {
  ONBOARDING_HANDOFF_ROUTE,
  ONBOARDING_COMPLETE_ROUTE,
  resolvePostAuthDestination,
} from '../onboarding-handoff-display-contract';

describe('onboarding-handoff-display-contract', () => {
  it('routes incomplete users to onboarding before home', () => {
    expect(
      resolvePostAuthDestination({
        userId: 'abc',
        isOnboardingComplete: () => false,
      }),
    ).toBe(ONBOARDING_HANDOFF_ROUTE);

    expect(
      resolvePostAuthDestination({
        userId: 'abc',
        isOnboardingComplete: () => true,
      }),
    ).toBe(ONBOARDING_COMPLETE_ROUTE);
  });

  it('honours explicit safe next paths', () => {
    expect(
      resolvePostAuthDestination({
        userId: 'abc',
        isOnboardingComplete: () => false,
        explicitNext: '/wallet',
      }),
    ).toBe('/wallet');
  });
});
