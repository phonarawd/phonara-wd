import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SignupPageControllerView } from '@/features/auth/use-signup-page-controller';
import { I18nProvider } from '@/product/i18n';
import { SignupForm } from '@/product/surfaces/signup/signup-form';

function makeEngine(overrides: Partial<SignupPageControllerView> = {}): SignupPageControllerView {
  return {
    t: (key) => String(key),
    loading: false,
    email: 'user@example.com',
    password: 'Aa123456!',
    confirm: 'Aa123456!',
    referralCode: '',
    setEmail: vi.fn(),
    setPassword: vi.fn(),
    setConfirm: vi.fn(),
    setReferralCode: vi.fn(),
    isBusy: false,
    verifySent: false,
    pendingEmail: '',
    resendSent: false,
    resendBusy: false,
    resendErrorKey: null,
    resendVerificationEmail: vi.fn(async () => undefined),
    errorKey: null,
    handleSubmit: vi.fn(async () => undefined),
    ...overrides,
  };
}

function renderForm(engine: SignupPageControllerView, onSubmit = vi.fn()) {
  return render(
    <I18nProvider>
      <SignupForm engine={engine} onSubmit={onSubmit} />
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

describe('SignupForm', () => {
  it('renders canonical signup controls and referral field', () => {
    const engine = makeEngine();
    renderForm(engine);

    expect(screen.getByTestId('signup-email')).toHaveAccessibleName('이메일');
    expect(screen.getByTestId('signup-referral')).toHaveAccessibleName('추천인 코드 (선택입력)');
    expect(screen.getByTestId('signup-submit')).toHaveTextContent('가입하고 적립금 받기');
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login');
  });

  it('disables submit until consents and fields are ready', () => {
    const engine = makeEngine({ email: '', password: '', confirm: '' });
    renderForm(engine);

    expect(screen.getByTestId('signup-submit')).toBeDisabled();
  });

  it('shows inline error when controller exposes errorKey', () => {
    const engine = makeEngine({ errorKey: 'auth.entry.errors.passwordMismatch' });
    renderForm(engine);

    expect(screen.getByRole('alert')).toHaveTextContent('auth.entry.errors.passwordMismatch');
  });

  it('renders verify-email sent state with resend control', () => {
    const engine = makeEngine({ verifySent: true });
    renderForm(engine);

    expect(screen.getByTestId('signup-verify-sent')).toBeInTheDocument();
    expect(screen.getByTestId('signup-resend')).toBeInTheDocument();
    expect(screen.getByText('✉️ 이메일을 확인해 주세요')).toBeInTheDocument();
  });

  it('enables submit after required consents are checked', () => {
    const engine = makeEngine();
    const onSubmit = vi.fn();
    renderForm(engine, onSubmit);

    fireEvent.click(screen.getByRole('switch', { name: '전체 동의' }));
    fireEvent.submit(screen.getByTestId('signup-submit').closest('form') as HTMLFormElement);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
