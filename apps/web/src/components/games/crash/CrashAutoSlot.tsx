/**
 * Crash · AutoSlot — typed per-game slot for the shared AutoBetPanel.
 *
 * Consumes `AutoSlotProps<"crash">` exactly:
 *   { autoCashout: string; onAutoCashoutChange: (v: string) => void }
 *
 * Input rules match the Manual-tab cashout field (Controls.shared
 * `CrashAutoCashoutField`): `[^\d.]` strip, max 8 chars, ≥1.01× hint.
 * i18n key only — no Korean literals in JSX.
 *
 * Engine 0-touch. UI is a props mirror of `selection.autoCashout`.
 */
import { Rocket, TrendingUp } from "lucide-react";
import { t } from "@/i18n";
import type { AutoSlotProps } from "../shared/types";

export function CrashAutoSlot(p: AutoSlotProps<"crash">) {
  return (
    <div className="grid gap-1" data-testid="casino-auto-slot-crash">
      <label
        htmlFor="crash-auto-slot-target"
        className="flex items-baseline justify-between text-[11px] uppercase tracking-wider text-muted-foreground"
      >
        <span className="flex items-center gap-1">
          <TrendingUp className="size-3" /> {t("games.crash.autoCashout")}
        </span>
        <span className="tabular-nums">≥ 1.01×</span>
      </label>
      <div className="flex items-center gap-1">
        <input
          id="crash-auto-slot-target"
          inputMode="decimal"
          value={p.autoCashout}
          onChange={(e) =>
            p.onAutoCashoutChange(
              e.target.value.replace(/[^\d.]/g, "").slice(0, 8),
            )
          }
          data-testid="casino-auto-crash-target"
          className="min-h-10 w-full rounded-md border border-border bg-(--color-surface) px-3 text-right font-mono text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
        />
        <span className="px-1 text-sm font-bold text-muted-foreground">×</span>
        <Rocket className="size-4 text-(--color-primary)" />
      </div>
    </div>
  );
}
