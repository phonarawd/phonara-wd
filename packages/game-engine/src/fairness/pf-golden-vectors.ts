/**
 * PIR P2 — PF boundary float golden vectors (SQL authority).
 *
 * Settlement truth is SQL `_game_float_stream` / `_game_result`.
 * These vectors pin the TS verifier/engine to the same float→outcome
 * boundaries so SQL↔TS drift fails locally via vitest + `check:determinism`.
 *
 * Seed triple matches `supabase/tests/casino_parity_test.sql`.
 */

import type { GameCode } from '../registry';
import { GAME_CODES } from '../registry';

/** HMAC seed triple shared with SQL casino_parity_test.sql */
export const PF_GOLDEN_SEED = {
  serverSeed: 'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb',
  clientSeed: 'parity_client',
  nonce: 1,
} as const;

/**
 * Max uniform float from 4 HMAC bytes (0xFF×4).
 * SQL: Σ get_byte/256^(j+1) with all bytes 255 → 1 - 2^-32.
 */
export const PF_FLOAT_MAX = 1 - 2 ** -32;

/** Min stream float (all zero bytes). */
export const PF_FLOAT_MIN = 0;

/** Half-open direction / threshold boundary used by Plinko (and similar). */
export const PF_FLOAT_HALF = 0.5;

/**
 * First 8 floats from `_game_float_stream` / `floatStream` for PF_GOLDEN_SEED.
 * Locked against SQL DOUBLE domain (casino_parity_test + Part C migration).
 */
export const PF_GOLDEN_SEED_FLOATS = [
  0.18378638522699475, 0.4353131849784404, 0.8838806848507375, 0.2609026092104614,
  0.5693198468070477, 0.3725207943934947, 0.3198902525473386, 0.24058134364895523,
] as const;

export type PfBoundaryKind =
  | 'dice_roll'
  | 'crash_mult'
  | 'limbo_mult'
  | 'plinko_dir'
  | 'hilo_card'
  | 'roulette_pocket'
  | 'mines_shuffle_j'
  | 'deepshaft_cavein'
  | 'momentum_roll'
  | 'slot_stop'
  | 'blackjack_shuffle_j';

/**
 * Formula-level boundary pins — same integer floors SQL uses after DOUBLE floats.
 * Authority: migration `_game_result` branches + casino_parity_test domain loop.
 */
export const PF_BOUNDARY_FORMULA_VECTORS: ReadonlyArray<{
  kind: PfBoundaryKind;
  games: readonly GameCode[];
  f: number;
  /** Integer or discrete outcome after floor/compare (SQL-matching). */
  expected: number | boolean;
  note: string;
}> = [
  {
    kind: 'dice_roll',
    games: ['dice', 'momentum'],
    f: PF_FLOAT_MIN,
    expected: 0,
    note: 'floor(f*10000)/100 → 0.00',
  },
  {
    kind: 'dice_roll',
    games: ['dice', 'momentum'],
    f: PF_FLOAT_MAX,
    expected: 99.99,
    note: 'floor(f*10000)/100 → 99.99 (never 100)',
  },
  {
    kind: 'crash_mult',
    games: ['crash'],
    f: PF_FLOAT_MIN,
    expected: 1,
    note: 'GREATEST(1, floor(99/(1-f))/100) at f=0',
  },
  {
    kind: 'crash_mult',
    games: ['crash'],
    f: 0.99,
    expected: 98.99,
    note: 'f=0.99 → IEEE 1-0.99 drift → floor(99/denom)/100 = 98.99 (SQL DOUBLE same)',
  },
  {
    kind: 'limbo_mult',
    games: ['limbo'],
    f: PF_FLOAT_MIN,
    expected: 1,
    note: 'LEAST(1e6, GREATEST(1, floor(99/(1-f))/100)) at f=0',
  },
  {
    kind: 'limbo_mult',
    games: ['limbo'],
    f: PF_FLOAT_MAX,
    expected: 1_000_000,
    note: 'near-1 float clamps to casino_limbo_max_target',
  },
  {
    kind: 'plinko_dir',
    games: ['plinko'],
    f: PF_FLOAT_MIN,
    expected: 0,
    note: 'f < 0.5 → left (0)',
  },
  {
    kind: 'plinko_dir',
    games: ['plinko'],
    f: PF_FLOAT_HALF,
    expected: 1,
    note: 'f >= 0.5 → right (1)',
  },
  {
    kind: 'hilo_card',
    games: ['hilo'],
    f: PF_FLOAT_MIN,
    expected: 1,
    note: 'floor(f*13)+1 → 1',
  },
  {
    kind: 'hilo_card',
    games: ['hilo'],
    f: PF_FLOAT_MAX,
    expected: 13,
    note: 'floor(f*13)+1 → 13',
  },
  {
    kind: 'roulette_pocket',
    games: ['roulette'],
    f: PF_FLOAT_MIN,
    expected: 0,
    note: 'floor(f*37) → 0',
  },
  {
    kind: 'roulette_pocket',
    games: ['roulette'],
    f: PF_FLOAT_MAX,
    expected: 36,
    note: 'floor(f*37) → 36 (never 37)',
  },
  {
    kind: 'mines_shuffle_j',
    games: ['mines', 'blackjack'],
    f: PF_FLOAT_MIN,
    expected: 0,
    note: 'floor(f * n) at n=25 → 0 (Fisher–Yates j)',
  },
  {
    kind: 'mines_shuffle_j',
    games: ['mines', 'blackjack'],
    f: PF_FLOAT_MAX,
    expected: 24,
    note: 'floor(f * 25) → 24',
  },
  {
    kind: 'deepshaft_cavein',
    games: ['deepshaft'],
    f: PF_FLOAT_MIN,
    expected: true,
    note: 'f < caveInProb → cave-in (f=0 always caves on depth≥1)',
  },
  {
    kind: 'deepshaft_cavein',
    games: ['deepshaft'],
    f: PF_FLOAT_MAX,
    expected: false,
    note: 'f=max never caves vs standard depth-1 prob',
  },
  {
    kind: 'slot_stop',
    games: ['mint_reels', 'gold_rush'],
    f: PF_FLOAT_MIN,
    expected: 0,
    note: 'reel stop floor(f * stripLen) at f=0',
  },
  {
    kind: 'slot_stop',
    games: ['mint_reels', 'gold_rush'],
    f: PF_FLOAT_MAX,
    expected: 1,
    note: 'stripLen=2 sentinel: floor(f*2) → 1 (last index)',
  },
];

