/**
 * HiLo · Controls.mobile — sticky-bottom thumb-zone panel (P2.6 v0.4).
 *
 * Composes refactored shared parts (NOT wrapper-only). Manual tab body
 * hosts `casino-prepare-hash` reachable on mobile. Primary CTA reaches
 * min-h-14 via `primarySize="xl"`. Instant-settle → no fireDelay (320ms).
 */
import { t } from "@/i18n";
import { BetModeTabs } from "../shared/BetModeTabs";
import {
  HiloBetPanelInner,
  useHiloOnPrimary,
  type HiloControlsProps,
} from "./Controls.shared";

export function ControlsMobile(p: HiloControlsProps) {
  const { onAutoFire, noGuess } = useHiloOnPrimary(p);
  const manual = <HiloBetPanelInner p={p} primarySize="xl" />;

  return (
    <>
      <div
        aria-hidden
        className="h-[360px]"
        data-game-id="hilo-panel-mobile-spacer"
      />
      <div
        data-game-id="hilo-panel-mobile"
        className="fixed inset-x-0 bottom-0 z-40 max-h-[82vh] min-h-14 overflow-y-auto border-t border-border bg-(--color-surface-elev)/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-(--color-surface-elev)/85"
      >
        <div data-game-id="hilo-mode-tabs">
          <BetModeTabs
            manual={manual}
            baseStake={p.stake}
            currency={p.currency}
            commitment={p.commitment}
            busy={p.busy}
            bet={p.bet}
            availableBalance={p.availableBalance}
            onAutoFire={onAutoFire}
            startDisabledReason={noGuess ? t("casino.auto.needSelection.hilo") : null}
          />
        </div>
      </div>
    </>
  );
}
