import { describe, expect, it } from 'vitest';

import { cn } from '@/product/primitives/lib/cn';

/**
 * Regression: panel used to pass `className="min-h-0"` into TradeChart host.
 * twMerge drops `min-h-[280px]` when `min-h-0` wins → blank/collapsed canvas.
 */
describe('trade chart host class merge', () => {
  it('keeps min-h-[280px] when no conflicting override is passed', () => {
    expect(cn('h-full min-h-[280px] w-full flex-1')).toContain('min-h-[280px]');
  });

  it('documents that min-h-0 would destroy the chart host floor', () => {
    expect(cn('min-h-[280px] w-full flex-1', 'min-h-0')).not.toContain('min-h-[280px]');
    expect(cn('min-h-[280px] w-full flex-1', 'min-h-0')).toContain('min-h-0');
  });
});
