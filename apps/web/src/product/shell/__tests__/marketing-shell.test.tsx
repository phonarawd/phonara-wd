import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';

import { MarketingShell } from '../marketing-shell';

vi.mock('@/product/surfaces/landing/auth-attribution-chunk', () => ({
  AuthAttributionChunk: ({ trackViewContent }: { trackViewContent?: boolean }) => (
    <div
      data-testid="auth-attribution-chunk"
      data-view-content={String(Boolean(trackViewContent))}
    />
  ),
}));

vi.mock('@tanstack/react-router', () => ({
  useRouterState: (opts?: { select?: (s: { location: { pathname: string } }) => unknown }) =>
    opts?.select?.({ location: { pathname: '/' } }) ?? { location: { pathname: '/' } },
}));

describe('MarketingShell', () => {
  it('renders standalone marketing zone without AppShell chrome', () => {
    render(
      <I18nProvider>
        <MarketingShell>
          <p data-testid="marketing-child">child</p>
        </MarketingShell>
      </I18nProvider>,
    );

    const shell = screen.getByTestId('marketing-shell');
    expect(shell).toBeInTheDocument();
    expect(shell).toHaveClass('ds-marketing-shell--landing');
    expect(screen.getByTestId('marketing-child')).toBeInTheDocument();
    expect(screen.queryByTestId('bottom-nav')).toBeNull();
    expect(screen.queryByTestId('top-bar')).toBeNull();
  });

  it('hosts attribution chunk on landing with ViewContent tracking', () => {
    render(
      <I18nProvider>
        <MarketingShell>
          <p>landing</p>
        </MarketingShell>
      </I18nProvider>,
    );

    const chunk = screen.getByTestId('auth-attribution-chunk');
    expect(chunk).toHaveAttribute('data-view-content', 'true');
  });
});
