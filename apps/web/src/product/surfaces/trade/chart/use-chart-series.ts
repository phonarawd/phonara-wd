import { useEffect, useRef, type RefObject } from 'react';

import type { TradingChartCandle } from '@/features/trading/display-chart/display-feed-contract';

import type { ChartOverlayToggles, ChartSeriesMode } from './chart-overlay-contract';
import {
  computeBollingerBands20,
  computeEma21,
  computeMa7,
  computeRsi14,
} from './compute-indicator-series';
import { readChartTheme } from './chart-theme';
import { toChartCandleData, toChartLineData, toChartVolumeData } from './to-chart-data';
import type { LightweightChartHandle } from './use-lightweight-chart';

type UseChartSeriesOptions = {
  seriesMode: ChartSeriesMode;
  overlays: ChartOverlayToggles;
};

export function useChartSeries(
  handleRef: RefObject<LightweightChartHandle | null>,
  candles: readonly TradingChartCandle[],
  feedKey: string,
  options: UseChartSeriesOptions,
) {
  const prevKeyRef = useRef<string | null>(null);
  const prevLengthRef = useRef(0);
  const prevOverlayKeyRef = useRef('');
  const needsFlushRef = useRef(false);
  const { seriesMode, overlays } = options;
  const overlayKey = `${seriesMode}:${overlays.ma7}:${overlays.ema21}:${overlays.rsi}:${overlays.bb}:${overlays.vol}`;

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle || candles.length === 0) return;

    const theme = readChartTheme();
    const candleData = toChartCandleData(candles);
    const lineData = toChartLineData(candleData);
    const volumeData = toChartVolumeData(candles, theme.marketUp, theme.marketDown);
    const ma7Data = overlays.ma7 ? computeMa7(candleData) : [];
    const ema21Data = overlays.ema21 ? computeEma21(candleData) : [];
    const bbData = overlays.bb ? computeBollingerBands20(candleData) : [];
    const rsiData = overlays.rsi ? computeRsi14(candleData) : [];

    handle.candles.applyOptions({ visible: seriesMode === 'candles' });
    handle.line.applyOptions({
      visible: seriesMode === 'line',
      // Hidden close-line must not pull the right scale (same pane as candles).
      autoscaleInfoProvider: seriesMode === 'line' ? undefined : () => null,
    });
    handle.volume.applyOptions({
      visible: overlays.vol,
      priceScaleId: '',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    handle.ma7.applyOptions({ visible: overlays.ma7 });
    handle.ema21.applyOptions({ visible: overlays.ema21 });
    handle.bbUpper.applyOptions({ visible: overlays.bb });
    handle.bbMiddle.applyOptions({ visible: overlays.bb });
    handle.bbLower.applyOptions({ visible: overlays.bb });
    handle.rsi.applyOptions({ visible: overlays.rsi });

    const feedChanged = prevKeyRef.current !== feedKey;
    const overlayChanged = prevOverlayKeyRef.current !== overlayKey;
    const lengthDelta = candles.length - prevLengthRef.current;
    const wasEmpty = prevLengthRef.current === 0;

    const applyFullSeries = () => {
      handle.candles.setData(candleData);
      handle.line.setData(lineData);
      handle.volume.setData(volumeData);
      handle.ma7.setData(ma7Data);
      handle.ema21.setData(ema21Data);
      handle.bbUpper.setData(bbData.map((row) => ({ time: row.time, value: row.upper })));
      handle.bbMiddle.setData(bbData.map((row) => ({ time: row.time, value: row.middle })));
      handle.bbLower.setData(bbData.map((row) => ({ time: row.time, value: row.lower })));
      handle.rsi.setData(rsiData);
    };

    if (feedChanged || wasEmpty || needsFlushRef.current || overlayChanged) {
      applyFullSeries();
      prevKeyRef.current = feedKey;
      prevOverlayKeyRef.current = overlayKey;
      prevLengthRef.current = candles.length;
      needsFlushRef.current = false;
      if (feedChanged || wasEmpty || overlayChanged) {
        // setAutoScale clears a stale fixed Y range left after undersized paints.
        handle.chart.priceScale('right').setAutoScale(true);
        handle.chart.timeScale().fitContent();
      }
      return;
    }

    if (typeof document !== 'undefined' && document.hidden) {
      needsFlushRef.current = true;
      return;
    }

    if (lengthDelta > 1) {
      applyFullSeries();
      prevLengthRef.current = candles.length;
      return;
    }

    const lastCandle = candleData[candleData.length - 1];
    const lastLine = lineData[lineData.length - 1];
    const lastVolume = volumeData[volumeData.length - 1];
    if (!lastCandle || !lastLine || !lastVolume) return;

    handle.candles.update(lastCandle);
    handle.line.update(lastLine);
    handle.volume.update(lastVolume);

    if (overlays.ma7 && ma7Data.length > 0) {
      handle.ma7.update(ma7Data[ma7Data.length - 1]!);
    }
    if (overlays.ema21 && ema21Data.length > 0) {
      handle.ema21.update(ema21Data[ema21Data.length - 1]!);
    }
    if (overlays.bb && bbData.length > 0) {
      const last = bbData[bbData.length - 1]!;
      handle.bbUpper.update({ time: last.time, value: last.upper });
      handle.bbMiddle.update({ time: last.time, value: last.middle });
      handle.bbLower.update({ time: last.time, value: last.lower });
    }
    if (overlays.rsi && rsiData.length > 0) {
      handle.rsi.update(rsiData[rsiData.length - 1]!);
    }

    prevLengthRef.current = candles.length;
  }, [
    candles,
    feedKey,
    handleRef,
    overlayKey,
    overlays.bb,
    overlays.ema21,
    overlays.ma7,
    overlays.rsi,
    overlays.vol,
    seriesMode,
  ]);
}
