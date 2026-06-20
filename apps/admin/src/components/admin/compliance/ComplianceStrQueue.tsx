import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/admin-time";
import {
  useAdminCompliance,
  type AdminStrRow,
  type StrCaseType,
  type StrStatus,
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

// L1-15-D D3 — STR case queue · 6 elements.

const STATUSES: StrStatus[] = ["open", "reviewing", "filed", "dismissed"];
const CASE_TYPES: StrCaseType[] = [
  "structuring",
  "rapid_movement",
  "high_risk_geo",
  "chip_dumping",
];

type Mode =
  | { kind: "flag"; id: string }
  | { kind: "escalate"; id: string }
  | { kind: "file"; id: string }
  | { kind: "dismiss"; id: string }
  | { kind: "bulkEscalate" }
  | null;

export function ComplianceStrQueue() {
  const {
    filteredStr,
    str,
    strFilters,
    setStrFilters,
    audit,
    flagStr,
    escalateStr,
    fileStr,
    dismissStr,
  } = useAdminCompliance();

  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<AdminStrRow | null>(null);

  const openCount = useMemo(
    () => str.filter((r) => r.status === "open").length,
    [str],
  );

  const strAudit = useMemo(
    () =>
      audit.filter((e) => e.actionKey.startsWith("admin.compliance.str.audit")),
    [audit],
  );

  const toggleChip = <K extends "status" | "caseType">(
    key: K,
    value: (typeof strFilters)[K][number],
  ) => {
    setStrFilters((p) => {
      const arr = p[key] as string[];
      const next = arr.includes(value as string)
        ? arr.filter((x) => x !== value)
        : [...arr, value as string];
      return { ...p, [key]: next };
    });
  };

  const dialogTitle =
    mode?.kind === "dismiss"
      ? t("admin.compliance.str.action.dismiss")
      : mode?.kind === "file"
        ? t("admin.compliance.str.action.file")
        : mode?.kind === "escalate" || mode?.kind === "bulkEscalate"
          ? t("admin.compliance.str.action.escalate")
          : t("admin.compliance.str.action.flag");

  const dialogVariant: "destructive" | "default" =
    mode?.kind === "dismiss" ? "destructive" : "default";

  const handleConfirm = async (reason: string) => {
    if (!mode) return;
    let ok = false;
    if (mode.kind === "flag") ok = await flagStr(mode.id, reason);
    else if (mode.kind === "escalate") ok = await escalateStr(mode.id, reason);
    else if (mode.kind === "file") ok = await fileStr(mode.id, reason);
    else if (mode.kind === "dismiss") ok = await dismissStr(mode.id, reason);
    else if (mode.kind === "bulkEscalate") {
      for (const id of selected) {
        await escalateStr(id, reason);
      }
      setSelected(new Set());
      ok = true;
    }
    if (ok) setMode(null);
  };

  const columns: AdminColumn<AdminStrRow>[] = [
    {
      id: "user",
      header: t("admin.compliance.str.col.user"),
      cell: (r) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {r.userId}
        </span>
      ),
    },
    {
      id: "caseType",
      header: t("admin.compliance.str.col.caseType"),
      cell: (r) => (
        <Badge variant="secondary">
          {t(`admin.compliance.str.filter.caseType.${r.caseType}`)}
        </Badge>
      ),
    },
    {
      id: "status",
      header: t("admin.compliance.str.col.status"),
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      id: "trigger",
      header: t("admin.compliance.str.col.trigger"),
      cell: (r) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {r.triggerRef}
        </span>
      ),
    },
    {
      id: "created",
      header: t("admin.compliance.str.col.created"),
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
      header: t("admin.compliance.str.col.action"),
      align: "right",
      cell: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {r.status === "open" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMode({ kind: "flag", id: r.id })}
                data-testid={`str-flag-${r.id}`}
              >
                {t("admin.compliance.str.action.flag")}
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => setMode({ kind: "escalate", id: r.id })}
                data-testid={`str-escalate-${r.id}`}
              >
                {t("admin.compliance.str.action.escalate")}
              </Button>
            </>
          ) : r.status === "reviewing" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMode({ kind: "dismiss", id: r.id })}
                data-testid={`str-dismiss-${r.id}`}
              >
                {t("admin.compliance.str.action.dismiss")}
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => setMode({ kind: "file", id: r.id })}
                data-testid={`str-file-${r.id}`}
              >
                {t("admin.compliance.str.action.file")}
              </Button>
            </>
          ) : (
            <StatusBadge status={r.status} />
          )}
        </div>
      ),
    },
  ];

  const openSelected = new Set(
    Array.from(selected).filter((id) =>
      str.find((x) => x.id === id && x.status === "open"),
    ),
  );

  return (
    <div className="grid min-w-0 gap-3">
      <AdminQueueSection
        title={t("admin.compliance.str.title")}
        count={openCount}
        countAriaLabel={t("admin.compliance.str.title")}
        severity="crit"
        subtitle={t("admin.compliance.str.subtitle")}
        mockChip
      >
        <AdminFilterBar
          search={strFilters.search}
          onSearchChange={(v) => setStrFilters((p) => ({ ...p, search: v }))}
          placeholder={t("admin.compliance.str.filter.search.placeholder")}
          chips={[
            ...STATUSES.map((s) => ({
              label: t(`admin.compliance.str.filter.status.${s}`),
              value: `status:${s}`,
              active: strFilters.status.includes(s),
              onToggle: () => toggleChip("status", s),
            })),
            ...CASE_TYPES.map((c) => ({
              label: t(`admin.compliance.str.filter.caseType.${c}`),
              value: `case:${c}`,
              active: strFilters.caseType.includes(c),
              onToggle: () => toggleChip("caseType", c),
            })),
          ]}
          onReset={
            strFilters.search ||
            strFilters.status.length > 0 ||
            strFilters.caseType.length > 0
              ? () => setStrFilters({ search: "", status: [], caseType: [] })
              : undefined
          }
        />

        <AdminDataTable<AdminStrRow>
          columns={columns}
          rows={filteredStr}
          rowKey={(r) => r.id}
          rowTestId={(r) => `str-row-${r.id}`}
          ariaLabel={t("admin.compliance.str.title")}
          onRowClick={(r) => setDrawer(r)}
          empty={t("admin.compliance.str.empty")}
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

        {openSelected.size > 0 ? (
          <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="tabular-nums">
                {openSelected.size}
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
                onClick={() => setMode({ kind: "bulkEscalate" })}
                data-testid="str-bulk-escalate"
              >
                {t("admin.compliance.str.bulk.escalate")}
              </Button>
            </div>
          </div>
        ) : null}
      </AdminQueueSection>

      <div className="grid gap-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("admin.compliance.str.audit.title")}
        </h3>
        <AdminAuditTrail
          events={strAudit}
          emptyLabel={t("admin.compliance.str.audit.empty")}
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
            <Row label={t("admin.compliance.str.col.user")} value={drawer.userId} mono />
            <Row
              label={t("admin.compliance.str.col.caseType")}
              value={t(`admin.compliance.str.filter.caseType.${drawer.caseType}`)}
            />
            <Row
              label={t("admin.compliance.str.col.status")}
              value={t(`admin.compliance.str.filter.status.${drawer.status}`)}
            />
            <Row
              label={t("admin.compliance.str.col.trigger")}
              value={drawer.triggerRef}
            />
            <Row
              label={t("admin.compliance.str.col.details")}
              value={drawer.detailsSummary}
            />
            <Row
              label={t("admin.compliance.str.col.created")}
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

function StatusBadge(props: { status: StrStatus }) {
  const variant =
    props.status === "filed"
      ? "secondary"
      : props.status === "dismissed"
        ? "outline"
        : props.status === "reviewing"
          ? "default"
          : "destructive";
  return (
    <Badge variant={variant as "default" | "secondary" | "destructive" | "outline"}>
      {t(`admin.compliance.str.filter.status.${props.status}`)}
    </Badge>
  );
}
