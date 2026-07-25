import { useMemo, useState } from 'react';

import type { MessageKey } from '@phonara/i18n';
import type { Decimal } from '@phonara/money';

import {
  BOOK_ROW_SLOT_CLASS,
  BOOK_VISIBLE_ROW_LIMIT,
  bookDepthWidthPercent,
  buildDepthChartModel,
  computeBookSpread,
  padAskBookRows,
  padBidBookRows,
  prepareGroupedBook,
  resolveBookGroupingSteps,
  sliceVisibleBook,
  type SyntheticBookRow,
} from '@/features/trading/order-book-display';
import { TradeHelpTip } from '@/features/trading/trade-beginner-help/trade-help-tip';
import { Card } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/product/primitives/select';

import { OrderBookDepthChart } from './order-book-depth-chart';
import { TradeDisplayFeedStaleBadge } from './trade-display-feed-stale-badge';

export type SpotOrderBookPriceClick = (price: string, side: 'ask' | 'bid') => void;

export type SpotOrderBookPanelProps = {
  asks: SyntheticBookRow[];
  bids: SyntheticBookRow[];
  pricePrecision: number;
  midDisplay: string;
  baseLabel: string;
  t: (key: MessageKey) => string;
  onPriceClick?: SpotOrderBookPriceClick;
  className?: string;
  /** When true, live exchange book is stale — panel shows reference/synthetic levels. */
  bookFeedStale?: boolean;
  /** When `synthetic`, levels come from `rpc_get_synthetic_book` fallback. */
  bookDisplaySource?: 'live' | 'synthetic';
};

type OrderBookViewMode = 'book' | 'depth';

