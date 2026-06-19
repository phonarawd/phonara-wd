/**
 * Dice · Controls.desktop — right-rail card panel (P2.2 v0.4).
 *
 * Composes refactored shared parts inside a rounded-2xl border card
 * (NOT wrapper-only). index.tsx grid (`md:grid-cols-[1fr_320px]`)
 * places this in the right column; sticky offset rides the viewport.
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

export function ControlsDesktop(p: DiceControlsProps) {
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
    <div
      data-game-id="dice-panel-desktop"
      className="rounded-2xl border border-border bg-(--color-surface-elev) p-4 lg:sticky lg:top-4 lg:self-start"
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
  );
}
