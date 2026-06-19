import { cn } from "@/lib/utils";
import { CountdownTimer } from "./CountdownTimer";

export interface MissionProgressBarProps {
  current: number;
  goal: number;
  rewardLabel: string;
  endsAt?: number;
  /** Visual tone — Trade scope must use 'gold' (never --primary). */
  tone?: "primary" | "gold";
  className?: string;
}

export function MissionProgressBar({
  current,
  goal,
  rewardLabel,
  endsAt,
  tone = "primary",
  className,
}: MissionProgressBarProps) {
  const pct = Math.min(100, (current / goal) * 100);
  const done = current >= goal;
  const accentText = tone === "gold" ? "text-(--color-gold)" : "text-(--color-primary)";
  const accentBar = tone === "gold" ? "bg-(--color-gold)" : "bg-(--color-primary)";
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground tabular-nums">
          {current.toLocaleString()} / {goal.toLocaleString()}
        </span>
        <span className="flex items-center gap-2">
          <span className={cn("font-medium", accentText)}>{rewardLabel}</span>
          {endsAt && <CountdownTimer endsAt={endsAt} compact className="text-[10px] text-muted-foreground" />}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-(--color-surface-elev)">
        <div
          className={cn(
            "h-full transition-all",
            done ? "bg-(--color-up)" : accentBar,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
