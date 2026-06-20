import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { t } from "@/i18n";
import type { TradePageController } from "@/features/trading/use-trade-page-controller";
import { useSpotActions, useSyntheticBook, type SyntheticBookLevel } from "@/hooks/use-trading";
import { useConfirmSnapshot } from "@/hooks/use-confirm-snapshot";
import { computeSpotBuy, computeSpotSell } from "@phonara/trading-engine";
import { isPositiveAmount } from "@/lib/money-display";
import { normalizeDecimalInput } from "@/lib/money-input";
import { formatOraclePriceDisplay } from "@/features/trading/format-oracle-price-display";
import { useExchangeDisplayPrice } from "@/features/trading/display-chart/use-exchange-display-price";
import type { SyntheticBookRow } from "@/features/trading/synthetic-futures-book";

function mapBookLevels(levels: SyntheticBookLevel[]): SyntheticBookRow[] {
  return levels.map((level) => ({
    priceDisplay: formatOraclePriceDisplay(level.price, level.price),
    sizeDisplay: level.size,
  }));
}

export function useSpotTerminalWire(engine: TradePageController) {
  const {
    selectedSpotMarket,
    spotMarkets,
    setSelectedSpotSymbol,
    prices,
    usdtAvail,
    phonAvail,
    isPriceStale,
    realtimeDisconnected,
  } = engine;

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("10");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { buy, sell, busy, error } = useSpotActions();

  const market =
    spotMarkets.find((m) => m.symbol === "PHON_USDT") ??
    selectedSpotMarket;
  const syntheticBook = useSyntheticBook(market?.symbol ?? null);

  const asks = useMemo(
    () => (syntheticBook.book?.asks?.length ? mapBookLevels(syntheticBook.book.asks) : []),
    [syntheticBook.book?.asks],
  );
  const bids = useMemo(
    () => (syntheticBook.book?.bids?.length ? mapBookLevels(syntheticBook.book.bids) : []),
    [syntheticBook.book?.bids],
  );

  const price = market ? (prices[market.symbol] ?? "0") : "0";
  const priceStale = market ? isPriceStale(market.symbol) : false;
  const tradeBlocked = priceStale || realtimeDisconnected;
  const oraclePriceDisplay = formatOraclePriceDisplay(price === "0" ? undefined : price, price);
  const { exchangePriceDisplay } = useExchangeDisplayPrice(market?.symbol ?? null);
  const priceDisplay = exchangePriceDisplay ?? oraclePriceDisplay;

  const confirmFingerprint = `${price}:${amount}:${side}`;
  const handleConfirmDrift = useCallback(() => {
    toast.warning(t("trade.confirm.priceChanged"));
  }, []);
  const { canConfirm, isDrifted } = useConfirmSnapshot({
    open: confirmOpen,
    fingerprint: confirmFingerprint,
    onDrift: handleConfirmDrift,
  });

  const estimate = useMemo(() => {
    try {
      if (!isPositiveAmount(price) || !isPositiveAmount(amount)) return null;
      return side === "buy"
        ? computeSpotBuy({ price, feeRate: market?.fee_rate ?? "0.001", usdtSpent: amount }).netPhon
        : computeSpotSell({ price, feeRate: market?.fee_rate ?? "0.001", phonSold: amount }).netUsdt;
    } catch {
      return null;
    }
  }, [amount, side, price, market?.fee_rate]);

  async function submit() {
    if (tradeBlocked) return;
    setConfirmOpen(false);
    if (side === "buy") await buy(amount);
    else await sell(amount);
  }

  const baseLabel = market?.symbol?.split("_")[0] ?? "PHON";
  const pairLabel = market?.display_name ?? `${baseLabel}/USDT`;

  const onAmountInput = useCallback((value: string) => {
    setAmount(normalizeDecimalInput(value));
  }, []);

  const confirmNotice =
    tradeBlocked && confirmOpen
      ? t("trade.confirm.staleBlocked")
      : isDrifted
        ? t("trade.confirm.priceChanged")
        : undefined;

  return {
    spotMarkets,
    market,
    baseLabel,
    pairLabel,
    price,
    priceDisplay,
    oraclePriceDisplay,
    side,
    setSide,
    amount,
    onAmountInput,
    usdtAvail,
    phonAvail,
    estimate,
    busy,
    error,
    tradeBlocked,
    confirmOpen,
    setConfirmOpen,
    canConfirm,
    confirmNotice,
    submit,
    onMarketChange: setSelectedSpotSymbol,
    asks,
    bids,
  };
}

export type SpotTerminalWire = ReturnType<typeof useSpotTerminalWire>;
