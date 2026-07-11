import axe from 'axe-core';
import type React from 'react';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { translate } from '@phonara/i18n';

import {
  DA_W7_DAE_DEAD_CONTROL_TEST_IDS,
  DA_W7_DAE_VISUAL_VIEWPORT_WIDTHS,
} from '@/domain/da-w7-operator-visual-dae-signoff-display-contract';
import type { EarnHomePageControllerView } from '@/features/earn/use-earn-home-page-controller';
import { dismissBetFirstVisitEducation } from '@/features/responsible-gaming/bet-first-visit-education';
import { dismissTradeFirstVisitEducation } from '@/features/trade/trade-first-visit-education';
import type { SpotDeskWire } from '@/features/trading/use-spot-desk-wire';
import type { TradePageControllerView } from '@/features/trading/use-trade-page-controller';
import { I18nProvider } from '@/product/i18n';
import { AppShell } from '@/product/shell/appshell';
import { EarnHomePage } from '@/product/surfaces/home/earn-home-page';
import { SpotDeskPage } from '@/product/surfaces/trade/spot-desk-page';

const useEarnHomePageControllerMock = vi.hoisted(() => vi.fn());
const useEarnFiatHintMock = vi.hoisted(() => vi.fn());
const useTradePageControllerMock = vi.hoisted(() => vi.fn());
const useSpotDeskWireMock = vi.hoisted(() => vi.fn());
const useTradeDeskViewportMock = vi.hoisted(() =>
  vi.fn(() => ({
    layoutTier: 'desktop' as const,
    isDesktop: true,
    isTablet: false,
    isMobile: false,
  })),
);
const mobileTabsDefaultTab = vi.hoisted(() => ({
  value: 'chart' as 'chart' | 'trade' | 'positions' | 'history',
}));

let mockPathname = '/home';

function makeTradeDeskViewportFromWidth(width: number) {
  const layoutTier = width >= 1024 ? 'desktop' : width >= 768 ? 'tablet' : 'mobile';
  return {
    layoutTier,
    isDesktop: layoutTier === 'desktop',
    isTablet: layoutTier === 'tablet',
    isMobile: layoutTier === 'mobile',
  };
}

