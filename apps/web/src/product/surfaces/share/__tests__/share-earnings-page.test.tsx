import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ShareEarningsPageControllerView } from '@/features/earn/use-share-earnings-page-controller';
import { I18nProvider } from '@/product/i18n';
import { ShareEarningsPage } from '@/product/surfaces/share/share-earnings-page';

const useShareEarningsPageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-share-earnings-page-controller', () => ({
  useShareEarningsPageController: useShareEarningsPageControllerMock,
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
  };
});

function makeEngine(
  overrides: Partial<ShareEarningsPageControllerView> = {},
): ShareEarningsPageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    card: {
      tier: { tier: 'gold', xp: 30000, nextTierXp: 100000 },
      today: { earnedPhonToday: '120.000000', loginStreak: 7 },
      earningsLabel: '+120P',
      tierLabelKey: 'earn.tier.gold',
    },
    referralCode: 'phon_user',
    inviteUrl: 'https://phonara.net/r/phon_user',
    shareRewardLabel: '+25P',
    streakRewardLabel: '+75P',
    streakProgressLabel: '7 / 7',
    webShareAvailable: true,
    shareBusy: false,
    claimBusy: false,
    canClaimShareReward: true,
    canClaimStreakReward: true,
    previewUrl: null,
    shareEarnings: vi.fn(),
    downloadPng: vi.fn(),
    claimShareReward: vi.fn(),
    claimStreakReward: vi.fn(),
    copyInviteLink: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: ShareEarningsPageControllerView) {
  useShareEarningsPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <ShareEarningsPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useShareEarningsPageControllerMock.mockReset();
});

describe('ShareEarningsPage', () => {
  it('renders earnings card preview and web share cta', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('share-earnings-page')).toBeInTheDocument();
    expect(screen.getByTestId('share-earnings-card')).toBeInTheDocument();
    expect(screen.getByTestId('share-earnings-today')).toHaveTextContent('+120P');
    expect(screen.getByTestId('share-earnings-tier-badge')).toHaveTextContent('earn.tier.gold');
    expect(screen.getByTestId('share-earnings-share')).toHaveTextContent('share.earnings.shareCta');
    expect(screen.getByTestId('share-earnings-back')).toHaveAttribute('href', '/home');
  });

  it('shows loading skeleton while snapshot loads', () => {
    renderPage(makeEngine({ loading: true }));

    expect(screen.getByTestId('share-earnings-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('share-earnings-page')).not.toBeInTheDocument();
  });

  it('wires share, download, and claim actions', () => {
    const engine = makeEngine();
    renderPage(engine);

    fireEvent.click(screen.getByTestId('share-earnings-share'));
    expect(engine.shareEarnings).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('share-earnings-download'));
    expect(engine.downloadPng).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('share-earnings-claim-share'));
    expect(engine.claimShareReward).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('share-earnings-claim-streak'));
    expect(engine.claimStreakReward).toHaveBeenCalled();
  });

  it('uses copy fallback label when web share is unavailable', () => {
    renderPage(makeEngine({ webShareAvailable: false }));

    expect(screen.getByTestId('share-earnings-share')).toHaveTextContent(
      'share.earnings.copyLinkCta',
    );
  });
});
