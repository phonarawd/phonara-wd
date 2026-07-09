import axe from 'axe-core';
import type React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  P9_TRADE_DEAD_CONTROL_TEST_IDS,
  P9_TRADE_VISUAL_VIEWPORT_WIDTHS,
} from '@/domain/p9-trade-visual-signoff-display-contract';
import {
  TRADE_DESK_AXE_MOBILE_WIDTH,
  TRADE_DESK_AXE_SURFACES,
} from '@/domain/trade-desk-a11y-display-contract';
import { TRADE_LAUNCH_RC_VIEWPORT_WIDTHS } from '@/domain/trade-desk-launch-rc-display-contract';
import type { StakingPageControllerView } from '@/features/earn/use-staking-page-controller';
import type { StakingPositionsPageControllerView } from '@/features/earn/use-staking-positions-page-controller';
import type { FuturesDeskWire } from '@/features/trading/use-futures-desk-wire';
import type { FuturesOrdersPageControllerView } from '@/features/trading/use-futures-orders-page-controller';
import type { FuturesPositionsPageControllerView } from '@/features/trading/use-futures-positions-page-controller';
import type { SpotDeskWire } from '@/features/trading/use-spot-desk-wire';
import type { TradePageControllerView } from '@/features/trading/use-trade-page-controller';
import type { FuturesPosition, TradingOpenOrder, TradingOrderFill } from '@/hooks/use-trading';
import { I18nProvider } from '@/product/i18n';
import { StakingHubPage } from '@/product/surfaces/staking/staking-hub-page';
import { StakingPositionsPage } from '@/product/surfaces/staking/staking-positions-page';
import { FuturesDeskPage } from '@/product/surfaces/trade/futures-desk-page';
import { FuturesOrdersPage } from '@/product/surfaces/trade/futures-orders-page';
import { FuturesPositionsPage } from '@/product/surfaces/trade/futures-positions-page';
import { SpotDeskPage } from '@/product/surfaces/trade/spot-desk-page';

const useTradePageControllerMock = vi.hoisted(() => vi.fn());
const useSpotDeskWireMock = vi.hoisted(() => vi.fn());
const useFuturesDeskWireMock = vi.hoisted(() => vi.fn());
const useTradeDeskViewportMock = vi.hoisted(() =>
  vi.fn(() => ({
    layoutTier: 'desktop' as const,
    isDesktop: true,
    isTablet: false,
    isMobile: false,
  })),
);

function makeTradeDeskViewportFromWidth(width: number) {
  const layoutTier = width >= 1024 ? 'desktop' : width >= 768 ? 'tablet' : 'mobile';
  return {
    layoutTier,
    isDesktop: layoutTier === 'desktop',
    isTablet: layoutTier === 'tablet',
    isMobile: layoutTier === 'mobile',
  };
}
const useStakingPageControllerMock = vi.hoisted(() => vi.fn());
const useStakingPositionsPageControllerMock = vi.hoisted(() => vi.fn());
const useFuturesPositionsPageControllerMock = vi.hoisted(() => vi.fn());
const useFuturesOrdersPageControllerMock = vi.hoisted(() => vi.fn());
const mobileTabsDefaultTab = vi.hoisted(() => ({
  value: 'chart' as 'chart' | 'trade' | 'positions' | 'history',
}));

