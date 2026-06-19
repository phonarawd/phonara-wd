import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/admin-time";
import {
  useAdminWalletDesk,
  formatAmountString,
  type AdminDepositReconRow,
  type DepositMethod,
  type DepositStatus,
} from "@/hooks/admin/useAdminWalletDesk";
import {
  AdminQueueSection,
  AdminDataTable,
  AdminFilterBar,
  AdminReasonDialog,
  type AdminColumn,
} from "@/components/admin/primitives";
import { t } from "@/i18n";

// L1-15-B B3 — Deposit recon read-only table + match/flag on pending_review rows.

const STATUSES: DepositStatus[] = [
  "pending",
  "confirming",
  "pending_review",
  "complete",
  "failed",
];
const METHODS: DepositMethod[] = ["crypto", "krw", "giftcard"];

type Mode =
  | { kind: "match"; id: string }
  | { kind: "flag"; id: string }
  | null;

export function WalletDeskDepositRecon() {
  const {
    deposits,
    filteredDeposits,
    depositFilters,
    setDepositFilters,
    matchDeposit,
    flagDeposit,
  } = useAdminWalletDesk();
  const [mode, setMode] = useState<Mode>(null);

  const pendingReviewCount = useMemo(
    () => deposits.filter((d) => d.status === "pending_review").length,
    [deposits],
  );

  const toggleChip = <
    K extends keyof Pick<typeof depositFilters, "status" | "method">,
  >(
    key: K,
    value: (typeof depositFilters)[K][number],
  ) => {
    setDepositFilters((p) => {
      const arr = p[key] as string[];
      const next = arr.includes(value as string)
        ? arr.filter((x) => x !== value)
        : [...arr, value as string];
      return { ...p, [key]: next };
    });
  };

  const dialogTitle =
    mode?.kind === "flag"
      ? t("admin.wallet.depositRecon.action.flag")
      : t("admin.wallet.depositRecon.action.match");
  const dialogVariant: "destructive" | "default" =
    mode?.kind === "flag" ? "destructive" : "default";

  const handleConfirm = (reason: string) => {
    if (!mode) return;
    if (mode.kind === "match") matchDeposit(mode.id, reason);
    else flagDeposit(mode.id, reason);
    setMode(null);
  };

  const columns: AdminColumn<AdminDepositReconRow>[] = [
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
          {t(`admin.wallet.depositRecon.filter.method.${r.method}`)}
        </Badge>
      ),
    },
    {
      id: "amount",
      header: t("admin.wallet.withdraw.col.amount"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.amount.padStart(20, "0"),
      cell: (r) =>
        formatAmountString(r.amount, r.method === "crypto" ? "USDT" : "KRW"),
    },
    {
      id: "status",
      header: t("admin.wallet.withdraw.col.status"),
      cell: (r) => (
        <Badge
          variant={
            r.status === "failed"
              ? "destructive"
              : r.status === "complete"
                ? "secondary"
                : r.status === "pending_review"
                  ? "default"
                  : "outline"
          }
        >
          {t(`admin.wallet.depositRecon.filter.status.${r.status}`)}
        </Badge>
      ),
    },
    {
      id: "reference",
      header: t("admin.wallet.depositRecon.col.reference"),
      cell: (r) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {r.reference ?? "—"}
        </span>
      ),
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
      cell: (r) =>
        r.status === "pending_review" ? (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="default"
              onClick={() => setMode({ kind: "match", id: r.id })}
              data-testid={`match-${r.id}`}
            >
              {t("admin.wallet.depositRecon.action.match")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled
              title={t("admin.wire.disabledNoRpc")}
              onClick={() => setMode({ kind: "flag", id: r.id })}
              data-testid={`flag-${r.id}`}
            >
              {t("admin.wallet.depositRecon.action.flag")}
            </Button>
          </div>
        ) : (
          <Badge
            variant={
              r.status === "failed"
                ? "destructive"
                : r.status === "complete"
                  ? "secondary"
                  : "outline"
            }
          >
            {t(`admin.wallet.depositRecon.filter.status.${r.status}`)}
          </Badge>
        ),
    },
  ];

  return (
    <div className="grid gap-3">
      <AdminQueueSection
        title={t("admin.wallet.depositRecon.title")}
        count={pendingReviewCount}
        subtitle={t("admin.wallet.depositRecon.subtitle")}
        severity={pendingReviewCount > 0 ? "warn" : "default"}
      >
        <AdminFilterBar
          search={depositFilters.search}
          onSearchChange={(v) =>
            setDepositFilters((p) => ({ ...p, search: v }))
          }
          placeholder={t("admin.wallet.depositRecon.filter.search.placeholder")}
          chips={[
            ...STATUSES.map((s) => ({
              label: t(`admin.wallet.depositRecon.filter.status.${s}`),
              value: `status:${s}`,
              active: depositFilters.status.includes(s),
              onToggle: () => toggleChip("status", s),
            })),
            ...METHODS.map((m) => ({
              label: t(`admin.wallet.depositRecon.filter.method.${m}`),
              value: `method:${m}`,
              active: depositFilters.method.includes(m),
              onToggle: () => toggleChip("method", m),
            })),
          ]}
          onReset={
            depositFilters.search ||
            depositFilters.status.length > 0 ||
            depositFilters.method.length > 0
              ? () =>
                  setDepositFilters({ search: "", status: [], method: [] })
              : undefined
          }
        />
        <AdminDataTable<AdminDepositReconRow>
          columns={columns}
          rows={filteredDeposits}
          rowKey={(r) => r.id}
          rowTestId={(r) => `deposit-row-${r.id}`}
          empty={t("admin.wallet.depositRecon.empty")}
          ariaLabel={t("admin.wallet.depositRecon.title")}
        />
      </AdminQueueSection>

      <AdminReasonDialog
        open={mode !== null}
        onOpenChange={(o) => {
          if (!o) setMode(null);
        }}
        title={dialogTitle}
        variant={dialogVariant}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
