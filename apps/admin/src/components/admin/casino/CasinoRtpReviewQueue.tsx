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
  AdminRtpReviewRow,
  RtpReviewStatus,
  RtpSeverity,
  UseAdminCasinoDesk,
} from "@/hooks/admin/useAdminCasinoDeskMock";

// L1-15-E E-B · Casino RTP Review queue.
// 6요소: metrics · filter · table · ack/resolve · audit (hub) · bulk.

const SEVERITY_FILTERS: Array<RtpSeverity | "all"> = [
  "all",
  "warning",
  "critical",
];
const STATUS_FILTERS: Array<RtpReviewStatus | "all"> = [
  "all",
  "open",
  "acknowledged",
  "resolved",
];

function SeverityBadge(props: { severity: RtpSeverity }) {
  return (
    <Badge
      variant={props.severity === "critical" ? "destructive" : "default"}
      className="uppercase"
    >
      {t(`admin.casino.rtp.severity.${props.severity}`)}
    </Badge>
  );
}

function StatusBadge(props: { status: RtpReviewStatus }) {
  const variant =
    props.status === "open"
      ? "destructive"
      : props.status === "acknowledged"
        ? "default"
        : "outline";
  return (
    <Badge
      variant={variant as "default" | "destructive" | "outline"}
      className="uppercase"
    >
      {t(`admin.casino.rtp.status.${props.status}`)}
    </Badge>
  );
}

type Dialog =
  | { kind: "row"; id: string }
  | { kind: "bulk" }
  | null;

export interface CasinoRtpReviewQueueProps {
  desk: UseAdminCasinoDesk;
}

