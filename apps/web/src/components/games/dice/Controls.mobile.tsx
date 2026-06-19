/**
 * Dice · Controls.mobile — sticky-bottom thumb-zone panel (P2.2 v0.4).
 *
 * Composes refactored shared parts (NOT wrapper-only). Manual tab body
 * hosts `casino-prepare-hash` (BetPanel secondary slot) reachable on
 * mobile. Primary CTA reaches min-h-14 via `primarySize="xl"`.
 * Instant-settle game → no auto fireDelay override (320ms default).
 */
import { BetModeTabs } from "../shared/BetModeTabs";
import {
  DiceBetPanelInner,
  useDiceOnPrimary,
  type DiceControlsProps,
} from "./Controls.shared";
import { DiceAutoSlot } from "./DiceAutoSlot";
import type { DiceSelection } from "../shared/types";

export function ControlsMobile(p: DiceControlsProps) {
  const { onAutoFire } = useDiceOnPrimary(p);
  const manual = <DiceBetPanelInner p={p} primarySize="xl" />;
  const autoSlot = (
    <DiceAutoSlot
      target={p.selection.target}
      direction={p.selection.direction}
      onTargetChange={(v) =>
        p.onSelectionChange({ ...p.selection, target: v } as DiceSelection)
      }
      onDirectionChange={(d) =>
        p.onSelectionChange({ ...p.selection, direction: d } as DiceSelection)
      }
    />
  );

  return (
    <>
      <div
        aria-hidden
        className="h-[360px]"
        data-game-id="dice-panel-mobile-spacer"
      />
      <div
        data-game-id="dice-panel-mobile"
        className="fixed inset-x-0 bottom-0 z-40 max-h-[82vh] min-h-14 overflow-y-auto border-t border-border bg-(--color-surface-elev)/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-(--color-surface-elev)/85"
      >
        <div data-game-id="dice-mode-tabs">
          <BetModeTabs
            manual={manual}
            baseStake={p.stake}
            currency={p.currency}
            commitment={p.commitment}
            busy={p.busy}
            bet={p.bet}
            onAutoFire={onAutoFire}
            autoSlot={autoSlot}
          />
        </div>
      </div>
    </>
  );
}
