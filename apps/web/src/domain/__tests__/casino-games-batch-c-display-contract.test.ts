import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertCasinoGamesBatchCContractSync,
  CASINO_BATCH_C_GAME_CODES,
  CASINO_BATCH_C_L1_SPECS,
  CASINO_BATCH_C_STAGE_PATHS,
  CASINO_MOMENTUM_CASHOUT_HELP_KEY,
  CASINO_PIXI_VIEWPORTS,
  goldRushMeterEase,
  goldRushMeterFill,
  goldRushMeterMs,
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
  mintReelsSpinEase,
  mintReelsSpinMs,
  momentumComboEase,
  momentumComboMs,
  momentumComboResetEase,
} from '../casino-games-batch-c-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('casino-games-batch-c-display-contract (p10-games-batch-c)', () => {
  it('locks owner todo, prerequisites, and Pixi L1 specs', () => {
    assertCasinoGamesBatchCContractSync();
    expect(P10_GAMES_BATCH_C_TODO).toBe('p10-games-batch-c');
    expect(P10_GAMES_BATCH_C_PREREQUISITE_TODOS).toContain('p10-casino-replay-and-infra');
    expect(P10_GAMES_BATCH_C_PREREQUISITE_TODOS).toContain('p10-games-batch-a');
    expect(P10_GAMES_BATCH_C_PREREQUISITE_TODOS).toContain('p10-games-batch-b');
    expect(CASINO_BATCH_C_GAME_CODES).toEqual(['plinko', 'mint_reels', 'gold_rush', 'momentum']);
    expect(isCasinoBatchCGame('plinko')).toBe(true);
    expect(isCasinoBatchCGame('mines')).toBe(false);
    expect(CASINO_BATCH_C_L1_SPECS.plinko.render).toBe('pixi_v8_webgl');
    expect(CASINO_BATCH_C_L1_SPECS.momentum.forbidden).toMatch(/fake mid-state/i);
    expect(CASINO_MOMENTUM_CASHOUT_HELP_KEY).toBe('casino.help.momentumCashoutBeforeBet');
    expect(CASINO_PIXI_VIEWPORTS).toEqual({ mobile: 390, desktop: 1024 });
  });

  it('parses RPC outcomes without inventing settlement fields', () => {
    expect(parsePlinkoOutcome({ path: [1, 0, 1], bucket: 2, bucketMultiplier: '3.0' })).toEqual({
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

  it('mint reels spin stays in 800–1200ms band and decelerates (phase1d-mint-reels)', () => {
    expect(mintReelsSpinMs()).toBeGreaterThanOrEqual(800);
    expect(mintReelsSpinMs()).toBeLessThanOrEqual(1200);
    expect(mintReelsSpinEase(0)).toBe(0);
    expect(mintReelsSpinEase(1)).toBe(1);
    const earlyDelta = mintReelsSpinEase(0.4) - mintReelsSpinEase(0.1);
    const lateDelta = mintReelsSpinEase(0.9) - mintReelsSpinEase(0.6);
    expect(earlyDelta).toBeGreaterThan(lateDelta);
  });

  it('gold rush meter stays in 800–1200ms band and decelerates (phase1d-gold-rush)', () => {
    expect(goldRushMeterMs()).toBeGreaterThanOrEqual(800);
    expect(goldRushMeterMs()).toBeLessThanOrEqual(1200);
    expect(goldRushMeterEase(0)).toBe(0);
    expect(goldRushMeterEase(1)).toBe(1);
    const earlyDelta = goldRushMeterEase(0.4) - goldRushMeterEase(0.1);
    const lateDelta = goldRushMeterEase(0.9) - goldRushMeterEase(0.6);
    expect(earlyDelta).toBeGreaterThan(lateDelta);
  });

  it('momentum combo stays in 800–1200ms band with escalate/reset eases (phase1d-momentum)', () => {
    expect(momentumComboMs()).toBeGreaterThanOrEqual(800);
    expect(momentumComboMs()).toBeLessThanOrEqual(1200);
    expect(momentumComboEase(0)).toBe(0);
    expect(momentumComboEase(1)).toBe(1);
    const buildEarly = momentumComboEase(0.4) - momentumComboEase(0.1);
    const buildLate = momentumComboEase(0.9) - momentumComboEase(0.6);
    expect(buildLate).toBeGreaterThan(buildEarly);
    expect(momentumComboResetEase(0)).toBe(0);
    expect(momentumComboResetEase(1)).toBe(1);
    const resetEarly = momentumComboResetEase(0.4) - momentumComboResetEase(0.1);
    const resetLate = momentumComboResetEase(0.9) - momentumComboResetEase(0.6);
    expect(resetEarly).toBeGreaterThan(resetLate);
  });

  it('pins Application-first Pixi disposal (phase1d-0) — no premature scene.root.destroy', () => {
    const hook = readRepo('apps/web/src/product/surfaces/games/use-pixi-stage.ts');
    expect(hook).toContain('textureSource: true');
    expect(hook).toContain('context: true');
    // Teardown return body only — avoid matching the early-init disposed abort path.
    const teardownMarker = 'Application-first: texture/context flags must reach the live scene subtree';
    const teardownIdx = hook.indexOf(teardownMarker);
    expect(teardownIdx).toBeGreaterThan(-1);
    const teardownTail = hook.slice(teardownIdx);
    const appDestroyIdx = teardownTail.indexOf('destroyApplication(app)');
    const controllerDestroyIdx = teardownTail.indexOf('controller?.destroy?.()');
    expect(appDestroyIdx).toBeGreaterThan(-1);
    expect(controllerDestroyIdx).toBeGreaterThan(-1);
    expect(appDestroyIdx).toBeLessThan(controllerDestroyIdx);

    const batchCGameStages = [
      'apps/web/src/product/surfaces/games/plinko-stage.tsx',
      'apps/web/src/product/surfaces/games/mint-reels-stage.tsx',
      'apps/web/src/product/surfaces/games/gold-rush-stage.tsx',
      'apps/web/src/product/surfaces/games/momentum-stage.tsx',
    ] as const;
    for (const rel of batchCGameStages) {
      expect(CASINO_BATCH_C_STAGE_PATHS).toContain(rel);
      const src = readRepo(rel);
      expect(src, rel).not.toMatch(/scene\.root\.destroy\s*\(/);
    }
  });
});
