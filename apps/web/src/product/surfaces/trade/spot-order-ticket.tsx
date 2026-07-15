import { useMemo } from 'react';

import type { SpotDeskWire } from '@/features/trading/use-spot-desk-wire';
import { handleOrderTicketEnterSubmit } from '@/features/trading/order-ticket/order-ticket-keyboard';
import { OrderTicketBalanceChips } from '@/features/trading/order-ticket/order-ticket-balance-chips';
import { TRADE_DESK_CONFIRM_DIALOG_TEST_ID } from '@/domain/trade-desk-a11y-display-contract';
import { TradeTierFeeBadge } from '@/features/trading/order-ticket/trade-tier-fee-badge';
import { TradeHelpTip } from '@/features/trading/trade-beginner-help/trade-help-tip';
import { TradeHouseCounterpartyAckButton } from '@/features/trading/trade-house-counterparty-ack-button';
import {
  resolveSpotOrderSubmitDisabled,
  resolveSubmitDisabledReason,
} from '@/domain/trade-submit-display-contract';
import {
  formatSpotBaseQuantityDisplay,
  resolveSpotBaseQuantityPrecision,
} from '@/domain/spot-base-quantity-display-contract';
import { isPositiveAmount } from '@/lib/money-display';
import { toDecimal } from '@phonara/money';
import type { Currency } from '@phonara/shared-types';
import { Button } from '@/product/primitives/button';
import { ConfirmDialog } from '@/product/primitives/confirm-dialog';
import { Card } from '@/product/primitives/card';
import { Input } from '@/product/primitives/input';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { cn } from '@/product/primitives/lib/cn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';
import { SpendCurrencySelector } from '@/product/primitives/spend-currency-selector';
import { isTradeFiatHintEligibleCurrency } from '@/features/trading/trade-fiat-hint-display';

import { TradeMoneyWithFiatHint } from './trade-money-with-fiat-hint';
import { TradeConfirmSettingsLink } from './trade-confirm-settings-link';

export type SpotOrderTicketProps = {
  wire: SpotDeskWire;
  className?: string;
  /** Mobile trade tab uses external sticky CTA — inline submit hidden to avoid double CTA. */
  primarySubmit?: 'inline' | 'external';
};

function isWalletCurrency(asset: string): asset is Currency {
  return asset === 'PHON' || asset === 'USDT' || asset === 'KRW';
}

function SpotAmountDisplay({
  amount,
  asset,
  quantityPrecision,
  className,
}: {
  amount: string;
  asset: string;
  quantityPrecision: number | null;
  className?: string;
}) {
  if (isWalletCurrency(asset)) {
    if (isTradeFiatHintEligibleCurrency(asset)) {
      return (
        <TradeMoneyWithFiatHint
          amount={amount}
          currency={asset}
          showCurrency
          className={className}
        />
      );
    }
    return <MoneyDisplay amount={amount} currency={asset} showCurrency className={className} />;
  }
  return (
    <span
      className={cn('text-foreground text-sm font-medium tabular-nums', className)}
      data-testid="spot-base-quantity"
    >
      {formatSpotBaseQuantityDisplay(amount, quantityPrecision)}{' '}
      <span className="text-foreground-muted">{asset}</span>
    </span>
  );
}

