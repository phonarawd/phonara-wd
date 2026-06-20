import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import type { SyntheticBookRow } from "@/features/trading/synthetic-futures-book";

export type OrderBookPanelProps = {
  asks: readonly SyntheticBookRow[];
  bids: readonly SyntheticBookRow[];
  midDisplay: string;
  midToneClass: string;
  baseLabel?: string;
  onRowClick?: (args: { side: "long" | "short"; priceDisplay: string }) => void;
  className?: string;
  compact?: boolean;
};

export function OrderBookPanel({
  asks,
  bids,
  midDisplay,
  midToneClass,
  onRowClick,
  className,
  compact = false,
}: OrderBookPanelProps) {
  const rowLimit = compact ? 12 : 18;

  return (
    <div className={cn("trade-terminal__panel flex h-full flex-col", className)}>
      <div className="trade-terminal__panel-header">{t("trade.tab.orderbook")}</div>
      <div className="grid grid-cols-2 gap-1 border-b border-border px-3 py-1 text-[10px] text-muted-foreground">
        <span>{t("trade.orderbook.price")}</span>
        <span className="text-right">{t("trade.orderbook.size")}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul>
          {asks
            .slice()
            .reverse()
            .slice(0, rowLimit)
            .map((a, i) => (
              <li key={`a-${a.priceDisplay}-${i}`}>
                <button
                  type="button"
                  className="trade-terminal__ob-row w-full text-left"
                  onClick={() => onRowClick?.({ side: "short", priceDisplay: a.priceDisplay })}
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 right-0 bg-(--color-down)/12"
                    style={{ width: `${Math.min(100, 20 + (rowLimit - i) * 4)}%` }}
                  />
                  <span className="relative text-(--color-down)">{a.priceDisplay}</span>
                  <span className="relative text-right">{a.sizeDisplay}</span>
                </button>
              </li>
            ))}
        </ul>
        <div
          className={cn(
            "border-y border-border px-3 py-2 text-center text-sm font-semibold tabular-nums",
            midToneClass,
          )}
        >
          {midDisplay}
        </div>
        <ul>
          {bids.slice(0, rowLimit).map((b, i) => (
            <li key={`b-${b.priceDisplay}-${i}`}>
              <button
                type="button"
                className="trade-terminal__ob-row w-full text-left"
                onClick={() => onRowClick?.({ side: "long", priceDisplay: b.priceDisplay })}
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 right-0 bg-(--color-up)/12"
                  style={{ width: `${Math.min(100, 20 + (rowLimit - i) * 4)}%` }}
                />
                <span className="relative text-(--color-up)">{b.priceDisplay}</span>
                <span className="relative text-right">{b.sizeDisplay}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
