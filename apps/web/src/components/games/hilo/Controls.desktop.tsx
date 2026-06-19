/**
 * HiLo · Controls.desktop — right-rail card panel (P2.6 v0.4).
 *
 * Composes refactored shared parts inside a rounded-2xl border card
 * (NOT wrapper-only). Instant-settle → no fireDelay override (320ms).
 */
import { t } from "@/i18n";
import { BetModeTabs } from "../shared/BetModeTabs";
import {
  HiloBetPanelInner,
  useHiloOnPrimary,
  type HiloControlsProps,
} from "./Controls.shared";

export function ControlsDesktop(p: HiloControlsProps) {
  const { onAutoFire, noGuess } = useHiloOnPrimary(p);
  const manual = <HiloBetPanelInner p={p} primarySize="xl" />;

  return (
    <div
      data-game-id="hilo-panel-desktop"
      className="rounded-2xl border border-border bg-(--color-surface-elev) p-4 lg:sticky lg:top-4 lg:self-start"
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
  );
}
