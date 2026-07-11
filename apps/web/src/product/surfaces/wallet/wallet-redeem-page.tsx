import { useEffect } from 'react';
import { Banknote, Coins, Gift } from 'lucide-react';

import {
  WALLET_REDEEM_SEO_DESCRIPTION_KEY,
  WALLET_REDEEM_SEO_TITLE_KEY,
  type WalletRedeemRailId,
} from '@/domain/wallet-redeem-display-contract';
import { useWalletRedeemController } from '@/features/wallet/use-wallet-redeem-controller';
import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

import { DepositPaymentMethodCard } from './deposit-payment-method-card';

const RAIL_ICONS: Record<WalletRedeemRailId, typeof Banknote> = {
  krw: Banknote,
  crypto: Coins,
  giftcard: Gift,
};

function WalletRedeemLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="wallet-redeem-loading">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

/** Canonical `/wallet/redeem` — PHON shop · Payment Method Card grammar (P11). */
export function WalletRedeemPage() {
  const t = useT();
  const engine = useWalletRedeemController();

  useEffect(() => {
    document.title = t(WALLET_REDEEM_SEO_TITLE_KEY);
  }, [t]);

  if (engine.loading) {
    return <WalletRedeemLoadingShell />;
  }

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6" data-testid="wallet-redeem-page">
      <header className="space-y-3">
        <a
          href="/wallet"
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
          data-testid="wallet-redeem-back"
        >
          {t('wallet.redeem.back')}
        </a>
        <div className="space-y-1">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('wallet.subnav.redeem')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm">{t(WALLET_REDEEM_SEO_DESCRIPTION_KEY)}</p>
        </div>
      </header>

      {engine.errorKey ? (
        <p className="text-danger m-0 text-sm" role="alert" data-testid="wallet-redeem-error">
          {t(engine.errorKey)}
        </p>
      ) : null}

      <section
        className="border-line bg-surface-raised rounded-lg border p-4"
        data-testid="wallet-redeem-balance"
        aria-label={t('wallet.redeem.balanceLabel')}
      >
        <p className="text-foreground-muted m-0 text-sm">{t('wallet.redeem.balanceLabel')}</p>
        <MoneyDisplay
          amount={engine.phonAvailableDisplay}
          currency="PHON"
          showCurrency
          className="text-foreground mt-1 text-xl font-semibold"
        />
        <p className="text-foreground-muted m-0 mt-2 text-xs leading-relaxed">
          {t('wallet.redeem.ledgerHint')}
        </p>
      </section>

      {engine.withdrawalBlocked ? (
        <div
          className="border-warning/30 bg-warning/10 rounded-lg border p-4"
          data-testid="wallet-redeem-withdraw-paused"
          role="status"
        >
          <p className="text-foreground m-0 text-sm font-medium">
            {t('wallet.withdraw.unavailableTitle')}
          </p>
          <p className="text-foreground-muted m-0 mt-1 text-sm">
            {t('wallet.withdraw.unavailableDesc')}
          </p>
        </div>
      ) : !engine.withdrawalReady ? (
        <div
          className="border-line bg-surface-raised rounded-lg border p-4"
          data-testid="wallet-redeem-kyc-lock"
          role="status"
        >
          <p className="text-foreground m-0 text-sm font-medium">
            {t('wallet.withdraw.kycLockTitle')}
          </p>
          <p className="text-foreground-muted m-0 mt-1 text-sm">
            {t('wallet.withdraw.kycLockDesc')}
          </p>
        </div>
      ) : null}

      {engine.depositBlocked ? (
        <div
          className="border-warning/30 bg-warning/10 rounded-lg border p-4"
          data-testid="wallet-redeem-deposit-paused"
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

      <section aria-labelledby="wallet-redeem-rails-heading">
        <h2
          id="wallet-redeem-rails-heading"
          className="text-foreground m-0 mb-3 text-lg font-semibold"
        >
          {t('wallet.redeem.railsTitle')}
        </h2>
        <div
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
          data-testid="wallet-redeem-rail-grid"
        >
          {engine.rails.map((rail) => (
            <DepositPaymentMethodCard
              key={rail.id}
              titleKey={rail.titleKey}
              descriptionKey={rail.descriptionKey}
              metaKey={rail.metaKey}
              href={rail.href}
              icon={RAIL_ICONS[rail.id]}
              disabled={rail.disabled}
              ctaKey={rail.ctaKey}
              testId={`wallet-redeem-rail-${rail.id}`}
            />
          ))}
        </div>
      </section>

      <a
        href="/ledger"
        className={cn(buttonVariants({ variant: 'outline', size: 'md' }), 'w-full sm:w-auto')}
        data-testid="wallet-redeem-ledger-link"
      >
        {t('wallet.activity.viewAll')}
      </a>
    </div>
  );
}
