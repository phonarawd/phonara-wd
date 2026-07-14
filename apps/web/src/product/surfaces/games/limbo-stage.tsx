import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import {
  parseLimboOutcome,
  type ParsedLimboOutcome,
} from '@/domain/casino-games-batch-a-display-contract';
import { useT } from '@/product/i18n';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';
import { cn } from '@/product/primitives/lib/cn';
import { Card, CardBody } from '@/product/primitives/card';
import type {
  CasinoStageHandle,
  CasinoStagePhase,
} from '@/product/surfaces/games/casino-stage-types';

export type LimboStageProps = {
  target: string;
  className?: string;
};

/** Result-reveal hold — matches `--ds-motion-casino-reveal` (motion.css), inside the 200-500ms band. */
const LIMBO_REVEAL_HOLD_MS = 360;

/**
 * Limbo L1 — target dial + result flash (§23.2 · §23.8).
 * Instant loop: RPC result vs target only — no fake mid-state.
 *
 * Phase 1B motion polish — reuses the shared casino reveal/pop/flash tokens
 * (motion.css) rather than the previous ad-hoc `bg-success/15`/`bg-danger/15`
 * box + mismatched 420ms JS timer (which never matched any CSS transition
 * duration). Win: reveal-in + number-pop + glow ("punchy"). Loss (including a
 * near-miss): reveal-in only, no pop/glow — CASINO_UX_CANON "lose: calm ·
 * respectful", so a 1.99× miss against a 2.00× target reads exactly as clean
 * as a 1.10× miss, never an alarming flash.
 */
export const LimboStage = forwardRef<CasinoStageHandle, LimboStageProps>(function LimboStage(
  { target, className },
  ref,
) {
  const t = useT();
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<CasinoStagePhase>('idle');
  const [outcome, setOutcome] = useState<ParsedLimboOutcome | null>(null);
  /** Monotonic counter — key-remount restarts the CSS reveal/pop/flash on each new settle (§Motion). */
  const [revealPulse, setRevealPulse] = useState(0);
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
      setRevealPulse((n) => n + 1);
      if (reducedMotion) {
        resolveRef.current?.();
        resolveRef.current = null;
        return;
      }
      // Resolve once the reveal itself finishes — matches the Motion criteria
      // "must not block the next input longer than the animation itself".
      timerRef.current = setTimeout(() => {
        resolveRef.current?.();
        resolveRef.current = null;
      }, LIMBO_REVEAL_HOLD_MS);
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
        setRevealPulse(0);
      },
    }),
    [clearTimer, settle],
  );

  // Perf (Phase 1B) — a bet placed right before navigating away must not leave
  // a dangling timer; harmless today (the callback only touches refs), but a
  // silent gap versus CrashStage's equivalent `useEffect(() => cancelRaf, ...)`.
  useEffect(() => clearTimer, [clearTimer]);

  const won = outcome?.won === true;
  const settled = phase === 'settled' && outcome !== null;
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
          className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-md px-6 py-3"
          data-testid="casino-limbo-result-flash"
          data-flash={settled ? 'true' : 'false'}
        >
          <span className="text-foreground-muted text-xs">{t('casino.stage.result')}</span>
          <span className="relative inline-flex items-baseline">
            {settled && won && !reducedMotion ? (
              <span
                key={`glow-${revealPulse}`}
                aria-hidden="true"
                data-testid="casino-limbo-win-flash"
                className="ds-casino-cashout-flash"
              />
            ) : null}
            <span
              key={`value-${revealPulse}`}
              className={cn(
                'text-3xl font-semibold tabular-nums md:text-4xl',
                tone,
                settled && !reducedMotion && 'ds-casino-reveal-in',
                settled && won && !reducedMotion && 'ds-casino-number-pop',
              )}
              data-testid="casino-limbo-result"
            >
              {outcome ? `${outcome.resultMultiplier.toFixed(2)}×` : '—'}
            </span>
          </span>
        </div>
      </CardBody>
    </Card>
  );
});
