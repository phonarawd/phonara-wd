import type { MessageKey } from '@phonara/i18n';

import type { DepthChartModel } from '@/features/trading/order-book-display';
import { cn } from '@/product/primitives/lib/cn';

export type OrderBookDepthChartProps = {
  model: DepthChartModel;
  midDisplay: string;
  t: (key: MessageKey) => string;
  className?: string;
};

/** Mirrored bid/ask cumulative depth — display-only SVG (gap #12). */
export function OrderBookDepthChart({ model, midDisplay, t, className }: OrderBookDepthChartProps) {
  return (
    <div
      className={cn('flex min-h-0 flex-1 flex-col gap-2 px-2 pb-2', className)}
      data-testid="order-book-depth-chart"
    >
      <div className="text-foreground-muted flex items-center justify-between px-1 text-tiny uppercase tracking-wide">
        <span>{t('trade.orderbook.bids')}</span>
        <span>{t('trade.orderbook.asks')}</span>
      </div>
      <div className="border-line bg-surface-raised relative min-h-48 flex-1 overflow-hidden rounded-md border">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={t('trade.orderbook.depthChart')}
        >
          <line x1="50" y1="0" x2="50" y2="100" className="stroke-line" strokeWidth="0.35" />
          {model.bidPath ? <path d={model.bidPath} className="fill-market-up opacity-25" /> : null}
          {model.askPath ? (
            <path d={model.askPath} className="fill-market-down opacity-25" />
          ) : null}
        </svg>
        <div
          className="border-line bg-surface/90 text-foreground absolute top-1/2 left-1/2 z-1 -translate-x-1/2 -translate-y-1/2 rounded-sm border px-2 py-0.5 text-xs tabular-nums"
          data-testid="order-book-depth-chart-mid"
        >
          {midDisplay}
        </div>
      </div>
      <p className="text-foreground-muted m-0 px-1 text-xs">
        {t('trade.orderbook.depthChartHint')}
      </p>
    </div>
  );
}
