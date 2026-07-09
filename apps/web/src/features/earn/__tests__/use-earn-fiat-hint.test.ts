import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  P7_EARN_FIAT_HINT_CO_PRIMARY_TODO,
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

import { useEarnFiatHint } from '../use-earn-fiat-hint';

describe('use-earn-fiat-hint §13.1.4.2 Fiat#8 hook', () => {
  it('uses earn refresh policy (60s) on shared fiat reference rates hook', () => {
    useFiatReferenceRatesMock.mockReturnValue({ rates: {} });

    renderHook(() => useEarnFiatHint());

    expect(useFiatReferenceRatesMock).toHaveBeenCalledWith({ refreshPolicy: 'earn' });
  });

  it('exposes hintFor and disclaimer flag for ko locale', () => {
    useFiatReferenceRatesMock.mockReturnValue({
      rates: {
        'PHON/KRW': {
          displayOnly: true,
          rate: '1400',
          capturedAt: '2026-07-06T10:00:00.000Z',
          source: 'exchange_rate_snapshots:PHON/KRW',
          stale: false,
          tier: 'primary',
          unavailable: false,
          blocked: false,
        },
      },
    });

    const { result } = renderHook(() => useEarnFiatHint());

    expect(result.current.targetFiat).toBe('KRW');
    expect(result.current.showDisclaimer).toBe(true);
    expect(result.current.hintFor('25.000000', 'PHON').formattedHint).toMatch(/^≈ ₩/);
  });

  it('tracks Fiat#8 owner and shared rates hook prerequisite', () => {
    expect(P7_EARN_FIAT_HINT_CO_PRIMARY_TODO).toBe('p7-earn-fiat-hint-co-primary');
    expect(P4_FIAT_REFERENCE_RATES_HOOK_TODO).toBe('p4-fiat-reference-rates-hook');
  });
});
