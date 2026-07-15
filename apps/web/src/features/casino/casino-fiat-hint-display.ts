import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  FIAT_REFERENCE_SETTLEMENT_CURRENCIES,
  LOCALE_FIAT_OFF,
  P10_CASINO_FIAT_HINT_SESSION_LOCK_PREREQUISITE_TODOS,
  P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO,
  type FiatHintView,
  type FiatReferencePairKey,
  type FiatReferenceRateSnapshot,
  type LocaleFiatPreference,
  toFiatHint,
} from '@/domain/fiat-reference-display-contract';
import type { ResolvedFiatReferenceRate } from '@/features/money/fiat-reference-rates-lib';

export {
  P10_CASINO_FIAT_HINT_SESSION_LOCK_PREREQUISITE_TODOS,
  P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO,
};

export function isCasinoFiatHintEligibleCurrency(currency: string): boolean {
  return (FIAT_REFERENCE_SETTLEMENT_CURRENCIES as readonly string[]).includes(currency);
}

export function resolveCasinoFiatHintPairKey(
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

function disabledCasinoFiatHint(
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

/**
 * Build display-only FiatHint for casino stake/win rows.
 * Caller must pass session-locked rates while a bet session is open (Fiat#11).
 */
export function buildCasinoFiatHint(
  amount: string | null | undefined,
  sourceCurrency: string,
  targetFiat: LocaleFiatPreference,
  rates: Partial<Record<FiatReferencePairKey, ResolvedFiatReferenceRate>>,
): FiatHintView {
  const trimmed = amount?.replace(/,/g, '').trim() ?? '';

  if (!trimmed) {
    return disabledCasinoFiatHint(trimmed, sourceCurrency, targetFiat);
  }

  if (!isCasinoFiatHintEligibleCurrency(sourceCurrency)) {
    return disabledCasinoFiatHint(trimmed, sourceCurrency, targetFiat);
  }

  const pairKey = resolveCasinoFiatHintPairKey(sourceCurrency, targetFiat);
  if (!pairKey) {
    return disabledCasinoFiatHint(trimmed, sourceCurrency, targetFiat);
  }

  const snapshot = toHintRateSnapshot(rates[pairKey]);
  return toFiatHint(trimmed, sourceCurrency, targetFiat, snapshot);
}