vi.mock('@/features/trading/use-trade-page-controller', () => ({
  useTradePageController: useTradePageControllerMock,
}));
vi.mock('@/features/trading/use-spot-desk-wire', () => ({
  useSpotDeskWire: useSpotDeskWireMock,
}));
vi.mock('@/features/trading/use-futures-desk-wire', () => ({
  useFuturesDeskWire: useFuturesDeskWireMock,
}));
vi.mock('@/features/trading/use-trade-desk-viewport', () => ({
  useTradeDeskViewport: useTradeDeskViewportMock,
}));
vi.mock('@/features/earn/use-staking-page-controller', () => ({
  useStakingPageController: useStakingPageControllerMock,
}));
vi.mock('@/features/earn/use-staking-positions-page-controller', () => ({
  useStakingPositionsPageController: useStakingPositionsPageControllerMock,
}));
vi.mock('@/features/trading/use-futures-positions-page-controller', () => ({
  useFuturesPositionsPageController: useFuturesPositionsPageControllerMock,
}));
vi.mock('@/features/trading/use-futures-orders-page-controller', () => ({
  useFuturesOrdersPageController: useFuturesOrdersPageControllerMock,
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
vi.mock('@/features/trading/market-store/market-data-bridge', () => ({
  MarketDataBridge: () => null,
}));
vi.mock('@/features/trading/use-trade-oracle-realtime-disconnected', () => ({
  useTradeOracleRealtimeDisconnected: () => false,
  resolveTradeOracleRealtimeDisconnected: () => false,
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
    prices: { PHON_USDT: '0.12', 'BTCUSDT-SIM': '65000' },
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
    futuresMarkets: [
      {
        symbol: 'BTCUSDT-SIM',
        display_name: 'BTC/USDT Perp',
        base_label: 'BTC',
        quote_label: 'USDT',
        max_leverage: '100',
        price_precision: 2,
        quantity_precision: 4,
        is_active: true,
        sort_order: 1,
      },
    ],
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
    submitBlockedReason: null,
    priceStale: false,
    earnVipTier: 'silver',
    locale: 'ko',
    ...overrides,
  };
}

function makeFuturesWire(overrides: Partial<FuturesDeskWire> = {}): FuturesDeskWire {
  const engine = makeTradeEngine();
  return {
    futuresMarkets: engine.futuresMarkets,
    futuresMarketsLoading: false,
    market: engine.futuresMarkets[0] ?? null,
    price: '65000',
    priceDisplay: '65000.00',
    oraclePriceDisplay: '65000.00',
    oracleMarkUnavailable: false,
    fundingDisplay: '0.01%',
    fundingTone: 'neutral',
    baseLabel: 'BTC',
    pairLabel: 'BTC/USDT Perp',
    asks: [],
    bids: [],
    pricePrecision: 2,
    side: 'long',
    setSide: vi.fn(),
    marginCurrency: 'USDT',
    setMarginCurrency: vi.fn(),
    margin: '100',
    onMarginInput: vi.fn(),
    leverage: '10',
    setLeverage: vi.fn(),
    maxLeverageNum: 100,
    tpEnabled: false,
    setTpEnabled: vi.fn(),
    tpPrice: '',
    setTpPrice: vi.fn(),
    slEnabled: false,
    setSlEnabled: vi.fn(),
    slPrice: '',
    setSlPrice: vi.fn(),
    avail: engine.usdtAvail,
    phonAvail: engine.phonAvail,
    usdtAvail: engine.usdtAvail,
    phonBonusAvailableDisplay: engine.phonBonusAvailableDisplay,
    phonRealAvailableDisplay: engine.phonRealAvailableDisplay,
    preview: {
      notional: '1000',
      openFee: '1',
      liquidationPrice: '58000',
      quantity: '0.01',
    } as FuturesDeskWire['preview'],
    busy: false,
    walletLoading: false,
    tradeBlocked: false,
    isHighLeverage: false,
    riskAck: {
      acknowledged: true,
      acknowledge: vi.fn(),
      busy: false,
      error: null,
      loading: false,
    },
    houseCounterpartyAck: {
      acknowledged: true,
      acknowledge: vi.fn(),
      busy: false,
      error: null,
      loading: false,
    },
    confirmOpen: false,
    setConfirmOpen: vi.fn(),
    canConfirm: true,
    confirmNotice: undefined,
    submitOpen: vi.fn(),
    requestSubmitOpen: vi.fn(),
    onMarketChange: vi.fn(),
    onBookPriceClick: vi.fn(),
    futuresPositions: [],
    positionsLoading: false,
    openOrders: [],
    openOrdersLoading: false,
    fills: [],
    fillsLoading: false,
    fundingPayments: [],
    locale: 'ko',
    cancelOrder: vi.fn(),
    closePosition: vi.fn(),
    cancellingOrderId: null,
    closingPositionId: null,
    actionBusy: false,
    orderType: 'market',
    setOrderType: vi.fn(),
    limitPrice: '',
    setLimitPrice: vi.fn(),
    stopPrice: '',
    setStopPrice: vi.fn(),
    orderPricesReady: true,
    marginMode: 'isolated',
    setMarginMode: vi.fn(),
    marginModeBusy: false,
    crossMarginEnabled: false,
    t: engine.t,
    ...overrides,
  };
}

function makeStakingEngine(
  overrides: Partial<StakingPageControllerView> = {},
): StakingPageControllerView {
  return {
    t: (key) => String(key),
    authLoading: false,
    loading: false,
    poolsError: false,
    positionsError: false,
    tierError: false,
    walletError: false,
    stakingBlocked: false,
    usdtAvailableDisplay: '8000.000000',
    phonAvailableDisplay: '5000.000000',
    availableDisplay: '5000.000000',
    currentTier: 'silver',
    tierApyBonusKey: 'staking.tierApyBonus.silver',
    referenceAssets: ['PHON', 'BTC', 'ETH'],
    selectedReferenceAsset: 'PHON',
    stakeCurrency: 'PHON',
    poolCards: [
      {
        id: 'pool-flex',
        referenceAsset: 'PHON',
        stakeCurrency: 'PHON',
        displayName: 'PHON · PHON Flexible',
        term: 'flexible',
        termLabelKey: 'staking.term.flexible',
        lockDays: 0,
        baseAprDisplay: '3.0%',
        tierApyBonusKey: 'staking.tierApyBonus.silver',
      },
    ],
    selectedPool: null,
    selectedPoolId: 'pool-flex',
    stakeAmount: '100',
    canStake: true,
    stakeBusy: false,
    actionBusy: false,
    activePositions: [],
    confirmOpen: false,
    wizardStep: 'pool',
    submitDisabledReason: null,
    claimBlockedReason: null,
    positionActionsDisabled: false,
    isPositionClaimDisabled: () => false,
    insufficientAvail: false,
    selectReferenceAsset: vi.fn(),
    setStakeCurrency: vi.fn(),
    selectPool: vi.fn(),
    setStakeAmount: vi.fn(),
    openStakeConfirm: vi.fn(),
    closeStakeConfirm: vi.fn(),
    goToWizardStep: vi.fn(),
    wizardNext: vi.fn(),
    wizardBack: vi.fn(),
    confirmStake: vi.fn(),
    unstakePosition: vi.fn(),
    claimReward: vi.fn(),
    refresh: vi.fn(),
    ...overrides,
  };
}

function makeOpenPosition(overrides: Partial<FuturesPosition> = {}): FuturesPosition {
  return {
    id: 'pos-open-1',
    user_id: 'user-1',
    market: 'BTCUSDT-SIM',
    side: 'long',
    status: 'open',
    quantity: '0.0100',
    notional: '650.000000',
    entry_price: '65000.000000',
    exit_price: null,
    leverage: '10',
    margin_amount: '65.000000',
    margin_currency: 'USDT',
    margin_mode: 'isolated',
    liquidation_price: '58000.000000',
    open_fee: '0.650000',
    close_fee: null,
    realized_pnl: null,
    equity_returned: null,
    stop_loss: null,
    take_profit: null,
    opened_at: '2026-07-05T10:00:00.000Z',
    closed_at: null,
    first_breach_at: null,
    first_breach_tick_id: null,
    updated_at: '2026-07-05T10:00:00.000Z',
    ...overrides,
  };
}

function makeFuturesPositionsEngine(
  overrides: Partial<FuturesPositionsPageControllerView> = {},
): FuturesPositionsPageControllerView {
  const openPositions = [makeOpenPosition()];
  return {
    t: (key) => String(key),
    authLoading: false,
    positionsLoading: false,
    positionsFetching: false,
    positionsError: false,
    activeTab: 'open',
    openPositions,
    closedPositions: [],
    openCount: openPositions.length,
    closedCount: 0,
    closeBusy: false,
    closingPositionId: null,
    partialCloseBusy: false,
    partialClosingPositionId: null,
    marginAdjustBusy: false,
    adjustingMarginPositionId: null,
    sltpEditBusy: false,
    updatingSltpPositionId: null,
    markPrices: { 'BTCUSDT-SIM': '65000' },
    isMarkUnavailable: () => false,
    setActiveTab: vi.fn(),
    closePosition: vi.fn(),
    partialClosePosition: vi.fn(),
    adjustIsolatedMargin: vi.fn(),
    updatePositionSltp: vi.fn(),
    refresh: vi.fn(),
    ...overrides,
  };
}

function makeOpenOrder(overrides: Partial<TradingOpenOrder> = {}): TradingOpenOrder {
  return {
    id: 'order-open-1',
    market: 'BTCUSDT-SIM',
    side: 'long',
    order_type: 'limit',
    status: 'open',
    margin_currency: 'USDT',
    price: '64000.000000',
    stop_price: null,
    quantity: '0.0100',
    filled_quantity: '0.0000',
    leverage: '10',
    margin_amount: '64.000000',
    created_at: '2026-07-05T10:00:00.000Z',
    ...overrides,
  };
}

function makeFill(overrides: Partial<TradingOrderFill> = {}): TradingOrderFill {
  return {
    id: 'fill-1',
    order_id: 'order-filled-1',
    fill_price: '64000.000000',
    fill_quantity: '0.0100',
    fee: '0.640000',
    created_at: '2026-07-05T10:00:00.000Z',
    market: 'BTCUSDT-SIM',
    side: 'long',
    order_type: 'limit',
    margin_currency: 'USDT',
    leverage: '10',
    ...overrides,
  };
}

function makeFuturesOrdersEngine(
  overrides: Partial<FuturesOrdersPageControllerView> = {},
): FuturesOrdersPageControllerView {
  const orders = [makeOpenOrder()];
  const fills = [makeFill()];
  return {
    t: (key) => String(key),
    locale: 'ko',
    authLoading: false,
    activeTab: 'open',
    setActiveTab: vi.fn(),
    ordersLoading: false,
    ordersFetching: false,
    ordersError: false,
    orders,
    orderCount: orders.length,
    fillsLoading: false,
    fillsFetching: false,
    fillsError: false,
    fills,
    fillCount: fills.length,
    cancelBusy: false,
    cancellingOrderId: null,
    cancelOrder: vi.fn(),
    refresh: vi.fn(),
    ...overrides,
  };
}

function makeStakingPositionsEngine(
  overrides: Partial<StakingPositionsPageControllerView> = {},
): StakingPositionsPageControllerView {
  return {
    t: (key) => String(key),
    authLoading: false,
    positionsLoading: false,
    positionsError: false,
    activeTab: 'active',
    activePositions: [
      {
        id: 'pos-1',
        referenceAsset: 'PHON',
        stakeCurrency: 'PHON',
        poolLabel: 'PHON Flexible',
        termLabelKey: 'staking.term.days_30',
        principalDisplay: '1000.000000',
        rewardClaimedDisplay: '0.000000',
        pendingRewardDisplay: null,
        aprSnapshotDisplay: '12.0%',
        statusKey: 'staking.position.status.active',
        locked: false,
        unlockAt: null,
      },
    ],
    unstakedPositions: [],
    activeCount: 1,
    unstakedCount: 0,
    actionBusy: false,
    setActiveTab: vi.fn(),
    unstakePosition: vi.fn(),
    claimReward: vi.fn(),
    refresh: vi.fn(),
    ...overrides,
  };
}

async function expectAxeCriticalZero(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  });
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
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  useTradePageControllerMock.mockReset();
  useSpotDeskWireMock.mockReset();
  useFuturesDeskWireMock.mockReset();
  useTradeDeskViewportMock.mockReset();
  useStakingPageControllerMock.mockReset();
  useStakingPositionsPageControllerMock.mockReset();
  useFuturesPositionsPageControllerMock.mockReset();
  useFuturesOrdersPageControllerMock.mockReset();
  useTradePageControllerMock.mockReturnValue(makeTradeEngine());
  useSpotDeskWireMock.mockReturnValue(makeSpotWire());
  useFuturesDeskWireMock.mockReturnValue(makeFuturesWire());
  useStakingPageControllerMock.mockReturnValue(makeStakingEngine());
  useStakingPositionsPageControllerMock.mockReturnValue(makeStakingPositionsEngine());
  useFuturesPositionsPageControllerMock.mockReturnValue(makeFuturesPositionsEngine());
  useFuturesOrdersPageControllerMock.mockReturnValue(makeFuturesOrdersEngine());
  useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewportFromWidth(1024));
  mobileTabsDefaultTab.value = 'chart';
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('p9-trade visual sign-off · §20.12 · §22.2.2 G1–G7', () => {
  it.each(P9_TRADE_VISUAL_VIEWPORT_WIDTHS)(
    'SpotDeskPage mounts at %ipx without layout crash',
    (width) => {
      const viewport = makeTradeDeskViewportFromWidth(width);
      useTradeDeskViewportMock.mockReturnValue(viewport);
      mobileTabsDefaultTab.value = viewport.isDesktop ? 'chart' : 'trade';
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      render(
        <I18nProvider>
          <SpotDeskPage />
        </I18nProvider>,
      );
      expect(screen.getByTestId('spot-desk-page')).toBeInTheDocument();
      expect(screen.getByTestId('trade-market-status-banner-mock')).toBeInTheDocument();
      if (viewport.isDesktop) {
        expect(screen.getByTestId('trade-desk-main-grid')).toBeInTheDocument();
        expect(screen.getByTestId('spot-order-ticket')).toBeInTheDocument();
      } else if (viewport.isTablet) {
        expect(screen.getByTestId('trade-desk-tablet-main-grid')).toBeInTheDocument();
        expect(screen.getByTestId('spot-order-ticket')).toBeInTheDocument();
      } else {
        expect(screen.getByTestId('spot-desk-mobile-tabs')).toBeInTheDocument();
        expect(screen.getByTestId('spot-order-ticket')).toBeInTheDocument();
      }
    },
  );

  it.each(P9_TRADE_VISUAL_VIEWPORT_WIDTHS)(
    'FuturesDeskPage mounts at %ipx without layout crash',
    (width) => {
      const viewport = makeTradeDeskViewportFromWidth(width);
      useTradeDeskViewportMock.mockReturnValue(viewport);
      mobileTabsDefaultTab.value = viewport.isDesktop ? 'chart' : 'trade';
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      render(
        <I18nProvider>
          <FuturesDeskPage />
        </I18nProvider>,
      );
      expect(screen.getByTestId('futures-desk-page')).toBeInTheDocument();
      expect(screen.getByTestId('futures-order-ticket')).toBeInTheDocument();
    },
  );

  it('SpotDeskPage has axe critical 0 and §22.2.2 G7 hedge hidden on futures ticket', async () => {
    useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewportFromWidth(1024));
    const { container, unmount } = render(
      <I18nProvider>
        <SpotDeskPage />
      </I18nProvider>,
    );
    await expectAxeCriticalZero(container);
    expect(screen.getByTestId('spot-order-book-panel')).toBeInTheDocument();
    expect(screen.getByTestId('spot-submit')).toBeInTheDocument();
    unmount();

    render(
      <I18nProvider>
        <FuturesDeskPage />
      </I18nProvider>,
    );
    expect(screen.queryByTestId('hedge-position-mode-toggle')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /hedge/i })).not.toBeInTheDocument();
  });

  it('StakingHubPage mounts at mobile viewport with pool cards and stake form', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    render(
      <I18nProvider>
        <StakingHubPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('staking-hub-page')).toBeInTheDocument();
    expect(screen.getByTestId('staking-pool-pool-flex')).toBeInTheDocument();
    expect(screen.getByTestId('staking-stake-wizard')).toBeInTheDocument();
  });
});

