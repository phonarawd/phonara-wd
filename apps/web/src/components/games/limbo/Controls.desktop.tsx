/**
 * Limbo · Controls.desktop — right-rail card panel (P2.3 v0.4).
 *
 * Composes refactored shared parts inside a rounded-2xl border card
 * (NOT wrapper-only). index.tsx grid (`md:grid-cols-[1fr_320px]`)
 * places this in the right column; sticky offset rides the viewport.
 * Instant-settle game → no auto fireDelay override (320ms default).
 */
import { BetModeTabs } from "../shared/BetModeTabs";
import {
  LimboBetPanelInner,
  useLimboOnPrimary,
  type LimboControlsProps,
} from "./Controls.shared";
import { LimboAutoSlot } from "./LimboAutoSlot";

export function ControlsDesktop(p: LimboControlsProps) {
  const { onAutoFire } = useLimboOnPrimary(p);
  const manual = <LimboBetPanelInner p={p} primarySize="xl" />;

  return (
    <div
      data-game-id="limbo-panel-desktop"
      className="rounded-2xl border border-border bg-(--color-surface-elev) p-4 lg:sticky lg:top-4 lg:self-start"
    >
      <div data-game-id="limbo-mode-tabs">
        <BetModeTabs
          manual={manual}
          baseStake={p.stake}
          currency={p.currency}
          commitment={p.commitment}
          busy={p.busy}
          bet={p.bet}
          onAutoFire={onAutoFire}
          autoSlot={
            <LimboAutoSlot
              target={p.selection.target}
              onTargetChange={(target) => p.onSelectionChange({ target })}
            />
          }
        />
      </div>
    </div>
  );
}
