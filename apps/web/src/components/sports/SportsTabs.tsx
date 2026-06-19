import { cn } from "@/lib/utils";
import { t } from "@/i18n";

export type SportsTabKey = "featured" | "live" | "upcoming" | "my-bets";

const TABS: { key: SportsTabKey; labelKey: string }[] = [
  { key: "featured", labelKey: "sports.tab.featured" },
  { key: "live", labelKey: "sports.tab.live" },
  { key: "upcoming", labelKey: "sports.tab.upcoming" },
  { key: "my-bets", labelKey: "sports.tab.myBets" },
];

export function SportsTabs({
  value,
  onChange,
  liveCount = 0,
}: {
  value: SportsTabKey;
  onChange: (next: SportsTabKey) => void;
  liveCount?: number;
}) {
  return (
    <div
      role="tablist"
      aria-label={t("sports.tab.featured")}
      className="sticky top-14 z-20 -mx-4 grid h-12 grid-cols-4 items-stretch border-b border-border bg-(--color-bg)/90 px-4 backdrop-blur"
    >
      {TABS.map((tab) => {
        const active = tab.key === value;
        const showLive = tab.key === "live" && liveCount > 0;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative inline-flex items-center justify-center gap-1.5 px-2 text-sm font-semibold transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{t(tab.labelKey)}</span>
            {showLive && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-(--color-down)/15 px-1.5 text-[10px] font-black tabular-nums text-(--color-down)">
                {liveCount}
              </span>
            )}
            {active && (
              <span
                aria-hidden
                className="absolute inset-x-4 -bottom-px h-[3px] rounded-full bg-(--color-primary) transition-all duration-200"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
