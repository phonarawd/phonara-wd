import { useCallback, useMemo, useState } from 'react';
import { createAdminMockHook } from '@/hooks/admin/createAdminMockHook';
import type { AdminAuditEvent } from '@/shared-types';

// L1-15-I I1 — Admin Audit + Alerts mock SOT.
// Alerts: full mock w/ mutations (ack / resolve · reason ≥4).
// Audit feed: read-only merge from existing desk localStorage keys.
// supabase/rpc 0 · parseFloat/Number( 0 · NEVER writes to desk hook storage.

const MIN_REASON = 4;
const FEED_CAP = 200;

export type AuditDomain = 'wallet' | 'compliance' | 'users' | 'sports' | 'system';

export type AlertSeverity = 'critical' | 'warning';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved';

export interface AdminAuditFeedRow {
  id: string;
  at: string;
  actorKey: string;
  domain: AuditDomain;
  actionKey: string;
  subject?: string;
  reason?: string;
}

export interface AdminAlertRow {
  id: string;
  dedupeKey: string;
  sourceCheckId: string;
  severity: AlertSeverity;
  status: AlertStatus;
  summary: string;
  runbookKey: string;
  firstSeenAt: string;
  lastSeenAt: string;
  occurrenceCount: number;
}

export interface AuditFilters {
  search: string;
  domains: AuditDomain[];
  datePreset: 'all' | '1h' | '24h' | '7d';
}

export interface AlertFilters {
  search: string;
  severity: AlertSeverity[];
  status: AlertStatus[];
}

// SEED audit feed (≥20 · ≥4 domains) — used pre-hydration / when desk storage empty.
const SEED_AUDIT_FEED: AdminAuditFeedRow[] = [
  {
    id: 'af_001',
    at: '2026-06-17T09:14:00.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'wallet',
    actionKey: 'admin.wallet.audit.withdrawApprove',
    subject: 'wd_7821',
    reason: 'kyc + recon match',
  },
  {
    id: 'af_002',
    at: '2026-06-17T09:12:30.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'wallet',
    actionKey: 'admin.wallet.audit.withdrawReject',
    subject: 'wd_7820',
    reason: 'address blacklist',
  },
  {
    id: 'af_003',
    at: '2026-06-17T09:10:11.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'compliance',
    actionKey: 'admin.compliance.kyc.audit.approve',
    subject: 'kyc_3301',
    reason: 'documents complete',
  },
  {
    id: 'af_004',
    at: '2026-06-17T09:08:42.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'compliance',
    actionKey: 'admin.compliance.str.audit.file',
    subject: 'str_991',
    reason: 'structuring pattern',
  },
  {
    id: 'af_005',
    at: '2026-06-17T09:05:15.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'users',
    actionKey: 'admin.users.audit.suspend',
    subject: 'u_3010d2',
    reason: 'rg cooldown',
  },
  {
    id: 'af_006',
    at: '2026-06-17T09:01:08.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'users',
    actionKey: 'admin.users.audit.mfaReset',
    subject: 'u_77a8e1',
    reason: 'device lost',
  },
  {
    id: 'af_007',
    at: '2026-06-17T08:58:00.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'sports',
    actionKey: 'admin.sports.audit.voidBet',
    subject: 'bet_24517',
    reason: 'market mispriced',
  },
  {
    id: 'af_008',
    at: '2026-06-17T08:54:21.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'system',
    actionKey: 'admin.system.audit.cronRun',
    subject: 'cron_payout',
    reason: 'scheduled tick',
  },
  {
    id: 'af_009',
    at: '2026-06-17T08:50:09.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'wallet',
    actionKey: 'admin.wallet.audit.depositConfirm',
    subject: 'dp_4410',
    reason: '6 confirmations',
  },
  {
    id: 'af_010',
    at: '2026-06-17T08:46:00.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'compliance',
    actionKey: 'admin.compliance.risk.audit.cooldown',
    subject: 'rg_882',
    reason: 'self-exclusion 24h',
  },
  {
    id: 'af_011',
    at: '2026-06-17T08:40:25.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'users',
    actionKey: 'admin.users.audit.sessionKill',
    subject: 'u_3c911b',
    reason: 'geo mismatch',
  },
  {
    id: 'af_012',
    at: '2026-06-17T08:33:11.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'sports',
    actionKey: 'admin.sports.audit.settleManual',
    subject: 'evt_99812',
    reason: 'feed outage backfill',
  },
  {
    id: 'af_013',
    at: '2026-06-17T08:21:00.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'system',
    actionKey: 'admin.system.audit.featureToggle',
    subject: 'feat_trade_perps',
    reason: 'limited rollout',
  },
  {
    id: 'af_014',
    at: '2026-06-17T08:15:42.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'wallet',
    actionKey: 'admin.wallet.audit.reconResolve',
    subject: 'rcn_220',
    reason: 'matched on-chain tx',
  },
  {
    id: 'af_015',
    at: '2026-06-17T08:09:33.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'compliance',
    actionKey: 'admin.compliance.kyc.audit.reject',
    subject: 'kyc_3299',
    reason: 'document expired',
  },
  {
    id: 'af_016',
    at: '2026-06-17T08:01:00.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'users',
    actionKey: 'admin.users.audit.ban',
    subject: 'u_c910f4',
    reason: 'fraud network',
  },
  {
    id: 'af_017',
    at: '2026-06-17T07:55:18.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'system',
    actionKey: 'admin.system.audit.killSwitch',
    subject: 'kill_games_crash',
    reason: 'engine anomaly',
  },
  {
    id: 'af_018',
    at: '2026-06-17T07:48:00.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'sports',
    actionKey: 'admin.sports.audit.suspendMarket',
    subject: 'mkt_eu_1142',
    reason: 'injury news',
  },
  {
    id: 'af_019',
    at: '2026-06-17T07:40:00.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'wallet',
    actionKey: 'admin.wallet.audit.withdrawHold',
    subject: 'wd_7811',
    reason: 'manual review',
  },
  {
    id: 'af_020',
    at: '2026-06-17T07:31:00.000Z',
    actorKey: 'admin.primitive.audit.actor.system',
    domain: 'compliance',
    actionKey: 'admin.compliance.str.audit.escalate',
    subject: 'str_988',
    reason: 'FIU referral',
  },
];

