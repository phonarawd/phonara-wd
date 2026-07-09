import { useEffect } from 'react';
import { AlertTriangle, ArrowLeft, Banknote, CheckCircle2, Circle, RefreshCw } from 'lucide-react';

import { useKrwDepositController } from '@/features/wallet/use-krw-deposit-controller';
import { KRW_DEPOSIT_CHIP_KEYS } from '@/features/wallet/krw-deposit-page-display';
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

function KrwDepositLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="krw-deposit-loading">
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
            {t('wallet.deposit.krw.rateCapturedAt', { time: capturedAt })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function DepositTimeline({
  steps,
}: {
  steps: ReturnType<typeof useKrwDepositController>['timelineSteps'];
}) {
  const t = useT();

  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0" data-testid="krw-deposit-timeline">
      {steps.map((step) => (
        <li key={step.id} className="flex gap-3" data-testid={`krw-deposit-timeline-${step.id}`}>
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

/** Canonical `/wallet/deposit/krw` — L3 bank rail · §30.3 PHON auto-convert disclosure (P4·W3). */
export function KrwDepositPage() {
  const t = useT();
  const { locale } = useI18n();
  const engine = useKrwDepositController(locale);

  useEffect(() => {
    document.title = t('seo.walletDepositKrw.title');
  }, [t]);

  if (engine.loading) {
    return <KrwDepositLoadingShell />;
  }

  const normalizedAmount = engine.amountKrw;

  return (
    <div
      className="flex flex-col gap-6 py-4 pb-28 md:py-6 md:pb-6"
      data-testid="krw-deposit-page"
    >
      <header className="space-y-3">
        <a
          href="/wallet/deposit"
          className="text-foreground-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('wallet.deposit.krw.back')}
        </a>
        <div className="space-y-1">
          <h1 className="text-foreground m-0 flex items-center gap-2 text-2xl font-semibold md:text-3xl">
            <Banknote className="text-accent size-7 shrink-0" aria-hidden />
            {t('wallet.deposit.title')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm">{t('wallet.deposit.subtitle')}</p>
        </div>
      </header>

      <HowItWorks
        persistenceId="wallet-deposit-krw"
        stepKeys={[
          'wallet.deposit.krw.howItWorks.step1',
          'wallet.deposit.krw.howItWorks.step2',
          'wallet.deposit.krw.howItWorks.step3',
        ]}
        titleKey="wallet.deposit.krw.howItWorks.title"
      />

      {engine.depositBlocked ? (
        <div
          className="border-warning/30 bg-warning/10 rounded-(--ds-radius-lg) border p-4"
          data-testid="krw-deposit-paused"
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

      {engine.submitted && engine.submitResult ? (
        <section className="flex flex-col gap-4" data-testid="krw-deposit-success">
          <div
            className="border-accent/30 bg-accent/10 rounded-(--ds-radius-lg) border p-4"
            role="status"
          >
            <p className="text-foreground m-0 text-sm font-medium">{t('wallet.deposit.success')}</p>
            <p className="text-foreground-muted m-0 mt-1 text-sm">
              {t('wallet.transaction.success.depositDesc')}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('wallet.deposit.referenceCode')}</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-3 pt-0">
              <p
                className="text-foreground m-0 font-mono text-lg font-semibold tracking-wider"
                data-testid="krw-deposit-reference-code"
              >
                {engine.submitResult.reference_code}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void engine.copyReference(engine.submitResult!.reference_code)}
                >
                  {engine.copyState === 'ok'
                    ? t('wallet.deposit.copyOk')
                    : engine.copyState === 'failed'
                      ? t('wallet.deposit.copyFailed')
                      : t('wallet.deposit.copyCode')}
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card data-testid="krw-deposit-expected-phon-card">
            <CardBody className="flex flex-col gap-2">
              <p className="text-foreground-muted m-0 text-sm">
                {t('wallet.deposit.expectedPhon')}
              </p>
              <MoneyDisplay
                amount={engine.submitResult.expected_phon}
                currency="PHON"
                showCurrency
                className="text-foreground text-xl font-semibold"
              />
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.deposit.rateFallback')}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-col gap-2">
              <p className="text-foreground-muted m-0 text-sm">
                {t('wallet.deposit.confirmBankAccount')}
              </p>
              <p className="text-foreground m-0 text-sm font-medium">
                {t('wallet.deposit.bankAccountDisplay')}
              </p>
              <p className="text-foreground-muted m-0 text-xs">{t('wallet.deposit.bankWarning')}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('wallet.deposit.timeline.pending')}</CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <DepositTimeline steps={engine.timelineSteps} />
            </CardBody>
          </Card>

          <a
            href="/wallet/deposit"
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full sm:w-auto')}
          >
            {t('wallet.deposit.krw.back')}
          </a>
        </section>
      ) : (
        <section className="flex flex-col gap-4" data-testid="krw-deposit-form">
          <p className="text-foreground m-0 text-sm" data-testid="krw-deposit-auto-convert">
            {t('wallet.deposit.krw.autoConvert')}
          </p>
          <p className="text-foreground-muted m-0 text-xs" data-testid="krw-deposit-no-limit">
            {t('wallet.deposit.krw.noLimit')}
          </p>

          {engine.phonKrwRateStale ? (
            <div
              className="border-warning/30 bg-warning/10 flex flex-col gap-2 rounded-(--ds-radius-lg) border p-4 sm:flex-row sm:items-center sm:justify-between"
              data-testid="krw-deposit-rate-stale"
              role="status"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />
                <p className="text-foreground m-0 text-sm">
                  {t('wallet.deposit.krw.rateStaleRefresh')}
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
              data-testid="krw-deposit-rate-unavailable"
              role="alert"
            >
              <p className="text-foreground m-0 text-sm">{t('wallet.deposit.rateUnavailable')}</p>
            </div>
          ) : null}

          <Card data-testid="krw-deposit-rate-card">
            <CardHeader>
              <CardTitle>{t('wallet.activity.rateSnapshot')}</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-3 pt-0">
              <RateRow
                label={t('wallet.deposit.krw.phonKrwRate')}
                rate={engine.phonKrwRate?.rate}
                capturedAt={engine.phonKrwRateCapturedDisplay}
              />
              <RateRow
                label={t('wallet.deposit.krw.usdtKrwRate')}
                rate={engine.usdtKrwRate?.rate}
                capturedAt={engine.usdtKrwRateCapturedDisplay}
              />
            </CardBody>
          </Card>

          <div className="flex flex-col gap-2">
            <label htmlFor="krw-deposit-amount" className="text-foreground text-sm font-medium">
              {t('wallet.deposit.amountLabel')}
            </label>
            <Input
              id="krw-deposit-amount"
              inputMode="numeric"
              autoComplete="off"
              value={normalizedAmount}
              onChange={(event) => engine.setAmountKrw(event.target.value)}
              disabled={engine.depositBlocked}
              data-testid="krw-deposit-amount-input"
              aria-invalid={engine.amountGateKey !== null}
            />
            {engine.amountGateKey ? (
              <p className="text-danger m-0 text-xs" role="alert">
                {t(engine.amountGateKey)}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {engine.chipAmounts.map((chip, index) => (
                <Button
                  key={chip}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={engine.depositBlocked}
                  onClick={() => engine.addChip(chip)}
                >
                  {t(KRW_DEPOSIT_CHIP_KEYS[index]!)}
                </Button>
              ))}
            </div>
          </div>

          {engine.rateGateKey ? (
            <p className="text-danger m-0 text-sm" role="alert">
              {t(engine.rateGateKey)}
            </p>
          ) : null}

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!engine.canOpenConfirm || engine.depositBlocked}
            onClick={engine.openConfirm}
            data-testid="krw-deposit-submit"
          >
            {t('wallet.deposit.submit')}
          </Button>
        </section>
      )}

      <Dialog open={engine.confirmOpen} onOpenChange={(open) => !open && engine.closeConfirm()}>
        <DialogContent data-testid="krw-deposit-confirm-dialog">
          <DialogHeader>
            <DialogTitle>{t('wallet.deposit.confirmTitle')}</DialogTitle>
            <DialogDescription>{t('wallet.deposit.confirmDesc')}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <p className="text-foreground m-0 text-sm">{t('wallet.deposit.krw.autoConvert')}</p>

            <div className="border-line rounded-(--ds-radius-md) border p-3">
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.deposit.confirmAmount')}
              </p>
              <MoneyDisplay
                amount={normalizedAmount || '0'}
                currency="KRW"
                showCurrency
                className="text-foreground text-lg font-semibold"
              />
            </div>

            <div
              className="border-line rounded-(--ds-radius-md) border p-3"
              data-testid="krw-deposit-confirm-rate"
            >
              <RateRow
                label={t('wallet.deposit.krw.phonKrwRate')}
                rate={engine.phonKrwRate?.rate}
                capturedAt={engine.phonKrwRateCapturedDisplay}
              />
            </div>

            {engine.submitResult ? (
              <div
                className="border-accent/30 bg-accent/5 rounded-(--ds-radius-md) border p-3"
                data-testid="krw-deposit-confirm-expected-phon"
              >
                <p className="text-foreground-muted m-0 text-xs">
                  {t('wallet.deposit.confirmExpectedPhon')}
                </p>
                <MoneyDisplay
                  amount={engine.submitResult.expected_phon}
                  currency="PHON"
                  showCurrency
                  className="text-foreground text-lg font-semibold"
                />
                <p className="text-foreground-muted m-0 mt-1 text-xs">
                  {t('wallet.deposit.rateFallback')}
                </p>
              </div>
            ) : (
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.deposit.rateFallback')}
              </p>
            )}

            <div className="border-line rounded-(--ds-radius-md) border p-3">
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.deposit.confirmBankAccount')}
              </p>
              <p className="text-foreground m-0 text-sm font-medium">
                {t('wallet.deposit.bankAccountDisplay')}
              </p>
            </div>

            <p className="text-foreground-muted m-0 text-xs">
              <span className="text-foreground font-medium">
                {t('wallet.deposit.confirmWarningLabel')}:{' '}
              </span>
              {t('wallet.deposit.confirmWarning')}
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
                data-testid="krw-deposit-acknowledge"
              >
                {t('common.confirm')}
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={!engine.canSubmit}
                onClick={() => void engine.submitDeposit()}
                data-testid="krw-deposit-confirm-proceed"
              >
                {engine.submitting ? t('common.processing') : t('wallet.deposit.confirmProceed')}
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
