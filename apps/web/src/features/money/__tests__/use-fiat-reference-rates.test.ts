import { describe, expect, it } from 'vitest';

import {
  buildFiatReferenceRateQueryKey,
  FIAT_REFERENCE_RATE_PAIRS,
  FIAT_REFERENCE_STALE_TTL_SECONDS,
  P4_FIAT_REFERENCE_RATES_HOOK_TODO,
  P4_FIAT_REFERENCE_RATES_PREREQUISITE_TODO,
} from '@/domain/fiat-reference-display-contract';

import {
  fiatReferenceRateQueryKey,
  fetchActiveExchangeRateSnapshot,
} from '../use-fiat-reference-rates';

describe('use-fiat-reference-rates §13.1.4.2 hook surface', () => {
  it('registers Fiat#3 contract anchors', () => {
    expect(P4_FIAT_REFERENCE_RATES_HOOK_TODO).toBe('p4-fiat-reference-rates-hook');
    expect(P4_FIAT_REFERENCE_RATES_PREREQUISITE_TODO).toBe('p4-fiat-currency-precision-ssot');
  });

  it('exposes canonical rate pairs and pair TTL SSOT', () => {
    expect(FIAT_REFERENCE_RATE_PAIRS).toEqual([
      { base: 'USDT', quote: 'KRW' },
      { base: 'PHON', quote: 'USDT' },
      { base: 'PHON', quote: 'KRW' },
    ]);
    expect(FIAT_REFERENCE_STALE_TTL_SECONDS['USDT/KRW']).toBe(15 * 60);
    expect(FIAT_REFERENCE_STALE_TTL_SECONDS['PHON/USDT']).toBe(5 * 60);
    expect(FIAT_REFERENCE_STALE_TTL_SECONDS['PHON/KRW']).toBe(15 * 60);
  });

  it('shares wallet queryKey shape', () => {
    expect(fiatReferenceRateQueryKey('PHON', 'KRW')).toEqual(
      buildFiatReferenceRateQueryKey('PHON', 'KRW'),
    );
    expect(fiatReferenceRateQueryKey('PHON', 'KRW')).toEqual([
      'exchange-rate',
      'PHON',
      'KRW',
      'active',
    ]);
    expect(fiatReferenceRateQueryKey('USDT', 'KRW')).toEqual([
      'exchange-rate',
      'USDT',
      'KRW',
      'active',
    ]);
  });

  it('exports shared active snapshot fetch for wallet controllers', () => {
    expect(typeof fetchActiveExchangeRateSnapshot).toBe('function');
  });
});
