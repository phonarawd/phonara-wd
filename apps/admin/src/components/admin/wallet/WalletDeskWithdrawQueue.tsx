import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/admin-time";
import {
  useAdminWalletDesk,
  formatAmountString,
  isOverdueSla,
  type AdminWithdrawRow,
  type WithdrawMethod,
  type WithdrawStatus,
} from "@/hooks/admin/useAdminWalletDesk";
import {
  AdminQueueSection,
  AdminDataTable,
  AdminFilterBar,
  AdminDetailDrawer,
  AdminBulkActionBar,
  AdminAuditTrail,
  AdminReasonDialog,
  type AdminColumn,
} from "@/components/admin/primitives";
import { t } from "@/i18n";

// L1-15-B B2 — Withdraw approval queue (6 elements via P0 primitives).
// SOT: useAdminWalletDeskMock (createAdminMockHook first use).
// Bulk = UI loop · F9 method/amount string contract.

const STATUSES: WithdrawStatus[] = ["pending", "approved", "sent", "rejected"];
const METHODS: WithdrawMethod[] = ["crypto", "krw"];

type Mode =
  | { kind: "approve"; id: string }
  | { kind: "reject"; id: string }
  | { kind: "sent"; id: string }
  | { kind: "bulkApprove" }
  | { kind: "bulkReject" }
  | null;

