import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FuturesPosition } from '@/hooks/use-trading';
import type { FuturesPositionsPageControllerView } from '@/features/trading/use-futures-positions-page-controller';
import { I18nProvider } from '@/product/i18n';
import { FuturesPositionsPage } from '@/product/surfaces/trade/futures-positions-page';

const useFuturesPositionsPageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/trading/use-futures-positions-page-controller', () => ({
  useFuturesPositionsPageController: useFuturesPositionsPageControllerMock,
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

function makeClosedPosition(overrides: Partial<FuturesPosition> = {}): FuturesPosition {
  return makeOpenPosition({
    id: 'pos-closed-1',
    status: 'closed',
    exit_price: '66000.000000',
    close_fee: '0.660000',
    realized_pnl: '8.500000',
    equity_returned: '73.500000',
    closed_at: '2026-07-05T12:00:00.000Z',
    ...overrides,
  });
}

function makeEngine(
  overrides: Partial<FuturesPositionsPageControllerView> = {},
): FuturesPositionsPageControllerView {
  const openPositions = [makeOpenPosition()];
  const closedPositions = [makeClosedPosition()];
  return {
    t: (key) => String(key),
    authLoading: false,
    positionsLoading: false,
    positionsFetching: false,
    positionsError: false,
    activeTab: 'open',
    openPositions,
    closedPositions,
    openCount: openPositions.length,
    closedCount: closedPositions.length,
    closeBusy: false,
    closingPositionId: null,
    partialCloseBusy: false,
    partialClosingPositionId: null,
    marginAdjustBusy: false,
    adjustingMarginPositionId: null,
    sltpEditBusy: false,
    updatingSltpPositionId: null,
    setActiveTab: vi.fn(),
    closePosition: vi.fn(),
    partialClosePosition: vi.fn(),
    adjustIsolatedMargin: vi.fn(),
    updatePositionSltp: vi.fn(),
    markPrices: {},
    isMarkUnavailable: () => false,
    refresh: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine = makeEngine()) {
  useFuturesPositionsPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <FuturesPositionsPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useFuturesPositionsPageControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('FuturesPositionsPage', () => {
  it('renders positions page shell with open positions table', () => {
    renderPage();

    expect(screen.getByTestId('futures-positions-page')).toBeInTheDocument();
    expect(screen.getByTestId('futures-positions-tab-open')).toBeInTheDocument();
    expect(screen.getByTestId('futures-positions-panel')).toBeInTheDocument();
    expect(screen.getByTestId('futures-position-row')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('futures-positions-panel')).getByText('BTCUSDT-SIM'),
    ).toBeInTheDocument();
  });

  it('shows loading shell while positions load', () => {
    renderPage(makeEngine({ positionsLoading: true }));

    expect(screen.getByTestId('futures-positions-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('futures-positions-page')).not.toBeInTheDocument();
  });

  it('shows retry panel when positions fail to load', () => {
    const refresh = vi.fn();
    renderPage(makeEngine({ positionsError: true, refresh }));

    expect(screen.getByTestId('futures-positions-error')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'common.retry' }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('wires margin adjust confirm flow for open positions', () => {
    const adjustIsolatedMargin = vi.fn();
    renderPage(makeEngine({ adjustIsolatedMargin }));

    fireEvent.click(screen.getByTestId('futures-margin-adjust-pos-open-1'));
    fireEvent.change(screen.getByTestId('futures-margin-adjust-amount'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'confirm.proceed' }));

    expect(adjustIsolatedMargin).toHaveBeenCalledWith('pos-open-1', '10.000000');
  });

  it('wires partial close confirm flow for open positions', () => {
    const partialClosePosition = vi.fn();
    renderPage(makeEngine({ partialClosePosition }));

    fireEvent.click(screen.getByTestId('futures-partial-close-pos-open-1'));
    fireEvent.click(screen.getByRole('button', { name: 'confirm.proceed' }));

    expect(partialClosePosition).toHaveBeenCalledWith('pos-open-1', '0.5');
  });

  it('wires close action for open positions', () => {
    const closePosition = vi.fn();
    renderPage(makeEngine({ closePosition }));

    fireEvent.click(screen.getByTestId('futures-close-position-pos-open-1'));
    expect(closePosition).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'confirm.proceed' }));
    expect(closePosition).toHaveBeenCalledWith('pos-open-1');
  });

  it('wires TP/SL edit confirm flow for open positions', () => {
    const updatePositionSltp = vi.fn();
    renderPage(makeEngine({ updatePositionSltp }));

    fireEvent.click(screen.getByTestId('futures-sltp-edit-pos-open-1'));
    fireEvent.click(screen.getByLabelText('trade.order.tpEnable'));
    fireEvent.click(screen.getByLabelText('trade.order.slEnable'));
    fireEvent.change(screen.getByTestId('futures-sltp-edit-tp-price'), {
      target: { value: '66000' },
    });
    fireEvent.change(screen.getByTestId('futures-sltp-edit-sl-price'), {
      target: { value: '64000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'confirm.proceed' }));

    expect(updatePositionSltp).toHaveBeenCalledWith('pos-open-1', '64000', '66000');
  });

  it('renders closed positions when active tab is closed', () => {
    renderPage(
      makeEngine({
        activeTab: 'closed',
        openPositions: [],
        closedPositions: [makeClosedPosition()],
        openCount: 0,
        closedCount: 1,
      }),
    );

    expect(screen.getByTestId('futures-positions-tab-closed')).toBeInTheDocument();
    expect(screen.getByTestId('futures-position-row')).toBeInTheDocument();
    expect(screen.queryByTestId('futures-close-position-pos-closed-1')).not.toBeInTheDocument();
  });
});
