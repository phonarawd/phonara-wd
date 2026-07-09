import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { mapBookLevels } from '@/features/trading/order-book-display';
import { I18nProvider } from '@/product/i18n';
import { SpotOrderBookPanel } from '@/product/surfaces/trade/spot-order-book-panel';

const asks = mapBookLevels([
  { price: '0.1202', size: '10' },
  { price: '0.1205', size: '20' },
]);
const bids = mapBookLevels([
  { price: '0.1200', size: '15' },
  { price: '0.1198', size: '25' },
]);

function renderPanel(props: Partial<ComponentProps<typeof SpotOrderBookPanel>> = {}) {
  return render(
    <I18nProvider>
      <SpotOrderBookPanel
        asks={asks}
        bids={bids}
        pricePrecision={4}
        midDisplay="0.1201"
        baseLabel="PHON"
        t={(key) => String(key)}
        {...props}
      />
    </I18nProvider>,
  );
}

describe('SpotOrderBookPanel', () => {
  it('renders grouping selector, spread row, and visible levels', () => {
    renderPanel();

    expect(screen.getByTestId('spot-order-book-grouping')).toBeInTheDocument();
    expect(screen.getByTestId('orderbook-reference-disclosure')).toHaveTextContent(
      'trade.orderbook.referenceDisclosure',
    );
    expect(screen.getByTestId('orderbook-house-counterparty-disclosure')).toHaveTextContent(
      'trade.orderbook.houseCounterpartyDisclosure',
    );
    expect(screen.getByTestId('spot-order-book-spread')).toHaveTextContent(
      'trade.orderbook.spread',
    );
    expect(screen.getByTestId('spot-order-book-mid')).toHaveTextContent('0.1201');
    expect(screen.getByText('0.1205')).toBeInTheDocument();
    expect(screen.getByText('0.1200')).toBeInTheDocument();
  });

  it('fires onPriceClick with raw price and book side', () => {
    const onPriceClick = vi.fn();
    renderPanel({ onPriceClick });

    fireEvent.click(screen.getAllByTestId('spot-order-book-ask-price')[0]!);
    expect(onPriceClick).toHaveBeenCalledWith('0.1205', 'ask');

    fireEvent.click(screen.getAllByTestId('spot-order-book-bid-price')[0]!);
    expect(onPriceClick).toHaveBeenCalledWith('0.1200', 'bid');
  });

  it('does not render clickable prices without onPriceClick', () => {
    renderPanel();

    expect(screen.queryByTestId('spot-order-book-ask-price')).not.toBeInTheDocument();
    expect(screen.queryByTestId('spot-order-book-bid-price')).not.toBeInTheDocument();
  });

  it('shows synthetic active disclosure when bookDisplaySource is synthetic', () => {
    renderPanel({ bookDisplaySource: 'synthetic' });

    expect(screen.getByTestId('orderbook-synthetic-active-disclosure')).toHaveTextContent(
      'trade.orderbook.syntheticActive',
    );
  });

  it('shows display feed stale badge when bookFeedStale is true', () => {
    renderPanel({ bookFeedStale: true });

    expect(screen.getByTestId('spot-order-book-stale-badge')).toHaveTextContent(
      'trade.displayFeed.staleBadge',
    );
  });

  it('switches to depth chart view with cumulative areas', () => {
    renderPanel();

    fireEvent.click(screen.getByTestId('spot-order-book-view-depth'));

    expect(screen.getByTestId('spot-order-book-view-depth')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByTestId('order-book-depth-chart')).toBeInTheDocument();
    expect(screen.getByTestId('order-book-depth-chart-mid')).toHaveTextContent('0.1201');
    expect(screen.queryByTestId('spot-order-book-spread')).not.toBeInTheDocument();
  });

  it('keeps fixed row slots per side to avoid layout shift on updates', () => {
    renderPanel({ asks: asks.slice(0, 1), bids: bids.slice(0, 1) });

    expect(screen.getByTestId('spot-order-book-ask-side').children).toHaveLength(12);
    expect(screen.getByTestId('spot-order-book-bid-side').children).toHaveLength(12);
  });
});
