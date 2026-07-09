import type { Tables } from '@phonara/shared-types';
import { Decimal, toDecimal } from '@phonara/money';

import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  FIAT_REFERENCE_STALE_TTL_SECONDS,
  type FiatReferencePairKey,
  type FiatReferenceRateSnapshot,
} from '@/domain/fiat-reference-display-contract';

export type ExchangeRateSnapshotRow = Pick<
  Tables<'exchange_rate_snapshots'>,
  'id' | 'base_currency' | 'quote_currency' | 'rate' | 'captured_at' | 'source' | 'is_active'
>;

export type FiatReferenceRateTier = 'primary' | 'secondary' | 'tertiary';

export type ResolvedFiatReferenceRate = FiatReferenceRateSnapshot & {
  readonly tier: FiatReferenceRateTier;
  readonly unavailable: boolean;
  readonly blocked: boolean;
};

export type FiatReferenceRateResolutionInput = {
  readonly pairKey: FiatReferencePairKey;
  readonly primarySnapshot: ExchangeRateSnapshotRow | null;
  readonly secondaryRates: readonly string[];
  readonly lastKnownGood: LastKnownGoodRate | null;
  readonly oraclePhonUsdt?: { readonly price: string; readonly updatedAt: string } | null;
  readonly usdtKrwSnapshot?: ExchangeRateSnapshotRow | null;
  readonly nowMs?: number;
};

export type LastKnownGoodRate = {
  readonly rate: string;
  readonly capturedAt: string;
  readonly source: string;
  readonly storedAt: string;
};

export const FIAT_REFERENCE_LAST_KNOWN_STORAGE_PREFIX =
  'phonara:fiat-reference:last-known:' as const;

export function toFiatReferencePairKey(base: string, quote: string): FiatReferencePairKey {
  return `${base}/${quote}` as FiatReferencePairKey;
}

export function getFiatReferenceStaleTtlMs(pairKey: FiatReferencePairKey): number {
  const seconds =
    FIAT_REFERENCE_STALE_TTL_SECONDS[pairKey as keyof typeof FIAT_REFERENCE_STALE_TTL_SECONDS] ??
    FIAT_REFERENCE_STALE_TTL_SECONDS['USDT/KRW'];
  return seconds * 1000;
}

export function isFiatReferenceRateStale(
  pairKey: FiatReferencePairKey,
  capturedAt: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!capturedAt) return true;
  const capturedMs = Date.parse(capturedAt);
  if (!Number.isFinite(capturedMs)) return true;
  return nowMs - capturedMs > getFiatReferenceStaleTtlMs(pairKey);
}

export function isFiatReferenceRateUnavailable(
  rate: string | null | undefined,
  hasFetchError = false,
): boolean {
  if (hasFetchError) return true;
  if (!rate) return true;
  try {
    return !toDecimal(rate).gt(0);
  } catch {
    return true;
  }
}

export function medianDecimalRates(rates: readonly string[]): string | null {
  const values = rates
    .filter((rate) => !isFiatReferenceRateUnavailable(rate))
    .map((rate) => toDecimal(rate))
    .sort((left, right) => left.cmp(right));

  if (values.length === 0) return null;

  const mid = Math.floor(values.length / 2);
  if (values.length % 2 === 1) {
    const middle = values[mid];
    if (!middle) return null;
    return middle.toFixed();
  }
  const left = values[mid - 1];
  const right = values[mid];
  if (!left || !right) return null;
  return left.plus(right).div(2).toFixed();
}

export function computeSyntheticPhonKrwRate(phonUsdt: string, usdtKrw: string): string {
  return toDecimal(phonUsdt)
    .mul(toDecimal(usdtKrw))
    .toDecimalPlaces(6, Decimal.ROUND_HALF_EVEN)
    .toFixed(6);
}

export function isPhonKrwSyntheticStale(
  phonUsdtCapturedAt: string | null | undefined,
  usdtKrwCapturedAt: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  return (
    isFiatReferenceRateStale('PHON/USDT', phonUsdtCapturedAt, nowMs) ||
    isFiatReferenceRateStale('USDT/KRW', usdtKrwCapturedAt, nowMs)
  );
}

function buildResolvedRate(
  pairKey: FiatReferencePairKey,
  tier: FiatReferenceRateTier,
  rate: string,
  capturedAt: string,
  source: string,
  nowMs: number,
  staleOverride?: boolean,
): ResolvedFiatReferenceRate {
  const stale = staleOverride ?? isFiatReferenceRateStale(pairKey, capturedAt, nowMs);
  const unavailable = isFiatReferenceRateUnavailable(rate);
  return {
    displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
    rate,
    capturedAt,
    source,
    stale,
    tier,
    unavailable,
    blocked: stale || unavailable,
  };
}

