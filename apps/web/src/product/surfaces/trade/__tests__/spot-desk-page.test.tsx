import { fireEvent, render, screen, within } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { filterSpotDeskOpenOrders } from '@/domain/spot-stake-display-contract';
import type { SpotDeskWire } from '@/features/trading/use-spot-desk-wire';
import type { TradePageControllerView } from '@/features/trading/use-trade-page-controller';
import type { TradingOpenOrder } from '@/hooks/use-trading';
import { I18nProvider } from '@/product/i18n';
import { SpotDeskPage } from '@/product/surfaces/trade/spot-desk-page';

import { TRADE_DESK_TABLET_MAIN_GRID_TESTID } from '@/domain/trade-mobile-layout-display-contract';

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

function makeTradeDeskViewport(layoutTier: 'mobile' | 'tablet' | 'desktop' = 'desktop') {
  return {
    layoutTier,
    isDesktop: layoutTier === 'desktop',
    isTablet: layoutTier === 'tablet',
    isMobile: layoutTier === 'mobile',
  };
}

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
  TradeMarketStatusBanner: ({
    desk,
    marketSymbol,
    symbolStale,
  }: {
    desk: string;
    marketSymbol: string | null;
    symbolStale: boolean;
  }) => (
    <div
      data-testid="trade-market-status-banner-mock"
      data-desk={desk}
      data-symbol={marketSymbol ?? 'none'}
      data-stale={String(symbolStale)}
    />
  ),
}));

