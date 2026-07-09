import { renderHook, act, waitFor } from '@testing-library/react';
import type { FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.hoisted(() => vi.fn());
const setAuthSessionMock = vi.hoisted(() => vi.fn());
const signInWithPasswordMock = vi.hoisted(() => vi.fn());
const signInWithPasskeyMock = vi.hoisted(() => vi.fn());
const sendMagicLinkMock = vi.hoisted(() => vi.fn());
const markHasAccountMock = vi.hoisted(() => vi.fn());

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
  signInWithPassword: signInWithPasswordMock,
  signInWithPasskey: signInWithPasskeyMock,
  sendMagicLink: sendMagicLinkMock,
}));

vi.mock('@/lib/auth-account-marker', () => ({
  markHasAccount: markHasAccountMock,
}));

vi.mock('@/lib/pwa-auth-nudge', () => ({
  markAuthLoginForPwaInstall: vi.fn(),
}));

vi.mock('@/lib/onboarding-funnel', () => ({
  isOnboardingComplete: () => true,
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

import { useLoginPageController } from '@/features/auth/use-login-page-controller';

beforeEach(() => {
  navigateMock.mockReset();
  setAuthSessionMock.mockReset();
  signInWithPasswordMock.mockReset();
  signInWithPasskeyMock.mockReset();
  sendMagicLinkMock.mockReset();
  markHasAccountMock.mockReset();
});

describe('useLoginPageController', () => {
  it('maps password login success to session + hasAccount marker + redirect', async () => {
    signInWithPasswordMock.mockResolvedValue({
      ok: true,
      session: { user: { id: 'user-1' } },
    });

    const { result } = renderHook(() => useLoginPageController());

    act(() => {
      result.current.setEmail('user@example.com');
      result.current.setPassword('Aa123456!!');
    });

    await act(async () => {
      await result.current.handlePasswordLogin({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    expect(setAuthSessionMock).toHaveBeenCalledWith({ user: { id: 'user-1' } });
    expect(markHasAccountMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/home' });
    });
  });

  it('surfaces invalid credentials as errorKey', async () => {
    signInWithPasswordMock.mockResolvedValue({ ok: false, code: 'invalidCredentials' });

    const { result } = renderHook(() => useLoginPageController());

    act(() => {
      result.current.setEmail('user@example.com');
      result.current.setPassword('wrong');
    });

    await act(async () => {
      await result.current.handlePasswordLogin({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    expect(result.current.errorKey).toBe('auth.entry.errors.invalidCredentials');
  });

  it('enters magicSent state when magic link dispatch succeeds', async () => {
    sendMagicLinkMock.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useLoginPageController());

    act(() => {
      result.current.setEmail('user@example.com');
    });

    await act(async () => {
      await result.current.handleMagicLink();
    });

    expect(result.current.magicSent).toBe(true);
  });
});
