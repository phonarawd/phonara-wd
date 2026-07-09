import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminLoginPageControllerView } from '@/hooks/use-admin-login-page-controller';
import { I18nProvider } from '@/product/i18n';
import { AdminLoginPage } from '@/product/surfaces/admin-login-page';

const navigateMock = vi.hoisted(() => vi.fn());
const useAdminLoginPageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/hooks/use-admin-login-page-controller', () => ({
  useAdminLoginPageController: useAdminLoginPageControllerMock,
}));

function makeEngine(
  overrides: Partial<AdminLoginPageControllerView> = {},
): AdminLoginPageControllerView {
  return {
    t: (key) => String(key),
    loading: false,
    email: 'admin@example.com',
    password: 'password-1',
    setEmail: vi.fn(),
    setPassword: vi.fn(),
    isBusy: false,
    errorKey: null,
    forbidden: false,
    handlePasswordLogin: vi.fn(async () => undefined),
    ...overrides,
  };
}

function renderPage(engine: AdminLoginPageControllerView) {
  useAdminLoginPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <AdminLoginPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  navigateMock.mockReset();
  useAdminLoginPageControllerMock.mockReset();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe('AdminLoginPage', () => {
  it('renders canonical admin login form controls', () => {
    const engine = makeEngine();
    renderPage(engine);

    expect(screen.getByTestId('admin-login-page')).toBeInTheDocument();
    expect(screen.getByTestId('admin-login-form')).toBeInTheDocument();
    expect(screen.getByTestId('admin-login-email')).toHaveAccessibleName('이메일');
    expect(screen.getByTestId('admin-login-submit')).toHaveTextContent('로그인');
    expect(screen.getByText('관리자만 접근할 수 있습니다.')).toBeInTheDocument();
  });

  it('wires password submit to controller handler', () => {
    const engine = makeEngine();
    renderPage(engine);

    fireEvent.submit(screen.getByTestId('admin-login-form'));
    expect(engine.handlePasswordLogin).toHaveBeenCalledTimes(1);
  });

  it('shows inline error when controller exposes errorKey', () => {
    const engine = makeEngine({ errorKey: 'auth.entry.errors.invalidCredentials' });
    renderPage(engine);

    expect(screen.getByRole('alert')).toHaveTextContent('auth.entry.errors.invalidCredentials');
  });

  it('renders forbidden state for non-admin sessions', () => {
    const engine = makeEngine({ forbidden: true });
    renderPage(engine);

    expect(screen.getByTestId('admin-forbidden')).toBeInTheDocument();
    expect(screen.getByText('관리자 권한이 없습니다.')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-login-form')).not.toBeInTheDocument();
  });

  it('disables submit until credentials are present', () => {
    const engine = makeEngine({ email: '', password: '' });
    renderPage(engine);

    expect(screen.getByTestId('admin-login-submit')).toBeDisabled();
  });

  it('renders loading shell while auth session resolves', () => {
    const engine = makeEngine({ loading: true });
    renderPage(engine);

    expect(screen.getByTestId('admin-login-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-login-form')).not.toBeInTheDocument();
  });
});
