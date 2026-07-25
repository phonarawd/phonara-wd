import { useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Circle, Coins, RefreshCw } from 'lucide-react';

import { useCryptoDepositController } from '@/features/wallet/use-crypto-deposit-controller';
import { useT } from '@/product/i18n';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/product/primitives/select';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

function CryptoDepositLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="crypto-deposit-loading">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function DepositTimeline({
  steps,
}: {
  steps: ReturnType<typeof useCryptoDepositController>['timelineSteps'];
}) {
  const t = useT();

  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0" data-testid="crypto-deposit-timeline">
      {steps.map((step) => (
        <li key={step.id} className="flex gap-3" data-testid={`crypto-deposit-timeline-${step.id}`}>
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

/** Canonical `/wallet/deposit/crypto` — USDT single rail (TRC20·ERC20) · P4·W3. */
export function CryptoDepositPage() {
  const t = useT();
  const engine = useCryptoDepositController();

  useEffect(() => {
    document.title = t('seo.walletDepositCrypto.title');
  }, [t]);

  if (engine.loading) {
    return <CryptoDepositLoadingShell />;
  }

  const normalizedAmount = engine.amountUsdt;

  return (
    <div className="flex flex-col gap-ds-8 py-4 md:py-6" data-testid="crypto-deposit-page">
      <header className="space-y-3">
        <a
          href="/wallet/deposit"
          className="text-foreground-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('wallet.deposit.crypto.back')}
        </a>
        <div className="space-y-1">
          <h1 className="text-foreground m-0 flex items-center gap-2 text-2xl font-semibold md:text-3xl">
            <Coins className="text-accent size-7 shrink-0" aria-hidden />
            {t('wallet.deposit.rail.crypto')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm">
            {t('wallet.deposit.rail.crypto.desc')}
          </p>
        </div>
      </header>

      <HowItWorks
        persistenceId="wallet-deposit-crypto"
        stepKeys={[
          'wallet.crypto.deposit.howItWorks.step1',
          'wallet.crypto.deposit.howItWorks.step2',
          'wallet.crypto.deposit.howItWorks.step3',
        ]}
        titleKey="wallet.crypto.deposit.howItWorks.title"
      />

      {engine.depositBlocked ? (
        <div
          className="border-warning/30 bg-warning/10 rounded-(--ds-radius-lg) border p-4"
          data-testid="crypto-deposit-paused"
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
        <section className="flex flex-col gap-4" data-testid="crypto-deposit-success">
          <div
            className="border-accent/30 bg-accent/10 rounded-(--ds-radius-lg) border p-4"
            role="status"
          >
            <p className="text-foreground m-0 text-sm font-medium">
              {t('wallet.crypto.deposit.success')}
            </p>
            <p className="text-foreground-muted m-0 mt-1 text-sm">
              {t('wallet.crypto.deposit.guide')}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('wallet.crypto.deposit.confirmAmount')}</CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <div data-testid="crypto-deposit-success-amount">
                <MoneyDisplay
                  amount={engine.submitResult.amount}
                  currency="USDT"
                  showCurrency
                  className="text-foreground text-xl font-semibold"
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('wallet.crypto.deposit.confirmNetwork')}</CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <p
                className="text-foreground m-0 text-sm font-medium"
                data-testid="crypto-deposit-success-chain"
              >
                {engine.submitResult.chain}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('wallet.crypto.deposit.addressLabel')}</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-3 pt-0">
              <p
                className="text-foreground m-0 break-all font-mono text-sm font-medium"
                data-testid="crypto-deposit-success-address"
              >
                {engine.submitResult.address}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void engine.copyAddress(engine.submitResult!.address)}
              >
                {engine.copyState === 'ok'
                  ? t('wallet.deposit.crypto.addressCopied')
                  : engine.copyState === 'failed'
                    ? t('wallet.deposit.copyFailed')
                    : t('wallet.crypto.deposit.copyAddress')}
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('wallet.crypto.deposit.pending')}</CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <DepositTimeline steps={engine.timelineSteps} />
            </CardBody>
          </Card>

          <a
            href="/wallet/deposit"
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full sm:w-auto')}
          >
            {t('wallet.deposit.crypto.back')}
          </a>
        </section>
      ) : (
        <section className="flex flex-col gap-4" data-testid="crypto-deposit-form">
          <p className="text-foreground m-0 text-sm">{t('wallet.crypto.deposit.steps')}</p>
          <p className="text-foreground-muted m-0 text-xs" data-testid="crypto-deposit-no-limit">
            {t('wallet.deposit.crypto.noLimit')}
          </p>

          <div className="flex flex-col gap-2">
            <label htmlFor="crypto-deposit-network" className="text-foreground text-sm font-medium">
              {t('wallet.deposit.crypto.network')}
            </label>
            <Select
              value={engine.chain}
              onValueChange={(value) => engine.setChain(value as typeof engine.chain)}
              disabled={engine.depositBlocked}
            >
              <SelectTrigger id="crypto-deposit-network" data-testid="crypto-deposit-network">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {engine.chains.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p
              className="text-foreground-muted m-0 text-xs"
              data-testid="crypto-deposit-network-hint"
            >
              {t(engine.chainHintKey)}
            </p>
          </div>

          <Card data-testid="crypto-deposit-address-card">
            <CardHeader>
              <CardTitle>{t('wallet.crypto.deposit.addressLabel')}</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-3 pt-0">
              {engine.addressLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : engine.address ? (
                <>
                  <p
                    className="text-foreground m-0 break-all font-mono text-sm font-medium"
                    data-testid="crypto-deposit-address"
                  >
                    {engine.address}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void engine.copyAddress(engine.address!)}
                  >
                    {engine.copyState === 'ok'
                      ? t('wallet.deposit.crypto.addressCopied')
                      : engine.copyState === 'failed'
                        ? t('wallet.deposit.copyFailed')
                        : t('wallet.crypto.deposit.copyAddress')}
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-foreground-muted m-0 text-sm" role="alert">
                    {engine.addressErrorKey ? t(engine.addressErrorKey) : t('common.loading')}
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={engine.refreshAddress}>
                    <RefreshCw className="size-4" aria-hidden />
                    {t('common.retry')}
                  </Button>
                </div>
              )}
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.crypto.deposit.guide')}
              </p>
            </CardBody>
          </Card>

          <div className="flex flex-col gap-2">
            <label htmlFor="crypto-deposit-amount" className="text-foreground text-sm font-medium">
              {t('wallet.crypto.deposit.amountLabel')}
            </label>
            <Input
              id="crypto-deposit-amount"
              inputMode="decimal"
              autoComplete="off"
              value={normalizedAmount}
              onChange={(event) => engine.setAmountUsdt(event.target.value)}
              disabled={engine.depositBlocked}
              data-testid="crypto-deposit-amount-input"
              aria-invalid={engine.amountGateKey !== null}
            />
            {engine.amountGateKey ? (
              <p className="text-danger m-0 text-xs" role="alert">
                {t(engine.amountGateKey)}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!engine.canOpenConfirm || engine.depositBlocked}
            onClick={engine.openConfirm}
            data-testid="crypto-deposit-submit"
          >
            {t('wallet.crypto.deposit.submit')}
          </Button>
        </section>
      )}

      <Dialog open={engine.confirmOpen} onOpenChange={(open) => !open && engine.closeConfirm()}>
        <DialogContent data-testid="crypto-deposit-confirm-dialog">
          <DialogHeader>
            <DialogTitle>{t('wallet.crypto.deposit.confirmTitle')}</DialogTitle>
            <DialogDescription>{t('wallet.crypto.deposit.confirmDesc')}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="border-line rounded-(--ds-radius-md) border p-3">
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.crypto.deposit.confirmAmount')}
              </p>
              <MoneyDisplay
                amount={normalizedAmount || '0'}
                currency="USDT"
                showCurrency
                className="text-foreground text-lg font-semibold"
              />
            </div>

            <div className="border-line rounded-(--ds-radius-md) border p-3">
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.crypto.deposit.confirmNetwork')}
              </p>
              <p className="text-foreground m-0 text-sm font-medium">{engine.chain}</p>
              <p className="text-foreground-muted m-0 mt-1 text-xs">{t(engine.chainHintKey)}</p>
            </div>

            <div
              className="border-line rounded-(--ds-radius-md) border p-3"
              data-testid="crypto-deposit-confirm-address"
            >
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.crypto.deposit.confirmAddress')}
              </p>
              <p className="text-foreground m-0 break-all font-mono text-sm font-medium">
                {engine.address ?? '—'}
              </p>
            </div>

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
                data-testid="crypto-deposit-acknowledge"
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
                data-testid="crypto-deposit-confirm-proceed"
              >
                {engine.submitting
                  ? t('common.processing')
                  : t('wallet.crypto.deposit.confirmProceed')}
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
