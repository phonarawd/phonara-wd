import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthCallbackPageControllerView } from '@/features/auth/use-auth-callback-page-controller';
import { I18nProvider } from '@/product/i18n';

const useAuthCallbackPageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/auth/use-auth-callback-page-controller', () => ({
  useAuthCallbackPageController: useAuthCallbackPageControllerMock,
}));

import { AuthCallbackPage } from '@/product/surfaces/auth/auth-callback-page';

function makeEngine(
  overrides: Partial<AuthCallbackPageControllerView> = {},
): AuthCallbackPageControllerView {
  return {
    t: (key) => String(key),
    state: 'processing',
    ...overrides,
  };
}

beforeEach(() => {
  useAuthCallbackPageControllerMock.mockReset();
  useAuthCallbackPageControllerMock.mockReturnValue(makeEngine());

  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe('AuthCallbackPage', () => {
  it('renders processing state', () => {
    render(
      <I18nProvider>
        <AuthCallbackPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('auth-callback-loading')).toBeInTheDocument();
    expect(screen.getByTestId('auth-callback-processing')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders failed state with login link', () => {
    useAuthCallbackPageControllerMock.mockReturnValue(makeEngine({ state: 'failed' }));

    render(
      <I18nProvider>
        <AuthCallbackPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('auth-callback-failed')).toBeInTheDocument();
    expect(screen.getByTestId('auth-callback-failed-panel')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'auth.entry.signup.toLogin' })).toHaveAttribute(
      'href',
      '/login',
    );
  });
});
