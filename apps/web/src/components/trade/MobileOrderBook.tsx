import { cn } from "@/lib/utils";
import type { Side } from "./BuyOrderSheet";

export interface OrderBookRow {
  /** Display string only — never used for calculation. */
  priceDisplay: string;
  /** Display string only. */
  sizeDisplay: string;
  /** Optional 0-1 fill ratio for the depth bar (visual only). */
  depthRatio?: number;
}

export interface MobileOrderBookProps {
  asks: OrderBookRow[];
  bids: OrderBookRow[];
  midPriceDisplay: string;
  midDir: "up" | "down" | "flat";
  /** Called when user taps a row. side is inferred (ask=short, bid=long). */
  onRowTap: (args: { side: Side; priceDisplay: string }) => void;
  className?: string;
}

export function MobileOrderBook({
  asks,
  bids,
  midPriceDisplay,
  midDir,
  onRowTap,
  className,
}: MobileOrderBookProps) {
  const midTone =
    midDir === "up"
      ? "text-(--color-up)"
      : midDir === "down"
        ? "text-(--color-down)"
        : "text-foreground";
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-(--color-surface) text-[11px]",
        className,
      )}
    >
      <div className="grid grid-cols-2 gap-1 border-b border-border px-3 py-1.5 text-[10px] text-muted-foreground">
        <span>가격 (USDT)</span>
        <span className="text-right">수량 (BTC)</span>
      </div>

      <ul>
        {asks
          .slice()
          .reverse()
          .map((a, i) => (
            <Row
              key={`a-${i}`}
              row={a}
              side="short"
              onRowTap={onRowTap}
              priceClass="text-(--color-down)"
              depthClass="bg-(--color-down)/15"
            />
          ))}
      </ul>

      <div
        className={cn(
          "border-y border-border px-3 py-2 text-center text-sm font-semibold tabular-nums",
          midTone,
        )}
      >
        {midPriceDisplay}
      </div>

      <ul>
        {bids.map((b, i) => (
          <Row
            key={`b-${i}`}
            row={b}
            side="long"
            onRowTap={onRowTap}
            priceClass="text-(--color-up)"
            depthClass="bg-(--color-up)/15"
          />
        ))}
      </ul>
    </div>
  );
}

function Row({
  row,
  side,
  onRowTap,
  priceClass,
  depthClass,
}: {
  row: OrderBookRow;
  side: Side;
  onRowTap: MobileOrderBookProps["onRowTap"];
  priceClass: string;
  depthClass: string;
}) {
  const pct = Math.max(0, Math.min(1, row.depthRatio ?? 0)) * 100;
  return (
    <li>
      <button
        type="button"
        onClick={() => onRowTap({ side, priceDisplay: row.priceDisplay })}
        className="relative grid w-full grid-cols-2 gap-1 px-3 py-1.5 text-left tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
      >
        <span
          aria-hidden
          className={cn("absolute inset-y-0 right-0 -z-0", depthClass)}
          style={{ width: `${pct}%` }}
        />
        <span className={cn("relative", priceClass)}>{row.priceDisplay}</span>
        <span className="relative text-right text-foreground/80">{row.sizeDisplay}</span>
      </button>
    </li>
  );
}
