import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  FIAT_REFERENCE_SETTLEMENT_CURRENCIES,
  LOCALE_FIAT_OFF,
  P9_TRADE_FIAT_HINT_WIRE_PREREQUISITE_TODO,
  P9_TRADE_FIAT_HINT_WIRE_TODO,
  type FiatHintView,
  type FiatReferencePairKey,
  type FiatReferenceRateSnapshot,
  type LocaleFiatPreference,
  toFiatHint,
} from '@/domain/fiat-reference-display-contract';
import type { ResolvedFiatReferenceRate } from '@/features/money/fiat-reference-rates-lib';

export { P9_TRADE_FIAT_HINT_WIRE_PREREQUISITE_TODO, P9_TRADE_FIAT_HINT_WIRE_TODO };

export function isTradeFiatHintEligibleCurrency(currency: string): boolean {
  return (FIAT_REFERENCE_SETTLEMENT_CURRENCIES as readonly string[]).includes(currency);
}

export function resolveTradeFiatHintPairKey(
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

function disabledTradeFiatHint(
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

function oracleStaleTradeFiatHint(
  sourceCurrency: string,
  targetFiat: LocaleFiatPreference,
): FiatHintView {
  return {
    displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
    formattedHint: '—',
    targetFiat,
    asOf: '',
    stale: true,
    disabled: false,
    sourceCurrency,
  };
}

export type BuildTradeFiatHintOptions = {
  /** When oracle mark is stale/missing — hint shows `—` (§13.1.4.4 Trade). */
  readonly oracleStale?: boolean;
};

/** Build display-only FiatHint for trade surfaces — USDT/PHON primary · fiat secondary only. */
export function buildTradeFiatHint(
  amount: string,
  sourceCurrency: string,
  targetFiat: LocaleFiatPreference,
  rates: Partial<Record<FiatReferencePairKey, ResolvedFiatReferenceRate>>,
  options: BuildTradeFiatHintOptions = {},
): FiatHintView {
  if (options.oracleStale) {
    return oracleStaleTradeFiatHint(sourceCurrency, targetFiat);
  }

  if (!isTradeFiatHintEligibleCurrency(sourceCurrency)) {
    return disabledTradeFiatHint(amount, sourceCurrency, targetFiat);
  }

  const pairKey = resolveTradeFiatHintPairKey(sourceCurrency, targetFiat);
  if (!pairKey) {
    return disabledTradeFiatHint(amount, sourceCurrency, targetFiat);
  }

  const snapshot = toHintRateSnapshot(rates[pairKey]);
  return toFiatHint(amount, sourceCurrency, targetFiat, snapshot);
}
