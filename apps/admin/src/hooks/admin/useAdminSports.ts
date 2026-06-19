import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Json } from '@phonara/shared-types';
import { callRpc } from '../../lib/rpc';
import { supabase } from '../../lib/supabase';
import { setFeatureEnabled } from '../../domain/ops';
import { useAppConfig } from '../use-app-config';
import type {
  AdminSportsActions,
  AdminSportsState,
  ExposureAggregate,
  MarketSuspension,
  RiskEvent,
  RiskSeverity,
  RiskTier,
  SportsFixtureRow,
} from '../useAdminSportsMock';

export type {
  AdminSportsActions,
  AdminSportsState,
  ExposureAggregate,
  MarketSuspension,
  RiskEvent,
  RiskSeverity,
  RiskTier,
  SportsFixtureRow,
  SportsFixtureStatus,
} from '../useAdminSportsMock';

export { formatKrwGrouped } from '../../lib/admin-time';

const MIN_REASON = 4;

function isRecord(value: Json | unknown): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapFixture(row: Json): SportsFixtureRow | null {
  if (!isRecord(row)) return null;
  const id = typeof row['fixture_id'] === 'string' ? row['fixture_id'] : null;
  if (!id) return null;
  const pending = row['pending_bets'];
  const pendingNum = typeof pending === 'number' ? pending : Number(pending ?? 0);
  const statusRaw = typeof row['status'] === 'string' ? row['status'] : 'scheduled';
  const status =
    statusRaw === 'live' || statusRaw === 'ft' || statusRaw === 'scheduled'
      ? statusRaw
      : 'scheduled';
  return {
    id,
    league: typeof row['league_code'] === 'string' ? row['league_code'] : '—',
    home: typeof row['home_name'] === 'string' ? row['home_name'] : '—',
    away: typeof row['away_name'] === 'string' ? row['away_name'] : '—',
    kickoff: typeof row['kickoff_at'] === 'string' ? row['kickoff_at'] : new Date().toISOString(),
    unsettledMarkets: Number.isFinite(pendingNum) ? pendingNum : 0,
    exposure: '0',
    status,
  };
}

function mapRiskEvent(row: Json, index: number): RiskEvent | null {
  if (!isRecord(row)) return null;
  const id = typeof row['id'] === 'string' ? row['id'] : `re-${index}`;
  const eventType = typeof row['event_type'] === 'string' ? row['event_type'] : 'info';
  const severity: RiskSeverity =
    eventType.includes('crit') || eventType.includes('ban') ? 'crit' : eventType.includes('warn') ? 'warn' : 'info';
  return {
    id,
    severity,
    labelKey: 'admin.sports.risk.event.exposureSpike',
    at: typeof row['created_at'] === 'string' ? row['created_at'] : new Date().toISOString(),
  };
}

function aggregateExposure(rows: Json[]): ExposureAggregate {
  let total = 0n;
  let openBets = 0;
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const stake = typeof row['pending_stake'] === 'string' ? row['pending_stake'] : String(row['pending_stake'] ?? '0');
    const liability =
      typeof row['pending_liability'] === 'string'
        ? row['pending_liability']
        : String(row['pending_liability'] ?? '0');
    try {
      total += BigInt(stake.split('.')[0] ?? '0') + BigInt(liability.split('.')[0] ?? '0');
    } catch {
      // skip malformed
    }
    const bets = row['pending_bets'];
    openBets += typeof bets === 'number' ? bets : Number(bets ?? 0);
  }
  return {
    total: total.toString(),
    max: total.toString(),
    openBets,
  };
}

/** Engine-backed sports desk (Tier B). */
export function useAdminSports(): AdminSportsState & AdminSportsActions {
  const qc = useQueryClient();
  const { data: config } = useAppConfig();
  const [suspended, setSuspended] = useState<MarketSuspension[]>([]);

  const { data, refetch } = useQuery({
    queryKey: ['admin-sports-desk'],
    queryFn: async () => {
      const [fixturesRaw, exposureRaw, riskRaw] = await Promise.all([
        callRpc('rpc_admin_list_unsettled_sports_fixtures', { p_limit: 100 }),
        callRpc('rpc_admin_list_sports_exposure', {}),
        callRpc('rpc_admin_list_sports_risk_events', { p_limit: 20 }),
      ]);
      const fixtures = (fixturesRaw ?? [])
        .map(mapFixture)
        .filter((row): row is SportsFixtureRow => row !== null);
      const exposure = aggregateExposure(exposureRaw ?? []);
      const risk = (riskRaw ?? [])
        .map(mapRiskEvent)
        .filter((row): row is RiskEvent => row !== null);
      return { fixtures, exposure, risk };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const featureEnabled = config?.['feature_sports_enabled'] === 'true';
  const fixtures = data?.fixtures ?? [];
  const exposure = data?.exposure ?? { total: '0', max: '0', openBets: 0 };
  const risk = data?.risk ?? [];
  const tier: RiskTier = useMemo(() => {
    if (risk.some((e) => e.severity === 'crit')) return 'C';
    if (risk.some((e) => e.severity === 'warn')) return 'B';
    return 'A';
  }, [risk]);

  const invalidate = useCallback(async () => {
    await refetch();
    await qc.invalidateQueries({ queryKey: ['app-config'] });
  }, [qc, refetch]);

  const setFeatureEnabledAction = useCallback(
    async (enabled: boolean) => {
      await setFeatureEnabled({ feature: 'sports', enabled, reason: 'admin sports desk toggle' });
      await invalidate();
    },
    [invalidate],
  );

  const suspendMarket = useCallback(
    async (fixtureId: string, reason: string) => {
      if (reason.trim().length < MIN_REASON) return;
      const { data: markets, error } = await (
        supabase as unknown as {
          from: (table: string) => {
            select: (cols: string) => {
              eq: (col: string, val: string) => {
                limit: (n: number) => Promise<{ data: { id: string }[] | null; error: Error | null }>;
              };
            };
          };
        }
      )
        .from('sports_markets')
        .select('id')
        .eq('fixture_id', fixtureId)
        .limit(1);
      if (error || !markets?.[0]?.id) return;
      await callRpc('rpc_admin_suspend_sports_market', {
        p_market_id: markets[0].id,
        p_duration_ms: 86_400_000,
        p_reason: reason.trim(),
      });
      setSuspended((prev) => [
        { fixtureId, reason: reason.trim(), at: new Date().toISOString() },
        ...prev.filter((s) => s.fixtureId !== fixtureId),
      ]);
      await invalidate();
    },
    [invalidate],
  );

  const unsuspendMarket = useCallback((fixtureId: string) => {
    setSuspended((prev) => prev.filter((s) => s.fixtureId !== fixtureId));
  }, []);

  const resetForTest = useCallback(() => {
    setSuspended([]);
  }, []);

  return {
    featureEnabled,
    fixtures,
    suspended,
    risk,
    exposure,
    tier,
    setFeatureEnabled: (enabled: boolean) => {
      void setFeatureEnabledAction(enabled);
    },
    suspendMarket: (fixtureId: string, reason: string) => {
      void suspendMarket(fixtureId, reason);
    },
    unsuspendMarket,
    resetForTest,
  };
}
