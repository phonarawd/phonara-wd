import { describe, expect, it } from 'vitest';

import {
  assertP12TrustMarketingHubSync,
  P12_TRUST_MARKETING_HUB_PREREQUISITE_TODO,
  P12_TRUST_MARKETING_HUB_ROUTES,
  P12_TRUST_MARKETING_HUB_TODO,
} from '../p12-trust-marketing-hub-display-contract';

describe('p12-trust-marketing-hub-display-contract', () => {
  it('binds P12 todo, prerequisite, and six routes', () => {
    expect(P12_TRUST_MARKETING_HUB_TODO).toBe('p12-trust-marketing-hub');
    expect(P12_TRUST_MARKETING_HUB_PREREQUISITE_TODO).toBe('p11-gate-side-income');
    expect([...P12_TRUST_MARKETING_HUB_ROUTES]).toEqual([
      '/tier',
      '/features',
      '/features/earn',
      '/features/vip',
      '/fees',
      '/security',
    ]);
    expect(() => assertP12TrustMarketingHubSync()).not.toThrow();
  });
});
