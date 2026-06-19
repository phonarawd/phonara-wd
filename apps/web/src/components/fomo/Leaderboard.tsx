import { cn } from "@/lib/utils";
import { TierBadge, type Tier } from "./TierBadge";
import { t } from "@/i18n";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  tier?: Tier;
  isMe?: boolean;
}

export interface LeaderboardProps {
  entries: LeaderboardEntry[];
  unit?: string;
  className?: string;
  /** Placeholder when no real data exists. */
  emptyTitle?: string;
  emptyDesc?: string;
}

export function Leaderboard({
  entries,
  unit = "P",
  className,
  emptyTitle = t("fomo.leaderboard.empty.title"),
  emptyDesc = t("fomo.leaderboard.empty.desc"),
}: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className={cn("grid gap-2 rounded-xl border border-dashed border-border p-8 text-center", className)}>
        <div className="text-sm font-medium">{emptyTitle}</div>
        <div className="text-xs text-muted-foreground">{emptyDesc}</div>
      </div>
    );
  }
  return (
    <ol className={cn("divide-y divide-border overflow-hidden rounded-xl border border-border bg-(--color-surface)", className)}>
      {entries.map((e) => (
        <li
          key={e.rank}
          className={cn(
            "flex items-center justify-between gap-3 px-4 py-3",
            e.isMe && "bg-(--color-primary)/5",
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-md text-xs font-medium tabular-nums",
                e.rank === 1 && "bg-(--color-gold)/20 text-(--color-gold)",
                e.rank === 2 && "bg-zinc-400/20 text-zinc-200",
                e.rank === 3 && "bg-amber-700/20 text-amber-400",
                e.rank > 3 && "bg-(--color-surface-elev) text-muted-foreground",
              )}
            >
              {e.rank}
            </span>
            <span className="truncate text-sm">{e.name}</span>
            {e.tier && <TierBadge tier={e.tier} />}
            {e.isMe && (
              <span className="rounded bg-(--color-primary)/20 px-1.5 text-[10px] text-(--color-primary)">ME</span>
            )}
          </div>
          <span className="shrink-0 text-sm font-medium tabular-nums">
            {e.score.toLocaleString()} {unit}
          </span>
        </li>
      ))}
    </ol>
  );
}
