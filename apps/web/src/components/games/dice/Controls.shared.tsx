/**
 * Dice · Controls (shared impl) — P2.2 v0.4 REFACTOR (Crash v0.3 parity).
 *
 * Named exports compose into Controls.mobile / Controls.desktop.
 * Legacy `DiceControlsShared` retained (now composes the new parts) so
 * existing vitest suites / older imports stay green.
 *
 * INVARIANTS:
 *  - Instant-settle game → no fireDelayMs override (default 320ms).
 *  - BetPanel FROZEN → markers ride wrapper container.
 *  - No edits to shared `useAutoBetQueue` / `AutoBetPanel` / `BetModeTabs`.
 *  - i18n keys for primary/secondary labels (parity with Crash).
 */
import type { ReactNode } from "react";
import { t } from "@/i18n";
import { BetPanel } from "../shared/BetPanel";
import { BetModeTabs } from "../shared/BetModeTabs";
import { useRGGate } from "../shared/RGGateProvider";
import type { ImportedGameSurfaceProps } from "../shared/types";

export type DiceControlsProps = ImportedGameSurfaceProps<"dice">;

/** Primary/auto handlers + ready flag — single source of truth. */
export function useDiceOnPrimary(p: DiceControlsProps) {
  const ready = Boolean(p.commitment);
  const rg = useRGGate();

  const onPrimary = ready
    ? async () => {
        const ok = await rg.gate("place_bet");
        if (!ok) return;
        p.onOpenBetConfirm();
      }
    : p.onPrepareRound;

  // A6 wrapper for auto-bet: prepare-if-needed → submit.
  const onAutoFire = async () => {
    if (!p.commitment) {
      await p.onPrepareRound();
    }
    p.onOpenBetConfirm();
    await p.onSubmitBet();
  };

  return { onPrimary, onAutoFire, ready };
}

/** BetPanel wrapper — owns dice-cta + dice-chip-row + dice-hash-btn markers. */
export function DiceBetPanelInner({
  p,
  primarySize = "xl",
  children,
}: {
  p: DiceControlsProps;
  primarySize?: "default" | "xl";
  children?: ReactNode;
}) {
  const { onPrimary, ready } = useDiceOnPrimary(p);
  return (
    <div data-game-id="dice-cta">
      <span hidden data-game-id="dice-hash-btn" />
      <div data-game-id="dice-chip-row">
        <BetPanel
          stake={p.stake}
          currency={p.currency}
          availableBalance={p.availableBalance}
          busy={p.busy}
          ready={ready}
          primarySize={primarySize}
          primaryLabel={ready ? t("games.dice.placeBet") : t("games.dice.prepare")}
          secondaryLabel={t("games.dice.hashCommit")}
          onStakeChange={p.onStakeChange}
          onCurrencyChange={p.onCurrencyChange}
          onPrimary={onPrimary}
          onSecondary={p.onPrepareRound}
        >
          {children}
        </BetPanel>
      </div>
    </div>
  );
}

/** Legacy composed wrapper — kept for existing test/import paths. */
export function DiceControlsShared(p: DiceControlsProps) {
  const { onAutoFire } = useDiceOnPrimary(p);
  const manual = <DiceBetPanelInner p={p} primarySize="default" />;
  return (
    <BetModeTabs
      manual={manual}
      baseStake={p.stake}
      currency={p.currency}
      commitment={p.commitment}
      busy={p.busy}
      bet={p.bet}
      onAutoFire={onAutoFire}
    />
  );
}
