import { render, screen } from '@testing-library/react';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';

import { AppShell } from '../appshell';
import { AuroraBackground } from '../aurora-background';
import { resolveAuroraBackdropIntensity } from '../aurora-backdrop-policy';
import { BottomNav } from '../bottom-nav';

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

describe('shell elevation §34.10–34.11', () => {
  beforeEach(() => {
    mockPathname = '/home';
  });

  it('resolves aurora intensity — Earn/Wallet low · Trade off', () => {
    expect(resolveAuroraBackdropIntensity('/home')).toBe('low');
    expect(resolveAuroraBackdropIntensity('/wallet')).toBe('low');
    expect(resolveAuroraBackdropIntensity('/ledger')).toBe('low');
    expect(resolveAuroraBackdropIntensity('/trade')).toBe('off');
    expect(resolveAuroraBackdropIntensity('/trade/futures')).toBe('off');
    expect(resolveAuroraBackdropIntensity('/sports')).toBe('off');
    expect(resolveAuroraBackdropIntensity('/casino')).toBe('off');
  });

  it('mounts ≤1 aurora on Earn and none on Trade', () => {
    mockPathname = '/home';
    const { unmount } = render(
      <I18nProvider>
        <AppShell>
          <div>content</div>
        </AppShell>
      </I18nProvider>,
    );
    expect(screen.getAllByTestId('aurora-background')).toHaveLength(1);
    expect(screen.getByTestId('aurora-background')).toHaveAttribute('data-intensity', 'low');
    unmount();

    mockPathname = '/trade';
    render(
      <I18nProvider>
        <AppShell>
          <div>trade</div>
        </AppShell>
      </I18nProvider>,
    );
    expect(screen.queryByTestId('aurora-background')).toBeNull();
  });

  it('BottomNav is floating with blur + shadow-2 contract', () => {
    render(
      <I18nProvider>
        <BottomNav />
      </I18nProvider>,
    );
    const nav = screen.getByTestId('bottom-nav');
    expect(nav).toHaveAttribute('data-floating', 'true');
    expect(nav.className).toContain('ds-shell-bottomnav');

    const chrome = readFileSync(join(import.meta.dirname, '..', 'shell-chrome.css'), 'utf8');
    expect(chrome).toContain('backdrop-filter: blur(16px)');
    expect(chrome).toContain('box-shadow: var(--ds-shadow-2)');
    expect(chrome).toContain('z-index: var(--ds-z-chrome)');
  });

  it('Earn lg+ mounts side nav + complementary side rail', () => {
    mockPathname = '/home';
    render(
      <I18nProvider>
        <AppShell>
          <div>earn</div>
        </AppShell>
      </I18nProvider>,
    );
    expect(screen.getByTestId('earn-subnav-desktop')).toBeTruthy();
    expect(screen.getByTestId('earn-side-rail-desktop')).toBeTruthy();
  });

  it('Trade lg+ mounts side nav with Spot/Futures/Positions/Orders/History (ZA-21)', () => {
    mockPathname = '/trade';
    render(
      <I18nProvider>
        <AppShell>
          <div>trade</div>
        </AppShell>
      </I18nProvider>,
    );
    const tradeDesktopNav = screen.getByTestId('trade-subnav-desktop');
    expect(tradeDesktopNav).toBeTruthy();
    expect(tradeDesktopNav.className).toContain('hidden');
    expect(tradeDesktopNav.className).toContain('lg:block');
    for (const path of [
      '/trade',
      '/trade/futures',
      '/trade/positions',
      '/trade/orders',
      '/ledger',
    ]) {
      expect(tradeDesktopNav.querySelector(`a[href="${path}"]`)).toBeTruthy();
    }
    expect(screen.queryByTestId('earn-subnav-desktop')).toBeNull();
  });

  it('Trade desktop side nav does not mount off Trade routes', () => {
    mockPathname = '/home';
    render(
      <I18nProvider>
        <AppShell>
          <div>earn</div>
        </AppShell>
      </I18nProvider>,
    );
    expect(screen.queryByTestId('trade-subnav-desktop')).toBeNull();
  });

  it('AuroraBackground respects reduced-motion static flag', () => {
    const matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal('matchMedia', matchMedia);

    render(<AuroraBackground intensity="low" />);
    expect(screen.getByTestId('aurora-background')).toHaveAttribute('data-static', 'true');
  });

  it('layout.css defines 12-col Orbit Grid + col-span-8/4', () => {
    const layoutPath = join(import.meta.dirname, '../../tokens/layout.css');
    expect(existsSync(layoutPath)).toBe(true);
    const css = readFileSync(layoutPath, 'utf8');
    expect(css).toContain('grid-template-columns: repeat(12, minmax(0, 1fr))');
    expect(css).toContain('.ds-shell-col-span-8');
    expect(css).toContain('.ds-shell-col-span-4');
    expect(css).toContain('grid-column: span 8');
    expect(css).toContain('grid-column: span 4');
  });

  it('aurora-background.tsx + css exist (bundle contract)', () => {
    expect(existsSync(join(import.meta.dirname, '..', 'aurora-background.tsx'))).toBe(true);
    expect(existsSync(join(import.meta.dirname, '..', 'aurora-background.css'))).toBe(true);
  });
});
