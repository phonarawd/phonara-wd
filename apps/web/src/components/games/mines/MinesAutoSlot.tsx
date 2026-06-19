/**
 * Mines · AutoSlot — typed per-game slot for the shared AutoBetPanel.
 *
 * Consumes `AutoSlotProps<"mines">` exactly. Renders the auto-only
 * params:
 *   - mineCount (1/3/5/10/15/24 chips) → engine `selection.mineCount`
 *   - revealCount (1..(25-mineCount)) → how many tiles each auto-fire
 *     pre-picks via Controls' `onAutoFire` wrapper.
 *
 * §0a: this slot never reads engine result. It only edits auto-only
 * configuration; revealedCells assignment happens in `useMinesOnPrimary`.
 */
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import type { AutoSlotProps } from "../shared/types";

const MINE_CHOICES = [1, 3, 5, 10, 15, 24] as const;
const GRID = 25;

export function MinesAutoSlot(p: AutoSlotProps<"mines">) {
  const maxReveal = Math.max(1, GRID - p.mineCount);
  const reveal = Math.min(Math.max(1, p.revealCount), maxReveal);

  return (
    <div className="grid gap-2" data-testid="casino-auto-slot-mines">
      <div className="grid gap-1">
        <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{t("games.mines.count")}</span>
          <span className="tabular-nums">{p.mineCount}</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {MINE_CHOICES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => p.onMineCountChange(m)}
              data-testid={`casino-auto-mines-${m}`}
              className={cn(
                "min-h-9 rounded-md border text-xs font-semibold tabular-nums",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
                p.mineCount === m
                  ? "border-(--color-primary) bg-(--color-primary)/15 text-(--color-primary)"
                  : "border-border bg-(--color-surface) text-muted-foreground hover:text-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-1">
        <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{t("casino.auto.mines.reveal")}</span>
          <span className="tabular-nums">
            {reveal} / {maxReveal}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => p.onRevealCountChange(Math.max(1, reveal - 1))}
            disabled={reveal <= 1}
            data-testid="casino-auto-reveal-dec"
            aria-label={t("casino.auto.mines.revealDec")}
            className="min-h-9 w-9 rounded-md border border-border bg-(--color-surface) text-sm font-bold disabled:opacity-50"
          >
            −
          </button>
          <input
            inputMode="numeric"
            value={String(reveal)}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^0-9]/g, "")) || 1;
              p.onRevealCountChange(Math.min(Math.max(1, n), maxReveal));
            }}
            data-testid="casino-auto-reveal"
            aria-label={t("casino.auto.mines.reveal")}
            className="min-h-9 w-full rounded-md border border-border bg-(--color-surface) px-2 text-center font-mono text-xs tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
          />
          <button
            type="button"
            onClick={() =>
              p.onRevealCountChange(Math.min(maxReveal, reveal + 1))
            }
            disabled={reveal >= maxReveal}
            data-testid="casino-auto-reveal-inc"
            aria-label={t("casino.auto.mines.revealInc")}
            className="min-h-9 w-9 rounded-md border border-border bg-(--color-surface) text-sm font-bold disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
