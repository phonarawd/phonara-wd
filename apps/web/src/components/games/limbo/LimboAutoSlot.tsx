/**
 * Limbo · AutoSlot — typed per-game slot for the shared AutoBetPanel.
 *
 * Consumes `AutoSlotProps<"limbo">` exactly. Renders Limbo's auto-only
 * `target` input above the shared config rows. Live edits flow back to
 * the surface via `onTargetChange`, so each subsequent auto-fire picks
 * up the latest target.
 */
import { t } from "@/i18n";
import type { AutoSlotProps } from "../shared/types";

export function LimboAutoSlot(p: AutoSlotProps<"limbo">) {
  return (
    <div className="grid gap-1" data-testid="casino-auto-slot-limbo">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {t("games.limbo.target")}
      </span>
      <div className="flex items-center gap-1">
        <input
          inputMode="decimal"
          value={p.target}
          onChange={(e) => p.onTargetChange(e.target.value)}
          className="min-h-9 w-full rounded-md border border-border bg-(--color-surface) px-2 text-right font-mono text-xs tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
          data-testid="casino-auto-limbo-target"
          aria-label={t("games.limbo.target")}
          placeholder="2.00"
        />
        <span className="px-1 text-[10px] text-muted-foreground">×</span>
      </div>
    </div>
  );
}
