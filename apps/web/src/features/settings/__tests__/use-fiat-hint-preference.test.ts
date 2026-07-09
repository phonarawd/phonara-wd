import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  P5_PAGE_SETTINGS_FIAT_REFERENCE_TODO,
  SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_KEY,
  writeFiatHintEnabled,
} from '@/domain/settings-preferences-display-contract';

const useI18nMock = vi.hoisted(() => vi.fn(() => ({ locale: 'ko' })));

vi.mock('@/product/i18n', () => ({
  useI18n: useI18nMock,
}));

import { useFiatHintPreference } from '../use-fiat-hint-preference';

describe('use-fiat-hint-preference §13.1.4.3 Fiat#9', () => {
  beforeEach(() => {
    window.localStorage.removeItem(SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_KEY);
    useI18nMock.mockReturnValue({ locale: 'ko' });
  });

  it('reads locale default ko ON · en OFF when unset', () => {
    const { result: koResult } = renderHook(() => useFiatHintPreference());
    expect(koResult.current).toBe(true);

    useI18nMock.mockReturnValue({ locale: 'en' });
    const { result: enResult } = renderHook(() => useFiatHintPreference());
    expect(enResult.current).toBe(false);
  });

  it('reacts to preferences.fiatHintEnabled writes in the same tab', () => {
    const { result } = renderHook(() => useFiatHintPreference());
    expect(result.current).toBe(true);

    act(() => {
      writeFiatHintEnabled(false);
    });

    expect(result.current).toBe(false);
  });

  it('tracks Fiat#9 owner todo id', () => {
    expect(P5_PAGE_SETTINGS_FIAT_REFERENCE_TODO).toBe('p5-page-settings-fiat-reference');
  });
});
