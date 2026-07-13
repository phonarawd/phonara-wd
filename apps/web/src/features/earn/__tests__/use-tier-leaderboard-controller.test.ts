import { describe, expect, it } from 'vitest';

import { parseTierLeaderboard } from '@/domain/tier-leaderboard-display-contract';

describe('use-tier-leaderboard-controller', () => {
  it('parses tier leaderboard RPC payload', () => {
    const parsed = parseTierLeaderboard({
      ok: true,
      limit: 10,
      generated_at: '2026-07-12T00:00:00Z',
      entries: [
        {
          rank: 1,
          display_name: 'A***',
          tier: 'platinum',
          xp: 9000,
          is_self: false,
        },
      ],
      self: null,
    });

    expect(parsed?.entries[0]?.tier).toBe('platinum');
    expect(parsed?.entries[0]?.xp).toBe(9000);
  });
});
