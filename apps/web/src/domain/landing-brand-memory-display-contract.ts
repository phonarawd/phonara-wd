/**
 * Brand Memory Test — Phase 4 operator recall protocol (DESIGN_CHARTER §6 defer).
 * DEV/operator tooling contract — not user-facing production UI.
 */

import { BRAND_ASSETS } from '@/domain/brand-display-contract';

export const LANDING_BRAND_MEMORY_TEST_VERSION = '1.0' as const;

export const LANDING_BRAND_MEMORY_TEST_VARIANTS = ['flat', 'shape', 'hero-3d'] as const;

export type LandingBrandMemoryTestVariant = (typeof LANDING_BRAND_MEMORY_TEST_VARIANTS)[number];

export const LANDING_BRAND_MEMORY_TEST_ASSETS: Readonly<
  Record<LandingBrandMemoryTestVariant, string>
> = {
  flat: BRAND_ASSETS.mono,
  shape: BRAND_ASSETS.shape,
  'hero-3d': BRAND_ASSETS.hero3d,
};

export const LANDING_BRAND_MEMORY_TEST_PROMPTS = [
  'recall_shape',
  'recall_color',
  'recall_wordmark',
] as const;

export type LandingBrandMemoryTestPromptId = (typeof LANDING_BRAND_MEMORY_TEST_PROMPTS)[number];

export const LANDING_BRAND_MEMORY_TEST_SCORE_RUBRIC = {
  recall_shape: { pass: 0.7, target: 0.85 },
  recall_color: { pass: 0.6, target: 0.8 },
  recall_wordmark: { pass: 0.75, target: 0.9 },
} as const;

export function landingBrandMemoryPromptKey(
  id: LandingBrandMemoryTestPromptId,
): `landing.brandMemory.prompt.${LandingBrandMemoryTestPromptId}` {
  return `landing.brandMemory.prompt.${id}`;
}
