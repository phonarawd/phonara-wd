/**
 * Roulette · Controls (shared impl) — P2.7 v0.4 REFACTOR.
 *
 * Casino-only roulette (earn-roulette RPC/key 분리 유지).
 *
 * Named exports compose into Controls.mobile / Controls.desktop.
 * Legacy `RouletteControlsShared` retained (now composes the new parts) to
 * keep the existing test/import paths green.
 *
 * INVARIANTS:
 *  - Instant-settle game → NO fireDelayMs override (default 320ms).
 *  - BetPanel/BetModeTabs FROZEN → markers ride wrapper containers.
 *  - i18n keys for primary/secondary/disabled labels (no Korean JSX).
 *  - Engine schema preserved: bets[] of
 *      { type: straight|split|red|black|even|odd|low|high|dozen1-3|column1-3,
 *        value: number|null,
 *        stakeWeight: INTEGER number }
 *  - split value = LOWER of consecutive pair (|a-b| === 1).
 *  - Client payout 금지.
 */
import { useRef, useState, type ReactNode } from "react";
import { RotateCcw, Repeat, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BetPanel } from "../shared/BetPanel";
import { BetModeTabs } from "../shared/BetModeTabs";
import { useRGGate } from "../shared/RGGateProvider";
import { t } from "@/i18n";
import type {
  ImportedGameSurfaceProps,
  RouletteBet,
  RouletteBetType,
} from "../shared/types";

export type RouletteControlsProps = ImportedGameSurfaceProps<"roulette">;

const CHIPS = ["1", "5", "25", "100", "500"] as const;

const RED = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

const OUTSIDE: { type: RouletteBetType; labelKey: string }[] = [
  { type: "low", labelKey: "games.roulette.outside.low" },
  { type: "even", labelKey: "games.roulette.outside.even" },
  { type: "red", labelKey: "games.roulette.outside.red" },
  { type: "black", labelKey: "games.roulette.outside.black" },
  { type: "odd", labelKey: "games.roulette.outside.odd" },
  { type: "high", labelKey: "games.roulette.outside.high" },
  { type: "dozen1", labelKey: "games.roulette.outside.dozen1" },
  { type: "dozen2", labelKey: "games.roulette.outside.dozen2" },
  { type: "dozen3", labelKey: "games.roulette.outside.dozen3" },
  { type: "column1", labelKey: "games.roulette.outside.column1" },
  { type: "column2", labelKey: "games.roulette.outside.column2" },
  { type: "column3", labelKey: "games.roulette.outside.column3" },
];

/** Primary/auto handlers + selection flags — single source of truth. */
export function useRouletteOnPrimary(p: RouletteControlsProps) {
  const ready = Boolean(p.commitment);
  const totalWeight = p.selection.bets.reduce((a, b) => a + b.stakeWeight, 0);
  const noBets = p.selection.bets.length === 0;
  const rg = useRGGate();
  const lastBetsRef = useRef<RouletteBet[]>([]);

  const handlePrimary = async () => {
    if (noBets) return;
    lastBetsRef.current = p.selection.bets;
    if (ready) {
      const ok = await rg.gate("place_bet");
      if (!ok) return;
      p.onOpenBetConfirm();
    } else {
      p.onPrepareRound();
    }
  };

  const onAutoFire = async () => {
    if (p.selection.bets.length === 0) {
      throw new Error(t("casino.auto.needSelection.roulette"));
    }
    lastBetsRef.current = p.selection.bets;
    if (!p.commitment) await p.onPrepareRound();
    if (!p.commitment) return;
    p.onOpenBetConfirm();
    await p.onSubmitBet();
  };

  const primaryLabel = ready
    ? t("games.roulette.spin")
    : t("games.roulette.prepare");
  const secondaryLabel = t("games.roulette.hashCommit");
  const disabledReason = noBets ? t("games.roulette.emptyBets") : null;

  return {
    handlePrimary,
    onAutoFire,
    ready,
    noBets,
    totalWeight,
    primaryLabel,
    secondaryLabel,
    disabledReason,
    lastBetsRef,
  };
}

