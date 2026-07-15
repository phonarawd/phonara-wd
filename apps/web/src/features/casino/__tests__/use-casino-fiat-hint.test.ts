import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCasinoFiatHint } from '../use-casino-fiat-hint';
import { useCasinoFiatRateSession } from '../casino-fiat-rate-session';

const useFiatReferenceRatesMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/money/use-fiat-reference-rates', () => ({
  useFiatReferenceRates: useFiatReferenceRatesMock,
}));

vi.mock('@/features/settings/use-fiat-hint-preference', () => ({
  useFiatHintPreference: () => true,
}));

vi.mock('@/product/i18n', () => ({
  useI18n: () => ({ locale: 'ko' }),
}));

const RATE_A = {
  displayOnly: true as const,
  rate: '1400',
  capturedAt: '2026-07-11T01:00:00.000Z',
  source: 'exchange_rate_snapshots:USDT/KRW',
  stale: false,
  tier: 'primary' as const,
  unavailable: false,
  blocked: false,
  pairKey: 'USDT/KRW' as const,
  base: 'USDT' as const,
  quote: 'KRW' as const,
};

const RATE_B = {
  ...RATE_A,
  rate: '1500',
  capturedAt: '2026-07-11T01:05:00.000Z',
};

describe('useCasinoFiatHint Fiat#11', () => {
  beforeEach(() => {
    useCasinoFiatRateSession.getState().unlock();
    useFiatReferenceRatesMock.mockReturnValue({
      rates: { 'USDT/KRW': RATE_A },
    });
  });

  it('uses casino_session_lock refresh policy', () => {
    renderHook(() => useCasinoFiatHint());
    expect(useFiatReferenceRatesMock).toHaveBeenCalledWith({
      refreshPolicy: 'casino_session_lock',
    });
  });

  it('locks live rates and ignores subsequent live drift for hints', () => {
    const { result, rerender } = renderHook(() => useCasinoFiatHint());

    const before = result.current.hintFor('10', 'USDT');
    act(() => {
      result.current.lockSession();
    });
    expect(result.current.sessionLocked).toBe(true);

    useFiatReferenceRatesMock.mockReturnValue({
      rates: { 'USDT/KRW': RATE_B },
    });
    rerender();

    const after = result.current.hintFor('10', 'USDT');
    expect(after.formattedHint).toBe(before.formattedHint);
    expect(after.formattedHint).toMatch(/^≈ ₩/);
  });

  it('unlocks so later live rates apply again', () => {
    const { result, rerender } = renderHook(() => useCasinoFiatHint());
    act(() => {
      result.current.lockSession();
    });

    useFiatReferenceRatesMock.mockReturnValue({
      rates: { 'USDT/KRW': RATE_B },
    });
    act(() => {
      result.current.unlockSession();
    });
    rerender();

    const hint = result.current.hintFor('10', 'USDT');
    expect(result.current.sessionLocked).toBe(false);
    expect(hint.formattedHint).toContain('15,000');
  });
});
