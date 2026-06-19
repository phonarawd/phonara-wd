import { Link } from "@/shims/react-router-dom";
import { Card } from "@/components/ui/card";
import { Trophy, ChevronRight } from "lucide-react";
import { t } from "@/i18n";
import { useLiveCount } from "@/hooks/useLiveCount";
import { useTournamentCountdown } from "@/hooks/useTournamentCountdown";
import {
  TOURNAMENTS,
  formatPrize,
  type Tournament,
} from "@/data/casino-tournaments";

/**
 * 12-A v0.2 ??TournamentStrip
 * Stake-grade horizontal-scroll snap rail of live tournaments.
 * Display-only · mock feed. Distinct from TournamentsSection grid.
 */

const ACCENT_RING: Record<Tournament["accent"], string> = {
  rose: "ring-rose-500/40",
  emerald: "ring-emerald-500/40",
  amber: "ring-amber-500/40",
  violet: "ring-violet-500/40",
  cyan: "ring-cyan-500/40",
};

const ACCENT_DOT: Record<Tournament["accent"], string> = {
  rose: "bg-rose-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  cyan: "bg-cyan-500",
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function StripCard({ tournament }: { tournament: Tournament }) {
  const prizeNow = useLiveCount(tournament.prize, {
    minPct: 0.0006,
    maxPct: 0.0028,
    minIntervalMs: 1600,
    maxIntervalMs: 3200,
    drift: 0.85,
  });
  const entriesNow = useLiveCount(tournament.entries, {
    minPct: 0.001,
    maxPct: 0.006,
    minIntervalMs: 1500,
    maxIntervalMs: 2800,
    drift: 0.6,
  });
  const cd = useTournamentCountdown(tournament.endsInMs);
  const titleKey = `casino.tournament.${tournament.id}.title`;
  const subtitleKey = `casino.tournament.${tournament.id}.subtitle`;
  const statusKey = `casino.tournament.status.${tournament.status}`;

  return (
    <Card
      data-testid="casino-tournament-card"
      className={`relative flex min-w-[78%] shrink-0 snap-start flex-col overflow-hidden bg-gradient-to-br ${tournament.tone} p-3.5 ring-1 ${ACCENT_RING[tournament.accent]} transition-all duration-[240ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-12px_color-mix(in_oklab,var(--color-primary)_36%,transparent)] md:min-w-[34%]`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="grid gap-0.5">
          <h3 className="text-sm font-bold tracking-tight">{t(titleKey)}</h3>
          <p className="text-[11px] text-muted-foreground">{t(subtitleKey)}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur">
          <span
            className={`h-1.5 w-1.5 animate-pulse rounded-full motion-reduce:animate-none ${ACCENT_DOT[tournament.accent]}`}
          />
          {t(statusKey)}
        </span>
      </div>

      <div className="mt-3 grid gap-0.5">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {t("casino.tournament.prizePool")}
        </span>
        <span
          key={Math.floor(prizeNow / 1000)}
          className="block animate-fade-in font-mono text-lg font-bold tabular-nums motion-reduce:animate-none"
        >
          {formatPrize(prizeNow, tournament.currency)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="grid gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {t("casino.tournament.entries")}
          </span>
          <span
            key={entriesNow}
            className="inline-block animate-fade-in font-mono text-sm font-semibold tabular-nums motion-reduce:animate-none"
          >
            {entriesNow.toLocaleString("en-US")}
          </span>
        </div>
        <div className="grid justify-items-end gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {t("casino.tournament.endsIn")}
          </span>
          <span
            className={`font-mono text-sm font-semibold tabular-nums ${cd.urgent ? "text-rose-400" : ""}`}
          >
            {cd.days > 0
              ? t("casino.tournament.daysShort", { d: cd.days })
              : `${pad(cd.hours)}:${pad(cd.minutes)}:${pad(cd.seconds)}`}
          </span>
        </div>
      </div>

      <Link
        to="/casino/tournaments"
        className="mt-3 inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-primary/90 px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary"
      >
        {t("casino.tournament.enter")}
        <ChevronRight className="size-3.5" aria-hidden />
      </Link>
    </Card>
  );
}

export function TournamentStrip() {
  return (
    <section
      data-testid="casino-tournament-strip"
      aria-label={t("casino.tournament.sectionTitle")}
      className="grid gap-3"
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold">
          <Trophy className="size-4 text-(--color-warn)" aria-hidden />
          {t("casino.tournament.sectionTitle")}
        </h2>
        <Link
          to="/casino/tournaments"
          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("casino.tournament.viewAll")}
          <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0 motion-reduce:[scroll-behavior:auto]">
        {TOURNAMENTS.map((tn) => (
          <StripCard key={tn.id} tournament={tn} />
        ))}
      </div>
    </section>
  );
}
