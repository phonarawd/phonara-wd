/**
 * Mines · Controls.mobile — sticky-bottom thumb-zone panel.
 *
 * Wires the typed Mines auto-slot (`MinesAutoSlot`) via the new
 * `autoSlot` prop on BetModeTabs. Limbo lesson applied: live render
 * in BOTH desktop and mobile, not just existence.
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

export function ControlsMobile(p: MinesControlsProps) {
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
    <>
      <div
        aria-hidden
        className="h-[360px]"
        data-game-id="mines-panel-mobile-spacer"
      />
      <div
        data-game-id="mines-panel-mobile"
        className="fixed inset-x-0 bottom-0 z-40 max-h-[82vh] min-h-14 overflow-y-auto border-t border-border bg-(--color-surface-elev)/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-(--color-surface-elev)/85"
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
    </>
  );
}
