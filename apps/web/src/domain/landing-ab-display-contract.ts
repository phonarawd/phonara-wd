/**
 * Landing A/B display contract — Phase 3 (ADR-003 · PRODUCT_OPERATING_SYSTEM §1).
 * Variant `v=a|b` query param · brandLine · CTA · fold IA order.
 */

import type { MessageKey } from '@phonara/i18n';

import { PLATFORM_POSITIONING_KEYS } from '@/domain/platform-narrative-display-contract';

export const LANDING_AB_VARIANTS = ['a', 'b'] as const;

export type LandingAbVariant = (typeof LANDING_AB_VARIANTS)[number];

export const LANDING_AB_QUERY_KEY = 'v' as const;

/** Fold modules whose order may swap under variant B. */
export const LANDING_AB_IA_FOLD_SECTION_IDS = [
  'why',
  'differentiators',
  'missionPreview',
  'walletPreview',
] as const;

export type LandingAbIaFoldSectionId = (typeof LANDING_AB_IA_FOLD_SECTION_IDS)[number];

export const LANDING_AB_IA_FOLD_ORDER_A: readonly LandingAbIaFoldSectionId[] = [
  'why',
  'differentiators',
  'missionPreview',
  'walletPreview',
];

/** Variant B — wallet before mission (trust-first fold experiment). */
export const LANDING_AB_IA_FOLD_ORDER_B: readonly LandingAbIaFoldSectionId[] = [
  'why',
  'differentiators',
  'walletPreview',
  'missionPreview',
];

export const LANDING_AB_BRAND_LINE_KEYS: Readonly<Record<LandingAbVariant, MessageKey>> = {
  a: PLATFORM_POSITIONING_KEYS.headline,
  b: 'landing.ab.variantB.headline',
};

export const LANDING_AB_CTA_KEYS: Readonly<Record<LandingAbVariant, MessageKey>> = {
  a: PLATFORM_POSITIONING_KEYS.cta,
  b: 'landing.ab.variantB.cta',
};

export function parseLandingAbVariant(
  search: URLSearchParams | Record<string, string | undefined> | string,
): LandingAbVariant {
  const params =
    typeof search === 'string'
      ? new URLSearchParams(search)
      : search instanceof URLSearchParams
        ? search
        : new URLSearchParams(
            Object.entries(search)
              .filter((entry): entry is [string, string] => Boolean(entry[1]))
              .map(([key, value]) => [key, value]),
          );

  const variant = params.get(LANDING_AB_QUERY_KEY);
  return variant === 'b' ? 'b' : 'a';
}

export function resolveLandingAbIaFoldOrder(
  variant: LandingAbVariant,
): readonly LandingAbIaFoldSectionId[] {
  return variant === 'b' ? LANDING_AB_IA_FOLD_ORDER_B : LANDING_AB_IA_FOLD_ORDER_A;
}

export function resolveLandingAbBrandLineKey(variant: LandingAbVariant): MessageKey {
  return LANDING_AB_BRAND_LINE_KEYS[variant];
}

export function resolveLandingAbCtaKey(variant: LandingAbVariant): MessageKey {
  return LANDING_AB_CTA_KEYS[variant];
}
