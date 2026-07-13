/**
 * P10 Batch C — plinko · mint_reels · gold_rush · momentum Pixi L1 (§23.2 · §23.8 · YAML #210).
 * Replay-only: RPC result → stage.playOutcome · no mid-round fake state · engine 0.
 */

import type { GameCode, PlinkoRisk } from '@phonara/game-engine';
import type { MessageKey } from '@phonara/i18n';

import { P10_GAMES_BATCH_A_TODO } from './casino-games-batch-a-display-contract';
import { P10_GAMES_BATCH_B_TODO } from './casino-games-batch-b-display-contract';
import { P10_CASINO_REPLAY_AND_INFRA_TODO } from './casino-outcome-replay-contract';

export const P10_GAMES_BATCH_C_TODO = 'p10-games-batch-c' as const;

export const P10_GAMES_BATCH_C_PREREQUISITE_TODOS = [
  P10_CASINO_REPLAY_AND_INFRA_TODO,
  P10_GAMES_BATCH_A_TODO,
  P10_GAMES_BATCH_B_TODO,
] as const;

/** Batch C game codes — Pixi v8 WebGL stages (§23.5 · §25.5). */
export const CASINO_BATCH_C_GAME_CODES = [
  'plinko',
  'mint_reels',
  'gold_rush',
  'momentum',
] as const satisfies readonly GameCode[];

export type CasinoBatchCGameCode = (typeof CASINO_BATCH_C_GAME_CODES)[number];

export function isCasinoBatchCGame(code: GameCode): code is CasinoBatchCGameCode {
  return (CASINO_BATCH_C_GAME_CODES as readonly string[]).includes(code);
}

/** §23.2.1 — momentum cashOut is pre-bet param, not live escape. */
export const CASINO_MOMENTUM_CASHOUT_HELP_KEY =
  'casino.help.momentumCashoutBeforeBet' as const satisfies MessageKey;

export const CASINO_BATCH_C_L1_SPECS = {
  plinko: {
    render: 'pixi_v8_webgl',
    l1: 'path · bucket',
    overlaySource: 'bucket mult',
    forbidden: 'fake mid-state before RPC result',
    landscapePreferred: true,
  },
  mint_reels: {
    render: 'pixi_v8_webgl',
    l1: 'payline scan',
    overlaySource: 'total line win',
    forbidden: 'fake mid-state before RPC result',
    landscapePreferred: true,
  },
  gold_rush: {
    render: 'pixi_v8_webgl',
    l1: 'meter · bonus gate',
    overlaySource: 'bonus payout',
    forbidden: 'fake mid-state before RPC result',
    landscapePreferred: true,
  },
  momentum: {
    render: 'pixi_v8_webgl',
    l1: 'combo meter',
    overlaySource: 'combo payout',
    forbidden: 'fake mid-state before RPC result',
    landscapePreferred: true,
  },
} as const;

export const CASINO_BATCH_C_STAGE_PATHS = [
  'apps/web/src/product/surfaces/games/plinko-stage.tsx',
  'apps/web/src/product/surfaces/games/mint-reels-stage.tsx',
  'apps/web/src/product/surfaces/games/gold-rush-stage.tsx',
  'apps/web/src/product/surfaces/games/momentum-stage.tsx',
  'apps/web/src/product/surfaces/games/use-pixi-stage.ts',
  'apps/web/src/product/surfaces/games/casino-game-stage.tsx',
] as const;

export const CASINO_BATCH_C_TEST_PATHS = [
  'apps/web/src/domain/__tests__/casino-games-batch-c-display-contract.test.ts',
  'apps/web/src/product/surfaces/games/__tests__/casino-games-batch-c-stages.test.tsx',
] as const;

/** Pixi ticker maxFPS · E2E stops ticker when VITE_PHONARA_E2E_ENGINE=1 (§23.4). */
export const CASINO_PIXI_MAX_FPS = 60 as const;

export const CASINO_PIXI_VIEWPORTS = {
  mobile: 390,
  desktop: 1024,
} as const;

