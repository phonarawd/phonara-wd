import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import type { SportsFixtureSummary } from '../use-sports-betting';
import {
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

    patchSportsLiveState(qc, 'f1', { status: 'live', home_name: 'Arsenal' });

    expect(qc.getQueryData(['sports', 'live-state', 'f1'])).toEqual({
      home_name: 'Arsenal',
      away_name: 'B',
      status: 'live',
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
});
