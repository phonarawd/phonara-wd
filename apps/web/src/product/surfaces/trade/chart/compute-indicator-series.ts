import type { Time } from 'lightweight-charts';

import type { ChartCandlePoint } from './to-chart-data';

export type IndicatorPoint = {
  time: Time;
  value: number;
};

/** Display-only MA7 from chart close prices — not settlement input. */
export function computeMa7(candles: readonly ChartCandlePoint[]): IndicatorPoint[] {
  if (candles.length < 7) return [];

  const result: IndicatorPoint[] = [];
  for (let i = 6; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - 6; j <= i; j++) {
      sum += candles[j]!.close;
    }
    result.push({ time: candles[i]!.time, value: sum / 7 });
  }
  return result;
}

/** Display-only EMA21 seeded with SMA — not settlement input. */
export function computeEma21(candles: readonly ChartCandlePoint[]): IndicatorPoint[] {
  const period = 21;
  if (candles.length < period) return [];

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i]!.close;
  }

  let ema = sum / period;
  const result: IndicatorPoint[] = [{ time: candles[period - 1]!.time, value: ema }];
  const k = 2 / (period + 1);

  for (let i = period; i < candles.length; i++) {
    ema = candles[i]!.close * k + ema * (1 - k);
    result.push({ time: candles[i]!.time, value: ema });
  }

  return result;
}

export type BollingerBandPoint = {
  time: Time;
  upper: number;
  middle: number;
  lower: number;
};

/** Display-only Bollinger Bands (20, 2) — not settlement input. */
export function computeBollingerBands20(
  candles: readonly ChartCandlePoint[],
): BollingerBandPoint[] {
  const period = 20;
  const multiplier = 2;
  if (candles.length < period) return [];

  const result: BollingerBandPoint[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += candles[j]!.close;
    }
    const mean = sum / period;

    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const delta = candles[j]!.close - mean;
      variance += delta * delta;
    }
    const stddev = Math.sqrt(variance / period);

    result.push({
      time: candles[i]!.time,
      middle: mean,
      upper: mean + multiplier * stddev,
      lower: mean - multiplier * stddev,
    });
  }

  return result;
}

/** Display-only RSI(14) — not settlement input. */
export function computeRsi14(candles: readonly ChartCandlePoint[]): IndicatorPoint[] {
  const period = 14;
  if (candles.length < period + 1) return [];

  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const delta = candles[i]!.close - candles[i - 1]!.close;
    gains.push(delta > 0 ? delta : 0);
    losses.push(delta < 0 ? -delta : 0);
  }

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    avgGain += gains[i]!;
    avgLoss += losses[i]!;
  }
  avgGain /= period;
  avgLoss /= period;

  const result: IndicatorPoint[] = [];
  const firstIndex = period;
  const rs = avgLoss === 0 ? Number.POSITIVE_INFINITY : avgGain / avgLoss;
  result.push({
    time: candles[firstIndex]!.time,
    value: avgLoss === 0 ? 100 : 100 - 100 / (1 + rs),
  });

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]!) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]!) / period;
    const nextRs = avgLoss === 0 ? Number.POSITIVE_INFINITY : avgGain / avgLoss;
    result.push({
      time: candles[i + 1]!.time,
      value: avgLoss === 0 ? 100 : 100 - 100 / (1 + nextRs),
    });
  }

  return result;
}
