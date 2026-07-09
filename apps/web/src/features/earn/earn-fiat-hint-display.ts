import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  FIAT_REFERENCE_SETTLEMENT_CURRENCIES,
  LOCALE_FIAT_OFF,
  P7_EARN_FIAT_HINT_CO_PRIMARY_PREREQUISITE_TODO,
  P7_EARN_FIAT_HINT_CO_PRIMARY_TODO,
  type FiatHintView,
  type FiatReferencePairKey,
  type FiatReferenceRateSnapshot,
  type LocaleFiatPreference,
  toFiatHint,
} from '@/domain/fiat-reference-display-contract';
import type { ResolvedFiatReferenceRate } from '@/features/money/fiat-reference-rates-lib';

export { P7_EARN_FIAT_HINT_CO_PRIMARY_PREREQUISITE_TODO, P7_EARN_FIAT_HINT_CO_PRIMARY_TODO };

export function isEarnFiatHintEligibleCurrency(currency: string): boolean {
  return (FIAT_REFERENCE_SETTLEMENT_CURRENCIES as readonly string[]).includes(currency);
}

export function resolveEarnFiatHintPairKey(
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

function disabledEarnFiatHint(
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

/** Build display-only co-primary FiatHint for Earn cards — RPC `reward_phon` only (§13.1.4.4 Fiat#8). */
export function buildEarnFiatHint(
  amount: string,
  sourceCurrency: string,
  targetFiat: LocaleFiatPreference,
  rates: Partial<Record<FiatReferencePairKey, ResolvedFiatReferenceRate>>,
): FiatHintView {
  if (!isEarnFiatHintEligibleCurrency(sourceCurrency)) {
    return disabledEarnFiatHint(amount, sourceCurrency, targetFiat);
  }

  const pairKey = resolveEarnFiatHintPairKey(sourceCurrency, targetFiat);
  if (!pairKey) {
    return disabledEarnFiatHint(amount, sourceCurrency, targetFiat);
  }

  const snapshot = toHintRateSnapshot(rates[pairKey]);
  return toFiatHint(amount, sourceCurrency, targetFiat, snapshot);
}

export function isEarnRewardPhonHintEligible(
  rewardPhon: string | null | undefined,
): rewardPhon is string {
  if (!rewardPhon) return false;
  const trimmed = rewardPhon.trim();
  return trimmed.length > 0 && trimmed !== '0' && trimmed !== '0.000000';
}
