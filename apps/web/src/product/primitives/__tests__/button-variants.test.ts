import { describe, expect, it } from 'vitest';

import {
  DS_TOUCH_TARGET_HEIGHT_CLASS,
  DS_TOUCH_TARGET_MIN_HEIGHT_CLASS,
} from '@/domain/touch-target-display-contract';
import { buttonVariants } from '@/product/primitives/button';

describe('buttonVariants', () => {
  it('defaults to primary md with touch-target token height', () => {
    const classes = buttonVariants();
    expect(classes).toContain('bg-accent');
    expect(classes).toContain(DS_TOUCH_TARGET_HEIGHT_CLASS);
    expect(classes).toContain(DS_TOUCH_TARGET_MIN_HEIGHT_CLASS);
  });

  it('supports bet variant for casino CTA with touch-target token height', () => {
    const classes = buttonVariants({ variant: 'bet', size: 'lg' });
    expect(classes).toContain('bg-bet');
    expect(classes).toContain(DS_TOUCH_TARGET_HEIGHT_CLASS);
    expect(classes).toContain(DS_TOUCH_TARGET_MIN_HEIGHT_CLASS);
  });

  it('uses motion-press token for press transition', () => {
    const classes = buttonVariants({ variant: 'outline' });
    expect(classes).toContain('duration-(--ds-motion-press)');
    expect(classes).toContain('active:scale-[0.98]');
  });
});
