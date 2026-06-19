/**
 * Mines · Controls.desktop — right-rail card panel.
 *
 * Composes refactored shared parts inside a rounded-2xl border card.
 * Wires the typed Mines auto-slot (`MinesAutoSlot`) via the new
 * `autoSlot` prop on BetModeTabs — Limbo lesson: slot must render on
 * the LIVE route, not just exist as a component.
 */
import { t } from "@/i18n";
import { BetModeTabs } from "../shared/BetModeTabs";
import {
  MinesBetPanelInner,
  MinesCountSelector,
  makeMinesAutoSlot,
  useMinesOnPrimary,
  type MinesControlsProps,
} from "./Controls.shared";

export function ControlsDesktop(p: MinesControlsProps) {
  const api = useMinesOnPrimary(p);
  const { onAutoFireSlot, settled, setMines, mineCount, revealCount } = api;
  const selector = (
    <MinesCountSelector mineCount={mineCount} settled={settled} onSet={setMines} />
  );
  const manual = (
    <MinesBetPanelInner p={p} primarySize="xl">
      {selector}
    </MinesBetPanelInner>
  );

  return (
    <div
      data-game-id="mines-panel-desktop"
      className="rounded-2xl border border-border bg-(--color-surface-elev) p-4 lg:sticky lg:top-4 lg:self-start"
    >
      <div data-game-id="mines-mode-tabs">
        <BetModeTabs
          manual={manual}
          baseStake={p.stake}
          currency={p.currency}
          commitment={p.commitment}
          busy={p.busy}
          bet={p.bet}
          availableBalance={p.availableBalance}
          onAutoFire={onAutoFireSlot}
          autoSlot={makeMinesAutoSlot(api)}
          startDisabledReason={
            revealCount < 1 ? t("casino.auto.needSelection.mines") : null
          }
        />
      </div>
    </div>
  );
}
