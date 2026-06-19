import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminSports, formatKrwGrouped } from "@/hooks/admin/useAdminSports";
import { relativeTime } from "@/lib/admin-time";
import type { SportsFixtureRow } from "@/hooks/admin/useAdminSports";
import { MarketSuspendDialog } from "./MarketSuspendDialog";
import {
  AdminQueueSection,
  AdminDataTable,
  AdminFilterBar,
  AdminDetailDrawer,
  AdminBulkActionBar,
  AdminAuditTrail,
  type AdminColumn,
  type AdminAuditEvent,
} from "@/components/admin/primitives";
import { t } from "@/i18n";

// L1-15-P0 E2 — Sports Desk reference impl using admin primitives.
// 6요소: filter · queue · row action · reason · audit · bulk.
// SOT (useAdminSportsMock) semantics 0 — bulk = UI loop over suspendMarket.

const STATUSES: Array<SportsFixtureRow["status"]> = ["live", "ft", "scheduled"];

export function UnsettledFixturesTable() {
  const { fixtures, suspended, suspendMarket } = useAdminSports();
  const [target, setTarget] = useState<SportsFixtureRow | null>(null);
  const [drawer, setDrawer] = useState<SportsFixtureRow | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const suspendedIds = useMemo(
    () => new Set(suspended.map((s) => s.fixtureId)),
    [suspended],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fixtures.filter((f) => {
      if (statusFilter.size > 0 && !statusFilter.has(f.status)) return false;
      if (!q) return true;
      return (
        f.home.toLowerCase().includes(q) ||
        f.away.toLowerCase().includes(q) ||
        f.league.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q)
      );
    });
  }, [fixtures, search, statusFilter]);

  const unsettledCount = filtered.reduce(
    (acc, f) => acc + f.unsettledMarkets,
    0,
  );

  const auditEvents: AdminAuditEvent[] = useMemo(
    () =>
      suspended.map((s) => ({
        id: `${s.fixtureId}-${s.at}`,
        at: s.at,
        actorKey: "admin.primitive.audit.actor.system",
        actionKey: "admin.sports.audit.suspend",
        subject: s.fixtureId,
        reason: s.reason,
      })),
    [suspended],
  );

  const toggleStatus = (v: string) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  };

  const handleBulkSuspend = (reason: string) => {
    selected.forEach((id) => {
      if (!suspendedIds.has(id)) suspendMarket(id, reason);
    });
    setSelected(new Set());
  };

  const columns: AdminColumn<SportsFixtureRow>[] = [
    {
      id: "league",
      header: t("admin.sports.queue.col.league"),
      cell: (f) => (
        <span className="text-xs text-muted-foreground">{f.league}</span>
      ),
    },
    {
      id: "fixture",
      header: t("admin.sports.queue.col.fixture"),
      cell: (f) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {f.home} <span className="text-muted-foreground">vs</span> {f.away}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t(`admin.sports.queue.status.${f.status}`)}
          </span>
        </div>
      ),
    },
    {
      id: "id",
      header: t("admin.sports.queue.col.id"),
      cell: (f) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {f.id}
        </span>
      ),
    },
    {
      id: "unsettled",
      header: t("admin.sports.queue.col.unsettled"),
      align: "right",
      sortable: true,
      sortValue: (f) => f.unsettledMarkets,
      cell: (f) => (
        <span
          className={
            f.unsettledMarkets >= 8
              ? "tabular-nums font-semibold text-(--color-destructive)"
              : "tabular-nums font-medium"
          }
        >
          {f.unsettledMarkets}
        </span>
      ),
    },
    {
      id: "exposure",
      header: t("admin.sports.queue.col.exposure"),
      align: "right",
      sortable: true,
      sortValue: (f) => f.exposure,
      cell: (f) => formatKrwGrouped(f.exposure),
    },
    {
      id: "kickoff",
      header: t("admin.sports.queue.col.kickoff"),
      sortable: true,
      sortValue: (f) => f.kickoff,
      cell: (f) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {relativeTime(f.kickoff)}
        </span>
      ),
    },
    {
      id: "action",
      header: t("admin.sports.queue.col.action"),
      align: "right",
      cell: (f) =>
        suspendedIds.has(f.id) ? (
          <Badge variant="secondary">
            {t("admin.sports.queue.suspendedBadge")}
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTarget(f)}
            data-testid={`suspend-${f.id}`}
          >
            {t("admin.sports.queue.action.suspend")}
          </Button>
        ),
    },
  ];

  return (
    <div className="grid gap-3">
      <AdminQueueSection
        title={t("admin.sports.queue.title")}
        count={unsettledCount}
        countAriaLabel={t("admin.sports.queue.countAria")}
        severity="crit"
        subtitle={t("admin.sports.queue.subtitle")}
        mockChip
      >
        <AdminFilterBar
          search={search}
          onSearchChange={setSearch}
          placeholder={t("admin.sports.filter.search.placeholder")}
          chips={STATUSES.map((s) => ({
            label: t(`admin.sports.filter.status.${s}`),
            value: s,
            active: statusFilter.has(s),
            onToggle: toggleStatus,
          }))}
          onReset={
            search || statusFilter.size > 0
              ? () => {
                  setSearch("");
                  setStatusFilter(new Set());
                }
              : undefined
          }
        />
        <AdminDataTable<SportsFixtureRow>
          columns={columns}
          rows={filtered}
          rowKey={(f) => f.id}
          rowTestId={(f) => `fixture-row-${f.id}`}
          ariaLabel={t("admin.sports.queue.title")}
          onRowClick={(f) => setDrawer(f)}
          empty={t("admin.sports.queue.empty")}
          selection={{
            selected,
            onToggle: (k) =>
              setSelected((prev) => {
                const next = new Set(prev);
                if (next.has(k)) next.delete(k);
                else next.add(k);
                return next;
              }),
            onToggleAll: (keys) =>
              setSelected((prev) =>
                keys.every((k) => prev.has(k))
                  ? new Set()
                  : new Set(keys),
              ),
          }}
        />
        <AdminBulkActionBar
          count={selected.size}
          actionLabel={t("admin.sports.bulk.suspend.label")}
          dialogTitle={t("admin.sports.suspend.title")}
          dialogDescription={t("admin.sports.suspend.desc")}
          onConfirm={handleBulkSuspend}
          onClear={() => setSelected(new Set())}
        />
      </AdminQueueSection>

      <div className="grid gap-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("admin.sports.audit.title")}
        </h3>
        <AdminAuditTrail
          events={auditEvents}
          emptyLabel={t("admin.sports.audit.empty")}
          ariaLabel={t("admin.sports.audit.title")}
        />
      </div>

      <MarketSuspendDialog
        fixture={target}
        open={target !== null}
        onOpenChange={(o) => {
          if (!o) setTarget(null);
        }}
      />

      <AdminDetailDrawer
        open={drawer !== null}
        onOpenChange={(o) => {
          if (!o) setDrawer(null);
        }}
        title={t("admin.sports.detail.title")}
        description={drawer ? `${drawer.home} vs ${drawer.away}` : undefined}
      >
        {drawer ? (
          <div className="grid gap-3 text-sm">
            <DrawerRow
              label={t("admin.sports.queue.col.league")}
              value={drawer.league}
            />
            <DrawerRow
              label={t("admin.sports.queue.col.id")}
              value={drawer.id}
              mono
            />
            <DrawerRow
              label={t("admin.sports.queue.col.kickoff")}
              value={relativeTime(drawer.kickoff)}
            />
            <DrawerRow
              label={t("admin.sports.queue.col.unsettled")}
              value={String(drawer.unsettledMarkets)}
            />
            <DrawerRow
              label={t("admin.sports.queue.col.exposure")}
              value={formatKrwGrouped(drawer.exposure)}
            />
            <DrawerRow
              label={t("admin.sports.queue.col.action")}
              value={
                suspendedIds.has(drawer.id)
                  ? t("admin.sports.queue.suspendedBadge")
                  : t(`admin.sports.queue.status.${drawer.status}`)
              }
            />
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}

function DrawerRow(props: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-b-0">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {props.label}
      </span>
      <span
        className={
          props.mono
            ? "font-mono text-xs tabular-nums"
            : "text-sm tabular-nums"
        }
      >
        {props.value}
      </span>
    </div>
  );
}
