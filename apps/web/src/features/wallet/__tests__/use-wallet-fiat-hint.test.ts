import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  P4_PAGE_WALLET_FIAT_HINT_TODO,
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

import { useWalletFiatHint } from '../use-wallet-fiat-hint';

describe('use-wallet-fiat-hint §13.1.4.2 Fiat#6 hook', () => {
  it('uses wallet refresh policy on shared fiat reference rates hook', () => {
    useFiatReferenceRatesMock.mockReturnValue({ rates: {} });

    renderHook(() => useWalletFiatHint());

    expect(useFiatReferenceRatesMock).toHaveBeenCalledWith({ refreshPolicy: 'wallet' });
  });

  it('exposes hintFor and disclaimer flag for ko locale', () => {
    useFiatReferenceRatesMock.mockReturnValue({
      rates: {
        'PHON/KRW': {
          displayOnly: true,
          rate: '1450',
          capturedAt: '2026-07-06T10:00:00.000Z',
          source: 'exchange_rate_snapshots:PHON/KRW',
          stale: false,
          tier: 'primary',
          unavailable: false,
          blocked: false,
        },
      },
    });

    const { result } = renderHook(() => useWalletFiatHint());

    expect(result.current.targetFiat).toBe('KRW');
    expect(result.current.showDisclaimer).toBe(true);
    expect(result.current.hintFor('1', 'PHON').formattedHint).toMatch(/^≈ ₩/);
  });

  it('tracks Fiat#6 owner and shared rates hook prerequisite', () => {
    expect(P4_PAGE_WALLET_FIAT_HINT_TODO).toBe('p4-page-wallet-fiat-hint');
    expect(P4_FIAT_REFERENCE_RATES_HOOK_TODO).toBe('p4-fiat-reference-rates-hook');
  });
});
