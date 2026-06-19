import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AdminAuditTrail,
  AdminDataTable,
  AdminFilterBar,
  AdminMetricCard,
  AdminQueueSection,
  AdminReasonDialog,
  type AdminColumn,
} from "@/components/admin/primitives";
import { t } from "@/i18n";
import { ADMIN_WIRE_TIER_C_DISABLED, tierCDisabledTitle } from "@/lib/admin-wire-tier-c";
import { useAdminAccessDeskMock } from "@/hooks/admin/useAdminAccessDeskMock";
import type {
  AdminMfaPolicyRow,
  MfaTierKey,
} from "@/hooks/admin/useAdminAccessDeskMock";

// L1-15-J · J7 — MFA policy desk (hub-shape, 6 elements + audit).

const TIER_FILTERS: Array<MfaTierKey | "all"> = [
  "all",
  "tier.admin",
  "tier.staff",
  "tier.platinum",
  "tier.gold",
  "tier.silver",
  "tier.bronze",
];

const REQUIRED_FILTERS: Array<"all" | "on" | "off"> = ["all", "on", "off"];

type Dialog =
  | { kind: "row-relax"; id: string }
  | { kind: "bulk-relax" }
  | null;

export function MfaPolicyHub() {
  const desk = useAdminAccessDeskMock();
  const {
    mfaPolicies,
    filteredMfa,
    mfaFilters,
    setMfaFilters,
    requireMfa,
    relaxMfa,
    bulkRequireMfa,
    bulkRelaxMfa,
    audit,
  } = desk;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<Dialog>(null);

  const total = mfaPolicies.length;
  const required = useMemo(
    () => mfaPolicies.filter((m) => m.mfaRequired).length,
    [mfaPolicies],
  );
  const relaxed = useMemo(
    () => mfaPolicies.filter((m) => !m.mfaRequired).length,
    [mfaPolicies],
  );
  const avgEnroll = useMemo(() => {
    if (!mfaPolicies.length) return "0";
    const sum = mfaPolicies.reduce(
      (a, m) => a + (parseInt(m.enrollRate, 10) || 0),
      0,
    );
    return String(Math.round(sum / mfaPolicies.length));
  }, [mfaPolicies]);

  const safeRelax = (id: string, reason: string) => {
    try {
      relaxMfa(id, reason);
    } catch {
      /* noop */
    }
  };
  const safeBulkRelax = (ids: string[], reason: string) => {
    try {
      bulkRelaxMfa(ids, reason);
    } catch {
      /* noop */
    }
  };

  const columns: AdminColumn<AdminMfaPolicyRow>[] = [
    {
      id: "tier",
      header: t("admin.access.mfa.col.tier"),
      cell: (r) => (
        <div className="grid">
          <span className="text-sm font-medium">
            {t(`admin.access.mfa.tier.${r.tierKey.split(".")[1]}`)}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {r.tierKey}
          </span>
        </div>
      ),
    },
    {
      id: "required",
      header: t("admin.access.mfa.col.required"),
      cell: (r) => (
        <Badge
          variant={r.mfaRequired ? "default" : "secondary"}
          className="uppercase"
        >
          {t(
            r.mfaRequired
              ? "admin.access.mfa.required.on"
              : "admin.access.mfa.required.off",
          )}
        </Badge>
      ),
    },
    {
      id: "grace",
      header: t("admin.access.mfa.col.grace"),
      align: "right",
      cell: (r) => (
        <span className="font-mono tabular-nums">{r.graceDays}</span>
      ),
    },
    {
      id: "enroll",
      header: t("admin.access.mfa.col.enroll"),
      align: "right",
      cell: (r) => (
        <span className="font-mono tabular-nums">{r.enrollRate}%</span>
      ),
    },
    {
      id: "updated",
      header: t("admin.access.mfa.col.updated"),
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
      header: t("admin.access.mfa.col.action"),
      align: "right",
      cell: (r) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {r.mfaRequired ? (
            <Button
              size="sm"
              variant="destructive"
              disabled={r.tierKey === "tier.admin" || ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() => setDialog({ kind: "row-relax", id: r.id })}
              data-testid={`mfa-relax-${r.id}`}
            >
              {t("admin.access.mfa.action.relax")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              disabled={ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() => requireMfa(r.id)}
              data-testid={`mfa-require-${r.id}`}
            >
              {t("admin.access.mfa.action.require")}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleConfirm = (reason: string) => {
    if (!dialog) return;
    if (dialog.kind === "row-relax") safeRelax(dialog.id, reason);
    if (dialog.kind === "bulk-relax") {
      safeBulkRelax(Array.from(selected), reason);
      setSelected(new Set());
    }
    setDialog(null);
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-medium">{t("admin.mfa.title")}</h1>
          <Badge
            variant="outline"
            className="border-(--color-primary)/40 text-[10px] uppercase tracking-wider"
            data-testid="mock-chip"
          >
            {t("admin.primitive.mock")}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {t("admin.access.mfa.subtitle.boundary")}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">{t("admin.mfa.subtitle")}</p>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <AdminMetricCard
          label={t("admin.access.mfa.metric.total")}
          value={String(total)}
          tone="default"
          testId="mfa-metric-total"
        />
        <AdminMetricCard
          label={t("admin.access.mfa.metric.required")}
          value={String(required)}
          tone="default"
          testId="mfa-metric-required"
        />
        <AdminMetricCard
          label={t("admin.access.mfa.metric.relaxed")}
          value={String(relaxed)}
          tone={relaxed > 0 ? "warn" : "default"}
          testId="mfa-metric-relaxed"
        />
        <AdminMetricCard
          label={t("admin.access.mfa.metric.enroll")}
          value={`${avgEnroll}%`}
          tone="default"
          testId="mfa-metric-enroll"
        />
      </div>

      <AdminQueueSection
        title={t("admin.access.mfa.section.title")}
        count={filteredMfa.length}
        countAriaLabel={t("admin.access.mfa.section.title")}
        subtitle={t("admin.access.mfa.section.subtitle")}
      >
        <AdminFilterBar
          search={mfaFilters.search}
          onSearchChange={(v) =>
            setMfaFilters((p) => ({ ...p, search: v }))
          }
          placeholder={t("admin.access.mfa.search.placeholder")}
          chips={[
            ...TIER_FILTERS.map((tk) => ({
              label: t(
                tk === "all"
                  ? "admin.access.mfa.tier.all"
                  : `admin.access.mfa.tier.${tk.split(".")[1]}`,
              ),
              value: `tier:${tk}`,
              active: mfaFilters.tierKey === tk,
              onToggle: () =>
                setMfaFilters((p) => ({ ...p, tierKey: tk })),
            })),
            ...REQUIRED_FILTERS.map((r) => ({
              label: t(`admin.access.mfa.required.${r}`),
              value: `req:${r}`,
              active: mfaFilters.required === r,
              onToggle: () => setMfaFilters((p) => ({ ...p, required: r })),
            })),
          ]}
          onReset={
            mfaFilters.search ||
            mfaFilters.tierKey !== "all" ||
            mfaFilters.required !== "all"
              ? () =>
                  setMfaFilters({ search: "", tierKey: "all", required: "all" })
              : undefined
          }
          searchTestId="mfa-search"
        />
        <AdminDataTable<AdminMfaPolicyRow>
          columns={columns}
          rows={filteredMfa}
          rowKey={(r) => r.id}
          rowTestId={(r) => `mfa-row-${r.id}`}
          ariaLabel={t("admin.access.mfa.section.title")}
          empty={t("admin.access.mfa.empty")}
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
            data-testid="mfa-bulk-bar"
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
                  bulkRequireMfa(Array.from(selected));
                  setSelected(new Set());
                }}
                data-testid="mfa-bulk-require"
              >
                {t("admin.access.mfa.bulk.require")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => setDialog({ kind: "bulk-relax" })}
                data-testid="mfa-bulk-relax"
              >
                {t("admin.access.mfa.bulk.relax")}
              </Button>
            </div>
          </div>
        ) : null}
      </AdminQueueSection>

      <div className="grid gap-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("admin.access.mfa.audit.title")}
        </h3>
        <AdminAuditTrail
          events={audit}
          emptyLabel={t("admin.access.mfa.audit.empty")}
        />
      </div>

      <AdminReasonDialog
        open={dialog !== null}
        onOpenChange={(o) => {
          if (!o) setDialog(null);
        }}
        title={t("admin.access.mfa.dialog.relax.title")}
        variant="destructive"
        onConfirm={handleConfirm}
        reasonInputTestId="mfa-reason-input"
        confirmTestId="mfa-reason-confirm"
      />
    </div>
  );
}
