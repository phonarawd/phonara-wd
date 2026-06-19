/**
 * Gold Rush · Controls (shared impl) — P2.10 v0.4 REFACTOR (Slice 10/10).
 *
 * Named exports compose into Controls.mobile / Controls.desktop.
 * Legacy `GoldRushControlsShared` retained (composes new parts) for
 * auto.wiring test back-compat.
 *
 * INVARIANTS:
 *  - Instant-settle → NO fireDelayMs override (default 320ms).
 *  - selection: `{ lines: number }` ONLY (1..20 integer clamp). `turbo` UI-only.
 *  - BetPanel/BetModeTabs FROZEN. No Korean JSX (i18n keys).
 *  - RG gate on primary ready path → onOpenBetConfirm.
 */
import { useState, type ReactNode } from "react";
import { Zap, ZapOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { BetPanel } from "../shared/BetPanel";
import { BetModeTabs } from "../shared/BetModeTabs";
import { useRGGate } from "../shared/RGGateProvider";
import { t } from "@/i18n";
import type { ImportedGameSurfaceProps } from "../shared/types";

export type GoldRushControlsProps = ImportedGameSurfaceProps<"gold_rush">;

const LINE_PRESETS = [1, 5, 10, 15, 20] as const;

/** §8-B LOCK: lines ∈ [1, 20] integer. */
function clampLines(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(20, Math.floor(n)));
}

/** Primary/auto handlers + selection helpers — single source of truth. */
export function useGoldRushOnPrimary(p: GoldRushControlsProps) {
  const ready = Boolean(p.commitment);
  const rg = useRGGate();

  const onPrimary = ready
    ? async () => {
        const ok = await rg.gate("place_bet");
        if (!ok) return;
        p.onOpenBetConfirm();
      }
    : p.onPrepareRound;

  const onAutoFire = async () => {
    if (!p.commitment) await p.onPrepareRound();
    if (!p.commitment) return;
    p.onOpenBetConfirm();
    await p.onSubmitBet();
  };

  const setLines = (n: number) =>
    p.onSelectionChange({ lines: clampLines(n) });

  const primaryLabel = ready
    ? t("games.goldrush.dig")
    : t("games.goldrush.prepare");
  const secondaryLabel = t("games.goldrush.hashCommit");

  return {
    onPrimary,
    onAutoFire,
    ready,
    primaryLabel,
    secondaryLabel,
    lines: p.selection.lines,
    setLines,
  };
}

/** Lines preset grid + turbo toggle. turbo is local UI-only (never in payload). */
export function GoldRushSelectionUI({ p }: { p: GoldRushControlsProps }) {
  const { lines, setLines } = useGoldRushOnPrimary(p);
  const [turbo, setTurbo] = useState(false);

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{t("games.goldrush.lines")}</span>
        <span className="font-mono tabular-nums text-amber-300">{lines}</span>
      </div>
      <div data-game-id="goldrush-lines" className="grid grid-cols-5 gap-1">
        {LINE_PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setLines(n)}
            className={cn(
              "min-h-9 rounded-md border text-xs font-semibold tabular-nums",
              "transition-[box-shadow,border-color,transform] duration-150",
              lines === n
                ? "border-amber-400 bg-amber-500/15 text-amber-200 ring-2 ring-amber-300/70 shadow-[0_0_12px_rgba(251,191,36,.30)] scale-[1.03]"
                : "border-border bg-(--color-surface) text-muted-foreground hover:text-foreground",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      {/* Display-only 20-dot mini-scale (presentation, no clicks). */}
      <div
        role="presentation"
        aria-hidden
        className="mt-1 flex items-center justify-between gap-[2px]"
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full",
              i < lines ? "bg-amber-400/80" : "bg-amber-100/10",
            )}
          />
        ))}
      </div>

      <button
        type="button"
        data-game-id="goldrush-turbo"
        onClick={() => setTurbo((v) => !v)}
        aria-pressed={turbo}
        className={cn(
          "mt-1 flex min-h-9 items-center justify-center gap-2 rounded-md border text-xs font-semibold transition-colors",
          turbo
            ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
            : "border-border bg-(--color-surface) text-muted-foreground",
        )}
      >
        {turbo ? <Zap className="size-3.5" /> : <ZapOff className="size-3.5" />}
        {turbo ? t("games.goldrush.turboOn") : t("games.goldrush.turboOff")}
      </button>
    </div>
  );
}

/** BetPanel wrapper — owns goldrush-cta + chip-row + hash-btn markers. */
export function GoldRushBetPanelInner({
  p,
  primarySize = "xl",
  children,
}: {
  p: GoldRushControlsProps;
  primarySize?: "default" | "xl";
  children?: ReactNode;
}) {
  const { onPrimary, ready, primaryLabel, secondaryLabel } =
    useGoldRushOnPrimary(p);
  return (
    <div data-game-id="goldrush-cta">
      <span hidden data-game-id="goldrush-hash-btn" />
      <div data-game-id="goldrush-chip-row">
        <BetPanel
          stake={p.stake}
          currency={p.currency}
          availableBalance={p.availableBalance}
          busy={p.busy}
          ready={ready}
          primarySize={primarySize}
          primaryLabel={primaryLabel}
          secondaryLabel={secondaryLabel}
          onStakeChange={p.onStakeChange}
          onCurrencyChange={p.onCurrencyChange}
          onPrimary={onPrimary}
          onSecondary={p.onPrepareRound}
        >
          {children ?? <GoldRushSelectionUI p={p} />}
        </BetPanel>
      </div>
    </div>
  );
}

/** Legacy composed wrapper — kept for existing test/import paths. */
export function GoldRushControlsShared(p: GoldRushControlsProps) {
  const { onAutoFire } = useGoldRushOnPrimary(p);
  const manual = <GoldRushBetPanelInner p={p} primarySize="default" />;
  return (
    <div data-testid="casino-controls">
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
  );
}
