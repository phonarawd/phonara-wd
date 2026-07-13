import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeftRight } from 'lucide-react';

import {
  WALLET_TRANSFER_SEO_DESCRIPTION_KEY,
  WALLET_TRANSFER_SEO_TITLE_KEY,
} from '@/domain/wallet-transfer-display-contract';
import { useWalletTransferController } from '@/features/wallet/use-wallet-transfer-controller';
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

/** Canonical `/wallet/transfer` — P2P PHON · E10 live. */
export function WalletTransferPage() {
  const engine = useWalletTransferController();
  const { t } = engine;

  useEffect(() => {
    document.title = t(WALLET_TRANSFER_SEO_TITLE_KEY);
  }, [t]);

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-4 md:py-6"
      data-testid="wallet-transfer-page"
    >
      <header className="flex flex-col gap-3">
        <Link
          to="/wallet"
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
          data-testid="wallet-transfer-back"
        >
          {t('wallet.transfer.back')}
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('wallet.transfer.title')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(WALLET_TRANSFER_SEO_DESCRIPTION_KEY)}
          </p>
        </div>
      </header>

      {engine.submitResult ? (
        <Card data-testid="wallet-transfer-success">
          <CardHeader>
            <CardTitle className="text-base">{t('wallet.transfer.success.title')}</CardTitle>
            <CardDescription>{t('wallet.transfer.success.body')}</CardDescription>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-foreground-muted text-sm">{t('wallet.transfer.amount')}</span>
              <MoneyDisplay
                amount={engine.submitResult.amount}
                currency="PHON"
                showCurrency
                className="text-foreground text-sm font-medium"
              />
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-foreground-muted text-sm">{t('wallet.transfer.fee')}</span>
              <MoneyDisplay
                amount={engine.submitResult.fee_amount}
                currency="PHON"
                showCurrency
                className="text-foreground text-sm font-medium"
              />
            </div>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={engine.acknowledgeResult}
              data-testid="wallet-transfer-ack"
            >
              {t('wallet.transfer.success.ack')}
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Card data-testid="wallet-transfer-form-card">
          <CardHeader className="flex flex-row items-start gap-3 pb-2">
            <span
              className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-md"
              aria-hidden
            >
              <ArrowLeftRight className="size-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="text-base">{t('wallet.transfer.form.title')}</CardTitle>
              <CardDescription>{t('wallet.transfer.form.body')}</CardDescription>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-4 pt-0">
            <label className="flex flex-col gap-1.5">
              <span className="text-foreground text-sm font-medium">
                {t('wallet.transfer.recipient')}
              </span>
              <Input
                value={engine.recipient}
                onChange={(e) => engine.setRecipient(e.target.value)}
                placeholder={t('wallet.transfer.recipientPlaceholder')}
                autoComplete="off"
                data-testid="wallet-transfer-recipient"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-foreground text-sm font-medium">
                {t('wallet.transfer.amount')}
              </span>
              <Input
                value={engine.amount}
                onChange={(e) => engine.setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="0.000000"
                data-testid="wallet-transfer-amount"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-foreground text-sm font-medium">
                {t('wallet.transfer.memo')}
              </span>
              <Input
                value={engine.memo}
                onChange={(e) => engine.setMemo(e.target.value)}
                maxLength={200}
                data-testid="wallet-transfer-memo"
              />
            </label>
            {engine.submitErrorKey ? (
              <p
                className="text-danger m-0 text-sm"
                role="alert"
                data-testid="wallet-transfer-error"
              >
                {t(engine.submitErrorKey)}
              </p>
            ) : null}
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!engine.canSubmit || engine.submitting}
              onClick={engine.openConfirm}
              data-testid="wallet-transfer-submit"
            >
              {t('wallet.transfer.submit')}
            </Button>
          </CardBody>
        </Card>
      )}

      <section className="flex flex-col gap-3" data-testid="wallet-transfer-history">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-foreground m-0 text-base font-semibold">
            {t('wallet.transfer.history.title')}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={engine.refreshHistory}
            data-testid="wallet-transfer-history-refresh"
          >
            {t('common.retry')}
          </Button>
        </div>
        {engine.historyLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : engine.history.length === 0 ? (
          <p className="text-foreground-muted m-0 text-sm">{t('wallet.transfer.history.empty')}</p>
        ) : (
          <ul className="border-line divide-line m-0 list-none divide-y rounded-lg border p-0">
            {engine.history.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                data-testid={`wallet-transfer-row-${row.id}`}
              >
                <div className="min-w-0">
                  <p className="text-foreground m-0 truncate text-sm font-medium">
                    {row.sender_id.slice(0, 8)}… → {row.recipient_id.slice(0, 8)}…
                  </p>
                  <p className="text-foreground-muted m-0 text-xs">{row.created_at}</p>
                </div>
                <MoneyDisplay
                  amount={row.amount}
                  currency="PHON"
                  showCurrency
                  className="text-foreground text-sm font-medium"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={engine.confirmOpen} onOpenChange={(open) => !open && engine.closeConfirm()}>
        <DialogContent data-testid="wallet-transfer-confirm-dialog">
          <DialogHeader>
            <DialogTitle>{t('wallet.transfer.confirm.title')}</DialogTitle>
            <DialogDescription>{t('wallet.transfer.confirm.body')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-foreground-muted">{t('wallet.transfer.recipient')}</span>
              <span className="text-foreground font-medium">{engine.recipient}</span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-foreground-muted">{t('wallet.transfer.amount')}</span>
              <MoneyDisplay
                amount={engine.amount || '0'}
                currency="PHON"
                showCurrency
                className="text-foreground text-sm font-medium"
              />
            </div>
          </div>
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
              onClick={() => void engine.submitTransfer()}
              data-testid="wallet-transfer-confirm"
            >
              {engine.submitting ? t('common.processing') : t('wallet.transfer.confirm.submit')}
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
