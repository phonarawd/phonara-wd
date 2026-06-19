import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { normalizeRecentBets } from "./adapt-recent-bet";
import type { PhonaraRecentBet, RecentBetStripRow } from "./types";

export interface BetHistoryStripProps {
  /** Accepts either Lovable strip rows or PHONARA snake_case rows; normalized internally. */
  bets: RecentBetStripRow[] | PhonaraRecentBet[];
  /** Hide currency column (single-game catalog). */
  compact?: boolean;
  className?: string;
}

/**
 * Virtualized recent-bet ribbon. Renders a vertical list of up to N bets;
 * uses @tanstack/react-virtual to keep DOM cost flat regardless of bet count.
 */
export function BetHistoryStrip({ bets: input, compact, className }: BetHistoryStripProps) {
  const bets = normalizeRecentBets(input);
  const parentRef = useRef<HTMLDivElement>(null);
  const v = useVirtualizer({
    count: bets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 6,
  });

  if (bets.length === 0) {
    return (
      <div
        className={cn(
          "grid h-24 place-items-center rounded-xl border border-dashed border-border bg-(--color-surface)/40 text-xs text-muted-foreground",
          className,
        )}
      >
        {t("games.shared.history.empty")}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-(--color-surface)/60",
        className,
      )}
    >
      <div className="border-b border-border px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {t("games.shared.history.title")}
      </div>
      <div ref={parentRef} className="max-h-64 overflow-auto" style={{ contain: "strict" }}>
        <div style={{ height: v.getTotalSize(), position: "relative" }}>
          {v.getVirtualItems().map((row) => {
            const b = bets[row.index];
            if (!b) return null;
            return (
              <div
                key={b.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${row.start}px)`,
                  height: row.size,
                }}
                className="flex items-center gap-2 px-3 text-[11px] tabular-nums"
              >
                <span
                  className={cn(
                    "inline-block w-12 shrink-0 rounded-sm px-1 py-0.5 text-center font-mono text-[10px] font-bold",
                    b.win
                      ? "bg-(--color-up)/15 text-(--color-up)"
                      : "bg-(--color-down)/15 text-(--color-down)",
                  )}
                >
                  {b.multiplier}×
                </span>
                {!compact && (
                  <span className="w-12 shrink-0 text-muted-foreground">
                    {b.currency}
                  </span>
                )}
                <span className="flex-1 truncate text-muted-foreground">
                  {b.stake}
                </span>
                <span
                  className={cn(
                    b.win ? "text-(--color-up)" : "text-(--color-down)",
                  )}
                >
                  {b.win ? "+" : "−"}
                  {b.payout}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
