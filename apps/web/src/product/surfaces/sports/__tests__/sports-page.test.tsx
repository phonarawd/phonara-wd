import { createElement, type ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SportsPageControllerView } from '@/features/sports/use-sports-page-controller';
import type { SportsFixtureSummary } from '@/features/sports/use-sports-betting';
import { I18nProvider } from '@/product/i18n';
import { SportsPage } from '@/product/surfaces/sports/sports-page';

const useSportsPageControllerMock = vi.hoisted(() => vi.fn());
const useQueryMock = vi.hoisted(() => vi.fn());
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

vi.mock('@/features/sports/use-sports-betting', () => ({
  usePreviewSportsCashout: () => ({ data: undefined, isLoading: false, isFetching: false }),
  useCashoutSportsBet: () => ({ mutateAsync: vi.fn(), isPending: false }),
  usePreviewSportsPartialCashout: () => ({
    data: undefined,
    isLoading: false,
    isFetching: false,
  }),
  usePartialCashoutSportsBet: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: (...args: unknown[]) => useQueryMock(...args),
  };
});

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

/** Within live TTL (15s) and prematch TTL (300s) for H-05 board tests. */
const FRESH_CAPTURED_AT = new Date(Date.now() - 5_000).toISOString();
const STALE_CAPTURED_AT = '2026-06-16T04:43:29.944Z';

const sampleFixture: SportsFixtureSummary = {
  fixture_id: 'fx-1',
  league_code: 'epl',
  home_name: 'Arsenal',
  away_name: 'Chelsea',
  kickoff_at: '2026-07-06T15:00:00.000Z',
  status: 'scheduled',
  match_1x2: {
    home: { outcome_id: 'home-1', odds: '1.95', captured_at: FRESH_CAPTURED_AT },
    draw: { outcome_id: 'draw-1', odds: '3.40', captured_at: FRESH_CAPTURED_AT },
    away: { outcome_id: 'away-1', odds: '4.10', captured_at: FRESH_CAPTURED_AT },
  },
};

function makeSlipState(overrides: Partial<ReturnType<SportsPageControllerView['slip']>> = {}) {
  return {
    selections: [],
    stake: '',
    setStake: vi.fn(),
    stakeCurrency: 'USDT' as const,
    setStakeCurrency: vi.fn(),
    oddsAcceptance: 'accept_better' as const,
    setOddsAcceptance: vi.fn(),
    oddsAcceptancePolicies: ['strict', 'accept_any', 'accept_better'] as const,
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
    oddsIngestHealthGreen: true,
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
    liveStatesByFixtureId: new Map(),
    activeLiveState: null,
    liveStatesLoading: false,
    liveStatesStale: false,
    realtimeConnected: false,
    ...overrides,
  };
}

