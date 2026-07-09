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
    onReadyRef.current?.({
      fitContent: () => chart.timeScale().fitContent(),
    });

    return () => {
      handleRef.current = null;
      chart.remove();
    };
  }, [hostRef]);

  return handleRef;
}
