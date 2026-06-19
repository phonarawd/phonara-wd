/**
 * Gold Rush ??game surface entry point.
 *
 * §8-B v1 LOCK (MintReels ?�턴 1:1):
 *  - `<RGGateProvider>` wrap
 *  - `<BetConfirmDialog>` mounted with `open={p.confirmOpen}`
 *  - `useGameShortkeys` Space 3-state
 *    (confirmOpen ??no-op, idle ??prepare, ready ??openConfirm)
 *  - `?` ??rules sheet open (§8-A-bis mint/gold backlog ?�시 ?�소)
 *  - controlled `<GameRulesSheet gameCode="gold_rush">` + `<GameRulesTrigger>`
 *
 * GoldRush ?�롯 LOCK:
 *  - selection `{ lines: number }` only · turbo UI-only · result.grid ?�기 금�?
 *    (Stage already enforces seedToGrid + totalMultiplier only)
 *
 * Named export `ImportedGoldRushGame` (PHONARA registry contract).
 * `gameCode` uses UNDERSCORE (`gold_rush`) per engine convention.
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

export function ImportedGoldRushGame(props: ImportedGameSurfaceProps<"gold_rush">) {
  return (
    <RGGateProvider>
      <GoldRushSurface {...props} />
    </RGGateProvider>
  );
}

function GoldRushSurface(p: ImportedGameSurfaceProps<"gold_rush">) {
  const isMobile = useIsMobile();
  const Controls = isMobile ? ControlsMobile : ControlsDesktop;
  const [rulesOpen, setRulesOpen] = useState(false);

  // Stake chip helpers (½, 2×, MAX). MAX caps at availableBalance.
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

  // Space 3-state: confirmOpen ??no-op, !commitment ??prepare, ready ??openConfirm.
  // RG gating is handled inside Controls.shared.onPrimary.
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
    <div data-testid="casino-game-root" className="grid gap-4 md:grid-cols-[1fr_320px]">
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Gold Rush</h2>
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

      <BetConfirmDialog
        open={p.confirmOpen}
        stake={p.stake}
        currency={p.currency}
        summary={
          <>
            <span>{p.selection.lines} lines</span>
            <span className="font-mono tabular-nums">{p.stake}</span>
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

/** Back-compat alias. */
export const GoldRushGame = ImportedGoldRushGame;
