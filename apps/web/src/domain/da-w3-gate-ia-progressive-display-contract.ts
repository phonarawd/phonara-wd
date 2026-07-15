/**
 * DA W3 Progressive disclosure GATE (§34.12–34.14 · YAML #191).
 * Authority: `da-w3-gate-ia-progressive` · HOME_UX_CANON · Plan §34.32 above-fold ≤3.
 */

import { EARN_HOME_HUB_MISSION_PREVIEW_MAX } from './earn-home-display-contract';

export const DA_W3_GATE_IA_PROGRESSIVE_TODO = 'da-w3-gate-ia-progressive' as const;

export const DA_W3_IA_PROGRESSIVE_BUNDLE_TODO = 'da-w3-ia-progressive-bundle' as const;

/** Prerequisite bundle must be closed before this GATE. */
export const DA_W3_GATE_IA_PROGRESSIVE_PREREQUISITE_TODOS = [
  DA_W3_IA_PROGRESSIVE_BUNDLE_TODO,
] as const;

/**
 * `/home` above-fold modules — status · next action · money (§34.12 · §34.32).
 * Fold3+ stay collapsed / below-fold so first viewport stays ≤3.
 */
export const EARN_HOME_ABOVE_FOLD_MODULES = ['status', 'next_action', 'money'] as const;

export type EarnHomeAboveFoldModule = (typeof EARN_HOME_ABOVE_FOLD_MODULES)[number];

export const EARN_HOME_ABOVE_FOLD_MODULE_MAX = 3 as const;

/** Fold test ids that must be present on `/home` for GATE structural smoke. */
export const EARN_HOME_PROGRESSIVE_FOLD_TEST_IDS = [
  'earn-home-fold1',
  'earn-home-fold2',
  'earn-home-fold3',
  'earn-home-fold4',
  'earn-home-fold5',
] as const;

/** Collapsible owners — default collapsed for progressive disclosure. */
export const DA_W3_DEFAULT_COLLAPSED_TEST_IDS = [
  'earn-home-insights-fold',
  'wallet-hero-details',
  'trade-mobile-ticket-fold',
] as const;

/** Fold2 money snapshot — default open (above-fold module 3). */
export const DA_W3_DEFAULT_OPEN_TEST_IDS = ['earn-home-money-fold'] as const;

/** Operator VISUAL advisory viewports (§20.12 companion · advisory not full APPROVED). */
export const DA_W3_GATE_VISUAL_VIEWPORT_WIDTHS = [390, 768, 1024] as const;

/** gate:ai-impl owner paths — home + wallet + trade progressive surfaces. */
export const DA_W3_GATE_IA_PROGRESSIVE_TEST_PATHS = [
  'apps/web/src/domain/__tests__/da-w3-gate-ia-progressive-display-contract.test.ts',
  'apps/web/src/domain/__tests__/earn-home-display-contract.test.ts',
  'apps/web/src/product/primitives/__tests__/collapsible-section.test.tsx',
  'apps/web/src/product/surfaces/home/__tests__/earn-home-page.test.tsx',
  'apps/web/src/product/surfaces/__tests__/da-w3-gate-ia-progressive.test.tsx',
  'apps/web/src/product/surfaces/__tests__/p8-core-visual-signoff.test.tsx',
  'apps/web/src/product/surfaces/wallet/__tests__/wallet-page.test.tsx',
  'apps/web/src/product/surfaces/trade/__tests__/trade-desk-mobile-tabs.test.tsx',
] as const;

/** On-disk artifacts required for W3 progressive IA GATE. */
export const DA_W3_GATE_IA_PROGRESSIVE_ARTIFACT_PATHS = [
  'domain/da-w3-gate-ia-progressive-display-contract.ts',
  'domain/earn-home-display-contract.ts',
  'product/primitives/collapsible-section.tsx',
  'product/surfaces/home/earn-home-page.tsx',
  'product/surfaces/wallet/wallet-balance-hero.tsx',
  'product/surfaces/trade/trade-desk-mobile-tabs.tsx',
] as const;

/** Operator VISUAL advisory checklist (§34.31 · advisory until da-w7 / §20.12 full). */
export const DA_W3_GATE_VISUAL_ADVISORY_CHECKLIST = [
  'home-above-fold-three-modules',
  'home-fold3-collapsed-default',
  'home-missions-preview-max-3',
  'wallet-hero-accordion-collapsed',
  'trade-mobile-ticket-collapsed',
  'viewport-390-768-1024-smoke',
  'five-tab-ia-unchanged',
] as const;

/** Non-waivable sync for DA W3 GATE closeout. */
export function assertDaW3GateIaProgressiveSync(): void {
  if (EARN_HOME_ABOVE_FOLD_MODULES.length !== EARN_HOME_ABOVE_FOLD_MODULE_MAX) {
    throw new Error(
      `da-w3-gate-ia-progressive: above-fold modules must be exactly ${EARN_HOME_ABOVE_FOLD_MODULE_MAX}`,
    );
  }

  if (EARN_HOME_HUB_MISSION_PREVIEW_MAX !== 3) {
    throw new Error('da-w3-gate-ia-progressive: Fold4 mission preview max must be 3');
  }

  if (DA_W3_DEFAULT_COLLAPSED_TEST_IDS.length < 3) {
    throw new Error(
      'da-w3-gate-ia-progressive: home Fold3 · wallet-hero · trade ticket must default collapsed',
    );
  }

  if (!DA_W3_GATE_IA_PROGRESSIVE_PREREQUISITE_TODOS.includes(DA_W3_IA_PROGRESSIVE_BUNDLE_TODO)) {
    throw new Error('da-w3-gate-ia-progressive: missing prerequisite da-w3-ia-progressive-bundle');
  }
}
