/**
 * HiLo ??game surface entry point. (Phase 5 v1 LOCK · Limbo/Mines ?�턴 1:1)
 *
 * - `<RGGateProvider>` wrap
 * - `<BetConfirmDialog>` mounted only while confirmOpen
 *   (summary: ?�수 + ?�작 카드 + ?�상 배수 ??UI ?�퍼 `expectedMultiplierFromGuesses`)
 * - controlled `<GameRulesSheet gameCode="hilo">` + `<GameRulesTrigger>`
 *   (trigger `casino-game-rules`; PF sheet `casino-fairness-verifier` 분리)
 * - `useGameShortkeys` Space 4-state (no guess ??no-op) + 1/2/5/Esc/?
 *
 * 카드 진실(`bet.result.cards`)?� ?�버?�서 ?? UI??startCard·guesses
 * ?�력 + 카드 ?�시 ?�용.
 *
 * PHONARA registry expects the exact symbol `ImportedHiloGame`.
 */
import { useCallback, useState } from "react";
import type { ImportedGameSurfaceProps } from "../shared/types";
import { formatStakeStep } from "@/lib/money-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGameShortkeys } from "@/hooks/useGameShortkeys";
import { RGGateProvider } from "../shared/RGGateProvider";
import { BetConfirmDialog } from "../shared/BetConfirmDialog";
import { GameRulesSheet, GameRulesTrigger } from "../shared/GameRulesSheet";
import { Stage } from "./Stage";
import { HUD } from "./HUD";
import { ControlsMobile } from "./Controls.mobile";
import { ControlsDesktop } from "./Controls.desktop";
import { expectedMultiplierFromGuesses } from "./multiplier";

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;

export function ImportedHiloGame(props: ImportedGameSurfaceProps<"hilo">) {
  return (
    <RGGateProvider>
      <HiloSurface {...props} />
    </RGGateProvider>
  );
}

function HiloSurface(p: ImportedGameSurfaceProps<"hilo">) {
  const isMobile = useIsMobile();
  const Controls = isMobile ? ControlsMobile : ControlsDesktop;
  const [rulesOpen, setRulesOpen] = useState(false);

  const guesses = p.selection.guesses;
  const startCard = p.selection.startCard;
  const startLabel = startCard !== null ? RANKS[startCard % 13] : "—";
  const expected = expectedMultiplierFromGuesses(guesses);

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

  // Space 4-state: confirmOpen ??no-op, !commitment ??prepare,
  // ready && guesses.length === 0 ??no-op, ready && guesses.length > 0 ??  // openConfirm. RG gating is handled inside Controls.shared.onPrimary.
  const onSpace = useCallback(() => {
    if (p.confirmOpen) return;
    if (!p.commitment) {
      p.onPrepareRound();
      return;
    }
    if (guesses.length === 0) return;
    p.onOpenBetConfirm();
  }, [p, guesses.length]);

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
    <div className="grid gap-4 md:grid-cols-[1fr_320px]">
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Hi-Lo</h2>
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
          onSelectionChange={p.onSelectionChange}
        />
        <HUD recentBets={p.recentBets} />
      </div>
      <Controls {...p} />

      <BetConfirmDialog
        open={p.confirmOpen}
        stake={p.stake}
        currency={p.currency}
        summary={
          <>
            <span>
              {guesses.length}??· ?�작 {startLabel}
            </span>
            <span className="font-mono tabular-nums">?�상 {expected}×</span>
          </>
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

/** Back-compat alias for existing Lovable consumers (route loader, tests). */
export const HiloGame = ImportedHiloGame;
