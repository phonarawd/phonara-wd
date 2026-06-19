import { X } from "lucide-react";
import { t } from "@/i18n";
import { useBetSlip } from "./BetSlipProvider";
import type { BetSlipLeg } from "./types";

export function BetSlipLegRow({ leg }: { leg: BetSlipLeg }) {
  const { removeLeg } = useBetSlip();
  return (
    <div className="grid gap-1 rounded-xl border border-border bg-(--color-surface-elev) p-3">
      <div className="flex items-start gap-2">
        <div className="grid min-w-0 flex-1 gap-0.5">
          <div className="truncate text-sm font-bold text-foreground">
            {leg.selection}
          </div>
          <div className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {leg.homeName} {t("sports.fixture.vs")} {leg.awayName}
          </div>
        </div>
        <span className="shrink-0 rounded-md bg-(--color-surface) px-2 py-1 text-sm font-black tabular-nums text-(--color-primary)">
          {leg.oddsDisplay}
        </span>
        <button
          type="button"
          aria-label={t("sports.slip.clear")}
          onClick={() => removeLeg(leg.outcomeId)}
          className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-(--color-surface) hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
