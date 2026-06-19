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
  AdminEarnAgentRow,
  AgentStatus,
  AgentTier,
  UseAdminEarnDesk,
} from "@/hooks/admin/useAdminEarnDeskMock";

// L1-15-F F-A · Earn Agents queue.
// 6요소: metrics · filter · table · row actions · audit (in hub) · bulk.

const TIER_FILTERS: Array<AgentTier | "all"> = [
  "all",
  "bronze",
  "silver",
  "gold",
  "platinum",
];
const STATUS_FILTERS: Array<AgentStatus | "all"> = [
  "all",
  "pending",
  "active",
  "suspended",
];
const TIER_CYCLE: AgentTier[] = ["bronze", "silver", "gold", "platinum"];

function TierBadge(props: { tier: AgentTier }) {
  const variant: "default" | "outline" | "secondary" =
    props.tier === "platinum" || props.tier === "gold"
      ? "default"
      : props.tier === "silver"
        ? "secondary"
        : "outline";
  return (
    <Badge variant={variant} className="uppercase">
      {t(`admin.earn.agents.tier.${props.tier}`)}
    </Badge>
  );
}

function StatusBadge(props: { status: AgentStatus }) {
  const variant: "default" | "destructive" | "outline" =
    props.status === "suspended"
      ? "destructive"
      : props.status === "pending"
        ? "outline"
        : "default";
  return (
    <Badge variant={variant} className="uppercase">
      {t(`admin.earn.agents.status.${props.status}`)}
    </Badge>
  );
}

type Dialog =
  | { kind: "row-suspend"; id: string }
  | { kind: "row-tier"; id: string; next: AgentTier }
  | { kind: "bulk-suspend" }
  | null;

export interface EarnAgentsQueueProps {
  desk: UseAdminEarnDesk;
}

