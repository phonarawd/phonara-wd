import { createRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Route as rootRoute } from './__root';
import { useAuth } from '../contexts/auth-context';
import { useWallet } from '../hooks/use-wallet';
import {
  Badge,
  Card,
  CardDivider,
  CardTitle,
  Money,
  Skeleton,
  Ticker,
  buttonVariants,
  formatMoney,
} from '@phonara/ui';
import { useT } from '../lib/i18n';
import { ensureOnboardingConsents } from '../lib/onboarding-consent';
import { WelcomeModal } from '../components/welcome-modal';
import { DailyClaimCard } from '../components/daily-claim-card';
import { RouletteCard } from '../components/roulette-card';
import { MissionsCard } from '../components/missions-card';
import { ReferralDashboardCard } from '../components/referral-dashboard-card';
import { AppShell } from '../components/app-shell';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
});

function DashboardPage() {
  const t = useT();
  const { session, loading: authLoading } = useAuth();
  const { wallet, loading: walletLoading, error } = useWallet();
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!authLoading && !session) {
      void navigate({ to: '/login' });
    }
  }, [session, authLoading, navigate]);

  useEffect(() => {
    if (!session?.user.id) return;
    void ensureOnboardingConsents().catch(() => undefined);
  }, [session?.user.id]);

  useEffect(() => {
    if (!walletLoading && wallet) {
      const isNew =
        wallet.phon_available === '0.000000' &&
        wallet.usdt_available === '0.000000' &&
        wallet.krw_available === '0';
      if (isNew) setShowWelcome(true);
    }
  }, [wallet, walletLoading]);

  if (authLoading) {
    return (
      <AppShell active="home">
        <div className="app-page" aria-busy="true">
          <Card elevation="raised" className="p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-14 w-48" />
            <Skeleton className="mt-6 h-11 w-full" />
          </Card>
        </div>
      </AppShell>
    );
  }

  const phonLocked = wallet?.phon_locked !== '0.000000';
  const tickerItems = [
    {
      id: 'phon',
      label: t('wallet.currency.phon'),
      value: wallet?.phon_available ?? '0',
      suffix: 'PHON',
      format: (value: string) => formatMoney(value, 'PHON'),
    },
    {
      id: 'usdt',
      label: t('wallet.currency.usdt'),
      value: wallet?.usdt_available ?? '0',
      suffix: 'USDT',
      format: (value: string) => formatMoney(value, 'USDT'),
    },
    {
      id: 'krw',
      label: t('wallet.currency.krw'),
      value: wallet?.krw_available ?? '0',
      suffix: 'KRW',
      format: (value: string) => formatMoney(value, 'KRW'),
    },
  ];

  return (
    <AppShell active="home">
      {showWelcome && <WelcomeModal onDismiss={() => setShowWelcome(false)} />}

      <div className="surface-earn app-page pn-anim-rise" data-testid="dashboard-page">
        <section className="app-section" aria-labelledby="dashboard-hero-title">
          <Card elevation="raised" className="overflow-hidden p-0">
            <div className="p-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p id="dashboard-hero-title" className="text-sm text-muted">
                    {t('dashboard.hero.label')}
                  </p>
                  {walletLoading ? (
                    <Skeleton className="mt-3 h-12 w-40" />
                  ) : (
                    <Money
                      amount={wallet?.phon_available ?? '0'}
                      currency="PHON"
                      emphasis="hero"
                      tone="neutral"
                      pulseOnChange
                      showCurrency
                      className="mt-1 block text-primary"
                      data-testid="dashboard-hero-balance"
                    />
                  )}
                </div>
                <Badge tone={phonLocked ? 'risk' : 'trust'}>
                  {phonLocked ? t('dashboard.badge.locked') : t('dashboard.badge.live')}
                </Badge>
              </div>

              {!walletLoading && wallet && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <BalanceChip
                    label={t('wallet.currency.usdt')}
                    amount={wallet.usdt_available}
                    currency="USDT"
                  />
                  <BalanceChip
                    label={t('wallet.currency.krw')}
                    amount={wallet.krw_available}
                    currency="KRW"
                  />
                </div>
              )}
            </div>

            <CardDivider className="mx-0" />

            <div className="flex flex-col gap-2 p-4 sm:flex-row">
              <Link
                to="/wallet"
                className={buttonVariants({ variant: 'primary', size: 'lg', full: true })}
              >
                {t('dashboard.hero.depositCta')}
              </Link>
              <Link
                to="/trade"
                className={buttonVariants({ variant: 'secondary', size: 'lg', full: true })}
              >
                {t('dashboard.hero.tradeCta')}
              </Link>
            </div>
          </Card>

          {error && (
            <p className="mt-3 text-sm text-down" role="alert">
              {t('wallet.loadError')}
            </p>
          )}
        </section>

        <section
          className="app-section dashboard-command-center"
          aria-labelledby="dashboard-hub-title"
        >
          <div className="dashboard-section-heading">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {t('dashboard.hub.eyebrow')}
              </p>
              <h2 id="dashboard-hub-title" className="mt-1 text-xl font-black text-fg">
                {t('dashboard.hub.title')}
              </h2>
            </div>
            <div className="dashboard-live-ticker" aria-label={t('dashboard.liveTicker')}>
              {walletLoading ? (
                <Skeleton className="h-10 w-full md:w-72" />
              ) : (
                tickerItems.map((item) => (
                  <Ticker
                    key={item.id}
                    label={item.label}
                    value={item.value}
                    suffix={item.suffix}
                    format={item.format}
                    density="compact"
                    aria-label={`${item.label} ${item.format(item.value)} ${item.suffix}`}
                  />
                ))
              )}
            </div>
          </div>

          <div className="dashboard-hub-grid">
            <DashboardHubCard
              to="/earn"
              eyebrow={t('dashboard.hub.earn.eyebrow')}
              title={t('dashboard.hub.earn.title')}
              description={t('dashboard.hub.earn.description')}
              metric={t('dashboard.hub.earn.metric')}
            />
            <DashboardHubCard
              to="/casino"
              eyebrow={t('dashboard.hub.games.eyebrow')}
              title={t('dashboard.hub.games.title')}
              description={t('dashboard.hub.games.description')}
              metric={t('dashboard.hub.games.metric')}
            />
            <DashboardHubCard
              to="/trade"
              eyebrow={t('dashboard.hub.trade.eyebrow')}
              title={t('dashboard.hub.trade.title')}
              description={t('dashboard.hub.trade.description')}
              metric={t('dashboard.hub.trade.metric')}
            />
            <DashboardHubCard
              to="/wallet"
              eyebrow={t('dashboard.hub.wallet.eyebrow')}
              title={t('dashboard.hub.wallet.title')}
              description={t('dashboard.hub.wallet.description')}
              metric={phonLocked ? t('dashboard.badge.locked') : t('dashboard.badge.live')}
            />
          </div>
        </section>

        <section className="app-section" aria-labelledby="dashboard-rewards-title">
          <CardTitle
            id="dashboard-rewards-title"
            className="mb-3 px-0 pt-0 normal-case tracking-normal"
          >
            {t('dashboard.rewardCenter')}
          </CardTitle>
          <p className="mb-4 text-sm text-muted">{t('dashboard.rewardCenterSub')}</p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <DailyClaimCard />
            <RouletteCard />
            <ReferralDashboardCard />
          </div>
          <div className="mt-3">
            <MissionsCard />
          </div>
        </section>

        <section className="app-section-secondary" aria-label={t('dashboard.secondaryLinks')}>
          <div className="flex flex-wrap gap-2">
            <Link to="/earn" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
              {t('nav.earn')}
            </Link>
            <Link to="/ledger" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              {t('nav.ledgerHistory')}
            </Link>
            <Link
              to="/responsible-gaming"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {t('nav.responsibleGaming')}
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function DashboardHubCard({
  to,
  eyebrow,
  title,
  description,
  metric,
}: {
  to: '/staking' | '/casino' | '/trade' | '/ledger' | '/earn' | '/wallet';
  eyebrow: string;
  title: string;
  description: string;
  metric: string;
}) {
  return (
    <Link to={to} className="dashboard-hub-card">
      <span className="dashboard-hub-card-eyebrow">{eyebrow}</span>
      <span className="dashboard-hub-card-title">{title}</span>
      <span className="dashboard-hub-card-description">{description}</span>
      <span className="dashboard-hub-card-metric">{metric}</span>
    </Link>
  );
}

function BalanceChip({
  label,
  amount,
  currency,
}: {
  label: string;
  amount: string;
  currency: 'USDT' | 'KRW';
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-inset px-3 py-2.5">
      <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <Money
        amount={amount}
        currency={currency}
        showCurrency
        className="mt-1 block text-base font-semibold"
      />
    </div>
  );
}
