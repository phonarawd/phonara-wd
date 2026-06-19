import { t } from "@/i18n";
import { Leaderboard, type LeaderboardEntry } from "./Leaderboard";

const TOP5: LeaderboardEntry[] = [
  { rank: 1, name: "phoenix01", score: 482300, tier: "diamond" },
  { rank: 2, name: "ace_kim",   score: 318900, tier: "platinum" },
  { rank: 3, name: "lunaP",     score: 274100, tier: "gold", isMe: true },
  { rank: 4, name: "minho_x",   score: 198450, tier: "silver" },
  { rank: 5, name: "zerokim",   score: 152700, tier: "bronze" },
];

/**
 * Phase 12-F v0.3 §Y - Top-5 leaderboard snapshot wrapper.
 * REUSEs Phase 7 Leaderboard with mock entries (no Korean names).
 */
export function LeaderboardSnapshot({ className = "" }: { className?: string }) {
  return (
    <div data-testid="fomo-leaderboard" className={className}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {t("fomo.leaderboard.snapshotTitle")}
        </h3>
      </div>
      <Leaderboard entries={TOP5} />
    </div>
  );
}
