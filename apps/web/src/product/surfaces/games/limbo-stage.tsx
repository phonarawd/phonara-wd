import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import {
  parseLimboOutcome,
  type ParsedLimboOutcome,
} from '@/domain/casino-games-batch-a-display-contract';
import { useT } from '@/product/i18n';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';
import { cn } from '@/product/primitives/lib/cn';
import { Card, CardBody } from '@/product/primitives/card';
import type { CasinoStageHandle, CasinoStagePhase } from '@/product/surfaces/games/casino-stage-types';

export type LimboStageProps = {
  target: string;
  className?: string;
};

/**
 * Limbo L1 — target dial + result flash (§23.2 · §23.8).
 * Instant loop: RPC result vs target only — no fake mid-state.
 */
export const LimboStage = forwardRef<CasinoStageHandle, LimboStageProps>(
  function LimboStage({ target, className }, ref) {
    const t = useT();
    const reducedMotion = usePrefersReducedMotion();
    const [phase, setPhase] = useState<CasinoStagePhase>('idle');
    const [outcome, setOutcome] = useState<ParsedLimboOutcome | null>(null);
    const [flash, setFlash] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resolveRef = useRef<(() => void) | null>(null);

    const clearTimer = useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }, []);

    const settle = useCallback(
      (parsed: ParsedLimboOutcome) => {
        clearTimer();
        setOutcome(parsed);
        setPhase('settled');
        setFlash(true);
        const hold = reducedMotion ? 0 : 420;
        if (hold === 0) {
          setFlash(false);
          resolveRef.current?.();
          resolveRef.current = null;
          return;
        }
        timerRef.current = setTimeout(() => {
          setFlash(false);
          resolveRef.current?.();
          resolveRef.current = null;
        }, hold);
      },
      [clearTimer, reducedMotion],
    );

    useImperativeHandle(
      ref,
      () => ({
        playOutcome(result) {
          const parsed = parseLimboOutcome(result);
          if (!parsed) return Promise.resolve();
          return new Promise<void>((resolve) => {
            resolveRef.current = resolve;
            setPhase('replaying');
            setOutcome(null);
            settle(parsed);
          });
        },
        reset() {
          clearTimer();
          resolveRef.current = null;
          setPhase('idle');
          setOutcome(null);
          setFlash(false);
        },
      }),
      [clearTimer, settle],
    );

    const won = outcome?.won === true;
    const tone = outcome ? (won ? 'text-success' : 'text-danger') : 'text-foreground';

    return (
      <Card
        variant="casino-play"
        className={cn(className)}
        data-testid="casino-limbo-stage"
        data-stage-phase={phase}
        data-won={outcome ? (won ? 'true' : 'false') : undefined}
      >
        <CardBody className="relative flex min-h-[240px] flex-col items-center justify-center gap-4 p-6 md:min-h-[320px]">
          <p className="text-foreground-muted m-0 text-xs font-medium tracking-wide uppercase">
            {t('casino.field.targetMultiplier')}
          </p>
          <p
            className="text-foreground m-0 text-4xl font-semibold tabular-nums md:text-5xl"
            data-testid="casino-limbo-target"
          >
            {target || '—'}×
          </p>
          <div
            className={cn(
              'flex min-h-16 flex-col items-center justify-center gap-1 rounded-md px-6 py-3 transition-colors',
              flash && won && 'bg-success/15',
              flash && !won && outcome && 'bg-danger/15',
            )}
            data-testid="casino-limbo-result-flash"
            data-flash={flash ? 'true' : 'false'}
          >
            <span className="text-foreground-muted text-xs">{t('casino.stage.result')}</span>
            <span
              className={cn('text-3xl font-semibold tabular-nums md:text-4xl', tone)}
              data-testid="casino-limbo-result"
            >
              {outcome ? `${outcome.resultMultiplier.toFixed(2)}×` : '—'}
            </span>
          </div>
        </CardBody>
      </Card>
    );
  },
);
