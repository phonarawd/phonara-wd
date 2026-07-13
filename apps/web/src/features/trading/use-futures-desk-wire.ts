import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MessageKey } from '@phonara/i18n';
import { toDecimal } from '@phonara/money';

import { resolveTradeOrderConfirmRequired } from '@/domain/trade-settings-prefs-display-contract';
import { resolveTradeDeskSubmitGate } from '@/domain/trade-submit-display-contract';
import { useConfirmSnapshot } from '@/hooks/use-confirm-snapshot';
import { usePlatformGates } from '@/hooks/use-platform-gates';
import { useClientGatePrechecks } from '@/hooks/use-client-gate-prechecks';
import { useTradeLaunchFlags } from '@/hooks/use-trade-launch-flags';
import { useHouseCounterpartyAcknowledgement } from '@/features/trading/use-house-counterparty-acknowledgement';
import {
  useFuturesActions,
  useFuturesOrderTicket,
  useFundingPayments,
  useFundingRate,
  useMarginAccount,
  useOpenOrders,
  useReferenceBook,
  useTradingOrderFills,
  useTradingRiskAcknowledgement,
} from '@/hooks/use-trading';
import { useI18n } from '@/product/i18n';
import { formatFundingRateDisplay } from '@/lib/format-funding-rate-display';
import { isPositiveAmount } from '@/lib/money-display';
import { normalizeDecimalInput } from '@/lib/money-input';
import { useExchangeDisplayPrice } from '@/features/trading/display-chart/use-exchange-display-price';
import { formatOraclePriceDisplay } from '@/features/trading/format-oracle-price-display';
import { useTradeEarnVipTier } from '@/features/trading/use-trade-earn-vip-tier';
import { useOrderBook } from '@/features/trading/market-store/use-order-book';
import {
  canSelectMarginMode,
  resolveEffectiveMarginMode,
} from '@/features/trading/order-ticket/margin-mode-display';
import type { OrderType } from '@/features/trading/order-ticket/order-ticket-types';
import type { FuturesTimeInForce } from '@/domain/trade-order-states-display-contract';
import { TRADE_FUTURES_UI_CAPABILITIES } from '@/features/trading/trade-rpc-capabilities';
import { mapBookLevels, mapPriceLevels } from '@/features/trading/order-book-display';
import type { TradePageControllerView } from '@/features/trading/use-trade-page-controller';
import {
  showTradeFeedback,
  showTradeRpcErrorFeedback,
  tradeFeedbackDedupId,
} from '@/features/trading/trade-feedback-display';
import { useTradeOracleRealtimeDisconnected } from '@/features/trading/use-trade-oracle-realtime-disconnected';
import { registerUserInitiatedPositionClose } from '@/features/trading/trade-realtime-feedback-display';

