import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_KEY,
  SETTINGS_THEME_STORAGE_KEY,
  writeSettingsTheme,
} from '@/domain/settings-preferences-display-contract';
import { useSettingsPreferencesController } from '@/features/settings/use-settings-preferences-controller';

const productToastShow = vi.hoisted(() => vi.fn());
const setLocaleMock = vi.hoisted(() => vi.fn());

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
  useI18n: () => ({
    locale: window.localStorage.getItem('phonara.locale') ?? 'ko',
    setLocale: setLocaleMock,
  }),
}));

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: { show: productToastShow },
}));

describe('useSettingsPreferencesController', () => {
  beforeEach(() => {
    productToastShow.mockReset();
    setLocaleMock.mockReset();
    window.localStorage.removeItem(SETTINGS_THEME_STORAGE_KEY);
    window.localStorage.removeItem(SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_KEY);
    window.localStorage.setItem('phonara.locale', 'ko');
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  it('hydrates display locale and theme from i18n and storage', () => {
    writeSettingsTheme('light');
    const { result } = renderHook(() => useSettingsPreferencesController());

    expect(result.current.displayLocale).toBe('ko');
    expect(result.current.theme).toBe('light');
    expect(result.current.fiatHintEnabled).toBe(true);
  });

  it('updates locale via i18n and shows warm toast', () => {
    const { result } = renderHook(() => useSettingsPreferencesController());

    act(() => {
      result.current.setDisplayLocale('en');
    });

    expect(setLocaleMock).toHaveBeenCalledWith('en');
    expect(productToastShow).toHaveBeenCalledWith({
      zone: 'warm',
      key: 'settings.toast.langEn',
    });
  });

  it('persists theme and applies document root SOT', () => {
    const { result } = renderHook(() => useSettingsPreferencesController());

    act(() => {
      result.current.setTheme('system');
    });

    expect(window.localStorage.getItem(SETTINGS_THEME_STORAGE_KEY)).toBe('system');
    expect(document.documentElement.dataset['theme']).toBe('system');
    expect(document.documentElement.style.colorScheme).toBe('light dark');
    expect(productToastShow).toHaveBeenCalledWith({
      zone: 'warm',
      key: 'settings.toast.themeApplied',
    });
  });

  it('defaults fiat hint off for en locale and persists toggle', () => {
    window.localStorage.setItem('phonara.locale', 'en');
    const { result, rerender } = renderHook(() => useSettingsPreferencesController());

    expect(result.current.fiatHintEnabled).toBe(false);

    act(() => {
      result.current.setFiatHintEnabled(true);
    });

    expect(window.localStorage.getItem(SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_KEY)).toBe('1');
    expect(result.current.fiatHintEnabled).toBe(true);
    expect(productToastShow).toHaveBeenCalledWith({
      zone: 'warm',
      key: 'settings.toast.fiatHintEnabled',
    });

    rerender();
    act(() => {
      result.current.setFiatHintEnabled(false);
    });

    expect(productToastShow).toHaveBeenCalledWith({
      zone: 'warm',
      key: 'settings.toast.fiatHintDisabled',
    });
  });
});
