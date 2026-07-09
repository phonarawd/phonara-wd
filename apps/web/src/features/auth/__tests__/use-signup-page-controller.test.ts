import { renderHook, act, waitFor } from '@testing-library/react';
import type { FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.hoisted(() => vi.fn());
const setAuthSessionMock = vi.hoisted(() => vi.fn());
const signUpWithPasswordMock = vi.hoisted(() => vi.fn());
const registerReferralCodeMock = vi.hoisted(() => vi.fn());
const ensureOnboardingConsentsMock = vi.hoisted(() => vi.fn());
const markHasAccountMock = vi.hoisted(() => vi.fn());
const setPendingReferralCodeMock = vi.hoisted(() => vi.fn());
const getPendingReferralCodeMock = vi.hoisted(() => vi.fn());
const clearPendingReferralCodeMock = vi.hoisted(() => vi.fn());

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

vi.mock('@/lib/auth', () => ({
  signUpWithPassword: signUpWithPasswordMock,
  resendSignupVerification: vi.fn(),
}));

vi.mock('@/lib/referral-register', () => ({
  registerReferralCode: registerReferralCodeMock,
}));

vi.mock('@/lib/onboarding-consent', () => ({
  ensureOnboardingConsents: ensureOnboardingConsentsMock,
}));

vi.mock('@/lib/ads-attribution', () => ({
  finalizeAdsSignupAttribution: vi.fn(),
  markPendingSignupConversion: vi.fn(),
}));

vi.mock('@/lib/auth-account-marker', () => ({
  markHasAccount: markHasAccountMock,
}));

vi.mock('@/lib/referral-pending', () => ({
  setPendingReferralCode: setPendingReferralCodeMock,
  getPendingReferralCode: getPendingReferralCodeMock,
  clearPendingReferralCode: clearPendingReferralCodeMock,
}));

vi.mock('@/lib/onboarding-funnel', () => ({
  isOnboardingComplete: () => false,
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

import { useSignupPageController } from '@/features/auth/use-signup-page-controller';

beforeEach(() => {
  navigateMock.mockReset();
  setAuthSessionMock.mockReset();
  signUpWithPasswordMock.mockReset();
  registerReferralCodeMock.mockReset();
  ensureOnboardingConsentsMock.mockReset();
  markHasAccountMock.mockReset();
  setPendingReferralCodeMock.mockReset();
  getPendingReferralCodeMock.mockReset();
  clearPendingReferralCodeMock.mockReset();
  getPendingReferralCodeMock.mockReturnValue('friendcode');
  registerReferralCodeMock.mockResolvedValue({ registered: true });
  ensureOnboardingConsentsMock.mockResolvedValue(undefined);
});

describe('useSignupPageController', () => {
  it('stores referral_code from route search on mount', () => {
    renderHook(() => useSignupPageController({ initialReferralCode: ' abcdefgh ' }));

    expect(setPendingReferralCodeMock).toHaveBeenCalledWith('abcdefgh');
  });

  it('maps signup success to session + referral wire + onboarding redirect', async () => {
    signUpWithPasswordMock.mockResolvedValue({
      ok: true,
      session: { user: { id: 'user-1' } },
    });

    const { result } = renderHook(() => useSignupPageController());

    act(() => {
      result.current.setEmail('user@example.com');
      result.current.setPassword('Aa123456!');
      result.current.setConfirm('Aa123456!');
      result.current.setReferralCode('friendcode');
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    expect(setPendingReferralCodeMock).toHaveBeenCalledWith('friendcode');
    expect(setAuthSessionMock).toHaveBeenCalledWith({ user: { id: 'user-1' } });
    expect(markHasAccountMock).toHaveBeenCalled();
    expect(registerReferralCodeMock).toHaveBeenCalledWith('friendcode');
    expect(clearPendingReferralCodeMock).toHaveBeenCalled();
    expect(ensureOnboardingConsentsMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/onboarding' });
    });
  });

  it('enters verifySent when email confirmation is required', async () => {
    signUpWithPasswordMock.mockResolvedValue({ ok: true, status: 'verify_email' });

    const { result } = renderHook(() => useSignupPageController());

    act(() => {
      result.current.setEmail('user@example.com');
      result.current.setPassword('Aa123456!');
      result.current.setConfirm('Aa123456!');
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    expect(result.current.verifySent).toBe(true);
    expect(setAuthSessionMock).not.toHaveBeenCalled();
  });

  it('surfaces blocked email domains as errorKey', async () => {
    const { result } = renderHook(() => useSignupPageController());

    act(() => {
      result.current.setEmail('user@yopmail.com');
      result.current.setPassword('Aa123456!');
      result.current.setConfirm('Aa123456!');
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    expect(result.current.errorKey).toBe('auth.entry.errors.emailBlocked');
    expect(signUpWithPasswordMock).not.toHaveBeenCalled();
  });
});
