import { describe, expect, it, vi } from 'vitest';

import {
  P4_FIAT_REFERENCE_RATES_HOOK_TODO,
  P4_FIAT_REFERENCE_RATES_PREREQUISITE_TODO,
} from '@/domain/fiat-reference-display-contract';

import {
  buildLastKnownGoodStorageKey,
  computeSyntheticPhonKrwRate,
  FIAT_REFERENCE_LAST_KNOWN_STORAGE_PREFIX,
  isFiatReferenceRateStale,
  isFiatReferenceRateUnavailable,
  isPhonKrwSyntheticStale,
  medianDecimalRates,
  readLastKnownGoodRate,
  resolveFiatReferenceRate,
  resolveFiatReferenceRefetchIntervalMs,
  toFiatReferencePairKey,
  writeLastKnownGoodRate,
  type ExchangeRateSnapshotRow,
} from '../fiat-reference-rates-lib';

const NOW_MS = Date.parse('2026-07-06T12:00:00.000Z');

function makeSnapshot(
  overrides: Partial<ExchangeRateSnapshotRow> & Pick<ExchangeRateSnapshotRow, 'rate'>,
): ExchangeRateSnapshotRow {
  return {
    id: 'snap-1',
    base_currency: 'USDT',
    quote_currency: 'KRW',
    captured_at: '2026-07-06T11:59:00.000Z',
    source: 'upbit',
    is_active: true,
    ...overrides,
  };
}

