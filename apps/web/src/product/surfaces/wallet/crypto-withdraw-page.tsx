import { useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Circle, Coins } from 'lucide-react';

import { useCryptoWithdrawController } from '@/features/wallet/use-crypto-withdraw-controller';
import { isPositiveAmount } from '@/lib/money-display';
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

import { WalletWithdrawTierLimitsCard } from './wallet-withdraw-tier-limits-card';

function CryptoWithdrawLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="crypto-withdraw-loading">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function WithdrawTimeline({
  steps,
}: {
  steps: ReturnType<typeof useCryptoWithdrawController>['timelineSteps'];
}) {
  const t = useT();

  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0" data-testid="crypto-withdraw-timeline">
      {steps.map((step) => (
        <li
          key={step.id}
          className="flex gap-3"
          data-testid={`crypto-withdraw-timeline-${step.id}`}
        >
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

/** Canonical `/wallet/withdraw/crypto` — USDT single rail (TRC20·ERC20) · §30.3 net preview · P4·W4. */
export function CryptoWithdrawPage() {
  const t = useT();
  const engine = useCryptoWithdrawController();

  useEffect(() => {
    document.title = t('seo.walletWithdrawCrypto.title');
  }, [t]);

  if (engine.loading) {
    return <CryptoWithdrawLoadingShell />;
  }

  const normalizedAmount = engine.amountUsdt;
  const previewNet = engine.submitResult?.estimated_net_usdt ?? engine.estimatedNetUsdt ?? '0';

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6" data-testid="crypto-withdraw-page">
      <header className="space-y-3">
        <a
          href="/wallet/withdraw"
          className="text-foreground-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('wallet.crypto.withdraw.back')}
        </a>
        <div className="space-y-1">
          <h1 className="text-foreground m-0 flex items-center gap-2 text-2xl font-semibold md:text-3xl">
            <Coins className="text-accent size-7 shrink-0" aria-hidden />
            {t('wallet.withdraw.rail.crypto')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm">
            {t('wallet.withdraw.rail.crypto.desc')}
          </p>
        </div>
      </header>

      <HowItWorks
        persistenceId="wallet-withdraw-crypto"
        stepKeys={[
          'wallet.crypto.withdraw.howItWorks.step1',
          'wallet.crypto.withdraw.howItWorks.step2',
          'wallet.crypto.withdraw.howItWorks.step3',
        ]}
        titleKey="wallet.crypto.withdraw.howItWorks.title"
      />

      {engine.showPriorityCopy ? (
        <div
          className="border-accent/30 bg-accent/10 rounded-(--ds-radius-lg) border p-4"
          data-testid="crypto-withdraw-priority-copy"
          role="status"
        >
          <p className="text-foreground m-0 text-sm">{t('wallet.crypto.withdraw.priorityCopy')}</p>
        </div>
      ) : null}

      {engine.withdrawalBlocked ? (
        <div
          className="border-warning/30 bg-warning/10 rounded-(--ds-radius-lg) border p-4"
          data-testid="crypto-withdraw-paused"
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
          data-testid="crypto-withdraw-kyc-lock"
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
        <section className="flex flex-col gap-4" data-testid="crypto-withdraw-success">
          <div
            className="border-accent/30 bg-accent/10 rounded-(--ds-radius-lg) border p-4"
            role="status"
          >
            <p className="text-foreground m-0 text-sm font-medium">
              {t('wallet.crypto.withdraw.success')}
            </p>
            <p className="text-foreground-muted m-0 mt-1 text-sm">
              {t('wallet.crypto.withdraw.guide')}
            </p>
          </div>

          <Card data-testid="crypto-withdraw-expected-net-card">
            <CardBody className="flex flex-col gap-2">
              <p className="text-foreground-muted m-0 text-sm">
                {t('wallet.crypto.withdraw.previewNet')}
              </p>
              <MoneyDisplay
                amount={engine.submitResult.estimated_net_usdt}
                currency="USDT"
                showCurrency
                className="text-foreground text-xl font-semibold"
              />
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.withdraw.confirmNetAtProcessing')}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-col gap-2">
              <p className="text-foreground-muted m-0 text-sm">
                {t('wallet.crypto.withdraw.confirmAmount')}
              </p>
              <MoneyDisplay
                amount={engine.submitResult.amount_usdt}
                currency="USDT"
                showCurrency
                className="text-foreground text-lg font-semibold"
              />
              <p className="text-foreground-muted m-0 text-xs">{t(engine.feeHintKey)}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('wallet.crypto.withdraw.confirmNetwork')}</CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <p className="text-foreground m-0 text-sm font-medium">{engine.submitResult.chain}</p>
              <p
                className="text-foreground m-0 mt-2 break-all font-mono text-sm"
                data-testid="crypto-withdraw-success-address"
              >
                {engine.submitResult.address}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('wallet.crypto.withdraw.timeline.review')}</CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <WithdrawTimeline steps={engine.timelineSteps} />
            </CardBody>
          </Card>

          <a
            href="/wallet/withdraw"
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full sm:w-auto')}
          >
            {t('wallet.crypto.withdraw.back')}
          </a>
        </section>
      ) : (
        <section className="flex flex-col gap-4" data-testid="crypto-withdraw-form">
          <p className="text-foreground m-0 text-sm">{t('wallet.crypto.withdraw.steps')}</p>
          <p className="text-foreground-muted m-0 text-xs" data-testid="crypto-withdraw-note">
            {t('wallet.withdraw.crypto.note')}
          </p>

          <WalletWithdrawTierLimitsCard tierLimits={engine.tierLimits} />

          <div className="flex flex-col gap-2">
            <label
              htmlFor="crypto-withdraw-network"
              className="text-foreground text-sm font-medium"
            >
              {t('wallet.crypto.withdraw.confirmNetwork')}
            </label>
            <Select
              value={engine.chain}
              onValueChange={(value) => engine.setChain(value as typeof engine.chain)}
              disabled={engine.withdrawalBlocked || !engine.withdrawalReady}
            >
              <SelectTrigger id="crypto-withdraw-network" data-testid="crypto-withdraw-network">
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
              data-testid="crypto-withdraw-network-hint"
            >
              {t(engine.chainHintKey)}
            </p>
            <p className="text-foreground-muted m-0 text-xs">{t(engine.feeHintKey)}</p>
          </div>

          {engine.usdtAvailableDisplay ? (
            <p
              className="text-foreground-muted m-0 text-sm"
              data-testid="crypto-withdraw-available"
            >
              {t('wallet.crypto.withdraw.available', { amount: engine.usdtAvailableDisplay })}
            </p>
          ) : null}

          {engine.whitelistHintVisible ? (
            <p
              className="text-foreground-muted m-0 text-xs"
              data-testid="crypto-withdraw-whitelist-hint"
            >
              {t('wallet.crypto.withdraw.whitelistHint')}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <label htmlFor="crypto-withdraw-amount" className="text-foreground text-sm font-medium">
              {t('wallet.crypto.withdraw.amountLabel')}
            </label>
            <Input
              id="crypto-withdraw-amount"
              inputMode="decimal"
              autoComplete="off"
              value={normalizedAmount}
              onChange={(event) => engine.setAmountUsdt(event.target.value)}
              disabled={engine.withdrawalBlocked || !engine.withdrawalReady}
              data-testid="crypto-withdraw-amount-input"
              aria-invalid={
                engine.amountGateKey !== null ||
                engine.balanceGateKey !== null ||
                engine.netGateKey !== null
              }
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
            {engine.netGateKey ? (
              <p className="text-danger m-0 text-xs" role="alert">
                {t(engine.netGateKey)}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="crypto-withdraw-address"
              className="text-foreground text-sm font-medium"
            >
              {t('wallet.crypto.withdraw.addressLabel')}
            </label>
            <Input
              id="crypto-withdraw-address"
              autoComplete="off"
              value={engine.address}
              onChange={(event) => engine.setAddress(event.target.value)}
              disabled={engine.withdrawalBlocked || !engine.withdrawalReady}
              placeholder={t('wallet.crypto.withdraw.addressPlaceholder')}
              data-testid="crypto-withdraw-address-input"
              aria-invalid={engine.addressGateKey !== null || engine.whitelistGateKey !== null}
            />
            {engine.addressGateKey ? (
              <p className="text-danger m-0 text-xs" role="alert">
                {t(engine.addressGateKey)}
              </p>
            ) : null}
            {engine.whitelistGateKey ? (
              <p className="text-danger m-0 text-xs" role="alert">
                {t(engine.whitelistGateKey)}
              </p>
            ) : null}
          </div>

          {engine.estimatedNetUsdt && isPositiveAmount(engine.estimatedNetUsdt) ? (
            <Card data-testid="crypto-withdraw-preview-net-card">
              <CardBody className="flex flex-col gap-2">
                <p className="text-foreground-muted m-0 text-sm">
                  {t('wallet.crypto.withdraw.previewNet')}
                </p>
                <MoneyDisplay
                  amount={engine.estimatedNetUsdt}
                  currency="USDT"
                  showCurrency
                  className="text-foreground text-lg font-semibold"
                />
                <p className="text-foreground-muted m-0 text-xs">
                  {t('wallet.withdraw.confirmNetAtProcessing')}
                </p>
              </CardBody>
            </Card>
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
            data-testid="crypto-withdraw-submit"
          >
            {t('wallet.crypto.withdraw.submit')}
          </Button>
        </section>
      )}

      <Dialog open={engine.confirmOpen} onOpenChange={(open) => !open && engine.closeConfirm()}>
        <DialogContent data-testid="crypto-withdraw-confirm-dialog">
          <DialogHeader>
            <DialogTitle>{t('wallet.crypto.withdraw.confirmTitle')}</DialogTitle>
            <DialogDescription>{t('wallet.crypto.withdraw.confirmDesc')}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="border-line rounded-(--ds-radius-md) border p-3">
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.crypto.withdraw.confirmAmount')}
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
                {t('wallet.crypto.withdraw.confirmNetwork')}
              </p>
              <p className="text-foreground m-0 text-sm font-medium">{engine.chain}</p>
              <p className="text-foreground-muted m-0 mt-1 text-xs">{t(engine.chainHintKey)}</p>
            </div>

            <div
              className="border-line rounded-(--ds-radius-md) border p-3"
              data-testid="crypto-withdraw-confirm-fee"
            >
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.crypto.withdraw.confirmFee')}
              </p>
              <MoneyDisplay
                amount={engine.estimatedFeeUsdt}
                currency="USDT"
                showCurrency
                className="text-foreground text-sm font-medium"
              />
              <p className="text-foreground-muted m-0 mt-1 text-xs">{t(engine.feeHintKey)}</p>
            </div>

            <div
              className="border-line rounded-(--ds-radius-md) border p-3"
              data-testid="crypto-withdraw-confirm-expected-net"
            >
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.crypto.withdraw.confirmExpectedNet')}
              </p>
              <MoneyDisplay
                amount={previewNet}
                currency="USDT"
                showCurrency
                className="text-foreground text-lg font-semibold"
              />
              <p className="text-foreground-muted m-0 mt-1 text-xs">
                {t('wallet.withdraw.confirmNetAtProcessing')}
              </p>
            </div>

            <div className="border-line rounded-(--ds-radius-md) border p-3">
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.crypto.withdraw.confirmAddress')}
              </p>
              <p className="text-foreground m-0 break-all font-mono text-sm font-medium">
                {engine.address || '—'}
              </p>
            </div>

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
                data-testid="crypto-withdraw-acknowledge"
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
                data-testid="crypto-withdraw-confirm-proceed"
              >
                {engine.submitting
                  ? t('common.processing')
                  : t('wallet.crypto.withdraw.confirmProceed')}
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
