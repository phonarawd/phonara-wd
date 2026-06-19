import { useMemo } from "react";
import { Link } from "@/shims/react-router-dom";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { t } from "@/i18n";
import worldCupRaw from "@/mocks/sports-fixtures-world-cup.json";
import mlbRaw from "@/mocks/sports-fixtures-mlb.json";
import { BetSlipProvider } from "./BetSlipProvider";
import { BetSlipPanel } from "./BetSlipPanel";
import { SportsEmptyState } from "./SportsEmptyState";
import { SportsLiveBadge } from "./SportsLiveBadge";
import { SportsMarketCard } from "./SportsMarketCard";
import type {
  GetFixtureMarketsResult,
  SportsFixtureSummary,
  SportsMarketSummary,
} from "./types";

const ALL_FIXTURES: SportsFixtureSummary[] = [
  ...(worldCupRaw as SportsFixtureSummary[]),
  ...(mlbRaw as SportsFixtureSummary[]),
];

/**
 * Mock loader ??returns the same { markets: [...] } wrapper shape as
 * rpc_get_fixture_markets so Cursor paste can swap behind it (F11).
 */
function loadMarketsMock(fixture: SportsFixtureSummary): GetFixtureMarketsResult {
  const q = fixture.match_1x2;
  const isLive = fixture.status === "live";

  const markets: SportsMarketSummary[] = [];

  if (q) {
    markets.push({
      market_id: `${fixture.fixture_id}-1x2`,
      market_type: "match_1x2",
      status: "open",
      outcomes: [
        {
          outcome_id: q.home.outcome_id,
          selection: t("sports.market.home"),
          odds: q.home.odds,
          captured_at: q.home.captured_at,
        },
        {
          outcome_id: q.draw.outcome_id,
          selection: t("sports.market.draw"),
          odds: q.draw.odds,
          captured_at: q.draw.captured_at,
        },
        {
          outcome_id: q.away.outcome_id,
          selection: t("sports.market.away"),
          odds: q.away.odds,
          captured_at: q.away.captured_at,
        },
      ],
    });
  }

  markets.push({
    market_id: `${fixture.fixture_id}-tot25`,
    market_type: "totals_2_5",
    // F12/F13 ??live fixture's totals 1ê±´ì? suspended overlay ?œì—°.
    status: isLive ? "suspended" : "open",
    line: "2.5",
    outcomes: [
      {
        outcome_id: `${fixture.fixture_id}-tot25-o`,
        selection: t("sports.market.over"),
        odds: "1.92",
        captured_at: fixture.kickoff_at,
      },
      {
        outcome_id: `${fixture.fixture_id}-tot25-u`,
        selection: t("sports.market.under"),
        odds: "1.88",
        captured_at: fixture.kickoff_at,
      },
    ],
  });

  markets.push({
    market_id: `${fixture.fixture_id}-spread`,
    market_type: "asian_handicap",
    status: "open",
    line: "-0.5",
    outcomes: [
      {
        outcome_id: `${fixture.fixture_id}-sp-h`,
        selection: `${fixture.home_name} -0.5`,
        odds: "2.05",
        captured_at: fixture.kickoff_at,
      },
      {
        outcome_id: `${fixture.fixture_id}-sp-a`,
        selection: `${fixture.away_name} +0.5`,
        odds: "1.78",
        captured_at: fixture.kickoff_at,
      },
    ],
  });

  markets.push({
    market_id: `${fixture.fixture_id}-btts`,
    market_type: "btts",
    status: "open",
    outcomes: [
      {
        outcome_id: `${fixture.fixture_id}-btts-y`,
        selection: t("sports.market.over"),
        odds: "1.75",
        captured_at: fixture.kickoff_at,
      },
      {
        outcome_id: `${fixture.fixture_id}-btts-n`,
        selection: t("sports.market.under"),
        odds: "2.00",
        captured_at: fixture.kickoff_at,
      },
    ],
  });

  return { markets };
}

function formatKickoff(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

export function SportsFixturePage({ fixtureId }: { fixtureId: string }) {
  const fixture = useMemo(
    () => ALL_FIXTURES.find((f) => f.fixture_id === fixtureId),
    [fixtureId],
  );

  if (!fixture) {
    return (
      <BetSlipProvider>
        <AppShell density="app">
          <div className="mx-auto grid max-w-2xl gap-4 p-4">
            <SportsEmptyState />
          </div>
        </AppShell>
        <BetSlipPanel />
      </BetSlipProvider>
    );
  }

  const result = loadMarketsMock(fixture);
  const isLive = fixture.status === "live";

  return (
    <BetSlipProvider>
      <AppShell density="app">
        <div className="mx-auto grid max-w-2xl gap-4 px-4 pb-28 pt-4 lg:max-w-4xl lg:pb-8 lg:pr-[412px]">
          <Link
            to="/sports"
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" aria-hidden />
            {t("nav.sports")}
          </Link>

          <header className="rounded-2xl border border-border bg-(--color-surface) p-5">
            <div className="mb-3 flex items-center gap-2">
              {isLive && <SportsLiveBadge />}
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground tabular-nums">
                {formatKickoff(fixture.kickoff_at)}
              </span>
            </div>
            <h1 className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-2xl font-black">
              <span className="truncate">{fixture.home_name}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("sports.fixture.vs")}
              </span>
              <span className="truncate">{fixture.away_name}</span>
            </h1>
          </header>

          <div className="grid gap-3">
            {result.markets.map((m) => (
              <SportsMarketCard key={m.market_id} market={m} fixture={fixture} />
            ))}
          </div>
        </div>
      </AppShell>
      <BetSlipPanel />
    </BetSlipProvider>
  );
}
