import { z } from 'zod';
import { registerGame, type GameDefinition } from '../registry';
import { quantize6 } from '../lib/quantize';
import { diceFromFloat } from './dice';
import { requireFloat } from '../lib/require-float';

export const MOMENTUM_MAX_COMBO = 15;

/** Win if roll >= threshold — p=0.48 at 52.00 (1% edge via combo table + floor payout). */
export const MOMENTUM_WIN_THRESHOLD = 52;

export interface MomentumSelection {
  comboBefore: number;
  cashOut: boolean;
}

export interface MomentumResult {
  won: boolean;
  roll: number;
  comboBefore: number;
  comboAfter: number;
  comboMultiplier: number;
  cashedOut: boolean;
  totalMultiplier: number;
}

export function momentumWinProbability(threshold: number = MOMENTUM_WIN_THRESHOLD): number {
  const targetCents = Math.floor(threshold * 100);
  return (10000 - targetCents) / 10000;
}

/** E[total stakes] from combo 0 until cash-out at targetCombo (play + cash-out bets, with resets). */
export function expectedStakesToCashOut(winProb: number, targetCombo: number): number {
  const p = winProb;
  let a = 1;
  let b = 0;
  for (let combo = targetCombo - 1; combo >= 0; combo -= 1) {
    const nextA = 1 + p * a;
    const nextB = p * b + (1 - p);
    a = nextA;
    b = nextB;
  }
  return a / (1 - b);
}

/** Raw combo multiplier = expected stake cost to reach this combo (before 99/100 edge). */
export function comboRawMultiplier(comboIndex: number): number {
  if (comboIndex < 1 || comboIndex > MOMENTUM_MAX_COMBO) return 0;
  const expectedStakes = expectedStakesToCashOut(momentumWinProbability(), comboIndex);
  return Math.floor(expectedStakes * 100) / 100;
}

/** Precomputed combo table — mirrors SQL `_momentum_combo_mult`. */
export const COMBO_MULT: readonly number[] = Array.from(
  { length: MOMENTUM_MAX_COMBO + 1 },
  (_, i) => comboRawMultiplier(i),
);

export function comboPayoutMultiplier(comboIndex: number): number {
  const raw = COMBO_MULT[comboIndex] ?? 0;
  return Math.floor(raw * 99) / 100;
}

export function evaluateMomentum(floats: number[], selection: MomentumSelection): MomentumResult {
  const { comboBefore, cashOut } = selection;
  if (comboBefore < 0 || comboBefore > MOMENTUM_MAX_COMBO) {
    throw new Error('invalid_momentum_combo');
  }

  if (cashOut) {
    if (comboBefore < 1) throw new Error('invalid_momentum_cashout');
    const comboMultiplier = COMBO_MULT[comboBefore] ?? 0;
    const totalMultiplier = comboPayoutMultiplier(comboBefore);
    return {
      won: true,
      roll: 0,
      comboBefore,
      comboAfter: 0,
      comboMultiplier,
      cashedOut: true,
      totalMultiplier,
    };
  }

  const f = requireFloat(floats, 0);
  const roll = diceFromFloat(f);
  const won = roll >= MOMENTUM_WIN_THRESHOLD;

  if (!won) {
    return {
      won: false,
      roll,
      comboBefore,
      comboAfter: 0,
      comboMultiplier: 0,
      cashedOut: false,
      totalMultiplier: 0,
    };
  }

  const comboAfter = Math.min(comboBefore + 1, MOMENTUM_MAX_COMBO);
  const comboMultiplier = COMBO_MULT[comboAfter] ?? 0;
  return {
    won: true,
    roll,
    comboBefore,
    comboAfter,
    comboMultiplier,
    cashedOut: false,
    totalMultiplier: 0,
  };
}

const momentumDefinition: GameDefinition<MomentumSelection, MomentumResult> = {
  code: 'momentum',
  betSchema: z.object({
    comboBefore: z.number().int().min(0).max(MOMENTUM_MAX_COMBO),
    cashOut: z.boolean(),
  }),
  floatCount: 1,

  resultFromFloats(floats, selection): MomentumResult {
    return evaluateMomentum(floats, selection);
  },

  settle(stake, _selection, result) {
    if (result.totalMultiplier <= 0) {
      return { payout: quantize6('0'), houseEdgeLeg: stake };
    }
    const payout = stake.mul(quantize6(result.totalMultiplier.toFixed(6)));
    return { payout, houseEdgeLeg: stake.minus(payout) };
  },

  maxPayoutMultiplier(selection) {
    const sel = selection ?? { comboBefore: 0, cashOut: false };
    if (!sel.cashOut) return 0;
    if (sel.comboBefore < 1 || sel.comboBefore > MOMENTUM_MAX_COMBO) return 0;
    return comboPayoutMultiplier(sel.comboBefore);
  },
};

registerGame(momentumDefinition);
export { momentumDefinition };
