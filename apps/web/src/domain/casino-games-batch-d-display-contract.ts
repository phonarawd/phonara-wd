/**
 * P10 Batch D — roulette · blackjack · deepshaft table L1 (§23.2 · §23.8 · YAML #211).
 * Replay-only: RPC result → stage.playOutcome · no live hit/stand · engine 0.
 */

import type {
  BlackjackMove,
  DeepshaftRiskTier,
  GameCode,
  RouletteBetType,
} from '@phonara/game-engine';
import type { MessageKey } from '@phonara/i18n';

import { P10_GAMES_BATCH_A_TODO } from './casino-games-batch-a-display-contract';
import { P10_GAMES_BATCH_B_TODO } from './casino-games-batch-b-display-contract';
import { P10_GAMES_BATCH_C_TODO } from './casino-games-batch-c-display-contract';
import { P10_CASINO_REPLAY_AND_INFRA_TODO } from './casino-outcome-replay-contract';

export const P10_GAMES_BATCH_D_TODO = 'p10-games-batch-d' as const;

export const P10_GAMES_BATCH_D_PREREQUISITE_TODOS = [
  P10_CASINO_REPLAY_AND_INFRA_TODO,
  P10_GAMES_BATCH_A_TODO,
  P10_GAMES_BATCH_B_TODO,
  P10_GAMES_BATCH_C_TODO,
] as const;

/** Batch D game codes — React SVG/DOM table stages (§23.5). */
export const CASINO_BATCH_D_GAME_CODES = [
  'roulette',
  'blackjack',
  'deepshaft',
] as const satisfies readonly GameCode[];

export type CasinoBatchDGameCode = (typeof CASINO_BATCH_D_GAME_CODES)[number];

export function isCasinoBatchDGame(code: GameCode): code is CasinoBatchDGameCode {
  return (CASINO_BATCH_D_GAME_CODES as readonly string[]).includes(code);
}

/** §23.2.1 — blackjack actions are pre-bet queue, not live hit/stand. */
export const CASINO_BLACKJACK_ACTIONS_HELP_KEY =
  'casino.help.blackjackActionsBeforeBet' as const satisfies MessageKey;

/** §23.2.1 — deepshaft depth is pre-bet param, not live dig/cash-out. */
export const CASINO_DEEPSHAFT_DEPTH_HELP_KEY =
  'casino.help.deepshaftDepthBeforeBet' as const satisfies MessageKey;

/** §23.2.1 — roulette bet map required before spin. */
export const CASINO_ROULETTE_BET_MAP_HELP_KEY =
  'casino.help.rouletteBetMapBeforeBet' as const satisfies MessageKey;

export const CASINO_BATCH_D_L1_SPECS = {
  roulette: {
    render: 'react_svg_dom_table',
    l1: 'sector highlight',
    overlaySource: 'table win total',
    forbidden: 'fake mid-state before RPC result',
    touchMinPx: 48,
  },
  blackjack: {
    render: 'react_dom_felt_table',
    l1: 'hand reveal',
    overlaySource: 'hand payout',
    forbidden: 'live hit/stand server round-trips',
    touchMinPx: 48,
  },
  deepshaft: {
    render: 'react_dom_depth_shaft',
    l1: 'depth meter',
    overlaySource: 'depth mult',
    forbidden: 'fake mid-state before RPC result',
    touchMinPx: 48,
  },
} as const;

export const CASINO_BATCH_D_STAGE_PATHS = [
  'apps/web/src/product/surfaces/games/roulette-stage.tsx',
  'apps/web/src/product/surfaces/games/blackjack-stage.tsx',
  'apps/web/src/product/surfaces/games/deepshaft-stage.tsx',
  'apps/web/src/product/surfaces/games/casino-game-stage.tsx',
] as const;

export const CASINO_BATCH_D_TEST_PATHS = [
  'apps/web/src/domain/__tests__/casino-games-batch-d-display-contract.test.ts',
  'apps/web/src/product/surfaces/games/__tests__/casino-games-batch-d-stages.test.tsx',
] as const;

export const CASINO_ROULETTE_CHIP_WEIGHTS = [1, 5, 25, 100] as const;

export const CASINO_ROULETTE_OUTSIDE_TYPES = [
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
] as const satisfies readonly RouletteBetType[];

/** European single-zero red pockets — display only (matches engine). */
export const CASINO_ROULETTE_RED_POCKETS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export const CASINO_DEEPSHAFT_MAX_DEPTH = 15 as const;

