import { useEffect, useMemo, useRef, useState, forwardRef, type HTMLAttributes } from 'react';
import { toDecimal } from '@phonara/money';
import type * as LightweightChartsModule from 'lightweight-charts';
import { cn } from '../lib/cn';
import { resolveThemeColor } from '../lib/resolve-css-color';
import { Badge } from './badge';
import { Card } from './card';
import { Skeleton } from './skeleton';
import { StateSurface } from './state-surface';

type LightweightCharts = typeof LightweightChartsModule;
type ChartApi = ReturnType<LightweightCharts['createChart']>;
type LineSeriesApi = LightweightChartsModule.ISeriesApi<'Line'>;
type CandlestickSeriesApi = LightweightChartsModule.ISeriesApi<'Candlestick'>;
type HistogramSeriesApi = LightweightChartsModule.ISeriesApi<'Histogram'>;
type PriceLineApi = ReturnType<LineSeriesApi['createPriceLine']>;
type ChartSeriesApi = LineSeriesApi | CandlestickSeriesApi;

export interface TradingChartPoint {
  time: number;
  value: string;
}

export interface TradingChartCandle {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string | null;
}

export interface TradingChartLabels {
  loading: string;
  loadingDescription?: string;
  emptyTitle: string;
  emptyDescription?: string;
  errorTitle: string;
  errorDescription?: string;
  retry?: string;
  oraclePrice: string;
  liquidationPrice: string;
  policyTitle?: string;
  oracleLineDescription?: string;
  liquidationLineDescription?: string;
  liquidationApproachingTitle?: string;
  liquidationApproachingDescription?: string;
  disclosureTitle?: string;
  syncedTitle?: string;
  volume?: string;
}

export interface TradingChartProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: string;
  subtitle?: string;
  labels: TradingChartLabels;
  points?: TradingChartPoint[];
  candles?: TradingChartCandle[];
  oraclePrice: string;
  liquidationPrice?: string | null;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  approachThreshold?: string;
  pricePrecision?: number;
  disclosure?: string;
}

function themeColor(name: `--${string}`): string {
  return resolveThemeColor(name);
}

function toChartNumber(value: string): number | null {
  try {
    const normalized = value.replace(/,/g, '').replace(/\u2014/g, '').trim();
    if (!normalized || normalized === '—' || normalized === '-') return null;
    const decimal = toDecimal(normalized);
    if (!decimal.isFinite() || decimal.isNegative() || decimal.isZero()) return null;
    return decimal.toNumber();
  } catch {
    return null;
  }
}

function isApproachingLiquidation(
  oraclePrice: string,
  liquidationPrice: string | null | undefined,
  threshold: string,
): boolean {
  if (!liquidationPrice) return false;
  try {
    const oracle = toDecimal(oraclePrice);
    const liquidation = toDecimal(liquidationPrice);
    if (oracle.isZero() || oracle.isNegative() || liquidation.isNegative() || liquidation.isZero()) {
      return false;
    }
    return oracle.minus(liquidation).abs().div(oracle).lessThanOrEqualTo(toDecimal(threshold));
  } catch {
    return false;
  }
}

function normalizeCandles(candles: TradingChartCandle[]) {
  return candles
    .map((candle) => {
      const open = toChartNumber(candle.open);
      const high = toChartNumber(candle.high);
      const low = toChartNumber(candle.low);
      const close = toChartNumber(candle.close);
      if (open === null || high === null || low === null || close === null) return null;
      return { time: candle.time as never, open, high, low, close };
    })
    .filter((candle): candle is { time: never; open: number; high: number; low: number; close: number } => candle !== null);
}

function normalizePoints(points: TradingChartPoint[]) {
  return points
    .map((point) => {
      const value = toChartNumber(point.value);
      return value === null ? null : { time: point.time as never, value };
    })
    .filter((point): point is { time: never; value: number } => point !== null);
}

