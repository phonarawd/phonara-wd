/**
 * Limbo · Controls.mobile — sticky-bottom thumb-zone panel (P2.3 v0.4).
 *
 * Composes refactored shared parts (NOT wrapper-only). Manual tab body
 * hosts `casino-prepare-hash` (BetPanel secondary slot) reachable on
 * mobile. Primary CTA reaches min-h-14 via `primarySize="xl"`.
 * Instant-settle game → no auto fireDelay override (320ms default).
 */
import { BetModeTabs } from "../shared/BetModeTabs";
import {
  LimboBetPanelInner,
  useLimboOnPrimary,
  type LimboControlsProps,
} from "./Controls.shared";
import { LimboAutoSlot } from "./LimboAutoSlot";

export function ControlsMobile(p: LimboControlsProps) {
  const { onAutoFire } = useLimboOnPrimary(p);
  const manual = <LimboBetPanelInner p={p} primarySize="xl" />;

  return (
    <>
      <div
        aria-hidden
        className="h-[360px]"
        data-game-id="limbo-panel-mobile-spacer"
      />
      <div
        data-game-id="limbo-panel-mobile"
        className="fixed inset-x-0 bottom-0 z-40 max-h-[82vh] min-h-14 overflow-y-auto border-t border-border bg-(--color-surface-elev)/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-(--color-surface-elev)/85"
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
    </>
  );
}
