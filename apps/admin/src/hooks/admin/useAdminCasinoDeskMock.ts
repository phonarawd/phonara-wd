import { useCallback } from 'react';
import { createAdminMockHook } from '@/hooks/admin/createAdminMockHook';
import type { AdminAuditEvent } from '@/shared-types';

// L1-15-E · Admin Casino Desk mock SOT.
// Two domains: Catalog (per-game ops) + RTP Review queue.
// Persist under `phonara-admin-casino-*` only. Operations storage 0-touch.
// String-only numeric display fields · no float math · no rpc/supabase.

const MIN_REASON = 4;

export type CasinoGameCategory = 'originals' | 'table' | 'instant';
export type CasinoGameStatus = 'live' | 'maintenance' | 'disabled';
export type RtpSeverity = 'warning' | 'critical';
export type RtpReviewStatus = 'open' | 'acknowledged' | 'resolved';

export interface AdminCasinoGameRow {
  id: string;
  gameKey: string;
  labelKey: string;
  category: CasinoGameCategory;
  status: CasinoGameStatus;
  enabled: boolean;
  rtpConfigured: string;
  rtpObserved24h?: string;
  rtpDriftPct?: string;
  bets24h: string;
  lastChangedAt?: string;
  lastChangedByKey?: string;
}

export interface AdminRtpReviewRow {
  id: string;
  gameKey: string;
  labelKey: string;
  status: RtpReviewStatus;
  severity: RtpSeverity;
  theoreticalRtp: string;
  observedRtp: string;
  driftPct: string;
  sampleSize: string;
  windowStart: string;
  windowEnd: string;
  lastChangedAt?: string;
}

export interface CatalogFilters {
  search: string;
  category: CasinoGameCategory | 'all';
  status: CasinoGameStatus | 'all';
}

export interface RtpFilters {
  search: string;
  severity: RtpSeverity | 'all';
  status: RtpReviewStatus | 'all';
}

// --- SEED -------------------------------------------------------------------

const SEED_CATALOG: AdminCasinoGameRow[] = [
  {
    id: 'cg_crash',
    gameKey: 'crash',
    labelKey: 'admin.casino.catalog.game.crash',
    category: 'originals',
    status: 'live',
    enabled: true,
    rtpConfigured: '99',
    rtpObserved24h: '98',
    rtpDriftPct: '1',
    bets24h: '184320',
  },
  {
    id: 'cg_dice',
    gameKey: 'dice',
    labelKey: 'admin.casino.catalog.game.dice',
    category: 'originals',
    status: 'live',
    enabled: true,
    rtpConfigured: '99',
    rtpObserved24h: '99',
    rtpDriftPct: '0',
    bets24h: '120480',
  },
  {
    id: 'cg_limbo',
    gameKey: 'limbo',
    labelKey: 'admin.casino.catalog.game.limbo',
    category: 'originals',
    status: 'live',
    enabled: true,
    rtpConfigured: '99',
    rtpObserved24h: '97',
    rtpDriftPct: '2',
    bets24h: '76140',
  },
  {
    id: 'cg_mines',
    gameKey: 'mines',
    labelKey: 'admin.casino.catalog.game.mines',
    category: 'originals',
    status: 'live',
    enabled: true,
    rtpConfigured: '97',
    rtpObserved24h: '96',
    rtpDriftPct: '1',
    bets24h: '54820',
  },
  {
    id: 'cg_plinko',
    gameKey: 'plinko',
    labelKey: 'admin.casino.catalog.game.plinko',
    category: 'originals',
    status: 'live',
    enabled: true,
    rtpConfigured: '99',
    rtpObserved24h: '98',
    rtpDriftPct: '1',
    bets24h: '92410',
  },
  {
    id: 'cg_hilo',
    gameKey: 'hilo',
    labelKey: 'admin.casino.catalog.game.hilo',
    category: 'table',
    status: 'live',
    enabled: true,
    rtpConfigured: '98',
    rtpObserved24h: '97',
    rtpDriftPct: '1',
    bets24h: '31280',
  },
  {
    id: 'cg_blackjack',
    gameKey: 'blackjack',
    labelKey: 'admin.casino.catalog.game.blackjack',
    category: 'table',
    status: 'live',
    enabled: true,
    rtpConfigured: '99',
    rtpObserved24h: '99',
    rtpDriftPct: '0',
    bets24h: '42910',
  },
  {
    id: 'cg_roulette',
    gameKey: 'roulette',
    labelKey: 'admin.casino.catalog.game.roulette',
    category: 'table',
    status: 'maintenance',
    enabled: false,
    rtpConfigured: '97',
    rtpObserved24h: '94',
    rtpDriftPct: '3',
    bets24h: '18520',
  },
  {
    id: 'cg_gold_rush',
    gameKey: 'gold_rush',
    labelKey: 'admin.casino.catalog.game.gold_rush',
    category: 'instant',
    status: 'maintenance',
    enabled: false,
    rtpConfigured: '96',
    rtpObserved24h: '92',
    rtpDriftPct: '4',
    bets24h: '12380',
  },
  {
    id: 'cg_mint_reels',
    gameKey: 'mint_reels',
    labelKey: 'admin.casino.catalog.game.mint_reels',
    category: 'instant',
    status: 'disabled',
    enabled: false,
    rtpConfigured: '96',
    rtpObserved24h: '88',
    rtpDriftPct: '8',
    bets24h: '0',
  },
];

