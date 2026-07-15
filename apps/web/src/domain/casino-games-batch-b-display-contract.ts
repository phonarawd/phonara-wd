/**
 * P10 Batch B — mines · hilo L1 stages (§23.2 · §23.8 · YAML #209).
 * Replay-only: RPC result → stage.playOutcome · no mid-round reveal/cash-out RPC.
 */

import type { GameCode, HiLoGuess, HiLoRound } from '@phonara/game-engine';
import type { MessageKey } from '@phonara/i18n';

import { P10_GAMES_BATCH_A_TODO } from './casino-games-batch-a-display-contract';
import { P10_CASINO_REPLAY_AND_INFRA_TODO } from './casino-outcome-replay-contract';

export const P10_GAMES_BATCH_B_TODO = 'p10-games-batch-b' as const;

export const P10_GAMES_BATCH_B_PREREQUISITE_TODOS = [
  P10_CASINO_REPLAY_AND_INFRA_TODO,
  P10_GAMES_BATCH_A_TODO,
] as const;

/** Batch B game codes — React DOM grid/card stages (§23.5). */
export const CASINO_BATCH_B_GAME_CODES = ['mines', 'hilo'] as const satisfies readonly GameCode[];

export type CasinoBatchBGameCode = (typeof CASINO_BATCH_B_GAME_CODES)[number];

export function isCasinoBatchBGame(code: GameCode): code is CasinoBatchBGameCode {
  return (CASINO_BATCH_B_GAME_CODES as readonly string[]).includes(code);
}

/** 5×5 mines board — engine GRID_SIZE. */
export const CASINO_MINES_GRID_SIZE = 25 as const;

/** §23.2.1 — mines cash-out mult is pre-bet param display, not live escape. */
export const CASINO_MINES_CASHOUT_HELP_KEY =
  'casino.help.minesCashoutBeforeBet' as const satisfies MessageKey;

export const CASINO_BATCH_B_L1_SPECS = {
  mines: {
    render: 'react_dom_tile_grid',
    l1: 'tile cascade · ladder',
    overlaySource: 'cash-out mult',
    forbidden: 'per-tile live reveal · mid-round cash-out',
    touchMinPx: 48,
  },
  hilo: {
    render: 'react_dom_cards',
    l1: 'card · streak',
    overlaySource: 'round payout ratio',
    forbidden: 'per-card live betting',
    touchMinPx: 48,
  },
} as const;

export const CASINO_BATCH_B_STAGE_PATHS = [
  'apps/web/src/product/surfaces/games/mines-stage.tsx',
  'apps/web/src/product/surfaces/games/hilo-stage.tsx',
  'apps/web/src/product/surfaces/games/casino-game-stage.tsx',
  'apps/web/src/product/surfaces/games/game-selection-fields.tsx',
] as const;

export const CASINO_BATCH_B_TEST_PATHS = [
  'apps/web/src/domain/__tests__/casino-games-batch-b-display-contract.test.ts',
  'apps/web/src/product/surfaces/games/__tests__/casino-games-batch-b-stages.test.tsx',
] as const;

export type ParsedMinesOutcome = {
  minePositions: number[];
  hitMine: boolean;
  /**
   * Authoritative reveal order — present on E23 live/progressive RPC
   * responses (`rpc_progressive_step`/`rpc_progressive_cashout` echo the
   * session's `revealedCells`), absent on one-shot `rpc_place_game_bet`
   * responses (engine `MinesResult` never carries it — see
   * `packages/game-engine/src/games/mines.ts`). Phase 1C fix: the stage must
   * prefer this over its own prop-derived `picked` state when present,
   * because a live mid-round reveal calls `playOutcome` in the same
   * synchronous tick as the prop update that would otherwise carry the
   * newly-revealed cell — reading `picked` there is one render stale and
   * drops exactly the cell that ended the round (most visibly on a mine
   * hit, where the busted tile then never gets the bold "you hit this"
   * treatment).
   */
  revealedCells?: number[];
};

