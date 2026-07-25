import { useState } from 'react';

import type { MessageKey } from '@phonara/i18n';
import { useAdminCmsDesk, type AdminCmsPageRow } from '@/hooks/admin/useAdminCmsDesk';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { Button } from '@/product/primitives/button';
import { EmptyState } from '@/product/primitives/empty-state';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { AdminQueueActionDialog } from './admin-queue-action-dialog';

type PageAction = 'publish' | 'archive' | 'restore';
type Target = { row: AdminCmsPageRow; action: PageAction };

const STATUS_KEYS: Record<AdminCmsPageRow['status'], MessageKey> = {
  draft: 'admin.cms.pages.status.draft',
  published: 'admin.cms.pages.status.published',
  archived: 'admin.cms.pages.status.archived',
};

function formatWhen(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** E6 CMS desk (`/cms`) — page publishing queue only. */
export function AdminCmsPage() {
  const t = useT();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';
  const { filteredPages, publishPage, archivePage, restorePageDraft, audit, refresh } =
    useAdminCmsDesk();
  const [target, setTarget] = useState<Target | null>(null);

  const pageAudit = audit.filter((event) => event.actionKey.startsWith('admin.cms.pages.audit.'));

  const submit = async (reason: string) => {
    if (!target) return false;
    const success =
      target.action === 'publish'
        ? await publishPage(target.row.id, reason)
        : target.action === 'archive'
          ? await archivePage(target.row.id, reason)
          : await restorePageDraft(target.row.id, reason);
    if (success) setTarget(null);
    return success;
  };

  const actionKey: Record<PageAction, MessageKey> = {
    publish: 'admin.cms.pages.action.publish',
    archive: 'admin.cms.pages.action.archive',
    restore: 'admin.cms.pages.action.restore',
  };
  const titleKey: Record<PageAction, MessageKey> = {
    publish: 'admin.cms.pages.dialog.publish.title',
    archive: 'admin.cms.pages.dialog.archive.title',
    restore: 'admin.cms.pages.dialog.restore.title',
  };

  return (
    <div className="flex flex-col gap-ds-8">
      <section className="space-y-2">
        <h2 className="text-foreground m-0 text-2xl font-semibold">{t('admin.nav.cms')}</h2>
        <p className="text-foreground-muted m-0 text-sm">{t('admin.cms.pages.section.subtitle')}</p>
      </section>
      <HowItWorks
        persistenceId="admin-cms"
        titleKey="admin.help.cms.title"
        stepKeys={['admin.help.cms.step1', 'admin.help.cms.step2', 'admin.help.cms.step3']}
      />
      <AdminTable
        columns={[
          { id: 'page', header: t('admin.cms.pages.col.page'), cell: ({ row }) => row.pageKey },
          { id: 'locale', header: t('admin.cms.pages.col.locale'), cell: ({ row }) => row.locale },
          {
            id: 'status',
            header: t('admin.cms.pages.col.status'),
            cell: ({ row }) => t(STATUS_KEYS[row.status]),
          },
          {
            id: 'updated',
            header: t('admin.cms.pages.col.updatedAt'),
            cell: ({ row }) => row.updatedAt,
          },
        ]}
        rows={filteredPages}
        getRowId={(row) => row.id}
        minWidth={720}
        empty={
          <EmptyState
            title={t('admin.overview.empty.title')}
            description={t('admin.cms.pages.empty')}
            actionLabel={t('admin.overview.action.refresh')}
            onAction={() => void refresh()}
          />
        }
        rowActionsHeader={t('admin.cms.pages.col.action')}
        rowActions={(row) => (
          <Button
            size="sm"
            variant={row.status === 'published' ? 'outline' : 'primary'}
            onClick={() =>
              setTarget({
                row,
                action:
                  row.status === 'published'
                    ? 'archive'
                    : row.status === 'archived'
                      ? 'restore'
                      : 'publish',
              })
            }
          >
            {t(
              actionKey[
                row.status === 'published'
                  ? 'archive'
                  : row.status === 'archived'
                    ? 'restore'
                    : 'publish'
              ],
            )}
          </Button>
        )}
      />

      <section className="space-y-3" aria-labelledby="admin-cms-audit-heading">
        <h3 id="admin-cms-audit-heading" className="text-foreground m-0 text-base font-semibold">
          {t('admin.cms.audit.title')}
        </h3>
        <AdminTable
          columns={[
            {
              id: 'time',
              header: t('admin.audit.col.time'),
              cell: ({ row }) => formatWhen(row.at, locale),
              meta: { className: 'text-foreground-muted' },
            },
            {
              id: 'action',
              header: t('admin.audit.col.action'),
              cell: ({ row }) => t(row.actionKey as MessageKey),
            },
            {
              id: 'subject',
              header: t('admin.cms.pages.col.page'),
              cell: ({ row }) => row.subject,
            },
            {
              id: 'reason',
              header: t('admin.audit.col.reason'),
              cell: ({ row }) => row.reason || '—',
              meta: { className: 'text-foreground-muted' },
            },
          ]}
          rows={pageAudit.slice(0, 20)}
          getRowId={(row) => row.id}
          minWidth={640}
          empty={<p className="text-foreground-muted m-0 text-sm">{t('admin.cms.audit.empty')}</p>}
        />
      </section>

      <AdminQueueActionDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        titleKey={target ? titleKey[target.action] : 'admin.cms.pages.dialog.archive.title'}
        confirmKey={target ? actionKey[target.action] : 'admin.cms.pages.action.archive'}
        destructive={target?.action === 'archive'}
        onSubmit={submit}
      />
    </div>
  );
}
