import { describe, expect, it } from 'vitest';
import { money } from '@phonara/money';
import { previewComboPayout, previewSinglePayout } from './payout-preview';

describe('previewSinglePayout (display-only — SQL settlement is authoritative)', () => {
  it('multiplies stake by decimal odds with PHON truncation', () => {
    const payout = previewSinglePayout('100.000000', 'PHON', '2.000000');
    expect(payout).toEqual({ currency: 'PHON', amount: '200.000000' });
  });

  it('truncates PHON payout via @phonara/money (display hint — SQL trunc is authoritative)', () => {
    const payout = previewSinglePayout('10.000000', 'PHON', '1.333333');
    expect(payout.amount).toBe('13.333330');
  });

  it('supports USDT preview amounts', () => {
    const payout = previewSinglePayout('25.500000', 'USDT', '1.900000');
    expect(payout).toEqual({ currency: 'USDT', amount: '48.450000' });
  });
});

describe('previewComboPayout (display-only — SQL settlement is authoritative)', () => {
  it('combines leg odds then multiplies stake', () => {
    const stake = money('100.000000', 'PHON');
    const payout = previewComboPayout(stake, [
      { outcomeId: 'o1', odds: '2.000000', fixtureId: 'f1' },
      { outcomeId: 'o2', odds: '1.500000', fixtureId: 'f2' },
    ]);
    expect(payout).toEqual({ currency: 'PHON', amount: '300.000000' });
  });

  it('multiplies supplied leg odds only (void/push legs are settled in SQL, not here)', () => {
    const stake = money('50.000000', 'PHON');
    const payout = previewComboPayout(stake, [
      { outcomeId: 'o1', odds: '2.000000', fixtureId: 'f1' },
    ]);
    expect(payout.amount).toBe('100.000000');
  });
});
