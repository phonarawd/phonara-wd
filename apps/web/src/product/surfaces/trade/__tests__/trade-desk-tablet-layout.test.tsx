import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  TRADE_DESK_TABLET_MAIN_GRID_TESTID,
  TRADE_DESK_TABLET_TAB_IDS,
} from '@/domain/trade-mobile-layout-display-contract';
import { I18nProvider } from '@/product/i18n';
import { TradeDeskTabletLayout } from '@/product/surfaces/trade/trade-desk-tablet-layout';

function renderTabletLayout(defaultTab: 'trade' | 'positions' | 'history' = 'trade') {
  return render(
    <I18nProvider>
      <TradeDeskTabletLayout
        testId="trade-desk-tablet-layout-test"
        t={(key) => String(key)}
        defaultTab={defaultTab}
        chart={<div data-testid="tablet-chart-slot">chart</div>}
        ticket={<div data-testid="tablet-ticket-slot">ticket</div>}
        trade={<div data-testid="tablet-trade-slot">trade</div>}
        positions={<div data-testid="tablet-positions-slot">positions</div>}
        history={<div data-testid="tablet-history-slot">history</div>}
      />
    </I18nProvider>,
  );
}

describe('TradeDeskTabletLayout · P2-A tablet tier', () => {
  it('renders chart+ticket 2-col grid with md:flex lg:hidden shell', () => {
    renderTabletLayout();

    const root = screen.getByTestId('trade-desk-tablet-layout-test');
    expect(root).toHaveClass('trade-desk-tablet');
    expect(root).toHaveClass('md:flex');
    expect(root).toHaveClass('lg:hidden');

    const grid = screen.getByTestId(TRADE_DESK_TABLET_MAIN_GRID_TESTID);
    expect(grid).toHaveClass('trade-desk-tablet-main-grid');
    expect(screen.getByTestId('tablet-chart-slot')).toBeInTheDocument();
    expect(screen.getByTestId('tablet-ticket-slot')).toBeInTheDocument();
  });

  it('renders trade|positions|history tabs without chart tab', () => {
    renderTabletLayout('trade');

    expect(screen.getByTestId('trade-desk-tablet-tablist').children).toHaveLength(
      TRADE_DESK_TABLET_TAB_IDS.length,
    );
    for (const tabId of TRADE_DESK_TABLET_TAB_IDS) {
      expect(screen.getByTestId(`trade-desk-tablet-tab-${tabId}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('trade-desk-tablet-tab-chart')).not.toBeInTheDocument();
    expect(screen.getByTestId('tablet-trade-slot')).toBeInTheDocument();
  });
});
