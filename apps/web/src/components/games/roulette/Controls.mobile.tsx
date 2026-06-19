/**
 * Roulette · Controls.mobile — sticky-bottom thumb-zone panel (P2.7 v0.4).
 *
 * Casino-only. Composes refactored shared parts (NOT wrapper-only).
 * `casino-prepare-hash` reachable on mobile via BetPanel. Primary CTA reaches
 * min-h-14 via `primarySize="xl"`. Instant-settle → no fireDelay (320ms).
 */
import { t } from "@/i18n";
import { BetModeTabs } from "../shared/BetModeTabs";
import {
  RouletteBetPanelInner,
  RouletteBoard,
  useRouletteOnPrimary,
  type RouletteControlsProps,
} from "./Controls.shared";

export function ControlsMobile(p: RouletteControlsProps) {
  const { onAutoFire, noBets } = useRouletteOnPrimary(p);
  const manual = <RouletteBetPanelInner p={p} primarySize="xl" />;

  return (
    <div data-testid="casino-controls" className="grid gap-3">
      <RouletteBoard p={p} />
      <div
        aria-hidden
        className="h-[320px]"
        data-game-id="roulette-panel-mobile-spacer"
      />
      <div
        data-game-id="roulette-panel-mobile"
        className="fixed inset-x-0 bottom-0 z-40 max-h-[82vh] min-h-14 overflow-y-auto border-t border-border bg-(--color-surface-elev)/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-(--color-surface-elev)/85"
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
