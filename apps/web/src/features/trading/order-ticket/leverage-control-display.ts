import { toDecimal } from '@phonara/money';

/** OKX/Binance-style preset chips — values above market max are filtered at render time. */
export const LEVERAGE_CHIP_VALUES = [1, 5, 10, 20] as const;

export type LeverageChipValue = (typeof LEVERAGE_CHIP_VALUES)[number];

export function parseLeverageInt(value: string): number {
  try {
    const digits = value.replace(/[^\d]/g, '');
    if (!digits) return 1;
    const n = toDecimal(digits).toNumber();
    return Number.isFinite(n) ? Math.floor(n) : 1;
  } catch {
    return 1;
  }
}

export function clampLeverageInt(value: number, maxLeverage: number): number {
  const max = Math.max(1, Math.floor(maxLeverage));
  return Math.min(max, Math.max(1, Math.floor(value)));
}

export function clampLeverageString(value: string, maxLeverage: number): string {
  return String(clampLeverageInt(parseLeverageInt(value), maxLeverage));
}

/** Preset chips visible for the current market max (always capped by RPC max_leverage). */
export function buildVisibleLeverageChips(maxLeverage: number): readonly number[] {
  const max = Math.max(1, Math.floor(maxLeverage));
  return LEVERAGE_CHIP_VALUES.filter((chip) => chip <= max);
}

export function isMaxLeverageChipActive(leverage: string, maxLeverage: number): boolean {
  const max = clampLeverageInt(maxLeverage, maxLeverage);
  return parseLeverageInt(leverage) === max;
}

export function isLeverageChipActive(leverage: string, chip: number): boolean {
  return parseLeverageInt(leverage) === chip;
}
