import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdminQueueSection,
  AdminDataTable,
  AdminFilterBar,
  AdminReasonDialog,
  AdminMetricCard,
  type AdminColumn,
} from "@/components/admin/primitives";
import { t } from "@/i18n";
import { ADMIN_WIRE_TIER_C_DISABLED, tierCDisabledTitle } from "@/lib/admin-wire-tier-c";
import type {
  AdminCasinoGameRow,
  CasinoGameCategory,
  CasinoGameStatus,
  UseAdminCasinoDesk,
} from "@/hooks/admin/useAdminCasinoDeskMock";

// L1-15-E E-A · Casino Catalog queue.
// 6요소: metrics · filter · table · row actions · audit (in hub) · bulk.

const CATEGORY_FILTERS: Array<CasinoGameCategory | "all"> = [
  "all",
  "originals",
  "table",
  "instant",
];
const STATUS_FILTERS: Array<CasinoGameStatus | "all"> = [
  "all",
  "live",
  "maintenance",
  "disabled",
];

function StatusBadge(props: { status: CasinoGameStatus }) {
  const variant =
    props.status === "disabled"
      ? "destructive"
      : props.status === "maintenance"
        ? "default"
        : "outline";
  return (
    <Badge
      variant={variant as "default" | "destructive" | "outline"}
      className="uppercase"
    >
      {t(`admin.casino.catalog.status.${props.status}`)}
    </Badge>
  );
}

type Dialog =
  | { kind: "row"; id: string; next: CasinoGameStatus }
  | { kind: "bulk"; next: Exclude<CasinoGameStatus, "live"> }
  | null;

export interface CasinoCatalogQueueProps {
  desk: UseAdminCasinoDesk;
}

