import { t } from "@/i18n";

/**
 * Phase 12-F v0.3 §Y - Season progress thin bar (display-only mock).
 */
export interface SeasonProgressBarProps {
  percent: number;
  daysLeft: number;
  className?: string;
}

export function SeasonProgressBar({
  percent,
  daysLeft,
  className = "",
}: SeasonProgressBarProps) {
  const pct = Math.min(100, Math.max(0, percent));
  return (
    <div
      data-testid="fomo-season"
      className={`w-full rounded-xl border border-border bg-card/40 p-3 ${className}`.trim()}
    >
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="font-semibold">{t("fomo.season.title")}</span>
        <span className="text-muted-foreground">
          {t("fomo.season.daysLeft", { n: daysLeft })}
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-(--color-surface-elev)">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-(--color-primary) to-(--color-violet)"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        />
      </div>
    </div>
  );
}
