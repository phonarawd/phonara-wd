import { useCallback, useMemo, useState } from "react";
import { createAdminMockHook } from "@/hooks/admin/createAdminMockHook";
import type { AdminAuditEvent } from "@/components/admin/primitives";

// L1-15-H · Admin Operations 2.0 mock SOT.
// Health: read-only display rows (no row mutation API). refreshHealth re-rolls
// the observed-at tick only — never writes to any other desk's localStorage.
// Kill switches: mutable rows, reason ≥4 gate, audit on every toggle.
// String-only numeric display fields · no float math · isolated from desks.

const MIN_REASON = 4;

export type OpsHealthStatus = "ok" | "warning" | "critical";
export type OpsHealthCategory = "cron" | "queue" | "budget" | "infra";
export type OpsKillCategory =
  | "system"
  | "wallet"
  | "trading"
  | "sports"
  | "earn";
export type OpsKillTone = "danger" | "warning" | "primary";

export interface AdminOpsHealthRow {
  id: string;
  checkKey: string;
  category: OpsHealthCategory;
  status: OpsHealthStatus;
  summary: string;
  lastRunAt: string;
  lastSuccessfulAt?: string;
  lastErrorAt?: string;
  observedAt: string;
  lagSeconds?: string;
  budgetRemainingPct?: string;
}

export interface AdminKillSwitchRow {
  id: string;
  switchKey: string;
  category: OpsKillCategory;
  labelKey: string;
  enabled: boolean;
  tone: OpsKillTone;
  lastChangedAt?: string;
  lastChangedByKey?: string;
}

export interface OpsHealthFilters {
  search: string;
  status: OpsHealthStatus | "all";
  category: OpsHealthCategory | "all";
}

export interface OpsKillFilters {
  search: string;
  category: OpsKillCategory | "all";
}

// --- SEED -------------------------------------------------------------------

const SEED_HEALTH: AdminOpsHealthRow[] = [
  {
    id: "oh_cron_liq",
    checkKey: "cron_liquidation_liveness",
    category: "cron",
    status: "ok",
    summary: "Liquidation cron ran on schedule",
    lastRunAt: "2026-06-17T09:14:00.000Z",
    lastSuccessfulAt: "2026-06-17T09:14:00.000Z",
    observedAt: "2026-06-17T09:14:12.000Z",
  },
  {
    id: "oh_cron_settle",
    checkKey: "cron_settlement_liveness",
    category: "cron",
    status: "warning",
    summary: "Settlement cron skew above target",
    lastRunAt: "2026-06-17T09:08:00.000Z",
    lastSuccessfulAt: "2026-06-17T09:08:00.000Z",
    lastErrorAt: "2026-06-17T08:48:00.000Z",
    observedAt: "2026-06-17T09:14:00.000Z",
  },
  {
    id: "oh_cron_recon",
    checkKey: "cron_reconciliation",
    category: "cron",
    status: "critical",
    summary: "Reconciliation cron last run failed",
    lastRunAt: "2026-06-17T09:00:00.000Z",
    lastSuccessfulAt: "2026-06-17T07:00:00.000Z",
    lastErrorAt: "2026-06-17T09:00:00.000Z",
    observedAt: "2026-06-17T09:14:00.000Z",
  },
  {
    id: "oh_queue_wd",
    checkKey: "queue_withdraw_lag",
    category: "queue",
    status: "critical",
    summary: "Withdraw queue lag above threshold",
    lastRunAt: "2026-06-17T09:13:30.000Z",
    lastSuccessfulAt: "2026-06-17T09:10:00.000Z",
    lastErrorAt: "2026-06-17T09:13:30.000Z",
    observedAt: "2026-06-17T09:14:00.000Z",
    lagSeconds: "182",
  },
  {
    id: "oh_queue_kyc",
    checkKey: "queue_kyc_lag",
    category: "queue",
    status: "warning",
    summary: "KYC queue lag elevated",
    lastRunAt: "2026-06-17T09:13:00.000Z",
    observedAt: "2026-06-17T09:14:00.000Z",
    lagSeconds: "92",
  },
  {
    id: "oh_queue_str",
    checkKey: "queue_str_lag",
    category: "queue",
    status: "ok",
    summary: "STR queue lag nominal",
    lastRunAt: "2026-06-17T09:14:00.000Z",
    lastSuccessfulAt: "2026-06-17T09:14:00.000Z",
    observedAt: "2026-06-17T09:14:08.000Z",
    lagSeconds: "12",
  },
  {
    id: "oh_budget_24h",
    checkKey: "error_budget_24h",
    category: "budget",
    status: "warning",
    summary: "24h error budget burning fast",
    lastRunAt: "2026-06-17T09:14:00.000Z",
    observedAt: "2026-06-17T09:14:00.000Z",
    budgetRemainingPct: "14",
  },
  {
    id: "oh_budget_7d",
    checkKey: "error_budget_7d",
    category: "budget",
    status: "ok",
    summary: "7d error budget healthy",
    lastRunAt: "2026-06-17T09:14:00.000Z",
    observedAt: "2026-06-17T09:14:00.000Z",
    budgetRemainingPct: "68",
  },
  {
    id: "oh_infra_recon",
    checkKey: "reconciliation_latest",
    category: "infra",
    status: "ok",
    summary: "Latest reconciliation matched on-chain ledger",
    lastRunAt: "2026-06-17T09:00:00.000Z",
    lastSuccessfulAt: "2026-06-17T09:00:00.000Z",
    observedAt: "2026-06-17T09:14:00.000Z",
  },
  {
    id: "oh_infra_hash",
    checkKey: "hash_chain_integrity",
    category: "infra",
    status: "warning",
    summary: "Hash chain delayed verification window",
    lastRunAt: "2026-06-17T08:55:00.000Z",
    lastSuccessfulAt: "2026-06-17T08:55:00.000Z",
    observedAt: "2026-06-17T09:14:00.000Z",
  },
];

