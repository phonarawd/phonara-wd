/**
 * Limbo ??game surface entry point. (Phase 4 v1.3 · Crash ?�턴 1:1)
 *
 * - `<RGGateProvider>` wrap
 * - `<BetConfirmDialog>` mounted only while confirmOpen
 * - controlled `<GameRulesSheet gameCode="limbo">` + `<GameRulesTrigger>`
 * - `useGameShortkeys` Space 3분기 + 1/2/5/Esc/?
 *
 * PHONARA registry expects the exact symbol `ImportedLimboGame`.
 */
import { useCallback, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGameShortkeys } from "@/hooks/useGameShortkeys";
import { t } from "@/i18n";
import { formatStakeStep } from "@/lib/money-input";
import { RGGateProvider } from "../shared/RGGateProvider";
import { BetConfirmDialog } from "../shared/BetConfirmDialog";
import { GameRulesSheet, GameRulesTrigger } from "../shared/GameRulesSheet";
import type { ImportedGameSurfaceProps } from "../shared/types";
import { Stage } from "./Stage";
import { HUD } from "./HUD";
import { ControlsMobile } from "./Controls.mobile";
import { ControlsDesktop } from "./Controls.desktop";

export function ImportedLimboGame(props: ImportedGameSurfaceProps<"limbo">) {
  return (
    <RGGateProvider>
      <LimboSurface {...props} />
    </RGGateProvider>
  );
}

function LimboSurface(p: ImportedGameSurfaceProps<"limbo">) {
  const isMobile = useIsMobile();
  const Controls = isMobile ? ControlsMobile : ControlsDesktop;
  const [rulesOpen, setRulesOpen] = useState(false);
  const showShellConfirm = p.pasteShellConfirm !== true;
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
  // ready ??openConfirm. RG gating is handled inside Controls.shared.onPrimary.
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
    <div className="grid gap-4 md:grid-cols-[1fr_320px]">
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Limbo</h2>
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
              <span>{t("casino.field.target")}</span>
              <span className="font-mono tabular-nums">{p.selection.target}×</span>
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
export const LimboGame = ImportedLimboGame;
