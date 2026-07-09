import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Json } from '@phonara/shared-types';
import type { AdminAuditEvent } from '@/shared-types';
import { callRpc } from '../../lib/rpc';
import { ackOpsAlert, getOpsAlertsRaw, resolveOpsAlert } from '../../domain/ops';
import { useAuditLogs } from '../use-audit-logs';
import { useAdminMfaReady } from '../use-admin-mfa-ready';
import {
  CASINO_DESK_MIN_REASON,
  CATALOG_CATEGORIES,
  CATALOG_STATUSES,
  RTP_SEVERITIES,
  RTP_STATUSES,
  filterCatalog,
  filterRtp,
  type AdminCasinoGameRow,
  type AdminRtpReviewRow,
  type CasinoGameCategory,
  type CasinoGameStatus,
  type CatalogFilters,
  type RtpFilters,
  type RtpReviewStatus,
  type RtpSeverity,
  type UseAdminCasinoDesk,
} from './useAdminCasinoDeskMock';

export type {
  AdminCasinoGameRow,
  AdminRtpReviewRow,
  CasinoGameCategory,
  CasinoGameStatus,
  CatalogFilters,
  RtpFilters,
  RtpReviewStatus,
  RtpSeverity,
  UseAdminCasinoDesk,
} from './useAdminCasinoDeskMock';

const MIN_REASON = CASINO_DESK_MIN_REASON;

const GAME_META: Record<string, { labelKey: string; category: CasinoGameCategory }> = {
  crash: { labelKey: 'admin.casino.catalog.game.crash', category: 'originals' },
  dice: { labelKey: 'admin.casino.catalog.game.dice', category: 'originals' },
  limbo: { labelKey: 'admin.casino.catalog.game.limbo', category: 'originals' },
  mines: { labelKey: 'admin.casino.catalog.game.mines', category: 'originals' },
  plinko: { labelKey: 'admin.casino.catalog.game.plinko', category: 'originals' },
  hilo: { labelKey: 'admin.casino.catalog.game.hilo', category: 'table' },
  blackjack: { labelKey: 'admin.casino.catalog.game.blackjack', category: 'table' },
  roulette: { labelKey: 'admin.casino.catalog.game.roulette', category: 'table' },
  gold_rush: { labelKey: 'admin.casino.catalog.game.gold_rush', category: 'instant' },
  mint_reels: { labelKey: 'admin.casino.catalog.game.mint_reels', category: 'instant' },
  deepshaft: { labelKey: 'admin.casino.catalog.game.deepshaft', category: 'originals' },
  momentum: { labelKey: 'admin.casino.catalog.game.momentum', category: 'originals' },
};

function isRecord(value: Json | unknown): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseCatalogStatus(value: unknown): CasinoGameStatus {
  if (value === 'live' || value === 'maintenance' || value === 'disabled') {
    return value;
  }
  return 'disabled';
}

function pctDrift(theoretical: string, observed: string): string | undefined {
  const t = Number(theoretical);
  const o = Number(observed);
  if (!Number.isFinite(t) || !Number.isFinite(o)) return undefined;
  return Math.abs(t - o).toFixed(2);
}

function mapCatalogRow(row: Json, windowEnd: string): AdminCasinoGameRow | null {
  if (!isRecord(row)) return null;
  const gameKey = typeof row['game_key'] === 'string' ? row['game_key'] : null;
  if (!gameKey) return null;
  const meta = GAME_META[gameKey] ?? {
    labelKey: `admin.casino.catalog.game.${gameKey}`,
    category: 'originals' as CasinoGameCategory,
  };
  const theoretical =
    typeof row['theoretical_rtp_pct'] === 'string' ? row['theoretical_rtp_pct'] : '99.00';
  const observed =
    typeof row['observed_rtp_pct'] === 'string' ? row['observed_rtp_pct'] : undefined;
  const status = parseCatalogStatus(row['status']);
  const enabled = row['enabled'] === true;
  return {
    id: `cg_${gameKey}`,
    gameKey,
    labelKey: meta.labelKey,
    category: meta.category,
    status,
    enabled,
    rtpConfigured: theoretical.replace(/\.00$/, '') || theoretical,
    rtpObserved24h: observed?.replace(/\.00$/, ''),
    rtpDriftPct: observed !== undefined ? pctDrift(theoretical, observed) : undefined,
    bets24h: typeof row['bet_count_24h'] === 'string' ? row['bet_count_24h'] : '0',
    lastChangedAt: windowEnd,
  };
}

function mapRtpSeverity(value: unknown): RtpSeverity {
  return value === 'critical' ? 'critical' : 'warning';
}

function mapRtpStatus(value: unknown): RtpReviewStatus {
  if (value === 'acknowledged' || value === 'resolved') return value;
  return 'open';
}

