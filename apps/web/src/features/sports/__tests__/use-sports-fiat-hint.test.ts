import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  P10_SPORTS_FIAT_HINT_WIRE_TODO,
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

import { useSportsFiatHint } from '../use-sports-fiat-hint';

describe('use-sports-fiat-hint §13.1.4.4 Fiat#10 hook', () => {
  it('uses trade refresh policy (30s) on shared fiat reference rates hook', () => {
    useFiatReferenceRatesMock.mockReturnValue({ rates: {} });

    renderHook(() => useSportsFiatHint());

    expect(useFiatReferenceRatesMock).toHaveBeenCalledWith({ refreshPolicy: 'trade' });
  });

  it('exposes hintFor and disclaimer flag for ko locale', () => {
    useFiatReferenceRatesMock.mockReturnValue({
      rates: {
        'USDT/KRW': {
          displayOnly: true,
          rate: '1400',
          capturedAt: '2026-07-10T10:00:00.000Z',
          source: 'exchange_rate_snapshots:USDT/KRW',
          stale: false,
          tier: 'primary',
          unavailable: false,
          blocked: false,
        },
      },
    });

    const { result } = renderHook(() => useSportsFiatHint());

    expect(result.current.targetFiat).toBe('KRW');
    expect(result.current.showDisclaimer).toBe(true);
    expect(result.current.hintFor('100', 'USDT').formattedHint).toMatch(/^≈ ₩/);
  });

  it('disables potential_return hint until preview amount exists', () => {
    useFiatReferenceRatesMock.mockReturnValue({ rates: {} });

    const { result } = renderHook(() => useSportsFiatHint());

    expect(result.current.hintFor(null, 'USDT', { requirePotentialReturn: true }).disabled).toBe(
      true,
    );
  });

  it('tracks Fiat#10 owner and shared rates hook prerequisite', () => {
    expect(P10_SPORTS_FIAT_HINT_WIRE_TODO).toBe('p10-sports-fiat-hint-wire');
    expect(P4_FIAT_REFERENCE_RATES_HOOK_TODO).toBe('p4-fiat-reference-rates-hook');
  });
});
