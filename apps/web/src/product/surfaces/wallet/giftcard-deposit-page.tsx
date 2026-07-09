import { useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Circle, Gift, RefreshCw } from 'lucide-react';

import { useGiftcardDepositController } from '@/features/wallet/use-giftcard-deposit-controller';
import { formatBpsAsPercent } from '@/features/wallet/giftcard-deposit-page-display';
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

function GiftcardDepositLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="giftcard-deposit-loading">
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
  steps: ReturnType<typeof useGiftcardDepositController>['timelineSteps'];
}) {
  const t = useT();

  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0" data-testid="giftcard-deposit-timeline">
      {steps.map((step) => (
        <li
          key={step.id}
          className="flex gap-3"
          data-testid={`giftcard-deposit-timeline-${step.id}`}
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

/** Canonical `/wallet/deposit/giftcard` — fee market + preview gate · §30.3 (P4·W3). */
export function GiftcardDepositPage() {
  const t = useT();
  const engine = useGiftcardDepositController();

  useEffect(() => {
    document.title = t('seo.walletDepositGiftcard.title');
  }, [t]);

  if (engine.loading) {
    return <GiftcardDepositLoadingShell />;
  }

  const preview = engine.submitResult ?? engine.previewSnapshot;

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6" data-testid="giftcard-deposit-page">
      <header className="space-y-3">
        <a
          href="/wallet/deposit"
          className="text-foreground-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('wallet.deposit.giftcard.back')}
        </a>
        <div className="space-y-1">
          <h1 className="text-foreground m-0 flex items-center gap-2 text-2xl font-semibold md:text-3xl">
            <Gift className="text-accent size-7 shrink-0" aria-hidden />
            {t('wallet.deposit.rail.giftcard')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm">
            {t('wallet.deposit.rail.giftcard.desc')}
          </p>
        </div>
      </header>

      <HowItWorks
        persistenceId="wallet-deposit-giftcard"
        stepKeys={[
          'wallet.deposit.giftcard.howItWorks.step1',
          'wallet.deposit.giftcard.howItWorks.step2',
          'wallet.deposit.giftcard.howItWorks.step3',
        ]}
        titleKey="wallet.deposit.giftcard.howItWorks.title"
      />

      {engine.depositBlocked ? (
        <div
          className="border-warning/30 bg-warning/10 rounded-(--ds-radius-lg) border p-4"
          data-testid="giftcard-deposit-paused"
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
        <section className="flex flex-col gap-4" data-testid="giftcard-deposit-success">
          <div
            className="border-accent/30 bg-accent/10 rounded-(--ds-radius-lg) border p-4"
            role="status"
          >
            <p className="text-foreground m-0 text-sm font-medium">
              {t('wallet.deposit.giftcard.submitted')}
            </p>
            <p className="text-foreground-muted m-0 mt-1 text-sm">
              {t('wallet.deposit.giftcard.guide')}
            </p>
          </div>

          <Card data-testid="giftcard-deposit-success-preview">
            <CardHeader>
              <CardTitle>{t('wallet.deposit.giftcard.preview.title')}</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-2 pt-0">
              <MoneyDisplay
                amount={engine.submitResult.face_value_krw}
                currency="KRW"
                showCurrency
                className="text-foreground text-lg font-semibold"
              />
              <p className="text-foreground-muted m-0 text-sm">
                {t('wallet.deposit.giftcard.preview.net', {
                  net: engine.submitResult.net_krw,
                  phon: engine.submitResult.expected_phon,
                })}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('wallet.deposit.giftcard.timeline.review')}</CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <DepositTimeline steps={engine.timelineSteps} />
            </CardBody>
          </Card>

          <a
            href="/wallet/deposit"
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full sm:w-auto')}
          >
            {t('wallet.deposit.giftcard.back')}
          </a>
        </section>
      ) : (
        <section className="flex flex-col gap-4" data-testid="giftcard-deposit-form">
          <p className="text-foreground m-0 text-sm">{t('wallet.deposit.giftcard.steps')}</p>
          <p className="text-foreground-muted m-0 text-xs" data-testid="giftcard-deposit-no-limit">
            {t('wallet.deposit.giftcard.noLimit')}
          </p>

          <p className="text-foreground m-0 text-sm" data-testid="giftcard-deposit-fee-notice">
            {t('wallet.deposit.giftcard.feeNotice')}
          </p>

          {engine.marketEmpty ? (
            <div
              className="border-warning/30 bg-warning/10 flex flex-col gap-2 rounded-(--ds-radius-lg) border p-4 sm:flex-row sm:items-center sm:justify-between"
              data-testid="giftcard-deposit-market-empty"
              role="status"
            >
              <p className="text-foreground m-0 text-sm">
                {t('wallet.deposit.giftcard.gate.emptyMarket')}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={engine.refreshMarket}>
                <RefreshCw className="size-4" aria-hidden />
                {t('common.retry')}
              </Button>
            </div>
          ) : (
            <Card data-testid="giftcard-deposit-fee-market">
              <CardHeader>
                <CardTitle>{t('wallet.deposit.giftcard.feeMarket.title')}</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[280px] border-collapse text-sm">
                    <thead>
                      <tr className="border-line border-b text-start">
                        <th className="text-foreground-muted pb-2 pe-3 font-medium">
                          {t('wallet.deposit.giftcard.kind')}
                        </th>
                        <th className="text-foreground-muted pb-2 pe-3 font-medium">
                          {t('wallet.deposit.fee')}
                        </th>
                        <th className="text-foreground-muted pb-2 font-medium">
                          {t('wallet.deposit.giftcard.feeMarket.range')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {engine.marketRows.map((row) => (
                        <tr
                          key={row.kind}
                          className="border-line border-b last:border-b-0"
                          data-testid={`giftcard-fee-row-${row.kind}`}
                        >
                          <td className="text-foreground py-2 pe-3">{t(row.kindLabelKey)}</td>
                          <td className="text-foreground py-2 pe-3 tabular-nums">
                            {t('wallet.deposit.giftcard.feeMarket.percentFee', {
                              percent: row.percentFeeDisplay,
                            })}
                            {row.fixedFeeDisplay
                              ? ` · ${t('wallet.deposit.giftcard.feeMarket.fixedFee', { fee: row.fixedFeeDisplay })}`
                              : null}
                          </td>
                          <td className="text-foreground py-2 tabular-nums">
                            {row.faceRangeDisplay}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="giftcard-deposit-kind" className="text-foreground text-sm font-medium">
              {t('wallet.deposit.giftcard.kind')}
            </label>
            <Select
              value={engine.kind ?? undefined}
              onValueChange={(value) => engine.setKind(value as NonNullable<typeof engine.kind>)}
              disabled={engine.depositBlocked || engine.marketEmpty}
            >
              <SelectTrigger id="giftcard-deposit-kind" data-testid="giftcard-deposit-kind">
                <SelectValue placeholder={t('wallet.deposit.giftcard.gate.kind')} />
              </SelectTrigger>
              <SelectContent>
                {engine.kinds.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(`wallet.deposit.giftcard.kind.${item}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {engine.kindGateKey ? (
              <p className="text-danger m-0 text-xs" role="alert">
                {t(engine.kindGateKey)}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="giftcard-deposit-face" className="text-foreground text-sm font-medium">
              {t('wallet.deposit.giftcard.faceValue')}
            </label>
            <Input
              id="giftcard-deposit-face"
              inputMode="numeric"
              autoComplete="off"
              value={engine.faceValueKrw}
              onChange={(event) => engine.setFaceValueKrw(event.target.value)}
              disabled={engine.depositBlocked || engine.marketEmpty}
              data-testid="giftcard-deposit-face-input"
              aria-invalid={engine.faceGateKey !== null}
            />
            {engine.faceGateKey ? (
              <p className="text-danger m-0 text-xs" role="alert">
                {t(engine.faceGateKey)}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={!engine.canLoadPreview}
            onClick={engine.loadPreview}
            data-testid="giftcard-deposit-load-preview"
          >
            {engine.previewLoading
              ? t('common.processing')
              : t('wallet.deposit.giftcard.preview.load')}
          </Button>

          {engine.previewErrorKey ? (
            <div
              className="border-danger/30 bg-danger/10 flex flex-col gap-2 rounded-(--ds-radius-lg) border p-4 sm:flex-row sm:items-center sm:justify-between"
              data-testid="giftcard-deposit-preview-error"
              role="alert"
            >
              <p className="text-foreground m-0 text-sm">
                {engine.previewErrorKey === 'error.GIFTCARD_FEE_STALE'
                  ? t('wallet.deposit.giftcard.preview.stale')
                  : t(engine.previewErrorKey)}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={engine.refreshMarket}>
                <RefreshCw className="size-4" aria-hidden />
                {t('common.retry')}
              </Button>
            </div>
          ) : null}

          {(engine.previewRequested || engine.previewConfirmed) &&
          preview &&
          !engine.previewErrorKey ? (
            <Card data-testid="giftcard-deposit-preview-card">
              <CardHeader>
                <CardTitle>{t('wallet.deposit.giftcard.preview.title')}</CardTitle>
              </CardHeader>
              <CardBody className="flex flex-col gap-3 pt-0">
                <p
                  className="text-foreground m-0 text-sm"
                  data-testid="giftcard-deposit-preview-summary"
                >
                  {t('wallet.deposit.giftcard.preview.faceToPhon', {
                    face: preview.face_value_krw,
                    percent: formatBpsAsPercent(preview.percent_fee_bps),
                    phon: preview.expected_phon,
                  })}
                </p>
                <p className="text-foreground-muted m-0 text-xs">
                  {t('wallet.deposit.giftcard.preview.fee', { fee: preview.total_fee_krw })}
                </p>
                <p className="text-foreground-muted m-0 text-xs">
                  {t('wallet.deposit.giftcard.preview.net', {
                    net: preview.net_krw,
                    phon: preview.expected_phon,
                  })}
                </p>
                {!engine.previewConfirmed ? (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={!engine.canConfirmPreview}
                    onClick={engine.confirmPreview}
                    data-testid="giftcard-deposit-confirm-preview"
                  >
                    {t('wallet.deposit.giftcard.preview.confirm')}
                  </Button>
                ) : (
                  <p
                    className="text-accent m-0 text-sm font-medium"
                    data-testid="giftcard-deposit-preview-confirmed"
                    role="status"
                  >
                    {t('wallet.deposit.giftcard.preview.confirmed')}
                  </p>
                )}
              </CardBody>
            </Card>
          ) : null}

          {engine.previewGateKey ? (
            <p className="text-foreground-muted m-0 text-xs" role="status">
              {t(engine.previewGateKey)}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <label htmlFor="giftcard-deposit-pin" className="text-foreground text-sm font-medium">
              {t('wallet.deposit.giftcard.pin')}
            </label>
            <Input
              id="giftcard-deposit-pin"
              type="password"
              autoComplete="off"
              value={engine.pin}
              onChange={(event) => engine.setPin(event.target.value)}
              disabled={!engine.pinEnabled || engine.depositBlocked}
              data-testid="giftcard-deposit-pin-input"
              aria-invalid={engine.pinEnabled && engine.pinGateKey !== null}
            />
            {!engine.pinEnabled ? (
              <p
                className="text-foreground-muted m-0 text-xs"
                data-testid="giftcard-deposit-pin-locked"
              >
                {t('wallet.deposit.giftcard.gate.previewConfirm')}
              </p>
            ) : engine.pinGateKey ? (
              <p className="text-danger m-0 text-xs" role="alert">
                {t(engine.pinGateKey)}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!engine.canOpenSubmit || engine.depositBlocked}
            onClick={engine.openConfirm}
            data-testid="giftcard-deposit-submit"
          >
            {t('wallet.deposit.giftcard.submit')}
          </Button>
        </section>
      )}

      <Dialog open={engine.confirmOpen} onOpenChange={(open) => !open && engine.closeConfirm()}>
        <DialogContent data-testid="giftcard-deposit-confirm-dialog">
          <DialogHeader>
            <DialogTitle>{t('wallet.deposit.giftcard.confirmTitle')}</DialogTitle>
            <DialogDescription>{t('wallet.deposit.giftcard.confirmDesc')}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {preview ? (
              <div
                className="border-accent/30 bg-accent/5 rounded-(--ds-radius-md) border p-3"
                data-testid="giftcard-deposit-confirm-preview"
              >
                <p className="text-foreground-muted m-0 text-xs">
                  {t('wallet.deposit.giftcard.preview.title')}
                </p>
                <MoneyDisplay
                  amount={preview.face_value_krw}
                  currency="KRW"
                  showCurrency
                  className="text-foreground text-lg font-semibold"
                />
                <p className="text-foreground m-0 mt-2 text-sm">
                  {t('wallet.deposit.giftcard.preview.net', {
                    net: preview.net_krw,
                    phon: preview.expected_phon,
                  })}
                </p>
              </div>
            ) : null}

            <div className="border-line rounded-(--ds-radius-md) border p-3">
              <p className="text-foreground-muted m-0 text-xs">
                {t('wallet.deposit.giftcard.kind')}
              </p>
              <p className="text-foreground m-0 text-sm font-medium">
                {engine.kind ? t(`wallet.deposit.giftcard.kind.${engine.kind}`) : '—'}
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
                data-testid="giftcard-deposit-acknowledge"
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
                data-testid="giftcard-deposit-confirm-proceed"
              >
                {engine.submitting
                  ? t('common.processing')
                  : t('wallet.deposit.giftcard.confirmProceed')}
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
