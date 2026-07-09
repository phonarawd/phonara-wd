import { useCallback, useMemo } from 'react';
import { useQueries, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import type { Tables } from '@phonara/shared-types';

import {
  buildFiatReferenceRateQueryKey,
  FIAT_REFERENCE_RATE_PAIRS,
  type FiatReferencePairKey,
  type FiatReferenceRatePair,
} from '@/domain/fiat-reference-display-contract';
import { supabase } from '@/lib/supabase';

import {
  type ExchangeRateSnapshotRow,
  type FiatReferenceRefreshPolicy,
  type LastKnownGoodRate,
  type ResolvedFiatReferenceRate,
  readLastKnownGoodRate,
  resolveFiatReferenceRate,
  resolveFiatReferenceRefetchIntervalMs,
  toFiatReferencePairKey,
  writeLastKnownGoodRate,
} from './fiat-reference-rates-lib';

export type ExchangeRateSnapshot = Tables<'exchange_rate_snapshots'>;

type ExchangeCurrency = ExchangeRateSnapshot['base_currency'];

export type FiatReferenceRateView = ResolvedFiatReferenceRate & {
  readonly pairKey: FiatReferencePairKey;
  readonly base: FiatReferenceRatePair['base'];
  readonly quote: FiatReferenceRatePair['quote'];
};

export type FiatReferenceRateQueryData = {
  readonly snapshot: ExchangeRateSnapshot | null;
  readonly resolved: FiatReferenceRateView | null;
};

export type UseFiatReferenceRatesOptions = {
  readonly pairs?: readonly FiatReferenceRatePair[];
  readonly refreshPolicy?: FiatReferenceRefreshPolicy;
  readonly enabled?: boolean;
};

const EXCHANGE_RATE_SNAPSHOT_SELECT =
  'id,base_currency,quote_currency,rate,captured_at,source,is_active,created_by' as const;

const SECONDARY_MEDIAN_SAMPLE_LIMIT = 5;

export function fiatReferenceRateQueryKey(base: string, quote: string) {
  return buildFiatReferenceRateQueryKey(base, quote);
}

/** Shared fetch for wallet controllers — identical queryKey + row shape. */
export async function fetchActiveExchangeRateSnapshot(
  base: ExchangeCurrency,
  quote: ExchangeCurrency,
): Promise<ExchangeRateSnapshot | null> {
  const { data, error } = await supabase
    .from('exchange_rate_snapshots')
    .select(EXCHANGE_RATE_SNAPSHOT_SELECT)
    .eq('base_currency', base)
    .eq('quote_currency', quote)
    .eq('is_active', true)
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as ExchangeRateSnapshot | null;
}

async function fetchRecentExchangeRateSamples(
  base: ExchangeCurrency,
  quote: ExchangeCurrency,
  limit = SECONDARY_MEDIAN_SAMPLE_LIMIT,
): Promise<ExchangeRateSnapshotRow[]> {
  const { data, error } = await supabase
    .from('exchange_rate_snapshots')
    .select(EXCHANGE_RATE_SNAPSHOT_SELECT)
    .eq('base_currency', base)
    .eq('quote_currency', quote)
    .order('captured_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ExchangeRateSnapshotRow[];
}

async function fetchOraclePhonUsdt(): Promise<{ price: string; updatedAt: string } | null> {
  const { data, error } = await supabase
    .from('oracle_prices')
    .select('price, updated_at')
    .eq('symbol', 'PHON_USDT')
    .maybeSingle();
  if (error) throw error;
  if (!data?.price || !data.updated_at) return null;
  return { price: data.price, updatedAt: data.updated_at };
}

async function fetchUsdtKrwReferenceConfig(): Promise<string | null> {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'usdt_krw_reference_rate')
    .maybeSingle();
  if (error) throw error;
  const value = data?.value?.trim();
  return value && value.length > 0 ? value : null;
}

type FiatReferenceFetchBundle = {
  primarySnapshot: ExchangeRateSnapshotRow | null;
  secondaryRates: string[];
  oraclePhonUsdt: { price: string; updatedAt: string } | null;
  usdtKrwSnapshot: ExchangeRateSnapshotRow | null;
  lastKnownGood: LastKnownGoodRate | null;
};

async function fetchFiatReferenceBundle(
  pair: FiatReferenceRatePair,
): Promise<FiatReferenceFetchBundle> {
  const pairKey = toFiatReferencePairKey(pair.base, pair.quote);
  const [primarySnapshot, recentSamples, oraclePhonUsdt, usdtKrwSnapshot, usdtKrwConfig] =
    await Promise.all([
      fetchActiveExchangeRateSnapshot(pair.base, pair.quote),
      fetchRecentExchangeRateSamples(pair.base, pair.quote),
      pair.base === 'PHON' ? fetchOraclePhonUsdt() : Promise.resolve(null),
      pair.base === 'PHON' && pair.quote === 'KRW'
        ? fetchActiveExchangeRateSnapshot('USDT', 'KRW')
        : Promise.resolve(null),
      pair.base === 'USDT' && pair.quote === 'KRW'
        ? fetchUsdtKrwReferenceConfig()
        : Promise.resolve(null),
    ]);

  const secondaryRates = [
    ...recentSamples.map((row) => row.rate),
    ...(usdtKrwConfig ? [usdtKrwConfig] : []),
  ];

  return {
    primarySnapshot: primarySnapshot as ExchangeRateSnapshotRow | null,
    secondaryRates,
    oraclePhonUsdt,
    usdtKrwSnapshot: usdtKrwSnapshot as ExchangeRateSnapshotRow | null,
    lastKnownGood: readLastKnownGoodRate(pairKey),
  };
}

export async function fetchFiatReferenceRateQueryData(
  pair: FiatReferenceRatePair,
): Promise<FiatReferenceRateQueryData> {
  const pairKey = toFiatReferencePairKey(pair.base, pair.quote);
  const bundle = await fetchFiatReferenceBundle(pair);
  const resolved = resolveFiatReferenceRate({
    pairKey,
    primarySnapshot: bundle.primarySnapshot,
    secondaryRates: bundle.secondaryRates,
    lastKnownGood: bundle.lastKnownGood,
    oraclePhonUsdt: bundle.oraclePhonUsdt,
    usdtKrwSnapshot: bundle.usdtKrwSnapshot,
  });

  if (resolved) {
    writeLastKnownGoodRate(pairKey, resolved);
  }

  const view = resolved
    ? {
        ...resolved,
        pairKey,
        base: pair.base,
        quote: pair.quote,
      }
    : null;

  return {
    snapshot: bundle.primarySnapshot as ExchangeRateSnapshot | null,
    resolved: view,
  };
}

/** @deprecated Prefer fetchFiatReferenceRateQueryData for shared wallet cache. */
export async function fetchResolvedFiatReferenceRate(
  pair: FiatReferenceRatePair,
): Promise<FiatReferenceRateView | null> {
  const data = await fetchFiatReferenceRateQueryData(pair);
  return data.resolved;
}

function mapQueryResult(
  pair: FiatReferenceRatePair,
  query: UseQueryResult<FiatReferenceRateQueryData | null>,
): FiatReferenceRateView | null {
  return query.data?.resolved ?? null;
}

export function useFiatReferenceRates(options: UseFiatReferenceRatesOptions = {}) {
  const pairs = options.pairs ?? FIAT_REFERENCE_RATE_PAIRS;
  const refreshPolicy = options.refreshPolicy ?? 'wallet';
  const enabled = options.enabled ?? true;
  const refetchInterval = resolveFiatReferenceRefetchIntervalMs(refreshPolicy);
  const qc = useQueryClient();

  const queries = useQueries({
    queries: pairs.map((pair) => ({
      queryKey: fiatReferenceRateQueryKey(pair.base, pair.quote),
      queryFn: () => fetchFiatReferenceRateQueryData(pair),
      enabled,
      staleTime: 30_000,
      refetchInterval,
    })),
  });

  const rates = useMemo(() => {
    const map: Partial<Record<FiatReferencePairKey, FiatReferenceRateView>> = {};
    for (let index = 0; index < pairs.length; index += 1) {
      const pair = pairs[index];
      if (!pair) continue;
      const query = queries[index];
      if (!query) continue;
      const view = mapQueryResult(pair, query);
      if (view) {
        map[toFiatReferencePairKey(pair.base, pair.quote)] = view;
      }
    }
    return map;
  }, [pairs, queries]);

  const refetch = useCallback(() => {
    for (const pair of pairs) {
      void qc.invalidateQueries({
        queryKey: fiatReferenceRateQueryKey(pair.base, pair.quote),
      });
    }
  }, [pairs, qc]);

  return {
    rates,
    isLoading: queries.some((query) => query.isLoading),
    isError: queries.some((query) => query.isError),
    refetch,
  };
}

export function useFiatReferenceRate<
  B extends FiatReferenceRatePair['base'],
  Q extends FiatReferenceRatePair['quote'],
>(base: B, quote: Q, options: Omit<UseFiatReferenceRatesOptions, 'pairs'> = {}) {
  const pair = useMemo(() => ({ base, quote }) as FiatReferenceRatePair, [base, quote]);
  const { rates, isLoading, isError, refetch } = useFiatReferenceRates({
    ...options,
    pairs: [pair],
  });
  const pairKey = toFiatReferencePairKey(base, quote);
  const rate = rates[pairKey] ?? null;

  return {
    rate,
    pairKey,
    base,
    quote,
    isLoading,
    isError,
    refetch,
    stale: rate?.stale ?? false,
    unavailable: rate?.unavailable ?? true,
    blocked: rate?.blocked ?? true,
    tier: rate?.tier ?? null,
  };
}
