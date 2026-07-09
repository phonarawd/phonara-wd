/**
 * Trade fiat hint surface consistency — Phase 2 P2-8 / P2-E (Fiat#7 · wallet/earn pattern parity).
 */

import {
  FIAT_REFERENCE_SETTLEMENT_CURRENCIES,
  P9_TRADE_FIAT_HINT_WIRE_TODO,
} from './fiat-reference-display-contract';
import { P2_FIAT_HINT_WIRE_TODO } from './trade-desk-fiat-hint-wire-display-contract';
import { isTradeFiatHintEligibleCurrency } from '@/features/trading/trade-fiat-hint-display';

export const TRADE_FIAT_HINT_SURFACE_WRAPPER = 'trade-money-with-fiat-hint.tsx' as const;

export const TRADE_FIAT_HINT_CONSISTENCY_OWNERS = [
  'trade-fiat-hint-display.ts',
  'use-trade-fiat-hint.ts',
  TRADE_FIAT_HINT_SURFACE_WRAPPER,
  'spot-order-ticket.tsx',
  'futures-order-ticket.tsx',
  'futures-positions-panel.tsx',
  'spot-desk-page.tsx',
  'futures-desk-page.tsx',
] as const;

/** Trade surfaces only co-primary-hint USDT/PHON settlement rows — never ledger currencies. */
export function assertTradeFiatHintConsistencyContractSync(): void {
  for (const currency of FIAT_REFERENCE_SETTLEMENT_CURRENCIES) {
    if (!isTradeFiatHintEligibleCurrency(currency)) {
      throw new Error(`trade-fiat-hint: settlement currency ${currency} must be eligible`);
    }
  }

  if (isTradeFiatHintEligibleCurrency('KRW')) {
    throw new Error('trade-fiat-hint: KRW must not receive secondary fiat hints on trade desk');
  }

  if (P9_TRADE_FIAT_HINT_WIRE_TODO !== 'p9-trade-fiat-hint-wire') {
    throw new Error('trade-fiat-hint: owner todo drift');
  }

  if (P2_FIAT_HINT_WIRE_TODO !== 'p2-fiat-hint-wire') {
    throw new Error('trade-fiat-hint: P2-E wire todo drift');
  }
}
