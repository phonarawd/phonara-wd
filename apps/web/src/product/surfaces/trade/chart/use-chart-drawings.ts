import { useEffect, useRef, type RefObject } from 'react';
import {
  LineSeries,
  LineStyle,
  type IPriceLine,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts';

import type { ChartDrawing, ChartDrawingMode } from './chart-overlay-contract';
import { indicatorSeriesOptions, readChartTheme } from './chart-theme';
import type { LightweightChartHandle } from './use-lightweight-chart';

type TrendSeriesEntry = {
  drawingId: string;
  series: ISeriesApi<'Line', Time>;
};

export function useChartDrawings(
  handleRef: RefObject<LightweightChartHandle | null>,
  drawings: readonly ChartDrawing[],
  drawingMode: ChartDrawingMode,
  onDrawingClick: (input: { time: number; price: number }) => void,
) {
  const horizontalLinesRef = useRef<Map<string, IPriceLine>>(new Map());
  const trendSeriesRef = useRef<Map<string, TrendSeriesEntry>>(new Map());
  const onClickRef = useRef(onDrawingClick);
  onClickRef.current = onDrawingClick;

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle || drawingMode === 'none') return;

    const onClick = (param: { time?: Time; point?: { x: number; y: number } }) => {
      if (!param.time || !param.point) return;
      const price = handle.candles.coordinateToPrice(param.point.y);
      if (price === null || !Number.isFinite(price)) return;
      const time =
        typeof param.time === 'number'
          ? param.time
          : typeof param.time === 'string'
            ? Number(param.time)
            : null;
      if (time === null || !Number.isFinite(time)) return;
      onClickRef.current({ time, price });
    };

    handle.chart.subscribeClick(onClick);
    return () => {
      handle.chart.unsubscribeClick(onClick);
    };
  }, [drawingMode, handleRef]);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    const theme = readChartTheme();
    const horizontalIds = new Set(drawings.filter((d) => d.kind === 'horizontal').map((d) => d.id));
    const trendIds = new Set(drawings.filter((d) => d.kind === 'trend').map((d) => d.id));

    for (const [id, line] of horizontalLinesRef.current.entries()) {
      if (!horizontalIds.has(id)) {
        handle.candles.removePriceLine(line);
        horizontalLinesRef.current.delete(id);
      }
    }

    for (const [id, entry] of trendSeriesRef.current.entries()) {
      if (!trendIds.has(id)) {
        handle.chart.removeSeries(entry.series);
        trendSeriesRef.current.delete(id);
      }
    }

    for (const drawing of drawings) {
      if (drawing.kind === 'horizontal') {
        const existing = horizontalLinesRef.current.get(drawing.id);
        if (existing) {
          handle.candles.removePriceLine(existing);
        }
        const line = handle.candles.createPriceLine({
          price: drawing.price,
          color: theme.accent,
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: 'H',
        });
        horizontalLinesRef.current.set(drawing.id, line);
        continue;
      }

      let entry = trendSeriesRef.current.get(drawing.id);
      if (!entry) {
        const series = handle.chart.addSeries(LineSeries, {
          ...indicatorSeriesOptions(theme.textMuted),
          lineWidth: 1,
        });
        entry = { drawingId: drawing.id, series };
        trendSeriesRef.current.set(drawing.id, entry);
      }

      entry.series.setData([
        { time: drawing.time1 as Time, value: drawing.price1 },
        { time: drawing.time2 as Time, value: drawing.price2 },
      ]);
    }

    return () => {
      if (!handleRef.current) return;
      for (const line of horizontalLinesRef.current.values()) {
        handleRef.current.candles.removePriceLine(line);
      }
      horizontalLinesRef.current.clear();
      for (const entry of trendSeriesRef.current.values()) {
        handleRef.current.chart.removeSeries(entry.series);
      }
      trendSeriesRef.current.clear();
    };
  }, [drawings, handleRef]);
}
