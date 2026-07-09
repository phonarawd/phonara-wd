import { money, multiply, toDecimal, type MoneyAmount } from '@phonara/money';
import type { Currency } from '@phonara/shared-types';
import { productComboOddsFromLegs } from './combo-odds';
import type { BetLegInput } from './types';

export const PREVIEW_ONLY =
  'Preview-only — authoritative payout/settlement remains SQL/RPC (_finalize_sports_bet).';

/**
 * Display-only combo payout preview for slip UI.
 * {@link PREVIEW_ONLY}
 */
export function previewComboPayout(stake: MoneyAmount, legs: readonly BetLegInput[]): MoneyAmount {
  const comboOdds = productComboOddsFromLegs(legs);
  toDecimal(comboOdds, 'combo odds');
  return multiply(stake, comboOdds);
}

/**
 * Display-only single-leg payout preview for slip UI.
 * {@link PREVIEW_ONLY}
 */
export function previewSinglePayout(
  stakeAmount: string,
  currency: Currency,
  odds: string,
): MoneyAmount {
  const stake = money(stakeAmount, currency);
  toDecimal(odds, 'single odds');
  return multiply(stake, odds);
}
