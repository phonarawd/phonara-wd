import { t } from "@/i18n";
import { TournamentCard } from "./TournamentCard";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { TOURNAMENTS } from "@/data/casino-tournaments";

/**
 * P1.2 — TournamentsSection
 * 3 live tournaments + global leaderboard. Display-only · mock feed.
 */
export function TournamentsSection() {
  return (
    <section data-p1-id="casino-tournaments" className="grid gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">
          <span className="mr-1.5">🎯</span>
          {t("casino.tournament.sectionTitle")}
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {t("casino.tournament.sectionSubtitle")}
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_minmax(280px,360px)]">
        {TOURNAMENTS.map((tourney) => (
          <TournamentCard key={tourney.id} tournament={tourney} />
        ))}
        <LeaderboardPanel />
      </div>
    </section>
  );
}
