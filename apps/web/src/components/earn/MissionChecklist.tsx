import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { Check, Circle, Clock, Lock } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/i18n";
import { DailyQuizMock } from "@/components/earn/micro/DailyQuizMock";

// Wave 3R — inline micro panels mount for these ids only. Every other row
// takes the byte-equivalent legacy code path. Do NOT extend without LOCK.
// Operator policy: no ad-watch / survey-ad surfaces — quiz only.
const MICRO_PANELS: Record<string, ComponentType> = {
  "daily-quiz": DailyQuizMock,
};

export type MissionStatus = "todo" | "claimable" | "done";
export type MissionLane =
  | "daily"
  | "growth"
  | "viral"
  | "weekly"
  | "tier"
  | "social";

export interface MissionItem {
  id: string;
  /** i18n key for the row title, e.g. "mission.daily.todaySpin". */
  titleKey: string;
  /** "+1,000P" — display string only. */
  rewardLabel: string;
  /** Progress display string like "0 / 1" (no calculation). */
  progressLabel: string;
  status: MissionStatus;
  lane: MissionLane;
  /** @deprecated kept for signature compatibility. */
  demo?: boolean;
  /** Locked / coming soon — disables the button, shows locked label. */
  soon?: boolean;

}

export interface MissionChecklistProps {
  items: MissionItem[];
  /** Mock claim — toast only. Never mutates points, balances, or tickets. */
  onClaim?: (id: string) => void;
  className?: string;
}

const LANE_ORDER: MissionLane[] = [
  "daily",
  "growth",
  "viral",
  "weekly",
  "tier",
  "social",
];

/**
 * Mission hub — 6 vertical sections (A daily, B growth, C viral, D weekly,
 * E tier, F social). Pure display; claim handlers fire a toast only.
 */
export function MissionChecklist({
  items,
  onClaim,
  className,
}: MissionChecklistProps) {
  return (
    <div className={cn("grid gap-5", className)}>
      {LANE_ORDER.map((lane) => {
        const rows = items.filter((it) => it.lane === lane);
        if (rows.length === 0) return null;
        return (
          <section key={lane} className="grid gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(`mission.tab.${lane}`)}
            </h3>
            <p className="-mt-1 text-[11px] text-muted-foreground/80">
              {t(`mission.lane.subtitle.${lane}`)}
            </p>
            <ul className="grid gap-2">
              {rows.map((it) => {
                const Panel = MICRO_PANELS[it.id];
                if (Panel) {
                  return (
                    <li key={it.id} className="grid gap-1">
                      <Row item={it} onClaim={onClaim} />
                      <details className="ml-12">
                        <summary className="cursor-pointer text-[11px] text-muted-foreground">
                          {t("earn.micro.expand")}
                        </summary>
                        <Panel />
                      </details>
                    </li>
                  );
                }
                return <Row key={it.id} item={it} onClaim={onClaim} />;
              })}
            </ul>
          </section>
        );

      })}
    </div>
  );
}

function Row({
  item,
  onClaim,
}: {
  item: MissionItem;
  onClaim?: (id: string) => void;
}) {
  const done = item.status === "done";
  const claimable = item.status === "claimable";
  const disabled = !!item.soon;

  const handle = () => {
    if (item.soon) {
      toast(t("mission.toast.soon"));
      return;
    }
    if (done) {
      toast(t("mission.toast.claimed"));
      return;
    }
    if (onClaim) onClaim(item.id);
    else
      toast.success(
        t("mission.toast.claimReward", { reward: item.rewardLabel }),
      );
  };

  const buttonLabel = item.soon
    ? t("mission.btn.locked")
    : done
      ? t("mission.btn.done")
      : claimable
        ? t("mission.btn.claim")
        : t("mission.btn.go");

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full",
          done
            ? "bg-(--color-up)/15 text-(--color-up)"
            : claimable
              ? "bg-(--color-gold)/15 text-(--color-gold)"
              : item.soon
                ? "bg-(--color-surface-elev) text-muted-foreground"
                : "bg-(--color-surface-elev) text-muted-foreground",
        )}
        aria-hidden
      >
        {done ? (
          <Check className="size-4" />
        ) : item.soon ? (
          <Lock className="size-4" />
        ) : claimable ? (
          <Circle className="size-4" />
        ) : (
          <Clock className="size-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium">{t(item.titleKey)}</span>
          {item.soon && (
            <span className="rounded bg-(--color-warn)/15 px-1.5 py-0.5 text-[10px] text-(--color-warn)">
              {t("common.label.comingSoon")}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="tabular-nums">{item.progressLabel}</span>
          <span className="text-(--color-gold)">{item.rewardLabel}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handle}
        disabled={disabled}
        className={cn(
          "min-h-12 shrink-0 rounded-md px-3 text-xs font-semibold transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
          disabled
            ? "cursor-not-allowed bg-(--color-surface-elev) text-muted-foreground opacity-60"
            : done
              ? "bg-(--color-surface-elev) text-muted-foreground"
              : claimable
                ? "bg-(--color-gold) text-black hover:opacity-90"
                : "border border-border bg-transparent text-foreground hover:bg-(--color-surface-elev)",
        )}
      >
        {buttonLabel}
      </button>
    </li>
  );
}
