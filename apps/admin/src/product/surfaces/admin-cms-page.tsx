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

/** E6 CMS desk (`/cms`) — page publishing queue only. */
export function AdminCmsPage() {
  const t = useT();
  const { filteredPages, publishPage, archivePage, restorePageDraft } = useAdminCmsDesk();
  const [target, setTarget] = useState<Target | null>(null);

  const submit = async (reason: string) => {
    if (!target) return false;
    const success =
      target.action === 'publish'
        ? publishPage(target.row.id)
        : target.action === 'archive'
          ? archivePage(target.row.id, reason)
          : restorePageDraft(target.row.id, reason);
    if (success) setTarget(null);
    return success;
  };

  const actionKey: Record<PageAction, MessageKey> = {
    publish: 'admin.cms.pages.action.publish',
    archive: 'admin.cms.pages.action.archive',
    restore: 'admin.cms.pages.action.restore',
  };
  const titleKey: Record<PageAction, MessageKey> = {
    publish: 'admin.cms.pages.dialog.archive.title',
    archive: 'admin.cms.pages.dialog.archive.title',
    restore: 'admin.cms.pages.dialog.restore.title',
  };

  return (
    <div className="flex flex-col gap-6">
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
          { id: 'updated', header: t('admin.cms.pages.col.updatedAt'), cell: ({ row }) => row.updatedAt },
        ]}
        rows={filteredPages}
        getRowId={(row) => row.id}
        minWidth={720}
        empty={
          <EmptyState
            title={t('admin.overview.empty.title')}
            description={t('admin.cms.pages.empty')}
            actionLabel={t('admin.overview.action.refresh')}
            onAction={() => undefined}
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
                action: row.status === 'published' ? 'archive' : row.status === 'archived' ? 'restore' : 'publish',
              })
            }
          >
            {t(actionKey[row.status === 'published' ? 'archive' : row.status === 'archived' ? 'restore' : 'publish'])}
          </Button>
        )}
      />
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
