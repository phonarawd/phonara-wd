import { cn } from "@/lib/utils";

export type OrderType = "limit" | "market" | "stop";

const LABEL: Record<OrderType, string> = {
  limit: "지정가",
  market: "시장가",
  stop: "스탑",
};

export interface OrderTypeTabsProps {
  value: OrderType;
  onChange: (v: OrderType) => void;
  className?: string;
}

export function OrderTypeTabs({ value, onChange, className }: OrderTypeTabsProps) {
  const items: OrderType[] = ["limit", "market", "stop"];
  return (
    <div
      role="tablist"
      aria-label="주문 유형"
      className={cn(
        "inline-flex w-full items-center gap-1 rounded-lg bg-(--color-surface) p-1",
        className,
      )}
    >
      {items.map((k) => {
        const active = value === k;
        return (
          <button
            key={k}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(k)}
            className={cn(
              "min-h-10 flex-1 rounded-md px-3 text-xs font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
              active
                ? "bg-(--color-surface-elev) text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {LABEL[k]}
          </button>
        );
      })}
    </div>
  );
}
