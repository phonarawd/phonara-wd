/**
 * Crash · HistoryStrip — last 10 bust multipliers as tabular chips.
 *
 * Presentation only. Consumes already-normalized + extracted
 * multiplier numbers (Stage owns the normalize site). Tier color
 * mirrors Stage tier rules:
 *   m >= 10 → success ring + bold
 *   m >= 2  → success soft
 *   else    → dim
 *
 * Engine 0-touch. No new keys, no Korean literals.
 */
import { memo } from "react";

export const CrashHistoryStrip = memo(function CrashHistoryStrip({
  history,
}: {
  history: number[];
}) {
  return (
    <div
      data-game-id="crash-history"
      className="flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {history.length === 0 ? (
        <span className="text-[11px] text-muted-foreground">—</span>
      ) : (
        history.map((m, i) => (
          <span
            key={i}
            data-tier={m >= 10 ? "high" : m >= 2 ? "mid" : "low"}
            className={
              m >= 10
                ? "shrink-0 rounded-full bg-skin-success/25 px-2.5 py-1 text-[11px] font-bold tabular-nums text-skin-success ring-1 ring-skin-success/40"
                : m >= 2
                  ? "shrink-0 rounded-full bg-skin-success/15 px-2.5 py-1 text-[11px] font-bold tabular-nums text-skin-success"
                  : "shrink-0 rounded-full bg-skin-surface-2 px-2.5 py-1 text-[11px] font-bold tabular-nums text-skin-fg-dim"
            }
          >
            {m.toFixed(2)}×
          </span>
        ))
      )}
    </div>
  );
});
