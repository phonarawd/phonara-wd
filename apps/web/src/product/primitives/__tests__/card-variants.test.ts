import { describe, expect, it } from 'vitest';

import { cardVariants } from '@/product/primitives/card';

const VARIANTS = [
  'default',
  'raised',
  'glass',
  'mission',
  'wallet-hero',
  'vip',
  'trade-dense',
  'sports-odds',
  'casino-play',
] as const;

describe('cardVariants (§34.7–34.8 · §34.17)', () => {
  it('defaults to flat default (no raise shadow)', () => {
    const classes = cardVariants();
    expect(classes).toContain('shadow-none');
    expect(classes).toContain('bg-surface');
  });

  it.each(VARIANTS)('emits classes for %s', (variant) => {
    const classes = cardVariants({ variant });
    expect(classes.length).toBeGreaterThan(0);
  });

  it('raised uses shadow-1 + surface-raised', () => {
    const classes = cardVariants({ variant: 'raised' });
    expect(classes).toContain('shadow-1');
    expect(classes).toContain('bg-surface-raised');
  });

  it('trade-dense stays line-first without raise', () => {
    const classes = cardVariants({ variant: 'trade-dense' });
    expect(classes).toContain('shadow-none');
  });

  it('sports-odds stays line-first for odds board rows', () => {
    const classes = cardVariants({ variant: 'sports-odds' });
    expect(classes).toContain('shadow-none');
    expect(classes).toContain('bg-surface');
  });

  it('casino-play floats with shadow-2 on hover', () => {
    const classes = cardVariants({ variant: 'casino-play' });
    expect(classes).toContain('hover:shadow-2');
    expect(classes).toContain('hover:-translate-y-0.5');
  });

  it('mission carries accent ring cue', () => {
    const classes = cardVariants({ variant: 'mission' });
    expect(classes).toContain('ring-accent/30');
  });

  it('vip uses tier ramp CSS variable border', () => {
    const classes = cardVariants({ variant: 'vip' });
    expect(classes).toContain('--ds-card-tier');
  });

  it('wallet-hero keeps aurora edge ring', () => {
    const classes = cardVariants({ variant: 'wallet-hero' });
    expect(classes).toContain('ring-accent/25');
  });
});
