/**
 * P10 Casino lobby — `/casino` Stake-style grid (§23 · YAML #203).
 * ENGINE:exists — game registry (12 codes) · path helper → `/games/$gameCode`.
 * Play surfaces / AutoBet / PF verifier = later todos (CasinoR#1 · batches · fairness).
 */

import type { GameCode } from '@phonara/game-engine';
import type { MessageKey } from '@phonara/i18n';

import { CASINO_HUB_ROUTE } from './tournaments-pf-admin-display-contract';

export const P10_PAGE_CASINO_TODO = 'p10-page-casino' as const;

export const P10_PAGE_CASINO_PREREQUISITE_TODOS = [
  'p10-sports-rules-and-vip-stub',
] as const;

/** Next YAML after lobby — shell + replay + AutoBet. */
export const P10_CASINO_REPLAY_AND_INFRA_TODO = 'p10-casino-replay-and-infra' as const;

/** PF browser verifier — lobby CTA stays disabled until this todo. */
export const P10_PAGE_CASINO_FAIRNESS_TODO = 'p10-page-casino-fairness' as const;

export const CASINO_LOBBY_ROUTE = CASINO_HUB_ROUTE;
export const CASINO_FAIRNESS_ROUTE = '/casino/fairness' as const;
export const CASINO_GAMES_ROUTE_PREFIX = '/games/' as const;

export const CASINO_LOBBY_ROUTE_OWNER = 'casino.tsx' as const;
export const CASINO_LOBBY_SURFACE_OWNER = 'casino-lobby-page.tsx' as const;

export const CASINO_LOBBY_SURFACE_OWNERS = [CASINO_LOBBY_SURFACE_OWNER] as const;

export const CASINO_LOBBY_ENGINE_STATUS = 'exists' as const;
export const CASINO_LOBBY_EXPOSURE = 'live' as const;

/** Plan §12.19.3 / §23 lobby chips — Originals · Slots · Table · Live. */
export const CASINO_LOBBY_CATEGORY_CHIPS = [
  'originals',
  'slots',
  'table',
  'live',
] as const;

export type CasinoLobbyCategoryChip = (typeof CASINO_LOBBY_CATEGORY_CHIPS)[number];

export const CASINO_LOBBY_CATEGORY_LABEL_KEYS = {
  originals: 'casino.tabs.originals',
  slots: 'casino.tabs.slots',
  table: 'casino.tabs.table',
  live: 'casino.tabs.live',
} as const satisfies Record<CasinoLobbyCategoryChip, MessageKey>;

/**
 * Lobby taxonomy (presentation SOT) — engine codes use underscore.
 * Table + Live both surface blackjack/roulette until live-dealer engine (E23).
 */
export const CASINO_LOBBY_CATEGORY_GAME_CODES: Record<
  CasinoLobbyCategoryChip,
  readonly GameCode[]
> = {
  originals: [
    'crash',
    'limbo',
    'dice',
    'mines',
    'hilo',
    'plinko',
    'deepshaft',
    'momentum',
  ],
  slots: ['mint_reels', 'gold_rush'],
  table: ['blackjack', 'roulette'],
  live: ['blackjack', 'roulette'],
};

/** Featured rail — Crash · Plinko · Mines (hub featured slides). */
export const CASINO_LOBBY_FEATURED_GAME_CODES = [
  'crash',
  'plinko',
  'mines',
] as const satisfies readonly GameCode[];

export const CASINO_LOBBY_SEO_TITLE_KEY = 'seo.casino.hub.title' as const satisfies MessageKey;
export const CASINO_LOBBY_HERO_TITLE_KEY = 'casino.hub.hero.title' as const satisfies MessageKey;
export const CASINO_LOBBY_HERO_DESC_KEY = 'casino.hub.hero.desc' as const satisfies MessageKey;
export const CASINO_LOBBY_FEATURED_TITLE_KEY =
  'casino.hub.featured.sectionTitle' as const satisfies MessageKey;
export const CASINO_LOBBY_GRID_TITLE_KEY =
  'casino.hub.grid.sectionTitle' as const satisfies MessageKey;
export const CASINO_LOBBY_BALANCE_LABEL_KEY =
  'casino.hub.balance.label' as const satisfies MessageKey;
export const CASINO_LOBBY_PF_DEFERRED_REASON_KEY =
  'casino.hub.pf.deferred' as const satisfies MessageKey;

/** Canonical play path — `/games/$gameCode` (§12.11 · §23.1 · §26-6). */
export function casinoLobbyGamePath(code: GameCode): `${typeof CASINO_GAMES_ROUTE_PREFIX}${string}` {
  return `${CASINO_GAMES_ROUTE_PREFIX}${code.replace(/_/g, '-')}`;
}

export function isCasinoLobbyCategoryChip(value: string): value is CasinoLobbyCategoryChip {
  return (CASINO_LOBBY_CATEGORY_CHIPS as readonly string[]).includes(value);
}

export function filterCasinoLobbyGamesByCategory(
  codes: readonly GameCode[],
  category: CasinoLobbyCategoryChip | 'all',
): GameCode[] {
  if (category === 'all') return [...codes];
  const allowed = new Set<GameCode>(CASINO_LOBBY_CATEGORY_GAME_CODES[category]);
  return codes.filter((code) => allowed.has(code));
}

export function resolveCasinoLobbyPfCtaEnabled(): boolean {
  return false;
}

export function assertCasinoLobbyDisplayContractSync(): void {
  if (P10_PAGE_CASINO_TODO !== 'p10-page-casino') {
    throw new Error('casino-lobby: owner todo id drift');
  }
  if (!P10_PAGE_CASINO_PREREQUISITE_TODOS.includes('p10-sports-rules-and-vip-stub')) {
    throw new Error('casino-lobby: Sports#4 prerequisite missing');
  }
  if (CASINO_LOBBY_ROUTE !== '/casino') {
    throw new Error('casino-lobby: hub route must stay /casino');
  }
  if (CASINO_FAIRNESS_ROUTE !== '/casino/fairness') {
    throw new Error('casino-lobby: fairness route drift');
  }
  if (CASINO_LOBBY_CATEGORY_CHIPS.length !== 4) {
    throw new Error('casino-lobby: expected 4 category chips');
  }
  if (CASINO_LOBBY_FEATURED_GAME_CODES.length !== 3) {
    throw new Error('casino-lobby: expected 3 featured games');
  }
  for (const code of CASINO_LOBBY_FEATURED_GAME_CODES) {
    if (!casinoLobbyGamePath(code).startsWith(CASINO_GAMES_ROUTE_PREFIX)) {
      throw new Error(`casino-lobby: featured path must use /games/ (${code})`);
    }
  }
  if (resolveCasinoLobbyPfCtaEnabled()) {
    throw new Error('casino-lobby: PF CTA must stay disabled until fairness todo');
  }
}
