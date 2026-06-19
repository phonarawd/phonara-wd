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
import type {
  AdminEarnSettlementRow,
  SettlementState,
  UseAdminEarnDesk,
} from "@/hooks/admin/useAdminEarnDeskMock";

// L1-15-F F-B · Earn Settlements queue.
// 6요소: metrics · filter · table · row actions · audit (in hub) · bulk.
// canonical state semantics = affiliate_settlements.state.

const STATE_FILTERS: Array<SettlementState | "all"> = [
  "all",
  "pending",
  "approved",
  "paid",
];

function StateBadge(props: { state: SettlementState }) {
  const variant: "default" | "outline" | "secondary" =
    props.state === "paid"
      ? "default"
      : props.state === "approved"
        ? "secondary"
        : "outline";
  return (
    <Badge variant={variant} className="uppercase">
      {t(`admin.earn.settlements.state.${props.state}`)}
    </Badge>
  );
}

type Dialog =
  | { kind: "row-paid"; id: string }
  | { kind: "row-reject"; id: string }
  | { kind: "bulk-paid" }
  | null;

export interface EarnSettlementsQueueProps {
  desk: UseAdminEarnDesk;
}

export function EarnSettlementsQueue({ desk }: EarnSettlementsQueueProps) {
  const {
    settlements,
    filteredSettlements,
    settlementFilters,
    setSettlementFilters,
    approveSettlement,
    markSettlementPaid,
    rejectSettlement,
    bulkApproveSettlements,
    bulkMarkSettlementsPaid,
  } = desk;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<Dialog>(null);

  const pendingCount = useMemo(
    () => settlements.filter((s) => s.state === "pending").length,
    [settlements],
  );
  const approvedCount = useMemo(
    () => settlements.filter((s) => s.state === "approved").length,
    [settlements],
  );
  const paidCount = useMemo(
    () => settlements.filter((s) => s.state === "paid").length,
    [settlements],
  );
  const totalCount = settlements.length;

  const columns: AdminColumn<AdminEarnSettlementRow>[] = [
    {
      id: "state",
      header: t("admin.earn.settlements.col.state"),
      cell: (r) => <StateBadge state={r.state} />,
    },
    {
      id: "agent",
      header: t("admin.earn.settlements.col.agent"),
      cell: (r) => (
        <div className="grid">
          <span className="text-sm font-medium">{r.agentDisplayName}</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {r.agentCode}
          </span>
        </div>
      ),
    },
    {
      id: "period",
      header: t("admin.earn.settlements.col.period"),
      cell: (r) => (
        <span className="font-mono text-xs tabular-nums">{r.periodKey}</span>
      ),
    },
    {
      id: "amount",
      header: t("admin.earn.settlements.col.amount"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.amount.padStart(20, "0"),
      cell: (r) => (
        <span className="font-mono text-sm font-medium tabular-nums">
          {r.amount}
        </span>
      ),
    },
    {
      id: "currency",
      header: t("admin.earn.settlements.col.currency"),
      align: "right",
      cell: (r) => (
        <Badge variant="outline" className="font-mono">
          {r.currency}
        </Badge>
      ),
    },
    {
      id: "downline",
      header: t("admin.earn.settlements.col.downline"),
      align: "right",
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {r.downlineCount ?? "—"}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: t("admin.earn.settlements.col.createdAt"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.createdAt,
      cell: (r) => (
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {r.createdAt.slice(0, 10)}
        </span>
      ),
    },
    {
      id: "action",
      header: t("admin.earn.settlements.col.action"),
      align: "right",
      cell: (r) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {r.state === "pending" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => approveSettlement(r.id)}
              data-testid={`settlement-approve-${r.id}`}
            >
              {t("admin.earn.settlements.action.approve")}
            </Button>
          ) : null}
          {r.state === "approved" ? (
            <Button
              size="sm"
              variant="default"
              onClick={() => setDialog({ kind: "row-paid", id: r.id })}
              data-testid={`settlement-paid-${r.id}`}
            >
              {t("admin.earn.settlements.action.paid")}
            </Button>
          ) : null}
          {r.state === "pending" ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDialog({ kind: "row-reject", id: r.id })}
              data-testid={`settlement-reject-${r.id}`}
            >
              {t("admin.earn.settlements.action.reject")}
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const dialogTitle = useMemo(() => {
    if (!dialog) return "";
    if (dialog.kind === "row-reject")
      return t("admin.earn.settlements.dialog.reject.title");
    return t("admin.earn.settlements.dialog.paid.title");
  }, [dialog]);

  const handleConfirm = (reason: string) => {
    if (!dialog) return;
    if (dialog.kind === "row-paid") {
      markSettlementPaid(dialog.id, reason);
    } else if (dialog.kind === "row-reject") {
      rejectSettlement(dialog.id, reason);
    } else if (dialog.kind === "bulk-paid") {
      bulkMarkSettlementsPaid(Array.from(selected), reason);
      setSelected(new Set());
    }
    setDialog(null);
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          label={t("admin.earn.settlements.metric.pending")}
          value={String(pendingCount)}
          tone={pendingCount > 0 ? "warn" : "default"}
          testId="settlements-metric-pending"
        />
        <AdminMetricCard
          label={t("admin.earn.settlements.metric.approved")}
          value={String(approvedCount)}
          tone="primary"
          testId="settlements-metric-approved"
        />
        <AdminMetricCard
          label={t("admin.earn.settlements.metric.paid")}
          value={String(paidCount)}
          tone="default"
          testId="settlements-metric-paid"
        />
        <AdminMetricCard
          label={t("admin.earn.settlements.metric.total")}
          value={String(totalCount)}
          tone="default"
          testId="settlements-metric-total"
        />
      </div>

      <AdminQueueSection
        title={t("admin.earn.settlements.section.title")}
        count={filteredSettlements.length}
        countAriaLabel={t("admin.earn.settlements.section.title")}
        subtitle={t("admin.earn.settlements.section.subtitle")}
      >
        <AdminFilterBar
          search={settlementFilters.search}
          onSearchChange={(v) =>
            setSettlementFilters((p) => ({ ...p, search: v }))
          }
          placeholder={t("admin.earn.settlements.search.placeholder")}
          chips={STATE_FILTERS.map((s) => ({
            label: t(
              s === "all"
                ? "admin.earn.settlements.state.all"
                : `admin.earn.settlements.state.${s}`,
            ),
            value: `sstate:${s}`,
            active: settlementFilters.state === s,
            onToggle: () => setSettlementFilters((p) => ({ ...p, state: s })),
          }))}
          onReset={
            settlementFilters.search || settlementFilters.state !== "all"
              ? () => setSettlementFilters({ search: "", state: "all" })
              : undefined
          }
          searchTestId="settlements-search"
        />
        <AdminDataTable<AdminEarnSettlementRow>
          columns={columns}
          rows={filteredSettlements}
          rowKey={(r) => r.id}
          rowTestId={(r) => `settlements-row-${r.id}`}
          ariaLabel={t("admin.earn.settlements.section.title")}
          empty={t("admin.earn.settlements.empty")}
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
            data-testid="settlements-bulk-bar"
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
                onClick={() => {
                  bulkApproveSettlements(Array.from(selected));
                  setSelected(new Set());
                }}
                data-testid="settlements-bulk-approve"
              >
                {t("admin.earn.settlements.bulk.approve")}
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => setDialog({ kind: "bulk-paid" })}
                data-testid="settlements-bulk-paid"
              >
                {t("admin.earn.settlements.bulk.paid")}
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
        variant={dialog && dialog.kind === "row-reject" ? "destructive" : "default"}
        onConfirm={handleConfirm}
        reasonInputTestId="settlements-reason-input"
        confirmTestId="settlements-reason-confirm"
      />
    </div>
  );
}
