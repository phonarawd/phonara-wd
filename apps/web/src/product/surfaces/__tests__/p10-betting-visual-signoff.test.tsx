import axe from 'axe-core';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  P10_BETTING_DEAD_CONTROL_TEST_IDS,
  P10_BETTING_VISUAL_VIEWPORT_WIDTHS,
} from '@/domain/p10-betting-visual-signoff-display-contract';
import type { SportsPageControllerView } from '@/features/sports/use-sports-page-controller';
import type { SportsFixtureSummary } from '@/features/sports/use-sports-betting';
import { I18nProvider } from '@/product/i18n';
import { CasinoFairnessPage } from '@/product/surfaces/casino/casino-fairness-page';
import { CasinoLobbyPage } from '@/product/surfaces/casino/casino-lobby-page';
import { CasinoGameShell } from '@/product/surfaces/games/casino-game-shell';
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

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: () => ({
    wallet: {
      usdt_available: '125.500000',
      phon_available: '1000.000000',
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    session: { user: { id: '00000000-0000-4000-8000-000000000001' } },
    loading: false,
  }),
}));

vi.mock('@/features/casino/use-casino-round', () => ({
  useCasinoRoundPipeline: () => ({
    commitment: null,
    bet: null,
    verificationEvidence: null,
    settledResult: null,
    confirmOpen: false,
    busy: false,
    errorKey: null,
    toastKey: null,
    prepareRound: vi.fn(),
    submitBet: vi.fn(),
    requestBet: vi.fn(),
    autoBet: vi.fn(),
    openBetConfirm: vi.fn(),
    cancelBetConfirm: vi.fn(),
    resetRoundState: vi.fn(),
  }),
}));

vi.mock('@/features/casino/use-casino-fiat-hint', () => ({
  useCasinoFiatHint: () => ({
    targetFiat: 'KRW',
    sessionLocked: false,
    lockedAt: null,
    hintFor: () => ({
      displayOnly: true,
      formattedHint: '',
      targetFiat: 'OFF',
      asOf: '',
      stale: false,
      disabled: true,
      sourceCurrency: 'USDT',
    }),
    lockSession: vi.fn(),
    unlockSession: vi.fn(),
    showDisclaimer: false,
  }),
}));

vi.mock('@/product/primitives/lib/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => false,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
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
  };
});

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

function makeSportsEngine(
  overrides: Partial<SportsPageControllerView> = {},
): SportsPageControllerView {
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
    liveStatesByFixtureId: new Map(),
    activeLiveState: null,
    liveStatesLoading: false,
    liveStatesStale: false,
    realtimeConnected: false,
    ...overrides,
  };
}

function wrap(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>{ui}</I18nProvider>
    </QueryClientProvider>,
  );
}

