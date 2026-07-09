import { describe, expect, it } from 'vitest';

import { cn } from '@/product/primitives/lib/cn';

describe('cn', () => {
  it('merges tailwind classes with last-wins semantics', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional fragments', () => {
    const shouldHide = false;
    expect(cn('text-sm', shouldHide && 'hidden', 'font-medium')).toBe('text-sm font-medium');
  });
});
