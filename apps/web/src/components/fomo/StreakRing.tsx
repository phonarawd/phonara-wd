import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";
import { t } from "@/i18n";

export interface StreakRingProps {
  current: number;
  goal: number;
  /** CSS color var to use for the progress arc. Defaults to --color-primary. */
  accentVar?: string;
  className?: string;
}

export function StreakRing({ current, goal, accentVar = "var(--color-primary)", className }: StreakRingProps) {
  const pct = Math.min(100, (current / goal) * 100);
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div
      className={cn("relative inline-flex size-16 items-center justify-center", className)}
      role="meter"
      aria-valuenow={current}
      aria-valuemax={goal}
      aria-label={t("fomo.streak.aria.daysActive", { n: current })}
    >
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle cx="32" cy="32" r={r} stroke="var(--color-surface-elev)" strokeWidth="6" fill="none" />
        <circle
          cx="32"
          cy="32"
          r={r}
          stroke={accentVar}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <Flame className="size-3.5 text-(--color-warn)" aria-hidden />
        <div className="mt-3 text-xs font-medium">{t("fomo.streak.dayN", { n: current })}</div>
      </div>
    </div>
  );
}
