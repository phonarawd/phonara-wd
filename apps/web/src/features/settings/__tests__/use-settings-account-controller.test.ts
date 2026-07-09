import { act, createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SETTINGS_ACCOUNT_TIMEZONE_STORAGE_KEY } from '@/domain/settings-account-display-contract';
import { useSettingsAccountController } from '@/features/settings/use-settings-account-controller';

const navigateMock = vi.fn();
const productToastShow = vi.hoisted(() => vi.fn());
const setLocaleMock = vi.hoisted(() => vi.fn());
const profileUpdateEq = vi.hoisted(() => vi.fn());

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    session: { user: { id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' } },
    loading: false,
  }),
}));

vi.mock('@/hooks/use-profile', () => ({
  useProfile: () => ({
    profile: {
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      locale: 'ko',
    },
    loading: false,
  }),
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
  useI18n: () => ({ locale: 'ko', setLocale: setLocaleMock }),
}));

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: { show: productToastShow },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: profileUpdateEq.mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

describe('useSettingsAccountController', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    productToastShow.mockReset();
    setLocaleMock.mockReset();
    profileUpdateEq.mockClear();
    window.localStorage.removeItem(SETTINGS_ACCOUNT_TIMEZONE_STORAGE_KEY);
  });

  it('hydrates account locale from profile and exposes timezone options', async () => {
    const { result } = renderHook(() => useSettingsAccountController(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.accountLocale).toBe('ko');
    expect(result.current.timezoneOptions.length).toBeGreaterThan(0);
    expect(result.current.timezonePreview.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('updates profile locale and syncs UI locale', async () => {
    const { result } = renderHook(() => useSettingsAccountController(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.setAccountLocale('en');
    });

    expect(profileUpdateEq).toHaveBeenCalledWith('id', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    expect(setLocaleMock).toHaveBeenCalledWith('en');
    expect(productToastShow).toHaveBeenCalledWith({
      zone: 'warm',
      key: 'settings.toast.langEn',
    });
  });

  it('persists timezone pref locally', async () => {
    // Seed a non-default pref so setTimezone runs on CI (UTC device) and locally (Asia/Seoul device).
    window.localStorage.setItem(SETTINGS_ACCOUNT_TIMEZONE_STORAGE_KEY, 'Asia/Seoul');

    const { result } = renderHook(() => useSettingsAccountController(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.timezone).toBe('Asia/Seoul');

    await act(async () => {
      result.current.setTimezone('UTC');
    });

    expect(window.localStorage.getItem(SETTINGS_ACCOUNT_TIMEZONE_STORAGE_KEY)).toBe('UTC');
    expect(productToastShow).toHaveBeenCalledWith({
      zone: 'warm',
      key: 'settings.account.toast.timezoneSaved',
    });
  });
});
