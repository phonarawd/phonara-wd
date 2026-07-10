import { describe, expect, it } from 'vitest';
import { dominantRamConsumer } from '../../scripts/lib/dominant-ram-consumer';

describe('dominant-ram-consumer (boundary fixtures)', () => {
  it.each([
    { cursorMb: 2374, claudeMb: 1170, expected: 'cursor' as const, note: 'operator measurement' },
    { cursorMb: 1200, claudeMb: 1000, expected: 'mixed' as const, note: '1.2x ambiguous band' },
    { cursorMb: 1000, claudeMb: 999, expected: 'mixed' as const, note: 'floating boundary' },
    { cursorMb: 800, claudeMb: 800, expected: 'mixed' as const, note: 'tie at DOMINANT_MIN' },
    { cursorMb: 800, claudeMb: 1067, expected: 'claude' as const, note: '800/1067 regression' },
    { cursorMb: 400, claudeMb: 400, expected: 'none' as const, note: 'below DOMINANT_MIN' },
    { cursorMb: 400, claudeMb: 800, expected: 'claude' as const, note: 'fallback band' },
    { cursorMb: 2000, claudeMb: 400, expected: 'cursor' as const, note: 'cursor dominates' },
  ])('$note → $expected ($cursorMb vs $claudeMb)', ({ cursorMb, claudeMb, expected }) => {
    expect(dominantRamConsumer(cursorMb, claudeMb)).toBe(expected);
  });
});
