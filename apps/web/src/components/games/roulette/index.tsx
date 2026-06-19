/**
 * Roulette ??surface entry. Named export `ImportedRouletteGame`.
 *
 * Phase 4 v1 RED LOCK v1 FINAL+ ??Dice/HiLo 5??wiring 1:1:
 *  - `<RGGateProvider>` wrap
 *  - `<BetConfirmDialog>` mounted only while confirmOpen
 *    (summary: i18n `casino.confirm.bet_count_summary` ??multiplier 미표??
 *     bets 조합 가변 ??preview 부?�합)
 *  - controlled `<GameRulesSheet gameCode="roulette">` + `<GameRulesTrigger>`
 *    (trigger `casino-game-rules`; FairnessSheet??Stage??별도 mount ?? *    `casino-fairness-verifier`)
 *  - `useGameShortkeys` Space **3-state** (bets.length===0 가???�함)
 *    + 1/2/5/Esc/?
 *
 * PHONARA registry expects the exact symbol `ImportedRouletteGame`.
 * `data-testid="roulette-wheel"` 보존 (smoke-spec discovery).
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

export function ImportedRouletteGame(props: ImportedGameSurfaceProps<"roulette">) {
  return (
    <RGGateProvider>
      <RouletteSurface {...props} />
    </RGGateProvider>
  );
}

function RouletteSurface(p: ImportedGameSurfaceProps<"roulette">) {
  const isMobile = useIsMobile();
  const Controls = isMobile ? ControlsMobile : ControlsDesktop;
  const [rulesOpen, setRulesOpen] = useState(false);
  const showShellConfirm = p.pasteShellConfirm !== true;

  const betCount = p.selection.bets.length;
  const totalWeight = p.selection.bets.reduce((acc, b) => acc + b.stakeWeight, 0);

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

  // Space 3-state: confirmOpen ??no-op, bets.length===0 ??no-op,
  // !commitment ??prepare, commitment ??openConfirm.
  // RG gating handled inside Controls.shared.handlePrimary; openConfirm itself
  // bypasses RG here because shortkey-driven path mirrors the click path through
  // BetPanel only when bets exist + commitment exists (caller-side parity).
  const onSpace = useCallback(() => {
    if (p.confirmOpen) return;
    if (betCount === 0) return;
    if (!p.commitment) {
      p.onPrepareRound();
      return;
    }
    p.onOpenBetConfirm();
  }, [p, betCount]);

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
      className="grid gap-4 md:grid-cols-[1fr_360px]"
    >
      <div data-testid="roulette-wheel" className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Roulette</h2>
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
          <span className="font-mono tabular-nums">
            {t("casino.confirm.bet_count_summary", {
              count: betCount,
              weight: totalWeight,
              currency: p.currency,
            })}
          </span>
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
export const RouletteGame = ImportedRouletteGame;
