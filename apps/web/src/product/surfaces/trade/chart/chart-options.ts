import { CrosshairMode } from 'lightweight-charts';

import type { ChartTheme } from './chart-theme';
import { chartGridOptions, chartLayoutOptions } from './chart-theme';

/** Crosshair with OHLC magnet — exchange-grade interaction (§25.4 · #4 chart-pro). */
export function chartCrosshairOptions(theme: ChartTheme) {
  return {
    mode: CrosshairMode.MagnetOHLC,
    doNotSnapToHiddenSeriesIndices: false,
    vertLine: {
      color: theme.line,
      labelBackgroundColor: theme.textMuted,
    },
    horzLine: {
      color: theme.line,
      labelBackgroundColor: theme.textMuted,
    },
  } as const;
}

/** Wheel zoom/pan + touch drag defaults (§25.4 mobile · desktop). */
export function chartInteractionOptions() {
  return {
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false,
    },
    handleScale: {
      mouseWheel: true,
      pinch: true,
      axisPressedMouseMove: {
        time: true,
        price: true,
      },
    },
  };
}

export function createChartOptions(theme: ChartTheme) {
  return {
    autoSize: true,
    layout: chartLayoutOptions(theme),
    grid: chartGridOptions(theme),
    crosshair: chartCrosshairOptions(theme),
    ...chartInteractionOptions(),
    timeScale: {
      borderColor: theme.line,
      timeVisible: true,
    },
    rightPriceScale: {
      borderColor: theme.line,
    },
  };
}
