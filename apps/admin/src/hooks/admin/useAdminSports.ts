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
  SportsUserRiskTier,
} from './admin-sports-types';

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
  SportsUserRiskTier,
} from './admin-sports-types';

export { formatKrwGrouped } from '../../lib/admin-time';

const MIN_REASON = 4;

async function firstMarketIdForFixture(fixtureId: string): Promise<string | null> {
  const { data: rawPayload, error } = await supabase.rpc(
    'rpc_get_fixture_markets' as never,
    { p_fixture_id: fixtureId } as never,
  );
  const payload = rawPayload as Json | null;
  if (error || !isRecord(payload)) return null;
  const marketsRaw = payload['markets'];
  if (!Array.isArray(marketsRaw) || marketsRaw.length === 0) return null;
  const first = marketsRaw[0];
  return isRecord(first) && typeof first['market_id'] === 'string' ? first['market_id'] : null;
}

function isRecord(value: Json | unknown): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapFixture(row: Json): SportsFixtureRow | null {
  if (!isRecord(row)) return null;
  const id = typeof row['fixture_id'] === 'string' ? row['fixture_id'] : null;
  if (!id) return null;
  const pending = row['pending_bets'];
  const pendingNum = typeof pending === 'number' ? pending : Number(pending ?? 0);
  const liabilityRaw = row['pending_liability'];
  const liability =
    typeof liabilityRaw === 'number'
      ? String(liabilityRaw)
      : typeof liabilityRaw === 'string'
        ? liabilityRaw
        : '0';
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
    exposure: liability.split('.')[0] ?? liability,
    status,
  };
}

function mapRiskEvent(row: Json, index: number): RiskEvent | null {
  if (!isRecord(row)) return null;
  const id = typeof row['id'] === 'string' ? row['id'] : `re-${index}`;
  const eventType = typeof row['event_type'] === 'string' ? row['event_type'] : 'info';
  const severity: RiskSeverity =
    eventType.includes('crit') || eventType.includes('ban')
      ? 'crit'
      : eventType.includes('warn')
        ? 'warn'
        : 'info';
  return {
    id,
    severity,
    labelKey: 'admin.sports.risk.event.exposureSpike',
    at: typeof row['created_at'] === 'string' ? row['created_at'] : new Date().toISOString(),
  };
}

function aggregateExposure(rows: Json[], capPhon: string): ExposureAggregate {
  let total = 0n;
  let openBets = 0;
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const currency = typeof row['currency'] === 'string' ? row['currency'] : 'PHON';
    const liability =
      typeof row['pending_liability'] === 'string'
        ? row['pending_liability']
        : String(row['pending_liability'] ?? '0');
    if (currency === 'PHON') {
      try {
        total += BigInt(liability.split('.')[0] ?? '0');
      } catch {
        // skip malformed
      }
    }
    const bets = row['pending_bets'];
    openBets += typeof bets === 'number' ? bets : Number(bets ?? 0);
  }
  const capWhole = capPhon.split('.')[0] ?? capPhon;
  return {
    total: total.toString(),
    max: capWhole,
    openBets,
  };
}

/** Engine-backed sports desk (Tier B). */
export function useAdminSports(): AdminSportsState & AdminSportsActions {
  const qc = useQueryClient();
  const { data: config } = useAppConfig();
  const [suspended, setSuspended] = useState<MarketSuspension[]>([]);

  const capPhon =
    typeof config?.['sports_house_exposure_cap_phon'] === 'string'
      ? config['sports_house_exposure_cap_phon']
      : '5000000';

  const { data, refetch } = useQuery({
    queryKey: ['admin-sports-desk', capPhon],
    queryFn: async () => {
      const [fixturesRaw, exposureRaw, riskRaw] = await Promise.all([
        callRpc('rpc_admin_list_unsettled_sports_fixtures', { p_limit: 100 }),
        callRpc('rpc_admin_list_sports_exposure', {}),
        callRpc('rpc_admin_list_sports_risk_events', { p_limit: 20 }),
      ]);
      const fixtures = (fixturesRaw ?? [])
        .map(mapFixture)
        .filter((row): row is SportsFixtureRow => row !== null);
      const exposure = aggregateExposure(exposureRaw ?? [], capPhon);
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
  const exposure = data?.exposure ?? {
    total: '0',
    max: capPhon.split('.')[0] ?? capPhon,
    openBets: 0,
  };
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
    async (enabled: boolean, reason: string) => {
      const trimmed = reason.trim();
      if (trimmed.length < MIN_REASON) return;
      await setFeatureEnabled({ feature: 'sports', enabled, reason: trimmed });
      await invalidate();
    },
    [invalidate],
  );

  const suspendMarket = useCallback(
    async (fixtureId: string, reason: string) => {
      if (reason.trim().length < MIN_REASON) return;
      const marketId = await firstMarketIdForFixture(fixtureId);
      if (!marketId) return;
      await callRpc('rpc_admin_suspend_sports_market', {
        p_market_id: marketId,
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

  const unsuspendMarket = useCallback(
    async (fixtureId: string, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      const marketId = await firstMarketIdForFixture(fixtureId);
      if (!marketId) return false;
      try {
        await callRpc('rpc_admin_resume_sports_market', {
          p_market_id: marketId,
          p_reason: reason.trim(),
        });
        setSuspended((prev) => prev.filter((s) => s.fixtureId !== fixtureId));
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [invalidate],
  );

  const settleFixtureQuorum = useCallback(
    async (
      fixtureId: string,
      homeGoals: number,
      awayGoals: number,
      reason: string,
      forceQuorum: boolean,
    ): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      try {
        await callRpc('rpc_admin_settle_sports_fixture_quorum', {
          p_fixture_id: fixtureId,
          p_home_goals: homeGoals,
          p_away_goals: awayGoals,
          p_reason: reason.trim(),
          p_force_quorum: forceQuorum,
        });
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [invalidate],
  );

  const voidFixtureMarket = useCallback(
    async (fixtureId: string, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      const marketId = await firstMarketIdForFixture(fixtureId);
      if (!marketId) return false;
      try {
        await supabase.rpc(
          'rpc_void_sports_market' as never,
          {
            p_market_id: marketId,
            p_reason: reason.trim(),
          } as never,
        );
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [invalidate],
  );

  const setSportsRiskTier = useCallback(
    async (userId: string, tier: SportsUserRiskTier, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      try {
        await supabase.rpc(
          'rpc_admin_set_sports_risk_tier' as never,
          {
            p_user_id: userId,
            p_tier: tier,
            p_reason: reason.trim(),
            p_stake_multiplier: null,
            p_live_delay_ms: null,
          } as never,
        );
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [invalidate],
  );

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
    setFeatureEnabled: (enabled: boolean, reason: string) => {
      void setFeatureEnabledAction(enabled, reason);
    },
    suspendMarket: (fixtureId: string, reason: string) => {
      void suspendMarket(fixtureId, reason);
    },
    unsuspendMarket,
    settleFixtureQuorum,
    voidFixtureMarket,
    setSportsRiskTier,
    resetForTest,
  };
}
