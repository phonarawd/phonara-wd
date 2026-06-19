/**
 * Dice ??game surface entry point. (Phase 5 v1 RED LOCK v3.1 · HiLo ?�턴 1:1)
 *
 * - `<RGGateProvider>` wrap
 * - `<BetConfirmDialog>` mounted only while confirmOpen
 *   (summary: `{OVER|UNDER} {target} · ?�률 {winChance}% · ?�상 {diceMultiplier}×`
 *    ??UI ?�퍼 `diceMultiplier(target, direction)`, bet.result 미오??
 * - controlled `<GameRulesSheet gameCode="dice">` + `<GameRulesTrigger>`
 *   (trigger `casino-game-rules`; PF sheet `casino-fairness-verifier` 분리)
 * - `useGameShortkeys` Space **3-state** (scalar selection ??noGuess 가???�음)
 *   + 1/2/5/Esc/?
 *
 * PHONARA registry expects the exact symbol `ImportedDiceGame`.
 */
import { useCallback, useState } from "react";
import type { ImportedGameSurfaceProps } from "../shared/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGameShortkeys } from "@/hooks/useGameShortkeys";
import { RGGateProvider } from "../shared/RGGateProvider";
import { BetConfirmDialog } from "../shared/BetConfirmDialog";
import { GameRulesSheet, GameRulesTrigger } from "../shared/GameRulesSheet";
import { t } from "@/i18n";
import { formatStakeStep } from "@/lib/money-input";
import { Stage } from "./Stage";
import { HUD } from "./HUD";
import { ControlsMobile } from "./Controls.mobile";
import { ControlsDesktop } from "./Controls.desktop";
import { diceMultiplier } from "./multiplier";

export function ImportedDiceGame(props: ImportedGameSurfaceProps<"dice">) {
  return (
    <RGGateProvider>
      <DiceSurface {...props} />
    </RGGateProvider>
  );
}

function DiceSurface(p: ImportedGameSurfaceProps<"dice">) {
  const isMobile = useIsMobile();
  const Controls = isMobile ? ControlsMobile : ControlsDesktop;
  const [rulesOpen, setRulesOpen] = useState(false);

  const target = Number(p.selection.target) || 50;
  const over = p.selection.direction === "over";
  const winChance = over ? 100 - target : target;
  const expected = diceMultiplier(target, p.selection.direction).toFixed(2);

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

  // Space 3-state: confirmOpen ??no-op, !commitment ??prepare,
  // commitment ??openConfirm. RG gating is handled inside Controls.shared.onPrimary.
  const onSpace = useCallback(() => {
    if (p.confirmOpen) return;
    if (!p.commitment) {
      p.onPrepareRound();
      return;
    }
    p.onOpenBetConfirm();
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

  // pasteShellConfirm === true ??PHONARA shell owns the dialog; avoid duplicate testids.
  const showShellConfirm = p.pasteShellConfirm !== true;

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_320px]">
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Dice</h2>
          <GameRulesTrigger onOpen={() => setRulesOpen(true)} />
        </div>
        <Stage
          gameCode={p.gameCode}
          selection={p.selection}
          bet={p.bet}
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
              <span>
                {t("casino.confirm.dice.predicate", { direction: over ? "OVER" : "UNDER", target: target.toFixed(2), chance: winChance.toFixed(2) })}
              </span>
              <span className="font-mono tabular-nums">{t("casino.confirm.dice.expected", { mult: expected })}</span>
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
export const DiceGame = ImportedDiceGame;
