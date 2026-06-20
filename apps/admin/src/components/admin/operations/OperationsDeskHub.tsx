import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useAdminOperations,
  type AdminOpsHealthRow,
  type AdminKillSwitchRow,
  type OpsHealthStatus,
  type OpsHealthCategory,
  type OpsKillCategory,
} from "@/hooks/admin/useAdminOperations";
import {
  AdminQueueSection,
  AdminDataTable,
  AdminFilterBar,
  AdminDetailDrawer,
  AdminAuditTrail,
  AdminReasonDialog,
  AdminMetricCard,
  type AdminColumn,
} from "@/components/admin/primitives";
import { t } from "@/i18n";
import {
  getOpsHealthCheckDesc,
  getOpsHealthCheckLabel,
} from "@/lib/ops-health-present";

// L1-15-H · Admin Operations Desk Hub.
// Health = display-only (metrics + filter + table + drawer + refresh).
// Kill switches = full 6-element stack (filter · table · reason ≥4 · audit · bulk).

const STATUS_FILTERS: Array<OpsHealthStatus | "all"> = [
  "all",
  "ok",
  "warning",
  "critical",
];
const HEALTH_CAT_FILTERS: Array<OpsHealthCategory | "all"> = [
  "all",
  "cron",
  "queue",
  "budget",
  "infra",
];
const KILL_CAT_FILTERS: Array<OpsKillCategory | "all"> = [
  "all",
  "system",
  "wallet",
  "trading",
  "sports",
  "earn",
];

function formatAt(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 16);
  } catch {
    return iso;
  }
}

function StatusBadge(props: { status: OpsHealthStatus }) {
  const variant =
    props.status === "critical"
      ? "destructive"
      : props.status === "warning"
        ? "default"
        : "outline";
  return (
    <Badge
      variant={variant as "default" | "destructive" | "outline"}
      className="uppercase"
    >
      {t(`admin.operations.health.status.${props.status}`)}
    </Badge>
  );
}

function KillStatusBadge(props: { enabled: boolean }) {
  return (
    <Badge
      variant={props.enabled ? "default" : "outline"}
      className="uppercase"
    >
      {t(
        props.enabled
          ? "admin.operations.kill.status.on"
          : "admin.operations.kill.status.off",
      )}
    </Badge>
  );
}

type KillDialog =
  | { kind: "row"; id: string; nextEnabled: boolean; tone: "danger" | "warning" | "primary" }
  | { kind: "bulk"; enable: boolean }
  | null;

