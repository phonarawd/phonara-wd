import { useState } from "react";
import { t } from "@/i18n";
import { HomeTodayPanel } from "./panels/HomeTodayPanel";
import { HomeMissionsPanel } from "./panels/HomeMissionsPanel";
import { HomeRankPanel } from "./panels/HomeRankPanel";
import { HomeInvitePanel } from "./panels/HomeInvitePanel";
import { HomeLivePanel } from "./panels/HomeLivePanel";
import {
  HomeTabContext,
  type HomeRankSub,
  type HomeTabId,
} from "./HomeTabContext";

const TABS: ReadonlyArray<{ id: HomeTabId; labelKey: string }> = [
  { id: "today", labelKey: "home.tab.today" },
  { id: "missions", labelKey: "home.tab.missions" },
  { id: "rank", labelKey: "home.tab.rank" },
  { id: "invite", labelKey: "home.tab.invite" },
  { id: "live", labelKey: "home.tab.live" },
];

export function HomeTabShell() {
  const [active, setActive] = useState<HomeTabId>("today");
  const [rankSub, setRankSub] = useState<HomeRankSub>("weekly");

  return (
    <HomeTabContext.Provider value={{ setActive, setRankSub, rankSub }}>
        <div className="flex min-w-0 flex-col gap-3" data-hub-id="home-tab-shell" data-testid="home-tab-shell">
        <nav
          role="tablist"
          aria-label="Home sections"
          className="sticky top-0 z-30 -mx-3 flex min-w-0 max-w-full shrink-0 gap-1 overflow-x-auto border-b border-border bg-(--color-background)/85 px-3 py-2 backdrop-blur [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:rounded-xl md:border md:px-2"
        >
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                data-tab-id={tab.id}
                data-active={isActive ? "true" : "false"}
                onClick={() => setActive(tab.id)}
                className={
                  "min-h-12 shrink-0 rounded-lg px-4 text-sm font-semibold transition " +
                  (isActive
                    ? "bg-(--color-primary)/15 text-(--color-primary)"
                    : "text-muted-foreground hover:bg-(--color-surface-elev)")
                }
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </nav>

        <div role="tabpanel" className="min-w-0 max-w-full" data-active-tab={active}>
          {active === "today" && <HomeTodayPanel />}
          {active === "missions" && <HomeMissionsPanel />}
          {active === "rank" && <HomeRankPanel />}
          {active === "invite" && <HomeInvitePanel />}
          {active === "live" && <HomeLivePanel />}
        </div>
      </div>
    </HomeTabContext.Provider>
  );
}
