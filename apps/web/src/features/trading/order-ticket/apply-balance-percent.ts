import { Decimal, toDecimal } from '@phonara/money';

export const BALANCE_PERCENT_PRESETS = [25, 50, 75, 100] as const;

export type BalancePercentPreset = (typeof BALANCE_PERCENT_PRESETS)[number];

/** Display-only margin/amount from available balance fraction (Decimal · no JS float). */
export function marginFromBalancePercent(avail: string, percent: BalancePercentPreset): string {
  return marginFromBalancePercentValue(avail, percent);
}

/** Any 0–100% slice of available balance (slider · Decimal · no JS float). */
export function marginFromBalancePercentValue(avail: string, percent: number): string {
  try {
    const available = toDecimal(avail);
    if (available.isNegative() || available.isZero() || percent <= 0) return '0';
    const clamped = Math.min(100, Math.max(0, percent));
    const fraction = toDecimal(String(clamped)).div(100);
    return available.mul(fraction).toDecimalPlaces(6, Decimal.ROUND_DOWN).toFixed();
  } catch {
    return '0';
  }
}

/** Best-effort active % for slider highlight (display-only). */
export function computeActiveBalancePercent(avail: string, amount: string): number {
  try {
    const available = toDecimal(avail);
    const active = toDecimal(amount);
    if (available.isZero() || active.isNegative()) return 0;
    return Math.min(
      100,
      Math.max(0, active.div(available).mul(100).toDecimalPlaces(0, Decimal.ROUND_DOWN).toNumber()),
    );
  } catch {
    return 0;
  }
}
