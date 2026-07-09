/** Chart series mode — display feed only (§25.4 · #5 overlays). */
export type ChartSeriesMode = 'candles' | 'line';

export type ChartOverlayToggles = {
  ma7: boolean;
  ema21: boolean;
  rsi: boolean;
  bb: boolean;
  vol: boolean;
};

export const DEFAULT_CHART_OVERLAY_TOGGLES: ChartOverlayToggles = {
  ma7: false,
  ema21: false,
  rsi: false,
  bb: false,
  vol: true,
};

export type ChartDrawingMode = 'none' | 'horizontal' | 'trend';

export type HorizontalDrawing = {
  id: string;
  kind: 'horizontal';
  price: number;
};

export type TrendDrawing = {
  id: string;
  kind: 'trend';
  time1: number;
  price1: number;
  time2: number;
  price2: number;
};

export type ChartDrawing = HorizontalDrawing | TrendDrawing;

export type CrosshairLegendSnapshot = {
  open: string;
  high: string;
  low: string;
  close: string;
  visible: boolean;
};
