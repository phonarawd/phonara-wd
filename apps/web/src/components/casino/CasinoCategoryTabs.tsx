import { t } from "@/i18n";

/**
 * P1 · Stake/Roobet rival — CasinoCategoryTabs
 * Display-only filter strip. 6 lanes per North Star.
 */
export type CasinoCategory =
  | "hot"
  | "originals"
  | "live"
  | "slots"
  | "crash"
  | "new";

const TABS: { id: CasinoCategory; key: string }[] = [
  { id: "hot", key: "casino.tabs.hot" },
  { id: "originals", key: "casino.tabs.originals" },
  { id: "live", key: "casino.tabs.live" },
  { id: "slots", key: "casino.tabs.slots" },
  { id: "crash", key: "casino.tabs.crash" },
  { id: "new", key: "casino.tabs.new" },
];

export function CasinoCategoryTabs({
  active,
  onChange,
}: {
  active: CasinoCategory;
  onChange: (id: CasinoCategory) => void;
}) {
  return (
    <div
      data-p1-id="casino-category-tabs"
      role="tablist"
      aria-label={t("casino.tabs.aria")}
      className="-mx-1 flex snap-x snap-mandatory gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`snap-start whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring) ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
            }`}
          >
            {t(tab.key)}
          </button>
        );
      })}
    </div>
  );
}