function mapRtpAlert(alert: Json): AdminRtpReviewRow | null {
  if (!isRecord(alert)) return null;
  if (alert['source_check_id'] !== 'casino_rtp_drift') return null;
  const id = typeof alert['id'] === 'string' ? alert['id'] : null;
  if (!id) return null;
  const metadata = isRecord(alert['metadata']) ? alert['metadata'] : {};
  const gameRaw = metadata['game'];
  const gameKey =
    typeof gameRaw === 'string'
      ? gameRaw
      : typeof gameRaw === 'object' && gameRaw !== null
        ? String(gameRaw)
        : '';
  if (!gameKey) return null;
  const meta = GAME_META[gameKey] ?? {
    labelKey: `admin.casino.catalog.game.${gameKey}`,
    category: 'originals' as CasinoGameCategory,
  };
  const theoreticalNum =
    typeof metadata['theoretical_rtp'] === 'number'
      ? metadata['theoretical_rtp']
      : Number(metadata['theoretical_rtp'] ?? 0);
  const observedNum =
    typeof metadata['measured_rtp'] === 'number'
      ? metadata['measured_rtp']
      : Number(metadata['measured_rtp'] ?? 0);
  const theoreticalRtp = Number.isFinite(theoreticalNum)
    ? (theoreticalNum * 100).toFixed(2).replace(/\.00$/, '')
    : '—';
  const observedRtp = Number.isFinite(observedNum)
    ? (observedNum * 100).toFixed(2).replace(/\.00$/, '')
    : '—';
  const driftPct =
    Number.isFinite(theoreticalNum) && Number.isFinite(observedNum)
      ? (Math.abs(theoreticalNum - observedNum) * 100).toFixed(2)
      : '—';
  const sampleSize =
    typeof metadata['bet_count'] === 'number'
      ? String(metadata['bet_count'])
      : typeof metadata['bet_count'] === 'string'
        ? metadata['bet_count']
        : '0';
  const windowEnd =
    typeof alert['last_seen_at'] === 'string' ? alert['last_seen_at'] : new Date().toISOString();
  const windowStart =
    typeof alert['first_seen_at'] === 'string' ? alert['first_seen_at'] : windowEnd;

  return {
    id,
    gameKey,
    labelKey: meta.labelKey,
    status: mapRtpStatus(alert['status']),
    severity: mapRtpSeverity(alert['severity']),
    theoreticalRtp,
    observedRtp,
    driftPct,
    sampleSize,
    windowStart,
    windowEnd,
    lastChangedAt: windowEnd,
  };
}

function mapCasinoAudit(log: {
  id: string;
  created_at: string;
  action: string;
  payload: Json;
}): AdminAuditEvent | null {
  const casinoActions = new Set([
    'admin_casino_game_status',
    'casino_rtp_drift_kill_switch',
    'ops_alert_acknowledged',
    'ops_alert_resolved',
  ]);
  if (!casinoActions.has(log.action) && !log.action.includes('casino')) {
    return null;
  }
  const payload = isRecord(log.payload) ? log.payload : {};
  const subject =
    typeof payload['game'] === 'string'
      ? payload['game']
      : typeof payload['alert_id'] === 'string'
        ? payload['alert_id']
        : log.action;
  return {
    id: log.id,
    at: log.created_at,
    actorKey: 'admin.primitive.audit.actor.system',
    actionKey: log.action,
    subject,
    reason:
      typeof payload['reason'] === 'string' && payload['reason'].length > 0
        ? payload['reason']
        : undefined,
  };
}

const validReason = (r: string | undefined) =>
  typeof r === 'string' && r.trim().length >= MIN_REASON;

function statusNeedsReason(s: CasinoGameStatus): boolean {
  return s === 'maintenance' || s === 'disabled';
}

