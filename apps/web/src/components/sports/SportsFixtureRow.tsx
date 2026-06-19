import { Link } from "@/shims/react-router-dom";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { useOddsTick } from "@/hooks/useOddsTick";
import { useBetSlip } from "./BetSlipProvider";
import { slipMarketId } from "./market-id";
import { SportsLiveBadge } from "./SportsLiveBadge";
import type { SportsFixtureSummary } from "./types";

function formatKickoff(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

function leagueCodeToKey(code: SportsFixtureSummary["league_code"]): string {
  switch (code) {
    case "world-cup":
      return "world_cup";
    case "k-league":
      return "k_league";
    default:
      return code;
  }
}

export function SportsFixtureRow({ fixture }: { fixture: SportsFixtureSummary }) {
  const isLive = fixture.status === "live";
  const isFinished = fixture.status === "finished";

  const quick = fixture.match_1x2;
  const leagueLabelKey = fixture.league_code
    ? `sports.league.${leagueCodeToKey(fixture.league_code)}`
    : null;

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/40 bg-(--color-surface) px-4 py-3 transition-colors hover:bg-(--color-surface-elev) last:border-b-0",
        "min-h-[68px]",
        isFinished && "opacity-60",
      )}
    >
      <Link
        to="/sports/fixture/$fixtureId"
        params={{ fixtureId: fixture.fixture_id }}
        className="grid min-w-0 gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
      >
        <div className="flex min-w-0 items-center gap-2">
          {isLive && <SportsLiveBadge />}
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground tabular-nums">
            {formatKickoff(fixture.kickoff_at)}
          </span>
          {leagueLabelKey && (
            <span className="shrink-0 rounded bg-(--color-surface-elev) px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t(leagueLabelKey)}
            </span>
          )}
          {isFinished && (
            <span className="shrink-0 rounded bg-(--color-surface-elev) px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("sports.fixture.finished")}
            </span>
          )}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 text-[15px] font-semibold text-foreground">
          <span className="truncate">{fixture.home_name}</span>
          <span className="px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("sports.fixture.vs")}
          </span>
          <span className="truncate">{fixture.away_name}</span>
        </div>
      </Link>
      {quick && (
        <div className="grid w-[192px] shrink-0 grid-cols-3 gap-1.5">
          {(["home", "draw", "away"] as const).map((key) => {
            const o = quick[key];
            return (
              <QuickOutcomeButton
                key={key}
                fixture={fixture}
                outcomeKey={key}
                outcomeId={o.outcome_id}
                baseOdds={o.odds}
                capturedAt={o.captured_at}
                isLive={isLive}
                isFinished={isFinished}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuickOutcomeButton({
  fixture,
  outcomeKey,
  outcomeId,
  baseOdds,
  capturedAt,
  isLive,
  isFinished,
}: {
  fixture: SportsFixtureSummary;
  outcomeKey: "home" | "draw" | "away";
  outcomeId: string;
  baseOdds: string;
  capturedAt: string;
  isLive: boolean;
  isFinished: boolean;
}) {
  const { hasOutcome, toggleLeg } = useBetSlip();
  const tick = useOddsTick(outcomeId, baseOdds, isLive);
  const active = hasOutcome(outcomeId);
  return (
    <button
      type="button"
      disabled={isFinished}
      data-tick={tick.dir ?? undefined}
      onClick={() =>
        toggleLeg({
          fixtureId: fixture.fixture_id,
          marketId: slipMarketId(fixture.fixture_id, "match_1x2"),
          outcomeId,
          selection: t(`sports.market.${outcomeKey}`),
          oddsDisplay: tick.odds,
          marketType: "match_1x2",
          homeName: fixture.home_name,
          awayName: fixture.away_name,
          capturedAt,
        })
      }
      aria-pressed={active}
      aria-label={`${t(`sports.market.${outcomeKey}`)} ${tick.odds}`}
      className={cn(
        "grid h-12 place-items-center rounded-lg border text-sm font-bold tabular-nums transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
        "motion-safe:data-[tick=up]:border-(--color-up)/60 motion-safe:data-[tick=up]:bg-(--color-up)/15",
        "motion-safe:data-[tick=down]:border-(--color-down)/60 motion-safe:data-[tick=down]:bg-(--color-down)/15",
        active
          ? "border-(--color-primary)/60 bg-(--color-primary)/15 text-(--color-primary) shadow-[inset_0_0_0_1px_var(--color-primary)]/30"
          : "border-border bg-(--color-surface-elev) text-foreground hover:border-(--color-primary)/40 hover:bg-(--color-primary)/5",
      )}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {t(`sports.market.${outcomeKey}`)}
        {tick.dir === "up" && <span className="ml-0.5 text-(--color-up)">▲</span>}
        {tick.dir === "down" && (
          <span className="ml-0.5 text-(--color-down)">▼</span>
        )}
      </span>
      <span>{tick.odds}</span>
    </button>
  );
}