describe('p9-trade visual sign-off · §13.1.1 dual currency spot-check', () => {
  it('shows spot buy stake currency (USDT) and futures USDT/PHON margin selector', () => {
    useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewportFromWidth(1024));
    const { unmount: unmountSpot } = render(
      <I18nProvider>
        <SpotDeskPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('spot-order-ticket-metrics')).toHaveTextContent('USDT');
    unmountSpot();

    render(
      <I18nProvider>
        <FuturesDeskPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('futures-margin-currency-selector')).toBeInTheDocument();
    expect(screen.getByTestId('margin-currency-usdt')).toBeInTheDocument();
    expect(screen.getByTestId('margin-currency-phon')).toBeInTheDocument();
  });

  it('shows margin_currency column on positions · orders · fills (USDT and PHON)', () => {
    useFuturesPositionsPageControllerMock.mockReturnValue(
      makeFuturesPositionsEngine({
        openPositions: [
          makeOpenPosition({ margin_currency: 'USDT' }),
          makeOpenPosition({
            id: 'pos-phon',
            margin_currency: 'PHON',
            margin_amount: '500.000000',
          }),
        ],
        openCount: 2,
      }),
    );
    const { unmount: unmountPositions } = render(
      <I18nProvider>
        <FuturesPositionsPage />
      </I18nProvider>,
    );
    const positionRows = screen.getAllByTestId('futures-position-row');
    expect(within(positionRows[0]!).getAllByText('USDT').length).toBeGreaterThan(0);
    expect(within(positionRows[1]!).getAllByText('PHON').length).toBeGreaterThan(0);
    unmountPositions();

    useFuturesOrdersPageControllerMock.mockReturnValue(
      makeFuturesOrdersEngine({
        orders: [
          makeOpenOrder({ id: 'order-usdt', margin_currency: 'USDT' }),
          makeOpenOrder({ id: 'order-phon', margin_currency: 'PHON' }),
        ],
        orderCount: 2,
      }),
    );
    const { unmount: unmountOrders } = render(
      <I18nProvider>
        <FuturesOrdersPage />
      </I18nProvider>,
    );
    const currencyCells = screen.getAllByTestId('open-order-margin-currency');
    expect(currencyCells[0]).toHaveTextContent('USDT');
    expect(currencyCells[1]).toHaveTextContent('PHON');
    unmountOrders();

    useFuturesOrdersPageControllerMock.mockReturnValue(
      makeFuturesOrdersEngine({
        activeTab: 'history',
        fills: [
          makeFill({ margin_currency: 'USDT' }),
          makeFill({ id: 'fill-phon', margin_currency: 'PHON' }),
        ],
        fillCount: 2,
      }),
    );
    render(
      <I18nProvider>
        <FuturesOrdersPage />
      </I18nProvider>,
    );
    const fillCurrencyCells = screen.getAllByTestId('trade-fill-margin-currency');
    expect(fillCurrencyCells[0]).toHaveTextContent('USDT');
    expect(fillCurrencyCells[1]).toHaveTextContent('PHON');
  });

  it('StakingHubPage shows PHON stake form with stake currency help', () => {
    useStakingPageControllerMock.mockReturnValue(
      makeStakingEngine({
        wizardStep: 'amount',
        selectedPool: {
          id: 'pool-flex',
          reference_asset: 'PHON',
          stake_currency: 'PHON',
          reward_currency: 'PHON',
          display_name: 'PHON · PHON Flexible',
          term: 'flexible',
          lock_days: 0,
          estimated_apr: '0.03',
          is_active: true,
          sort_order: 1,
          created_at: '2026-07-01T00:00:00.000Z',
        },
      }),
    );
    render(
      <I18nProvider>
        <StakingHubPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('staking-stake-wizard')).toBeInTheDocument();
    expect(screen.getByTestId('staking-wizard-panel-amount')).toBeInTheDocument();
    expect(screen.getByTestId('staking-amount-input')).toBeInTheDocument();
    expect(screen.getByTestId('trade-help-tip-stake_currency')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('staking-balance-card')).getByTestId('staking-tier-badge'),
    ).toBeInTheDocument();
  });
});

