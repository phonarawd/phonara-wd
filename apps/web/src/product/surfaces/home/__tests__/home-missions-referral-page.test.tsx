import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HomeMissionsReferralPageControllerView } from '@/features/earn/use-home-missions-referral-page-controller';
import { I18nProvider } from '@/product/i18n';
import { HomeMissionsReferralPage } from '@/product/surfaces/home/home-missions-referral-page';

const useHomeMissionsReferralPageControllerMock = vi.hoisted(() => vi.fn());
const useEarnFiatHintMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-home-missions-referral-page-controller', () => ({
  useHomeMissionsReferralPageController: useHomeMissionsReferralPageControllerMock,
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
  overrides: Partial<HomeMissionsReferralPageControllerView> = {},
): HomeMissionsReferralPageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    hubReferral: {
      totalInvited: 4,
      qualifiedTotal: 2,
      pendingReview: 1,
      payoutTodayUsed: 1,
      payoutTodayMax: 5,
      payoutTodayRemaining: 4,
      perFriendBonusMultiplier: '1.25',
    },
    earnTier: 'silver',
    referralHubRoute: '/referral',
    missions: [
      {
        id: 'viral-partnerHubVisit',
        titleKey: 'mission.viral.partnerHubVisit',
        rewardLabel: '+200P',
        progressLabel: '0 / 1',
        state: 'reward_pending',
        claimBlocked: false,
        canClaim: true,
        ctaRoute: null,
        viralRpc: 'affiliate_content_post',
        repeatableRpc: null,
      },
      {
        id: 'tier-reachSilver',
        titleKey: 'mission.tier.reachSilver',
        rewardLabel: '+5,000P',
        progressLabel: '0 / 1',
        state: 'in_progress',
        claimBlocked: false,
        canClaim: false,
        ctaRoute: '/tier/me',
        viralRpc: null,
        repeatableRpc: 'tier_reach_silver',
      },
    ],
    completedCount: 0,
    totalVisibleCount: 2,
    claimingMission: null,
    claimMission: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: HomeMissionsReferralPageControllerView = makeEngine()) {
  useHomeMissionsReferralPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <HomeMissionsReferralPage />
    </I18nProvider>,
  );
}

describe('HomeMissionsReferralPage', () => {
  beforeEach(() => {
    useHomeMissionsReferralPageControllerMock.mockReset();
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
    expect(screen.getByTestId('home-missions-referral-loading')).toBeInTheDocument();
  });

  it('renders referral header, stats, and curated missions', () => {
    renderPage();
    expect(screen.getByTestId('home-missions-referral-page')).toBeInTheDocument();
    expect(screen.getByText('earn.missions.referral.title')).toBeInTheDocument();
    expect(screen.getByTestId('home-missions-referral-stats')).toBeInTheDocument();
    expect(screen.getByTestId('home-missions-referral-hub-cta')).toHaveAttribute(
      'href',
      '/referral',
    );
    expect(
      screen.getByTestId('home-missions-referral-mission-viral-partnerHubVisit'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('home-missions-referral-mission-tier-reachSilver'),
    ).toBeInTheDocument();
  });

  it('claims mission from card action', () => {
    const claimMission = vi.fn();
    renderPage(makeEngine({ claimMission }));
    fireEvent.click(screen.getByRole('button', { name: 'common.cta.claim' }));
    expect(claimMission).toHaveBeenCalledWith('viral-partnerHubVisit');
  });

  it('shows in-progress CTA link', () => {
    renderPage();
    expect(screen.getByTestId('home-missions-referral-link-tier-reachSilver')).toHaveAttribute(
      'href',
      '/tier/me',
    );
  });
});
