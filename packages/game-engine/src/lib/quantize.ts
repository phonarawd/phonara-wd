import { Decimal } from '@phonara/money';

/**
 * Money / payout / multiplier connector.
 *
 * Provably-fair raw floats may use JS number for entropy interpretation, but
 * every value that can affect payout or ledger settlement crosses this Decimal
 * connector before leaving the game engine.
 *
 * `number` is forbidden — float binary can corrupt payout legs. Pass `Decimal`
 * or a decimal `string` (e.g. `.toFixed(n)` from engine math).
 */
export function quantize6(value: Decimal | string): Decimal {
  if (typeof (value as unknown) === 'number') {
    throw new Error('[game-engine] quantize6 forbids number; pass Decimal or string');
  }
  return new Decimal(value).toDecimalPlaces(6, Decimal.ROUND_DOWN);
}

export function quantize6String(value: Decimal | string): string {
  return quantize6(value).toFixed(6);
}
