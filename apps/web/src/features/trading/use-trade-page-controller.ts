import { useMemo, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import {
  useFuturesMarkets,
  useFuturesPositions,
  usePrices,
  useSpotMarkets,
  type FuturesMarket,
  type FuturesPosition,
  type SpotMarket,
} from '@/hooks/use-trading';
import { useWallet } from '@/hooks/use-wallet';
import { formatOraclePriceDisplay } from '@/features/trading/format-oracle-price-display';
import { resolvePhonBonusDisplayContract } from '@/domain/phon-bonus-display-contract';
import { usePhonBalanceBreakdown } from '@/features/wallet/use-phon-balance-breakdown';
import { useT } from '@/product/i18n';

export type TradePageControllerView = {
  t: ReturnType<typeof useT>;
  authLoading: boolean;
  walletLoading: boolean;
  phonAvail: string;
  usdtAvail: string;
  phonBonusAvailableDisplay: string | null;
  phonRealAvailableDisplay: string | null;
  phonBreakdownLoading: boolean;
  prices: Record<string, string>;
  spotMarkets: SpotMarket[];
  futuresMarkets: FuturesMarket[];
  futuresMarketsLoading: boolean;
  selectedSpotMarket: SpotMarket | null;
  selectedFuturesMarket: FuturesMarket | null;
  futuresPositions: FuturesPosition[];
  positionsLoading: boolean;
  pricesError: boolean;
  positionsError: boolean;
  marketsError: boolean;
  spotMarketsError: boolean;
  pricesFetching: boolean;
  positionsFetching: boolean;
  oracleStale: boolean;
  isPriceStale: (symbol: string | null | undefined) => boolean;
  isPriceFrozen: (symbol: string | null | undefined) => boolean;
  priceDisplay: string;
  oraclePriceDisplay: string;
  oracleMarkUnavailable: boolean;
  refreshMarkets: () => void;
  refreshFuturesPositions: () => void;
  setSelectedSpotSymbol: (symbol: string) => void;
  setSelectedFuturesSymbol: (symbol: string) => void;
};

export function useTradePageController(): TradePageControllerView {
  const t = useT();
  const { loading: authLoading } = useAuth();
  const { wallet, loading: walletLoading } = useWallet();
  const { breakdown, loading: phonBreakdownLoading } = usePhonBalanceBreakdown();
  const {
    prices,
    isPriceStale,
    isPriceFrozen,
    isError: pricesError,
    isFetching: pricesFetching,
    oracleStale,
    refetch: refetchPrices,
  } = usePrices();
  const {
    markets: futuresMarkets,
    loading: futuresMarketsLoading,
    isError: futuresMarketsError,
    refetch: refetchFuturesMarkets,
  } = useFuturesMarkets();
  const {
    markets: spotMarkets,
    isError: spotMarketsError,
    refetch: refetchSpotMarkets,
  } = useSpotMarkets();
  const {
    positions: futuresPositions,
    loading: positionsLoading,
    refresh: refreshFuturesPositions,
    isError: positionsError,
    isFetching: positionsFetching,
  } = useFuturesPositions();

  const [selectedFuturesSymbol, setSelectedFuturesSymbol] = useState<string | null>(null);
  const [selectedSpotSymbol, setSelectedSpotSymbol] = useState<string | null>(null);

  const selectedFuturesMarket = useMemo(
    () =>
      futuresMarkets.find((m) => m.symbol === selectedFuturesSymbol) ??
      futuresMarkets.find((m) => m.symbol === 'BTCUSDT-SIM') ??
      futuresMarkets[0] ??
      null,
    [futuresMarkets, selectedFuturesSymbol],
  );

  const selectedSpotMarket = useMemo(
    () =>
      spotMarkets.find((m) => m.symbol === selectedSpotSymbol) ??
      spotMarkets.find((m) => m.symbol === 'PHON_USDT') ??
      spotMarkets.find((m) => m.symbol === 'BTC_USDT') ??
      spotMarkets[0] ??
      null,
    [spotMarkets, selectedSpotSymbol],
  );

  const activeSymbol = selectedSpotMarket?.symbol ?? null;
  const rawPrice = activeSymbol ? (prices[activeSymbol] ?? '0') : '0';
  const oracleMarkUnavailable = !rawPrice || rawPrice === '0' || isPriceStale(activeSymbol);
  const oraclePriceDisplay = formatOraclePriceDisplay(oracleMarkUnavailable ? undefined : rawPrice);

  const priceDisplay = oraclePriceDisplay;

  const refreshMarkets = () => {
    void refetchPrices();
    void refetchFuturesMarkets();
    void refetchSpotMarkets();
  };

  const phonDisplay = resolvePhonBonusDisplayContract({
    breakdown,
    fallback: { walletPhonAvailable: wallet?.phon_available },
    showCurrency: false,
  });

  return {
    t,
    authLoading,
    walletLoading,
    phonAvail: wallet?.phon_available ?? '0',
    usdtAvail: wallet?.usdt_available ?? '0',
    phonBonusAvailableDisplay: phonDisplay.phonBonusAvailableDisplay,
    phonRealAvailableDisplay: phonDisplay.phonRealAvailableDisplay,
    phonBreakdownLoading,
    prices,
    spotMarkets,
    futuresMarkets,
    futuresMarketsLoading,
    selectedSpotMarket,
    selectedFuturesMarket,
    futuresPositions,
    positionsLoading,
    pricesError,
    positionsError,
    marketsError: futuresMarketsError,
    spotMarketsError,
    pricesFetching,
    positionsFetching,
    oracleStale,
    isPriceStale,
    isPriceFrozen,
    priceDisplay,
    oraclePriceDisplay,
    oracleMarkUnavailable,
    refreshMarkets,
    refreshFuturesPositions,
    setSelectedSpotSymbol,
    setSelectedFuturesSymbol,
  };
}
