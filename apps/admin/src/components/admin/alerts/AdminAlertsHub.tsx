import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useAdminAuditAlerts,
  type AdminAlertRow,
  type AlertSeverity,
  type AlertStatus,
} from "@/hooks/admin/useAdminAuditAlerts";
import { syncOpsAlertsFromHealth } from "@/domain/ops";
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

// L1-15-I I3 — Admin Alerts Hub · full 6-element desk.
// Ack (no reason · open → acknowledged) · Resolve (reason ≥4 · open|ack → resolved).
// Bulk Ack (no reason) + Bulk Resolve (single reason ≥4).

const SEVERITIES: AlertSeverity[] = ["critical", "warning"];
const STATUSES: AlertStatus[] = ["open", "acknowledged", "resolved"];

type Mode =
  | { kind: "ack"; id: string }
  | { kind: "resolve"; id: string }
  | { kind: "bulkResolve" }
  | null;

function formatAt(iso: string): string {
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 16);
  } catch {
    return iso;
  }
}

function SeverityBadge(props: { severity: AlertSeverity }) {
  const variant = props.severity === "critical" ? "destructive" : "default";
  return (
    <Badge variant={variant as "default" | "destructive"} className="uppercase">
      {t(`admin.alerts.filter.severity.${props.severity}`)}
    </Badge>
  );
}

function StatusBadge(props: { status: AlertStatus }) {
  const variant =
    props.status === "open"
      ? "destructive"
      : props.status === "acknowledged"
        ? "default"
        : "outline";
  return (
    <Badge variant={variant as "default" | "destructive" | "outline"}>
      {t(`admin.alerts.filter.status.${props.status}`)}
    </Badge>
  );
}

