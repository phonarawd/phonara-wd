import {
  forwardRef,
  useCallback,
  useEffect,
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
import type {
  CasinoStageHandle,
  CasinoStagePhase,
} from '@/product/surfaces/games/casino-stage-types';

export type DiceStageProps = {
  target: string;
  direction: string;
  className?: string;
};

/**
 * Roll-settle wobble — Dice is the "instant" sub-category (with Limbo), not the
 * "curve" sub-category (Crash's separate 1.5-4s curve-build budget). The wobble
 * itself IS the marker's Result reveal, so it must stay inside the quantified
 * 200-500ms band (§Motion & performance acceptance criteria) — tightened from the
 * previous 520ms, which exceeded the 500ms ceiling. Exported (not local-only, cf.
 * LimboStage's LIMBO_REVEAL_HOLD_MS) because — like Crash's rAF-driven curve —
 * jsdom does not fire `requestAnimationFrame` reliably, so a real awaited-elapsed-
 * time test would hang; asserting the constant directly is the safe equivalent.
 */
export const DICE_ROLL_REVEAL_MS = 480;

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
export const DiceStage = forwardRef<CasinoStageHandle, DiceStageProps>(function DiceStage(
  { target, direction, className },
  ref,
) {
  const t = useT();
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<CasinoStagePhase>('idle');
  const [outcome, setOutcome] = useState<ParsedDiceOutcome | null>(null);
  const [rollSettled, setRollSettled] = useState<string | null>(null);
  /** Monotonic counter — key-remount restarts the CSS reveal/pop/flash on each new settle (§Motion), mirrors crash/limbo. */
  const [revealPulse, setRevealPulse] = useState(0);
  const rollLabelRef = useRef<HTMLSpanElement | null>(null);
  /** Full-width wrapper — its `transform: translateX(pct%)` tracks the roll, never `left` (0 layout shift, transform-only per §Motion). */
  const markerTrackRef = useRef<HTMLDivElement | null>(null);
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

  /**
   * Marker motion (Phase 1B) — moves the roll marker via `transform` on a
   * full-width wrapper (never `left`/`top`), so repositioning it every rAF
   * frame never triggers reflow or contributes layout shift. `pct` is the
   * clamped [0,100] roll value; the wrapper's own translateX(pct%) is relative
   * to the wrapper's width (== the track's width, since it spans `w-full`),
   * and the dot inside self-centers on that point via a separate Tailwind
   * transform on itself — the two transforms never collide.
   */
  const paintMarker = useCallback((pct: number) => {
    const el = markerTrackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(100, pct));
    el.style.transform = `translateX(${clamped}%)`;
  }, []);

  const settle = useCallback(
    (parsed: ParsedDiceOutcome) => {
      cancelRaf();
      const text = parsed.roll.toFixed(2);
      if (rollLabelRef.current) rollLabelRef.current.textContent = text;
      paintMarker(parsed.roll);
      setRollSettled(text);
      setOutcome(parsed);
      setPhase('settled');
      setRevealPulse((n) => n + 1);
      resolveRef.current?.();
      resolveRef.current = null;
    },
    [cancelRaf, paintMarker],
  );

  const runReplay = useCallback(
    (parsed: ParsedDiceOutcome) => {
      cancelRaf();
      setPhase('replaying');
      setOutcome(null);
      setRollSettled(null);
      // Matches the wobble formula's own t=0 value (sin(0)=0, so wobble===roll
      // at the start) — paints the marker at the correct position immediately,
      // so there is never an unpainted/stale frame before the first rAF tick.
      paintMarker(parsed.roll);
      if (reducedMotion) {
        settle(parsed);
        return;
      }
      const start = performance.now();
      const duration = DICE_ROLL_REVEAL_MS;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const wobble = parsed.roll + Math.sin(p * Math.PI * 6) * (1 - p) * 8;
        const clamped = Math.max(0, Math.min(99.99, wobble));
        if (rollLabelRef.current) {
          rollLabelRef.current.textContent = clamped.toFixed(2);
        }
        paintMarker(clamped);
        if (p < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          settle(parsed);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [cancelRaf, paintMarker, reducedMotion, settle],
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
        setRevealPulse(0);
        if (rollLabelRef.current) rollLabelRef.current.textContent = '—';
        paintMarker(0);
      },
    }),
    [cancelRaf, paintMarker, runReplay],
  );

  // Perf (Phase 1B) — a bet placed right before navigating away must not leave
  // a dangling rAF loop that keeps ticking and eventually calls the settle
  // setState calls after unmount ("Can't perform a React state update on an
  // unmounted component"). Matches CrashStage's equivalent
  // `useEffect(() => () => cancelRaf(), ...)` cleanup — previously missing
  // here entirely (worse than LimboStage's own pre-Phase-1B gap, since that
  // timer's callback only touched refs; this one calls real setState).
  useEffect(() => cancelRaf, [cancelRaf]);

  const markerPct = Number.isFinite(targetNum) ? Math.max(0, Math.min(100, targetNum)) : 50;
  const won = outcome?.won === true;
  const settled = phase === 'settled' && outcome !== null;
  const showMarker = phase !== 'idle';
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
          {/*
           * Wrapper spans the full track and is the ONLY element whose position
           * is driven every frame (via `paintMarker`'s `transform:
           * translateX(pct%)` — never `left`, 0 layout shift). Always mounted
           * (unlike its dot/glow children below) so `markerTrackRef` is already
           * attached — via ref, before any React re-render — the moment the
           * first bet's `playOutcome` calls `paintMarker` synchronously; a
           * conditionally-mounted wrapper would leave the ref null until the
           * next render commits, flashing the marker at 0% for one frame.
           */}
          <div
            ref={markerTrackRef}
            className="pointer-events-none absolute inset-y-0 left-0 w-full"
            aria-hidden="true"
          >
            {showMarker ? (
              <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2">
                {settled && won && !reducedMotion ? (
                  <span
                    key={`marker-glow-${revealPulse}`}
                    className="ds-casino-cashout-flash"
                    data-testid="casino-dice-win-flash"
                  />
                ) : null}
                <span
                  key={`marker-${revealPulse}`}
                  className={cn(
                    'block size-4 rounded-full border-2 border-white',
                    settled ? (won ? 'bg-success' : 'bg-danger') : 'bg-foreground',
                    settled && won && !reducedMotion && 'ds-casino-number-pop',
                  )}
                  data-testid="casino-dice-roll-marker"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-foreground-muted text-xs">{t('casino.stage.roll')}</span>
          <span
            key={`value-${revealPulse}`}
            ref={rollLabelRef}
            className={cn(
              'text-4xl font-semibold tabular-nums',
              settled ? (won ? 'text-success' : 'text-danger') : 'text-foreground',
              settled && !reducedMotion && 'ds-casino-reveal-in',
              settled && won && !reducedMotion && 'ds-casino-number-pop',
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
});
