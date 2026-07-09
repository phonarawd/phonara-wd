import { Decimal, toDecimal } from '@phonara/money';

export const SPORTS_BALANCE_PERCENT_PRESETS = [25, 50, 75, 100] as const;

export type SportsBalancePercentPreset = (typeof SPORTS_BALANCE_PERCENT_PRESETS)[number];

export function sportsStakeFromBalancePercent(
  avail: string,
  percent: SportsBalancePercentPreset,
): string {
  try {
    const available = toDecimal(avail);
    if (available.isNegative() || available.isZero() || percent <= 0) return '0';
    const fraction = toDecimal(String(percent)).div(100);
    return available.mul(fraction).toDecimalPlaces(6, Decimal.ROUND_DOWN).toFixed();
  } catch {
    return '0';
  }
}

function computeActiveBalancePercent(avail: string, amount: string): number {
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

export function isSportsBalancePercentPresetActive(
  avail: string,
  amount: string,
  preset: SportsBalancePercentPreset,
): boolean {
  return computeActiveBalancePercent(avail, amount) === preset;
}
