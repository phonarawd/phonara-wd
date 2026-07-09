import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { MarketTickerDisplay } from '@/features/trading/market-store/use-market-ticker-display';
import { TradeMarketTickerStats } from '@/product/surfaces/trade/trade-market-ticker-stats';

const LIVE_DISPLAY: MarketTickerDisplay = {
  hasFeed: true,
  change24: { text: '+1.25%', tone: 'up' },
  high24: '66,000.0',
  low24: '64,000.0',
  vol24: '78.00M',
  openInterest: '950.0K',
};

const EMPTY_DISPLAY: MarketTickerDisplay = {
  hasFeed: false,
  change24: { text: '—', tone: 'neutral' },
  high24: '—',
  low24: '—',
  vol24: '—',
  openInterest: '—',
};

function renderStats(mode: 'spot' | 'futures', display = LIVE_DISPLAY) {
  return render(<TradeMarketTickerStats display={display} mode={mode} t={(key) => String(key)} />);
}

describe('TradeMarketTickerStats', () => {
  it('renders change and desktop advanced stats for spot', () => {
    renderStats('spot');

    expect(screen.getByTestId('trade-ticker-change24')).toHaveTextContent('+1.25%');
    expect(screen.getByTestId('trade-ticker-high24')).toHaveTextContent('66,000.0');
    expect(screen.getByTestId('trade-ticker-vol24')).toHaveTextContent('78.00M');
  });

  it('shows open interest instead of volume for futures', () => {
    renderStats('futures');

    expect(screen.getByTestId('trade-ticker-open-interest')).toHaveTextContent('950.0K');
    expect(screen.queryByTestId('trade-ticker-vol24')).not.toBeInTheDocument();
  });

  it('toggles mobile advanced row', () => {
    renderStats('spot', EMPTY_DISPLAY);

    expect(screen.queryByTestId('trade-ticker-advanced-row-mobile')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('trade-ticker-advanced-toggle'));
    const row = screen.getByTestId('trade-ticker-advanced-row-mobile');
    expect(within(row).getByTestId('trade-ticker-high24')).toHaveTextContent('—');
    fireEvent.click(screen.getByTestId('trade-ticker-advanced-toggle'));
    expect(screen.queryByTestId('trade-ticker-advanced-row-mobile')).not.toBeInTheDocument();
  });
});
