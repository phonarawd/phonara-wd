import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tickerStore } from '@/features/trading/market-store/ticker-store';
import { I18nProvider } from '@/product/i18n';
import { SpotMarketHeader } from '@/product/surfaces/trade/spot-market-header';

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

describe('SpotMarketHeader ticker wire', () => {
  beforeEach(() => {
    tickerStore.setSnapshot({
      symbol: 'ETH_USDT',
      lastPrice: '3200',
      priceChangePercent: '3.5',
      volume: '1000000',
      quoteVolume: '125000',
      highPrice: '3300',
      lowPrice: '3100',
      openInterest: '0',
    });
  });

  it('renders 24h ticker stats from useMarketTicker for mapped spot pairs', () => {
    render(
      <I18nProvider>
        <SpotMarketHeader
          markets={[
            {
              symbol: 'ETH_USDT',
              display_name: 'ETH/USDT',
              base_asset: 'ETH',
              quote_asset: 'USDT',
              fee_rate: '0.001',
              price_precision: 2,
              quantity_precision: 6,
              min_notional: '1',
              is_active: true,
              sort_order: 1,
            },
          ]}
          selectedSymbol="ETH_USDT"
          pairLabel="ETH/USDT"
          priceDisplay="3200.00"
          markPriceDisplay="3200.00"
          lastPriceRaw="3200"
          onMarketChange={vi.fn()}
          t={(key) => String(key)}
        />
      </I18nProvider>,
    );

    const header = screen.getByTestId('spot-market-header');
    expect(within(header).getByTestId('trade-ticker-change24')).toHaveTextContent('+3.50%');
    expect(within(header).getByTestId('trade-ticker-high24')).toHaveTextContent('3,300.0');
    expect(within(header).getByTestId('trade-ticker-vol24')).toHaveTextContent('125.0K');
  });
});
