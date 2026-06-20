import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import type { OrderType } from "./order-ticket-types";

export type OrderTypeTabsProps = {
  value: OrderType;
  onChange: (v: OrderType) => void;
  limitEnabled?: boolean;
  stopEnabled?: boolean;
  className?: string;
};

const ORDER_TYPES: OrderType[] = ["limit", "market", "stop_market", "stop_limit"];

const LABEL_KEYS: Record<OrderType, string> = {
  market: "trade.order.market",
  limit: "trade.order.limit",
  stop_market: "trade.order.stop",
  stop_limit: "trade.order.stopLimit",
};

const DISABLED_HINT: Partial<Record<OrderType, string>> = {
  limit: "trade.order.limitComingSoon",
  stop_market: "trade.order.stopComingSoon",
  stop_limit: "trade.order.stopComingSoon",
};

export function OrderTypeTabs({
  value,
  onChange,
  limitEnabled = false,
  stopEnabled = false,
  className,
}: OrderTypeTabsProps) {
  function isDisabled(type: OrderType): boolean {
    if (type === "limit") return !limitEnabled;
    if (type === "stop_market" || type === "stop_limit") return !stopEnabled;
    return false;
  }

  return (
    <div
      role="tablist"
      aria-label={t("trade.order.title")}
      className={cn(
        "grid grid-cols-4 gap-0.5 rounded-lg bg-(--color-surface) p-0.5",
        className,
      )}
    >
      {ORDER_TYPES.map((type) => {
        const active = value === type;
        const disabled = isDisabled(type);
        const hint = disabled ? DISABLED_HINT[type] : undefined;
        return (
          <button
            key={type}
            type="button"
            role="tab"
            data-testid={`trade-order-type-${type}`}
            aria-selected={active}
            disabled={disabled}
            title={hint ? t(hint) : undefined}
            onClick={() => !disabled && onChange(type)}
            className={cn(
              "min-h-10 flex-1 rounded-md px-1 text-[10px] font-medium whitespace-nowrap transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
              active
                ? "bg-(--color-surface-elev) text-foreground"
                : "text-muted-foreground hover:text-foreground",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            {t(LABEL_KEYS[type])}
          </button>
        );
      })}
    </div>
  );
}

/** @deprecated Use OrderType from order-ticket-types */
export type LegacyOrderType = "limit" | "market" | "stop";

export function legacyOrderTypeToCanonical(type: LegacyOrderType): OrderType {
  if (type === "stop") return "stop_market";
  return type;
}

export function canonicalToLegacyOrderType(type: OrderType): LegacyOrderType {
  if (type === "stop_market" || type === "stop_limit") return "stop";
  if (type === "limit") return "limit";
  return "market";
}
