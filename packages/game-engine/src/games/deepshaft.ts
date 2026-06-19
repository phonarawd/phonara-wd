import { z } from 'zod';
import { Decimal } from '@phonara/money';
import { registerGame, type GameDefinition } from '../registry';
import { quantize6 } from '../lib/quantize';
import { requireFloat } from '../lib/require-float';

export const DEEPSHAFT_MAX_DEPTH = 15;

export type DeepshaftRiskTier = 'safe' | 'standard' | 'deep';

export interface DeepshaftSelection {
  riskTier: DeepshaftRiskTier;
  targetDepth: number;
}

export interface DeepshaftLevel {
  depth: number;
  outcome: 'gold' | 'cavein';
  levelMultiplier: number;
}

export interface DeepshaftResult {
  levels: DeepshaftLevel[];
  reachedDepth: number;
  caveIn: boolean;
  totalMultiplier: number;
  won: boolean;
}

const TIER_PARAMS: Record<DeepshaftRiskTier, { base: number; step: number; cap: number }> = {
  safe: { base: 0.035, step: 0.008, cap: 0.18 },
  standard: { base: 0.053, step: 0.012, cap: 0.28 },
  deep: { base: 0.085, step: 0.016, cap: 0.38 },
};

const GROWTH_K: Record<DeepshaftRiskTier, number> = {
  safe: 0.042,
  standard: 0.065,
  deep: 0.088,
};

const TIER_SCALE: Record<DeepshaftRiskTier, number> = {
  safe: 0.88,
  standard: 1.0,
  deep: 1.12,
};

/** Per-level cave-in probability — monotone in depth, capped per tier. */
export function caveInProb(riskTier: DeepshaftRiskTier, depth: number): number {
  const { base, step, cap } = TIER_PARAMS[riskTier];
  return Math.min(cap, base + (depth - 1) ** 1.15 * step);
}

/** P(all gold through targetDepth) — used for RTP + reachability gates. */
export function completeProbability(riskTier: DeepshaftRiskTier, targetDepth: number): number {
  let p = 1;
  for (let d = 1; d <= targetDepth; d += 1) {
    p *= 1 - caveInProb(riskTier, d);
  }
  return p;
}

/** Raw fair multiplier before house edge (1 / P(complete)). */
export function deepshaftRawMultiplier(riskTier: DeepshaftRiskTier, targetDepth: number): number {
  const prob = completeProbability(riskTier, targetDepth);
  if (prob <= 0) return 0;
  return 1 / prob;
}

/** Tier-scaled super-linear running mult after `depth` gold levels. */
export function levelGrowthMult(riskTier: DeepshaftRiskTier, depth: number): number {
  if (depth < 1) return 1;
  let raw = 1;
  for (let d = 1; d <= depth; d += 1) {
    raw *= 1 + GROWTH_K[riskTier] * d ** 1.35 * TIER_SCALE[riskTier];
  }
  return Math.floor(raw * 100) / 100;
}

/** Paying mult at committed depth — floor(raw × 99) / 100 (platform convention). */
export function deepshaftPayoutMultiplier(riskTier: DeepshaftRiskTier, targetDepth: number): number {
  const raw = deepshaftRawMultiplier(riskTier, targetDepth);
  if (raw <= 0) return 0;
  return Math.floor(raw * 99) / 100;
}

/** Running display mult on gold levels (super-linear progression). */
export function levelDisplayMultiplier(riskTier: DeepshaftRiskTier, depth: number): number {
  return levelGrowthMult(riskTier, depth);
}

export function evaluateDeepshaft(
  floats: number[],
  selection: DeepshaftSelection,
): DeepshaftResult {
  const { riskTier, targetDepth } = selection;
  if (targetDepth < 1 || targetDepth > DEEPSHAFT_MAX_DEPTH) {
    throw new Error('invalid_deepshaft_depth');
  }

  const levels: DeepshaftLevel[] = [];
  let reachedDepth = 0;

  for (let depth = 1; depth <= targetDepth; depth += 1) {
    const f = requireFloat(floats, depth - 1);
    const prob = caveInProb(riskTier, depth);
    if (f < prob) {
      levels.push({ depth, outcome: 'cavein', levelMultiplier: 0 });
      return {
        levels,
        reachedDepth,
        caveIn: true,
        totalMultiplier: 0,
        won: false,
      };
    }
    reachedDepth = depth;
    levels.push({
      depth,
      outcome: 'gold',
      levelMultiplier: levelDisplayMultiplier(riskTier, depth),
    });
  }

  const totalMultiplier = deepshaftPayoutMultiplier(riskTier, targetDepth);
  return {
    levels,
    reachedDepth,
    caveIn: false,
    totalMultiplier,
    won: true,
  };
}

const deepshaftDefinition: GameDefinition<DeepshaftSelection, DeepshaftResult> = {
  code: 'deepshaft',
  betSchema: z.object({
    riskTier: z.enum(['safe', 'standard', 'deep']),
    targetDepth: z.number().int().min(1).max(DEEPSHAFT_MAX_DEPTH),
  }),
  floatCount: DEEPSHAFT_MAX_DEPTH,

  resultFromFloats(floats, selection): DeepshaftResult {
    return evaluateDeepshaft(floats, selection);
  },

  settle(stake, selection, result) {
    if (!result.won || result.totalMultiplier <= 0) {
      return { payout: quantize6('0'), houseEdgeLeg: stake };
    }
    const payout = stake.mul(quantize6(result.totalMultiplier.toFixed(6)));
    return { payout, houseEdgeLeg: stake.minus(payout) };
  },

  maxPayoutMultiplier(selection) {
    return deepshaftPayoutMultiplier(selection.riskTier, selection.targetDepth);
  },

  theoreticalRtp(selection) {
    const sel = selection ?? { riskTier: 'standard' as const, targetDepth: 8 };
    const prob = completeProbability(sel.riskTier, sel.targetDepth);
    const mult = deepshaftPayoutMultiplier(sel.riskTier, sel.targetDepth);
    return new Decimal((prob * mult).toFixed(6));
  },
};

registerGame(deepshaftDefinition);
export { deepshaftDefinition };
