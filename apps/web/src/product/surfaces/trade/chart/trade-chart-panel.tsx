import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react';

import {
  ORACLE_DISPLAY_INTERVALS,
  type OracleDisplayInterval,
} from '@/features/trading/display-chart/display-feed-contract';
import { useExchangeLiveCandles } from '@/features/trading/display-chart/use-exchange-live-candles';
import { resolveTradeChartEmptyReason } from '@/domain/trade-chart-mount-display-contract';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

import {
  DEFAULT_CHART_OVERLAY_TOGGLES,
  type ChartDrawing,
  type ChartDrawingMode,
  type ChartOverlayToggles,
  type ChartSeriesMode,
} from './chart-overlay-contract';
import type { LightweightChartApi } from './use-lightweight-chart';
import { TradeChart as TradeChartEager, type TradeChartProps } from './trade-chart';

const TradeChartLazy = lazy(() =>
  import('./trade-chart').then((mod) => ({ default: mod.TradeChart })),
);

/**
 * E2E uses eager import — Firefox/WebKit dev dynamic import of chart deps is
 * flaky. This intentionally co-located static+dynamic import of `./trade-chart`
 * makes Rollup/Rolldown fold `lightweight-charts` into the same (already-lazy,
 * route-level) trade-desk chunk instead of a further-isolated sub-chunk —
 * confirmed via `apps/web/dist/index.html` modulepreload list that this chunk
 * is NOT eagerly loaded, so it doesn't affect the Stage1 initial-JS budget
 * (R9-PERF-JS). Not worth the E2E-stability risk of a CJS/require workaround
 * to fully isolate it — see docs/audit/SYSTEM_AUDIT_2026-07-13/06_PERFORMANCE.md.
 */
const TradeChart: ComponentType<TradeChartProps> =
  import.meta.env['VITE_PHONARA_E2E_ENGINE'] === '1' ? TradeChartEager : TradeChartLazy;

export type TradeChartPanelProps = {
  marketSymbol: string | null;
  className?: string;
  /** Display-only oracle mark from RPC — not chart tick (§25.4). */
  oracleMarkPrice?: string | null;
  /** Display-only liquidation price for active position (futures). */
  liquidationPrice?: string | null;
};

