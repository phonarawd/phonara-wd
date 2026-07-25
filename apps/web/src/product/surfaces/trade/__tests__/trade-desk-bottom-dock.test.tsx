import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type {
  FuturesPosition,
  FundingPayment,
  TradingOpenOrder,
  TradingOrderFill,
} from '@/hooks/use-trading';
import { I18nProvider } from '@/product/i18n';
import { TradeDeskBottomDock } from '@/product/surfaces/trade/trade-desk-bottom-dock';

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

function makePosition(overrides: Partial<FuturesPosition> = {}): FuturesPosition {
  return {
    id: 'pos-1',
    market: 'BTCUSDT-SIM',
    side: 'long',
    status: 'open',
    entry_price: '64000.000000',
    quantity: '0.0100',
    leverage: '10',
    margin_amount: '64.000000',
    margin_currency: 'USDT',
    liquidation_price: '58000.000000',
    realized_pnl: '0.000000',
    created_at: '2026-07-05T10:00:00.000Z',
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

function makeFundingPayment(overrides: Partial<FundingPayment> = {}): FundingPayment {
  return {
    id: 'fpay-1',
    market: 'BTCUSDT-SIM',
    amount: '-0.640000',
    currency: 'USDT',
    created_at: '2026-07-05T10:00:00.000Z',
    position_id: 'pos-1',
    ...overrides,
  };
}

function renderDock(overrides: Partial<Parameters<typeof TradeDeskBottomDock>[0]> = {}) {
  const onClosePosition = vi.fn();
  const onPartialClosePosition = vi.fn();
  const onAdjustIsolatedMargin = vi.fn();
  const onCancelOrder = vi.fn();
  return {
    onClosePosition,
    onPartialClosePosition,
    onAdjustIsolatedMargin,
    onCancelOrder,
    ...render(
      <I18nProvider>
        <TradeDeskBottomDock
          positions={[makePosition()]}
          orders={[makeOpenOrder()]}
          fills={[makeFill()]}
          fundingPayments={[makeFundingPayment()]}
          t={(key) => String(key)}
          locale="ko"
          onClosePosition={onClosePosition}
          onPartialClosePosition={onPartialClosePosition}
          onAdjustIsolatedMargin={onAdjustIsolatedMargin}
          onCancelOrder={onCancelOrder}
          {...overrides}
        />
      </I18nProvider>,
    ),
  };
}

describe('TradeDeskBottomDock', () => {
  it('renders positions tab with close action by default', () => {
    const { onClosePosition } = renderDock();

    expect(screen.getByTestId('trade-desk-bottom-dock')).toBeInTheDocument();
    expect(screen.getByTestId('futures-positions-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('futures-close-position-pos-1'));
    expect(onClosePosition).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'confirm.proceed' }));
    expect(onClosePosition).toHaveBeenCalledWith('pos-1');
  });

  it('wires margin adjust confirm flow on positions tab', () => {
    const { onAdjustIsolatedMargin } = renderDock();

    fireEvent.click(screen.getByTestId('futures-margin-adjust-pos-1'));
    fireEvent.change(screen.getByTestId('futures-margin-adjust-amount'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'confirm.proceed' }));

    expect(onAdjustIsolatedMargin).toHaveBeenCalledWith('pos-1', '10.000000');
  });

  it('wires partial close confirm flow on positions tab', () => {
    const { onPartialClosePosition } = renderDock();

    fireEvent.click(screen.getByTestId('futures-partial-close-pos-1'));
    fireEvent.click(screen.getByRole('button', { name: 'confirm.proceed' }));

    expect(onPartialClosePosition).toHaveBeenCalledWith('pos-1', '0.5');
  });

  it('shows open orders tab with cancel action', () => {
    const { onCancelOrder } = renderDock({ initialTab: 'openOrders' });

    expect(screen.getByTestId('open-orders-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('open-order-cancel-order-open-1'));
    expect(onCancelOrder).toHaveBeenCalledWith('order-open-1');
  });

  it('shows history tab with fill rows', () => {
    renderDock({ initialTab: 'history' });

    const panel = screen.getByTestId('trade-fills-history-panel');
    expect(within(panel).getByTestId('trade-fill-row')).toBeInTheDocument();
  });

  it('shows funding history sub-tab in history tab', () => {
    renderDock({ initialTab: 'history', initialHistorySubTab: 'funding' });

    const panel = screen.getByTestId('trade-funding-history-panel');
    expect(within(panel).getByTestId('trade-funding-payment-row')).toBeInTheDocument();
  });

  it('shows tab counts from row lengths', () => {
    renderDock({
      positions: [makePosition(), makePosition({ id: 'pos-2', market: 'ETHUSDT-SIM' })],
      orders: [],
      fills: [],
      fundingPayments: [],
    });

    expect(screen.getByTestId('trade-desk-dock-tab-positions')).toHaveTextContent('(2)');
    expect(screen.getByTestId('trade-desk-dock-tab-open-orders')).not.toHaveTextContent('(');
    expect(screen.getByTestId('trade-desk-dock-tab-history')).not.toHaveTextContent('(');
  });

  it('shows skeleton instead of empty state while orders are loading', () => {
    renderDock({ initialTab: 'openOrders', orders: [], ordersLoading: true });

    expect(screen.getByTestId('open-orders-panel-loading')).toBeInTheDocument();
    expect(screen.queryByText('trade.empty.openOrders')).not.toBeInTheDocument();
  });

  it('shows skeleton instead of empty state while funding payments load', () => {
    renderDock({
      initialTab: 'history',
      initialHistorySubTab: 'funding',
      fundingPayments: [],
      fundingPaymentsLoading: true,
    });

    expect(screen.getByTestId('trade-funding-history-panel-loading')).toBeInTheDocument();
    expect(screen.queryByText('trade.empty.fundingHistory')).not.toBeInTheDocument();
  });
});
