/**
 * Deepshaft · Controls.desktop — right-rail card panel.
 * AutoSlot D10 mounted on the 1280 viewport via autoChildren.
 */
import { BetModeTabs } from "../shared/BetModeTabs";
import {
  DeepshaftBetPanelInner,
  useDeepshaftOnPrimary,
  type DeepshaftControlsProps,
} from "./Controls.shared";
import { DeepshaftAutoSlot } from "./DeepshaftAutoSlot";

export function ControlsDesktop(p: DeepshaftControlsProps) {
  const { onAutoFire, riskTier, setRiskTier, targetDepth, setTargetDepth } =
    useDeepshaftOnPrimary(p);
  const manual = <DeepshaftBetPanelInner p={p} primarySize="xl" />;

  return (
    <div data-testid="casino-controls">
      <div
        data-game-id="deepshaft-panel-desktop"
        className="rounded-2xl border border-border bg-(--color-surface-elev) p-4 lg:sticky lg:top-4 lg:self-start"
      >
        <div data-game-id="deepshaft-mode-tabs">
          <BetModeTabs
            manual={manual}
            baseStake={p.stake}
            currency={p.currency}
            commitment={p.commitment}
            busy={p.busy}
            bet={p.bet}
            availableBalance={p.availableBalance}
            onAutoFire={onAutoFire}
            autoChildren={
              <DeepshaftAutoSlot
                riskTier={riskTier}
                onRiskTierChange={setRiskTier}
                targetDepth={targetDepth}
                onTargetDepthChange={setTargetDepth}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
