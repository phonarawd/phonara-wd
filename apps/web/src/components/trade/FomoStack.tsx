import { cn } from "@/lib/utils";
import { CountdownTimer } from "@/components/fomo/CountdownTimer";
import { StreakRing } from "@/components/fomo/StreakRing";
import { MissionProgressBar } from "@/components/fomo/MissionProgressBar";
import { TierBadge, type Tier } from "@/components/fomo/TierBadge";
import { Gift } from "lucide-react";

export interface FomoStackProps {
  countdownEndsAt?: number;
  streakDays?: number;
  streakGoal?: number;
  missionCurrent?: number;
  missionGoal?: number;
  missionRewardLabel?: string;
  tier?: Tier;
  className?: string;
}

/**
 * Compact FOMO stack for the Trade BuyOrderSheet.
 * Uses --gold / --warn accents (never --primary inside Trade scope).
 */
export function FomoStack({
  countdownEndsAt,
  streakDays,
  streakGoal = 7,
  missionCurrent,
  missionGoal,
  missionRewardLabel,
  tier,
  className,
}: FomoStackProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-(--color-gold)/20 bg-gradient-to-br from-(--color-gold)/10 via-transparent to-(--color-warn)/5 p-3",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gift className="size-4 text-(--color-gold)" aria-hidden />
          <span className="text-xs font-medium">첫 주문 보너스</span>
          {tier && <TierBadge tier={tier} />}
        </div>
        {countdownEndsAt && (
          <CountdownTimer
            endsAt={countdownEndsAt}
            compact
            className="text-[11px] text-(--color-gold)"
          />
        )}
      </div>

      {(streakDays !== undefined || (missionCurrent !== undefined && missionGoal)) && (
        <div className="mt-3 flex items-center gap-3">
          {streakDays !== undefined && (
            <StreakRing
              current={streakDays}
              goal={streakGoal}
              accentVar="var(--color-gold)"
              className="shrink-0"
            />
          )}
          {missionCurrent !== undefined && missionGoal && (
            <MissionProgressBar
              current={missionCurrent}
              goal={missionGoal}
              rewardLabel={missionRewardLabel ?? "+보너스"}
              tone="gold"
              className="flex-1"
            />
          )}
        </div>
      )}
    </div>
  );
}
