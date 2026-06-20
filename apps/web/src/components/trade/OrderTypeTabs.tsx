import { cn } from "@/lib/utils";
import { t } from "@/i18n";

/** Legacy 3-tab order type for BuyOrderSheet / MobileTradeView (not mounted on /trade). */
export type OrderType = "limit" | "market" | "stop";

export type OrderTypeTabsProps = {
  value: OrderType;
  onChange: (v: OrderType) => void;
  className?: string;
};

const ITEMS: OrderType[] = ["limit", "market", "stop"];

const LABEL_KEYS: Record<OrderType, string> = {
  limit: "trade.order.limit",
  market: "trade.order.market",
  stop: "trade.order.stop",
};

export function OrderTypeTabs({ value, onChange, className }: OrderTypeTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={t("trade.order.title")}
      className={cn(
        "inline-flex w-full items-center gap-1 rounded-lg bg-(--color-surface) p-1",
        className,
      )}
    >
      {ITEMS.map((k) => {
        const active = value === k;
        return (
          <button
            key={k}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(k)}
            className={cn(
              "min-h-10 flex-1 rounded-md px-3 text-xs font-medium whitespace-nowrap transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
              active
                ? "bg-(--color-surface-elev) text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(LABEL_KEYS[k])}
          </button>
        );
      })}
    </div>
  );
}
