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
  priceDir: PriceDir;
  futuresActions: ReturnType<typeof useFuturesActions>;
  spotActions: ReturnType<typeof useSpotActions>;
  tradeNotifications: ReturnType<typeof useTradeNotifications>;
  refreshMarkets: () => void;
  refreshFuturesPositions: () => void;
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

  const selectedFuturesMarket = useMemo(
    () => futuresMarkets[0] ?? null,
    [futuresMarkets],
  );
  const selectedSpotMarket = useMemo(
    () => spotMarkets.find((market) => market.symbol === 'PHON_USDT') ?? spotMarkets[0] ?? null,
    [spotMarkets],
  );

  const rawPrice = selectedFuturesMarket ? (prices[selectedFuturesMarket.symbol] ?? '0') : '0';
  const priceDisplay = formatOraclePriceDisplay(rawPrice === '0' ? undefined : rawPrice, '63,548.7');

  const prevPriceRef = useRef<string | null>(null);
  const [priceDir, setPriceDir] = useState<PriceDir>('flat');

  useEffect(() => {
    if (!rawPrice || rawPrice === '0') return;
    setPriceDir(comparePriceDir(rawPrice, prevPriceRef.current));
    prevPriceRef.current = rawPrice;
  }, [rawPrice]);

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
    priceDir,
    futuresActions,
    spotActions,
    tradeNotifications,
    refreshMarkets,
    refreshFuturesPositions,
  };
}
