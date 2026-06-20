import { useState } from "react";
import { t } from "@/i18n";
import { SurvivalCheckinCard } from "../survival";
import { LimitedDropCard } from "../LimitedDropCard";
import { HomeMissionTeaserCard } from "../HomeMissionTeaserCard";
import { StreakBonusCallout } from "@/components/fomo/StreakBonusCallout";

type Sub = "checkin" | "wheel" | "season";

const SUBS: ReadonlyArray<{ id: Sub; labelKey: string }> = [
  { id: "checkin", labelKey: "home.subtab.checkin" },
  { id: "wheel", labelKey: "home.subtab.wheel" },
  { id: "season", labelKey: "home.subtab.season" },
];

export function HomeMissionsPanel() {
  const [sub, setSub] = useState<Sub>("checkin");
  return (
    <div className="flex flex-col gap-3" data-hub-id="home-missions">
      <div role="tablist" className="flex gap-1 rounded-lg border border-border p-1">
        {SUBS.map((s) => (
          <button
            key={s.id}
            role="tab"
            type="button"
            aria-selected={sub === s.id}
            data-subtab-id={s.id}
            onClick={() => setSub(s.id)}
            className={
              "min-h-10 flex-1 rounded-md px-3 text-sm font-medium transition " +
              (sub === s.id
                ? "bg-(--color-primary)/15 text-(--color-primary)"
                : "text-muted-foreground")
            }
          >
            {t(s.labelKey)}
          </button>
        ))}
      </div>
      {sub === "checkin" && (
        <div className="flex flex-col gap-3">
          <SurvivalCheckinCard />
          <StreakBonusCallout />
        </div>
      )}
      {sub === "wheel" && <LimitedDropCard />}
      {sub === "season" && <HomeMissionTeaserCard />}
    </div>
  );
}