const PLINKO_RISKS = new Set<PlinkoRisk>(['low', 'medium', 'high']);
const PLINKO_ROWS = new Set([8, 12, 16]);

export type ParsedPlinkoOutcome = {
  path: number[];
  bucket: number;
  bucketMultiplier: string;
};

export type ParsedMintReelsOutcome = {
  totalMultiplier: number;
};

export type ParsedGoldRushOutcome = {
  totalMultiplier: number;
};

export type ParsedMomentumOutcome = {
  won: boolean;
  roll: number;
  comboBefore: number;
  comboAfter: number;
  comboMultiplier: number;
  cashedOut: boolean;
  totalMultiplier: number;
};

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function asIntArray(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const out: number[] = [];
  for (const item of value) {
    const n = asFiniteNumber(item);
    if (n === null || !Number.isInteger(n)) return null;
    out.push(n);
  }
  return out;
}

/** Display-only parse of RPC `result` — never invents settlement. */
export function parsePlinkoOutcome(result: Record<string, unknown>): ParsedPlinkoOutcome | null {
  const path = asIntArray(result['path']);
  if (!path || path.length === 0) return null;
  if (path.some((d) => d !== 0 && d !== 1)) return null;
  const bucket = asFiniteNumber(result['bucket']);
  if (bucket === null || !Number.isInteger(bucket) || bucket < 0) return null;
  const rawMult = result['bucketMultiplier'];
  if (typeof rawMult !== 'string' && typeof rawMult !== 'number') return null;
  const bucketMultiplier =
    typeof rawMult === 'number' ? rawMult.toFixed(1) : String(rawMult).trim();
  if (bucketMultiplier === '' || asFiniteNumber(bucketMultiplier) === null) return null;
  if (path.filter((d) => d === 1).length !== bucket) return null;
  return { path, bucket, bucketMultiplier };
}

export function parseMintReelsOutcome(
  result: Record<string, unknown>,
): ParsedMintReelsOutcome | null {
  const totalMultiplier = asFiniteNumber(result['totalMultiplier']);
  if (totalMultiplier === null || totalMultiplier < 0) return null;
  return { totalMultiplier };
}

export function parseGoldRushOutcome(
  result: Record<string, unknown>,
): ParsedGoldRushOutcome | null {
  const totalMultiplier = asFiniteNumber(result['totalMultiplier']);
  if (totalMultiplier === null || totalMultiplier < 0) return null;
  return { totalMultiplier };
}

export function parseMomentumOutcome(
  result: Record<string, unknown>,
): ParsedMomentumOutcome | null {
  if (typeof result['won'] !== 'boolean') return null;
  if (typeof result['cashedOut'] !== 'boolean') return null;
  const roll = asFiniteNumber(result['roll']);
  const comboBefore = asFiniteNumber(result['comboBefore']);
  const comboAfter = asFiniteNumber(result['comboAfter']);
  const comboMultiplier = asFiniteNumber(result['comboMultiplier']);
  const totalMultiplier = asFiniteNumber(result['totalMultiplier']);
  if (
    roll === null ||
    comboBefore === null ||
    comboAfter === null ||
    comboMultiplier === null ||
    totalMultiplier === null
  ) {
    return null;
  }
  if (!Number.isInteger(comboBefore) || !Number.isInteger(comboAfter)) return null;
  if (comboBefore < 0 || comboBefore > 15 || comboAfter < 0 || comboAfter > 15) return null;
  return {
    won: result['won'],
    roll,
    comboBefore,
    comboAfter,
    comboMultiplier,
    cashedOut: result['cashedOut'],
    totalMultiplier,
  };
}

export function normalizePlinkoRows(raw: unknown): 8 | 12 | 16 {
  const n = asFiniteNumber(raw);
  if (n !== null && PLINKO_ROWS.has(n)) return n as 8 | 12 | 16;
  return 12;
}

export function normalizePlinkoRisk(raw: unknown): PlinkoRisk {
  if (typeof raw === 'string' && PLINKO_RISKS.has(raw as PlinkoRisk)) {
    return raw as PlinkoRisk;
  }
  return 'medium';
}