/** BetPanel wrapper — owns roulette-cta + roulette-chip-row + roulette-hash-btn markers. */
export function RouletteBetPanelInner({
  p,
  primarySize = "xl",
  children,
}: {
  p: RouletteControlsProps;
  primarySize?: "default" | "xl";
  children?: ReactNode;
}) {
  const {
    handlePrimary,
    ready,
    noBets,
    primaryLabel,
    secondaryLabel,
    disabledReason,
  } = useRouletteOnPrimary(p);

  return (
    <div data-game-id="roulette-cta">
      <span hidden data-game-id="roulette-hash-btn" />
      <div data-game-id="roulette-chip-row">
        <BetPanel
          stake={p.stake}
          currency={p.currency}
          availableBalance={p.availableBalance}
          busy={p.busy}
          ready={ready && !noBets}
          primarySize={primarySize}
          primaryLabel={primaryLabel}
          secondaryLabel={secondaryLabel}
          onStakeChange={p.onStakeChange}
          onCurrencyChange={p.onCurrencyChange}
          onPrimary={handlePrimary}
          onSecondary={p.onPrepareRound}
          disabledReason={disabledReason}
        >
          {children}
        </BetPanel>
      </div>
    </div>
  );
}

/** Bet-slip board (numbers + outside + chips + total). Reused by mobile/desktop. */
export function RouletteBoard({ p }: { p: RouletteControlsProps }) {
  const [chip, setChip] = useState<(typeof CHIPS)[number]>("5");
  const totalWeight = p.selection.bets.reduce((a, b) => a + b.stakeWeight, 0);

  const addBet = (type: RouletteBetType, value: number | null) => {
    const w = Number(chip);
    if (!Number.isInteger(w) || w <= 0) return;
    const next: RouletteBet = { type, value, stakeWeight: w };
    p.onSelectionChange({ bets: [...p.selection.bets, next] });
  };
  const clear = () => p.onSelectionChange({ bets: [] });
  const repeat = () => {
    // last-bets repeat handled via primary-hook ref; board-level repeat clones current
    if (p.selection.bets.length) {
      p.onSelectionChange({ bets: [...p.selection.bets] });
    }
  };
  const double = () => {
    p.onSelectionChange({
      bets: p.selection.bets.map((b) => ({
        ...b,
        stakeWeight: b.stakeWeight * 2,
      })),
    });
  };
  const addSplit = (a: number, b: number) => {
    if (Math.abs(a - b) !== 1) {
      if (import.meta.env.DEV) {
         
        console.warn(
          `[roulette] split reject: |${a} - ${b}| !== 1 (engine silent-fail guard)`,
        );
      }
      return;
    }
    addBet("split", Math.min(a, b));
  };

  return (
    <div
      data-testid="roulette-bet-slip"
      data-game-id="roulette-board"
      className="grid gap-2 rounded-2xl border border-border bg-(--color-surface) p-3"
    >
      <NumberGrid
        bets={p.selection.bets}
        onPickStraight={(n) => addBet("straight", n)}
        onPickSplit={addSplit}
      />
      <div className="grid grid-cols-3 gap-1.5">
        {OUTSIDE.map((o) => {
          const placed = p.selection.bets.filter((b) => b.type === o.type);
          const weight = placed.reduce((acc, b) => acc + b.stakeWeight, 0);
          return (
            <button
              key={o.type}
              type="button"
              onClick={() => addBet(o.type, null)}
              className={cn(
                "relative min-h-11 rounded-md border text-xs font-extrabold tabular-nums transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
                o.type === "red" && "border-rose-500/60 bg-rose-600/25 text-rose-100 hover:bg-rose-600/35",
                o.type === "black" && "border-stone-600 bg-stone-900 text-stone-100 hover:bg-stone-800",
                o.type !== "red" && o.type !== "black"
                  ? "border-emerald-600/50 bg-emerald-900/35 text-emerald-100 hover:bg-emerald-800/45"
                  : "",
              )}
            >
              {t(o.labelKey)}
              {weight > 0 && (
                <span className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-amber-400 text-[10px] font-black tabular-nums text-stone-900 shadow-sm">
                  {weight}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div data-testid="roulette-chip-picker" className="flex items-center gap-1">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setChip(c)}
            aria-label={`${t("casino.field.chip")} ${c}`}
            className={cn(
              "grid size-9 place-items-center rounded-full border-2 text-[10px] font-black tabular-nums transition-transform",
              chip === c
                ? "scale-110 border-amber-300 bg-amber-500 text-stone-900"
                : "border-amber-700/30 bg-stone-800 text-amber-200",
            )}
          >
            {c}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            data-testid="roulette-clear"
            onClick={clear}
            aria-label="clear bets"
            className="grid size-9 place-items-center rounded-md border border-border bg-(--color-surface) text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
          <button
            type="button"
            data-testid="roulette-repeat"
            onClick={repeat}
            aria-label="repeat last bets"
            className="grid size-9 place-items-center rounded-md border border-border bg-(--color-surface) text-muted-foreground hover:text-foreground"
          >
            <Repeat className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={double}
            aria-label="double all"
            className="grid size-9 place-items-center rounded-md border border-border bg-(--color-surface) text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] tabular-nums text-muted-foreground">
        <span>{t("games.roulette.totalWeight")}</span>
        <span className="font-mono text-amber-300">{totalWeight}</span>
      </div>
    </div>
  );
}

/** Legacy composed wrapper — kept for existing index/test paths. */
export function RouletteControlsShared(p: RouletteControlsProps) {
  const { onAutoFire, noBets } = useRouletteOnPrimary(p);
  const manual = <RouletteBetPanelInner p={p} primarySize="default" />;
  return (
    <div data-testid="casino-controls" className="grid gap-3">
      <RouletteBoard p={p} />
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
  );
}

function NumberGrid({
  bets,
  onPickStraight,
  onPickSplit,
}: {
  bets: RouletteBet[];
  onPickStraight: (n: number) => void;
  onPickSplit: (a: number, b: number) => void;
}) {
  const rows: number[][] = [[], [], []];
  for (let c = 0; c < 12; c++) {
    rows[0]!.push(3 + c * 3);
    rows[1]!.push(2 + c * 3);
    rows[2]!.push(1 + c * 3);
  }
  const straightFor = (n: number) =>
    bets
      .filter((b) => b.type === "straight" && b.value === n)
      .reduce((a, b) => a + b.stakeWeight, 0);
  const splitFor = (low: number) =>
    bets
      .filter((b) => b.type === "split" && b.value === low)
      .reduce((a, b) => a + b.stakeWeight, 0);

  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={() => onPickStraight(0)}
        aria-label="pocket 0"
        className={cn(
          "relative grid min-w-11 place-items-center rounded-md border-2 border-emerald-400/70 bg-emerald-600 text-base font-black tabular-nums text-white",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
        )}
      >
        0
        {straightFor(0) > 0 && (
          <span className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-amber-400 text-[10px] font-black tabular-nums text-stone-900 shadow-sm">
            {straightFor(0)}
          </span>
        )}
      </button>

      <div className="grid flex-1 grid-rows-3 gap-1">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-12 gap-1">
            {row.map((n) => {
              const placed = straightFor(n);
              const isRed = RED.has(n);
              const splitWith = n + 1 <= 36 ? n : null;
              return (
                <div key={n} className="relative">
                  <button
                    type="button"
                    onClick={() => onPickStraight(n)}
                    aria-label={`pocket ${n}`}
                    className={cn(
                      "relative grid min-h-10 w-full place-items-center rounded border border-stone-700/60 text-xs font-black tabular-nums text-white lg:min-h-11 lg:text-sm",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
                      isRed ? "bg-rose-600 hover:bg-rose-500" : "bg-stone-800 hover:bg-stone-700",
                    )}
                  >
                    {n}
                    {placed > 0 && (
                      <span className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-amber-400 text-[10px] font-black tabular-nums text-stone-900 shadow-sm">
                        {placed}
                      </span>
                    )}
                  </button>
                  {splitWith !== null && (
                    <button
                      type="button"
                      aria-label={`split ${n}|${n + 1}`}
                      onClick={() => onPickSplit(n, n + 1)}
                      className={cn(
                        "absolute -right-0.5 top-1/2 z-10 grid h-3 w-1.5 -translate-y-1/2 place-items-center rounded-sm transition-colors",
                        splitFor(splitWith) > 0
                          ? "bg-amber-300"
                          : "bg-amber-500/0 hover:bg-amber-400/70",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
