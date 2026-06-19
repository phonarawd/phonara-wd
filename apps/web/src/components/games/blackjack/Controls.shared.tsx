/**
 * Blackjack · Controls (shared impl) — P2.8 v0.4 REFACTOR.
 *
 * Named exports compose into Controls.mobile / Controls.desktop.
 * Legacy `BlackjackControlsShared` retained for back-compat (composes the new parts).
 *
 * INVARIANTS:
 *  - Instant-settle → NO fireDelayMs override (default 320ms).
 *  - Auto mode is STAND-ONLY: inject `{seat:0, move:"stand"}` if empty.
 *  - selection.actions REPLACED on each change (no push).
 *  - INSURANCE excluded (LOCK ⑩).
 *  - finished = stand | double | busted.
 *  - BetPanel/BetModeTabs FROZEN. No Korean JSX.
 */
import type { ReactNode } from "react";
import { Plus, Minus, Hand, Split } from "lucide-react";
import { cn } from "@/lib/utils";
import { BetPanel } from "../shared/BetPanel";
import { BetModeTabs } from "../shared/BetModeTabs";
import { useRGGate } from "../shared/RGGateProvider";
import { t } from "@/i18n";
import { handScore } from "./playBlackjack";
import type { BlackjackMove, ImportedGameSurfaceProps } from "../shared/types";

export type BlackjackControlsProps = ImportedGameSurfaceProps<"blackjack">;

const ACTIONS: {
  move: BlackjackMove;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  testid: string;
}[] = [
  { move: "hit", labelKey: "casino.action.hit", icon: Plus, testid: "blackjack-hit" },
  { move: "stand", labelKey: "casino.action.stand", icon: Minus, testid: "blackjack-stand" },
  { move: "double", labelKey: "casino.action.double", icon: Hand, testid: "blackjack-double" },
  { move: "split", labelKey: "casino.action.split", icon: Split, testid: "blackjack-split" },
];

function playerBusted(bet: BlackjackControlsProps["bet"]): boolean {
  const result = bet?.result as { player?: number[] } | undefined;
  const cards = result?.player ?? [];
  if (cards.length === 0) return false;
  return handScore(cards) > 21;
}

/** Primary/auto handlers + action state — single source of truth. */
export function useBlackjackOnPrimary(p: BlackjackControlsProps) {
  const rg = useRGGate();
  const ready = Boolean(p.commitment);
  const actions = p.selection.actions;
  const lastMove = actions[actions.length - 1]?.move;
  const busted = playerBusted(p.bet);
  const finished = lastMove === "stand" || lastMove === "double" || busted;

  const seatAfter = (acts: { seat: number; move: BlackjackMove }[]): number => {
    let seat = 0;
    for (const a of acts) if (a.move === "split") seat = 1;
    return seat;
  };

  const setMove = (move: BlackjackMove) => {
    if (finished || p.busy) return;
    const seat = seatAfter(actions);
    const next = [...actions, { seat, move }];
    p.onSelectionChange({ actions: next });
  };

  const reset = () => p.onSelectionChange({ actions: [] });

  const handlePrimary = async () => {
    if (ready) {
      if (actions.length === 0) {
        p.onSelectionChange({ actions: [{ seat: 0, move: "stand" }] });
      }
      const ok = await rg.gate("place_bet");
      if (!ok) return;
      p.onOpenBetConfirm();
    } else {
      p.onPrepareRound();
    }
  };

  const onAutoFire = async () => {
    if (!p.commitment) await p.onPrepareRound();
    if (!p.commitment) return;
    if (p.selection.actions.length === 0) {
      p.onSelectionChange({ actions: [{ seat: 0, move: "stand" }] });
    }
    p.onOpenBetConfirm();
    await p.onSubmitBet();
  };

  const primaryLabel = ready
    ? t("games.blackjack.deal")
    : t("games.blackjack.prepare");
  const secondaryLabel = t("games.blackjack.hashCommit");

  return {
    handlePrimary,
    onAutoFire,
    ready,
    finished,
    actions,
    setMove,
    reset,
    primaryLabel,
    secondaryLabel,
  };
}

/** hit/stand/double/split grid + selected chip row. FROZEN testids. */
export function BlackjackActionsBlock({ p }: { p: BlackjackControlsProps }) {
  const { finished, actions, setMove, reset } = useBlackjackOnPrimary(p);
  return (
    <div data-game-id="blackjack-actions" className="grid gap-2">
      <p className="text-[10px] leading-snug text-muted-foreground">
        {t("casino.blackjack.hint.pre_commit")}
      </p>
      <div className="grid grid-cols-2 gap-1">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          const isLast = actions[actions.length - 1]?.move === a.move && actions.length > 0;
          return (
            <button
              key={a.move}
              type="button"
              data-testid={a.testid}
              onClick={() => setMove(a.move)}
              disabled={p.busy || finished}
              className={cn(
                "flex min-h-10 items-center justify-center gap-1 rounded-md border text-[11px] font-bold disabled:opacity-40",
                "transition-[box-shadow,border-color,background-color] duration-150",
                "border-emerald-700/40 bg-emerald-900/30 text-emerald-200 hover:bg-emerald-800/40",
                isLast && "ring-2 ring-emerald-400/60 shadow-[0_0_10px_rgba(52,211,153,.25)]",
              )}
            >
              <Icon className="size-3.5" />
              {t(a.labelKey)}
            </button>
          );
        })}
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-(--color-surface)/60 p-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {t("casino.action.deal")}
          </span>
          {actions.map((a, i) => (
            <span
              key={i}
              className="rounded bg-emerald-900/40 px-1.5 py-0.5 text-[10px] font-mono uppercase text-emerald-200"
            >
              {a.move}
            </span>
          ))}
          <button
            type="button"
            onClick={reset}
            aria-label="reset actions"
            className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
          >
            ↺
          </button>
        </div>
      )}
    </div>
  );
}

/** BetPanel wrapper — owns blackjack-cta + chip-row + hash-btn markers. */
export function BlackjackBetPanelInner({
  p,
  primarySize = "xl",
  children,
}: {
  p: BlackjackControlsProps;
  primarySize?: "default" | "xl";
  children?: ReactNode;
}) {
  const { handlePrimary, ready, primaryLabel, secondaryLabel } =
    useBlackjackOnPrimary(p);
  return (
    <div data-game-id="blackjack-cta">
      <span hidden data-game-id="blackjack-hash-btn" />
      <div data-game-id="blackjack-chip-row">
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
          onPrimary={handlePrimary}
          onSecondary={p.onPrepareRound}
        >
          {children ?? <BlackjackActionsBlock p={p} />}
        </BetPanel>
      </div>
    </div>
  );
}

/** Legacy composed wrapper — kept for existing test/import paths. */
export function BlackjackControlsShared(p: BlackjackControlsProps) {
  const { onAutoFire } = useBlackjackOnPrimary(p);
  const manual = <BlackjackBetPanelInner p={p} primarySize="default" />;
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
        autoChildren={
          <p className="text-[10px] leading-snug text-muted-foreground">
            {t("casino.auto.needSelection.blackjack")}
          </p>
        }
      />
    </div>
  );
}
