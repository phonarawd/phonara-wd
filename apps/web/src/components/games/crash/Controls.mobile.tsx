/**
 * Crash · Controls.mobile — sticky-bottom thumb-zone panel (P2.1 v0.3).
 *
 * Composes refactored shared parts (NOT wrapper-only). Manual tab body
 * hosts `casino-prepare-hash` (BetPanel secondary slot) reachable on
 * mobile (G4b invariant). Primary CTA reaches min-h-14 via the
 * CrashBetPanelInner card wrapper.
 *
 * Logic 0-touch: BetPanel / BetModeTabs / RGGate sequence unchanged.
 */
import { BetModeTabs } from "../shared/BetModeTabs";
import {
  CRASH_AUTO_FIRE_DELAY_MS,
  CrashAutoCashoutField,
  CrashBetPanelInner,
  CrashCashoutSlot,
  crashAutoCountdownSlot,
  useCrashOnPrimary,
  type CrashControlsProps,
} from "./Controls.shared";
import { CrashAutoSlot } from "./CrashAutoSlot";
import type { CrashSelection } from "../shared/types";

export function ControlsMobile(p: CrashControlsProps) {
  const { onAutoFire } = useCrashOnPrimary(p);
  const auto = <CrashAutoCashoutField p={p} />;

  const manual = (
    <div className="grid gap-3">
      <CrashBetPanelInner p={p} primarySize="xl">
        {auto}
      </CrashBetPanelInner>
      <CrashCashoutSlot p={p} />
    </div>
  );

  const autoSlot = (
    <CrashAutoSlot
      autoCashout={p.selection.autoCashout}
      onAutoCashoutChange={(v) =>
        p.onSelectionChange({ autoCashout: v } as CrashSelection)
      }
    />
  );

  return (
    <>
      <div
        aria-hidden
        className="h-[420px]"
        data-game-id="crash-panel-mobile-spacer"
      />
      <div
        data-game-id="crash-panel-mobile"
        className="fixed inset-x-0 bottom-0 z-40 max-h-[82vh] min-h-14 overflow-y-auto border-t border-border bg-(--color-surface-elev)/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-(--color-surface-elev)/85"
      >
        <div data-game-id="crash-mode-tabs">
          <BetModeTabs
            manual={manual}
            baseStake={p.stake}
            currency={p.currency}
            commitment={p.commitment}
            busy={p.busy}
            bet={p.bet}
            onAutoFire={onAutoFire}
            autoSlot={autoSlot}
            autoFireDelayMs={CRASH_AUTO_FIRE_DELAY_MS}
            autoCountdownSlot={crashAutoCountdownSlot}
          />
        </div>
      </div>
    </>
  );
}
