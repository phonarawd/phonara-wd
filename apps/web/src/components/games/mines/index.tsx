/**
 * Mines ??game surface entry point. (Phase 5 v1 · Limbo ?�턴 1:1)
 *
 * - `<RGGateProvider>` wrap
 * - `<BetConfirmDialog>` mounted only while confirmOpen
 * - controlled `<GameRulesSheet gameCode="mines">` + `<GameRulesTrigger>`
 *   (trigger `casino-game-rules`; PF sheet `casino-fairness-verifier` 분리)
 * - `useGameShortkeys` Space 2분기 (no selection ??no-op) + 1/2/5/Esc/?
 *
 * Mines is ONE-SHOT: tile clicks accumulate locally into
 * `revealedCells[]` (no per-tile RPC); the bet ships the final array
 * via the standard prepare ??open-confirm ??submit flow.
 *
 * PHONARA registry expects the exact symbol `ImportedMinesGame`.
 */
import { useCallback, useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGameShortkeys } from "@/hooks/useGameShortkeys";
import { RGGateProvider } from "../shared/RGGateProvider";
import { BetConfirmDialog } from "../shared/BetConfirmDialog";
import { GameRulesSheet, GameRulesTrigger } from "../shared/GameRulesSheet";
import { t } from "@/i18n";
import { formatStakeStep } from "@/lib/money-input";
import type { ImportedGameSurfaceProps } from "../shared/types";
import { Stage } from "./Stage";
import { HUD } from "./HUD";
import { ControlsMobile } from "./Controls.mobile";
import { ControlsDesktop } from "./Controls.desktop";
import { minesPreviewMultiplier } from "./multiplier";

export function ImportedMinesGame(props: ImportedGameSurfaceProps<"mines">) {
  return (
    <RGGateProvider>
      <MinesSurface {...props} />
    </RGGateProvider>
  );
}

function MinesSurface(p: ImportedGameSurfaceProps<"mines">) {
  const isMobile = useIsMobile();
  const Controls = isMobile ? ControlsMobile : ControlsDesktop;
  const [rulesOpen, setRulesOpen] = useState(false);
  const showShellConfirm = p.pasteShellConfirm !== true;

  const revealed = p.selection.revealedCells ?? [];

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

  // Space state-machine: confirmOpen ??no-op, !commitment ??prepare,
  // ready && revealed.length>0 ??openConfirm. Empty selection ??no-op.
  // RG gating is handled inside Controls.shared.onPrimary.
  const onSpace = useCallback(() => {
    if (p.confirmOpen) return;
    if (!p.commitment) {
      p.onPrepareRound();
      return;
    }
    if (revealed.length === 0) return; // �??�택 no-op
    p.onOpenBetConfirm();
  }, [p, revealed.length]);

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

  const nextMult = useMemo(
    () => minesPreviewMultiplier(revealed.length, p.selection.mineCount),
    [revealed.length, p.selection.mineCount],
  );

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_320px]">
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Mines</h2>
          <GameRulesTrigger onOpen={() => setRulesOpen(true)} />
        </div>
        <Stage
          gameCode={p.gameCode}
          selection={p.selection}
          bet={p.bet}
          busy={p.busy}
          clientSeed={p.clientSeed}
          commitment={p.commitment}
          verification={p.verification}
          onClientSeedChange={p.onClientSeedChange}
          onSelectionChange={p.onSelectionChange}
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
              <span>{t("casino.confirm.mines.summary", { count: revealed.length })}</span>
              <span className="font-mono tabular-nums">{nextMult}×</span>
            </>
          }
          busy={p.busy}
          onConfirm={p.onSubmitBet}
          onCancel={p.onCancelBetConfirm}
        />
      )}

      <GameRulesSheet
        gameCode={p.gameCode}
        open={rulesOpen}
        onOpenChange={setRulesOpen}
      />
    </div>
  );
}

/** Back-compat alias for existing Lovable consumers (route loader, tests). */
export const MinesGame = ImportedMinesGame;
