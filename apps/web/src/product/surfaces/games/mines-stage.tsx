import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { minesMultiplier } from '@phonara/game-engine';
import { toDecimal } from '@phonara/money';

import {
  CASINO_MINES_CASHOUT_HELP_KEY,
  CASINO_MINES_GRID_SIZE,
  minesCascadeStepMs,
  parseMinesOutcome,
  type ParsedMinesOutcome,
} from '@/domain/casino-games-batch-b-display-contract';
import { useT } from '@/product/i18n';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';
import { cn } from '@/product/primitives/lib/cn';
import { Button } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { HelpTip } from '@/product/primitives/help-tip';
import type {
  CasinoStageHandle,
  CasinoStagePhase,
} from '@/product/surfaces/games/casino-stage-types';

export type MinesStageProps = {
  mineCount: number;
  revealedCells: number[];
  onRevealedCellsChange?: (next: number[]) => void;
  selectionDisabled?: boolean;
  /** E23 progressive — tile reveal + mid cash-out via RPC. */
  liveMode?: boolean;
  liveSessionActive?: boolean;
  liveCashoutBusy?: boolean;
  onLiveRevealCell?: (cell: number) => void;
  onLiveCashout?: () => void;
  className?: string;
};

type CellVisual = 'idle' | 'picked' | 'safe' | 'mine' | 'hidden-mine';

function formatMult(mult: number): string {
  try {
    return toDecimal(mult.toFixed(2), 'mines-mult').toFixed(2);
  } catch {
    return '0.00';
  }
}

function normalizeCells(cells: number[]): number[] {
  const unique = [
    ...new Set(cells.filter((c) => Number.isInteger(c) && c >= 0 && c < CASINO_MINES_GRID_SIZE)),
  ];
  return unique;
}

/**
 * Mines L1 — 5×5 tile grid + multiplier ladder (§23.2 · §23.8).
 * One-shot: pre-bet picks + cascade replay. E23 liveMode: progressive step/cashout.
 *
 * Phase 1C motion polish — reuses the shared `ds-casino-reveal-in`/
 * `ds-casino-number-pop`/`ds-casino-cashout-flash` tokens (motion.css) for the
 * multiplier ladder (win: reveal-in + number-pop + glow, "punchy"; loss: reveal-in
 * only, CASINO_UX_CANON "lose: calm · respectful" — same convention Crash/Limbo/
 * Dice already established), plus a new additive `ds-casino-tile-reveal` token
 * for the per-tile "Micro feedback ... tile-flip start" band (120-200ms,
 * §Motion & performance acceptance criteria) covering pre-bet picks, live
 * mid-round reveals, and cascade-replay reveals through one mechanism.
 *
 * Phase 1C functional QA fix — `playOutcome` now prefers the RPC's own
 * `revealedCells` echo (when present) over this stage's prop-derived `picked`
 * for the cascade reveal order; see `ParsedMinesOutcome.revealedCells` doc for
 * the exact one-tick-stale race this closes on a live mine hit.
 */