function normalizeVolume(candles: TradingChartCandle[], border: string, muted: string) {
  return candles
    .map((candle) => {
      const value = candle.volume ? toChartNumber(candle.volume) : 0;
      return value === null ? null : {
        time: candle.time as never,
        value,
        color: value === 0 ? border : muted,
      };
    })
    .filter((point): point is { time: never; value: number; color: string } => point !== null);
}

function createChartApi(mod: LightweightCharts, container: HTMLDivElement): ChartApi {
  const fg = themeColor('--color-fg');
  const muted = themeColor('--color-muted');
  const surface = themeColor('--color-surface');
  const border = themeColor('--color-border-strong');

  return mod.createChart(container, {
    autoSize: true,
    layout: {
      background: { type: mod.ColorType.Solid, color: surface },
      textColor: muted,
      attributionLogo: false,
    },
    grid: {
      vertLines: { color: border },
      horzLines: { color: border },
    },
    rightPriceScale: {
      borderColor: border,
      textColor: fg,
    },
    timeScale: {
      borderColor: border,
      timeVisible: true,
      secondsVisible: false,
    },
    crosshair: {
      mode: mod.CrosshairMode.Normal,
    },
    handleScroll: false,
    handleScale: false,
  });
}

function createDataSeries(
  mod: LightweightCharts,
  chart: ChartApi,
  mode: 'candles' | 'line',
  pricePrecision: number,
): ChartSeriesApi {
  return mode === 'candles'
    ? chart.addSeries(mod.CandlestickSeries, {
      upColor: themeColor('--color-up'),
      downColor: themeColor('--color-down'),
      borderUpColor: themeColor('--color-up'),
      borderDownColor: themeColor('--color-down'),
      wickUpColor: themeColor('--color-up'),
      wickDownColor: themeColor('--color-down'),
      priceFormat: { type: 'price', precision: pricePrecision, minMove: 1 / (10 ** pricePrecision) },
    })
    : chart.addSeries(mod.LineSeries, {
      color: themeColor('--color-primary'),
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: { type: 'price', precision: pricePrecision, minMove: 1 / (10 ** pricePrecision) },
    });
}

function createVolumeSeries(mod: LightweightCharts, chart: ChartApi): HistogramSeriesApi {
  const volumeSeries = chart.addSeries(mod.HistogramSeries, {
    priceScaleId: 'volume',
    priceFormat: { type: 'volume' },
    lastValueVisible: false,
    priceLineVisible: false,
  });
  chart.priceScale('volume').applyOptions({
    scaleMargins: { top: 0.8, bottom: 0 },
  });
  return volumeSeries;
}