/** Symbol · interval · overlay controls + chart — isolated from order form state (§25.4). */
export function TradeChartPanel({
  marketSymbol,
  className,
  oracleMarkPrice,
  liquidationPrice,
}: TradeChartPanelProps) {
  const t = useT();
  const panelRef = useRef<HTMLElement>(null);
  const chartApiRef = useRef<LightweightChartApi | null>(null);
  const [interval, setInterval] = useState<OracleDisplayInterval>('1m');
  const [seriesMode, setSeriesMode] = useState<ChartSeriesMode>('candles');
  const [overlays, setOverlays] = useState<ChartOverlayToggles>(DEFAULT_CHART_OVERLAY_TOGGLES);
  const [advancedOverlaysOpen, setAdvancedOverlaysOpen] = useState(false);
  const [drawingMode, setDrawingMode] = useState<ChartDrawingMode>('none');
  const [drawings, setDrawings] = useState<ChartDrawing[]>([]);
  const [trendDraft, setTrendDraft] = useState<{ time: number; price: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { candles, loading, error, refetch, connected } = useExchangeLiveCandles(
    marketSymbol,
    interval,
  );

  const feedKey = useMemo(() => `${marketSymbol ?? 'none'}:${interval}`, [interval, marketSymbol]);

  /** ZA-12 — empty copy names the actual cause (oracle-seed-wait vs exchange feed outage). */
  const emptyReason = useMemo(() => resolveTradeChartEmptyReason(marketSymbol), [marketSymbol]);
  const emptyTitleKey =
    emptyReason === 'oracle-awaiting-seed'
      ? 'trade.chart.empty.oracleAwaiting.title'
      : emptyReason === 'feed-unavailable'
        ? 'trade.chart.empty.feedUnavailable.title'
        : 'trade.chart.emptyTitle';
  const emptyDescriptionKey =
    emptyReason === 'oracle-awaiting-seed'
      ? 'trade.chart.empty.oracleAwaiting.description'
      : emptyReason === 'feed-unavailable'
        ? 'trade.chart.empty.feedUnavailable.description'
        : 'trade.chart.emptyDescription';

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === panelRef.current);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Native fullscreen size changes before React applies `h-screen` / exits it —
  // sync after paint so candles don't stay crushed to the prior pane scale.
  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        chartApiRef.current?.syncLayout();
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [isFullscreen]);

  const toggleOverlay = useCallback((key: keyof ChartOverlayToggles) => {
    setOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleDrawingMode = useCallback((mode: ChartDrawingMode) => {
    setDrawingMode((prev) => (prev === mode ? 'none' : mode));
    setTrendDraft(null);
  }, []);

  const handleDrawingClick = useCallback(
    ({ time, price }: { time: number; price: number }) => {
      if (drawingMode === 'horizontal') {
        setDrawings((prev) => [...prev, { id: `h-${time}-${price}`, kind: 'horizontal', price }]);
        setDrawingMode('none');
        return;
      }

      if (drawingMode === 'trend') {
        if (!trendDraft) {
          setTrendDraft({ time, price });
          return;
        }
        setDrawings((prev) => [
          ...prev,
          {
            id: `t-${trendDraft.time}-${time}`,
            kind: 'trend',
            time1: trendDraft.time,
            price1: trendDraft.price,
            time2: time,
            price2: price,
          },
        ]);
        setTrendDraft(null);
        setDrawingMode('none');
      }
    },
    [drawingMode, trendDraft],
  );

  const clearDrawings = useCallback(() => {
    setDrawings([]);
    setTrendDraft(null);
    setDrawingMode('none');
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const panel = panelRef.current;
    if (!panel) return;
    if (document.fullscreenElement === panel) {
      await document.exitFullscreen();
      return;
    }
    await panel.requestFullscreen();
  }, []);

  return (
    <section
      ref={panelRef}
      data-testid="trade-chart-panel"
      className={cn(
        'border-line bg-surface flex min-h-0 flex-col overflow-hidden rounded-lg border',
        isFullscreen && 'h-screen w-screen rounded-none',
        className,
      )}
    >
      <header className="border-line flex flex-col gap-2 border-b px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className="flex flex-wrap gap-1"
            role="group"
            aria-label={t('trade.chart.intervals')}
          >
            {ORACLE_DISPLAY_INTERVALS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={interval === item ? 'secondary' : 'ghost'}
                onClick={() => setInterval(item)}
              >
                {item}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-testid="trade-chart-reset-layout"
              onClick={() => chartApiRef.current?.syncLayout()}
            >
              {t('trade.chart.resetLayout')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-testid="trade-chart-fullscreen"
              aria-label={
                isFullscreen ? t('trade.chart.exitFullscreen') : t('trade.chart.fullscreen')
              }
              onClick={() => void toggleFullscreen()}
            >
              {isFullscreen ? t('trade.chart.exitFullscreen') : t('trade.chart.fullscreen')}
            </Button>
            <span
              className={cn(
                'text-xs tabular-nums',
                connected ? 'text-market-up' : 'text-foreground-muted',
              )}
            >
              {connected ? t('trade.chart.syncedTitle') : t('trade.chart.loading')}
            </span>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center gap-1"
          role="group"
          aria-label={t('trade.chart.overlays')}
        >
          <Button
            type="button"
            size="sm"
            variant={seriesMode === 'candles' ? 'secondary' : 'ghost'}
            data-testid="trade-chart-type-candles"
            onClick={() => setSeriesMode('candles')}
          >
            {t('trade.chart.typeCandles')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={seriesMode === 'line' ? 'secondary' : 'ghost'}
            data-testid="trade-chart-type-line"
            onClick={() => setSeriesMode('line')}
          >
            {t('trade.chart.typeLine')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={overlays.vol ? 'secondary' : 'ghost'}
            data-testid="trade-chart-overlay-vol"
            onClick={() => toggleOverlay('vol')}
          >
            {t('trade.chart.overlayVol')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={advancedOverlaysOpen ? 'secondary' : 'ghost'}
            data-testid="trade-chart-advanced-overlays-toggle"
            aria-expanded={advancedOverlaysOpen}
            onClick={() => setAdvancedOverlaysOpen((open) => !open)}
          >
            {advancedOverlaysOpen
              ? t('trade.chart.advancedIndicatorsHide')
              : t('trade.chart.advancedIndicators')}
          </Button>
        </div>

        {advancedOverlaysOpen ? (
          <div
            className="flex flex-wrap items-center gap-1"
            role="group"
            aria-label={t('trade.chart.advancedIndicators')}
            data-testid="trade-chart-advanced-overlays"
          >
            <Button
              type="button"
              size="sm"
              variant={overlays.ma7 ? 'secondary' : 'ghost'}
              data-testid="trade-chart-overlay-ma7"
              onClick={() => toggleOverlay('ma7')}
            >
              {t('trade.chart.overlayMa')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={overlays.ema21 ? 'secondary' : 'ghost'}
              data-testid="trade-chart-overlay-ema21"
              onClick={() => toggleOverlay('ema21')}
            >
              {t('trade.chart.overlayEma')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={overlays.rsi ? 'secondary' : 'ghost'}
              data-testid="trade-chart-overlay-rsi"
              onClick={() => toggleOverlay('rsi')}
            >
              {t('trade.chart.overlayRsi')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={overlays.bb ? 'secondary' : 'ghost'}
              data-testid="trade-chart-overlay-bb"
              onClick={() => toggleOverlay('bb')}
            >
              {t('trade.chart.overlayBb')}
            </Button>
          </div>
        ) : null}

        <div
          className="flex flex-wrap items-center gap-1"
          role="group"
          aria-label={t('trade.chart.drawingTools')}
        >
          <Button
            type="button"
            size="sm"
            variant={drawingMode === 'horizontal' ? 'secondary' : 'ghost'}
            data-testid="trade-chart-draw-horizontal"
            onClick={() => toggleDrawingMode('horizontal')}
          >
            {t('trade.chart.drawingHorizontal')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={drawingMode === 'trend' ? 'secondary' : 'ghost'}
            data-testid="trade-chart-draw-trend"
            onClick={() => toggleDrawingMode('trend')}
          >
            {t('trade.chart.drawingTrend')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-testid="trade-chart-draw-clear"
            onClick={clearDrawings}
            disabled={drawings.length === 0 && !trendDraft}
          >
            {t('trade.chart.drawingClear')}
          </Button>
          {drawingMode === 'trend' ? (
            <span
              className="text-foreground-muted text-xs"
              data-testid="trade-chart-draw-trend-hint"
            >
              {trendDraft ? t('trade.chart.drawingTrendEnd') : t('trade.chart.drawingTrendStart')}
            </span>
          ) : null}
          {drawingMode === 'horizontal' ? (
            <span
              className="text-foreground-muted text-xs"
              data-testid="trade-chart-draw-horizontal-hint"
            >
              {t('trade.chart.drawingHorizontalHint')}
            </span>
          ) : null}
        </div>
      </header>

      <div
        className="flex min-h-0 flex-1 flex-col"
        style={{ height: isFullscreen ? undefined : 'clamp(280px, 40vh, 420px)' }}
      >
        {loading && candles.length < 2 ? (
          <Skeleton className="m-3 min-h-[240px] flex-1" data-testid="trade-chart-loading" />
        ) : null}

        {!loading && candles.length < 2 ? (
          <div
            className="text-foreground-muted flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm"
            data-testid="trade-chart-empty"
            data-empty-reason={emptyReason}
          >
            <p className="text-foreground m-0 font-medium">{t(emptyTitleKey)}</p>
            <p className="m-0">{t(emptyDescriptionKey)}</p>
            {oracleMarkPrice ? (
              <p
                className="text-foreground m-0 tabular-nums"
                data-testid="trade-chart-empty-oracle-mark"
              >
                {t('trade.markPrice')}: {oracleMarkPrice}
              </p>
            ) : null}
            {oracleMarkPrice ? (
              <p className="text-foreground-muted m-0 text-xs">
                {t('trade.chart.oracleLineDescription')}
              </p>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid="trade-chart-empty-retry"
              onClick={() => void refetch()}
            >
              {t('common.retry')}
            </Button>
          </div>
        ) : null}

        {error && candles.length < 2 ? (
          <div
            className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
            data-testid="trade-chart-error"
          >
            <p className="text-foreground m-0 text-sm font-medium">{t('trade.chart.errorTitle')}</p>
            <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>
              {t('common.retry')}
            </Button>
          </div>
        ) : null}

        {candles.length >= 2 ? (
          <Suspense fallback={<Skeleton className="m-3 min-h-[240px] flex-1" />}>
            <TradeChart
              candles={candles}
              feedKey={feedKey}
              seriesMode={seriesMode}
              overlays={overlays}
              oracleMarkPrice={oracleMarkPrice}
              liquidationPrice={liquidationPrice}
              drawings={drawings}
              drawingMode={drawingMode}
              onDrawingClick={handleDrawingClick}
              className="min-h-0"
              onChartReady={(api) => {
                chartApiRef.current = api;
              }}
            />
          </Suspense>
        ) : null}
      </div>

      <p className="text-foreground-muted border-line m-0 border-t px-3 py-2 text-xs">
        {t('trade.chart.displayFeedDisclosure')}
      </p>
    </section>
  );
}
