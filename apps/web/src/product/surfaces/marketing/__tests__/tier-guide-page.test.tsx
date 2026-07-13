import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TierGuidePageControllerView } from '@/features/earn/use-tier-guide-page-controller';
import { I18nProvider } from '@/product/i18n';
import { TierGuidePage } from '@/product/surfaces/marketing/tier-guide-page';
import { buildTierGuideRows } from '@/domain/tier-guide-display-contract';

const useTierGuidePageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-tier-guide-page-controller', () => ({
  useTierGuidePageController: useTierGuidePageControllerMock,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

function makeEngine(
  overrides: Partial<TierGuidePageControllerView> = {},
): TierGuidePageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    authenticated: false,
    currentTier: null,
    rows: buildTierGuideRows(null),
    faqIds: ['q1', 'q2', 'q3'],
    ...overrides,
  };
}

function renderPage(engine?: Partial<TierGuidePageControllerView>) {
  useTierGuidePageControllerMock.mockReturnValue(makeEngine(engine));
  return render(
    <I18nProvider>
      <TierGuidePage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useTierGuidePageControllerMock.mockReset();
});

describe('TierGuidePage', () => {
  it('renders ladder matrix and FAQ without auth badge', () => {
    renderPage();
    expect(screen.getByTestId('tier-guide-page')).toBeInTheDocument();
    expect(screen.getByTestId('tier-guide-matrix')).toBeInTheDocument();
    expect(screen.getByTestId('tier-guide-row-bronze')).toBeInTheDocument();
    expect(screen.getByTestId('tier-guide-faq')).toBeInTheDocument();
    expect(screen.queryByTestId('tier-guide-current-badge')).not.toBeInTheDocument();
    expect(screen.getByTestId('tier-guide-signup-cta')).toHaveAttribute('href', '/signup');
  });

  it('shows current tier badge when authenticated', () => {
    renderPage({
      authenticated: true,
      currentTier: 'gold',
      rows: buildTierGuideRows('gold'),
    });
    expect(screen.getByTestId('tier-guide-current-badge')).toBeInTheDocument();
    expect(screen.getByTestId('tier-guide-row-gold')).toHaveAttribute('data-current', 'true');
  });
});
