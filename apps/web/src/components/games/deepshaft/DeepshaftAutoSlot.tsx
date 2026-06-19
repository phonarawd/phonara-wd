/**
 * Deepshaft · AutoSlot — typed per-game slot for the shared AutoBetPanel.
 *
 * Consumes `AutoSlotProps<"deepshaft">` exactly. Renders auto-only params:
 *   - riskTier (safe / standard / deep) → engine `selection.riskTier`
 *   - targetDepth (1..15) → engine `selection.targetDepth`
 *
 * §3.1 Path A: this slot is rendered on BOTH 1280 desktop AND 390 mobile
 * Controls — dead either viewport = FAIL. The slot itself never reads
 * engine result; it only edits auto-only configuration.
 */
import { Shield, Mountain, Skull } from "lucide-react";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import type { AutoSlotProps, DeepshaftRiskTier } from "../shared/types";

const MIN_DEPTH = 1;
const MAX_DEPTH = 15;

const TIERS: ReadonlyArray<{
  id: DeepshaftRiskTier;
  Icon: typeof Shield;
  labelKey: string;
}> = [
  { id: "safe", Icon: Shield, labelKey: "games.deepshaft.safe" },
  { id: "standard", Icon: Mountain, labelKey: "games.deepshaft.standard" },
  { id: "deep", Icon: Skull, labelKey: "games.deepshaft.deep" },
];

function clampDepth(n: number): number {
  if (!Number.isFinite(n)) return MIN_DEPTH;
  return Math.max(MIN_DEPTH, Math.min(MAX_DEPTH, Math.floor(n)));
}

export function DeepshaftAutoSlot(p: AutoSlotProps<"deepshaft">) {
  const depth = clampDepth(p.targetDepth);

  return (
    <div className="grid gap-2" data-testid="casino-auto-slot-deepshaft">
      <div className="grid gap-1">
        <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{t("games.deepshaft.risk")}</span>
          <span className="tabular-nums">{t(`games.deepshaft.${p.riskTier}`)}</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {TIERS.map(({ id, Icon, labelKey }) => {
            const active = p.riskTier === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => p.onRiskTierChange(id)}
                data-testid={`casino-auto-deepshaft-tier-${id}`}
                aria-pressed={active}
                className={cn(
                  "min-h-9 inline-flex items-center justify-center gap-1 rounded-md border text-xs font-semibold",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
                  active
                    ? "border-amber-400 bg-amber-500/15 text-amber-200 ring-2 ring-amber-400/60"
                    : "border-border bg-(--color-surface) text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-1">
        <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{t("games.deepshaft.target")}</span>
          <span className="tabular-nums">
            {depth} / {MAX_DEPTH}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => p.onTargetDepthChange(Math.max(MIN_DEPTH, depth - 1))}
            disabled={depth <= MIN_DEPTH}
            data-testid="casino-auto-deepshaft-depth-dec"
            aria-label={t("games.deepshaft.target")}
            className="min-h-9 w-9 rounded-md border border-border bg-(--color-surface) text-sm font-bold disabled:opacity-50"
          >
            −
          </button>
          <input
            inputMode="numeric"
            value={String(depth)}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^0-9]/g, "")) || MIN_DEPTH;
              p.onTargetDepthChange(clampDepth(n));
            }}
            data-testid="casino-auto-deepshaft-depth"
            aria-label={t("games.deepshaft.target")}
            className="min-h-9 w-full rounded-md border border-border bg-(--color-surface) px-2 text-center font-mono text-xs tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
          />
          <button
            type="button"
            onClick={() => p.onTargetDepthChange(Math.min(MAX_DEPTH, depth + 1))}
            disabled={depth >= MAX_DEPTH}
            data-testid="casino-auto-deepshaft-depth-inc"
            aria-label={t("games.deepshaft.target")}
            className="min-h-9 w-9 rounded-md border border-border bg-(--color-surface) text-sm font-bold disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
