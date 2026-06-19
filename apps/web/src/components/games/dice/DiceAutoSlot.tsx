/**
 * Dice · AutoSlot — typed per-game slot for the shared AutoBetPanel.
 *
 * Consumes `AutoSlotProps<"dice">` exactly:
 *   { target: string; onTargetChange: (v) => void;
 *     direction: "over"|"under"; onDirectionChange: (d) => void }
 *
 * Mirrors `selection.target` / `selection.direction`. Engine 0-touch.
 * i18n keys only (reuses existing `games.dice.*` — DIFF=0).
 */
import { ChevronDown, ChevronUp, Target } from "lucide-react";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import type { AutoSlotProps } from "../shared/types";

export function DiceAutoSlot(p: AutoSlotProps<"dice">) {
  const isOver = p.direction === "over";
  return (
    <div className="grid gap-2" data-testid="casino-auto-slot-dice">
      <label
        htmlFor="dice-auto-slot-target"
        className="flex items-baseline justify-between text-[11px] uppercase tracking-wider text-muted-foreground"
      >
        <span className="flex items-center gap-1">
          <Target className="size-3" /> {t("games.dice.target")}
        </span>
        <span className="tabular-nums">0.00 – 99.99</span>
      </label>
      <input
        id="dice-auto-slot-target"
        inputMode="decimal"
        value={p.target}
        onChange={(e) =>
          p.onTargetChange(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))
        }
        data-testid="casino-auto-dice-target"
        className="min-h-10 w-full rounded-md border border-border bg-(--color-surface) px-3 text-right font-mono text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
      />
      <div
        role="group"
        aria-label={t("games.dice.target")}
        className="grid grid-cols-2 gap-1 rounded-md bg-(--color-surface-elev) p-1"
      >
        <button
          type="button"
          onClick={() => p.onDirectionChange("over")}
          aria-pressed={isOver}
          data-testid="casino-auto-dice-over"
          className={cn(
            "flex items-center justify-center gap-1 rounded-sm py-1.5 text-xs font-semibold transition-colors",
            isOver
              ? "bg-(--color-surface) text-(--color-up) shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ChevronUp className="size-3" /> {t("games.dice.over")}
        </button>
        <button
          type="button"
          onClick={() => p.onDirectionChange("under")}
          aria-pressed={!isOver}
          data-testid="casino-auto-dice-under"
          className={cn(
            "flex items-center justify-center gap-1 rounded-sm py-1.5 text-xs font-semibold transition-colors",
            !isOver
              ? "bg-(--color-surface) text-(--color-down) shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ChevronDown className="size-3" /> {t("games.dice.under")}
        </button>
      </div>
    </div>
  );
}
