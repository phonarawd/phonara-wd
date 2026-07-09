import axe from 'axe-core';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { translate } from '@phonara/i18n';

import {
  APPSHELL_VISUAL_HUB_ROUTES,
  APPSHELL_VISUAL_VIEWPORT_WIDTHS,
} from '@/domain/appshell-visual-signoff-display-contract';
import { dismissTradeFirstVisitEducation } from '@/features/trade/trade-first-visit-education';
import { I18nProvider } from '@/product/i18n';

import { AppShell } from '../appshell';

let mockPathname = '/home';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({
      children,
      to,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
      className?: string;
      'data-active'?: string;
      'data-tab'?: string;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useRouterState: (opts?: { select?: (s: { location: { pathname: string } }) => unknown }) =>
      opts?.select?.({ location: { pathname: mockPathname } }) ?? {
        location: { pathname: mockPathname },
      },
  };
});

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ session: { user: { id: 'u1', email: 'user@example.com' } }, loading: false }),
}));

vi.mock('@/hooks/use-profile', () => ({
  useProfile: () => ({
    profile: { display_name: 'Test User', username: 'testuser' },
    loading: false,
  }),
}));

vi.mock('@/product/shell/trade-realtime-feedback-gate', () => ({
  TradeRealtimeFeedbackGate: () => null,
}));

async function expectAxeCriticalZero(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  });
  const critical = results.violations.filter((violation) => violation.impact === 'critical');
  expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
}

beforeEach(() => {
  mockPathname = '/home';
  dismissTradeFirstVisitEducation();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe('appshell visual sign-off §20.12 · §12.19.5', () => {
  it.each(APPSHELL_VISUAL_VIEWPORT_WIDTHS)(
    'renders AppShell at %ipx viewport without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      render(
        <I18nProvider>
          <AppShell>
            <div data-testid="appshell-page-content">Earn hub stub</div>
          </AppShell>
        </I18nProvider>,
      );

      expect(screen.getByTestId('app-topbar')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
      expect(screen.getByTestId('appshell-page-content')).toBeInTheDocument();
    },
  );

  it.each(APPSHELL_VISUAL_HUB_ROUTES)('mounts five-tab chrome on hub route %s', (route) => {
    mockPathname = route;
    render(
      <I18nProvider>
        <AppShell>
          <div>Hub content</div>
        </AppShell>
      </I18nProvider>,
    );

    const nav = screen.getByTestId('bottom-nav');
    expect(nav.querySelectorAll('a')).toHaveLength(5);
    expect(within(nav).getByRole('link', { name: translate('ko', 'nav.earn') })).toHaveAttribute(
      'href',
      '/home',
    );
    expect(within(nav).queryByRole('link', { name: translate('ko', 'nav.home') })).toBeNull();
    expect(nav.querySelector('[data-tab="home"]')).toBeNull();
  });

  it('AppShell chrome has axe critical 0 on /home', async () => {
    const { container } = render(
      <I18nProvider>
        <AppShell>
          <div>Earn hub stub</div>
        </AppShell>
      </I18nProvider>,
    );

    await expectAxeCriticalZero(container);
  });

  it('enforces §12.19.5 chrome structure (TopBar · BottomNav · EarnSubnav · active earn tab)', () => {
    render(
      <I18nProvider>
        <AppShell>
          <div>Earn hub stub</div>
        </AppShell>
      </I18nProvider>,
    );

    const topbar = screen.getByTestId('app-topbar');
    expect(topbar.className).toContain('ds-shell-topbar');
    expect(topbar.className).not.toContain('backdrop-blur');

    const bottomNav = screen.getByTestId('bottom-nav');
    expect(bottomNav.className).toContain('ds-shell-bottomnav');
    expect(bottomNav).toHaveAttribute('data-floating', 'true');

    const earnSubnav = screen.getByTestId('earn-subnav-mobile');
    expect(earnSubnav.querySelector('.ds-shell-subnav-scroller')).toBeTruthy();
    expect(earnSubnav.querySelector('.ds-shell-subnav-chip')).toBeTruthy();

    const desktopNav = screen.getByTestId('earn-subnav-desktop');
    expect(desktopNav.className).toContain('ds-shell-earn-sidenav');
    expect(screen.getByTestId('earn-side-rail-desktop')).toBeTruthy();
    expect(screen.getByTestId('aurora-background')).toHaveAttribute('data-intensity', 'low');

    const activeEarnTab = within(bottomNav).getByRole('link', {
      name: translate('ko', 'nav.earn'),
    });
    expect(activeEarnTab).toHaveAttribute('data-active', 'true');
    expect(activeEarnTab).toHaveAttribute('data-tab', 'earn');
    expect(activeEarnTab.querySelector('.ds-shell-bottomnav-icon')).toHaveAttribute(
      'fill',
      'currentColor',
    );

    const avatar = screen.getByTestId('topbar-account-avatar');
    expect(avatar.className).toContain('size-8');
  });

  it('chrome dead controls wire navigation targets (dead control 0)', () => {
    render(
      <I18nProvider>
        <AppShell>
          <div>Earn hub stub</div>
        </AppShell>
      </I18nProvider>,
    );

    const bottomNav = screen.getByTestId('bottom-nav');
    for (const labelKey of [
      'nav.earn',
      'nav.wallet',
      'nav.trade',
      'nav.sports',
      'nav.casino',
    ] as const) {
      const link = within(bottomNav).getByRole('link', { name: translate('ko', labelKey) });
      expect(link.getAttribute('href')).toBeTruthy();
    }

    expect(screen.getByTestId('topbar-account-avatar')).toHaveAttribute('href', '/account');

    const earnSubnav = screen.getByTestId('earn-subnav-mobile');
    const homeChip = within(earnSubnav).getByRole('link', {
      name: translate('ko', 'earn.subnav.home'),
    });
    expect(homeChip).toHaveAttribute('href', '/home');

    fireEvent.click(screen.getByRole('button', { name: translate('ko', 'shell.topbar.notif') }));
    expect(screen.getByTestId('app-topbar')).toBeInTheDocument();
  });
});
