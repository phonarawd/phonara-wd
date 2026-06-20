import { formatOraclePriceDisplay } from "@/features/trading/format-oracle-price-display";
import { t } from "@/i18n";
import type { TradingOpenOrder } from "@/hooks/use-trading";
import { cn } from "@/lib/utils";

export type OpenOrdersPanelProps = {
  orders: TradingOpenOrder[];
  loading?: boolean;
  busy?: boolean;
  onCancel: (orderId: string) => void;
};

function orderTypeLabel(type: TradingOpenOrder["order_type"]): string {
  if (type === "limit") return t("trade.order.limit");
  if (type === "stop_limit") return t("trade.order.stopLimit");
  return t("trade.order.stop");
}

export function OpenOrdersPanel({ orders, loading, busy, onCancel }: OpenOrdersPanelProps) {
  if (loading) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">{t("common.loading")}</p>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">
        {t("trade.empty.openOrders")}
      </p>
    );
  }

  return (
    <ul className="grid gap-2">
      {orders.map((order) => {
        const triggerDisplay =
          order.order_type === "limit"
            ? order.price
            : order.stop_price;
        const limitDisplay =
          order.order_type === "stop_limit" ? order.price : null;

        return (
          <li
            key={order.id}
            className="rounded-lg border border-border bg-(--color-surface) px-3 py-2 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="grid gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{order.market}</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                      order.side === "long"
                        ? "bg-(--color-up)/15 text-(--color-up)"
                        : "bg-(--color-down)/15 text-(--color-down)",
                    )}
                  >
                    {order.side}
                  </span>
                  <span className="text-muted-foreground">{orderTypeLabel(order.order_type)}</span>
                </div>
                {triggerDisplay ? (
                  <div className="tabular-nums text-muted-foreground">
                    {t("trade.order.triggerPrice")}:{" "}
                    {formatOraclePriceDisplay(triggerDisplay, triggerDisplay)}
                  </div>
                ) : null}
                {limitDisplay ? (
                  <div className="tabular-nums text-muted-foreground">
                    {t("trade.order.limitPrice")}:{" "}
                    {formatOraclePriceDisplay(limitDisplay, limitDisplay)}
                  </div>
                ) : null}
                <div className="tabular-nums text-muted-foreground">
                  {t("trade.order.size")}: {order.quantity} · {order.margin_amount}{" "}
                  {order.margin_currency}
                </div>
              </div>
              <button
                type="button"
                data-testid={`trade-cancel-order-${order.id}`}
                disabled={busy}
                onClick={() => onCancel(order.id)}
                className="shrink-0 rounded border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {t("trade.order.cancel")}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