describe('fiat-reference-rates-lib §13.1.4.2 Fiat#3', () => {
  it('registers Fiat#3 todo with Fiat#2 prerequisite', () => {
    expect(P4_FIAT_REFERENCE_RATES_HOOK_TODO).toBe('p4-fiat-reference-rates-hook');
    expect(P4_FIAT_REFERENCE_RATES_PREREQUISITE_TODO).toBe('p4-fiat-currency-precision-ssot');
  });

  it('builds wallet-shared pair keys', () => {
    expect(toFiatReferencePairKey('PHON', 'KRW')).toBe('PHON/KRW');
    expect(toFiatReferencePairKey('USDT', 'KRW')).toBe('USDT/KRW');
    expect(toFiatReferencePairKey('PHON', 'USDT')).toBe('PHON/USDT');
  });

  it('applies pair-specific stale TTL — USDT/KRW 15m · PHON/USDT 5m', () => {
    const usdtKrwFresh = '2026-07-06T11:50:00.000Z';
    const usdtKrwStale = '2026-07-06T11:40:00.000Z';
    const phonUsdtFresh = '2026-07-06T11:56:00.000Z';
    const phonUsdtStale = '2026-07-06T11:50:00.000Z';

    expect(isFiatReferenceRateStale('USDT/KRW', usdtKrwFresh, NOW_MS)).toBe(false);
    expect(isFiatReferenceRateStale('USDT/KRW', usdtKrwStale, NOW_MS)).toBe(true);
    expect(isFiatReferenceRateStale('PHON/USDT', phonUsdtFresh, NOW_MS)).toBe(false);
    expect(isFiatReferenceRateStale('PHON/USDT', phonUsdtStale, NOW_MS)).toBe(true);
  });

  it('marks synthetic PHON/KRW stale when either leg is stale', () => {
    expect(
      isPhonKrwSyntheticStale('2026-07-06T11:56:00.000Z', '2026-07-06T11:50:00.000Z', NOW_MS),
    ).toBe(false);
    expect(
      isPhonKrwSyntheticStale('2026-07-06T11:50:00.000Z', '2026-07-06T11:50:00.000Z', NOW_MS),
    ).toBe(true);
  });

  it('computes median-of-N secondary rates with Decimal (display-only)', () => {
    expect(medianDecimalRates(['1380', '1390', '1400'])).toBe('1390');
    expect(medianDecimalRates(['1380', '1390'])).toBe('1385');
    expect(medianDecimalRates(['0', '-1', ''])).toBeNull();
  });

  it('computes synthetic PHON/KRW from PHON_USDT × USDT/KRW', () => {
    expect(computeSyntheticPhonKrwRate('0.010000', '1350')).toBe('13.500000');
  });

  it('resolves primary USDT/KRW snapshot tier', () => {
    const snapshot = makeSnapshot({ rate: '1380.000000' });
    const resolved = resolveFiatReferenceRate({
      pairKey: 'USDT/KRW',
      primarySnapshot: snapshot,
      secondaryRates: [],
      lastKnownGood: null,
      nowMs: NOW_MS,
    });

    expect(resolved).toMatchObject({
      tier: 'primary',
      rate: '1380.000000',
      source: 'upbit',
      stale: false,
      blocked: false,
      displayOnly: true,
    });
  });

  it('resolves primary PHON/USDT from oracle_prices', () => {
    const resolved = resolveFiatReferenceRate({
      pairKey: 'PHON/USDT',
      primarySnapshot: null,
      secondaryRates: [],
      lastKnownGood: null,
      oraclePhonUsdt: { price: '0.010000', updatedAt: '2026-07-06T11:59:00.000Z' },
      nowMs: NOW_MS,
    });

    expect(resolved).toMatchObject({
      tier: 'primary',
      rate: '0.010000',
      source: 'oracle_prices:PHON_USDT',
      stale: false,
    });
  });

  it('resolves primary PHON/KRW via synthetic legs when direct snapshot missing', () => {
    const resolved = resolveFiatReferenceRate({
      pairKey: 'PHON/KRW',
      primarySnapshot: null,
      secondaryRates: [],
      lastKnownGood: null,
      oraclePhonUsdt: { price: '0.010000', updatedAt: '2026-07-06T11:59:00.000Z' },
      usdtKrwSnapshot: makeSnapshot({ rate: '1350', base_currency: 'USDT', quote_currency: 'KRW' }),
      nowMs: NOW_MS,
    });

    expect(resolved).toMatchObject({
      tier: 'primary',
      rate: '13.500000',
      source: 'synthetic_phon_usdt_usdt_krw',
      stale: false,
    });
  });

  it('falls back to secondary median when primary unavailable', () => {
    const resolved = resolveFiatReferenceRate({
      pairKey: 'USDT/KRW',
      primarySnapshot: null,
      secondaryRates: ['1370', '1380', '1390'],
      lastKnownGood: null,
      nowMs: NOW_MS,
    });

    expect(resolved).toMatchObject({
      tier: 'secondary',
      rate: '1380',
      source: 'median_of_n_display',
      stale: false,
      blocked: false,
    });
  });

  it('falls back to tertiary last-known-good with stale forced', () => {
    const resolved = resolveFiatReferenceRate({
      pairKey: 'USDT/KRW',
      primarySnapshot: null,
      secondaryRates: [],
      lastKnownGood: {
        rate: '1360',
        capturedAt: '2026-07-06T10:00:00.000Z',
        source: 'upbit',
        storedAt: '2026-07-06T10:05:00.000Z',
      },
      nowMs: NOW_MS,
    });

    expect(resolved).toMatchObject({
      tier: 'tertiary',
      rate: '1360',
      stale: true,
      blocked: true,
    });
  });

  it('marks primary stale rates blocked for wallet phonKrwRateBlocked reuse', () => {
    const snapshot = makeSnapshot({
      rate: '1380',
      captured_at: '2026-07-06T11:00:00.000Z',
    });
    const resolved = resolveFiatReferenceRate({
      pairKey: 'USDT/KRW',
      primarySnapshot: snapshot,
      secondaryRates: [],
      lastKnownGood: null,
      nowMs: NOW_MS,
    });

    expect(resolved?.stale).toBe(true);
    expect(resolved?.blocked).toBe(true);
  });

  it('detects unavailable rates', () => {
    expect(isFiatReferenceRateUnavailable('0')).toBe(true);
    expect(isFiatReferenceRateUnavailable('1380')).toBe(false);
    expect(isFiatReferenceRateUnavailable(null, true)).toBe(true);
  });

  it('persists last-known-good for primary/secondary tiers only', () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };

    writeLastKnownGoodRate(
      'USDT/KRW',
      {
        displayOnly: true,
        rate: '1380',
        capturedAt: '2026-07-06T11:59:00.000Z',
        source: 'upbit',
        stale: false,
        tier: 'primary',
        unavailable: false,
        blocked: false,
      },
      storage,
      NOW_MS,
    );

    expect(storage.setItem).toHaveBeenCalledWith(
      `${FIAT_REFERENCE_LAST_KNOWN_STORAGE_PREFIX}USDT/KRW`,
      expect.stringContaining('"rate":"1380"'),
    );

    storage.setItem.mockClear();
    writeLastKnownGoodRate(
      'USDT/KRW',
      {
        displayOnly: true,
        rate: '1360',
        capturedAt: '2026-07-06T10:00:00.000Z',
        source: 'upbit',
        stale: true,
        tier: 'tertiary',
        unavailable: false,
        blocked: true,
      },
      storage,
      NOW_MS,
    );
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('reads last-known-good from storage', () => {
    const storage = {
      getItem: vi.fn(() =>
        JSON.stringify({
          rate: '1360',
          capturedAt: '2026-07-06T10:00:00.000Z',
          source: 'upbit',
          storedAt: '2026-07-06T10:05:00.000Z',
        }),
      ),
    };

    expect(readLastKnownGoodRate('USDT/KRW', storage)).toMatchObject({
      rate: '1360',
      source: 'upbit',
    });
    expect(buildLastKnownGoodStorageKey('USDT/KRW')).toBe(
      'phonara:fiat-reference:last-known:USDT/KRW',
    );
  });

  it('maps refresh policy intervals — trade 30s · earn/wallet 60s · casino lock off', () => {
    expect(resolveFiatReferenceRefetchIntervalMs('trade')).toBe(30_000);
    expect(resolveFiatReferenceRefetchIntervalMs('earn')).toBe(60_000);
    expect(resolveFiatReferenceRefetchIntervalMs('wallet')).toBe(60_000);
    expect(resolveFiatReferenceRefetchIntervalMs('casino_session_lock')).toBe(false);
  });
});
