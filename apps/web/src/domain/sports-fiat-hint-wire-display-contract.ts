/**
 * P10 Sports slip FiatHint wire — stake+return secondary · odds-after (§13.1.4.4 Fiat#10).
 * Authority: `p10-sports-fiat-hint-wire` · ComplaintRisk `fiat-hint-sports-odds-order`.
 */

import {
  FIAT_REFERENCE_SETTLEMENT_CURRENCIES,
  findFiatHintComplaintRisk,
  P10_SPORTS_FIAT_HINT_WIRE_PREREQUISITE_TODOS,
  P10_SPORTS_FIAT_HINT_WIRE_TODO,
  type FiatHintView,
} from './fiat-reference-display-contract';

export { P10_SPORTS_FIAT_HINT_WIRE_PREREQUISITE_TODOS, P10_SPORTS_FIAT_HINT_WIRE_TODO };

function isSportsFiatHintEligibleCurrency(currency: string): boolean {
  return (FIAT_REFERENCE_SETTLEMENT_CURRENCIES as readonly string[]).includes(currency);
}

export const SPORTS_FIAT_HINT_WIRE_SURFACE = 'sports-money-with-fiat-hint.tsx' as const;

export const SPORTS_FIAT_HINT_WIRE_HOOK = 'use-sports-fiat-hint.ts' as const;

export const SPORTS_FIAT_HINT_WIRE_DISPLAY = 'sports-fiat-hint-display.ts' as const;

/** Sports slip uses trade-rate 30s refresh (§13.1.4.4). */
export const SPORTS_FIAT_HINT_REFRESH_POLICY = 'trade' as const;

export const SPORTS_FIAT_HINT_WIRE_OWNERS = [
  SPORTS_FIAT_HINT_WIRE_HOOK,
  SPORTS_FIAT_HINT_WIRE_DISPLAY,
  SPORTS_FIAT_HINT_WIRE_SURFACE,
  'sports-bet-slip-panel.tsx',
  'sports-page.tsx',
] as const;

export type SportsFiatHintWireRole = 'stake' | 'potential_return';

/**
 * Potential-return hint is allowed only after sportsbook-engine preview amount exists.
 * Never hint from raw odds×stake client multiply (§13.1.4.4 · fiat-hint-sports-odds-order).
 */
export function resolveSportsFiatHintVisible(
  currency: string | undefined,
  fiatHint: FiatHintView,
  role: SportsFiatHintWireRole,
  potentialReturnAmount: string | null | undefined,
): boolean {
  if (!currency || !isSportsFiatHintEligibleCurrency(currency)) return false;
  if (fiatHint.disabled) return false;
  if (role === 'potential_return') {
    return Boolean(potentialReturnAmount && potentialReturnAmount.trim().length > 0);
  }
  return true;
}

/** Non-waivable sync for Fiat#10 closeout. */
export function assertSportsFiatHintWireDisplayContractSync(): void {
  if (P10_SPORTS_FIAT_HINT_WIRE_TODO !== 'p10-sports-fiat-hint-wire') {
    throw new Error('sports-fiat-hint-wire: owner todo id drift');
  }
  if (SPORTS_FIAT_HINT_REFRESH_POLICY !== 'trade') {
    throw new Error('sports-fiat-hint-wire: refresh policy must be trade (30s)');
  }
  if (!P10_SPORTS_FIAT_HINT_WIRE_PREREQUISITE_TODOS.includes('p10-page-sports')) {
    throw new Error('sports-fiat-hint-wire: p10-page-sports prerequisite missing');
  }

  const oddsOrder = findFiatHintComplaintRisk('fiat-hint-sports-odds-order');
  if (!oddsOrder || oddsOrder.ownerTodo !== P10_SPORTS_FIAT_HINT_WIRE_TODO) {
    throw new Error(
      'sports-fiat-hint-wire: fiat-hint-sports-odds-order must be owned by p10-sports-fiat-hint-wire',
    );
  }
  if (oddsOrder.mitigatedBy !== 'live') {
    throw new Error('sports-fiat-hint-wire: fiat-hint-sports-odds-order must be mitigatedBy live');
  }
}
