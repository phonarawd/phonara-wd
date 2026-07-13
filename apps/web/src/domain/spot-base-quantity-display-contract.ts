/**
 * Spot base-asset quantity display — never reuse USDT/wallet currency formatters.
 * Holdings are engine-quantized via `_fmt6`; market may expose `quantity_precision`.
 * Unknown / invalid precision → `—` (fail-closed).
 */

import { Decimal, toDecimal } from '@phonara/money';

export const SPOT_BASE_QUANTITY_FAIL_CLOSED = '—' as const;

/**
 * Engine `spot_holdings.quantity` is written with `_fmt6`.
 * Used only when market does not expose a valid `quantity_precision`.
 */
export const SPOT_HOLDING_ENGINE_QUANTITY_PRECISION = 6 as const;

export type SpotQuantityPrecisionSource = {
  quantity_precision?: number | null;
} | null;

export function isValidSpotQuantityPrecision(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 18;
}

/**
 * Prefer market `quantity_precision` when present; else engine holdings `_fmt6` (6).
 * Callers that must fail-closed without a market should pass `null` into the formatter.
 */
export function resolveSpotBaseQuantityPrecision(
  market: SpotQuantityPrecisionSource | undefined,
): number {
  if (isValidSpotQuantityPrecision(market?.quantity_precision)) {
    return market.quantity_precision;
  }
  return SPOT_HOLDING_ENGINE_QUANTITY_PRECISION;
}

function withGrouping(value: string): string {
  const [whole = '0', fraction] = value.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction !== undefined ? `${grouped}.${fraction}` : grouped;
}

/**
 * Format a spot base quantity with Decimal rounding — not `formatMoney(..., 'USDT')`.
 * `quantityPrecision` null/invalid → fail-closed `—`.
 */
export function formatSpotBaseQuantityDisplay(
  amount: string,
  quantityPrecision: number | null | undefined,
  opts?: { grouping?: boolean },
): string {
  if (!isValidSpotQuantityPrecision(quantityPrecision)) {
    return SPOT_BASE_QUANTITY_FAIL_CLOSED;
  }
  if (amount.trim() === '') {
    return SPOT_BASE_QUANTITY_FAIL_CLOSED;
  }

  const grouping = opts?.grouping ?? true;

  try {
    const fixed = toDecimal(amount)
      .toDecimalPlaces(quantityPrecision, Decimal.ROUND_DOWN)
      .toFixed(quantityPrecision);
    return grouping ? withGrouping(fixed) : fixed;
  } catch {
    return SPOT_BASE_QUANTITY_FAIL_CLOSED;
  }
}
