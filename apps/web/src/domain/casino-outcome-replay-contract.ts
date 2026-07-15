/**
 * P10 CasinoR#1 — §23.2.1 one-shot replay contract + shell infra SOT (YAML #204).
 * Engine settles atomically; UI only replays RPC results — no fake mid-round cash-out.
 */

import { GAME_CODES, type GameCode } from '@phonara/game-engine';
import type { MessageKey } from '@phonara/i18n';
import { toDecimal } from '@phonara/money';

import { CASINO_GAMES_ROUTE_PREFIX, P10_PAGE_CASINO_TODO } from './casino-lobby-display-contract';
import { P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO } from './fiat-reference-display-contract';

export { P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO };

export const P10_CASINO_REPLAY_AND_INFRA_TODO = 'p10-casino-replay-and-infra' as const;

export const P10_CASINO_REPLAY_PREREQUISITE_TODOS = [P10_PAGE_CASINO_TODO] as const;

export const CASINO_GAME_SHELL_SURFACE_OWNER = 'casino-game-shell.tsx' as const;
export const CASINO_GAME_ROUTE_OWNER = 'games.$gameCode.tsx' as const;

export const CASINO_STAKE_CURRENCY_MATRIX_ID = 'casino-stake-currency' as const;
export const CASINO_STAKE_CURRENCY_EXPOSURE = 'live' as const;

export type CasinoEngineSemantics = 'one_shot';

export type CasinoWinTier = 'none' | 'small' | 'medium' | 'big' | 'mega';

export type CasinoOutcomeReplayRow = {
  readonly gameCode: GameCode;
  readonly engineSemantics: CasinoEngineSemantics;
  /** Inputs locked before bet RPC. */
  readonly inputPhase: string;
  /** Presentation-only replay after settle. */
  readonly replayPhase: string;
  /** Fake mid-round controls forbidden until E23. */
  readonly forbiddenUx: string;
};

/**
 * Plan §23.2.1 — 12 games · one-shot atomic settle · replay-only stage.
 */
export const CASINO_OUTCOME_REPLAY_CONTRACT = [
  {
    gameCode: 'crash',
    engineSemantics: 'one_shot',
    inputPhase: 'autoCashout multiplier before bet',
    replayPhase: 'curve rises to result then crash/cashout replay',
    forbiddenUx: 'live cash-out button during ascent (no mid-round RPC · E23)',
  },
  {
    gameCode: 'mines',
    engineSemantics: 'one_shot',
    inputPhase: 'mineCount + revealedCells[] before bet',
    replayPhase: 'tile cascade reveal in selection order',
    forbiddenUx: 'per-tile live reveal · mid-round cash-out (E23)',
  },
  {
    gameCode: 'hilo',
    engineSemantics: 'one_shot',
    inputPhase: 'guesses[] before bet',
    replayPhase: 'cards flip in guess order',
    forbiddenUx: 'per-card live betting (E23)',
  },
  {
    gameCode: 'blackjack',
    engineSemantics: 'one_shot',
    inputPhase: 'actions[] before bet (or default strategy)',
    replayPhase: 'deal + hit/stand sequence replay',
    forbiddenUx: 'live hit/stand server round-trips (E23)',
  },
  {
    gameCode: 'dice',
    engineSemantics: 'one_shot',
    inputPhase: 'target + direction before bet',
    replayPhase: 'roll + probability bar highlight',
    forbiddenUx: 'fake mid-state before RPC result',
  },
  {
    gameCode: 'limbo',
    engineSemantics: 'one_shot',
    inputPhase: 'target multiplier before bet',
    replayPhase: 'result vs target flash',
    forbiddenUx: 'fake mid-state before RPC result',
  },
  {
    gameCode: 'plinko',
    engineSemantics: 'one_shot',
    inputPhase: 'rows + risk before bet',
    replayPhase: 'ball path + bucket glow from RPC',
    forbiddenUx: 'fake mid-state before RPC result',
  },
  {
    gameCode: 'roulette',
    engineSemantics: 'one_shot',
    inputPhase: 'bet map before bet',
    replayPhase: 'sector highlight from RPC',
    forbiddenUx: 'fake mid-state before RPC result',
  },
  {
    gameCode: 'mint_reels',
    engineSemantics: 'one_shot',
    inputPhase: 'lines before bet',
    replayPhase: 'payline scan from RPC',
    forbiddenUx: 'fake mid-state before RPC result',
  },
  {
    gameCode: 'gold_rush',
    engineSemantics: 'one_shot',
    inputPhase: 'lines before bet',
    replayPhase: 'feature meter + bonus cue from RPC',
    forbiddenUx: 'fake mid-state before RPC result',
  },
  {
    gameCode: 'deepshaft',
    engineSemantics: 'one_shot',
    inputPhase: 'riskTier + targetDepth before bet',
    replayPhase: 'depth meter descent from RPC',
    forbiddenUx: 'fake mid-state before RPC result',
  },
  {
    gameCode: 'momentum',
    engineSemantics: 'one_shot',
    inputPhase: 'comboBefore + cashOut before bet',
    replayPhase: 'combo meter from RPC',
    forbiddenUx: 'fake mid-state before RPC result',
  },
] as const satisfies readonly CasinoOutcomeReplayRow[];