const SEED_ALERTS: AdminAlertRow[] = [
  {
    id: 'al_001',
    dedupeKey: 'wallet.recon.lag',
    sourceCheckId: 'check_wallet_recon',
    severity: 'critical',
    status: 'open',
    summary: 'Wallet reconciliation lag exceeds 5 minutes',
    runbookKey: 'rb_wallet_recon',
    firstSeenAt: '2026-06-17T09:02:00.000Z',
    lastSeenAt: '2026-06-17T09:14:00.000Z',
    occurrenceCount: 8,
  },
  {
    id: 'al_002',
    dedupeKey: 'trade.engine.5xx',
    sourceCheckId: 'check_trade_engine',
    severity: 'critical',
    status: 'open',
    summary: 'Trade engine 5xx rate > 2%',
    runbookKey: 'rb_trade_engine',
    firstSeenAt: '2026-06-17T08:55:00.000Z',
    lastSeenAt: '2026-06-17T09:13:30.000Z',
    occurrenceCount: 23,
  },
  {
    id: 'al_003',
    dedupeKey: 'kyc.queue.sla',
    sourceCheckId: 'check_kyc_sla',
    severity: 'warning',
    status: 'open',
    summary: 'KYC queue SLA overdue for 12 cases',
    runbookKey: 'rb_kyc_sla',
    firstSeenAt: '2026-06-17T07:30:00.000Z',
    lastSeenAt: '2026-06-17T09:10:00.000Z',
    occurrenceCount: 12,
  },
  {
    id: 'al_004',
    dedupeKey: 'sports.feed.gap',
    sourceCheckId: 'check_sports_feed',
    severity: 'warning',
    status: 'open',
    summary: 'Sports feed gap on EU football market',
    runbookKey: 'rb_sports_feed',
    firstSeenAt: '2026-06-17T08:20:00.000Z',
    lastSeenAt: '2026-06-17T09:11:00.000Z',
    occurrenceCount: 5,
  },
  {
    id: 'al_005',
    dedupeKey: 'auth.mfa.failures',
    sourceCheckId: 'check_auth_mfa',
    severity: 'warning',
    status: 'acknowledged',
    summary: 'MFA failure burst from a single ASN',
    runbookKey: 'rb_auth_mfa',
    firstSeenAt: '2026-06-17T06:10:00.000Z',
    lastSeenAt: '2026-06-17T08:42:00.000Z',
    occurrenceCount: 17,
  },
  {
    id: 'al_006',
    dedupeKey: 'cron.payout.skew',
    sourceCheckId: 'check_cron_payout',
    severity: 'critical',
    status: 'acknowledged',
    summary: 'Payout cron skew vs schedule',
    runbookKey: 'rb_cron_payout',
    firstSeenAt: '2026-06-17T05:45:00.000Z',
    lastSeenAt: '2026-06-17T08:01:00.000Z',
    occurrenceCount: 3,
  },
  {
    id: 'al_007',
    dedupeKey: 'deposit.lag.btc',
    sourceCheckId: 'check_deposit_lag',
    severity: 'warning',
    status: 'resolved',
    summary: 'BTC deposit confirmation lag normalized',
    runbookKey: 'rb_deposit_lag',
    firstSeenAt: '2026-06-17T03:10:00.000Z',
    lastSeenAt: '2026-06-17T06:02:00.000Z',
    occurrenceCount: 9,
  },
  {
    id: 'al_008',
    dedupeKey: 'system.disk.usage',
    sourceCheckId: 'check_disk_usage',
    severity: 'warning',
    status: 'open',
    summary: 'Disk usage > 80% on log node',
    runbookKey: 'rb_disk_usage',
    firstSeenAt: '2026-06-17T08:48:00.000Z',
    lastSeenAt: '2026-06-17T09:09:00.000Z',
    occurrenceCount: 4,
  },
];

