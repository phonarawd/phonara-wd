/**
 * Crash · Auto-Bet countdown — Stake-class inter-round betting window UI.
 *
 * Mounted by AutoBetPanel via `countdownSlot` while a fire is pending.
 * Static "next soon" text under reduced-motion.
 */
import { t } from "@/i18n";
import { useReducedMotionGuard } from "../shared/hooks/useReducedMotionGuard";

export interface CrashAutoCountdownProps {
  seconds: number;
}

export function CrashAutoCountdown({ seconds }: CrashAutoCountdownProps) {
  const reduced = useReducedMotionGuard();
  const label = reduced
    ? t("games.crash.autoBet.nextSoon")
    : t("games.crash.autoBet.nextIn", { seconds: seconds.toFixed(1) });
  return (
    <div
      data-game-id="crash-autobet-countdown"
      data-testid="casino-autobet-countdown"
      className="rounded-md border border-border bg-(--color-surface-elev) px-2 py-1.5 text-center text-[11px] font-semibold tabular-nums text-muted-foreground"
      aria-live="polite"
    >
      {label}
    </div>
  );
}
