// S4 — system 탭 selectable. badge 제거. place() / payout NO-TOUCH.
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { useBetSlip } from "./BetSlipProvider";
import type { BetSlipMode } from "./types";

const MODES: { key: BetSlipMode; labelKey: string }[] = [
  { key: "single", labelKey: "sports.slip.mode.single" },
  { key: "combo", labelKey: "sports.slip.mode.combo" },
  { key: "sgp", labelKey: "sports.slip.mode.sgp" },
  { key: "system", labelKey: "sports.slip.mode.system" },
];

export function BetSlipModeTabs() {
  const { mode, setMode } = useBetSlip();
  return (
    <div
      role="tablist"
      aria-label={t("sports.slip.mode.single")}
      className="grid grid-cols-4 gap-1 rounded-md bg-(--color-surface-elev) p-1"
    >
      {MODES.map((m) => {
        const active = m.key === mode;
        return (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setMode(m.key)}
            className={cn(
              "min-h-9 rounded px-2 text-[10px] font-semibold tabular-nums transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
              active
                ? "bg-(--color-surface) text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(m.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