describe('p9-trade visual sign-off · dead control 0 · §32.7', () => {
  it('wires primary trade and staking CTAs to handlers', () => {
    const requestSubmit = vi.fn();
    const submitOpen = vi.fn();
    const openStakeConfirm = vi.fn();

    useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewportFromWidth(1024));
    useSpotDeskWireMock.mockReturnValue(makeSpotWire({ requestSubmit }));
    useFuturesDeskWireMock.mockReturnValue(makeFuturesWire({ requestSubmitOpen: submitOpen }));
    useStakingPageControllerMock.mockReturnValue(
      makeStakingEngine({ openStakeConfirm, wizardStep: 'confirm' }),
    );

    render(
      <I18nProvider>
        <SpotDeskPage />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByTestId('spot-submit'));
    expect(requestSubmit).toHaveBeenCalledTimes(1);

    const { unmount: unmountFutures } = render(
      <I18nProvider>
        <FuturesDeskPage />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByTestId('futures-submit'));
    expect(submitOpen).toHaveBeenCalledTimes(1);
    unmountFutures();

    render(
      <I18nProvider>
        <StakingHubPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('staking-stake-cta')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('staking-stake-cta'));
    expect(openStakeConfirm).toHaveBeenCalledTimes(1);

    expect(P9_TRADE_DEAD_CONTROL_TEST_IDS).toContain('spot-submit');
    expect(P9_TRADE_DEAD_CONTROL_TEST_IDS).toContain('futures-submit');
    expect(P9_TRADE_DEAD_CONTROL_TEST_IDS).toContain('staking-stake-cta');
  });

  it('wires mobile sticky CTA and staking positions hub link', () => {
    const requestSubmit = vi.fn();
    useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewportFromWidth(390));
    mobileTabsDefaultTab.value = 'trade';
    useSpotDeskWireMock.mockReturnValue(makeSpotWire({ requestSubmit, estimate: '80' }));

    render(
      <I18nProvider>
        <SpotDeskPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('trade-desk-mobile-sticky-cta')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('spot-mobile-sticky-submit'));
    expect(requestSubmit).toHaveBeenCalledTimes(1);

    render(
      <I18nProvider>
        <StakingPositionsPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('staking-positions-hub-link')).toHaveAttribute('href', '/staking');
  });
});

