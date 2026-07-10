import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import type { SportsFixtureSummary } from '../use-sports-betting';
import {
  applySportsOddsInsertPatch,
  fixturePatchFromRealtimeRow,
  oddsPatchFromRealtimeRow,
  patchSportsFixtureLists,
  patchSportsOddsInFixtureLists,
  patchSportsOddsInMarkets,
  patchSportsLiveState,
  removeSportsFixtureFromLists,
} from '../sports-realtime-cache';
import type { SportsMarketSummary } from '../use-sports-betting';

describe('sports-realtime-cache', () => {
  it('patches fixture status in all fixture list caches', () => {
    const qc = new QueryClient();
    qc.setQueryData(['sports', 'fixtures', 'epl', 'live'], [
      {
        fixture_id: 'f1',
        league_code: 'epl',
        home_name: 'A',
        away_name: 'B',
        kickoff_at: '2026-06-26T15:00:00.000Z',
        status: 'scheduled',
      },
    ] satisfies SportsFixtureSummary[]);

    patchSportsFixtureLists(qc, 'f1', { status: 'live' });

    expect(qc.getQueryData<SportsFixtureSummary[]>(['sports', 'fixtures', 'epl', 'live'])).toEqual([
      expect.objectContaining({ fixture_id: 'f1', status: 'live' }),
    ]);
  });

  it('removes deleted fixtures from list caches', () => {
    const qc = new QueryClient();
    qc.setQueryData(['sports', 'fixtures', 'all', 'all'], [
      {
        fixture_id: 'f1',
        league_code: 'epl',
        home_name: 'A',
        away_name: 'B',
        kickoff_at: '2026-06-26T15:00:00.000Z',
        status: 'live',
      },
    ] satisfies SportsFixtureSummary[]);

    removeSportsFixtureFromLists(qc, 'f1');

    expect(qc.getQueryData(['sports', 'fixtures', 'all', 'all'])).toEqual([]);
  });

  it('maps realtime fixture rows to cache patches', () => {
    expect(
      fixturePatchFromRealtimeRow({
        id: 'f1',
        status: 'live',
        home_name: 'Arsenal',
      }),
    ).toEqual({
      status: 'live',
      home_name: 'Arsenal',
    });
  });

  it('patches live odds in fixture list match_1x2 caches', () => {
    const qc = new QueryClient();
    qc.setQueryData(['sports', 'fixtures', 'epl', 'live'], [
      {
        fixture_id: 'f1',
        league_code: 'epl',
        home_name: 'A',
        away_name: 'B',
        kickoff_at: '2026-06-26T15:00:00.000Z',
        status: 'live',
        match_1x2: {
          home: {
            outcome_id: 'o-home',
            odds: '2.10',
            captured_at: '2026-06-26T12:00:00.000Z',
          },
        },
      },
    ] satisfies SportsFixtureSummary[]);

    const patched = patchSportsOddsInFixtureLists(qc, 'o-home', '2.25', '2026-06-26T12:05:00.000Z');

    expect(patched).toBe(true);
    expect(qc.getQueryData<SportsFixtureSummary[]>(['sports', 'fixtures', 'epl', 'live'])).toEqual([
      expect.objectContaining({
        match_1x2: {
          home: {
            outcome_id: 'o-home',
            odds: '2.25',
            captured_at: '2026-06-26T12:05:00.000Z',
          },
        },
      }),
    ]);
  });

  it('patches live odds in fixture-markets caches', () => {
    const qc = new QueryClient();
    qc.setQueryData(['sports', 'fixture-markets', 'f1'], [
      {
        market_id: 'm1',
        market_type: 'match_1x2',
        status: 'open',
        outcomes: [
          {
            outcome_id: 'o-home',
            selection: 'home',
            odds: '2.10',
            captured_at: '2026-06-26T12:00:00.000Z',
          },
        ],
      },
    ] satisfies SportsMarketSummary[]);

    const patched = patchSportsOddsInMarkets(qc, 'o-home', '2.25', '2026-06-26T12:05:00.000Z');

    expect(patched).toBe(true);
    expect(qc.getQueryData<SportsMarketSummary[]>(['sports', 'fixture-markets', 'f1'])).toEqual([
      expect.objectContaining({
        outcomes: [
          expect.objectContaining({
            outcome_id: 'o-home',
            odds: '2.25',
            captured_at: '2026-06-26T12:05:00.000Z',
          }),
        ],
      }),
    ]);
  });

  it('patches live-state cache for fixture detail surfaces', () => {
    const qc = new QueryClient();
    qc.setQueryData(['sports', 'live-state', 'f1'], {
      home_name: 'A',
      away_name: 'B',
      status: 'scheduled',
    });

    patchSportsLiveState(qc, 'f1', {
      status: 'live',
      home_name: 'Arsenal',
      result_home_goals: 1,
      result_away_goals: 0,
      suspend_reason: 'goal_event',
    });

    expect(qc.getQueryData(['sports', 'live-state', 'f1'])).toEqual({
      home_name: 'Arsenal',
      away_name: 'B',
      status: 'live',
      result_home_goals: 1,
      result_away_goals: 0,
      suspend_reason: 'goal_event',
    });
  });

  it('maps realtime fixture rows including score fields', () => {
    expect(
      fixturePatchFromRealtimeRow({
        id: 'f1',
        status: 'live',
        result_home_goals: 2,
        result_away_goals: 1,
        suspended_until: null,
      }),
    ).toEqual({
      status: 'live',
      result_home_goals: 2,
      result_away_goals: 1,
      suspended_until: null,
    });
  });

  it('maps realtime odds snapshot rows to cache patches', () => {
    expect(
      oddsPatchFromRealtimeRow({
        outcome_id: 'o-home',
        odds: '2.250000',
        captured_at: '2026-06-26T12:05:00.000Z',
      }),
    ).toEqual({
      outcomeId: 'o-home',
      odds: '2.250000',
      capturedAt: '2026-06-26T12:05:00.000Z',
    });
  });

  it('scopes odds list patches to visible fixture ids only', () => {
    const qc = new QueryClient();
    qc.setQueryData(['sports', 'fixtures', 'epl', 'live'], [
      {
        fixture_id: 'f1',
        league_code: 'epl',
        home_name: 'A',
        away_name: 'B',
        kickoff_at: '2026-06-26T15:00:00.000Z',
        status: 'live',
        match_1x2: {
          home: {
            outcome_id: 'o-home',
            odds: '2.10',
            captured_at: '2026-06-26T12:00:00.000Z',
          },
        },
      },
      {
        fixture_id: 'f2',
        league_code: 'epl',
        home_name: 'C',
        away_name: 'D',
        kickoff_at: '2026-06-26T16:00:00.000Z',
        status: 'live',
        match_1x2: {
          home: {
            outcome_id: 'o-home-f2',
            odds: '1.80',
            captured_at: '2026-06-26T12:00:00.000Z',
          },
        },
      },
    ] satisfies SportsFixtureSummary[]);

    const patched = patchSportsOddsInFixtureLists(
      qc,
      'o-home',
      '2.25',
      '2026-06-26T12:05:00.000Z',
      {
        fixtureIds: new Set(['f2']),
      },
    );

    expect(patched).toBe(false);
    const rows = qc.getQueryData<SportsFixtureSummary[]>(['sports', 'fixtures', 'epl', 'live']);
    expect(rows?.[0]?.match_1x2?.home.odds).toBe('2.10');
  });

  it('applySportsOddsInsertPatch returns false on miss without touching other queries', () => {
    const qc = new QueryClient();
    qc.setQueryData(['sports', 'my-bets', 'user-1'], [{ bet_id: 'b1' }]);
    const applied = applySportsOddsInsertPatch(qc, {
      outcomeId: 'missing',
      odds: '9.99',
      capturedAt: '2026-06-26T12:05:00.000Z',
    });
    expect(applied).toBe(false);
    expect(qc.getQueryData(['sports', 'my-bets', 'user-1'])).toEqual([{ bet_id: 'b1' }]);
  });

  it('scopes odds market patches to visible fixture query keys', () => {
    const qc = new QueryClient();
    qc.setQueryData(['sports', 'fixture-markets', 'f1'], [
      {
        market_id: 'm1',
        market_type: 'match_1x2',
        status: 'open',
        outcomes: [
          {
            outcome_id: 'o-home',
            selection: 'home',
            odds: '2.10',
            captured_at: '2026-06-26T12:00:00.000Z',
          },
        ],
      },
    ] satisfies SportsMarketSummary[]);
    qc.setQueryData(['sports', 'fixture-markets', 'f2'], [
      {
        market_id: 'm2',
        market_type: 'match_1x2',
        status: 'open',
        outcomes: [
          {
            outcome_id: 'o-home',
            selection: 'home',
            odds: '2.10',
            captured_at: '2026-06-26T12:00:00.000Z',
          },
        ],
      },
    ] satisfies SportsMarketSummary[]);

    const patched = patchSportsOddsInMarkets(qc, 'o-home', '2.25', '2026-06-26T12:05:00.000Z', {
      fixtureIds: new Set(['f1']),
    });

    expect(patched).toBe(true);
    expect(
      qc.getQueryData<SportsMarketSummary[]>(['sports', 'fixture-markets', 'f1'])?.[0]?.outcomes[0]
        ?.odds,
    ).toBe('2.25');
    expect(
      qc.getQueryData<SportsMarketSummary[]>(['sports', 'fixture-markets', 'f2'])?.[0]?.outcomes[0]
        ?.odds,
    ).toBe('2.10');
  });
});
