import { useMemo } from 'react';
import {
  DISPLAY_ONLY_FEED,
  isOracleDisplayInterval,
  toTradingChartCandles,
} from './display-feed-contract';
import { useCandles } from '@/hooks/use-trading';
import { useDisplayKline, type DisplayKlineInterval } from './use-display-kline';

const MIN_LIVE = 2;

/**
 * Exchange display candles (Binance/Bybit) + oracle RPC fallback for PHON / feed outage.
 * Display-only — never passed to settlement RPCs.
 */
export function useExchangeLiveCandles(
  marketSymbol: string | null,
  interval: DisplayKlineInterval = '1m',
) {
  const live = useDisplayKline(marketSymbol, interval, Boolean(marketSymbol));
  const needOracle =
    Boolean(marketSymbol) && live.candles.length < MIN_LIVE && isOracleDisplayInterval(interval);
  const {
    candles: oracleRows,
    loading: oracleLoading,
    refetch,
  } = useCandles(needOracle ? marketSymbol : null, interval);

  const candles = useMemo(() => {
    if (live.candles.length >= MIN_LIVE) {
      return toTradingChartCandles(live.candles);
    }
    if (oracleRows.length > 0) {
      return toTradingChartCandles(oracleRows);
    }
    return toTradingChartCandles(live.candles);
  }, [live.candles, oracleRows]);

  const loading =
    candles.length < 2 &&
    ((needOracle && oracleLoading) || (!live.historyReady && live.candles.length === 0));

  return {
    candles,
    connected: live.connected,
    loading,
    error: live.error && candles.length < 2 && live.historyReady && !oracleLoading,
    lastPrice: live.lastPrice,
    refetch,
    displayOnly: DISPLAY_ONLY_FEED,
  };
}
