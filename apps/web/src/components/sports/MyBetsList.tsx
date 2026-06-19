import { useState } from "react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { CashoutCard } from "./CashoutCard";
import type {
  SportsBetStatus,
  SportsFixtureStatus,
  SportsMarketStatus,
} from "./types";

// SSR-safe UTC formatter — identical pattern to SportsFixtureRow.formatKickoff
// (Step 6-R Option D). Locale-free → server/client render match · hydration safe.
function formatKickoff(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}


interface MockBet {
  id: string;
  status: SportsBetStatus;
  legs: { home: string; away: string; selection: string; odds: string }[];
  stake: string;
  placedCombinedOdds: string;
  currentCombinedOdds: string;
  placedAt: string;
  fixtureStatus: SportsFixtureStatus;
  marketStatus: SportsMarketStatus;
}

// Mock rows — paste 후 useListMySportsBets로 교체.
const MOCK_BETS: MockBet[] = [
  {
    id: "bet-001",
    status: "pending",
    legs: [
      { home: "Argentina", away: "France", selection: "Home", odds: "2.10" },
    ],
    stake: "10,000",
    placedCombinedOdds: "2.10",
    currentCombinedOdds: "1.95",
    placedAt: "2026-06-16T07:30:00Z",
    fixtureStatus: "live",
    marketStatus: "open",
  },
  {
    id: "bet-006",
    status: "pending",
    legs: [
      { home: "Brazil", away: "Germany", selection: "Away", odds: "3.80" },
      { home: "Spain", away: "Portugal", selection: "Draw", odds: "3.10" },
    ],
    stake: "5,000",
    placedCombinedOdds: "11.78",
    currentCombinedOdds: "13.20",
    placedAt: "2026-06-16T08:10:00Z",
    fixtureStatus: "live",
    marketStatus: "suspended",
  },
  {
    id: "bet-002",
    status: "won",
    legs: [
      { home: "Japan", away: "Mexico", selection: "Away", odds: "2.55" },
      { home: "Yankees", away: "Dodgers", selection: "Home", odds: "1.85" },
    ],
    stake: "5,000",
    placedCombinedOdds: "4.71",
    currentCombinedOdds: "4.71",
    placedAt: "2026-06-11T22:10:00Z",
    fixtureStatus: "finished",
    marketStatus: "closed",
  },
  {
    id: "bet-003",
    status: "lost",
    legs: [
      { home: "Brazil", away: "Germany", selection: "Draw", odds: "3.50" },
    ],
    stake: "20,000",
    placedCombinedOdds: "3.50",
    currentCombinedOdds: "3.50",
    placedAt: "2026-06-10T18:00:00Z",
    fixtureStatus: "finished",
    marketStatus: "closed",
  },
  {
    id: "bet-004",
    status: "cashed_out",
    legs: [
      { home: "Spain", away: "Portugal", selection: "Home", odds: "2.30" },
    ],
    stake: "8,000",
    placedCombinedOdds: "2.30",
    currentCombinedOdds: "2.30",
    placedAt: "2026-06-09T20:00:00Z",
    fixtureStatus: "finished",
    marketStatus: "closed",
  },
  {
    id: "bet-005",
    status: "void",
    legs: [{ home: "Cubs", away: "Astros", selection: "Away", odds: "1.78" }],
    stake: "3,000",
    placedCombinedOdds: "1.78",
    currentCombinedOdds: "1.78",
    placedAt: "2026-06-08T23:30:00Z",
    fixtureStatus: "cancelled",
    marketStatus: "closed",
  },
];

const STATUS_STYLE: Record<SportsBetStatus, string> = {
  pending: "bg-(--color-surface-elev) text-muted-foreground",
  won: "bg-(--color-up)/15 text-(--color-up)",
  lost: "bg-(--color-down)/15 text-(--color-down)",
  void: "bg-(--color-warn)/15 text-(--color-warn)",
  cashed_out: "bg-(--color-info)/15 text-(--color-info)",
};

export function MyBetsList() {
  const [cashedOut, setCashedOut] = useState<Set<string>>(new Set());
  return (
    <div className="grid gap-2">
      {MOCK_BETS.map((bet) => {
        const effectiveStatus: SportsBetStatus = cashedOut.has(bet.id)
          ? "cashed_out"
          : bet.status;
        const showCashout =
          bet.status === "pending" && !cashedOut.has(bet.id);
        return (
          <article
            key={bet.id}
            className={cn(
              "rounded-xl border border-border bg-(--color-surface) p-3 transition-opacity",
              cashedOut.has(bet.id) && "opacity-60",
            )}
          >
            <header className="mb-2 flex items-center justify-between">
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  STATUS_STYLE[effectiveStatus],
                )}
              >
                {t(`sports.bet.status.${effectiveStatus}`)}
              </span>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {formatKickoff(bet.placedAt)}
              </span>
            </header>
            <ul className="mb-2 grid gap-1">
              {bet.legs.map((leg, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="min-w-0 truncate">
                    {leg.home}{" "}
                    <span className="text-muted-foreground">
                      {t("sports.fixture.vs")}
                    </span>{" "}
                    {leg.away}{" "}
                    <span className="text-muted-foreground">
                      · {leg.selection}
                    </span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {leg.odds}
                  </span>
                </li>
              ))}
            </ul>
            <footer className="flex items-center justify-between border-t border-border/60 pt-2 text-xs">
              <span className="text-muted-foreground">
                {t("sports.slip.stake")}{" "}
                <span className="tabular-nums text-foreground">
                  {bet.stake}
                </span>
              </span>
              <span className="text-muted-foreground">
                {t("sports.slip.combined")}{" "}
                <span className="tabular-nums text-foreground">
                  {bet.placedCombinedOdds}
                </span>
              </span>
            </footer>
            {showCashout && (
              <CashoutCard
                bet={{
                  id: bet.id,
                  status: "pending",
                  stake: bet.stake,
                  placedCombinedOdds: bet.placedCombinedOdds,
                  currentCombinedOdds: bet.currentCombinedOdds,
                  fixtureStatus: bet.fixtureStatus,
                  marketStatus: bet.marketStatus,
                }}
                onCashedOut={(id) =>
                  setCashedOut((s) => {
                    const n = new Set(s);
                    n.add(id);
                    return n;
                  })
                }
              />
            )}
          </article>
        );
      })}
    </div>
  );
}
