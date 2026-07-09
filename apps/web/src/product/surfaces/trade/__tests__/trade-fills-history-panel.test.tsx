import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TRADE_FILLS_PAGE_SIZE } from '@/domain/trade-desk-perf-display-contract';
import type { TradingOrderFill } from '@/hooks/use-trading';
import { I18nProvider } from '@/product/i18n';
import { TradeFillsHistoryPanel } from '@/product/surfaces/trade/trade-fills-history-panel';

function makeFill(overrides: Partial<TradingOrderFill> = {}): TradingOrderFill {
  return {
    id: 'fill-1',
    order_id: 'order-1',
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

function renderPanel(fills: TradingOrderFill[] = [makeFill()]) {
  return render(
    <I18nProvider>
      <TradeFillsHistoryPanel fills={fills} t={(key) => String(key)} locale="ko" variant="full" />
    </I18nProvider>,
  );
}

describe('TradeFillsHistoryPanel', () => {
  it('renders fill rows from RPC display fields', () => {
    renderPanel();

    expect(screen.getByTestId('trade-fills-history-panel')).toBeInTheDocument();
    const row = screen.getByTestId('trade-fill-row');
    expect(within(row).getByText('BTCUSDT-SIM')).toBeInTheDocument();
    expect(within(row).getByText('0.0100')).toBeInTheDocument();
    expect(within(row).getByTestId('trade-fill-margin-currency')).toHaveTextContent('USDT');
  });

  it('shows margin_currency column from RPC row (USDT and PHON)', () => {
    renderPanel([
      makeFill({ id: 'fill-usdt', margin_currency: 'USDT' }),
      makeFill({
        id: 'fill-phon',
        margin_currency: 'PHON',
        market: 'ETHUSDT-SIM',
        fee: '12.500000',
      }),
    ]);

    const rows = screen.getAllByTestId('trade-fill-row');
    expect(within(rows[0]!).getByTestId('trade-fill-margin-currency')).toHaveTextContent('USDT');
    expect(within(rows[1]!).getByTestId('trade-fill-margin-currency')).toHaveTextContent('PHON');
  });

  it('shows empty state when no fills', () => {
    renderPanel([]);

    expect(screen.getByText('trade.empty.history')).toBeInTheDocument();
    expect(screen.queryByTestId('trade-fill-row')).not.toBeInTheDocument();
  });

  it('uses tabular nums on numeric cells', () => {
    renderPanel();

    const row = screen.getByTestId('trade-fill-row');
    expect(row.querySelector('.tabular-nums')).toBeTruthy();
  });

  it('paginates fills when row count exceeds page size', () => {
    const fills = Array.from({ length: TRADE_FILLS_PAGE_SIZE + 3 }, (_, index) =>
      makeFill({ id: `fill-${index}`, market: `MKT-${index}` }),
    );
    renderPanel(fills);

    expect(screen.getAllByTestId('trade-fill-row')).toHaveLength(TRADE_FILLS_PAGE_SIZE);
    expect(screen.getByTestId('trade-fills-pagination')).toBeInTheDocument();
    expect(screen.getByText('trade.fills.pagination.summary')).toBeInTheDocument();

    fireEvent.click(screen.getByText('trade.fills.pagination.next'));
    expect(screen.getAllByTestId('trade-fill-row')).toHaveLength(3);
    expect(screen.getByText('MKT-20')).toBeInTheDocument();
  });
});
