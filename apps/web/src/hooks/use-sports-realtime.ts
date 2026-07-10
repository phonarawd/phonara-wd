import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  applySportsOddsInsertPatch,
  fixturePatchFromRealtimeRow,
  marketPatchFromRealtimeRow,
  oddsPatchFromRealtimeRow,
  patchSportsFixtureLists,
  patchSportsFixtureMarkets,
  patchSportsLiveState,
  readFixtureIdFromRealtimePayload,
  readMarketIdFromRealtimePayload,
  removeSportsFixtureFromLists,
} from '../features/sports/sports-realtime-cache';
import {
  createSportsOddsInsertDebouncer,
  SPORTS_ODDS_INSERT_DEBOUNCE_MS,
} from '../features/sports/sports-odds-insert-debounce';
import { useRealtime, type RealtimeConnectionStatus } from './use-realtime';

function isVisualFixtureMode(): boolean {
  return false;
}

type PostgresChangePayload = {
  eventType?: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
};

function readEventType(payload: unknown): PostgresChangePayload['eventType'] | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const eventType = (payload as PostgresChangePayload).eventType;
  return eventType === 'INSERT' || eventType === 'UPDATE' || eventType === 'DELETE'
    ? eventType
    : undefined;
}

export interface UseSportsRealtimeOptions {
  enabled?: boolean;
  /**
   * Fixture ids currently on screen (board + focused detail).
   * Odds INSERT patches are scoped to this set; unknown outcomes are dropped
   * (no full `['sports']` invalidate).
   */
  visibleFixtureIds?: ReadonlySet<string>;
}

export interface UseSportsRealtimeResult {
  status: RealtimeConnectionStatus;
  connected: boolean;
}

export { SPORTS_ODDS_INSERT_DEBOUNCE_MS };

/**
 * Subscribe to sports fixtures/markets/odds Realtime and patch react-query caches.
 * Display-only — settlement RPCs remain unchanged (money-safe).
 *
 * Odds INSERT path: ≥500ms trailing debounce · on-screen fixture scope · no full sports invalidate.
 */
export function useSportsRealtime(options: UseSportsRealtimeOptions = {}): UseSportsRealtimeResult {
  const qc = useQueryClient();
  const enabled = (options.enabled ?? true) && !isVisualFixtureMode();
  const visibleFixtureIdsRef = useRef(options.visibleFixtureIds);
  visibleFixtureIdsRef.current = options.visibleFixtureIds;

  const invalidateSportsDisplay = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['sports'] });
    void qc.invalidateQueries({ queryKey: ['sports', 'cashout-preview'] });
  }, [qc]);

  const onFixtureChange = useCallback(
    (payload: unknown) => {
      const fixtureId = readFixtureIdFromRealtimePayload(payload);
      if (!fixtureId) {
        invalidateSportsDisplay();
        return;
      }

      const eventType = readEventType(payload);
      if (eventType === 'DELETE') {
        removeSportsFixtureFromLists(qc, fixtureId);
        void qc.invalidateQueries({ queryKey: ['sports', 'live-state', fixtureId] });
        void qc.invalidateQueries({ queryKey: ['sports', 'fixture-markets', fixtureId] });
        return;
      }

      const row = (payload as PostgresChangePayload).new;
      const patch = fixturePatchFromRealtimeRow(row);
      if (patch && Object.keys(patch).length > 0) {
        patchSportsFixtureLists(qc, fixtureId, patch);
        patchSportsLiveState(qc, fixtureId, patch);
      } else {
        invalidateSportsDisplay();
        void qc.invalidateQueries({ queryKey: ['sports', 'live-state', fixtureId] });
      }
    },
    [qc, invalidateSportsDisplay],
  );

  const onMarketChange = useCallback(
    (payload: unknown) => {
      const marketId = readMarketIdFromRealtimePayload(payload);
      if (!marketId) {
        invalidateSportsDisplay();
        return;
      }

      const row = (payload as PostgresChangePayload).new;
      const patch = marketPatchFromRealtimeRow(row);
      if (patch) {
        patchSportsFixtureMarkets(qc, marketId, patch);
      }

      void qc.invalidateQueries({ queryKey: ['sports', 'fixtures'] });
    },
    [qc, invalidateSportsDisplay],
  );

  const oddsDebouncer = useMemo(
    () =>
      createSportsOddsInsertDebouncer({
        debounceMs: SPORTS_ODDS_INSERT_DEBOUNCE_MS,
        flush: (patches) => {
          const fixtureIds = visibleFixtureIdsRef.current;
          const scope = fixtureIds ? { fixtureIds } : undefined;
          for (const patch of patches) {
            // Miss = drop. Never invalidate full ['sports'] on odds INSERT fanout.
            applySportsOddsInsertPatch(qc, patch, scope);
          }
        },
      }),
    [qc],
  );

  useEffect(() => () => oddsDebouncer.dispose(), [oddsDebouncer]);

  const fixturesRt = useRealtime({
    table: 'sports_fixtures',
    onChange: onFixtureChange,
    enabled,
  });

  const marketsRt = useRealtime({
    table: 'sports_markets',
    onChange: onMarketChange,
    enabled,
  });

  const onOddsSnapshot = useCallback(
    (payload: unknown) => {
      const row = (payload as PostgresChangePayload).new;
      const patch = oddsPatchFromRealtimeRow(row);
      if (!patch) {
        // Malformed row — drop; do not fan out a full sports refetch.
        return;
      }
      oddsDebouncer.enqueue(patch);
    },
    [oddsDebouncer],
  );

  const oddsRt = useRealtime({
    table: 'sports_odds_snapshots',
    event: 'INSERT',
    onChange: onOddsSnapshot,
    enabled,
  });

  const status = useMemo<RealtimeConnectionStatus>(() => {
    if (!enabled) return 'disabled';
    const statuses = [fixturesRt.status, marketsRt.status, oddsRt.status];
    if (statuses.every((s) => s === 'subscribed')) return 'subscribed';
    if (statuses.some((s) => s === 'channel_error')) return 'channel_error';
    if (statuses.some((s) => s === 'timed_out')) return 'timed_out';
    if (statuses.every((s) => s === 'closed' || s === 'disabled')) return 'closed';
    return 'connecting';
  }, [enabled, fixturesRt.status, marketsRt.status, oddsRt.status]);

  return {
    status,
    connected: status === 'subscribed',
  };
}