/** Path step delay — reduced-motion callers skip to 0. */
export function plinkoPathStepMs(pathLength: number): number {
  const n = Math.max(1, pathLength);
  return Math.min(120, Math.max(45, Math.round(900 / n)));
}

export function mintReelsSpinMs(): number {
  return 900;
}

export function goldRushMeterMs(): number {
  return 1100;
}

export function momentumComboMs(): number {
  return 700;
}

/** Feature meter fill 0–1 from RPC totalMultiplier (display only). */
export function goldRushMeterFill(totalMultiplier: number): number {
  if (!Number.isFinite(totalMultiplier) || totalMultiplier <= 0) return 0;
  return Math.min(1, Math.log10(1 + totalMultiplier) / Math.log10(81));
}

export function isPixiE2eEngineOff(): boolean {
  try {
    return import.meta.env['VITE_PHONARA_E2E_ENGINE'] === '1';
  } catch {
    return false;
  }
}

export function assertCasinoGamesBatchCContractSync(): void {
  if (P10_GAMES_BATCH_C_TODO !== 'p10-games-batch-c') {
    throw new Error('casino-games-batch-c: owner todo id drift');
  }
  if (!P10_GAMES_BATCH_C_PREREQUISITE_TODOS.includes(P10_CASINO_REPLAY_AND_INFRA_TODO)) {
    throw new Error('casino-games-batch-c: missing p10-casino-replay-and-infra prerequisite');
  }
  if (!P10_GAMES_BATCH_C_PREREQUISITE_TODOS.includes(P10_GAMES_BATCH_A_TODO)) {
    throw new Error('casino-games-batch-c: missing p10-games-batch-a prerequisite');
  }
  if (!P10_GAMES_BATCH_C_PREREQUISITE_TODOS.includes(P10_GAMES_BATCH_B_TODO)) {
    throw new Error('casino-games-batch-c: missing p10-games-batch-b prerequisite');
  }
  if (CASINO_BATCH_C_GAME_CODES.length !== 4) {
    throw new Error('casino-games-batch-c: expected plinko·mint_reels·gold_rush·momentum');
  }
  for (const code of CASINO_BATCH_C_GAME_CODES) {
    if (!(code in CASINO_BATCH_C_L1_SPECS)) {
      throw new Error(`casino-games-batch-c: missing L1 spec for ${code}`);
    }
    if (CASINO_BATCH_C_L1_SPECS[code].render !== 'pixi_v8_webgl') {
      throw new Error(`casino-games-batch-c: ${code} must be Pixi v8`);
    }
  }
  const plinko = parsePlinkoOutcome({
    path: [0, 1, 0],
    bucket: 1,
    bucketMultiplier: '1.2',
  });
  if (!plinko || plinko.bucket !== 1) {
    throw new Error('casino-games-batch-c: plinko parse drift');
  }
  if (!parseMintReelsOutcome({ totalMultiplier: 2.5 })) {
    throw new Error('casino-games-batch-c: mint_reels parse drift');
  }
  if (!parseGoldRushOutcome({ totalMultiplier: 0 })) {
    throw new Error('casino-games-batch-c: gold_rush parse drift');
  }
  const momentum = parseMomentumOutcome({
    won: true,
    roll: 60,
    comboBefore: 2,
    comboAfter: 3,
    comboMultiplier: 4.5,
    cashedOut: false,
    totalMultiplier: 0,
  });
  if (!momentum?.won || momentum.comboAfter !== 3) {
    throw new Error('casino-games-batch-c: momentum parse drift');
  }
  if (goldRushMeterFill(0) !== 0 || goldRushMeterFill(80) > 1) {
    throw new Error('casino-games-batch-c: gold rush meter drift');
  }
  if (CASINO_PIXI_VIEWPORTS.mobile !== 390 || CASINO_PIXI_VIEWPORTS.desktop !== 1024) {
    throw new Error('casino-games-batch-c: viewport budget drift');
  }
}
