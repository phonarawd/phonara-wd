import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FuturesPosition } from '@/hooks/use-trading';
import { I18nProvider } from '@/product/i18n';
import { FuturesPositionsPanel } from '@/product/surfaces/trade/futures-positions-panel';

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

function renderPanel(overrides: Partial<Parameters<typeof FuturesPositionsPanel>[0]> = {}) {
  const onClosePosition = vi.fn();
  const onPartialClosePosition = vi.fn();
  const onAdjustIsolatedMargin = vi.fn();
  const onUpdatePositionSltp = vi.fn();
  return {
    onClosePosition,
    onPartialClosePosition,
    onAdjustIsolatedMargin,
    onUpdatePositionSltp,
    ...render(
      <I18nProvider>
        <FuturesPositionsPanel
          positions={[makeOpenPosition()]}
          t={(key) => String(key)}
          variant="full"
          showHeading={false}
          onClosePosition={onClosePosition}
          onPartialClosePosition={onPartialClosePosition}
          onAdjustIsolatedMargin={onAdjustIsolatedMargin}
          onUpdatePositionSltp={onUpdatePositionSltp}
          {...overrides}
        />
      </I18nProvider>,
    ),
  };
}

describe('FuturesPositionsPanel', () => {
  it('wires full close action in full variant', () => {
    const { onClosePosition } = renderPanel();

    fireEvent.click(screen.getByTestId('futures-close-position-pos-open-1'));
    expect(onClosePosition).toHaveBeenCalledWith('pos-open-1');
  });

  it('opens partial close confirm dialog and submits selected ratio', () => {
    const { onPartialClosePosition } = renderPanel();

    fireEvent.click(screen.getByTestId('futures-partial-close-pos-open-1'));
    expect(screen.getByText('confirm.futuresPartialClose.titleGeneric')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('futures-partial-close-ratio-0.75'));
    fireEvent.click(screen.getByRole('button', { name: 'confirm.proceed' }));

    expect(onPartialClosePosition).toHaveBeenCalledWith('pos-open-1', '0.75');
  });

  it('opens margin adjust confirm dialog and submits add delta', () => {
    const { onAdjustIsolatedMargin } = renderPanel();

    fireEvent.click(screen.getByTestId('futures-margin-adjust-pos-open-1'));
    expect(screen.getByText('confirm.futuresMarginAdjust.title')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('futures-margin-adjust-amount'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'confirm.proceed' }));

    expect(onAdjustIsolatedMargin).toHaveBeenCalledWith('pos-open-1', '10.000000');
  });

  it('submits negative delta when remove direction is selected', () => {
    const { onAdjustIsolatedMargin } = renderPanel();

    fireEvent.click(screen.getByTestId('futures-margin-adjust-pos-open-1'));
    fireEvent.click(screen.getByTestId('futures-margin-adjust-direction-remove'));
    fireEvent.change(screen.getByTestId('futures-margin-adjust-amount'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'confirm.proceed' }));

    expect(onAdjustIsolatedMargin).toHaveBeenCalledWith('pos-open-1', '-5.000000');
  });

  it('hides margin adjust for cross positions', () => {
    renderPanel({
      positions: [makeOpenPosition({ margin_mode: 'cross' })],
    });

    expect(screen.queryByTestId('futures-margin-adjust-pos-open-1')).not.toBeInTheDocument();
  });

  it('hides margin adjust action when capability is disabled', () => {
    renderPanel({ marginAdjustEnabled: false });

    expect(screen.queryByTestId('futures-margin-adjust-pos-open-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('futures-partial-close-pos-open-1')).toBeInTheDocument();
  });

  it('hides partial close action when capability is disabled', () => {
    renderPanel({ partialCloseEnabled: false });

    expect(screen.queryByTestId('futures-partial-close-pos-open-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('futures-close-position-pos-open-1')).toBeInTheDocument();
  });

  it('opens TP/SL edit confirm dialog and submits stop loss and take profit', () => {
    const { onUpdatePositionSltp } = renderPanel();

    fireEvent.click(screen.getByTestId('futures-sltp-edit-pos-open-1'));
    expect(screen.getByText('confirm.futuresSltpEdit.title')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('trade.order.tpEnable'));
    fireEvent.click(screen.getByLabelText('trade.order.slEnable'));
    fireEvent.change(screen.getByTestId('futures-sltp-edit-tp-price'), {
      target: { value: '66000' },
    });
    fireEvent.change(screen.getByTestId('futures-sltp-edit-sl-price'), {
      target: { value: '64000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'confirm.proceed' }));

    expect(onUpdatePositionSltp).toHaveBeenCalledWith('pos-open-1', '64000', '66000');
  });

  it('prefills existing TP/SL values when opening edit dialog', () => {
    renderPanel({
      positions: [
        makeOpenPosition({
          stop_loss: '63000.000000',
          take_profit: '67000.000000',
        }),
      ],
    });

    fireEvent.click(screen.getByTestId('futures-sltp-edit-pos-open-1'));

    expect(screen.getByTestId('futures-sltp-edit-sl-price')).toHaveValue('63000.000000');
    expect(screen.getByTestId('futures-sltp-edit-tp-price')).toHaveValue('67000.000000');
  });

  it('submits null TP/SL when both toggles are disabled', () => {
    const { onUpdatePositionSltp } = renderPanel({
      positions: [
        makeOpenPosition({
          stop_loss: '63000.000000',
          take_profit: '67000.000000',
        }),
      ],
    });

    fireEvent.click(screen.getByTestId('futures-sltp-edit-pos-open-1'));
    fireEvent.click(screen.getByLabelText('trade.order.tpEnable'));
    fireEvent.click(screen.getByLabelText('trade.order.slEnable'));
    fireEvent.click(screen.getByRole('button', { name: 'confirm.proceed' }));

    expect(onUpdatePositionSltp).toHaveBeenCalledWith('pos-open-1', null, null);
  });

  it('hides TP/SL edit action when capability is disabled', () => {
    renderPanel({ sltpEditEnabled: false });

    expect(screen.queryByTestId('futures-sltp-edit-pos-open-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('futures-close-position-pos-open-1')).toBeInTheDocument();
  });

  it('shows current TP/SL values in table columns', () => {
    renderPanel({
      positions: [
        makeOpenPosition({
          stop_loss: '63000.000000',
          take_profit: '67000.000000',
        }),
      ],
    });

    expect(screen.getByTestId('futures-stop-loss-pos-open-1')).toHaveTextContent('63000.000000');
    expect(screen.getByTestId('futures-take-profit-pos-open-1')).toHaveTextContent('67000.000000');
  });

  it('does not render action column in compact variant', () => {
    renderPanel({
      variant: 'compact',
      onClosePosition: undefined,
      onPartialClosePosition: undefined,
    });

    const panel = screen.getByTestId('futures-positions-panel');
    expect(
      within(panel).queryByTestId('futures-close-position-pos-open-1'),
    ).not.toBeInTheDocument();
    expect(within(panel).queryByTestId('futures-partial-close-pos-open-1')).not.toBeInTheDocument();
  });

  it('shows mark-based unrealized PnL and ROE for open positions when oracle mark is wired', () => {
    renderPanel({
      markPrices: { 'BTCUSDT-SIM': '66000.000000' },
    });

    const unrealizedCell = screen.getByTestId('futures-unrealized-pnl-pos-open-1');
    expect(unrealizedCell.textContent).toMatch(/\+10.*USDT/);
    expect(screen.getByTestId('futures-roe-pos-open-1')).toHaveTextContent('15.38%');
    expect(screen.getByTestId('futures-realized-pnl-pos-open-1')).toHaveTextContent('—');
  });

  it('shows em dash for unrealized PnL and ROE when mark RPC is unavailable', () => {
    renderPanel({
      markPrices: {},
      isMarkUnavailable: () => true,
    });

    expect(screen.getByTestId('futures-unrealized-pnl-pos-open-1')).toHaveTextContent('—');
    expect(screen.getByTestId('futures-roe-pos-open-1')).toHaveTextContent('—');
  });

  it('shows realized PnL for closed positions in the PnL column', () => {
    renderPanel({
      positions: [
        makeOpenPosition({
          status: 'closed',
          exit_price: '67000.000000',
          realized_pnl: '20.000000',
          closed_at: '2026-07-05T12:00:00.000Z',
        }),
      ],
      markPrices: { 'BTCUSDT-SIM': '66000.000000' },
      onClosePosition: undefined,
      onPartialClosePosition: undefined,
      onAdjustIsolatedMargin: undefined,
    });

    expect(screen.getByTestId('futures-unrealized-pnl-pos-open-1')).toHaveTextContent('—');
    expect(screen.getByTestId('futures-roe-pos-open-1')).toHaveTextContent('—');
    const realizedCell = screen.getByTestId('futures-realized-pnl-pos-open-1');
    expect(realizedCell.textContent).toMatch(/\+20.*USDT/);
  });
});
