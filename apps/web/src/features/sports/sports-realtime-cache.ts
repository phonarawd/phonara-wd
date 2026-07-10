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
    Pick<
      SportsFixtureSummary,
      | 'status'
      | 'home_name'
      | 'away_name'
      | 'kickoff_at'
      | 'league_code'
      | 'result_home_goals'
      | 'result_away_goals'
      | 'suspended_until'
      | 'suspend_reason'
    >
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

export type SportsOddsPatchScope = {
  /** When set, only fixtures in this set are patched (on-screen / loaded board). */
  readonly fixtureIds?: ReadonlySet<string>;
};

export function patchSportsOddsInFixtureLists(
  qc: QueryClient,
  outcomeId: string,
  odds: string,
  capturedAt: string,
  scope?: SportsOddsPatchScope,
): boolean {
  let patched = false;
  const fixtureIds = scope?.fixtureIds;
  qc.setQueriesData<SportsFixtureSummary[]>({ queryKey: sportsFixtureListKeyPrefix() }, (prev) => {
    if (!prev) return prev;
    return prev.map((fixture) => {
      if (fixtureIds && !fixtureIds.has(fixture.fixture_id)) return fixture;
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
  scope?: SportsOddsPatchScope,
): boolean {
  let patched = false;
  const fixtureIds = scope?.fixtureIds;
  const queries = qc.getQueriesData<SportsMarketSummary[]>({
    queryKey: ['sports', 'fixture-markets'],
  });
  for (const [queryKey, prev] of queries) {
    if (!prev) continue;
    const fixtureIdFromKey = typeof queryKey[2] === 'string' ? queryKey[2] : null;
    if (fixtureIds && fixtureIdFromKey && !fixtureIds.has(fixtureIdFromKey)) continue;

    let queryChanged = false;
    const next = prev.map((market) => {
      let changed = false;
      const outcomes = market.outcomes.map((outcome) => {
        if (outcome.outcome_id !== outcomeId) return outcome;
        changed = true;
        return { ...outcome, odds, captured_at: capturedAt };
      });
      if (!changed) return market;
      queryChanged = true;
      return { ...market, outcomes };
    });
    if (queryChanged) {
      patched = true;
      qc.setQueryData(queryKey, next);
    }
  }
  return patched;
}

/** Apply one odds patch to list + markets caches. Miss = no-op (never full sports invalidate). */
export function applySportsOddsInsertPatch(
  qc: QueryClient,
  patch: { outcomeId: string; odds: string; capturedAt: string },
  scope?: SportsOddsPatchScope,
): boolean {
  const listPatched = patchSportsOddsInFixtureLists(
    qc,
    patch.outcomeId,
    patch.odds,
    patch.capturedAt,
    scope,
  );
  const marketsPatched = patchSportsOddsInMarkets(
    qc,
    patch.outcomeId,
    patch.odds,
    patch.capturedAt,
    scope,
  );
  return listPatched || marketsPatched;
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

export function patchSportsLiveState(
  qc: QueryClient,
  fixtureId: string,
  patch: Partial<{
    status: string;
    home_name: string;
    away_name: string;
    kickoff_at: string;
    league_code: string;
    suspended_until: string | null;
    suspend_reason: string | null;
    result_home_goals: number | null;
    result_away_goals: number | null;
  }>,
): void {
  qc.setQueryData(['sports', 'live-state', fixtureId], (prev: unknown) => {
    if (!prev || typeof prev !== 'object') {
      return { fixture_id: fixtureId, markets: [], ...patch };
    }
    return { ...(prev as Record<string, unknown>), ...patch };
  });
}

export function fixturePatchFromRealtimeRow(row: RealtimeRow | null | undefined): {
  status?: string;
  home_name?: string;
  away_name?: string;
  kickoff_at?: string;
  league_code?: string;
  suspended_until?: string | null;
  suspend_reason?: string | null;
  result_home_goals?: number | null;
  result_away_goals?: number | null;
} | null {
  if (!row || typeof row['id'] !== 'string') return null;
  const patch: {
    status?: string;
    home_name?: string;
    away_name?: string;
    kickoff_at?: string;
    league_code?: string;
    suspended_until?: string | null;
    suspend_reason?: string | null;
    result_home_goals?: number | null;
    result_away_goals?: number | null;
  } = {};
  if (typeof row['status'] === 'string') patch.status = row['status'];
  if (typeof row['home_name'] === 'string') patch.home_name = row['home_name'];
  if (typeof row['away_name'] === 'string') patch.away_name = row['away_name'];
  if (typeof row['kickoff_at'] === 'string') patch.kickoff_at = row['kickoff_at'];
  if (typeof row['league_code'] === 'string') patch.league_code = row['league_code'];
  if (row['suspended_until'] === null || typeof row['suspended_until'] === 'string') {
    patch.suspended_until = row['suspended_until'] as string | null;
  }
  if (row['suspend_reason'] === null || typeof row['suspend_reason'] === 'string') {
    patch.suspend_reason = row['suspend_reason'] as string | null;
  }
  if (row['result_home_goals'] === null || typeof row['result_home_goals'] === 'number') {
    patch.result_home_goals = row['result_home_goals'] as number | null;
  }
  if (row['result_away_goals'] === null || typeof row['result_away_goals'] === 'number') {
    patch.result_away_goals = row['result_away_goals'] as number | null;
  }
  return patch;
}

export function marketPatchFromRealtimeRow(row: RealtimeRow | null | undefined): {
  status?: string;
} | null {
  if (!row || typeof row['id'] !== 'string') return null;
  if (typeof row['status'] !== 'string') return null;
  return { status: row['status'] };
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
