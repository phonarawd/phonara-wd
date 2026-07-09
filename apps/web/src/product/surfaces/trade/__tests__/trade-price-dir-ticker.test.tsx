import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TradePriceDirTicker } from '@/product/surfaces/trade/trade-price-dir-ticker';

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

describe('TradePriceDirTicker', () => {
  it('applies market-up class when raw price ticks up', () => {
    const { rerender } = render(
      <TradePriceDirTicker
        label="Last"
        priceDisplay="100.0"
        lastPriceRaw="100"
        testId="ticker-price"
      />,
    );

    expect(screen.getByTestId('ticker-price')).toHaveClass('text-foreground');

    rerender(
      <TradePriceDirTicker
        label="Last"
        priceDisplay="101.0"
        lastPriceRaw="101"
        testId="ticker-price"
      />,
    );

    expect(screen.getByTestId('ticker-price')).toHaveClass('text-market-up');
  });

  it('applies market-down class when raw price ticks down', () => {
    const { rerender } = render(
      <TradePriceDirTicker
        label="Last"
        priceDisplay="100.0"
        lastPriceRaw="100"
        testId="ticker-price"
      />,
    );

    rerender(
      <TradePriceDirTicker
        label="Last"
        priceDisplay="99.0"
        lastPriceRaw="99"
        testId="ticker-price"
      />,
    );

    expect(screen.getByTestId('ticker-price')).toHaveClass('text-market-down');
  });
});
