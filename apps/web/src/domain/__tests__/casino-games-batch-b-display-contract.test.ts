import { describe, expect, it } from 'vitest';

import {
  assertCasinoGamesBatchBContractSync,
  CASINO_BATCH_B_GAME_CODES,
  CASINO_BATCH_B_L1_SPECS,
  CASINO_MINES_CASHOUT_HELP_KEY,
  CASINO_MINES_GRID_SIZE,
  formatHiloRank,
  isCasinoBatchBGame,
  P10_GAMES_BATCH_B_PREREQUISITE_TODOS,
  P10_GAMES_BATCH_B_TODO,
  parseHiloOutcome,
  parseMinesOutcome,
} from '../casino-games-batch-b-display-contract';

describe('casino-games-batch-b-display-contract (p10-games-batch-b)', () => {
  it('locks owner todo, prerequisites, and mines·hilo L1 specs', () => {
    assertCasinoGamesBatchBContractSync();
    expect(P10_GAMES_BATCH_B_TODO).toBe('p10-games-batch-b');
    expect(P10_GAMES_BATCH_B_PREREQUISITE_TODOS).toContain('p10-casino-replay-and-infra');
    expect(P10_GAMES_BATCH_B_PREREQUISITE_TODOS).toContain('p10-games-batch-a');
    expect(CASINO_BATCH_B_GAME_CODES).toEqual(['mines', 'hilo']);
    expect(isCasinoBatchBGame('mines')).toBe(true);
    expect(isCasinoBatchBGame('crash')).toBe(false);
    expect(CASINO_MINES_GRID_SIZE).toBe(25);
    expect(CASINO_BATCH_B_L1_SPECS.mines.touchMinPx).toBeGreaterThanOrEqual(48);
    expect(CASINO_BATCH_B_L1_SPECS.hilo.forbidden).toMatch(/live betting/i);
    expect(CASINO_MINES_CASHOUT_HELP_KEY).toBe('casino.help.minesCashoutBeforeBet');
  });

  it('parses RPC outcomes without inventing settlement fields', () => {
    expect(parseMinesOutcome({ minePositions: [1, 2, 3], hitMine: false })).toEqual({
      minePositions: [1, 2, 3],
      hitMine: false,
    });
    expect(parseMinesOutcome({ minePositions: [99], hitMine: true })).toBeNull();
    expect(parseMinesOutcome({ minePositions: [0], hitMine: 'yes' })).toBeNull();
  });

  it('parses the E23 live/progressive revealedCells echo when present, and degrades to absent (not a parse failure) when malformed (phase1c-mines)', () => {
    // rpc_progressive_step/cashout shape — one-shot rpc_place_game_bet responses
    // never carry this field (engine MinesResult has no revealedCells).
    expect(
      parseMinesOutcome({ minePositions: [4, 8], hitMine: true, revealedCells: [1, 4] }),
    ).toEqual({
      minePositions: [4, 8],
      hitMine: true,
      revealedCells: [1, 4],
    });
    expect(parseMinesOutcome({ minePositions: [4, 8], hitMine: false })).toEqual({
      minePositions: [4, 8],
      hitMine: false,
    });
    expect(
      parseMinesOutcome({ minePositions: [4, 8], hitMine: false })?.revealedCells,
    ).toBeUndefined();
    // Out-of-range/garbage revealedCells — degrade gracefully, core fields still parse.
    expect(
      parseMinesOutcome({ minePositions: [4, 8], hitMine: false, revealedCells: [99] }),
    ).toEqual({ minePositions: [4, 8], hitMine: false });
    expect(
      parseMinesOutcome({ minePositions: [4, 8], hitMine: false, revealedCells: 'nope' }),
    ).toEqual({ minePositions: [4, 8], hitMine: false });
    expect(
      parseHiloOutcome({
        cards: [7, 9],
        rounds: [{ card: 7, guess: 'higher', correct: true, multiplier: 1.5 }],
        won: true,
      }),
    ).toEqual({
      cards: [7, 9],
      rounds: [{ card: 7, guess: 'higher', correct: true, multiplier: 1.5 }],
      won: true,
    });
    expect(parseHiloOutcome({ cards: [7], rounds: [], won: true })).toEqual({
      cards: [7],
      rounds: [],
      won: true,
    });
    expect(parseHiloOutcome({ cards: [0], rounds: [], won: false })).toBeNull();
  });

  it('formats card ranks for display', () => {
    expect(formatHiloRank(1)).toBe('A');
    expect(formatHiloRank(10)).toBe('10');
    expect(formatHiloRank(11)).toBe('J');
    expect(formatHiloRank(12)).toBe('Q');
    expect(formatHiloRank(13)).toBe('K');
  });
});
