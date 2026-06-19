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
  AccessDeskKey,
  AdminSavedFilterRow,
  UseAdminAccessDesk,
} from "@/hooks/admin/useAdminAccessDeskMock";

// L1-15-J · J6 — Saved filters queue. 6 elements.

const DESK_FILTERS: Array<AccessDeskKey | "all"> = [
  "all",
  "operations",
  "casino",
  "earn",
  "cms",
  "users",
  "sports",
  "audit",
  "alerts",
];

type Dialog =
  | { kind: "row-delete"; id: string }
  | { kind: "bulk-delete" }
  | null;

export interface SavedFiltersQueueProps {
  desk: UseAdminAccessDesk;
}

export function SavedFiltersQueue({ desk }: SavedFiltersQueueProps) {
  const {
    presets,
    filteredPresets,
    presetFilters,
    setPresetFilters,
    deletePreset,
    setDefaultPreset,
    bulkDeletePresets,
  } = desk;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<Dialog>(null);

  const totalPresets = presets.length;
  const defaultCount = useMemo(
    () => presets.filter((p) => p.isDefault).length,
    [presets],
  );
  const deletedCount = useMemo(
    () => presets.filter((p) => p.filterBlob === "[deleted]").length,
    [presets],
  );
  const deskSpan = useMemo(
    () => new Set(presets.map((p) => p.deskKey)).size,
    [presets],
  );

  const safeDelete = (id: string, reason: string) => {
    try {
      deletePreset(id, reason);
    } catch {
      /* noop */
    }
  };
  const safeBulkDelete = (ids: string[], reason: string) => {
    try {
      bulkDeletePresets(ids, reason);
    } catch {
      /* noop */
    }
  };

  const columns: AdminColumn<AdminSavedFilterRow>[] = [
    {
      id: "desk",
      header: t("admin.access.filters.col.desk"),
      cell: (r) => (
        <Badge variant="outline" className="font-mono uppercase">
          {r.deskKey}
        </Badge>
      ),
    },
    {
      id: "preset",
      header: t("admin.access.filters.col.preset"),
      cell: (r) => (
        <div className="grid">
          <span className="text-sm">{r.presetName}</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {r.filterBlob}
          </span>
        </div>
      ),
    },
    {
      id: "default",
      header: t("admin.access.filters.col.default"),
      align: "right",
      cell: (r) =>
        r.isDefault ? (
          <Badge variant="default" className="uppercase">
            {t("admin.access.filters.default.yes")}
          </Badge>
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        ),
    },
    {
      id: "updated",
      header: t("admin.access.filters.col.updated"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.updatedAt,
      cell: (r) => (
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {r.updatedAt.slice(0, 10)}
        </span>
      ),
    },
    {
      id: "action",
      header: t("admin.access.filters.col.action"),
      align: "right",
      cell: (r) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {!r.isDefault && r.filterBlob !== "[deleted]" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() => setDefaultPreset(r.id)}
              data-testid={`filter-default-${r.id}`}
            >
              {t("admin.access.filters.action.makeDefault")}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="destructive"
            disabled={r.filterBlob === "[deleted]" || ADMIN_WIRE_TIER_C_DISABLED}
            title={tierCDisabledTitle(t)}
            onClick={() => setDialog({ kind: "row-delete", id: r.id })}
            data-testid={`filter-delete-${r.id}`}
          >
            {t("admin.access.filters.action.delete")}
          </Button>
        </div>
      ),
    },
  ];

  const handleConfirm = (reason: string) => {
    if (!dialog) return;
    if (dialog.kind === "row-delete") safeDelete(dialog.id, reason);
    if (dialog.kind === "bulk-delete") {
      safeBulkDelete(Array.from(selected), reason);
      setSelected(new Set());
    }
    setDialog(null);
  };

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <AdminMetricCard
          label={t("admin.access.filters.metric.total")}
          value={String(totalPresets)}
          tone="default"
          testId="filters-metric-total"
        />
        <AdminMetricCard
          label={t("admin.access.filters.metric.defaults")}
          value={String(defaultCount)}
          tone="default"
          testId="filters-metric-defaults"
        />
        <AdminMetricCard
          label={t("admin.access.filters.metric.deleted")}
          value={String(deletedCount)}
          tone={deletedCount > 0 ? "warn" : "default"}
          testId="filters-metric-deleted"
        />
        <AdminMetricCard
          label={t("admin.access.filters.metric.desks")}
          value={String(deskSpan)}
          tone="default"
          testId="filters-metric-desks"
        />
      </div>

      <AdminQueueSection
        title={t("admin.access.filters.section.title")}
        count={filteredPresets.length}
        countAriaLabel={t("admin.access.filters.section.title")}
        subtitle={t("admin.access.filters.section.subtitle")}
      >
        <AdminFilterBar
          search={presetFilters.search}
          onSearchChange={(v) =>
            setPresetFilters((p) => ({ ...p, search: v }))
          }
          placeholder={t("admin.access.filters.search.placeholder")}
          chips={DESK_FILTERS.map((d) => ({
            label: t(
              d === "all"
                ? "admin.access.filters.desk.all"
                : `admin.access.filters.desk.${d}`,
            ),
            value: `desk:${d}`,
            active: presetFilters.deskKey === d,
            onToggle: () => setPresetFilters((p) => ({ ...p, deskKey: d })),
          }))}
          onReset={
            presetFilters.search || presetFilters.deskKey !== "all"
              ? () => setPresetFilters({ search: "", deskKey: "all" })
              : undefined
          }
          searchTestId="filters-search"
        />
        <AdminDataTable<AdminSavedFilterRow>
          columns={columns}
          rows={filteredPresets}
          rowKey={(r) => r.id}
          rowTestId={(r) => `filters-row-${r.id}`}
          ariaLabel={t("admin.access.filters.section.title")}
          empty={t("admin.access.filters.empty")}
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
            data-testid="filters-bulk-bar"
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
                variant="destructive"
                onClick={() => setDialog({ kind: "bulk-delete" })}
                data-testid="filters-bulk-delete"
              >
                {t("admin.access.filters.bulk.delete")}
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
        title={t("admin.access.filters.dialog.delete.title")}
        variant="destructive"
        onConfirm={handleConfirm}
        reasonInputTestId="filters-reason-input"
        confirmTestId="filters-reason-confirm"
      />
    </div>
  );
}
