import { fireEvent, render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LoginPageControllerView } from '@/features/auth/use-login-page-controller';
import { I18nProvider } from '@/product/i18n';
import { LoginForm } from '@/product/surfaces/login/login-form';

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    search,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; search?: Record<string, string> }) => {
    const href =
      search && Object.keys(search).length > 0
        ? `${to}?${new URLSearchParams(search).toString()}`
        : to;
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
  useNavigate: () => navigateMock,
}));

function makeEngine(overrides: Partial<LoginPageControllerView> = {}): LoginPageControllerView {
  return {
    t: (key) => String(key),
    loading: false,
    email: 'user@example.com',
    password: 'password-1',
    setEmail: vi.fn(),
    setPassword: vi.fn(),
    isBusy: false,
    errorKey: null,
    magicSent: false,
    handlePasswordLogin: vi.fn(async () => undefined),
    handleMagicLink: vi.fn(async () => undefined),
    handlePasskeyLogin: vi.fn(async () => undefined),
    ...overrides,
  };
}

function renderForm(engine: LoginPageControllerView, onSubmit = vi.fn()) {
  return render(
    <I18nProvider>
      <LoginForm
        engine={engine}
        onSubmit={onSubmit}
        rememberMe={false}
        onRememberMeChange={vi.fn()}
      />
    </I18nProvider>,
  );
}

beforeEach(() => {
  navigateMock.mockReset();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe('LoginForm', () => {
  it('renders canonical login controls and wires controller actions', () => {
    const engine = makeEngine();
    const onSubmit = vi.fn();

    renderForm(engine, onSubmit);

    expect(screen.getByTestId('login-email')).toHaveAccessibleName('이메일');
    expect(screen.getByTestId('login-submit')).toHaveTextContent('로그인');
    expect(screen.getByRole('link', { name: '비밀번호를 잊으셨나요?' })).toHaveAttribute(
      'href',
      '/reset-password',
    );
    expect(screen.getByRole('link', { name: '처음이세요? 둘러보기' })).toHaveAttribute(
      'href',
      '/?landing=1',
    );

    fireEvent.submit(screen.getByTestId('login-submit').closest('form') as HTMLFormElement);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('login-passkey'));
    expect(engine.handlePasskeyLogin).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('login-magic-link'));
    expect(engine.handleMagicLink).toHaveBeenCalledTimes(1);
  });

  it('shows inline error when controller exposes errorKey', () => {
    const engine = makeEngine({ errorKey: 'auth.entry.errors.invalidCredentials' });
    renderForm(engine);

    expect(screen.getByRole('alert')).toHaveTextContent('auth.entry.errors.invalidCredentials');
  });

  it('renders magic-link sent state', () => {
    const engine = makeEngine({ magicSent: true });
    renderForm(engine);

    expect(screen.getByTestId('login-magic-sent')).toBeInTheDocument();
    expect(screen.getByText('✉️ 이메일을 확인해 주세요')).toBeInTheDocument();
  });

  it('disables submit until credentials are present', () => {
    const engine = makeEngine({ email: '', password: '' });
    renderForm(engine);

    expect(screen.getByTestId('login-submit')).toBeDisabled();
  });
});