/**
 * SQL `_game_result` seed pins for all 12 games (casino_parity_test.sql).
 * TS `resultFromFloats` must match these exact JSON shapes.
 */
export const PF_SEED_RESULT_VECTORS: ReadonlyArray<{
  game: GameCode;
  selection: unknown;
  /** Stable JSON of result object (SQL authority). */
  result: unknown;
}> = [
  {
    game: 'dice',
    selection: { target: '50.00', direction: 'over' },
    result: { roll: 18.37, won: false },
  },
  {
    game: 'dice',
    selection: { target: '25.00', direction: 'under' },
    result: { roll: 18.37, won: true },
  },
  {
    game: 'limbo',
    selection: { target: '2.00' },
    result: { resultMultiplier: 1.21, won: false },
  },
  {
    game: 'crash',
    selection: { autoCashout: '2.00' },
    result: { crashMultiplier: 1.21, cashedOut: false, cashoutMultiplier: 0 },
  },
  {
    game: 'mines',
    selection: { mineCount: 3, revealedCells: [0, 1, 2] },
    result: { minePositions: [6, 0, 4], hitMine: true },
  },
  {
    game: 'hilo',
    selection: { startCard: 7, guesses: ['higher'] },
    result: {
      cards: [7, 3],
      rounds: [{ card: 7, guess: 'higher', correct: false, multiplier: 0 }],
      won: false,
    },
  },
  {
    game: 'plinko',
    selection: { rows: 12, risk: 'low' },
    result: { path: [0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1], bucket: 5, bucketMultiplier: '0.9' },
  },
  {
    game: 'deepshaft',
    selection: { riskTier: 'standard', targetDepth: 5 },
    result: {
      levels: [
        { depth: 1, outcome: 'gold', levelMultiplier: 1.06 },
        { depth: 2, outcome: 'gold', levelMultiplier: 1.24 },
        { depth: 3, outcome: 'gold', levelMultiplier: 1.59 },
        { depth: 4, outcome: 'gold', levelMultiplier: 2.27 },
        { depth: 5, outcome: 'gold', levelMultiplier: 3.56 },
      ],
      reachedDepth: 5,
      caveIn: false,
      totalMultiplier: 1.51,
      won: true,
    },
  },
  {
    game: 'momentum',
    selection: { comboBefore: 0, cashOut: false },
    result: {
      won: false,
      roll: 18.37,
      comboBefore: 0,
      comboAfter: 0,
      comboMultiplier: 0,
      cashedOut: false,
      totalMultiplier: 0,
    },
  },
  {
    game: 'mint_reels',
    selection: { lines: 20 },
    result: { totalMultiplier: 0 },
  },
  {
    game: 'gold_rush',
    selection: { lines: 20 },
    result: { totalMultiplier: 0 },
  },
  {
    game: 'roulette',
    selection: { bets: [{ type: 'red', value: null, stakeWeight: 1 }] },
    result: { winningNumber: 6, totalMultiplier: 0 },
  },
  {
    game: 'blackjack',
    selection: { actions: [{ seat: 0, move: 'stand' }] },
    result: { totalMultiplier: 2 },
  },
];

/** Every GameCode must appear in seed vectors (check:determinism + vitest). */
export function pfGoldenSeedCoverage(): GameCode[] {
  return [...new Set(PF_SEED_RESULT_VECTORS.map((v) => v.game))];
}

/** Every GameCode must appear in at least one boundary formula vector. */
export function pfGoldenBoundaryCoverage(): GameCode[] {
  return [...new Set(PF_BOUNDARY_FORMULA_VECTORS.flatMap((v) => [...v.games]))];
}

export function assertPfGoldenCoverageComplete(): void {
  const seed = new Set(pfGoldenSeedCoverage());
  const boundary = new Set(pfGoldenBoundaryCoverage());
  const missingSeed = GAME_CODES.filter((c) => !seed.has(c));
  const missingBoundary = GAME_CODES.filter((c) => !boundary.has(c));
  if (missingSeed.length > 0 || missingBoundary.length > 0) {
    throw new Error(
      `PF golden vector coverage incomplete — seed missing [${missingSeed.join(',')}] · boundary missing [${missingBoundary.join(',')}]`,
    );
  }
}
