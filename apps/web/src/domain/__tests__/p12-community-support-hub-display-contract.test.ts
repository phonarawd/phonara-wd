import { describe, expect, it } from 'vitest';

import {
  assertP12CommunitySupportHubSync,
  P12_COMMUNITY_SUPPORT_HUB_PREREQUISITE_TODO,
  P12_COMMUNITY_SUPPORT_HUB_ROUTES,
  P12_COMMUNITY_SUPPORT_HUB_STUB_ROUTES,
  P12_COMMUNITY_SUPPORT_HUB_TODO,
} from '../p12-community-support-hub-display-contract';

describe('p12-community-support-hub-display-contract', () => {
  it('binds P12 todo, prerequisite, six routes, and zero stubs after E10', () => {
    expect(P12_COMMUNITY_SUPPORT_HUB_TODO).toBe('p12-community-support-hub');
    expect(P12_COMMUNITY_SUPPORT_HUB_PREREQUISITE_TODO).toBe('p12-trust-marketing-hub');
    expect([...P12_COMMUNITY_SUPPORT_HUB_ROUTES]).toEqual([
      '/announcements',
      '/status',
      '/support',
      '/support/faq',
      '/support/ticket',
      '/feedback',
    ]);
    expect([...P12_COMMUNITY_SUPPORT_HUB_STUB_ROUTES]).toEqual([]);
    expect(() => assertP12CommunitySupportHubSync()).not.toThrow();
  });
});