// Read-only desk audit storage keys — never written, only parsed.
const DESK_STORAGE_KEYS: Array<{ key: string; domain: AuditDomain }> = [
  { key: 'admin:wallet:withdraw:v1', domain: 'wallet' },
  { key: 'admin:wallet:deposit:v1', domain: 'wallet' },
  { key: 'admin:compliance:kyc:v1', domain: 'compliance' },
  { key: 'admin:compliance:str:v1', domain: 'compliance' },
  { key: 'admin:compliance:risk:v1', domain: 'compliance' },
  { key: 'admin:users:v1', domain: 'users' },
];

function parseDeskAudit(): AdminAuditFeedRow[] {
  if (typeof window === 'undefined') return [];
  const out: AdminAuditFeedRow[] = [];
  for (const { key, domain } of DESK_STORAGE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { audit?: AdminAuditEvent[] };
      if (!parsed || !Array.isArray(parsed.audit)) continue;
      for (const ev of parsed.audit) {
        if (!ev || typeof ev.id !== 'string') continue;
        out.push({
          id: ev.id,
          at: ev.at,
          actorKey: ev.actorKey,
          domain,
          actionKey: ev.actionKey,
          subject: ev.subject,
          reason: ev.reason,
        });
      }
    } catch {
      // ignore corrupt entries
    }
  }
  return out;
}

function mergeFeed(base: AdminAuditFeedRow[], extra: AdminAuditFeedRow[]): AdminAuditFeedRow[] {
  const seen = new Set<string>();
  const all = [...extra, ...base];
  const dedup: AdminAuditFeedRow[] = [];
  for (const r of all) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    dedup.push(r);
  }
  dedup.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return dedup.slice(0, FEED_CAP);
}

function filterAlerts(rows: AdminAlertRow[], f: AlertFilters): AdminAlertRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.severity.length > 0 && !f.severity.includes(r.severity)) return false;
    if (f.status.length > 0 && !f.status.includes(r.status)) return false;
    if (!q) return true;
    return (
      r.summary.toLowerCase().includes(q) ||
      r.dedupeKey.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });
}

const useAlertsMock = createAdminMockHook<AdminAlertRow, AlertFilters>({
  storageKey: 'admin:alerts:v1',
  seedRows: SEED_ALERTS,
  seedFilters: { search: '', severity: [], status: [] },
  filterFn: filterAlerts,
  auditCap: 100,
});

const DOMAIN_LIST: AuditDomain[] = ['wallet', 'compliance', 'users', 'sports', 'system'];

function withinPreset(at: string, preset: AuditFilters['datePreset']): boolean {
  if (preset === 'all') return true;
  try {
    const ts = new Date(at).getTime();
    const now = Date.now();
    const windowMs =
      preset === '1h'
        ? 60 * 60 * 1000
        : preset === '24h'
          ? 24 * 60 * 60 * 1000
          : 7 * 24 * 60 * 60 * 1000;
    return now - ts <= windowMs;
  } catch {
    return true;
  }
}

function filterAuditFeed(rows: AdminAuditFeedRow[], f: AuditFilters): AdminAuditFeedRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.domains.length > 0 && !f.domains.includes(r.domain)) return false;
    if (!withinPreset(r.at, f.datePreset)) return false;
    if (!q) return true;
    return (
      r.actionKey.toLowerCase().includes(q) ||
      (r.subject ?? '').toLowerCase().includes(q) ||
      (r.reason ?? '').toLowerCase().includes(q)
    );
  });
}

