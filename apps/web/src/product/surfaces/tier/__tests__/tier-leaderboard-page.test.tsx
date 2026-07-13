import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { TierLeaderboardPage } from '@/product/surfaces/tier/tier-leaderboard-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/earn/use-tier-leaderboard-controller', () => ({
  useTierLeaderboardController: () => ({
    t: (key: string) => key,
    live: true,
    loading: false,
    errorKey: null,
    snapshot: {
      limit: 50,
      generatedAt: '2026-07-12T00:00:00Z',
      entries: [
        {
          rank: 1,
          displayName: 'Player***',
          tier: 'gold',
          xp: 1200,
          isSelf: false,
        },
      ],
      self: {
        rank: 4,
        displayName: 'You***',
        tier: 'silver',
        xp: 500,
        isSelf: true,
      },
    },
    refresh: vi.fn(),
  }),
}));

describe('TierLeaderboardPage', () => {
  it('renders E10 live tier leaderboard list', () => {
    render(
      <I18nProvider>
        <TierLeaderboardPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('tier-leaderboard-page')).toBeInTheDocument();
    expect(screen.getByTestId('tier-leaderboard-list')).toBeInTheDocument();
    expect(screen.getByTestId('tier-leaderboard-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('tier-leaderboard-self')).toBeInTheDocument();
  });
});
