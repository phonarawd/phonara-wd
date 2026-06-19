/**
 * Mines · Controls (shared impl) — P2.4 v0.4 REFACTOR + autobet slot.
 *
 * Named exports compose into Controls.mobile / Controls.desktop.
 * Legacy `MinesControlsShared` retained.
 *
 * Auto slot (`AutoSlotProps<"mines">`):
 *  - `mineCount` mirrors `selection.mineCount` (single source of truth).
 *  - `revealCount` is auto-only state lifted here (default 3, clamped to
 *    1..(25-mineCount)).
 *  - `onAutoFire` pre-populates `selection.revealedCells = [0..N-1]`
 *    before prepare → submit; engine is one-shot, EV-equivalent regardless
 *    of which indices are picked, so first-N is the intentional default.
 *
 * INVARIANTS:
 *  - Instant-settle game → no fireDelayMs override (default 320ms).
 *  - BetPanel/BetModeTabs FROZEN → markers ride wrapper containers.
 *  - i18n keys for primary/secondary/disabled labels.
 *  - selection schema unchanged: { mineCount, revealedCells }.
 */
import { useCallback, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { BetPanel } from "../shared/BetPanel";
import { BetModeTabs } from "../shared/BetModeTabs";
import { useRGGate } from "../shared/RGGateProvider";
import type { ImportedGameSurfaceProps, MinesSelection } from "../shared/types";
import { MinesAutoSlot } from "./MinesAutoSlot";

export type MinesControlsProps = ImportedGameSurfaceProps<"mines">;

const GRID = 25;
const DEFAULT_AUTO_REVEAL = 3;

/** Primary/auto handlers + setMines + auto-only revealCount. */
export function useMinesOnPrimary(p: MinesControlsProps) {
  const sel = p.selection;
  const revealed = sel.revealedCells ?? [];
  const ready = Boolean(p.commitment);
  const settled = Boolean(p.bet);
  const rg = useRGGate();

  const [revealCount, setRevealCountRaw] = useState<number>(DEFAULT_AUTO_REVEAL);
  const maxReveal = Math.max(1, GRID - sel.mineCount);
  const clampedReveal = Math.min(Math.max(1, revealCount), maxReveal);
  const setRevealCount = useCallback(
    (n: number) => {
      const v = Number.isFinite(n) ? Math.floor(n) : DEFAULT_AUTO_REVEAL;
      setRevealCountRaw(Math.min(Math.max(1, v), Math.max(1, GRID - sel.mineCount)));
    },
    [sel.mineCount],
  );

  const setMines = (m: number) => {
    p.onSelectionChange({
      mineCount: Math.max(1, Math.min(24, m)),
      revealedCells: [],
    } as MinesSelection);
  };

  const onPrimary =
    ready && revealed.length > 0
      ? async () => {
          const ok = await rg.gate("place_bet");
          if (!ok) return;
          p.onOpenBetConfirm();
        }
      : p.onPrepareRound;

  // Manual onAutoFire fallback (legacy MinesControlsShared) — kept for the
  // pre-slot wrapper; new desktop/mobile controls route through onAutoFireSlot
  // below to pick up the slot's revealCount.
  const onAutoFire = async () => {
    if (revealed.length === 0) {
      throw new Error(t("casino.auto.needSelection.mines"));
    }
    if (!p.commitment) await p.onPrepareRound();
    if (!p.commitment) return;
    p.onOpenBetConfirm();
    await p.onSubmitBet();
  };

  /** Auto-fire used by the typed slot: builds revealedCells = [0..N-1]. */
  const onAutoFireSlot = useCallback(async () => {
    const indices = Array.from({ length: clampedReveal }, (_, i) => i);
    p.onSelectionChange({
      mineCount: sel.mineCount,
      revealedCells: indices,
    } as MinesSelection);
    if (!p.commitment) await p.onPrepareRound();
    if (!p.commitment) return;
    p.onOpenBetConfirm();
    await p.onSubmitBet();
  }, [clampedReveal, p, sel.mineCount]);

  return {
    onPrimary,
    onAutoFire,
    onAutoFireSlot,
    ready,
    settled,
    revealed,
    setMines,
    mineCount: sel.mineCount,
    revealCount: clampedReveal,
    setRevealCount,
  };
}

/** Mine count selector — owns mines-count-selector marker. */
export function MinesCountSelector({
  mineCount,
  settled,
  onSet,
}: {
  mineCount: number;
  settled: boolean;
  onSet: (m: number) => void;
}) {
  return (
    <div data-game-id="mines-count-selector">
      <div className="mb-1 flex items-baseline justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{t("games.mines.count")}</span>
        <span className="tabular-nums">{mineCount}</span>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {[1, 3, 5, 10, 15, 24].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onSet(m)}
            disabled={settled}
            className={cn(
              "min-h-9 rounded-md border text-xs font-semibold tabular-nums",
              mineCount === m
                ? "border-(--color-primary) bg-(--color-primary)/15 text-(--color-primary)"
                : "border-border bg-(--color-surface) text-muted-foreground hover:text-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

/** BetPanel wrapper — owns mines-cta + mines-chip-row + mines-hash-btn markers. */
export function MinesBetPanelInner({
  p,
  primarySize = "xl",
  children,
}: {
  p: MinesControlsProps;
  primarySize?: "default" | "xl";
  children?: ReactNode;
}) {
  const { onPrimary, ready, revealed } = useMinesOnPrimary(p);
  const n = revealed.length;
  const primaryLabel =
    n === 0
      ? t("games.mines.tileFirst")
      : ready
        ? t("games.mines.cashoutN", { n })
        : t("games.mines.prepare");

  return (
    <div data-game-id="mines-cta">
      <span hidden data-game-id="mines-hash-btn" />
      <div data-game-id="mines-chip-row">
        <BetPanel
          stake={p.stake}
          currency={p.currency}
          availableBalance={p.availableBalance}
          busy={p.busy}
          ready={ready}
          primarySize={primarySize}
          primaryLabel={primaryLabel}
          secondaryLabel={t("games.mines.hashCommit")}
          onStakeChange={p.onStakeChange}
          onCurrencyChange={p.onCurrencyChange}
          onPrimary={onPrimary}
          onSecondary={p.onPrepareRound}
          disabledReason={ready && n === 0 ? t("games.mines.tilePrompt") : null}
        >
          {children}
        </BetPanel>
      </div>
    </div>
  );
}

/** Render helper for the typed auto-slot — used by desktop/mobile controls. */
export function makeMinesAutoSlot(api: ReturnType<typeof useMinesOnPrimary>) {
  return (
    <MinesAutoSlot
      mineCount={api.mineCount}
      onMineCountChange={api.setMines}
      revealCount={api.revealCount}
      onRevealCountChange={api.setRevealCount}
    />
  );
}

/** Legacy composed wrapper — kept for existing test/import paths. */
export function MinesControlsShared(p: MinesControlsProps) {
  const api = useMinesOnPrimary(p);
  const { onAutoFireSlot, settled, setMines, mineCount } = api;
  const selector = (
    <MinesCountSelector mineCount={mineCount} settled={settled} onSet={setMines} />
  );
  const manual = (
    <MinesBetPanelInner p={p} primarySize="default">
      {selector}
    </MinesBetPanelInner>
  );

  return (
    <BetModeTabs
      manual={manual}
      baseStake={p.stake}
      currency={p.currency}
      commitment={p.commitment}
      busy={p.busy}
      bet={p.bet}
      availableBalance={p.availableBalance}
      onAutoFire={onAutoFireSlot}
      autoSlot={makeMinesAutoSlot(api)}
      startDisabledReason={
        // Slot pre-populates revealedCells from revealCount; only fail when
        // mineCount leaves no room to reveal anything.
        api.revealCount < 1 ? t("casino.auto.needSelection.mines") : null
      }
    />
  );
}
