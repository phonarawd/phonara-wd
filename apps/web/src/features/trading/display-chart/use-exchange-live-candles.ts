import { useMemo } from 'react';
import type { TradingChartCandle } from '@phonara/ui';
import { useCandles } from '@/hooks/use-trading';
import { useDisplayKline, type DisplayKlineInterval } from './use-display-kline';

const MIN_LIVE = 2;

function toChartCandles(
  rows: { time: number; open: number | string; high: number | string; low: number | string; close: number | string; volume?: number | string | null }[],
): TradingChartCandle[] {
  return rows.map((c) => ({
    time: c.time,
    open: String(c.open),
    high: String(c.high),
    low: String(c.low),
    close: String(c.close),
    volume: c.volume != null ? String(c.volume) : null,
  }));
}

/**
 * Exchange display candles (Binance/Bybit) + oracle RPC fallback for PHON / feed outage.
 * Display-only — never passed to settlement RPCs.
 */
export function useExchangeLiveCandles(
  marketSymbol: string | null,
  interval: DisplayKlineInterval = '1m',
) {
  const live = useDisplayKline(marketSymbol, interval, Boolean(marketSymbol));
  const needOracle = Boolean(marketSymbol) && live.candles.length < MIN_LIVE;
  const { candles: oracleRows, loading: oracleLoading, refetch } = useCandles(
    needOracle ? marketSymbol : null,
    interval,
  );

  const candles = useMemo(() => {
    if (live.candles.length >= MIN_LIVE) {
      return toChartCandles(live.candles);
    }
    if (oracleRows.length > 0) {
      return toChartCandles(
        oracleRows.map((c) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        })),
      );
    }
    return toChartCandles(live.candles);
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
    displayOnly: true as const,
  };
}