export function WalletDeskWithdrawQueue() {
  const {
    filteredWithdrawals,
    withdrawals,
    withdrawFilters,
    setWithdrawFilters,
    audit,
    approveWithdraw,
    rejectWithdraw,
    markSent,
  } = useAdminWalletDesk();

  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<AdminWithdrawRow | null>(null);

  const pendingCount = useMemo(
    () => withdrawals.filter((w) => w.status === "pending").length,
    [withdrawals],
  );

  const withdrawAudit = useMemo(
    () =>
      audit.filter((e) =>
        e.actionKey.startsWith("admin.wallet.withdraw.audit"),
      ),
    [audit],
  );

  const toggleChip = <K extends keyof Pick<typeof withdrawFilters, "status" | "method">>(
    key: K,
    value: (typeof withdrawFilters)[K][number],
  ) => {
    setWithdrawFilters((p) => {
      const arr = p[key] as string[];
      const next = arr.includes(value as string)
        ? arr.filter((x) => x !== value)
        : [...arr, value as string];
      return { ...p, [key]: next };
    });
  };

  const dialogTitle =
    mode?.kind === "reject" || mode?.kind === "bulkReject"
      ? t("admin.wallet.withdraw.action.reject")
      : mode?.kind === "sent"
        ? t("admin.wallet.withdraw.action.markSent")
        : t("admin.wallet.withdraw.action.approve");

  const dialogVariant: "destructive" | "default" =
    mode?.kind === "reject" || mode?.kind === "bulkReject"
      ? "destructive"
      : "default";

  const handleConfirm = async (reason: string) => {
    if (!mode) return;
    if (mode.kind === "approve") await approveWithdraw(mode.id, reason);
    else if (mode.kind === "reject") await rejectWithdraw(mode.id, reason);
    else if (mode.kind === "sent") await markSent(mode.id, reason);
    else if (mode.kind === "bulkApprove") {
      for (const id of selected) await approveWithdraw(id, reason);
      setSelected(new Set());
    } else if (mode.kind === "bulkReject") {
      for (const id of selected) await rejectWithdraw(id, reason);
      setSelected(new Set());
    }
    setMode(null);
  };

  const columns: AdminColumn<AdminWithdrawRow>[] = [
    {
      id: "user",
      header: t("admin.wallet.withdraw.col.user"),
      cell: (r) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {r.userId}
        </span>
      ),
    },
    {
      id: "method",
      header: t("admin.wallet.withdraw.col.method"),
      cell: (r) => (
        <Badge variant="secondary" className="uppercase">
          {t(`admin.wallet.withdraw.filter.method.${r.method}`)}
        </Badge>
      ),
    },
    {
      id: "amount",
      header: t("admin.wallet.withdraw.col.amount"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.amount.padStart(20, "0"),
      cell: (r) => (
        <span className="font-medium">
          {formatAmountString(r.amount, r.currency)}
        </span>
      ),
    },
    {
      id: "status",
      header: t("admin.wallet.withdraw.col.status"),
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      id: "sla",
      header: t("admin.wallet.withdraw.col.sla"),
      sortable: true,
      sortValue: (r) => r.slaDueAt,
      cell: (r) => {
        const overdue = r.status === "pending" && isOverdueSla(r.slaDueAt);
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-xs tabular-nums text-muted-foreground">
              {relativeTime(r.slaDueAt)}
            </span>
            {overdue ? (
              <Badge variant="destructive" className="text-[10px]">
                {t("admin.wallet.sla.overdue")}
              </Badge>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "created",
      header: t("admin.wallet.withdraw.col.created"),
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
      header: t("admin.wallet.withdraw.col.action"),
      align: "right",
      cell: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {r.status === "pending" ? (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => setMode({ kind: "approve", id: r.id })}
                data-testid={`approve-${r.id}`}
              >
                {t("admin.wallet.withdraw.action.approve")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMode({ kind: "reject", id: r.id })}
                data-testid={`queue-withdraw-reject-${r.id}`}
              >
                {t("admin.wallet.withdraw.action.reject")}
              </Button>
            </>
          ) : r.status === "approved" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMode({ kind: "sent", id: r.id })}
              data-testid={`mark-sent-${r.id}`}
            >
              {t("admin.wallet.withdraw.action.markSent")}
            </Button>
          ) : (
            <StatusBadge status={r.status} />
          )}
        </div>
      ),
    },
  ];

  // Bulk allowed only on pending rows.
  const pendingSelected = new Set(
    Array.from(selected).filter((id) =>
      withdrawals.find((w) => w.id === id && w.status === "pending"),
    ),
  );

  return (
    <div className="grid min-w-0 gap-3">
      <AdminQueueSection
        title={t("admin.wallet.withdraw.title")}
        count={pendingCount}
        countAriaLabel={t("admin.wallet.withdraw.title")}
        severity="crit"
        subtitle={t("admin.wallet.withdraw.subtitle")}
      >
        <AdminFilterBar
          search={withdrawFilters.search}
          onSearchChange={(v) =>
            setWithdrawFilters((p) => ({ ...p, search: v }))
          }
          placeholder={t("admin.wallet.withdraw.filter.search.placeholder")}
          chips={[
            ...STATUSES.map((s) => ({
              label: t(`admin.wallet.withdraw.filter.status.${s}`),
              value: `status:${s}`,
              active: withdrawFilters.status.includes(s),
              onToggle: () => toggleChip("status", s),
            })),
            ...METHODS.map((m) => ({
              label: t(`admin.wallet.withdraw.filter.method.${m}`),
              value: `method:${m}`,
              active: withdrawFilters.method.includes(m),
              onToggle: () => toggleChip("method", m),
            })),
          ]}
          onReset={
            withdrawFilters.search ||
            withdrawFilters.status.length > 0 ||
            withdrawFilters.method.length > 0
              ? () =>
                  setWithdrawFilters({ search: "", status: [], method: [] })
              : undefined
          }
        />

        <AdminDataTable<AdminWithdrawRow>
          columns={columns}
          rows={filteredWithdrawals}
          rowKey={(r) => r.id}
          rowTestId={(r) => `withdraw-row-${r.id}`}
          ariaLabel={t("admin.wallet.withdraw.title")}
          onRowClick={(r) => setDrawer(r)}
          empty={t("admin.wallet.withdraw.empty")}
          tableTestId="admin-withdrawals-table"
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

        {pendingSelected.size > 0 ? (
          <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="tabular-nums">
                {pendingSelected.size}
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
                onClick={() => setMode({ kind: "bulkReject" })}
                data-testid="bulk-reject"
              >
                {t("admin.wallet.withdraw.bulk.reject")}
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => setMode({ kind: "bulkApprove" })}
                data-testid="bulk-approve"
              >
                {t("admin.wallet.withdraw.bulk.approve")}
              </Button>
            </div>
          </div>
        ) : null}
      </AdminQueueSection>

      <div className="grid gap-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("admin.wallet.withdraw.audit.title")}
        </h3>
        <AdminAuditTrail
          events={withdrawAudit}
          emptyLabel={t("admin.wallet.withdraw.audit.empty")}
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
        reasonInputTestId="admin-queue-action-reason"
        confirmTestId="admin-queue-action-confirm"
      />

      <AdminDetailDrawer
        open={drawer !== null}
        onOpenChange={(o) => {
          if (!o) setDrawer(null);
        }}
        title={t("admin.wallet.withdraw.detail.title")}
        description={drawer ? drawer.id : undefined}
      >
        {drawer ? (
          <div className="grid gap-3 text-sm">
            <Row label={t("admin.wallet.withdraw.col.user")} value={drawer.userId} mono />
            <Row
              label={t("admin.wallet.withdraw.col.method")}
              value={t(`admin.wallet.withdraw.filter.method.${drawer.method}`)}
            />
            <Row
              label={t("admin.wallet.withdraw.col.amount")}
              value={formatAmountString(drawer.amount, drawer.currency)}
            />
            {drawer.fee ? (
              <Row
                label={t("admin.wallet.withdraw.col.fee")}
                value={formatAmountString(drawer.fee, drawer.currency)}
              />
            ) : null}
            {drawer.net ? (
              <Row
                label={t("admin.wallet.withdraw.col.net")}
                value={formatAmountString(drawer.net, drawer.currency)}
              />
            ) : null}
            <Row
              label={t("admin.wallet.withdraw.col.destination")}
              value={drawer.destinationSummary}
            />
            <Row
              label={t("admin.wallet.withdraw.col.status")}
              value={t(`admin.wallet.withdraw.filter.status.${drawer.status}`)}
            />
            <Row
              label={t("admin.wallet.withdraw.col.sla")}
              value={relativeTime(drawer.slaDueAt)}
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

function StatusBadge(props: { status: WithdrawStatus }) {
  const variant =
    props.status === "rejected"
      ? "destructive"
      : props.status === "sent"
        ? "secondary"
        : props.status === "approved"
          ? "default"
          : "outline";
  return (
    <Badge variant={variant as "default" | "secondary" | "destructive" | "outline"}>
      {t(`admin.wallet.withdraw.filter.status.${props.status}`)}
    </Badge>
  );
}
