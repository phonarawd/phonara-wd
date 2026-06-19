/**
 * Deepshaft · Controls.mobile — sticky-bottom thumb-zone panel.
 * AutoSlot D10 mounted on the 390 viewport via autoChildren.
 */
import { BetModeTabs } from "../shared/BetModeTabs";
import {
  DeepshaftBetPanelInner,
  useDeepshaftOnPrimary,
  type DeepshaftControlsProps,
} from "./Controls.shared";
import { DeepshaftAutoSlot } from "./DeepshaftAutoSlot";

export function ControlsMobile(p: DeepshaftControlsProps) {
  const { onAutoFire, riskTier, setRiskTier, targetDepth, setTargetDepth } =
    useDeepshaftOnPrimary(p);
  const manual = <DeepshaftBetPanelInner p={p} primarySize="xl" />;

  return (
    <div data-testid="casino-controls">
      <div
        aria-hidden
        className="h-[320px]"
        data-game-id="deepshaft-panel-mobile-spacer"
      />
      <div
        data-game-id="deepshaft-panel-mobile"
        className="fixed inset-x-0 bottom-0 z-40 max-h-[82vh] min-h-14 overflow-y-auto border-t border-border bg-(--color-surface-elev)/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-(--color-surface-elev)/85"
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
