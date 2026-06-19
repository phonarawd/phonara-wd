import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { t } from "@/i18n";
import worldCupRaw from "@/mocks/sports-fixtures-world-cup.json";
import mlbRaw from "@/mocks/sports-fixtures-mlb.json";
import { BetSlipProvider } from "./BetSlipProvider";
import { BetSlipPanel } from "./BetSlipPanel";
import { MyBetsList } from "./MyBetsList";
import { SportsEmptyState } from "./SportsEmptyState";
import { SportsFixtureRow } from "./SportsFixtureRow";
import { SportsLeagueChips, type LeagueKey } from "./SportsLeagueChips";
import { SportsLiveBadge } from "./SportsLiveBadge";
import { SportsTabs, type SportsTabKey } from "./SportsTabs";
import type { SportsFixtureSummary } from "./types";

const ALL_FIXTURES: SportsFixtureSummary[] = [
  ...(worldCupRaw as SportsFixtureSummary[]),
  ...(mlbRaw as SportsFixtureSummary[]),
];

interface Props {
  initialTab?: SportsTabKey;
  initialLeague?: LeagueKey;
  onChange?: (next: { tab: SportsTabKey; league: LeagueKey }) => void;
}

function formatKickoffShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

export function SportsHubPage({
  initialTab = "featured",
  initialLeague = "all",
  onChange,
}: Props) {
  const [tab, setTab] = useState<SportsTabKey>(initialTab);
  const [league, setLeague] = useState<LeagueKey>(initialLeague);

  const liveCount = useMemo(
    () => ALL_FIXTURES.filter((f) => f.status === "live").length,
    [],
  );

  const nextKickoff = useMemo(() => {
    const upcoming = ALL_FIXTURES.filter((f) => f.status === "scheduled")
      .map((f) => f.kickoff_at)
      .sort();
    return upcoming[0] ?? null;
  }, []);

  const filtered = useMemo(() => {
    let pool = ALL_FIXTURES;
    if (league !== "all") {
      pool = pool.filter((f) => f.league_code === league);
    }
    if (tab === "live") pool = pool.filter((f) => f.status === "live");
    if (tab === "upcoming")
      pool = pool.filter((f) => f.status === "scheduled");
    if (tab === "featured")
      pool = pool.filter((f) => f.status !== "finished");
    return pool;
  }, [tab, league]);

  const update = (next: { tab?: SportsTabKey; league?: LeagueKey }) => {
    const t2 = next.tab ?? tab;
    const l2 = next.league ?? league;
    if (next.tab) setTab(next.tab);
    if (next.league) setLeague(next.league);
    onChange?.({ tab: t2, league: l2 });
  };

  return (
    <BetSlipProvider>
      <AppShell density="app">
        <div className="mx-auto grid max-w-2xl gap-4 px-4 pb-28 pt-4 lg:max-w-4xl lg:pb-8 lg:pr-[412px]">
          <header className="flex flex-wrap items-end justify-between gap-3 pt-2">
            <h1 className="text-3xl font-black uppercase tracking-tight">
              {t("nav.sports")}
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {liveCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <SportsLiveBadge />
                  <span className="font-bold tabular-nums text-foreground">
                    {liveCount}
                  </span>
                </span>
              )}
              {nextKickoff && (
                <span className="tabular-nums">
                  {t("sports.fixture.kickoff")} · {formatKickoffShort(nextKickoff)}
                </span>
              )}
            </div>
          </header>

          <SportsTabs
            value={tab}
            onChange={(v) => update({ tab: v })}
            liveCount={liveCount}
          />
          <SportsLeagueChips
            value={league}
            onChange={(v) => update({ league: v })}
          />

          {tab === "my-bets" ? (
            <MyBetsList />
          ) : filtered.length === 0 ? (
            <SportsEmptyState />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-(--color-surface)">
              {filtered.map((fx) => (
                <SportsFixtureRow key={fx.fixture_id} fixture={fx} />
              ))}
            </div>
          )}
        </div>
      </AppShell>
      <BetSlipPanel />
    </BetSlipProvider>
  );
}
