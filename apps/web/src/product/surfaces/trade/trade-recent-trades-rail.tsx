import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { MessageKey } from '@phonara/i18n';
import { toDecimal } from '@phonara/money';

import { formatOraclePriceDisplay } from '@/features/trading/format-oracle-price-display';
import { useReferencePriceTicks, type ReferencePriceTick } from '@/hooks/use-trading';
import { IconButton } from '@/product/primitives/icon-button';
import { cn } from '@/product/primitives/lib/cn';
import { Skeleton } from '@/product/primitives/skeleton';

const ROW_LIMIT = 16;

export type TradeRecentTradesRailProps = {
  symbol: string | null;
  t: (key: MessageKey) => string;
  locale: string;
  className?: string;
};

type TickDirection = 'up' | 'down' | 'flat';

function formatTickTime(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function inferTickDirections(ticks: ReferencePriceTick[]): TickDirection[] {
  return ticks.map((tick, index) => {
    const older = ticks[index + 1];
    if (!older) return 'flat';
    try {
      const cmp = toDecimal(tick.price).cmp(toDecimal(older.price));
      if (cmp > 0) return 'up';
      if (cmp < 0) return 'down';
      return 'flat';
    } catch {
      return 'flat';
    }
  });
}

/** Collapsible reference time&sales rail — single mount adjacent to order book (lg+ · §22.2.3 H1). */
export function TradeRecentTradesRail({
  symbol,
  t,
  locale,
  className,
}: TradeRecentTradesRailProps) {
  const [expanded, setExpanded] = useState(true);
  const { ticks, loading } = useReferencePriceTicks(symbol, ROW_LIMIT);

  const visibleTicks = useMemo(() => ticks.slice(0, ROW_LIMIT), [ticks]);
  const directions = useMemo(() => inferTickDirections(visibleTicks), [visibleTicks]);

  return (
    <section
      data-testid="trade-recent-trades-rail"
      className={cn(
        'border-line bg-surface flex min-h-0 flex-col overflow-hidden rounded-(--ds-radius-lg) border',
        className,
      )}
    >
      <header className="border-line flex items-start justify-between gap-2 border-b px-3 py-2">
        <div className="min-w-0">
          <h2 className="text-foreground m-0 text-sm font-semibold">
            {t('trade.spot.recentTrades')}
          </h2>
          <p className="text-foreground-muted m-0 mt-1 text-xs">
            {t('trade.recent.referenceDisclosure')}
          </p>
        </div>
        <IconButton
          type="button"
          variant="ghost"
          size="sm"
          data-testid="trade-recent-trades-toggle"
          className="text-accent shrink-0"
          aria-expanded={expanded}
          aria-label={expanded ? t('trade.recent.collapse') : t('trade.recent.expand')}
          onClick={() => setExpanded((open) => !open)}
        >
          <ChevronDown
            className={cn(
              'size-4 transition-transform duration-(--ds-motion-surface)',
              expanded && 'rotate-180',
            )}
            aria-hidden
          />
        </IconButton>
      </header>

      {expanded ? (
        <>
          <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 text-xs">
            <span className="text-foreground-muted">{t('trade.orderbook.price')}</span>
            <span className="text-foreground-muted text-right">{t('trade.time')}</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
            {loading && visibleTicks.length === 0 ? (
              <div
                className="flex flex-col gap-1 px-1 py-1"
                data-testid="trade-recent-trades-loading"
              >
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : visibleTicks.length === 0 ? (
              <p className="text-foreground-muted m-0 px-1 py-2 text-center text-xs">
                {t('trade.recent.empty')}
              </p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {visibleTicks.map((tick, index) => {
                  const direction = directions[index] ?? 'flat';
                  return (
                    <div
                      key={tick.id}
                      data-testid="trade-recent-trades-row"
                      className="grid grid-cols-[1fr_auto] items-center gap-2 px-1 py-0.5 text-xs tabular-nums"
                    >
                      <span
                        className={cn(
                          direction === 'up' && 'text-market-up',
                          direction === 'down' && 'text-market-down',
                          direction === 'flat' && 'text-foreground',
                        )}
                      >
                        {formatOraclePriceDisplay(tick.price, tick.price)}
                      </span>
                      <span className="text-foreground-muted text-right">
                        {formatTickTime(tick.created_at, locale)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
