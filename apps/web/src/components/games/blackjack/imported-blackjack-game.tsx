/**
 * Blackjack ??surface entry. Named export `ImportedBlackjackGame`.
 *
 * Phase 4 v1 RED LOCK FINAL+ ??Roulette 5??wiring 1:1:
 *  - `<RGGateProvider>` wrap
 *  - `<BetConfirmDialog>` mounted only while confirmOpen
 *    (summary: i18n `casino.confirm.action_sequence_summary` ??multiplier 미표??
 *  - controlled `<GameRulesSheet gameCode="blackjack">` + `<GameRulesTrigger>`
 *    (trigger `casino-game-rules`; FairnessSheet??Stage??별도 mount)
 *  - `useGameShortkeys` Space 3-state (busted || finished || actions.length===0 가??
 *    + 1/2/5/Esc/?
 *
 * PHONARA registry expects the exact symbol `ImportedBlackjackGame`.
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
import { handScore } from "./playBlackjack";
import { Stage } from "./Stage";
import { HUD } from "./HUD";
import { ControlsMobile } from "./Controls.mobile";
import { ControlsDesktop } from "./Controls.desktop";

function isBusted(bet: ImportedGameSurfaceProps<"blackjack">["bet"]): boolean {
  const result = bet?.result as { player?: number[] } | undefined;
  const cards = result?.player ?? [];
  if (cards.length === 0) return false;
  return handScore(cards) > 21;
}

export function ImportedBlackjackGame(props: ImportedGameSurfaceProps<"blackjack">) {
  return (
    <RGGateProvider>
      <BlackjackSurface {...props} />
    </RGGateProvider>
  );
}

function BlackjackSurface(p: ImportedGameSurfaceProps<"blackjack">) {
  const isMobile = useIsMobile();
  const Controls = isMobile ? ControlsMobile : ControlsDesktop;
  const [rulesOpen, setRulesOpen] = useState(false);

  const actionCount = p.selection.actions.length;
  const lastMove = p.selection.actions[actionCount - 1]?.move;
  const busted = isBusted(p.bet);
  const finished = lastMove === "stand" || lastMove === "double" || busted;

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

  // Space 3-state (busted 가???�함):
  //  confirmOpen ??no-op · finished+empty? ??no-op · !commitment ??prepare ·
  //  commitment ??openConfirm (auto-fill stand if empty).
  const onSpace = useCallback(() => {
    if (p.confirmOpen) return;
    if (!p.commitment) {
      p.onPrepareRound();
      return;
    }
    if (busted) return;
    p.onOpenBetConfirm();
  }, [p, busted]);

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
          <h2 className="text-sm font-semibold text-muted-foreground">Blackjack</h2>
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
          finished={finished}
        />
        <HUD recentBets={p.recentBets} />
      </div>
      <Controls {...p} />

      <BetConfirmDialog
        open={p.confirmOpen}
        stake={p.stake}
        currency={p.currency}
        summary={
          <span className="font-mono tabular-nums">
            {t("casino.confirm.action_sequence_summary", {
              count: Math.max(1, actionCount),
              stake: p.stake,
              currency: p.currency,
            })}
          </span>
        }
        busy={p.busy}
        onConfirm={p.onSubmitBet}
        onCancel={p.onCancelBetConfirm}
      />

      <GameRulesSheet
        gameCode={p.gameCode}
        open={rulesOpen}
        onOpenChange={setRulesOpen}
      />
    </div>
  );
}

export const BlackjackGame = ImportedBlackjackGame;
