/**
 * Roulette · Controls.desktop — right-rail card panel (P2.7 v0.4).
 *
 * Casino-only. Composes refactored shared parts inside a rounded-2xl border
 * card (NOT wrapper-only). Instant-settle → no fireDelay override (320ms).
 */
import { t } from "@/i18n";
import { BetModeTabs } from "../shared/BetModeTabs";
import {
  RouletteBetPanelInner,
  RouletteBoard,
  useRouletteOnPrimary,
  type RouletteControlsProps,
} from "./Controls.shared";

export function ControlsDesktop(p: RouletteControlsProps) {
  const { onAutoFire, noBets } = useRouletteOnPrimary(p);
  const manual = <RouletteBetPanelInner p={p} primarySize="xl" />;

  return (
    <div data-testid="casino-controls" className="grid gap-3">
      <RouletteBoard p={p} />
      <div
        data-game-id="roulette-panel-desktop"
        className="rounded-2xl border border-border bg-(--color-surface-elev) p-4 lg:sticky lg:top-4 lg:self-start"
      >
        <div data-game-id="roulette-mode-tabs">
          <BetModeTabs
            manual={manual}
            baseStake={p.stake}
            currency={p.currency}
            commitment={p.commitment}
            busy={p.busy}
            bet={p.bet}
            availableBalance={p.availableBalance}
            onAutoFire={onAutoFire}
            startDisabledReason={
              noBets ? t("casino.auto.needSelection.roulette") : null
            }
          />
        </div>
      </div>
    </div>
  );
}
