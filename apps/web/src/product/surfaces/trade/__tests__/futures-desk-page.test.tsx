import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FuturesDeskWire } from '@/features/trading/use-futures-desk-wire';
import type { TradePageControllerView } from '@/features/trading/use-trade-page-controller';
import { I18nProvider } from '@/product/i18n';
import { FuturesDeskPage } from '@/product/surfaces/trade/futures-desk-page';

const useTradePageControllerMock = vi.hoisted(() => vi.fn());
const useFuturesDeskWireMock = vi.hoisted(() => vi.fn());
const useTradeDeskViewportMock = vi.hoisted(() =>
  vi.fn(() => ({
    layoutTier: 'desktop' as const,
    isDesktop: true,
    isTablet: false,
    isMobile: false,
  })),
);

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

vi.mock('@/features/trading/use-futures-desk-wire', () => ({
  useFuturesDeskWire: useFuturesDeskWireMock,
}));

vi.mock('@/features/trading/use-trade-desk-viewport', () => ({
  useTradeDeskViewport: useTradeDeskViewportMock,
}));

vi.mock('@/features/trading/use-trade-oracle-realtime-disconnected', () => ({
  useTradeOracleRealtimeDisconnected: () => false,
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
    prices: { 'BTCUSDT-SIM': '65000' },
    spotMarkets: [],
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
    priceDisplay: '65000.00',
    oraclePriceDisplay: '65000.00',
    oracleMarkUnavailable: false,
    refreshMarkets: vi.fn(),
    refreshFuturesPositions: vi.fn(),
    setSelectedSpotSymbol: vi.fn(),
    setSelectedFuturesSymbol: vi.fn(),
    ...overrides,
  };
}

function makeWire(overrides: Partial<FuturesDeskWire> = {}): FuturesDeskWire {
  const engine = makeEngine();
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
    bookFeedStale: false,
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
    preview: null,
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
    fundingPaymentsLoading: false,
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

function renderPage(engine = makeEngine(), wire = makeWire()) {
  useTradePageControllerMock.mockReturnValue(engine);
  useFuturesDeskWireMock.mockReturnValue(wire);
  return render(
    <I18nProvider>
      <FuturesDeskPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useTradePageControllerMock.mockReset();
  useFuturesDeskWireMock.mockReset();
  useTradeDeskViewportMock.mockReset();
  useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewport('desktop'));
  window.localStorage.setItem('phonara.locale', 'ko');
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe('FuturesDeskPage', () => {
  it('renders futures desk shell with market header and chart panel', () => {
    renderPage();

    const page = screen.getByTestId('futures-desk-page');
    expect(page).toBeInTheDocument();
    expect(page).toHaveClass('trade-desk-page');
    expect(screen.getByTestId('futures-market-header')).toBeInTheDocument();
    expect(screen.getByTestId('trade-desk-main-grid')).toHaveClass('trade-desk-main-grid');
    expect(screen.getByTestId('trade-chart-panel-mock')).toHaveTextContent('BTCUSDT-SIM');
    expect(screen.queryAllByTestId('trade-chart-panel-mock')).toHaveLength(1);
  });

  it('shows desktop order book, futures ticket, recent trades rail, and bottom dock', () => {
    renderPage();

    expect(screen.getByTestId('spot-order-book-panel')).toBeInTheDocument();
    expect(screen.getByTestId('trade-recent-trades-rail')).toHaveTextContent('BTCUSDT-SIM');
    expect(screen.getByTestId('futures-order-ticket')).toBeInTheDocument();
    expect(screen.getByTestId('trade-desk-bottom-dock')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('trade-desk-bottom-dock')).getByTestId('futures-positions-panel'),
    ).toBeInTheDocument();
  });

  it('renders mobile 4-tab shell and hides bottom dock below lg', () => {
    useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewport('mobile'));
    renderPage();

    const mobile = screen.getByTestId('futures-desk-mobile-tabs');
    expect(mobile).toHaveClass('md:hidden');
    expect(screen.queryByTestId('trade-desk-main-grid')).not.toBeInTheDocument();
    expect(screen.queryByTestId('trade-desk-bottom-dock')).not.toBeInTheDocument();
    expect(screen.getByTestId('trade-desk-mobile-tab-trade')).toBeInTheDocument();
    expect(screen.getByTestId('trade-desk-mobile-tab-history')).toBeInTheDocument();
    expect(screen.queryAllByTestId('trade-chart-panel-mock')).toHaveLength(1);
  });

  it('disables submit when trade is blocked', () => {
    renderPage(makeEngine(), makeWire({ tradeBlocked: true }));

    expect(screen.getByTestId('futures-submit')).toBeDisabled();
  });

  it('shows loading shell while futures markets load', () => {
    renderPage(
      makeEngine({ futuresMarketsLoading: true }),
      makeWire({ futuresMarketsLoading: true }),
    );

    expect(screen.getByTestId('futures-desk-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('futures-desk-page')).not.toBeInTheDocument();
  });

  it('renders last price from wire display', () => {
    renderPage(makeEngine(), makeWire({ priceDisplay: '65100.00' }));

    expect(
      within(screen.getByTestId('futures-market-header')).getByTestId('futures-last-price'),
    ).toHaveTextContent('65100.00');
  });

  it('shows fetch error banner with retry when prices fail to load (P0-1)', () => {
    const refreshMarkets = vi.fn();
    renderPage(makeEngine({ pricesError: true, refreshMarkets }));

    expect(screen.getByTestId('trade-desk-fetch-error')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(refreshMarkets).toHaveBeenCalledTimes(1);
  });

  it('shows fetch error banner when futures markets fail to load (P0-1)', () => {
    const refreshMarkets = vi.fn();
    renderPage(makeEngine({ marketsError: true, refreshMarkets }));

    expect(screen.getByTestId('trade-desk-fetch-error')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(refreshMarkets).toHaveBeenCalledTimes(1);
  });

  describe('A2 — single chart mount (viewport conditional)', () => {
    it('mounts exactly one chart on lg+ and omits mobile tab shell', () => {
      useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewport('desktop'));
      renderPage();

      expect(screen.queryAllByTestId('trade-chart-panel-mock')).toHaveLength(1);
      expect(screen.getByTestId('trade-desk-main-grid')).toBeInTheDocument();
      expect(screen.queryByTestId('futures-desk-mobile-tabs')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trade-desk-mobile-tab-chart')).not.toBeInTheDocument();
    });

    it('mounts exactly one chart below lg and omits desktop main grid', () => {
      useTradeDeskViewportMock.mockReturnValue(makeTradeDeskViewport('mobile'));
      renderPage();

      expect(screen.queryAllByTestId('trade-chart-panel-mock')).toHaveLength(1);
      expect(screen.queryByTestId('trade-desk-main-grid')).not.toBeInTheDocument();
      expect(screen.getByTestId('futures-desk-mobile-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('trade-desk-mobile-tab-chart')).toBeInTheDocument();
    });
  });
});
