import { useState } from 'react';

import type { MessageKey } from '@phonara/i18n';
import { useAdminCmsDesk, type AdminCmsPromoRow } from '@/hooks/admin/useAdminCmsDesk';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { Button } from '@/product/primitives/button';
import { EmptyState } from '@/product/primitives/empty-state';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { AdminQueueActionDialog } from './admin-queue-action-dialog';

type Target = { row: AdminCmsPromoRow; action: 'activate' | 'end' };

const STATUS_KEYS: Record<AdminCmsPromoRow['status'], MessageKey> = {
  draft: 'admin.cms.promos.status.draft',
  scheduled: 'admin.cms.promos.status.scheduled',
  live: 'admin.cms.promos.status.live',
  ended: 'admin.cms.promos.status.ended',
};

/** E6 promotions desk (`/promotions`) — schedule operations only. */
export function AdminPromotionsPage() {
  const t = useT();
  const { filteredPromos, activatePromo, endPromoEarly } = useAdminCmsDesk();
  const [target, setTarget] = useState<Target | null>(null);

  const submit = async (reason: string) => {
    if (!target) return false;
    const success =
      target.action === 'activate'
        ? activatePromo(target.row.id)
        : endPromoEarly(target.row.id, reason);
    if (success) setTarget(null);
    return success;
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-2">
        <h2 className="text-foreground m-0 text-2xl font-semibold">{t('admin.nav.promotions')}</h2>
        <p className="text-foreground-muted m-0 text-sm">{t('admin.cms.promos.section.subtitle')}</p>
      </section>
      <HowItWorks
        persistenceId="admin-promotions"
        titleKey="admin.help.promotions.title"
        stepKeys={[
          'admin.help.promotions.step1',
          'admin.help.promotions.step2',
          'admin.help.promotions.step3',
        ]}
      />
      <AdminTable
        columns={[
          { id: 'promo', header: t('admin.cms.promos.col.promo'), cell: ({ row }) => row.promoKey },
          { id: 'surface', header: t('admin.cms.promos.col.surface'), cell: ({ row }) => row.surface },
          {
            id: 'status',
            header: t('admin.cms.promos.col.status'),
            cell: ({ row }) => t(STATUS_KEYS[row.status]),
          },
          { id: 'ends', header: t('admin.cms.promos.col.endsAt'), cell: ({ row }) => row.endsAt },
        ]}
        rows={filteredPromos}
        getRowId={(row) => row.id}
        minWidth={720}
        empty={
          <EmptyState
            title={t('admin.overview.empty.title')}
            description={t('admin.cms.promos.empty')}
            actionLabel={t('admin.overview.action.refresh')}
            onAction={() => undefined}
          />
        }
        rowActionsHeader={t('admin.cms.promos.col.action')}
        rowActions={(row) => {
          const action = row.status === 'live' ? 'end' : 'activate';
          return (
            <Button
              size="sm"
              variant={action === 'end' ? 'outline' : 'primary'}
              onClick={() => setTarget({ row, action })}
            >
              {t(action === 'end' ? 'admin.cms.promos.action.end' : 'admin.cms.promos.action.activate')}
            </Button>
          );
        }}
      />
      <AdminQueueActionDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        titleKey={
          target?.action === 'end'
            ? 'admin.cms.promos.dialog.end.title'
            : 'admin.cms.promos.dialog.end.title'
        }
        confirmKey={
          target?.action === 'end'
            ? 'admin.cms.promos.action.end'
            : 'admin.cms.promos.action.activate'
        }
        destructive={target?.action === 'end'}
        onSubmit={submit}
      />
    </div>
  );
}
