import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/admin-time";
import {
  useAdminCompliance,
  type AdminRiskRgRow,
  type RiskFlagType,
  type RiskStatus,
} from "@/hooks/admin/useAdminCompliance";
import {
  AdminQueueSection,
  AdminDataTable,
  AdminFilterBar,
  AdminDetailDrawer,
  AdminAuditTrail,
  AdminReasonDialog,
  type AdminColumn,
} from "@/components/admin/primitives";
import { t } from "@/i18n";

// L1-15-D D4 — Risk/RG queue · 6 elements.

const STATUSES: RiskStatus[] = ["active", "cleared"];
const FLAG_TYPES: RiskFlagType[] = [
  "rg_self_exclusion",
  "rg_cooldown",
  "rg_deposit_limit",
  "fraud_pattern",
  "vpn_proxy",
];

type Mode =
  | { kind: "clear"; id: string }
  | { kind: "cooldown"; id: string }
  | { kind: "limitOverride"; id: string }
  | { kind: "bulkClear" }
  | null;

export function ComplianceRiskRgQueue() {
  const {
    filteredRisk,
    risk,
    riskFilters,
    setRiskFilters,
    audit,
    clearRiskFlag,
  } = useAdminCompliance();

  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<AdminRiskRgRow | null>(null);

  const activeCount = useMemo(
    () => risk.filter((r) => r.status === "active").length,
    [risk],
  );

  const riskAudit = useMemo(
    () =>
      audit.filter((e) => e.actionKey.startsWith("admin.compliance.rg.audit")),
    [audit],
  );

  const toggleChip = <K extends "status" | "flagType">(
    key: K,
    value: (typeof riskFilters)[K][number],
  ) => {
    setRiskFilters((p) => {
      const arr = p[key] as string[];
      const next = arr.includes(value as string)
        ? arr.filter((x) => x !== value)
        : [...arr, value as string];
      return { ...p, [key]: next };
    });
  };

  const dialogTitle =
    mode?.kind === "cooldown"
      ? t("admin.compliance.rg.action.cooldown")
      : mode?.kind === "limitOverride"
        ? t("admin.compliance.rg.action.limitOverride")
        : t("admin.compliance.rg.action.clear");

  const dialogVariant: "destructive" | "default" =
    mode?.kind === "limitOverride" ? "destructive" : "default";

  const handleConfirm = async (reason: string) => {
    if (!mode) return;
    let ok = false;
    if (mode.kind === "clear") ok = await clearRiskFlag(mode.id, reason);
    else if (mode.kind === "bulkClear") {
      for (const id of selected) {
        await clearRiskFlag(id, reason);
      }
      setSelected(new Set());
      ok = true;
    }
    if (ok) setMode(null);
  };

  const columns: AdminColumn<AdminRiskRgRow>[] = [
    {
      id: "user",
      header: t("admin.compliance.rg.col.user"),
      cell: (r) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {r.userId}
        </span>
      ),
    },
    {
      id: "flagType",
      header: t("admin.compliance.rg.col.flagType"),
      cell: (r) => (
        <Badge variant="secondary">
          {t(`admin.compliance.risk.flagType.${r.flagType}`)}
        </Badge>
      ),
    },
    {
      id: "status",
      header: t("admin.compliance.rg.col.status"),
      cell: (r) => (
        <Badge
          variant={r.status === "active" ? "destructive" : "outline"}
        >
          {t(`admin.compliance.rg.filter.status.${r.status}`)}
        </Badge>
      ),
    },
    {
      id: "limit",
      header: t("admin.compliance.rg.col.limit"),
      align: "right",
      cell: (r) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {r.rgLimit ?? "—"}
        </span>
      ),
    },
    {
      id: "details",
      header: t("admin.compliance.rg.col.details"),
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.detailsSummary}
        </span>
      ),
    },
    {
      id: "created",
      header: t("admin.compliance.rg.col.created"),
      sortable: true,
      sortValue: (r) => r.createdAt,
      cell: (r) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {relativeTime(r.createdAt)}
        </span>
      ),
    },
    {
      id: "action",
      header: t("admin.compliance.rg.col.action"),
      align: "right",
      cell: (r) =>
        r.status === "active" ? (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled
              title={t("admin.wire.disabledNoRpc")}
              onClick={() => setMode({ kind: "cooldown", id: r.id })}
              data-testid={`rg-cooldown-${r.id}`}
            >
              {t("admin.compliance.rg.action.cooldown")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled
              title={t("admin.wire.disabledNoRpc")}
              onClick={() => setMode({ kind: "limitOverride", id: r.id })}
              data-testid={`rg-override-${r.id}`}
            >
              {t("admin.compliance.rg.action.limitOverride")}
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => setMode({ kind: "clear", id: r.id })}
              data-testid={`rg-clear-${r.id}`}
            >
              {t("admin.compliance.rg.action.clear")}
            </Button>
          </div>
        ) : (
          <Badge variant="outline">
            {t(`admin.compliance.rg.filter.status.${r.status}`)}
          </Badge>
        ),
    },
  ];

  const activeSelected = new Set(
    Array.from(selected).filter((id) =>
      risk.find((x) => x.id === id && x.status === "active"),
    ),
  );

  return (
    <div className="grid min-w-0 gap-3">
      <AdminQueueSection
        title={t("admin.compliance.rg.title")}
        count={activeCount}
        countAriaLabel={t("admin.compliance.rg.title")}
        severity="warn"
        subtitle={t("admin.compliance.rg.subtitle")}
        mockChip
      >
        <AdminFilterBar
          search={riskFilters.search}
          onSearchChange={(v) => setRiskFilters((p) => ({ ...p, search: v }))}
          placeholder={t("admin.compliance.rg.filter.search.placeholder")}
          chips={[
            ...STATUSES.map((s) => ({
              label: t(`admin.compliance.rg.filter.status.${s}`),
              value: `status:${s}`,
              active: riskFilters.status.includes(s),
              onToggle: () => toggleChip("status", s),
            })),
            ...FLAG_TYPES.map((f) => ({
              label: t(`admin.compliance.risk.flagType.${f}`),
              value: `flag:${f}`,
              active: riskFilters.flagType.includes(f),
              onToggle: () => toggleChip("flagType", f),
            })),
          ]}
          onReset={
            riskFilters.search ||
            riskFilters.status.length > 0 ||
            riskFilters.flagType.length > 0
              ? () => setRiskFilters({ search: "", status: [], flagType: [] })
              : undefined
          }
        />

        <AdminDataTable<AdminRiskRgRow>
          columns={columns}
          rows={filteredRisk}
          rowKey={(r) => r.id}
          rowTestId={(r) => `rg-row-${r.id}`}
          ariaLabel={t("admin.compliance.rg.title")}
          onRowClick={(r) => setDrawer(r)}
          empty={t("admin.compliance.rg.empty")}
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

        {activeSelected.size > 0 ? (
          <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="tabular-nums">
                {activeSelected.size}
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
                onClick={() => setMode({ kind: "bulkClear" })}
                data-testid="rg-bulk-clear"
              >
                {t("admin.compliance.rg.bulk.clear")}
              </Button>
            </div>
          </div>
        ) : null}
      </AdminQueueSection>

      <div className="grid gap-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("admin.compliance.rg.audit.title")}
        </h3>
        <AdminAuditTrail
          events={riskAudit}
          emptyLabel={t("admin.compliance.rg.audit.empty")}
        />
      </div>

      <AdminReasonDialog
        open={mode !== null}
        onOpenChange={(o) => {
          if (!o) setMode(null);
        }}
        title={dialogTitle}
        variant={dialogVariant}
        onConfirm={handleConfirm}
      />

      <AdminDetailDrawer
        open={drawer !== null}
        onOpenChange={(o) => {
          if (!o) setDrawer(null);
        }}
        title={t("admin.compliance.detail.title")}
        description={drawer ? drawer.id : undefined}
      >
        {drawer ? (
          <div className="grid gap-3 text-sm">
            <Row label={t("admin.compliance.rg.col.user")} value={drawer.userId} mono />
            <Row
              label={t("admin.compliance.rg.col.flagType")}
              value={t(`admin.compliance.risk.flagType.${drawer.flagType}`)}
            />
            <Row
              label={t("admin.compliance.rg.col.status")}
              value={t(`admin.compliance.rg.filter.status.${drawer.status}`)}
            />
            {drawer.rgLimit ? (
              <Row
                label={t("admin.compliance.rg.col.limit")}
                value={drawer.rgLimit}
              />
            ) : null}
            {drawer.selfExclusionUntil ? (
              <Row
                label={t("admin.compliance.rg.col.selfExclusionUntil")}
                value={drawer.selfExclusionUntil.slice(0, 10)}
              />
            ) : null}
            <Row
              label={t("admin.compliance.rg.col.details")}
              value={drawer.detailsSummary}
            />
            <Row
              label={t("admin.compliance.rg.col.created")}
              value={relativeTime(drawer.createdAt)}
            />
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}

function Row(props: { label: string; value: string; mono?: boolean }) {
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
