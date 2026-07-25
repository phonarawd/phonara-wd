import { useAdminTierBenefitsDesk } from '@/hooks/admin/useAdminTierBenefitsDesk';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { Button } from '@/product/primitives/button';
import { EmptyState } from '@/product/primitives/empty-state';
import { HowItWorks } from '@/product/primitives/how-it-works';

/** E6 tier benefits desk (`/tier-benefits`) — read-only configured limits. */
export function AdminTierBenefitsPage() {
  const t = useT();
  const { goldenEarthLimits, earnMissionLimits, isLoading, isError, refresh } =
    useAdminTierBenefitsDesk();

  return (
    <div className="flex flex-col gap-ds-8">
      <section className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold">
            {t('admin.nav.tierBenefits')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.missions.description')}</p>
        </div>
        <Button size="md" variant="outline" onClick={() => void refresh()}>
          {t('admin.overview.action.refresh')}
        </Button>
      </section>
      <HowItWorks
        persistenceId="admin-tier-benefits"
        titleKey="admin.help.tierBenefits.title"
        stepKeys={[
          'admin.help.tierBenefits.step1',
          'admin.help.tierBenefits.step2',
          'admin.help.tierBenefits.step3',
        ]}
      />
      {isError ? (
        <EmptyState
          title={t('admin.missions.error.title')}
          description={t('admin.missions.error.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void refresh()}
        />
      ) : (
        <>
          <AdminTable
            columns={[
              {
                id: 'tier',
                header: t('admin.missions.col.setting'),
                cell: ({ row }) => t(row.labelKey),
              },
              {
                id: 'attendance',
                header: t('admin.missions.col.value'),
                cell: ({ row }) => row.attendance,
              },
              {
                id: 'roulette',
                header: t('admin.missions.col.reward'),
                cell: ({ row }) => row.roulette,
              },
              {
                id: 'referral',
                header: t('admin.viralStats.col.claims'),
                cell: ({ row }) => row.referralPayout,
              },
            ]}
            rows={earnMissionLimits}
            getRowId={(row) => row.tier}
            loading={isLoading}
            minWidth={640}
            empty={
              <EmptyState
                title={t('admin.overview.empty.title')}
                description={t('admin.missions.empty.limits')}
                actionLabel={t('admin.overview.action.refresh')}
                onAction={() => void refresh()}
              />
            }
          />
          <AdminTable
            columns={[
              {
                id: 'tier',
                header: t('admin.missions.col.setting'),
                cell: ({ row }) => t(row.labelKey),
              },
              {
                id: 'cap',
                header: t('admin.missions.col.value'),
                cell: ({ row }) => row.dailyTapCap,
              },
              {
                id: 'reward',
                header: t('admin.missions.col.reward'),
                cell: ({ row }) => row.phonPerTap,
              },
            ]}
            rows={goldenEarthLimits}
            getRowId={(row) => row.tier}
            loading={isLoading}
            minWidth={640}
            empty={
              <EmptyState
                title={t('admin.overview.empty.title')}
                description={t('admin.missions.empty.limits')}
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
