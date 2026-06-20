import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { useWallet } from '../../hooks/use-wallet';
import {
  usePrices,
  useFuturesMarkets,
  useSpotMarkets,
  useFuturesActions,
  useSpotActions,
  useFuturesPositions,
  type FuturesMarket,
  type FuturesPosition,
  type SpotMarket,
} from '../../hooks/use-trading';
import { useTradeNotifications } from '../../hooks/use-trade-notifications';
import { useT } from '../../lib/i18n';
import {
  comparePriceDir,
  formatOraclePriceDisplay,
  type PriceDir,
} from './format-oracle-price-display';
import { useExchangeDisplayPrice } from './display-chart/use-exchange-display-price';

export type TradePageController = {
  t: ReturnType<typeof useT>;
  authLoading: boolean;
  session: ReturnType<typeof useAuth>['session'];
  walletLoading: boolean;
  phonAvail: string;
  usdtAvail: string;
  prices: Record<string, string>;
  futuresMarkets: FuturesMarket[];
  futuresMarketsLoading: boolean;
  spotMarkets: SpotMarket[];
  selectedFuturesMarket: FuturesMarket | null;
  selectedSpotMarket: SpotMarket | null;
  futuresPositions: FuturesPosition[];
  pricesError: boolean;
  positionsError: boolean;
  marketsError: boolean;
  pricesFetching: boolean;
  positionsFetching: boolean;
  pricesUpdatedAt: number;
  positionsUpdatedAt: number;
  oracleStale: boolean;
  isPriceStale: (symbol: string | null | undefined) => boolean;
  realtimeDisconnected: boolean;
  priceDisplay: string;
  oraclePriceDisplay: string;
  priceDir: PriceDir;
  futuresActions: ReturnType<typeof useFuturesActions>;
  spotActions: ReturnType<typeof useSpotActions>;
  tradeNotifications: ReturnType<typeof useTradeNotifications>;
  refreshMarkets: () => void;
  refreshFuturesPositions: () => void;
  setSelectedFuturesSymbol: (symbol: string) => void;
  setSelectedSpotSymbol: (symbol: string) => void;
};

export function useTradePageController(): TradePageController {
  const t = useT();
  const { session, loading: authLoading } = useAuth();
  const { wallet, loading: walletLoading } = useWallet();
  const { prices, isPriceStale, isError: pricesError, isFetching: pricesFetching, dataUpdatedAt: pricesUpdatedAt, oracleStale, refetch: refetchPrices } = usePrices();
  const { markets: futuresMarkets, loading: futuresMarketsLoading, isError: futuresMarketsError, refetch: refetchFuturesMarkets } =
    useFuturesMarkets();
  const { markets: spotMarkets, refetch: refetchSpotMarkets } = useSpotMarkets();
  const {
    positions: futuresPositions,
    refresh: refreshFuturesPositions,
    isError: positionsError,
    isFetching: positionsFetching,
    dataUpdatedAt: positionsUpdatedAt,
  } = useFuturesPositions();
  const futuresActions = useFuturesActions(refreshFuturesPositions);
  const spotActions = useSpotActions();
  const tradeNotifications = useTradeNotifications();

  // `usePrices` owns oracle realtime; do not open a duplicate channel.
  const realtimeDisconnected = false;

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
      spotMarkets.find((m) => m.symbol === 'BTC_USDT') ??
      spotMarkets.find((m) => m.symbol === 'PHON_USDT') ??
      spotMarkets[0] ??
      null,
    [spotMarkets, selectedSpotSymbol],
  );

  const rawPrice = selectedFuturesMarket ? (prices[selectedFuturesMarket.symbol] ?? '0') : '0';
  const oraclePriceDisplay = formatOraclePriceDisplay(
    rawPrice === '0' ? undefined : rawPrice,
    '63,548.7',
  );

  const {
    exchangePriceDisplay,
    exchangePriceDir,
  } = useExchangeDisplayPrice(selectedFuturesMarket?.symbol ?? null);

  const priceDisplay = exchangePriceDisplay ?? oraclePriceDisplay;

  const prevOracleRef = useRef<string | null>(null);
  const [oracleDir, setOracleDir] = useState<PriceDir>('flat');

  useEffect(() => {
    if (exchangePriceDisplay) return;
    if (!rawPrice || rawPrice === '0') return;
    setOracleDir(comparePriceDir(rawPrice, prevOracleRef.current));
    prevOracleRef.current = rawPrice;
  }, [exchangePriceDisplay, rawPrice]);

  const priceDir = exchangePriceDisplay ? exchangePriceDir : oracleDir;

  const refreshMarkets = () => {
    void refetchPrices();
    void refetchFuturesMarkets();
    void refetchSpotMarkets();
  };

  return {
    t,
    authLoading,
    session,
    walletLoading,
    phonAvail: wallet?.phon_available ?? '0',
    usdtAvail: wallet?.usdt_available ?? '0',
    prices,
    futuresMarkets,
    futuresMarketsLoading,
    spotMarkets,
    selectedFuturesMarket,
    selectedSpotMarket,
    futuresPositions,
    pricesError,
    positionsError,
    marketsError: futuresMarketsError,
    pricesFetching,
    positionsFetching,
    pricesUpdatedAt,
    positionsUpdatedAt,
    oracleStale,
    isPriceStale,
    realtimeDisconnected,
    priceDisplay,
    oraclePriceDisplay,
    priceDir,
    futuresActions,
    spotActions,
    tradeNotifications,
    refreshMarkets,
    refreshFuturesPositions,
    setSelectedFuturesSymbol,
    setSelectedSpotSymbol,
  };
}
