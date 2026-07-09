import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { translate } from '@phonara/i18n';

import { I18nProvider } from '@/product/i18n';

import { EARN_SUBNAV } from '../earn-subnav';
import { BottomNav } from '../bottom-nav';
import { EarnSubnavMobile } from '../earn-shell';
import { filterRegisteredSubnavItems } from '../subnav-route-manifest';

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
      opts?.select?.({ location: { pathname: '/home' } }) ?? { location: { pathname: '/home' } },
  };
});

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ session: { user: { id: 'u1' } }, loading: false }),
}));

describe('AppShell chrome', () => {
  it('renders BottomNav Tab1 as nav.earn with five tabs only', () => {
    render(
      <I18nProvider>
        <BottomNav />
      </I18nProvider>,
    );

    const nav = screen.getByTestId('bottom-nav');
    expect(nav).toBeTruthy();
    expect(screen.getByRole('link', { name: translate('ko', 'nav.earn') })).toHaveAttribute(
      'href',
      '/home',
    );
    expect(screen.getByRole('link', { name: translate('ko', 'nav.wallet') })).toHaveAttribute(
      'href',
      '/wallet',
    );
    expect(screen.getByRole('link', { name: translate('ko', 'nav.trade') })).toHaveAttribute(
      'href',
      '/trade',
    );
    expect(screen.getByRole('link', { name: translate('ko', 'nav.sports') })).toHaveAttribute(
      'href',
      '/sports',
    );
    expect(screen.getByRole('link', { name: translate('ko', 'nav.casino') })).toHaveAttribute(
      'href',
      '/casino',
    );
    expect(nav.querySelectorAll('a')).toHaveLength(5);
    expect(screen.queryByRole('link', { name: translate('ko', 'nav.home') })).toBeNull();
  });

  it('mounts earnSubnav with §12.19.6 P7 manifest chips on /home', () => {
    render(
      <I18nProvider>
        <EarnSubnavMobile />
      </I18nProvider>,
    );

    const subnav = screen.getByTestId('earn-subnav-mobile');
    const visible = filterRegisteredSubnavItems(EARN_SUBNAV);
    expect(subnav).toBeTruthy();
    expect(visible.map((item) => item.to)).toEqual([
      '/home',
      '/home/missions',
      '/home/attendance',
      '/referral',
      '/tier/me',
      '/tier/benefits',
      '/share/earnings',
      '/staking',
    ]);
    for (const item of visible) {
      expect(subnav.querySelector(`a[href="${item.to}"]`)).toBeTruthy();
    }
    for (const item of EARN_SUBNAV) {
      if (!visible.some((v) => v.to === item.to)) {
        expect(subnav.querySelector(`a[href="${item.to}"]`)).toBeNull();
      }
    }
    expect(screen.getByRole('link', { name: translate('ko', 'earn.subnav.home') })).toHaveAttribute(
      'href',
      '/home',
    );
    expect(
      screen.getByRole('link', { name: translate('ko', 'earn.subnav.missions') }),
    ).toHaveAttribute('href', '/home/missions');
  });
});
