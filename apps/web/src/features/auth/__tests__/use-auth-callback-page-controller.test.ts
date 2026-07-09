import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.hoisted(() => vi.fn());
const setAuthSessionMock = vi.hoisted(() => vi.fn());
const exchangeCodeForSessionMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());
const markHasAccountMock = vi.hoisted(() => vi.fn());
const markAuthLoginForPwaInstallMock = vi.hoisted(() => vi.fn());
const ensureOnboardingConsentsMock = vi.hoisted(() => vi.fn());
const replaceMock = vi.hoisted(() => vi.fn());
const isOnboardingCompleteMock = vi.hoisted(() => vi.fn(() => true));
const locationState = vi.hoisted(() => ({
  hash: '',
  search: '',
  replace: replaceMock,
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    session: null,
    loading: false,
    setAuthSession: setAuthSessionMock,
    refreshSession: vi.fn(),
  }),
}));

vi.mock('@/lib/auth-account-marker', () => ({
  markHasAccount: markHasAccountMock,
}));

vi.mock('@/lib/pwa-auth-nudge', () => ({
  markAuthLoginForPwaInstall: markAuthLoginForPwaInstallMock,
}));

vi.mock('@/lib/onboarding-consent', () => ({
  ensureOnboardingConsents: ensureOnboardingConsentsMock,
}));

vi.mock('@/lib/referral-pending', () => ({
  getPendingReferralCode: () => null,
  clearPendingReferralCode: vi.fn(),
}));

vi.mock('@/lib/referral-register', () => ({
  registerReferralCode: vi.fn(),
}));

vi.mock('@/lib/onboarding-funnel', () => ({
  isOnboardingComplete: (userId: string) => isOnboardingCompleteMock(userId),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
      getSession: getSessionMock,
    },
  },
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

import { useAuthCallbackPageController } from '@/features/auth/use-auth-callback-page-controller';

beforeEach(() => {
  navigateMock.mockReset();
  setAuthSessionMock.mockReset();
  exchangeCodeForSessionMock.mockReset();
  getSessionMock.mockReset();
  markHasAccountMock.mockReset();
  markAuthLoginForPwaInstallMock.mockReset();
  ensureOnboardingConsentsMock.mockReset();
  replaceMock.mockReset();
  isOnboardingCompleteMock.mockReset();
  isOnboardingCompleteMock.mockReturnValue(true);

  exchangeCodeForSessionMock.mockResolvedValue({ error: null });
  getSessionMock.mockResolvedValue({
    data: { session: { user: { id: 'user-1' } } },
    error: null,
  });
  ensureOnboardingConsentsMock.mockResolvedValue(undefined);

  locationState.hash = '';
  locationState.search = '';
  vi.stubGlobal('location', locationState);
});

describe('useAuthCallbackPageController', () => {
  it('exchanges code, sets session, and redirects to /home', async () => {
    locationState.search = '?code=abc123';

    renderHook(() => useAuthCallbackPageController());

    await waitFor(() => {
      expect(exchangeCodeForSessionMock).toHaveBeenCalledWith('abc123');
    });
    await waitFor(() => {
      expect(setAuthSessionMock).toHaveBeenCalledWith({ user: { id: 'user-1' } });
      expect(markHasAccountMock).toHaveBeenCalled();
      expect(markAuthLoginForPwaInstallMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith({ to: '/home' });
    });
  });

  it('honors explicit next destination', async () => {
    locationState.search = '?code=abc123&next=%2Fwallet';

    renderHook(() => useAuthCallbackPageController());

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/wallet' });
    });
  });

  it('routes incomplete onboarding users to /onboarding', async () => {
    isOnboardingCompleteMock.mockReturnValue(false);

    renderHook(() => useAuthCallbackPageController());

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/onboarding' });
    });
  });

  it('enters failed state when session cannot be established', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });

    const { result } = renderHook(() => useAuthCallbackPageController());

    await waitFor(() => {
      expect(result.current.state).toBe('failed');
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('hands off password recovery links to /reset-password', async () => {
    locationState.search = '?next=%2Freset-password';
    locationState.hash = '#type=recovery';

    renderHook(() => useAuthCallbackPageController());

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        '/reset-password?next=%2Freset-password#type=recovery',
      );
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
