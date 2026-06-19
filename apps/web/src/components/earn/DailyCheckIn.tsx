import { cn } from "@/lib/utils";
import { Check, Gift } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/i18n";

export interface DailyCheckInDay {
  label: string;
  rewardLabel: string;
  claimed?: boolean;
  today?: boolean;
}

export interface DailyCheckInProps {
  /** 7-day display data. */
  days: DailyCheckInDay[];
  /** Streak indicator text. */
  streakLabel: string;
  /** Today's reward label (display string only). */
  todayRewardLabel: string;
  compact?: boolean;
  /** Mock claim — toast only, no state mutation. */
  onClaim?: () => void;
  className?: string;
}

/**
 * Daily attendance row. Display-only — clicking the claim button never
 * mutates points, balances, or tickets. Toast feedback only.
 */
export function DailyCheckIn({
  days,
  streakLabel,
  todayRewardLabel,
  compact,
  onClaim,
  className,
}: DailyCheckInProps) {
  const handleClaim = () => {
    if (onClaim) onClaim();
    else
      toast.success(
        t("earn.attendance.claimedToast", { reward: todayRewardLabel }),
      );
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">{t("earn.attendance.title")}</div>
        <div className="text-xs text-muted-foreground">{streakLabel}</div>
      </div>

      <div className={cn("grid grid-cols-7", compact ? "gap-1" : "gap-1.5")}>
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "grid place-items-center rounded-md text-[10px] font-medium tabular-nums",
                compact ? "size-8" : "size-10",
                d.claimed
                  ? "bg-(--color-up)/15 text-(--color-up)"
                  : d.today
                    ? "bg-(--color-gold)/15 text-(--color-gold) ring-1 ring-(--color-gold)/40"
                    : "bg-(--color-surface-elev) text-muted-foreground",
              )}
              aria-label={`${d.label} ${d.rewardLabel}`}
            >
              {d.claimed ? (
                <Check className="size-3.5" aria-hidden />
              ) : (
                <Gift className="size-3.5" aria-hidden />
              )}
            </div>
            <div className="text-[10px] text-muted-foreground">{d.label}</div>
            {!compact && (
              <div
                className={cn(
                  "text-[10px] tabular-nums",
                  d.today ? "text-(--color-gold)" : "text-muted-foreground/70",
                )}
              >
                {d.rewardLabel}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleClaim}
        className="mt-4 flex min-h-12 w-full items-center justify-center rounded-lg bg-(--color-primary) text-sm font-semibold text-(--color-primary-foreground) transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
      >
        {t("earn.attendance.cta", { reward: todayRewardLabel })}
      </button>
    </div>
  );
}