const SEED_RTP: AdminRtpReviewRow[] = [
  {
    id: 'rtp_mint_reels_01',
    gameKey: 'mint_reels',
    labelKey: 'admin.casino.catalog.game.mint_reels',
    status: 'open',
    severity: 'critical',
    theoreticalRtp: '96',
    observedRtp: '88',
    driftPct: '8',
    sampleSize: '42100',
    windowStart: '2026-06-16T00:00:00.000Z',
    windowEnd: '2026-06-17T00:00:00.000Z',
  },
  {
    id: 'rtp_gold_rush_01',
    gameKey: 'gold_rush',
    labelKey: 'admin.casino.catalog.game.gold_rush',
    status: 'open',
    severity: 'warning',
    theoreticalRtp: '96',
    observedRtp: '92',
    driftPct: '4',
    sampleSize: '33920',
    windowStart: '2026-06-16T00:00:00.000Z',
    windowEnd: '2026-06-17T00:00:00.000Z',
  },
  {
    id: 'rtp_roulette_01',
    gameKey: 'roulette',
    labelKey: 'admin.casino.catalog.game.roulette',
    status: 'open',
    severity: 'warning',
    theoreticalRtp: '97',
    observedRtp: '94',
    driftPct: '3',
    sampleSize: '21450',
    windowStart: '2026-06-16T00:00:00.000Z',
    windowEnd: '2026-06-17T00:00:00.000Z',
  },
  {
    id: 'rtp_limbo_01',
    gameKey: 'limbo',
    labelKey: 'admin.casino.catalog.game.limbo',
    status: 'acknowledged',
    severity: 'warning',
    theoreticalRtp: '99',
    observedRtp: '97',
    driftPct: '2',
    sampleSize: '61230',
    windowStart: '2026-06-15T00:00:00.000Z',
    windowEnd: '2026-06-16T00:00:00.000Z',
  },
  {
    id: 'rtp_mines_01',
    gameKey: 'mines',
    labelKey: 'admin.casino.catalog.game.mines',
    status: 'acknowledged',
    severity: 'warning',
    theoreticalRtp: '97',
    observedRtp: '96',
    driftPct: '1',
    sampleSize: '49180',
    windowStart: '2026-06-15T00:00:00.000Z',
    windowEnd: '2026-06-16T00:00:00.000Z',
  },
  {
    id: 'rtp_plinko_01',
    gameKey: 'plinko',
    labelKey: 'admin.casino.catalog.game.plinko',
    status: 'resolved',
    severity: 'warning',
    theoreticalRtp: '99',
    observedRtp: '98',
    driftPct: '1',
    sampleSize: '77620',
    windowStart: '2026-06-14T00:00:00.000Z',
    windowEnd: '2026-06-15T00:00:00.000Z',
  },
  {
    id: 'rtp_crash_01',
    gameKey: 'crash',
    labelKey: 'admin.casino.catalog.game.crash',
    status: 'resolved',
    severity: 'warning',
    theoreticalRtp: '99',
    observedRtp: '98',
    driftPct: '1',
    sampleSize: '152840',
    windowStart: '2026-06-14T00:00:00.000Z',
    windowEnd: '2026-06-15T00:00:00.000Z',
  },
  {
    id: 'rtp_hilo_01',
    gameKey: 'hilo',
    labelKey: 'admin.casino.catalog.game.hilo',
    status: 'open',
    severity: 'warning',
    theoreticalRtp: '98',
    observedRtp: '97',
    driftPct: '1',
    sampleSize: '18420',
    windowStart: '2026-06-16T00:00:00.000Z',
    windowEnd: '2026-06-17T00:00:00.000Z',
  },
];

