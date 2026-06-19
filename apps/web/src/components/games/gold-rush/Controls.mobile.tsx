/**
 * Gold Rush · Controls.mobile — sticky-bottom thumb-zone panel (P2.10 v0.4).
 *
 * Composes refactored shared parts (NOT wrapper-only). `casino-prepare-hash`
 * reachable via BetPanel. Primary CTA reaches min-h-14 via `primarySize="xl"`.
 * Instant-settle → no fireDelay (320ms).
 */
import { BetModeTabs } from "../shared/BetModeTabs";
import {
  GoldRushBetPanelInner,
  useGoldRushOnPrimary,
  type GoldRushControlsProps,
} from "./Controls.shared";

export function ControlsMobile(p: GoldRushControlsProps) {
  const { onAutoFire } = useGoldRushOnPrimary(p);
  const manual = <GoldRushBetPanelInner p={p} primarySize="xl" />;

  return (
    <div data-testid="casino-controls">
      <div
        aria-hidden
        className="h-[320px]"
        data-game-id="goldrush-panel-mobile-spacer"
      />
      <div
        data-game-id="goldrush-panel-mobile"
        className="fixed inset-x-0 bottom-0 z-40 max-h-[82vh] min-h-14 overflow-y-auto border-t border-border bg-(--color-surface-elev)/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-(--color-surface-elev)/85"
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
