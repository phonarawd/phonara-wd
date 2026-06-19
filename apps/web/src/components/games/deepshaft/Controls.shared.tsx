/**
 * Deepshaft · Controls (shared impl).
 *
 * INVARIANTS:
 *  - Instant-settle game → NO fireDelayMs override.
 *  - selection: { riskTier, targetDepth } only — no UI cave-in prob recompute.
 *  - BetPanel/BetModeTabs FROZEN. No Korean JSX literals — i18n keys only.
 *  - RG gate on primary ready path → onOpenBetConfirm.
 */
import { type ReactNode } from "react";
import { Shield, Mountain, Skull } from "lucide-react";
import { cn } from "@/lib/utils";
import { BetPanel } from "../shared/BetPanel";
import { BetModeTabs } from "../shared/BetModeTabs";
import { useRGGate } from "../shared/RGGateProvider";
import { t } from "@/i18n";
import type {
  DeepshaftRiskTier,
  ImportedGameSurfaceProps,
} from "../shared/types";
import { DeepshaftAutoSlot } from "./DeepshaftAutoSlot";

export type DeepshaftControlsProps = ImportedGameSurfaceProps<"deepshaft">;

const MIN_DEPTH = 1;
const MAX_DEPTH = 15;

const TIER_DEFS: ReadonlyArray<{
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

/** Primary / auto handlers + selection helpers — single source of truth. */
export function useDeepshaftOnPrimary(p: DeepshaftControlsProps) {
  const ready = Boolean(p.commitment);
  const rg = useRGGate();

  const onPrimary = ready
    ? async () => {
        const ok = await rg.gate("place_bet");
        if (!ok) return;
        p.onOpenBetConfirm();
      }
    : p.onPrepareRound;

  const onAutoFire = async () => {
    if (!p.commitment) await p.onPrepareRound();
    if (!p.commitment) return;
    p.onOpenBetConfirm();
    await p.onSubmitBet();
  };

  const setRiskTier = (riskTier: DeepshaftRiskTier) =>
    p.onSelectionChange({ ...p.selection, riskTier });

  const setTargetDepth = (n: number) =>
    p.onSelectionChange({ ...p.selection, targetDepth: clampDepth(n) });

  const primaryLabel = ready
    ? t("games.deepshaft.dig")
    : t("games.deepshaft.prepare");
  const secondaryLabel = t("games.deepshaft.hashCommit");

  return {
    onPrimary,
    onAutoFire,
    ready,
    primaryLabel,
    secondaryLabel,
    riskTier: p.selection.riskTier,
    setRiskTier,
    targetDepth: p.selection.targetDepth,
    setTargetDepth,
  };
}

/** Risk-tier chips + depth stepper. */
export function DeepshaftSelectionUI({ p }: { p: DeepshaftControlsProps }) {
  const { riskTier, setRiskTier, targetDepth, setTargetDepth } =
    useDeepshaftOnPrimary(p);
  const depth = clampDepth(targetDepth);

  return (
    <div className="grid gap-3">
      {/* Risk tier */}
      <div className="grid gap-1">
        <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{t("games.deepshaft.risk")}</span>
          <span className="font-mono text-amber-300">
            {t(`games.deepshaft.${riskTier}`)}
          </span>
        </div>
        <div
          data-game-id="deepshaft-risk-chips"
          className="grid grid-cols-3 gap-1"
        >
          {TIER_DEFS.map(({ id, Icon, labelKey }) => {
            const active = riskTier === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setRiskTier(id)}
                data-testid={`deepshaft-tier-${id}`}
                aria-pressed={active}
                className={cn(
                  "min-h-9 inline-flex items-center justify-center gap-1.5 rounded-md border text-xs font-semibold",
                  "transition-[box-shadow,border-color,transform] duration-150",
                  active
                    ? "border-amber-400 bg-amber-500/15 text-amber-200 ring-2 ring-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,.25)] scale-[1.02]"
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

      {/* Target depth */}
      <div className="grid gap-1">
        <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{t("games.deepshaft.target")}</span>
          <span className="font-mono tabular-nums text-amber-300">
            {depth} / {MAX_DEPTH}
          </span>
        </div>
        <div className="flex items-center gap-1" data-game-id="deepshaft-depth-stepper">
          <button
            type="button"
            onClick={() => setTargetDepth(depth - 1)}
            disabled={depth <= MIN_DEPTH}
            data-testid="deepshaft-depth-dec"
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
              setTargetDepth(n);
            }}
            data-testid="deepshaft-depth-input"
            aria-label={t("games.deepshaft.target")}
            className="min-h-9 w-full rounded-md border border-border bg-(--color-surface) px-2 text-center font-mono text-xs tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
          />
          <button
            type="button"
            onClick={() => setTargetDepth(depth + 1)}
            disabled={depth >= MAX_DEPTH}
            data-testid="deepshaft-depth-inc"
            aria-label={t("games.deepshaft.target")}
            className="min-h-9 w-9 rounded-md border border-border bg-(--color-surface) text-sm font-bold disabled:opacity-50"
          >
            +
          </button>
        </div>
        {/* Display-only depth scale (presentation, no clicks). */}
        <div
          role="presentation"
          aria-hidden
          className="mt-1 flex items-center justify-between gap-[2px]"
        >
          {Array.from({ length: MAX_DEPTH }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full",
                i < depth ? "bg-amber-400/80" : "bg-amber-100/10",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** BetPanel wrapper — owns deepshaft-cta + chip-row + hash-btn markers. */
export function DeepshaftBetPanelInner({
  p,
  primarySize = "xl",
  children,
}: {
  p: DeepshaftControlsProps;
  primarySize?: "default" | "xl";
  children?: ReactNode;
}) {
  const { onPrimary, ready, primaryLabel, secondaryLabel } =
    useDeepshaftOnPrimary(p);
  return (
    <div data-game-id="deepshaft-cta">
      <span hidden data-game-id="deepshaft-hash-btn" />
      <div data-game-id="deepshaft-chip-row">
        <BetPanel
          stake={p.stake}
          currency={p.currency}
          availableBalance={p.availableBalance}
          busy={p.busy}
          ready={ready}
          primarySize={primarySize}
          primaryLabel={primaryLabel}
          secondaryLabel={secondaryLabel}
          onStakeChange={p.onStakeChange}
          onCurrencyChange={p.onCurrencyChange}
          onPrimary={onPrimary}
          onSecondary={p.onPrepareRound}
        >
          {children ?? <DeepshaftSelectionUI p={p} />}
        </BetPanel>
      </div>
    </div>
  );
}

/** Legacy composed wrapper — back-compat. */
export function DeepshaftControlsShared(p: DeepshaftControlsProps) {
  const { onAutoFire, riskTier, setRiskTier, targetDepth, setTargetDepth } =
    useDeepshaftOnPrimary(p);
  const manual = <DeepshaftBetPanelInner p={p} primarySize="default" />;
  return (
    <div data-testid="casino-controls">
      <BetModeTabs
        manual={manual}
        baseStake={p.stake}
        currency={p.currency}
        commitment={p.commitment}
        busy={p.busy}
        bet={p.bet}
        availableBalance={p.availableBalance}
        onAutoFire={onAutoFire}
        autoChildren={
          <DeepshaftAutoSlot
            riskTier={riskTier}
            onRiskTierChange={setRiskTier}
            targetDepth={targetDepth}
            onTargetDepthChange={setTargetDepth}
          />
        }
      />
    </div>
  );
}
