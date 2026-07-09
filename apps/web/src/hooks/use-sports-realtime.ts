import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
function isVisualFixtureMode(): boolean {
  return false;
}
import {
  fixturePatchFromRealtimeRow,
  marketPatchFromRealtimeRow,
  oddsPatchFromRealtimeRow,
  patchSportsFixtureLists,
  patchSportsFixtureMarkets,
  patchSportsLiveState,
  patchSportsOddsInFixtureLists,
  patchSportsOddsInMarkets,
  readFixtureIdFromRealtimePayload,
  readMarketIdFromRealtimePayload,
  removeSportsFixtureFromLists,
} from '../features/sports/sports-realtime-cache';
import { useRealtime, type RealtimeConnectionStatus } from './use-realtime';

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
}

export interface UseSportsRealtimeResult {
  status: RealtimeConnectionStatus;
  connected: boolean;
}

/**
 * Subscribe to sports fixtures/markets/odds Realtime and patch react-query caches.
 * Display-only — settlement RPCs remain unchanged (money-safe).
 */
export function useSportsRealtime(options: UseSportsRealtimeOptions = {}): UseSportsRealtimeResult {
  const qc = useQueryClient();
  const enabled = (options.enabled ?? true) && !isVisualFixtureMode();

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
    [qc],
  );

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
        invalidateSportsDisplay();
        return;
      }

      const listPatched = patchSportsOddsInFixtureLists(
        qc,
        patch.outcomeId,
        patch.odds,
        patch.capturedAt,
      );
      const marketsPatched = patchSportsOddsInMarkets(
        qc,
        patch.outcomeId,
        patch.odds,
        patch.capturedAt,
      );

      if (!listPatched && !marketsPatched) {
        invalidateSportsDisplay();
      }
    },
    [qc, invalidateSportsDisplay],
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
