import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DA_W3_GATE_VISUAL_VIEWPORT_WIDTHS,
  EARN_HOME_ABOVE_FOLD_MODULE_MAX,
  EARN_HOME_ABOVE_FOLD_MODULES,
} from '@/domain/da-w3-gate-ia-progressive-display-contract';
import { EARN_HOME_HUB_MISSION_PREVIEW_MAX } from '@/domain/earn-home-display-contract';
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
        id: 'daily-todaySpin',
        titleKey: 'mission.daily.todaySpin',
        rewardLabel: '+100P',
        progressLabel: '0 / 1',
        state: 'in_progress',
        route: '/home/missions',
      },
      {
        id: 'daily-quiz',
        titleKey: 'mission.daily.quiz',
        rewardLabel: '+200P',
        progressLabel: '0 / 1',
        state: 'in_progress',
        route: '/home/missions',
      },
      {
        id: 'viral-shareLink',
        titleKey: 'mission.viral.shareLink',
        rewardLabel: '+500P',
        progressLabel: '0 / 1',
        state: 'available',
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

describe('da-w3-gate-ia-progressive · /home above-fold §34.12', () => {
  beforeEach(() => {
    useEarnFiatHintMock.mockReturnValue({
      hint: null,
      showDisclaimer: false,
    });
  });

  it.each(DA_W3_GATE_VISUAL_VIEWPORT_WIDTHS)(
    'renders progressive Fold1–5 at %ipx without layout crash (VISUAL advisory)',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      renderPage();

      expect(screen.getByTestId('earn-home-page')).toBeInTheDocument();
      expect(screen.getByTestId('earn-home-fold1')).toBeInTheDocument();
      expect(screen.getByTestId('earn-home-fold2')).toBeInTheDocument();
      expect(screen.getByTestId('earn-home-fold3')).toBeInTheDocument();
      expect(screen.getByTestId('earn-home-fold4')).toBeInTheDocument();
      expect(screen.getByTestId('earn-home-fold5')).toBeInTheDocument();
    },
  );

  it('keeps above-fold to status · next action · money (≤3) with Fold3 collapsed', () => {
    expect(EARN_HOME_ABOVE_FOLD_MODULES).toHaveLength(EARN_HOME_ABOVE_FOLD_MODULE_MAX);
    renderPage();

    // Module 1–2: status + next action (Fold1)
    expect(screen.getByTestId('earn-home-tier-card')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-next-action')).toBeInTheDocument();

    // Module 3: money (Fold2 open)
    expect(screen.getByTestId('earn-home-money-fold-panel')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-catalog-sum')).toBeInTheDocument();

    // Fold3 insights must stay collapsed (not above-fold dump)
    expect(screen.queryByTestId('earn-home-insights-fold-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('earn-home-today-opportunity')).not.toBeInTheDocument();
    expect(screen.queryByTestId('earn-home-season-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('earn-home-trust-card')).not.toBeInTheDocument();
  });

  it('caps Fold4 mission preview at 3 and expands Fold3 on demand', () => {
    renderPage();

    const missionGrid = screen.getByTestId('earn-home-mission-grid');
    expect(missionGrid.querySelectorAll('[data-testid^="earn-home-mission-"]')).toHaveLength(
      EARN_HOME_HUB_MISSION_PREVIEW_MAX,
    );

    fireEvent.click(screen.getByTestId('earn-home-insights-fold-toggle'));
    expect(screen.getByTestId('earn-home-insights-fold-panel')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-today-opportunity')).toBeInTheDocument();
  });
});
