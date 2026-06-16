import { toDecimal } from '@phonara/money';
import { MAX_COMBO_LEGS } from './constants';
import type { BetLegInput } from './types';

export class SportsbookComboError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SportsbookComboError';
  }
}

/** Multiply decimal odds strings for a combo (display/preview only until S3 RPC). */
export function productComboOdds(legOdds: readonly string[]): string {
  if (legOdds.length === 0) {
    throw new SportsbookComboError('[sportsbook] combo requires at least one leg');
  }
  if (legOdds.length > MAX_COMBO_LEGS) {
    throw new SportsbookComboError(`[sportsbook] combo exceeds ${MAX_COMBO_LEGS} legs`);
  }

  let product = toDecimal('1', 'combo seed');
  for (const odds of legOdds) {
    const leg = toDecimal(odds, 'leg odds');
    if (leg.lte(1)) {
      throw new SportsbookComboError('[sportsbook] leg odds must be greater than 1');
    }
    product = product.mul(leg);
  }

  return product.toFixed();
}

export function productComboOddsFromLegs(legs: readonly BetLegInput[]): string {
  return productComboOdds(legs.map((leg) => leg.odds));
}
