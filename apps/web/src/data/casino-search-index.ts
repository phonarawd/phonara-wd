/**
 * P1.4 — Casino search index (presentation-only).
 *
 * Derived from casino-game-meta. ASCII only — Hangul aliases live in
 * src/i18n/ko.ts under the corresponding aliasKeys; rendering code is
 * responsible for resolving aliasKeys via t() before handing the merged
 * string to cmdk's matcher. This file MUST stay ASCII so §GREEN rg gate
 * does not regress.
 */

import type { CasinoCategory } from '@phonara/shared-types';
import { ALL_GAME_IDS, getGameMeta, type CasinoGameId } from '@/data/casino-game-meta';

export type SearchCategory = 'all' | 'hot' | 'originals' | 'live' | 'slots' | 'crash' | 'high-rtp';

export type SearchIndexEntry = {
  id: CasinoGameId;
  to: string;
  nameKey: string;
  nameAscii: string;
  poster: string;
  rtp: number;
  live: number;
  tone: string;
  /** i18n keys → resolve via t() to feed cmdk matcher. ASCII keys only. */
  aliasKeys: readonly string[];
  /** Plain ASCII aliases (English variants) — safe to embed directly. */
  asciiAliases: readonly string[];
  /** Membership in category chips. */
  categories: readonly SearchCategory[];
};

/** Per-game alias key list. Hangul values live in i18n/ko.ts. */
const ALIAS_KEYS: Record<CasinoGameId, readonly string[]> = {
  crash: [
    'casino.search.alias.crash.plane',
    'casino.search.alias.crash.rocket',
    'casino.search.alias.crash.multi',
  ],
  plinko: ['casino.search.alias.plinko.ball', 'casino.search.alias.plinko.drop'],
  mines: ['casino.search.alias.mines.bomb', 'casino.search.alias.mines.field'],
  dice: ['casino.search.alias.dice.roll'],
  limbo: ['casino.search.alias.limbo.over', 'casino.search.alias.limbo.target'],
  hilo: ['casino.search.alias.hilo.card', 'casino.search.alias.hilo.highlow'],
  blackjack: ['casino.search.alias.blackjack.twentyone', 'casino.search.alias.blackjack.bj'],
  roulette: ['casino.search.alias.roulette.wheel', 'casino.search.alias.roulette.red'],
  'gold-rush': ['casino.search.alias.goldRush.slot', 'casino.search.alias.goldRush.gold'],
  'mint-reels': ['casino.search.alias.mintReels.reels', 'casino.search.alias.mintReels.fresh'],
  deepshaft: ['casino.search.alias.deepshaft.shaft', 'casino.search.alias.deepshaft.mine'],
  momentum: ['casino.search.alias.momentum.combo', 'casino.search.alias.momentum.chain'],
};

/** ASCII English variants embedded directly (search keyword fallback). */
const ASCII_ALIASES: Record<CasinoGameId, readonly string[]> = {
  crash: ['krash', 'plane', 'rocket', 'multi', 'multiplier'],
  plinko: ['plonko', 'ball', 'drop', 'pegs'],
  mines: ['mine', 'bomb', 'minesweeper'],
  dice: ['roll', 'd6'],
  limbo: ['over', 'target'],
  hilo: ['hi lo', 'highlow', 'high low', 'cards'],
  blackjack: ['bj', '21', 'twenty one'],
  roulette: ['wheel', 'red black', 'european'],
  'gold-rush': ['gold', 'rush', 'slot'],
  'mint-reels': ['mint', 'reels', 'fresh'],
  deepshaft: ['deepshaft', 'shaft', 'mine ore', 'depth', 'cave'],
  momentum: ['momentum', 'combo', 'chain', 'streak', 'bank'],
};

const CATEGORIES: Record<CasinoGameId, readonly SearchCategory[]> = {
  crash: ['all', 'hot', 'originals', 'crash', 'high-rtp'],
  plinko: ['all', 'hot', 'originals', 'high-rtp'],
  mines: ['all', 'hot', 'originals', 'high-rtp'],
  dice: ['all', 'originals', 'high-rtp'],
  limbo: ['all', 'originals', 'high-rtp'],
  hilo: ['all', 'originals', 'high-rtp'],
  blackjack: ['all', 'live', 'high-rtp'],
  roulette: ['all', 'live'],
  'gold-rush': ['all', 'slots', 'hot'],
  'mint-reels': ['all', 'slots'],
  deepshaft: ['all', 'originals', 'hot', 'high-rtp'],
  momentum: ['all', 'originals', 'hot', 'high-rtp'],
};

export const SEARCH_INDEX: readonly SearchIndexEntry[] = ALL_GAME_IDS.map((id) => {
  const m = getGameMeta(id);
  return {
    id,
    to: m.to,
    nameKey: m.nameKey,
    nameAscii: m.nameAscii,
    poster: m.poster,
    rtp: m.rtp,
    live: m.liveSeed,
    tone: m.tone,
    aliasKeys: ALIAS_KEYS[id],
    asciiAliases: ASCII_ALIASES[id],
    categories: CATEGORIES[id],
  } satisfies SearchIndexEntry;
});

/** Normalize a string for naive substring match: lowercase + strip spaces/punct. */
export function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-_.]+/g, '');
}

export const CATEGORY_ORDER: readonly SearchCategory[] = [
  'all',
  'hot',
  'originals',
  'live',
  'slots',
  'crash',
  'high-rtp',
];

export function categoryLabelKey(c: SearchCategory): string {
  return `casino.search.cat.${c.replace('-', '_')}`;
}

/** Lobby tab strip (`CasinoCategoryTabs`) — distinct from cmdk search categories. */
const LOBBY_TABS: Record<CasinoGameId, readonly CasinoCategory[]> = {
  crash: ['originals', 'crash'],
  plinko: ['originals'],
  mines: ['originals'],
  dice: ['originals'],
  limbo: ['originals', 'crash'],
  hilo: ['originals'],
  blackjack: ['live', 'new'],
  roulette: ['live'],
  'gold-rush': ['slots'],
  'mint-reels': ['slots', 'new'],
  deepshaft: ['originals', 'new'],
  momentum: ['originals', 'new'],
};

/** Horizontal hot row on /casino?tab=hot — top originals by live seed. */
export const HOT_LOBBY_GAME_IDS: readonly CasinoGameId[] = [
  'crash',
  'plinko',
  'mines',
  'dice',
  'limbo',
  'hilo',
] as const;

export function filterLobbyByTab(tab: CasinoCategory): SearchIndexEntry[] {
  if (tab === 'hot') return [...SEARCH_INDEX];
  return SEARCH_INDEX.filter((e) => LOBBY_TABS[e.id].includes(tab));
}

export function getLobbyEntry(id: CasinoGameId): SearchIndexEntry {
  const entry = SEARCH_INDEX.find((e) => e.id === id);
  if (!entry) throw new Error(`lobby entry missing: ${id}`);
  return entry;
}