function filterCatalog(rows: AdminCasinoGameRow[], f: CatalogFilters): AdminCasinoGameRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.category !== 'all' && r.category !== f.category) return false;
    if (f.status !== 'all' && r.status !== f.status) return false;
    if (!q) return true;
    return r.gameKey.toLowerCase().includes(q) || r.labelKey.toLowerCase().includes(q);
  });
}

function filterRtp(rows: AdminRtpReviewRow[], f: RtpFilters): AdminRtpReviewRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.severity !== 'all' && r.severity !== f.severity) return false;
    if (f.status !== 'all' && r.status !== f.status) return false;
    if (!q) return true;
    return r.gameKey.toLowerCase().includes(q) || r.labelKey.toLowerCase().includes(q);
  });
}

// --- hook factories --------------------------------------------------------

const useCatalogMock = createAdminMockHook<AdminCasinoGameRow, CatalogFilters>({
  storageKey: 'phonara-admin-casino-catalog-v1',
  seedRows: SEED_CATALOG,
  seedFilters: { search: '', category: 'all', status: 'all' },
  filterFn: filterCatalog,
  auditCap: 100,
});

const useRtpMock = createAdminMockHook<AdminRtpReviewRow, RtpFilters>({
  storageKey: 'phonara-admin-casino-rtp-v1',
  seedRows: SEED_RTP,
  seedFilters: { search: '', severity: 'all', status: 'all' },
  filterFn: filterRtp,
  auditCap: 100,
});

const CATALOG_CATEGORIES: CasinoGameCategory[] = ['originals', 'table', 'instant'];
const CATALOG_STATUSES: CasinoGameStatus[] = ['live', 'maintenance', 'disabled'];
const RTP_SEVERITIES: RtpSeverity[] = ['warning', 'critical'];
const RTP_STATUSES: RtpReviewStatus[] = ['open', 'acknowledged', 'resolved'];

export {
  filterCatalog,
  filterRtp,
  CATALOG_CATEGORIES,
  CATALOG_STATUSES,
  RTP_SEVERITIES,
  RTP_STATUSES,
  MIN_REASON as CASINO_DESK_MIN_REASON,
};

export interface UseAdminCasinoDesk {
  // catalog
  catalog: AdminCasinoGameRow[];
  filteredCatalog: AdminCasinoGameRow[];
  catalogFilters: CatalogFilters;
  setCatalogFilters: (f: CatalogFilters | ((p: CatalogFilters) => CatalogFilters)) => void;
  setGameStatus: (id: string, status: CasinoGameStatus, reason?: string) => boolean;
  bulkSetGameStatus: (ids: string[], status: CasinoGameStatus, reason?: string) => boolean;
  catalogCategories: CasinoGameCategory[];
  catalogStatuses: CasinoGameStatus[];

  // rtp
  rtpReviews: AdminRtpReviewRow[];
  filteredRtpReviews: AdminRtpReviewRow[];
  rtpFilters: RtpFilters;
  setRtpFilters: (f: RtpFilters | ((p: RtpFilters) => RtpFilters)) => void;
  ackRtpReview: (id: string, reason: string) => Promise<boolean>;
  resolveRtpReview: (id: string, reason: string) => Promise<boolean>;
  bulkAckRtpReview: (ids: string[], reason: string) => Promise<boolean>;
  bulkResolveRtpReview: (ids: string[], reason: string) => Promise<boolean>;
  rtpSeverities: RtpSeverity[];
  rtpStatuses: RtpReviewStatus[];

  // shared
  audit: AdminAuditEvent[];
  refresh: () => Promise<void>;
  resetForTest: () => void;
}

