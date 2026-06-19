/**
 * Gold Rush · Controls.desktop — right-rail card panel (P2.10 v0.4).
 *
 * Composes refactored shared parts inside a rounded-2xl border card
 * (NOT wrapper-only). Instant-settle → no fireDelay override (320ms).
 */
import { BetModeTabs } from "../shared/BetModeTabs";
import {
  GoldRushBetPanelInner,
  useGoldRushOnPrimary,
  type GoldRushControlsProps,
} from "./Controls.shared";

export function ControlsDesktop(p: GoldRushControlsProps) {
  const { onAutoFire } = useGoldRushOnPrimary(p);
  const manual = <GoldRushBetPanelInner p={p} primarySize="xl" />;

  return (
    <div data-testid="casino-controls">
      <div
        data-game-id="goldrush-panel-desktop"
        className="rounded-2xl border border-border bg-(--color-surface-elev) p-4 lg:sticky lg:top-4 lg:self-start"
      >
        <div data-game-id="goldrush-mode-tabs">
          <BetModeTabs
            manual={manual}
            baseStake={p.stake}
            currency={p.currency}
            commitment={p.commitment}
            busy={p.busy}
            bet={p.bet}
            availableBalance={p.availableBalance}
            onAutoFire={onAutoFire}
          />
        </div>
      </div>
    </div>
  );
}
