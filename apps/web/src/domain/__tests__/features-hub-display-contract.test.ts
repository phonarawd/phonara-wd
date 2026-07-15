import { describe, expect, it } from 'vitest';

import {
  assertFeaturesHubContractSync,
  FEATURES_EARN_ROUTE,
  FEATURES_HUB_CARDS,
  FEATURES_HUB_ROUTE,
  FEATURES_VIP_ROUTE,
} from '../features-hub-display-contract';

describe('features-hub-display-contract', () => {
  it('binds features routes and hub cards', () => {
    expect(FEATURES_HUB_ROUTE).toBe('/features');
    expect(FEATURES_EARN_ROUTE).toBe('/features/earn');
    expect(FEATURES_VIP_ROUTE).toBe('/features/vip');
    expect(FEATURES_HUB_CARDS).toHaveLength(6);
    expect(FEATURES_HUB_CARDS.map((c) => c.route)).toContain('/security');
    expect(() => assertFeaturesHubContractSync()).not.toThrow();
  });
});
