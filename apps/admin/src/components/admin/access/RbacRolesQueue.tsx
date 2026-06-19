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
  AdminRbacRoleRow,
  UseAdminAccessDesk,
} from "@/hooks/admin/useAdminAccessDeskMock";

// L1-15-J · J5 — RBAC roles queue. 6 elements.

const ENABLED_FILTERS: Array<"all" | "on" | "off"> = ["all", "on", "off"];

type Dialog = { kind: "row-disable"; id: string } | { kind: "bulk-disable" } | null;

export interface RbacRolesQueueProps {
  desk: UseAdminAccessDesk;
}

export function RbacRolesQueue({ desk }: RbacRolesQueueProps) {
  const {
    roles,
    filteredRoles,
    roleFilters,
    setRoleFilters,
    enableRole,
    disableRole,
    bulkDisableRoles,
  } = desk;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<Dialog>(null);

  const enabledCount = useMemo(
    () => roles.filter((r) => r.enabled).length,
    [roles],
  );
  const disabledCount = useMemo(
    () => roles.filter((r) => !r.enabled).length,
    [roles],
  );
  const memberSum = useMemo(
    () => roles.reduce((acc, r) => acc + (parseInt(r.memberCount, 10) || 0), 0),
    [roles],
  );
  const totalRoles = roles.length;

  const safeDisable = (id: string, reason: string) => {
    try {
      disableRole(id, reason);
    } catch {
      /* primitive guards */
    }
  };
  const safeBulkDisable = (ids: string[], reason: string) => {
    try {
      bulkDisableRoles(ids, reason);
    } catch {
      /* noop */
    }
  };

  const columns: AdminColumn<AdminRbacRoleRow>[] = [
    {
      id: "role",
      header: t("admin.access.roles.col.role"),
      cell: (r) => (
        <div className="grid">
          <span className="text-sm font-medium">{t(r.labelKey)}</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {r.roleKey}
          </span>
        </div>
      ),
    },
    {
      id: "members",
      header: t("admin.access.roles.col.members"),
      align: "right",
      cell: (r) => (
        <span className="font-mono tabular-nums">{r.memberCount}</span>
      ),
    },
    {
      id: "routes",
      header: t("admin.access.roles.col.routes"),
      cell: (r) => (
        <span className="text-[11px] text-muted-foreground">
          {r.routesSummary}
        </span>
      ),
    },
    {
      id: "state",
      header: t("admin.access.roles.col.state"),
      cell: (r) => (
        <Badge
          variant={r.enabled ? "default" : "secondary"}
          className="uppercase"
        >
          {t(
            r.enabled
              ? "admin.access.roles.state.enabled"
              : "admin.access.roles.state.disabled",
          )}
        </Badge>
      ),
    },
    {
      id: "updated",
      header: t("admin.access.roles.col.updated"),
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
      header: t("admin.access.roles.col.action"),
      align: "right",
      cell: (r) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {r.enabled ? (
            <Button
              size="sm"
              variant="destructive"
              disabled={r.roleKey === "owner" || ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() => setDialog({ kind: "row-disable", id: r.id })}
              data-testid={`rbac-disable-${r.id}`}
            >
              {t("admin.access.roles.action.disable")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              disabled={ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() => enableRole(r.id)}
              data-testid={`rbac-enable-${r.id}`}
            >
              {t("admin.access.roles.action.enable")}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleConfirm = (reason: string) => {
    if (!dialog) return;
    if (dialog.kind === "row-disable") safeDisable(dialog.id, reason);
    if (dialog.kind === "bulk-disable") {
      safeBulkDisable(Array.from(selected), reason);
      setSelected(new Set());
    }
    setDialog(null);
  };

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <AdminMetricCard
          label={t("admin.access.roles.metric.total")}
          value={String(totalRoles)}
          tone="default"
          testId="rbac-metric-total"
        />
        <AdminMetricCard
          label={t("admin.access.roles.metric.enabled")}
          value={String(enabledCount)}
          tone="default"
          testId="rbac-metric-enabled"
        />
        <AdminMetricCard
          label={t("admin.access.roles.metric.disabled")}
          value={String(disabledCount)}
          tone={disabledCount > 0 ? "warn" : "default"}
          testId="rbac-metric-disabled"
        />
        <AdminMetricCard
          label={t("admin.access.roles.metric.members")}
          value={String(memberSum)}
          tone="default"
          testId="rbac-metric-members"
        />
      </div>

      <AdminQueueSection
        title={t("admin.access.roles.section.title")}
        count={filteredRoles.length}
        countAriaLabel={t("admin.access.roles.section.title")}
        subtitle={t("admin.access.roles.section.subtitle")}
      >
        <AdminFilterBar
          search={roleFilters.search}
          onSearchChange={(v) =>
            setRoleFilters((p) => ({ ...p, search: v }))
          }
          placeholder={t("admin.access.roles.search.placeholder")}
          chips={ENABLED_FILTERS.map((e) => ({
            label: t(`admin.access.roles.enabled.${e}`),
            value: `rbac-enabled:${e}`,
            active: roleFilters.enabled === e,
            onToggle: () => setRoleFilters((p) => ({ ...p, enabled: e })),
          }))}
          onReset={
            roleFilters.search || roleFilters.enabled !== "all"
              ? () => setRoleFilters({ search: "", enabled: "all" })
              : undefined
          }
          searchTestId="rbac-search"
        />
        <AdminDataTable<AdminRbacRoleRow>
          columns={columns}
          rows={filteredRoles}
          rowKey={(r) => r.id}
          rowTestId={(r) => `rbac-row-${r.id}`}
          ariaLabel={t("admin.access.roles.section.title")}
          empty={t("admin.access.roles.empty")}
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
            data-testid="rbac-bulk-bar"
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
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => setDialog({ kind: "bulk-disable" })}
                data-testid="rbac-bulk-disable"
              >
                {t("admin.access.roles.bulk.disable")}
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
        title={t("admin.access.roles.dialog.disable.title")}
        variant="destructive"
        onConfirm={handleConfirm}
        reasonInputTestId="rbac-reason-input"
        confirmTestId="rbac-reason-confirm"
      />
    </div>
  );
}
