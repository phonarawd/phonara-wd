import type { TradingChartCandle } from '@/features/trading/display-chart/display-feed-contract';
import type { Time } from 'lightweight-charts';

/** Chart-only number conversion boundary (§25.4 · 30-money-ledger). */
export type ChartCandlePoint = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type ChartVolumePoint = {
  time: Time;
  value: number;
  color?: string;
};

function toChartNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toChartCandleData(candles: readonly TradingChartCandle[]): ChartCandlePoint[] {
  return candles.map((candle) => ({
    time: candle.time as Time,
    open: toChartNumber(candle.open),
    high: toChartNumber(candle.high),
    low: toChartNumber(candle.low),
    close: toChartNumber(candle.close),
  }));
}

export function toChartLineData(candles: readonly ChartCandlePoint[]) {
  return candles.map((candle) => ({
    time: candle.time,
    value: candle.close,
  }));
}

/** Parse RPC/display price strings for chart priceLine only — not settlement. */
export function toChartPriceLineValue(raw: string | null | undefined): number | null {
  if (!raw || raw === '0' || raw === '—') return null;
  const normalized = raw.replace(/,/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Hide overlay lines that would crush candle autoscale (oracle vs exchange feed divergence). */
export function resolveChartOverlayPrice(
  overlayPrice: string | null | undefined,
  candles: readonly TradingChartCandle[],
): string | null {
  if (!overlayPrice) return null;
  const overlayValue = toChartPriceLineValue(overlayPrice);
  if (overlayValue === null || candles.length === 0) return overlayPrice;

  let min = Infinity;
  let max = -Infinity;
  for (const candle of candles) {
    const high = toChartNumber(candle.high);
    const low = toChartNumber(candle.low);
    if (high > max) max = high;
    if (low < min) min = low;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= 0) return overlayPrice;

  const range = Math.max(max - min, max * 0.001);
  if (overlayValue >= min - range && overlayValue <= max + range) return overlayPrice;
  return null;
}

export function toChartVolumeData(
  candles: readonly TradingChartCandle[],
  upColor: string,
  downColor: string,
): ChartVolumePoint[] {
  return candles.map((candle, index) => {
    const open = toChartNumber(candle.open);
    const close = toChartNumber(candle.close);
    const prevClose = index > 0 ? toChartNumber(candles[index - 1]?.close ?? candle.close) : open;
    const color = close >= prevClose ? upColor : downColor;
    return {
      time: candle.time as Time,
      value: candle.volume ? toChartNumber(candle.volume) : 0,
      color,
    };
  });
}
