import { describe, expect, it } from 'vitest';

import {
  REFERRAL_LEADERBOARD_ENGINE_TODO,
  REFERRAL_LEADERBOARD_ROUTE,
  REFERRAL_LEADERBOARD_UI_UNLOCK_TODO,
  resolveReferralLeaderboardBackRoute,
  shouldDeferReferralLeaderboard,
} from '../referral-leaderboard-display-contract';
import { PQA_DEAD_CONTROL_DEFER_REGISTRY } from '../dead-controls-display-contract';

describe('referral-leaderboard-display-contract', () => {
  it('defers until affiliate_rank_leaderboard engine exists', () => {
    expect(REFERRAL_LEADERBOARD_ROUTE).toBe('/referral/leaderboard');
    expect(shouldDeferReferralLeaderboard()).toBe(true);
    expect(resolveReferralLeaderboardBackRoute()).toBe('/referral');
    expect(REFERRAL_LEADERBOARD_ENGINE_TODO).toBe('ew-e3-gate-cms-promotions');
    expect(REFERRAL_LEADERBOARD_UI_UNLOCK_TODO).toBe('ew-e5-gap-surfaces-wire');
  });

  it('registers dead-control defer stub row', () => {
    const row = PQA_DEAD_CONTROL_DEFER_REGISTRY.find((item) => item.id === 'referral-leaderboard-stub');
    expect(row?.route).toBe(REFERRAL_LEADERBOARD_ROUTE);
    expect(row?.mitigatedBy).toBe('defer_stub');
  });
});
