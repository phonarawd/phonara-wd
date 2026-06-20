import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { toDecimal } from "@phonara/money";
import { t } from "@/i18n";
import type { TradePageController } from "@/features/trading/use-trade-page-controller";
import {
  useFuturesOrderTicket,
  useFuturesActions,
  useOpenOrders,
  useMarginAccount,
  useFundingRate,
  useTradingRiskAcknowledgement,
  useSyntheticBook,
  type SyntheticBookLevel,
} from "@/hooks/use-trading";
import { useTradeLaunchFlags } from "@/hooks/use-trade-launch-flags";
import { formatFundingRateDisplay } from "@/lib/format-funding-rate-display";
import { useConfirmSnapshot } from "@/hooks/use-confirm-snapshot";
import { formatOraclePriceDisplay } from "@/features/trading/format-oracle-price-display";
import { normalizeDecimalInput } from "@/lib/money-input";
import type { SyntheticBookRow } from "@/features/trading/synthetic-futures-book";
import type { OrderType } from "@/features/trading/order-ticket/order-ticket-types";
import { isPositiveAmount } from "@/lib/money-display";

function mapBookLevels(levels: SyntheticBookLevel[]): SyntheticBookRow[] {
  return levels.map((level) => ({
    priceDisplay: formatOraclePriceDisplay(level.price, level.price),
    sizeDisplay: level.size,
  }));
}

