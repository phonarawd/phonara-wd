import { t } from "@/i18n";
import { FomoFullSection } from "../FomoFullSection";
import { TierProgressPanel } from "@/components/fomo/TierProgressPanel";
import { useHomeTabs } from "../HomeTabContext";

const SUBS = [
  { id: "weekly", labelKey: "home.subtab.weekly" },
  { id: "vip", labelKey: "home.subtab.vip" },
] as const;

export function HomeRankPanel() {
  const { rankSub, setRankSub } = useHomeTabs();
  return (
    <div className="flex flex-col gap-3" data-hub-id="home-rank">
      <div role="tablist" className="flex gap-1 rounded-lg border border-border p-1">
        {SUBS.map((s) => (
          <button
            key={s.id}
            role="tab"
            type="button"
            aria-selected={rankSub === s.id}
            data-subtab-id={s.id}
            onClick={() => setRankSub(s.id)}
            className={
              "min-h-10 flex-1 rounded-md px-3 text-sm font-medium transition " +
              (rankSub === s.id
                ? "bg-(--color-primary)/15 text-(--color-primary)"
                : "text-muted-foreground")
            }
          >
            {t(s.labelKey)}
          </button>
        ))}
      </div>
      {rankSub === "weekly" && <FomoFullSection />}
      {rankSub === "vip" && <TierProgressPanel />}
    </div>
  );
}
