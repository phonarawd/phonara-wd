/**
 * Crash ??game surface entry point.
 *
 * Phase 2 wiring:
 *  - `RGGateProvider` wraps the surface; Controls.shared awaits gate
 *    before `onOpenBetConfirm`.
 *  - `BetConfirmDialog` is mounted only while `confirmOpen === true`
 *    (3 testids attached on demand).
 *  - `GameRulesSheet` is controlled by local `rulesOpen` state; both
 *    the HUD `GameRulesTrigger` button AND the `?` shortkey open the
 *    same Sheet.
 *  - `useGameShortkeys` implements the Space state machine
 *    (idle ??prepare, ready ??openConfirm, confirmOpen ??no-op).
 */
import { useCallback, useMemo, useState } from "react";
import { t } from "@/i18n";
import { formatStakeStep } from "@/lib/money-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGameShortkeys } from "@/hooks/useGameShortkeys";
import { RGGateProvider } from "../shared/RGGateProvider";
import { BetConfirmDialog } from "../shared/BetConfirmDialog";
import { GameRulesSheet, GameRulesTrigger } from "../shared/GameRulesSheet";
import { normalizeRecentBets } from "../shared/adapt-recent-bet";
import type { ImportedGameSurfaceProps } from "../shared/types";
import { CrashRoundProvider } from "./CrashRoundContext";
import { Stage } from "./Stage";
import { HUD } from "./HUD";
import { ControlsMobile } from "./Controls.mobile";
import { ControlsDesktop } from "./Controls.desktop";

export function ImportedCrashGame(props: ImportedGameSurfaceProps<"crash">) {
  return (
    <RGGateProvider>
      <CrashRoundProvider>
        <CrashSurface {...props} />
      </CrashRoundProvider>
    </RGGateProvider>
  );
}

function CrashSurface(p: ImportedGameSurfaceProps<"crash">) {
  const isMobile = useIsMobile();
  const Controls = isMobile ? ControlsMobile : ControlsDesktop;
  const [rulesOpen, setRulesOpen] = useState(false);

  // #P2.0c-18 ??single normalize site for recentBets (dual-shape adapter).
  const recentBets = useMemo(() => normalizeRecentBets(p.recentBets), [p.recentBets]);

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

  // Space state machine: idle ??prepare, ready ??openConfirm, confirmOpen ??no-op.
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

  // #P2.0c-T3 ??pasteShellConfirm === true ??PHONARA shell owns the dialog;
  // do NOT mount our own (avoids duplicate testid).
  const showShellConfirm = p.pasteShellConfirm !== true;

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_320px]">
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Crash</h2>
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
          recentBets={recentBets}
        />
        <HUD recentBets={recentBets} />
      </div>
      <Controls {...p} />

      {showShellConfirm && (
        <BetConfirmDialog
          open={p.confirmOpen}
          stake={p.stake}
          currency={p.currency}
          summary={
            <>
              <span>{t("games.crash.autoCashout")}</span>
              <span className="font-mono tabular-nums">{p.selection.autoCashout}×</span>
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
export const CrashGame = ImportedCrashGame;
