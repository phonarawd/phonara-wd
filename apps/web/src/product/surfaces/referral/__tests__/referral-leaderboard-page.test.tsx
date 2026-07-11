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

describe('ReferralLeaderboardPage', () => {
  it('renders defer stub with engine todo markers', () => {
    render(
      <I18nProvider>
        <ReferralLeaderboardPage />
      </I18nProvider>,
    );
    const page = screen.getByTestId('referral-leaderboard-page');
    expect(page).toHaveAttribute('data-deferred', 'true');
    expect(page).toHaveAttribute('data-engine-todo', 'ew-e3-gate-cms-promotions');
    expect(screen.getByTestId('referral-leaderboard-empty')).toBeTruthy();
  });
});