vi.mock('@/features/earn/use-earn-home-page-controller', () => ({
  useEarnHomePageController: useEarnHomePageControllerMock,
}));
vi.mock('@/features/earn/use-earn-fiat-hint', () => ({
  useEarnFiatHint: useEarnFiatHintMock,
}));
vi.mock('@/features/trading/use-trade-page-controller', () => ({
  useTradePageController: useTradePageControllerMock,
}));
vi.mock('@/features/trading/use-spot-desk-wire', () => ({
  useSpotDeskWire: useSpotDeskWireMock,
}));
vi.mock('@/features/trading/use-trade-desk-viewport', () => ({
  useTradeDeskViewport: useTradeDeskViewportMock,
}));
vi.mock('@/features/trading/use-trade-oracle-realtime-disconnected', () => ({
  useTradeOracleRealtimeDisconnected: () => false,
  resolveTradeOracleRealtimeDisconnected: () => false,
}));
vi.mock('@/features/trading/market-store/market-data-bridge', () => ({
  MarketDataBridge: () => null,
}));
vi.mock('@/features/trading/use-trade-fiat-hint', () => ({
  useTradeFiatHint: () => ({
    targetFiat: 'OFF',
    hintFor: () => ({
      displayOnly: true,
      disabled: true,
      formattedHint: '',
      targetFiat: 'OFF',
      asOf: '',
      stale: false,
      sourceCurrency: 'USDT',
    }),
    showDisclaimer: false,
  }),
}));
vi.mock('@/product/surfaces/landing/live-activity-ticker', () => ({
  LiveActivityTicker: () => <div data-testid="landing-activity-ticker-mock" />,
}));
vi.mock('@/product/surfaces/trade/chart/trade-chart-panel', () => ({
  TradeChartPanel: ({ marketSymbol }: { marketSymbol: string | null }) => (
    <div data-testid="trade-chart-panel-mock">{marketSymbol ?? 'none'}</div>
  ),
}));
vi.mock('@/product/surfaces/trade/trade-recent-trades-rail', () => ({
  TradeRecentTradesRail: ({ symbol }: { symbol: string | null }) => (
    <div data-testid="trade-recent-trades-rail">{symbol ?? 'none'}</div>
  ),
}));
vi.mock('@/product/surfaces/trade/trade-market-status-banner', () => ({
  TradeMarketStatusBanner: () => <div data-testid="trade-market-status-banner-mock" />,
}));
vi.mock('@/product/surfaces/trade/trade-desk-mobile-tabs', async () => {
  const actual = await vi.importActual<
    typeof import('@/product/surfaces/trade/trade-desk-mobile-tabs')
  >('@/product/surfaces/trade/trade-desk-mobile-tabs');
  return {
    ...actual,
    TradeDeskMobileTabs: (props: React.ComponentProps<typeof actual.TradeDeskMobileTabs>) => (
      <actual.TradeDeskMobileTabs {...props} defaultTab={mobileTabsDefaultTab.value} />
    ),
  };
});
vi.mock('@/product/shell/trade-realtime-feedback-gate', () => ({
  TradeRealtimeFeedbackGate: () => null,
}));
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ session: { user: { id: 'u1', email: 'user@example.com' } }, loading: false }),
}));
vi.mock('@/hooks/use-profile', () => ({
  useProfile: () => ({
    profile: { display_name: 'Test User', username: 'testuser' },
    loading: false,
  }),
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
      children: ReactNode;
      to: string;
      className?: string;
      'data-active'?: string;
      'data-tab'?: string;
      search?: Record<string, unknown>;
    }) => createElement('a', { href: to, ...props }, children),
    useRouterState: (opts?: { select?: (s: { location: { pathname: string } }) => unknown }) =>
      opts?.select?.({ location: { pathname: mockPathname } }) ?? {
        location: { pathname: mockPathname },
      },
  };
});

