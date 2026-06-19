/**
 * Limbo · Controls (shared impl) — P2.3 v0.4 REFACTOR (Crash/Dice parity).
 *
 * Named exports compose into Controls.mobile / Controls.desktop.
 * Legacy `LimboControlsShared` retained (now composes the new parts) so
 * existing vitest suites / older imports stay green.
 *
 * INVARIANTS:
 *  - Instant-settle game → no fireDelayMs override (default 320ms).
 *  - BetPanel FROZEN → markers ride wrapper container.
 *  - No edits to shared `useAutoBetQueue` / `AutoBetPanel` / `BetModeTabs`.
 *  - i18n keys for primary/secondary labels (parity with Crash/Dice).
 */
import type { ReactNode } from "react";
import { t } from "@/i18n";
import { BetPanel } from "../shared/BetPanel";
import { BetModeTabs } from "../shared/BetModeTabs";
import { useRGGate } from "../shared/RGGateProvider";
import type { ImportedGameSurfaceProps } from "../shared/types";
import { LimboAutoSlot } from "./LimboAutoSlot";

export type LimboControlsProps = ImportedGameSurfaceProps<"limbo">;

/** Primary/auto handlers + ready flag — single source of truth. */
export function useLimboOnPrimary(p: LimboControlsProps) {
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

/** BetPanel wrapper — owns limbo-cta + limbo-chip-row + limbo-hash-btn markers. */
export function LimboBetPanelInner({
  p,
  primarySize = "xl",
  children,
}: {
  p: LimboControlsProps;
  primarySize?: "default" | "xl";
  children?: ReactNode;
}) {
  const { onPrimary, ready } = useLimboOnPrimary(p);
  return (
    <div data-game-id="limbo-cta">
      <span hidden data-game-id="limbo-hash-btn" />
      <div data-game-id="limbo-chip-row">
        <BetPanel
          stake={p.stake}
          currency={p.currency}
          availableBalance={p.availableBalance}
          busy={p.busy}
          ready={ready}
          primarySize={primarySize}
          primaryLabel={ready ? t("games.limbo.placeBet") : t("games.limbo.prepare")}
          secondaryLabel={t("games.limbo.hashCommit")}
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
export function LimboControlsShared(p: LimboControlsProps) {
  const { onAutoFire } = useLimboOnPrimary(p);
  const manual = <LimboBetPanelInner p={p} primarySize="default" />;
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
      autoSlot={
        <LimboAutoSlot
          target={p.selection.target}
          onTargetChange={(target) => p.onSelectionChange({ target })}
        />
      }
    />
  );
}
