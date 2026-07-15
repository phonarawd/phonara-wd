/**
 * P10 Batch A — crash · limbo · dice L1 stages (§23.2 · §23.8 · YAML #208).
 * Replay-only: RPC result → stage.playOutcome · no mid-round cash-out RPC.
 */

import type { GameCode } from '@phonara/game-engine';
import type { MessageKey } from '@phonara/i18n';

import { P10_CASINO_REPLAY_AND_INFRA_TODO } from './casino-outcome-replay-contract';

export const P10_GAMES_BATCH_A_TODO = 'p10-games-batch-a' as const;

export const P10_GAMES_BATCH_A_PREREQUISITE_TODOS = [P10_CASINO_REPLAY_AND_INFRA_TODO] as const;

/** Batch A game codes — instant-loop React stages (§23.5). */
export const CASINO_BATCH_A_GAME_CODES = [
  'crash',
  'limbo',
  'dice',
] as const satisfies readonly GameCode[];

export type CasinoBatchAGameCode = (typeof CASINO_BATCH_A_GAME_CODES)[number];

export function isCasinoBatchAGame(code: GameCode): code is CasinoBatchAGameCode {
  return (CASINO_BATCH_A_GAME_CODES as readonly string[]).includes(code);
}

/** §23.2.1 — crash autoCashout is pre-bet param, not live escape. */
export const CASINO_CRASH_AUTOCASHOUT_HELP_KEY =
  'casino.help.autoCashoutBeforeBet' as const satisfies MessageKey;

export const CASINO_BATCH_A_L1_SPECS = {
  crash: {
    render: 'react_svg_raf',
    l1: 'curve stop · bust/cashout color',
    overlaySource: 'cashout multiplier',
    forbidden: 'live cash-out during ascent',
  },
  limbo: {
    render: 'react_dial',
    l1: 'result vs target flash',
    overlaySource: 'result multiplier',
    forbidden: 'fake mid-state before RPC',
  },
  dice: {
    render: 'react_probability_bar',
    l1: 'bar highlight · roll contain',
    overlaySource: 'win payout ratio',
    forbidden: 'fake mid-state before RPC',
  },
} as const;

export const CASINO_BATCH_A_STAGE_PATHS = [
  'apps/web/src/product/surfaces/games/crash-stage.tsx',
  'apps/web/src/product/surfaces/games/limbo-stage.tsx',
  'apps/web/src/product/surfaces/games/dice-stage.tsx',
  'apps/web/src/product/surfaces/games/casino-game-stage.tsx',
  'apps/web/src/product/surfaces/games/game-selection-fields.tsx',
] as const;

export const CASINO_BATCH_A_TEST_PATHS = [
  'apps/web/src/domain/__tests__/casino-games-batch-a-display-contract.test.ts',
  'apps/web/src/product/surfaces/games/__tests__/casino-games-batch-a-stages.test.tsx',
] as const;

/** Crash replay duration 1.5–4s from result magnitude (display timing only). */
export function crashReplayDurationMs(crashMultiplier: number): number {
  const safe = Number.isFinite(crashMultiplier) && crashMultiplier > 1 ? crashMultiplier : 1;
  const raw = 1500 + Math.min(2500, Math.log2(safe) * 900);
  return Math.min(4000, Math.max(1500, Math.round(raw)));
}

/**
 * Crash curve draw easing (Phase 1B — display timing only, no settlement impact).
 * Accelerating (ease-IN): the on-screen line must build slowly then rocket right
 * before the crash point — "live tension" (CASINO_UX_CANON §1 Crash). A
 * decelerating curve (ease-OUT) reads as the opposite feel and was the pre-Phase-1B
 * gap. `progress` is elapsed/duration in [0,1]; result feeds `endMult ** eased`.
 */
export function crashCurveEasing(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  return Math.pow(clamped, 2.2);
}

export type ParsedCrashOutcome = {
  crashMultiplier: number;
  cashedOut: boolean;
  cashoutMultiplier: number;
};

export type ParsedLimboOutcome = {
  resultMultiplier: number;
  won: boolean;
};

export type ParsedDiceOutcome = {
  roll: number;
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

/** Display-only parse of RPC `result` — never invents settlement. */
export function parseCrashOutcome(result: Record<string, unknown>): ParsedCrashOutcome | null {
  const crashMultiplier = asFiniteNumber(result['crashMultiplier']);
  if (crashMultiplier === null || crashMultiplier < 1) return null;
  const cashedOut = result['cashedOut'] === true;
  const cashoutMultiplier = asFiniteNumber(result['cashoutMultiplier']) ?? 0;
  return { crashMultiplier, cashedOut, cashoutMultiplier };
}

export function parseLimboOutcome(result: Record<string, unknown>): ParsedLimboOutcome | null {
  const resultMultiplier = asFiniteNumber(result['resultMultiplier']);
  if (resultMultiplier === null || resultMultiplier < 1) return null;
  return { resultMultiplier, won: result['won'] === true };
}

export function parseDiceOutcome(result: Record<string, unknown>): ParsedDiceOutcome | null {
  const roll = asFiniteNumber(result['roll']);
  if (roll === null || roll < 0 || roll > 99.99) return null;
  return { roll, won: result['won'] === true };
}

export function assertCasinoGamesBatchAContractSync(): void {
  if (P10_GAMES_BATCH_A_TODO !== 'p10-games-batch-a') {
    throw new Error('casino-games-batch-a: owner todo id drift');
  }
  if (!P10_GAMES_BATCH_A_PREREQUISITE_TODOS.includes(P10_CASINO_REPLAY_AND_INFRA_TODO)) {
    throw new Error('casino-games-batch-a: missing p10-casino-replay-and-infra prerequisite');
  }
  if (CASINO_BATCH_A_GAME_CODES.length !== 3) {
    throw new Error('casino-games-batch-a: expected crash·limbo·dice');
  }
  for (const code of CASINO_BATCH_A_GAME_CODES) {
    if (!(code in CASINO_BATCH_A_L1_SPECS)) {
      throw new Error(`casino-games-batch-a: missing L1 spec for ${code}`);
    }
  }
  if (crashReplayDurationMs(2) < 1500 || crashReplayDurationMs(100) > 4000) {
    throw new Error('casino-games-batch-a: crash duration clamp drift');
  }
  // Accelerating (convex), not decelerating: the delta over a late equal-width
  // progress interval must exceed the delta over an early one — proves the curve
  // builds slowly then rockets, rather than shooting up early then leveling off.
  const earlyDelta = crashCurveEasing(0.5) - crashCurveEasing(0.1);
  const lateDelta = crashCurveEasing(0.9) - crashCurveEasing(0.5);
  if (lateDelta <= earlyDelta) {
    throw new Error('casino-games-batch-a: crash curve easing must be accelerating (ease-in)');
  }
  const crash = parseCrashOutcome({
    crashMultiplier: 2.5,
    cashedOut: true,
    cashoutMultiplier: 2,
  });
  if (!crash?.cashedOut || crash.cashoutMultiplier !== 2) {
    throw new Error('casino-games-batch-a: crash parse drift');
  }
  if (!parseLimboOutcome({ resultMultiplier: 3.1, won: true })?.won) {
    throw new Error('casino-games-batch-a: limbo parse drift');
  }
  if (!parseDiceOutcome({ roll: 42.5, won: false })) {
    throw new Error('casino-games-batch-a: dice parse drift');
  }
}