export const CASINO_WIN_TIER_LABEL_KEYS = {
  small: 'casino.win.tier.small',
  medium: 'casino.win.tier.medium',
  big: 'casino.win.tier.big',
  mega: 'casino.win.tier.mega',
} as const satisfies Record<Exclude<CasinoWinTier, 'none'>, MessageKey>;

/** Plan §3.3 — display-only ratio from RPC payout÷stake (Decimal). */
export function deriveCasinoWinTier(params: {
  status: 'won' | 'lost' | 'pending' | 'cancelled' | 'voided' | 'parity_hold' | string;
  payout: string;
  stake: string;
}): CasinoWinTier {
  if (params.status !== 'won') return 'none';
  const stake = toDecimal(params.stake, 'stake');
  if (stake.isZero()) return 'none';
  const payout = toDecimal(params.payout, 'payout');
  if (payout.lte(stake)) return 'none';
  const ratio = payout.div(stake);
  if (ratio.gte(100)) return 'mega';
  if (ratio.gte(20)) return 'big';
  if (ratio.gte(5)) return 'medium';
  return 'small';
}

export function shouldShowCasinoWinTierOverlay(tier: CasinoWinTier): boolean {
  return tier === 'big' || tier === 'mega';
}

export function casinoGameSlugFromCode(code: GameCode): string {
  return code.replace(/_/g, '-');
}

export function casinoGameCodeFromSlug(slug: string): GameCode | null {
  const code = slug.replace(/-/g, '_');
  return (GAME_CODES as readonly string[]).includes(code) ? (code as GameCode) : null;
}

export function casinoGamePlayPath(code: GameCode): `${typeof CASINO_GAMES_ROUTE_PREFIX}${string}` {
  return `${CASINO_GAMES_ROUTE_PREFIX}${casinoGameSlugFromCode(code)}`;
}

export function findCasinoOutcomeReplayRow(gameCode: GameCode): CasinoOutcomeReplayRow {
  const row = CASINO_OUTCOME_REPLAY_CONTRACT.find((entry) => entry.gameCode === gameCode);
  if (!row) {
    throw new Error(`casino-outcome-replay: missing contract for ${gameCode}`);
  }
  return row;
}

export function assertCasinoOutcomeReplayContractSync(): void {
  if (P10_CASINO_REPLAY_AND_INFRA_TODO !== 'p10-casino-replay-and-infra') {
    throw new Error('casino-outcome-replay: owner todo id drift');
  }
  if (!P10_CASINO_REPLAY_PREREQUISITE_TODOS.includes(P10_PAGE_CASINO_TODO)) {
    throw new Error('casino-outcome-replay: lobby prerequisite missing');
  }
  if (CASINO_OUTCOME_REPLAY_CONTRACT.length !== GAME_CODES.length) {
    throw new Error('casino-outcome-replay: expected 12 game rows');
  }
  for (const code of GAME_CODES) {
    const row = findCasinoOutcomeReplayRow(code);
    if (row.engineSemantics !== 'one_shot') {
      throw new Error(`casino-outcome-replay: ${code} must be one_shot`);
    }
    if (!row.forbiddenUx.trim()) {
      throw new Error(`casino-outcome-replay: ${code} missing forbiddenUx`);
    }
    if (!casinoGamePlayPath(code).startsWith(CASINO_GAMES_ROUTE_PREFIX)) {
      throw new Error(`casino-outcome-replay: path must use /games/ (${code})`);
    }
  }
  if (CASINO_STAKE_CURRENCY_EXPOSURE !== 'live') {
    throw new Error('casino-outcome-replay: stake currency must be live');
  }
  if (deriveCasinoWinTier({ status: 'won', payout: '50', stake: '10' }) !== 'medium') {
    throw new Error('casino-outcome-replay: win tier threshold drift');
  }
  if (deriveCasinoWinTier({ status: 'lost', payout: '0', stake: '10' }) !== 'none') {
    throw new Error('casino-outcome-replay: loss must be none tier');
  }
}
