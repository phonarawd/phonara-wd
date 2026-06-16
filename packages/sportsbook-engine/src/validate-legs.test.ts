import { describe, expect, it } from 'vitest';
import { validateBetLegs } from './validate-legs';
import { SportsbookComboError } from './combo-odds';

describe('validateBetLegs', () => {
  it('rejects duplicate fixture in multi-leg parlay', () => {
    expect(() =>
      validateBetLegs([
        { outcomeId: 'o1', odds: '2.0', fixtureId: 'f1' },
        { outcomeId: 'o2', odds: '1.5', fixtureId: 'f1' },
      ]),
    ).toThrow(SportsbookComboError);
  });

  it('allows same fixture only for single leg', () => {
    expect(() =>
      validateBetLegs([{ outcomeId: 'o1', odds: '2.0', fixtureId: 'f1' }]),
    ).not.toThrow();
  });
});
