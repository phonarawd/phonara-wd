import { cn } from "@/lib/utils";
import { t } from "@/i18n";

export type LeagueKey = "all" | "world-cup" | "mlb" | "epl" | "k-league";

const LEAGUES: { key: LeagueKey; labelKey: string }[] = [
  { key: "all", labelKey: "sports.league.all" },
  { key: "world-cup", labelKey: "sports.league.world_cup" },
  { key: "mlb", labelKey: "sports.league.mlb" },
  { key: "epl", labelKey: "sports.league.epl" },
  { key: "k-league", labelKey: "sports.league.k_league" },
];

export function SportsLeagueChips({
  value,
  onChange,
}: {
  value: LeagueKey;
  onChange: (next: LeagueKey) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label={t("sports.league.all")}
      className="sticky top-[104px] z-10 -mx-4 flex snap-x snap-mandatory items-center gap-2 overflow-x-auto bg-(--color-bg)/85 px-4 py-2.5 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {LEAGUES.map((l) => {
        const active = l.key === value;
        return (
          <button
            key={l.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(l.key)}
            className={cn(
              "h-9 shrink-0 snap-start whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
              active
                ? "border-(--color-primary)/40 bg-(--color-primary)/15 text-(--color-primary)"
                : "border-border bg-(--color-surface) text-muted-foreground hover:text-foreground",
            )}
          >
            {t(l.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
