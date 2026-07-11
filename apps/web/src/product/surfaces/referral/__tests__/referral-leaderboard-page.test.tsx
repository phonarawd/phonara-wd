import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { ReferralLeaderboardPage } from '@/product/surfaces/referral/referral-leaderboard-page';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

const useReferralLeaderboardControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-referral-leaderboard-controller', () => ({
  useReferralLeaderboardController: () => useReferralLeaderboardControllerMock(),
}));

describe('ReferralLeaderboardPage', () => {
  it('renders live rank list from controller snapshot', () => {
    useReferralLeaderboardControllerMock.mockReturnValue({
      t: (key: string) => key,
      deferred: false,
      live: true,
      window: 'all_time',
      windows: ['all_time', '30d', '7d'],
      setWindow: vi.fn(),
      loading: false,
      errorKey: null,
      snapshot: {
        window: 'all_time',
        limit: 50,
        generatedAt: null,
        entries: [
          { rank: 1, displayName: 'ab***', qualifiedCount: 9, isSelf: false },
          { rank: 2, displayName: 'cd***', qualifiedCount: 3, isSelf: true },
        ],
        self: { rank: 2, displayName: 'cd***', qualifiedCount: 3, isSelf: true },
      },
      refresh: vi.fn(),
    });

    render(
      <I18nProvider>
        <ReferralLeaderboardPage />
      </I18nProvider>,
    );
    const page = screen.getByTestId('referral-leaderboard-page');
    expect(page).toHaveAttribute('data-deferred', 'false');
    expect(page).toHaveAttribute('data-live', 'true');
    expect(page).toHaveAttribute('data-ui-unlock-todo', 'ew-e5-gap-surfaces-wire');
    expect(screen.getByTestId('referral-leaderboard-list')).toBeTruthy();
    expect(screen.getByTestId('referral-leaderboard-row-1')).toBeTruthy();
    expect(screen.getByTestId('referral-leaderboard-self')).toBeTruthy();
    expect(screen.queryByTestId('referral-leaderboard-empty')).toBeNull();
  });
});
