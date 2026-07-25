import { useEffect } from 'react';

import { AlertTriangle, ArrowLeft, Banknote, CheckCircle2, Circle, RefreshCw } from 'lucide-react';

import { useKrwWithdrawController } from '@/features/wallet/use-krw-withdraw-controller';

import { useI18n, useT } from '@/product/i18n';

import { Button, buttonVariants } from '@/product/primitives/button';

import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/product/primitives/dialog';

import { HowItWorks } from '@/product/primitives/how-it-works';

import { Input } from '@/product/primitives/input';

import { MoneyDisplay } from '@/product/primitives/money-display';

import { Skeleton } from '@/product/primitives/skeleton';

import { cn } from '@/product/primitives/lib/cn';

import { WalletWithdrawTierLimitsCard } from './wallet-withdraw-tier-limits-card';

function KrwWithdrawLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="krw-withdraw-loading">
      <Skeleton className="h-8 w-1/3" />

      <Skeleton className="h-24 w-full" />

      <Skeleton className="h-11 w-full" />

      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function RateRow({
  label,

  rate,

  capturedAt,
}: {
  label: string;

  rate: string | null | undefined;

  capturedAt: string | null;
}) {
  const t = useT();

  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
      <span className="text-foreground-muted text-sm">{label}</span>

      <div className="text-end">
        {rate ? (
          <span className="text-foreground tabular-nums text-sm font-medium">{rate} KRW</span>
        ) : (
          <span className="text-foreground-muted text-sm">—</span>
        )}

        {capturedAt ? (
          <p className="text-foreground-muted m-0 text-xs">
            {t('wallet.withdraw.krw.rateCapturedAt', { time: capturedAt })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function WithdrawTimeline({
  steps,
}: {
  steps: ReturnType<typeof useKrwWithdrawController>['timelineSteps'];
}) {
  const t = useT();

  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0" data-testid="krw-withdraw-timeline">
      {steps.map((step) => (
        <li key={step.id} className="flex gap-3" data-testid={`krw-withdraw-timeline-${step.id}`}>
          {step.state === 'done' ? (
            <CheckCircle2 className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
          ) : (
            <Circle
              className={cn(
                'mt-0.5 size-5 shrink-0',

                step.state === 'active' ? 'text-accent' : 'text-foreground-muted',
              )}
              aria-hidden
            />
          )}

          <div className="min-w-0">
            <p className="text-foreground m-0 text-sm font-medium">{t(step.labelKey)}</p>

            {step.detailKey ? (
              <p className="text-foreground-muted m-0 text-xs">
                {t(step.detailKey, step.detailParams ?? {})}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Canonical `/wallet/withdraw/krw` — L3 bank rail · §30.3 PHON→KRW auto-convert disclosure (P4·W3). */

export function KrwWithdrawPage() {
  const t = useT();

  const { locale } = useI18n();

  const engine = useKrwWithdrawController(locale);

  useEffect(() => {
    document.title = t('seo.walletWithdrawKrw.title');
  }, [t]);

  if (engine.loading) {
    return <KrwWithdrawLoadingShell />;
  }

  const normalizedAmount = engine.amountPhon;

  return (
    <div className="flex flex-col gap-ds-8 py-4 pb-28 md:py-6 md:pb-6" data-testid="krw-withdraw-page">
      <header className="space-y-3">
        <a
          href="/wallet/withdraw"
          className="text-foreground-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />

          {t('wallet.withdraw.krw.back')}
        </a>

        <div className="space-y-1">
          <h1 className="text-foreground m-0 flex items-center gap-2 text-2xl font-semibold md:text-3xl">
            <Banknote className="text-accent size-7 shrink-0" aria-hidden />

            {t('wallet.withdraw.title')}
          </h1>

          <p className="text-foreground-muted m-0 text-sm">{t('wallet.phon.withdrawRealOnly')}</p>
        </div>
      </header>

      <HowItWorks
        persistenceId="wallet-withdraw-krw"
        stepKeys={[
          'wallet.withdraw.krw.howItWorks.step1',

          'wallet.withdraw.krw.howItWorks.step2',

          'wallet.withdraw.krw.howItWorks.step3',
        ]}
        titleKey="wallet.withdraw.krw.howItWorks.title"
      />

      {engine.withdrawalBlocked ? (
        <div
          className="border-warning/30 bg-warning/10 rounded-(--ds-radius-lg) border p-4"
          data-testid="krw-withdraw-paused"
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
          className="border-line bg-surface-raised rounded-(--ds-radius-lg) border p-4"
          data-testid="krw-withdraw-kyc-lock"
          role="status"
        >
          <p className="text-foreground m-0 text-sm font-medium">
            {t('wallet.withdraw.kycLockTitle')}
          </p>

          <p className="text-foreground-muted m-0 mt-1 text-sm">
            {t('wallet.withdraw.kycLockDesc')}
          </p>

          <a
            href="/account/kyc"
            className={cn(buttonVariants({ variant: 'outline', size: 'md' }), 'mt-3 inline-flex')}
          >
            {t('wallet.withdraw.kycCta')}
          </a>
        </div>
      ) : null}

      {engine.submitted && engine.submitResult ? (
        <section className="flex flex-col gap-4" data-testid="krw-withdraw-success">
          <div
            className="border-accent/30 bg-accent/10 rounded-(--ds-radius-lg) border p-4"
            role="status"
          >
            <p className="text-foreground m-0 text-sm font-medium">
              {t('wallet.withdraw.success')}
            </p>
          </div>

          <Card data-testid="krw-withdraw-expected-krw-card">
            <CardBody className="flex flex-col gap-2">
              <p className="text-foreground-muted m-0 text-sm">{t('wallet.withdraw.previewKrw')}</p>

              <MoneyDisplay
                amount={engine.submitResult.expected_krw}
                currency="KRW"
                showCurrency
                className="text-foreground text-xl font-semibold"
              />

              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.withdraw.rateFallback')}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-col gap-2">
              <p className="text-foreground-muted m-0 text-sm">
                {t('wallet.withdraw.confirmAmount')}
              </p>

              <MoneyDisplay
                amount={normalizedAmount || '0'}
                currency="PHON"
                showCurrency
                className="text-foreground text-lg font-semibold"
              />

              <p className="text-foreground-muted m-0 text-xs">{t('wallet.withdraw.krw.note')}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('wallet.withdraw.timeline.review')}</CardTitle>
            </CardHeader>

            <CardBody className="pt-0">
              <WithdrawTimeline steps={engine.timelineSteps} />
            </CardBody>
          </Card>

          <a
            href="/wallet/withdraw"
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full sm:w-auto')}
          >
            {t('wallet.withdraw.krw.back')}
          </a>
        </section>
      ) : (
        <section className="flex flex-col gap-4" data-testid="krw-withdraw-form">
          <p className="text-foreground m-0 text-sm" data-testid="krw-withdraw-auto-convert">
            {t('wallet.withdraw.krw.autoConvert')}
          </p>

          <p className="text-foreground-muted m-0 text-xs">{t('wallet.withdraw.krw.note')}</p>

          <WalletWithdrawTierLimitsCard tierLimits={engine.tierLimits} />

          {engine.phonKrwRateStale ? (
            <div
              className="border-warning/30 bg-warning/10 flex flex-col gap-2 rounded-(--ds-radius-lg) border p-4 sm:flex-row sm:items-center sm:justify-between"
              data-testid="krw-withdraw-rate-stale"
              role="status"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />

                <p className="text-foreground m-0 text-sm">
                  {t('wallet.withdraw.krw.rateStaleRefresh')}
                </p>
              </div>

              <Button type="button" variant="outline" size="sm" onClick={engine.refreshRates}>
                <RefreshCw className="size-4" aria-hidden />

                {t('common.retry')}
              </Button>
            </div>
          ) : null}

          {engine.phonKrwRateUnavailable ? (
            <div
              className="border-danger/30 bg-danger/10 rounded-(--ds-radius-lg) border p-4"
              data-testid="krw-withdraw-rate-unavailable"
              role="alert"
            >
              <p className="text-foreground m-0 text-sm">{t('wallet.withdraw.rateUnavailable')}</p>
            </div>
          ) : null}

          <Card data-testid="krw-withdraw-rate-card">
            <CardHeader>
              <CardTitle>{t('wallet.activity.rateSnapshot')}</CardTitle>
            </CardHeader>

            <CardBody className="flex flex-col gap-3 pt-0">
              <RateRow
                label={t('wallet.withdraw.krw.phonKrwRate')}
                rate={engine.phonKrwRate?.rate}
                capturedAt={engine.phonKrwRateCapturedDisplay}
              />
            </CardBody>
          </Card>

          {engine.phonRealAvailableDisplay ? (
            <p className="text-foreground-muted m-0 text-sm" data-testid="krw-withdraw-available">
              {t('wallet.withdraw.krw.available', { amount: engine.phonRealAvailableDisplay })}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <label htmlFor="krw-withdraw-amount" className="text-foreground text-sm font-medium">
              {t('wallet.withdraw.amountLabel')}
            </label>

            <Input
              id="krw-withdraw-amount"
              inputMode="decimal"
              autoComplete="off"
              value={normalizedAmount}
              onChange={(event) => engine.setAmountPhon(event.target.value)}
              disabled={engine.withdrawalBlocked || !engine.withdrawalReady}
              data-testid="krw-withdraw-amount-input"
              aria-invalid={engine.amountGateKey !== null || engine.balanceGateKey !== null}
            />

            {engine.amountGateKey ? (
              <p className="text-danger m-0 text-xs" role="alert">
                {t(engine.amountGateKey)}
              </p>
            ) : null}

            {engine.balanceGateKey ? (
              <p className="text-danger m-0 text-xs" role="alert">
                {t(engine.balanceGateKey)}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="krw-withdraw-account" className="text-foreground text-sm font-medium">
              {t('wallet.withdraw.accountLabel')}
            </label>

            <Input
              id="krw-withdraw-account"
              inputMode="numeric"
              autoComplete="off"
              value={engine.bankAccount}
              onChange={(event) => engine.setBankAccount(event.target.value)}
              disabled={engine.withdrawalBlocked || !engine.withdrawalReady}
              placeholder={t('wallet.withdraw.accountPlaceholder')}
              data-testid="krw-withdraw-account-input"
              aria-invalid={engine.accountGateKey !== null}
            />

            {engine.accountGateKey ? (
              <p className="text-danger m-0 text-xs" role="alert">
                {t(engine.accountGateKey)}
              </p>
            ) : null}
          </div>

          {engine.rateGateKey ? (
            <p className="text-danger m-0 text-sm" role="alert">
              {t(engine.rateGateKey)}
            </p>
          ) : null}

          <p className="text-foreground-muted m-0 text-xs">
            {t('wallet.withdraw.confirmFeeAtProcessing')}
          </p>

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!engine.canOpenConfirm || engine.withdrawalBlocked || !engine.withdrawalReady}
            onClick={engine.openConfirm}
            data-testid="krw-withdraw-submit"
          >
            {t('wallet.withdraw.submit')}
          </Button>
        </section>
      )}

      <Dialog open={engine.confirmOpen} onOpenChange={(open) => !open && engine.closeConfirm()}>
        <DialogContent data-testid="krw-withdraw-confirm-dialog">
          <DialogHeader>
            <DialogTitle>{t('wallet.withdraw.confirmTitle')}</DialogTitle>

            <DialogDescription>{t('wallet.withdraw.confirmDesc')}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <p className="text-foreground m-0 text-sm">{t('wallet.withdraw.krw.autoConvert')}</p>

            <div className="border-line rounded-(--ds-radius-md) border p-3">
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.withdraw.confirmAmount')}
              </p>

              <MoneyDisplay
                amount={normalizedAmount || '0'}
                currency="PHON"
                showCurrency
                className="text-foreground text-lg font-semibold"
              />
            </div>

            <div
              className="border-line rounded-(--ds-radius-md) border p-3"
              data-testid="krw-withdraw-confirm-rate"
            >
              <RateRow
                label={t('wallet.withdraw.krw.phonKrwRate')}
                rate={engine.phonKrwRate?.rate}
                capturedAt={engine.phonKrwRateCapturedDisplay}
              />
            </div>

            <div className="border-line rounded-(--ds-radius-md) border p-3">
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.withdraw.confirmBankAccount')}
              </p>

              <p className="text-foreground m-0 font-mono text-sm font-medium">
                {engine.bankAccount || '—'}
              </p>
            </div>

            {engine.submitResult ? (
              <div
                className="border-accent/30 bg-accent/5 rounded-(--ds-radius-md) border p-3"
                data-testid="krw-withdraw-confirm-expected-krw"
              >
                <p className="text-foreground-muted m-0 text-xs">
                  {t('wallet.withdraw.confirmExpectedKrw')}
                </p>

                <MoneyDisplay
                  amount={engine.submitResult.expected_krw}
                  currency="KRW"
                  showCurrency
                  className="text-foreground text-lg font-semibold"
                />

                <p className="text-foreground-muted m-0 mt-1 text-xs">
                  {t('wallet.withdraw.rateFallback')}
                </p>
              </div>
            ) : (
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.withdraw.rateFallback')}
              </p>
            )}

            <p className="text-foreground-muted m-0 text-xs">
              <span className="text-foreground font-medium">
                {t('wallet.withdraw.confirmWarningLabel')}:{' '}
              </span>

              {t('wallet.withdraw.confirmIrreversibleWarning')}
            </p>

            {engine.submitErrorKey ? (
              <p className="text-danger m-0 text-sm" role="alert">
                {t(engine.submitErrorKey)}
              </p>
            ) : null}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {engine.submitResult ? (
              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={!engine.canAcknowledge}
                onClick={engine.acknowledgeSubmitted}
                data-testid="krw-withdraw-acknowledge"
              >
                {t('common.confirm')}
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={!engine.canSubmit}
                onClick={() => void engine.submitWithdraw()}
                data-testid="krw-withdraw-confirm-proceed"
              >
                {engine.submitting ? t('common.processing') : t('wallet.withdraw.confirmProceed')}
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={engine.submitting}
              onClick={engine.closeConfirm}
            >
              {t('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
