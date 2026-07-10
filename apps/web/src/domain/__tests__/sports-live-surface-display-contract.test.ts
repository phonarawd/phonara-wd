import { describe, expect, it } from 'vitest';

import {
  assertSportsLiveSurfaceDisplayContractSync,
  formatSportsLiveScore,
  isSportsLiveInPlayStatus,
  isSportsLiveSuspendedUntil,
  parseSportsLiveFixtureState,
  P10_SPORTS_LIVE_PREREQUISITE_TODOS,
  P10_SPORTS_LIVE_SURFACE_TODO,
  resolveSportsLiveSuspendKind,
  resolveSportsLiveSuspendMessageKey,
  SPORTS_LIVE_BANNER_OWNER,
  SPORTS_LIVE_REALTIME_HOOK,
  SPORTS_LIVE_STATE_HOOK,
  SPORTS_LIVE_STATE_RPC,
  SPORTS_LIVE_SURFACE_ROUTE,
} from '../sports-live-surface-display-contract';

describe('sports-live-surface-display-contract Sports#2', () => {
  it('locks Sports#2 owner todo and parity prerequisite', () => {
    expect(P10_SPORTS_LIVE_SURFACE_TODO).toBe('p10-sports-live-surface-wire');
    expect(P10_SPORTS_LIVE_PREREQUISITE_TODOS).toContain('p10-sports-parity-contract-and-board');
    expect(SPORTS_LIVE_SURFACE_ROUTE).toBe('/sports/live');
    expect(SPORTS_LIVE_STATE_RPC).toBe('rpc_get_live_fixture_state');
    expect(SPORTS_LIVE_STATE_HOOK).toBe('useLiveFixtureState');
    expect(SPORTS_LIVE_REALTIME_HOOK).toBe('useSportsRealtime');
    expect(SPORTS_LIVE_BANNER_OWNER).toBe('sports-live-inplay-banner.tsx');
  });

  it('parses live fixture state from RPC payload', () => {
    const state = parseSportsLiveFixtureState({
      fixture_id: 'fx-1',
      league_code: 'epl',
      home_name: 'Arsenal',
      away_name: 'Chelsea',
      kickoff_at: '2026-07-10T15:00:00.000Z',
      status: 'live',
      suspended_until: null,
      suspend_reason: null,
      result_home_goals: 1,
      result_away_goals: 0,
      markets: [
        {
          market_id: 'm-1',
          market_type: 'match_1x2',
          status: 'open',
          suspended_until: null,
          suspend_reason: null,
        },
      ],
    });
    expect(state?.fixture_id).toBe('fx-1');
    expect(formatSportsLiveScore(state?.result_home_goals, state?.result_away_goals)).toBe('1–0');
    expect(isSportsLiveInPlayStatus(state?.status)).toBe(true);
  });

  it('detects fixture and goal suspend banners', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const fixtureSuspend = parseSportsLiveFixtureState({
      fixture_id: 'fx-1',
      home_name: 'A',
      away_name: 'B',
      status: 'live',
      suspended_until: future,
      suspend_reason: 'admin_hold',
      result_home_goals: 0,
      result_away_goals: 0,
      markets: [],
    });
    expect(resolveSportsLiveSuspendKind(fixtureSuspend)).toBe('fixture');
    expect(resolveSportsLiveSuspendMessageKey('fixture')).toBe('sports.live.marketSuspend');

    const goalSuspend = parseSportsLiveFixtureState({
      fixture_id: 'fx-2',
      home_name: 'A',
      away_name: 'B',
      status: 'live',
      suspended_until: future,
      suspend_reason: 'goal_event',
      result_home_goals: 1,
      result_away_goals: 0,
      markets: [],
    });
    expect(resolveSportsLiveSuspendKind(goalSuspend)).toBe('goal');
    expect(resolveSportsLiveSuspendMessageKey('goal')).toBe('sports.live.goalSuspend');
  });

  it('treats expired suspend timestamps as inactive', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isSportsLiveSuspendedUntil(past)).toBe(false);
    expect(isSportsLiveSuspendedUntil(null)).toBe(false);
  });

  it('assertSportsLiveSurfaceDisplayContractSync passes', () => {
    expect(() => assertSportsLiveSurfaceDisplayContractSync()).not.toThrow();
  });
});
