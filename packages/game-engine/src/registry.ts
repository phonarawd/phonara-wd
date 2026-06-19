import type { ZodType } from 'zod';
import type { Decimal } from '@phonara/money';

/** Single source of truth for all casino game codes (existing + planned). */
export const GAME_CODES = [
  'crash',
  'limbo',
  'dice',
  'mines',
  'hilo',
  'plinko',
  'mint_reels',
  'gold_rush',
  'roulette',
  'blackjack',
  'deepshaft',
  'momentum',
] as const;

export type GameCode = (typeof GAME_CODES)[number];

/**
 * Single contract every game must implement.
 * New game = implement GameDefinition + register() = done.
 * The settlement core (SQL RPC, conservation logic, UI shell) never changes.
 */
export interface GameDefinition<Sel, Res> {
  readonly code: GameCode;
  /** Runtime-validated bet parameters (Zod schema) */
  readonly betSchema: ZodType<Sel>;
  /** Number of floats needed from floatStream for one round */
  readonly floatCount: number;
  /**
   * Pure, deterministic result derivation.
   * Takes the floats produced by floatStream and the selection, returns the outcome.
   * NO side-effects. NO async. Same inputs → same output (for PF verification).
   */
  resultFromFloats(floats: number[], selection: Sel): Res;
  /**
   * Settle a round: compute payout and house-edge leg.
   * Returns positive `payout` (amount returned to user) and `houseEdgeLeg`
   * (net house gain, may be negative on player win).
   * These two legs are the Σ=0 double-entry for the bet:
   *   user_debit(stake) + user_credit(payout) + system_credit(houseEdgeLeg) = 0
   *   (when payout > stake: system_credit is negative → insurance fund absorbs it)
   */
  settle(stake: Decimal, selection: Sel, result: Res): { payout: Decimal; houseEdgeLeg: Decimal };
  /** Optional closed-form RTP for harness verification (Decimal in [0,1] range as fraction). */
  theoreticalRtp?(selection?: Sel): Decimal;
  /** Max payout multiplier for exposure-cap checks (paytable / leg ceiling). */
  maxPayoutMultiplier?(selection: Sel): number;
}

// Mutable registry — populated by each game module at import time.
const _registry = new Map<GameCode, GameDefinition<unknown, unknown>>();

export function registerGame<Sel, Res>(def: GameDefinition<Sel, Res>): void {
  _registry.set(def.code, def as GameDefinition<unknown, unknown>);
}

export function getGame<Sel = unknown, Res = unknown>(code: GameCode): GameDefinition<Sel, Res> {
  const game = _registry.get(code);
  if (!game) throw new Error(`Game not registered: ${code}`);
  return game as GameDefinition<Sel, Res>;
}

export function listGames(): GameCode[] {
  return [..._registry.keys()];
}

export function isRegisteredGame(code: string): code is GameCode {
  return _registry.has(code as GameCode);
}

export const GAME_REGISTRY = {
  register: registerGame,
  get: getGame,
  list: listGames,
};
