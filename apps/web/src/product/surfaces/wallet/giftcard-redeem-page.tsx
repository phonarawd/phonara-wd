import { useEffect } from 'react';
import { Link, Navigate } from '@tanstack/react-router';
import { Gift } from 'lucide-react';

import { WALLET_REDEEM_HUB_ROUTE } from '@/domain/wallet-capability-rails-display-contract';
import {
  WALLET_REDEEM_GIFTCARD_SEO_DESCRIPTION_KEY,
  WALLET_REDEEM_GIFTCARD_SEO_TITLE_KEY,
} from '@/domain/wallet-redeem-display-contract';
import { useGiftcardRedeemController } from '@/features/wallet/use-giftcard-redeem-controller';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/product/primitives/dialog';
import { Input } from '@/product/primitives/input';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { Skeleton } from '@/product/primitives/skeleton';

/** Canonical `/wallet/redeem/giftcard` — PHON → giftcard reverse · E10 live. */
export function GiftcardRedeemPage() {
  const engine = useGiftcardRedeemController();
  const { t } = engine;

  useEffect(() => {
    document.title = t(WALLET_REDEEM_GIFTCARD_SEO_TITLE_KEY);
  }, [t]);

  if (engine.loading) {
    return (
      <div className="flex flex-col gap-4 py-4" data-testid="giftcard-redeem-loading">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (engine.shouldRedirect || engine.marketEmpty) {
    return <Navigate to={WALLET_REDEEM_HUB_ROUTE} replace />;
  }

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-ds-8 py-4 md:py-6"
      data-testid="giftcard-redeem-page"
    >
      <header className="flex flex-col gap-3">
        <Link
          to="/wallet/redeem"
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
          data-testid="giftcard-redeem-back"
        >
          {t('wallet.redeemGiftcard.back')}
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('wallet.redeemGiftcard.title')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(WALLET_REDEEM_GIFTCARD_SEO_DESCRIPTION_KEY)}
          </p>
        </div>
      </header>

      {engine.withdrawalBlocked ? (
        <p className="text-warning m-0 text-sm" role="status" data-testid="giftcard-redeem-blocked">
          {t('wallet.withdraw.unavailableDesc')}
        </p>
      ) : null}

      {engine.submitResult ? (
        <Card data-testid="giftcard-redeem-success">
          <CardHeader>
            <CardTitle className="text-base">{t('wallet.redeemGiftcard.success.title')}</CardTitle>
            <CardDescription>{t('wallet.redeemGiftcard.success.body')}</CardDescription>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-foreground-muted">{t('wallet.redeemGiftcard.phonCost')}</span>
              <MoneyDisplay
                amount={engine.submitResult.phon_cost}
                currency="PHON"
                showCurrency
                className="text-foreground text-sm font-medium"
              />
            </div>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={engine.acknowledge}
              data-testid="giftcard-redeem-ack"
            >
              {t('wallet.redeemGiftcard.success.ack')}
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Card data-testid="giftcard-redeem-form-card">
          <CardHeader className="flex flex-row items-start gap-3 pb-2">
            <span
              className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-md"
              aria-hidden
            >
              <Gift className="size-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="text-base">{t('wallet.redeemGiftcard.form.title')}</CardTitle>
              <CardDescription>{t('wallet.redeemGiftcard.form.body')}</CardDescription>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-4 pt-0">
            <label className="flex flex-col gap-1.5">
              <span className="text-foreground text-sm font-medium">
                {t('wallet.redeemGiftcard.kind')}
              </span>
              <select
                className="border-line bg-surface text-foreground rounded-md border px-3 py-2 text-sm"
                value={engine.kind ?? ''}
                onChange={(e) => engine.setKind(e.target.value as NonNullable<typeof engine.kind>)}
                data-testid="giftcard-redeem-kind"
              >
                <option value="">{t('wallet.redeemGiftcard.kindPlaceholder')}</option>
                {engine.kinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-foreground text-sm font-medium">
                {t('wallet.redeemGiftcard.face')}
              </span>
              <Input
                value={engine.faceValueKrw}
                onChange={(e) => engine.setFaceValueKrw(e.target.value)}
                inputMode="numeric"
                data-testid="giftcard-redeem-face"
              />
            </label>
            {engine.previewErrorKey ? (
              <p className="text-danger m-0 text-sm" role="alert">
                {t(engine.previewErrorKey)}
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={!engine.canLoadPreview || engine.previewLoading}
              onClick={engine.loadPreview}
              data-testid="giftcard-redeem-preview"
            >
              {engine.previewLoading ? t('common.processing') : t('wallet.redeemGiftcard.preview')}
            </Button>
            {engine.preview ? (
              <div
                className="border-line bg-surface-raised flex flex-col gap-2 rounded-md border p-3"
                data-testid="giftcard-redeem-quote"
              >
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-foreground-muted">
                    {t('wallet.redeemGiftcard.phonCost')}
                  </span>
                  <MoneyDisplay
                    amount={engine.preview.phon_cost}
                    currency="PHON"
                    showCurrency
                    className="text-foreground text-sm font-medium"
                  />
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-foreground-muted">{t('wallet.redeemGiftcard.fee')}</span>
                  <MoneyDisplay
                    amount={engine.preview.fee_phon}
                    currency="PHON"
                    showCurrency
                    className="text-foreground text-sm font-medium"
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={engine.withdrawalBlocked}
                  onClick={engine.openConfirm}
                  data-testid="giftcard-redeem-submit"
                >
                  {t('wallet.redeemGiftcard.submit')}
                </Button>
              </div>
            ) : null}
          </CardBody>
        </Card>
      )}

      <Dialog open={engine.confirmOpen} onOpenChange={(open) => !open && engine.closeConfirm()}>
        <DialogContent data-testid="giftcard-redeem-confirm-dialog">
          <DialogHeader>
            <DialogTitle>{t('wallet.redeemGiftcard.confirm.title')}</DialogTitle>
            <DialogDescription>{t('wallet.redeemGiftcard.confirm.body')}</DialogDescription>
          </DialogHeader>
          {engine.preview ? (
            <div className="flex flex-col gap-2 py-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-foreground-muted">{t('wallet.redeemGiftcard.phonCost')}</span>
                <MoneyDisplay
                  amount={engine.preview.phon_cost}
                  currency="PHON"
                  showCurrency
                  className="text-foreground text-sm font-medium"
                />
              </div>
            </div>
          ) : null}
          {engine.submitErrorKey ? (
            <p className="text-danger m-0 text-sm" role="alert">
              {t(engine.submitErrorKey)}
            </p>
          ) : null}
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={engine.submitting}
              onClick={() => void engine.submitRedeem()}
              data-testid="giftcard-redeem-confirm"
            >
              {engine.submitting
                ? t('common.processing')
                : t('wallet.redeemGiftcard.confirm.submit')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
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
