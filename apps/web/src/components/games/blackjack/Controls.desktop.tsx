/**
 * Blackjack · Controls.desktop — right-rail card panel (P2.8 v0.4).
 *
 * Composes refactored shared parts inside a rounded-2xl border card
 * (NOT wrapper-only). Instant-settle → no fireDelay override (320ms).
 */
import { t } from "@/i18n";
import { BetModeTabs } from "../shared/BetModeTabs";
import {
  BlackjackBetPanelInner,
  useBlackjackOnPrimary,
  type BlackjackControlsProps,
} from "./Controls.shared";

export function ControlsDesktop(p: BlackjackControlsProps) {
  const { onAutoFire } = useBlackjackOnPrimary(p);
  const manual = <BlackjackBetPanelInner p={p} primarySize="xl" />;

  return (
    <div data-testid="casino-controls">
      <div
        data-game-id="blackjack-panel-desktop"
        className="rounded-2xl border border-border bg-(--color-surface-elev) p-4 lg:sticky lg:top-4 lg:self-start"
      >
        <div data-game-id="blackjack-mode-tabs">
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
              <p className="text-[10px] leading-snug text-muted-foreground">
                {t("casino.auto.needSelection.blackjack")}
              </p>
            }
          />
        </div>
      </div>
    </div>
  );
}
