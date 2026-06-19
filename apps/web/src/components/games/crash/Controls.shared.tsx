/**
 * Crash · Controls (shared impl) — P2.1 v0.3 REFACTOR.
 *
 * Named exports are composable parts consumed by Controls.mobile and
 * Controls.desktop. Legacy `CrashControlsShared` is kept (now composes
 * the new parts) so existing vitest suites stay green.
 *
 * INVARIANTS:
 *  - No client-known `crashAt` cashout decision wired here.
 *  - No new round clock invented.
 *  - BetPanel is FROZEN — chip-row + hash-btn markers ride the
 *    wrapper around BetPanel (marker-on-container).
 *  - No edits to shared `useAutoBetQueue` / `AutoBetPanel`.
 */
import type { ReactNode } from "react";
import { Rocket, TrendingUp } from "lucide-react";
import { t } from "@/i18n";
import { BetPanel } from "../shared/BetPanel";

import { useRGGate } from "../shared/RGGateProvider";
import type { CrashSelection, ImportedGameSurfaceProps } from "../shared/types";
import { CrashAutoCountdown } from "./CrashAutoCountdown";

export type CrashControlsProps = ImportedGameSurfaceProps<"crash">;

/** Stake-class inter-round betting window (~5s). */
export const CRASH_AUTO_FIRE_DELAY_MS = 5000;

/** Crash countdown renderer wired into AutoBetPanel via BetModeTabs. */
export const crashAutoCountdownSlot = (secondsRemaining: number) => (
  <CrashAutoCountdown seconds={secondsRemaining} />
);

/** Primary/auto handlers + ready flag — single source of truth. */
export function useCrashOnPrimary(p: CrashControlsProps) {
  const ready = Boolean(p.commitment);
  const rg = useRGGate();

  const onPrimary = ready
    ? async () => {
        const ok = await rg.gate("place_bet");
        if (!ok) return;
        p.onOpenBetConfirm();
      }
    : p.onPrepareRound;

  // A6 LOCK wrapper for auto-bet: prepare-if-needed → submit.
  const onAutoFire = async () => {
    if (!p.commitment) {
      await p.onPrepareRound();
    }
    p.onOpenBetConfirm();
    await p.onSubmitBet();
  };

  return { onPrimary, onAutoFire, ready };
}

/** Auto-cashout target input (≥ 1.01×). */
export function CrashAutoCashoutField({ p }: { p: CrashControlsProps }) {
  return (
    <div className="grid gap-1" data-game-id="crash-auto-input">
      <label
        htmlFor="auto"
        className="flex items-baseline justify-between text-[11px] uppercase tracking-wider text-muted-foreground"
      >
        <span className="flex items-center gap-1">
          <TrendingUp className="size-3" /> {t("games.crash.autoCashout")}
        </span>
        <span className="tabular-nums">≥ 1.01×</span>
      </label>
      <div className="flex items-center gap-1">
        <input
          id="auto"
          inputMode="decimal"
          value={p.selection.autoCashout}
          onChange={(e) =>
            p.onSelectionChange({
              autoCashout: e.target.value.replace(/[^\d.]/g, "").slice(0, 8),
            } as CrashSelection)
          }
          className="min-h-10 w-full rounded-md border border-border bg-(--color-surface) px-3 text-right font-mono text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
        />
        <span className="px-1 text-sm font-bold text-muted-foreground">×</span>
        <Rocket className="size-4 text-(--color-primary)" />
      </div>
    </div>
  );
}

/**
 * UX-1 morphing CTA companion — declares the auto-cashout target.
 *
 * 4-state machine (engine field mirror · invent 0):
 *   armed   → commitment && !busy && !bet
 *   pending → busy
 *   success → bet.result.cashedOut === true && cashoutMultiplier >= 1.01
 *   miss    → !success && bet has a settled result (crashMultiplier present)
 *
 * `crashed` here is INFERRED from existing engine result props only —
 * no new round phase invented, no FROZEN file body touch. All visuals
 * via data-cta-state + cached semantic skin tokens (`text-skin-*`).
 */
export function CrashCashoutSlot({ p }: { p: CrashControlsProps }) {
  const result = (p.bet?.result ?? {}) as {
    cashedOut?: boolean;
    cashoutMultiplier?: number | string;
    crashMultiplier?: number | string;
  };
  const hasResult =
    Number.isFinite(Number(result.crashMultiplier)) &&
    Number(result.crashMultiplier) > 0;
  const cashedOut = result.cashedOut === true;
  const cashoutMultiplier = Number(result.cashoutMultiplier ?? 0);
  const success = cashedOut && cashoutMultiplier >= 1.01;
  const miss = hasResult && !success;

  const state: "armed" | "pending" | "success" | "miss" | "idle" = p.busy
    ? "pending"
    : success
      ? "success"
      : miss
        ? "miss"
        : p.commitment
          ? "armed"
          : "idle";

  const tone =
    state === "success"
      ? "border-skin-success/60 bg-skin-success/15 text-skin-success"
      : state === "miss"
        ? "border-skin-danger/60 bg-skin-danger/15 text-skin-danger"
        : state === "pending"
          ? "border-(--color-primary)/50 bg-(--color-primary)/10 text-(--color-primary) animate-pulse"
          : state === "armed"
            ? "border-(--color-primary)/40 bg-(--color-primary)/5 text-foreground"
            : "border-dashed border-border bg-(--color-surface)/60 text-muted-foreground";

  const label =
    state === "success"
      ? t("casino.crash.autoAt", { mult: cashoutMultiplier.toFixed(2) })
      : state === "miss"
        ? t("casino.crash.crashed")
        : t("casino.crash.autoAt", { mult: p.selection.autoCashout });

  return (
    <button
      type="button"
      data-testid="casino-cashout"
      data-cta-mode="auto"
      data-cta-state={state}
      data-game-id="crash-cashout-slot"
      disabled
      aria-disabled="true"
      aria-live="polite"
      className={`min-h-12 w-full rounded-xl border text-sm font-semibold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-90 ${tone}`}
    >
      {label}
    </button>
  );
}

/** BetPanel wrapper — owns crash-cta + crash-chip-row + crash-hash-btn markers (BetPanel FROZEN). */
export function CrashBetPanelInner({
  p,
  primarySize = "xl",
  children,
}: {
  p: CrashControlsProps;
  primarySize?: "default" | "xl";
  children?: ReactNode;
}) {
  const { onPrimary, ready } = useCrashOnPrimary(p);
  return (
    <div data-game-id="crash-cta">
      <span hidden data-game-id="crash-hash-btn" />
      <div data-game-id="crash-chip-row">
        <BetPanel
          stake={p.stake}
          currency={p.currency}
          availableBalance={p.availableBalance}
          busy={p.busy}
          ready={ready}
          primarySize={primarySize}
          primaryLabel={ready ? t("games.crash.placeBet", { mult: p.selection.autoCashout }) : t("games.crash.prepare")}
          secondaryLabel={t("casino.action.hash_commit")}
          onStakeChange={p.onStakeChange}
          onCurrencyChange={p.onCurrencyChange}
          onPrimary={onPrimary}
          onSecondary={p.onPrepareRound}
        >
          {children}
        </BetPanel>
      </div>
    </div>
  );
}