export function useFuturesDeskWire(engine: TradePageControllerView) {
  const {
    futuresMarkets,
    futuresMarketsLoading,
    selectedFuturesMarket,
    setSelectedFuturesSymbol,
    prices,
    phonAvail,
    usdtAvail,
    phonBonusAvailableDisplay,
    phonRealAvailableDisplay,
    walletLoading,
    isPriceStale,
    isPriceFrozen,
    futuresPositions,
    positionsLoading,
    refreshFuturesPositions,
    t,
  } = engine;

  const realtimeDisconnected = useTradeOracleRealtimeDisconnected();
  const ticket = useFuturesOrderTicket({
    markets: futuresMarkets,
    prices,
    isPriceStale,
    isPriceFrozen,
    realtimeDisconnected,
    selectedSymbol: selectedFuturesMarket?.symbol ?? null,
  });

  const {
    orders: openOrders,
    loading: openOrdersLoading,
    refresh: refreshOpenOrders,
  } = useOpenOrders();
  const { fills, loading: fillsLoading, refresh: refreshFills } = useTradingOrderFills();
  const {
    payments: fundingPayments,
    loading: fundingPaymentsLoading,
    refresh: refreshFundingPayments,
  } = useFundingPayments();
  const { locale } = useI18n();
  const { data: earnVipTier } = useTradeEarnVipTier();
  const marginAccount = useMarginAccount();
  const tradeLaunchFlags = useTradeLaunchFlags();
  const fundingMarketSymbol = ticket.market?.symbol ?? selectedFuturesMarket?.symbol ?? null;
  const { rate: fundingRateRaw } = useFundingRate(fundingMarketSymbol);
  const fundingFormatted = useMemo(
    () => formatFundingRateDisplay(fundingRateRaw ?? '0'),
    [fundingRateRaw],
  );

  const onTradingChange = useCallback(() => {
    refreshFuturesPositions();
    refreshOpenOrders();
    refreshFills();
    refreshFundingPayments();
  }, [refreshFuturesPositions, refreshOpenOrders, refreshFills, refreshFundingPayments]);

  const {
    openPosition,
    placeLimitOrder,
    placeStopOrder,
    cancelOrder,
    closePosition: closePositionRpc,
    partialClosePosition: partialClosePositionRpc,
    adjustIsolatedMargin: adjustIsolatedMarginRpc,
    updateFuturesPositionSltp: updateFuturesPositionSltpRpc,
    setTrailingStop: setTrailingStopRpc,
    clearTrailingStop: clearTrailingStopRpc,
    busy,
    error,
  } = useFuturesActions(onTradingChange);
  const riskAck = useTradingRiskAcknowledgement();
  const houseCounterpartyAck = useHouseCounterpartyAcknowledgement();
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [closingPositionId, setClosingPositionId] = useState<string | null>(null);
  const [partialClosingPositionId, setPartialClosingPositionId] = useState<string | null>(null);
  const [adjustingMarginPositionId, setAdjustingMarginPositionId] = useState<string | null>(null);
  const [updatingSltpPositionId, setUpdatingSltpPositionId] = useState<string | null>(null);
  const [trailingStopPositionId, setTrailingStopPositionId] = useState<string | null>(null);

  useEffect(() => {
    if (error) showTradeRpcErrorFeedback(error);
  }, [error]);
  useEffect(() => {
    if (riskAck.error) showTradeRpcErrorFeedback(riskAck.error);
  }, [riskAck.error]);
  useEffect(() => {
    if (marginAccount.error) showTradeRpcErrorFeedback(marginAccount.error);
  }, [marginAccount.error]);

  const { referenceBook } = useReferenceBook(ticket.market?.symbol ?? null);
  const liveBook = useOrderBook(ticket.market?.symbol ?? null);
  const bookFeedStale = liveBook?.feedStale ?? false;
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [timeInForce, setTimeInForce] = useState<FuturesTimeInForce>('gtc');
  const [displayQuantity, setDisplayQuantity] = useState('');
  const [reduceOnly, setReduceOnly] = useState(false);

  const {
    market,
    price,
    priceStale,
    priceFrozen,
    maxLeverage,
    isHighLeverage,
    preview,
    side,
    setSide,
    marginCurrency,
    setMarginCurrency,
    margin,
    setMargin,
    leverage,
    setLeverage,
    confirmOpen,
    setConfirmOpen,
    slEnabled,
    slPrice,
    setSlEnabled,
    setSlPrice,
    tpEnabled,
    tpPrice,
    setTpEnabled,
    setTpPrice,
    setMarketIdx,
  } = ticket;

  const { futuresBlocked } = usePlatformGates();
  const { consentBlocked } = useClientGatePrechecks();
  const { submitBlocked: tradeBlocked, reasonKey: submitBlockedReason } =
    resolveTradeDeskSubmitGate({
      desk: 'futures',
      deskBlocked: futuresBlocked,
      consentBlocked,
      priceStale,
      priceFrozen,
      realtimeDisconnected,
    });
  const confirmFingerprint = `${price}:${side}:${margin}:${leverage}:${marginCurrency}:${market?.symbol ?? ''}`;

  const handleConfirmDrift = useCallback(() => {
    showTradeFeedback({ eventId: 'trade.confirm.priceChanged' });
  }, []);

  const { canConfirm, isDrifted } = useConfirmSnapshot({
    open: confirmOpen,
    fingerprint: confirmFingerprint,
    onDrift: handleConfirmDrift,
  });

  const liveAsks = !bookFeedStale ? (liveBook?.asks ?? []) : [];
  const liveBids = !bookFeedStale ? (liveBook?.bids ?? []) : [];

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

  const baseLabel = market?.base_label ?? selectedFuturesMarket?.base_label ?? 'BTC';
  const pairLabel = market?.display_name ?? `${baseLabel}/USDT`;
  const avail = marginCurrency === 'USDT' ? usdtAvail : phonAvail;

  const rawPrice = market ? (prices[market.symbol] ?? '0') : '0';
  const oracleMarkUnavailable =
    !rawPrice || rawPrice === '0' || (market ? isPriceStale(market.symbol) : false);
  const oraclePriceDisplay = formatOraclePriceDisplay(oracleMarkUnavailable ? undefined : rawPrice);
  const { exchangePriceDisplay } = useExchangeDisplayPrice(market?.symbol ?? null);
  const priceDisplay = exchangePriceDisplay ?? oraclePriceDisplay;

  const crossMarginEnabled = tradeLaunchFlags.crossMarginEnabled;
  const marginMode = resolveEffectiveMarginMode(marginAccount.marginMode, crossMarginEnabled);

  const setMarginMode = useCallback(
    async (mode: 'isolated' | 'cross') => {
      if (!canSelectMarginMode(mode, crossMarginEnabled)) {
        showTradeRpcErrorFeedback('error.CROSS_MARGIN_NOT_AVAILABLE');
        return null;
      }
      return marginAccount.setMarginMode(mode);
    },
    [crossMarginEnabled, marginAccount],
  );

  const setPositionMode = useCallback(
    async (mode: 'one_way' | 'hedge') => {
      return marginAccount.setPositionMode(mode);
    },
    [marginAccount],
  );

  const onMarketChange = useCallback(
    (symbol: string) => {
      setSelectedFuturesSymbol(symbol);
      const idx = futuresMarkets.findIndex((m) => m.symbol === symbol);
      if (idx >= 0) setMarketIdx(idx);
    },
    [futuresMarkets, setSelectedFuturesSymbol, setMarketIdx],
  );

  const onBookPriceClick = useCallback(
    (price: string, bookSide: 'ask' | 'bid') => {
      setOrderType('limit');
      setLimitPrice(normalizeDecimalInput(price));
      setSide(bookSide === 'ask' ? 'long' : 'short');
    },
    [setSide],
  );

  const onMarginInput = useCallback(
    (value: string) => {
      setMargin(normalizeDecimalInput(value));
    },
    [setMargin],
  );

  const orderPricesReady =
    orderType === 'market' ||
    (orderType === 'limit' && isPositiveAmount(limitPrice)) ||
    (orderType === 'stop_market' && isPositiveAmount(stopPrice)) ||
    (orderType === 'stop_limit' && isPositiveAmount(stopPrice) && isPositiveAmount(limitPrice));

  const submitOpen = useCallback(async () => {
    if (!market || tradeBlocked) return;
    setConfirmOpen(false);

    const base = {
      market: market.symbol,
      side,
      marginCurrency,
      marginAmount: margin,
      leverage,
    };

    if (orderType === 'limit') {
      if (!isPositiveAmount(limitPrice)) return;
      const result = await placeLimitOrder({
        ...base,
        limitPrice,
        timeInForce: TRADE_FUTURES_UI_CAPABILITIES.timeInForce ? timeInForce : 'gtc',
        displayQuantity:
          TRADE_FUTURES_UI_CAPABILITIES.icebergOrders && displayQuantity ? displayQuantity : null,
        reduceOnly: TRADE_FUTURES_UI_CAPABILITIES.reduceOnlyOrders ? reduceOnly : false,
      });
      if (result) showTradeFeedback({ eventId: 'futures.limit.placed' });
      return;
    }

    if (orderType === 'stop_market') {
      if (!isPositiveAmount(stopPrice)) return;
      const result = await placeStopOrder({
        ...base,
        stopPrice,
        orderType: 'stop_market',
        reduceOnly: TRADE_FUTURES_UI_CAPABILITIES.reduceOnlyOrders ? reduceOnly : false,
      });
      if (result) showTradeFeedback({ eventId: 'futures.limit.placed' });
      return;
    }

    if (orderType === 'stop_limit') {
      if (!isPositiveAmount(stopPrice) || !isPositiveAmount(limitPrice)) return;
      const result = await placeStopOrder({
        ...base,
        stopPrice,
        orderType: 'stop_limit',
        limitPrice,
        reduceOnly: TRADE_FUTURES_UI_CAPABILITIES.reduceOnlyOrders ? reduceOnly : false,
      });
      if (result) showTradeFeedback({ eventId: 'futures.limit.placed' });
      return;
    }

    const result = await openPosition({
      ...base,
      stopLoss: slEnabled && slPrice ? slPrice : null,
      takeProfit: tpEnabled && tpPrice ? tpPrice : null,
    });
    if (result) showTradeFeedback({ eventId: 'futures.market.open' });
  }, [
    market,
    tradeBlocked,
    side,
    marginCurrency,
    margin,
    leverage,
    orderType,
    limitPrice,
    stopPrice,
    placeLimitOrder,
    placeStopOrder,
    openPosition,
    slEnabled,
    slPrice,
    tpEnabled,
    tpPrice,
    timeInForce,
    displayQuantity,
    reduceOnly,
  ]);

  const requestSubmitOpen = useCallback(() => {
    if (!market || tradeBlocked) return;
    if (resolveTradeOrderConfirmRequired()) {
      setConfirmOpen(true);
      return;
    }
    void submitOpen();
  }, [market, tradeBlocked, submitOpen]);

  const submitCancelOrder = useCallback(
    async (orderId: string) => {
      setCancellingOrderId(orderId);
      try {
        const result = await cancelOrder(orderId);
        if (result) {
          showTradeFeedback({
            eventId: 'futures.order.canceled',
            dedupId: tradeFeedbackDedupId('futures.order.canceled', orderId),
          });
        }
      } finally {
        setCancellingOrderId(null);
      }
    },
    [cancelOrder],
  );

  const submitClosePosition = useCallback(
    async (positionId: string) => {
      setClosingPositionId(positionId);
      try {
        const result = await closePositionRpc(positionId);
        if (result) {
          registerUserInitiatedPositionClose(positionId);
          showTradeFeedback({ eventId: 'futures.position.closed' });
        }
      } finally {
        setClosingPositionId(null);
      }
    },
    [closePositionRpc],
  );

  const submitPartialClosePosition = useCallback(
    async (positionId: string, closeRatio: string) => {
      setPartialClosingPositionId(positionId);
      try {
        const result = await partialClosePositionRpc(positionId, closeRatio);
        if (result) {
          registerUserInitiatedPositionClose(positionId);
          showTradeFeedback({
            eventId: 'futures.position.closed',
            i18nKeyOverride:
              closeRatio === '0.5' ? 'trade.partialCloseDone' : 'trade.partialCloseSuccess',
          });
        }
      } finally {
        setPartialClosingPositionId(null);
      }
    },
    [partialClosePositionRpc],
  );

  const submitAdjustIsolatedMargin = useCallback(
    async (positionId: string, delta: string) => {
      setAdjustingMarginPositionId(positionId);
      try {
        const result = await adjustIsolatedMarginRpc(positionId, delta);
        if (result) showTradeFeedback({ eventId: 'futures.margin.adjusted' });
      } finally {
        setAdjustingMarginPositionId(null);
      }
    },
    [adjustIsolatedMarginRpc],
  );

  const submitUpdatePositionSltp = useCallback(
    async (positionId: string, stopLoss: string | null, takeProfit: string | null) => {
      setUpdatingSltpPositionId(positionId);
      try {
        const result = await updateFuturesPositionSltpRpc(positionId, stopLoss, takeProfit);
        if (result) {
          showTradeFeedback({
            eventId: 'futures.sltp.updated',
            dedupId: tradeFeedbackDedupId('futures.sltp.updated', positionId),
          });
        }
      } finally {
        setUpdatingSltpPositionId(null);
      }
    },
    [updateFuturesPositionSltpRpc],
  );

  const submitSetTrailingStop = useCallback(
    async (positionId: string, callbackRate: string, activationPrice?: string | null) => {
      setTrailingStopPositionId(positionId);
      try {
        const result = await setTrailingStopRpc(positionId, callbackRate, activationPrice);
        if (result) {
          showTradeFeedback({
            eventId: 'futures.trailingStop.set',
            dedupId: tradeFeedbackDedupId('futures.trailingStop.set', positionId),
          });
        }
      } finally {
        setTrailingStopPositionId(null);
      }
    },
    [setTrailingStopRpc],
  );

  const submitClearTrailingStop = useCallback(
    async (positionId: string) => {
      setTrailingStopPositionId(positionId);
      try {
        const result = await clearTrailingStopRpc(positionId);
        if (result) {
          showTradeFeedback({
            eventId: 'futures.trailingStop.cleared',
            dedupId: tradeFeedbackDedupId('futures.trailingStop.cleared', positionId),
          });
        }
      } finally {
        setTrailingStopPositionId(null);
      }
    },
    [clearTrailingStopRpc],
  );

  const confirmNotice: MessageKey | undefined =
    tradeBlocked && confirmOpen
      ? (submitBlockedReason ?? 'trade.confirm.staleBlocked')
      : isDrifted
        ? 'trade.confirm.priceChanged'
        : undefined;

  const openMarketPositions = useMemo(
    () => futuresPositions.filter((p) => p.status === 'open'),
    [futuresPositions],
  );

  return {
    futuresMarkets,
    futuresMarketsLoading,
    market,
    price,
    priceDisplay,
    oraclePriceDisplay,
    oracleMarkUnavailable,
    fundingDisplay: fundingFormatted.display,
    fundingTone: fundingFormatted.tone,
    baseLabel,
    pairLabel,
    asks,
    bids,
    bookFeedStale,
    pricePrecision: market?.price_precision ?? selectedFuturesMarket?.price_precision ?? 2,
    side,
    setSide,
    marginCurrency,
    setMarginCurrency,
    margin,
    onMarginInput,
    leverage,
    setLeverage,
    maxLeverageNum: toDecimal(maxLeverage).toNumber(),
    tpEnabled,
    setTpEnabled,
    tpPrice,
    setTpPrice,
    slEnabled,
    setSlEnabled,
    slPrice,
    setSlPrice,
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
    priceStale,
    isHighLeverage,
    riskAck,
    houseCounterpartyAck,
    confirmOpen,
    setConfirmOpen,
    canConfirm,
    confirmNotice,
    submitOpen,
    requestSubmitOpen,
    onMarketChange,
    onBookPriceClick,
    futuresPositions: openMarketPositions,
    positionsLoading,
    openOrders,
    openOrdersLoading,
    fills,
    fillsLoading,
    fundingPayments,
    fundingPaymentsLoading,
    locale,
    cancelOrder: submitCancelOrder,
    closePosition: submitClosePosition,
    partialClosePosition: submitPartialClosePosition,
    adjustIsolatedMargin: submitAdjustIsolatedMargin,
    updatePositionSltp: submitUpdatePositionSltp,
    setTrailingStop: submitSetTrailingStop,
    clearTrailingStop: submitClearTrailingStop,
    cancellingOrderId,
    closingPositionId,
    partialClosingPositionId,
    adjustingMarginPositionId,
    updatingSltpPositionId,
    trailingStopPositionId,
    actionBusy: busy,
    orderType,
    setOrderType,
    limitPrice,
    setLimitPrice: (value: string) => setLimitPrice(normalizeDecimalInput(value)),
    stopPrice,
    setStopPrice: (value: string) => setStopPrice(normalizeDecimalInput(value)),
    orderPricesReady,
    timeInForce,
    setTimeInForce,
    displayQuantity,
    setDisplayQuantity: (value: string) => setDisplayQuantity(normalizeDecimalInput(value)),
    reduceOnly,
    setReduceOnly,
    marginMode,
    setMarginMode,
    marginModeBusy: marginAccount.busy,
    positionMode: marginAccount.positionMode,
    setPositionMode,
    positionModeBusy: marginAccount.busy,
    crossMarginEnabled,
    earnVipTier,
    t,
  };
}

export type FuturesDeskWire = ReturnType<typeof useFuturesDeskWire>;
