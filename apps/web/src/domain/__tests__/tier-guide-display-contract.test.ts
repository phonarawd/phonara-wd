import { describe, expect, it } from 'vitest';

import {
  assertTierGuideContractSync,
  buildTierGuideRows,
  TIER_GUIDE_FAQ_IDS,
  TIER_GUIDE_ROUTE,
  tierGuideFaqAnswerKey,
  tierGuideFaqQuestionKey,
} from '../tier-guide-display-contract';

describe('tier-guide-display-contract', () => {
  it('binds /tier and FAQ keys', () => {
    expect(TIER_GUIDE_ROUTE).toBe('/tier');
    expect(TIER_GUIDE_FAQ_IDS).toEqual(['q1', 'q2', 'q3']);
    expect(tierGuideFaqQuestionKey('q1')).toBe('tier.guide.faq.q1');
    expect(tierGuideFaqAnswerKey('q1')).toBe('tier.guide.faq.a1');
    expect(() => assertTierGuideContractSync()).not.toThrow();
  });

  it('builds ladder rows with optional current highlight', () => {
    const guest = buildTierGuideRows(null);
    expect(guest).toHaveLength(5);
    expect(guest.every((row) => !row.current)).toBe(true);

    const gold = buildTierGuideRows('gold');
    expect(gold.find((row) => row.tier === 'gold')?.current).toBe(true);
    expect(gold.filter((row) => row.current)).toHaveLength(1);
  });
});