export const CASINO_BLACKJACK_MOVES = [
  'hit',
  'stand',
  'double',
  'split',
  'insurance',
] as const satisfies readonly BlackjackMove[];

export type CasinoRouletteLeg = {
  type: RouletteBetType;
  value: number | null;
  stakeWeight: number;
};

export type ParsedRouletteOutcome = {
  winningNumber: number;
  totalMultiplier: number;
};

export type ParsedBlackjackOutcome = {
  totalMultiplier: number;
};

export type ParsedDeepshaftLevel = {
  depth: number;
  outcome: 'gold' | 'cavein';
  levelMultiplier: number;
};

export type ParsedDeepshaftOutcome = {
  levels: ParsedDeepshaftLevel[];
  reachedDepth: number;
  caveIn: boolean;
  totalMultiplier: number;
  won: boolean;
};

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

const ROULETTE_TYPES = new Set<string>([
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
]);

const BJ_MOVES = new Set<string>(CASINO_BLACKJACK_MOVES);
const DEEPSHAFT_TIERS = new Set<DeepshaftRiskTier>(['safe', 'standard', 'deep']);

export function roulettePocketColor(n: number): 'red' | 'black' | 'green' {
  if (n === 0) return 'green';
  return CASINO_ROULETTE_RED_POCKETS.has(n) ? 'red' : 'black';
}

/** Display-only parse of RPC `result` — never invents settlement. */
export function parseRouletteOutcome(
  result: Record<string, unknown>,
): ParsedRouletteOutcome | null {
  const winningNumber = asFiniteNumber(result['winningNumber']);
  const totalMultiplier = asFiniteNumber(result['totalMultiplier']);
  if (winningNumber === null || totalMultiplier === null) return null;
  if (!Number.isInteger(winningNumber) || winningNumber < 0 || winningNumber > 36) return null;
  if (totalMultiplier < 0) return null;
  return { winningNumber, totalMultiplier };
}

export function parseBlackjackOutcome(
  result: Record<string, unknown>,
): ParsedBlackjackOutcome | null {
  const totalMultiplier = asFiniteNumber(result['totalMultiplier']);
  if (totalMultiplier === null || totalMultiplier < 0) return null;
  return { totalMultiplier };
}

export function parseDeepshaftOutcome(
  result: Record<string, unknown>,
): ParsedDeepshaftOutcome | null {
  if (typeof result['caveIn'] !== 'boolean' || typeof result['won'] !== 'boolean') return null;
  const reachedDepth = asFiniteNumber(result['reachedDepth']);
  const totalMultiplier = asFiniteNumber(result['totalMultiplier']);
  if (reachedDepth === null || totalMultiplier === null) return null;
  if (
    !Number.isInteger(reachedDepth) ||
    reachedDepth < 0 ||
    reachedDepth > CASINO_DEEPSHAFT_MAX_DEPTH
  ) {
    return null;
  }
  if (totalMultiplier < 0) return null;
  if (!Array.isArray(result['levels'])) return null;
  const levels: ParsedDeepshaftLevel[] = [];
  for (const raw of result['levels']) {
    if (!raw || typeof raw !== 'object') return null;
    const row = raw as Record<string, unknown>;
    const depth = asFiniteNumber(row['depth']);
    const levelMultiplier = asFiniteNumber(row['levelMultiplier']);
    const outcome = row['outcome'];
    if (depth === null || levelMultiplier === null) return null;
    if (!Number.isInteger(depth) || depth < 1 || depth > CASINO_DEEPSHAFT_MAX_DEPTH) return null;
    if (outcome !== 'gold' && outcome !== 'cavein') return null;
    levels.push({ depth, outcome, levelMultiplier });
  }
  return {
    levels,
    reachedDepth,
    caveIn: result['caveIn'],
    totalMultiplier,
    won: result['won'],
  };
}

export function normalizeRouletteLegs(raw: unknown): CasinoRouletteLeg[] {
  if (!Array.isArray(raw)) return [];
  const out: CasinoRouletteLeg[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const type = row['type'];
    if (typeof type !== 'string' || !ROULETTE_TYPES.has(type)) continue;
    const stakeWeight = asFiniteNumber(row['stakeWeight']);
    if (stakeWeight === null || stakeWeight <= 0) continue;
    let value: number | null = null;
    if (row['value'] !== null && row['value'] !== undefined) {
      const v = asFiniteNumber(row['value']);
      if (v === null || !Number.isInteger(v) || v < 0 || v > 36) continue;
      value = v;
    }
    if ((type === 'straight' || type === 'split') && value === null) continue;
    out.push({ type: type as RouletteBetType, value, stakeWeight });
    if (out.length >= 20) break;
  }
  return out;
}

