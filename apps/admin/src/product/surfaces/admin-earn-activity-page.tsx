import { useAdminEarnActivityDesk } from '@/hooks/admin/useAdminEarnActivityDesk';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { Button } from '@/product/primitives/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { HowItWorks } from '@/product/primitives/how-it-works';

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="gap-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="tabular-nums text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

/** E6 Earn activity desk (`/earn/activity`) — aggregate and exception queue read view. */
export function AdminEarnActivityPage() {
  const t = useT();
  const { queueRows, alerts, referralSnapshot, missionClaimTotals, loading, error, refresh } =
    useAdminEarnActivityDesk();

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold">{t('admin.nav.earnActivity')}</h2>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.viralStats.description')}</p>
        </div>
        <Button size="md" variant="outline" onClick={() => void refresh()}>
          {t('admin.overview.action.refresh')}
        </Button>
      </section>
      <HowItWorks
        persistenceId="admin-earn-activity"
        titleKey="admin.help.earnActivity.title"
        stepKeys={[
          'admin.help.earnActivity.step1',
          'admin.help.earnActivity.step2',
          'admin.help.earnActivity.step3',
        ]}
      />
      {error ? (
        <EmptyState
          title={t('admin.viralStats.error.title')}
          description={t('admin.viralStats.error.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void refresh()}
        />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label={t('admin.viralStats.metric.totalLinks')} value={referralSnapshot.total} />
            <MetricCard label={t('admin.viralStats.metric.uniqueAffiliates')} value={referralSnapshot.uniqueReferrers} />
            <MetricCard label={t('admin.viralStats.metric.recentLinks')} value={referralSnapshot.recent7d} />
            <MetricCard label={t('admin.casino.rtp.metric.open')} value={alerts.open} />
          </section>
          <AdminTable
            columns={[
              { id: 'queue', header: t('admin.audit.feed.col.domain'), cell: ({ row }) => row.queueType },
              { id: 'open', header: t('admin.casino.rtp.metric.open'), cell: ({ row }) => row.openCount },
              { id: 'overdue', header: t('admin.casino.rtp.metric.critical'), cell: ({ row }) => row.overdueCount },
            ]}
            rows={queueRows}
            getRowId={(row) => row.queueType}
            loading={loading}
            minWidth={640}
            empty={
              <EmptyState
                title={t('admin.overview.empty.title')}
                description={t('admin.audit.empty.desc')}
                actionLabel={t('admin.overview.action.refresh')}
                onAction={() => void refresh()}
              />
            }
          />
          <AdminTable
            columns={[
              { id: 'mission', header: t('admin.missions.col.mission'), cell: ({ row }) => row.mission },
              { id: 'claims', header: t('admin.viralStats.col.claims'), cell: ({ row }) => row.claimCount },
              { id: 'phon', header: t('admin.viralStats.col.phonAwarded'), cell: ({ row }) => row.phonAwardedTotal },
            ]}
            rows={missionClaimTotals}
            getRowId={(row) => row.mission}
            loading={loading}
            minWidth={640}
            empty={
              <EmptyState
                title={t('admin.overview.empty.title')}
                description={t('admin.viralStats.empty.missions')}
                actionLabel={t('admin.overview.action.refresh')}
                onAction={() => void refresh()}
              />
            }
          />
        </>
      )}
    </div>
  );
}
