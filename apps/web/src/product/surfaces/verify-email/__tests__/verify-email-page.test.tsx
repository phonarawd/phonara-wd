import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { VerifyEmailPageControllerView } from '@/features/auth/use-verify-email-page-controller';
import { I18nProvider } from '@/product/i18n';
import { VerifyEmailForm } from '@/product/surfaces/verify-email/verify-email-form';

function makeEngine(
  overrides: Partial<VerifyEmailPageControllerView> = {},
): VerifyEmailPageControllerView {
  return {
    t: (key) => String(key),
    loading: false,
    email: 'user@example.com',
    setEmail: vi.fn(),
    sent: false,
    isBusy: false,
    resendSent: false,
    resendBusy: false,
    resendErrorKey: null,
    errorKey: null,
    handleSubmit: vi.fn(async () => undefined),
    resendVerificationEmail: vi.fn(async () => undefined),
    ...overrides,
  };
}

function renderForm(engine: VerifyEmailPageControllerView, onSubmit = vi.fn()) {
  return render(
    <I18nProvider>
      <VerifyEmailForm engine={engine} onSubmit={onSubmit} />
    </I18nProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe('VerifyEmailForm', () => {
  it('renders request controls and login link', () => {
    renderForm(makeEngine());

    expect(screen.getByTestId('verify-email-request')).toBeInTheDocument();
    expect(screen.getByTestId('verify-email-input')).toHaveAccessibleName('이메일');
    expect(screen.getByTestId('verify-email-submit')).toHaveTextContent('인증 메일 보내기');
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login');
  });

  it('shows sent state with resend control', () => {
    renderForm(makeEngine({ sent: true }));

    expect(screen.getByTestId('verify-email-sent')).toBeInTheDocument();
    expect(screen.getByTestId('verify-email-resend')).toBeInTheDocument();
    expect(screen.getByText('이메일을 확인해주세요')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('shows inline error when controller exposes errorKey', () => {
    renderForm(makeEngine({ errorKey: 'auth.entry.errors.emailInvalid' }));

    expect(screen.getByRole('alert')).toHaveTextContent('auth.entry.errors.emailInvalid');
  });

  it('submits request form when email is valid', () => {
    const onSubmit = vi.fn();
    renderForm(makeEngine(), onSubmit);

    fireEvent.submit(screen.getByTestId('verify-email-submit').closest('form') as HTMLFormElement);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
