import { Crown } from "lucide-react";
import { t } from "@/i18n";
import { useHomeTabs } from "./HomeTabContext";

const CURRENT_NAME_KEY = "fomo.tier.gold.name";
const NEXT_NAME_KEY = "fomo.tier.platinum.name";
const XP_NOW = 12_400;
const XP_NEXT = 18_000;

/**
 * L1-16b · 1-line tier chip on /home today. Full ladder lives in 랭킹 › VIP.
 */
export function TierProgressChip() {
  const { setActive, setRankSub } = useHomeTabs();
  const pct = Math.min(100, Math.round((XP_NOW / XP_NEXT) * 100));

  return (
    <div
      data-testid="home-tier-chip"
      data-hub-id="home-tier-chip"
      className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-xs"
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-(--color-warn)/15 px-2 py-0.5 font-semibold text-(--color-warn)">
        <Crown className="size-3" aria-hidden />
        {t(CURRENT_NAME_KEY)}
      </span>
      <span className="min-w-0 flex-1 truncate text-muted-foreground">
        {t("home.tier.chipProgress", {
          pct,
          next: t(NEXT_NAME_KEY),
        })}
      </span>
      <button
        type="button"
        onClick={() => {
          setRankSub("vip");
          setActive("rank");
        }}
        className="shrink-0 rounded-md border border-border/60 px-2 py-1 text-[11px] font-semibold text-foreground/90 transition hover:bg-(--color-warn)/10 hover:text-(--color-warn)"
      >
        {t("home.tier.viewGradeCta")}
      </button>
    </div>
  );
}
