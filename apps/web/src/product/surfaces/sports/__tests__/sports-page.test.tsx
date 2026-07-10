import { createElement, type ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SportsPageControllerView } from '@/features/sports/use-sports-page-controller';
import type { SportsFixtureSummary } from '@/features/sports/use-sports-betting';
import { I18nProvider } from '@/product/i18n';
import { SportsPage } from '@/product/surfaces/sports/sports-page';

const useSportsPageControllerMock = vi.hoisted(() => vi.fn());
const useSportsFiatHintMock = vi.hoisted(() =>
  vi.fn(() => ({
    targetFiat: 'OFF' as const,
    showDisclaimer: false,
    hintFor: () => ({
      displayOnly: true as const,
      disabled: true,
      formattedHint: '',
      targetFiat: 'OFF' as const,
      asOf: '',
      stale: false,
      sourceCurrency: 'USDT',
    }),
  })),
);

vi.mock('@/features/sports/use-sports-page-controller', () => ({
  useSportsPageController: useSportsPageControllerMock,
}));

vi.mock('@/features/sports/use-sports-fiat-hint', () => ({
  useSportsFiatHint: useSportsFiatHintMock,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params,
    ...rest
  }: {
    children: ReactNode;
    to: string;
    params?: Record<string, string>;
    className?: string;
    'data-testid'?: string;
  }) =>
    createElement(
      'a',
      {
        href: params?.fixtureId ? String(to).replace('$fixtureId', params.fixtureId) : to,
        ...rest,
      },
      children,
    ),
}));

const sampleFixture: SportsFixtureSummary = {
  fixture_id: 'fx-1',
  league_code: 'epl',
  home_name: 'Arsenal',
  away_name: 'Chelsea',
  kickoff_at: '2026-07-06T15:00:00.000Z',
  status: 'scheduled',
  match_1x2: {
    home: { outcome_id: 'home-1', odds: '1.95', captured_at: '2026-07-06T12:00:00.000Z' },
    draw: { outcome_id: 'draw-1', odds: '3.40', captured_at: '2026-07-06T12:00:00.000Z' },
    away: { outcome_id: 'away-1', odds: '4.10', captured_at: '2026-07-06T12:00:00.000Z' },
  },
};

function makeSlipState(overrides: Partial<ReturnType<SportsPageControllerView['slip']>> = {}) {
  return {
    selections: [],
    stake: '',
    setStake: vi.fn(),
    stakeCurrency: 'USDT' as const,
    setStakeCurrency: vi.fn(),
    toggleSelection: vi.fn(),
    removeSelection: vi.fn(),
    clearSlip: vi.fn(),
    combinedOddsDisplay: null,
    potentialPayoutDisplay: null,
    debitBucketKey: 'sports.slip.debit_bucket.usdt' as const,
    legCount: 0,
    ...overrides,
  };
}

function makeEngine(overrides: Partial<SportsPageControllerView> = {}): SportsPageControllerView {
  return {
    t: (key: string) => key,
    mode: 'home',
    fixtureId: null,
    loading: false,
    fixturesLoading: false,
    fixturesErrorKey: null,
    fixtures: [sampleFixture],
    activeFixture: null,
    fixtureMarkets: [],
    fixtureMarketsLoading: false,
    fixtureMarketsErrorKey: null,
    refreshFixtureMarkets: vi.fn(),
    leagueFilter: 'all',
    setLeagueFilter: vi.fn(),
    sportsBlocked: false,
    sportsBlockedKey: 'sports.gate.feature_off',
    placeCtaExposure: 'built_disabled',
    phonAvail: '1000.000000',
    usdtAvail: '250.000000',
    phonBonusAvailable: '100.000000',
    slip: makeSlipState(),
    selectedOutcomeIds: new Set<string>(),
    toggleSelection: vi.fn(),
    canPlaceBet: false,
    placeBetBusy: false,
    confirmOpen: false,
    setConfirmOpen: vi.fn(),
    requestPlaceBet: vi.fn(),
    confirmPlaceBet: vi.fn(async () => {}),
    myBetsLoading: false,
    myBets: [],
    refreshFixtures: vi.fn(),
    ...overrides,
  };
}

