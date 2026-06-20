import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import type { SyntheticBookRow } from "@/features/trading/synthetic-futures-book";

export type VirtualizedOrderBookPanelProps = {
  asks: readonly SyntheticBookRow[];
  bids: readonly SyntheticBookRow[];
  midDisplay: string;
  midToneClass: string;
  baseLabel?: string;
  onRowClick?: (args: { side: "long" | "short"; priceDisplay: string }) => void;
  className?: string;
  compact?: boolean;
};

type RowItem =
  | { kind: "ask"; row: SyntheticBookRow; index: number }
  | { kind: "mid" }
  | { kind: "bid"; row: SyntheticBookRow; index: number };

export function VirtualizedOrderBookPanel({
  asks,
  bids,
  midDisplay,
  midToneClass,
  onRowClick,
  className,
  compact = false,
}: VirtualizedOrderBookPanelProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowLimit = compact ? 12 : 18;
  const askRows = asks.slice().reverse().slice(0, rowLimit);
  const bidRows = bids.slice(0, rowLimit);

  const items: RowItem[] = [
    ...askRows.map((row, index) => ({ kind: "ask" as const, row, index })),
    { kind: "mid" as const },
    ...bidRows.map((row, index) => ({ kind: "bid" as const, row, index })),
  ];

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (compact ? 44 : 22),
    overscan: 8,
  });

  return (
    <div className={cn("trade-terminal__panel flex h-full flex-col", className)}>
      <div className="trade-terminal__panel-header">{t("trade.tab.orderbook")}</div>
      <div className="grid grid-cols-2 gap-1 border-b border-border px-3 py-1 text-[10px] text-muted-foreground">
        <span>{t("trade.orderbook.price")}</span>
        <span className="text-right">{t("trade.orderbook.size")}</span>
      </div>
      <div ref={parentRef} className="flex-1 overflow-y-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((vRow) => {
            const item = items[vRow.index];
            if (!item) return null;
            return (
              <div
                key={vRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${vRow.size}px`,
                  transform: `translateY(${vRow.start}px)`,
                }}
              >
                {item.kind === "mid" ? (
                  <div
                    className={cn(
                      "border-y border-border px-3 py-2 text-center text-sm font-semibold tabular-nums",
                      midToneClass,
                    )}
                  >
                    {midDisplay}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="trade-terminal__ob-row w-full text-left"
                    onClick={() =>
                      onRowClick?.({
                        side: item.kind === "ask" ? "short" : "long",
                        priceDisplay: item.row.priceDisplay,
                      })
                    }
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-y-0 right-0",
                        item.kind === "ask" ? "bg-(--color-down)/12" : "bg-(--color-up)/12",
                      )}
                      style={{
                        width: `${Math.min(100, 20 + (rowLimit - item.index) * 4)}%`,
                      }}
                    />
                    <span
                      className={cn(
                        "relative",
                        item.kind === "ask" ? "text-(--color-down)" : "text-(--color-up)",
                      )}
                    >
                      {item.row.priceDisplay}
                    </span>
                    <span className="relative text-right">{item.row.sizeDisplay}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