/** Engine-backed casino desk (catalog + RTP ops alerts). */
export function useAdminCasinoDesk(): UseAdminCasinoDesk {
  const qc = useQueryClient();
  const mfaReady = useAdminMfaReady();
  const { data: auditLogs = [] } = useAuditLogs(50);

  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>({
    search: '',
    category: 'all',
    status: 'all',
  });
  const [rtpFilters, setRtpFilters] = useState<RtpFilters>({
    search: '',
    severity: 'all',
    status: 'all',
  });

  const { data, refetch } = useQuery({
    queryKey: ['admin-casino-desk'],
    queryFn: async () => {
      const [catalogRaw, alertsRaw] = await Promise.all([
        callRpc('rpc_admin_list_casino_catalog', {}),
        getOpsAlertsRaw(['open', 'acknowledged', 'resolved']),
      ]);
      const catalogPayload = isRecord(catalogRaw) ? catalogRaw : {};
      const windowEnd =
        typeof catalogPayload['fetched_at'] === 'string'
          ? catalogPayload['fetched_at']
          : new Date().toISOString();
      const gamesRaw = catalogPayload['games'];
      const catalog = (Array.isArray(gamesRaw) ? gamesRaw : [])
        .map((row) => mapCatalogRow(row, windowEnd))
        .filter((row): row is AdminCasinoGameRow => row !== null);

      const alertsPayload = isRecord(alertsRaw) ? alertsRaw : {};
      const alertsList = alertsPayload['alerts'];
      const rtpReviews = (Array.isArray(alertsList) ? alertsList : [])
        .map(mapRtpAlert)
        .filter((row): row is AdminRtpReviewRow => row !== null);

      return { catalog, rtpReviews };
    },
    enabled: mfaReady,
    staleTime: 30_000,
    refetchInterval: mfaReady ? 60_000 : false,
  });

  const catalog = data?.catalog ?? [];
  const rtpReviews = data?.rtpReviews ?? [];

  const filteredCatalog = useMemo(
    () => filterCatalog(catalog, catalogFilters),
    [catalog, catalogFilters],
  );
  const filteredRtpReviews = useMemo(
    () => filterRtp(rtpReviews, rtpFilters),
    [rtpReviews, rtpFilters],
  );

  const audit = useMemo<AdminAuditEvent[]>(() => {
    return auditLogs
      .map(mapCasinoAudit)
      .filter((row): row is AdminAuditEvent => row !== null)
      .slice(0, 30);
  }, [auditLogs]);

  const invalidate = useCallback(async () => {
    await refetch();
    await qc.invalidateQueries({ queryKey: ['audit-logs'] });
    await qc.invalidateQueries({ queryKey: ['app-config'] });
  }, [qc, refetch]);

  const applyGameStatus = useCallback(
    async (row: AdminCasinoGameRow, status: CasinoGameStatus, reason?: string) => {
      if (row.status === status) return false;
      if (statusNeedsReason(status) && !validReason(reason)) return false;
      try {
        await callRpc('rpc_admin_set_casino_game_status', {
          p_game: row.gameKey,
          p_status: status,
          p_reason: reason?.trim() ?? 'catalog status sync',
        });
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [invalidate],
  );

  const setGameStatus = useCallback(
    (id: string, status: CasinoGameStatus, reason?: string): boolean => {
      const row = catalog.find((r) => r.id === id);
      if (!row) return false;
      void applyGameStatus(row, status, reason);
      return true;
    },
    [applyGameStatus, catalog],
  );

  const bulkSetGameStatus = useCallback(
    (ids: string[], status: CasinoGameStatus, reason?: string): boolean => {
      if (statusNeedsReason(status) && !validReason(reason)) return false;
      let any = false;
      for (const id of ids) {
        const row = catalog.find((r) => r.id === id);
        if (row && row.status !== status) {
          void applyGameStatus(row, status, reason);
          any = true;
        }
      }
      return any;
    },
    [applyGameStatus, catalog],
  );

  const ackRtpReview = useCallback(
    (id: string): boolean => {
      const row = rtpReviews.find((r) => r.id === id);
      if (!row || row.status !== 'open') return false;
      void (async () => {
        try {
          await ackOpsAlert({ alertId: id, reason: 'RTP drift review acknowledged' });
          await invalidate();
        } catch {
          // display-only — hub refetch on next interval
        }
      })();
      return true;
    },
    [invalidate, rtpReviews],
  );

  const resolveRtpReview = useCallback(
    (id: string, reason: string): boolean => {
      if (!validReason(reason)) return false;
      const row = rtpReviews.find((r) => r.id === id);
      if (!row || row.status === 'resolved') return false;
      void (async () => {
        try {
          await resolveOpsAlert({ alertId: id, reason: reason.trim() });
          await invalidate();
        } catch {
          // noop
        }
      })();
      return true;
    },
    [invalidate, rtpReviews],
  );

  const bulkAckRtpReview = useCallback(
    (ids: string[]): boolean => {
      let any = false;
      for (const id of ids) if (ackRtpReview(id)) any = true;
      return any;
    },
    [ackRtpReview],
  );

  const bulkResolveRtpReview = useCallback(
    (ids: string[], reason: string): boolean => {
      if (!validReason(reason)) return false;
      let any = false;
      for (const id of ids) if (resolveRtpReview(id, reason)) any = true;
      return any;
    },
    [resolveRtpReview],
  );

  const resetForTest = useCallback(() => {
    void invalidate();
  }, [invalidate]);

  return {
    catalog,
    filteredCatalog,
    catalogFilters,
    setCatalogFilters,
    setGameStatus,
    bulkSetGameStatus,
    catalogCategories: CATALOG_CATEGORIES,
    catalogStatuses: CATALOG_STATUSES,

    rtpReviews,
    filteredRtpReviews,
    rtpFilters,
    setRtpFilters,
    ackRtpReview,
    resolveRtpReview,
    bulkAckRtpReview,
    bulkResolveRtpReview,
    rtpSeverities: RTP_SEVERITIES,
    rtpStatuses: RTP_STATUSES,

    audit,
    resetForTest,
  };
}
