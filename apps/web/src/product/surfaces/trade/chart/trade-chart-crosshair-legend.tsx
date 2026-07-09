import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';

import type { CrosshairLegendSnapshot } from './chart-overlay-contract';

export type TradeChartCrosshairLegendProps = {
  snapshot: CrosshairLegendSnapshot;
  className?: string;
};

/** TradingView-style OHLC legend — display feed only (§25.4 · #5 overlays). */
export function TradeChartCrosshairLegend({ snapshot, className }: TradeChartCrosshairLegendProps) {
  const t = useT();

  if (!snapshot.visible) return null;

  return (
    <div
      data-testid="trade-chart-crosshair-legend"
      aria-label={t('trade.chart.crosshairLegend')}
      className={cn(
        'border-line bg-surface/90 pointer-events-none absolute top-2 left-2 z-10',
        'flex flex-wrap gap-x-3 gap-y-1 rounded-(--ds-radius-md) border px-2 py-1',
        'text-xs tabular-nums backdrop-blur-sm',
        className,
      )}
    >
      <span>
        <span className="text-foreground-muted">{t('trade.chart.ohlcOpen')}</span>{' '}
        <span className="text-foreground">{snapshot.open}</span>
      </span>
      <span>
        <span className="text-foreground-muted">{t('trade.chart.ohlcHigh')}</span>{' '}
        <span className="text-market-up">{snapshot.high}</span>
      </span>
      <span>
        <span className="text-foreground-muted">{t('trade.chart.ohlcLow')}</span>{' '}
        <span className="text-market-down">{snapshot.low}</span>
      </span>
      <span>
        <span className="text-foreground-muted">{t('trade.chart.ohlcClose')}</span>{' '}
        <span className="text-foreground">{snapshot.close}</span>
      </span>
    </div>
  );
}
