import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  P9_TRADE_FIAT_HINT_WIRE_TODO,
  P4_FIAT_REFERENCE_RATES_HOOK_TODO,
} from '@/domain/fiat-reference-display-contract';

const useFiatReferenceRatesMock = vi.hoisted(() => vi.fn());
const useI18nMock = vi.hoisted(() => vi.fn(() => ({ locale: 'ko' })));
const useFiatHintPreferenceMock = vi.hoisted(() => vi.fn(() => true));

vi.mock('@/features/money/use-fiat-reference-rates', () => ({
  useFiatReferenceRates: useFiatReferenceRatesMock,
}));

vi.mock('@/features/settings/use-fiat-hint-preference', () => ({
  useFiatHintPreference: useFiatHintPreferenceMock,
}));

vi.mock('@/product/i18n', () => ({
  useI18n: useI18nMock,
}));

import { useTradeFiatHint } from '../use-trade-fiat-hint';

describe('use-trade-fiat-hint §13.1.4.2 Fiat#7 hook', () => {
  it('uses trade refresh policy (30s) on shared fiat reference rates hook', () => {
    useFiatReferenceRatesMock.mockReturnValue({ rates: {} });

    renderHook(() => useTradeFiatHint());

    expect(useFiatReferenceRatesMock).toHaveBeenCalledWith({ refreshPolicy: 'trade' });
  });

  it('exposes hintFor and disclaimer flag for ko locale', () => {
    useFiatReferenceRatesMock.mockReturnValue({
      rates: {
        'USDT/KRW': {
          displayOnly: true,
          rate: '1400',
          capturedAt: '2026-07-06T10:00:00.000Z',
          source: 'exchange_rate_snapshots:USDT/KRW',
          stale: false,
          tier: 'primary',
          unavailable: false,
          blocked: false,
        },
      },
    });

    const { result } = renderHook(() => useTradeFiatHint());

    expect(result.current.targetFiat).toBe('KRW');
    expect(result.current.showDisclaimer).toBe(true);
    expect(result.current.hintFor('100', 'USDT').formattedHint).toMatch(/^≈ ₩/);
  });

  it('returns oracle-stale unavailable hint via options', () => {
    useFiatReferenceRatesMock.mockReturnValue({ rates: {} });

    const { result } = renderHook(() => useTradeFiatHint());

    expect(result.current.hintFor('1', 'USDT', { oracleStale: true }).formattedHint).toBe('—');
  });

  it('tracks Fiat#7 owner and shared rates hook prerequisite', () => {
    expect(P9_TRADE_FIAT_HINT_WIRE_TODO).toBe('p9-trade-fiat-hint-wire');
    expect(P4_FIAT_REFERENCE_RATES_HOOK_TODO).toBe('p4-fiat-reference-rates-hook');
  });
});
