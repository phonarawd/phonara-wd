import { Card } from "@/components/ui/card";
import { t } from "@/i18n";
import { useLeaderboardSim } from "@/hooks/useLeaderboardSim";
import {
  LEADERBOARD_SEED,
  SELF_ROW,
  formatPrize,
} from "@/data/casino-tournaments";

/**
 * P1.2 — LeaderboardPanel
 * Top 10 with live rank deltas + pinned self row. Display-only.
 */
function rankBadge(rank: number) {
  if (rank === 1) return "bg-amber-500/20 text-amber-300 ring-amber-500/40";
  if (rank === 2) return "bg-zinc-400/20 text-zinc-200 ring-zinc-400/40";
  if (rank === 3) return "bg-orange-500/20 text-orange-300 ring-orange-500/40";
  return "bg-background/70 text-muted-foreground ring-border";
}

function DeltaArrow({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-block w-5 text-center text-[10px] text-muted-foreground">
        —
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      key={delta}
      className={`inline-flex w-5 animate-scale-in items-center justify-center gap-0.5 text-[10px] font-semibold ${up ? "text-emerald-400" : "text-rose-400"}`}
    >
      {up ? "▲" : "▼"}
      {Math.abs(delta)}
    </span>
  );
}

export function LeaderboardPanel() {
  const entries = useLeaderboardSim(LEADERBOARD_SEED);

  return (
    <Card
      data-p1-id="casino-leaderboard"
      className="overflow-hidden p-3.5"
    >
      <div className="flex items-center justify-between px-1 pb-2">
        <h3 className="text-sm font-semibold">
          <span className="mr-1.5">🏆</span>
          {t("casino.leaderboard.title")}
        </h3>
        <span className="text-[10px] text-muted-foreground">
          {t("casino.leaderboard.subtitle")}
        </span>
      </div>
      <ol className="grid divide-y divide-border/60">
        {entries.map((row) => (
          <li
            key={row.user}
            className="flex items-center justify-between gap-2 py-2"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ring-1 ${rankBadge(row.rank)}`}
              >
                {row.rank}
              </span>
              <span className="font-mono text-xs">{row.user}</span>
              <DeltaArrow delta={row.delta} />
            </div>
            <span className="font-mono text-xs tabular-nums">
              {formatPrize(row.wagered, row.currency)}
            </span>
          </li>
        ))}
        <li className="mt-1 flex items-center justify-between gap-2 rounded-md bg-primary/5 px-2 py-2 ring-1 ring-primary/30">
          <div className="flex items-center gap-2.5">
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-primary/15 px-1.5 text-[10px] font-bold text-primary ring-1 ring-primary/30">
              #{SELF_ROW.rank}
            </span>
            <span className="font-mono text-xs font-semibold">
              {t("casino.leaderboard.you")}
            </span>
          </div>
          <span className="font-mono text-xs tabular-nums">
            {formatPrize(SELF_ROW.wagered, SELF_ROW.currency)}
          </span>
        </li>
      </ol>
    </Card>
  );
}
