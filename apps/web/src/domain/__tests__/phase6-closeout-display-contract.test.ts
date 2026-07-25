import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAUNCH_GATES } from '../../lib/launch-gates';
import { tierGuideFaqAnswerKey, tierGuideFaqQuestionKey } from '../tier-guide-display-contract';
import { PHASE6_CLOSEOUT, assertPhase6CloseoutSync } from '../phase6-closeout-display-contract';

const repoRoot = join(import.meta.dirname, '../../../../../');

const TIER_GUIDE_FAMILY = [
  'apps/web/src/product/surfaces/marketing/tier-guide-page.tsx',
  'apps/web/src/domain/tier-guide-display-contract.ts',
  'apps/web/src/features/earn/use-tier-guide-page-controller.ts',
] as const;

describe('phase6-closeout-display-contract', () => {
  it('keeps closeout constants pinned', () => {
    expect(PHASE6_CLOSEOUT.orphanTierGuideFlagRemoved).toBe(true);
    expect(PHASE6_CLOSEOUT.tierGuidePageFamilyPreserved).toBe(true);
    expect(PHASE6_CLOSEOUT.designTokensStrictAdvisoryTarget).toBe(0);
  });

  it('removes orphan LAUNCH_GATES.tierGuide without touching live /tier family', () => {
    const launchGateKeys = Object.keys(LAUNCH_GATES);
    const tierGuidePageFamilyPathsExist = TIER_GUIDE_FAMILY.every((rel) =>
      existsSync(join(repoRoot, rel)),
    );

    assertPhase6CloseoutSync({ launchGateKeys, tierGuidePageFamilyPathsExist });

    expect(launchGateKeys).not.toContain('tierGuide');
    expect(tierGuidePageFamilyPathsExist).toBe(true);
    // Live tier-guide helpers still resolve (unrelated to the removed flag).
    expect(tierGuideFaqQuestionKey('q1')).toBe('tier.guide.faq.q1');
    expect(tierGuideFaqAnswerKey('q1')).toBe('tier.guide.faq.a1');
  });
});
