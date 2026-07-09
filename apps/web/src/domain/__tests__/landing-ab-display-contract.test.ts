import { describe, expect, it } from 'vitest';

import {
  LANDING_AB_IA_FOLD_ORDER_A,
  LANDING_AB_IA_FOLD_ORDER_B,
  parseLandingAbVariant,
  resolveLandingAbBrandLineKey,
  resolveLandingAbCtaKey,
  resolveLandingAbIaFoldOrder,
} from '../landing-ab-display-contract';

describe('landing-ab-display-contract', () => {
  it('defaults to variant A when v query missing', () => {
    expect(parseLandingAbVariant({})).toBe('a');
    expect(parseLandingAbVariant('')).toBe('a');
  });

  it('parses variant B from v=b query', () => {
    expect(parseLandingAbVariant({ v: 'b' })).toBe('b');
    expect(parseLandingAbVariant('?v=b&utm_source=meta')).toBe('b');
  });

  it('swaps wallet before mission preview in variant B IA', () => {
    expect(resolveLandingAbIaFoldOrder('a')).toEqual(LANDING_AB_IA_FOLD_ORDER_A);
    expect(resolveLandingAbIaFoldOrder('b')).toEqual(LANDING_AB_IA_FOLD_ORDER_B);
    expect(LANDING_AB_IA_FOLD_ORDER_B.indexOf('walletPreview')).toBeLessThan(
      LANDING_AB_IA_FOLD_ORDER_B.indexOf('missionPreview'),
    );
  });

  it('resolves brandLine and CTA i18n keys per variant', () => {
    expect(resolveLandingAbBrandLineKey('a')).toBe('platform.positioning.headline');
    expect(resolveLandingAbBrandLineKey('b')).toBe('landing.ab.variantB.headline');
    expect(resolveLandingAbCtaKey('b')).toBe('landing.ab.variantB.cta');
  });
});
