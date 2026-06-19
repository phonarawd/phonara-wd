/**
 * Momentum · Controls.desktop — right-rail card panel.
 * AutoSlot G#11 mounted on the 1280 viewport via autoSlot prop.
 */
import { BetModeTabs } from "@/games/shared/BetModeTabs";
import {
  MomentumBetPanelInner,
  useMomentumOnPrimary,
  type MomentumControlsProps,
} from "./Controls.shared";
import { MomentumAutoSlot } from "./MomentumAutoSlot";

export function ControlsDesktop(p: MomentumControlsProps) {
  const { onAutoFire, policy, setPolicy } = useMomentumOnPrimary(p);
  const manual = <MomentumBetPanelInner p={p} primarySize="xl" />;

  return (
    <div data-testid="casino-controls">
      <div
        data-game-id="momentum-panel-desktop"
        className="rounded-2xl border border-border bg-(--color-surface-elev) p-4 lg:sticky lg:top-4 lg:self-start"
      >
        <div data-game-id="momentum-mode-tabs">
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
              <MomentumAutoSlot policy={policy} onPolicyChange={setPolicy} />
            }
          />
        </div>
      </div>
    </div>
  );
}
