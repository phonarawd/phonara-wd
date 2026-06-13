import { useMemo } from 'react';
import { AssetCard, Badge, formatMoney } from '@phonara/ui';
import { useT } from '../../lib/i18n';
import { useWallet } from '../../hooks/use-wallet';
import { DailyClaimCard } from '../../components/daily-claim-card';
import { MissionsCard } from '../../components/missions-card';
import { ReferralDashboardCard } from '../../components/referral-dashboard-card';
import { RouletteCard } from '../../components/roulette-card';

export function EarnSurface() {
  const t = useT();
  const { wallet, loading: walletLoading } = useWallet();

  const claimablePreview = useMemo(() => {
    if (!wallet) return '0';
    return wallet.phon_available;
  }, [wallet]);

  return (
    <div className="surface-earn app-page pn-anim-rise" data-testid="earn-surface">
      <section className="earn-hero-card earn-grid-span-full" aria-labelledby="earn-hero-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-primary">{t('earn.surface.eyebrow')}</p>
            <h1 id="earn-hero-title" className="mt-1 text-(length:--text-heading) font-medium leading-heading text-fg">
              {t('earn.surface.title')}
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">{t('earn.surface.sub')}</p>
          </div>
          <Badge tone="warning">{t('earn.surface.limitedBadge')}</Badge>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <AssetCard
            label={t('earn.surface.balanceLabel')}
            amount={walletLoading ? '0' : claimablePreview}
            formatAmount={(value) => formatMoney(value, 'PHON')}
            tone="primary"
            emphasis="hero"
            badge={<Badge tone="primary">{t('earn.surface.liveBadge')}</Badge>}
            footer={t('earn.surface.balanceHint')}
          />
          <div className="flex flex-col justify-center gap-3 rounded-2xl border border-border bg-surface/80 p-4">
            <p className="text-sm font-medium text-fg">{t('earn.surface.nextActionTitle')}</p>
            <p className="text-sm text-muted">{t('earn.surface.nextActionBody')}</p>
            <a href="#earn-daily-claim" className="earn-touch-target inline-flex items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-(--color-primary-fg)">
              {t('earn.surface.cta')}
            </a>
          </div>
        </div>
      </section>

      <div className="earn-grid">
        <div className="earn-grid-span-full lg:col-span-1" id="earn-daily-claim">
          <DailyClaimCard />
        </div>
        <div className="earn-grid-span-full lg:col-span-1">
          <RouletteCard />
        </div>
        <div className="earn-grid-span-full">
          <MissionsCard />
        </div>
        <div className="earn-grid-span-full">
          <ReferralDashboardCard />
        </div>
      </div>
    </div>
  );
}
