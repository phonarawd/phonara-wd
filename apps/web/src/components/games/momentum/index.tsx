/**
 * Momentum ??game surface entry point. (G#11 greenfield)
 *
 *  - `<RGGateProvider>` wrap
 *  - `<BetConfirmDialog>` mounted with `open={p.confirmOpen}`
 *  - `useGameShortkeys` Space 3-state
 *    (confirmOpen ??no-op, idle ??prepare, ready ??openConfirm)
 *  - `?` ??rules sheet open
 *
 * Local TYPE MIRROR ??does NOT touch shared/types.ts. The PHONARA
 * Momentum engine contract is added in Cursor on post-export.
 */
import { useCallback, useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGameShortkeys } from "@/hooks/useGameShortkeys";
import { formatStakeStep } from "@/lib/money-input";
import { RGGateProvider } from "@/games/shared/RGGateProvider";
import { BetConfirmDialog } from "@/games/shared/BetConfirmDialog";
import { GameRulesSheet, GameRulesTrigger } from "@/games/shared/GameRulesSheet";
import { Stage } from "./Stage";
import { HUD } from "./HUD";
import { ControlsMobile } from "./Controls.mobile";
import { ControlsDesktop } from "./Controls.desktop";
import type { MomentumSurfaceProps } from "./types";

export function ImportedMomentumGame(props: MomentumSurfaceProps) {
  return (
    <RGGateProvider>
      <MomentumSurface {...props} />
    </RGGateProvider>
  );
}

function MomentumSurface(p: MomentumSurfaceProps) {
  const isMobile = useIsMobile();
  const Controls = isMobile ? ControlsMobile : ControlsDesktop;
  const [rulesOpen, setRulesOpen] = useState(false);
  const showShellConfirm = p.pasteShellConfirm !== true;

  useEffect(() => {
    const comboAfter = p.bet?.result?.comboAfter;
    if (typeof comboAfter === "number" && Number.isFinite(comboAfter)) {
      p.onSelectionChange({ comboBefore: comboAfter, cashOut: false });
    }
  }, [p.bet?.bet_id, p.onSelectionChange]);

  const applyStake = useCallback(
    (mult: number) => {
      const cur = Number(p.stake) || 0;
      const max = Number(p.availableBalance ?? "0");
      let next = mult === Number.POSITIVE_INFINITY ? max : cur * mult;
      if (!Number.isFinite(next) || next < 0) next = 0;
      if (max && next > max) next = max;
      p.onStakeChange(formatStakeStep(next));
    },
    [p],
  );

  const onSpace = useCallback(() => {
    if (p.confirmOpen) return;
    if (!p.commitment) p.onPrepareRound();
    else p.onOpenBetConfirm();
  }, [p]);

  useGameShortkeys(
    {
      onPrimary: onSpace,
      onStakeHalf: () => applyStake(0.5),
      onStakeDouble: () => applyStake(2),
      onStakeMax: () => applyStake(Number.POSITIVE_INFINITY),
      onEscape: () => {
        if (p.confirmOpen) p.onCancelBetConfirm();
      },
      onHelp: () => setRulesOpen(true),
    },
    !isMobile,
  );

  return (
    <div
      data-testid="casino-game-root"
      className="grid gap-4 md:grid-cols-[1fr_320px]"
    >
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Momentum
          </h2>
          <GameRulesTrigger onOpen={() => setRulesOpen(true)} />
        </div>
        <Stage
          gameCode={p.gameCode}
          selection={p.selection}
          bet={p.bet}
          clientSeed={p.clientSeed}
          commitment={p.commitment}
          verification={p.verification}
          busy={p.busy}
          onClientSeedChange={p.onClientSeedChange}
        />
        <HUD recentBets={p.recentBets} />
      </div>
      <Controls {...p} />

      {showShellConfirm && (
        <BetConfirmDialog
        open={p.confirmOpen}
        stake={p.stake}
        currency={p.currency}
        summary={
          <>
            <span>
              Momentum · combo ×{p.selection.comboBefore}
            </span>
            <span className="font-mono tabular-nums">{p.stake}</span>
          </>
        }
        busy={p.busy}
        onConfirm={() => p.onSubmitBet()}
        onCancel={p.onCancelBetConfirm}
        />
      )}

      <GameRulesSheet
        gameCode={"momentum" as never}
        open={rulesOpen}
        onOpenChange={setRulesOpen}
      />
    </div>
  );
}

export const MomentumGame = ImportedMomentumGame;
