import { describe, expect, it } from 'vitest';
import { resetAccumulatedSelection } from './reset-accumulated-selection';

describe('resetAccumulatedSelection', () => {
  it('clears mines revealedCells while preserving mineCount', () => {
    const prev = { mineCount: 5, revealedCells: [0, 1, 2, 3] };
    expect(resetAccumulatedSelection('mines', prev)).toEqual({ mineCount: 5, revealedCells: [] });
  });

  it('clears hilo guesses and startCard', () => {
    const prev = { startCard: 13, guesses: ['higher', 'lower'] };
    expect(resetAccumulatedSelection('hilo', prev)).toEqual({ startCard: null, guesses: [] });
  });

  it('returns prev unchanged for other games', () => {
    const prev = { target: '2.00' };
    expect(resetAccumulatedSelection('limbo', prev)).toBe(prev);
  });
});