describe('p9-trade visual sign-off · positions · orders · staking-positions routes', () => {
  it.each(P9_TRADE_VISUAL_VIEWPORT_WIDTHS)(
    'FuturesPositionsPage mounts at %ipx without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      render(
        <I18nProvider>
          <FuturesPositionsPage />
        </I18nProvider>,
      );
      expect(screen.getByTestId('futures-positions-page')).toBeInTheDocument();
      expect(screen.getByTestId('futures-positions-panel')).toBeInTheDocument();
    },
  );

  it.each(P9_TRADE_VISUAL_VIEWPORT_WIDTHS)(
    'FuturesOrdersPage mounts at %ipx without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      render(
        <I18nProvider>
          <FuturesOrdersPage />
        </I18nProvider>,
      );
      expect(screen.getByTestId('futures-orders-page')).toBeInTheDocument();
      expect(screen.getByTestId('open-orders-panel')).toBeInTheDocument();
    },
  );

  it.each(P9_TRADE_VISUAL_VIEWPORT_WIDTHS)(
    'StakingPositionsPage mounts at %ipx without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      render(
        <I18nProvider>
          <StakingPositionsPage />
        </I18nProvider>,
      );
      expect(screen.getByTestId('staking-positions-page')).toBeInTheDocument();
      expect(screen.getByTestId('staking-positions-panel')).toBeInTheDocument();
    },
  );

  it('FuturesDeskPage G7 cross margin canary disabled shows reason when flag OFF', () => {
    useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewportFromWidth(1024));
    useFuturesDeskWireMock.mockReturnValue(makeFuturesWire({ crossMarginEnabled: false }));
    render(
      <I18nProvider>
        <FuturesDeskPage />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByText('trade.order.advanced'));
    expect(screen.getByTestId('cross-margin-disabled-reason')).toBeInTheDocument();
    expect(screen.queryByTestId('hedge-position-mode-toggle')).not.toBeInTheDocument();
  });

  it('FuturesOrdersPage and StakingPositionsPage have axe critical 0', async () => {
    const { container: ordersContainer } = render(
      <I18nProvider>
        <FuturesOrdersPage />
      </I18nProvider>,
    );
    await expectAxeCriticalZero(ordersContainer);

    const { container: stakingContainer } = render(
      <I18nProvider>
        <StakingPositionsPage />
      </I18nProvider>,
    );
    await expectAxeCriticalZero(stakingContainer);
  });
});

