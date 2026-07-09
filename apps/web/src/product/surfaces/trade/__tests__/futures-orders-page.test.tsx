import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FuturesOrdersPageControllerView } from '@/features/trading/use-futures-orders-page-controller';
import type { TradingOpenOrder, TradingOrderFill } from '@/hooks/use-trading';
import { I18nProvider } from '@/product/i18n';
import { FuturesOrdersPage } from '@/product/surfaces/trade/futures-orders-page';

const useFuturesOrdersPageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/trading/use-futures-orders-page-controller', () => ({
  useFuturesOrdersPageController: useFuturesOrdersPageControllerMock,
}));

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

function makeEngine(
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

function renderPage(engine = makeEngine()) {
  useFuturesOrdersPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <FuturesOrdersPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useFuturesOrdersPageControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('FuturesOrdersPage', () => {
  it('renders orders page shell with open orders and history tabs', () => {
    renderPage();

    expect(screen.getByTestId('futures-orders-page')).toBeInTheDocument();
    expect(screen.getByTestId('futures-orders-tab-open')).toBeInTheDocument();
    expect(screen.getByTestId('futures-orders-tab-history')).toBeInTheDocument();
    expect(screen.getByTestId('open-orders-panel')).toBeInTheDocument();
    expect(screen.getByTestId('open-order-row')).toBeInTheDocument();
  });

  it('shows fill history panel on history tab', () => {
    renderPage(makeEngine({ activeTab: 'history' }));

    expect(screen.getByTestId('trade-fills-history-panel')).toBeInTheDocument();
    expect(screen.getByTestId('trade-fill-row')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('trade-fill-row')).getByTestId('trade-fill-margin-currency'),
    ).toHaveTextContent('USDT');
  });

  it('shows loading shell while orders load', () => {
    renderPage(makeEngine({ ordersLoading: true }));
    expect(screen.getByTestId('futures-orders-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('futures-orders-page')).not.toBeInTheDocument();
  });

  it('shows loading shell while fills load', () => {
    renderPage(makeEngine({ fillsLoading: true }));
    expect(screen.getByTestId('futures-orders-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('futures-orders-page')).not.toBeInTheDocument();
  });

  it('shows retry panel when orders fail to load', () => {
    const refresh = vi.fn();
    renderPage(makeEngine({ ordersError: true, refresh }));

    expect(screen.getByTestId('futures-orders-error')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'common.retry' }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('wires cancel action for open orders', () => {
    const cancelOrder = vi.fn();
    renderPage(makeEngine({ cancelOrder }));

    fireEvent.click(screen.getByTestId('open-order-cancel-order-open-1'));
    expect(cancelOrder).toHaveBeenCalledWith('order-open-1');
  });

  it('shows margin_currency column from RPC row (USDT and PHON)', () => {
    renderPage(
      makeEngine({
        orders: [
          makeOpenOrder({ id: 'order-usdt', margin_currency: 'USDT' }),
          makeOpenOrder({ id: 'order-phon', margin_currency: 'PHON', margin_amount: '500.000000' }),
        ],
        orderCount: 2,
      }),
    );

    const currencyCells = screen.getAllByTestId('open-order-margin-currency');
    expect(currencyCells).toHaveLength(2);
    expect(currencyCells[0]).toHaveTextContent('USDT');
    expect(currencyCells[1]).toHaveTextContent('PHON');
  });

  it('shows empty state when no open orders', () => {
    renderPage(makeEngine({ orders: [], orderCount: 0 }));

    expect(screen.getByText('trade.empty.openOrders')).toBeInTheDocument();
    expect(screen.queryByTestId('open-order-row')).not.toBeInTheDocument();
  });
});
