import { describe, expect, it } from 'vitest';

import {
  assertCasinoGamesBatchCContractSync,
  CASINO_BATCH_C_GAME_CODES,
  CASINO_BATCH_C_L1_SPECS,
  CASINO_MOMENTUM_CASHOUT_HELP_KEY,
  CASINO_PIXI_VIEWPORTS,
  goldRushMeterFill,
  isCasinoBatchCGame,
  normalizePlinkoRisk,
  normalizePlinkoRows,
  P10_GAMES_BATCH_C_PREREQUISITE_TODOS,
  P10_GAMES_BATCH_C_TODO,
  parseGoldRushOutcome,
  parseMintReelsOutcome,
  parseMomentumOutcome,
  parsePlinkoOutcome,
  plinkoPathStepMs,
} from '../casino-games-batch-c-display-contract';

describe('casino-games-batch-c-display-contract (p10-games-batch-c)', () => {
  it('locks owner todo, prerequisites, and Pixi L1 specs', () => {
    assertCasinoGamesBatchCContractSync();
    expect(P10_GAMES_BATCH_C_TODO).toBe('p10-games-batch-c');
    expect(P10_GAMES_BATCH_C_PREREQUISITE_TODOS).toContain('p10-casino-replay-and-infra');
    expect(P10_GAMES_BATCH_C_PREREQUISITE_TODOS).toContain('p10-games-batch-a');
    expect(P10_GAMES_BATCH_C_PREREQUISITE_TODOS).toContain('p10-games-batch-b');
    expect(CASINO_BATCH_C_GAME_CODES).toEqual([
      'plinko',
      'mint_reels',
      'gold_rush',
      'momentum',
    ]);
    expect(isCasinoBatchCGame('plinko')).toBe(true);
    expect(isCasinoBatchCGame('mines')).toBe(false);
    expect(CASINO_BATCH_C_L1_SPECS.plinko.render).toBe('pixi_v8_webgl');
    expect(CASINO_BATCH_C_L1_SPECS.momentum.forbidden).toMatch(/fake mid-state/i);
    expect(CASINO_MOMENTUM_CASHOUT_HELP_KEY).toBe('casino.help.momentumCashoutBeforeBet');
    expect(CASINO_PIXI_VIEWPORTS).toEqual({ mobile: 390, desktop: 1024 });
  });

  it('parses RPC outcomes without inventing settlement fields', () => {
    expect(
      parsePlinkoOutcome({ path: [1, 0, 1], bucket: 2, bucketMultiplier: '3.0' }),
    ).toEqual({
      path: [1, 0, 1],
      bucket: 2,
      bucketMultiplier: '3.0',
    });
    expect(parsePlinkoOutcome({ path: [1], bucket: 0, bucketMultiplier: '1' })).toBeNull();
    expect(parseMintReelsOutcome({ totalMultiplier: 1.5 })).toEqual({ totalMultiplier: 1.5 });
    expect(parseMintReelsOutcome({ totalMultiplier: -1 })).toBeNull();
    expect(parseGoldRushOutcome({ totalMultiplier: 0 })).toEqual({ totalMultiplier: 0 });
    expect(
      parseMomentumOutcome({
        won: false,
        roll: 10,
        comboBefore: 2,
        comboAfter: 0,
        comboMultiplier: 0,
        cashedOut: false,
        totalMultiplier: 0,
      }),
    ).toMatchObject({ won: false, comboAfter: 0 });
    expect(
      parseMomentumOutcome({
        won: true,
        roll: 0,
        comboBefore: 3,
        comboAfter: 0,
        comboMultiplier: 4,
        cashedOut: true,
        totalMultiplier: 3.96,
      }),
    ).toMatchObject({ cashedOut: true, totalMultiplier: 3.96 });
  });

  it('normalizes plinko selection and timing helpers', () => {
    expect(normalizePlinkoRows(16)).toBe(16);
    expect(normalizePlinkoRows('bad')).toBe(12);
    expect(normalizePlinkoRisk('high')).toBe('high');
    expect(normalizePlinkoRisk('x')).toBe('medium');
    expect(plinkoPathStepMs(8)).toBeGreaterThanOrEqual(45);
    expect(goldRushMeterFill(0)).toBe(0);
    expect(goldRushMeterFill(80)).toBeLessThanOrEqual(1);
  });
});
