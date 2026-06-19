import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { useBetSlip } from "./BetSlipProvider";

export function BetSlipStakeForm() {
  const { stake, setStake, currency, setCurrency, combinedOddsLabel, legs } =
    useBetSlip();

  return (
    <div className="grid min-w-0 gap-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {t("sports.slip.stake")}
      </label>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          placeholder="0"
          className="h-12 w-full min-w-0 rounded-lg border border-border bg-(--color-surface-elev) px-3 text-right text-base font-bold tabular-nums text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
          aria-label={t("sports.slip.stake")}
        />
        <div
          role="tablist"
          aria-label={t("sports.slip.currency")}
          className="inline-grid h-12 shrink-0 grid-flow-col gap-1 rounded-lg border border-border bg-(--color-surface-elev) p-1"
        >
          {(["PHON", "USDT"] as const).map((c) => {
            const active = c === currency;
            return (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCurrency(c)}
                className={cn(
                  "rounded-md px-2.5 text-xs font-bold tabular-nums transition-colors",
                  active
                    ? "bg-(--color-surface) text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-(--color-surface-elev) px-3 py-2.5 text-xs">
        <span className="min-w-0 truncate font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sports.slip.combined")}
        </span>
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-base font-black tabular-nums text-foreground">
            {combinedOddsLabel}
          </span>
          {legs.length > 0 && (
            <span className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              ({t("sports.slip.preview_label")})
            </span>
          )}
        </span>
      </div>
      <p className="min-w-0 text-[11px] text-muted-foreground">
        {t("sports.slip.place_mock_hint")} · {legs.length}{" "}
        {t("sports.slip.title")}
      </p>
    </div>
  );
}