export const TradingChart = forwardRef<HTMLDivElement, TradingChartProps>(function TradingChart(
  {
    title,
    subtitle,
    labels,
    points,
    candles,
    oraclePrice,
    liquidationPrice,
    loading = false,
    error: externalError = false,
    onRetry,
    approachThreshold = '0.02',
    pricePrecision = 6,
    disclosure,
    className,
    ...props
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const moduleRef = useRef<LightweightCharts | null>(null);
  const chartRef = useRef<ChartApi | null>(null);
  const seriesRef = useRef<ChartSeriesApi | null>(null);
  const seriesModeRef = useRef<'candles' | 'line' | null>(null);
  const volumeSeriesRef = useRef<HistogramSeriesApi | null>(null);
  const oracleLineRef = useRef<PriceLineApi | null>(null);
  const liquidationLineRef = useRef<PriceLineApi | null>(null);
  const [error, setError] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const chartPoints = useMemo(() => points ?? [], [points]);
  const chartCandles = useMemo(() => candles ?? [], [candles]);
  const validCandles = useMemo(() => normalizeCandles(chartCandles), [chartCandles]);
  const validPoints = useMemo(() => normalizePoints(chartPoints), [chartPoints]);
  const displayError = externalError || error;
  const isEmpty =
    !loading && !displayError && chartPoints.length === 0 && chartCandles.length === 0;
  const approachingLiquidation = useMemo(
    () => isApproachingLiquidation(oraclePrice, liquidationPrice, approachThreshold),
    [approachThreshold, liquidationPrice, oraclePrice],
  );

  useEffect(() => {
    if (loading || isEmpty || !containerRef.current) return undefined;

    let cancelled = false;
    setError(false);
    setChartReady(false);

    void import('lightweight-charts')
      .then((mod) => {
        if (cancelled || !containerRef.current) return;
        moduleRef.current = mod;
        chartRef.current = createChartApi(mod, containerRef.current);
        setChartReady(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      oracleLineRef.current = null;
      liquidationLineRef.current = null;
      volumeSeriesRef.current = null;
      seriesRef.current = null;
      seriesModeRef.current = null;
      chartRef.current?.remove();
      chartRef.current = null;
      setChartReady(false);
    };
  }, [isEmpty, loading, retryKey]);

  useEffect(() => {
    const mod = moduleRef.current;
    const chart = chartRef.current;
    if (!chartReady || !mod || !chart || displayError) return;

    const mode = validCandles.length > 0 ? 'candles' : 'line';
    if (!seriesRef.current || seriesModeRef.current !== mode) {
      seriesRef.current = createDataSeries(mod, chart, mode, pricePrecision);
      seriesModeRef.current = mode;
    }

    if (mode === 'candles') {
      (seriesRef.current as CandlestickSeriesApi).setData(validCandles);
      const volumePoints = normalizeVolume(chartCandles, themeColor('--color-border-strong'), themeColor('--color-muted'));
      if (volumePoints.length > 0) {
        const volumeSeries = volumeSeriesRef.current ?? createVolumeSeries(mod, chart);
        volumeSeriesRef.current = volumeSeries;
        volumeSeries.setData(volumePoints);
      }
    } else {
      (seriesRef.current as LineSeriesApi).setData(validPoints);
    }

    if (validCandles.length > 0 || validPoints.length > 0) {
      chart.timeScale().fitContent();
    }
  }, [chartCandles, chartReady, displayError, pricePrecision, validCandles, validPoints]);

  useEffect(() => {
    const mod = moduleRef.current;
    const series = seriesRef.current;
    if (!chartReady || !mod || !series || displayError) return;

    const oracle = toChartNumber(oraclePrice);
    if (oracleLineRef.current) {
      series.removePriceLine(oracleLineRef.current);
      oracleLineRef.current = null;
    }
    if (oracle !== null) {
      oracleLineRef.current = series.createPriceLine({
        price: oracle,
        color: themeColor('--color-primary'),
        lineWidth: 2,
        lineStyle: mod.LineStyle.Solid,
        axisLabelVisible: true,
        title: labels.oraclePrice,
      });
    }

    const liquidation = liquidationPrice ? toChartNumber(liquidationPrice) : null;
    if (liquidationLineRef.current) {
      series.removePriceLine(liquidationLineRef.current);
      liquidationLineRef.current = null;
    }
    if (liquidation !== null) {
      liquidationLineRef.current = series.createPriceLine({
        price: liquidation,
        color: themeColor('--color-down'),
        lineWidth: 2,
        lineStyle: mod.LineStyle.Dashed,
        axisLabelVisible: true,
        title: labels.liquidationPrice,
      });
    }
  }, [chartReady, displayError, labels.liquidationPrice, labels.oraclePrice, liquidationPrice, oraclePrice]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (approachingLiquidation) {
      container.dataset['approachingLiquidation'] = 'true';
    } else {
      delete container.dataset['approachingLiquidation'];
    }
  }, [approachingLiquidation]);

  return (
    <Card
      ref={ref}
      className={cn(
        'flex min-h-[320px] flex-col gap-3 p-4',
        approachingLiquidation && !loading && !displayError
          ? 'border-down/50 shadow-[var(--elevation-1)]'
          : '',
        className,
      )}
      data-testid="trading-chart"
      data-risk={approachingLiquidation ? 'approaching-liquidation' : undefined}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[1.05rem] font-bold text-fg">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {!loading && !displayError && !isEmpty && labels.syncedTitle ? (
            <Badge tone="primary" size="sm" density="compact">
              {labels.syncedTitle}
            </Badge>
          ) : null}
          {approachingLiquidation && labels.liquidationApproachingTitle ? (
            <Badge tone="risk" size="sm" density="compact">
              {labels.liquidationApproachingTitle}
            </Badge>
          ) : null}
        </div>
      </div>

      {loading && (
        <div className="grid flex-1 gap-3" data-testid="trading-chart-loading">
          <Skeleton className="h-[220px] w-full" />
          <StateSurface
            state="loading"
            density="compact"
            title={labels.loading}
            description={labels.loadingDescription}
            loadingLabel={labels.loading}
            className="py-3"
          />
        </div>
      )}

      {!loading && isEmpty && (
        <StateSurface
          state="empty"
          title={labels.emptyTitle}
          description={labels.emptyDescription}
          className="flex flex-1 flex-col items-center justify-center"
          data-testid="trading-chart-empty"
        />
      )}

      {!loading && displayError && (
        <StateSurface
          state="error"
          title={labels.errorTitle}
          description={labels.errorDescription}
          actionLabel={labels.retry}
          actionVariant="danger"
          onAction={() => {
            setRetryKey((value) => value + 1);
            onRetry?.();
          }}
          className="flex flex-1 flex-col items-center justify-center"
          data-testid="trading-chart-error"
        />
      )}

      {!loading && !isEmpty && !displayError && (
        <>
          <div
            ref={containerRef}
            className={cn(
              'relative min-h-[240px] flex-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--surface-inset-shadow)]',
              'transition-[border-color,box-shadow] duration-[var(--motion-duration-confirmation)] ease-[var(--motion-ease-standard)]',
              "[&[data-approaching-liquidation='true']]:animate-pulse [&[data-approaching-liquidation='true']]:border-down/70",
            )}
            data-testid="trading-chart-success"
          />
          <div className="grid gap-2 rounded-2xl border border-border bg-surface-inset p-3 text-xs shadow-[var(--surface-inset-shadow)]">
            {labels.policyTitle && (
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-fg">{labels.policyTitle}</span>
                {labels.syncedTitle && <Badge tone="primary" size="sm" density="compact">{labels.syncedTitle}</Badge>}
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-primary/25 bg-primary/10 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-primary">{labels.oraclePrice}</span>
                  <span className="font-semibold tabular-nums text-fg">{oraclePrice}</span>
                </div>
                {labels.oracleLineDescription && (
                  <p className="mt-1 leading-5 text-muted">{labels.oracleLineDescription}</p>
                )}
              </div>
              {liquidationPrice && (
                <div
                  className={cn(
                    'rounded-xl border px-3 py-2',
                    approachingLiquidation
                      ? 'border-down/45 bg-down/15'
                      : 'border-down/25 bg-down/10',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-down">{labels.liquidationPrice}</span>
                    <span className="font-semibold tabular-nums text-fg">{liquidationPrice}</span>
                  </div>
                  {approachingLiquidation && labels.liquidationApproachingDescription ? (
                    <p className="mt-1 leading-5 text-down">{labels.liquidationApproachingDescription}</p>
                  ) : labels.liquidationLineDescription ? (
                    <p className="mt-1 leading-5 text-muted">{labels.liquidationLineDescription}</p>
                  ) : null}
                </div>
              )}
            </div>
            {disclosure && (
              <div className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-warning">
                {labels.disclosureTitle && <p className="font-semibold">{labels.disclosureTitle}</p>}
                <p className={cn('leading-5', labels.disclosureTitle ? 'mt-1' : '')}>{disclosure}</p>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
});

TradingChart.displayName = 'TradingChart';
