import { describe, expect, it } from 'vitest';

import {
  assertCasinoGamesBatchAContractSync,
  CASINO_BATCH_A_GAME_CODES,
  CASINO_BATCH_A_L1_SPECS,
  CASINO_CRASH_AUTOCASHOUT_HELP_KEY,
  crashReplayDurationMs,
  isCasinoBatchAGame,
  P10_GAMES_BATCH_A_PREREQUISITE_TODOS,
  P10_GAMES_BATCH_A_TODO,
  parseCrashOutcome,
  parseDiceOutcome,
  parseLimboOutcome,
} from '../casino-games-batch-a-display-contract';

describe('casino-games-batch-a-display-contract (p10-games-batch-a)', () => {
  it('locks owner todo, prerequisite, and crash·limbo·dice L1 specs', () => {
    assertCasinoGamesBatchAContractSync();
    expect(P10_GAMES_BATCH_A_TODO).toBe('p10-games-batch-a');
    expect(P10_GAMES_BATCH_A_PREREQUISITE_TODOS).toContain('p10-casino-replay-and-infra');
    expect(CASINO_BATCH_A_GAME_CODES).toEqual(['crash', 'limbo', 'dice']);
    expect(isCasinoBatchAGame('crash')).toBe(true);
    expect(isCasinoBatchAGame('mines')).toBe(false);
    expect(CASINO_BATCH_A_L1_SPECS.crash.forbidden).toMatch(/cash-out/i);
    expect(CASINO_CRASH_AUTOCASHOUT_HELP_KEY).toBe('casino.help.autoCashoutBeforeBet');
  });

  it('parses RPC outcomes without inventing settlement fields', () => {
    expect(
      parseCrashOutcome({
        crashMultiplier: 3.5,
        cashedOut: false,
        cashoutMultiplier: 0,
      }),
    ).toEqual({ crashMultiplier: 3.5, cashedOut: false, cashoutMultiplier: 0 });
    expect(parseCrashOutcome({ crashMultiplier: 0.5 })).toBeNull();
    expect(parseLimboOutcome({ resultMultiplier: '2.10', won: true })).toEqual({
      resultMultiplier: 2.1,
      won: true,
    });
    expect(parseDiceOutcome({ roll: 99.99, won: true })?.roll).toBe(99.99);
    expect(parseDiceOutcome({ roll: 100 })).toBeNull();
  });

  it('clamps crash replay duration to 1.5–4s', () => {
    expect(crashReplayDurationMs(1.01)).toBeGreaterThanOrEqual(1500);
    expect(crashReplayDurationMs(1.01)).toBeLessThanOrEqual(4000);
    expect(crashReplayDurationMs(1000)).toBe(4000);
  });
});
