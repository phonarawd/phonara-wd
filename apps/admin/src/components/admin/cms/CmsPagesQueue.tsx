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
  AdminCmsPageRow,
  PageLocale,
  PageStatus,
  UseAdminCmsDesk,
} from "@/hooks/admin/useAdminCmsDeskMock";

// L1-15-G G-A · CMS Pages queue.
// Six elements: metrics · filter · table · row actions · audit (hub) · bulk.

const LOCALE_FILTERS: Array<PageLocale | "all"> = ["all", "ko", "en"];
const STATUS_FILTERS: Array<PageStatus | "all"> = [
  "all",
  "draft",
  "published",
  "archived",
];

function StatusBadge(props: { status: PageStatus }) {
  const variant: "default" | "outline" | "secondary" =
    props.status === "published"
      ? "default"
      : props.status === "draft"
        ? "outline"
        : "secondary";
  return (
    <Badge variant={variant} className="uppercase">
      {t(`admin.cms.pages.status.${props.status}`)}
    </Badge>
  );
}

type Dialog =
  | { kind: "row-archive"; id: string }
  | { kind: "row-restore"; id: string }
  | { kind: "bulk-archive" }
  | null;

export interface CmsPagesQueueProps {
  desk: UseAdminCmsDesk;
}

export function CmsPagesQueue({ desk }: CmsPagesQueueProps) {
  const {
    pages,
    filteredPages,
    pageFilters,
    setPageFilters,
    publishPage,
    archivePage,
    restorePageDraft,
    bulkPublishPages,
    bulkArchivePages,
  } = desk;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<Dialog>(null);

  const publishedCount = useMemo(
    () => pages.filter((p) => p.status === "published").length,
    [pages],
  );
  const draftCount = useMemo(
    () => pages.filter((p) => p.status === "draft").length,
    [pages],
  );
  const archivedCount = useMemo(
    () => pages.filter((p) => p.status === "archived").length,
    [pages],
  );
  const localesCount = useMemo(
    () => new Set(pages.map((p) => p.locale)).size,
    [pages],
  );

  const safeArchive = (id: string, reason: string) => {
    try {
      archivePage(id, reason);
    } catch {
      // reason<4 thrown — dialog stays open by gate; primitive guards length.
    }
  };
  const safeRestore = (id: string, reason: string) => {
    try {
      restorePageDraft(id, reason);
    } catch {
      /* noop */
    }
  };
  const safeBulkArchive = (ids: string[], reason: string) => {
    try {
      bulkArchivePages(ids, reason);
    } catch {
      /* noop */
    }
  };

  const columns: AdminColumn<AdminCmsPageRow>[] = [
    {
      id: "status",
      header: t("admin.cms.pages.col.status"),
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      id: "page",
      header: t("admin.cms.pages.col.page"),
      cell: (r) => (
        <div className="grid">
          <span className="font-mono text-xs">{r.pageKey}</span>
          <span className="text-[10px] text-muted-foreground">
            {r.titleKey}
          </span>
        </div>
      ),
    },
    {
      id: "locale",
      header: t("admin.cms.pages.col.locale"),
      cell: (r) => (
        <Badge variant="outline" className="font-mono uppercase">
          {r.locale}
        </Badge>
      ),
    },
    {
      id: "updatedAt",
      header: t("admin.cms.pages.col.updatedAt"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.updatedAt,
      cell: (r) => (
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {r.updatedAt.slice(0, 10)}
        </span>
      ),
    },
    {
      id: "updatedBy",
      header: t("admin.cms.pages.col.updatedBy"),
      align: "right",
      cell: (r) => (
        <span className="text-[11px] text-muted-foreground">
          {t(r.updatedByKey)}
        </span>
      ),
    },
    {
      id: "action",
      header: t("admin.cms.pages.col.action"),
      align: "right",
      cell: (r) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {r.status === "draft" ? (
            <Button
              size="sm"
              variant="default"
              disabled={ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() => publishPage(r.id)}
              data-testid={`page-publish-${r.id}`}
            >
              {t("admin.cms.pages.action.publish")}
            </Button>
          ) : null}
          {r.status === "archived" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() => setDialog({ kind: "row-restore", id: r.id })}
              data-testid={`page-restore-${r.id}`}
            >
              {t("admin.cms.pages.action.restore")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              disabled={ADMIN_WIRE_TIER_C_DISABLED}
              title={tierCDisabledTitle(t)}
              onClick={() => setDialog({ kind: "row-archive", id: r.id })}
              data-testid={`page-archive-${r.id}`}
            >
              {t("admin.cms.pages.action.archive")}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const dialogTitle = useMemo(() => {
    if (!dialog) return "";
    if (dialog.kind === "row-restore")
      return t("admin.cms.pages.dialog.restore.title");
    return t("admin.cms.pages.dialog.archive.title");
  }, [dialog]);

  const handleConfirm = (reason: string) => {
    if (!dialog) return;
    if (dialog.kind === "row-archive") {
      safeArchive(dialog.id, reason);
    } else if (dialog.kind === "row-restore") {
      safeRestore(dialog.id, reason);
    } else if (dialog.kind === "bulk-archive") {
      safeBulkArchive(Array.from(selected), reason);
      setSelected(new Set());
    }
    setDialog(null);
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          label={t("admin.cms.pages.metric.published")}
          value={String(publishedCount)}
          tone="primary"
          testId="pages-metric-published"
        />
        <AdminMetricCard
          label={t("admin.cms.pages.metric.draft")}
          value={String(draftCount)}
          tone={draftCount > 0 ? "warn" : "default"}
          testId="pages-metric-draft"
        />
        <AdminMetricCard
          label={t("admin.cms.pages.metric.archived")}
          value={String(archivedCount)}
          tone="default"
          testId="pages-metric-archived"
        />
        <AdminMetricCard
          label={t("admin.cms.pages.metric.locales")}
          value={String(localesCount)}
          tone="default"
          testId="pages-metric-locales"
        />
      </div>

      <AdminQueueSection
        title={t("admin.cms.pages.section.title")}
        count={filteredPages.length}
        countAriaLabel={t("admin.cms.pages.section.title")}
        subtitle={t("admin.cms.pages.section.subtitle")}
      >
        <AdminFilterBar
          search={pageFilters.search}
          onSearchChange={(v) =>
            setPageFilters((p) => ({ ...p, search: v }))
          }
          placeholder={t("admin.cms.pages.search.placeholder")}
          chips={[
            ...LOCALE_FILTERS.map((l) => ({
              label: t(
                l === "all"
                  ? "admin.cms.pages.locale.all"
                  : `admin.cms.pages.locale.${l}`,
              ),
              value: `plocale:${l}`,
              active: pageFilters.locale === l,
              onToggle: () => setPageFilters((p) => ({ ...p, locale: l })),
            })),
            ...STATUS_FILTERS.map((s) => ({
              label: t(
                s === "all"
                  ? "admin.cms.pages.status.all"
                  : `admin.cms.pages.status.${s}`,
              ),
              value: `pstatus:${s}`,
              active: pageFilters.status === s,
              onToggle: () => setPageFilters((p) => ({ ...p, status: s })),
            })),
          ]}
          onReset={
            pageFilters.search ||
            pageFilters.locale !== "all" ||
            pageFilters.status !== "all"
              ? () =>
                  setPageFilters({
                    search: "",
                    locale: "all",
                    status: "all",
                  })
              : undefined
          }
          searchTestId="pages-search"
        />
        <AdminDataTable<AdminCmsPageRow>
          columns={columns}
          rows={filteredPages}
          rowKey={(r) => r.id}
          rowTestId={(r) => `pages-row-${r.id}`}
          ariaLabel={t("admin.cms.pages.section.title")}
          empty={t("admin.cms.pages.empty")}
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
            data-testid="pages-bulk-bar"
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
                variant="default"
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => {
                  bulkPublishPages(Array.from(selected));
                  setSelected(new Set());
                }}
                data-testid="pages-bulk-publish"
              >
                {t("admin.cms.pages.bulk.publish")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={ADMIN_WIRE_TIER_C_DISABLED}
                title={tierCDisabledTitle(t)}
                onClick={() => setDialog({ kind: "bulk-archive" })}
                data-testid="pages-bulk-archive"
              >
                {t("admin.cms.pages.bulk.archive")}
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
          (dialog.kind === "row-archive" || dialog.kind === "bulk-archive")
            ? "destructive"
            : "default"
        }
        onConfirm={handleConfirm}
        reasonInputTestId="pages-reason-input"
        confirmTestId="pages-reason-confirm"
      />
    </div>
  );
}
