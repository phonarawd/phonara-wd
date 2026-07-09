import { fireEvent, render, screen } from '@testing-library/react';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EarnHomePageControllerView } from '@/features/earn/use-earn-home-page-controller';

import { I18nProvider } from '@/product/i18n';

import { EarnHomePage } from '@/product/surfaces/home/earn-home-page';

const useEarnHomePageControllerMock = vi.hoisted(() => vi.fn());
const useEarnFiatHintMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-earn-home-page-controller', () => ({
  useEarnHomePageController: useEarnHomePageControllerMock,
}));

vi.mock('@/features/earn/use-earn-fiat-hint', () => ({
  useEarnFiatHint: useEarnFiatHintMock,
}));

vi.mock('@/product/surfaces/landing/live-activity-ticker', () => ({
  LiveActivityTicker: () => <div data-testid="landing-activity-ticker-mock" />,
}));

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

      search?: Record<string, unknown>;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

function makeEngine(
  overrides: Partial<EarnHomePageControllerView> = {},
): EarnHomePageControllerView {
  return {
    t: (key: string) => key,

    loading: false,

    error: null,

    tierProgress: {
      tier: 'silver',

      xp: 12000,

      nextTier: 'gold',

      nextTierXp: 25000,

      progressPercent: 35,

      atMaxTier: false,
    },

    catalogRewardsLabel: '+12,500P',

    wallet: { phonBalanceLabel: '+2,500P', discountTickets: 0, freeTradeTickets: 0 },

    season: { id: 1, percent: 62, daysLeft: 9 },

    launchSlots: { filled: 12, total: 1000 },

    cooldown: { active: false, reasonKey: null },

    missionsInProgress: 2,

    attendanceRewardLabel: '+1,000P',

    rouletteRemaining: 2,

    rouletteMax: 2,

    goldenEarthRemaining: 5,

    nextAction: {
      kind: 'attendance',

      titleKey: 'earn.home.todayOpportunity.attendance',

      bodyKey: 'earn.attendance.head.desc',

      ctaKey: 'earn.attendance.cta',

      route: '/home/attendance',
    },

    missionPreviews: [
      {
        id: 'daily-quiz',

        titleKey: 'mission.daily.quiz',

        rewardLabel: '+200P',

        progressLabel: '0 / 1',

        state: 'in_progress',

        route: '/home/missions',
      },
    ],

    entryCards: [
      {
        id: 'missions',

        titleKey: 'earn.home.entry.missions.title',

        bodyKey: 'earn.home.entry.missions.body',

        ctaKey: 'earn.home.entry.missions.cta',

        route: '/home/missions',
      },

      {
        id: 'events',

        titleKey: 'earn.home.entry.events.title',

        bodyKey: 'earn.home.entry.events.body',

        ctaKey: 'earn.home.entry.events.cta',

        route: '/home/attendance',
      },

      {
        id: 'wallet',

        titleKey: 'earn.home.entry.wallet.title',

        bodyKey: 'earn.home.entry.wallet.body',

        ctaKey: 'earn.home.entry.wallet.cta',

        route: '/wallet',
      },

      {
        id: 'bet',

        titleKey: 'earn.home.entry.bet.title',

        bodyKey: 'earn.home.entry.bet.body',

        ctaKey: 'earn.home.entry.bet.cta',

        route: '/sports',
      },
    ],

    useAmbientTicker: true,
    rewardTicketsIssuanceNoteKey: 'earn.home.tickets.issuanceNote',

    ...overrides,
  };
}

function renderPage(engine: EarnHomePageControllerView = makeEngine()) {
  useEarnHomePageControllerMock.mockReturnValue(engine);

  return render(
    <I18nProvider>
      <EarnHomePage />
    </I18nProvider>,
  );
}

describe('EarnHomePage', () => {
  beforeEach(() => {
    useEarnHomePageControllerMock.mockReset();
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
    renderPage(makeEngine({ loading: true, tierProgress: null }));

    expect(screen.getByTestId('earn-home-loading')).toBeInTheDocument();
  });

  it('renders progressive Fold1–5 with Fold3 collapsed by default', () => {
    renderPage();

    expect(screen.getByTestId('earn-home-page')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-fold1')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-tier-card')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-tier-xp')).toHaveAttribute('data-count-up', 'true');
    expect(screen.getByTestId('earn-home-tier-xp')).toHaveTextContent('12,000 XP');
    expect(screen.getByTestId('earn-home-next-action')).toBeInTheDocument();

    expect(screen.getByTestId('earn-home-fold2')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-money-fold-panel')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-catalog-sum')).toHaveTextContent('+12,500P');

    expect(screen.getByTestId('earn-home-fold3')).toBeInTheDocument();
    expect(screen.queryByTestId('earn-home-insights-fold-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('earn-home-activity-ticker')).not.toBeInTheDocument();
    expect(screen.queryByTestId('earn-home-today-opportunity')).not.toBeInTheDocument();

    expect(screen.getByTestId('earn-home-fold4')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-mission-daily-quiz')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-missions-view-all')).toHaveAttribute(
      'href',
      '/home/missions',
    );

    expect(screen.getByTestId('earn-home-fold5')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-entry-missions')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-entry-cta-wallet')).toHaveAttribute('href', '/wallet');

    expect(screen.getByTestId('earn-home-next-action-cta')).toHaveAttribute(
      'href',
      '/home/attendance',
    );
  });

  it('expands Fold3 to show today, season, trust, and ambient ticker', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('earn-home-insights-fold-toggle'));

    expect(screen.getByTestId('earn-home-insights-fold-panel')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-activity-ticker')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-today-opportunity')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-season-card')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-trust-card')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-reward-tickets')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-discount-tickets')).toHaveTextContent('0');
    expect(screen.getByTestId('earn-home-free-trade-tickets')).toHaveTextContent('0');
    expect(screen.getByText('earn.home.tickets.issuanceNote')).toBeInTheDocument();
  });

  it('hides ambient ticker when live proof mode is active even after Fold3 expand', () => {
    renderPage(makeEngine({ useAmbientTicker: false }));

    fireEvent.click(screen.getByTestId('earn-home-insights-fold-toggle'));
    expect(screen.queryByTestId('earn-home-activity-ticker')).not.toBeInTheDocument();
  });
});