export function AdminAlertsHub() {
  const qc = useQueryClient();
  const {
    alerts,
    filteredAlerts,
    alertFilters,
    setAlertFilters,
    resolveAlert,
    bulkResolveAlert,
    alertAudit,
    confirmAckAlert,
  } = useAdminAuditAlerts();

  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<AdminAlertRow | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);

  const openCrit = useMemo(
    () =>
      alerts.filter((a) => a.severity === "critical" && a.status === "open")
        .length,
    [alerts],
  );
  const openWarn = useMemo(
    () =>
      alerts.filter((a) => a.severity === "warning" && a.status === "open")
        .length,
    [alerts],
  );
  const ackCount = useMemo(
    () => alerts.filter((a) => a.status === "acknowledged").length,
    [alerts],
  );

  const openSelected = new Set(
    Array.from(selected).filter((id) =>
      alerts.find((a) => a.id === id && a.status === "open"),
    ),
  );
  const resolvableSelected = new Set(
    Array.from(selected).filter((id) =>
      alerts.find((a) => a.id === id && a.status !== "resolved"),
    ),
  );

  const toggleSeverity = (s: AlertSeverity) =>
    setAlertFilters((p) => ({
      ...p,
      severity: p.severity.includes(s)
        ? p.severity.filter((x) => x !== s)
        : [...p.severity, s],
    }));
  const toggleStatus = (s: AlertStatus) =>
    setAlertFilters((p) => ({
      ...p,
      status: p.status.includes(s)
        ? p.status.filter((x) => x !== s)
        : [...p.status, s],
    }));

  const handleConfirm = async (reason: string) => {
    if (!mode) return;
    if (mode.kind === "ack") {
      if (confirmAckAlert) await confirmAckAlert(mode.id, reason);
    } else if (mode.kind === "resolve") {
      resolveAlert(mode.id, reason);
      if (drawer && drawer.id === mode.id) {
        const next = alerts.find((a) => a.id === mode.id);
        if (next) setDrawer({ ...next, status: "resolved" });
      }
    } else if (mode.kind === "bulkResolve") {
      bulkResolveAlert(Array.from(resolvableSelected), reason);
      setSelected(new Set());
    }
    setMode(null);
  };

  const syncFromHealth = () => {
    void (async () => {
      setSyncBusy(true);
      try {
        await syncOpsAlertsFromHealth();
        await qc.invalidateQueries({ queryKey: ["ops-alerts"] });
        await qc.invalidateQueries({ queryKey: ["ops-health"] });
        await qc.invalidateQueries({ queryKey: ["audit-logs"] });
      } finally {
        setSyncBusy(false);
      }
    })();
  };

  const columns: AdminColumn<AdminAlertRow>[] = [
    {
      id: "severity",
      header: t("admin.alerts.col.severity"),
      cell: (r) => <SeverityBadge severity={r.severity} />,
    },
    {
      id: "status",
      header: t("admin.alerts.col.status"),
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      id: "summary",
      header: t("admin.alerts.col.summary"),
      cell: (r) => (
        <div className="grid">
          <span className="text-sm font-medium">{r.summary}</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {r.dedupeKey}
          </span>
        </div>
      ),
    },
    {
      id: "source",
      header: t("admin.alerts.col.source"),
      cell: (r) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {r.sourceCheckId}
        </span>
      ),
    },
    {
      id: "lastSeen",
      header: t("admin.alerts.col.lastSeen"),
      sortable: true,
      sortValue: (r) => r.lastSeenAt,
      cell: (r) => (
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {formatAt(r.lastSeenAt)}
        </span>
      ),
    },
    {
      id: "occurrences",
      header: t("admin.alerts.col.occurrences"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.occurrenceCount,
      cell: (r) => (
        <span className="text-sm tabular-nums">{r.occurrenceCount}</span>
      ),
    },
    {
      id: "action",
      header: t("admin.alerts.col.action"),
      align: "right",
      cell: (r) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {r.status === "open" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMode({ kind: "ack", id: r.id })}
              data-testid={`alert-ack-${r.id}`}
            >
              {t("admin.alerts.action.ack")}
            </Button>
          ) : null}
          {r.status !== "resolved" ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setMode({ kind: "resolve", id: r.id })}
              data-testid={`resolve-${r.id}`}
            >
              {t("admin.alerts.action.resolve")}
            </Button>
          ) : (
            <StatusBadge status={r.status} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={syncFromHealth}
          disabled={syncBusy}
          data-testid="ops-alerts-sync"
          className="gap-1.5"
        >
          <RefreshCw className="size-3.5" aria-hidden />
          {t("admin.alerts.sync")}
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <AdminMetricCard
          label={t("admin.alerts.metric.openCritical")}
          value={String(openCrit)}
          tone="crit"
          testId="alerts-metric-crit"
        />
        <AdminMetricCard
          label={t("admin.alerts.metric.openWarning")}
          value={String(openWarn)}
          tone="warn"
          testId="alerts-metric-warn"
        />
        <AdminMetricCard
          label={t("admin.alerts.metric.acknowledged")}
          value={String(ackCount)}
          tone="primary"
          testId="alerts-metric-ack"
        />
      </div>

      <AdminQueueSection
        title={t("admin.alerts.queue.title")}
        count={openCrit + openWarn}
        countAriaLabel={t("admin.alerts.queue.title")}
        severity={openCrit > 0 ? "crit" : openWarn > 0 ? "warn" : "default"}
        subtitle={t("admin.alerts.queue.subtitle")}
        mockChip
      >
        <AdminFilterBar
          search={alertFilters.search}
          onSearchChange={(v) =>
            setAlertFilters((p) => ({ ...p, search: v }))
          }
          placeholder={t("admin.alerts.search.placeholder")}
          chips={[
            ...SEVERITIES.map((s) => ({
              label: t(`admin.alerts.filter.severity.${s}`),
              value: `sev:${s}`,
              active: alertFilters.severity.includes(s),
              onToggle: () => toggleSeverity(s),
            })),
            ...STATUSES.map((s) => ({
              label: t(`admin.alerts.filter.status.${s}`),
              value: `stat:${s}`,
              active: alertFilters.status.includes(s),
              onToggle: () => toggleStatus(s),
            })),
          ]}
          onReset={
            alertFilters.search ||
            alertFilters.severity.length > 0 ||
            alertFilters.status.length > 0
              ? () =>
                  setAlertFilters({ search: "", severity: [], status: [] })
              : undefined
          }
          searchTestId="alerts-search"
        />

        <AdminDataTable<AdminAlertRow>
          columns={columns}
          rows={filteredAlerts}
          rowKey={(r) => r.id}
          rowTestId={(r) => `alert-row-${r.id}`}
          ariaLabel={t("admin.alerts.queue.title")}
          onRowClick={(r) => setDrawer(r)}
          empty={t("admin.alerts.empty.title")}
          selection={{
            selected,
            onToggle: (k) =>
              setSelected((p) => {
                const n = new Set(p);
                n.has(k) ? n.delete(k) : n.add(k);
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
            data-testid="alerts-bulk-bar"
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
                disabled
                data-testid="alerts-bulk-ack"
              >
                {t("admin.alerts.bulk.ack")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={resolvableSelected.size === 0}
                onClick={() => setMode({ kind: "bulkResolve" })}
                data-testid="alerts-bulk-resolve"
              >
                {t("admin.alerts.bulk.resolve")}
              </Button>
            </div>
          </div>
        ) : null}
      </AdminQueueSection>

      <div className="grid gap-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("admin.alerts.audit.title")}
        </h3>
        <AdminAuditTrail
          events={alertAudit}
          emptyLabel={t("admin.alerts.audit.empty")}
        />
      </div>

      <AdminReasonDialog
        open={mode !== null}
        onOpenChange={(o) => {
          if (!o) setMode(null);
        }}
        title={
          mode?.kind === "ack"
            ? t("admin.alerts.action.ack")
            : mode?.kind === "bulkResolve"
              ? t("admin.alerts.bulk.resolve")
              : t("admin.alerts.action.resolve")
        }
        variant={mode?.kind === "ack" ? "default" : "destructive"}
        onConfirm={handleConfirm}
        reasonInputTestId="admin-alert-action-reason"
        confirmTestId="admin-alert-action-confirm"
      />

      <AdminDetailDrawer
        open={drawer !== null}
        onOpenChange={(o) => {
          if (!o) setDrawer(null);
        }}
        title={t("admin.alerts.detail.title")}
        description={drawer ? drawer.dedupeKey : undefined}
      >
        {drawer ? (
          <div className="grid gap-3 text-sm">
            <DetailRow
              label={t("admin.alerts.col.severity")}
              value={t(`admin.alerts.filter.severity.${drawer.severity}`)}
            />
            <DetailRow
              label={t("admin.alerts.col.status")}
              value={t(`admin.alerts.filter.status.${drawer.status}`)}
            />
            <DetailRow
              label={t("admin.alerts.col.summary")}
              value={drawer.summary}
            />
            <DetailRow
              label={t("admin.alerts.col.source")}
              value={drawer.sourceCheckId}
              mono
            />
            <DetailRow
              label={t("admin.alerts.detail.firstSeen")}
              value={formatAt(drawer.firstSeenAt)}
              mono
            />
            <DetailRow
              label={t("admin.alerts.col.lastSeen")}
              value={formatAt(drawer.lastSeenAt)}
              mono
            />
            <DetailRow
              label={t("admin.alerts.col.occurrences")}
              value={String(drawer.occurrenceCount)}
              mono
            />
            <DetailRow
              label={t("admin.alerts.detail.runbook")}
              value={drawer.runbookKey}
              mono
            />
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {drawer.status === "open" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMode({ kind: "ack", id: drawer.id })}
                  data-testid={`drawer-ack-${drawer.id}`}
                >
                  {t("admin.alerts.action.ack")}
                </Button>
              ) : null}
              {drawer.status !== "resolved" ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setMode({ kind: "resolve", id: drawer.id })}
                  data-testid={`drawer-resolve-${drawer.id}`}
                >
                  {t("admin.alerts.action.resolve")}
                </Button>
              ) : null}
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
