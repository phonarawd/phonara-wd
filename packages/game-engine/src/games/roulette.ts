import { z } from 'zod';
import { Decimal } from '@phonara/money';
import { registerGame, type GameDefinition } from '../registry';
import { quantize6 } from '../lib/quantize';
import { requireFloat } from '../lib/require-float';

export type RouletteBetType =
  | 'straight'
  | 'split'
  | 'red'
  | 'black'
  | 'even'
  | 'odd'
  | 'low'
  | 'high'
  | 'dozen1'
  | 'dozen2'
  | 'dozen3'
  | 'column1'
  | 'column2'
  | 'column3';

export interface RouletteLeg {
  type: RouletteBetType;
  value: number | null;
  stakeWeight: number;
}

export interface RouletteSelection {
  bets: RouletteLeg[];
}

export interface RouletteLegResult {
  type: RouletteBetType;
  value: number | null;
  stakeWeight: number;
  won: boolean;
  multiplier: number;
}

export interface RouletteResult {
  winningNumber: number;
  totalMultiplier: number;
}

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

const DOZEN1 = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
const DOZEN2 = new Set([13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
const DOZEN3 = new Set([25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]);

const COLUMN1 = new Set([1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]);
const COLUMN2 = new Set([2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35]);
const COLUMN3 = new Set([3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36]);

/** Payout multipliers on leg stake (European single-zero). */
export const ROULETTE_LEG_MAX_MULT: Record<RouletteBetType, number> = {
  straight: 36,
  split: 18,
  red: 2,
  black: 2,
  even: 2,
  odd: 2,
  low: 2,
  high: 2,
  dozen1: 3,
  dozen2: 3,
  dozen3: 3,
  column1: 3,
  column2: 3,
  column3: 3,
};

export function rouletteWinningNumber(floats: number[]): number {
  return Math.floor(requireFloat(floats, 0) * 37);
}

function legWins(type: RouletteBetType, value: number | null, winning: number): boolean {
  if (winning === 0) {
    return type === 'straight' && value === 0;
  }
  switch (type) {
    case 'straight':
      return value === winning;
    case 'split':
      return value !== null && (value === winning || value + 1 === winning);
    case 'red':
      return RED_NUMBERS.has(winning);
    case 'black':
      return !RED_NUMBERS.has(winning);
    case 'even':
      return winning !== 0 && winning % 2 === 0;
    case 'odd':
      return winning % 2 === 1;
    case 'low':
      return winning >= 1 && winning <= 18;
    case 'high':
      return winning >= 19 && winning <= 36;
    case 'dozen1':
      return DOZEN1.has(winning);
    case 'dozen2':
      return DOZEN2.has(winning);
    case 'dozen3':
      return DOZEN3.has(winning);
    case 'column1':
      return COLUMN1.has(winning);
    case 'column2':
      return COLUMN2.has(winning);
    case 'column3':
      return COLUMN3.has(winning);
    default:
      return false;
  }
}

function stakeWeightDecimal(weight: number): Decimal {
  return new Decimal(String(weight));
}

function weightedAverageMultiplier(
  legs: Array<{ multiplier: number; stakeWeight: number }>,
): Decimal {
  const weightSum = legs.reduce(
    (sum, leg) => sum.plus(stakeWeightDecimal(leg.stakeWeight)),
    new Decimal(0),
  );
  if (weightSum.lte(0)) {
    throw new Error('invalid_roulette_bets');
  }
  return legs.reduce(
    (sum, leg) =>
      sum.plus(
        new Decimal(String(leg.multiplier)).mul(stakeWeightDecimal(leg.stakeWeight)).div(weightSum),
      ),
    new Decimal(0),
  );
}

export function evaluateRoulette(selection: RouletteSelection, winning: number): RouletteResult {
  const legs: RouletteLegResult[] = selection.bets.map((leg) => {
    const won = legWins(leg.type, leg.value, winning);
    const mult = won ? ROULETTE_LEG_MAX_MULT[leg.type] : 0;
    return {
      type: leg.type,
      value: leg.value,
      stakeWeight: leg.stakeWeight,
      won,
      multiplier: mult,
    };
  });

  const totalMultiplier = Number(weightedAverageMultiplier(legs).toFixed(6));
  return { winningNumber: winning, totalMultiplier };
}

export function rouletteMaxExposureMultiplier(selection: RouletteSelection): number {
  if (selection.bets.length === 0) return 0;
  try {
    return Number(
      weightedAverageMultiplier(
        selection.bets.map((leg) => ({
          multiplier: ROULETTE_LEG_MAX_MULT[leg.type],
          stakeWeight: leg.stakeWeight,
        })),
      ).toFixed(6),
    );
  } catch {
    return 0;
  }
}

const legSchema = z.object({
  type: z.enum([
    'straight',
    'split',
    'red',
    'black',
    'even',
    'odd',
    'low',
    'high',
    'dozen1',
    'dozen2',
    'dozen3',
    'column1',
    'column2',
    'column3',
  ]),
  value: z.number().int().min(0).max(36).nullable(),
  stakeWeight: z.number().positive(),
});

const rouletteDefinition: GameDefinition<RouletteSelection, RouletteResult> = {
  code: 'roulette',
  betSchema: z.object({
    bets: z.array(legSchema).min(1).max(20),
  }),
  floatCount: 1,

  resultFromFloats(floats, selection): RouletteResult {
    const winning = rouletteWinningNumber(floats);
    return evaluateRoulette(selection, winning);
  },

  settle(stake, _selection, result) {
    const payout = stake.mul(quantize6(result.totalMultiplier.toFixed(6)));
    return { payout, houseEdgeLeg: stake.minus(payout) };
  },

  theoreticalRtp() {
    return new Decimal((36 / 37).toFixed(6));
  },

  maxPayoutMultiplier(selection) {
    return rouletteMaxExposureMultiplier(selection);
  },
};

registerGame(rouletteDefinition);
export { rouletteDefinition };
