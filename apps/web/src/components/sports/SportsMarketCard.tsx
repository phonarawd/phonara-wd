import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { useOddsTick } from "@/hooks/useOddsTick";
import { useBetSlip } from "./BetSlipProvider";
import { slipMarketId } from "./market-id";
import type {
  SportsFixtureSummary,
  SportsMarketOutcome,
  SportsMarketSummary,
  SportsMarketType,
} from "./types";

const SECTION_KEY: Record<string, string> = {
  match_1x2: "sports.market.match_1x2",
  totals: "sports.market.totals",
  totals_2_5: "sports.market.totals",
  spread: "sports.market.spread",
  handicap: "sports.market.spread",
  asian_handicap: "sports.market.spread",
  btts: "sports.market.btts",
  prop_over_under: "sports.market.props",
  prop_yes_no: "sports.market.props",
};

export function SportsMarketCard({
  market,
  fixture,
}: {
  market: SportsMarketSummary;
  fixture: SportsFixtureSummary;
}) {
  const { legs } = useBetSlip();
  // F12/F13 — overlay only when market.status === 'suspended'.
  const suspended = market.status === "suspended";
  const marketId = slipMarketId(fixture.fixture_id, market.market_type);
  // V3-4 — 같은 market 내 다른 outcome 선택 시 비활성 outcome 시각 약화 (Stake 패턴).
  const sameMarketActive = legs.some(
    (l) => l.fixtureId === fixture.fixture_id && l.marketId === marketId,
  );
  const isLive = fixture.status === "live" && !suspended;

  return (
    <section
      aria-label={t(SECTION_KEY[market.market_type] ?? "sports.market.props")}
      className="relative overflow-hidden rounded-xl border border-border bg-(--color-surface) p-3"
    >
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider">
          {t(SECTION_KEY[market.market_type] ?? "sports.market.props")}
          {market.line ? (
            <span className="ml-2 text-xs font-semibold normal-case text-muted-foreground tabular-nums">
              {t("sports.market.line")} {market.line}
            </span>
          ) : null}
        </h3>
      </header>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {market.outcomes.map((o) => (
          <CardOutcomeButton
            key={o.outcome_id}
            outcome={o}
            fixture={fixture}
            marketType={market.market_type}
            marketId={marketId}
            suspended={suspended}
            sameMarketActive={sameMarketActive}
            isLive={isLive}
          />
        ))}
      </div>
      {suspended && (
        <div
          aria-live="polite"
          className="absolute inset-0 grid place-items-center bg-(--color-surface)/60 backdrop-blur-[1px]"
        >
          <span className="rounded-md bg-(--color-warn)/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-(--color-warn)">
            {t("sports.errors.market_suspended")}
          </span>
        </div>
      )}
    </section>
  );
}

function CardOutcomeButton({
  outcome,
  fixture,
  marketType,
  marketId,
  suspended,
  sameMarketActive,
  isLive,
}: {
  outcome: SportsMarketOutcome;
  fixture: SportsFixtureSummary;
  marketType: SportsMarketType;
  marketId: string;
  suspended: boolean;
  sameMarketActive: boolean;
  isLive: boolean;
}) {
  const { hasOutcome, toggleLeg } = useBetSlip();
  const baseOdds = outcome.odds ?? "0.00";
  const tick = useOddsTick(outcome.outcome_id, baseOdds, isLive && !!outcome.odds);
  const active = hasOutcome(outcome.outcome_id);
  const displayOdds = outcome.odds ? tick.odds : "—";

  return (
    <button
      type="button"
      disabled={suspended || !outcome.odds}
      data-tick={tick.dir ?? undefined}
      onClick={() =>
        outcome.odds &&
        toggleLeg({
          fixtureId: fixture.fixture_id,
          marketId,
          outcomeId: outcome.outcome_id,
          selection: outcome.selection,
          oddsDisplay: tick.odds,
          marketType,
          homeName: fixture.home_name,
          awayName: fixture.away_name,
          capturedAt: outcome.captured_at ?? new Date().toISOString(),
        })
      }
      aria-pressed={active}
      className={cn(
        "flex min-h-12 items-center justify-between rounded-md border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
        "motion-safe:data-[tick=up]:border-(--color-up)/60 motion-safe:data-[tick=up]:bg-(--color-up)/10",
        "motion-safe:data-[tick=down]:border-(--color-down)/60 motion-safe:data-[tick=down]:bg-(--color-down)/10",
        active
          ? "border-(--color-primary)/40 bg-(--color-primary)/10 text-(--color-primary)"
          : sameMarketActive
            ? "border-border bg-(--color-surface-elev) text-muted-foreground opacity-60 hover:opacity-100"
            : "border-border bg-(--color-surface-elev) text-foreground hover:border-(--color-primary)/30",
      )}
    >
      <span className="truncate">
        {outcome.selection}
        {tick.dir === "up" && <span className="ml-1 text-(--color-up)">▲</span>}
        {tick.dir === "down" && (
          <span className="ml-1 text-(--color-down)">▼</span>
        )}
      </span>
      <span className="tabular-nums">{displayOdds}</span>
    </button>
  );
}