function makeEarnHome(
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

function makeTradeEngine(
  overrides: Partial<TradePageControllerView> = {},
): TradePageControllerView {
  return {
    t: (key) => String(key),
    authLoading: false,
    walletLoading: false,
    phonAvail: '1000.000000',
    usdtAvail: '250.000000',
    phonBonusAvailableDisplay: '200.000000',
    phonRealAvailableDisplay: '800.000000',
    phonBreakdownLoading: false,
    prices: { PHON_USDT: '0.12' },
    spotMarkets: [
      {
        symbol: 'PHON_USDT',
        display_name: 'PHON/USDT',
        base_asset: 'PHON',
        quote_asset: 'USDT',
        fee_rate: '0.001',
        price_precision: 4,
        quantity_precision: 6,
        min_notional: '1',
        is_active: true,
        sort_order: 1,
      },
    ],
    futuresMarkets: [],
    futuresMarketsLoading: false,
    selectedSpotMarket: null,
    selectedFuturesMarket: null,
    futuresPositions: [],
    positionsLoading: false,
    pricesError: false,
    positionsError: false,
    marketsError: false,
    spotMarketsError: false,
    pricesFetching: false,
    positionsFetching: false,
    oracleStale: false,
    isPriceStale: () => false,
    isPriceFrozen: () => false,
    priceDisplay: '0.1200',
    oraclePriceDisplay: '0.1200',
    oracleMarkUnavailable: false,
    refreshMarkets: vi.fn(),
    refreshFuturesPositions: vi.fn(),
    setSelectedSpotSymbol: vi.fn(),
    setSelectedFuturesSymbol: vi.fn(),
    ...overrides,
  };
}

function makeSpotWire(overrides: Partial<SpotDeskWire> = {}): SpotDeskWire {
  const engine = makeTradeEngine();
  return {
    spotMarkets: engine.spotMarkets,
    market: engine.spotMarkets[0] ?? null,
    baseLabel: 'PHON',
    quoteLabel: 'USDT',
    pairLabel: 'PHON/USDT',
    buyStakeCurrency: 'USDT',
    setBuyStakeCurrency: vi.fn(),
    canSelectPhonBuyStake: false,
    sellReceiveCurrency: 'USDT',
    buyReceiveAsset: 'PHON',
    availBalance: { amount: engine.usdtAvail, currency: 'USDT' },
    price: '0.12',
    priceDisplay: '0.1200',
    lastPriceRaw: '0.12',
    oraclePriceDisplay: '0.1200',
    side: 'buy',
    setSide: vi.fn(),
    amount: '10',
    onAmountInput: vi.fn(),
    usdtAvail: engine.usdtAvail,
    phonAvail: engine.phonAvail,
    phonBonusAvailableDisplay: engine.phonBonusAvailableDisplay,
    phonRealAvailableDisplay: engine.phonRealAvailableDisplay,
    baseHoldingQty: '0',
    estimate: '80',
    estimateCurrency: 'PHON',
    estimateFee: '0.080000',
    estimateFeeCurrency: 'PHON',
    busy: false,
    tradeBlocked: false,
    confirmOpen: false,
    setConfirmOpen: vi.fn(),
    canConfirm: true,
    confirmNotice: undefined,
    submit: vi.fn(),
    requestSubmit: vi.fn(),
    onMarketChange: vi.fn(),
    onBookPriceClick: vi.fn(),
    asks: [],
    bids: [],
    bookFeedStale: false,
    pricePrecision: 4,
    t: engine.t,
    spotOpenOrders: [],
    openOrdersLoading: false,
    fills: [],
    fillsLoading: false,
    cancelOrder: vi.fn(),
    cancellingOrderId: null,
    actionBusy: false,
    orderType: 'market',
    setOrderType: vi.fn(),
    limitPrice: '',
    setLimitPrice: vi.fn(),
    onLimitPriceInput: vi.fn(),
    stopPrice: '',
    setStopPrice: vi.fn(),
    onStopPriceInput: vi.fn(),
    orderPricesReady: true,
    spotCapabilities: {
      limitOrders: true,
      stopOrders: true,
      openOrdersDock: true,
      cancelOpenOrders: true,
    },
    houseCounterpartyAck: {
      acknowledged: true,
      acknowledge: vi.fn(),
      busy: false,
      error: null,
      loading: false,
    },
    earnVipTier: undefined,
    locale: 'ko',
    ...overrides,
  };
}

function wrap(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

async function expectAxeCriticalZero(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  });
  // Radix Tabs aria-controls ids are jsdom-false-positive under axe (P9 trade desk SOT).
  const critical = results.violations.filter((violation) => {
    if (violation.impact !== 'critical') return false;
    if (violation.id === 'aria-valid-attr-value') {
      const radixJsdomFalsePositive = violation.nodes.every(
        (node) =>
          node.html?.includes('radix-') ||
          node.failureSummary?.includes('radix-') ||
          node.target.some((selector) => String(selector).includes('radix-')),
      );
      if (radixJsdomFalsePositive) return false;
    }
    return true;
  });
  expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
}

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
  mockPathname = '/home';
  dismissTradeFirstVisitEducation();
  dismissBetFirstVisitEducation();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );

  useEarnHomePageControllerMock.mockReset();
  useEarnFiatHintMock.mockReset();
  useTradePageControllerMock.mockReset();
  useSpotDeskWireMock.mockReset();
  useTradeDeskViewportMock.mockReset();

  useEarnHomePageControllerMock.mockReturnValue(makeEarnHome());
  useEarnFiatHintMock.mockReturnValue({
    targetFiat: 'OFF' as const,
    hintFor: () => ({
      displayOnly: true as const,
      disabled: true,
      formattedHint: '',
      targetFiat: 'OFF' as const,
      asOf: '',
      stale: false,
      sourceCurrency: 'PHON' as const,
    }),
    showDisclaimer: false,
  });
  useTradePageControllerMock.mockReturnValue(makeTradeEngine());
  useSpotDeskWireMock.mockReturnValue(makeSpotWire());
  useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewportFromWidth(1024));
});

