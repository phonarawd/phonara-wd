/**
 * Landing Design Release v1.0 — Phase 2 signoff contract (DESIGN_CHARTER · ADR-003).
 */

import { BRAND_ASSETS } from '@/domain/brand-display-contract';
import { LANDING_SURFACE } from '@/domain/landing-display-contract';

export const LANDING_DESIGN_RELEASE_VERSION = '1.0' as const;

export const LANDING_DESIGN_RELEASE_DATE = '2026-07-05' as const;

export const LANDING_DESIGN_RELEASE_SCOPE = [
  'CVR-first fold IA',
  'flat BrandMark + semantic tokens',
  'Voice Charter compliance',
  '390/768/1024 responsive',
] as const;

/** Token SOT paths — timeless conversion grammar. */
export const LANDING_DESIGN_RELEASE_TOKEN_SOURCES = [
  'apps/web/src/product/tokens',
  'apps/web/src/product/primitives',
] as const;

export const LANDING_DESIGN_RELEASE_BRAND_ASSETS = {
  chromeMark: BRAND_ASSETS.mono,
  heroMark: BRAND_ASSETS.hero3d,
  splashMark: BRAND_ASSETS.splashBoot,
} as const;

export const LANDING_DESIGN_RELEASE_SURFACE = LANDING_SURFACE;

export const LANDING_DESIGN_RELEASE_CHECKLIST = [
  'cvr-fold-modules',
  'faq-8-plus-3',
  'analytics-funnel-contract',
  'proof-resolver-presentation',
  'no-competitor-names',
  'no-fake-user-ratings',
  'wallet-preview-presentation-only',
] as const;

export type LandingDesignReleaseChecklistId = (typeof LANDING_DESIGN_RELEASE_CHECKLIST)[number];