export function EarnAgentsQueue({ desk }: EarnAgentsQueueProps) {
  const {
    agents,
    filteredAgents,
    agentFilters,
    setAgentFilters,
    approveAgent,
    suspendAgent,
    setAgentTier,
    bulkApproveAgents,
    bulkSuspendAgents,
  } = desk;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<Dialog>(null);

  const activeCount = useMemo(
    () => agents.filter((a) => a.status === "active").length,
    [agents],
  );
  const pendingCount = useMemo(
    () => agents.filter((a) => a.status === "pending").length,
    [agents],
  );
  const suspendedCount = useMemo(
    () => agents.filter((a) => a.status === "suspended").length,
    [agents],
  );
  const depth2Count = useMemo(
    () => agents.filter((a) => a.treeDepth === "2").length,
    [agents],
  );

  const nextTierOf = (t: AgentTier): AgentTier => {
    const i = TIER_CYCLE.indexOf(t);
    return TIER_CYCLE[(i + 1) % TIER_CYCLE.length]!;
  };

  const columns: AdminColumn<AdminEarnAgentRow>[] = [
    {
      id: "status",
      header: t("admin.earn.agents.col.status"),
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      id: "agent",
      header: t("admin.earn.agents.col.agent"),
      cell: (r) => (
        <div className="grid">
          <span className="text-sm font-medium">{r.displayName}</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {r.agentCode}
          </span>
        </div>
      ),
    },
    {
      id: "tier",
      header: t("admin.earn.agents.col.tier"),
      cell: (r) => <TierBadge tier={r.tier} />,
    },
    {
      id: "depth",
      header: t("admin.earn.agents.col.depth"),
      align: "right",
      cell: (r) => (
        <Badge variant="secondary" className="font-mono tabular-nums">
          {r.treeDepth}
        </Badge>
      ),
    },
    {
      id: "referrals",
      header: t("admin.earn.agents.col.referrals"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.referralCount,
      cell: (r) => (
        <span className="font-mono text-xs tabular-nums">
          {r.referralCount}
        </span>
      ),
    },
    {
      id: "pending",
      header: t("admin.earn.agents.col.pendingPayout"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.pendingPayout,
      cell: (r) => (
        <span className="font-mono text-xs tabular-nums">
          {r.pendingPayout}
        </span>
      ),
    },
    {
      id: "joinedAt",
      header: t("admin.earn.agents.col.joinedAt"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.joinedAt,
      cell: (r) => (
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {r.joinedAt.slice(0, 10)}
        </span>
      ),
    },
    {
      id: "action",
      header: t("admin.earn.agents.col.action"),
      align: "right",
      cell: (r) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {r.status === "pending" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() => approveAgent(r.id)}
              data-testid={`agent-approve-${r.id}`}
            >
              {t("admin.earn.agents.action.approve")}
            </Button>
          ) : null}
          {r.status !== "suspended" ? (
            <Button
              size="sm"
              variant="destructive"
              disabled={ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() => setDialog({ kind: "row-suspend", id: r.id })}
              data-testid={`agent-suspend-${r.id}`}
            >
              {t("admin.earn.agents.action.suspend")}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            disabled={ADMIN_WIRE_TIER_C_DISABLED}
            title={tierCDisabledTitle(t)}
            onClick={() =>
              setDialog({
                kind: "row-tier",
                id: r.id,
                next: nextTierOf(r.tier),
              })
            }
            data-testid={`agent-tier-${r.id}`}
          >
            {t("admin.earn.agents.action.tier")}
          </Button>
        </div>
      ),
    },
  ];

  const dialogTitle = useMemo(() => {
    if (!dialog) return "";
    if (dialog.kind === "row-suspend" || dialog.kind === "bulk-suspend")
      return t("admin.earn.agents.dialog.suspend.title");
    return t("admin.earn.agents.dialog.tier.title");
  }, [dialog]);

  const handleConfirm = (reason: string) => {
    if (!dialog) return;
    if (dialog.kind === "row-suspend") {
      suspendAgent(dialog.id, reason);
    } else if (dialog.kind === "row-tier") {
      setAgentTier(dialog.id, dialog.next, reason);
    } else if (dialog.kind === "bulk-suspend") {
      bulkSuspendAgents(Array.from(selected), reason);
      setSelected(new Set());
    }
    setDialog(null);
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          label={t("admin.earn.agents.metric.active")}
          value={String(activeCount)}
          tone="primary"
          testId="agents-metric-active"
        />
        <AdminMetricCard
          label={t("admin.earn.agents.metric.pending")}
          value={String(pendingCount)}
          tone={pendingCount > 0 ? "warn" : "default"}
          testId="agents-metric-pending"
        />
        <AdminMetricCard
          label={t("admin.earn.agents.metric.suspended")}
          value={String(suspendedCount)}
          tone={suspendedCount > 0 ? "crit" : "default"}
          testId="agents-metric-suspended"
        />
        <AdminMetricCard
          label={t("admin.earn.agents.metric.depth2")}
          value={String(depth2Count)}
          tone="default"
          testId="agents-metric-depth2"
        />
      </div>

      <AdminQueueSection
        title={t("admin.earn.agents.section.title")}
        count={filteredAgents.length}
        countAriaLabel={t("admin.earn.agents.section.title")}
        subtitle={t("admin.earn.agents.section.subtitle")}
      >
        <AdminFilterBar
          search={agentFilters.search}
          onSearchChange={(v) =>
            setAgentFilters((p) => ({ ...p, search: v }))
          }
          placeholder={t("admin.earn.agents.search.placeholder")}
          chips={[
            ...TIER_FILTERS.map((c) => ({
              label: t(
                c === "all"
                  ? "admin.earn.agents.tier.all"
                  : `admin.earn.agents.tier.${c}`,
              ),
              value: `atier:${c}`,
              active: agentFilters.tier === c,
              onToggle: () => setAgentFilters((p) => ({ ...p, tier: c })),
            })),
            ...STATUS_FILTERS.map((s) => ({
              label: t(
                s === "all"
                  ? "admin.earn.agents.status.all"
                  : `admin.earn.agents.status.${s}`,
              ),
              value: `astatus:${s}`,
              active: agentFilters.status === s,
              onToggle: () => setAgentFilters((p) => ({ ...p, status: s })),
            })),
          ]}
          onReset={
            agentFilters.search ||
            agentFilters.tier !== "all" ||
            agentFilters.status !== "all"
              ? () =>
                  setAgentFilters({
                    search: "",
                    tier: "all",
                    status: "all",
                  })
              : undefined
          }
          searchTestId="agents-search"
        />
        <AdminDataTable<AdminEarnAgentRow>
          columns={columns}
          rows={filteredAgents}
          rowKey={(r) => r.id}
          rowTestId={(r) => `agents-row-${r.id}`}
          ariaLabel={t("admin.earn.agents.section.title")}
          empty={t("admin.earn.agents.empty")}
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
            data-testid="agents-bulk-bar"
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
                  bulkApproveAgents(Array.from(selected));
                  setSelected(new Set());
                }}
                data-testid="agents-bulk-approve"
              >
                {t("admin.earn.agents.bulk.approve")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => setDialog({ kind: "bulk-suspend" })}
                data-testid="agents-bulk-suspend"
              >
                {t("admin.earn.agents.bulk.suspend")}
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
        variant={
          dialog &&
          (dialog.kind === "row-suspend" || dialog.kind === "bulk-suspend")
            ? "destructive"
            : "default"
        }
        onConfirm={handleConfirm}
        reasonInputTestId="agents-reason-input"
        confirmTestId="agents-reason-confirm"
      />
    </div>
  );
}
