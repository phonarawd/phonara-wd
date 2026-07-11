import { describe, expect, it } from 'vitest';

import {
  isReferralLeaderboardRankListLive,
  parseAffiliateRankLeaderboard,
  REFERRAL_LEADERBOARD_ENGINE_TODO,
  REFERRAL_LEADERBOARD_ROUTE,
  REFERRAL_LEADERBOARD_UI_UNLOCK_TODO,
  resolveReferralLeaderboardBackRoute,
  shouldDeferReferralLeaderboard,
} from '../referral-leaderboard-display-contract';
import { PQA_DEAD_CONTROL_DEFER_REGISTRY } from '../dead-controls-display-contract';

describe('referral-leaderboard-display-contract', () => {
  it('GATE unlocks referralLeaderboardLive — E5 rank list is live', () => {
    expect(REFERRAL_LEADERBOARD_ROUTE).toBe('/referral/leaderboard');
    expect(shouldDeferReferralLeaderboard()).toBe(false);
    expect(isReferralLeaderboardRankListLive()).toBe(true);
    expect(resolveReferralLeaderboardBackRoute()).toBe('/referral');
    expect(REFERRAL_LEADERBOARD_ENGINE_TODO).toBe('ew-e3-gate-cms-promotions');
    expect(REFERRAL_LEADERBOARD_UI_UNLOCK_TODO).toBe('ew-e5-gap-surfaces-wire');
  });

  it('registers dead-control row as live after E5 rank wire', () => {
    const row = PQA_DEAD_CONTROL_DEFER_REGISTRY.find(
      (item) => item.id === 'referral-leaderboard-stub',
    );
    expect(row?.route).toBe(REFERRAL_LEADERBOARD_ROUTE);
    expect(row?.mitigatedBy).toBe('live');
    expect(row?.uiUnlockTodo).toBe(REFERRAL_LEADERBOARD_UI_UNLOCK_TODO);
  });

  it('parses affiliate rank leaderboard without inventing money fields', () => {
    const snap = parseAffiliateRankLeaderboard({
      ok: true,
      window: '7d',
      limit: 50,
      generated_at: '2026-07-11T00:00:00Z',
      entries: [
        { rank: 1, display_name: 'ab***', qualified_count: 12, is_self: false },
        { rank: 2, display_name: 'cd***', qualified_count: 5, is_self: true },
      ],
      self: { rank: 2, display_name: 'cd***', qualified_count: 5, is_self: true },
    });
    expect(snap?.window).toBe('7d');
    expect(snap?.entries).toHaveLength(2);
    expect(snap?.entries[0]).toEqual({
      rank: 1,
      displayName: 'ab***',
      qualifiedCount: 12,
      isSelf: false,
    });
    expect(snap?.self?.rank).toBe(2);
    expect(JSON.stringify(snap)).not.toMatch(/reward|payout|phon|usdt|money/i);
  });
});