export function OperationsDeskHub() {
  const {
    health,
    filteredHealth,
    healthFilters,
    setHealthFilters,
    refreshHealth,
    filteredKillSwitches,
    killSwitches,
    killFilters,
    setKillFilters,
    confirmKillSwitch,
    confirmBulkKillSwitch,
    opsAudit,
    configReady,
  } = useAdminOperations();

  const [drawer, setDrawer] = useState<AdminOpsHealthRow | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<KillDialog>(null);
  const [tab, setTab] = useState<"health" | "kill">("health");

  // --- metrics (string-only, no float math) --------------------------------
  const cronHealthyPct = useMemo(() => {
    const cron = health.filter((r) => r.category === "cron");
    if (cron.length === 0) return "—";
    const ok = cron.filter((r) => r.status === "ok").length;
    // integer division via string (no float coercion)
    const pct = Math.round((ok * 100) / cron.length).toString();
    return pct + "%";
  }, [health]);

  const queueLagMax = useMemo(() => {
    let max = "0";
    for (const r of health) {
      if (!r.lagSeconds) continue;
      if (r.lagSeconds.length > max.length) max = r.lagSeconds;
      else if (r.lagSeconds.length === max.length && r.lagSeconds > max)
        max = r.lagSeconds;
    }
    return max + "s";
  }, [health]);

  const errorBudgetMin = useMemo(() => {
    const budgets = health
      .filter((r) => r.category === "budget" && r.budgetRemainingPct)
      .map((r) => r.budgetRemainingPct!);
    if (budgets.length === 0) return "—";
    let min = budgets[0]!;
    for (const b of budgets.slice(1)) {
      if (b.length < min.length) min = b;
      else if (b.length === min.length && b < min) min = b;
    }
    return min + "%";
  }, [health]);

  const killActiveCount = useMemo(
    () =>
      killSwitches.filter((k) => k.category === "system" ? k.enabled : !k.enabled)
        .length,
    [killSwitches],
  );

  // --- health table --------------------------------------------------------
  const healthColumns: AdminColumn<AdminOpsHealthRow>[] = [
    {
      id: "status",
      header: t("admin.operations.health.col.status"),
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      id: "checkKey",
      header: t("admin.operations.health.col.checkKey"),
      cell: (r) => (
        <div className="grid gap-0.5">
          <span className="text-sm font-medium">{getOpsHealthCheckLabel(r.checkKey)}</span>
          <span className="text-xs text-muted-foreground">
            {getOpsHealthCheckDesc(r.checkKey)}
          </span>
          {r.summary ? (
            <span className="text-[11px] text-muted-foreground/75">{r.summary}</span>
          ) : null}
        </div>
      ),
    },
    {
      id: "category",
      header: t("admin.operations.health.col.category"),
      cell: (r) => (
        <Badge variant="secondary" className="uppercase">
          {t(`admin.operations.health.category.${r.category}`)}
        </Badge>
      ),
    },
    {
      id: "lag",
      header: t("admin.operations.health.col.lag"),
      align: "right",
      cell: (r) => (
        <span className="font-mono text-xs tabular-nums">
          {r.lagSeconds ? r.lagSeconds + "s" : "—"}
        </span>
      ),
    },
    {
      id: "budget",
      header: t("admin.operations.health.col.budget"),
      align: "right",
      cell: (r) => (
        <span className="font-mono text-xs tabular-nums">
          {r.budgetRemainingPct ? r.budgetRemainingPct + "%" : "—"}
        </span>
      ),
    },
    {
      id: "lastRun",
      header: t("admin.operations.health.col.lastRun"),
      sortable: true,
      sortValue: (r) => r.lastRunAt,
      cell: (r) => (
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {formatAt(r.lastRunAt)}
        </span>
      ),
    },
  ];

  // --- kill table ----------------------------------------------------------
  const killColumns: AdminColumn<AdminKillSwitchRow>[] = [
    {
      id: "label",
      header: t("admin.operations.kill.col.label"),
      cell: (r) => (
        <div className="grid">
          <span className="text-sm font-medium">{t(r.labelKey)}</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {r.switchKey}
          </span>
        </div>
      ),
    },
    {
      id: "category",
      header: t("admin.operations.kill.col.category"),
      cell: (r) => (
        <Badge variant="secondary" className="uppercase">
          {t(`admin.operations.kill.category.${r.category}`)}
        </Badge>
      ),
    },
    {
      id: "status",
      header: t("admin.operations.kill.col.status"),
      cell: (r) => <KillStatusBadge enabled={r.enabled} />,
    },
    {
      id: "lastChanged",
      header: t("admin.operations.kill.col.lastChanged"),
      sortable: true,
      sortValue: (r) => r.lastChangedAt ?? "",
      cell: (r) => (
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {formatAt(r.lastChangedAt)}
        </span>
      ),
    },
    {
      id: "action",
      header: t("admin.operations.kill.col.action"),
      align: "right",
      cell: (r) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {r.enabled ? (
            <Button
              size="sm"
              variant={r.tone === "danger" ? "destructive" : "outline"}
              disabled={!configReady}
              onClick={() =>
                setDialog({
                  kind: "row",
                  id: r.id,
                  nextEnabled: false,
                  tone: r.tone,
                })
              }
              data-testid={
                r.switchKey === "feature_game"
                  ? r.enabled
                    ? "ops-feature-game-toggle"
                    : "ops-feature-game-toggle"
                  : `kill-disable-${r.id}`
              }
            >
              {t("admin.operations.kill.action.disable")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant={r.tone === "danger" ? "destructive" : "default"}
              disabled={!configReady}
              onClick={() =>
                setDialog({
                  kind: "row",
                  id: r.id,
                  nextEnabled: true,
                  tone: r.tone,
                })
              }
              data-testid={
                r.switchKey === "feature_game"
                  ? "ops-feature-game-toggle"
                  : `kill-enable-${r.id}`
              }
            >
              {t("admin.operations.kill.action.enable")}
            </Button>
          )}
        </div>
      ),
    },
  ];

  // --- handlers ------------------------------------------------------------
  const dialogTitle = useMemo(() => {
    if (!dialog) return "";
    if (dialog.kind === "row") {
      return t(
        dialog.nextEnabled
          ? "admin.operations.kill.dialog.enable.title"
          : "admin.operations.kill.dialog.disable.title",
      );
    }
    return t(
      dialog.enable
        ? "admin.operations.kill.bulk.enable"
        : "admin.operations.kill.bulk.disable",
    );
  }, [dialog]);

  const dialogVariant: "destructive" | "default" = useMemo(() => {
    if (!dialog) return "destructive";
    if (dialog.kind === "row") {
      return dialog.tone === "danger" || !dialog.nextEnabled
        ? "destructive"
        : "default";
    }
    return dialog.enable ? "default" : "destructive";
  }, [dialog]);

  const handleConfirm = async (reason: string) => {
    if (!dialog) return false;
    const ok =
      dialog.kind === "row"
        ? await (confirmKillSwitch?.(dialog.id, dialog.nextEnabled, reason) ??
            Promise.resolve(false))
        : await (confirmBulkKillSwitch?.(Array.from(selected), dialog.enable, reason) ??
            Promise.resolve(false));
    if (!ok) return false;
    if (dialog.kind === "bulk") setSelected(new Set());
    setDialog(null);
    return true;
  };

  // --- segmented tabs (mobile <md) ----------------------------------------
  const segmented = (
    <div
      role="tablist"
      aria-label={t("admin.operations.section.tabs")}
      className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1 md:hidden"
    >
      <button
        type="button"
        role="tab"
        aria-selected={tab === "health"}
        onClick={() => setTab("health")}
        data-testid="ops-tab-health"
        className={
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors " +
          (tab === "health"
            ? "bg-(--color-primary) text-(--color-primary-foreground)"
            : "text-muted-foreground")
        }
      >
        {t("admin.operations.section.health")}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === "kill"}
        onClick={() => setTab("kill")}
        data-testid="ops-tab-kill"
        className={
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors " +
          (tab === "kill"
            ? "bg-(--color-primary) text-(--color-primary-foreground)"
            : "text-muted-foreground")
        }
      >
        {t("admin.operations.section.killSwitches")}
      </button>
    </div>
  );

  // --- render --------------------------------------------------------------
  return (
    <div className="grid gap-3">
      {/* Page-level MOCK chip (single, shared by Health + Kill) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-medium">
            {t("admin.operations.title")}
          </h1>
          <Badge
            variant="outline"
            className="border-(--color-primary)/40 text-[10px] uppercase tracking-wider"
            data-testid="mock-chip"
          >
            {t("admin.primitive.mock")}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={refreshHealth}
          data-testid="ops-refresh"
          className="gap-1.5"
        >
          <RefreshCw className="size-3.5" aria-hidden />
          {t("admin.operations.health.refresh")}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("admin.operations.subtitle")}
      </p>

      {segmented}

      {/* Metrics */}
      <div
        className={
          "grid gap-2 sm:grid-cols-2 lg:grid-cols-4 " +
          (tab === "health" ? "" : "hidden md:grid")
        }
      >
        <AdminMetricCard
          label={t("admin.operations.metric.cronHealthy")}
          value={cronHealthyPct}
          tone="primary"
          testId="ops-metric-cron"
        />
        <AdminMetricCard
          label={t("admin.operations.metric.queueLagMax")}
          value={queueLagMax}
          tone="warn"
          testId="ops-metric-lag"
        />
        <AdminMetricCard
          label={t("admin.operations.metric.errorBudget")}
          value={errorBudgetMin}
          tone="warn"
          testId="ops-metric-budget"
        />
        <AdminMetricCard
          label={t("admin.operations.metric.killActive")}
          value={String(killActiveCount)}
          tone={killActiveCount > 0 ? "crit" : "default"}
          testId="ops-metric-kill"
        />
      </div>

      {/* Health section */}
      <div className={tab === "health" ? "" : "hidden md:block"}>
        <AdminQueueSection
          title={t("admin.operations.section.health")}
          count={filteredHealth.length}
          countAriaLabel={t("admin.operations.section.health")}
          subtitle={t("admin.operations.health.subtitle")}
        >
          <AdminFilterBar
            search={healthFilters.search}
            onSearchChange={(v) =>
              setHealthFilters((p) => ({ ...p, search: v }))
            }
            placeholder={t("admin.operations.health.search.placeholder")}
            chips={[
              ...STATUS_FILTERS.map((s) => ({
                label: t(
                  s === "all"
                    ? "admin.operations.health.status.all"
                    : `admin.operations.health.status.${s}`,
                ),
                value: `status:${s}`,
                active: healthFilters.status === s,
                onToggle: () =>
                  setHealthFilters((p) => ({ ...p, status: s })),
              })),
              ...HEALTH_CAT_FILTERS.map((c) => ({
                label: t(
                  c === "all"
                    ? "admin.operations.health.category.all"
                    : `admin.operations.health.category.${c}`,
                ),
                value: `hcat:${c}`,
                active: healthFilters.category === c,
                onToggle: () =>
                  setHealthFilters((p) => ({ ...p, category: c })),
              })),
            ]}
            onReset={
              healthFilters.search ||
              healthFilters.status !== "all" ||
              healthFilters.category !== "all"
                ? () =>
                    setHealthFilters({
                      search: "",
                      status: "all",
                      category: "all",
                    })
                : undefined
            }
            searchTestId="ops-health-search"
          />
          <AdminDataTable<AdminOpsHealthRow>
            columns={healthColumns}
            rows={filteredHealth}
            rowKey={(r) => r.id}
            rowTestId={(r) => `health-row-${r.id}`}
            ariaLabel={t("admin.operations.section.health")}
            onRowClick={(r) => setDrawer(r)}
            empty={t("admin.operations.health.empty")}
          />
        </AdminQueueSection>
      </div>

      {/* Kill switches */}
      <div className={tab === "kill" ? "" : "hidden md:block"}>
        <AdminQueueSection
          title={t("admin.operations.section.killSwitches")}
          count={filteredKillSwitches.length}
          countAriaLabel={t("admin.operations.section.killSwitches")}
          subtitle={t("admin.operations.kill.subtitle")}
        >
          <AdminFilterBar
            search={killFilters.search}
            onSearchChange={(v) =>
              setKillFilters((p) => ({ ...p, search: v }))
            }
            placeholder={t("admin.operations.kill.search.placeholder")}
            chips={KILL_CAT_FILTERS.map((c) => ({
              label: t(
                c === "all"
                  ? "admin.operations.kill.category.all"
                  : `admin.operations.kill.category.${c}`,
              ),
              value: `kcat:${c}`,
              active: killFilters.category === c,
              onToggle: () => setKillFilters((p) => ({ ...p, category: c })),
            }))}
            onReset={
              killFilters.search || killFilters.category !== "all"
                ? () => setKillFilters({ search: "", category: "all" })
                : undefined
            }
            searchTestId="ops-kill-search"
          />
          <AdminDataTable<AdminKillSwitchRow>
            columns={killColumns}
            rows={filteredKillSwitches}
            rowKey={(r) => r.id}
            rowTestId={(r) => `kill-row-${r.id}`}
            ariaLabel={t("admin.operations.section.killSwitches")}
            empty={t("admin.operations.kill.empty")}
            selection={{
              selected,
              onToggle: (k) =>
                setSelected((p) => {
                  const n = new Set(p);
                  if (n.has(k)) n.delete(k);
                  else n.add(k);
                  return n;
                }),
              onToggleAll: (keys) =>
                setSelected((p) =>
                  keys.every((k) => p.has(k)) ? new Set() : new Set(keys),
                ),
            }}
          />
          {selected.size > 0 ? (
            <div
              className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card/95 px-4 py-3 backdrop-blur"
              data-testid="ops-bulk-bar"
            >
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="tabular-nums">
                  {selected.size}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {t("admin.primitive.bulk.selected")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected(new Set())}
                >
                  {t("admin.primitive.bulk.clear")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDialog({ kind: "bulk", enable: true })}
                  data-testid="ops-bulk-enable"
                >
                  {t("admin.operations.kill.bulk.enable")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDialog({ kind: "bulk", enable: false })}
                  data-testid="ops-bulk-disable"
                >
                  {t("admin.operations.kill.bulk.disable")}
                </Button>
              </div>
            </div>
          ) : null}
        </AdminQueueSection>
      </div>

      {/* Audit */}
      <div className="grid gap-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("admin.operations.audit.title")}
        </h3>
        <AdminAuditTrail
          events={opsAudit}
          emptyLabel={t("admin.operations.audit.empty")}
        />
      </div>

      <AdminReasonDialog
        open={dialog !== null}
        onOpenChange={(o) => {
          if (!o) setDialog(null);
        }}
        title={dialogTitle}
        variant={dialogVariant}
        onConfirm={handleConfirm}
        reasonInputTestId="ops-confirm-reason"
        confirmTestId="ops-confirm-confirm"
      />

      <AdminDetailDrawer
        open={drawer !== null}
        onOpenChange={(o) => {
          if (!o) setDrawer(null);
        }}
        title={t("admin.operations.health.detail.title")}
        description={
          drawer
            ? `${getOpsHealthCheckLabel(drawer.checkKey)} — ${getOpsHealthCheckDesc(drawer.checkKey)}`
            : undefined
        }
      >
        {drawer ? (
          <div className="grid gap-3 text-sm">
            <DetailRow
              label={t("admin.operations.health.col.status")}
              value={t(`admin.operations.health.status.${drawer.status}`)}
            />
            <DetailRow
              label={t("admin.operations.health.col.category")}
              value={t(
                `admin.operations.health.category.${drawer.category}`,
              )}
            />
            <DetailRow
              label={t("admin.operations.health.col.lastRun")}
              value={formatAt(drawer.lastRunAt)}
              mono
            />
            <DetailRow
              label={t("admin.operations.health.detail.lastSuccess")}
              value={formatAt(drawer.lastSuccessfulAt)}
              mono
            />
            <DetailRow
              label={t("admin.operations.health.detail.lastError")}
              value={formatAt(drawer.lastErrorAt)}
              mono
            />
            <DetailRow
              label={t("admin.operations.health.detail.observedAt")}
              value={formatAt(drawer.observedAt)}
              mono
            />
            <DetailRow
              label={t("admin.operations.health.col.lag")}
              value={drawer.lagSeconds ? drawer.lagSeconds + "s" : "—"}
              mono
            />
            <DetailRow
              label={t("admin.operations.health.col.budget")}
              value={
                drawer.budgetRemainingPct
                  ? drawer.budgetRemainingPct + "%"
                  : "—"
              }
              mono
            />
            <div className="grid gap-1 border-t border-border pt-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {t("admin.operations.health.detail.summary")}
              </span>
              <p className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-foreground/90">
                {drawer.summary}
              </p>
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}

function DetailRow(props: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-b-0">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {props.label}
      </span>
      <span
        className={
          props.mono
            ? "font-mono text-xs tabular-nums"
            : "text-sm tabular-nums text-right"
        }
      >
        {props.value}
      </span>
    </div>
  );
}