export const MinesStage = forwardRef<CasinoStageHandle, MinesStageProps>(function MinesStage(
  {
    mineCount,
    revealedCells,
    onRevealedCellsChange,
    selectionDisabled,
    liveMode = false,
    liveSessionActive = false,
    liveCashoutBusy = false,
    onLiveRevealCell,
    onLiveCashout,
    className,
  },
  ref,
) {
  const t = useT();
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<CasinoStagePhase>('idle');
  const [outcome, setOutcome] = useState<ParsedMinesOutcome | null>(null);
  const [revealedOrder, setRevealedOrder] = useState<number[]>([]);
  const [showAllMines, setShowAllMines] = useState(false);
  /** Monotonic counter — key-remount restarts the CSS reveal/pop/flash on each ladder tick or settle (§Motion), mirrors crash/limbo/dice. */
  const [revealPulse, setRevealPulse] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  const safeMineCount =
    Number.isFinite(mineCount) && mineCount >= 1 && mineCount <= 24 ? Math.floor(mineCount) : 3;
  const picked = useMemo(() => normalizeCells(revealedCells), [revealedCells]);
  const maxSafe = CASINO_MINES_GRID_SIZE - safeMineCount;

  const cashoutMult = useMemo(() => {
    if (picked.length === 0) return 1;
    return minesMultiplier(safeMineCount, picked.length);
  }, [picked.length, safeMineCount]);

  const nextMult = useMemo(() => {
    if (picked.length >= maxSafe) return cashoutMult;
    return minesMultiplier(safeMineCount, picked.length + 1);
  }, [cashoutMult, maxSafe, picked.length, safeMineCount]);

  // Multiplier ladder motion — a tick per reveal (pre-bet pick, live mid-round
  // step, or cascade-replay step all funnel through the picked-cells count),
  // decoupled from *who* changed it. `settle()` below bumps it again so the
  // terminal reveal (e.g. a live cash-out, which does not itself change
  // picked.length) still gets a fresh remount for the win-only pop/glow.
  const pickedCountRef = useRef(picked.length);
  useEffect(() => {
    if (pickedCountRef.current === picked.length) return;
    pickedCountRef.current = picked.length;
    setRevealPulse((n) => n + 1);
  }, [picked.length]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Perf (Phase 1C) — a live mine-hit right before navigating away must not
  // leave the recursive cascade `setTimeout` chain running against an
  // unmounted component (same leaked-timer class already fixed for Limbo's
  // reveal-hold and Dice's rAF loop).
  useEffect(() => clearTimer, [clearTimer]);

  const settle = useCallback(
    (parsed: ParsedMinesOutcome, order: number[]) => {
      clearTimer();
      setRevealedOrder(order);
      setShowAllMines(true);
      setOutcome(parsed);
      setPhase('settled');
      setRevealPulse((n) => n + 1);
      resolveRef.current?.();
      resolveRef.current = null;
    },
    [clearTimer],
  );

  const runCascade = useCallback(
    (parsed: ParsedMinesOutcome, order: number[]) => {
      clearTimer();
      setPhase('replaying');
      setOutcome(null);
      setRevealedOrder([]);
      setShowAllMines(false);

      if (reducedMotion || order.length === 0) {
        settle(parsed, order);
        return;
      }

      const step = minesCascadeStepMs(order.length);
      let i = 0;
      const tick = () => {
        i += 1;
        setRevealedOrder(order.slice(0, i));
        if (i >= order.length) {
          settle(parsed, order);
          return;
        }
        timerRef.current = setTimeout(tick, step);
      };
      timerRef.current = setTimeout(tick, step);
    },
    [clearTimer, reducedMotion, settle],
  );

  useImperativeHandle(
    ref,
    () => ({
      playOutcome(result) {
        const parsed = parseMinesOutcome(result);
        if (!parsed) return Promise.resolve();
        // Prefer the RPC's own revealedCells echo (live/progressive step or
        // cashout) over this stage's prop-derived `picked` — see
        // ParsedMinesOutcome.revealedCells doc for the one-tick-stale race
        // this avoids on a live mine hit. One-shot results never carry this
        // field, so `picked` (already correct there — settle only ever runs
        // after the pre-bet selection has fully committed) is the fallback.
        const order = normalizeCells(parsed.revealedCells ?? picked);
        return new Promise<void>((resolve) => {
          resolveRef.current = resolve;
          runCascade(parsed, order);
        });
      },
      reset() {
        clearTimer();
        resolveRef.current = null;
        setPhase('idle');
        setOutcome(null);
        setRevealedOrder([]);
        setShowAllMines(false);
        setRevealPulse(0);
      },
    }),
    [clearTimer, picked, runCascade],
  );

  const toggleCell = (index: number) => {
    if (liveMode && liveSessionActive && onLiveRevealCell) {
      if (selectionDisabled || phase === 'replaying') return;
      onLiveRevealCell(index);
      return;
    }
    if (selectionDisabled || phase === 'replaying' || !onRevealedCellsChange) return;
    const set = new Set(picked);
    if (set.has(index)) {
      set.delete(index);
      onRevealedCellsChange([...set]);
      return;
    }
    if (set.size >= maxSafe) return;
    set.add(index);
    onRevealedCellsChange([...set]);
  };

  const mineSet = useMemo(() => new Set(outcome?.minePositions ?? []), [outcome?.minePositions]);
  const revealedSet = useMemo(() => new Set(revealedOrder), [revealedOrder]);

  const cellVisual = (index: number): CellVisual => {
    if (phase === 'idle' || (phase === 'settled' && !outcome)) {
      if (!picked.includes(index)) return 'idle';
      // Live mode with an active session — the server has already confirmed
      // this cell safe (a mine hit ends the session and takes over via the
      // 'settled'+outcome branch below, so 'idle' + liveSessionActive here
      // always means "revealed and safe", never "revealed and unconfirmed").
      // Pre-bet oneshot picks (no active session) stay the plain 'picked'
      // chip — they are a selection, not yet a server-confirmed reveal.
      return liveMode && liveSessionActive ? 'safe' : 'picked';
    }
    if (phase === 'replaying') {
      if (revealedSet.has(index)) {
        return mineSet.has(index) ? 'mine' : 'safe';
      }
      return picked.includes(index) ? 'picked' : 'idle';
    }
    // settled
    if (revealedSet.has(index)) {
      return mineSet.has(index) ? 'mine' : 'safe';
    }
    if (showAllMines && mineSet.has(index)) return 'hidden-mine';
    return 'idle';
  };

  const won = outcome ? !outcome.hitMine && picked.length > 0 : null;

  return (
    <Card
      variant="casino-play"
      className={cn(className)}
      data-testid="casino-mines-stage"
      data-stage-phase={phase}
      data-live-mode={liveMode ? 'true' : 'false'}
      data-hit-mine={outcome ? (outcome.hitMine ? 'true' : 'false') : undefined}
      data-won={won === null ? undefined : won ? 'true' : 'false'}
    >
      <CardBody className="flex min-h-[280px] flex-col gap-4 p-4 md:min-h-[360px] md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col">
            <p className="text-foreground-muted m-0 text-xs">
              <HelpTip
                label={t('games.mines.stage.currentMult')}
                bodyKey={CASINO_MINES_CASHOUT_HELP_KEY}
              />
            </p>
            <span className="relative inline-flex items-baseline">
              {phase === 'settled' && won && !reducedMotion ? (
                <span
                  key={`glow-${revealPulse}`}
                  aria-hidden="true"
                  data-testid="casino-mines-win-flash"
                  className="ds-casino-cashout-flash"
                />
              ) : null}
              <span
                key={`mult-${revealPulse}`}
                className={cn(
                  'text-2xl font-semibold tabular-nums',
                  phase === 'settled' && outcome
                    ? won
                      ? 'text-success'
                      : 'text-danger'
                    : 'text-foreground',
                  !reducedMotion && 'ds-casino-reveal-in',
                  phase === 'settled' && won && !reducedMotion && 'ds-casino-number-pop',
                )}
                data-testid="casino-mines-cashout-mult"
              >
                {formatMult(cashoutMult)}×
              </span>
            </span>
          </div>
          <div className="text-right">
            <p className="text-foreground-muted m-0 text-xs">{t('games.mines.stage.nextTile')}</p>
            <p
              key={`next-${revealPulse}`}
              className={cn(
                'text-foreground m-0 text-2xl font-semibold tabular-nums',
                !reducedMotion && 'ds-casino-reveal-in',
              )}
              data-testid="casino-mines-next-mult"
            >
              {formatMult(nextMult)}×
            </p>
          </div>
          <div className="text-right">
            <p className="text-foreground-muted m-0 text-xs">{t('games.mines.stage.picked')}</p>
            <p
              className="text-foreground m-0 text-2xl font-semibold tabular-nums"
              data-testid="casino-mines-picked-count"
            >
              {picked.length}/{maxSafe}
            </p>
          </div>
        </div>

        <div
          className="mx-auto grid w-full max-w-sm grid-cols-5 gap-2"
          role="grid"
          aria-label={t('casino.game.mines.name')}
          data-testid="casino-mines-grid"
        >
          {Array.from({ length: CASINO_MINES_GRID_SIZE }, (_, index) => {
            const visual = cellVisual(index);
            const selected = picked.includes(index);
            return (
              <button
                key={index}
                type="button"
                role="gridcell"
                aria-pressed={selected}
                aria-label={`${t('casino.field.revealedCells')} ${index + 1}`}
                disabled={selectionDisabled || phase === 'replaying'}
                data-testid={`casino-mines-cell-${index}`}
                data-cell-visual={visual}
                className={cn(
                  'border-line flex min-h-12 min-w-12 items-center justify-center rounded-md border text-sm font-semibold tabular-nums transition-colors',
                  visual === 'idle' && 'bg-surface-raised text-foreground-muted',
                  visual === 'picked' && 'border-accent bg-accent/15 text-foreground',
                  visual === 'safe' && 'border-success bg-success/25 text-success',
                  visual === 'mine' && 'border-danger bg-danger/30 text-danger',
                  visual === 'hidden-mine' && 'border-danger/50 bg-danger/10 text-danger/80',
                  // Tile-flip micro-feedback (120-200ms band, §Motion) — fires once per
                  // idle->revealed transition (pre-bet pick, live step, or cascade tick);
                  // re-renders while already non-idle keep the same class string, so the
                  // browser never restarts it mid-state (only a real idle<->revealed
                  // attribute change retriggers, e.g. deselect-then-reselect pre-bet).
                  visual !== 'idle' && !reducedMotion && 'ds-casino-tile-reveal',
                )}
                onClick={() => toggleCell(index)}
              >
                {visual === 'mine' || visual === 'hidden-mine'
                  ? '●'
                  : visual === 'safe'
                    ? '✓'
                    : selected
                      ? String(picked.indexOf(index) + 1)
                      : ''}
              </button>
            );
          })}
        </div>

        {liveMode && liveSessionActive && onLiveCashout ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="self-center"
            disabled={liveCashoutBusy || picked.length === 0}
            onClick={onLiveCashout}
            data-testid="casino-mines-live-cashout"
          >
            {t('casino.progressive.cashout')}
          </Button>
        ) : null}
      </CardBody>
    </Card>
  );
});
