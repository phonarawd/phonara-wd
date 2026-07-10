import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  FIAT_REFERENCE_SETTLEMENT_CURRENCIES,
  LOCALE_FIAT_OFF,
  P10_SPORTS_FIAT_HINT_WIRE_PREREQUISITE_TODOS,
  P10_SPORTS_FIAT_HINT_WIRE_TODO,
  type FiatHintView,
  type FiatReferencePairKey,
  type FiatReferenceRateSnapshot,
  type LocaleFiatPreference,
  toFiatHint,
} from '@/domain/fiat-reference-display-contract';
import type { ResolvedFiatReferenceRate } from '@/features/money/fiat-reference-rates-lib';

export { P10_SPORTS_FIAT_HINT_WIRE_PREREQUISITE_TODOS, P10_SPORTS_FIAT_HINT_WIRE_TODO };

export function isSportsFiatHintEligibleCurrency(currency: string): boolean {
  return (FIAT_REFERENCE_SETTLEMENT_CURRENCIES as readonly string[]).includes(currency);
}

export function resolveSportsFiatHintPairKey(
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

function disabledSportsFiatHint(
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

export type BuildSportsFiatHintOptions = {
  /**
   * Potential-return role — hint only after sportsbook-engine preview amount exists.
   * When true and amount is empty/null, hint is disabled (never odds×stake client multiply).
   */
  readonly requirePotentialReturn?: boolean;
};

/**
 * Build display-only FiatHint for sports slip stake/return rows.
 * Amount must already be settlement currency (stake input or preview payout) — never odds.
 */
export function buildSportsFiatHint(
  amount: string | null | undefined,
  sourceCurrency: string,
  targetFiat: LocaleFiatPreference,
  rates: Partial<Record<FiatReferencePairKey, ResolvedFiatReferenceRate>>,
  options: BuildSportsFiatHintOptions = {},
): FiatHintView {
  const trimmed = amount?.replace(/,/g, '').trim() ?? '';

  if (options.requirePotentialReturn && !trimmed) {
    return disabledSportsFiatHint(trimmed, sourceCurrency, targetFiat);
  }

  if (!trimmed) {
    return disabledSportsFiatHint(trimmed, sourceCurrency, targetFiat);
  }

  if (!isSportsFiatHintEligibleCurrency(sourceCurrency)) {
    return disabledSportsFiatHint(trimmed, sourceCurrency, targetFiat);
  }

  const pairKey = resolveSportsFiatHintPairKey(sourceCurrency, targetFiat);
  if (!pairKey) {
    return disabledSportsFiatHint(trimmed, sourceCurrency, targetFiat);
  }

  const snapshot = toHintRateSnapshot(rates[pairKey]);
  return toFiatHint(trimmed, sourceCurrency, targetFiat, snapshot);
}
