import { describe, expect, it } from 'vitest';

import { buttonVariants } from '@/product/primitives/button';

describe('buttonVariants', () => {
  it('defaults to primary md', () => {
    const classes = buttonVariants();
    expect(classes).toContain('bg-accent');
    expect(classes).toContain('h-11');
  });

  it('supports bet variant for casino CTA', () => {
    const classes = buttonVariants({ variant: 'bet', size: 'lg' });
    expect(classes).toContain('bg-bet');
    expect(classes).toContain('h-12');
  });

  it('uses motion-press token for press transition', () => {
    const classes = buttonVariants({ variant: 'outline' });
    expect(classes).toContain('duration-(--ds-motion-press)');
    expect(classes).toContain('active:scale-[0.98]');
  });
});