export function SpotOrderTicket({
  wire,
  className,
  primarySubmit = 'inline',
}: SpotOrderTicketProps) {
  const {
    side,
    setSide,
    amount,
    onAmountInput,
    availBalance,
    estimate,
    estimateCurrency,
    estimateFee,
    estimateFeeCurrency,
    baseLabel,
    quoteLabel,
    buyStakeCurrency,
    setBuyStakeCurrency,
    canSelectPhonBuyStake,
    busy,
    tradeBlocked,
    submitBlockedReason,
    earnVipTier,
    orderType,
    setOrderType,
    limitPrice,
    onLimitPriceInput,
    stopPrice,
    onStopPriceInput,
    orderPricesReady,
    spotCapabilities,
    houseCounterpartyAck,
    quantityPrecision,
    t,
  } = wire;

  const baseQuantityPrecision = quantityPrecision ?? resolveSpotBaseQuantityPrecision(null);

  const insufficientAvail = useMemo(() => {
    if (!isPositiveAmount(amount)) return false;
    try {
      return toDecimal(amount).greaterThan(toDecimal(availBalance.amount));
    } catch {
      return false;
    }
  }, [amount, availBalance.amount]);

  const submitState = useMemo(
    () => ({
      busy,
      orderType,
      estimate,
      orderPricesReady,
      submitBlocked: tradeBlocked,
      submitBlockedReason,
      insufficientAvail,
      houseCounterpartyAcknowledged: houseCounterpartyAck.acknowledged,
    }),
    [
      busy,
      estimate,
      houseCounterpartyAck.acknowledged,
      insufficientAvail,
      orderPricesReady,
      orderType,
      submitBlockedReason,
      tradeBlocked,
    ],
  );

  const submitDisabled = resolveSpotOrderSubmitDisabled(submitState);
  const submitDisabledReason = resolveSubmitDisabledReason({ domain: 'spot', state: submitState });

  const amountCurrency = side === 'buy' ? buyStakeCurrency : baseLabel;

  return (
    <Card
      variant="trade-dense"
      data-testid="spot-order-ticket"
      className={cn('flex min-h-0 flex-col', className)}
    >
      <header className="border-line border-b px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-foreground m-0 text-sm font-semibold">
            {t('trade.spot.orderTitle')}
          </h2>
          {earnVipTier ? <TradeTierFeeBadge tier={earnVipTier} /> : null}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <TradeHelpTip termId="spot_buy" className="text-xs" />
            <Button
              type="button"
              variant={side === 'buy' ? 'primary' : 'outline'}
              className={cn(side === 'buy' && 'bg-market-up text-black hover:bg-market-up/90')}
              onClick={() => setSide('buy')}
            >
              {t('trade.spot.buy')}
            </Button>
          </div>
          <div className="flex flex-col gap-1">
            <TradeHelpTip termId="spot_sell" className="text-xs" />
            <Button
              type="button"
              variant={side === 'sell' ? 'primary' : 'outline'}
              className={cn(side === 'sell' && 'bg-market-down hover:bg-market-down/90')}
              onClick={() => setSide('sell')}
            >
              {t('trade.spot.sell')}
            </Button>
          </div>
        </div>

        {spotCapabilities.limitOrders ? (
          <Tabs
            value={orderType}
            onValueChange={(value) => setOrderType(value as typeof orderType)}
          >
            <TabsList className="grid w-full grid-cols-4" data-testid="spot-order-type-tabs">
              <TabsTrigger value="market">{t('trade.order.market')}</TabsTrigger>
              <TabsTrigger value="limit">{t('trade.order.limit')}</TabsTrigger>
              <TabsTrigger value="stop_market" disabled={!spotCapabilities.stopOrders}>
                {t('trade.order.stop')}
              </TabsTrigger>
              <TabsTrigger value="stop_limit" disabled={!spotCapabilities.stopOrders}>
                {t('trade.order.stopLimit')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="limit" className="mt-3">
              <label className="flex flex-col gap-1">
                <span className="text-foreground-muted text-xs">{t('trade.order.limitPrice')}</span>
                <Input
                  inputMode="decimal"
                  value={limitPrice}
                  onChange={(event) => onLimitPriceInput(event.target.value)}
                  data-testid="spot-limit-price-input"
                />
              </label>
            </TabsContent>
            <TabsContent value="stop_market" className="mt-3">
              <label className="flex flex-col gap-1">
                <span className="text-foreground-muted text-xs">
                  {t('trade.order.triggerPrice')}
                </span>
                <Input
                  inputMode="decimal"
                  value={stopPrice}
                  onChange={(event) => onStopPriceInput(event.target.value)}
                  data-testid="spot-stop-price-input"
                />
              </label>
            </TabsContent>
            <TabsContent value="stop_limit" className="mt-3 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-foreground-muted text-xs">
                  {t('trade.order.triggerPrice')}
                </span>
                <Input
                  inputMode="decimal"
                  value={stopPrice}
                  onChange={(event) => onStopPriceInput(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-foreground-muted text-xs">{t('trade.order.limitPrice')}</span>
                <Input
                  inputMode="decimal"
                  value={limitPrice}
                  onChange={(event) => onLimitPriceInput(event.target.value)}
                />
              </label>
            </TabsContent>
          </Tabs>
        ) : null}

        {side === 'buy' ? (
          <SpendCurrencySelector
            value={buyStakeCurrency}
            onChange={setBuyStakeCurrency}
            testId="spot-buy-stake-currency-selector"
            currencyTestIdPrefix="spot-buy-stake-currency"
            showHelpTip
            disabled={busy || tradeBlocked}
            disabledCurrencies={{ PHON: !canSelectPhonBuyStake }}
          />
        ) : null}

        <label className="flex flex-col gap-1">
          <span className="text-foreground-muted text-xs">
            {side === 'buy'
              ? t('trade.spot.payQuote', { quote: quoteLabel })
              : t('trade.spot.sellBaseAmount', { base: baseLabel })}
          </span>
          <Input
            inputMode="decimal"
            value={amount}
            onChange={(event) => onAmountInput(event.target.value)}
            data-testid="spot-amount-input"
            onKeyDown={(event) =>
              handleOrderTicketEnterSubmit(event, {
                disabled: submitDisabled,
                onSubmit: () => wire.requestSubmit(),
              })
            }
            aria-label={
              side === 'buy'
                ? t('trade.spot.payQuote', { quote: quoteLabel })
                : t('trade.spot.sellBaseAmount', { base: baseLabel })
            }
          />
        </label>

        <OrderTicketBalanceChips
          avail={availBalance.amount}
          amount={amount}
          onAmountChange={onAmountInput}
        />

        <dl className="m-0 grid gap-2 text-sm" data-testid="spot-order-ticket-metrics">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-foreground-muted flex items-center gap-1">
              {t('trade.order.avail')}
              {side === 'buy' ? <TradeHelpTip termId="stake_currency" className="text-xs" /> : null}
            </dt>
            <dd className="m-0" data-testid="spot-ticket-avail-balance">
              <SpotAmountDisplay
                amount={availBalance.amount}
                asset={availBalance.currency}
                quantityPrecision={baseQuantityPrecision}
                className="text-foreground text-sm font-medium"
              />
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-foreground-muted">{t('confirm.row.estReceive')}</dt>
            <dd className="m-0" data-testid="spot-ticket-est-receive">
              {estimate ? (
                <SpotAmountDisplay
                  amount={estimate}
                  asset={estimateCurrency}
                  quantityPrecision={baseQuantityPrecision}
                  className="text-foreground text-sm font-medium"
                />
              ) : (
                <span className="text-foreground-muted">—</span>
              )}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-foreground-muted">{t('trade.order.estFee')}</dt>
            <dd className="m-0" data-testid="spot-ticket-est-fee">
              {estimateFee ? (
                <SpotAmountDisplay
                  amount={estimateFee}
                  asset={estimateFeeCurrency}
                  quantityPrecision={baseQuantityPrecision}
                  className="text-foreground text-sm font-medium"
                />
              ) : (
                <span className="text-foreground-muted">—</span>
              )}
            </dd>
          </div>
        </dl>

        {insufficientAvail ? (
          <p className="text-market-down m-0 text-sm">{t('error.INSUFFICIENT_BALANCE')}</p>
        ) : null}

        <TradeHouseCounterpartyAckButton ack={houseCounterpartyAck} t={t} />

        {submitDisabled && submitDisabledReason && !insufficientAvail ? (
          <p className="text-warning m-0 text-sm" data-testid="spot-submit-blocked-reason">
            {t(submitDisabledReason)}
          </p>
        ) : null}

        {primarySubmit === 'inline' ? (
          <Button
            type="button"
            data-testid="spot-submit"
            disabled={submitDisabled}
            loading={busy}
            className={cn(
              'min-h-11 w-full',
              side === 'buy'
                ? 'bg-market-up text-black hover:bg-market-up/90'
                : 'bg-market-down hover:bg-market-down/90',
            )}
            onClick={() => wire.requestSubmit()}
          >
            {side === 'buy'
              ? t('trade.spot.submitBuyBase', { base: baseLabel })
              : t('trade.spot.submitSellBase', { base: baseLabel })}
          </Button>
        ) : null}
      </div>

      <SpotConfirmDialog
        wire={wire}
        amountCurrency={amountCurrency}
        quantityPrecision={baseQuantityPrecision}
      />
    </Card>
  );
}

function SpotConfirmDialog({
  wire,
  amountCurrency,
  quantityPrecision,
}: {
  wire: SpotDeskWire;
  amountCurrency: string;
  quantityPrecision: number | null;
}) {
  const {
    confirmOpen,
    setConfirmOpen,
    confirmNotice,
    canConfirm,
    confirmStaleRacePending,
    busy,
    side,
    price,
    amount,
    submit,
    houseCounterpartyAck,
    t,
  } = wire;

  return (
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      contentTestId={TRADE_DESK_CONFIRM_DIALOG_TEST_ID}
      title={t(side === 'buy' ? 'confirm.spotBuy.title' : 'confirm.spotSell.title')}
      description={t('trade.confirm.review')}
      summary={
        <dl className="m-0 grid gap-2">
          {confirmNotice ? <p className="text-warning m-0 text-sm">{t(confirmNotice)}</p> : null}
          <p
            className="text-foreground-muted m-0 text-xs"
            data-testid="spot-confirm-house-counterparty-notice"
          >
            {t('trade.houseCounterpartyConfirmNotice')}
          </p>
          {!houseCounterpartyAck.acknowledged ? (
            <TradeHouseCounterpartyAckButton ack={houseCounterpartyAck} t={t} />
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-foreground-muted">{t('confirm.row.markPrice')}</dt>
            <dd className="text-foreground m-0 tabular-nums">
              <TradeMoneyWithFiatHint amount={price} currency="USDT" showCurrency />
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-foreground-muted">{t('confirm.row.pay')}</dt>
            <dd className="text-foreground m-0 tabular-nums">
              <SpotAmountDisplay
                amount={amount}
                asset={amountCurrency}
                quantityPrecision={quantityPrecision}
              />
            </dd>
          </div>
          <TradeConfirmSettingsLink />
        </dl>
      }
      confirmLabel={
        side === 'buy'
          ? t('trade.spot.submitBuyBase', { base: wire.baseLabel })
          : t('trade.spot.submitSellBase', { base: wire.baseLabel })
      }
      loading={busy}
      confirmDisabled={!houseCounterpartyAck.acknowledged}
      destructive={side === 'sell'}
      onConfirm={() => {
        if (!houseCounterpartyAck.acknowledged) return;
        if (!canConfirm && !confirmStaleRacePending) return;
        void submit();
      }}
    />
  );
}
