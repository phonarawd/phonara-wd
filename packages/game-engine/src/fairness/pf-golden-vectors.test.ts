/**
 * PIR P2 — pin 12-game PF boundary floats + SQL seed results in vitest.
 * Authority: SQL `_game_float_stream` / `_game_result` (casino_parity_test.sql).
 */

import { describe, expect, it } from 'vitest';
import { floatStream } from './float';
import {
  assertPfGoldenCoverageComplete,
  PF_BOUNDARY_FORMULA_VECTORS,
  PF_FLOAT_HALF,
  PF_FLOAT_MAX,
  PF_FLOAT_MIN,
  PF_GOLDEN_SEED,
  PF_GOLDEN_SEED_FLOATS,
  PF_SEED_RESULT_VECTORS,
  pfGoldenBoundaryCoverage,
  pfGoldenSeedCoverage,
} from './pf-golden-vectors';
import { GAME_CODES, getGame } from '../registry';
import { diceFromFloat } from '../games/dice';
import { crashFromFloat } from '../games/crash';
import { limboFromFloat } from '../games/limbo';
import { caveInProb } from '../games/deepshaft';
import { rouletteWinningNumber } from '../games/roulette';
import { reelStopFromFloat } from '../lib/slot-engine';

// Side-effect: register all 12 games
import '../index';

function hiloCardFromFloat(f: number): number {
  return Math.floor(f * 13) + 1;
}

function plinkoDir(f: number): number {
  return f < PF_FLOAT_HALF ? 0 : 1;
}

function minesShuffleJ(f: number, n: number): number {
  return Math.floor(f * n);
}

function evalBoundary(
  kind: (typeof PF_BOUNDARY_FORMULA_VECTORS)[number]['kind'],
  f: number,
): number | boolean {
  switch (kind) {
    case 'dice_roll':
    case 'momentum_roll':
      return diceFromFloat(f);
    case 'crash_mult':
      return crashFromFloat(f);
    case 'limbo_mult':
      return limboFromFloat(f);
    case 'plinko_dir':
      return plinkoDir(f);
    case 'hilo_card':
      return hiloCardFromFloat(f);
    case 'roulette_pocket':
      return rouletteWinningNumber([f]);
    case 'mines_shuffle_j':
    case 'blackjack_shuffle_j':
      return minesShuffleJ(f, 25);
    case 'deepshaft_cavein':
      return f < caveInProb('standard', 1);
    case 'slot_stop':
      return reelStopFromFloat(2, f);
    default: {
      const _exhaustive: never = kind;
      throw new Error(`unknown boundary kind: ${_exhaustive}`);
    }
  }
}

describe('PF golden vectors (SQL authority)', () => {
  it('covers all 12 GAME_CODES in seed + boundary fixtures', () => {
    assertPfGoldenCoverageComplete();
    expect(pfGoldenSeedCoverage().sort()).toEqual([...GAME_CODES].sort());
    expect(pfGoldenBoundaryCoverage().sort()).toEqual([...GAME_CODES].sort());
  });

  it('pins floatStream first-8 for SQL parity seed triple', async () => {
    const floats = await floatStream(
      PF_GOLDEN_SEED.serverSeed,
      PF_GOLDEN_SEED.clientSeed,
      PF_GOLDEN_SEED.nonce,
      8,
    );
    expect(floats).toHaveLength(8);
    for (let i = 0; i < 8; i += 1) {
      expect(floats[i]).toBe(PF_GOLDEN_SEED_FLOATS[i]);
    }
    expect(floats[0]).toBeGreaterThanOrEqual(PF_FLOAT_MIN);
    expect(floats[0]).toBeLessThan(1);
    expect(PF_FLOAT_MAX).toBeLessThan(1);
  });

  it('pins SQL seed _game_result shapes for every vector', async () => {
    for (const vector of PF_SEED_RESULT_VECTORS) {
      const definition = getGame(vector.game);
      const floats = await floatStream(
        PF_GOLDEN_SEED.serverSeed,
        PF_GOLDEN_SEED.clientSeed,
        PF_GOLDEN_SEED.nonce,
        definition.floatCount,
      );
      const result = definition.resultFromFloats(floats, vector.selection);
      expect(result, `${vector.game} seed result`).toEqual(vector.result);
    }
  });

  it('pins float→outcome boundary formulas for all 12 games', () => {
    for (const vector of PF_BOUNDARY_FORMULA_VECTORS) {
      const actual = evalBoundary(vector.kind, vector.f);
      expect(actual, `${vector.kind} @ f=${vector.f} (${vector.note})`).toBe(vector.expected);
      for (const game of vector.games) {
        expect(GAME_CODES.includes(game), `game ${game} registered`).toBe(true);
      }
    }
  });
});
