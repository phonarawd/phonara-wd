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
  AdminCmsPromoRow,
  PromoStatus,
  PromoSurface,
  UseAdminCmsDesk,
} from "@/hooks/admin/useAdminCmsDeskMock";

// L1-15-G G-B · CMS Promos queue.

const SURFACE_FILTERS: Array<PromoSurface | "all"> = [
  "all",
  "home",
  "casino",
  "earn",
  "trade",
];
const STATUS_FILTERS: Array<PromoStatus | "all"> = [
  "all",
  "draft",
  "scheduled",
  "live",
  "ended",
];

function StatusBadge(props: { status: PromoStatus }) {
  const variant: "default" | "outline" | "secondary" | "destructive" =
    props.status === "live"
      ? "default"
      : props.status === "scheduled"
        ? "secondary"
        : props.status === "draft"
          ? "outline"
          : "destructive";
  return (
    <Badge variant={variant} className="uppercase">
      {t(`admin.cms.promos.status.${props.status}`)}
    </Badge>
  );
}

type Dialog =
  | { kind: "row-end"; id: string }
  | { kind: "bulk-end" }
  | null;

export interface CmsPromosQueueProps {
  desk: UseAdminCmsDesk;
}

export function CmsPromosQueue({ desk }: CmsPromosQueueProps) {
  const {
    promos,
    filteredPromos,
    promoFilters,
    setPromoFilters,
    activatePromo,
    endPromoEarly,
    bulkActivatePromos,
    bulkEndPromos,
  } = desk;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<Dialog>(null);

  const liveCount = useMemo(
    () => promos.filter((p) => p.status === "live").length,
    [promos],
  );
  const scheduledCount = useMemo(
    () => promos.filter((p) => p.status === "scheduled").length,
    [promos],
  );
  const draftCount = useMemo(
    () => promos.filter((p) => p.status === "draft").length,
    [promos],
  );
  const endedCount = useMemo(
    () => promos.filter((p) => p.status === "ended").length,
    [promos],
  );

  const safeEnd = (id: string, reason: string) => {
    try {
      endPromoEarly(id, reason);
    } catch {
      /* noop */
    }
  };
  const safeBulkEnd = (ids: string[], reason: string) => {
    try {
      bulkEndPromos(ids, reason);
    } catch {
      /* noop */
    }
  };

  const columns: AdminColumn<AdminCmsPromoRow>[] = [
    {
      id: "status",
      header: t("admin.cms.promos.col.status"),
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      id: "promo",
      header: t("admin.cms.promos.col.promo"),
      cell: (r) => (
        <div className="grid">
          <span className="font-mono text-xs">{r.promoKey}</span>
          <span className="text-[10px] text-muted-foreground">
            {r.headlineKey}
          </span>
        </div>
      ),
    },
    {
      id: "surface",
      header: t("admin.cms.promos.col.surface"),
      cell: (r) => (
        <Badge variant="outline" className="uppercase">
          {t(`admin.cms.promos.surface.${r.surface}`)}
        </Badge>
      ),
    },
    {
      id: "startsAt",
      header: t("admin.cms.promos.col.startsAt"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.startsAt,
      cell: (r) => (
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {r.startsAt.slice(0, 10)}
        </span>
      ),
    },
    {
      id: "endsAt",
      header: t("admin.cms.promos.col.endsAt"),
      align: "right",
      cell: (r) => (
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {r.endsAt.slice(0, 10)}
        </span>
      ),
    },
    {
      id: "priority",
      header: t("admin.cms.promos.col.priority"),
      align: "right",
      cell: (r) => (
        <span className="font-mono text-xs tabular-nums">{r.priority}</span>
      ),
    },
    {
      id: "action",
      header: t("admin.cms.promos.col.action"),
      align: "right",
      cell: (r) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {(r.status === "draft" || r.status === "scheduled") ? (
            <Button
              size="sm"
              variant="default"
              disabled={ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() => activatePromo(r.id)}
              data-testid={`promo-activate-${r.id}`}
            >
              {t("admin.cms.promos.action.activate")}
            </Button>
          ) : null}
          {r.status === "live" ? (
            <Button
              size="sm"
              variant="destructive"
              disabled={ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() => setDialog({ kind: "row-end", id: r.id })}
              data-testid={`promo-end-${r.id}`}
            >
              {t("admin.cms.promos.action.end")}
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const dialogTitle = useMemo(() => {
    if (!dialog) return "";
    return t("admin.cms.promos.dialog.end.title");
  }, [dialog]);

  const handleConfirm = (reason: string) => {
    if (!dialog) return;
    if (dialog.kind === "row-end") {
      safeEnd(dialog.id, reason);
    } else if (dialog.kind === "bulk-end") {
      safeBulkEnd(Array.from(selected), reason);
      setSelected(new Set());
    }
    setDialog(null);
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          label={t("admin.cms.promos.metric.live")}
          value={String(liveCount)}
          tone="primary"
          testId="promos-metric-live"
        />
        <AdminMetricCard
          label={t("admin.cms.promos.metric.scheduled")}
          value={String(scheduledCount)}
          tone="default"
          testId="promos-metric-scheduled"
        />
        <AdminMetricCard
          label={t("admin.cms.promos.metric.draft")}
          value={String(draftCount)}
          tone={draftCount > 0 ? "warn" : "default"}
          testId="promos-metric-draft"
        />
        <AdminMetricCard
          label={t("admin.cms.promos.metric.ended")}
          value={String(endedCount)}
          tone="default"
          testId="promos-metric-ended"
        />
      </div>

      <AdminQueueSection
        title={t("admin.cms.promos.section.title")}
        count={filteredPromos.length}
        countAriaLabel={t("admin.cms.promos.section.title")}
        subtitle={t("admin.cms.promos.section.subtitle")}
      >
        <AdminFilterBar
          search={promoFilters.search}
          onSearchChange={(v) =>
            setPromoFilters((p) => ({ ...p, search: v }))
          }
          placeholder={t("admin.cms.promos.search.placeholder")}
          chips={[
            ...SURFACE_FILTERS.map((s) => ({
              label: t(
                s === "all"
                  ? "admin.cms.promos.surface.all"
                  : `admin.cms.promos.surface.${s}`,
              ),
              value: `psurface:${s}`,
              active: promoFilters.surface === s,
              onToggle: () => setPromoFilters((p) => ({ ...p, surface: s })),
            })),
            ...STATUS_FILTERS.map((s) => ({
              label: t(
                s === "all"
                  ? "admin.cms.promos.status.all"
                  : `admin.cms.promos.status.${s}`,
              ),
              value: `prstatus:${s}`,
              active: promoFilters.status === s,
              onToggle: () => setPromoFilters((p) => ({ ...p, status: s })),
            })),
          ]}
          onReset={
            promoFilters.search ||
            promoFilters.surface !== "all" ||
            promoFilters.status !== "all"
              ? () =>
                  setPromoFilters({
                    search: "",
                    surface: "all",
                    status: "all",
                  })
              : undefined
          }
          searchTestId="promos-search"
        />
        <AdminDataTable<AdminCmsPromoRow>
          columns={columns}
          rows={filteredPromos}
          rowKey={(r) => r.id}
          rowTestId={(r) => `promos-row-${r.id}`}
          ariaLabel={t("admin.cms.promos.section.title")}
          empty={t("admin.cms.promos.empty")}
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
            data-testid="promos-bulk-bar"
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
                variant="default"
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => {
                  bulkActivatePromos(Array.from(selected));
                  setSelected(new Set());
                }}
                data-testid="promos-bulk-activate"
              >
                {t("admin.cms.promos.bulk.activate")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => setDialog({ kind: "bulk-end" })}
                data-testid="promos-bulk-end"
              >
                {t("admin.cms.promos.bulk.end")}
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
        variant="destructive"
        onConfirm={handleConfirm}
        reasonInputTestId="promos-reason-input"
        confirmTestId="promos-reason-confirm"
      />
    </div>
  );
}