function resolvePrimaryRate(
  input: FiatReferenceRateResolutionInput,
): ResolvedFiatReferenceRate | null {
  const nowMs = input.nowMs ?? Date.now();

  if (input.pairKey === 'PHON/USDT') {
    const oracle = input.oraclePhonUsdt;
    if (!oracle || isFiatReferenceRateUnavailable(oracle.price)) return null;
    return buildResolvedRate(
      input.pairKey,
      'primary',
      oracle.price,
      oracle.updatedAt,
      'oracle_prices:PHON_USDT',
      nowMs,
    );
  }

  if (input.pairKey === 'PHON/KRW') {
    if (input.primarySnapshot && !isFiatReferenceRateUnavailable(input.primarySnapshot.rate)) {
      return buildResolvedRate(
        input.pairKey,
        'primary',
        input.primarySnapshot.rate,
        input.primarySnapshot.captured_at,
        input.primarySnapshot.source,
        nowMs,
      );
    }

    const phonUsdt = input.oraclePhonUsdt;
    const usdtKrw = input.usdtKrwSnapshot;
    if (
      phonUsdt &&
      usdtKrw &&
      !isFiatReferenceRateUnavailable(phonUsdt.price) &&
      !isFiatReferenceRateUnavailable(usdtKrw.rate)
    ) {
      const syntheticRate = computeSyntheticPhonKrwRate(phonUsdt.price, usdtKrw.rate);
      const capturedAt =
        Date.parse(phonUsdt.updatedAt) >= Date.parse(usdtKrw.captured_at)
          ? phonUsdt.updatedAt
          : usdtKrw.captured_at;
      return buildResolvedRate(
        input.pairKey,
        'primary',
        syntheticRate,
        capturedAt,
        'synthetic_phon_usdt_usdt_krw',
        nowMs,
        isPhonKrwSyntheticStale(phonUsdt.updatedAt, usdtKrw.captured_at, nowMs),
      );
    }

    return null;
  }

  const snapshot = input.primarySnapshot;
  if (!snapshot || isFiatReferenceRateUnavailable(snapshot.rate)) return null;

  return buildResolvedRate(
    input.pairKey,
    'primary',
    snapshot.rate,
    snapshot.captured_at,
    snapshot.source,
    nowMs,
  );
}

function resolveSecondaryRate(
  input: FiatReferenceRateResolutionInput,
): ResolvedFiatReferenceRate | null {
  const nowMs = input.nowMs ?? Date.now();
  const medianRate = medianDecimalRates(input.secondaryRates);
  if (!medianRate) return null;

  const capturedAt = new Date(nowMs).toISOString();
  return buildResolvedRate(
    input.pairKey,
    'secondary',
    medianRate,
    capturedAt,
    'median_of_n_display',
    nowMs,
    false,
  );
}

function resolveTertiaryRate(
  input: FiatReferenceRateResolutionInput,
): ResolvedFiatReferenceRate | null {
  const lastKnown = input.lastKnownGood;
  if (!lastKnown || isFiatReferenceRateUnavailable(lastKnown.rate)) return null;

  const nowMs = input.nowMs ?? Date.now();
  return buildResolvedRate(
    input.pairKey,
    'tertiary',
    lastKnown.rate,
    lastKnown.capturedAt,
    lastKnown.source,
    nowMs,
    true,
  );
}

/** §13.1.4.2 — Primary snapshot · Secondary median-of-N · Tertiary last-known-good. */
export function resolveFiatReferenceRate(
  input: FiatReferenceRateResolutionInput,
): ResolvedFiatReferenceRate | null {
  const primary = resolvePrimaryRate(input);
  if (primary && !primary.unavailable) {
    return primary;
  }

  const secondary = resolveSecondaryRate(input);
  if (secondary && !secondary.unavailable) {
    return secondary;
  }

  return resolveTertiaryRate(input);
}

export function buildLastKnownGoodStorageKey(pairKey: FiatReferencePairKey): string {
  return `${FIAT_REFERENCE_LAST_KNOWN_STORAGE_PREFIX}${pairKey}`;
}

export function readLastKnownGoodRate(
  pairKey: FiatReferencePairKey,
  storage: Pick<Storage, 'getItem'> | null = getBrowserStorage(),
): LastKnownGoodRate | null {
  if (!storage) return null;
  const raw = storage.getItem(buildLastKnownGoodStorageKey(pairKey));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<LastKnownGoodRate>;
    if (
      typeof parsed.rate !== 'string' ||
      typeof parsed.capturedAt !== 'string' ||
      typeof parsed.source !== 'string' ||
      typeof parsed.storedAt !== 'string'
    ) {
      return null;
    }
    if (isFiatReferenceRateUnavailable(parsed.rate)) return null;
    return {
      rate: parsed.rate,
      capturedAt: parsed.capturedAt,
      source: parsed.source,
      storedAt: parsed.storedAt,
    };
  } catch {
    return null;
  }
}

export function writeLastKnownGoodRate(
  pairKey: FiatReferencePairKey,
  resolved: ResolvedFiatReferenceRate,
  storage: Pick<Storage, 'setItem'> | null = getBrowserStorage(),
  nowMs: number = Date.now(),
): void {
  if (!storage || resolved.unavailable || resolved.tier === 'tertiary') return;

  const payload: LastKnownGoodRate = {
    rate: resolved.rate,
    capturedAt: resolved.capturedAt,
    source: resolved.source,
    storedAt: new Date(nowMs).toISOString(),
  };
  storage.setItem(buildLastKnownGoodStorageKey(pairKey), JSON.stringify(payload));
}

function getBrowserStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export type FiatReferenceRefreshPolicy = 'trade' | 'earn' | 'wallet' | 'casino_session_lock';

export function resolveFiatReferenceRefetchIntervalMs(
  policy: FiatReferenceRefreshPolicy,
): number | false {
  switch (policy) {
    case 'trade':
      return 30_000;
    case 'earn':
    case 'wallet':
      return 60_000;
    case 'casino_session_lock':
      return false;
    default:
      return 60_000;
  }
}
