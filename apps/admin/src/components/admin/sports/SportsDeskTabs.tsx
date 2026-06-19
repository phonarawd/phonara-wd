import { useState } from "react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { UnsettledFixturesTable } from "./UnsettledFixturesTable";
import { ExposureDashboard } from "./ExposureDashboard";
import { RiskEventsPanel } from "./RiskEventsPanel";
import { FeatureSportsToggle } from "./FeatureSportsToggle";

// L1-15-A-M — mobile-only segment tabs for /admin/sports.
// Desktop md+ ignores this; SportsDeskHub keeps stacked layout.
// Local state · no URL state · no SOT change · resets on nav (acceptable mock).

type TabKey = "queue" | "exposure" | "risk" | "ops";

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: "queue", labelKey: "admin.sports.tab.queue" },
  { key: "exposure", labelKey: "admin.sports.tab.exposure" },
  { key: "risk", labelKey: "admin.sports.tab.risk" },
  { key: "ops", labelKey: "admin.sports.tab.ops" },
];

export function SportsDeskTabs() {
  const [active, setActive] = useState<TabKey>("queue");

  return (
    <div className="md:hidden">
      <div
        role="tablist"
        aria-label={t("admin.sports.hub.title")}
        className="grid grid-cols-4 gap-1 rounded-lg border border-border bg-card p-1"
      >
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setActive(tab.key)}
              data-testid={`sports-tab-${tab.key}`}
              className={cn(
                "rounded-md px-2 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "bg-(--color-primary)/15 text-(--color-primary)"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>
      <div className="mt-4" role="tabpanel">
        {active === "queue" && <UnsettledFixturesTable />}
        {active === "exposure" && <ExposureDashboard />}
        {active === "risk" && <RiskEventsPanel />}
        {active === "ops" && <FeatureSportsToggle />}
      </div>
    </div>
  );
}
