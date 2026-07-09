import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HomeMissionsInvitePageControllerView } from '@/features/earn/use-home-missions-invite-page-controller';
import { I18nProvider } from '@/product/i18n';
import { HomeMissionsInvitePage } from '@/product/surfaces/home/home-missions-invite-page';

const useHomeMissionsInvitePageControllerMock = vi.hoisted(() => vi.fn());
const useEarnFiatHintMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-home-missions-invite-page-controller', () => ({
  useHomeMissionsInvitePageController: useHomeMissionsInvitePageControllerMock,
}));

vi.mock('@/features/earn/use-earn-fiat-hint', () => ({
  useEarnFiatHint: useEarnFiatHintMock,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({
      children,
      to,
      search,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
      search?: Record<string, unknown>;
    }) => {
      const query =
        search && Object.keys(search).length > 0
          ? `?${new URLSearchParams(search as Record<string, string>).toString()}`
          : '';
      return (
        <a href={`${to}${query}`} {...props}>
          {children}
        </a>
      );
    },
  };
});

function makeEngine(
  overrides: Partial<HomeMissionsInvitePageControllerView> = {},
): HomeMissionsInvitePageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    hubReferral: {
      totalInvited: 2,
      qualifiedTotal: 1,
      pendingReview: 1,
      payoutTodayUsed: 0,
      payoutTodayMax: 3,
      payoutTodayRemaining: 3,
      perFriendBonusMultiplier: '1.00',
    },
    inviteShareRoute: '/referral/invite',
    missions: [
      {
        id: 'viral-shareLink',
        titleKey: 'mission.viral.shareLink',
        rewardLabel: '+300P',
        progressLabel: '0 / 3',
        state: 'reward_pending',
        claimBlocked: false,
        canClaim: true,
        ctaRoute: null,
        viralRpc: 'share_referral_link',
      },
      {
        id: 'viral-invite3',
        titleKey: 'mission.viral.invite3',
        rewardLabel: '+10,000P',
        progressLabel: '1 / 3',
        state: 'in_progress',
        claimBlocked: false,
        canClaim: false,
        ctaRoute: '/referral/invite',
        viralRpc: 'invite_friend_signup',
      },
    ],
    completedCount: 0,
    totalVisibleCount: 2,
    claimingMission: null,
    claimMission: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: HomeMissionsInvitePageControllerView = makeEngine()) {
  useHomeMissionsInvitePageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <HomeMissionsInvitePage />
    </I18nProvider>,
  );
}

describe('HomeMissionsInvitePage', () => {
  beforeEach(() => {
    useHomeMissionsInvitePageControllerMock.mockReset();
    useEarnFiatHintMock.mockReset();
    useEarnFiatHintMock.mockReturnValue({
      targetFiat: 'OFF',
      hintFor: () => ({
        displayOnly: true,
        disabled: true,
        formattedHint: '',
        targetFiat: 'OFF',
        asOf: '',
        stale: false,
        sourceCurrency: 'PHON',
      }),
      showDisclaimer: false,
    });
  });

  it('renders loading skeleton', () => {
    renderPage(makeEngine({ loading: true }));
    expect(screen.getByTestId('home-missions-invite-loading')).toBeInTheDocument();
  });

  it('renders invite header, stats, and curated missions', () => {
    renderPage();
    expect(screen.getByTestId('home-missions-invite-page')).toBeInTheDocument();
    expect(screen.getByText('earn.missions.invite.title')).toBeInTheDocument();
    expect(screen.getByTestId('home-missions-invite-stats')).toBeInTheDocument();
    expect(screen.getByTestId('home-missions-invite-share-cta')).toHaveAttribute(
      'href',
      '/referral/invite',
    );
    expect(screen.getByTestId('home-missions-invite-mission-viral-shareLink')).toBeInTheDocument();
    expect(screen.getByTestId('home-missions-invite-mission-viral-invite3')).toBeInTheDocument();
  });

  it('claims mission from card action', () => {
    const claimMission = vi.fn();
    renderPage(makeEngine({ claimMission }));
    fireEvent.click(screen.getByRole('button', { name: 'common.cta.claim' }));
    expect(claimMission).toHaveBeenCalledWith('viral-shareLink');
  });

  it('shows in-progress CTA link', () => {
    renderPage();
    expect(screen.getByTestId('home-missions-invite-link-viral-invite3')).toHaveAttribute(
      'href',
      '/referral/invite',
    );
  });
});
