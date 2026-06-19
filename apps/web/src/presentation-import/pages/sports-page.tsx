import { SportsHubPage } from "@/components/sports/SportsHubPage";
import type { LeagueKey } from "@/components/sports/SportsLeagueChips";
import type { SportsTabKey } from "@/components/sports/SportsTabs";

export type ImportedSportsPageProps = {
  initialTab?: SportsTabKey;
  initialLeague?: LeagueKey;
  onChange?: (next: { tab: SportsTabKey; league: LeagueKey }) => void;
};

/** L2-S — /sports presentation page (mock fixtures · RPC defer). */
export function ImportedSportsPage(props: ImportedSportsPageProps) {
  return <SportsHubPage {...props} />;
}