describe('P3-E trade desk a11y · axe critical 0 all routes', () => {
  it('registers all Launch RC surfaces for axe coverage', () => {
    expect(TRADE_DESK_AXE_SURFACES).toEqual([
      'SpotDeskPage',
      'FuturesDeskPage',
      'FuturesPositionsPage',
      'FuturesOrdersPage',
      'StakingHubPage',
      'StakingPositionsPage',
    ]);
  });

  it('FuturesDeskPage has axe critical 0 at desktop viewport', async () => {
    useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewportFromWidth(1024));
    const { container } = render(
      <I18nProvider>
        <FuturesDeskPage />
      </I18nProvider>,
    );
    await expectAxeCriticalZero(container);
  });

  it('StakingHubPage has axe critical 0 at desktop viewport', async () => {
    const { container } = render(
      <I18nProvider>
        <StakingHubPage />
      </I18nProvider>,
    );
    await expectAxeCriticalZero(container);
  });

  it('FuturesPositionsPage has axe critical 0 at desktop viewport', async () => {
    const { container } = render(
      <I18nProvider>
        <FuturesPositionsPage />
      </I18nProvider>,
    );
    await expectAxeCriticalZero(container);
  });

  it(`SpotDeskPage mobile tabs have axe critical 0 at ${TRADE_DESK_AXE_MOBILE_WIDTH}px`, async () => {
    useTradeDeskViewportMock.mockReturnValue(
      makeTradeDeskViewportFromWidth(TRADE_DESK_AXE_MOBILE_WIDTH),
    );
    mobileTabsDefaultTab.value = 'trade';
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: TRADE_DESK_AXE_MOBILE_WIDTH,
    });
    const { container } = render(
      <I18nProvider>
        <SpotDeskPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('spot-desk-mobile-tabs')).toBeInTheDocument();
    await expectAxeCriticalZero(container);
  });
});

