import type { MessageKey } from '@phonara/i18n';

import { TRADE_DESK_TABLE_SCROLL_CLASS } from '@/domain/trade-ultra-layout-display-contract';
import type { TradingOpenOrder } from '@/hooks/use-trading';
import { Button } from '@/product/primitives/button';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

export type OpenOrdersPanelProps = {
  orders: TradingOpenOrder[];
  t: (key: MessageKey) => string;
  className?: string;
  variant?: 'compact' | 'full';
  showHeading?: boolean;
  emptyKey?: MessageKey;
  onCancelOrder?: (orderId: string) => void;
  cancellingOrderId?: string | null;
  cancelBusy?: boolean;
  loading?: boolean;
};

function resolveOrderTypeLabel(order: TradingOpenOrder, t: OpenOrdersPanelProps['t']) {
  switch (order.order_type) {
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

function resolveStatusLabel(order: TradingOpenOrder, t: OpenOrdersPanelProps['t']) {
  switch (order.status) {
    case 'pending':
      return t('trade.orders.statusPending');
    case 'open':
      return t('trade.orders.statusOpen');
    case 'triggered':
      return t('trade.orders.statusTriggered');
    default:
      return order.status;
  }
}

function resolvePriceDisplay(order: TradingOpenOrder) {
  if (order.order_type === 'limit') {
    return { amount: order.price, label: 'limit' as const };
  }
  if (order.order_type === 'stop_market') {
    return { amount: order.stop_price, label: 'trigger' as const };
  }
  if (order.order_type === 'stop_limit') {
    return { amount: order.stop_price, label: 'trigger' as const, limitAmount: order.price };
  }
  return { amount: order.price ?? order.stop_price, label: 'limit' as const };
}

/** Futures limit/stop open orders — read + cancel (ENGINE:exists · `useOpenOrders`). */
export function OpenOrdersPanel({
  orders,
  t,
  className,
  variant = 'compact',
  showHeading = true,
  emptyKey = 'trade.empty.openOrders',
  onCancelOrder,
  cancellingOrderId = null,
  cancelBusy = false,
  loading = false,
}: OpenOrdersPanelProps) {
  const isFull = variant === 'full';
  const showCancelAction = isFull && Boolean(onCancelOrder);

  return (
    <section
      data-testid="open-orders-panel"
      className={cn('border-line bg-surface rounded-(--ds-radius-lg) border p-4', className)}
    >
      {showHeading ? (
        <h2 className="text-foreground m-0 text-sm font-semibold">{t('trade.panel.openOrders')}</h2>
      ) : null}

      {loading ? (
        <Skeleton className="mt-3 h-24 w-full" data-testid="open-orders-panel-loading" />
      ) : orders.length === 0 ? (
        <p className="text-foreground-muted m-0 mt-3 text-sm">{t(emptyKey)}</p>
      ) : (
        <div
          className={cn(
            showHeading ? 'mt-3' : undefined,
            TRADE_DESK_TABLE_SCROLL_CLASS,
            'overflow-x-auto',
          )}
        >
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="text-foreground-muted text-left text-xs">
                <th className="pb-2 font-medium">{t('confirm.row.market')}</th>
                <th className="pb-2 font-medium">{t('confirm.row.side')}</th>
                {isFull ? (
                  <th className="pb-2 font-medium">{t('trade.orders.columnType')}</th>
                ) : null}
                {isFull ? (
                  <th className="pb-2 font-medium">{t('trade.positions.columnStatus')}</th>
                ) : null}
                <th className="pb-2 font-medium">{t('trade.order.leverage')}</th>
                {isFull ? <th className="pb-2 font-medium">{t('trade.order.price')}</th> : null}
                {isFull ? <th className="pb-2 font-medium">{t('trade.quantity')}</th> : null}
                {isFull ? (
                  <th className="pb-2 font-medium">{t('trade.orders.columnFilled')}</th>
                ) : null}
                <th className="pb-2 font-medium">{t('trade.margin')}</th>
                <th className="pb-2 font-medium">{t('trade.marginCurrency')}</th>
                {showCancelAction ? (
                  <th className="pb-2 font-medium">{t('trade.positions.columnAction')}</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const rowCancelling = cancellingOrderId === order.id;
                const priceDisplay = resolvePriceDisplay(order);

                return (
                  <tr key={order.id} className="border-line border-t" data-testid="open-order-row">
                    <td className="py-2 tabular-nums">{order.market}</td>
                    <td className="py-2">
                      {t(order.side === 'long' ? 'trade.long' : 'trade.short')}
                    </td>
                    {isFull ? <td className="py-2">{resolveOrderTypeLabel(order, t)}</td> : null}
                    {isFull ? <td className="py-2">{resolveStatusLabel(order, t)}</td> : null}
                    <td className="py-2 tabular-nums">{order.leverage}x</td>
                    {isFull ? (
                      <td className="py-2">
                        {priceDisplay.amount ? (
                          <div className="flex flex-col gap-0.5">
                            <MoneyDisplay
                              amount={priceDisplay.amount}
                              currency="USDT"
                              showCurrency
                              className="text-foreground text-sm tabular-nums"
                            />
                            {priceDisplay.limitAmount ? (
                              <MoneyDisplay
                                amount={priceDisplay.limitAmount}
                                currency="USDT"
                                showCurrency
                                className="text-foreground-muted text-xs tabular-nums"
                              />
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-foreground-muted">—</span>
                        )}
                      </td>
                    ) : null}
                    {isFull ? <td className="py-2 tabular-nums">{order.quantity}</td> : null}
                    {isFull ? <td className="py-2 tabular-nums">{order.filled_quantity}</td> : null}
                    <td className="py-2">
                      <MoneyDisplay
                        amount={order.margin_amount}
                        currency={order.margin_currency}
                        showCurrency
                        className="text-foreground text-sm tabular-nums"
                      />
                    </td>
                    <td className="py-2 tabular-nums" data-testid="open-order-margin-currency">
                      {order.margin_currency}
                    </td>
                    {showCancelAction ? (
                      <td className="py-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid={`open-order-cancel-${order.id}`}
                          disabled={cancelBusy}
                          loading={rowCancelling}
                          onClick={() => onCancelOrder?.(order.id)}
                        >
                          {t('trade.order.cancel')}
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
