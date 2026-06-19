/**
 * HiLo · Controls (shared impl) — P2.6 v0.4 REFACTOR (Crash/Dice/Limbo/Mines/Plinko parity).
 *
 * Named exports compose into Controls.mobile / Controls.desktop.
 * Legacy `HiloControlsShared` retained (now composes the new parts).
 *
 * INVARIANTS:
 *  - Instant-settle game → no fireDelayMs override (default 320ms).
 *  - BetPanel/BetModeTabs FROZEN → markers ride wrapper containers.
 *  - i18n keys for primary/secondary/disabled labels.
 *  - selection schema unchanged: { guesses, startCard }.
 */
import type { ReactNode } from "react";
import { t } from "@/i18n";
import { BetPanel } from "../shared/BetPanel";
import { BetModeTabs } from "../shared/BetModeTabs";
import { useRGGate } from "../shared/RGGateProvider";
import type { ImportedGameSurfaceProps } from "../shared/types";

export type HiloControlsProps = ImportedGameSurfaceProps<"hilo">;

/** Primary/auto handlers + guess flags — single source of truth. */
export function useHiloOnPrimary(p: HiloControlsProps) {
  const ready = Boolean(p.commitment);
  const count = p.selection.guesses.length;
  const noGuess = count === 0;
  const rg = useRGGate();

  const onPrimary =
    ready && !noGuess
      ? async () => {
          const ok = await rg.gate("place_bet");
          if (!ok) return;
          p.onOpenBetConfirm();
        }
      : p.onPrepareRound;

  const onAutoFire = async () => {
    if (p.selection.guesses.length === 0) {
      throw new Error(t("casino.auto.needSelection.hilo"));
    }
    if (!p.commitment) await p.onPrepareRound();
    p.onOpenBetConfirm();
    await p.onSubmitBet();
  };

  return { onPrimary, onAutoFire, ready, noGuess, count };
}

/** BetPanel wrapper — owns hilo-cta + hilo-chip-row + hilo-hash-btn markers. */
export function HiloBetPanelInner({
  p,
  primarySize = "xl",
  children,
}: {
  p: HiloControlsProps;
  primarySize?: "default" | "xl";
  children?: ReactNode;
}) {
  const { onPrimary, ready, noGuess, count } = useHiloOnPrimary(p);
  const primaryLabel = noGuess
    ? t("games.hilo.guessFirst")
    : ready
      ? t("games.hilo.cashoutN", { n: count })
      : t("games.hilo.prepare");

  return (
    <div data-game-id="hilo-cta">
      <span hidden data-game-id="hilo-hash-btn" />
      <div data-game-id="hilo-chip-row">
        <BetPanel
          stake={p.stake}
          currency={p.currency}
          availableBalance={p.availableBalance}
          busy={p.busy}
          ready={ready}
          primarySize={primarySize}
          primaryLabel={primaryLabel}
          secondaryLabel={t("games.hilo.hashCommit")}
          onStakeChange={p.onStakeChange}
          onCurrencyChange={p.onCurrencyChange}
          onPrimary={onPrimary}
          onSecondary={p.onPrepareRound}
          disabledReason={ready && noGuess ? t("games.hilo.guessPrompt") : null}
        >
          {children}
        </BetPanel>
      </div>
    </div>
  );
}

/** Legacy composed wrapper — kept for existing test/import paths. */
export function HiloControlsShared(p: HiloControlsProps) {
  const { onAutoFire, noGuess } = useHiloOnPrimary(p);
  const manual = <HiloBetPanelInner p={p} primarySize="default" />;
  return (
    <BetModeTabs
      manual={manual}
      baseStake={p.stake}
      currency={p.currency}
      commitment={p.commitment}
      busy={p.busy}
      bet={p.bet}
      availableBalance={p.availableBalance}
      onAutoFire={onAutoFire}
      startDisabledReason={noGuess ? t("casino.auto.needSelection.hilo") : null}
    />
  );
}
