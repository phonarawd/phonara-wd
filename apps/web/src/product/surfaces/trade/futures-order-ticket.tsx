import { useMemo, useState } from 'react';
import { toDecimal } from '@phonara/money';

import { TRADE_DESK_CONFIRM_DIALOG_TEST_ID } from '@/domain/trade-desk-a11y-display-contract';
import { handleOrderTicketEnterSubmit } from '@/features/trading/order-ticket/order-ticket-keyboard';
import { OrderTicketBalanceChips } from '@/features/trading/order-ticket/order-ticket-balance-chips';
import { TradeTierFeeBadge } from '@/features/trading/order-ticket/trade-tier-fee-badge';
import { LeverageControl } from '@/features/trading/order-ticket/leverage-control';
import { MarginModeSegment } from '@/features/trading/order-ticket/margin-mode-segment';
import { PositionModeFixedLabel } from '@/features/trading/order-ticket/position-mode-fixed-label';
import { TradeHelpTip } from '@/features/trading/trade-beginner-help/trade-help-tip';
import { TradeHouseCounterpartyAckButton } from '@/features/trading/trade-house-counterparty-ack-button';
import { computeEstRequiredMargin } from '@/features/trading/order-ticket/compute-position-display-metrics';
import type { FuturesDeskWire } from '@/features/trading/use-futures-desk-wire';
import {
  resolveFuturesOrderSubmitDisabled,
  resolveSubmitDisabledReason,
} from '@/domain/trade-submit-display-contract';
import { supportsEntryTpSlOnOrderType } from '@/domain/trade-order-states-display-contract';
import { TRADE_FUTURES_UI_CAPABILITIES } from '@/features/trading/trade-rpc-capabilities';
import type { FuturesTimeInForce } from '@/domain/trade-order-states-display-contract';
import { Button } from '@/product/primitives/button';
import { ConfirmDialog } from '@/product/primitives/confirm-dialog';
import { Input } from '@/product/primitives/input';
import { SpendCurrencySelector } from '@/product/primitives/spend-currency-selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';
import { cn } from '@/product/primitives/lib/cn';

import { TradeMoneyWithFiatHint } from './trade-money-with-fiat-hint';
import { TradeConfirmSettingsLink } from './trade-confirm-settings-link';
import { TradePhonBalanceBreakdown } from './trade-phon-balance-breakdown';

export type FuturesOrderTicketProps = {
  wire: FuturesDeskWire;
  className?: string;
  /** Mobile trade tab uses external sticky CTA — inline submit hidden to avoid double CTA. */
  primarySubmit?: 'inline' | 'external';
};