describe('Phase 4 Launch RC · S4 · 375/390/768/1024 layout signoff', () => {
  it.each(TRADE_LAUNCH_RC_VIEWPORT_WIDTHS)(
    'SpotDeskPage mounts at %ipx (Launch RC layout)',
    (width) => {
      const viewport = makeTradeDeskViewportFromWidth(width);
      useTradeDeskViewportMock.mockReturnValue(viewport);
      mobileTabsDefaultTab.value = viewport.isDesktop ? 'chart' : 'trade';
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      render(
        <I18nProvider>
          <SpotDeskPage />
        </I18nProvider>,
      );
      expect(screen.getByTestId('spot-desk-page')).toBeInTheDocument();
      expect(screen.getByTestId('spot-order-ticket')).toBeInTheDocument();
      if (width === 768) {
        expect(screen.getByTestId('trade-desk-tablet-main-grid')).toBeInTheDocument();
      }
    },
  );

  it.each(TRADE_LAUNCH_RC_VIEWPORT_WIDTHS)(
    'FuturesDeskPage mounts at %ipx (Launch RC layout)',
    (width) => {
      const viewport = makeTradeDeskViewportFromWidth(width);
      useTradeDeskViewportMock.mockReturnValue(viewport);
      mobileTabsDefaultTab.value = viewport.isDesktop ? 'chart' : 'trade';
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      render(
        <I18nProvider>
          <FuturesDeskPage />
        </I18nProvider>,
      );
      expect(screen.getByTestId('futures-desk-page')).toBeInTheDocument();
      expect(screen.getByTestId('futures-order-ticket')).toBeInTheDocument();
    },
  );

  it.each(TRADE_LAUNCH_RC_VIEWPORT_WIDTHS)(
    'StakingHubPage mounts at %ipx (Launch RC layout)',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      render(
        <I18nProvider>
          <StakingHubPage />
        </I18nProvider>,
      );
      expect(screen.getByTestId('staking-hub-page')).toBeInTheDocument();
      expect(screen.getByTestId('staking-stake-wizard')).toBeInTheDocument();
    },
  );

  it.each(TRADE_LAUNCH_RC_VIEWPORT_WIDTHS)(
    'StakingPositionsPage mounts at %ipx (Launch RC layout)',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      render(
        <I18nProvider>
          <StakingPositionsPage />
        </I18nProvider>,
      );
      expect(screen.getByTestId('staking-positions-page')).toBeInTheDocument();
      expect(screen.getByTestId('staking-positions-panel')).toBeInTheDocument();
    },
  );
});