const SEED_KILL: AdminKillSwitchRow[] = [
  {
    id: "ks_system_halt",
    switchKey: "system_halt",
    category: "system",
    labelKey: "admin.operations.kill.label.system_halt",
    enabled: false,
    tone: "danger",
  },
  {
    id: "ks_system_readonly",
    switchKey: "system_readonly",
    category: "system",
    labelKey: "admin.operations.kill.label.system_readonly",
    enabled: false,
    tone: "warning",
  },
  {
    id: "ks_feature_deposit",
    switchKey: "feature_deposit",
    category: "wallet",
    labelKey: "admin.operations.kill.label.feature_deposit",
    enabled: true,
    tone: "primary",
  },
  {
    id: "ks_feature_withdrawal",
    switchKey: "feature_withdrawal",
    category: "wallet",
    labelKey: "admin.operations.kill.label.feature_withdrawal",
    enabled: true,
    tone: "primary",
  },
  {
    id: "ks_feature_spot",
    switchKey: "feature_spot",
    category: "trading",
    labelKey: "admin.operations.kill.label.feature_spot",
    enabled: true,
    tone: "primary",
  },
  {
    id: "ks_feature_futures",
    switchKey: "feature_futures",
    category: "trading",
    labelKey: "admin.operations.kill.label.feature_futures",
    enabled: true,
    tone: "primary",
  },
  {
    id: "ks_feature_staking",
    switchKey: "feature_staking",
    category: "trading",
    labelKey: "admin.operations.kill.label.feature_staking",
    enabled: true,
    tone: "primary",
  },
  {
    id: "ks_feature_game",
    switchKey: "feature_game",
    category: "earn",
    labelKey: "admin.operations.kill.label.feature_game",
    enabled: true,
    tone: "primary",
  },
  {
    id: "ks_feature_referral",
    switchKey: "feature_referral",
    category: "earn",
    labelKey: "admin.operations.kill.label.feature_referral",
    enabled: true,
    tone: "primary",
  },
  {
    id: "ks_feature_sports",
    switchKey: "feature_sports",
    category: "sports",
    labelKey: "admin.operations.kill.label.feature_sports",
    enabled: true,
    tone: "primary",
  },
  {
    id: "ks_feature_casino",
    switchKey: "feature_casino",
    category: "earn",
    labelKey: "admin.operations.kill.label.feature_casino",
    enabled: true,
    tone: "primary",
  },
];

// --- Filters ----------------------------------------------------------------

function filterKill(
  rows: AdminKillSwitchRow[],
  f: OpsKillFilters,
): AdminKillSwitchRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.category !== "all" && r.category !== f.category) return false;
    if (!q) return true;
    return (
      r.switchKey.toLowerCase().includes(q) ||
      r.labelKey.toLowerCase().includes(q)
    );
  });
}

function filterHealth(
  rows: AdminOpsHealthRow[],
  f: OpsHealthFilters,
): AdminOpsHealthRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status !== "all" && r.status !== f.status) return false;
    if (f.category !== "all" && r.category !== f.category) return false;
    if (!q) return true;
    return (
      r.checkKey.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q)
    );
  });
}

// --- Hook factory -----------------------------------------------------------

const useKillMock = createAdminMockHook<AdminKillSwitchRow, OpsKillFilters>({
  storageKey: "phonara-admin-operations-v1",
  seedRows: SEED_KILL,
  seedFilters: { search: "", category: "all" },
  filterFn: filterKill,
  auditCap: 100,
});

