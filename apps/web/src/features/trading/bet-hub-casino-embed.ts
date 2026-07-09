import {
  HOT_LOBBY_GAME_IDS,
  SEARCH_INDEX,
  type SearchIndexEntry,
} from '@/data/casino-search-index';

export const BET_HUB_CASINO_EMBED_PREVIEW_LIMIT = 4;

export type BetHubCasinoEmbedMetrics = {
  hotCount: number;
  originalsCount: number;
  gamesCount: number;
};

export type BetHubCasinoEmbedPreviewEntry = Pick<
  SearchIndexEntry,
  'id' | 'to' | 'nameKey' | 'rtp' | 'live'
>;

/** Display-only counts for BetHub casino summary embed. */
export function computeBetHubCasinoEmbedMetrics(
  index: readonly SearchIndexEntry[] = SEARCH_INDEX,
): BetHubCasinoEmbedMetrics {
  return {
    hotCount: index.filter((entry) => entry.categories.includes('hot')).length,
    originalsCount: index.filter((entry) => entry.categories.includes('originals')).length,
    gamesCount: index.length,
  };
}

/** Hot lobby priority; read-only preview rows (no bet placement). */
export function pickBetHubCasinoEmbedPreview(
  index: readonly SearchIndexEntry[] = SEARCH_INDEX,
  limit = BET_HUB_CASINO_EMBED_PREVIEW_LIMIT,
): BetHubCasinoEmbedPreviewEntry[] {
  const byId = new Map(index.map((entry) => [entry.id, entry]));
  const picked: BetHubCasinoEmbedPreviewEntry[] = [];

  for (const id of HOT_LOBBY_GAME_IDS) {
    const entry = byId.get(id);
    if (!entry) continue;
    picked.push({
      id: entry.id,
      to: entry.to,
      nameKey: entry.nameKey,
      rtp: entry.rtp,
      live: entry.live,
    });
    if (picked.length >= limit) break;
  }

  return picked;
}
