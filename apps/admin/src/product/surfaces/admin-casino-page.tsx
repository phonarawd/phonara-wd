import { useState } from 'react';

import { useAdminCasinoDesk, type AdminCasinoGameRow } from '@/hooks/admin/useAdminCasinoDesk';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { Button } from '@/product/primitives/button';
import { EmptyState } from '@/product/primitives/empty-state';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';
import { AdminQueueActionDialog } from './admin-queue-action-dialog';

type Target = { row: AdminCasinoGameRow; status: 'live' | 'maintenance' | 'disabled' };

/** E6 casino desk (`/casino`) — catalog status and RTP reviews. */
export function AdminCasinoPage() {
  const t = useT();
  const { filteredCatalog, filteredRtpReviews, setGameStatus, ackRtpReview, resolveRtpReview } =
    useAdminCasinoDesk();
  const [target, setTarget] = useState<Target | null>(null);

  const submitStatus = async (reason: string) => {
    if (!target) return false;
    const success = setGameStatus(target.row.id, target.status, reason);
    if (success) setTarget(null);
    return success;
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-2">
        <h2 className="text-foreground m-0 text-2xl font-semibold">{t('admin.casino.title')}</h2>
        <p className="text-foreground-muted m-0 text-sm">{t('admin.casino.subtitle')}</p>
      </section>
      <HowItWorks
        persistenceId="admin-casino"
        titleKey="admin.help.casino.title"
        stepKeys={['admin.help.casino.step1', 'admin.help.casino.step2', 'admin.help.casino.step3']}
      />
      <Tabs defaultValue="catalog">
        <TabsList aria-label={t('admin.casino.section.tabs')}>
          <TabsTrigger value="catalog">{t('admin.casino.section.catalog')}</TabsTrigger>
          <TabsTrigger value="rtp">{t('admin.casino.section.rtp')}</TabsTrigger>
        </TabsList>
        <TabsContent value="catalog">
          <AdminTable
            columns={[
              { id: 'game', header: t('admin.casino.catalog.col.game'), cell: ({ row }) => t(row.labelKey as never) },
              { id: 'status', header: t('admin.casino.catalog.col.status'), cell: ({ row }) => row.status },
              { id: 'rtp', header: t('admin.casino.catalog.col.rtpConfigured'), cell: ({ row }) => row.rtpConfigured },
              { id: 'bets', header: t('admin.casino.catalog.col.bets24h'), cell: ({ row }) => row.bets24h },
            ]}
            rows={filteredCatalog}
            getRowId={(row) => row.id}
            minWidth={760}
            empty={
              <EmptyState
                title={t('admin.overview.empty.title')}
                description={t('admin.casino.catalog.empty')}
                actionLabel={t('admin.overview.action.refresh')}
                onAction={() => undefined}
              />
            }
            rowActionsHeader={t('admin.casino.catalog.col.action')}
            rowActions={(row) => (
              <Button
                size="sm"
                variant={row.status === 'live' ? 'outline' : 'primary'}
                onClick={() =>
                  setTarget({ row, status: row.status === 'live' ? 'maintenance' : 'live' })
                }
              >
                {t(
                  row.status === 'live'
                    ? 'admin.casino.catalog.action.maintenance'
                    : 'admin.casino.catalog.action.live',
                )}
              </Button>
            )}
          />
        </TabsContent>
        <TabsContent value="rtp">
          <AdminTable
            columns={[
              { id: 'game', header: t('admin.casino.rtp.col.game'), cell: ({ row }) => t(row.labelKey as never) },
              { id: 'status', header: t('admin.casino.rtp.col.status'), cell: ({ row }) => row.status },
              { id: 'drift', header: t('admin.casino.rtp.col.drift'), cell: ({ row }) => row.driftPct },
              { id: 'sample', header: t('admin.casino.rtp.col.sample'), cell: ({ row }) => row.sampleSize },
            ]}
            rows={filteredRtpReviews}
            getRowId={(row) => row.id}
            minWidth={720}
            empty={
              <EmptyState
                title={t('admin.overview.empty.title')}
                description={t('admin.casino.rtp.empty')}
                actionLabel={t('admin.overview.action.refresh')}
                onAction={() => undefined}
              />
            }
            rowActionsHeader={t('admin.casino.rtp.col.action')}
            rowActions={(row) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  row.status === 'open'
                    ? ackRtpReview(row.id)
                    : resolveRtpReview(row.id, 'RTP review resolved')
                }
              >
                {t(row.status === 'open' ? 'admin.casino.rtp.action.ack' : 'admin.casino.rtp.action.resolve')}
              </Button>
            )}
          />
        </TabsContent>
      </Tabs>
      <AdminQueueActionDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        titleKey={
          target?.status === 'live'
            ? 'admin.casino.catalog.dialog.live.title'
            : 'admin.casino.catalog.dialog.maintenance.title'
        }
        confirmKey={
          target?.status === 'live'
            ? 'admin.casino.catalog.action.live'
            : 'admin.casino.catalog.action.maintenance'
        }
        destructive={target?.status !== 'live'}
        onSubmit={submitStatus}
      />
    </div>
  );
}