export function CasinoCatalogQueue({ desk }: CasinoCatalogQueueProps) {
  const {
    catalog,
    filteredCatalog,
    catalogFilters,
    setCatalogFilters,
    setGameStatus,
    bulkSetGameStatus,
  } = desk;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<Dialog>(null);

  // metrics (counts only — no float)
  const liveCount = useMemo(
    () => catalog.filter((r) => r.status === "live").length,
    [catalog],
  );
  const maintenanceCount = useMemo(
    () => catalog.filter((r) => r.status === "maintenance").length,
    [catalog],
  );
  const disabledCount = useMemo(
    () => catalog.filter((r) => r.status === "disabled").length,
    [catalog],
  );

  const columns: AdminColumn<AdminCasinoGameRow>[] = [
    {
      id: "status",
      header: t("admin.casino.catalog.col.status"),
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      id: "label",
      header: t("admin.casino.catalog.col.game"),
      cell: (r) => (
        <div className="grid">
          <span className="text-sm font-medium">{t(r.labelKey)}</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {r.gameKey}
          </span>
        </div>
      ),
    },
    {
      id: "category",
      header: t("admin.casino.catalog.col.category"),
      cell: (r) => (
        <Badge variant="secondary" className="uppercase">
          {t(`admin.casino.catalog.category.${r.category}`)}
        </Badge>
      ),
    },
    {
      id: "rtpConfigured",
      header: t("admin.casino.catalog.col.rtpConfigured"),
      align: "right",
      cell: (r) => (
        <span className="font-mono text-xs tabular-nums">
          {r.rtpConfigured}%
        </span>
      ),
    },
    {
      id: "rtpObserved",
      header: t("admin.casino.catalog.col.rtpObserved"),
      align: "right",
      cell: (r) => (
        <span className="font-mono text-xs tabular-nums">
          {r.rtpObserved24h ? r.rtpObserved24h + "%" : "—"}
        </span>
      ),
    },
    {
      id: "drift",
      header: t("admin.casino.catalog.col.drift"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.rtpDriftPct ?? "0",
      cell: (r) => (
        <span
          className={
            "font-mono text-xs tabular-nums " +
            ((r.rtpDriftPct && r.rtpDriftPct.length > 1) ||
            (r.rtpDriftPct && r.rtpDriftPct >= "3")
              ? "text-(--color-destructive)"
              : "")
          }
        >
          {r.rtpDriftPct ? r.rtpDriftPct + "%" : "—"}
        </span>
      ),
    },
    {
      id: "bets24h",
      header: t("admin.casino.catalog.col.bets24h"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.bets24h,
      cell: (r) => (
        <span className="font-mono text-xs tabular-nums">{r.bets24h}</span>
      ),
    },
    {
      id: "action",
      header: t("admin.casino.catalog.col.action"),
      align: "right",
      cell: (r) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {r.status !== "live" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() => setGameStatus(r.id, "live")}
              data-testid={`catalog-live-${r.id}`}
            >
              {t("admin.casino.catalog.action.live")}
            </Button>
          ) : null}
          {r.status !== "maintenance" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() =>
                setDialog({ kind: "row", id: r.id, next: "maintenance" })
              }
              data-testid={`catalog-maintenance-${r.id}`}
            >
              {t("admin.casino.catalog.action.maintenance")}
            </Button>
          ) : null}
          {r.status !== "disabled" ? (
            <Button
              size="sm"
              variant="destructive"
              disabled={ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() =>
                setDialog({ kind: "row", id: r.id, next: "disabled" })
              }
              data-testid={`catalog-disable-${r.id}`}
            >
              {t("admin.casino.catalog.action.disable")}
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const dialogTitle = useMemo(() => {
    if (!dialog) return "";
    const next = dialog.kind === "row" ? dialog.next : dialog.next;
    return t(`admin.casino.catalog.dialog.${next}.title`);
  }, [dialog]);

  const handleConfirm = (reason: string) => {
    if (!dialog) return;
    if (dialog.kind === "row") {
      setGameStatus(dialog.id, dialog.next, reason);
    } else {
      bulkSetGameStatus(Array.from(selected), dialog.next, reason);
      setSelected(new Set());
    }
    setDialog(null);
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <AdminMetricCard
          label={t("admin.casino.catalog.metric.live")}
          value={String(liveCount)}
          tone="primary"
          testId="catalog-metric-live"
        />
        <AdminMetricCard
          label={t("admin.casino.catalog.metric.maintenance")}
          value={String(maintenanceCount)}
          tone="warn"
          testId="catalog-metric-maintenance"
        />
        <AdminMetricCard
          label={t("admin.casino.catalog.metric.disabled")}
          value={String(disabledCount)}
          tone={disabledCount > 0 ? "crit" : "default"}
          testId="catalog-metric-disabled"
        />
      </div>

      <AdminQueueSection
        title={t("admin.casino.catalog.section.title")}
        count={filteredCatalog.length}
        countAriaLabel={t("admin.casino.catalog.section.title")}
        subtitle={t("admin.casino.catalog.section.subtitle")}
      >
        <AdminFilterBar
          search={catalogFilters.search}
          onSearchChange={(v) =>
            setCatalogFilters((p) => ({ ...p, search: v }))
          }
          placeholder={t("admin.casino.catalog.search.placeholder")}
          chips={[
            ...CATEGORY_FILTERS.map((c) => ({
              label: t(
                c === "all"
                  ? "admin.casino.catalog.category.all"
                  : `admin.casino.catalog.category.${c}`,
              ),
              value: `ccat:${c}`,
              active: catalogFilters.category === c,
              onToggle: () =>
                setCatalogFilters((p) => ({ ...p, category: c })),
            })),
            ...STATUS_FILTERS.map((s) => ({
              label: t(
                s === "all"
                  ? "admin.casino.catalog.status.all"
                  : `admin.casino.catalog.status.${s}`,
              ),
              value: `cstatus:${s}`,
              active: catalogFilters.status === s,
              onToggle: () =>
                setCatalogFilters((p) => ({ ...p, status: s })),
            })),
          ]}
          onReset={
            catalogFilters.search ||
            catalogFilters.category !== "all" ||
            catalogFilters.status !== "all"
              ? () =>
                  setCatalogFilters({
                    search: "",
                    category: "all",
                    status: "all",
                  })
              : undefined
          }
          searchTestId="catalog-search"
        />
        <AdminDataTable<AdminCasinoGameRow>
          columns={columns}
          rows={filteredCatalog}
          rowKey={(r) => r.id}
          rowTestId={(r) => `catalog-row-${r.id}`}
          ariaLabel={t("admin.casino.catalog.section.title")}
          empty={t("admin.casino.catalog.empty")}
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
            data-testid="catalog-bulk-bar"
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
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => setDialog({ kind: "bulk", next: "maintenance" })}
                data-testid="catalog-bulk-maintenance"
              >
                {t("admin.casino.catalog.bulk.maintenance")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => setDialog({ kind: "bulk", next: "disabled" })}
                data-testid="catalog-bulk-disable"
              >
                {t("admin.casino.catalog.bulk.disable")}
              </Button>
            </div>
          </div>
        ) : null}
      </AdminQueueSection>

      <AdminReasonDialog
        open={dialog !== null}
        onOpenChange={(o) => {
          if (!o) setDialog(null);
        }}
        title={dialogTitle}
        variant={
          dialog && (dialog.kind === "row" ? dialog.next : dialog.next) === "disabled"
            ? "destructive"
            : "default"
        }
        onConfirm={handleConfirm}
        reasonInputTestId="catalog-reason-input"
        confirmTestId="catalog-reason-confirm"
      />
    </div>
  );
}