describe('da-w7-operator-visual-dae-signoff §20.12 · Home+Shell+Trade · YAML #235', () => {
  it.each(DA_W7_DAE_VISUAL_VIEWPORT_WIDTHS)(
    'renders EarnHomePage at %ipx viewport without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      wrap(<EarnHomePage />);

      expect(screen.getByTestId('earn-home-page')).toBeInTheDocument();
      expect(screen.getByTestId('earn-home-next-action')).toBeInTheDocument();
      expect(screen.getByTestId('earn-home-signature-flow')).toBeInTheDocument();
    },
  );

  it.each(DA_W7_DAE_VISUAL_VIEWPORT_WIDTHS)(
    'renders AppShell chrome at %ipx viewport without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      wrap(
        <AppShell>
          <div data-testid="dae-shell-page-content">Home stub</div>
        </AppShell>,
      );

      expect(screen.getByTestId('app-topbar')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
      expect(screen.getByTestId('aurora-background')).toBeInTheDocument();
      expect(screen.getByTestId('dae-shell-page-content')).toBeInTheDocument();
    },
  );

  it.each(DA_W7_DAE_VISUAL_VIEWPORT_WIDTHS)(
    'renders SpotDeskPage at %ipx viewport without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewportFromWidth(width));
      wrap(<SpotDeskPage />);

      expect(screen.getByTestId('spot-desk-page')).toBeInTheDocument();
    },
  );

  it('EarnHomePage has axe critical 0 · signature fold · next-action CTA', async () => {
    const { container } = wrap(<EarnHomePage />);

    await expectAxeCriticalZero(container);

    expect(screen.getByTestId('earn-home-signature-flow')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-next-action-cta')).toHaveAttribute(
      'href',
      '/home/attendance',
    );
    expect(screen.getByTestId('earn-home-entry-cta-missions')).toHaveAttribute(
      'href',
      '/home/missions',
    );
  });

  it('AppShell chrome has axe critical 0 · five-tab IA · aurora', async () => {
    const { container } = wrap(
      <AppShell>
        <div>Hub</div>
      </AppShell>,
    );

    await expectAxeCriticalZero(container);

    const nav = screen.getByTestId('bottom-nav');
    expect(nav.querySelectorAll('a')).toHaveLength(5);
    expect(within(nav).getByRole('link', { name: translate('ko', 'nav.earn') })).toHaveAttribute(
      'href',
      '/home',
    );
    expect(screen.getByTestId('aurora-background')).toBeInTheDocument();
    expect(screen.getByTestId('topbar-account-avatar')).toBeInTheDocument();
  });

  it('SpotDeskPage has axe critical 0 · submit control live', async () => {
    useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewportFromWidth(1024));
    const { container } = wrap(<SpotDeskPage />);

    await expectAxeCriticalZero(container);

    expect(screen.getByTestId('spot-desk-page')).toBeInTheDocument();
    expect(screen.getByTestId('spot-submit')).toBeInTheDocument();
  });

  it('declares all dead-control test ids present on Home+Shell+Trade', () => {
    wrap(
      <>
        <EarnHomePage />
        <AppShell>
          <div>chrome</div>
        </AppShell>
        <SpotDeskPage />
      </>,
    );

    for (const testId of DA_W7_DAE_DEAD_CONTROL_TEST_IDS) {
      expect(screen.getByTestId(testId), `missing dead-control id: ${testId}`).toBeInTheDocument();
    }
  });
});
