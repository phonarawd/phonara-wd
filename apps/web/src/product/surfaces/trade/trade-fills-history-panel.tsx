import { useEffect, useMemo, useState } from 'react';

import type { MessageKey } from '@phonara/i18n';

import {
  TRADE_FILLS_FETCH_LIMIT,
  TRADE_FILLS_PAGE_SIZE,
  clampTradeFillsPage,
  paginateTradeFillsRows,
  tradeFillsPageCount,
} from '@/domain/trade-desk-perf-display-contract';
import { TRADE_DESK_TABLE_SCROLL_CLASS } from '@/domain/trade-ultra-layout-display-contract';
import type { TradingOrderFill } from '@/hooks/use-trading';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { Button } from '@/product/primitives/button';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

export type TradeFillsHistoryPanelProps = {
  fills: TradingOrderFill[];
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  locale: string;
  className?: string;
  variant?: 'compact' | 'full';
  showHeading?: boolean;
  emptyKey?: MessageKey;
  loading?: boolean;
  pageSize?: number;
};

function formatFillTime(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function resolveOrderTypeLabel(fill: TradingOrderFill, t: TradeFillsHistoryPanelProps['t']) {
  switch (fill.order_type) {
    case 'limit':
      return t('trade.order.limit');
    case 'stop_market':
      return t('trade.order.stop');
    case 'stop_limit':
      return t('trade.order.stopLimit');
    default:
      return t('trade.order.market');
  }
}

/** Futures order fills — RPC rows only (ENGINE:exists · `useTradingOrderFills` · §22.2.4). */
export function TradeFillsHistoryPanel({
  fills,
  t,
  locale,
  className,
  variant = 'compact',
  showHeading = true,
  emptyKey = 'trade.empty.history',
  loading = false,
  pageSize = TRADE_FILLS_PAGE_SIZE,
}: TradeFillsHistoryPanelProps) {
  const isFull = variant === 'full';
  const [page, setPage] = useState(1);
  const totalPages = tradeFillsPageCount(fills.length, pageSize);
  const safePage = clampTradeFillsPage(page, totalPages);
  const visibleFills = useMemo(
    () => paginateTradeFillsRows(fills, safePage, pageSize),
    [fills, safePage, pageSize],
  );
  const atFetchCap = fills.length >= TRADE_FILLS_FETCH_LIMIT;

  useEffect(() => {
    setPage(1);
  }, [fills.length]);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  return (
    <section
      data-testid="trade-fills-history-panel"
      className={cn('border-line bg-surface rounded-(--ds-radius-lg) border p-4', className)}
    >
      {showHeading ? (
        <h2 className="text-foreground m-0 text-sm font-semibold">{t('trade.panel.history')}</h2>
      ) : null}

      {loading ? (
        <Skeleton className="mt-3 h-24 w-full" data-testid="trade-fills-history-panel-loading" />
      ) : fills.length === 0 ? (
        <p className="text-foreground-muted m-0 mt-3 text-sm">{t(emptyKey)}</p>
      ) : (
        <>
          <div
            className={cn(
              showHeading ? 'mt-3' : undefined,
              TRADE_DESK_TABLE_SCROLL_CLASS,
              'overflow-x-auto',
            )}
          >
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="text-foreground-muted text-left text-xs">
                  <th className="pb-2 font-medium">{t('trade.time')}</th>
                  <th className="pb-2 font-medium">{t('confirm.row.market')}</th>
                  <th className="pb-2 font-medium">{t('confirm.row.side')}</th>
                  {isFull ? (
                    <th className="pb-2 font-medium">{t('trade.orders.columnType')}</th>
                  ) : null}
                  <th className="pb-2 font-medium">{t('trade.order.leverage')}</th>
                  <th className="pb-2 font-medium">{t('trade.price')}</th>
                  <th className="pb-2 font-medium">{t('trade.quantity')}</th>
                  <th className="pb-2 font-medium">{t('trade.fills.columnFee')}</th>
                  <th className="pb-2 font-medium">{t('trade.marginCurrency')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleFills.map((fill) => (
                  <tr key={fill.id} className="border-line border-t" data-testid="trade-fill-row">
                    <td className="py-2 tabular-nums">{formatFillTime(fill.created_at, locale)}</td>
                    <td className="py-2 tabular-nums">{fill.market}</td>
                    <td className="py-2">
                      {t(fill.side === 'long' ? 'trade.long' : 'trade.short')}
                    </td>
                    {isFull ? <td className="py-2">{resolveOrderTypeLabel(fill, t)}</td> : null}
                    <td className="py-2 tabular-nums">{fill.leverage}x</td>
                    <td className="py-2">
                      <MoneyDisplay
                        amount={fill.fill_price}
                        currency="USDT"
                        showCurrency
                        className="text-foreground text-sm tabular-nums"
                      />
                    </td>
                    <td className="py-2 tabular-nums">{fill.fill_quantity}</td>
                    <td className="py-2">
                      <MoneyDisplay
                        amount={fill.fee}
                        currency={fill.margin_currency}
                        showCurrency
                        className="text-foreground text-sm tabular-nums"
                      />
                    </td>
                    <td className="py-2 tabular-nums" data-testid="trade-fill-margin-currency">
                      {fill.margin_currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {atFetchCap ? (
            <p
              className="text-foreground-muted m-0 mt-3 text-xs"
              data-testid="trade-fills-fetch-cap-notice"
            >
              {t('trade.fills.fetchCapNotice', { limit: TRADE_FILLS_FETCH_LIMIT })}
            </p>
          ) : null}

          {totalPages > 1 ? (
            <nav
              className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              aria-label={t('trade.fills.pagination.label')}
              data-testid="trade-fills-pagination"
            >
              <p className="text-foreground-muted m-0 text-sm tabular-nums">
                {t('trade.fills.pagination.summary', {
                  page: safePage,
                  total: totalPages,
                  count: fills.length,
                })}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((current) => clampTradeFillsPage(current - 1, totalPages))}
                >
                  {t('trade.fills.pagination.previous')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((current) => clampTradeFillsPage(current + 1, totalPages))}
                >
                  {t('trade.fills.pagination.next')}
                </Button>
              </div>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}
