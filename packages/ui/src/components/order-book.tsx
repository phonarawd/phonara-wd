import { memo, forwardRef, type HTMLAttributes } from 'react';
import { toDecimal } from '@phonara/money';
import { cn } from '../lib/cn';
import { Badge } from './badge';
import { Card } from './card';
import { Skeleton } from './skeleton';
import { StateSurface } from './state-surface';

export interface OrderBookLevel {
  price: string;
  size: string;
}

export interface OrderBookLabels {
  loading: string;
  loadingDescription?: string;
  emptyTitle: string;
  emptyDescription?: string;
  errorTitle: string;
  errorDescription?: string;
  retry?: string;
  asks: string;
  bids: string;
  price: string;
  size: string;
  spread?: string;
  midpoint?: string;
  liveDepth?: string;
}

export interface OrderBookProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  referenceLabel?: string;
  disclosure: string;
  labels: OrderBookLabels;
  asks: OrderBookLevel[];
  bids: OrderBookLevel[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

function maxSize(levels: OrderBookLevel[]): string {
  return levels.reduce((max, level) => {
    try {
      const value = toDecimal(level.size);
      return value.greaterThan(max) ? value : max;
    } catch {
      return max;
    }
  }, toDecimal('0')).toString();
}

function depthPercent(size: string, max: string): string {
  try {
    const denominator = toDecimal(max);
    if (denominator.isZero()) return '0%';
    return `${toDecimal(size).div(denominator).mul(100).toFixed(2)}%`;
  } catch {
    return '0%';
  }
}

function spreadSummary(asks: OrderBookLevel[], bids: OrderBookLevel[]): { spread: string; midpoint: string } | null {
  const bestAsk = asks[0]?.price;
  const bestBid = bids[0]?.price;
  if (!bestAsk || !bestBid) return null;
  try {
    const ask = toDecimal(bestAsk);
    const bid = toDecimal(bestBid);
    if (ask.isNegative() || bid.isNegative() || ask.isZero() || bid.isZero()) return null;
    const spread = ask.minus(bid).abs();
    const midpoint = ask.plus(bid).div(2);
    return {
      spread: spread.toString(),
      midpoint: midpoint.toString(),
    };
  } catch {
    return null;
  }
}

const Row = memo(function Row({
  level,
  max,
  tone,
}: {
  level: OrderBookLevel;
  max: string;
  tone: 'ask' | 'bid';
}) {
  return (
    <div
      className={cn(
        'group relative grid grid-cols-2 overflow-hidden rounded-lg border px-2 py-1.5 text-xs tabular-nums',
        'transition-[border-color,background-color,transform] duration-[var(--motion-duration-confirmation)] ease-[var(--motion-ease-standard)]',
        tone === 'ask'
          ? 'border-down/10 bg-down/[0.035] hover:border-down/35 hover:bg-down/10'
          : 'border-up/10 bg-up/[0.035] hover:border-up/35 hover:bg-up/10',
      )}
    >
      <span
        className={cn(
          'absolute inset-y-0 right-0 opacity-25 transition-[width,opacity] duration-[var(--motion-duration-confirmation)] ease-[var(--motion-ease-standard)] group-hover:opacity-35',
          tone === 'ask'
            ? 'bg-[linear-gradient(90deg,transparent,var(--color-down))]'
            : 'bg-[linear-gradient(90deg,transparent,var(--color-up))]',
        )}
        style={{ width: depthPercent(level.size, max) }}
      />
      <span className={cn('relative font-medium', tone === 'ask' ? 'text-down' : 'text-up')}>{level.price}</span>
      <span className="relative text-right text-fg">{level.size}</span>
    </div>
  );
});

export const OrderBook = forwardRef<HTMLDivElement, OrderBookProps>(function OrderBook(
  {
    title,
    referenceLabel,
    disclosure,
    labels,
    asks,
    bids,
    loading = false,
    error = false,
    onRetry,
    className,
    ...props
  },
  ref,
) {
  const isEmpty = !loading && !error && asks.length === 0 && bids.length === 0;
  const max = maxSize([...asks, ...bids]);
  const spread = spreadSummary(asks, bids);

  return (
    <Card ref={ref} className={cn('flex flex-col gap-3 p-4', className)} data-testid="order-book" elevation="raised" {...props}>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-[1.05rem] font-bold text-fg">{title}</h3>
          {referenceLabel && (
            <Badge tone="warning" size="sm" density="compact">
              {referenceLabel}
            </Badge>
          )}
          {labels.liveDepth && !loading && !error && !isEmpty ? (
            <Badge tone="primary" size="sm" density="compact">
              {labels.liveDepth}
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 text-xs leading-5 text-warning">{disclosure}</p>
      </div>

      {loading && (
        <div className="grid gap-2" data-testid="order-book-loading">
          <StateSurface
            state="loading"
            density="compact"
            title={labels.loading}
            description={labels.loadingDescription}
            loadingLabel={labels.loading}
            className="py-3"
          />
          <Skeleton shape="line" density="compact" className="h-7 w-full" />
          <Skeleton shape="line" density="compact" className="h-7 w-full" />
          <Skeleton shape="line" density="compact" className="h-7 w-full" />
        </div>
      )}

      {isEmpty && (
        <StateSurface
          state="empty"
          density="compact"
          title={labels.emptyTitle}
          description={labels.emptyDescription}
          className="py-4"
          data-testid="order-book-empty"
        />
      )}

      {!loading && error && (
        <StateSurface
          state="error"
          density="compact"
          title={labels.errorTitle}
          description={labels.errorDescription}
          actionLabel={labels.retry}
          actionVariant="danger"
          onAction={onRetry}
          className="py-4"
          data-testid="order-book-error"
        />
      )}

      {!loading && !error && !isEmpty && (
        <div className="grid gap-3" data-testid="order-book-success">
          <div>
            <div className="mb-1 grid grid-cols-2 px-2 text-[0.7rem] uppercase tracking-wide text-muted">
              <span>{labels.price}</span>
              <span className="text-right">{labels.size}</span>
            </div>
            <div className="grid gap-1" aria-label={labels.asks}>
              {asks.slice().reverse().map((level) => (
                <Row key={`ask-${level.price}`} level={level} max={max} tone="ask" />
              ))}
            </div>
          </div>
          {spread && (
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface-inset px-3 py-2 text-[0.72rem] tabular-nums shadow-[var(--surface-inset-shadow)]">
              {labels.spread && (
                <span className="flex items-center justify-between gap-2 text-muted">
                  <span>{labels.spread}</span>
                  <span className="font-semibold text-fg">{spread.spread}</span>
                </span>
              )}
              {labels.midpoint && (
                <span className="flex items-center justify-between gap-2 text-muted">
                  <span>{labels.midpoint}</span>
                  <span className="font-semibold text-primary">{spread.midpoint}</span>
                </span>
              )}
            </div>
          )}
          <div className="grid gap-1" aria-label={labels.bids}>
            {bids.map((level) => (
              <Row key={`bid-${level.price}`} level={level} max={max} tone="bid" />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
});

OrderBook.displayName = 'OrderBook';
