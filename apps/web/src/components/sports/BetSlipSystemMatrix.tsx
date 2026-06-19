// S3 — System bet matrix UI · numeric C(N,K) · 신규 i18n 0
// payout SOT 표시 0 (engine 별도) · place() NO-TOUCH.
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { useBetSlip } from "./BetSlipProvider";

function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  const kk = Math.min(k, n - k);
  let num = 1;
  let den = 1;
  for (let i = 1; i <= kk; i++) {
    num *= n - kk + i;
    den *= i;
  }
  return Math.round(num / den);
}

export function BetSlipSystemMatrix() {
  const { legs, systemK, setSystemK, stake } = useBetSlip();
  const n = legs.length;

  if (n < 3) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-(--color-surface-elev) px-3 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("sports.system.coming_soon")}
      </div>
    );
  }

  const ks: number[] = [];
  for (let k = 2; k <= n - 1; k++) ks.push(k);
  const c = combinations(n, systemK);

  return (
    <div className="grid gap-2 rounded-lg border border-border bg-(--color-surface-elev) p-3">
      <div
        role="tablist"
        aria-label="K/N"
        className="grid grid-flow-col auto-cols-fr gap-1"
      >
        {ks.map((k) => {
          const active = k === systemK;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSystemK(k)}
              className={cn(
                "min-h-9 rounded-md px-2 text-xs font-bold tabular-nums transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
                active
                  ? "bg-(--color-primary)/15 text-(--color-primary) ring-1 ring-(--color-primary)/40"
                  : "bg-(--color-surface) text-muted-foreground hover:text-foreground",
              )}
            >
              {k}/{n}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-muted-foreground">
          C({n},{systemK})
        </span>
        <span className="text-base font-black tabular-nums text-foreground">
          {c}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sports.slip.stake")}
        </span>
        <span className="tabular-nums text-foreground">{stake || "0"}</span>
      </div>
      <div className="rounded-md border border-dashed border-border bg-(--color-surface) px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t("sports.system.coming_soon")}
      </div>
    </div>
  );
}
