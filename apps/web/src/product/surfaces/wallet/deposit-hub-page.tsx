import { useEffect } from 'react';
import { Banknote, Coins, Gift } from 'lucide-react';
import { useNavigate, useSearch } from '@tanstack/react-router';

import {
  useDepositHubController,
  type DepositHubTab,
} from '@/features/wallet/use-deposit-hub-controller';
import { useI18n, useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { Skeleton } from '@/product/primitives/skeleton';
import { StatusBadge } from '@/product/primitives/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';
import { cn } from '@/product/primitives/lib/cn';

import { DepositPaymentMethodCard } from './deposit-payment-method-card';

const RAIL_ICONS = {
  krw: Banknote,
  crypto: Coins,
  giftcard: Gift,
} as const;

function DepositHubLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="deposit-hub-loading">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

/** Canonical `/wallet/deposit` hub — 3-rail method cards · history tab (P4·W3). */
export function DepositHubPage() {
  const t = useT();
  const { locale } = useI18n();
  const navigate = useNavigate({ from: '/wallet/deposit' });
  const search = useSearch({ from: '/wallet/deposit' });
  const activeTab: DepositHubTab = search.tab === 'history' ? 'history' : 'methods';
  const engine = useDepositHubController(activeTab);

  useEffect(() => {
    document.title = t('seo.walletDeposit.title');
  }, [t]);

  const setTab = (tab: DepositHubTab) => {
    void navigate({
      search: (prev) => ({ ...prev, tab: tab === 'methods' ? undefined : tab }),
      replace: true,
    });
  };

  if (engine.loading) {
    return <DepositHubLoadingShell />;
  }

  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6" data-testid="deposit-hub-page">
      <header className="space-y-3">
        <a
          href="/wallet"
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
        >
          {t('wallet.deposit.hub.back')}
        </a>
        <div className="space-y-1">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('wallet.tab.deposit')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm">{t('wallet.deposit.hub.subtitle')}</p>
        </div>
      </header>

      {engine.depositBlocked ? (
        <div
          className="border-warning/30 bg-warning/10 rounded-(--ds-radius-lg) border p-4"
          data-testid="deposit-hub-paused"
          role="status"
        >
          <p className="text-foreground m-0 text-sm font-medium">
            {t('wallet.deposit.unavailableTitle')}
          </p>
          <p className="text-foreground-muted m-0 mt-1 text-sm">
            {t('wallet.deposit.unavailableDesc')}
          </p>
        </div>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(value) => setTab(value === 'history' ? 'history' : 'methods')}
      >
        <TabsList
          className="grid w-full grid-cols-2"
          aria-label={t('wallet.deposit.hub.tabsLabel')}
        >
          <TabsTrigger value="methods">{t('wallet.deposit.hub.tab.methods')}</TabsTrigger>
          <TabsTrigger value="history">{t('wallet.tab.history')}</TabsTrigger>
        </TabsList>

        <TabsContent value="methods">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" data-testid="deposit-rail-grid">
            {engine.rails.map((rail) => (
              <DepositPaymentMethodCard
                key={rail.id}
                titleKey={rail.titleKey}
                descriptionKey={rail.descriptionKey}
                metaKey={rail.metaKey}
                href={rail.href}
                icon={RAIL_ICONS[rail.id]}
                disabled={engine.depositBlocked}
                testId={`deposit-rail-${rail.id}`}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="flex flex-col gap-3">
            <p className="text-foreground-muted m-0 text-sm">
              {t('wallet.deposit.history.ledgerHint')}
            </p>

            {engine.historyLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : engine.historyRows.length === 0 ? (
              <p className="text-foreground-muted m-0 text-sm" data-testid="deposit-history-empty">
                {t('wallet.tx.empty')}
              </p>
            ) : (
              <ul
                className="border-line divide-line m-0 list-none divide-y rounded-(--ds-radius-md) border p-0"
                data-testid="deposit-history-list"
              >
                {engine.historyRows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    data-testid="deposit-history-row"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-foreground m-0 text-sm font-medium">
                        {t(row.methodLabelKey)}
                      </p>
                      <p className="text-foreground-muted m-0 text-xs">
                        {dateFormatter.format(new Date(row.createdAt))}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <MoneyDisplay
                        amount={row.amountDisplay}
                        currency={row.currency}
                        showCurrency
                        className="text-foreground text-sm font-medium"
                      />
                      <StatusBadge state={row.status} label={t(row.statusLabelKey)} />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <a
              href="/ledger"
              className={cn(buttonVariants({ variant: 'outline', size: 'md' }), 'w-full sm:w-auto')}
            >
              {t('wallet.activity.viewAll')}
            </a>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
