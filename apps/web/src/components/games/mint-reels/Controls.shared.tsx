/**
 * Mint Reels · Controls (shared impl) — P2.9 v0.4 REFACTOR.
 *
 * Named exports compose into Controls.mobile / Controls.desktop.
 * Legacy `MintReelsControlsShared` retained (composes new parts) for
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

export type MintReelsControlsProps = ImportedGameSurfaceProps<"mint_reels">;

const LINE_PRESETS = [1, 5, 10, 15, 20] as const;

/** §8-B LOCK: lines ∈ [1, 20] integer. */
function clampLines(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(20, Math.floor(n)));
}

/** Primary/auto handlers + selection helpers — single source of truth. */
export function useMintReelsOnPrimary(p: MintReelsControlsProps) {
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
    ? t("games.mintreels.spin")
    : t("games.mintreels.prepare");
  const secondaryLabel = t("games.mintreels.hashCommit");

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
export function MintReelsSelectionUI({ p }: { p: MintReelsControlsProps }) {
  const { lines, setLines } = useMintReelsOnPrimary(p);
  const [turbo, setTurbo] = useState(false);

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{t("games.mintreels.lines")}</span>
        <span className="font-mono tabular-nums text-teal-300">{lines}</span>
      </div>
      <div data-game-id="mintreels-lines" className="grid grid-cols-5 gap-1">
        {LINE_PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setLines(n)}
            className={cn(
              "min-h-9 rounded-md border text-xs font-semibold tabular-nums transition-colors",
              lines === n
                ? "border-teal-400 bg-teal-500/15 text-teal-200 ring-2 ring-teal-300/70 shadow-[0_0_12px_rgba(94,234,212,0.25)]"
                : "border-border bg-(--color-surface) text-muted-foreground hover:text-foreground",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      {/* Display-only mini scale: 20 dots, filled up to `lines`. No click handlers. */}
      <div
        role="presentation"
        aria-hidden
        className="flex items-center justify-between gap-[2px] px-0.5"
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < lines ? "bg-teal-400/70" : "bg-teal-500/15",
            )}
          />
        ))}
      </div>

      <button
        type="button"
        data-game-id="mintreels-turbo"
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
        {turbo ? t("games.mintreels.turboOn") : t("games.mintreels.turboOff")}
      </button>
    </div>
  );
}

/** BetPanel wrapper — owns mintreels-cta + chip-row + hash-btn markers. */
export function MintReelsBetPanelInner({
  p,
  primarySize = "xl",
  children,
}: {
  p: MintReelsControlsProps;
  primarySize?: "default" | "xl";
  children?: ReactNode;
}) {
  const { onPrimary, ready, primaryLabel, secondaryLabel } =
    useMintReelsOnPrimary(p);
  return (
    <div data-game-id="mintreels-cta">
      <span hidden data-game-id="mintreels-hash-btn" />
      <div data-game-id="mintreels-chip-row">
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
          {children ?? <MintReelsSelectionUI p={p} />}
        </BetPanel>
      </div>
    </div>
  );
}

/**
 * Legacy composed wrapper — kept for existing test/import paths.
 *
 * Path B (AutoSlot mirror): lines re-fires committed selection; per-fire input = zero.
 * AutoSlot wrapper adds no value. auto.wiring.test.tsx guards re-fire correctness.
 */
export function MintReelsControlsShared(p: MintReelsControlsProps) {
  const { onAutoFire } = useMintReelsOnPrimary(p);
  const manual = <MintReelsBetPanelInner p={p} primarySize="default" />;
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
