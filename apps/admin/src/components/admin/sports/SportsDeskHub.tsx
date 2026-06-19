import { UnsettledFixturesTable } from "./UnsettledFixturesTable";
import { ExposureDashboard } from "./ExposureDashboard";
import { RiskEventsPanel } from "./RiskEventsPanel";
import { FeatureSportsToggle } from "./FeatureSportsToggle";
import { SportsDeskTabs } from "./SportsDeskTabs";
import { t } from "@/i18n";

// L1-15-A — admin sports desk hub layout (above-fold exception queue).
// mock/display-only · World Crush bar: unsettled queue + exposure + risk in first viewport.
// L1-15-A-M: <md = segment tabs · md+ = stacked layout unchanged.

export function SportsDeskHub() {
  return (
    <div className="grid gap-5">
      <header className="grid gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-medium">
            {t("admin.sports.hub.title")}
          </h1>
          <span
            className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
            data-testid="mock-chip"
          >
            {t("admin.sports.hub.mockChip")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("admin.sports.hub.subtitle")}
        </p>
      </header>

      {/* Mobile: segment tabs */}
      <SportsDeskTabs />

      {/* Desktop md+: stacked layout (above-fold exception queue) */}
      <div className="hidden md:grid md:gap-5">
        <UnsettledFixturesTable />
        <ExposureDashboard />
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <RiskEventsPanel />
          <FeatureSportsToggle />
        </div>
      </div>
    </div>
  );
}

