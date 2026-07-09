/**
 * P2-E trade desk fiat hint wire — real `useFiatReferenceRates` via `useTradeFiatHint`.
 * Phase R owner: `p9-trade-fiat-hint-wire` (Fiat#7 · §13.1.4.4).
 */

import { P9_TRADE_FIAT_HINT_WIRE_TODO, type FiatHintView } from './fiat-reference-display-contract';
import { isTradeFiatHintEligibleCurrency } from '@/features/trading/trade-fiat-hint-display';

/** Trade Desk Zero-Defect plan P2-E todo id. */
export const P2_FIAT_HINT_WIRE_TODO = 'p2-fiat-hint-wire' as const;

/** Phase R Fiat#7 wire owner — must stay in sync with `trade-money-with-fiat-hint.tsx`. */
export const P2_FIAT_HINT_WIRE_PHASE_R_OWNER = P9_TRADE_FIAT_HINT_WIRE_TODO;

export const TRADE_DESK_FIAT_HINT_WIRE_SURFACE = 'trade-money-with-fiat-hint.tsx' as const;

export const TRADE_DESK_FIAT_HINT_WIRE_HOOK = 'use-trade-fiat-hint.ts' as const;

export const TRADE_DESK_FIAT_HINT_WIRE_RATES_HOOK = 'use-fiat-reference-rates.ts' as const;

/** Trade refresh policy for desk secondary hints (30s). */
export const TRADE_DESK_FIAT_HINT_REFRESH_POLICY = 'trade' as const;

export const TRADE_DESK_FIAT_HINT_WIRE_OWNERS = [
  TRADE_DESK_FIAT_HINT_WIRE_HOOK,
  'trade-fiat-hint-display.ts',
  TRADE_DESK_FIAT_HINT_WIRE_SURFACE,
  'trade-price-with-fiat-hint.tsx',
  'spot-order-ticket.tsx',
  'futures-order-ticket.tsx',
  'futures-positions-panel.tsx',
  'spot-market-header.tsx',
  'futures-market-header.tsx',
  'spot-desk-page.tsx',
  'futures-desk-page.tsx',
] as const;

export type TradeDeskFiatHintWireOptions = {
  readonly oracleStale?: boolean;
};

/** Resolve whether a settlement row should render secondary fiat hint (display-only). */
export function resolveTradeDeskFiatHintVisible(
  currency: string | undefined,
  fiatHint: FiatHintView,
): boolean {
  if (!currency || !isTradeFiatHintEligibleCurrency(currency)) return false;
  return !fiatHint.disabled;
}

export function assertTradeDeskFiatHintWireDisplayContractSync(): void {
  if (P2_FIAT_HINT_WIRE_TODO !== 'p2-fiat-hint-wire') {
    throw new Error('trade-desk-fiat-hint-wire: P2 todo id drift');
  }
  if (P2_FIAT_HINT_WIRE_PHASE_R_OWNER !== 'p9-trade-fiat-hint-wire') {
    throw new Error('trade-desk-fiat-hint-wire: Phase R owner drift');
  }
  if (TRADE_DESK_FIAT_HINT_REFRESH_POLICY !== 'trade') {
    throw new Error('trade-desk-fiat-hint-wire: trade refresh policy drift');
  }
}
