import type { IChartApi } from 'lightweight-charts';

/** Below this the canvas is effectively a time-axis strip — do not lock scales. */
export const CHART_LAYOUT_MIN_WIDTH_PX = 32;
export const CHART_LAYOUT_MIN_HEIGHT_PX = 64;

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
 * Re-apply pane size + price autoscale + time fit after container changes
 * (fullscreen enter/exit, flex reflow, mobile tab reveal). Without this,
 * Lightweight Charts can keep a scale computed while the host was ~0px tall
 * — candles crush to a line until the user drags the price axis.
 */
export function syncChartLayout(chart: IChartApi, host: HTMLElement): boolean {
  const size = readChartHostSize(host);
  if (!isChartHostSized(size)) return false;

  // Explicit size: autoSize alone can miss a frame across fullscreen CSS class
  // application (React state lags the native fullscreenchange event).
  chart.applyOptions({ width: size.width, height: size.height });
  chart.priceScale('right').applyOptions({ autoScale: true });
  try {
    chart.priceScale('volume').applyOptions({ autoScale: true });
  } catch {
    /* volume scale may be absent before series attach */
  }
  try {
    chart.priceScale('rsi').applyOptions({ autoScale: true });
  } catch {
    /* rsi scale may be absent when overlay is off */
  }
  chart.timeScale().fitContent();
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
