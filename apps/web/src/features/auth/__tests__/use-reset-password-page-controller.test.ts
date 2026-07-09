import { renderHook, act, waitFor } from '@testing-library/react';
import type { FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.hoisted(() => vi.fn());
const refreshSessionMock = vi.hoisted(() => vi.fn());
const sendPasswordResetMock = vi.hoisted(() => vi.fn());
const updatePasswordMock = vi.hoisted(() => vi.fn());
const signOutMock = vi.hoisted(() => vi.fn());
const onAuthStateChangeMock = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    session: null,
    loading: false,
    refreshSession: refreshSessionMock,
    setAuthSession: vi.fn(),
  }),
}));

vi.mock('@/lib/auth', () => ({
  sendPasswordReset: sendPasswordResetMock,
  updatePassword: updatePasswordMock,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: onAuthStateChangeMock,
      signOut: signOutMock,
    },
  },
}));

vi.mock('@/lib/onboarding-funnel', () => ({
  isOnboardingComplete: () => true,
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

import { useResetPasswordPageController } from '@/features/auth/use-reset-password-page-controller';

beforeEach(() => {
  navigateMock.mockReset();
  refreshSessionMock.mockReset();
  sendPasswordResetMock.mockReset();
  updatePasswordMock.mockReset();
  signOutMock.mockReset();
  onAuthStateChangeMock.mockReset();
  refreshSessionMock.mockResolvedValue(null);
  signOutMock.mockResolvedValue(undefined);
  onAuthStateChangeMock.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  window.location.hash = '';
});

describe('useResetPasswordPageController', () => {
  it('sends reset email and enters sent state', async () => {
    sendPasswordResetMock.mockResolvedValue({ ok: true, status: 'reset_sent' });

    const { result } = renderHook(() => useResetPasswordPageController());

    act(() => {
      result.current.setEmail('user@example.com');
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    expect(sendPasswordResetMock).toHaveBeenCalledWith('user@example.com');
    expect(result.current.sent).toBe(true);
  });

  it('updates password in recovery mode and signs out', async () => {
    window.location.hash = '#type=recovery';
    updatePasswordMock.mockResolvedValue({ ok: true, status: 'password_updated' });
    refreshSessionMock.mockResolvedValue({ user: { id: 'user-1' } });

    const { result } = renderHook(() => useResetPasswordPageController());

    await waitFor(() => {
      expect(result.current.recoveryMode).toBe(true);
    });

    act(() => {
      result.current.setPassword('Aa123456!!');
      result.current.setConfirm('Aa123456!!');
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    expect(updatePasswordMock).toHaveBeenCalledWith('Aa123456!!');
    expect(signOutMock).toHaveBeenCalled();
    expect(result.current.completed).toBe(true);
  });

  it('surfaces invalid email as errorKey', async () => {
    const { result } = renderHook(() => useResetPasswordPageController());

    act(() => {
      result.current.setEmail('not-an-email');
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    expect(result.current.errorKey).toBe('auth.entry.errors.emailInvalid');
    expect(sendPasswordResetMock).not.toHaveBeenCalled();
  });
});
