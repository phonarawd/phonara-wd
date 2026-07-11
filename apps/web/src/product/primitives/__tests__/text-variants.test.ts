import { describe, expect, it } from 'vitest';

import { textVariants } from '@/product/primitives/text';

const VARIANTS = [
  'display',
  'hero',
  'headline',
  'title',
  'section',
  'body',
  'caption',
  'label',
  'tiny',
  'money-mono',
] as const;

describe('textVariants (§34.6)', () => {
  it('defaults to body', () => {
    const classes = textVariants();
    expect(classes).toContain('text-base');
  });

  it.each(VARIANTS)('emits classes for %s', (variant) => {
    const classes = textVariants({ variant });
    expect(classes.length).toBeGreaterThan(0);
    if (variant === 'money-mono') {
      expect(classes).toContain('font-mono');
      expect(classes).toContain('tabular-nums');
    }
    if (variant === 'display' || variant === 'hero' || variant === 'headline') {
      expect(classes).toContain('font-display');
    }
    if (variant === 'tiny') {
      expect(classes).toContain('text-tiny');
      expect(classes).not.toContain('text-xs');
    }
  });
});
