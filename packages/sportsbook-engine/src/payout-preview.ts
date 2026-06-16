import { money, multiply, toDecimal, type MoneyAmount } from '@phonara/money';
import type { Currency } from '@phonara/shared-types';
import { productComboOddsFromLegs } from './combo-odds';
import type { BetLegInput } from './types';

/** Display-only payout preview — server settlement is authoritative (S4). */
export function previewComboPayout(
  stake: MoneyAmount,
  legs: readonly BetLegInput[],
): MoneyAmount {
  const comboOdds = productComboOddsFromLegs(legs);
  toDecimal(comboOdds, 'combo odds');
  return multiply(stake, comboOdds);
}

export function previewSinglePayout(
  stakeAmount: string,
  currency: Currency,
  odds: string,
): MoneyAmount {
  const stake = money(stakeAmount, currency);
  toDecimal(odds, 'single odds');
  return multiply(stake, odds);
}
