import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import {
  crashCurveEasing,
  crashReplayDurationMs,
  parseCrashOutcome,
  type ParsedCrashOutcome,
} from '@/domain/casino-games-batch-a-display-contract';
import { useT } from '@/product/i18n';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';
import { cn } from '@/product/primitives/lib/cn';
import { Button } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import type {
  CasinoStageHandle,
  CasinoStagePhase,
} from '@/product/surfaces/games/casino-stage-types';

/** Display-only cash-out confirmation (RPC payout/multiplier passthrough, no recompute). */
export type CrashLiveCashoutFlash = {
  /** Bet id — distinguishes a fresh cash-out event from a stale/repeated one. */
  id: string;
  multiplier: string;
};

export type CrashStageProps = {
  /** Pre-bet autoCashout display (selection) — not a live escape control. */
  autoCashout: string;
  /** E23 live shared-round mode — mid-flight cash-out when flying. */
  liveMode?: boolean;
  /** True only while the current user has an active (not-yet-settled) live bet this round. */
  liveSessionActive?: boolean;
  liveMultiplier?: string | null;
  liveRoundStatus?: string | null;
  liveCashoutBusy?: boolean;
  onLiveCashout?: () => void;
  /** Set once per successful mid-flight cash-out — triggers flash + number pop. */
  liveCashoutFlash?: CrashLiveCashoutFlash | null;
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
 * One-shot: replay only. E23 liveMode: mid-flight cash-out when flying.
 */
export const CrashStage = forwardRef<CasinoStageHandle, CrashStageProps>(function CrashStage(
  {
    autoCashout,
    liveMode = false,
    liveSessionActive = false,
    liveMultiplier,
    liveRoundStatus,
    liveCashoutBusy = false,
    onLiveCashout,
    liveCashoutFlash,
    className,
  },
  ref,
) {
  const t = useT();
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<CasinoStagePhase>('idle');
  const [outcome, setOutcome] = useState<ParsedCrashOutcome | null>(null);
  const [displayMult, setDisplayMult] = useState('1.00');
  /** Monotonic counter — key-remount restarts the CSS reveal/pop/flash on each new win event (§Motion). */
  const [flashPulse, setFlashPulse] = useState(0);
  const pathRef = useRef<SVGPathElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pointsRef = useRef<Point[]>([]);
  /** Mirrors the SVG path's `d` string so each frame can append (O(1)) instead of rebuild (O(n)). */
  const pathDRef = useRef('');
  const startRef = useRef(0);
  const targetRef = useRef<ParsedCrashOutcome | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);
  const lastLiveFlashIdRef = useRef<string | null>(null);

  const cancelRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const finish = useCallback(
    (parsed: ParsedCrashOutcome) => {
      cancelRaf();
      const finalMult = parsed.cashedOut ? parsed.cashoutMultiplier : parsed.crashMultiplier;
      setDisplayMult(finalMult.toFixed(2));
      setOutcome(parsed);
      setPhase('settled');
      // Win moment only — losses stay calm/restrained (CASINO_UX_CANON §Motion).
      if (parsed.cashedOut && !reducedMotion) {
        setFlashPulse((n) => n + 1);
      }
      resolveRef.current?.();
      resolveRef.current = null;
    },
    [cancelRaf, reducedMotion],
  );

  /** Full (re)paint — O(n) in point count. Fine for the 2-point instant path; not for the tick loop. */
  const paintPath = useCallback((points: Point[]) => {
    const el = pathRef.current;
    if (!el) return;
    if (points.length === 0) {
      pathDRef.current = '';
      el.removeAttribute('d');
      return;
    }
    const d = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
    pathDRef.current = d;
    el.setAttribute('d', d);
  }, []);

  /**
   * Perf (Phase 1B) — O(1) per frame. The tick loop previously rebuilt the whole
   * `d` string from the full accumulated points array every frame (map+join over
   * an array that grows every frame = O(n²) total work across one replay — a real
   * cost on the lowest supported data-gpu-tier, per the Motion & performance
   * acceptance criteria ≥55fps floor). Appending only the new segment keeps every
   * frame's work constant regardless of how far the replay has progressed.
   */
  const appendPathPoint = useCallback((point: Point) => {
    const el = pathRef.current;
    if (!el) return;
    pathDRef.current += ` L${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    el.setAttribute('d', pathDRef.current);
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

      const startPoint = { x: 24, y: height - 16 };
      pointsRef.current = [startPoint];
      pathDRef.current = `M${startPoint.x.toFixed(1)} ${startPoint.y.toFixed(1)}`;
      pathRef.current?.setAttribute('d', pathDRef.current);

      startRef.current = performance.now();
      const tick = (now: number) => {
        const elapsed = now - startRef.current;
        const progress = Math.min(1, elapsed / duration);
        const eased = crashCurveEasing(progress);
        const mult = Math.pow(endMult, eased);
        const x = 24 + (width - 48) * progress;
        const y = multiplierToY(mult, height, maxMult);
        const point = { x, y };
        pointsRef.current.push(point);
        appendPathPoint(point);
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
    [appendPathPoint, cancelRaf, finish, paintPath, reducedMotion],
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
        setFlashPulse(0);
        lastLiveFlashIdRef.current = null;
        if (labelRef.current) labelRef.current.textContent = '1.00×';
      },
    }),
    [cancelRaf, paintPath, runReplay],
  );

  useEffect(() => () => cancelRaf(), [cancelRaf]);

  // Live mid-flight cash-out settle (E23) — parent hands down the RPC-confirmed
  // payout once per bet id; replaying the same id (e.g. a parent re-render) must
  // not re-trigger the flash.
  useEffect(() => {
    if (!liveCashoutFlash || reducedMotion) return;
    if (lastLiveFlashIdRef.current === liveCashoutFlash.id) return;
    lastLiveFlashIdRef.current = liveCashoutFlash.id;
    setFlashPulse((n) => n + 1);
  }, [liveCashoutFlash, reducedMotion]);

  // Once cashed out, the shared round's multiplier keeps climbing for other
  // players — showing it would look like the user's own position is still
  // live. Freeze the display on the user's own locked-in result until they
  // start a new live bet (liveSessionActive true again).
  const liveSettledMultiplier =
    liveMode && !liveSessionActive ? liveCashoutFlash?.multiplier : undefined;
  const liveSettledDisplay = liveSettledMultiplier != null;

  const settledTone = liveSettledDisplay
    ? 'text-success'
    : outcome?.cashedOut === true
      ? 'text-success'
      : outcome
        ? 'text-danger'
        : 'text-foreground';

  // Fixed 2026-07-15 (Phase 1B functional QA) — button previously stayed visible
  // and clickable after the round kept flying for other players even though this
  // user had no active bet, silently no-op'ing on click (P0 dead control).
  const showLiveCashout =
    liveMode &&
    liveSessionActive &&
    liveRoundStatus === 'flying' &&
    typeof onLiveCashout === 'function';
  const shownMult = liveSettledDisplay
    ? liveSettledMultiplier
    : liveMode && liveMultiplier
      ? liveMultiplier
      : displayMult;

  return (
    <Card
      variant="casino-play"
      className={cn(className)}
      data-testid="casino-crash-stage"
      data-stage-phase={phase}
      data-live-mode={liveMode ? 'true' : 'false'}
      data-live-round-status={liveRoundStatus ?? undefined}
      data-cashed-out={outcome?.cashedOut === true || liveSettledDisplay ? 'true' : 'false'}
    >
      <CardBody className="relative flex min-h-[240px] flex-col gap-2 p-4 md:min-h-[320px]">
        <div className="flex items-baseline justify-between gap-2">
          <span className="relative inline-flex items-baseline">
            {flashPulse > 0 ? (
              <span
                key={`flash-${flashPulse}`}
                aria-hidden="true"
                data-testid="casino-crash-cashout-flash"
                className="ds-casino-cashout-flash"
              />
            ) : null}
            <span
              key={`mult-${flashPulse}`}
              ref={labelRef}
              className={cn(
                'text-3xl font-semibold tabular-nums md:text-4xl',
                settledTone,
                flashPulse > 0 && 'ds-casino-number-pop',
              )}
              data-testid="casino-crash-multiplier"
            >
              {shownMult}×
            </span>
          </span>
          <span
            className="text-foreground-muted text-xs tabular-nums"
            data-testid="casino-crash-autocashout-chip"
          >
            {t('casino.crash.autoAt', { mult: autoCashout || '—' })}
          </span>
        </div>
        {showLiveCashout ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="self-start"
            disabled={liveCashoutBusy}
            onClick={onLiveCashout}
            data-testid="casino-crash-live-cashout"
          >
            {t('casino.live.cashout')}
          </Button>
        ) : null}
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
            className={cn(
              'm-0 text-sm font-medium',
              settledTone,
              !reducedMotion && 'ds-casino-reveal-in',
            )}
            data-testid="casino-crash-outcome-label"
            aria-live="polite"
          >
            {outcome.cashedOut ? t('casino.bet.cashout_at') : t('casino.crash.crashed')}
            {outcome.cashedOut
              ? ` ${outcome.cashoutMultiplier.toFixed(2)}×`
              : ` ${outcome.crashMultiplier.toFixed(2)}×`}
          </p>
        ) : liveSettledDisplay ? (
          <p
            className={cn(
              'text-success m-0 text-sm font-medium',
              !reducedMotion && 'ds-casino-reveal-in',
            )}
            data-testid="casino-crash-live-cashout-label"
            aria-live="polite"
          >
            {t('casino.bet.cashout_at')} {liveSettledMultiplier}×
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
});
