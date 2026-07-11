import {
  forwardRef,
  useCallback,
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
import { Card, CardBody } from '@/product/primitives/card';
import { HelpTip } from '@/product/primitives/help-tip';
import type { CasinoStageHandle, CasinoStagePhase } from '@/product/surfaces/games/casino-stage-types';

export type MinesStageProps = {
  mineCount: number;
  revealedCells: number[];
  onRevealedCellsChange?: (next: number[]) => void;
  selectionDisabled?: boolean;
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
  const unique = [...new Set(cells.filter((c) => Number.isInteger(c) && c >= 0 && c < CASINO_MINES_GRID_SIZE))];
  return unique;
}

/**
 * Mines L1 — 5×5 tile grid + multiplier ladder (§23.2 · §23.8).
 * Pre-bet tile pick only; cascade reveal is RPC replay — no mid-round cash-out.
 */
export const MinesStage = forwardRef<CasinoStageHandle, MinesStageProps>(
  function MinesStage(
    { mineCount, revealedCells, onRevealedCellsChange, selectionDisabled, className },
    ref,
  ) {
    const t = useT();
    const reducedMotion = usePrefersReducedMotion();
    const [phase, setPhase] = useState<CasinoStagePhase>('idle');
    const [outcome, setOutcome] = useState<ParsedMinesOutcome | null>(null);
    const [revealedOrder, setRevealedOrder] = useState<number[]>([]);
    const [showAllMines, setShowAllMines] = useState(false);
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

    const clearTimer = useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }, []);

    const settle = useCallback(
      (parsed: ParsedMinesOutcome, order: number[]) => {
        clearTimer();
        setRevealedOrder(order);
        setShowAllMines(true);
        setOutcome(parsed);
        setPhase('settled');
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
          const order = normalizeCells(picked);
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
        },
      }),
      [clearTimer, picked, runCascade],
    );

    const toggleCell = (index: number) => {
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

    const mineSet = useMemo(
      () => new Set(outcome?.minePositions ?? []),
      [outcome?.minePositions],
    );
    const revealedSet = useMemo(() => new Set(revealedOrder), [revealedOrder]);

    const cellVisual = (index: number): CellVisual => {
      if (phase === 'idle' || (phase === 'settled' && !outcome)) {
        return picked.includes(index) ? 'picked' : 'idle';
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
        data-hit-mine={outcome ? (outcome.hitMine ? 'true' : 'false') : undefined}
        data-won={won === null ? undefined : won ? 'true' : 'false'}
      >
        <CardBody className="flex min-h-[280px] flex-col gap-4 p-4 md:min-h-[360px] md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-foreground-muted m-0 text-xs">
                <HelpTip
                  label={t('games.mines.stage.currentMult')}
                  bodyKey={CASINO_MINES_CASHOUT_HELP_KEY}
                />
              </p>
              <p
                className="text-foreground m-0 text-2xl font-semibold tabular-nums"
                data-testid="casino-mines-cashout-mult"
              >
                {formatMult(cashoutMult)}×
              </p>
            </div>
            <div className="text-right">
              <p className="text-foreground-muted m-0 text-xs">{t('games.mines.stage.nextTile')}</p>
              <p
                className="text-foreground m-0 text-2xl font-semibold tabular-nums"
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

          {/* §23.2.1 — no live mid-round cash-out control */}
        </CardBody>
      </Card>
    );
  },
);
