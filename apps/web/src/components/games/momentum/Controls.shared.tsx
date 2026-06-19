/**
 * Momentum · Controls (shared impl).
 *
 * INVARIANTS:
 *  - BetPanel/BetModeTabs FROZEN.
 *  - selection: { comboBefore, cashOut } — Stage reads bet.result only.
 *  - RG gate on primary ready path → onOpenBetConfirm.
 *  - Auto policy lives ENTIRELY inside `onAutoFire` closure — shared
 *    loop needs no change. cashOutAt comparison is on selection.comboBefore
 *    (the player's chosen combo state), NOT on a result field.
 */
import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { BetPanel } from "@/games/shared/BetPanel";
import { useRGGate } from "@/games/shared/RGGateProvider";
import { t } from "@/i18n";
import {
  MOMENTUM_POLICY_CASHOUT_AT,
  type MomentumAutoPolicy,
  type MomentumSurfaceProps,
} from "./types";

export type MomentumControlsProps = MomentumSurfaceProps;

export interface MomentumPrimary {
  onPrimary: () => void;
  onCashOut: () => void;
  cashOutAvailable: boolean;
  ready: boolean;
  primaryLabel: string;
  secondaryLabel: string;
  combo: number;
  policy: MomentumAutoPolicy;
  setPolicy: (p: MomentumAutoPolicy) => void;
  onAutoFire: () => Promise<void>;
}

/** Primary + cashOut handlers + auto policy — single source of truth. */
export function useMomentumOnPrimary(p: MomentumControlsProps): MomentumPrimary {
  const ready = Boolean(p.commitment);
  const rg = useRGGate();
  const [policy, setPolicy] = useState<MomentumAutoPolicy>("mid");
  const combo = p.selection.comboBefore;
  const cashOutAvailable = combo >= 1;

  const onPrimary = ready
    ? async () => {
        const ok = await rg.gate("place_bet");
        if (!ok) return;
        p.onSelectionChange({ comboBefore: combo, cashOut: false });
        p.onOpenBetConfirm();
      }
    : () => p.onPrepareRound();

  const onCashOut = async () => {
    if (!cashOutAvailable) return;
    const ok = await rg.gate("place_bet");
    if (!ok) return;
    p.onSelectionChange({ comboBefore: combo, cashOut: true });
    p.onOpenBetConfirm();
  };

  const onAutoFire = async () => {
    if (!p.commitment) await p.onPrepareRound();
    if (!p.commitment) return;
    const cashOutAt = MOMENTUM_POLICY_CASHOUT_AT[policy];
    const shouldCashOut = combo >= cashOutAt && combo >= 1;
    p.onSelectionChange({ comboBefore: combo, cashOut: shouldCashOut });
    p.onOpenBetConfirm();
    await p.onSubmitBet();
  };

  const primaryLabel = ready
    ? t("games.momentum.play")
    : t("games.momentum.prepare");
  const secondaryLabel = t("games.momentum.hashCommit");

  return {
    onPrimary,
    onCashOut,
    cashOutAvailable,
    ready,
    primaryLabel,
    secondaryLabel,
    combo,
    policy,
    setPolicy,
    onAutoFire,
  };
}

/** Above-CTA combo readout + cash-out secondary action. */
export function MomentumSelectionUI({ p }: { p: MomentumControlsProps }) {
  const { combo, cashOutAvailable, onCashOut } = useMomentumOnPrimary(p);
  const lastMult =
    cashOutAvailable && p.bet?.result
      ? ((p.bet.result as { comboMultiplier?: string }).comboMultiplier ?? null)
      : null;
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{t("games.momentum.combo")}</span>
        <span className="font-mono tabular-nums text-violet-300">
          ×{combo}
        </span>
      </div>
      <button
        type="button"
        onClick={onCashOut}
        disabled={!cashOutAvailable || p.busy}
        data-testid="momentum-cashout"
        className={cn(
          "min-h-11 rounded-md border text-sm font-bold tabular-nums transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
          cashOutAvailable
            ? "border-emerald-400 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
            : "border-border bg-(--color-surface) text-muted-foreground opacity-50",
        )}
      >
        {t("games.momentum.cashOut")}{lastMult ? ` (×${lastMult})` : ""}
      </button>
    </div>
  );
}

/** BetPanel wrapper — owns momentum-cta + chip-row + hash-btn markers. */
export function MomentumBetPanelInner({
  p,
  primarySize = "xl",
  children,
}: {
  p: MomentumControlsProps;
  primarySize?: "default" | "xl";
  children?: ReactNode;
}) {
  const { onPrimary, ready, primaryLabel, secondaryLabel } =
    useMomentumOnPrimary(p);
  return (
    <div data-game-id="momentum-cta">
      <span hidden data-game-id="momentum-hash-btn" />
      <div data-game-id="momentum-chip-row">
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
          {children ?? <MomentumSelectionUI p={p} />}
        </BetPanel>
      </div>
    </div>
  );
}
