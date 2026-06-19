/**
 * Plinko ??game surface entry point. (Phase 3 v3, Crash ?�턴 1:1)
 *
 * - `<RGGateProvider>` ?�핑 (B-1)
 * - `<BetConfirmDialog>` (B-3) ??confirmOpen ?�만 DOM 부�? * - controlled `<GameRulesSheet>` + `<GameRulesTrigger>` (?로도 open)
 * - `useGameShortkeys` Space 3분기 + 1/2/5/Esc/?
 *
 * PHONARA registry expects the exact symbol `ImportedPlinkoGame`.
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

export function ImportedPlinkoGame(props: ImportedGameSurfaceProps<"plinko">) {
  return (
    <RGGateProvider>
      <PlinkoSurface {...props} />
    </RGGateProvider>
  );
}

function PlinkoSurface(p: ImportedGameSurfaceProps<"plinko">) {
  const isMobile = useIsMobile();
  const Controls = isMobile ? ControlsMobile : ControlsDesktop;
  const [rulesOpen, setRulesOpen] = useState(false);
  const showShellConfirm = p.pasteShellConfirm !== true;

  // BetPanel chip helpers via stake math (½, 2×, MAX). MAX caps at availableBalance.
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

  // Space state-machine (Crash?� ?�일): confirmOpen ??no-op, !commitment ??prepare,
  // ready ??openConfirm. RG gating?� Controls.shared.onPrimary?�서 처리.
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
          <h2 className="text-sm font-semibold text-muted-foreground">Plinko</h2>
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
              <span>{t("casino.field.risk")}</span>
              <span className="font-mono tabular-nums">
                {t(`casino.plinko.risk.${p.selection.risk}`)} · {p.selection.rows}
              </span>
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
export const PlinkoGame = ImportedPlinkoGame;