export function CasinoRtpReviewQueue({ desk }: CasinoRtpReviewQueueProps) {
  const {
    rtpReviews,
    filteredRtpReviews,
    rtpFilters,
    setRtpFilters,
    ackRtpReview,
    resolveRtpReview,
    bulkAckRtpReview,
    bulkResolveRtpReview,
  } = desk;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<Dialog>(null);

  const openCount = useMemo(
    () => rtpReviews.filter((r) => r.status === "open").length,
    [rtpReviews],
  );
  const criticalCount = useMemo(
    () =>
      rtpReviews.filter(
        (r) => r.severity === "critical" && r.status !== "resolved",
      ).length,
    [rtpReviews],
  );
  const resolvedCount = useMemo(
    () => rtpReviews.filter((r) => r.status === "resolved").length,
    [rtpReviews],
  );

  const columns: AdminColumn<AdminRtpReviewRow>[] = [
    {
      id: "severity",
      header: t("admin.casino.rtp.col.severity"),
      cell: (r) => <SeverityBadge severity={r.severity} />,
    },
    {
      id: "status",
      header: t("admin.casino.rtp.col.status"),
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      id: "label",
      header: t("admin.casino.rtp.col.game"),
      cell: (r) => (
        <div className="grid">
          <span className="text-sm font-medium">{t(r.labelKey)}</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {r.gameKey}
          </span>
        </div>
      ),
    },
    {
      id: "theo",
      header: t("admin.casino.rtp.col.theoretical"),
      align: "right",
      cell: (r) => (
        <span className="font-mono text-xs tabular-nums">
          {r.theoreticalRtp}%
        </span>
      ),
    },
    {
      id: "obs",
      header: t("admin.casino.rtp.col.observed"),
      align: "right",
      cell: (r) => (
        <span className="font-mono text-xs tabular-nums">
          {r.observedRtp}%
        </span>
      ),
    },
    {
      id: "drift",
      header: t("admin.casino.rtp.col.drift"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.driftPct,
      cell: (r) => (
        <span
          className={
            "font-mono text-xs tabular-nums " +
            (r.severity === "critical" ? "text-(--color-destructive)" : "")
          }
        >
          {r.driftPct}%
        </span>
      ),
    },
    {
      id: "sample",
      header: t("admin.casino.rtp.col.sample"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.sampleSize,
      cell: (r) => (
        <span className="font-mono text-xs tabular-nums">{r.sampleSize}</span>
      ),
    },
    {
      id: "action",
      header: t("admin.casino.rtp.col.action"),
      align: "right",
      cell: (r) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {r.status === "open" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() => ackRtpReview(r.id)}
              data-testid={`rtp-ack-${r.id}`}
            >
              {t("admin.casino.rtp.action.ack")}
            </Button>
          ) : null}
          {r.status !== "resolved" ? (
            <Button
              size="sm"
              variant="default"
              disabled={ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() => setDialog({ kind: "row", id: r.id })}
              data-testid={`rtp-resolve-${r.id}`}
            >
              {t("admin.casino.rtp.action.resolve")}
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const handleConfirm = (reason: string) => {
    if (!dialog) return;
    if (dialog.kind === "row") {
      resolveRtpReview(dialog.id, reason);
    } else {
      bulkResolveRtpReview(Array.from(selected), reason);
      setSelected(new Set());
    }
    setDialog(null);
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <AdminMetricCard
          label={t("admin.casino.rtp.metric.open")}
          value={String(openCount)}
          tone={openCount > 0 ? "warn" : "default"}
          testId="rtp-metric-open"
        />
        <AdminMetricCard
          label={t("admin.casino.rtp.metric.critical")}
          value={String(criticalCount)}
          tone={criticalCount > 0 ? "crit" : "default"}
          testId="rtp-metric-critical"
        />
        <AdminMetricCard
          label={t("admin.casino.rtp.metric.resolved")}
          value={String(resolvedCount)}
          tone="default"
          testId="rtp-metric-resolved"
        />
      </div>

      <AdminQueueSection
        title={t("admin.casino.rtp.section.title")}
        count={filteredRtpReviews.length}
        countAriaLabel={t("admin.casino.rtp.section.title")}
        subtitle={t("admin.casino.rtp.section.subtitle")}
      >
        <AdminFilterBar
          search={rtpFilters.search}
          onSearchChange={(v) => setRtpFilters((p) => ({ ...p, search: v }))}
          placeholder={t("admin.casino.rtp.search.placeholder")}
          chips={[
            ...SEVERITY_FILTERS.map((s) => ({
              label: t(
                s === "all"
                  ? "admin.casino.rtp.severity.all"
                  : `admin.casino.rtp.severity.${s}`,
              ),
              value: `rsev:${s}`,
              active: rtpFilters.severity === s,
              onToggle: () => setRtpFilters((p) => ({ ...p, severity: s })),
            })),
            ...STATUS_FILTERS.map((s) => ({
              label: t(
                s === "all"
                  ? "admin.casino.rtp.status.all"
                  : `admin.casino.rtp.status.${s}`,
              ),
              value: `rstatus:${s}`,
              active: rtpFilters.status === s,
              onToggle: () => setRtpFilters((p) => ({ ...p, status: s })),
            })),
          ]}
          onReset={
            rtpFilters.search ||
            rtpFilters.severity !== "all" ||
            rtpFilters.status !== "all"
              ? () =>
                  setRtpFilters({
                    search: "",
                    severity: "all",
                    status: "all",
                  })
              : undefined
          }
          searchTestId="rtp-search"
        />
        <AdminDataTable<AdminRtpReviewRow>
          columns={columns}
          rows={filteredRtpReviews}
          rowKey={(r) => r.id}
          rowTestId={(r) => `rtp-row-${r.id}`}
          ariaLabel={t("admin.casino.rtp.section.title")}
          empty={t("admin.casino.rtp.empty")}
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
            data-testid="rtp-bulk-bar"
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
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => {
                  bulkAckRtpReview(Array.from(selected));
                  setSelected(new Set());
                }}
                data-testid="rtp-bulk-ack"
              >
                {t("admin.casino.rtp.bulk.ack")}
              </Button>
              <Button
                size="sm"
                variant="default"
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => setDialog({ kind: "bulk" })}
                data-testid="rtp-bulk-resolve"
              >
                {t("admin.casino.rtp.bulk.resolve")}
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
        title={t("admin.casino.rtp.dialog.resolve.title")}
        variant="default"
        onConfirm={handleConfirm}
        reasonInputTestId="rtp-reason-input"
        confirmTestId="rtp-reason-confirm"
      />
    </div>
  );
}