export function SpotOrderBookPanel({
  asks,
  bids,
  pricePrecision,
  midDisplay,
  baseLabel,
  t,
  onPriceClick,
  className,
  bookFeedStale = false,
  bookDisplaySource = 'live',
}: SpotOrderBookPanelProps) {
  const groupingSteps = useMemo(() => resolveBookGroupingSteps(pricePrecision), [pricePrecision]);
  const [groupingStep, setGroupingStep] = useState(() => groupingSteps[0] ?? '0.01');
  const [viewMode, setViewMode] = useState<OrderBookViewMode>('book');

  const activeStep = groupingSteps.includes(groupingStep)
    ? groupingStep
    : (groupingSteps[0] ?? '0.01');

  const grouped = useMemo(
    () => prepareGroupedBook(asks, bids, activeStep),
    [asks, bids, activeStep],
  );
  const { visibleAsks, visibleBids, maxSize } = sliceVisibleBook(
    grouped.asks,
    grouped.bids,
    BOOK_VISIBLE_ROW_LIMIT,
  );
  const spread = useMemo(
    () => computeBookSpread(grouped.asks, grouped.bids),
    [grouped.asks, grouped.bids],
  );
  const depthChart = useMemo(
    () => buildDepthChartModel(grouped.asks, grouped.bids),
    [grouped.asks, grouped.bids],
  );
  const paddedAsks = useMemo(
    () => padAskBookRows(visibleAsks, BOOK_VISIBLE_ROW_LIMIT),
    [visibleAsks],
  );
  const paddedBids = useMemo(
    () => padBidBookRows(visibleBids, BOOK_VISIBLE_ROW_LIMIT),
    [visibleBids],
  );

  return (
    <Card
      variant="trade-dense"
      data-testid="spot-order-book-panel"
      className={cn('flex min-h-0 flex-col overflow-hidden', className)}
    >
      <header className="border-line border-b px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-foreground m-0 flex items-center gap-1 text-sm font-semibold">
              {t('trade.orderbook.title')}
              <TradeHelpTip termId="order_book" className="text-xs font-normal" />
              <TradeDisplayFeedStaleBadge
                visible={bookFeedStale}
                t={t}
                testId="spot-order-book-stale-badge"
              />
            </h2>
            <p
              className="text-foreground-muted m-0 mt-1 text-xs"
              data-testid="orderbook-reference-disclosure"
            >
              {t('trade.orderbook.referenceDisclosure')}
            </p>
            {bookDisplaySource === 'synthetic' ? (
              <p
                className="text-warning m-0 mt-0.5 text-xs font-medium"
                data-testid="orderbook-synthetic-active-disclosure"
              >
                {t('trade.orderbook.syntheticActive')}
              </p>
            ) : null}
            <p
              className="text-foreground-muted m-0 mt-0.5 text-xs"
              data-testid="orderbook-house-counterparty-disclosure"
            >
              {t('trade.orderbook.houseCounterpartyDisclosure')}
            </p>
          </div>
          <label className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-foreground-muted text-tiny uppercase tracking-wide">
              {t('trade.orderbook.grouping')}
            </span>
            <Select value={activeStep} onValueChange={setGroupingStep}>
              <SelectTrigger
                className="border-line bg-surface min-w-22 px-2 text-xs"
                aria-label={t('trade.orderbook.grouping')}
                data-testid="spot-order-book-grouping"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groupingSteps.map((step) => (
                  <SelectItem key={step} value={step} className="text-xs tabular-nums">
                    {step}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
      </header>

      <div
        className="bg-surface-raised mx-3 mt-2 grid grid-cols-2 gap-1 rounded-md p-1"
        role="tablist"
        aria-label={t('trade.orderbook.viewToggle')}
      >
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'book'}
          data-testid="spot-order-book-view-book"
          className={cn(
            'min-h-(--ds-touch-target-min) rounded-sm px-3 py-1.5 text-sm font-medium transition-[color,background-color]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ds-focus)',
            viewMode === 'book'
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-foreground-muted hover:text-foreground',
          )}
          onClick={() => setViewMode('book')}
        >
          {t('trade.orderbook.viewBook')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'depth'}
          data-testid="spot-order-book-view-depth"
          className={cn(
            'min-h-(--ds-touch-target-min) rounded-sm px-3 py-1.5 text-sm font-medium transition-[color,background-color]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ds-focus)',
            viewMode === 'depth'
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-foreground-muted hover:text-foreground',
          )}
          onClick={() => setViewMode('depth')}
        >
          {t('trade.orderbook.viewDepth')}
        </button>
      </div>

      {viewMode === 'book' ? (
        <>
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-3 py-2 text-xs">
            <span className="text-foreground-muted">{t('trade.orderbook.price')}</span>
            <span className="text-foreground-muted text-center">
              {t('trade.orderbook.size')} ({baseLabel})
            </span>
            <span className="text-foreground-muted text-right">{t('trade.orderbook.total')}</span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden px-2 pb-2">
            <BookSide rows={paddedAsks} side="ask" maxSize={maxSize} onPriceClick={onPriceClick} />
            <div
              className="border-line my-1 shrink-0 border-y py-1 text-center tabular-nums min-h-11"
              data-testid="spot-order-book-spread"
            >
              <div
                className="text-foreground text-sm font-medium"
                data-testid="spot-order-book-mid"
              >
                {midDisplay}
              </div>
              <p
                className={cn(
                  'text-foreground-muted m-0 mt-0.5 min-h-4 text-xs',
                  !spread && 'invisible',
                )}
                aria-hidden={!spread}
              >
                {spread ? (
                  <>
                    {t('trade.orderbook.spread')}{' '}
                    <span className="text-foreground">{spread.spreadDisplay}</span>{' '}
                    <span>({spread.spreadPercentDisplay})</span>
                  </>
                ) : (
                  '\u00a0'
                )}
              </p>
            </div>
            <BookSide rows={paddedBids} side="bid" maxSize={maxSize} onPriceClick={onPriceClick} />
          </div>
        </>
      ) : depthChart ? (
        <OrderBookDepthChart model={depthChart} midDisplay={midDisplay} t={t} />
      ) : (
        <p className="text-foreground-muted m-0 px-3 py-6 text-center text-sm">—</p>
      )}
    </Card>
  );
}

function BookSide({
  rows,
  side,
  maxSize,
  onPriceClick,
}: {
  rows: Array<SyntheticBookRow | null>;
  side: 'ask' | 'bid';
  maxSize: Decimal;
  onPriceClick?: SpotOrderBookPriceClick;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-0.5" data-testid={`spot-order-book-${side}-side`}>
      {rows.map((row, index) => {
        if (!row) {
          return <div key={`${side}-slot-${index}`} className={BOOK_ROW_SLOT_CLASS} aria-hidden />;
        }

        const width = bookDepthWidthPercent(row.cumulativeQty, maxSize);
        const rawPrice = row.priceDisplay.replace(/,/g, '');
        const clickable = Boolean(onPriceClick);

        return (
          <div
            key={`${side}-slot-${index}`}
            className={cn(
              'relative grid grid-cols-[1fr_1fr_1fr] items-center gap-2 px-1 text-xs tabular-nums',
              BOOK_ROW_SLOT_CLASS,
            )}
          >
            <span
              aria-hidden
              className={cn(
                'absolute inset-y-0 right-0 opacity-20',
                side === 'ask' ? 'bg-market-down' : 'bg-market-up',
              )}
              style={{ width: `${width}%` }}
            />
            {clickable ? (
              <button
                type="button"
                className={cn(
                  'relative z-1 cursor-pointer border-0 bg-transparent p-0 text-left text-xs tabular-nums',
                  'hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus',
                  side === 'ask' ? 'text-market-down' : 'text-market-up',
                )}
                data-testid={`spot-order-book-${side}-price`}
                aria-label={`${row.priceDisplay} ${side}`}
                onClick={() => onPriceClick?.(rawPrice, side)}
              >
                {row.priceDisplay}
              </button>
            ) : (
              <span
                className={cn(
                  'relative z-1',
                  side === 'ask' ? 'text-market-down' : 'text-market-up',
                )}
              >
                {row.priceDisplay}
              </span>
            )}
            <span className="text-foreground relative z-1 text-center">{row.sizeDisplay}</span>
            <span className="text-foreground-muted relative z-1 text-right">
              {row.totalDisplay}
            </span>
          </div>
        );
      })}
    </div>
  );
}
