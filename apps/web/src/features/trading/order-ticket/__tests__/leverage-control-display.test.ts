import { describe, expect, it } from 'vitest';

import {
  buildVisibleLeverageChips,
  clampLeverageInt,
  clampLeverageString,
  isLeverageChipActive,
  isMaxLeverageChipActive,
  parseLeverageInt,
} from '../leverage-control-display';

describe('leverage-control-display', () => {
  it('clamps leverage to market max_leverage floor 1', () => {
    expect(clampLeverageInt(50, 20)).toBe(20);
    expect(clampLeverageInt(0, 20)).toBe(1);
    expect(clampLeverageString('150', 100)).toBe('100');
  });

  it('filters preset chips above RPC max', () => {
    expect(buildVisibleLeverageChips(10)).toEqual([1, 5, 10]);
    expect(buildVisibleLeverageChips(3)).toEqual([1]);
    expect(buildVisibleLeverageChips(100)).toEqual([1, 5, 10, 20]);
  });

  it('highlights max chip when leverage equals market cap', () => {
    expect(isMaxLeverageChipActive('20', 20)).toBe(true);
    expect(isMaxLeverageChipActive('10', 20)).toBe(false);
    expect(isLeverageChipActive('5', 5)).toBe(true);
  });

  it('parses numeric leverage strings safely', () => {
    expect(parseLeverageInt('10x')).toBe(10);
    expect(parseLeverageInt('')).toBe(1);
    expect(parseLeverageInt('abc')).toBe(1);
  });
});
