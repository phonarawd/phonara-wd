import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReferencePriceTick } from '@/hooks/use-trading';
import { I18nProvider } from '@/product/i18n';
import { TradeRecentTradesRail } from '@/product/surfaces/trade/trade-recent-trades-rail';

const useReferencePriceTicksMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/use-trading', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-trading')>();
  return {
    ...actual,
    useReferencePriceTicks: useReferencePriceTicksMock,
  };
});

function makeTick(overrides: Partial<ReferencePriceTick> = {}): ReferencePriceTick {
  return {
    id: 'tick-1',
    price: '65000.00',
    created_at: '2026-07-06T12:00:00.000Z',
    ...overrides,
  };
}

function renderRail(ticks: ReferencePriceTick[] = [], loading = false) {
  useReferencePriceTicksMock.mockReturnValue({
    ticks,
    loading,
    error: null,
    refetch: vi.fn(),
  });

  return render(
    <I18nProvider>
      <TradeRecentTradesRail symbol="BTCUSDT-SIM" locale="ko" t={(key) => String(key)} />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useReferencePriceTicksMock.mockReset();
});

describe('TradeRecentTradesRail', () => {
  it('renders reference disclosure and empty state', () => {
    renderRail([]);

    expect(screen.getByTestId('trade-recent-trades-rail')).toBeInTheDocument();
    expect(screen.getByText('trade.spot.recentTrades')).toBeInTheDocument();
    expect(screen.getByText('trade.recent.referenceDisclosure')).toBeInTheDocument();
    expect(screen.getByText('trade.recent.empty')).toBeInTheDocument();
  });

  it('shows skeleton rows while reference ticks load', () => {
    renderRail([], true);

    expect(screen.getByTestId('trade-recent-trades-loading')).toBeInTheDocument();
    expect(screen.queryByText('trade.recent.empty')).not.toBeInTheDocument();
  });

  it('renders tick rows with direction tone from consecutive prices', () => {
    renderRail([
      makeTick({ id: 't-new', price: '65100.00', created_at: '2026-07-06T12:00:02.000Z' }),
      makeTick({ id: 't-old', price: '65000.00', created_at: '2026-07-06T12:00:01.000Z' }),
    ]);

    const rows = screen.getAllByTestId('trade-recent-trades-row');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText('65,100.0')).toHaveClass('text-market-up');
    expect(within(rows[1]!).getByText('65,000.0')).toHaveClass('text-foreground');
  });

  it('collapses tick list while keeping header visible', () => {
    renderRail([makeTick()]);

    expect(screen.getAllByTestId('trade-recent-trades-row')).toHaveLength(1);

    fireEvent.click(screen.getByTestId('trade-recent-trades-toggle'));

    expect(screen.queryByTestId('trade-recent-trades-row')).not.toBeInTheDocument();
    expect(screen.getByTestId('trade-recent-trades-rail')).toBeInTheDocument();
  });
});
