import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  useAdminAuditAlerts,
  type AdminAuditFeedRow,
  type AuditDomain,
} from "@/hooks/admin/useAdminAuditAlerts";
import {
  AdminQueueSection,
  AdminDataTable,
  AdminFilterBar,
  AdminDetailDrawer,
  type AdminColumn,
} from "@/components/admin/primitives";
import { Badge } from "@/components/ui/badge";
import { t } from "@/i18n";

// L1-15-I I2 — Admin Audit Hub · merged read-only feed.
// No mutations · MOCK chip · filter + table + drawer (per LOCK).

const PRESETS: Array<{ value: "all" | "1h" | "24h" | "7d"; key: string }> = [
  { value: "all", key: "admin.audit.feed.preset.all" },
  { value: "1h", key: "admin.audit.feed.preset.1h" },
  { value: "24h", key: "admin.audit.feed.preset.24h" },
  { value: "7d", key: "admin.audit.feed.preset.7d" },
];

function formatAt(iso: string): string {
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 16);
  } catch {
    return iso;
  }
}

function DomainBadge(props: { domain: AuditDomain }) {
  return (
    <Badge variant="outline" className="uppercase">
      {t(`admin.audit.domain.${props.domain}`)}
    </Badge>
  );
}

export function AdminAuditHub() {
  const {
    filteredAuditFeed,
    auditFeed,
    auditFilters,
    setAuditFilters,
    refreshAuditFeed,
    auditDomains,
  } = useAdminAuditAlerts();

  const [drawer, setDrawer] = useState<AdminAuditFeedRow | null>(null);

  const totalCount = auditFeed.length;

  const columns: AdminColumn<AdminAuditFeedRow>[] = useMemo(
    () => [
      {
        id: "at",
        header: t("admin.audit.feed.col.at"),
        sortable: true,
        sortValue: (r) => r.at,
        cell: (r) => (
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {formatAt(r.at)}
          </span>
        ),
      },
      {
        id: "domain",
        header: t("admin.audit.feed.col.domain"),
        cell: (r) => <DomainBadge domain={r.domain} />,
      },
      {
        id: "actor",
        header: t("admin.audit.feed.col.actor"),
        cell: (r) => (
          <span className="text-xs text-muted-foreground">
            {t(r.actorKey)}
          </span>
        ),
      },
      {
        id: "action",
        header: t("admin.audit.feed.col.action"),
        cell: (r) => (
          <span className="text-sm font-medium">{t(r.actionKey)}</span>
        ),
      },
      {
        id: "subject",
        header: t("admin.audit.feed.col.subject"),
        cell: (r) => (
          <span className="font-mono text-[11px] text-muted-foreground">
            {r.subject ?? "—"}
          </span>
        ),
      },
      {
        id: "reason",
        header: t("admin.audit.feed.col.reason"),
        cell: (r) => (
          <span className="line-clamp-1 text-xs text-foreground/80">
            {r.reason ?? "—"}
          </span>
        ),
      },
    ],
    [],
  );

  const filterChips = [
    ...auditDomains.map((d) => ({
      label: t(`admin.audit.domain.${d}`),
      value: `domain:${d}`,
      active: auditFilters.domains.includes(d),
      onToggle: () =>
        setAuditFilters((p) => {
          const has = p.domains.includes(d);
          return {
            ...p,
            domains: has
              ? p.domains.filter((x) => x !== d)
              : [...p.domains, d],
          };
        }),
    })),
    ...PRESETS.map((p) => ({
      label: t(p.key),
      value: `preset:${p.value}`,
      active: auditFilters.datePreset === p.value,
      onToggle: () =>
        setAuditFilters((prev) => ({ ...prev, datePreset: p.value })),
    })),
  ];

  return (
    <div className="grid min-w-0 gap-3">
      <AdminQueueSection
        title={t("admin.audit.feed.title")}
        count={totalCount}
        countAriaLabel={t("admin.audit.feed.title")}
        subtitle={t("admin.audit.feed.subtitle")}
        mockChip
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={refreshAuditFeed}
            data-testid="audit-feed-refresh"
            className="gap-1.5"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            {t("admin.audit.feed.refresh")}
          </Button>
        }
      >
        <AdminFilterBar
          search={auditFilters.search}
          onSearchChange={(v) =>
            setAuditFilters((p) => ({ ...p, search: v }))
          }
          placeholder={t("admin.audit.feed.search.placeholder")}
          chips={filterChips}
          onReset={
            auditFilters.search ||
            auditFilters.domains.length > 0 ||
            auditFilters.datePreset !== "all"
              ? () =>
                  setAuditFilters({
                    search: "",
                    domains: [],
                    datePreset: "all",
                  })
              : undefined
          }
          searchTestId="audit-feed-search"
        />

        <AdminDataTable<AdminAuditFeedRow>
          columns={columns}
          rows={filteredAuditFeed}
          rowKey={(r) => r.id}
          rowTestId={(r) => `audit-row-${r.id}`}
          ariaLabel={t("admin.audit.feed.title")}
          onRowClick={(r) => setDrawer(r)}
          empty={t("admin.audit.feed.empty")}
          tableTestId="audit-table"
        />
      </AdminQueueSection>

      <AdminDetailDrawer
        open={drawer !== null}
        onOpenChange={(o) => {
          if (!o) setDrawer(null);
        }}
        title={t("admin.audit.feed.detail.title")}
        description={drawer ? drawer.id : undefined}
      >
        {drawer ? (
          <div className="grid gap-3 text-sm">
            <DetailRow
              label={t("admin.audit.feed.col.at")}
              value={formatAt(drawer.at)}
              mono
            />
            <DetailRow
              label={t("admin.audit.feed.col.domain")}
              value={t(`admin.audit.domain.${drawer.domain}`)}
            />
            <DetailRow
              label={t("admin.audit.feed.col.actor")}
              value={t(drawer.actorKey)}
            />
            <DetailRow
              label={t("admin.audit.feed.col.action")}
              value={t(drawer.actionKey)}
            />
            <DetailRow
              label={t("admin.audit.feed.col.subject")}
              value={drawer.subject ?? "—"}
              mono
            />
            <div className="grid gap-1 border-t border-border pt-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {t("admin.audit.feed.detail.reason")}
              </span>
              <p className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-foreground/90">
                {drawer.reason ?? t("admin.audit.feed.detail.noReason")}
              </p>
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}

function DetailRow(props: { label: string; value: string; mono?: boolean }) {
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
