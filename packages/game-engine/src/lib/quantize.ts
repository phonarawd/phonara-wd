import { Decimal } from '@phonara/money';

/**
 * Money / payout / multiplier connector.
 *
 * Provably-fair raw floats may use JS number for entropy interpretation, but
 * every value that can affect payout or ledger settlement crosses this Decimal
 * connector before leaving the game engine.
 */
export function quantize6(value: Decimal | string | number): Decimal {
  return new Decimal(value).toDecimalPlaces(6, Decimal.ROUND_DOWN);
}

export function quantize6String(value: Decimal | string | number): string {
  return quantize6(value).toFixed(6);
}
