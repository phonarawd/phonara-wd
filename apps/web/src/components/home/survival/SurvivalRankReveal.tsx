import { t } from "@/i18n";
import { tierLabelKey, type SurvivalTierBand } from "@/hooks/useSurvivalCheckin";

export type SurvivalRankRevealProps = {
  rank: number | null;
  tierBand: SurvivalTierBand;
};

const TIER_STYLES: Record<SurvivalTierBand, string> = {
  gold: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  silver: "bg-slate-400/15 text-slate-700 dark:text-slate-300 border-slate-400/30",
  bronze: "bg-orange-700/15 text-orange-800 dark:text-orange-300 border-orange-700/30",
  default: "bg-muted/40 text-muted-foreground border-border",
};

export function SurvivalRankReveal({ rank, tierBand }: SurvivalRankRevealProps) {
  if (rank === null) return null;

  return (
    <div
      data-testid="survival-rank-reveal"
      role="status"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/50 p-3"
    >
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {t("earn.survival.rank.label", { rank })}
      </span>
      <span
        className={
          "rounded-md border px-2 py-0.5 text-xs font-medium " + TIER_STYLES[tierBand]
        }
      >
        {t(tierLabelKey(tierBand))}
      </span>
    </div>
  );
}

SurvivalRankReveal.displayName = "SurvivalRankReveal";
