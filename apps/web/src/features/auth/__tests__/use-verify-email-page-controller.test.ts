import { renderHook, act } from '@testing-library/react';
import type { FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.hoisted(() => vi.fn());
const resendSignupVerificationMock = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    session: null,
    loading: false,
    setAuthSession: vi.fn(),
    refreshSession: vi.fn(),
  }),
}));

vi.mock('@/lib/auth', () => ({
  resendSignupVerification: resendSignupVerificationMock,
}));

vi.mock('@/lib/onboarding-funnel', () => ({
  isOnboardingComplete: () => false,
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

import { useVerifyEmailPageController } from '@/features/auth/use-verify-email-page-controller';

beforeEach(() => {
  navigateMock.mockReset();
  resendSignupVerificationMock.mockReset();
});

describe('useVerifyEmailPageController', () => {
  it('starts in sent state when email and startSent are provided', () => {
    const { result } = renderHook(() =>
      useVerifyEmailPageController({ initialEmail: 'user@example.com', startSent: true }),
    );

    expect(result.current.email).toBe('user@example.com');
    expect(result.current.sent).toBe(true);
  });

  it('sends verification email and enters sent state', async () => {
    resendSignupVerificationMock.mockResolvedValue({ ok: true, status: 'verify_email' });

    const { result } = renderHook(() => useVerifyEmailPageController());

    act(() => {
      result.current.setEmail('user@example.com');
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    expect(resendSignupVerificationMock).toHaveBeenCalledWith('user@example.com');
    expect(result.current.sent).toBe(true);
  });

  it('resends verification email from sent state', async () => {
    resendSignupVerificationMock.mockResolvedValue({ ok: true, status: 'verify_email' });

    const { result } = renderHook(() =>
      useVerifyEmailPageController({ initialEmail: 'user@example.com', startSent: true }),
    );

    await act(async () => {
      await result.current.resendVerificationEmail();
    });

    expect(resendSignupVerificationMock).toHaveBeenCalledWith('user@example.com');
    expect(result.current.resendSent).toBe(true);
  });

  it('surfaces invalid email as errorKey', async () => {
    const { result } = renderHook(() => useVerifyEmailPageController());

    act(() => {
      result.current.setEmail('not-an-email');
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    expect(result.current.errorKey).toBe('auth.entry.errors.emailInvalid');
    expect(resendSignupVerificationMock).not.toHaveBeenCalled();
  });
});
