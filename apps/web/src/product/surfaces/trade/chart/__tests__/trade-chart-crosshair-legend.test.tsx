import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { I18nProvider } from '@/product/i18n';

import { TradeChartCrosshairLegend } from '../trade-chart-crosshair-legend';

describe('TradeChartCrosshairLegend', () => {
  it('renders OHLC values when crosshair snapshot is visible', () => {
    render(
      <I18nProvider>
        <TradeChartCrosshairLegend
          snapshot={{
            open: '100.5',
            high: '102.0',
            low: '99.5',
            close: '101.0',
            visible: true,
          }}
        />
      </I18nProvider>,
    );

    expect(screen.getByTestId('trade-chart-crosshair-legend')).toBeInTheDocument();
    expect(screen.getByText('100.5')).toBeInTheDocument();
    expect(screen.getByText('102.0')).toBeInTheDocument();
    expect(screen.getByText('99.5')).toBeInTheDocument();
    expect(screen.getByText('101.0')).toBeInTheDocument();
  });

  it('renders nothing when crosshair snapshot is hidden', () => {
    render(
      <I18nProvider>
        <TradeChartCrosshairLegend
          snapshot={{
            open: '—',
            high: '—',
            low: '—',
            close: '—',
            visible: false,
          }}
        />
      </I18nProvider>,
    );

    expect(screen.queryByTestId('trade-chart-crosshair-legend')).not.toBeInTheDocument();
  });
});
