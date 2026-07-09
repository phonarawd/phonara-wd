import { describe, expect, it } from 'vitest';
import type { SearchIndexEntry } from '@/data/casino-search-index';
import {
  BET_HUB_CASINO_EMBED_PREVIEW_LIMIT,
  computeBetHubCasinoEmbedMetrics,
  pickBetHubCasinoEmbedPreview,
} from '../bet-hub-casino-embed';

function entry(
  partial: Partial<SearchIndexEntry> & Pick<SearchIndexEntry, 'id'>,
): SearchIndexEntry {
  return {
    to: `/casino/${partial.id}`,
    nameKey: `casino.game.${partial.id}.name`,
    nameAscii: partial.id ?? 'game',
    poster: '',
    rtp: 97,
    live: 100,
    tone: 'primary',
    aliasKeys: [],
    asciiAliases: [],
    categories: ['all'],
    ...partial,
  };
}

describe('bet-hub-casino-embed', () => {
  it('computes hot, originals, and total game counts', () => {
    const metrics = computeBetHubCasinoEmbedMetrics([
      entry({ id: 'crash', categories: ['all', 'hot', 'originals'] }),
      entry({ id: 'plinko', categories: ['all', 'hot', 'originals'] }),
      entry({ id: 'roulette', categories: ['all', 'live'] }),
    ]);

    expect(metrics.hotCount).toBe(2);
    expect(metrics.originalsCount).toBe(2);
    expect(metrics.gamesCount).toBe(3);
  });

  it('prioritizes hot lobby ids for preview rows', () => {
    const index = [
      entry({ id: 'roulette', categories: ['all', 'live'] }),
      entry({ id: 'crash', categories: ['all', 'hot', 'originals'], rtp: 99, live: 240 }),
      entry({ id: 'plinko', categories: ['all', 'hot', 'originals'], rtp: 98, live: 180 }),
      entry({ id: 'mines', categories: ['all', 'hot', 'originals'] }),
    ];

    const preview = pickBetHubCasinoEmbedPreview(index);

    expect(preview.map((row) => row.id)).toEqual(['crash', 'plinko', 'mines']);
    expect(preview[0]).toMatchObject({ rtp: 99, live: 240 });
  });

  it('caps preview rows at the embed limit', () => {
    const index = Array.from({ length: BET_HUB_CASINO_EMBED_PREVIEW_LIMIT + 2 }, (_, index) =>
      entry({
        id: (['crash', 'plinko', 'mines', 'dice', 'limbo', 'hilo'] as const)[index] ?? 'dice',
        categories: ['all', 'hot', 'originals'],
      }),
    );

    expect(pickBetHubCasinoEmbedPreview(index)).toHaveLength(BET_HUB_CASINO_EMBED_PREVIEW_LIMIT);
  });
});
