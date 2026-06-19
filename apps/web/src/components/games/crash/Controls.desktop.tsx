/**
 * Crash · Controls.desktop — right-rail card panel (P2.1 v0.3).
 *
 * Composes refactored shared parts inside a rounded-2xl border card
 * (NOT wrapper-only). index.tsx grid (`md:grid-cols-[1fr_320px]`)
 * places this in the right column; sticky offset rides the viewport
 * on tall stages.
 *
 * Logic 0-touch: shared CTA / RG gate / testid owners preserved.
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

export function ControlsDesktop(p: CrashControlsProps) {
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
    <div
      data-game-id="crash-panel-desktop"
      className="rounded-2xl border border-border bg-(--color-surface-elev) p-4 lg:sticky lg:top-4 lg:self-start"
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
  );
}
