import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { diceMultiplier, diceWinProbability, type DiceDirection } from '@phonara/game-engine';
import { toDecimal } from '@phonara/money';

import {
  parseDiceOutcome,
  type ParsedDiceOutcome,
} from '@/domain/casino-games-batch-a-display-contract';
import { useT } from '@/product/i18n';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';
import { cn } from '@/product/primitives/lib/cn';
import { Card, CardBody } from '@/product/primitives/card';
import type { CasinoStageHandle, CasinoStagePhase } from '@/product/surfaces/games/casino-stage-types';

export type DiceStageProps = {
  target: string;
  direction: string;
  className?: string;
};

function parseDirection(raw: string): DiceDirection {
  return raw === 'under' ? 'under' : 'over';
}

function formatChancePercent(prob: number): string {
  try {
    return toDecimal((prob * 100).toFixed(2), 'dice-win-chance').toFixed(2);
  } catch {
    return '0.00';
  }
}

function formatMult(mult: number): string {
  try {
    return toDecimal(mult.toFixed(2), 'dice-mult').toFixed(2);
  } catch {
    return '0.00';
  }
}

/**
 * Dice L1 — probability bar + contained roll (§23.2 · §23.8).
 * Win chance / payout preview = engine formula display (same as settle) — not client money invent.
 */
export const DiceStage = forwardRef<CasinoStageHandle, DiceStageProps>(
  function DiceStage({ target, direction, className }, ref) {
    const t = useT();
    const reducedMotion = usePrefersReducedMotion();
    const [phase, setPhase] = useState<CasinoStagePhase>('idle');
    const [outcome, setOutcome] = useState<ParsedDiceOutcome | null>(null);
    const [rollSettled, setRollSettled] = useState<string | null>(null);
    const rollLabelRef = useRef<HTMLSpanElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const resolveRef = useRef<(() => void) | null>(null);

    const dir = parseDirection(direction);
    const targetNum = Number(target);
    const preview = useMemo(() => {
      if (!Number.isFinite(targetNum) || targetNum < 0 || targetNum > 99.99) {
        return { chance: '—', mult: '—' };
      }
      const prob = diceWinProbability(targetNum, dir);
      const mult = diceMultiplier(targetNum, dir);
      return { chance: formatChancePercent(prob), mult: formatMult(mult) };
    }, [dir, targetNum]);

    const cancelRaf = useCallback(() => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }, []);

    const settle = useCallback(
      (parsed: ParsedDiceOutcome) => {
        cancelRaf();
        const text = parsed.roll.toFixed(2);
        if (rollLabelRef.current) rollLabelRef.current.textContent = text;
        setRollSettled(text);
        setOutcome(parsed);
        setPhase('settled');
        resolveRef.current?.();
        resolveRef.current = null;
      },
      [cancelRaf],
    );

    const runReplay = useCallback(
      (parsed: ParsedDiceOutcome) => {
        cancelRaf();
        setPhase('replaying');
        setOutcome(null);
        setRollSettled(null);
        if (reducedMotion) {
          settle(parsed);
          return;
        }
        const start = performance.now();
        const duration = 520;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const wobble = parsed.roll + Math.sin(p * Math.PI * 6) * (1 - p) * 8;
          const clamped = Math.max(0, Math.min(99.99, wobble));
          if (rollLabelRef.current) {
            rollLabelRef.current.textContent = clamped.toFixed(2);
          }
          if (p < 1) {
            rafRef.current = requestAnimationFrame(tick);
          } else {
            settle(parsed);
          }
        };
        rafRef.current = requestAnimationFrame(tick);
      },
      [cancelRaf, reducedMotion, settle],
    );

    useImperativeHandle(
      ref,
      () => ({
        playOutcome(result) {
          const parsed = parseDiceOutcome(result);
          if (!parsed) return Promise.resolve();
          return new Promise<void>((resolve) => {
            resolveRef.current = resolve;
            runReplay(parsed);
          });
        },
        reset() {
          cancelRaf();
          resolveRef.current = null;
          setPhase('idle');
          setOutcome(null);
          setRollSettled(null);
          if (rollLabelRef.current) rollLabelRef.current.textContent = '—';
        },
      }),
      [cancelRaf, runReplay],
    );

    const markerPct = Number.isFinite(targetNum)
      ? Math.max(0, Math.min(100, targetNum))
      : 50;
    const rollPct =
      rollSettled !== null ? Math.max(0, Math.min(100, Number(rollSettled))) : null;
    const won = outcome?.won === true;
    const winSideIsRight = dir === 'over';

    return (
      <Card
        variant="casino-play"
        className={cn(className)}
        data-testid="casino-dice-stage"
        data-stage-phase={phase}
        data-won={outcome ? (won ? 'true' : 'false') : undefined}
        data-direction={dir}
      >
        <CardBody className="flex min-h-[240px] flex-col gap-4 p-4 md:min-h-[320px] md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-foreground-muted m-0 text-xs">{t('casino.field.win_chance')}</p>
              <p
                className="text-foreground m-0 text-2xl font-semibold tabular-nums"
                data-testid="casino-dice-win-chance"
              >
                {preview.chance}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-foreground-muted m-0 text-xs">
                {t('casino.field.expected_multiplier')}
              </p>
              <p
                className="text-foreground m-0 text-2xl font-semibold tabular-nums"
                data-testid="casino-dice-payout-mult"
              >
                {preview.mult}×
              </p>
            </div>
          </div>

          <div
            className="relative h-10 w-full overflow-hidden rounded-full"
            data-testid="casino-dice-probability-bar"
          >
            <div
              className={cn(
                'absolute inset-y-0 left-0',
                winSideIsRight ? 'bg-surface-raised' : 'bg-success/35',
              )}
              style={{ width: `${markerPct}%` }}
            />
            <div
              className={cn(
                'absolute inset-y-0 right-0',
                winSideIsRight ? 'bg-success/35' : 'bg-surface-raised',
              )}
              style={{ width: `${100 - markerPct}%` }}
            />
            <div
              className="bg-foreground absolute top-0 bottom-0 w-0.5"
              style={{ left: `${markerPct}%` }}
              data-testid="casino-dice-threshold"
            />
            {rollPct !== null ? (
              <div
                className={cn(
                  'absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white',
                  won ? 'bg-success' : 'bg-danger',
                )}
                style={{ left: `${rollPct}%` }}
                data-testid="casino-dice-roll-marker"
              />
            ) : null}
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-foreground-muted text-xs">{t('casino.stage.roll')}</span>
            <span
              ref={rollLabelRef}
              className={cn(
                'text-4xl font-semibold tabular-nums',
                outcome ? (won ? 'text-success' : 'text-danger') : 'text-foreground',
              )}
              data-testid="casino-dice-roll"
            >
              {rollSettled ?? '—'}
            </span>
            <span className="text-foreground-muted text-xs tabular-nums">
              {t(dir === 'over' ? 'casino.option.over' : 'casino.option.under')} {target || '—'}
            </span>
          </div>
        </CardBody>
      </Card>
    );
  },
);
