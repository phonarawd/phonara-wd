/**
 * DA W4 Motion system GATE (§34.15–34.16 · YAML #193).
 * Authority: `da-w4-gate-motion` · PRODUCT_EXPERIENCE_CANON §5 · UNIFIED_UX_CANON §4.
 */

import {
  DA_W4_COUNT_UP_MAX_MS,
  DA_W4_MOTION_SYSTEM_BUNDLE_TODO,
  DA_W4_MOTION_TIERS,
} from './da-w4-motion-system-display-contract';

export const DA_W4_GATE_MOTION_TODO = 'da-w4-gate-motion' as const;

/** Prerequisite BUNDLE must be closed before this GATE. */
export const DA_W4_GATE_MOTION_PREREQUISITE_TODOS = [DA_W4_MOTION_SYSTEM_BUNDLE_TODO] as const;

/** matchMedia query — single SOT for OS reduced-motion preference. */
export const DA_W4_REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)' as const;

/**
 * Owners that must collapse motion when reduced-motion is on
 * (hook · presets · count-up · aurora · overlay primitives).
 */
export const DA_W4_REDUCED_MOTION_OWNER_PATHS = [
  'product/primitives/lib/use-prefers-reduced-motion.ts',
  'product/primitives/lib/motion-presets.ts',
  'product/primitives/lib/use-count-up.ts',
  'product/primitives/lib/motion-tier.ts',
  'product/tokens/motion.css',
  'product/shell/aurora-background.tsx',
  'product/primitives/dialog.tsx',
  'product/primitives/sheet.tsx',
] as const;

/** On-disk artifacts required for W4 motion GATE. */
export const DA_W4_GATE_MOTION_ARTIFACT_PATHS = [
  'domain/da-w4-gate-motion-display-contract.ts',
  'domain/da-w4-motion-system-display-contract.ts',
  ...DA_W4_REDUCED_MOTION_OWNER_PATHS,
] as const;

/** gate:ai-impl owner paths — reduced-motion regression + motion-presets. */
export const DA_W4_GATE_MOTION_TEST_PATHS = [
  'apps/web/src/domain/__tests__/da-w4-gate-motion-display-contract.test.ts',
  'apps/web/src/domain/__tests__/da-w4-motion-system-display-contract.test.ts',
  'apps/web/src/product/primitives/__tests__/use-prefers-reduced-motion.test.ts',
  'apps/web/src/product/primitives/__tests__/motion-presets.test.ts',
  'apps/web/src/product/primitives/__tests__/use-count-up.test.ts',
  'apps/web/src/product/primitives/__tests__/money-display.test.tsx',
  'apps/web/src/product/shell/__tests__/shell-elevation.test.tsx',
] as const;

/** Operator VISUAL advisory checklist (§34.31 · advisory until da-w7 / §20.12 full). */
export const DA_W4_GATE_MOTION_VISUAL_ADVISORY_CHECKLIST = [
  'reduced-motion-count-up-instant',
  'reduced-motion-aurora-static',
  'reduced-motion-css-tokens-0ms',
  'instant-motion-variants-duration-0',
  'l2-financial-submit-instant',
  'motion-presets-two-springs-only',
] as const;

/** Non-waivable sync for DA W4 GATE closeout. */
export function assertDaW4GateMotionSync(): void {
  if (!DA_W4_GATE_MOTION_PREREQUISITE_TODOS.includes(DA_W4_MOTION_SYSTEM_BUNDLE_TODO)) {
    throw new Error('da-w4-gate-motion: missing prerequisite da-w4-motion-system-bundle');
  }

  if (DA_W4_COUNT_UP_MAX_MS !== 400) {
    throw new Error('da-w4-gate-motion: count-up max must remain 400ms (BUNDLE SOT)');
  }

  if (!DA_W4_MOTION_TIERS.includes('L2')) {
    throw new Error('da-w4-gate-motion: L2 financial tier required');
  }

  if (DA_W4_REDUCED_MOTION_MEDIA_QUERY !== '(prefers-reduced-motion: reduce)') {
    throw new Error('da-w4-gate-motion: reduced-motion media query drift');
  }

  if (DA_W4_GATE_MOTION_TEST_PATHS.length < 5) {
    throw new Error('da-w4-gate-motion: owner test paths incomplete');
  }
}
