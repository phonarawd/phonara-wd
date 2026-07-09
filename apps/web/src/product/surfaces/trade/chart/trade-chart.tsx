import { useCallback, useMemo, useRef } from 'react';

import type { TradingChartCandle } from '@/features/trading/display-chart/display-feed-contract';
import { useT } from '@/product/i18n';

import type {
  ChartDrawing,
  ChartDrawingMode,
  ChartOverlayToggles,
  ChartSeriesMode,
} from './chart-overlay-contract';
import { TradeChartCrosshairLegend } from './trade-chart-crosshair-legend';
import { resolveChartOverlayPrice } from './to-chart-data';
import { useChartCrosshairLegend } from './use-chart-crosshair-legend';
import { useChartDrawings } from './use-chart-drawings';
import { useChartPriceLines } from './use-chart-price-lines';
import { useChartSeries } from './use-chart-series';
import { useLightweightChart, type LightweightChartApi } from './use-lightweight-chart';

export type TradeChartProps = {
  candles: readonly TradingChartCandle[];
  feedKey: string;
  className?: string;
  seriesMode: ChartSeriesMode;
  overlays: ChartOverlayToggles;
  oracleMarkPrice?: string | null;
  liquidationPrice?: string | null;
  drawings?: readonly ChartDrawing[];
  drawingMode?: ChartDrawingMode;
  onDrawingClick?: (input: { time: number; price: number }) => void;
  onChartReady?: (api: LightweightChartApi) => void;
};

/** Lightweight Charts v5 renderer — lazy-loaded with parent panel (§25.4). */
export function TradeChart({
  candles,
  feedKey,
  className,
  seriesMode,
  overlays,
  oracleMarkPrice,
  liquidationPrice,
  drawings = [],
  drawingMode = 'none',
  onDrawingClick,
  onChartReady,
}: TradeChartProps) {
  const t = useT();
  const hostRef = useRef<HTMLDivElement>(null);
  const onChartReadyRef = useRef(onChartReady);
  onChartReadyRef.current = onChartReady;

  const handleReady = useCallback((api: LightweightChartApi) => {
    onChartReadyRef.current?.(api);
  }, []);

  const handleRef = useLightweightChart(hostRef, handleReady);
  useChartSeries(handleRef, candles, feedKey, { seriesMode, overlays });

  const priceLineLabels = useMemo(
    () => ({
      oracle: t('trade.markPrice'),
      liquidation: t('trade.liquidationPrice'),
    }),
    [t],
  );
  const chartOracleMark = useMemo(
    () => resolveChartOverlayPrice(oracleMarkPrice, candles),
    [candles, oracleMarkPrice],
  );
  const chartLiquidationPrice = useMemo(
    () => resolveChartOverlayPrice(liquidationPrice, candles),
    [candles, liquidationPrice],
  );
  useChartPriceLines(handleRef, chartOracleMark, chartLiquidationPrice, priceLineLabels);
  useChartDrawings(handleRef, drawings, drawingMode, onDrawingClick ?? (() => {}));

  const legend = useChartCrosshairLegend(handleRef);

  return (
    <div className="relative h-full min-h-0 w-full">
      <TradeChartCrosshairLegend snapshot={legend} />
      <div
        ref={hostRef}
        data-testid="trade-lightweight-chart"
        className={className ?? 'h-full min-h-[280px] w-full'}
      />
    </div>
  );
}
