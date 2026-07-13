import { describe, expect, it } from 'vitest';
import { GAME_CODES } from '@phonara/game-engine';

import { casinoGamePath } from '@/features/casino/game-config';
import {
  assertCasinoLobbyDisplayContractSync,
  CASINO_FAIRNESS_ROUTE,
  CASINO_LOBBY_CATEGORY_CHIPS,
  CASINO_LOBBY_EXPOSURE,
  CASINO_LOBBY_FEATURED_GAME_CODES,
  CASINO_LOBBY_ROUTE,
  casinoLobbyGamePath,
  filterCasinoLobbyGamesByCategory,
  P10_CASINO_REPLAY_AND_INFRA_TODO,
  P10_PAGE_CASINO_FAIRNESS_TODO,
  P10_PAGE_CASINO_PREREQUISITE_TODOS,
  P10_PAGE_CASINO_TODO,
  resolveCasinoLobbyPfCtaEnabled,
} from '../casino-lobby-display-contract';

describe('casino-lobby-display-contract (p10-page-casino)', () => {
  it('locks owner todo, Sports#4 prerequisite, and live lobby exposure', () => {
    assertCasinoLobbyDisplayContractSync();
    expect(P10_PAGE_CASINO_TODO).toBe('p10-page-casino');
    expect(P10_PAGE_CASINO_PREREQUISITE_TODOS).toContain('p10-sports-rules-and-vip-stub');
    expect(P10_CASINO_REPLAY_AND_INFRA_TODO).toBe('p10-casino-replay-and-infra');
    expect(P10_PAGE_CASINO_FAIRNESS_TODO).toBe('p10-page-casino-fairness');
    expect(CASINO_LOBBY_ROUTE).toBe('/casino');
    expect(CASINO_FAIRNESS_ROUTE).toBe('/casino/fairness');
    expect(CASINO_LOBBY_EXPOSURE).toBe('live');
  });

  it('maps all 12 engine codes to canonical /games/$gameCode paths', () => {
    expect(GAME_CODES).toHaveLength(12);
    for (const code of GAME_CODES) {
      const path = casinoLobbyGamePath(code);
      expect(path).toBe(casinoGamePath(code));
      expect(path.startsWith('/games/')).toBe(true);
      expect(path.includes('_')).toBe(false);
      expect(path).not.toMatch(/^\/casino\//);
    }
    expect(casinoLobbyGamePath('dice')).toBe('/games/dice');
    expect(casinoLobbyGamePath('mint_reels')).toBe('/games/mint-reels');
    expect(casinoLobbyGamePath('gold_rush')).toBe('/games/gold-rush');
  });

  it('filters Originals · Slots · Table · Live chips without dropping registry coverage', () => {
    expect(CASINO_LOBBY_CATEGORY_CHIPS).toEqual(['originals', 'slots', 'table', 'live']);
    expect(CASINO_LOBBY_FEATURED_GAME_CODES).toEqual(['crash', 'plinko', 'mines']);

    const originals = filterCasinoLobbyGamesByCategory(GAME_CODES, 'originals');
    const slots = filterCasinoLobbyGamesByCategory(GAME_CODES, 'slots');
    const table = filterCasinoLobbyGamesByCategory(GAME_CODES, 'table');
    const live = filterCasinoLobbyGamesByCategory(GAME_CODES, 'live');
    const all = filterCasinoLobbyGamesByCategory(GAME_CODES, 'all');

    expect(all).toHaveLength(12);
    expect(originals).toContain('crash');
    expect(originals).not.toContain('blackjack');
    expect(slots).toEqual(['mint_reels', 'gold_rush']);
    expect(table).toEqual(['roulette', 'blackjack']);
    expect(live).toEqual(['roulette', 'blackjack']);
    expect(resolveCasinoLobbyPfCtaEnabled()).toBe(true);
  });
});