function makeEngine(overrides: Partial<TradePageControllerView> = {}): TradePageControllerView {
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

function makeSpotOpenOrder(overrides: Partial<TradingOpenOrder> = {}): TradingOpenOrder {
  return {
    id: 'spot-order-1',
    market: 'PHON_USDT',
    side: 'long',
    order_type: 'limit',
    status: 'open',
    margin_currency: 'USDT',
    price: '0.120000',
    stop_price: null,
    quantity: '100.000000',
    filled_quantity: '0.000000',
    leverage: '1',
    margin_amount: '12.000000',
    created_at: '2026-07-05T10:00:00.000Z',
    ...overrides,
  };
}

function makeWire(overrides: Partial<SpotDeskWire> = {}): SpotDeskWire {
  const engine = makeEngine();
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

function renderPage(engine = makeEngine(), wire = makeWire()) {
  useTradePageControllerMock.mockReturnValue(engine);
  useSpotDeskWireMock.mockReturnValue(wire);
  return render(
    <I18nProvider>
      <SpotDeskPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useTradePageControllerMock.mockReset();
  useSpotDeskWireMock.mockReset();
  useTradeDeskViewportMock.mockReset();
  useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewport('desktop'));
  mobileTabsDefaultTab.value = 'chart';
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('SpotDeskPage', () => {
  it('renders spot desk shell with market header and chart panel', () => {
    renderPage();

    const page = screen.getByTestId('spot-desk-page');
    expect(page).toBeInTheDocument();
    expect(page).toHaveClass('trade-desk-page');
    expect(screen.getByTestId('spot-market-header')).toBeInTheDocument();
    expect(screen.getByTestId('trade-desk-main-grid')).toHaveClass('trade-desk-main-grid');
    expect(screen.getByTestId('trade-chart-panel-mock')).toHaveTextContent('PHON_USDT');
    expect(screen.queryAllByTestId('trade-chart-panel-mock')).toHaveLength(1);
  });

  it('shows desktop order book, recent trades rail, and ticket panels', () => {
    renderPage();

    expect(screen.getByTestId('spot-order-book-panel')).toBeInTheDocument();
    expect(screen.getByTestId('trade-recent-trades-rail')).toHaveTextContent('PHON_USDT');
    expect(screen.getByTestId('spot-order-ticket')).toBeInTheDocument();
  });

  it('renders mobile 4-tab shell with history tab and trade stack', () => {
    useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewport('mobile'));
    renderPage();

    const mobile = screen.getByTestId('spot-desk-mobile-tabs');
    expect(mobile).toHaveClass('md:hidden');
    expect(screen.queryByTestId('trade-desk-main-grid')).not.toBeInTheDocument();
    expect(screen.getByTestId('trade-desk-mobile-tab-chart')).toBeInTheDocument();
    expect(screen.getByTestId('trade-desk-mobile-tab-trade')).toBeInTheDocument();
    expect(screen.getByTestId('trade-desk-mobile-tab-history')).toBeInTheDocument();
    expect(screen.queryAllByTestId('trade-chart-panel-mock')).toHaveLength(1);
  });

  it('renders tablet chart+ticket 2-col shell at 768–1023 (P2-A)', () => {
    useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewport('tablet'));
    renderPage();

    expect(screen.getByTestId('spot-desk-tablet-layout')).toBeInTheDocument();
    expect(screen.getByTestId(TRADE_DESK_TABLET_MAIN_GRID_TESTID)).toHaveClass(
      'trade-desk-tablet-main-grid',
    );
    expect(screen.getByTestId('spot-order-ticket')).toBeInTheDocument();
    // Phase 2: tablet ticket uses primarySubmit=external — single sticky CTA only.
    expect(screen.queryByTestId('spot-submit')).not.toBeInTheDocument();
    expect(screen.getByTestId('spot-mobile-sticky-submit')).toBeInTheDocument();
    expect(screen.queryByTestId('trade-desk-main-grid')).not.toBeInTheDocument();
    expect(screen.queryByTestId('spot-desk-mobile-tabs')).not.toBeInTheDocument();
    expect(screen.queryAllByTestId('trade-chart-panel-mock')).toHaveLength(1);
  });

  it('disables submit when trade is blocked', () => {
    renderPage(makeEngine(), makeWire({ tradeBlocked: true, estimate: '80' }));

    expect(screen.getByTestId('spot-submit')).toBeDisabled();
  });

  it('shows loading shell while wallet loads', () => {
    renderPage(makeEngine({ walletLoading: true }));

    expect(screen.getByTestId('spot-desk-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('spot-desk-page')).not.toBeInTheDocument();
  });

  it('renders last price from controller display', () => {
    renderPage(
      makeEngine({ priceDisplay: '0.1250' }),
      makeWire({ priceDisplay: '0.1250', oraclePriceDisplay: '0.1250' }),
    );

    expect(
      within(screen.getByTestId('spot-market-header')).getByTestId('spot-last-price'),
    ).toHaveTextContent('0.1250');
  });

  it('shows desktop open orders dock with cancel when capability is on (P2-4)', () => {
    const cancelOrder = vi.fn();
    renderPage(
      makeEngine(),
      makeWire({
        spotOpenOrders: [makeSpotOpenOrder()],
        cancelOrder,
      }),
    );

    const dock = screen.getByTestId('trade-desk-bottom-dock');
    expect(dock).toHaveAttribute('data-desk-variant', 'spot');
    expect(within(dock).getByTestId('open-orders-panel')).toBeInTheDocument();
    fireEvent.click(within(dock).getByTestId('open-order-cancel-spot-order-1'));
    expect(cancelOrder).toHaveBeenCalledWith('spot-order-1');
  });

  it('wires mobile history cancel through wire.cancelOrder (A1)', () => {
    const cancelOrder = vi.fn();
    useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewport('mobile'));
    mobileTabsDefaultTab.value = 'history';
    renderPage(
      makeEngine(),
      makeWire({
        spotOpenOrders: [makeSpotOpenOrder()],
        cancelOrder,
      }),
    );

    const historyStack = screen.getByTestId('trade-desk-mobile-history-stack');
    expect(within(historyStack).getByTestId('open-orders-panel')).toBeInTheDocument();
    fireEvent.click(within(historyStack).getByTestId('open-order-cancel-spot-order-1'));
    expect(cancelOrder).toHaveBeenCalledWith('spot-order-1');
  });

  describe('A2 — single chart mount (viewport conditional)', () => {
    it('mounts exactly one chart on lg+ and omits mobile/tablet shells', () => {
      useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewport('desktop'));
      renderPage();

      expect(screen.queryAllByTestId('trade-chart-panel-mock')).toHaveLength(1);
      expect(screen.getByTestId('trade-desk-main-grid')).toBeInTheDocument();
      expect(screen.queryByTestId('spot-desk-mobile-tabs')).not.toBeInTheDocument();
      expect(screen.queryByTestId('spot-desk-tablet-layout')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trade-desk-mobile-tab-chart')).not.toBeInTheDocument();
    });

    it('mounts exactly one chart on tablet and omits desktop grid + mobile tabs', () => {
      useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewport('tablet'));
      renderPage();

      expect(screen.queryAllByTestId('trade-chart-panel-mock')).toHaveLength(1);
      expect(screen.getByTestId(TRADE_DESK_TABLET_MAIN_GRID_TESTID)).toBeInTheDocument();
      expect(screen.queryByTestId('trade-desk-main-grid')).not.toBeInTheDocument();
      expect(screen.queryByTestId('spot-desk-mobile-tabs')).not.toBeInTheDocument();
    });

    it('mounts exactly one chart on mobile and omits desktop/tablet grids', () => {
      useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewport('mobile'));
      renderPage();

      expect(screen.queryAllByTestId('trade-chart-panel-mock')).toHaveLength(1);
      expect(screen.queryByTestId('trade-desk-main-grid')).not.toBeInTheDocument();
      expect(screen.queryByTestId('spot-desk-tablet-layout')).not.toBeInTheDocument();
      expect(screen.getByTestId('spot-desk-mobile-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('trade-desk-mobile-tab-chart')).toBeInTheDocument();
    });
  });

  it('shows fetch error banner with retry when prices fail to load (P0-1)', () => {
    const refreshMarkets = vi.fn();
    renderPage(makeEngine({ pricesError: true, refreshMarkets }));

    expect(screen.getByTestId('trade-desk-fetch-error')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(refreshMarkets).toHaveBeenCalledTimes(1);
  });

  it('shows fetch error banner when spot markets fail to load (P0-1)', () => {
    const refreshMarkets = vi.fn();
    renderPage(makeEngine({ spotMarketsError: true, refreshMarkets }));

    expect(screen.getByTestId('trade-desk-fetch-error')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(refreshMarkets).toHaveBeenCalledTimes(1);
  });

  it('shows whitelisted spot open orders in mobile history without futures symbols (A1)', () => {
    const spotSymbols = new Set(['PHON_USDT', 'BTC_USDT']);
    useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewport('mobile'));
    const mixedOrders = [
      makeSpotOpenOrder({ id: 'spot-phon', market: 'PHON_USDT' }),
      makeSpotOpenOrder({ id: 'futures-phon', market: 'PHONUSDT-PERP' }),
      makeSpotOpenOrder({ id: 'futures-btc', market: 'BTCUSDT-SIM' }),
      makeSpotOpenOrder({ id: 'spot-btc', market: 'BTC_USDT' }),
    ];
    const spotOpenOrders = filterSpotDeskOpenOrders(mixedOrders, spotSymbols);

    mobileTabsDefaultTab.value = 'history';
    renderPage(makeEngine(), makeWire({ spotOpenOrders }));

    const historyStack = screen.getByTestId('trade-desk-mobile-history-stack');
    expect(within(historyStack).getByTestId('open-order-cancel-spot-phon')).toBeInTheDocument();
    expect(within(historyStack).getByTestId('open-order-cancel-spot-btc')).toBeInTheDocument();
    expect(
      within(historyStack).queryByTestId('open-order-cancel-futures-phon'),
    ).not.toBeInTheDocument();
    expect(
      within(historyStack).queryByTestId('open-order-cancel-futures-btc'),
    ).not.toBeInTheDocument();
    expect(within(historyStack).queryByText('PHONUSDT-PERP')).not.toBeInTheDocument();
    expect(within(historyStack).queryByText('BTCUSDT-SIM')).not.toBeInTheDocument();
  });
});
