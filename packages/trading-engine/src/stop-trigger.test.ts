import { describe, expect, it } from 'vitest';
import { isStopTriggered } from './stop-trigger';

describe('isStopTriggered', () => {
  it('long stop loss', () => {
    expect(
      isStopTriggered({ side: 'long', markPrice: '99', stopLoss: '100', takeProfit: null }),
    ).toBe(true);
  });

  it('long take profit', () => {
    expect(
      isStopTriggered({ side: 'long', markPrice: '110', stopLoss: null, takeProfit: '105' }),
    ).toBe(true);
  });

  it('short stop loss', () => {
    expect(
      isStopTriggered({ side: 'short', markPrice: '105', stopLoss: '104', takeProfit: null }),
    ).toBe(true);
  });
});