export interface UseAdminAuditAlerts {
  // audit feed (read-only)
  auditFeed: AdminAuditFeedRow[];
  filteredAuditFeed: AdminAuditFeedRow[];
  auditFilters: AuditFilters;
  setAuditFilters: (f: AuditFilters | ((p: AuditFilters) => AuditFilters)) => void;
  refreshAuditFeed: () => void;
  auditDomains: AuditDomain[];

  // alerts (mutable)
  alerts: AdminAlertRow[];
  filteredAlerts: AdminAlertRow[];
  alertFilters: AlertFilters;
  setAlertFilters: (f: AlertFilters | ((p: AlertFilters) => AlertFilters)) => void;
  ackAlert: (id: string, reason: string) => void;
  resolveAlert: (id: string, reason: string) => void;
  bulkAckAlert: (ids: string[], reason: string) => void;
  bulkResolveAlert: (ids: string[], reason: string) => void;
  alertAudit: AdminAuditEvent[];

  confirmAckAlert?: (id: string, reason: string) => Promise<boolean>;

  resetForTest: () => void;
}

const nowIso = () => new Date().toISOString();
const validReason = (r: string) => r.trim().length >= MIN_REASON;

export function useAdminAuditAlertsMock(): UseAdminAuditAlerts {
  const alertsMock = useAlertsMock();

  // Audit feed lives in local React state — it's a read-only merge view,
  // never persisted to its own storage key, never writes to desk storage.
  const [feedTick, setFeedTick] = useState(0);
  const [auditFilters, setAuditFilters] = useState<AuditFilters>({
    search: '',
    domains: [],
    datePreset: 'all',
  });

  const auditFeed = useMemo(() => mergeFeed(SEED_AUDIT_FEED, parseDeskAudit()), [feedTick]);

  const filteredAuditFeed = useMemo(
    () => filterAuditFeed(auditFeed, auditFilters),
    [auditFeed, auditFilters],
  );

  const refreshAuditFeed = useCallback(() => {
    setFeedTick((t) => t + 1);
  }, []);

  const ackAlert = useCallback(
    (id: string, reason: string) => {
      void reason;
      const row = alertsMock.allRows.find((r) => r.id === id);
      if (!row || row.status !== 'open') return;
      alertsMock.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, status: 'acknowledged', lastSeenAt: nowIso() }),
      );
      alertsMock.appendAudit({
        id: `${id}-ack-${nowIso()}`,
        at: nowIso(),
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.alerts.audit.ack',
        subject: id,
      });
    },
    [alertsMock],
  );

  const resolveAlert = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = alertsMock.allRows.find((r) => r.id === id);
      if (!row || row.status === 'resolved') return;
      alertsMock.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, status: 'resolved', lastSeenAt: nowIso() }),
      );
      alertsMock.appendAudit({
        id: `${id}-resolve-${nowIso()}`,
        at: nowIso(),
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.alerts.audit.resolve',
        subject: id,
        reason: reason.trim(),
      });
    },
    [alertsMock],
  );

  const bulkAckAlert = useCallback(
    (ids: string[], reason: string) => {
      ids.forEach((id) => ackAlert(id, reason));
    },
    [ackAlert],
  );

  const bulkResolveAlert = useCallback(
    (ids: string[], reason: string) => {
      if (!validReason(reason)) return;
      ids.forEach((id) => resolveAlert(id, reason));
    },
    [resolveAlert],
  );

  const confirmAckAlert = useCallback(
    async (id: string, reason: string) => {
      ackAlert(id, reason);
      return true;
    },
    [ackAlert],
  );

  const alertAudit = useMemo(
    () => alertsMock.audit.filter((e) => e.actionKey.startsWith('admin.alerts.audit')),
    [alertsMock.audit],
  );

  const resetForTest = useCallback(() => {
    alertsMock.resetForTest();
    setAuditFilters({ search: '', domains: [], datePreset: 'all' });
    setFeedTick((t) => t + 1);
  }, [alertsMock]);

  return {
    auditFeed,
    filteredAuditFeed,
    auditFilters,
    setAuditFilters,
    refreshAuditFeed,
    auditDomains: DOMAIN_LIST,

    alerts: alertsMock.allRows,
    filteredAlerts: alertsMock.rows,
    alertFilters: alertsMock.filters,
    setAlertFilters: alertsMock.setFilters,
    ackAlert,
    resolveAlert,
    bulkAckAlert,
    bulkResolveAlert,
    confirmAckAlert,
    alertAudit,

    resetForTest,
  };
}