async function expectAxeCriticalZero(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  });
  const critical = results.violations.filter((violation) => violation.impact === 'critical');
  expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
}

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
  useSportsPageControllerMock.mockReset();
  useSportsPageControllerMock.mockReturnValue(makeSportsEngine());
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe('p10-betting visual sign-off §20.12 · §22.2 Sports+Casino · §34.17', () => {
  it.each(P10_BETTING_VISUAL_VIEWPORT_WIDTHS)(
    'renders SportsPage at %ipx viewport without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      wrap(<SportsPage />);

      expect(screen.getByTestId('sports-page')).toBeInTheDocument();
      expect(screen.getByTestId('sports-fixture-board')).toBeInTheDocument();
      expect(screen.getByTestId('sports-bet-slip-panel')).toBeInTheDocument();
      expect(screen.getByTestId('sports-stake-currency-selector')).toBeInTheDocument();
    },
  );

  it.each(P10_BETTING_VISUAL_VIEWPORT_WIDTHS)(
    'renders CasinoLobbyPage at %ipx viewport without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      wrap(<CasinoLobbyPage />);

      expect(screen.getByTestId('casino-lobby-page')).toBeInTheDocument();
      expect(screen.getByTestId('casino-lobby-grid')).toBeInTheDocument();
      expect(screen.getByTestId('casino-hub-play-tile')).toHaveAttribute(
        'data-card-variant',
        'casino-play',
      );
    },
  );

  it('SportsPage has axe critical 0 and §22.2 sports checklist', async () => {
    const { container } = wrap(<SportsPage />);

    await expectAxeCriticalZero(container);

    expect(screen.getByTestId('sports-left-rail')).toBeInTheDocument();
    expect(screen.getByTestId('sports-slip-rail')).toBeInTheDocument();
    expect(screen.getByTestId('sports-fixture-board').querySelector('[data-card-variant="sports-odds"]')).toBeTruthy();
    expect(screen.getByTestId('sports-stake-currency-usdt')).toBeInTheDocument();
    expect(screen.getByTestId('sports-stake-currency-phon')).toBeInTheDocument();
    expect(screen.getByTestId('sports-slip-place-bet')).toBeInTheDocument();
  });

  it('CasinoLobbyPage has axe critical 0 and §34.17 casino-play tiles', async () => {
    const { container } = wrap(<CasinoLobbyPage />);

    await expectAxeCriticalZero(container);

    expect(screen.getByTestId('casino-lobby-pf-verify')).toHaveAttribute('href', '/casino/fairness');
    expect(screen.getByTestId('casino-lobby-play-crash')).toHaveAttribute('href', '/games/crash');
    expect(screen.getByTestId('casino-lobby-chip-originals')).toBeInTheDocument();
    const balance = screen.getByTestId('casino-lobby-balance');
    expect(within(balance).getByText(/USDT/i)).toBeInTheDocument();
    expect(within(balance).getByText(/PHON/i)).toBeInTheDocument();
  });

  it('CasinoFairnessPage has axe critical 0 and verify CTA wired', async () => {
    const { container } = wrap(<CasinoFairnessPage />);

    await expectAxeCriticalZero(container);

    expect(screen.getByTestId('casino-fairness-page')).toBeInTheDocument();
    expect(screen.getByTestId('casino-fairness-verify-run')).toBeInTheDocument();
    expect(screen.getByTestId('casino-fairness-back')).toHaveAttribute('href', '/casino');
  });

  it('CasinoGameShell has axe critical 0 · dual currency · AutoBet · dead controls', async () => {
    const { container } = wrap(<CasinoGameShell gameCode="crash" />);

    await expectAxeCriticalZero(container);

    expect(screen.getByTestId('casino-game-shell')).toBeInTheDocument();
    expect(screen.getByTestId('casino-stake-currency')).toBeInTheDocument();
    expect(screen.getByTestId('casino-stake-currency-usdt')).toBeInTheDocument();
    expect(screen.getByTestId('casino-stake-currency-phon')).toBeInTheDocument();
    expect(screen.getByTestId('casino-place-bet')).toBeInTheDocument();
    expect(screen.getByTestId('casino-shell-back-lobby')).toBeInTheDocument();
    expect(screen.getByTestId('casino-bet-mode-manual')).toBeInTheDocument();
    expect(screen.getByTestId('casino-bet-mode-auto')).toBeInTheDocument();
    expect(screen.getByTestId('casino-crash-stage')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('casino-bet-mode-auto'));
    expect(screen.getByTestId('casino-auto-bet-panel')).toBeInTheDocument();
  });

  it('Sports live + my-bets modes render without crash', () => {
    useSportsPageControllerMock.mockReturnValue(makeSportsEngine({ mode: 'live' }));
    const { unmount } = wrap(<SportsPage mode="live" />);
    expect(screen.getByTestId('sports-page')).toBeInTheDocument();
    unmount();

    useSportsPageControllerMock.mockReturnValue(
      makeSportsEngine({
        mode: 'my-bets',
        myBets: [{ bet_id: 'bet-1', status: 'pending', stake: '10.000000', currency: 'USDT' }],
      }),
    );
    wrap(<SportsPage mode="my-bets" />);
    expect(screen.getByTestId('sports-my-bets-panel')).toBeInTheDocument();
  });

  it('wires §13.1.1 dual-currency selectors on sports slip', () => {
    const setStakeCurrency = vi.fn();
    useSportsPageControllerMock.mockReturnValue(
      makeSportsEngine({ slip: makeSlipState({ setStakeCurrency }) }),
    );
    wrap(<SportsPage />);

    fireEvent.click(screen.getByTestId('sports-stake-currency-phon'));
    expect(setStakeCurrency).toHaveBeenCalledWith('PHON');
  });

  it('declares all dead-control test ids present on primary surfaces', () => {
    wrap(
      <>
        <SportsPage />
        <CasinoLobbyPage />
        <CasinoFairnessPage />
        <CasinoGameShell gameCode="crash" />
      </>,
    );

    for (const testId of P10_BETTING_DEAD_CONTROL_TEST_IDS) {
      expect(screen.getByTestId(testId), `missing dead-control id: ${testId}`).toBeInTheDocument();
    }
  });
});