export function FuturesOrderTicket({
  wire,
  className,
  primarySubmit = 'inline',
}: FuturesOrderTicketProps) {
  const {
    side,
    setSide,
    marginCurrency,
    setMarginCurrency,
    margin,
    onMarginInput,
    leverage,
    setLeverage,
    maxLeverageNum,
    avail,
    phonAvail,
    usdtAvail,
    phonBonusAvailableDisplay,
    phonRealAvailableDisplay,
    preview,
    busy,
    walletLoading,
    tradeBlocked,
    submitBlockedReason,
    isHighLeverage,
    riskAck,
    houseCounterpartyAck,
    orderType,
    setOrderType,
    limitPrice,
    setLimitPrice,
    stopPrice,
    setStopPrice,
    orderPricesReady,
    marginMode,
    setMarginMode,
    marginModeBusy,
    crossMarginEnabled,
    earnVipTier,
    t,
  } = wire;

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const insufficientAvail = useMemo(() => {
    if (!preview) return false;
    try {
      const required = toDecimal(margin).plus(toDecimal(preview.openFee));
      return toDecimal(avail).lessThan(required);
    } catch {
      return false;
    }
  }, [avail, margin, preview]);

  const submitState = useMemo(
    () => ({
      busy,
      walletLoading,
      marginModeBusy,
      orderType,
      preview,
      orderPricesReady,
      submitBlocked: tradeBlocked,
      submitBlockedReason,
      isHighLeverage,
      riskAcknowledged: riskAck.acknowledged,
      houseCounterpartyAcknowledged: houseCounterpartyAck.acknowledged,
      insufficientAvail,
    }),
    [
      busy,
      walletLoading,
      marginModeBusy,
      orderType,
      preview,
      orderPricesReady,
      tradeBlocked,
      submitBlockedReason,
      isHighLeverage,
      riskAck.acknowledged,
      houseCounterpartyAck.acknowledged,
      insufficientAvail,
    ],
  );

  const submitDisabled = resolveFuturesOrderSubmitDisabled(submitState);
  const submitDisabledReason = resolveSubmitDisabledReason({
    domain: 'futures',
    state: submitState,
  });

  return (
    <section
      data-testid="futures-order-ticket"
      className={cn(
        'border-line bg-surface flex min-h-0 flex-col rounded-(--ds-radius-lg) border',
        className,
      )}
    >
      <header className="border-line border-b px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-foreground m-0 text-sm font-semibold">{t('trade.order.title')}</h2>
          {earnVipTier ? <TradeTierFeeBadge tier={earnVipTier} /> : null}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <TradeHelpTip termId="long" className="text-xs" />
            <Button
              type="button"
              variant={side === 'long' ? 'primary' : 'outline'}
              className={cn(side === 'long' && 'bg-market-up text-black hover:bg-market-up/90')}
              onClick={() => setSide('long')}
            >
              {t('trade.order.long')}
            </Button>
          </div>
          <div className="flex flex-col gap-1">
            <TradeHelpTip termId="short" className="text-xs" />
            <Button
              type="button"
              variant={side === 'short' ? 'primary' : 'outline'}
              className={cn(side === 'short' && 'bg-market-down hover:bg-market-down/90')}
              onClick={() => setSide('short')}
            >
              {t('trade.order.short')}
            </Button>
          </div>
        </div>

        <Tabs value={orderType} onValueChange={(value) => setOrderType(value as typeof orderType)}>
          <TabsList className="grid w-full grid-cols-4" data-testid="futures-order-type-tabs">
            <TabsTrigger value="market">{t('trade.order.market')}</TabsTrigger>
            <TabsTrigger value="limit">{t('trade.order.limit')}</TabsTrigger>
            <TabsTrigger value="stop_market">{t('trade.order.stop')}</TabsTrigger>
            <TabsTrigger value="stop_limit">{t('trade.order.stopLimit')}</TabsTrigger>
          </TabsList>
          <TabsContent value="limit" className="mt-3">
            <label className="flex flex-col gap-1">
              <span className="text-foreground-muted text-xs">{t('trade.order.limitPrice')}</span>
              <Input
                inputMode="decimal"
                value={limitPrice}
                onChange={(event) => setLimitPrice(event.target.value)}
                data-testid="futures-limit-price-input"
              />
            </label>
          </TabsContent>
          <TabsContent value="stop_market" className="mt-3">
            <label className="flex flex-col gap-1">
              <span className="text-foreground-muted text-xs">{t('trade.order.triggerPrice')}</span>
              <Input
                inputMode="decimal"
                value={stopPrice}
                onChange={(event) => setStopPrice(event.target.value)}
              />
            </label>
          </TabsContent>
          <TabsContent value="stop_limit" className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-foreground-muted text-xs">{t('trade.order.triggerPrice')}</span>
              <Input
                inputMode="decimal"
                value={stopPrice}
                onChange={(event) => setStopPrice(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-foreground-muted text-xs">{t('trade.order.limitPrice')}</span>
              <Input
                inputMode="decimal"
                value={limitPrice}
                onChange={(event) => setLimitPrice(event.target.value)}
              />
            </label>
          </TabsContent>
        </Tabs>

        <SpendCurrencySelector
          value={marginCurrency}
          onChange={setMarginCurrency}
          testId="futures-margin-currency-selector"
          currencyTestIdPrefix="margin-currency"
          showHelpTip
          disabled={busy || tradeBlocked}
        />

        <label className="flex flex-col gap-1">
          <span className="text-foreground-muted flex items-center gap-1 text-xs">
            {t('trade.margin')}
            <TradeHelpTip termId="margin" className="text-xs" />
          </span>
          <Input
            inputMode="decimal"
            value={margin}
            onChange={(event) => onMarginInput(event.target.value)}
            data-testid="futures-margin-input"
            onKeyDown={(event) =>
              handleOrderTicketEnterSubmit(event, {
                disabled: submitDisabled,
                onSubmit: () => wire.requestSubmitOpen(),
              })
            }
            aria-label={t('trade.margin')}
          />
        </label>

        <OrderTicketBalanceChips avail={avail} amount={margin} onAmountChange={onMarginInput} />

        <LeverageControl
          leverage={leverage}
          maxLeverage={maxLeverageNum}
          onLeverageChange={setLeverage}
          t={t}
          showBeginnerHelp
        />

        <PositionModeFixedLabel t={t} showBeginnerHelp />

        <dl className="m-0 grid gap-2 text-sm" data-testid="futures-order-ticket-metrics">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-foreground-muted">{t('trade.order.avail')}</dt>
            <dd className="m-0" data-testid="futures-ticket-avail">
              <TradeMoneyWithFiatHint
                amount={avail}
                currency={marginCurrency}
                showCurrency
                className="text-foreground text-sm font-medium"
              />
            </dd>
          </div>
          <div
            className="border-line grid gap-2 rounded-(--ds-radius-md) border px-2 py-2"
            data-testid="futures-desk-balances"
          >
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-foreground-muted text-xs">USDT</dt>
              <dd className="m-0">
                <TradeMoneyWithFiatHint
                  amount={usdtAvail}
                  currency="USDT"
                  showCurrency
                  className="text-foreground text-sm font-medium"
                />
              </dd>
            </div>
            <TradePhonBalanceBreakdown
              phonBonusAvailableDisplay={phonBonusAvailableDisplay}
              phonRealAvailableDisplay={phonRealAvailableDisplay}
              phonAvail={phonAvail}
              t={t}
            />
          </div>
          {preview ? (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-foreground-muted">{t('trade.positionSize')}</dt>
                <dd className="text-foreground m-0 tabular-nums">{preview.notional}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-foreground-muted">{t('trade.margin')}</dt>
                <dd className="m-0">
                  <TradeMoneyWithFiatHint
                    amount={margin}
                    currency={marginCurrency}
                    showCurrency
                    className="text-foreground text-sm font-medium"
                  />
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-foreground-muted">{t('trade.order.estFee')}</dt>
                <dd className="m-0" data-testid="futures-ticket-est-fee">
                  <TradeMoneyWithFiatHint
                    amount={preview.openFee}
                    currency={marginCurrency}
                    showCurrency
                    className="text-foreground text-sm font-medium"
                  />
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-foreground-muted">{t('trade.order.estRequired')}</dt>
                <dd className="m-0">
                  <TradeMoneyWithFiatHint
                    amount={computeEstRequiredMargin(margin, preview.openFee)}
                    currency={marginCurrency}
                    showCurrency
                    className="text-foreground text-sm font-medium"
                  />
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-foreground-muted">{t('trade.order.estLiq')}</dt>
                <dd className="m-0" data-testid="futures-ticket-est-liq">
                  <TradeMoneyWithFiatHint
                    amount={preview.liquidationPrice}
                    currency="USDT"
                    showCurrency
                    className="text-foreground text-sm font-medium"
                  />
                </dd>
              </div>
            </>
          ) : null}
        </dl>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-start px-0"
          onClick={() => setAdvancedOpen((open) => !open)}
        >
          {advancedOpen ? t('trade.order.advancedHide') : t('trade.order.advanced')}
        </Button>

        {advancedOpen ? (
          <div className="flex flex-col gap-3">
            <MarginModeSegment
              marginMode={marginMode}
              setMarginMode={setMarginMode}
              marginModeBusy={marginModeBusy}
              crossMarginEnabled={crossMarginEnabled}
              t={t}
              showBeginnerHelp
            />
            {orderType === 'limit' && TRADE_FUTURES_UI_CAPABILITIES.timeInForce ? (
              <label className="flex flex-col gap-1">
                <span className="text-foreground-muted text-xs">
                  {t('trade.order.timeInForce')}
                </span>
                <select
                  className="border-line bg-surface-raised text-foreground min-h-10 rounded-(--ds-radius-md) border px-2 text-sm"
                  value={wire.timeInForce}
                  onChange={(event) =>
                    wire.setTimeInForce(event.target.value as FuturesTimeInForce)
                  }
                  data-testid="futures-time-in-force"
                  aria-label={t('trade.order.timeInForce')}
                >
                  <option value="gtc">{t('trade.order.tifGtc')}</option>
                  <option value="post_only">{t('trade.order.tifPostOnly')}</option>
                  <option value="ioc">{t('trade.order.tifIoc')}</option>
                  <option value="fok">{t('trade.order.tifFok')}</option>
                </select>
              </label>
            ) : null}
            {orderType === 'limit' && TRADE_FUTURES_UI_CAPABILITIES.icebergOrders ? (
              <label className="flex flex-col gap-1">
                <span className="text-foreground-muted text-xs">{t('trade.order.icebergQty')}</span>
                <Input
                  inputMode="decimal"
                  value={wire.displayQuantity}
                  onChange={(event) => wire.setDisplayQuantity(event.target.value)}
                  placeholder={t('trade.order.icebergQtyOptional')}
                  data-testid="futures-iceberg-qty"
                  aria-label={t('trade.order.icebergQty')}
                />
              </label>
            ) : null}
            {supportsEntryTpSlOnOrderType(orderType) ? (
              <>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={wire.tpEnabled}
                    onChange={(event) => wire.setTpEnabled(event.target.checked)}
                  />
                  {t('trade.order.tpEnable')}
                </label>
                {wire.tpEnabled ? (
                  <Input
                    inputMode="decimal"
                    value={wire.tpPrice}
                    onChange={(event) => wire.setTpPrice(event.target.value)}
                    aria-label={t('trade.order.tp')}
                  />
                ) : null}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={wire.slEnabled}
                    onChange={(event) => wire.setSlEnabled(event.target.checked)}
                  />
                  {t('trade.order.slEnable')}
                </label>
                {wire.slEnabled ? (
                  <Input
                    inputMode="decimal"
                    value={wire.slPrice}
                    onChange={(event) => wire.setSlPrice(event.target.value)}
                    aria-label={t('trade.order.sl')}
                  />
                ) : null}
              </>
            ) : (
              <p
                className="text-foreground-muted m-0 text-xs"
                data-testid="futures-entry-tpsl-defer-hint"
              >
                {t('trade.order.entryTpSlDeferHint')}
              </p>
            )}
          </div>
        ) : null}

        {isHighLeverage && !riskAck.acknowledged ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="trading-risk-ack"
            disabled={riskAck.busy}
            onClick={() => void riskAck.acknowledge()}
          >
            {t('trade.riskAckCta')}
          </Button>
        ) : null}

        <TradeHouseCounterpartyAckButton ack={houseCounterpartyAck} t={t} />

        {insufficientAvail ? (
          <p className="text-market-down m-0 text-sm">{t('error.INSUFFICIENT_BALANCE')}</p>
        ) : null}

        {submitDisabled && submitDisabledReason && !insufficientAvail ? (
          <p className="text-warning m-0 text-sm" data-testid="futures-submit-blocked-reason">
            {t(submitDisabledReason)}
          </p>
        ) : null}

        {primarySubmit === 'inline' ? (
          <Button
            type="button"
            data-testid="futures-submit"
            disabled={submitDisabled}
            loading={busy}
            className={cn(
              'min-h-11 w-full',
              side === 'long'
                ? 'bg-market-up text-black hover:bg-market-up/90'
                : 'bg-market-down hover:bg-market-down/90',
            )}
            onClick={() => wire.requestSubmitOpen()}
          >
            {side === 'long' ? t('trade.order.submitLong') : t('trade.order.submitShort')}
          </Button>
        ) : null}
      </div>

      <FuturesConfirmDialog wire={wire} />
    </section>
  );
}

function FuturesConfirmDialog({ wire }: { wire: FuturesDeskWire }) {
  const {
    confirmOpen,
    setConfirmOpen,
    confirmNotice,
    tradeBlocked,
    canConfirm,
    busy,
    side,
    market,
    price,
    margin,
    marginCurrency,
    leverage,
    preview,
    orderType,
    submitOpen,
    houseCounterpartyAck,
    t,
  } = wire;

  return (
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      contentTestId={TRADE_DESK_CONFIRM_DIALOG_TEST_ID}
      title={t('confirm.futuresOpen.title')}
      description={t('trade.confirm.review')}
      summary={
        <dl className="m-0 grid gap-2">
          {confirmNotice ? <p className="text-warning m-0 text-sm">{t(confirmNotice)}</p> : null}
          <p
            className="text-foreground-muted m-0 text-xs"
            data-testid="futures-confirm-house-counterparty-notice"
          >
            {t('trade.houseCounterpartyConfirmNotice')}
          </p>
          {!houseCounterpartyAck.acknowledged ? (
            <TradeHouseCounterpartyAckButton ack={houseCounterpartyAck} t={t} />
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-foreground-muted">{t('confirm.row.market')}</dt>
            <dd className="text-foreground m-0">{market?.display_name ?? market?.symbol ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-foreground-muted">{t('confirm.row.side')}</dt>
            <dd className="text-foreground m-0">
              {t(side === 'long' ? 'trade.long' : 'trade.short')}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-foreground-muted">{t('confirm.row.leverage')}</dt>
            <dd className="text-foreground m-0 tabular-nums">{leverage}x</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-foreground-muted">{t('confirm.row.markPrice')}</dt>
            <dd className="text-foreground m-0 tabular-nums">
              <TradeMoneyWithFiatHint amount={price} currency="USDT" showCurrency />
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-foreground-muted">{t('trade.margin')}</dt>
            <dd className="text-foreground m-0 tabular-nums">
              <TradeMoneyWithFiatHint amount={margin} currency={marginCurrency} showCurrency />
            </dd>
          </div>
          {orderType === 'market' && preview ? (
            <>
              <div className="flex justify-between gap-3">
                <dt className="text-foreground-muted">{t('trade.liquidationPrice')}</dt>
                <dd className="text-foreground m-0 tabular-nums">
                  <TradeMoneyWithFiatHint
                    amount={preview.liquidationPrice}
                    currency="USDT"
                    showCurrency
                  />
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-foreground-muted">{t('trade.openFee')}</dt>
                <dd className="text-foreground m-0 tabular-nums">
                  <TradeMoneyWithFiatHint
                    amount={preview.openFee}
                    currency={marginCurrency}
                    showCurrency
                  />
                </dd>
              </div>
            </>
          ) : orderType !== 'market' ? (
            <div className="flex justify-between gap-3">
              <dt className="text-foreground-muted">{t('trade.liquidationPrice')}</dt>
              <dd className="text-foreground-muted m-0 text-sm">
                {t('trade.confirm.liqAfterFill')}
              </dd>
            </div>
          ) : null}
          <TradeConfirmSettingsLink />
        </dl>
      }
      confirmLabel={side === 'long' ? t('trade.order.submitLong') : t('trade.order.submitShort')}
      loading={busy}
      confirmDisabled={!houseCounterpartyAck.acknowledged}
      onConfirm={() => {
        if (!canConfirm || tradeBlocked || !houseCounterpartyAck.acknowledged) return;
        void submitOpen();
      }}
    />
  );
}
