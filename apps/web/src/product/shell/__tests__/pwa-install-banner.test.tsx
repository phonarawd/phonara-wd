import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { PwaInstallBanner } from '@/product/shell/pwa-install-banner';

const useInstallPromptMock = vi.hoisted(() => vi.fn());
const useRouterStateMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/pwa/install-prompt-context', () => ({
  useInstallPrompt: useInstallPromptMock,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useRouterState: (opts?: { select?: (s: { location: { pathname: string } }) => unknown }) =>
      useRouterStateMock(opts),
  };
});

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.localStorage.setItem('phonara.locale', 'ko');
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as typeof window.matchMedia;
  useInstallPromptMock.mockReturnValue({ isInstalled: false });
  useRouterStateMock.mockImplementation(
    (opts?: { select?: (s: { location: { pathname: string } }) => unknown }) =>
      opts?.select?.({ location: { pathname: '/home' } }) ?? { location: { pathname: '/home' } },
  );
});

describe('PwaInstallBanner', () => {
  it('shows after contextual nudge on eligible routes', () => {
    window.sessionStorage.setItem('pwa.install.banner.nudge', '1');

    render(
      <I18nProvider>
        <PwaInstallBanner />
      </I18nProvider>,
    );

    expect(screen.getByTestId('pwa-install-banner')).toBeInTheDocument();
    expect(screen.getByTestId('pwa-install-banner-cta')).toHaveAttribute('href', '/install');
  });

  it('stays hidden on /install', () => {
    window.sessionStorage.setItem('pwa.install.banner.nudge', '1');
    useRouterStateMock.mockImplementation(
      (opts?: { select?: (s: { location: { pathname: string } }) => unknown }) =>
        opts?.select?.({ location: { pathname: '/install' } }) ?? {
          location: { pathname: '/install' },
        },
    );

    render(
      <I18nProvider>
        <PwaInstallBanner />
      </I18nProvider>,
    );

    expect(screen.queryByTestId('pwa-install-banner')).toBeNull();
  });
});
