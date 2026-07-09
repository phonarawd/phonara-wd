import { useMemo } from 'react';
import { toDecimal } from '@phonara/money';

import {
  resolveFuturesOrderSubmitDisabled,
  resolveSpotOrderSubmitDisabled,
  resolveSubmitDisabledReason,
} from '@/domain/trade-submit-display-contract';
import type { FuturesDeskWire } from '@/features/trading/use-futures-desk-wire';
import type { SpotDeskWire } from '@/features/trading/use-spot-desk-wire';
import { Button } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';

export type SpotMobileStickyCtaProps = {
  wire: SpotDeskWire;
};

export function SpotMobileStickyCta({ wire }: SpotMobileStickyCtaProps) {
  const {
    side,
    baseLabel,
    busy,
    tradeBlocked,
    estimate,
    orderType,
    orderPricesReady,
    submitBlockedReason,
    insufficientAvail,
    houseCounterpartyAck,
    t,
  } = wire;

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
  const showDisabledVisual = submitDisabled || busy;

  return (
    <div className="flex flex-col gap-2">
      {insufficientAvail ? (
        <p className="text-market-down m-0 text-sm" data-testid="spot-mobile-sticky-submit-reason">
          {t('error.INSUFFICIENT_BALANCE')}
        </p>
      ) : null}
      {submitDisabled && submitDisabledReason && !insufficientAvail ? (
        <p className="text-market-down m-0 text-sm" data-testid="spot-mobile-sticky-submit-reason">
          {t(submitDisabledReason)}
        </p>
      ) : null}
      <Button
        type="button"
        data-testid="spot-mobile-sticky-submit"
        data-disabled-visual={showDisabledVisual ? 'true' : undefined}
        disabled={submitDisabled}
        loading={busy}
        className={cn(
          'min-h-12 w-full',
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
    </div>
  );
}

export type FuturesMobileStickyCtaProps = {
  wire: FuturesDeskWire;
};

export function FuturesMobileStickyCta({ wire }: FuturesMobileStickyCtaProps) {
  const {
    side,
    margin,
    preview,
    busy,
    walletLoading,
    tradeBlocked,
    submitBlockedReason,
    isHighLeverage,
    riskAck,
    houseCounterpartyAck,
    orderType,
    orderPricesReady,
    marginModeBusy,
    avail,
    t,
  } = wire;

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
    <div className="flex flex-col gap-2">
      {insufficientAvail ? (
        <p
          className="text-market-down m-0 text-sm"
          data-testid="futures-mobile-sticky-submit-reason"
        >
          {t('error.INSUFFICIENT_BALANCE')}
        </p>
      ) : null}
      {submitDisabled && submitDisabledReason && !insufficientAvail ? (
        <p
          className="text-market-down m-0 text-sm"
          data-testid="futures-mobile-sticky-submit-reason"
        >
          {t(submitDisabledReason)}
        </p>
      ) : null}
      <Button
        type="button"
        data-testid="futures-mobile-sticky-submit"
        disabled={submitDisabled}
        loading={busy}
        className={cn(
          'min-h-12 w-full',
          side === 'long'
            ? 'bg-market-up text-black hover:bg-market-up/90'
            : 'bg-market-down hover:bg-market-down/90',
        )}
        onClick={() => wire.requestSubmitOpen()}
      >
        {side === 'long' ? t('trade.order.submitLong') : t('trade.order.submitShort')}
      </Button>
    </div>
  );
}
