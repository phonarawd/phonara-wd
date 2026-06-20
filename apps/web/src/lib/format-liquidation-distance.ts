import { toDecimal } from '@phonara/money';

const CRITICAL_DISTANCE_PCT = 5;

/** Display-only distance from oracle mark to server liquidation price. */
export function formatLiquidationDistance(
  mark: string,
  liquidationPrice: string,
): string | null {
  try {
    const markDecimal = toDecimal(mark);
    if (!markDecimal.greaterThan(0)) return null;
    const distance = markDecimal
      .minus(toDecimal(liquidationPrice))
      .abs()
      .div(markDecimal)
      .mul(100);
    return `${distance.toFixed(2)}%`;
  } catch {
    return null;
  }
}

export function isLiquidationDistanceCritical(
  distanceStr: string | null,
  thresholdPct = CRITICAL_DISTANCE_PCT,
): boolean {
  if (!distanceStr) return false;
  try {
    const numeric = parseFloat(distanceStr.replace('%', ''));
    return Number.isFinite(numeric) && numeric <= thresholdPct;
  } catch {
    return false;
  }
}

export { CRITICAL_DISTANCE_PCT };
