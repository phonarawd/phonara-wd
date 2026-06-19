/**
 * Plinko · Controls.desktop — right-rail card panel (P2.5 v0.4).
 *
 * Composes refactored shared parts inside a rounded-2xl border card
 * (NOT wrapper-only). Instant-settle → no auto fireDelay (320ms default).
 */
import { BetModeTabs } from "../shared/BetModeTabs";
import {
  PlinkoBetPanelInner,
  PlinkoSelectionUI,
  usePlinkoOnPrimary,
  type PlinkoControlsProps,
} from "./Controls.shared";

export function ControlsDesktop(p: PlinkoControlsProps) {
  const { onAutoFire } = usePlinkoOnPrimary(p);
  const manual = (
    <PlinkoBetPanelInner p={p} primarySize="xl">
      <PlinkoSelectionUI p={p} />
    </PlinkoBetPanelInner>
  );

  return (
    <div
      data-game-id="plinko-panel-desktop"
      className="rounded-2xl border border-border bg-(--color-surface-elev) p-4 lg:sticky lg:top-4 lg:self-start"
    >
      <div data-game-id="plinko-mode-tabs">
        <BetModeTabs
          manual={manual}
          baseStake={p.stake}
          currency={p.currency}
          commitment={p.commitment}
          busy={p.busy}
          bet={p.bet}
          onAutoFire={onAutoFire}
        />
      </div>
    </div>
  );
}
