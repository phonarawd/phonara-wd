import { useEffect, useRef, type RefObject } from 'react';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';

import { createChartOptions } from './chart-options';
import {
  candleSeriesOptions,
  indicatorSeriesOptions,
  lineSeriesOptions,
  readChartTheme,
} from './chart-theme';
import { isChartHostSized, readChartHostSize, scheduleChartLayoutSync, syncChartLayout } from './sync-chart-layout';

export type LightweightChartHandle = {
  chart: IChartApi;
  candles: ISeriesApi<'Candlestick', Time>;
  line: ISeriesApi<'Line', Time>;
  volume: ISeriesApi<'Histogram', Time>;
  ma7: ISeriesApi<'Line', Time>;
  ema21: ISeriesApi<'Line', Time>;
  bbUpper: ISeriesApi<'Line', Time>;
  bbMiddle: ISeriesApi<'Line', Time>;
  bbLower: ISeriesApi<'Line', Time>;
  rsi: ISeriesApi<'Line', Time>;
};

export type LightweightChartApi = {
  fitContent: () => void;
  /** Fullscreen / flex reflow — resize + reset autoscale + fit time. */
  syncLayout: () => void;
};

export function useLightweightChart(
  hostRef: RefObject<HTMLElement | null>,
  onReady?: (api: LightweightChartApi) => void,
) {
  const handleRef = useRef<LightweightChartHandle | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const theme = readChartTheme();
    const chart = createChart(host, createChartOptions(theme));

    const candles = chart.addSeries(CandlestickSeries, candleSeriesOptions(theme));
    const line = chart.addSeries(LineSeries, {
      ...lineSeriesOptions(theme.textMuted),
      visible: false,
    });
    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    chart.priceScale('right').applyOptions({
      scaleMargins: { top: 0.05, bottom: 0.25 },
    });
    const ma7 = chart.addSeries(LineSeries, {
      ...indicatorSeriesOptions(theme.marketUp),
      visible: false,
    });
    const ema21 = chart.addSeries(LineSeries, {
      ...indicatorSeriesOptions(theme.accent),
      visible: false,
    });
    const bbUpper = chart.addSeries(LineSeries, {
      ...indicatorSeriesOptions(theme.textMuted),
      visible: false,
    });
    const bbMiddle = chart.addSeries(LineSeries, {
      ...indicatorSeriesOptions(theme.marketUp),
      visible: false,
    });
    const bbLower = chart.addSeries(LineSeries, {
      ...indicatorSeriesOptions(theme.textMuted),
      visible: false,
    });
    const rsi = chart.addSeries(LineSeries, {
      ...indicatorSeriesOptions(theme.marketDown),
      visible: false,
      priceScaleId: 'rsi',
    });
    chart.priceScale('rsi').applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
    });

    handleRef.current = {
      chart,
      candles,
      line,
      volume,
      ma7,
      ema21,
      bbUpper,
      bbMiddle,
      bbLower,
      rsi,
    };

    const api: LightweightChartApi = {
      fitContent: () => chart.timeScale().fitContent(),
      syncLayout: () => {
        syncChartLayout(chart, host);
      },
    };
    onReadyRef.current?.(api);

    let lastSized = false;
    let lastWidth = 0;
    let lastHeight = 0;
    let cancelPendingSync: (() => void) | null = null;
    const requestSync = () => {
      cancelPendingSync?.();
      cancelPendingSync = scheduleChartLayoutSync(() => {
        cancelPendingSync = null;
        syncChartLayout(chart, host);
        const size = readChartHostSize(host);
        lastSized = isChartHostSized(size);
        lastWidth = size.width;
        lastHeight = size.height;
      });
    };

    requestSync();

    const observer = new ResizeObserver(() => {
      const size = readChartHostSize(host);
      const sized = isChartHostSized(size);
      const deltaW = Math.abs(size.width - lastWidth);
      const deltaH = Math.abs(size.height - lastHeight);
      // Ignore sub-pixel noise; always sync when crossing the usable-size threshold
      // (first paint after flex/fullscreen) or on meaningful geometry change.
      if (!sized) {
        lastSized = false;
        return;
      }
      if (lastSized && deltaW < 2 && deltaH < 2) return;
      lastSized = true;
      lastWidth = size.width;
      lastHeight = size.height;
      requestSync();
    });
    observer.observe(host);

    return () => {
      cancelPendingSync?.();
      observer.disconnect();
      handleRef.current = null;
      chart.remove();
    };
  }, [hostRef]);

  return handleRef;
}
