import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  FIAT_REFERENCE_SETTLEMENT_CURRENCIES,
  LOCALE_FIAT_OFF,
  P4_PAGE_WALLET_FIAT_HINT_PREREQUISITE_TODO,
  P4_PAGE_WALLET_FIAT_HINT_TODO,
  type FiatHintView,
  type FiatReferencePairKey,
  type FiatReferenceRateSnapshot,
  type LocaleFiatPreference,
  toFiatHint,
} from '@/domain/fiat-reference-display-contract';
import type { ResolvedFiatReferenceRate } from '@/features/money/fiat-reference-rates-lib';

export { P4_PAGE_WALLET_FIAT_HINT_PREREQUISITE_TODO, P4_PAGE_WALLET_FIAT_HINT_TODO };

/** Settlement currencies eligible for FiatHint — KRW ledger rows stay settlement-only (§13.1.4.1). */
export function isWalletFiatHintEligibleCurrency(currency: string): boolean {
  return (FIAT_REFERENCE_SETTLEMENT_CURRENCIES as readonly string[]).includes(currency);
}

/**
 * Resolve display-only rate pair for wallet surfaces.
 * KRW target: PHON/KRW · USDT/KRW — same pairs as KRW deposit rate card (shared queryKey).
 */
export function resolveWalletFiatHintPairKey(
  sourceCurrency: string,
  targetFiat: LocaleFiatPreference,
): FiatReferencePairKey | null {
  if (targetFiat === LOCALE_FIAT_OFF) return null;

  if (sourceCurrency === 'PHON' && targetFiat === 'KRW') return 'PHON/KRW';
  if (sourceCurrency === 'USDT' && targetFiat === 'KRW') return 'USDT/KRW';

  return null;
}

function toHintRateSnapshot(
  resolved: ResolvedFiatReferenceRate | null | undefined,
): FiatReferenceRateSnapshot | null {
  if (!resolved || resolved.unavailable) return null;
  return {
    displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
    rate: resolved.rate,
    capturedAt: resolved.capturedAt,
    source: resolved.source,
    stale: resolved.stale,
  };
}

function disabledWalletFiatHint(
  amount: string,
  sourceCurrency: string,
  targetFiat: LocaleFiatPreference,
): FiatHintView {
  return {
    displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
    formattedHint: '',
    targetFiat,
    asOf: '',
    stale: false,
    disabled: true,
    sourceCurrency,
  };
}

/** Build display-only FiatHint for wallet balance and ledger rows — never mutates settlement. */
export function buildWalletFiatHint(
  amount: string,
  sourceCurrency: string,
  targetFiat: LocaleFiatPreference,
  rates: Partial<Record<FiatReferencePairKey, ResolvedFiatReferenceRate>>,
): FiatHintView {
  if (!isWalletFiatHintEligibleCurrency(sourceCurrency)) {
    return disabledWalletFiatHint(amount, sourceCurrency, targetFiat);
  }

  const pairKey = resolveWalletFiatHintPairKey(sourceCurrency, targetFiat);
  if (!pairKey) {
    return disabledWalletFiatHint(amount, sourceCurrency, targetFiat);
  }

  const snapshot = toHintRateSnapshot(rates[pairKey]);
  return toFiatHint(amount, sourceCurrency, targetFiat, snapshot);
}