const HEALTH_CATEGORIES: OpsHealthCategory[] = [
  "cron",
  "queue",
  "budget",
  "infra",
];
const KILL_CATEGORIES: OpsKillCategory[] = [
  "system",
  "wallet",
  "trading",
  "sports",
  "earn",
];

export interface UseAdminOperations {
  // Health (read-only)
  health: AdminOpsHealthRow[];
  filteredHealth: AdminOpsHealthRow[];
  healthFilters: OpsHealthFilters;
  setHealthFilters: (
    f: OpsHealthFilters | ((p: OpsHealthFilters) => OpsHealthFilters),
  ) => void;
  refreshHealth: () => void;
  healthCategories: OpsHealthCategory[];

  // Kill switches (mutable)
  killSwitches: AdminKillSwitchRow[];
  filteredKillSwitches: AdminKillSwitchRow[];
  killFilters: OpsKillFilters;
  setKillFilters: (
    f: OpsKillFilters | ((p: OpsKillFilters) => OpsKillFilters),
  ) => void;
  setKillSwitch: (id: string, enabled: boolean, reason: string) => boolean;
  confirmKillSwitch?: (id: string, enabled: boolean, reason: string) => Promise<boolean>;
  confirmBulkKillSwitch?: (
    ids: string[],
    enabled: boolean,
    reason: string,
  ) => Promise<boolean>;
  configReady?: boolean;
  bulkSetKillSwitch: (
    ids: string[],
    enabled: boolean,
    reason: string,
  ) => boolean;
  opsAudit: AdminAuditEvent[];
  killCategories: OpsKillCategory[];

  resetForTest: () => void;
}

const nowIso = () => new Date().toISOString();
const validReason = (r: string) => r.trim().length >= MIN_REASON;

export function useAdminOperationsMock(): UseAdminOperations {
  const killMock = useKillMock();

  const [healthTick, setHealthTick] = useState(0);
  const [healthFilters, setHealthFilters] = useState<OpsHealthFilters>({
    search: "",
    status: "all",
    category: "all",
  });

  // Health rows are derived from SEED — read-only, no per-row mutation API.
  // healthTick re-rolls observedAt strings only (display tick).
  const health = useMemo<AdminOpsHealthRow[]>(() => {
    if (healthTick === 0) return SEED_HEALTH;
    const observedAt = nowIso();
    return SEED_HEALTH.map((r) => ({ ...r, observedAt }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthTick]);

  const filteredHealth = useMemo(
    () => filterHealth(health, healthFilters),
    [health, healthFilters],
  );

  const refreshHealth = useCallback(() => {
    setHealthTick((t) => t + 1);
  }, []);

  const setKillSwitch = useCallback(
    (id: string, enabled: boolean, reason: string): boolean => {
      if (!validReason(reason)) return false;
      const row = killMock.allRows.find((r) => r.id === id);
      if (!row) return false;
      if (row.enabled === enabled) return false;
      const at = nowIso();
      killMock.patchRow(
        id,
        (r) => r.id,
        (r) => ({
          ...r,
          enabled,
          lastChangedAt: at,
          lastChangedByKey: "admin.primitive.audit.actor.system",
        }),
      );
      killMock.appendAudit({
        id: `${row.switchKey}-${enabled ? "enable" : "disable"}-${at}`,
        at,
        actorKey: "admin.primitive.audit.actor.system",
        actionKey: enabled
          ? "admin.operations.audit.enable"
          : "admin.operations.audit.disable",
        subject: row.switchKey,
        reason: reason.trim(),
      });
      return true;
    },
    [killMock],
  );

  const bulkSetKillSwitch = useCallback(
    (ids: string[], enabled: boolean, reason: string): boolean => {
      if (!validReason(reason)) return false;
      let any = false;
      for (const id of ids) {
        if (setKillSwitch(id, enabled, reason)) any = true;
      }
      return any;
    },
    [setKillSwitch],
  );

  const opsAudit = killMock.audit;

  const resetForTest = useCallback(() => {
    killMock.resetForTest();
    setHealthFilters({ search: "", status: "all", category: "all" });
    setHealthTick(0);
  }, [killMock]);

  return {
    health,
    filteredHealth,
    healthFilters,
    setHealthFilters,
    refreshHealth,
    healthCategories: HEALTH_CATEGORIES,

    killSwitches: killMock.allRows,
    filteredKillSwitches: killMock.rows,
    killFilters: killMock.filters,
    setKillFilters: killMock.setFilters,
    setKillSwitch,
    bulkSetKillSwitch,
    opsAudit,
    killCategories: KILL_CATEGORIES,

    resetForTest,
  };
}