const nowIso = () => new Date().toISOString();
const validReason = (r: string | undefined) =>
  typeof r === 'string' && r.trim().length >= MIN_REASON;

function statusNeedsReason(s: CasinoGameStatus): boolean {
  return s === 'maintenance' || s === 'disabled';
}

export function useAdminCasinoDeskMock(): UseAdminCasinoDesk {
  const cat = useCatalogMock();
  const rtp = useRtpMock();

  const setGameStatus = useCallback(
    (id: string, status: CasinoGameStatus, reason?: string): boolean => {
      const row = cat.allRows.find((r) => r.id === id);
      if (!row) return false;
      if (row.status === status) return false;
      if (statusNeedsReason(status) && !validReason(reason)) return false;
      const at = nowIso();
      cat.patchRow(
        id,
        (r) => r.id,
        (r) => ({
          ...r,
          status,
          enabled: status === 'live',
          lastChangedAt: at,
          lastChangedByKey: 'admin.primitive.audit.actor.system',
        }),
      );
      cat.appendAudit({
        id: `${row.gameKey}-${status}-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: `admin.casino.catalog.audit.${status}`,
        subject: row.gameKey,
        reason: reason ? reason.trim() : undefined,
      });
      return true;
    },
    [cat],
  );

  const bulkSetGameStatus = useCallback(
    (ids: string[], status: CasinoGameStatus, reason?: string): boolean => {
      if (statusNeedsReason(status) && !validReason(reason)) return false;
      let any = false;
      for (const id of ids) {
        if (setGameStatus(id, status, reason)) any = true;
      }
      return any;
    },
    [setGameStatus],
  );

  const ackRtpReview = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      const row = rtp.allRows.find((r) => r.id === id);
      if (!row) return false;
      if (row.status !== 'open') return false;
      const at = nowIso();
      rtp.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, status: 'acknowledged', lastChangedAt: at }),
      );
      rtp.appendAudit({
        id: `${row.gameKey}-ack-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.casino.rtp.audit.ack',
        subject: row.gameKey,
        reason: reason.trim(),
      });
      return true;
    },
    [rtp],
  );

  const resolveRtpReview = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      const row = rtp.allRows.find((r) => r.id === id);
      if (!row) return false;
      if (row.status === 'resolved') return false;
      const at = nowIso();
      rtp.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, status: 'resolved', lastChangedAt: at }),
      );
      rtp.appendAudit({
        id: `${row.gameKey}-resolve-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.casino.rtp.audit.resolve',
        subject: row.gameKey,
        reason: reason.trim(),
      });
      return true;
    },
    [rtp],
  );

  const bulkAckRtpReview = useCallback(
    async (ids: string[], reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      let any = false;
      for (const id of ids) {
        if (await ackRtpReview(id, reason)) any = true;
      }
      return any;
    },
    [ackRtpReview],
  );

  const bulkResolveRtpReview = useCallback(
    async (ids: string[], reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      let any = false;
      for (const id of ids) {
        if (await resolveRtpReview(id, reason)) any = true;
      }
      return any;
    },
    [resolveRtpReview],
  );

  // Combined audit feed (newest first by `at`).
  const audit: AdminAuditEvent[] = [...cat.audit, ...rtp.audit].sort((a, b) =>
    a.at < b.at ? 1 : a.at > b.at ? -1 : 0,
  );

  const resetForTest = useCallback(() => {
    cat.resetForTest();
    rtp.resetForTest();
  }, [cat, rtp]);

  return {
    catalog: cat.allRows,
    filteredCatalog: cat.rows,
    catalogFilters: cat.filters,
    setCatalogFilters: cat.setFilters,
    setGameStatus,
    bulkSetGameStatus,
    catalogCategories: CATALOG_CATEGORIES,
    catalogStatuses: CATALOG_STATUSES,

    rtpReviews: rtp.allRows,
    filteredRtpReviews: rtp.rows,
    rtpFilters: rtp.filters,
    setRtpFilters: rtp.setFilters,
    ackRtpReview,
    resolveRtpReview,
    bulkAckRtpReview,
    bulkResolveRtpReview,
    rtpSeverities: RTP_SEVERITIES,
    rtpStatuses: RTP_STATUSES,

    audit,
    refresh: async () => undefined,
    resetForTest,
  };
}