describe('SportsPage', () => {
  beforeEach(() => {
    useSportsPageControllerMock.mockReset();
    useQueryMock.mockReturnValue({
      data: 'platinum',
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('shows stake amount and currency in place-bet confirm summary (ZA-17)', () => {
    useSportsPageControllerMock.mockReturnValue(
      makeEngine({
        confirmOpen: true,
        canPlaceBet: true,
        slip: makeSlipState({
          stake: '25.000000',
          stakeCurrency: 'PHON',
          selections: [
            {
              fixtureId: 'fx-1',
              outcomeId: 'home-1',
              oddsAtBet: '1.95',
              homeName: 'Home FC',
              awayName: 'Away United',
              selection: 'home',
              marketType: '1x2',
            },
          ],
          legCount: 1,
        }),
      }),
    );

    render(
      <I18nProvider>
        <SportsPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('sports-slip-confirm-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('sports-slip-confirm-summary')).toBeInTheDocument();
    expect(screen.getByTestId('sports-slip-confirm-currency')).toHaveTextContent('PHON');
    expect(screen.getByTestId('sports-slip-confirm-stake')).toBeInTheDocument();
  });

  it('renders sportsbook board and slip rail', () => {
    useSportsPageControllerMock.mockReturnValue(makeEngine());
    render(
      <I18nProvider>
        <SportsPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('sports-page')).toBeInTheDocument();
    expect(screen.getByTestId('sports-page')).toHaveAttribute('data-sports-league-rail', 'true');
    expect(screen.getByTestId('sports-page')).toHaveAttribute('data-sports-slip', 'true');
    expect(screen.getByTestId('sports-fixture-board')).toBeInTheDocument();
    expect(screen.getByTestId('sports-kickoff-countdown-fx-1')).toHaveAttribute(
      'data-signature',
      'kickoff-countdown',
    );
    expect(screen.getByTestId('sports-league-rail-desktop')).toBeInTheDocument();
    expect(screen.getByTestId('sports-league-rail-mobile')).toBeInTheDocument();
    expect(screen.getByTestId('sports-slip-mobile-open')).toBeInTheDocument();
    expect(screen.getByTestId('sports-bet-slip-panel')).toBeInTheDocument();
    expect(screen.getByTestId('sports-stake-currency-selector')).toBeInTheDocument();
  });

  it('collapses league rail on rules/my-bets and keeps vip slip without empty left rail', () => {
    useSportsPageControllerMock.mockReturnValue(makeEngine({ mode: 'rules' }));
    const { unmount } = render(
      <I18nProvider>
        <SportsPage mode="rules" />
      </I18nProvider>,
    );
    expect(screen.getByTestId('sports-page')).toHaveAttribute('data-sports-league-rail', 'false');
    expect(screen.getByTestId('sports-page')).toHaveAttribute('data-sports-slip', 'false');
    expect(screen.queryByTestId('sports-left-rail')).not.toBeInTheDocument();
    unmount();

    useSportsPageControllerMock.mockReturnValue(makeEngine({ mode: 'vip' }));
    render(
      <I18nProvider>
        <SportsPage mode="vip" />
      </I18nProvider>,
    );
    expect(screen.getByTestId('sports-page')).toHaveAttribute('data-sports-league-rail', 'false');
    expect(screen.getByTestId('sports-page')).toHaveAttribute('data-sports-slip', 'true');
    expect(screen.queryByTestId('sports-left-rail')).not.toBeInTheDocument();
    expect(screen.getByTestId('sports-slip-rail')).toBeInTheDocument();
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

  it('shows — and blocks selection when odds captured_at is stale (H-05)', () => {
    const toggleSelection = vi.fn();
    useSportsPageControllerMock.mockReturnValue(
      makeEngine({
        toggleSelection,
        oddsIngestHealthGreen: false,
        fixtures: [
          {
            ...sampleFixture,
            match_1x2: {
              home: { outcome_id: 'home-1', odds: '1.95', captured_at: STALE_CAPTURED_AT },
              draw: { outcome_id: 'draw-1', odds: '3.40', captured_at: STALE_CAPTURED_AT },
              away: { outcome_id: 'away-1', odds: '4.10', captured_at: STALE_CAPTURED_AT },
            },
          },
        ],
      }),
    );

    render(
      <I18nProvider>
        <SportsPage />
      </I18nProvider>,
    );

    const homeCell = screen.getByTestId('sports-odds-fx-1-home');
    expect(homeCell.tagName).toBe('SPAN');
    expect(homeCell).toHaveAttribute('data-odds-freshness', 'stale');
    expect(homeCell).toHaveTextContent('—');
    fireEvent.click(homeCell);
    expect(toggleSelection).not.toHaveBeenCalled();

    // ZA-13: board-level transparency banner when fixtures exist but ingest is not green
    expect(screen.getByTestId('sports-board-ingest-offline-banner')).toBeInTheDocument();
  });

  it('ZA-13: hides ingest-offline banner when odds ingest is healthy', () => {
    useSportsPageControllerMock.mockReturnValue(makeEngine({ oddsIngestHealthGreen: true }));

    render(
      <I18nProvider>
        <SportsPage />
      </I18nProvider>,
    );

    expect(screen.queryByTestId('sports-board-ingest-offline-banner')).not.toBeInTheDocument();
  });

  it('ZA-13: hides ingest-offline banner when there are no fixtures (empty state owns messaging)', () => {
    useSportsPageControllerMock.mockReturnValue(
      makeEngine({ oddsIngestHealthGreen: false, fixtures: [] }),
    );

    render(
      <I18nProvider>
        <SportsPage />
      </I18nProvider>,
    );

    expect(screen.queryByTestId('sports-board-ingest-offline-banner')).not.toBeInTheDocument();
  });

  it('renders vip room with eligibility strip and shared fixture board', () => {
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

    expect(screen.getByTestId('sports-vip-stub')).toBeInTheDocument();
    expect(screen.getByTestId('sports-vip-eligibility-strip')).toBeInTheDocument();
    expect(screen.getByTestId('sports-vip-board')).toBeInTheDocument();
    expect(screen.queryByTestId('sports-vip-defer')).not.toBeInTheDocument();
    expect(screen.getByText('sports.vip.eligibility.title')).toBeInTheDocument();
    expect(screen.getByTestId('sports-bet-slip-panel')).toBeInTheDocument();
  });

  it('renders vip ineligible empty when tier is below platinum', () => {
    useQueryMock.mockReturnValue({
      data: 'gold',
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
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

    expect(screen.getByTestId('sports-vip-ineligible')).toBeInTheDocument();
    expect(screen.queryByTestId('sports-vip-board')).not.toBeInTheDocument();
  });

  it('renders rules sections without slip rail', () => {
    useSportsPageControllerMock.mockReturnValue(
      makeEngine({
        mode: 'rules',
      }),
    );

    render(
      <I18nProvider>
        <SportsPage mode="rules" />
      </I18nProvider>,
    );

    expect(screen.getByTestId('sports-rules-panel')).toBeInTheDocument();
    expect(screen.getByTestId('sports-rules-section-odds')).toBeInTheDocument();
    expect(screen.getByTestId('sports-rules-section-settlement')).toBeInTheDocument();
    expect(screen.getByTestId('sports-rules-responsible-link')).toHaveAttribute(
      'href',
      '/legal/responsible-gaming',
    );
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

  it('renders fixture multi-market board with slip rail', () => {
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
                captured_at: FRESH_CAPTURED_AT,
              },
            ],
          },
          {
            market_id: 'm-totals',
            market_type: 'totals',
            status: 'open',
            outcomes: [
              {
                outcome_id: 'over-1',
                selection: 'over',
                line: '2.5',
                odds: '1.90',
                captured_at: FRESH_CAPTURED_AT,
              },
              {
                outcome_id: 'under-1',
                selection: 'under',
                line: '2.5',
                odds: '1.95',
                captured_at: FRESH_CAPTURED_AT,
              },
            ],
          },
          {
            market_id: 'm-btts',
            market_type: 'btts',
            status: 'open',
            outcomes: [
              {
                outcome_id: 'btts-yes',
                selection: 'yes',
                odds: '1.80',
                captured_at: FRESH_CAPTURED_AT,
              },
            ],
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
    expect(screen.getByTestId('sports-market-m-totals')).toHaveAttribute(
      'data-market-type',
      'totals',
    );
    expect(screen.getByTestId('sports-market-m-btts')).toHaveAttribute('data-market-type', 'btts');
    expect(screen.queryByTestId('sports-fixture-markets-deferred')).not.toBeInTheDocument();
    expect(screen.getByTestId('sports-bet-slip-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('sports-fixture-odds-over-1'));
    expect(toggleSelection).toHaveBeenCalledWith(
      expect.objectContaining({
        outcomeId: 'over-1',
        fixtureId: 'fx-1',
        marketType: 'totals',
      }),
    );
  });

  it('renders live mode with delay notice, score, and suspend banner', () => {
    const liveFixture: SportsFixtureSummary = {
      ...sampleFixture,
      status: 'live',
    };
    const future = new Date(Date.now() + 60_000).toISOString();
    useSportsPageControllerMock.mockReturnValue(
      makeEngine({
        mode: 'live',
        fixtures: [liveFixture],
        realtimeConnected: true,
        activeLiveState: {
          fixture_id: 'fx-1',
          league_code: 'epl',
          home_name: 'Arsenal',
          away_name: 'Chelsea',
          kickoff_at: liveFixture.kickoff_at,
          status: 'live',
          suspended_until: future,
          suspend_reason: 'goal_event',
          result_home_goals: 2,
          result_away_goals: 1,
          markets: [
            {
              market_id: 'm-1',
              market_type: 'match_1x2',
              status: 'suspended',
              suspended_until: future,
              suspend_reason: 'goal_event',
            },
          ],
        },
        liveStatesByFixtureId: new Map([
          [
            'fx-1',
            {
              fixture_id: 'fx-1',
              league_code: 'epl',
              home_name: 'Arsenal',
              away_name: 'Chelsea',
              kickoff_at: liveFixture.kickoff_at,
              status: 'live',
              suspended_until: future,
              suspend_reason: 'goal_event',
              result_home_goals: 2,
              result_away_goals: 1,
              markets: [],
            },
          ],
        ]),
      }),
    );

    render(
      <I18nProvider>
        <SportsPage mode="live" />
      </I18nProvider>,
    );

    expect(screen.getByTestId('sports-page')).toHaveAttribute('data-sports-mode', 'live');
    expect(screen.getByTestId('sports-live-inplay-banner')).toBeInTheDocument();
    expect(screen.getByTestId('sports-live-delay-notice')).toBeInTheDocument();
    expect(screen.getByTestId('sports-live-score')).toHaveTextContent('2–1');
    expect(screen.getByTestId('sports-live-suspend-banner')).toBeInTheDocument();
    expect(screen.getByTestId('sports-live-row-score-fx-1')).toHaveTextContent('2–1');
    expect(screen.getByTestId('sports-odds-fx-1-home')).toBeDisabled();
  });
});