export function normalizeBlackjackActions(
  raw: unknown,
): Array<{ seat: number; move: BlackjackMove }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ seat: number; move: BlackjackMove }> = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const seat = asFiniteNumber(row['seat']);
    const move = row['move'];
    if (seat === null || !Number.isInteger(seat) || seat < 0) continue;
    if (typeof move !== 'string' || !BJ_MOVES.has(move)) continue;
    out.push({ seat, move: move as BlackjackMove });
    if (out.length >= 12) break;
  }
  return out;
}

export function normalizeDeepshaftRiskTier(raw: unknown): DeepshaftRiskTier {
  if (typeof raw === 'string' && DEEPSHAFT_TIERS.has(raw as DeepshaftRiskTier)) {
    return raw as DeepshaftRiskTier;
  }
  return 'standard';
}

export function normalizeDeepshaftTargetDepth(raw: unknown): number {
  const n = asFiniteNumber(raw);
  if (n !== null && Number.isInteger(n) && n >= 1 && n <= CASINO_DEEPSHAFT_MAX_DEPTH) {
    return n;
  }
  return 5;
}

export function rouletteTotalWeight(legs: CasinoRouletteLeg[]): number {
  return legs.reduce((sum, leg) => sum + leg.stakeWeight, 0);
}

/** Merge same type+value legs by summing stakeWeight (cap 20 legs). */
export function upsertRouletteLeg(
  legs: CasinoRouletteLeg[],
  next: CasinoRouletteLeg,
): CasinoRouletteLeg[] {
  const idx = legs.findIndex((l) => l.type === next.type && l.value === next.value);
  if (idx >= 0) {
    const copy = [...legs];
    const prev = copy[idx]!;
    copy[idx] = { ...prev, stakeWeight: prev.stakeWeight + next.stakeWeight };
    return copy;
  }
  if (legs.length >= 20) return legs;
  return [...legs, next];
}

export function rouletteSectorHighlightMs(): number {
  return 700;
}

export function blackjackRevealMs(): number {
  return 600;
}

export function deepshaftLevelStepMs(levelCount: number): number {
  const n = Math.max(1, levelCount);
  return Math.min(140, Math.max(50, Math.round(900 / n)));
}

export function assertCasinoGamesBatchDContractSync(): void {
  if (P10_GAMES_BATCH_D_TODO !== 'p10-games-batch-d') {
    throw new Error('casino-games-batch-d: owner todo id drift');
  }
  if (!P10_GAMES_BATCH_D_PREREQUISITE_TODOS.includes(P10_CASINO_REPLAY_AND_INFRA_TODO)) {
    throw new Error('casino-games-batch-d: missing p10-casino-replay-and-infra prerequisite');
  }
  if (!P10_GAMES_BATCH_D_PREREQUISITE_TODOS.includes(P10_GAMES_BATCH_C_TODO)) {
    throw new Error('casino-games-batch-d: missing p10-games-batch-c prerequisite');
  }
  if (CASINO_BATCH_D_GAME_CODES.length !== 3) {
    throw new Error('casino-games-batch-d: expected roulette·blackjack·deepshaft');
  }
  for (const code of CASINO_BATCH_D_GAME_CODES) {
    if (!(code in CASINO_BATCH_D_L1_SPECS)) {
      throw new Error(`casino-games-batch-d: missing L1 spec for ${code}`);
    }
  }
  const roulette = parseRouletteOutcome({ winningNumber: 17, totalMultiplier: 2 });
  if (!roulette || roulette.winningNumber !== 17) {
    throw new Error('casino-games-batch-d: roulette parse drift');
  }
  if (!parseBlackjackOutcome({ totalMultiplier: 2.5 })) {
    throw new Error('casino-games-batch-d: blackjack parse drift');
  }
  const deep = parseDeepshaftOutcome({
    levels: [{ depth: 1, outcome: 'gold', levelMultiplier: 1.05 }],
    reachedDepth: 1,
    caveIn: false,
    totalMultiplier: 1.2,
    won: true,
  });
  if (!deep?.won || deep.reachedDepth !== 1) {
    throw new Error('casino-games-batch-d: deepshaft parse drift');
  }
  if (roulettePocketColor(0) !== 'green' || roulettePocketColor(1) !== 'red') {
    throw new Error('casino-games-batch-d: pocket color drift');
  }
}
