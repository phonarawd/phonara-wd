import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useAdminUsersDeskMock,
  type AdminUserRow,
  type UserStatus,
  type KycTier,
} from "@/hooks/admin/useAdminUsersDeskMock";
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
import { ADMIN_WIRE_TIER_C_DISABLED, tierCDisabledTitle } from "@/lib/admin-wire-tier-c";

// L1-15-C C2 — Admin Users Desk · 6 elements via P0 primitives.
// SOT: useAdminUsersDeskMock. Balance fields display strings only — no recompute.

const STATUSES: UserStatus[] = ["active", "suspended", "banned"];
const TIERS: KycTier[] = ["tier0", "tier1", "tier2", "tier3"];

type Mode =
  | { kind: "suspend"; id: string }
  | { kind: "ban"; id: string }
  | { kind: "unsuspend"; id: string }
  | { kind: "mfaReset"; id: string }
  | { kind: "sessionKill"; id: string }
  | { kind: "bulkSuspend" }
  | { kind: "bulkBan" }
  | null;

// Stable date formatter (SSR-safe — same string on server + client).
function formatLastSession(iso: string): string {
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 16);
  } catch {
    return iso;
  }
}

function formatKrwString(amount: string): string {
  const neg = amount.startsWith("-");
  const body = neg ? amount.slice(1) : amount;
  return `${neg ? "-" : ""}₩${body.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function balanceSummary(row: AdminUserRow): string {
  return t("admin.users.balance.summary")
    .replace("{cash}", formatKrwString(row.balanceCash))
    .replace("{bonus}", formatKrwString(row.balanceBonus))
    .replace("{locked}", formatKrwString(row.balanceLocked));
}

export function UsersDeskHub() {
  const {
    filteredUsers,
    users,
    filters,
    setFilters,
    audit,
    suspendUser,
    banUser,
    unsuspendUser,
    resetMfa,
    killSession,
  } = useAdminUsersDeskMock();

  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<AdminUserRow | null>(null);

  const activeCount = useMemo(
    () => users.filter((u) => u.status === "active").length,
    [users],
  );

  const usersAudit = useMemo(
    () => audit.filter((e) => e.actionKey.startsWith("admin.users.audit")),
    [audit],
  );

  const toggleChip = <K extends "status" | "kyc">(
    key: K,
    value: (typeof filters)[K][number],
  ) => {
    setFilters((p) => {
      const arr = p[key] as string[];
      const next = arr.includes(value as string)
        ? arr.filter((x) => x !== value)
        : [...arr, value as string];
      return { ...p, [key]: next };
    });
  };

  const dialogTitle =
    mode?.kind === "ban" || mode?.kind === "bulkBan"
      ? t("admin.users.action.ban")
      : mode?.kind === "suspend" || mode?.kind === "bulkSuspend"
        ? t("admin.users.action.suspend")
        : mode?.kind === "unsuspend"
          ? t("admin.users.action.unsuspend")
          : mode?.kind === "mfaReset"
            ? t("admin.users.action.mfaReset")
            : mode?.kind === "sessionKill"
              ? t("admin.users.action.sessionKill")
              : "";

  const dialogVariant: "destructive" | "default" =
    mode?.kind === "ban" ||
    mode?.kind === "bulkBan" ||
    mode?.kind === "sessionKill"
      ? "destructive"
      : "default";

  const handleConfirm = (reason: string) => {
    if (!mode) return;
    if (mode.kind === "suspend") suspendUser(mode.id, reason);
    else if (mode.kind === "ban") banUser(mode.id, reason);
    else if (mode.kind === "unsuspend") unsuspendUser(mode.id, reason);
    else if (mode.kind === "mfaReset") resetMfa(mode.id, reason);
    else if (mode.kind === "sessionKill") killSession(mode.id, reason);
    else if (mode.kind === "bulkSuspend") {
      selected.forEach((id) => suspendUser(id, reason));
      setSelected(new Set());
    } else if (mode.kind === "bulkBan") {
      selected.forEach((id) => banUser(id, reason));
      setSelected(new Set());
    }
    setMode(null);
    if (drawer && (mode.kind === "mfaReset" || mode.kind === "sessionKill")) {
      const next = users.find((u) => u.id === drawer.id);
      if (next) setDrawer(next);
    }
  };

  const columns: AdminColumn<AdminUserRow>[] = [
    {
      id: "email",
      header: t("admin.users.col.email"),
      cell: (r) => (
        <div className="grid">
          <span className="text-sm font-medium">{r.emailMasked}</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {r.id}
          </span>
        </div>
      ),
    },
    {
      id: "name",
      header: t("admin.users.col.name"),
      cell: (r) => <span className="text-sm">{r.displayName}</span>,
    },
    {
      id: "kyc",
      header: t("admin.users.col.kyc"),
      cell: (r) => (
        <Badge variant="secondary" className="uppercase">
          {t(`admin.users.filter.kyc.${r.kycTier}`)}
        </Badge>
      ),
    },
    {
      id: "status",
      header: t("admin.users.col.status"),
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      id: "mfa",
      header: t("admin.users.col.mfa"),
      cell: (r) => (
        <Badge variant={r.mfaEnabled ? "default" : "outline"}>
          {t(r.mfaEnabled ? "admin.users.mfa.enabled" : "admin.users.mfa.disabled")}
        </Badge>
      ),
    },
    {
      id: "session",
      header: t("admin.users.col.session"),
      sortable: true,
      sortValue: (r) => r.lastSessionAt,
      cell: (r) => (
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {formatLastSession(r.lastSessionAt)}
        </span>
      ),
    },
    {
      id: "balance",
      header: t("admin.users.col.balance"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.balanceCash.padStart(20, "0"),
      cell: (r) => (
        <span className="text-xs tabular-nums">{balanceSummary(r)}</span>
      ),
    },
    {
      id: "action",
      header: t("admin.users.col.action"),
      align: "right",
      cell: (r) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {r.status === "active" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => setMode({ kind: "suspend", id: r.id })}
                data-testid={`suspend-${r.id}`}
              >
                {t("admin.users.action.suspend")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => setMode({ kind: "ban", id: r.id })}
                data-testid={`ban-${r.id}`}
              >
                {t("admin.users.action.ban")}
              </Button>
            </>
          ) : r.status === "suspended" ? (
            <>
              <Button
                size="sm"
                variant="default"
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => setMode({ kind: "unsuspend", id: r.id })}
                data-testid={`unsuspend-${r.id}`}
              >
                {t("admin.users.action.unsuspend")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => setMode({ kind: "ban", id: r.id })}
                data-testid={`ban-${r.id}`}
              >
                {t("admin.users.action.ban")}
              </Button>
            </>
          ) : (
            <StatusBadge status={r.status} />
          )}
        </div>
      ),
    },
  ];

  const activeSelected = new Set(
    Array.from(selected).filter((id) =>
      users.find((u) => u.id === id && u.status === "active"),
    ),
  );

  return (
    <div className="grid min-w-0 gap-3">
      <AdminQueueSection
        title={t("admin.users.queue.title")}
        count={activeCount}
        countAriaLabel={t("admin.users.queue.title")}
        severity="default"
        subtitle={t("admin.users.queue.subtitle")}
        mockChip
      >
        <AdminFilterBar
          search={filters.search}
          onSearchChange={(v) => setFilters((p) => ({ ...p, search: v }))}
          placeholder={t("admin.users.search.placeholder")}
          chips={[
            ...STATUSES.map((s) => ({
              label: t(`admin.users.filter.status.${s}`),
              value: `status:${s}`,
              active: filters.status.includes(s),
              onToggle: () => toggleChip("status", s),
            })),
            ...TIERS.map((k) => ({
              label: t(`admin.users.filter.kyc.${k}`),
              value: `kyc:${k}`,
              active: filters.kyc.includes(k),
              onToggle: () => toggleChip("kyc", k),
            })),
          ]}
          onReset={
            filters.search ||
            filters.status.length > 0 ||
            filters.kyc.length > 0
              ? () => setFilters({ search: "", status: [], kyc: [] })
              : undefined
          }
        />

        <AdminDataTable<AdminUserRow>
          columns={columns}
          rows={filteredUsers}
          rowKey={(r) => r.id}
          rowTestId={(r) => `users-row-${r.id}`}
          ariaLabel={t("admin.users.queue.title")}
          onRowClick={(r) => setDrawer(r)}
          empty={t("admin.users.empty.title")}
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
                variant="outline"
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => setMode({ kind: "bulkSuspend" })}
                data-testid="users-bulk-suspend"
              >
                {t("admin.users.bulk.suspend")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => setMode({ kind: "bulkBan" })}
                data-testid="users-bulk-ban"
              >
                {t("admin.users.bulk.ban")}
              </Button>
            </div>
          </div>
        ) : null}
      </AdminQueueSection>

      <div className="grid gap-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("admin.users.audit.title")}
        </h3>
        <AdminAuditTrail
          events={usersAudit}
          emptyLabel={t("admin.users.audit.empty")}
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
        title={t("admin.users.detail.title")}
        description={drawer ? drawer.id : undefined}
      >
        {drawer ? (
          <div className="grid gap-3 text-sm">
            <Row label={t("admin.users.col.email")} value={drawer.emailMasked} />
            <Row label={t("admin.users.col.name")} value={drawer.displayName} />
            <Row
              label={t("admin.users.col.kyc")}
              value={t(`admin.users.filter.kyc.${drawer.kycTier}`)}
            />
            <Row
              label={t("admin.users.col.status")}
              value={t(`admin.users.filter.status.${drawer.status}`)}
            />
            <Row
              label={t("admin.users.col.mfa")}
              value={t(
                drawer.mfaEnabled
                  ? "admin.users.mfa.enabled"
                  : "admin.users.mfa.disabled",
              )}
            />
            <Row
              label={t("admin.users.detail.balance.cash")}
              value={formatKrwString(drawer.balanceCash)}
            />
            <Row
              label={t("admin.users.detail.balance.bonus")}
              value={formatKrwString(drawer.balanceBonus)}
            />
            <Row
              label={t("admin.users.detail.balance.locked")}
              value={formatKrwString(drawer.balanceLocked)}
            />
            <Row
              label={t("admin.users.detail.sessions")}
              value={String(drawer.activeSessions)}
              mono
            />
            <Row
              label={t("admin.users.col.session")}
              value={formatLastSession(drawer.lastSessionAt)}
              mono
            />
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => setMode({ kind: "mfaReset", id: drawer.id })}
                data-testid={`drawer-mfa-reset-${drawer.id}`}
              >
                {t("admin.users.action.mfaReset")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={drawer.activeSessions === 0 || ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => setMode({ kind: "sessionKill", id: drawer.id })}
                data-testid={`drawer-session-kill-${drawer.id}`}
              >
                {t("admin.users.action.sessionKill")}
              </Button>
            </div>
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

function StatusBadge(props: { status: UserStatus }) {
  const variant =
    props.status === "banned"
      ? "destructive"
      : props.status === "suspended"
        ? "outline"
        : "default";
  return (
    <Badge variant={variant as "default" | "destructive" | "outline"}>
      {t(`admin.users.filter.status.${props.status}`)}
    </Badge>
  );
}
