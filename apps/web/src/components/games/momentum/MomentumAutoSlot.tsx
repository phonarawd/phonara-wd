/**
 * Momentum · AutoSlot — typed per-game slot for the shared AutoBetPanel.
 *
 * Auto-only param: `policy` (early / mid / greedy) → cashOutAt 3 / 6 / 10.
 * The slot edits configuration only and never reads engine result.
 *
 * Path A: rendered on BOTH ControlsDesktop (1280) AND ControlsMobile (390).
 */
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  MOMENTUM_POLICY_CASHOUT_AT,
  type MomentumAutoPolicy,
  type MomentumAutoSlotProps,
} from "./types";

const POLICIES: ReadonlyArray<{
  id: MomentumAutoPolicy;
  labelKey: string;
}> = [
  { id: "early", labelKey: "games.momentum.policy.early" },
  { id: "mid", labelKey: "games.momentum.policy.mid" },
  { id: "greedy", labelKey: "games.momentum.policy.greedy" },
];

export function MomentumAutoSlot(p: MomentumAutoSlotProps) {
  return (
    <div className="grid gap-2" data-testid="casino-auto-slot-momentum">
      <div className="grid gap-1">
        <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{t("games.momentum.policy.label")}</span>
          <span className="tabular-nums">
            ×{MOMENTUM_POLICY_CASHOUT_AT[p.policy]}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {POLICIES.map(({ id, labelKey }) => {
            const active = p.policy === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => p.onPolicyChange(id)}
                data-testid={`casino-auto-momentum-policy-${id}`}
                aria-pressed={active}
                className={cn(
                  "min-h-9 inline-flex flex-col items-center justify-center gap-0 rounded-md border text-xs font-semibold",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
                  active
                    ? "border-violet-400 bg-violet-500/15 text-violet-100 ring-2 ring-violet-400/60"
                    : "border-border bg-(--color-surface) text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{t(labelKey)}</span>
                <span className="text-[10px] tabular-nums opacity-70">
                  ×{MOMENTUM_POLICY_CASHOUT_AT[id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
