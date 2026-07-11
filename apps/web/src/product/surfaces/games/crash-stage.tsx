import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import {
  crashReplayDurationMs,
  parseCrashOutcome,
  type ParsedCrashOutcome,
} from '@/domain/casino-games-batch-a-display-contract';
import { useT } from '@/product/i18n';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';
import { cn } from '@/product/primitives/lib/cn';
import { Card, CardBody } from '@/product/primitives/card';
import type { CasinoStageHandle, CasinoStagePhase } from '@/product/surfaces/games/casino-stage-types';

export type CrashStageProps = {
  /** Pre-bet autoCashout display (selection) — not a live escape control. */
  autoCashout: string;
  className?: string;
};

type Point = { x: number; y: number };

function multiplierToY(mult: number, height: number, maxMult: number): number {
  const capped = Math.min(mult, maxMult);
  const t = Math.log(capped) / Math.log(Math.max(maxMult, 1.01));
  return height - 16 - t * (height - 32);
}

/**
 * Crash L1 — SVG curve + single rAF loop (§23.2 · §23.2.1).
 * Replay only: no mid-ascent cash-out button.
 */
export const CrashStage = forwardRef<CasinoStageHandle, CrashStageProps>(
  function CrashStage({ autoCashout, className }, ref) {
    const t = useT();
    const reducedMotion = usePrefersReducedMotion();
    const [phase, setPhase] = useState<CasinoStagePhase>('idle');
    const [outcome, setOutcome] = useState<ParsedCrashOutcome | null>(null);
    const [displayMult, setDisplayMult] = useState('1.00');
    const pathRef = useRef<SVGPathElement | null>(null);
    const labelRef = useRef<HTMLSpanElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const pointsRef = useRef<Point[]>([]);
    const startRef = useRef(0);
    const targetRef = useRef<ParsedCrashOutcome | null>(null);
    const resolveRef = useRef<(() => void) | null>(null);

    const cancelRaf = useCallback(() => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }, []);

    const finish = useCallback((parsed: ParsedCrashOutcome) => {
      cancelRaf();
      const finalMult = parsed.cashedOut
        ? parsed.cashoutMultiplier
        : parsed.crashMultiplier;
      setDisplayMult(finalMult.toFixed(2));
      setOutcome(parsed);
      setPhase('settled');
      resolveRef.current?.();
      resolveRef.current = null;
    }, [cancelRaf]);

    const paintPath = useCallback((points: Point[]) => {
      const el = pathRef.current;
      if (!el || points.length === 0) return;
      const d = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ');
      el.setAttribute('d', d);
    }, []);

    const runReplay = useCallback(
      (parsed: ParsedCrashOutcome) => {
        cancelRaf();
        targetRef.current = parsed;
        setPhase('replaying');
        setOutcome(null);
        pointsRef.current = [];
        const width = 640;
        const height = 280;
        const maxMult = Math.max(parsed.crashMultiplier * 1.05, 2);
        const duration = reducedMotion ? 0 : crashReplayDurationMs(parsed.crashMultiplier);
        const endMult = parsed.cashedOut
          ? Math.min(parsed.cashoutMultiplier, parsed.crashMultiplier)
          : parsed.crashMultiplier;

        if (duration === 0) {
          const y = multiplierToY(endMult, height, maxMult);
          pointsRef.current = [
            { x: 24, y: height - 16 },
            { x: width - 24, y },
          ];
          paintPath(pointsRef.current);
          finish(parsed);
          return;
        }

        startRef.current = performance.now();
        const tick = (now: number) => {
          const elapsed = now - startRef.current;
          const progress = Math.min(1, elapsed / duration);
          const eased = 1 - Math.pow(1 - progress, 2.2);
          const mult = Math.pow(endMult, eased);
          const x = 24 + (width - 48) * progress;
          const y = multiplierToY(mult, height, maxMult);
          pointsRef.current.push({ x, y });
          paintPath(pointsRef.current);
          if (labelRef.current) {
            labelRef.current.textContent = `${mult.toFixed(2)}×`;
          }
          if (progress < 1) {
            rafRef.current = requestAnimationFrame(tick);
          } else {
            finish(parsed);
          }
        };
        rafRef.current = requestAnimationFrame(tick);
      },
      [cancelRaf, finish, paintPath, reducedMotion],
    );

    useImperativeHandle(
      ref,
      () => ({
        playOutcome(result) {
          const parsed = parseCrashOutcome(result);
          if (!parsed) return Promise.resolve();
          return new Promise<void>((resolve) => {
            resolveRef.current = resolve;
            runReplay(parsed);
          });
        },
        reset() {
          cancelRaf();
          resolveRef.current = null;
          pointsRef.current = [];
          paintPath([]);
          setPhase('idle');
          setOutcome(null);
          setDisplayMult('1.00');
          if (labelRef.current) labelRef.current.textContent = '1.00×';
        },
      }),
      [cancelRaf, paintPath, runReplay],
    );

    useEffect(() => () => cancelRaf(), [cancelRaf]);

    const settledTone =
      outcome?.cashedOut === true
        ? 'text-success'
        : outcome
          ? 'text-danger'
          : 'text-foreground';

    return (
      <Card
        variant="casino-play"
        className={cn(className)}
        data-testid="casino-crash-stage"
        data-stage-phase={phase}
        data-cashed-out={outcome?.cashedOut === true ? 'true' : 'false'}
      >
        <CardBody className="relative flex min-h-[240px] flex-col gap-2 p-4 md:min-h-[320px]">
          <div className="flex items-baseline justify-between gap-2">
            <span
              ref={labelRef}
              className={cn('text-3xl font-semibold tabular-nums md:text-4xl', settledTone)}
              data-testid="casino-crash-multiplier"
            >
              {displayMult}×
            </span>
            <span
              className="text-foreground-muted text-xs tabular-nums"
              data-testid="casino-crash-autocashout-chip"
            >
              {t('casino.crash.autoAt', { mult: autoCashout || '—' })}
            </span>
          </div>
          <svg
            viewBox="0 0 640 280"
            className="border-line bg-surface-raised h-[180px] w-full rounded-md border md:h-[240px]"
            role="img"
            aria-label={t('casino.game.crash')}
            data-testid="casino-crash-curve"
          >
            <path
              ref={pathRef}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className={outcome?.cashedOut ? 'text-success' : 'text-accent'}
            />
          </svg>
          {phase === 'settled' && outcome ? (
            <p
              className={cn('m-0 text-sm font-medium', settledTone)}
              data-testid="casino-crash-outcome-label"
            >
              {outcome.cashedOut
                ? t('casino.bet.cashout_at')
                : t('casino.crash.crashed')}
              {outcome.cashedOut
                ? ` ${outcome.cashoutMultiplier.toFixed(2)}×`
                : ` ${outcome.crashMultiplier.toFixed(2)}×`}
            </p>
          ) : null}
        </CardBody>
      </Card>
    );
  },
);
