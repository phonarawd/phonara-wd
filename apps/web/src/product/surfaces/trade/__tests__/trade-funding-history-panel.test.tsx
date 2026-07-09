import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { FundingPayment } from '@/hooks/use-trading';
import { I18nProvider } from '@/product/i18n';
import { TradeFundingHistoryPanel } from '@/product/surfaces/trade/trade-funding-history-panel';

function makePayment(overrides: Partial<FundingPayment> = {}): FundingPayment {
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

function renderPanel(payments: FundingPayment[] = [makePayment()]) {
  return render(
    <I18nProvider>
      <TradeFundingHistoryPanel
        payments={payments}
        t={(key) => String(key)}
        locale="ko"
        variant="full"
      />
    </I18nProvider>,
  );
}

describe('TradeFundingHistoryPanel', () => {
  it('renders funding payment rows from RPC display fields', () => {
    renderPanel();

    expect(screen.getByTestId('trade-funding-history-panel')).toBeInTheDocument();
    const row = screen.getByTestId('trade-funding-payment-row');
    expect(within(row).getByText('BTCUSDT-SIM')).toBeInTheDocument();
    expect(within(row).getByTestId('trade-funding-payment-currency')).toHaveTextContent('USDT');
  });

  it('shows empty state when no payments', () => {
    renderPanel([]);

    expect(screen.getByText('trade.empty.fundingHistory')).toBeInTheDocument();
    expect(screen.queryByTestId('trade-funding-payment-row')).not.toBeInTheDocument();
  });

  it('shows skeleton instead of empty state while funding payments load', () => {
    render(
      <I18nProvider>
        <TradeFundingHistoryPanel
          payments={[]}
          t={(key) => String(key)}
          locale="ko"
          variant="full"
          loading
        />
      </I18nProvider>,
    );

    expect(screen.getByTestId('trade-funding-history-panel-loading')).toBeInTheDocument();
    expect(screen.queryByText('trade.empty.fundingHistory')).not.toBeInTheDocument();
  });

  it('uses tabular nums on numeric cells', () => {
    renderPanel();

    const row = screen.getByTestId('trade-funding-payment-row');
    expect(row.querySelector('.tabular-nums')).toBeTruthy();
  });
});
