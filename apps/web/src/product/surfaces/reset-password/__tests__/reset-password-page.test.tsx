import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ResetPasswordPageControllerView } from '@/features/auth/use-reset-password-page-controller';
import { I18nProvider } from '@/product/i18n';
import { ResetPasswordForm } from '@/product/surfaces/reset-password/reset-password-form';

function makeEngine(
  overrides: Partial<ResetPasswordPageControllerView> = {},
): ResetPasswordPageControllerView {
  return {
    t: (key) => String(key),
    loading: false,
    email: 'user@example.com',
    password: 'Aa123456!',
    confirm: 'Aa123456!',
    setEmail: vi.fn(),
    setPassword: vi.fn(),
    setConfirm: vi.fn(),
    recoveryMode: false,
    recoveryInvalid: false,
    isBusy: false,
    sent: false,
    completed: false,
    errorKey: null,
    handleSubmit: vi.fn(async () => undefined),
    ...overrides,
  };
}

function renderForm(engine: ResetPasswordPageControllerView, onSubmit = vi.fn()) {
  return render(
    <I18nProvider>
      <ResetPasswordForm engine={engine} onSubmit={onSubmit} />
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

describe('ResetPasswordForm', () => {
  it('renders request controls and back link', () => {
    renderForm(makeEngine());

    expect(screen.getByTestId('reset-password-request')).toBeInTheDocument();
    expect(screen.getByTestId('reset-email')).toHaveAccessibleName('이메일');
    expect(screen.getByTestId('reset-submit')).toHaveTextContent('재설정 링크 보내기');
    expect(screen.getByRole('link', { name: '로그인으로 돌아가기' })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('shows sent state with resend control', () => {
    renderForm(makeEngine({ sent: true }));

    expect(screen.getByTestId('reset-password-sent')).toBeInTheDocument();
    expect(screen.getByTestId('reset-resend')).toBeInTheDocument();
    expect(screen.getByText('이메일을 확인해주세요')).toBeInTheDocument();
  });

  it('renders recovery password form', () => {
    renderForm(makeEngine({ recoveryMode: true }));

    expect(screen.getByTestId('reset-password-recovery-form')).toBeInTheDocument();
    expect(screen.getByTestId('reset-new-password')).toHaveAccessibleName('새 비밀번호');
    expect(screen.getByTestId('reset-confirm-password')).toHaveAccessibleName('새 비밀번호 확인');
  });

  it('shows completed state with login link', () => {
    renderForm(makeEngine({ completed: true }));

    expect(screen.getByTestId('reset-password-done')).toBeInTheDocument();
    expect(screen.getByText('🔒 비밀번호가 변경되었어요')).toBeInTheDocument();
  });

  it('shows inline error when controller exposes errorKey', () => {
    renderForm(makeEngine({ errorKey: 'auth.entry.errors.emailInvalid' }));

    expect(screen.getByRole('alert')).toHaveTextContent('auth.entry.errors.emailInvalid');
  });

  it('submits request form when email is valid', () => {
    const onSubmit = vi.fn();
    renderForm(makeEngine(), onSubmit);

    fireEvent.submit(screen.getByTestId('reset-submit').closest('form') as HTMLFormElement);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
