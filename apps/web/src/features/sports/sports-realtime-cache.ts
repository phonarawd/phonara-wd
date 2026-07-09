import type { QueryClient } from '@tanstack/react-query';
import type { SportsFixtureSummary, SportsMarketSummary } from './use-sports-betting';

type RealtimeRow = Record<string, unknown>;

export function sportsFixtureListKeyPrefix(): readonly ['sports', 'fixtures'] {
  return ['sports', 'fixtures'];
}

export function patchSportsFixtureLists(
  qc: QueryClient,
  fixtureId: string,
  patch: Partial<
    Pick<SportsFixtureSummary, 'status' | 'home_name' | 'away_name' | 'kickoff_at' | 'league_code'>
  >,
): void {
  qc.setQueriesData<SportsFixtureSummary[]>({ queryKey: sportsFixtureListKeyPrefix() }, (prev) => {
    if (!prev) return prev;
    return prev.map((row) => (row.fixture_id === fixtureId ? { ...row, ...patch } : row));
  });
}

export function removeSportsFixtureFromLists(qc: QueryClient, fixtureId: string): void {
  qc.setQueriesData<SportsFixtureSummary[]>({ queryKey: sportsFixtureListKeyPrefix() }, (prev) => {
    if (!prev) return prev;
    return prev.filter((row) => row.fixture_id !== fixtureId);
  });
}

export function patchSportsFixtureMarkets(
  qc: QueryClient,
  marketId: string,
  patch: Partial<Pick<SportsMarketSummary, 'status'>>,
): void {
  qc.setQueriesData<SportsMarketSummary[]>({ queryKey: ['sports', 'fixture-markets'] }, (prev) => {
    if (!prev) return prev;
    return prev.map((market) => (market.market_id === marketId ? { ...market, ...patch } : market));
  });
}

export function patchSportsOddsInFixtureLists(
  qc: QueryClient,
  outcomeId: string,
  odds: string,
  capturedAt: string,
): boolean {
  let patched = false;
  qc.setQueriesData<SportsFixtureSummary[]>({ queryKey: sportsFixtureListKeyPrefix() }, (prev) => {
    if (!prev) return prev;
    return prev.map((fixture) => {
      if (!fixture.match_1x2) return fixture;
      let changed = false;
      const nextMatch1x2 = { ...fixture.match_1x2 };
      for (const [selection, outcome] of Object.entries(fixture.match_1x2)) {
        if (outcome.outcome_id !== outcomeId) continue;
        nextMatch1x2[selection] = { ...outcome, odds, captured_at: capturedAt };
        changed = true;
      }
      if (changed) patched = true;
      return changed ? { ...fixture, match_1x2: nextMatch1x2 } : fixture;
    });
  });
  return patched;
}

export function patchSportsOddsInMarkets(
  qc: QueryClient,
  outcomeId: string,
  odds: string,
  capturedAt: string,
): boolean {
  let patched = false;
  qc.setQueriesData<SportsMarketSummary[]>({ queryKey: ['sports', 'fixture-markets'] }, (prev) => {
    if (!prev) return prev;
    return prev.map((market) => {
      let changed = false;
      const outcomes = market.outcomes.map((outcome) => {
        if (outcome.outcome_id !== outcomeId) return outcome;
        changed = true;
        return { ...outcome, odds, captured_at: capturedAt };
      });
      if (changed) patched = true;
      return changed ? { ...market, outcomes } : market;
    });
  });
  return patched;
}

export function oddsPatchFromRealtimeRow(row: RealtimeRow | null | undefined): {
  outcomeId: string;
  odds: string;
  capturedAt: string;
} | null {
  if (!row || typeof row['outcome_id'] !== 'string') return null;
  if (typeof row['odds'] !== 'string') return null;
  if (typeof row['captured_at'] !== 'string') return null;
  return {
    outcomeId: row['outcome_id'],
    odds: row['odds'],
    capturedAt: row['captured_at'],
  };
}

export function fixturePatchFromRealtimeRow(row: RealtimeRow | null | undefined): {
  status?: string;
  home_name?: string;
  away_name?: string;
  kickoff_at?: string;
  league_code?: string;
} | null {
  if (!row || typeof row['id'] !== 'string') return null;
  const patch: {
    status?: string;
    home_name?: string;
    away_name?: string;
    kickoff_at?: string;
    league_code?: string;
  } = {};
  if (typeof row['status'] === 'string') patch.status = row['status'];
  if (typeof row['home_name'] === 'string') patch.home_name = row['home_name'];
  if (typeof row['away_name'] === 'string') patch.away_name = row['away_name'];
  if (typeof row['kickoff_at'] === 'string') patch.kickoff_at = row['kickoff_at'];
  if (typeof row['league_code'] === 'string') patch.league_code = row['league_code'];
  return patch;
}

export function marketPatchFromRealtimeRow(row: RealtimeRow | null | undefined): {
  status?: string;
} | null {
  if (!row || typeof row['id'] !== 'string') return null;
  if (typeof row['status'] !== 'string') return null;
  return { status: row['status'] };
}

export function patchSportsLiveState(
  qc: QueryClient,
  fixtureId: string,
  patch: Partial<{
    status: string;
    home_name: string;
    away_name: string;
    kickoff_at: string;
    league_code: string;
  }>,
): void {
  qc.setQueryData(['sports', 'live-state', fixtureId], (prev: unknown) => {
    if (!prev || typeof prev !== 'object') {
      return { ...patch };
    }
    return { ...(prev as Record<string, unknown>), ...patch };
  });
}

export function readFixtureIdFromRealtimePayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as { new?: RealtimeRow; old?: RealtimeRow; eventType?: string };
  const row = record.new ?? record.old;
  return row && typeof row['id'] === 'string' ? row['id'] : null;
}

export function readMarketIdFromRealtimePayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as { new?: RealtimeRow; old?: RealtimeRow };
  const row = record.new ?? record.old;
  return row && typeof row['id'] === 'string' ? row['id'] : null;
}