export type ParsedHiloOutcome = {
  cards: number[];
  rounds: HiLoRound[];
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

const HILO_GUESSES = new Set<HiLoGuess>(['higher', 'lower', 'skip']);

/** Display-only parse of RPC `result` — never invents settlement. */
export function parseMinesOutcome(result: Record<string, unknown>): ParsedMinesOutcome | null {
  const minePositions = asIntArray(result['minePositions']);
  if (!minePositions) return null;
  if (minePositions.some((c) => c < 0 || c >= CASINO_MINES_GRID_SIZE)) return null;
  if (typeof result['hitMine'] !== 'boolean') return null;
  // Optional/live-only field — a malformed value degrades to "absent"
  // (stage falls back to its own picked-cells state) rather than failing
  // the whole parse, since minePositions/hitMine are still trustworthy.
  const rawRevealed = asIntArray(result['revealedCells']);
  const revealedCells =
    rawRevealed && rawRevealed.every((c) => c >= 0 && c < CASINO_MINES_GRID_SIZE)
      ? rawRevealed
      : undefined;
  return { minePositions, hitMine: result['hitMine'], revealedCells };
}

export function parseHiloOutcome(result: Record<string, unknown>): ParsedHiloOutcome | null {
  const cards = asIntArray(result['cards']);
  if (!cards || cards.length === 0) return null;
  if (cards.some((c) => c < 1 || c > 13)) return null;
  if (typeof result['won'] !== 'boolean') return null;
  const rawRounds = result['rounds'];
  if (!Array.isArray(rawRounds)) return null;
  const rounds: HiLoRound[] = [];
  for (const row of rawRounds) {
    if (!row || typeof row !== 'object') return null;
    const r = row as Record<string, unknown>;
    const card = asFiniteNumber(r['card']);
    const guess = r['guess'];
    const multiplier = asFiniteNumber(r['multiplier']);
    if (card === null || card < 1 || card > 13) return null;
    if (typeof guess !== 'string' || !HILO_GUESSES.has(guess as HiLoGuess)) return null;
    if (typeof r['correct'] !== 'boolean') return null;
    if (multiplier === null) return null;
    rounds.push({
      card,
      guess: guess as HiLoGuess,
      correct: r['correct'],
      multiplier,
    });
  }
  return { cards, rounds, won: result['won'] };
}

/** Cascade step delay — reduced-motion callers skip to 0. */
export function minesCascadeStepMs(revealCount: number): number {
  const n = Math.max(1, revealCount);
  return Math.min(160, Math.max(80, Math.round(900 / n)));
}

export function hiloFlipStepMs(): number {
  return 280;
}

export type ParsedHiloProgressiveOutcome = {
  cards: number[];
  guesses: HiLoGuess[];
  multiplier: number;
  won: boolean;
};

/**
 * Display-only parse of the E23 progressive/live `public_state` shape —
 * `{cards, guesses, multiplier, lastCorrect, cashedOut?}`
 * (`rpc_progressive_step`/`rpc_progressive_cashout`,
 * `20260810000001_ew_e23_casino_live.sql`) — distinct from the one-shot RPC
 * result shape `{cards, rounds, won}` that `parseHiloOutcome` handles above.
 * Phase 1C functional QA fix: `HiloStage.playOutcome` previously only tried
 * `parseHiloOutcome`, which returns null on this shape (no `rounds`/`won`
 * keys) — the settle flip animation silently no-op'd for every live hilo
 * round (bust, cash-out, or expiry).
 *
 * `won` is derived from `cashedOut === true` only: a busted step never sets
 * `cashedOut` (settles with multiplier 0), and an expired session is forced
 * to multiplier 0 without setting `cashedOut` either (its `lastCorrect` can
 * still be stale-`true` from the last successful guess) — so `cashedOut ===
 * true` is the only state where the round actually settled with payout >
 * stake (`rpc_progressive_cashout` guards `current_multiplier > 1` before
 * allowing it), matching what `CasinoGameShell.applyProgressiveResult`
 * already treats as "won" for the settle presentation
 * (`status === 'cashed_out' || Number(payout) > 0`).
 */
export function parseHiloProgressiveOutcome(
  result: Record<string, unknown>,
): ParsedHiloProgressiveOutcome | null {
  const cards = asIntArray(result['cards']);
  if (!cards || cards.length === 0) return null;
  if (cards.some((c) => c < 1 || c > 13)) return null;
  const rawGuesses = result['guesses'];
  if (!Array.isArray(rawGuesses)) return null;
  const guesses: HiLoGuess[] = [];
  for (const g of rawGuesses) {
    if (typeof g !== 'string' || !HILO_GUESSES.has(g as HiLoGuess)) return null;
    guesses.push(g as HiLoGuess);
  }
  const multiplier = asFiniteNumber(result['multiplier']);
  if (multiplier === null) return null;
  return { cards, guesses, multiplier, won: result['cashedOut'] === true };
}

export function formatHiloRank(card: number): string {
  if (card === 1) return 'A';
  if (card === 11) return 'J';
  if (card === 12) return 'Q';
  if (card === 13) return 'K';
  if (card >= 2 && card <= 10) return String(card);
  return '—';
}

export function assertCasinoGamesBatchBContractSync(): void {
  if (P10_GAMES_BATCH_B_TODO !== 'p10-games-batch-b') {
    throw new Error('casino-games-batch-b: owner todo id drift');
  }
  if (!P10_GAMES_BATCH_B_PREREQUISITE_TODOS.includes(P10_CASINO_REPLAY_AND_INFRA_TODO)) {
    throw new Error('casino-games-batch-b: missing p10-casino-replay-and-infra prerequisite');
  }
  if (!P10_GAMES_BATCH_B_PREREQUISITE_TODOS.includes(P10_GAMES_BATCH_A_TODO)) {
    throw new Error('casino-games-batch-b: missing p10-games-batch-a prerequisite');
  }
  if (CASINO_BATCH_B_GAME_CODES.length !== 2) {
    throw new Error('casino-games-batch-b: expected mines·hilo');
  }
  for (const code of CASINO_BATCH_B_GAME_CODES) {
    if (!(code in CASINO_BATCH_B_L1_SPECS)) {
      throw new Error(`casino-games-batch-b: missing L1 spec for ${code}`);
    }
    if (CASINO_BATCH_B_L1_SPECS[code].touchMinPx < 48) {
      throw new Error(`casino-games-batch-b: ${code} touch target below 48px`);
    }
  }
  const mines = parseMinesOutcome({ minePositions: [0, 6, 12], hitMine: true });
  if (!mines?.hitMine || mines.minePositions.length !== 3) {
    throw new Error('casino-games-batch-b: mines parse drift');
  }
  const hilo = parseHiloOutcome({
    cards: [7, 3],
    rounds: [{ card: 7, guess: 'higher', correct: false, multiplier: 0 }],
    won: false,
  });
  if (!hilo || hilo.won || hilo.rounds.length !== 1) {
    throw new Error('casino-games-batch-b: hilo parse drift');
  }
  if (formatHiloRank(1) !== 'A' || formatHiloRank(13) !== 'K') {
    throw new Error('casino-games-batch-b: rank format drift');
  }
  const hiloLive = parseHiloProgressiveOutcome({
    cards: [7, 9],
    guesses: ['higher'],
    multiplier: '1.480000',
    lastCorrect: true,
  });
  if (!hiloLive || hiloLive.won || hiloLive.guesses.length !== 1 || hiloLive.multiplier !== 1.48) {
    throw new Error('casino-games-batch-b: hilo progressive parse drift');
  }
  const hiloLiveCashout = parseHiloProgressiveOutcome({
    cards: [7, 9],
    guesses: ['higher'],
    multiplier: '1.480000',
    lastCorrect: true,
    cashedOut: true,
  });
  if (!hiloLiveCashout?.won) {
    throw new Error('casino-games-batch-b: hilo progressive cashedOut->won drift');
  }
}
