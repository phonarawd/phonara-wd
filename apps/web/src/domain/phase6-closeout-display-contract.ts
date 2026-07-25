/**
 * Phase 6 closeout display contract — presentation hygiene only.
 * Engine / RPC / TierGuidePage family (`/tier`) are out of scope for the orphan flag cleanup.
 */

export const PHASE6_CLOSEOUT = {
  /** Orphan `LAUNCH_GATES.tierGuide` removed — never consumed in apps/web. */
  orphanTierGuideFlagRemoved: true,
  /**
   * Live `/tier` surface family must remain (unrelated symbols that share the tierGuide name).
   * Do not delete TierGuidePage / tier-guide-display-contract / use-tier-guide-page-controller.
   */
  tierGuidePageFamilyPreserved: true,
  /** `check:design-tokens --strict` — spacing-ratchet advisory target after gap-6 → gap-ds-8. */
  designTokensStrictAdvisoryTarget: 0,
} as const;

export function assertPhase6CloseoutSync(input: {
  launchGateKeys: readonly string[];
  tierGuidePageFamilyPathsExist: boolean;
}): void {
  if (!PHASE6_CLOSEOUT.orphanTierGuideFlagRemoved) {
    throw new Error('phase6: orphan tierGuide flag cleanup not marked complete');
  }
  if (input.launchGateKeys.includes('tierGuide')) {
    throw new Error('phase6: LAUNCH_GATES.tierGuide must be removed (orphan dead flag)');
  }
  if (!PHASE6_CLOSEOUT.tierGuidePageFamilyPreserved) {
    throw new Error('phase6: TierGuidePage family preserve flag must stay true');
  }
  if (!input.tierGuidePageFamilyPathsExist) {
    throw new Error(
      'phase6: TierGuidePage / tier-guide-display-contract / use-tier-guide-page-controller must remain',
    );
  }
  if (PHASE6_CLOSEOUT.designTokensStrictAdvisoryTarget !== 0) {
    throw new Error('phase6: design-tokens strict advisory target must be 0');
  }
}
