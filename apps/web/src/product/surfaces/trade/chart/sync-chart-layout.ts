import type { IChartApi } from 'lightweight-charts';

/** Below this the canvas is effectively a time-axis strip — do not lock scales. */
export const CHART_LAYOUT_MIN_WIDTH_PX = 32;
export const CHART_LAYOUT_MIN_HEIGHT_PX = 64;

/** Main pane keeps room for the volume overlay strip at the bottom. */
export const CHART_RIGHT_SCALE_MARGINS = { top: 0.05, bottom: 0.25 } as const;
export const CHART_VOLUME_SCALE_MARGINS = { top: 0.8, bottom: 0 } as const;
export const CHART_RSI_SCALE_MARGINS = { top: 0.75, bottom: 0 } as const;

export type ChartLayoutSize = {
  width: number;
  height: number;
};

export function readChartHostSize(host: HTMLElement): ChartLayoutSize {
  return { width: host.clientWidth, height: host.clientHeight };
}

export function isChartHostSized(size: ChartLayoutSize): boolean {
  return size.width >= CHART_LAYOUT_MIN_WIDTH_PX && size.height >= CHART_LAYOUT_MIN_HEIGHT_PX;
}

/**
 * Whether a layout sync must call `fitContent()`.
 *
 * First successful size after mount — and recovery from a collapsed (0×0 /
 * TabsContent) host — must refit. Otherwise ResizeObserver keeps the user's
 * zoom/pan. Consuming "first sync" before the host is sized leaves candles
 * off-screen (axes + price lines visible, empty grid).
 */
export function shouldFitChartOnLayoutSync(options: {
  awaitingFirstSuccessfulFit: boolean;
  recoveringFromCollapsedHost: boolean;
}): boolean {
  return options.awaitingFirstSuccessfulFit || options.recoveringFromCollapsedHost;
}

export type SyncChartLayoutOptions = {
  /**
   * Whether to call `fitContent()` after resizing. Defaults to `true` for
   * explicit reset semantics (initial mount, manual "Reset Layout", fullscreen
   * toggle). ResizeObserver-triggered resyncs pass `fit: false` so a window
   * resize / sidebar toggle doesn't discard the user's zoom/pan — `applyOptions`
   * alone doesn't move the visible time range.
   */
  fit?: boolean;
};

/**
 * Resize pane + force right-scale autoscale after container changes.
 *
 * Important: do NOT mix this with `autoSize: true` — fighting LWC's internal
 * ResizeObserver leaves a stale visible price range (e.g. -20k…50k while BTC
 * is at 62k), so candles clip above the pane until the user drags the axis.
 */
export function syncChartLayout(
  chart: IChartApi,
  host: HTMLElement,
  { fit = true }: SyncChartLayoutOptions = {},
): boolean {
  const size = readChartHostSize(host);
  if (!isChartHostSized(size)) return false;

  chart.applyOptions({ width: size.width, height: size.height });

  const right = chart.priceScale('right');
  right.applyOptions({ scaleMargins: { ...CHART_RIGHT_SCALE_MARGINS } });
  // setAutoScale (not applyOptions) actually clears a user/stale fixed range.
  right.setAutoScale(true);

  try {
    chart.priceScale('').applyOptions({ scaleMargins: { ...CHART_VOLUME_SCALE_MARGINS } });
  } catch {
    /* volume overlay may be absent */
  }
  try {
    chart.priceScale('rsi').applyOptions({ scaleMargins: { ...CHART_RSI_SCALE_MARGINS } });
  } catch {
    /* rsi overlay may be absent */
  }

  if (fit) {
    chart.timeScale().fitContent();
  }
  return true;
}

/** Double rAF — wait for layout/paint after className / fullscreen transitions. */
export function scheduleChartLayoutSync(run: () => void): () => void {
  let inner = 0;
  const outer = requestAnimationFrame(() => {
    inner = requestAnimationFrame(run);
  });
  return () => {
    cancelAnimationFrame(outer);
    cancelAnimationFrame(inner);
  };
}
