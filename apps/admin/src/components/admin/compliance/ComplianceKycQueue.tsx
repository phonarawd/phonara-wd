import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/admin-time";
import {
  useAdminCompliance,
  isKycOverdue,
  type AdminKycRow,
  type KycStatus,
  type KycTier,
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

// L1-15-D D2 — KYC review queue · 6 elements via P0 primitives.

const STATUSES: KycStatus[] = ["pending", "in_review", "approved", "rejected"];
const TIERS: KycTier[] = ["tier1", "tier2", "tier3"];

type Mode =
  | { kind: "approve"; id: string }
  | { kind: "reject"; id: string }
  | { kind: "bulkApprove" }
  | { kind: "bulkReject" }
  | null;

export function ComplianceKycQueue() {
  const {
    filteredKyc,
    kyc,
    kycFilters,
    setKycFilters,
    audit,
    approveKyc,
    rejectKyc,
  } = useAdminCompliance();

  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<AdminKycRow | null>(null);

  const pendingCount = useMemo(
    () =>
      kyc.filter((r) => r.status === "pending" || r.status === "in_review")
        .length,
    [kyc],
  );

  const kycAudit = useMemo(
    () =>
      audit.filter((e) => e.actionKey.startsWith("admin.compliance.kyc.audit")),
    [audit],
  );

  const toggleChip = <K extends "status" | "tier">(
    key: K,
    value: (typeof kycFilters)[K][number],
  ) => {
    setKycFilters((p) => {
      const arr = p[key] as string[];
      const next = arr.includes(value as string)
        ? arr.filter((x) => x !== value)
        : [...arr, value as string];
      return { ...p, [key]: next };
    });
  };

  const dialogTitle =
    mode?.kind === "reject" || mode?.kind === "bulkReject"
      ? t("admin.compliance.kyc.action.reject")
      : t("admin.compliance.kyc.action.approve");

  const dialogVariant: "destructive" | "default" =
    mode?.kind === "reject" || mode?.kind === "bulkReject"
      ? "destructive"
      : "default";

  const handleConfirm = async (reason: string) => {
    if (!mode) return;
    let ok = false;
    if (mode.kind === "approve") ok = await approveKyc(mode.id, reason);
    else if (mode.kind === "reject") ok = await rejectKyc(mode.id, reason);
    else if (mode.kind === "bulkApprove") {
      for (const id of selected) {
        await approveKyc(id, reason);
      }
      setSelected(new Set());
      ok = true;
    } else if (mode.kind === "bulkReject") {
      for (const id of selected) {
        await rejectKyc(id, reason);
      }
      setSelected(new Set());
      ok = true;
    }
    if (ok) setMode(null);
  };

  const columns: AdminColumn<AdminKycRow>[] = [
    {
      id: "user",
      header: t("admin.compliance.kyc.col.user"),
      cell: (r) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {r.userId}
        </span>
      ),
    },
    {
      id: "tier",
      header: t("admin.compliance.kyc.col.tier"),
      cell: (r) => (
        <Badge variant="secondary" className="uppercase">
          {t(`admin.compliance.kyc.filter.tier.${r.tier}`)}
        </Badge>
      ),
    },
    {
      id: "status",
      header: t("admin.compliance.kyc.col.status"),
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      id: "submitted",
      header: t("admin.compliance.kyc.col.submitted"),
      sortable: true,
      sortValue: (r) => r.submittedAt,
      cell: (r) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {relativeTime(r.submittedAt)}
        </span>
      ),
    },
    {
      id: "sla",
      header: t("admin.compliance.kyc.col.sla"),
      sortable: true,
      sortValue: (r) => r.slaDueAt,
      cell: (r) => {
        const overdue =
          (r.status === "pending" || r.status === "in_review") &&
          isKycOverdue(r.slaDueAt);
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-xs tabular-nums text-muted-foreground">
              {relativeTime(r.slaDueAt)}
            </span>
            {overdue ? (
              <Badge variant="destructive" className="text-[10px]">
                {t("admin.compliance.sla.overdue")}
              </Badge>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "doc",
      header: t("admin.compliance.kyc.col.document"),
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.documentSummary}
        </span>
      ),
    },
    {
      id: "action",
      header: t("admin.compliance.kyc.col.action"),
      align: "right",
      cell: (r) =>
        r.status === "pending" || r.status === "in_review" ? (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="default"
              onClick={() => setMode({ kind: "approve", id: r.id })}
              data-testid={`queue-kyc-approve-${r.id}`}
            >
              {t("admin.compliance.kyc.action.approve")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMode({ kind: "reject", id: r.id })}
              data-testid={`queue-kyc-reject-${r.id}`}
            >
              {t("admin.compliance.kyc.action.reject")}
            </Button>
          </div>
        ) : (
          <StatusBadge status={r.status} />
        ),
    },
  ];

  const pendingSelected = new Set(
    Array.from(selected).filter((id) =>
      kyc.find(
        (x) =>
          x.id === id && (x.status === "pending" || x.status === "in_review"),
      ),
    ),
  );

  return (
    <div className="grid min-w-0 gap-3">
      <AdminQueueSection
        title={t("admin.compliance.kyc.title")}
        count={pendingCount}
        countAriaLabel={t("admin.compliance.kyc.title")}
        severity="crit"
        subtitle={t("admin.compliance.kyc.subtitle")}
      >
        <AdminFilterBar
          search={kycFilters.search}
          onSearchChange={(v) => setKycFilters((p) => ({ ...p, search: v }))}
          placeholder={t("admin.compliance.kyc.filter.search.placeholder")}
          chips={[
            ...STATUSES.map((s) => ({
              label: t(`admin.compliance.kyc.filter.status.${s}`),
              value: `status:${s}`,
              active: kycFilters.status.includes(s),
              onToggle: () => toggleChip("status", s),
            })),
            ...TIERS.map((tier) => ({
              label: t(`admin.compliance.kyc.filter.tier.${tier}`),
              value: `tier:${tier}`,
              active: kycFilters.tier.includes(tier),
              onToggle: () => toggleChip("tier", tier),
            })),
          ]}
          onReset={
            kycFilters.search ||
            kycFilters.status.length > 0 ||
            kycFilters.tier.length > 0
              ? () => setKycFilters({ search: "", status: [], tier: [] })
              : undefined
          }
        />

        <AdminDataTable<AdminKycRow>
          columns={columns}
          rows={filteredKyc}
          rowKey={(r) => r.id}
          rowTestId={(r) => `kyc-row-${r.id}`}
          ariaLabel={t("admin.compliance.kyc.title")}
          onRowClick={(r) => setDrawer(r)}
          empty={t("admin.compliance.kyc.empty")}
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
                data-testid="kyc-bulk-reject"
              >
                {t("admin.compliance.kyc.bulk.reject")}
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => setMode({ kind: "bulkApprove" })}
                data-testid="kyc-bulk-approve"
              >
                {t("admin.compliance.kyc.bulk.approve")}
              </Button>
            </div>
          </div>
        ) : null}
      </AdminQueueSection>

      <div className="grid gap-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("admin.compliance.kyc.audit.title")}
        </h3>
        <AdminAuditTrail
          events={kycAudit}
          emptyLabel={t("admin.compliance.kyc.audit.empty")}
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
        title={t("admin.compliance.detail.title")}
        description={drawer ? drawer.id : undefined}
      >
        {drawer ? (
          <div className="grid gap-3 text-sm">
            <Row label={t("admin.compliance.kyc.col.user")} value={drawer.userId} mono />
            <Row
              label={t("admin.compliance.kyc.col.tier")}
              value={t(`admin.compliance.kyc.filter.tier.${drawer.tier}`)}
            />
            <Row
              label={t("admin.compliance.kyc.col.status")}
              value={t(`admin.compliance.kyc.filter.status.${drawer.status}`)}
            />
            <Row
              label={t("admin.compliance.kyc.col.document")}
              value={drawer.documentSummary}
            />
            {drawer.riskScore ? (
              <Row
                label={t("admin.compliance.kyc.col.riskScore")}
                value={drawer.riskScore}
              />
            ) : null}
            <Row
              label={t("admin.compliance.kyc.col.submitted")}
              value={relativeTime(drawer.submittedAt)}
            />
            <Row
              label={t("admin.compliance.kyc.col.sla")}
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

function StatusBadge(props: { status: KycStatus }) {
  const variant =
    props.status === "rejected"
      ? "destructive"
      : props.status === "approved"
        ? "secondary"
        : props.status === "in_review"
          ? "default"
          : "outline";
  return (
    <Badge variant={variant as "default" | "secondary" | "destructive" | "outline"}>
      {t(`admin.compliance.kyc.filter.status.${props.status}`)}
    </Badge>
  );
}
