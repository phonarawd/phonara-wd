import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';
import {
  showTradeFeedback,
  showTradeRpcErrorFeedback,
  tradeFeedbackDedupId,
} from '@/features/trading/trade-feedback-display';
import { useHouseCounterpartyAcknowledgement } from '@/features/trading/use-house-counterparty-acknowledgement';
import { resolveSpotTicketEstimates } from '@/features/trading/order-ticket/order-ticket-display';
import type { OrderType } from '@/features/trading/order-ticket/order-ticket-types';
import { TRADE_SPOT_UI_CAPABILITIES } from '@/features/trading/trade-rpc-capabilities';
import type { Currency } from '@phonara/shared-types';

import { toDecimal } from '@phonara/money';

import { resolveTradeOrderConfirmRequired } from '@/domain/trade-settings-prefs-display-contract';
import { resolveTradeDeskSubmitGate } from '@/domain/trade-submit-display-contract';
import {
  filterSpotDeskOpenOrders,
  parseSpotPairSymbol,
  readSpotTradeReceivedAmount,
  resolveSpotAvailableBalance,
  resolveSpotBuyReceiveAsset,
  resolveSpotBuyStakeCurrency,
  resolveSpotSellReceiveCurrency,
  canSelectSpotPhonBuyStake,
} from '@/domain/spot-stake-display-contract';
import { resolveSpotBaseQuantityPrecision } from '@/domain/spot-base-quantity-display-contract';
import { useConfirmSnapshot } from '@/hooks/use-confirm-snapshot';
import { usePlatformGates } from '@/hooks/use-platform-gates';
import { useClientGatePrechecks } from '@/hooks/use-client-gate-prechecks';
import {
  mapSpotOpenOrderToTradingDisplay,
  tradingKeys,
  useCancelSpotOrder,
  useSpotActions,
  useSpotOpenOrders,
  useSpotOrderFills,
  useSpotHoldings,
  useReferenceBook,
  type TradingOrderFill,
} from '@/hooks/use-trading';
import { isPositiveAmount } from '@/lib/money-display';
import { normalizeDecimalInput } from '@/lib/money-input';
import { useExchangeDisplayPrice } from '@/features/trading/display-chart/use-exchange-display-price';
import { formatOraclePriceDisplay } from '@/features/trading/format-oracle-price-display';
import { useTradeEarnVipTier } from '@/features/trading/use-trade-earn-vip-tier';
import { useTradeOracleRealtimeDisconnected } from '@/features/trading/use-trade-oracle-realtime-disconnected';
import { useOrderBook } from '@/features/trading/market-store/use-order-book';
import { mapBookLevels, mapPriceLevels } from '@/features/trading/order-book-display';
import type { TradePageControllerView } from '@/features/trading/use-trade-page-controller';
import { useI18n } from '@/product/i18n';
import { resolveMoneyDisplayParts } from '@/product/primitives/lib/money-display-parts';