describe('SportsPage', () => {
  beforeEach(() => {
    useSportsPageControllerMock.mockReset();
  });

  it('renders sportsbook board and slip rail', () => {
    useSportsPageControllerMock.mockReturnValue(makeEngine());
    render(
      <I18nProvider>
        <SportsPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('sports-page')).toBeInTheDocument();
    expect(screen.getByTestId('sports-fixture-board')).toBeInTheDocument();
    expect(screen.getByTestId('sports-bet-slip-panel')).toBeInTheDocument();
    expect(screen.getByTestId('sports-stake-currency-selector')).toBeInTheDocument();
  });

  it('wires USDT and PHON stake currency selectors', () => {
    const setStakeCurrency = vi.fn();
    useSportsPageControllerMock.mockReturnValue(
      makeEngine({
        slip: makeSlipState({ setStakeCurrency }),
      }),
    );

    render(
      <I18nProvider>
        <SportsPage />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId('sports-stake-currency-phon'));
    expect(setStakeCurrency).toHaveBeenCalledWith('PHON');
  });

  it('shows per-currency avail balances on slip', () => {
    useSportsPageControllerMock.mockReturnValue(makeEngine());
    render(
      <I18nProvider>
        <SportsPage />
      </I18nProvider>,
    );

    const balances = screen.getByTestId('sports-slip-balances');
    expect(within(balances).getAllByText('USDT').length).toBeGreaterThan(0);
    expect(within(balances).getAllByText('PHON').length).toBeGreaterThan(0);
  });

  it('adds odds selection through fixture board', () => {
    const toggleSelection = vi.fn();
    useSportsPageControllerMock.mockReturnValue(
      makeEngine({
        toggleSelection,
      }),
    );

    render(
      <I18nProvider>
        <SportsPage />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId('sports-odds-fx-1-home'));
    expect(screen.getByTestId('sports-fixture-row-fx-1')).toHaveAttribute(
      'data-card-variant',
      'sports-odds',
    );
    expect(toggleSelection).toHaveBeenCalledWith(
      expect.objectContaining({
        outcomeId: 'home-1',
        oddsAtBet: '1.95',
        fixtureId: 'fx-1',
      }),
    );
  });

  it('renders vip defer panel with empty-state navigation', () => {
    useSportsPageControllerMock.mockReturnValue(
      makeEngine({
        mode: 'vip',
      }),
    );

    render(
      <I18nProvider>
        <SportsPage mode="vip" />
      </I18nProvider>,
    );

    expect(screen.getByTestId('sports-vip-defer')).toBeInTheDocument();
    expect(screen.getByText('sports.vip.defer.title')).toBeInTheDocument();
    expect(screen.queryByTestId('sports-bet-slip-panel')).not.toBeInTheDocument();
  });

  it('renders my bets mode without slip rail', () => {
    useSportsPageControllerMock.mockReturnValue(
      makeEngine({
        mode: 'my-bets',
        myBets: [{ bet_id: 'bet-1', status: 'pending', stake: '10.000000', currency: 'USDT' }],
      }),
    );

    render(
      <I18nProvider>
        <SportsPage mode="my-bets" />
      </I18nProvider>,
    );

    expect(screen.getByTestId('sports-my-bets-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('sports-bet-slip-panel')).not.toBeInTheDocument();
  });

  it('renders fixture detail markets with slip rail', () => {
    const toggleSelection = vi.fn();
    useSportsPageControllerMock.mockReturnValue(
      makeEngine({
        mode: 'fixture',
        fixtureId: 'fx-1',
        activeFixture: sampleFixture,
        toggleSelection,
        fixtureMarkets: [
          {
            market_id: 'm-1x2',
            market_type: 'match_1x2',
            status: 'open',
            outcomes: [
              {
                outcome_id: 'home-1',
                selection: 'home',
                odds: '1.95',
                captured_at: '2026-07-06T12:00:00.000Z',
              },
            ],
          },
          {
            market_id: 'm-totals',
            market_type: 'totals',
            status: 'open',
            outcomes: [],
          },
        ],
      }),
    );

    render(
      <I18nProvider>
        <SportsPage mode="fixture" fixtureId="fx-1" />
      </I18nProvider>,
    );

    expect(screen.getByTestId('sports-page')).toHaveAttribute('data-sports-mode', 'fixture');
    expect(screen.getByTestId('sports-fixture-markets-panel')).toBeInTheDocument();
    expect(screen.getByTestId('sports-fixture-markets-deferred')).toBeInTheDocument();
    expect(screen.getByTestId('sports-bet-slip-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('sports-fixture-odds-home-1'));
    expect(toggleSelection).toHaveBeenCalledWith(
      expect.objectContaining({ outcomeId: 'home-1', fixtureId: 'fx-1' }),
    );
  });
});
