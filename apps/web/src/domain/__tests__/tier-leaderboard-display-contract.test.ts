import { describe, expect, it } from 'vitest';

import {
  parseTierLeaderboard,
  TIER_LEADERBOARD_ROUTE,
  isTierLeaderboardRankListLive,
} from '../tier-leaderboard-display-contract';

describe('tier-leaderboard-display-contract', () => {
  it('binds canonical route and live unlock', () => {
    expect(TIER_LEADERBOARD_ROUTE).toBe('/tier/leaderboard');
    expect(isTierLeaderboardRankListLive()).toBe(true);
  });

  it('parses tier leaderboard without inventing money fields', () => {
    const parsed = parseTierLeaderboard({
      ok: true,
      limit: 50,
      generated_at: '2026-07-12T00:00:00Z',
      entries: [
        {
          rank: 1,
          display_name: 'Player***',
          tier: 'gold',
          xp: 1200,
          is_self: false,
        },
      ],
      self: {
        rank: 8,
        display_name: 'You***',
        tier: 'silver',
        xp: 400,
        is_self: true,
      },
    });

    expect(parsed?.entries).toHaveLength(1);
    expect(parsed?.entries[0]?.xp).toBe(1200);
    expect(parsed?.entries[0]?.tier).toBe('gold');
    expect(parsed?.self?.rank).toBe(8);
  });
});
