import { describe, expect, it } from 'vitest';

import { buildFeesCashbackRows } from '../fees-page-display-contract';
import {
  buildEarnCashbackRows,
  resolveCurrentCashbackKey,
} from '../earn-cashback-display-contract';
import { buildTierBenefitsPreviewRow } from '../tier-me-display-contract';
import { buildTierGuideRows } from '../tier-guide-display-contract';
import { EARN_VIP_TIER_ORDER } from '../unified-tier-display-contract';

/**
 * ZA-08 — the cashback-rate i18n key `tier.guide.rows.${tier}.cashback` is
 * re-derived independently in 3 places (tier-me-display-contract.ts is the
 * SOT; earn-cashback-display-contract.ts and fees-page-display-contract.ts
 * re-derive the same literal to stay self-contained). This test is the drift
 * guard across the 4 surfaces that display it: `/tier/me`, `/tier`,
 * `/earn/cashback`, `/fees`. If any one of them changes the template without
 * updating the others, this test fails.
 */
describe('tier cashback key single source (ZA-08)', () => {
  it('resolves the same tier.guide.rows.<tier>.cashback key across all 4 surfaces', () => {
    for (const tier of EARN_VIP_TIER_ORDER) {
      const expected = `tier.guide.rows.${tier}.cashback`;

      const tierMeKey = buildTierBenefitsPreviewRow(tier, tier).cashbackKey;
      const tierGuideKey = buildTierGuideRows(tier).find((row) => row.tier === tier)?.cashbackKey;
      const earnCashbackBuilderKey = buildEarnCashbackRows(tier).find(
        (row) => row.tier === tier,
      )?.cashbackKey;
      const earnCashbackResolverKey = resolveCurrentCashbackKey(tier);
      const feesKey = buildFeesCashbackRows().find((row) => row.tier === tier)?.cashbackKey;

      expect(tierMeKey).toBe(expected);
      expect(tierGuideKey).toBe(expected);
      expect(earnCashbackBuilderKey).toBe(expected);
      expect(earnCashbackResolverKey).toBe(expected);
      expect(feesKey).toBe(expected);
    }
  });

  it('covers all 4 EarnVipTier values (bronze/silver/gold/platinum(+diamond if present))', () => {
    expect(EARN_VIP_TIER_ORDER.length).toBeGreaterThanOrEqual(4);
    expect(buildFeesCashbackRows()).toHaveLength(EARN_VIP_TIER_ORDER.length);
  });
});
