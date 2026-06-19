/**
 * Momentum · Controls.mobile — sticky-bottom thumb-zone panel.
 * AutoSlot G#11 mounted on the 390 viewport via autoSlot prop.
 */
import { BetModeTabs } from "@/games/shared/BetModeTabs";
import {
  MomentumBetPanelInner,
  useMomentumOnPrimary,
  type MomentumControlsProps,
} from "./Controls.shared";
import { MomentumAutoSlot } from "./MomentumAutoSlot";

export function ControlsMobile(p: MomentumControlsProps) {
  const { onAutoFire, policy, setPolicy } = useMomentumOnPrimary(p);
  const manual = <MomentumBetPanelInner p={p} primarySize="xl" />;

  return (
    <div data-testid="casino-controls">
      <div
        aria-hidden
        className="h-[320px]"
        data-game-id="momentum-panel-mobile-spacer"
      />
      <div
        data-game-id="momentum-panel-mobile"
        className="fixed inset-x-0 bottom-0 z-40 max-h-[82vh] min-h-14 overflow-y-auto border-t border-border bg-(--color-surface-elev)/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-(--color-surface-elev)/85"
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