export function useSpotDeskWire(engine: TradePageControllerView) {
  const qc = useQueryClient();
  const {
    selectedSpotMarket,
    spotMarkets,
    setSelectedSpotSymbol,
    prices,
    usdtAvail,
    phonAvail,
    phonBonusAvailableDisplay,
    phonRealAvailableDisplay,
    isPriceStale,
    isPriceFrozen,
    t,
  } = engine;

  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('10');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  /** E12 race: confirm opened while fresh — allow one submit after oracle goes stale. */
  const [confirmStaleRacePending, setConfirmStaleRacePending] = useState(false);
  const confirmStaleRaceSubmitRef = useRef(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [submitStaleLatch, setSubmitStaleLatch] = useState(false);
  const {
    orders: spotOpenOrdersRaw,
    loading: openOrdersLoading,
    refresh: refreshOpenOrders,
  } = useSpotOpenOrders();
  const { fills: spotFillsRaw, loading: fillsLoading, refresh: refreshFills } = useSpotOrderFills();

  const onTradingChange = useCallback(() => {
    refreshOpenOrders();
    refreshFills();
  }, [refreshOpenOrders, refreshFills]);

  const {
    buyMarket,
    sellMarket,
    placeLimitOrder,
    placeStopOrder,
    busy: spotBusy,
    error: spotError,
  } = useSpotActions(onTradingChange);
  const {
    cancelSpotOrder,
    busy: cancelBusy,
    error: cancelError,
  } = useCancelSpotOrder(onTradingChange);
  const { spotBlocked } = usePlatformGates();
  const { consentBlocked } = useClientGatePrechecks();
  const { data: earnVipTier } = useTradeEarnVipTier();
  const houseCounterpartyAck = useHouseCounterpartyAcknowledgement();
  const { holdingByAsset } = useSpotHoldings();
  const { locale } = useI18n();

  const spotSymbolSet = useMemo(
    () => new Set(spotMarkets.map((spotMarket) => spotMarket.symbol)),
    [spotMarkets],
  );
  const spotOpenOrders = useMemo(
    () =>
      filterSpotDeskOpenOrders(spotOpenOrdersRaw, spotSymbolSet).map(
        mapSpotOpenOrderToTradingDisplay,
      ),
    [spotOpenOrdersRaw, spotSymbolSet],
  );
  const fills = useMemo(
    (): TradingOrderFill[] =>
      spotFillsRaw.map((fill) => ({
        id: fill.id,
        order_id: fill.order_id,
        fill_price: fill.fill_price,
        fill_quantity: fill.fill_quantity,
        fee: fill.fee,
        created_at: fill.created_at,
        market: fill.market,
        side: fill.side === 'buy' ? 'long' : 'short',
        order_type: fill.order_type,
        margin_currency: fill.stake_currency,
        leverage: '1',
      })),
    [spotFillsRaw],
  );

  const market = selectedSpotMarket;
  const pairParts = market ? parseSpotPairSymbol(market.symbol) : null;
  const baseLabel = pairParts?.baseAsset ?? 'PHON';
  const quoteLabel = pairParts?.quoteAsset ?? 'USDT';
  const pairLabel = market?.display_name ?? `${baseLabel}/${quoteLabel}`;

  const buyStakeCurrencyDefault = market ? resolveSpotBuyStakeCurrency(market.symbol) : 'USDT';
  const [buyStakeCurrency, setBuyStakeCurrency] = useState<'USDT' | 'PHON'>(
    buyStakeCurrencyDefault,
  );

  useEffect(() => {
    if (!market?.symbol) return;
    setBuyStakeCurrency(resolveSpotBuyStakeCurrency(market.symbol));
  }, [market?.symbol]);

  const sellReceiveCurrency = market ? resolveSpotSellReceiveCurrency(market.symbol) : 'USDT';
  const buyReceiveAsset = market ? resolveSpotBuyReceiveAsset(market.symbol) : baseLabel;
  const canSelectPhonBuyStake = market ? canSelectSpotPhonBuyStake(market.symbol) : false;

  const baseHoldingQty = market ? (holdingByAsset[baseLabel] ?? '0') : '0';
  const availBalance = market
    ? resolveSpotAvailableBalance(
        side,
        market.symbol,
        { phonAvail, usdtAvail },
        baseHoldingQty,
        side === 'buy' ? buyStakeCurrency : undefined,
      )
    : { amount: '0', currency: quoteLabel };

  const { referenceBook } = useReferenceBook(market?.symbol ?? null);
  const liveBook = useOrderBook(market?.symbol ?? null);
  const bookFeedStale = liveBook?.feedStale ?? false;

  const liveAsks = !bookFeedStale ? (liveBook?.asks ?? []) : [];
  const liveBids = !bookFeedStale ? (liveBook?.bids ?? []) : [];

  const bookDisplaySource = useMemo<'live' | 'synthetic'>(() => {
    if (liveAsks.length > 0 || liveBids.length > 0) return 'live';
    if (referenceBook?.asks?.length || referenceBook?.bids?.length) return 'synthetic';
    return 'live';
  }, [liveAsks.length, liveBids.length, referenceBook?.asks?.length, referenceBook?.bids?.length]);

  const asks = useMemo(
    () =>
      liveAsks.length
        ? mapPriceLevels(liveAsks)
        : referenceBook?.asks?.length
          ? mapBookLevels(referenceBook.asks)
          : [],
    [liveAsks, referenceBook?.asks],
  );
  const bids = useMemo(
    () =>
      liveBids.length
        ? mapPriceLevels(liveBids)
        : referenceBook?.bids?.length
          ? mapBookLevels(referenceBook.bids)
          : [],
    [liveBids, referenceBook?.bids],
  );

  const price = market ? (prices[market.symbol] ?? '0') : '0';
  const priceStale = market ? isPriceStale(market.symbol) : false;
  const priceFrozen = market ? isPriceFrozen(market.symbol) : false;
  const effectivePriceStale = priceStale || submitStaleLatch;
  const realtimeDisconnected = useTradeOracleRealtimeDisconnected();
  const { submitBlocked: tradeBlocked, reasonKey: submitBlockedReason } =
    resolveTradeDeskSubmitGate({
      desk: 'spot',
      deskBlocked: spotBlocked,
      consentBlocked,
      priceStale: effectivePriceStale,
      priceFrozen,
      realtimeDisconnected,
    });
  const oraclePriceDisplay = formatOraclePriceDisplay(price === '0' ? undefined : price, price);
  const { exchangePriceDisplay, exchangePriceRaw } = useExchangeDisplayPrice(
    market?.symbol ?? null,
  );
  const priceDisplay = exchangePriceDisplay ?? oraclePriceDisplay;
  const lastPriceRaw = exchangePriceRaw ?? (price !== '0' ? price : null);

  const confirmFingerprint = `${market?.symbol ?? ''}:${price}:${amount}:${side}:${orderType}:${limitPrice}:${stopPrice}`;

  const orderPricesReady =
    orderType === 'market' ||
    (orderType === 'limit' && isPositiveAmount(limitPrice)) ||
    (orderType === 'stop_market' && isPositiveAmount(stopPrice)) ||
    (orderType === 'stop_limit' && isPositiveAmount(stopPrice) && isPositiveAmount(limitPrice));

  const estimatePrice =
    orderType === 'limit' && isPositiveAmount(limitPrice)
      ? limitPrice
      : orderType === 'stop_market' && isPositiveAmount(stopPrice)
        ? stopPrice
        : orderType === 'stop_limit' && isPositiveAmount(limitPrice)
          ? limitPrice
          : price;
  const handleConfirmDrift = useCallback(() => {
    showTradeFeedback({ eventId: 'trade.confirm.priceChanged' });
  }, []);
  const { canConfirm: snapshotCanConfirm, isDrifted } = useConfirmSnapshot({
    open: confirmOpen,
    fingerprint: confirmFingerprint,
    onDrift: handleConfirmDrift,
  });
  const canConfirm =
    snapshotCanConfirm ||
    (confirmOpen && (confirmStaleRacePending || confirmStaleRaceSubmitRef.current));

  useEffect(() => {
    if (!spotError) return;
    showTradeRpcErrorFeedback(spotError);
    void qc.invalidateQueries({ queryKey: tradingKeys.prices() });
    if (spotError === 'error.NO_PRICE') {
      setSubmitStaleLatch(true);
    }
  }, [qc, spotError]);

  useEffect(() => {
    if (!cancelError) return;
    showTradeRpcErrorFeedback(cancelError);
  }, [cancelError]);

  useEffect(() => {
    setAmount(side === 'buy' ? '10' : '');
  }, [market?.symbol, side]);

  useEffect(() => {
    if (!market?.symbol) return;
    setSubmitStaleLatch(false);
  }, [market?.symbol, price]);

  const spotEstimates = useMemo(
    () =>
      market
        ? resolveSpotTicketEstimates({
            side,
            symbol: market.symbol,
            price: estimatePrice,
            amount,
            feeRate: market.fee_rate ?? '0.001',
            buyStakeCurrency,
            phonUsdtPrice: prices['PHON_USDT'],
          })
        : null,
    [amount, buyStakeCurrency, estimatePrice, market, prices, side],
  );

  const estimate = spotEstimates?.netReceive ?? null;
  const estimateCurrency =
    spotEstimates?.receiveCurrency ?? (side === 'buy' ? buyReceiveAsset : sellReceiveCurrency);
  const estimateFee = spotEstimates?.estFee ?? null;
  const estimateFeeCurrency = spotEstimates?.feeCurrency ?? estimateCurrency;

  const insufficientAvail = useMemo(() => {
    if (!isPositiveAmount(amount)) return false;
    try {
      return toDecimal(amount).greaterThan(toDecimal(availBalance.amount));
    } catch {
      return false;
    }
  }, [amount, availBalance.amount]);

  useEffect(() => {
    if (!confirmOpen) {
      confirmStaleRaceSubmitRef.current = false;
      setConfirmStaleRacePending(false);
    }
  }, [confirmOpen]);

  const submit = useCallback(async () => {
    const allowStaleRaceSubmit = confirmStaleRaceSubmitRef.current || confirmStaleRacePending;
    confirmStaleRaceSubmitRef.current = false;
    setConfirmStaleRacePending(false);
    if ((!allowStaleRaceSubmit && tradeBlocked) || !market) return;
    if (!allowStaleRaceSubmit && !orderPricesReady) return;
    setConfirmOpen(false);

    const stakeCurrency = side === 'buy' ? buyStakeCurrency : sellReceiveCurrency;

    if (orderType === 'limit') {
      if (!isPositiveAmount(limitPrice)) return;
      const result = await placeLimitOrder({
        market: market.symbol,
        side,
        stakeCurrency,
        amount,
        limitPrice,
      });
      if (result) showTradeFeedback({ eventId: 'spot.limit.placed' });
      return;
    }

    if (orderType === 'stop_market') {
      if (!isPositiveAmount(stopPrice)) return;
      const result = await placeStopOrder({
        market: market.symbol,
        side,
        stakeCurrency,
        amount,
        stopPrice,
        orderType: 'stop_market',
      });
      if (result) showTradeFeedback({ eventId: 'spot.limit.placed' });
      return;
    }

    if (orderType === 'stop_limit') {
      if (!isPositiveAmount(stopPrice) || !isPositiveAmount(limitPrice)) return;
      const result = await placeStopOrder({
        market: market.symbol,
        side,
        stakeCurrency,
        amount,
        stopPrice,
        orderType: 'stop_limit',
        limitPrice,
      });
      if (result) showTradeFeedback({ eventId: 'spot.limit.placed' });
      return;
    }

    const result =
      side === 'buy'
        ? await buyMarket(market.symbol, buyStakeCurrency, amount)
        : await sellMarket(market.symbol, sellReceiveCurrency, amount);
    if (result) {
      const received = readSpotTradeReceivedAmount(side, market.symbol, result);
      const displayCurrency: Currency =
        received.currency === 'PHON' || received.currency === 'USDT' || received.currency === 'KRW'
          ? received.currency
          : 'USDT';
      const { amountText } = resolveMoneyDisplayParts(received.amount, displayCurrency);
      showTradeFeedback({
        eventId: side === 'buy' ? 'spot.market.buy' : 'spot.market.sell',
        values:
          side === 'buy'
            ? { amount: amountText, base: buyReceiveAsset }
            : { amount: amountText, quote: quoteLabel },
      });
    }
  }, [
    tradeBlocked,
    market,
    orderPricesReady,
    confirmStaleRacePending,
    orderType,
    side,
    buyMarket,
    buyStakeCurrency,
    amount,
    sellMarket,
    sellReceiveCurrency,
    buyReceiveAsset,
    quoteLabel,
    limitPrice,
    stopPrice,
    placeLimitOrder,
    placeStopOrder,
  ]);

  const requestSubmit = useCallback(() => {
    if (tradeBlocked || !market) return;
    if (resolveTradeOrderConfirmRequired()) {
      confirmStaleRaceSubmitRef.current = true;
      setConfirmStaleRacePending(true);
      setConfirmOpen(true);
      return;
    }
    void submit();
  }, [tradeBlocked, market, submit]);

  const submitCancelOrder = useCallback(
    async (orderId: string) => {
      setCancellingOrderId(orderId);
      try {
        const result = await cancelSpotOrder(orderId);
        if (result) {
          showTradeFeedback({
            eventId: 'spot.order.canceled',
            dedupId: tradeFeedbackDedupId('spot.order.canceled', orderId),
          });
        }
      } finally {
        setCancellingOrderId(null);
      }
    },
    [cancelSpotOrder],
  );

  const onLimitPriceInput = useCallback((value: string) => {
    setLimitPrice(normalizeDecimalInput(value));
  }, []);

  const onStopPriceInput = useCallback((value: string) => {
    setStopPrice(normalizeDecimalInput(value));
  }, []);

  const onAmountInput = useCallback((value: string) => {
    setAmount(normalizeDecimalInput(value));
  }, []);

  const onBookPriceClick = useCallback(
    (price: string, bookSide: 'ask' | 'bid') => {
      setOrderType('limit');
      setLimitPrice(normalizeDecimalInput(price));
      setSide(bookSide === 'ask' ? 'buy' : 'sell');
    },
    [setSide],
  );

  const confirmNotice: MessageKey | undefined =
    tradeBlocked && confirmOpen
      ? (submitBlockedReason ?? 'trade.confirm.staleBlocked')
      : isDrifted
        ? 'trade.confirm.priceChanged'
        : undefined;

  return {
    spotMarkets,
    market,
    baseLabel,
    quoteLabel,
    pairLabel,
    buyStakeCurrency,
    setBuyStakeCurrency,
    canSelectPhonBuyStake,
    sellReceiveCurrency,
    buyReceiveAsset,
    availBalance,
    price,
    priceDisplay,
    lastPriceRaw,
    oraclePriceDisplay,
    side,
    setSide,
    orderType,
    setOrderType,
    limitPrice,
    setLimitPrice,
    onLimitPriceInput,
    stopPrice,
    setStopPrice,
    onStopPriceInput,
    orderPricesReady,
    spotCapabilities: TRADE_SPOT_UI_CAPABILITIES,
    amount,
    onAmountInput,
    usdtAvail,
    phonAvail,
    phonBonusAvailableDisplay,
    phonRealAvailableDisplay,
    baseHoldingQty,
    estimate,
    estimateCurrency,
    estimateFee,
    estimateFeeCurrency,
    insufficientAvail,
    busy: spotBusy,
    tradeBlocked,
    submitBlockedReason,
    priceStale: effectivePriceStale,
    confirmOpen,
    setConfirmOpen,
    canConfirm,
    confirmStaleRacePending,
    confirmNotice,
    submit,
    requestSubmit,
    onMarketChange: setSelectedSpotSymbol,
    onBookPriceClick,
    asks,
    bids,
    bookFeedStale,
    bookDisplaySource,
    pricePrecision: market?.price_precision ?? 4,
    quantityPrecision: resolveSpotBaseQuantityPrecision(
      market as { quantity_precision?: number | null } | null,
    ),
    earnVipTier,
    houseCounterpartyAck,
    spotOpenOrders,
    openOrdersLoading,
    fills,
    fillsLoading,
    cancelOrder: submitCancelOrder,
    cancellingOrderId,
    actionBusy: spotBusy || cancelBusy,
    locale,
    t,
  };
}

export type SpotDeskWire = ReturnType<typeof useSpotDeskWire>;