export function useFuturesTerminalWire(engine: TradePageController) {
  const {
    futuresMarkets,
    futuresMarketsLoading,
    selectedFuturesMarket,
    setSelectedFuturesSymbol,
    prices,
    phonAvail,
    usdtAvail,
    walletLoading,
    isPriceStale,
    realtimeDisconnected,
    priceDisplay,
    oraclePriceDisplay,
    oracleMarkUnavailable,
    priceDir,
    futuresPositions,
    refreshFuturesPositions,
  } = engine;

  const ticket = useFuturesOrderTicket({
    markets: futuresMarkets,
    prices,
    isPriceStale,
    realtimeDisconnected,
    selectedSymbol: selectedFuturesMarket?.symbol ?? null,
  });

  const { orders: openOrders, loading: openOrdersLoading, refresh: refreshOpenOrders } =
    useOpenOrders();
  const marginAccount = useMarginAccount();
  const tradeLaunchFlags = useTradeLaunchFlags();
  const fundingMarketSymbol =
    ticket.market?.symbol ?? selectedFuturesMarket?.symbol ?? null;
  const { rate: fundingRateRaw } = useFundingRate(fundingMarketSymbol);

  const fundingFormatted = useMemo(
    () => formatFundingRateDisplay(fundingRateRaw ?? "0"),
    [fundingRateRaw],
  );

  const onTradingChange = useCallback(() => {
    refreshFuturesPositions();
    refreshOpenOrders();
  }, [refreshFuturesPositions, refreshOpenOrders]);

  const { openPosition, placeLimitOrder, placeStopOrder, cancelOrder, busy, error } =
    useFuturesActions(onTradingChange);
  const riskAck = useTradingRiskAcknowledgement();
  const syntheticBook = useSyntheticBook(ticket.market?.symbol ?? null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");

  const {
    market,
    price,
    priceStale,
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
    tpEnabled,
    tpPrice,
  } = ticket;

  const tradeBlocked = priceStale || realtimeDisconnected;
  const confirmFingerprint = `${price}:${side}:${margin}:${leverage}:${marginCurrency}:${market?.symbol ?? ""}`;

  const handleConfirmDrift = useCallback(() => {
    toast.warning(t("trade.confirm.priceChanged"));
  }, []);

  const { canConfirm, isDrifted } = useConfirmSnapshot({
    open: confirmOpen,
    fingerprint: confirmFingerprint,
    onDrift: handleConfirmDrift,
  });

  const asks = useMemo(
    () => (syntheticBook.book?.asks?.length ? mapBookLevels(syntheticBook.book.asks) : []),
    [syntheticBook.book?.asks],
  );
  const bids = useMemo(
    () => (syntheticBook.book?.bids?.length ? mapBookLevels(syntheticBook.book.bids) : []),
    [syntheticBook.book?.bids],
  );

  const baseLabel = market?.base_label ?? selectedFuturesMarket?.base_label ?? "BTC";
  const pairLabel = market?.display_name ?? `${baseLabel}/USDT`;
  const tone = priceDir === "down" ? "text-(--color-down)" : "text-(--color-up)";
  const avail = marginCurrency === "USDT" ? usdtAvail : phonAvail;

  const onMarginInput = useCallback(
    (value: string) => {
      setMargin(normalizeDecimalInput(value));
    },
    [setMargin],
  );

  const onMarketChange = useCallback(
    (symbol: string) => {
      setSelectedFuturesSymbol(symbol);
      const idx = futuresMarkets.findIndex((m) => m.symbol === symbol);
      if (idx >= 0) ticket.setMarketIdx(idx);
    },
    [futuresMarkets, setSelectedFuturesSymbol, ticket],
  );

  async function submitOpen() {
    if (!market || tradeBlocked) return;
    setConfirmOpen(false);

    const base = {
      market: market.symbol,
      side,
      marginCurrency,
      marginAmount: margin,
      leverage,
    };

    if (orderType === "limit") {
      if (!isPositiveAmount(limitPrice)) return;
      await placeLimitOrder({ ...base, limitPrice });
      return;
    }

    if (orderType === "stop_market") {
      if (!isPositiveAmount(stopPrice)) return;
      await placeStopOrder({ ...base, stopPrice, orderType: "stop_market" });
      return;
    }

    if (orderType === "stop_limit") {
      if (!isPositiveAmount(stopPrice) || !isPositiveAmount(limitPrice)) return;
      await placeStopOrder({
        ...base,
        stopPrice,
        orderType: "stop_limit",
        limitPrice,
      });
      return;
    }

    await openPosition({
      ...base,
      stopLoss: slEnabled && slPrice ? slPrice : null,
      takeProfit: tpEnabled && tpPrice ? tpPrice : null,
    });
  }

  const orderPricesReady =
    orderType === "market" ||
    (orderType === "limit" && isPositiveAmount(limitPrice)) ||
    (orderType === "stop_market" && isPositiveAmount(stopPrice)) ||
    (orderType === "stop_limit" && isPositiveAmount(stopPrice) && isPositiveAmount(limitPrice));

  const confirmNotice =
    tradeBlocked && confirmOpen
      ? t("trade.confirm.staleBlocked")
      : isDrifted
        ? t("trade.confirm.priceChanged")
        : undefined;

  return {
    futuresMarkets,
    futuresMarketsLoading,
    market,
    price,
    priceDisplay,
    lastPriceDisplay: priceDisplay,
    oracleMarkDisplay: oraclePriceDisplay,
    oracleMarkUnavailable,
    markPriceDisplay: oraclePriceDisplay,
    fundingDisplay: fundingFormatted.display,
    fundingToneClass:
      fundingFormatted.tone === "up"
        ? "text-(--color-up)"
        : fundingFormatted.tone === "down"
          ? "text-(--color-down)"
          : "text-muted-foreground",
    priceDir,
    tone,
    baseLabel,
    pairLabel,
    asks,
    bids,
    side,
    setSide,
    marginCurrency,
    setMarginCurrency,
    margin,
    onMarginInput,
    leverage,
    setLeverage,
    maxLeverageNum: toDecimal(maxLeverage).toNumber(),
    tpEnabled: ticket.tpEnabled,
    setTpEnabled: ticket.setTpEnabled,
    tpPrice: ticket.tpPrice,
    setTpPrice: ticket.setTpPrice,
    slEnabled: ticket.slEnabled,
    setSlEnabled: ticket.setSlEnabled,
    slPrice: ticket.slPrice,
    setSlPrice: ticket.setSlPrice,
    avail,
    preview,
    busy,
    error,
    marginModeError: marginAccount.error,
    walletLoading,
    tradeBlocked,
    isHighLeverage,
    riskAck,
    confirmOpen,
    setConfirmOpen,
    canConfirm,
    confirmNotice,
    submitOpen,
    onMarketChange,
    rulesOpen,
    setRulesOpen,
    futuresPositions,
    prices,
    isPriceStale,
    realtimeDisconnected,
    refreshFuturesPositions,
    refreshOpenOrders,
    openOrders,
    openOrdersLoading,
    cancelOrder,
    orderType,
    setOrderType,
    limitPrice,
    setLimitPrice: (value: string) => setLimitPrice(normalizeDecimalInput(value)),
    stopPrice,
    setStopPrice: (value: string) => setStopPrice(normalizeDecimalInput(value)),
    orderPricesReady,
    marginMode: marginAccount.marginMode,
    setMarginMode: marginAccount.setMarginMode,
    marginModeBusy: marginAccount.busy,
    crossMarginEnabled: tradeLaunchFlags.crossMarginEnabled,
  };
}

export type FuturesTerminalWire = ReturnType<typeof useFuturesTerminalWire>;
