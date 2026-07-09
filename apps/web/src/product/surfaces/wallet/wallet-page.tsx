import { useEffect } from 'react';

import type { FiatHintView } from '@/domain/fiat-reference-display-contract';
import { useWalletPageController } from '@/features/wallet/use-wallet-page-controller';
import { useWalletFiatHint } from '@/features/wallet/use-wallet-fiat-hint';
import { ledgerReasonLabelKey } from '@/features/wallet/ledger-labels';
import { isPositiveAmount } from '@/lib/money-display';
import { useI18n, useT } from '@/product/i18n';
import { Button, buttonVariants } from '@/product/primitives/button';
import { FiatHintDisclaimer } from '@/product/primitives/money-display-with-fiat-hint';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

import { WalletBalanceHero } from './wallet-balance-hero';
import { WalletComplianceStrip } from './wallet-compliance-strip';
import { WalletMoneyWithFiatHint } from './wallet-money-with-fiat-hint';

function WalletLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="wallet-loading">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function BalanceRow({
  label,
  amount,
  currency,
  hintFor,
}: {
  label: string;
  amount: string;
  currency: 'PHON' | 'USDT' | 'KRW';
  hintFor: (amount: string, sourceCurrency: string) => FiatHintView;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-foreground-muted text-sm">{label}</span>
      <WalletMoneyWithFiatHint
        amount={amount}
        currency={currency}
        showCurrency
        fiatHint={hintFor(amount, currency)}
        className="text-foreground items-end text-sm font-medium"
      />
    </div>
  );
}

/** Canonical `/wallet` overview — balances · CTAs · compliance · recent activity (P4·W3). */
export function WalletPage() {
  const t = useT();
  const { locale } = useI18n();
  const engine = useWalletPageController();
  const { hintFor, showDisclaimer } = useWalletFiatHint();

  useEffect(() => {
    document.title = t('seo.wallet.title');
  }, [t]);

  if (engine.loading) {
    return <WalletLoadingShell />;
  }

  if (engine.errorKey) {
    return (
      <div
        className="border-danger/30 bg-surface flex flex-col items-start gap-3 rounded-(--ds-radius-lg) border p-4"
        data-testid="wallet-error"
        role="alert"
      >
        <p className="text-foreground m-0 text-sm">{t(engine.errorKey)}</p>
        <Button type="button" variant="outline" size="sm" onClick={engine.refresh}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const showPhonLocked = isPositiveAmount(engine.phonLockedDisplay);
  const showUsdtLocked = isPositiveAmount(engine.usdtLockedDisplay);
  const showPhonSplit =
    engine.phonRealAvailableDisplay !== null && engine.phonBonusAvailableDisplay !== null;

  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6" data-testid="wallet-page">
      <header className="space-y-1">
        <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
          {t('wallet.title')}
        </h1>
        <p className="text-foreground-muted m-0 text-sm">{t('wallet.phon.guide.balance')}</p>
      </header>

      <WalletBalanceHero
        label={t('wallet.assets')}
        amount={engine.phonAvailableDisplay}
        fiatHint={hintFor(engine.phonAvailableDisplay, 'PHON')}
        detailsTitle={t('wallet.hero.details')}
        detailsSummary={t('wallet.hero.detailsSummary')}
        expandLabel={t('wallet.hero.expand')}
        collapseLabel={t('wallet.hero.collapse')}
        details={
          <div className="grid gap-4 sm:grid-cols-2" data-testid="wallet-hero-breakdown">
            <div className="space-y-2">
              <p className="text-foreground m-0 text-sm font-semibold">
                {t('wallet.currency.phon')}
              </p>
              <BalanceRow
                label={t('wallet.available')}
                amount={engine.phonAvailableDisplay}
                currency="PHON"
                hintFor={hintFor}
              />
              {showPhonLocked ? (
                <BalanceRow
                  label={t('wallet.lockedShort')}
                  amount={engine.phonLockedDisplay}
                  currency="PHON"
                  hintFor={hintFor}
                />
              ) : null}
              {showPhonSplit ? (
                <>
                  <BalanceRow
                    label={t('wallet.phon.realLabel')}
                    amount={engine.phonRealAvailableDisplay!}
                    currency="PHON"
                    hintFor={hintFor}
                  />
                  <BalanceRow
                    label={t('wallet.phon.bonusLabel')}
                    amount={engine.phonBonusAvailableDisplay!}
                    currency="PHON"
                    hintFor={hintFor}
                  />
                </>
              ) : null}
            </div>
            <div className="space-y-2">
              <p className="text-foreground m-0 text-sm font-semibold">
                {t('wallet.currency.usdt')}
              </p>
              <BalanceRow
                label={t('desk.wallet.available')}
                amount={engine.usdtAvailableDisplay}
                currency="USDT"
                hintFor={hintFor}
              />
              {showUsdtLocked ? (
                <BalanceRow
                  label={t('wallet.lockedShort')}
                  amount={engine.usdtLockedDisplay}
                  currency="USDT"
                  hintFor={hintFor}
                />
              ) : null}
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3" data-testid="wallet-cta-row">
        {engine.depositBlocked ? (
          <Button
            variant="primary"
            size="lg"
            className="col-span-2 md:col-span-1"
            disabled
            title={t('wallet.deposit.gate.paused')}
          >
            {t('desk.wallet.bottomDeposit')}
          </Button>
        ) : (
          <a
            href="/wallet/deposit"
            className={cn(
              buttonVariants({ variant: 'primary', size: 'lg' }),
              'col-span-2 md:col-span-1',
            )}
          >
            {t('desk.wallet.bottomDeposit')}
          </a>
        )}
        {engine.withdrawalBlocked || !engine.withdrawalReady ? (
          <Button
            variant="secondary"
            size="lg"
            disabled
            title={
              engine.withdrawalBlocked
                ? t('wallet.withdraw.gate.paused')
                : t('wallet.compliance.notReadyToast')
            }
          >
            {t('desk.wallet.bottomWithdraw')}
          </Button>
        ) : (
          <a
            href="/wallet/withdraw"
            className={buttonVariants({ variant: 'secondary', size: 'lg' })}
          >
            {t('desk.wallet.bottomWithdraw')}
          </a>
        )}
        <a
          href="/ledger"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'lg' }),
            'col-span-2 md:col-span-1',
          )}
        >
          {t('wallet.activity.viewAll')}
        </a>
      </div>

      <WalletComplianceStrip
        kycStatusKey={engine.kycStatusKey}
        withdrawalReady={engine.withdrawalReady}
        loading={engine.complianceLoading}
      />

      <section aria-labelledby="wallet-activity-heading">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="wallet-activity-heading" className="text-foreground m-0 text-lg font-semibold">
            {t('wallet.activity.title')}
          </h2>
          <a
            href="/ledger"
            className="text-accent text-sm font-medium underline-offset-4 hover:underline"
          >
            {t('wallet.activity.viewAll')}
          </a>
        </div>

        {engine.activityLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : engine.recentActivity.length === 0 ? (
          <p className="text-foreground-muted m-0 text-sm" data-testid="wallet-activity-empty">
            {t('wallet.activity.empty')}
          </p>
        ) : (
          <ul className="border-line divide-line m-0 list-none divide-y rounded-(--ds-radius-md) border p-0">
            {engine.recentActivity.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
                data-testid="wallet-activity-row"
              >
                <div className="min-w-0">
                  <p className="text-foreground m-0 truncate text-sm font-medium">
                    {t(ledgerReasonLabelKey(row.reasonCode))}
                  </p>
                  <p className="text-foreground-muted m-0 text-xs">
                    {dateFormatter.format(new Date(row.createdAt))}
                  </p>
                </div>
                <WalletMoneyWithFiatHint
                  amount={row.amount}
                  currency={row.currency}
                  signed
                  showCurrency
                  fiatHint={hintFor(row.amount, row.currency)}
                  className={cn('shrink-0 items-end text-sm font-medium')}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {showDisclaimer ? <FiatHintDisclaimer /> : null}
    </div>
  );
}
